import api from './api';
import type {
  RescueTicket,
  TriggerSosPayload,
  EmergencyCategoryPreset,
} from '../types';

export const rescueService = {
  triggerSos: async (payload: TriggerSosPayload): Promise<RescueTicket> => {
    const { data } = await api.post<RescueTicket>('/rescue/sos', payload);
    return data;
  },

  getMyTickets: async (): Promise<RescueTicket[]> => {
    const { data } = await api.get<RescueTicket[]>('/rescue/tickets/my');
    return data;
  },

  getTicketById: async (id: number | string): Promise<RescueTicket> => {
    const { data } = await api.get<RescueTicket>(`/rescue/tickets/${id}`);
    return data;
  },

  updateStatus: async (id: number | string, status: string, notes?: string): Promise<RescueTicket> => {
    const { data } = await api.put<RescueTicket>(`/rescue/tickets/${id}/status`, { status, notes });
    return data;
  },

  getPresets: async (): Promise<EmergencyCategoryPreset[]> => {
    const { data } = await api.get<EmergencyCategoryPreset[]>('/rescue/presets');
    return data;
  },
};

export default rescueService;
