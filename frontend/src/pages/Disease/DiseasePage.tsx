import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MdBugReport, MdUpload, MdScience, MdVerified, MdCheckCircle,
  MdDelete, MdOutlineLocalHospital, MdShield, MdCameraAlt, MdHelpOutline
} from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Card, StatCard } from '../../components/ui/Card/Card';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { diseaseService } from '../../services/diseaseService';
import api from '../../services/api';
import type { DiseaseDetection, Farm, Crop } from '../../types';
import styles from './DiseasePage.module.css';

const SEVERITY_COLOR: Record<string, string> = {
  Low: 'var(--color-info, #3B82F6)',
  Medium: 'var(--color-warning, #F59E0B)',
  High: 'var(--color-error, #EF4444)',
  Critical: '#991B1B'
};

const SAMPLE_LEAF_PRESETS = [
  { label: '🍅 Tomato Leaf Spot', crop: 'Tomato', notes: 'Concentric brown spots with yellow halos on lower leaves' },
  { label: '🥔 Potato Blight', crop: 'Potato', notes: 'Water-soaked dark lesions on leaf tips during humid weather' },
  { label: '🌾 Wheat Rust', crop: 'Wheat', notes: 'Linear yellow-orange powdery pustules along leaf veins' },
  { label: '🌶️ Chili Fruit Rot', crop: 'Chili', notes: 'Sunken circular lesions with concentric rings of black dots' },
];

export default function DiseasePage() {
  const { user } = useAuth();
  const isFarmer = user?.role === 'Farmer';
  const isAgronomist = user?.role === 'Agronomist';
  const isAdmin = user?.role === 'Admin';
  const isNormalUser = user?.role === 'Normal User';

  const [data, setData] = useState<DiseaseDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiseaseDetection | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // New Scan Form State
  const [scanForm, setScanForm] = useState({
    farmId: '',
    cropId: '',
    cropName: '',
    notes: '',
    imageUrl: ''
  });

  // Agronomist Prescription Form State
  const [prescribeForm, setPrescribeForm] = useState({
    confirmedDisease: '',
    severity: 'Medium',
    prescription: '',
    clinicalNotes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [detections, farmsRes, cropsRes] = await Promise.all([
        diseaseService.getDetections(),
        api.get<Farm[]>('/farms').catch(() => ({ data: [] })),
        api.get<Crop[]>('/crops').catch(() => ({ data: [] }))
      ]);

      setData(detections);
      setFarms(farmsRes.data || []);
      setCrops(cropsRes.data || []);

      if (detections.length > 0) {
        setSelected(detections[0]);
      } else {
        setSelected(null);
      }
    } catch (error) {
      console.error('Failed to load disease data', error);
      toast.error('Failed to load disease detections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Image File Selection with Base64 Conversion
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScanForm(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Submit AI Leaf Scan
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanForm.farmId) {
      toast.error('Please select a farm');
      return;
    }

    try {
      setScanning(true);
      const result = await diseaseService.scanCropLeaf({
        farmId: Number(scanForm.farmId),
        cropId: scanForm.cropId ? Number(scanForm.cropId) : undefined,
        cropName: scanForm.cropName,
        notes: scanForm.notes,
        imageUrl: scanForm.imageUrl
      });

      setData(prev => [result, ...prev]);
      setSelected(result);
      toast.success(`Diagnosis complete: ${result.disease} (${result.confidence}%)`);
      setShowUploadModal(false);
      setScanForm({ farmId: '', cropId: '', cropName: '', notes: '', imageUrl: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze crop scan');
    } finally {
      setScanning(false);
    }
  };

  // Farmer updates treatment status
  const handleUpdateStatus = async (newStatus: 'Detected' | 'Treating' | 'Resolved') => {
    if (!selected) return;
    try {
      const updated = await diseaseService.updateStatus(selected.id, newStatus);
      setData(prev => prev.map(d => d.id === selected.id ? updated : d));
      setSelected(updated);
      toast.success(`Case updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update case status');
    }
  };

  // Open Prescription Modal for Agronomist
  const openPrescriptionModal = (detection: DiseaseDetection) => {
    setPrescribeForm({
      confirmedDisease: detection.disease,
      severity: detection.severity || 'Medium',
      prescription: detection.agronomistPrescription || detection.treatment || '',
      clinicalNotes: detection.agronomistNotes || ''
    });
    setShowPrescribeModal(true);
  };

  // Agronomist submits certified prescription
  const handlePrescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!prescribeForm.confirmedDisease.trim()) {
      toast.error('Confirmed disease diagnosis is required');
      return;
    }
    if (!prescribeForm.prescription.trim()) {
      toast.error('Prescription and dosage details are required');
      return;
    }

    try {
      const updated = await diseaseService.submitPrescription(selected.id, {
        confirmedDisease: prescribeForm.confirmedDisease,
        severity: prescribeForm.severity,
        prescription: prescribeForm.prescription,
        clinicalNotes: prescribeForm.clinicalNotes
      });

      setData(prev => prev.map(d => d.id === selected.id ? updated : d));
      setSelected(updated);
      toast.success('Certified prescription issued successfully!');
      setShowPrescribeModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to issue prescription');
    }
  };

  // Delete detection
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await diseaseService.deleteDetection(deleteId);
      setData(prev => prev.filter(d => d.id !== deleteId));
      if (selected?.id === deleteId) {
        setSelected(data.find(d => d.id !== deleteId) || null);
      }
      toast.success('Disease record removed');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    }
  };

  // Compute stat metrics
  const activeCount = data.filter(d => d.status !== 'Resolved').length;
  const resolvedCount = data.filter(d => d.status === 'Resolved').length;
  const avgConf = data.length > 0
    ? Math.round(data.reduce((acc, cur) => acc + (cur.confidence || 0), 0) / data.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Crop Disease Diagnostic Lab"
        subtitle={
          isAgronomist
            ? "Surveillance review board: Inspect farmer leaf scans, confirm pathogens, and issue certified prescriptions."
            : isAdmin
            ? "Regional agricultural epidemiology: Monitor disease prevalence, outbreaks, and pesticide compliance."
            : isNormalUser
            ? "Food safety & crop health guide: Real-time surveillance of plant health and organic crop protection."
            : "AI-powered foliar pathology: Scan crop leaves, detect diseases instantly, and get certified remedies."
        }
        breadcrumbs={[{ label: 'Disease Lab' }]}
        actions={
          (isFarmer || isAdmin) ? (
            <Button leftIcon={<MdCameraAlt />} variant="primary" onClick={() => setShowUploadModal(true)}>
              Scan Crop Leaf
            </Button>
          ) : isAgronomist ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--color-primary, #3B82F6)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              <MdScience size={18} /> Agronomist Diagnostic Mode
            </div>
          ) : null
        }
      />

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
        <StatCard label="Total Scans" value={data.length.toString()} icon={<MdBugReport />} iconBg="rgba(239, 68, 68, 0.1)" iconColor="var(--color-error, #EF4444)" />
        <StatCard label="Active Pathogens" value={activeCount.toString()} icon={<MdBugReport />} iconBg="rgba(245, 158, 11, 0.1)" iconColor="var(--color-warning, #F59E0B)" />
        <StatCard label="Resolved Cases" value={resolvedCount.toString()} icon={<MdCheckCircle />} iconBg="rgba(16, 185, 129, 0.1)" iconColor="var(--color-emerald, #10B981)" />
        <StatCard label="Avg. Confidence" value={data.length ? `${avgConf}%` : '—'} icon={<MdScience />} iconBg="rgba(59, 130, 246, 0.1)" iconColor="var(--color-primary, #3B82F6)" />
      </div>

      <div className={styles.layout}>
        {/* Left Column: List of Detections */}
        <div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
              <MdBugReport size={40} style={{ opacity: 0.3, marginBottom: 10, color: 'var(--color-emerald)' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No Disease Cases Logged</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {(isFarmer || isAdmin) ? 'Click "Scan Crop Leaf" to analyze a plant.' : 'All registered farms are currently healthy.'}
              </p>
            </div>
          ) : (
            data.map((d, i) => (
              <motion.div
                key={d.id || i}
                className={`${styles.card} ${selected?.id === d.id ? styles.cardActive : ''}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(d)}
              >
                <div className={styles.cardTop}>
                  <Badge variant={statusVariant(d.status)} dot>{d.status}</Badge>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {d.detectedAt ? new Date(d.detectedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <h4 className={styles.diseaseName}>{d.disease}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {d.cropName} · {d.farmName || `Farm #${d.farmId}`}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: SEVERITY_COLOR[d.severity] || 'var(--color-warning)' }}>
                    ● {d.severity} Severity
                  </span>
                  {d.agronomistVerified ? (
                    <span className={styles.verifiedBadge}><MdVerified size={13} /> Verified</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-gold)', fontWeight: 600 }}>AI Diagnosed</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column: Detailed Clinical Inspection Card */}
        <div>
          {selected ? (
            <Card>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {selected.disease}
                      {selected.agronomistVerified && (
                        <span className={styles.verifiedBadge} title="Verified by Agronomist">
                          <MdVerified size={14} /> Clinical Verification
                        </span>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      Farm: <strong>{selected.farmName || `Farm #${selected.farmId}`}</strong> · Crop: <strong>{selected.cropName}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant={statusVariant(selected.status)} dot>{selected.status}</Badge>
                    {(isFarmer || isAdmin) && (
                      <button
                        onClick={() => setDeleteId(selected.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #EF4444)', padding: 4 }}
                        title="Delete record"
                      >
                        <MdDelete size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Pathogen Classification', value: selected.pathogenType || 'Fungal Pathogen' },
                  { label: 'Severity Level', value: selected.severity, color: SEVERITY_COLOR[selected.severity] },
                  { label: 'Foliage Area Affected', value: `${selected.affectedArea || 10}%` },
                  { label: 'AI Diagnostic Confidence', value: `${selected.confidence || 90}%` },
                  { label: 'Date Logged', value: selected.detectedAt ? new Date(selected.detectedAt).toLocaleDateString() : 'N/A' },
                  { label: 'Case Status', value: selected.status },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {m.label}
                    </p>
                    <p style={{ fontWeight: 700, color: (m as any).color ?? 'var(--text-primary)' }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Confidence Meter */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Diagnostic Accuracy</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-emerald)' }}>{selected.confidence}% Match</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-tertiary, #1e293b)', borderRadius: 99, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${selected.confidence}%`,
                      background: 'linear-gradient(90deg, var(--color-emerald, #10B981), var(--color-gold, #D4AF37))',
                      borderRadius: 99,
                      transition: 'width 1s ease'
                    }}
                  />
                </div>
              </div>

              {/* High-Resolution Leaf Scan Preview */}
              {selected.imageUrl && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Leaf Scan Specimen
                  </p>
                  <div style={{ maxHeight: 240, overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border-color)', background: '#000', display: 'flex', justifyContent: 'center' }}>
                    <img src={selected.imageUrl} alt="Leaf Scan" style={{ maxHeight: 240, objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {/* AI Treatment Protocol */}
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', borderRadius: 12, padding: 16, borderLeft: '4px solid var(--color-error, #EF4444)', marginBottom: 16 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MdShield size={18} /> AI Recommended Clinical Protocol
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: 14, whiteSpace: 'pre-line' }}>
                  {selected.treatment}
                </p>
              </div>

              {/* Certified Agronomist Prescription Box */}
              {selected.agronomistVerified && (
                <div className={styles.prescriptionCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <MdOutlineLocalHospital size={20} color="#3B82F6" />
                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>
                      Certified Agronomist Prescription
                    </h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      Issued by {selected.verifiedByAgronomistName || 'Registered Agronomist'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-line', background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
                    {selected.agronomistPrescription}
                  </p>
                  {selected.agronomistNotes && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                      Field Notes: {selected.agronomistNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Dynamic Role Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                {/* Farmer Actions */}
                {(isFarmer || isAdmin) && selected.status !== 'Resolved' && (
                  <>
                    {selected.status !== 'Treating' && (
                      <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('Treating')}>
                        Mark as Treating
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('Resolved')}>
                      Mark as Resolved
                    </Button>
                  </>
                )}

                {/* Agronomist Prescription Trigger */}
                {(isAgronomist || isAdmin) && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<MdOutlineLocalHospital />}
                    onClick={() => openPrescriptionModal(selected)}
                  >
                    {selected.agronomistVerified ? 'Update Prescription' : 'Issue Certified Prescription'}
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <MdBugReport size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Select a disease detection case to view complete pathology metrics and prescriptions.</p>
            </div>
          )}
        </div>
      </div>

      {/* SCAN CROP LEAF MODAL (FARMER & ADMIN) */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => { if (!scanning) setShowUploadModal(false); }}
        title="AI Crop Leaf Pathology Scanner"
        size="lg"
        footer={
          <>
            <Button variant="ghost" disabled={scanning} onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button loading={scanning} onClick={handleScanSubmit}>
              {scanning ? 'Analyzing Foliage...' : 'Diagnose with AI Vision'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleScanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Farm Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Select Affected Farm Plot *
            </label>
            <select
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={scanForm.farmId}
              onChange={e => setScanForm({ ...scanForm, farmId: e.target.value })}
              required
            >
              <option value="">Select registered farm...</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.location || 'Plot'})</option>
              ))}
            </select>
          </div>

          {/* Crop Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Crop Variety
            </label>
            <select
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={scanForm.cropId}
              onChange={e => {
                const c = crops.find(item => String(item.id) === e.target.value);
                setScanForm({ ...scanForm, cropId: e.target.value, cropName: c ? c.name : '' });
              }}
            >
              <option value="">Auto-Detect Crop Species from Photo (AI Vision)</option>
              {crops.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.variety || 'Cycle'})</option>
              ))}
            </select>
          </div>

          {!scanForm.cropId && (
            <Input
              label="Or Optional Crop Name (Leave blank for AI auto-identification)"
              placeholder="e.g. Leave blank or enter Tomato, Potato, Wheat, Rice..."
              value={scanForm.cropName}
              onChange={e => setScanForm({ ...scanForm, cropName: e.target.value })}
            />
          )}

          {/* Quick Presets for Instant Testing */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Quick Presets (Click to Auto-fill symptoms):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SAMPLE_LEAF_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.sampleLeafBtn}
                  onClick={() => setScanForm(prev => ({ ...prev, cropName: p.crop, notes: p.notes }))}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observed Symptoms */}
          <Input
            label="Observed Foliar Symptoms / Notes"
            placeholder="e.g. Concentric target spots on lower leaves with yellow margins"
            value={scanForm.notes}
            onChange={e => setScanForm({ ...scanForm, notes: e.target.value })}
          />

          {/* Image Upload Area */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Upload Leaf Specimen Photo
            </label>
            {scanning ? (
              <div className={styles.scannerBox}>
                <div className={styles.scannerBeam} />
                <p style={{ color: 'var(--color-emerald)', fontSize: 13, fontWeight: 700, zIndex: 10 }}>
                  Scanning leaf pathology signatures...
                </p>
              </div>
            ) : scanForm.imageUrl ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: 200, display: 'flex', justifyContent: 'center', background: '#000' }}>
                <img src={scanForm.imageUrl} alt="Preview" style={{ maxHeight: 200, objectFit: 'contain' }} />
                <button
                  type="button"
                  onClick={() => setScanForm(prev => ({ ...prev, imageUrl: '' }))}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                >
                  Change
                </button>
              </div>
            ) : (
              <label className={styles.dropzone}>
                <div className={styles.dropzoneIcon}>
                  <MdUpload />
                </div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, margin: 0 }}>
                  Click to upload leaf photo
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
                  Supports PNG, JPG, or camera captures up to 5MB
                </p>
                <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </form>
      </Modal>

      {/* CLINICAL PRESCRIPTION MODAL (AGRONOMIST & ADMIN) */}
      <Modal
        isOpen={showPrescribeModal}
        onClose={() => setShowPrescribeModal(false)}
        title={`Clinical Prescription: ${selected?.cropName || 'Crop'}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPrescribeModal(false)}>Cancel</Button>
            <Button onClick={handlePrescribeSubmit}>Sign & Issue Prescription</Button>
          </>
        }
      >
        <form onSubmit={handlePrescribeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Confirmed Disease Diagnosis *"
            value={prescribeForm.confirmedDisease}
            onChange={e => setPrescribeForm({ ...prescribeForm, confirmedDisease: e.target.value })}
            required
          />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Severity Level
            </label>
            <select
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={prescribeForm.severity}
              onChange={e => setPrescribeForm({ ...prescribeForm, severity: e.target.value })}
            >
              <option value="Low">Low - Mild localized spotting</option>
              <option value="Medium">Medium - Moderate spread across canopy</option>
              <option value="High">High - Rapid defoliation threat</option>
              <option value="Critical">Critical - Severe systemic infection</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Certified Treatment & Dosage Protocol *
            </label>
            <textarea
              style={{ width: '100%', minHeight: 120, padding: '12px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
              value={prescribeForm.prescription}
              onChange={e => setPrescribeForm({ ...prescribeForm, prescription: e.target.value })}
              placeholder="e.g. 1. Spray Mancozeb 75% WP @ 2.5g/L water. Repeat after 8 days. 2. Avoid nitrogen top dressing."
              required
            />
          </div>

          <Input
            label="Additional Agronomist Field Observations"
            placeholder="e.g. Monitor adjacent potato parcels; inspect soil drainage."
            value={prescribeForm.clinicalNotes}
            onChange={e => setPrescribeForm({ ...prescribeForm, clinicalNotes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Disease Record"
        message="Are you sure you want to permanently delete this disease diagnosis? This action cannot be undone."
      />
    </div>
  );
}
