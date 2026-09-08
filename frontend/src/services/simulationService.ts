import api from './api';
import type {
  CropSimulationRequest,
  CropSimulationResult,
  SavedScenarioSummary,
  SimulationPreset
} from '../types';

export const simulationService = {
  calculate: async (request: CropSimulationRequest): Promise<CropSimulationResult> => {
    const { data } = await api.post<CropSimulationResult>('/simulator/calculate', request);
    return data;
  },

  save: async (request: CropSimulationRequest): Promise<CropSimulationResult> => {
    const { data } = await api.post<CropSimulationResult>('/simulator/save', request);
    return data;
  },

  getSaved: async (farmId: number | string): Promise<SavedScenarioSummary[]> => {
    const { data } = await api.get<SavedScenarioSummary[]>(`/simulator/farms/${farmId}/saved`);
    return data;
  },

  getPresets: async (): Promise<SimulationPreset[]> => {
    const { data } = await api.get<SimulationPreset[]>('/simulator/presets');
    return data;
  },

  delete: async (id: number | string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/simulator/${id}`);
    return data;
  }
};

export default simulationService;
