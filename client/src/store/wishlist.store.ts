import { create } from "zustand";
import { api } from "../lib/api";
import { toast } from "./toast.store";

// Wishlist lưu theo user trong MongoDB nên bắt buộc phải đăng nhập.
import { getAccessToken } from "../lib/token";
const getToken = () => getAccessToken();

type WishlistApiProduct = { id: string };

interface WishlistState {
  ids: string[];
  loaded: boolean;
  loading: boolean;
  authToken: string | null;
  loadWishlist: () => Promise<void>;
  ensureLoaded: () => Promise<void>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  reset: () => void;
}

export const useWishlist = create<WishlistState>((set, get) => ({
  ids: [],
  loaded: false,
  loading: false,
  authToken: null,

  // Nạp danh sách id sản phẩm yêu thích từ backend (chỉ khi đã đăng nhập).
  loadWishlist: async () => {
    const token = getToken();
    if (!token) {
      set({ ids: [], loaded: true, authToken: null });
      return;
    }
    set({ loading: true });
    try {
      const { data } = await api.get<WishlistApiProduct[]>("/account/wishlist");
      set({ ids: data.map((p) => p.id), loaded: true, authToken: token });
    } catch {
      set({ loaded: true, authToken: token });
    } finally {
      set({ loading: false });
    }
  },

  // Gọi trong useEffect của các component có nút tim.
  // Tự nạp lại khi trạng thái đăng nhập (token) thay đổi.
  ensureLoaded: async () => {
    const token = getToken();
    const { loading, loaded, authToken } = get();
    if (loading) return;
    if (loaded && authToken === token) return;
    await get().loadWishlist();
  },

  has: (productId) => get().ids.includes(productId),

  toggle: async (productId) => {
    if (!productId) return;
    if (get().ids.includes(productId)) {
      await get().remove(productId);
    } else {
      await get().add(productId);
    }
  },

  add: async (productId) => {
    if (!getToken()) {
      toast.error("Vui lòng đăng nhập để dùng wishlist");
      return;
    }
    // Optimistic update để UI phản hồi ngay.
    set((s) => ({
      ids: s.ids.includes(productId) ? s.ids : [...s.ids, productId],
    }));
    try {
      const { data } = await api.post<WishlistApiProduct[]>(`/account/wishlist/${productId}`);
      set({ ids: data.map((p) => p.id) });
      toast.success("Đã thêm vào wishlist");
    } catch (error: any) {
      // Rollback nếu lỗi.
      set((s) => ({ ids: s.ids.filter((id) => id !== productId) }));
      toast.error(error?.response?.data?.message || "Không thể thêm vào wishlist");
    }
  },

  remove: async (productId) => {
    if (!getToken()) {
      toast.error("Vui lòng đăng nhập để dùng wishlist");
      return;
    }
    const prev = get().ids;
    set((s) => ({ ids: s.ids.filter((id) => id !== productId) }));
    try {
      const { data } = await api.delete<WishlistApiProduct[]>(`/account/wishlist/${productId}`);
      set({ ids: data.map((p) => p.id) });
      toast.success("Đã xóa khỏi wishlist");
    } catch (error: any) {
      set({ ids: prev });
      toast.error(error?.response?.data?.message || "Không thể xóa wishlist");
    }
  },

  reset: () => set({ ids: [], loaded: false, loading: false, authToken: null }),
}));
