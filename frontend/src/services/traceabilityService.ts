import api from './api';
import type {
  ProduceBatch,
  PublicProduceJourney,
  ProduceReview,
  CreateBatchPayload,
  CertifyBatchPayload,
  TraceabilitySummaryStats,
} from '../types';

export const traceabilityService = {
  // Public Consumer Journey
  getPublicJourney: async (batchCode: string): Promise<PublicProduceJourney> => {
    const res = await api.get(`/trace/batch/${encodeURIComponent(batchCode)}`);
    return res.data;
  },

  // Public Consumer Review
  addReview: async (
    batchCode: string,
    payload: { consumerName: string; rating: number; reviewText: string; consumerLocation?: string }
  ): Promise<ProduceReview> => {
    const res = await api.post(`/trace/batch/${encodeURIComponent(batchCode)}/review`, payload);
    return res.data;
  },

  // Operations Dashboard: List Batches
  getBatches: async (params?: {
    farmId?: number;
    search?: string;
    status?: string;
  }): Promise<ProduceBatch[]> => {
    const res = await api.get('/trace/batches', { params });
    return res.data;
  },

  // Farmer: Create Batch
  createBatch: async (payload: CreateBatchPayload): Promise<ProduceBatch> => {
    const res = await api.post('/trace/batches', payload);
    return res.data;
  },

  // Agronomist: Certify Batch
  certifyBatch: async (batchCode: string, payload: CertifyBatchPayload): Promise<ProduceBatch> => {
    const res = await api.put(`/trace/batches/${encodeURIComponent(batchCode)}/certify`, payload);
    return res.data;
  },

  // Admin / Agronomist: Recall Batch
  recallBatch: async (batchCode: string, reason: string): Promise<ProduceBatch> => {
    const res = await api.put(`/trace/batches/${encodeURIComponent(batchCode)}/recall`, { reason });
    return res.data;
  },

  // Global Traceability Stats
  getSummaryStats: async (): Promise<TraceabilitySummaryStats> => {
    const res = await api.get('/trace/stats');
    return res.data;
  },

  // QR Image URL helper
  getQrImageUrl: (batchCode: string): string => {
    return `/api/trace/batch/${encodeURIComponent(batchCode)}/qr-image`;
  },
};
