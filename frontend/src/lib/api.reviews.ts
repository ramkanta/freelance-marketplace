import api from './api';

export interface Review {
  id: string;
  order_id?: string;
  service_id?: string;
  freelancer_id?: string;
  customer_id?: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users?: { name: string };
  services?: { title: string };
}

export const reviewsApi = {
  create: (orderId: string, rating: number, comment?: string) =>
    api.post<{ review: Review }>('/api/v1/reviews', { orderId, rating, comment }).then(r => r.data),

  forService: (serviceId: string) =>
    api.get<Review[]>(`/api/v1/reviews/service/${serviceId}`).then(r => r.data),

  forFreelancer: (freelancerId: string) =>
    api.get<Review[]>(`/api/v1/reviews/freelancer/${freelancerId}`).then(r => r.data),

  forOrder: (orderId: string) =>
    api.get<Review | null>(`/api/v1/reviews/order/${orderId}`).then(r => r.data),
};
