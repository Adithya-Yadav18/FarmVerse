import api from './api';

export interface DashboardStats {
  totalFarms: number;
  activeCrops: number;
  pendingAlerts: number;
  waterUsageKl: number;
  yieldForecastTonnes: number;
  farmHealthScore: number;
}

export interface YieldTrendPoint {
  month: string;
  yield: number;
  target: number;
}

export interface CropDistributionPoint {
  name: string;
  value: number;
  percentage: number;
}

export interface WaterUsagePoint {
  week: string;
  usage: number;
  optimal: number;
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  desc: string;
  time: string;
  color: string;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  getYieldTrend: async (): Promise<YieldTrendPoint[]> => {
    const { data } = await api.get<YieldTrendPoint[]>('/dashboard/yield-trend');
    return Array.isArray(data) ? data : [];
  },

  getCropDistribution: async (): Promise<CropDistributionPoint[]> => {
    const { data } = await api.get<CropDistributionPoint[]>('/dashboard/crop-distribution');
    return Array.isArray(data) ? data : [];
  },

  getWaterUsage: async (): Promise<WaterUsagePoint[]> => {
    const { data } = await api.get<WaterUsagePoint[]>('/dashboard/water-usage');
    return Array.isArray(data) ? data : [];
  },

  getRecentActivity: async (): Promise<DashboardActivityItem[]> => {
    const { data } = await api.get<DashboardActivityItem[]>('/dashboard/activity');
    return Array.isArray(data) ? data : [];
  },
};

export default dashboardService;
