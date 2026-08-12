import api from './api';
import type { SoilAnalysis, PaginatedResponse } from '../types';

export const soilService = {
  getAll: async (filters: Record<string, unknown> = {}): Promise<PaginatedResponse<SoilAnalysis>> => {
    const { data } = await api.get<PaginatedResponse<SoilAnalysis>>('/soil', { params: filters });
    return data;
  },
  getByFarm: async (farmId: string): Promise<SoilAnalysis[]> => {
    const { data } = await api.get<{ data: SoilAnalysis[] }>(`/soil/farm/${farmId}`);
    return data.data;
  },
  getById: async (id: string): Promise<SoilAnalysis> => {
    const { data } = await api.get<{ data: SoilAnalysis }>(`/soil/${id}`);
    return data.data;
  },
  create: async (payload: Omit<SoilAnalysis, 'id'>): Promise<SoilAnalysis> => {
    const { data } = await api.post<{ data: SoilAnalysis }>('/soil', payload);
    return data.data;
  },
};
