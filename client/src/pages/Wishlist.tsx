import { create } from "zustand";
import { api } from "../lib/api";
import { toast } from "../store/toast.store";

import { getAccessToken } from "../lib/token";
const getToken = () => getAccessToken();

export interface WishlistProduct {
  _id: string;
  name: string;
  images?: string[];
  brand?: { name?: string };
  price?: number;
}

interface WishlistState {
  products: WishlistProduct[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
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
  products: [],
  loaded: false,
  loading: false,
  error: null,
  authToken: null,

  loadWishlist: async () => {
    const token = getToken();
    if (!token) {
      set({ products: [], loaded: true, error: null, authToken: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<WishlistProduct[]>("/account/wishlist");
      set({ products: data, loaded: true, authToken: token });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Không thể tải danh sách yêu thích",
        loaded: true,
        authToken: token,
      });
    } finally {
      set({ loading: false });
    }
  },

  ensureLoaded: async () => {
    const token = getToken();
    const { loading, loaded, authToken } = get();
    if (loading) return;
    if (loaded && authToken === token) return;
    await get().loadWishlist();
  },

  has: (productId) =>
    get().products.some((p) => p._id === productId || (p as any).id === productId),

  toggle: async (productId) => {
    if (!productId) return;
    const exists = get().has(productId);
    if (exists) {
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
    try {
      const { data } = await api.post<WishlistProduct[]>(`/account/wishlist/${productId}`);
      set({ products: data });
      toast.success("Đã thêm vào wishlist");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể thêm vào wishlist");
    }
  },

  remove: async (productId) => {
    if (!getToken()) {
      toast.error("Vui lòng đăng nhập để dùng wishlist");
      return;
    }
    const prev = get().products;
    // Optimistic update
    set((s) => ({
      products: s.products.filter((p) => p._id !== productId && (p as any).id !== productId),
    }));
    try {
      const { data } = await api.delete<WishlistProduct[]>(`/account/wishlist/${productId}`);
      set({ products: data });
      toast.success("Đã xóa khỏi wishlist");
    } catch (error: any) {
      set({ products: prev });
      toast.error(error?.response?.data?.message || "Không thể xóa wishlist");
    }
  },

  reset: () => set({ products: [], loaded: false, loading: false, error: null, authToken: null }),
}));
