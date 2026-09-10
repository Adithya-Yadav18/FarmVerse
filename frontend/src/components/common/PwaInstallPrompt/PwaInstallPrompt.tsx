import React, { useState } from 'react';
import { MdGetApp, MdClose } from 'react-icons/md';
import styles from './PwaInstallPrompt.module.css';
import { useOfflinePwa } from '../../../context/OfflinePwaContext';

export default function PwaInstallPrompt() {
  const { canInstallPwa, installPwa, isPwaInstalled } = useOfflinePwa();
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (!canInstallPwa || isPwaInstalled || dismissed) {
    return null;
  }

  return (
    <div className={styles.installBanner}>
      <div className={styles.leftInfo}>
        <div className={styles.iconWrap}>
          <MdGetApp />
        </div>
        <div>
          <h4 className={styles.title}>Install FarmVerse App</h4>
          <p className={styles.desc}>
            Add FarmVerse to your home screen for rapid offline field access and instant agronomist alerts.
          </p>
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button className={styles.installBtn} onClick={() => installPwa()}>
          Install Now
        </button>
        <button className={styles.dismissBtn} onClick={() => setDismissed(true)} title="Dismiss">
          <MdClose />
        </button>
      </div>
    </div>
  );
}
