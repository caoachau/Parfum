// DTO / interface dung chung de tan dung type-check cua TypeScript thay cho "any".
export interface AddressInput {
  label?: string;
  fullName?: string;
  phone: string;
  line?: string;
  detail?: string; // alias cu (map sang line) de tuong thich nguoc
  ward?: string;
  district?: string;
  province?: string;
  isDefault?: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface OrderAddress {
  fullName?: string;
  phone: string;
  line: string;
  ward?: string;
  district?: string;
  province?: string;
  city?: string;
}

export interface StockItemDTO {
  variant: string;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipping' | 'done' | 'cancelled' | 'returned';

export interface CreateOrderInput {
  method?: 'cod' | 'bank_qr';
  address: OrderAddress;
  note?: string;
  items?: StockItemDTO[];
  voucherCode?: string;
}
