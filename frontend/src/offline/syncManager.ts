// ─── FarmVerse Background Sync Engine ───────────────────────────────────────
// Replays queued offline actions sequentially with guaranteed atomic verification.

import axios from 'axios';
import syncQueueDb, { type QueuedSyncAction } from './syncQueueDb';
import { getToken } from '../utils';
import env from '../config/env';

type SyncListener = (event: {
  type: 'SYNC_STARTED' | 'ITEM_SYNCING' | 'ITEM_SYNCED' | 'ITEM_FAILED' | 'SYNC_COMPLETED';
  item?: QueuedSyncAction;
  syncedCount?: number;
  remainingCount?: number;
}) => void;

class BackgroundSyncManager {
  private isProcessing = false;
  private listeners: Set<SyncListener> = new Set();
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Automatic trigger when device regains connectivity
    window.addEventListener('online', () => {
      console.log('🌐 Network restored: Waking up FarmVerse Background Sync Engine...');
      this.drainQueue('ONLINE_EVENT');
    });

    // Also check on window focus in case background connectivity returned
    window.addEventListener('focus', () => {
      if (navigator.onLine) {
        this.drainQueue('WINDOW_FOCUS');
      }
    });

    // Check immediately on startup if online
    if (navigator.onLine) {
      setTimeout(() => this.drainQueue('INITIAL_STARTUP'), 2000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: Parameters<SyncListener>[0]) {
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public getIsSyncing(): boolean {
    return this.isProcessing;
  }

  /**
   * Sequentially drains the IndexedDB pending queue.
   */
  public async drainQueue(triggerReason: string = 'MANUAL'): Promise<{ synced: number; failed: number }> {
    if (this.isProcessing) {
      console.log('Sync already in progress, skipping duplicate call.');
      return { synced: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('Cannot drain queue: Device is currently offline.');
      return { synced: 0, failed: 0 };
    }

    this.isProcessing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await syncQueueDb.getPendingActions();
      if (pending.length === 0) {
        this.isProcessing = false;
        return { synced: 0, failed: 0 };
      }

      console.log(`🚀 [${triggerReason}] Starting background sync for ${pending.length} pending field actions...`);
      this.notify({ type: 'SYNC_STARTED', remainingCount: pending.length });

      for (const item of pending) {
        // If connection drops mid-batch, break immediately to preserve queue
        if (!navigator.onLine) {
          console.warn('Network connection dropped mid-batch. Halting sync queue to protect records.');
          break;
        }

        try {
          await syncQueueDb.updateActionStatus(item.id, 'SYNCING');
          this.notify({ type: 'ITEM_SYNCING', item });

          const token = getToken();
          const targetUrl = item.url.startsWith('http') ? item.url : `${env.API_BASE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`;

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(item.headers || {}),
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          // Execute request against the backend
          const response = await axios({
            url: targetUrl,
            method: item.method,
            data: item.payload,
            headers,
            timeout: 20000,
          });

          // Verify verified server confirmation
          if (response.status >= 200 && response.status < 300) {
            // Remove from device DB only after verified server success
            await syncQueueDb.removeAction(item.id);
            synced++;
            this.notify({ type: 'ITEM_SYNCED', item, syncedCount: synced });
            console.log(`✅ Synced: ${item.title} (${item.url})`);
          } else {
            throw new Error(`Unexpected server status: ${response.status}`);
          }
        } catch (itemErr: any) {
          failed++;
          const errorMsg = itemErr?.response?.data?.message || itemErr?.message || 'Network sync failure';
          console.warn(`⚠️ Failed to sync ${item.title}:`, errorMsg);
          await syncQueueDb.updateActionStatus(item.id, 'FAILED_RETRY', errorMsg);
          this.notify({ type: 'ITEM_FAILED', item });

          // If network error (no response), halt remaining queue until connection stabilizes
          if (!itemErr.response) {
            console.warn('Network unreachable. Halting queue drain.');
            break;
          }
        }
      }
    } catch (err) {
      console.error('Fatal error during sync queue drain:', err);
    } finally {
      this.isProcessing = false;
      const remaining = await syncQueueDb.getPendingCount();
      this.notify({ type: 'SYNC_COMPLETED', syncedCount: synced, remainingCount: remaining });
    }

    return { synced, failed };
  }
}

export const syncManager = new BackgroundSyncManager();
export default syncManager;
