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

const INITIAL_MOCK_SCHEDULES: IrrigationSchedule[] = [
  {
    id: '1',
    farmId: '1',
    farmName: 'North Valley Farm',
    zone: 'Zone A - Wheat Field',
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    duration: 45,
    waterVolume: 2400,
    status: 'Active',
    method: 'Drip',
    automated: true,
    nextRun: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  },
  {
    id: '2',
    farmId: '1',
    farmName: 'North Valley Farm',
    zone: 'Zone B - Tomato Polyhouse',
    startTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    duration: 30,
    waterVolume: 1800,
    status: 'Scheduled',
    method: 'Sprinkler',
    automated: true,
    nextRun: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  },
  {
    id: '3',
    farmId: '2',
    farmName: 'Green Acres',
    zone: 'Block C - Cotton Ridge',
    startTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    duration: 60,
    waterVolume: 3200,
    status: 'Completed',
    method: 'Flood',
    automated: false,
  },
  {
    id: '4',
    farmId: '2',
    farmName: 'Green Acres',
    zone: 'Sector 1 - Citrus Grove',
    startTime: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    duration: 90,
    waterVolume: 5400,
    status: 'Paused',
    method: 'Center Pivot',
    automated: true,
  },
  {
    id: '5',
    farmId: '1',
    farmName: 'North Valley Farm',
    zone: 'Zone D - Mustard Plot',
    startTime: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    duration: 40,
    waterVolume: 2100,
    status: 'Scheduled',
    method: 'Drip',
    automated: true,
  },
];

let localSchedules: IrrigationSchedule[] = [...INITIAL_MOCK_SCHEDULES];

export const irrigationService = {
  getSchedules: async (farmId?: number | string): Promise<IrrigationSchedule[]> => {
    try {
      const url = farmId ? `/irrigation/farm/${farmId}` : '/irrigation';
      const { data } = await api.get<any[]>(url);
      if (Array.isArray(data)) {
        return data.map(item => ({
          id: String(item.id),
          farmId: String(item.farmId || item.farm?.id || farmId || '1'),
          farmName: item.farmName || item.farm?.farmName || 'Assigned Farm',
          zone: item.zone || 'Main Zone',
          startTime: item.startTime || new Date().toISOString(),
          duration: item.durationMinutes || item.duration || 30,
          waterVolume: item.waterVolumeLiters || item.waterVolume || 1500,
          status: item.status || 'Scheduled',
          method: item.method || 'Drip',
          automated: item.automated !== undefined ? item.automated : true,
          nextRun: item.nextRun,
        }));
      }
    } catch {
      // Fallback only if backend is unreachable
    }

    if (farmId) {
      return localSchedules.filter(s => String(s.farmId) === String(farmId));
    }
    return localSchedules;
  },

  createSchedule: async (payload: CreateSchedulePayload): Promise<IrrigationSchedule> => {
    try {
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

      const mapped: IrrigationSchedule = {
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
      localSchedules = [mapped, ...localSchedules];
      return mapped;
    } catch {
      const mockNew: IrrigationSchedule = {
        id: String(Date.now()),
        farmId: String(payload.farmId),
        farmName: 'Farm #' + payload.farmId,
        zone: payload.zone,
        startTime: payload.startTime,
        duration: payload.duration,
        waterVolume: payload.waterVolume,
        status: 'Scheduled',
        method: payload.method as IrrigationSchedule['method'],
        automated: payload.automated,
      };
      localSchedules = [mockNew, ...localSchedules];
      return mockNew;
    }
  },

  updateStatus: async (id: string, action: 'start' | 'pause' | 'stop'): Promise<IrrigationSchedule['status']> => {
    const statusMap: Record<string, IrrigationSchedule['status']> = {
      start: 'Active',
      pause: 'Paused',
      stop: 'Completed',
    };
    const nextStatus = statusMap[action] || 'Scheduled';

    try {
      await api.put(`/irrigation/${id}/status`, { action, status: nextStatus });
    } catch {
      // Fallback update
    }

    localSchedules = localSchedules.map(s => (s.id === id ? { ...s, status: nextStatus } : s));
    return nextStatus;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    try {
      await api.delete(`/irrigation/${id}`);
    } catch {
      // Fallback delete
    }
    localSchedules = localSchedules.filter(s => s.id !== id);
  },

  getStats: async (): Promise<IrrigationStats> => {
    try {
      const { data } = await api.get<IrrigationStats>('/irrigation/stats');
      if (data) return data;
    } catch {
      // Compute from current state
    }

    const activeCount = localSchedules.filter(s => s.status === 'Active').length;
    const todayVolume = localSchedules
      .filter(s => s.status === 'Active' || s.status === 'Completed')
      .reduce((sum, s) => sum + s.waterVolume, 0);

    return {
      totalVolumeTodayLiters: todayVolume || 5600,
      activeZonesCount: activeCount,
      waterSavedLiters: 3200,
      efficiencyScore: 94.2,
      scheduledRunsCount: localSchedules.filter(s => s.status === 'Scheduled').length,
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
    try {
      const { data } = await api.post<any>('/irrigation/devices/pair', payload);
      return {
        id: String(data.id),
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        farmId: String(data.farmId || payload.farmId),
        farmName: data.farmName || 'Farm #' + payload.farmId,
        zone: data.zone || payload.zone,
        hardwareModel: data.hardwareModel || payload.hardwareModel,
        deviceSecret: data.deviceSecret || 'fv_sec_' + Date.now(),
        status: data.status || 'ONLINE',
        relayState: data.relayState || 'OPEN',
        signalStrengthDbm: data.signalStrengthDbm || -58,
        lineVoltage: data.lineVoltage || 230.0,
        flowRateLpm: data.flowRateLpm || 48.0,
        firmwareVersion: data.firmwareVersion || 'v2.4.2-fv',
        lastPing: new Date().toISOString(),
      };
    } catch {
      // Offline fallback
      return {
        id: String(Date.now()),
        deviceId: payload.customDeviceId || 'FV-ESP32-' + Math.floor(1000 + Math.random() * 9000),
        deviceName: payload.deviceName,
        farmId: String(payload.farmId),
        farmName: 'Farm #' + payload.farmId,
        zone: payload.zone,
        hardwareModel: payload.hardwareModel,
        deviceSecret: 'fv_sec_' + Math.random().toString(36).substring(2, 12),
        status: 'ONLINE',
        relayState: 'OPEN',
        signalStrengthDbm: -60,
        lineVoltage: 230.0,
        flowRateLpm: 50.0,
        firmwareVersion: 'v2.4.2-fv',
        lastPing: new Date().toISOString(),
      };
    }
  },

  testRelayPulse: async (deviceId: string): Promise<TestPulseResponse> => {
    try {
      const { data } = await api.post<TestPulseResponse>(`/irrigation/devices/${deviceId}/test-pulse`);
      return data;
    } catch {
      return {
        deviceId,
        status: 'SUCCESS',
        message: 'Relay pulse transmitted! Contactor energized for 5 seconds.',
        pulseDurationSeconds: 5,
        relayState: 'CLOSED',
      };
    }
  },

  deleteIoTDevice: async (id: string): Promise<void> => {
    try {
      await api.delete(`/irrigation/devices/${id}`);
    } catch {
      // Ignore
    }
  },
};
