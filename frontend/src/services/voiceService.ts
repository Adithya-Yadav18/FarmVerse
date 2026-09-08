import api from './api';
import type {
  VoiceQueryPayload,
  VoiceAdvisoryResult,
  VoicePreset,
  VoiceConsultationHistoryItem,
} from '../types';

export const voiceService = {
  ask: async (payload: VoiceQueryPayload): Promise<VoiceAdvisoryResult> => {
    const { data } = await api.post<VoiceAdvisoryResult>('/voice/ask', payload);
    return data;
  },

  getPresets: async (languageCode: string = 'hi'): Promise<VoicePreset[]> => {
    const { data } = await api.get<VoicePreset[]>('/voice/presets', {
      params: { lang: languageCode },
    });
    return data;
  },

  getHistory: async (): Promise<VoiceConsultationHistoryItem[]> => {
    const { data } = await api.get<VoiceConsultationHistoryItem[]>('/voice/history');
    return data;
  },

  deleteHistory: async (id: number | string): Promise<void> => {
    await api.delete(`/voice/history/${id}`);
  },
};

export default voiceService;
