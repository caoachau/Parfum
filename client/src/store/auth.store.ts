import { create } from "zustand";
import { api } from "../lib/api";
import { setAccessToken, clearAccessToken } from "../lib/token";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt?: string;
  isEmailVerified?: boolean;
  addresses?: Address[];
  profileCompletedAt?: string;
  profileCompletionVoucherCode?: string;
  notificationPreferences?: {
    orderNotifications: boolean;
    emailNotifications: boolean;
    promotionNotifications: boolean;
    journalNotifications: boolean;
  };
}

// Shape dia chi thong nhat voi backend (fullName, phone, line, ward, district, province).
// `detail` giu lai tuy chon de tuong thich du lieu cu.
export interface Address {
  _id: string;
  label?: string;
  fullName?: string;
  phone: string;
  line?: string;
  ward?: string;
  district?: string;
  province?: string;
  isDefault?: boolean;
  detail?: string;
}

interface AuthState {
  user: User | null;
  isBootstrapped: boolean;
  setUser: (user: User | null) => void;
  setBootstrapped: (value: boolean) => void;
  setTokens: (access: string, refresh?: string) => void;
  logout: () => void;
  bootstrap: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isBootstrapped: false,

  setUser: (user) => set({ user }),

  setBootstrapped: (value) => set({ isBootstrapped: value }),

  // Access token giu TRONG BO NHO (chong XSS); refresh token do server dat trong httpOnly cookie.
  setTokens: (access, _refresh) => {
    setAccessToken(access);
  },

  logout: () => {
    clearAccessToken();
    // Bao server xoa cookie refresh + csrf (khong can chan neu that bai)
    api.post("/auth/logout").catch(() => null);
    set({ user: null, isBootstrapped: true });
  },

  bootstrap: async () => {
    // Sau khi reload, access token (in-memory) da mat -> goi /auth/me,
    // interceptor se tu dong silent-refresh bang refresh cookie neu con phien.
    try {
      const { data } = await api.get("/auth/me");
      set({
        user: {
          id: data._id || data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          createdAt: data.createdAt,
          isEmailVerified: data.isEmailVerified,
          addresses: data.addresses || [],
          profileCompletedAt: data.profileCompletedAt,
          profileCompletionVoucherCode: data.profileCompletionVoucherCode,
          notificationPreferences: data.notificationPreferences,
        },
        isBootstrapped: true,
      });
    } catch {
      clearAccessToken();
      set({ user: null, isBootstrapped: true });
    }
  },
}));
