import api from './api';
import type { UserSettings } from '../types';

export const settingsService = {
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await api.get<UserSettings>('/settings');
    return data;
  },

  updateSettings: async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const { data } = await api.put<UserSettings>('/settings', payload);
    return data;
  },
};

export default settingsService;
