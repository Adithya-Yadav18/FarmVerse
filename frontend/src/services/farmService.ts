import api from './api';
import type { Farm } from '../types';

export const farmService = {
  getAll: async (): Promise<Farm[]> => {
    const { data } = await api.get<Farm[]>('/farms');
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: string | number): Promise<Farm> => {
    const { data } = await api.get<Farm>(`/farms/${id}`);
    return data;
  },

  create: async (payload: Partial<Farm>): Promise<Farm> => {
    const { data } = await api.post<Farm>('/farms', payload);
    return data;
  },

  update: async (id: string | number, payload: Partial<Farm>): Promise<Farm> => {
    const { data } = await api.put<Farm>(`/farms/${id}`, payload);
    return data;
  },

  remove: async (id: string | number): Promise<void> => {
    await api.delete(`/farms/${id}`);
  },
};

export default farmService;
