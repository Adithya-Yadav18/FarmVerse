import api from './api';
import type { SoilAnalysis } from '../types';

export const soilService = {
  getAll: async (): Promise<SoilAnalysis[]> => {
    const { data } = await api.get<SoilAnalysis[]>('/soil');
    return Array.isArray(data) ? data : [];
  },

  getByFarm: async (farmId: string | number): Promise<SoilAnalysis[]> => {
    const { data } = await api.get<SoilAnalysis[]>(`/soil/farm/${farmId}`);
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: string | number): Promise<SoilAnalysis> => {
    const { data } = await api.get<SoilAnalysis>(`/soil/${id}`);
    return data;
  },

  create: async (payload: Partial<SoilAnalysis>): Promise<SoilAnalysis> => {
    const { data } = await api.post<SoilAnalysis>('/soil', payload);
    return data;
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/soil/${id}`);
  },
};

export default soilService;
