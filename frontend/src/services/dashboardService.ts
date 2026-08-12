import api from './api';
import type { DashboardStats } from '../types';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<{ data: DashboardStats }>('/dashboard/stats');
    return data.data;
  },
  getYieldTrend: async (): Promise<Array<{ month: string; yield: number; target: number }>> => {
    const { data } = await api.get('/dashboard/yield-trend');
    return data.data;
  },
  getCropDistribution: async (): Promise<Array<{ name: string; value: number }>> => {
    const { data } = await api.get('/dashboard/crop-distribution');
    return data.data;
  },
  getWaterUsage: async (): Promise<Array<{ week: string; usage: number; optimal: number }>> => {
    const { data } = await api.get('/dashboard/water-usage');
    return data.data;
  },
};
