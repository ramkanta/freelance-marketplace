import api from './api';

export type UserRole = 'customer' | 'freelancer' | 'support' | 'admin';
export type UserStatus = 'active' | 'banned';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  freelancer_profiles?: {
    id: string;
    category: string;
    rating_avg: number;
    kyc_status: string;
    bio?: string;
  } | null;
}

export interface PlatformStats {
  users: { total: number; customers: number; freelancers: number; support: number; admins: number; banned: number };
  orders: { total: number; active: number; completed: number; disputed: number };
  disputes: { open: number; underReview: number; resolved: number };
  escrow: { lockedTotal: number; releasedTotal: number; refundedTotal: number; atRisk: number };
}

export const adminUsersApi = {
  stats: () =>
    api.get<PlatformStats>('/api/v1/admin/users/stats').then(r => r.data),

  list: (params?: { role?: UserRole; status?: UserStatus; query?: string; page?: number; limit?: number }) =>
    api.get<{ data: AdminUser[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/api/v1/admin/users', { params }
    ).then(r => r.data),

  ban: (userId: string) =>
    api.patch(`/api/v1/admin/users/${userId}/ban`).then(r => r.data),

  unban: (userId: string) =>
    api.patch(`/api/v1/admin/users/${userId}/unban`).then(r => r.data),

  changeRole: (userId: string, role: UserRole) =>
    api.patch(`/api/v1/admin/users/${userId}/role`, { role }).then(r => r.data),
};
