import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getToken, getRefreshToken, setToken, removeToken, removeRefreshToken, removeStoredUser } from '../utils';
import env from '../config/env';
import syncQueueDb, { type SyncCategory } from '../offline/syncQueueDb';

const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/**
 * Handles offline interception for mutative field operations.
 * Saves to IndexedDB and synthesizes an optimistic offline response.
 */
const handleOfflineAction = async (config: InternalAxiosRequestConfig): Promise<any> => {
  const url = config.url || '';
  const method = (config.method || 'POST').toUpperCase() as any;
  let category: SyncCategory = 'GENERAL';
  let title = 'Field Activity Update';

  let data = config.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (_) {}
  }

  // Do not queue authentication requests offline (requires live credential validation)
  if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
    return null;
  }

  if (url.includes('/rescue/sos')) {
    category = 'SOS_RESCUE';
    title = `SOS Emergency: ${data?.cropName || 'Crop Alert'} (${data?.affectedAcres || '1'} Acres)`;
  } else if (url.includes('/disease')) {
    category = 'SOS_RESCUE';
    title = `Crop Pathology Check: ${data?.cropName || data?.crop || 'Crop Diagnosis'}`;
  } else if (url.includes('/equipment') && url.includes('/book')) {
    category = 'EQUIPMENT_BOOKING';
    title = `Equipment Reservation (${data?.durationUnits || 1} ${data?.rentalType || 'Days'})`;
  } else if (url.includes('/equipment') && method === 'POST') {
    category = 'EQUIPMENT_BOOKING';
    title = `Equipment Listing: ${data?.name || 'Machinery'}`;
  } else if (url.includes('/farms')) {
    category = 'FARM_LOG';
    title = `Farm Plot: ${data?.name || data?.location || 'Field Record'}`;
  } else if (url.includes('/crops')) {
    category = 'FARM_LOG';
    title = `Crop Telemetry: ${data?.name || data?.stage || 'Crop Stage'}`;
  } else if (url.includes('/soil')) {
    category = 'FARM_LOG';
    title = `Soil Log: ${data?.soilType || data?.fieldName || 'Soil Analysis'}`;
  } else if (url.includes('/irrigation')) {
    category = 'FARM_LOG';
    title = `Irrigation Schedule: ${data?.zone || data?.crop || 'Watering Record'}`;
  } else if (url.includes('/traceability')) {
    category = 'GENERAL';
    title = `Traceability Batch: ${data?.batchNumber || data?.cropName || 'Batch Log'}`;
  } else if (url.includes('/credit') || url.includes('/carbon')) {
    category = 'GENERAL';
    title = `Agri-Finance / Carbon Log: ${data?.schemeName || data?.project || 'Application'}`;
  } else {
    // Universal catch-all for ANY farmer mutative activity while offline
    category = 'GENERAL';
    const cleanPath = url.replace(/^\/api\/?/, '').split('?')[0];
    const formattedPath = cleanPath ? cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1).replace('/', ' - ') : 'Activity';
    title = `Field Activity: ${formattedPath} (${method})`;
  }

  const queued = await syncQueueDb.enqueueAction({
    category,
    title,
    url,
    method,
    payload: data,
    headers: { 'Content-Type': 'application/json' },
  });

  // Synthesize optimistic response so UI confirms without error
  let responseData: any = {
    id: Date.now(),
    offlineQueued: true,
    syncId: queued.id,
    status: 'QUEUED_OFFLINE',
    message: 'Action saved locally in device storage and will sync once connected.',
    ...(typeof data === 'object' && data !== null ? data : {}),
  };

  if (category === 'SOS_RESCUE') {
    responseData = {
      id: Date.now(),
      ticketCode: 'SOS-OFFLINE-' + Math.floor(1000 + Math.random() * 9000),
      cropName: data?.cropName || 'Sugarcane',
      emergencyType: data?.emergencyType || 'EMERGENCY',
      severityLevel: data?.severityLevel || 'CRITICAL_IMMEDIATE',
      affectedAcres: data?.affectedAcres || 1,
      cropGrowthStage: data?.cropGrowthStage || 'Active Growth',
      symptomsDescription: data?.symptomsDescription || '',
      farmerName: data?.farmerName || 'Farmer',
      farmerPhone: data?.farmerPhone || '',
      status: 'QUEUED_OFFLINE',
      offlineQueued: true,
      createdAt: new Date().toISOString(),
      actionChecklist: [
        'Ticket securely stored in device IndexedDB.',
        'Antidote advice cached on device.',
        'Automatic dispatch queued for network reconnection.',
      ],
    };
  } else if (category === 'EQUIPMENT_BOOKING') {
    responseData = {
      id: Date.now(),
      bookingReference: 'EQB-OFFLINE-' + Math.floor(1000 + Math.random() * 9000),
      equipmentId: data?.equipmentId || 1,
      equipmentName: 'Machinery (Offline Queued)',
      renterName: data?.renterName || 'Farmer',
      renterPhone: data?.renterPhone || '',
      deliveryAddress: data?.deliveryAddress || 'Farm',
      startDate: data?.startDate || new Date().toISOString().split('T')[0],
      endDate: data?.endDate || new Date().toISOString().split('T')[0],
      durationUnits: data?.durationUnits || 1,
      rentalType: data?.rentalType || 'DAILY',
      totalRentalAmount: 0,
      securityDeposit: 0,
      status: 'QUEUED_OFFLINE',
      offlineQueued: true,
      bookedAt: new Date().toISOString(),
    };
  }

  // Notify listeners that a new offline action was queued
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farmverse:offline-action-queued', { detail: queued }));
  }

  return {
    data: responseData,
    status: 200,
    statusText: 'OK (Offline Queued)',
    headers: {},
    config,
  };
};

// ─── Request Interceptor: attach JWT + check offline ─────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If device is explicitly offline and trying to perform a mutable action, queue locally
  if (
    typeof navigator !== 'undefined' &&
    !navigator.onLine &&
    config.method &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())
  ) {
    const offlineRes = await handleOfflineAction(config);
    if (offlineRes) {
      // Create a cancelled request adapter that resolves with the offline synthetic response
      config.adapter = () => Promise.resolve(offlineRes);
    }
  }

  return config;
});

// ─── Response Interceptor: handle 401 + refresh + network failure fallback ─────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if network completely dropped during transmission on a mutative request
    if (
      !error.response &&
      originalRequest &&
      originalRequest.method &&
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(originalRequest.method.toUpperCase())
    ) {
      const offlineRes = await handleOfflineAction(originalRequest);
      if (offlineRes) {
        return Promise.resolve(offlineRes);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const { data } = await axios.post(`${env.API_BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.accessToken as string;
        setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeToken();
        removeRefreshToken();
        removeStoredUser();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
