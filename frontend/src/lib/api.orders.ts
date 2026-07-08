import api from './api';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_captured'
  | 'service_delivered'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'payout_released';

export interface Order {
  id: string;
  service_id: string;
  customer_id: string;
  freelancer_id: string;
  amount: number;
  commission_rate: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  services?: { title: string; category: string; description?: string };
}

export interface LedgerEntry {
  id: string;
  order_id: string;
  entry_type: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  meta: Record<string, unknown>;
  created_at: string;
}

export const ordersApi = {
  list: () => api.get<Order[]>('/api/v1/orders').then(r => r.data),
  get: (id: string) =>
    api.get<Order & { ledgerEntries: LedgerEntry[] }>(`/api/v1/orders/${id}`).then(r => r.data),
  create: (serviceId: string) =>
    api.post('/api/v1/orders', { serviceId }).then(r => r.data),
  walletCheckout: (orderId: string) =>
    api.post(`/api/v1/orders/${orderId}/wallet-checkout`).then(r => r.data),
  markDelivered: (orderId: string) =>
    api.post(`/api/v1/orders/${orderId}/mark-delivered`).then(r => r.data),
  confirm: (orderId: string) =>
    api.post(`/api/v1/orders/${orderId}/confirm`).then(r => r.data),
  dispute: (orderId: string, reason: string) =>
    api.post(`/api/v1/orders/${orderId}/dispute`, { reason }).then(r => r.data),
};

export const walletApi = {
  balance: () =>
    api.get<{ balance: number }>('/api/v1/orders/wallet/balance').then(r => r.data),
  deposit: (amount: number, razorpayPaymentId?: string) =>
    api.post('/api/v1/orders/wallet/deposit', { amount, razorpayPaymentId }).then(r => r.data),
};
