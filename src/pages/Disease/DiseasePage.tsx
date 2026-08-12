import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdBugReport, MdUpload } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { StatCard } from '../../components/ui/Card/Card';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { DiseaseDetection } from '../../types';
import styles from './DiseasePage.module.css';

const MOCK: DiseaseDetection[] = [
  { id: '1', cropId: '6', cropName: 'Tomato', farmId: '1', detectedAt: '2024-12-28T10:00:00Z', disease: 'Early Blight', confidence: 94, severity: 'High', affectedArea: 15, treatment: 'Apply copper-based fungicide. Remove infected leaves. Improve air circulation.', status: 'Treating' },
  { id: '2', cropId: '1', cropName: 'Wheat', farmId: '1', detectedAt: '2024-12-20T08:30:00Z', disease: 'Rust (Yellow)', confidence: 87, severity: 'Medium', affectedArea: 8, treatment: 'Apply propiconazole fungicide. Monitor spread weekly.', status: 'Resolved' },
  { id: '3', cropId: '3', cropName: 'Corn', farmId: '2', detectedAt: '2024-12-15T14:00:00Z', disease: 'Gray Leaf Spot', confidence: 91, severity: 'Low', affectedArea: 5, treatment: 'Reduce leaf wetness. Apply trifloxystrobin if spread continues.', status: 'Detected' },
];

const SEVERITY_COLOR: Record<string, string> = { Low: 'var(--color-info)', Medium: 'var(--color-warning)', High: 'var(--color-error)', Critical: '#7c1d1d' };

export default function DiseasePage() {
  const [data, setData] = useState<DiseaseDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiseaseDetection | null>(null);

  useEffect(() => { setTimeout(() => { setData(MOCK); setSelected(MOCK[0]); setLoading(false); }, 700); }, []);

  return (
    <div>
      <PageHeader
        title="Disease Detection"
        subtitle="AI-powered crop disease identification and treatment recommendations."
        breadcrumbs={[{ label: 'Disease Detection' }]}
        actions={<Button leftIcon={<MdUpload />} variant="outline">Upload Image</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
        <StatCard label="Total Detections" value={data.length.toString()} icon={<MdBugReport />} iconBg="var(--color-error-bg)" iconColor="var(--color-error)" />
        <StatCard label="Active Cases" value={data.filter(d => d.status !== 'Resolved').length.toString()} icon={<MdBugReport />} iconBg="var(--color-warning-bg)" iconColor="var(--color-warning)" />
        <StatCard label="Resolved" value={data.filter(d => d.status === 'Resolved').length.toString()} icon={<MdBugReport />} iconBg="var(--color-success-bg)" iconColor="var(--color-success)" />
        <StatCard label="Avg. Confidence" value={data.length ? `${Math.round(data.reduce((a, d) => a + d.confidence, 0) / data.length)}%` : '—'} icon={<MdBugReport />} iconBg="#DBEAFE" iconColor="var(--color-info)" />
      </div>

      <div className={styles.layout}>
        <div>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : data.map((d, i) => (
              <motion.div
                key={d.id}
                className={`${styles.card} ${selected?.id === d.id ? styles.cardActive : ''}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelected(d)}
              >
                <div className={styles.cardTop}>
                  <Badge variant={statusVariant(d.status)} dot>{d.status}</Badge>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(d.detectedAt).toLocaleDateString()}</span>
                </div>
                <h4 className={styles.diseaseName}>{d.disease}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.cropName} · {d.affectedArea}% affected</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: SEVERITY_COLOR[d.severity] }}>● {d.severity} severity</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confidence: {d.confidence}%</span>
                </div>
              </motion.div>
            ))
          }
        </div>

        <div>
          {selected ? (
            <Card>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{selected.disease}</h2>
                  <Badge variant={statusVariant(selected.status)} dot>{selected.status}</Badge>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Detected: {new Date(selected.detectedAt).toLocaleString()}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Crop', value: selected.cropName },
                  { label: 'Severity', value: selected.severity, color: SEVERITY_COLOR[selected.severity] },
                  { label: 'Confidence', value: `${selected.confidence}%` },
                  { label: 'Affected Area', value: `${selected.affectedArea}%` },
                  { label: 'Farm', value: `Farm #${selected.farmId}` },
                  { label: 'Status', value: selected.status },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{m.label}</p>
                    <p style={{ fontWeight: 700, color: (m as { color?: string }).color ?? 'var(--text-primary)' }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Confidence bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>AI Confidence</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-emerald)' }}>{selected.confidence}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selected.confidence}%`, background: 'linear-gradient(90deg, var(--color-emerald), var(--color-gold))', borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
              </div>

              <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: 12, padding: 16, borderLeft: '4px solid var(--color-error)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>💊 Treatment Protocol</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: 14 }}>{selected.treatment}</p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button variant="primary" size="sm">Mark as Treating</Button>
                <Button variant="outline" size="sm">Mark Resolved</Button>
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <MdBugReport size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Select a detection to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
