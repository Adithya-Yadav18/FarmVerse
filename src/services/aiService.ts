import api from './api';
import type { CropRecommendation } from '../types';

export const aiService = {
  getCropRecommendations: async (farmId: string): Promise<CropRecommendation[]> => {
    const { data } = await api.get<{ data: CropRecommendation[] }>(`/ai/recommendations/${farmId}`);
    return data.data;
  },
  getYieldPrediction: async (cropId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get(`/ai/yield-prediction/${cropId}`);
    return data;
  },
  getPestRisk: async (farmId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get(`/ai/pest-risk/${farmId}`);
    return data;
  },
};
