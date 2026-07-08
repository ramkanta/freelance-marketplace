import api from './api';

export interface FreelancerProfile {
  id: string;
  user_id: string;
  category: string;
  bio: string | null;
  rating_avg: number;
  commission_tier: number;
  razorpay_contact_id: string | null;
  razorpay_fund_account_id: string | null;
  kyc_status: string;
  users?: { name: string; email: string };
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  payout_id: string | null;
  status: string;
  created_at: string;
}

export const freelancersApi = {
  getProfile: (userId: string) =>
    api.get<FreelancerProfile>(`/api/v1/freelancers/${userId}`).then(r => r.data),
  updateProfile: (userId: string, payload: { category?: string; bio?: string }) =>
    api.patch<FreelancerProfile>(`/api/v1/freelancers/${userId}`, payload).then(r => r.data),
  onboardPayouts: (userId: string, payload: { phone: string; accountNumber: string; ifsc: string }) =>
    api.post(`/api/v1/freelancers/${userId}/onboard-payouts`, payload).then(r => r.data),
  withdraw: (userId: string, amount: number) =>
    api.post(`/api/v1/freelancers/${userId}/withdraw`, { amount }).then(r => r.data),
  withdrawals: (userId: string) =>
    api.get<Withdrawal[]>(`/api/v1/freelancers/${userId}/withdrawals`).then(r => r.data),
};
