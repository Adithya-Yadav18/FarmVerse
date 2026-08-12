import api from './api';
import type { Crop, PaginatedResponse } from '../types';

export const cropService = {
  getAll: async (filters: Record<string, unknown> = {}): Promise<PaginatedResponse<Crop>> => {
    const { data } = await api.get<PaginatedResponse<Crop>>('/crops', { params: filters });
    return data;
  },
  getById: async (id: string): Promise<Crop> => {
    const { data } = await api.get<{ data: Crop }>(`/crops/${id}`);
    return data.data;
  },
  create: async (payload: Omit<Crop, 'id' | 'createdAt'>): Promise<Crop> => {
    const { data } = await api.post<{ data: Crop }>('/crops', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<Crop>): Promise<Crop> => {
    const { data } = await api.put<{ data: Crop }>(`/crops/${id}`, payload);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/crops/${id}`);
  },
  getByFarm: async (farmId: string): Promise<Crop[]> => {
    const { data } = await api.get<{ data: Crop[] }>(`/farms/${farmId}/crops`);
    return data.data;
  },
};
