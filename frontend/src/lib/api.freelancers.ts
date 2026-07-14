import api from './api';

// H11: 'APPROVED' is the only value the backend ever writes (razorpay.service.ts
// onboardFreelancer). Typed as a union so a future frontend check against the
// wrong literal (e.g. 'verified') is a compile error, not a silently-broken badge.
export type KycStatus = 'APPROVED' | 'PENDING';

export interface FreelancerProfile {
  id: string;
  user_id: string;
  category: string;
  bio: string | null;
  portfolio_url: string | null;
  rating_avg: number;
  commission_tier: number;
  razorpay_contact_id: string | null;
  razorpay_fund_account_id: string | null;
  kyc_status: KycStatus;
  // H8: email is intentionally omitted on public-facing responses (getProfile, findAll)
  users?: { name: string };
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
  updateProfile: (userId: string, payload: { category?: string; bio?: string; portfolio_url?: string }) =>
    api.patch<FreelancerProfile>(`/api/v1/freelancers/${userId}`, payload).then(r => r.data),
  onboardPayouts: (userId: string, payload: { phone: string; accountNumber: string; ifsc: string }) =>
    api.post(`/api/v1/freelancers/${userId}/onboard-payouts`, payload).then(r => r.data),
  withdraw: (userId: string, amount: number) =>
    api.post(`/api/v1/freelancers/${userId}/withdraw`, { amount }).then(r => r.data),
  withdrawals: (userId: string) =>
    api.get<Withdrawal[]>(`/api/v1/freelancers/${userId}/withdrawals`).then(r => r.data),
  balance: (userId: string) =>
    api.get<{ balance: number }>(`/api/v1/freelancers/${userId}/balance`).then(r => r.data.balance),
};
