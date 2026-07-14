import api from './api';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'resolved_refund'
  | 'resolved_release'
  | 'resolved_split'
  | 'escalated';

export interface Dispute {
  id: string;
  order_id: string;
  filed_by: string;
  reason: string;
  status: DisputeStatus;
  assigned_to: string | null;
  resolution_note: string | null;
  evidence_urls: string[];
  created_at: string;
  updated_at: string;
  orders?: {
    id: string;
    amount: number;
    customer_id: string;
    freelancer_id: string;
    services?: { title: string; category: string };
  };
  users?: { name: string; email: string };
}

export const disputesApi = {
  list: (status?: string) =>
    api
      .get<Dispute[]>('/api/v1/disputes', { params: status ? { status } : {} })
      .then(r => r.data),
  get: (id: string) => api.get<Dispute>(`/api/v1/disputes/${id}`).then(r => r.data),
  getByOrder: (orderId: string) =>
    api.get<Dispute>(`/api/v1/disputes/order/${orderId}`).then(r => r.data),
  assign: (id: string, supportAgentId: string) =>
    api.post(`/api/v1/disputes/${id}/assign`, { supportAgentId }).then(r => r.data),
  resolve: (
    id: string,
    payload: {
      resolution: 'resolved_refund' | 'resolved_release' | 'resolved_split';
      customerRefundPercent?: number;
      resolutionNote?: string;
    },
  ) => api.post(`/api/v1/disputes/${id}/resolve`, payload).then(r => r.data),
  escalate: (id: string) =>
    api.post(`/api/v1/disputes/${id}/escalate`).then(r => r.data),
  getUploadUrl: (id: string, fileName: string) =>
    api.post<{ uploadUrl: string; filePath: string }>(`/api/v1/disputes/${id}/upload-url`, { fileName }).then(r => r.data),
  addEvidence: (id: string, url: string) =>
    api.post(`/api/v1/disputes/${id}/evidence`, { url }).then(r => r.data),
};
