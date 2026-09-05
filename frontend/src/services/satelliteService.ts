import api from './api';
import type {
  SatelliteNdviRecord,
  NdviHistoricalPoint,
  SatelliteOverviewStats,
  PublicCanopyBadge
} from '../types';

export const satelliteService = {
  getLatest: async (farmId: number | string): Promise<SatelliteNdviRecord> => {
    const { data } = await api.get<SatelliteNdviRecord>(`/satellite/farms/${farmId}/latest`);
    return data;
  },

  triggerRescan: async (farmId: number | string): Promise<SatelliteNdviRecord> => {
    const { data } = await api.post<SatelliteNdviRecord>(`/satellite/farms/${farmId}/scan`);
    return data;
  },

  getHistory: async (farmId: number | string): Promise<NdviHistoricalPoint[]> => {
    const { data } = await api.get<NdviHistoricalPoint[]>(`/satellite/farms/${farmId}/history`);
    return data;
  },

  getOverviewStats: async (): Promise<SatelliteOverviewStats> => {
    const { data } = await api.get<SatelliteOverviewStats>('/satellite/overview');
    return data;
  },

  getPublicBadge: async (farmId: number | string): Promise<PublicCanopyBadge> => {
    const { data } = await api.get<PublicCanopyBadge>(`/satellite/public-badge/${farmId}`);
    return data;
  }
};

export default satelliteService;
