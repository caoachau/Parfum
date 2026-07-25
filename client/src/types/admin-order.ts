export type OrderStatus = 'pending' | 'shipping' | 'done' | 'cancelled' | 'returned';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cod' | 'bank_qr';

export type AdminOrderPayment = {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  receivedAmount?: number | null;
  bankReference?: string;
  providerTransactionId?: string;
} | null;

export type AdminOrderCustomer = {
  id: string;
  name: string;
  email: string;
} | null;

export type AdminOrderListItem = {
  id: string;
  customer: AdminOrderCustomer;
  createdAt: string;
  total: number;
  status: OrderStatus;
  payment: AdminOrderPayment;
};

export type AdminOrderDetail = AdminOrderListItem & {
  updatedAt: string;
  address: { line?: string; city?: string; phone?: string } | null;
  note: string;
  items: Array<{
    variant: string;
    name?: string;
    volume?: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export type AdminOrderListData = {
  items: AdminOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export type AdminOrderListQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  sort?: 'newest' | 'oldest';
};
