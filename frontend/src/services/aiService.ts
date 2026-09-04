import api from './api';
import type { CropRecommendation, Crop } from '../types';

export interface ChatResponse {
  reply: string;
  suggestions: string[];
}

export interface GenerateRecsPayload {
  farmId: number;
  season?: string;
  preferredCrops?: string;
  customPh?: number;
  customNitrogen?: number;
  customPhosphorus?: number;
  customPotassium?: number;
  customMoisture?: number;
}

export const aiService = {
  generateRecommendations: async (payload: number | GenerateRecsPayload, season?: string): Promise<CropRecommendation[]> => {
    const body = typeof payload === 'number' ? { farmId: payload, season } : payload;
    const { data } = await api.post<any[]>('/ai/recommendations', body);
    const farmId = typeof payload === 'number' ? payload : payload.farmId;
    return data.map(item => ({
      id: String(item.id),
      farmId: String(item.farmId || farmId),
      cropName: item.cropName,
      suitabilityScore: item.suitabilityScore,
      expectedYield: item.expectedYield,
      estimatedRevenue: item.estimatedRevenue,
      waterRequirement: item.waterRequirement,
      soilRequirement: item.soilRequirement,
      season: item.season,
      reasons: typeof item.reasons === 'string' ? item.reasons.split('\n').filter(Boolean) : (item.reasons || []),
      risks: typeof item.risks === 'string' ? item.risks.split('\n').filter(Boolean) : (item.risks || [])
    }));
  },

  getSavedRecommendations: async (farmId: number): Promise<CropRecommendation[]> => {
    const { data } = await api.get<any[]>(`/ai/recommendations/${farmId}`);
    return data.map(item => ({
      id: String(item.id),
      farmId: String(item.farmId || farmId),
      cropName: item.cropName,
      suitabilityScore: item.suitabilityScore,
      expectedYield: item.expectedYield,
      estimatedRevenue: item.estimatedRevenue,
      waterRequirement: item.waterRequirement,
      soilRequirement: item.soilRequirement,
      season: item.season,
      reasons: typeof item.reasons === 'string' ? item.reasons.split('\n').filter(Boolean) : (item.reasons || []),
      risks: typeof item.risks === 'string' ? item.risks.split('\n').filter(Boolean) : (item.risks || [])
    }));
  },

  adoptCrop: async (payload: { farmId: number; cropName: string; variety?: string; area?: number; season?: string }): Promise<Crop> => {
    const { data } = await api.post<Crop>('/ai/adopt', payload);
    return data;
  },

  chatWithAdvisory: async (message: string, contextHistory?: string, farmId?: number): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/ai/chat', { message, contextHistory, farmId });
    return data;
  }
};
