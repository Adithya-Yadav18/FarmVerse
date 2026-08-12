import api from './api';
import type { Farm, PaginatedResponse } from '../types';

interface FarmFilters { page?: number; limit?: number; search?: string; status?: string; }

export const farmService = {
  getAll: async (filters: FarmFilters = {}): Promise<PaginatedResponse<Farm>> => {
    const { data } = await api.get<PaginatedResponse<Farm>>('/farms', { params: filters });
    return data;
  },
  getById: async (id: string): Promise<Farm> => {
    const { data } = await api.get<{ data: Farm }>(`/farms/${id}`);
    return data.data;
  },
  create: async (payload: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Farm> => {
    const { data } = await api.post<{ data: Farm }>('/farms', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Farm>): Promise<Farm> => {
    const { data } = await api.put<{ data: Farm }>(`/farms/${id}`, payload);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/farms/${id}`);
  },
  getStats: async (id: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get(`/farms/${id}/stats`);
    return data;
  },
};
