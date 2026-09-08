import api from './api';
import type { Crop } from '../types';

export const cropService = {
  getAll: async (): Promise<Crop[]> => {
    const { data } = await api.get<Crop[]>('/crops');
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: string | number): Promise<Crop> => {
    const { data } = await api.get<Crop>(`/crops/${id}`);
    return data;
  },

  getByFarm: async (farmId: string | number): Promise<Crop[]> => {
    const { data } = await api.get<Crop[]>(`/crops/farm/${farmId}`);
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: Partial<Crop>): Promise<Crop> => {
    const { data } = await api.post<Crop>('/crops', payload);
    return data;
  },

  update: async (id: string | number, payload: Partial<Crop>): Promise<Crop> => {
    const { data } = await api.put<Crop>(`/crops/${id}`, payload);
    return data;
  },

  remove: async (id: string | number): Promise<void> => {
    await api.delete(`/crops/${id}`);
  },
};

export default cropService;
