import api from './api';
import type { IrrigationSchedule, PaginatedResponse } from '../types';

export const irrigationService = {
  getAll: async (filters: Record<string, unknown> = {}): Promise<PaginatedResponse<IrrigationSchedule>> => {
    const { data } = await api.get<PaginatedResponse<IrrigationSchedule>>('/irrigation', { params: filters });
    return data;
  },
  getById: async (id: string): Promise<IrrigationSchedule> => {
    const { data } = await api.get<{ data: IrrigationSchedule }>(`/irrigation/${id}`);
    return data.data;
  },
  create: async (payload: Omit<IrrigationSchedule, 'id'>): Promise<IrrigationSchedule> => {
    const { data } = await api.post<{ data: IrrigationSchedule }>('/irrigation', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<IrrigationSchedule>): Promise<IrrigationSchedule> => {
    const { data } = await api.put<{ data: IrrigationSchedule }>(`/irrigation/${id}`, payload);
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/irrigation/${id}`);
  },
  toggle: async (id: string, status: string): Promise<void> => {
    await api.patch(`/irrigation/${id}/status`, { status });
  },
};
