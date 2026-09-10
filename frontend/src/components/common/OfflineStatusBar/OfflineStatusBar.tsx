import React from 'react';
import { MdWifiOff, MdSync, MdOutlineCloudDone, MdFormatListBulleted } from 'react-icons/md';
import styles from './OfflineStatusBar.module.css';
import { useOfflinePwa } from '../../../context/OfflinePwaContext';

export default function OfflineStatusBar() {
  const { isOnline, pendingCount, isSyncing, setDrawerOpen, syncNow } = useOfflinePwa();

  // If online, not syncing, and no actions pending, stay hidden to keep interface completely clean
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.statusBar} ${
        !isOnline
          ? styles.offlineState
          : isSyncing
          ? styles.syncingState
          : styles.pendingOnlineState
      }`}
    >
      <div className={styles.leftWrap}>
        {!isOnline ? (
          <>
            <span className={styles.pulseDot}></span>
            <MdWifiOff size={16} />
            <span>
              <strong>Offline Field Mode:</strong> Cellular signal lost. All tickets, rentals, and logs are saved
              locally in device storage.
            </span>
            {pendingCount > 0 && (
              <span className={styles.badgePill}>{pendingCount} Action{pendingCount > 1 ? 's' : ''} Stored</span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <MdSync size={16} className={styles.spinIcon} />
            <span>
              <strong>Background Sync Active:</strong> Replaying queued field actions to FarmVerse cloud...
            </span>
            {pendingCount > 0 && <span className={styles.badgePill}>{pendingCount} Remaining</span>}
          </>
        ) : (
          <>
            <MdOutlineCloudDone size={16} />
            <span>
              <strong>Signal Restored:</strong> You have {pendingCount} offline field action
              {pendingCount > 1 ? 's' : ''} ready to push to server.
            </span>
          </>
        )}
      </div>

      <div className={styles.rightActions}>
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button className={styles.actionBtn} onClick={() => syncNow()} title="Push queued items to backend">
            <MdSync size={14} /> Sync Now
          </button>
        )}
        {pendingCount > 0 && (
          <button
            className={styles.actionBtn}
            onClick={() => setDrawerOpen(true)}
            title="Inspect pending offline activities"
          >
            <MdFormatListBulleted size={14} /> View Queue ({pendingCount})
          </button>
        )}
      </div>
    </div>
  );
}
