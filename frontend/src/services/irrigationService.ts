import api from './api';
import type { IrrigationSchedule } from '../types';

export interface IrrigationStats {
  totalVolumeTodayLiters: number;
  activeZonesCount: number;
  waterSavedLiters: number;
  efficiencyScore: number;
  scheduledRunsCount: number;
}

export interface CreateSchedulePayload {
  farmId: number | string;
  zone: string;
  startTime: string;
  duration: number;
  waterVolume: number;
  method: string;
  automated: boolean;
  moistureThreshold?: number;
}

export interface IoTDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  farmId: string;
  farmName: string;
  zone: string;
  hardwareModel: string;
  deviceSecret: string;
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE';
  relayState: 'OPEN' | 'CLOSED';
  signalStrengthDbm: number;
  lineVoltage: number;
  flowRateLpm: number;
  firmwareVersion: string;
  lastPing?: string;
}

export interface PairDevicePayload {
  farmId: number | string;
  deviceName: string;
  zone: string;
  hardwareModel: string;
  customDeviceId?: string;
}

export interface TestPulseResponse {
  deviceId: string;
  status: string;
  message: string;
  pulseDurationSeconds: number;
  relayState: string;
}

export const irrigationService = {
  getSchedules: async (farmId?: number | string): Promise<IrrigationSchedule[]> => {
    try {
      const url = farmId ? `/irrigation/farm/${farmId}` : '/irrigation';
      const { data } = await api.get<any[]>(url);
      if (Array.isArray(data)) {
        return data.map(item => ({
          id: String(item.id),
          farmId: String(item.farmId || item.farm?.id || farmId || ''),
          farmName: item.farmName || item.farm?.farmName || 'Assigned Farm',
          zone: item.zone || 'Main Zone',
          startTime: item.startTime || new Date().toISOString(),
          duration: item.durationMinutes || item.duration || 30,
          waterVolume: item.waterVolumeLiters || item.waterVolume || 0,
          status: item.status || 'Scheduled',
          method: item.method || 'Drip',
          automated: item.automated !== undefined ? item.automated : true,
          nextRun: item.nextRun,
        }));
      }
    } catch {
      // Backend error or offline
    }
    return [];
  },

  createSchedule: async (payload: CreateSchedulePayload): Promise<IrrigationSchedule> => {
    const { data } = await api.post<any>('/irrigation', {
      farmId: Number(payload.farmId),
      zone: payload.zone,
      startTime: payload.startTime,
      durationMinutes: payload.duration,
      waterVolumeLiters: payload.waterVolume,
      method: payload.method,
      automated: payload.automated,
      moistureThreshold: payload.moistureThreshold || 50,
    });

    return {
      id: String(data.id),
      farmId: String(data.farmId || payload.farmId),
      farmName: data.farmName || 'Target Farm',
      zone: data.zone,
      startTime: data.startTime,
      duration: data.durationMinutes || payload.duration,
      waterVolume: data.waterVolumeLiters || payload.waterVolume,
      status: data.status || 'Scheduled',
      method: (data.method || payload.method) as IrrigationSchedule['method'],
      automated: data.automated ?? payload.automated,
    };
  },

  updateStatus: async (id: string, action: 'start' | 'pause' | 'stop'): Promise<IrrigationSchedule['status']> => {
    const statusMap: Record<string, IrrigationSchedule['status']> = {
      start: 'Active',
      pause: 'Paused',
      stop: 'Completed',
    };
    const nextStatus = statusMap[action] || 'Scheduled';

    const { data } = await api.put(`/irrigation/${id}/status`, { action, status: nextStatus });
    return (data?.status || nextStatus) as IrrigationSchedule['status'];
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await api.delete(`/irrigation/${id}`);
  },

  getStats: async (): Promise<IrrigationStats> => {
    try {
      const { data } = await api.get<IrrigationStats>('/irrigation/stats');
      if (data) return data;
    } catch {
      // Return zeroed live baseline
    }

    return {
      totalVolumeTodayLiters: 0,
      activeZonesCount: 0,
      waterSavedLiters: 0,
      efficiencyScore: 100.0,
      scheduledRunsCount: 0,
    };
  },

  getIoTDevices: async (): Promise<IoTDevice[]> => {
    try {
      const { data } = await api.get<any[]>('/irrigation/devices');
      if (Array.isArray(data)) {
        return data.map(d => ({
          id: String(d.id),
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          farmId: String(d.farmId || d.farm?.id || '1'),
          farmName: d.farmName || d.farm?.farmName || 'Target Farm',
          zone: d.zone || 'Zone A',
          hardwareModel: d.hardwareModel || 'ESP32-WROOM-32D Wi-Fi Relay',
          deviceSecret: d.deviceSecret || '',
          status: d.status || 'AWAITING_PINGS',
          relayState: d.relayState || 'OPEN',
          signalStrengthDbm: d.signalStrengthDbm,
          lineVoltage: d.lineVoltage,
          flowRateLpm: d.flowRateLpm,
          firmwareVersion: d.firmwareVersion || 'v2.4.2-fv',
          lastPing: d.lastPing,
        }));
      }
    } catch {
      // Backend error
    }

    return [];
  },

  pairIoTDevice: async (payload: PairDevicePayload): Promise<IoTDevice> => {
    const { data } = await api.post<any>('/irrigation/devices/pair', payload);
    return {
      id: String(data.id),
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      farmId: String(data.farmId || payload.farmId),
      farmName: data.farmName || 'Farm #' + payload.farmId,
      zone: data.zone || payload.zone,
      hardwareModel: data.hardwareModel || payload.hardwareModel,
      deviceSecret: data.deviceSecret || '',
      status: data.status || 'ONLINE',
      relayState: data.relayState || 'OPEN',
      signalStrengthDbm: data.signalStrengthDbm || -58,
      lineVoltage: data.lineVoltage || 230.0,
      flowRateLpm: data.flowRateLpm || 0.0,
      firmwareVersion: data.firmwareVersion || 'v2.4.2-fv',
      lastPing: data.lastPing || new Date().toISOString(),
    };
  },

  testRelayPulse: async (deviceId: string): Promise<TestPulseResponse> => {
    const { data } = await api.post<TestPulseResponse>(`/irrigation/devices/${deviceId}/test-pulse`);
    return data;
  },

  deleteIoTDevice: async (id: string): Promise<void> => {
    try {
      await api.delete(`/irrigation/devices/${id}`);
    } catch {
      // Ignore
    }
  },
};
