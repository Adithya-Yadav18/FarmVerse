import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdQrCodeScanner,
  MdVerified,
  MdAddCircleOutline,
  MdSecurity,
  MdPrint,
  MdWarning,
  MdSearch,
  MdCheckCircle,
  MdCameraAlt,
  MdArrowForward,
  MdPerson,
  MdInfo,
  MdStorage,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { traceabilityService } from '../../services/traceabilityService';
import type {
  ProduceBatch,
  TraceabilitySummaryStats,
  CreateBatchPayload,
  Farm,
  Crop,
} from '../../types';
import { Badge } from '../../components/ui/Badge/Badge';
import toast from 'react-hot-toast';
import styles from './TraceabilityPage.module.css';

export const TraceabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Role detection from AuthContext (no artificial buttons)
  const rawRole = (user?.role || 'Farmer').toLowerCase();
  const isAgronomist = rawRole.includes('agronomist');
  const isAdmin = rawRole.includes('admin');
  const canCertify = isAgronomist || isAdmin;

  // Active view tab
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'BATCHES' | 'GENERATOR'>('SCANNER');
  const [batches, setBatches] = useState<ProduceBatch[]>([]);
  const [stats, setStats] = useState<TraceabilitySummaryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time Database Farms and Crops
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);

  // Active Batch displayed on the Packaging Sticker preview
  const [activePreviewBatch, setActivePreviewBatch] = useState<ProduceBatch | null>(null);

  // Live Camera Scanner State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // New Batch Form State
  const [form, setForm] = useState<CreateBatchPayload>({
    farmId: 1,
    commodity: 'Tomato',
    variety: 'Hybrid Red Table Grade A',
    quantityKg: 2500,
    harvestDate: new Date().toISOString().split('T')[0],
    packagingDate: new Date().toISOString().split('T')[0],
    farmingPractice: '100% Certified Organic (Zero Chemical Pesticides)',
    soilType: 'Red Loamy Soil (pH 6.8)',
    waterSource: 'Solar Micro Drip Irrigation',
    certificationSeal: 'FarmVerse Grade A Green Seal',
  });

  // Agronomist & Admin Modals
  const [certifyModalBatch, setCertifyModalBatch] = useState<ProduceBatch | null>(null);
  const [certifyNotes, setCertifyNotes] = useState<string>('Passed post-harvest sorting. Purity & organoleptic test verified.');
  const [certifySeal, setCertifySeal] = useState<string>('FarmVerse Grade A Green Seal');

  const [recallModalBatch, setRecallModalBatch] = useState<ProduceBatch | null>(null);
  const [recallReason, setRecallReason] = useState<string>('Precautionary quality hold');

  useEffect(() => {
    fetchData();
    loadFarmsAndCrops();
    return () => {
      stopCameraTracks();
    };
  }, []);

  const stopCameraTracks = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, statsRes] = await Promise.all([
        traceabilityService.getBatches(),
        traceabilityService.getSummaryStats(),
      ]);
      setBatches(batchesRes);
      setStats(statsRes);
      if (batchesRes.length > 0) {
        setActivePreviewBatch(batchesRes[0]);
      }
    } catch (err) {
      console.error('Failed to load traceability data', err);
      toast.error('Could not load traceability records');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmsAndCrops = async () => {
    try {
      const [farmsRes, cropsRes] = await Promise.allSettled([
        api.get('/farms'),
        api.get('/crops'),
      ]);
      if (farmsRes.status === 'fulfilled' && Array.isArray(farmsRes.value.data)) {
        const loadedFarms = farmsRes.value.data.filter((f: Farm) => f != null);
        setFarms(loadedFarms);
        if (loadedFarms.length > 0) {
          const firstFarm = loadedFarms[0];
          setForm(prev => ({
            ...prev,
            farmId: Number(firstFarm.id) || 1,
            soilType: firstFarm.soilType || 'Red Loamy Soil (pH 6.8)',
          }));
        }
      }
      if (cropsRes.status === 'fulfilled' && Array.isArray(cropsRes.value.data)) {
        const loadedCrops = cropsRes.value.data.filter((c: Crop) => c != null);
        setCrops(loadedCrops);
      }
    } catch (err) {
      console.warn('Dynamic telemetry fetch error', err);
    }
  };

  // Live Camera Controls
  const startCamera = async () => {
    try {
      setIsScanning(true);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // Laptop front-facing webcam or mobile selfie camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      toast.success('Camera scanner active! Live webcam feed running.');

      // Native BarcodeDetector for automatic QR detection if supported
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  handleDetectedCode(barcodes[0].rawValue);
                }
              } catch {
                // Ignore frame decode errors
              }
            }
          }, 500);
        } catch (e) {
          console.warn('Barcode detector not initialized', e);
        }
      }
    } catch (err) {
      console.error('Camera access failed', err);
      setIsScanning(false);
      toast.error('Could not access webcam. Please check browser camera permissions.');
    }
  };

  const stopCamera = () => {
    stopCameraTracks();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    toast.success('Camera stopped');
  };

  const handleDetectedCode = (rawValue: string) => {
    stopCamera();
    let code = rawValue.trim();
    if (code.includes('/trace/')) {
      code = code.substring(code.lastIndexOf('/trace/') + 7);
    }
    code = code.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    toast.success(`QR Code Detected: ${code}`);
    navigate(`/trace/${code}`);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Harvest Quantity Validation
    if (!form.quantityKg || form.quantityKg < 1 || form.quantityKg > 500000) {
      toast.error('Harvest quantity must be between 1 kg and 500,000 kg');
      return;
    }

    try {
      const created = await traceabilityService.createBatch(form);
      toast.success(`Batch ${created.batchCode} generated with unique QR Code & SHA-256 Hash!`);
      setBatches([created, ...batches]);
      setActivePreviewBatch(created);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create produce batch';
      toast.error(msg);
    }
  };

  const handleCertifySubmit = async () => {
    if (!certifyModalBatch) return;
    try {
      const updated = await traceabilityService.certifyBatch(certifyModalBatch.batchCode, {
        agronomistName: user?.name ? `${user.name}, Agronomist` : 'Dr. Rameshwar Rao, Senior Agronomist',
        agronomistNotes: certifyNotes,
        certificationSeal: certifySeal,
        approved: true,
      });
      toast.success(`Batch ${updated.batchCode} certified with official seal!`);
      setBatches(batches.map(b => (b.batchCode === updated.batchCode ? updated : b)));
      if (activePreviewBatch?.batchCode === updated.batchCode) {
        setActivePreviewBatch(updated);
      }
      setCertifyModalBatch(null);
    } catch (err) {
      toast.error('Failed to certify batch');
    }
  };

  const handleRecallSubmit = async () => {
    if (!recallModalBatch) return;
    try {
      const updated = await traceabilityService.recallBatch(recallModalBatch.batchCode, recallReason);
      toast.error(`Batch ${updated.batchCode} placed under SAFETY RECALL!`);
      setBatches(batches.map(b => (b.batchCode === updated.batchCode ? updated : b)));
      if (activePreviewBatch?.batchCode === updated.batchCode) {
        setActivePreviewBatch(updated);
      }
      setRecallModalBatch(null);
    } catch (err) {
      toast.error('Failed to trigger recall');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/trace/${searchQuery.trim().toUpperCase()}`);
  };

  const printSticker = (batch: ProduceBatch) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Packaging Sticker - ${batch.batchCode}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .sticker { border: 3px dashed #10b981; padding: 24px; max-width: 320px; margin: auto; border-radius: 12px; }
            h2 { color: #065f46; margin-bottom: 4px; }
            .badge { background: #ecfdf5; color: #047857; font-family: monospace; font-size: 16px; font-weight: bold; padding: 4px 10px; border-radius: 6px; display: inline-block; margin: 8px 0; }
            img { width: 200px; height: 200px; margin: 12px 0; }
            .details { font-size: 12px; color: #374151; text-align: left; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 8px; }
            .hash { font-family: monospace; font-size: 8px; color: #6b7280; word-break: break-all; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <h2>🌿 FarmVerse Verified</h2>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Farm-to-Fork Traceability</div>
            <div class="badge">${batch.batchCode}</div>
            <div><img src="${batch.qrDataUrl}" alt="QR Code" /></div>
            <div class="details">
              <div><strong>Crop:</strong> ${batch.commodity} (${batch.variety || 'Standard'})</div>
              <div><strong>Quantity:</strong> ${batch.quantityKg} kg</div>
              <div><strong>Farm:</strong> ${batch.farmName}</div>
              <div><strong>Harvest Date:</strong> ${batch.harvestDate}</div>
              <div><strong>Practice:</strong> ${batch.farmingPractice}</div>
              <div><strong>Seal:</strong> ${batch.certificationSeal || 'Grade A'}</div>
            </div>
            <div class="hash">SHA256: ${batch.cryptographicHash}</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const displayBatch = activePreviewBatch || batches[0];

  return (
    <div className={styles.container}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <MdQrCodeScanner style={{ color: '#10b981' }} />
            Farm-to-Fork QR Traceability Engine
          </h1>
          <p>
            Cryptographic batch tagging, real-time lifecycle audit, and public consumer trust journey from soil to table.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={`${styles.btnSm} ${styles.btnPrimary}`}
            onClick={() => setActiveTab('GENERATOR')}
          >
            <MdAddCircleOutline /> Generate QR Batch
          </button>
        </div>
      </div>

      {/* ─── Real Authenticated User Status Bar (Replaces manual role buttons) ─── */}
      <div className={styles.userStatusBar}>
        <div className={styles.userStatusLeft}>
          <div className={styles.userBadgeDot} />
          <span>
            Connected as <strong>{user?.name || 'Authorized Producer'}</strong>
          </span>
          <span className={styles.badgeRole}>
            {user?.role || 'Farmer'}
          </span>
          {isAgronomist && (
            <span className={styles.badgeSpecial}>
              <MdVerified style={{ verticalAlign: 'middle' }} /> Agronomist Inspector Mode Active
            </span>
          )}
          {isAdmin && (
            <span className={styles.badgeSpecial}>
              <MdSecurity style={{ verticalAlign: 'middle' }} /> Full Administrative Oversight
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <MdStorage style={{ color: '#10b981', fontSize: '15px' }} />
          <span>Database Synchronized: <strong>{batches.length}</strong> Registered Batches</span>
        </div>
      </div>

      {/* ─── Mode Tabs ─── */}
      <div className={styles.tabGroup}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'SCANNER' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('SCANNER')}
        >
          <MdQrCodeScanner /> QR Scanner & Public Journey
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'BATCHES' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('BATCHES')}
        >
          <MdVerified /> Batches Ledger ({batches.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'GENERATOR' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('GENERATOR')}
        >
          <MdAddCircleOutline /> QR Batch Generator & Sticker
        </button>
      </div>

      {/* ─── Stats KPI Row ─── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <MdQrCodeScanner />
          </div>
          <div>
            <div className={styles.statVal}>{stats?.totalBatches || batches.length}</div>
            <div className={styles.statLabel}>Total Batches Tagged</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <MdVerified />
          </div>
          <div>
            <div className={styles.statVal}>{stats?.certifiedBatches || batches.filter(b => b.agronomistCertified).length}</div>
            <div className={styles.statLabel}>Agronomist Certified</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <MdCheckCircle />
          </div>
          <div>
            <div className={styles.statVal}>{stats?.certifiedOrganicPercent || 66.7}%</div>
            <div className={styles.statLabel}>Organic / Natural Farming</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <MdSecurity />
          </div>
          <div>
            <div className={styles.statVal}>{stats?.totalScans || 455}</div>
            <div className={styles.statLabel}>Consumer Scans Logged</div>
          </div>
        </div>
      </div>

      {/* ─── Tab Content 1: QR Scanner & Lookup ─── */}
      {activeTab === 'SCANNER' && (
        <div className={styles.scannerGrid}>
          {/* Live Scanner Viewfinder with Real Laptop Webcam Feed */}
          <div className={styles.scannerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Live Camera Scanner
              </h3>
              <Badge variant={isScanning ? 'success' : 'neutral'}>
                {isScanning ? 'Camera Live' : 'Standby'}
              </Badge>
            </div>

            <div className={styles.scannerBox}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.videoPlayer}
                style={{ display: isScanning ? 'block' : 'none' }}
              />

              {!isScanning && (
                <div className={styles.scanOverlay}>
                  <MdCameraAlt style={{ fontSize: '44px', opacity: 0.85, color: '#10b981' }} />
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>
                    Point camera at FarmVerse Packaging QR Code
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', maxWidth: '280px' }}>
                    Click below to open your laptop or smartphone camera to scan batch stickers in real time.
                  </span>
                  <button
                    type="button"
                    className={`${styles.btnSm} ${styles.btnPrimary}`}
                    style={{ marginTop: '8px' }}
                    onClick={startCamera}
                  >
                    <MdCameraAlt /> Start Camera Scanner
                  </button>
                </div>
              )}

              {isScanning && (
                <div className={styles.viewfinderOverlay}>
                  <div className={styles.laserLine} />
                  <div className={styles.reticleFrame} />
                  <div className={styles.cameraControls}>
                    <button
                      type="button"
                      className={`${styles.btnSm} ${styles.btnDanger}`}
                      onClick={stopCamera}
                    >
                      Stop Camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Supports laptop webcams, mobile cameras, packaging stickers, transport crates, and retail boxes.
            </p>
          </div>

          {/* Manual Code Search & 1-Click Demos */}
          <div className={styles.scannerCard}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Batch Code Lookup
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Enter the batch lot number printed on your produce package to view its complete lifecycle journey.
            </p>

            <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
              <input
                type="text"
                placeholder="e.g. FV-2026-8819"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={`${styles.btnSm} ${styles.btnPrimary}`}>
                <MdSearch /> Trace
              </button>
            </form>

            <div className={styles.quickLookupArea} style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Or Try Sample Batches (Instant Demo):
              </span>
              <div className={styles.samplePills}>
                <button
                  type="button"
                  className={styles.samplePill}
                  onClick={() => navigate('/trace/FV-2026-8819')}
                >
                  🍅 Mysore Organic Tomatoes (FV-2026-8819)
                </button>
                <button
                  type="button"
                  className={styles.samplePill}
                  onClick={() => navigate('/trace/FV-2026-9204')}
                >
                  🍎 Shimla Royal Apples (FV-2026-9204)
                </button>
                <button
                  type="button"
                  className={styles.samplePill}
                  onClick={() => navigate('/trace/FV-2026-7431')}
                >
                  🌿 Wayanad Black Pepper (FV-2026-7431)
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#10b981', fontWeight: '700' }}>
                <MdSecurity /> Cryptographic SHA-256 Assurance
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Each QR code embeds a SHA-256 digital fingerprint calculated from harvest date, farm GPS coordinates, and agronomist sign-off to ensure 100% tamper resistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content 2: Generator & Printable Sticker ─── */}
      {activeTab === 'GENERATOR' && (
        <div className={styles.generatorGrid}>
          {/* Real-time Batch Creation Form */}
          <div className={styles.formCard}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Produce Batch Tagging Form
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Tag your harvest with authentic farm telemetry to generate a unique, cryptographically-sealed packaging QR code.
            </p>

            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Select Farm Origin (Real-Time Database)</label>
                  <select
                    className={styles.inputField}
                    value={form.farmId}
                    onChange={e => {
                      const selectedId = Number(e.target.value);
                      const selectedFarm = farms.find(f => Number(f.id) === selectedId);
                      setForm({
                        ...form,
                        farmId: selectedId,
                        soilType: selectedFarm?.soilType || form.soilType,
                      });
                    }}
                  >
                    {farms.length > 0 ? (
                      farms.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.location || 'India'}) • {f.area ? `${f.area} ${f.areaUnit || 'ha'}` : 'Active'}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Blue Valley Farm (Mysore, Karnataka)</option>
                        <option value={2}>Green Ridge Apple Orchard (Shimla, HP)</option>
                        <option value={3}>Western Ghats Organics (Wayanad, Kerala)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Commodity Crop</label>
                  <input
                    type="text"
                    list="crops-datalist"
                    className={styles.inputField}
                    value={form.commodity}
                    onChange={e => {
                      const val = e.target.value;
                      const matchedCrop = crops.find(c => c.name.toLowerCase() === val.toLowerCase());
                      setForm({
                        ...form,
                        commodity: val,
                        variety: matchedCrop?.variety || form.variety,
                      });
                    }}
                    placeholder="e.g. Tomato, Apples, Black Pepper..."
                    required
                  />
                  <datalist id="crops-datalist">
                    {crops.map(c => (
                      <option key={c.id} value={c.name}>{c.variety ? `${c.name} (${c.variety})` : c.name}</option>
                    ))}
                    <option value="Tomato" />
                    <option value="Apple" />
                    <option value="Black Pepper" />
                    <option value="Capsicum" />
                    <option value="Basmati Rice" />
                    <option value="Wheat" />
                    <option value="Potato" />
                  </datalist>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Variety / Commercial Grade</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={form.variety}
                    onChange={e => setForm({ ...form, variety: e.target.value })}
                    placeholder="e.g. Hybrid Red Grade A"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>
                    Harvest Quantity (Kg)
                    <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>
                      (Limit: 1 to 500,000 kg)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500000}
                    step={1}
                    className={styles.inputField}
                    value={form.quantityKg}
                    onChange={e => setForm({ ...form, quantityKg: Math.max(0, Number(e.target.value)) })}
                    placeholder="e.g. 2500"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Permitted batch range: 1 kg to 500 metric tons
                  </span>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Harvest Date</label>
                  <input
                    type="date"
                    className={styles.inputField}
                    value={form.harvestDate}
                    onChange={e => setForm({ ...form, harvestDate: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Farming Practice</label>
                  <select
                    className={styles.inputField}
                    value={form.farmingPractice}
                    onChange={e => setForm({ ...form, farmingPractice: e.target.value })}
                  >
                    <option value="100% Certified Organic (Zero Chemical Pesticides)">100% Certified Organic</option>
                    <option value="Integrated Pest Management (IPM)">Integrated Pest Management (IPM)</option>
                    <option value="Regenerative Natural Farming">Regenerative Natural Farming</option>
                    <option value="Hydroponic Controlled Environment">Hydroponic Greenhouse</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Soil Profile</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={form.soilType}
                    onChange={e => setForm({ ...form, soilType: e.target.value })}
                    placeholder="e.g. Red Loamy (pH 6.8)"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Water / Irrigation Source</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={form.waterSource}
                    onChange={e => setForm({ ...form, waterSource: e.target.value })}
                    placeholder="e.g. Solar Micro Drip Irrigation"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`${styles.btnSm} ${styles.btnPrimary}`}
                style={{ padding: '12px 20px', fontSize: '14px', marginTop: '10px' }}
              >
                <MdAddCircleOutline /> Generate Batch & QR Sticker
              </button>
            </form>
          </div>

          {/* Printable Sticker Live Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className={styles.stickerCard}>
              {/* Batch Selector so user can inspect any batch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
                  Sticker Preview
                </span>
                {batches.length > 0 && (
                  <select
                    style={{ fontSize: '11px', padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', color: '#111827' }}
                    value={displayBatch?.batchCode || ''}
                    onChange={e => {
                      const found = batches.find(b => b.batchCode === e.target.value);
                      if (found) setActivePreviewBatch(found);
                    }}
                  >
                    {batches.map(b => (
                      <option key={b.batchCode} value={b.batchCode}>
                        {b.batchCode} ({b.commodity})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={styles.stickerHeader}>
                <div className={styles.stickerBrand}>
                  🌿 FarmVerse Verified
                </div>
                <div className={styles.stickerSub}>Farm-to-Fork Traceability</div>
              </div>

              <div className={styles.batchBadge}>
                {displayBatch?.batchCode || 'FV-2026-8819'}
              </div>

              <div className={styles.qrContainer}>
                {displayBatch?.qrDataUrl ? (
                  <img
                    src={displayBatch.qrDataUrl}
                    alt="QR Code Preview"
                    className={styles.qrImg}
                  />
                ) : (
                  <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af' }}>
                    Generating QR...
                  </div>
                )}
              </div>

              <div className={styles.stickerDetails}>
                <div><strong>Crop:</strong> {displayBatch?.commodity || form.commodity} ({displayBatch?.variety || form.variety})</div>
                <div><strong>Quantity:</strong> {displayBatch?.quantityKg || form.quantityKg} kg</div>
                <div><strong>Farm:</strong> {displayBatch?.farmName || 'Blue Valley Farm'}</div>
                <div><strong>Harvested:</strong> {displayBatch?.harvestDate || form.harvestDate}</div>
                <div><strong>Practice:</strong> {displayBatch?.farmingPractice || form.farmingPractice}</div>
              </div>

              <div className={styles.stickerHash}>
                SHA256: {displayBatch?.cryptographicHash || '98a4e8d7f6b4e...'}
              </div>
            </div>

            {displayBatch && (
              <button
                className={`${styles.btnSm} ${styles.btnOutline}`}
                style={{ alignSelf: 'center' }}
                onClick={() => printSticker(displayBatch)}
              >
                <MdPrint /> Print Packaging Sticker ({displayBatch.batchCode})
              </button>
            )}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700', marginBottom: '4px' }}>
                <MdInfo /> Permanent Storage Architecture
              </div>
              All generated batches and QR images are stored permanently in the database table <code>produce_batches</code> and exposed via REST endpoint <code>/api/trace/batch/{'{batchCode}'}/qr-image</code>. Every batch generates a completely distinct cryptographic SHA-256 signature and QR code.
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab Content 3: Batches Ledger ─── */}
      {activeTab === 'BATCHES' && (
        <div className={styles.tableCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Active Traceability Batches Ledger
            </h3>
            <Badge variant="info">{batches.length} Registered Batches</Badge>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Crop & Variety</th>
                <th>Farm Origin</th>
                <th>Harvest Date</th>
                <th>Farming Practice</th>
                <th>Certification Seal</th>
                <th>Status</th>
                <th>Scans</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(batch => (
                <tr key={batch.id}>
                  <td>
                    <span
                      className={styles.batchLink}
                      onClick={() => navigate(`/trace/${batch.batchCode}`)}
                    >
                      {batch.batchCode}
                    </span>
                  </td>
                  <td>
                    <strong>{batch.commodity}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {batch.variety || 'Standard'} • {batch.quantityKg} kg
                    </div>
                  </td>
                  <td>
                    <div>{batch.farmName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {batch.farmLocation}
                    </div>
                  </td>
                  <td>{batch.harvestDate}</td>
                  <td>
                    <span style={{ fontSize: '12px' }}>{batch.farmingPractice}</span>
                  </td>
                  <td>
                    {batch.agronomistCertified ? (
                      <Badge variant="success">
                        <MdVerified /> {batch.certificationSeal || 'Certified'}
                      </Badge>
                    ) : (
                      <Badge variant="warning">Pending Review</Badge>
                    )}
                  </td>
                  <td>
                    <Badge variant={batch.status === 'ACTIVE' ? 'success' : batch.status === 'RECALLED' ? 'error' : 'neutral'}>
                      {batch.status}
                    </Badge>
                  </td>
                  <td>
                    <strong>{batch.scanCount}</strong> scans
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        className={`${styles.btnSm} ${styles.btnOutline}`}
                        title="Print QR Sticker"
                        onClick={() => {
                          setActivePreviewBatch(batch);
                          printSticker(batch);
                        }}
                      >
                        <MdPrint />
                      </button>

                      <button
                        className={`${styles.btnSm} ${styles.btnPrimary}`}
                        title="View Public Journey"
                        onClick={() => navigate(`/trace/${batch.batchCode}`)}
                      >
                        <MdArrowForward /> View
                      </button>

                      {canCertify && !batch.agronomistCertified && (
                        <button
                          className={`${styles.btnSm} ${styles.btnPrimary}`}
                          onClick={() => setCertifyModalBatch(batch)}
                        >
                          <MdVerified /> Certify
                        </button>
                      )}

                      {canCertify && batch.status !== 'RECALLED' && (
                        <button
                          className={`${styles.btnSm} ${styles.btnDanger}`}
                          onClick={() => setRecallModalBatch(batch)}
                        >
                          <MdWarning /> Recall
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Agronomist Certification Modal ─── */}
      {certifyModalBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdVerified style={{ color: '#10b981' }} />
              Issue Agronomist Quality Seal
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              Digitally verify batch <strong>{certifyModalBatch.batchCode}</strong> ({certifyModalBatch.commodity}) from {certifyModalBatch.farmName}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Official Certification Seal</label>
                <select
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={certifySeal}
                  onChange={e => setCertifySeal(e.target.value)}
                >
                  <option value="FarmVerse Grade A Green Seal">FarmVerse Grade A Green Seal</option>
                  <option value="FSSAI Organic Benchmark">FSSAI Organic Benchmark</option>
                  <option value="Export Quality Tier 1 Spices">Export Quality Tier 1</option>
                  <option value="Pesticide-Free Controlled Origin">Pesticide-Free Controlled Origin</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Inspector Evaluation Notes</label>
                <textarea
                  className={styles.inputField}
                  style={{ width: '100%', height: '80px', marginTop: '4px', resize: 'none' }}
                  value={certifyNotes}
                  onChange={e => setCertifyNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  className={`${styles.btnSm} ${styles.btnOutline}`}
                  onClick={() => setCertifyModalBatch(null)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                  onClick={handleCertifySubmit}
                >
                  <MdVerified /> Approve & Grant Seal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Emergency Safety Recall Modal ─── */}
      {recallModalBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid #ef4444', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdWarning />
              Trigger Produce Safety Recall
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              This will immediately flag batch <strong>{recallModalBatch.batchCode}</strong> as RECALLED and warn any consumer who scans the QR code.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Recall Reason</label>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={recallReason}
                  onChange={e => setRecallReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  className={`${styles.btnSm} ${styles.btnOutline}`}
                  onClick={() => setRecallModalBatch(null)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btnSm} ${styles.btnDanger}`}
                  onClick={handleRecallSubmit}
                >
                  <MdWarning /> Confirm Immediate Recall
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraceabilityPage;
