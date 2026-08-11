import api from './api';
import type { DiseaseDetection, PaginatedResponse } from '../types';

export const diseaseService = {
  getAll: async (filters: Record<string, unknown> = {}): Promise<PaginatedResponse<DiseaseDetection>> => {
    const { data } = await api.get<PaginatedResponse<DiseaseDetection>>('/disease', { params: filters });
    return data;
  },
  getById: async (id: string): Promise<DiseaseDetection> => {
    const { data } = await api.get<{ data: DiseaseDetection }>(`/disease/${id}`);
    return data.data;
  },
  detect: async (formData: FormData): Promise<DiseaseDetection> => {
    const { data } = await api.post<{ data: DiseaseDetection }>('/disease/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(`/disease/${id}/status`, { status });
  },
};
