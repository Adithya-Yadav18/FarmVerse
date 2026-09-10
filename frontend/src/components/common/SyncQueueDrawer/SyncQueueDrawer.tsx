import React from 'react';
import { MdClose, MdSync, MdCheckCircle, MdErrorOutline, MdCloudQueue, MdWifiOff } from 'react-icons/md';
import styles from './SyncQueueDrawer.module.css';
import { useOfflinePwa } from '../../../context/OfflinePwaContext';

export default function SyncQueueDrawer() {
  const {
    isDrawerOpen,
    setDrawerOpen,
    syncQueue,
    pendingCount,
    isOnline,
    isSyncing,
    syncNow,
    lastSyncTime,
  } = useOfflinePwa();

  if (!isDrawerOpen) return null;

  return (
    <div className={styles.backdrop} onClick={() => setDrawerOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            <MdCloudQueue size={20} color="var(--color-emerald)" />
            Offline Sync Queue
          </h3>
          <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>
            <MdClose />
          </button>
        </div>

        <div className={styles.statusOverview}>
          <div className={styles.netIndicator}>
            <span className={isOnline ? styles.onlineDot : styles.offlineDot}></span>
            <span>{isOnline ? 'Online (Server Connected)' : 'Offline (Field Storage Mode)'}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {pendingCount} item{pendingCount === 1 ? '' : 's'} waiting
          </div>
        </div>

        <div className={styles.queueList}>
          {syncQueue.length === 0 ? (
            <div className={styles.emptyState}>
              <MdCheckCircle size={48} color="var(--color-emerald)" style={{ marginBottom: 12, opacity: 0.8 }} />
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Queue Is All Clear!</h4>
              <p style={{ margin: 0, fontSize: 13 }}>
                All your farm tickets, machinery bookings, and logs are synchronized with the FarmVerse server.
              </p>
              {lastSyncTime && (
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                  Last synchronized: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          ) : (
            syncQueue.map(item => {
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const isSOS = item.category === 'SOS_RESCUE';
              const isEquip = item.category === 'EQUIPMENT_BOOKING';
              const isFarm = item.category === 'FARM_LOG';

              return (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemTop}>
                    <span
                      className={`${styles.categoryTag} ${
                        isSOS ? styles.catSOS : isEquip ? styles.catEQUIPMENT : isFarm ? styles.catFARM : styles.catGENERAL
                      }`}
                    >
                      {item.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`${styles.statusTag} ${
                        item.status === 'PENDING'
                          ? styles.statusPending
                          : item.status === 'SYNCING'
                          ? styles.statusSyncing
                          : item.status === 'FAILED_RETRY'
                          ? styles.statusFailed
                          : styles.statusCompleted
                      }`}
                    >
                      {item.status === 'SYNCING' && '⏳ '}
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className={styles.itemTitle}>{item.title}</h4>
                  <div className={styles.itemMeta}>
                    <span>Created: {dateStr}</span>
                    <span>Method: {item.method}</span>
                    {item.retryCount > 0 && <span>Retries: {item.retryCount}</span>}
                  </div>

                  {item.errorMessage && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, display: 'flex', gap: 4 }}>
                      <MdErrorOutline size={14} />
                      <span>{item.errorMessage}</span>
                    </div>
                  )}

                  {item.payload && (
                    <div className={styles.itemPayloadPreview}>
                      {JSON.stringify(item.payload)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.syncBtn}
            onClick={() => syncNow()}
            disabled={!isOnline || pendingCount === 0 || isSyncing}
          >
            {isSyncing ? (
              <>
                <MdSync size={18} className={styles.spinIcon} />
                Syncing with FarmVerse...
              </>
            ) : !isOnline ? (
              <>
                <MdWifiOff size={18} />
                Offline — Auto-syncs when online
              </>
            ) : pendingCount === 0 ? (
              <>
                <MdCheckCircle size={18} />
                All Activities Synced
              </>
            ) : (
              <>
                <MdSync size={18} />
                Sync {pendingCount} Pending Action{pendingCount > 1 ? 's' : ''} Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
