import api from './api';
import type {
  EquipmentItem,
  EquipmentBooking,
  CreateBookingPayload,
  CreateEquipmentPayload,
} from '../types';

export const equipmentService = {
  getAll: async (params?: {
    category?: string;
    lat?: number;
    lng?: number;
    maxDistanceKm?: number;
    search?: string;
    location?: string;
  }): Promise<EquipmentItem[]> => {
    const { data } = await api.get<EquipmentItem[]>('/equipment', { params });
    return data;
  },

  getById: async (id: number | string, coords?: { lat?: number; lng?: number }): Promise<EquipmentItem> => {
    const { data } = await api.get<EquipmentItem>(`/equipment/${id}`, { params: coords });
    return data;
  },

  create: async (payload: CreateEquipmentPayload): Promise<EquipmentItem> => {
    const { data } = await api.post<EquipmentItem>('/equipment', payload);
    return data;
  },

  book: async (equipmentId: number | string, payload: CreateBookingPayload): Promise<EquipmentBooking> => {
    const { data } = await api.post<EquipmentBooking>(`/equipment/${equipmentId}/book`, payload);
    return data;
  },

  getMyBookings: async (): Promise<EquipmentBooking[]> => {
    const { data } = await api.get<EquipmentBooking[]>('/equipment/bookings/my');
    return data;
  },

  getOwnerBookings: async (): Promise<EquipmentBooking[]> => {
    const { data } = await api.get<EquipmentBooking[]>('/equipment/bookings/owner');
    return data;
  },

  updateBookingStatus: async (
    bookingId: number | string,
    payload: { status: string; notes?: string }
  ): Promise<EquipmentBooking> => {
    const { data } = await api.put<EquipmentBooking>(`/equipment/bookings/${bookingId}/status`, payload);
    return data;
  },
};

export default equipmentService;
