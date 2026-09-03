import api from './api';
import type { DiseaseDetection } from '../types';

export interface DiseaseScanPayload {
  farmId: number;
  cropId?: number;
  cropName?: string;
  notes?: string;
  imageUrl?: string;
}

export interface PrescriptionPayload {
  confirmedDisease: string;
  severity?: string;
  prescription: string;
  clinicalNotes?: string;
}

export interface DiseaseStats {
  totalDetections: number;
  activeCases: number;
  resolvedCases: number;
  avgConfidence: number;
}

export const diseaseService = {
  getDetections: async (): Promise<DiseaseDetection[]> => {
    const { data } = await api.get<DiseaseDetection[]>('/diseases');
    return data;
  },

  getDetectionById: async (id: string | number): Promise<DiseaseDetection> => {
    const { data } = await api.get<DiseaseDetection>(`/diseases/${id}`);
    return data;
  },

  getStats: async (): Promise<DiseaseStats> => {
    const { data } = await api.get<DiseaseStats>('/diseases/stats');
    return data;
  },

  scanCropLeaf: async (payload: DiseaseScanPayload): Promise<DiseaseDetection> => {
    const { data } = await api.post<DiseaseDetection>('/diseases/scan', payload);
    return data;
  },

  updateStatus: async (id: string | number, status: 'Detected' | 'Treating' | 'Resolved'): Promise<DiseaseDetection> => {
    const { data } = await api.put<DiseaseDetection>(`/diseases/${id}/status`, { status });
    return data;
  },

  submitPrescription: async (id: string | number, payload: PrescriptionPayload): Promise<DiseaseDetection> => {
    const { data } = await api.put<DiseaseDetection>(`/diseases/${id}/prescribe`, payload);
    return data;
  },

  deleteDetection: async (id: string | number): Promise<void> => {
    await api.delete(`/diseases/${id}`);
  },
};
