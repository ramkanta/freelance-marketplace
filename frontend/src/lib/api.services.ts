import api from './api';

export interface Service {
  id: string;
  freelancer_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  delivery_days: number;
  is_active: boolean;
  created_at: string;
  freelancer_profiles?: {
    id: string;
    user_id: string;
    category: string;
    rating_avg: number;
    bio?: string;
    kyc_status?: string;
    users?: { name: string; email?: string };
  };
}

export interface ServicesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ServiceSortOption = 'newest' | 'price_low' | 'price_high' | 'delivery_fast';

export const servicesApi = {
  list: (params?: {
    category?: string;
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    maxDeliveryDays?: number;
    sortBy?: ServiceSortOption;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{ data: Service[]; meta: ServicesMeta }>('/api/v1/services', { params })
      .then(r => r.data),
  get: (id: string) => api.get<Service>(`/api/v1/services/${id}`).then(r => r.data),
  byFreelancer: (freelancerProfileId: string) =>
    api.get<Service[]>(`/api/v1/services/by-freelancer/${freelancerProfileId}`).then(r => r.data),
  create: (payload: {
    title: string;
    category: string;
    price: number;
    description?: string;
    deliveryDays?: number;
  }) => api.post<Service>('/api/v1/services', payload).then(r => r.data),
  update: (id: string, payload: Partial<{ title: string; description: string; category: string; price: number; deliveryDays: number; isActive: boolean }>) =>
    api.patch<Service>(`/api/v1/services/${id}`, payload).then(r => r.data),
  remove: (id: string) => api.delete(`/api/v1/services/${id}`).then(r => r.data),
};
