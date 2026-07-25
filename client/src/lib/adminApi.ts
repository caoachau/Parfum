// =============================================================================
//  ADMIN API CLIENT
//  Bao mong quanh `api` (axios) cho khu vuc /api/admin.
//  Backend tra ve { success, data } -> cac helper nay tu boc tach `.data`.
// =============================================================================
import { api } from "./api";

async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export const adminApi = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    unwrap<T>(api.get(`/admin${url}`, { params })),
  post: <T>(url: string, body?: unknown) => mutate<T>(api.post(`/admin${url}`, body)),
  put: <T>(url: string, body?: unknown) => mutate<T>(api.put(`/admin${url}`, body)),
  patch: <T>(url: string, body?: unknown) => mutate<T>(api.patch(`/admin${url}`, body)),
  del: <T>(url: string) => mutate<T>(api.delete(`/admin${url}`)),
};

async function mutate<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const data = await unwrap<T>(promise);
  window.dispatchEvent(new Event("admin:refresh-notifications"));
  return data;
}

// ---------------------------------------------------------------- helpers -----
export function formatVnd(n?: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN") + "đ";
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function apiMessage(error: any, fallback = "Đã có lỗi xảy ra"): string {
  return error?.response?.data?.message || fallback;
}

// ------------------------------------------------------------------ types -----
export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Stats = {
  productCount: number;
  activeProductCount: number;
  variantCount: number;
  brandCount: number;
  categoryCount: number;
  userCount: number;
  adminCount: number;
  orderCount: number;
  pendingReviews: number;
  newCustomerCount: number;
  revenue: number;
  productsSold: number;
  lowStockCount: number;
  ordersByStatus: Record<string, number>;
  revenueTrend: { key: string; label: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  revenueByBrand: { name: string; value: number }[];
  revenueByCategory: { name: string; value: number }[];
  lowStockItems: { id: string; name: string; volume: string; stock: number }[];
  recentReviews: {
    id: string;
    userName: string;
    productName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  newCustomers: {
    id: string;
    name: string;
    createdAt: string;
    orderCount: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  recentOrders: {
    id: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }[];
};

export type Ref = { id: string; name: string } | null;

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: Ref;
  category: Ref;
  images: string[];
  gender: string;
  fragranceFamily: string;
  concentration: string;
  season: string[];
  notes: { top: string[]; middle: string[]; base: string[] };
  isActive: boolean;
  variantCount: number;
  minPrice: number | null;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminVariant = {
  id: string;
  sku: string;
  volume: string;
  price: number;
  costPrice: number;
  stock: number;
  images: string[];
  isActive: boolean;
  product: { id: string; name: string; slug: string } | null;
  createdAt?: string;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  heroImage: string;
  viewCollectionUrl: string;
  journalUrl: string;
  isPublished: boolean;
  country: string;
  website: string;
  foundedYear: number | null;
  isFeatured: boolean;
  productCount: number;
  createdAt?: string;
};

export type AdminScentFamilyCard = {
  id: string;
  name: string;
  image: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
export type AdminCategory = { id: string; name: string; productCount: number };

export type AdminOrder = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  total: number;
  note: string;
  address: any;
  customer: { id: string; name: string; email: string } | null;
  itemCount: number;
  items: {
    variant: string;
    name: string;
    volume: string;
    price: number;
    basePrice?: number;
    finalPrice?: number;
    productDiscountAmount?: number;
    promotionName?: string;
    quantity: number;
    lineTotal: number;
  }[];
  payment: {
    method: string;
    status: string;
    amount: number;
    receivedAmount?: number | null;
    bankReference?: string;
    providerTransactionId?: string;
  } | null;
  notificationDelivery?: {
    sent: boolean;
    reason?: string;
    email?: string;
  };
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  loyaltyPoints: number;
  isEmailVerified: boolean;
  addressCount: number;
  orderCount: number;
  lastLoginAt: string | null;
  createdAt?: string;
};

export type AdminReview = {
  id: string;
  product: Ref;
  userName: string;
  guestEmail: string;
  rating: number;
  comment: string;
  images: string[];
  approved: boolean;
  createdAt?: string;
};

export const ORDER_STATUSES = [
  "pending",
  "shipping",
  "done",
  "cancelled",
  "returned",
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  shipping: "Đang giao",
  done: "Hoàn tất",
  cancelled: "Đã hủy",
  returned: "Hoàn trả",
};
