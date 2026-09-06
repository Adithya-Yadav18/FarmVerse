import api from './api';
import type {
  MandiPrice,
  ArbitrageRequest,
  ArbitrageResponse,
  CommodityPriceHistory,
  MarketSummaryStats,
} from '../types';

export const mandiService = {
  getPrices: async (params?: {
    category?: string;
    commodity?: string;
    state?: string;
    search?: string;
    farmId?: number;
  }): Promise<MandiPrice[]> => {
    const res = await api.get('/mandi/prices', { params });
    return res.data;
  },

  calculateArbitrage: async (req: ArbitrageRequest): Promise<ArbitrageResponse> => {
    const res = await api.post('/mandi/arbitrage/calculate', req);
    return res.data;
  },

  getPriceHistory: async (commodity: string): Promise<CommodityPriceHistory[]> => {
    const res = await api.get(`/mandi/history/${encodeURIComponent(commodity)}`);
    return res.data;
  },

  getSummaryStats: async (): Promise<MarketSummaryStats> => {
    const res = await api.get('/mandi/summary');
    return res.data;
  },

  syncMarketData: async (): Promise<string> => {
    const res = await api.post('/mandi/admin/sync');
    return res.data;
  },
};
