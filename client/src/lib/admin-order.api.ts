import { api } from './api';
import type {
  AdminOrderDetail,
  AdminOrderListData,
  AdminOrderListQuery,
  OrderStatus,
} from '../types/admin-order';

type ApiResponse<T> = { success: true; data: T; message?: string };

export async function getAdminOrders(query: AdminOrderListQuery) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  );
  const { data } = await api.get<ApiResponse<AdminOrderListData>>('/admin/orders', { params });
  return data.data;
}

export async function getAdminOrder(orderId: string) {
  const { data } = await api.get<ApiResponse<AdminOrderDetail>>(`/admin/orders/${orderId}`);
  return data.data;
}

export async function patchAdminOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await api.patch<ApiResponse<AdminOrderDetail>>(
    `/admin/orders/${orderId}/status`,
    { status },
  );
  return data;
}

export async function confirmAdminOrderPayment(orderId: string) {
  const { data } = await api.patch<ApiResponse<AdminOrderDetail>>(
    `/admin/orders/${orderId}/confirm-payment`,
  );
  return data;
}
