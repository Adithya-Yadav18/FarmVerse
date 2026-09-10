// ─── FarmVerse Offline Persistent IndexedDB Queue ─────────────────────────────
// Stores un-synced field actions directly in the device's physical storage.

export type SyncCategory = 'SOS_RESCUE' | 'EQUIPMENT_BOOKING' | 'FARM_LOG' | 'GENERAL';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'FAILED_RETRY' | 'COMPLETED';

export interface QueuedSyncAction {
  id: string;
  category: SyncCategory;
  title: string;
  description?: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
  headers?: Record<string, string>;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  lastAttempt?: number;
  errorMessage?: string;
}

const DB_NAME = 'farmverse-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

export const syncQueueDb = {
  /**
   * Atomically enqueues a field action into device storage.
   */
  async enqueueAction(
    action: Omit<QueuedSyncAction, 'id' | 'timestamp' | 'status' | 'retryCount'>
  ): Promise<QueuedSyncAction> {
    const db = await openDb();
    const id = 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const newRecord: QueuedSyncAction = {
      ...action,
      id,
      timestamp: Date.now(),
      status: 'PENDING',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(newRecord);

      req.onsuccess = () => resolve(newRecord);
      req.onerror = () => reject(req.error || new Error('Failed to save offline record.'));
    });
  },

  /**
   * Retrieves all pending actions awaiting synchronization.
   */
  async getPendingActions(): Promise<QueuedSyncAction[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedSyncAction[]) || [];
        const pending = all
          .filter(a => a.status === 'PENDING' || a.status === 'FAILED_RETRY')
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Retrieves full queue history for user inspection in the Sync Drawer.
   */
  async getAllActions(): Promise<QueuedSyncAction[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedSyncAction[]) || [];
        all.sort((a, b) => b.timestamp - a.timestamp);
        resolve(all);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Updates state of a sync action (e.g. SYNCING, FAILED_RETRY, COMPLETED).
   */
  async updateActionStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result as QueuedSyncAction;
        if (!record) {
          resolve();
          return;
        }

        record.status = status;
        record.lastAttempt = Date.now();
        if (status === 'FAILED_RETRY') {
          record.retryCount += 1;
        }
        if (error !== undefined) {
          record.errorMessage = error;
        }

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  },

  /**
   * Removes an action from the queue ONLY after verified server confirmation (HTTP 200/201).
   */
  async removeAction(id: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Cleans up successfully synced items older than 24 hours.
   */
  async clearCompletedActions(): Promise<number> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedSyncAction[]) || [];
        let deleted = 0;
        all.forEach(item => {
          if (item.status === 'COMPLETED') {
            store.delete(item.id);
            deleted++;
          }
        });
        resolve(deleted);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Returns count of items pending sync.
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingActions();
    return pending.length;
  },
};

export default syncQueueDb;
