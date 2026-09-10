import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import syncQueueDb, { type QueuedSyncAction } from '../offline/syncQueueDb';
import syncManager from '../offline/syncManager';

interface OfflinePwaContextType {
  isOnline: boolean;
  pendingCount: number;
  syncQueue: QueuedSyncAction[];
  isSyncing: boolean;
  lastSyncTime: Date | null;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  syncNow: () => Promise<void>;
  canInstallPwa: boolean;
  installPwa: () => Promise<void>;
  isPwaInstalled: boolean;
  refreshQueue: () => Promise<void>;
}

const OfflinePwaContext = createContext<OfflinePwaContextType | null>(null);

export function OfflinePwaProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncQueue, setSyncQueue] = useState<QueuedSyncAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  const refreshQueue = useCallback(async () => {
    try {
      const all = await syncQueueDb.getAllActions();
      const count = await syncQueueDb.getPendingCount();
      setSyncQueue(all);
      setPendingCount(count);
    } catch (err) {
      console.debug('Failed to read offline queue:', err);
    }
  }, []);

  // Initialize sync manager and network listeners
  useEffect(() => {
    syncManager.init();
    refreshQueue();

    // Check if app is already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsPwaInstalled(isStandalone);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Connection Restored: FarmVerse is back online!', { id: 'network-online' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('📶 You are in Offline Field Mode. Critical actions will be safely stored and synced.', {
        icon: '⚠️',
        duration: 5000,
        id: 'network-offline',
      });
    };

    const handleActionQueued = () => {
      refreshQueue();
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setCanInstallPwa(true);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setCanInstallPwa(false);
      setDeferredInstallPrompt(null);
      toast.success('🎉 FarmVerse App installed successfully!');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('farmverse:offline-action-queued', handleActionQueued);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Subscribe to Background Sync Manager events
    const unsubscribeSync = syncManager.subscribe(event => {
      if (event.type === 'SYNC_STARTED') {
        setIsSyncing(true);
      } else if (event.type === 'ITEM_SYNCED') {
        refreshQueue();
      } else if (event.type === 'SYNC_COMPLETED') {
        setIsSyncing(false);
        setLastSyncTime(new Date());
        refreshQueue();
        if (event.syncedCount && event.syncedCount > 0) {
          toast.success(
            `✅ ${event.syncedCount} offline field ${
              event.syncedCount === 1 ? 'action was' : 'actions were'
            } successfully synced with FarmVerse!`,
            { duration: 5000 }
          );
        }
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('farmverse:offline-action-queued', handleActionQueued);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubscribeSync();
    };
  }, [refreshQueue]);

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot synchronize: No internet connection detected.', { id: 'offline-cannot-sync' });
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncManager.drainQueue('USER_MANUAL_TRIGGER');
      if (res.synced === 0 && res.failed === 0) {
        toast('No actions pending synchronization.', { icon: 'ℹ️' });
      }
    } finally {
      setIsSyncing(false);
      refreshQueue();
    }
  }, [isOnline, refreshQueue]);

  const installPwa = useCallback(async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPwa(false);
    }
    setDeferredInstallPrompt(null);
  }, [deferredInstallPrompt]);

  return (
    <OfflinePwaContext.Provider
      value={{
        isOnline,
        pendingCount,
        syncQueue,
        isSyncing,
        lastSyncTime,
        isDrawerOpen,
        setDrawerOpen,
        syncNow,
        canInstallPwa,
        installPwa,
        isPwaInstalled,
        refreshQueue,
      }}
    >
      {children}
    </OfflinePwaContext.Provider>
  );
}

export function useOfflinePwa() {
  const context = useContext(OfflinePwaContext);
  if (!context) {
    throw new Error('useOfflinePwa must be used within an OfflinePwaProvider');
  }
  return context;
}
