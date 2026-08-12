import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { MdScience, MdAdd } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { SearchFilter } from '../../components/ui/SearchFilter/SearchFilter';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { SoilAnalysis } from '../../types';
import styles from './SoilPage.module.css';

const MOCK_SOIL: SoilAnalysis[] = [
  { id: '1', farmId: '1', farmName: 'North Valley Farm', sampleDate: '2024-12-01', ph: 6.8, nitrogen: 42, phosphorus: 28, potassium: 65, organicMatter: 3.2, moisture: 55, recommendation: 'Add nitrogen-rich fertilizer; optimal pH range maintained.', status: 'Optimal' },
  { id: '2', farmId: '2', farmName: 'Riverside Estate', sampleDate: '2024-11-20', ph: 5.2, nitrogen: 18, phosphorus: 12, potassium: 40, organicMatter: 1.8, moisture: 38, recommendation: 'Soil is acidic — apply lime. Increase nitrogen and phosphorus inputs.', status: 'Needs Attention' },
  { id: '3', farmId: '3', farmName: 'Golden Fields', sampleDate: '2024-11-15', ph: 4.1, nitrogen: 8, phosphorus: 5, potassium: 22, organicMatter: 0.9, moisture: 20, recommendation: 'Critical pH levels detected. Immediate liming required. High risk of nutrient lockout.', status: 'Critical' },
];

export default function SoilPage() {
  const [soils, setSoils] = useState<SoilAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SoilAnalysis | null>(null);

  useEffect(() => { setTimeout(() => { setSoils(MOCK_SOIL); setSelected(MOCK_SOIL[0]); setLoading(false); }, 700); }, []);

  const filtered = soils.filter(s => s.farmName.toLowerCase().includes(search.toLowerCase()));

  const radarData = selected ? [
    { nutrient: 'Nitrogen', value: selected.nitrogen, max: 100 },
    { nutrient: 'Phosphorus', value: selected.phosphorus, max: 100 },
    { nutrient: 'Potassium', value: selected.potassium, max: 100 },
    { nutrient: 'Org. Matter', value: selected.organicMatter * 10, max: 100 },
    { nutrient: 'Moisture', value: selected.moisture, max: 100 },
  ] : [];

  return (
    <div>
      <PageHeader
        title="Soil Analysis"
        subtitle="Monitor soil health metrics across all farms."
        breadcrumbs={[{ label: 'Soil Analysis' }]}
        actions={<Button leftIcon={<MdAdd />}>New Analysis</Button>}
      />

      <div className={styles.layout}>
        {/* List */}
        <div className={styles.list}>
          <SearchFilter searchValue={search} onSearchChange={setSearch} placeholder="Search farms..." />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : filtered.map((s, i) => (
                <motion.div
                  key={s.id}
                  className={`${styles.soilCard} ${selected?.id === s.id ? styles.soilCardActive : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setSelected(s)}
                >
                  <div className={styles.soilCardTop}>
                    <div className={styles.soilIcon}><MdScience size={20} /></div>
                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                  </div>
                  <h4 className={styles.soilFarm}>{s.farmName}</h4>
                  <p className={styles.soilDate}>Sampled {new Date(s.sampleDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div className={styles.soilStats}>
                    <span>pH {s.ph}</span>
                    <span>N {s.nitrogen}%</span>
                    <span>P {s.phosphorus}%</span>
                    <span>K {s.potassium}%</span>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </div>

        {/* Detail */}
        <div className={styles.detail}>
          {selected ? (
            <Card>
              <div className={styles.detailHeader}>
                <div>
                  <h2 className={styles.detailTitle}>{selected.farmName}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sample date: {new Date(selected.sampleDate).toLocaleDateString()}</p>
                </div>
                <Badge variant={statusVariant(selected.status)} dot>{selected.status}</Badge>
              </div>

              <div className={styles.metricsGrid}>
                {[
                  { label: 'pH Level', value: selected.ph, unit: '', good: selected.ph >= 6 && selected.ph <= 7.5 },
                  { label: 'Nitrogen', value: selected.nitrogen, unit: '%', good: selected.nitrogen >= 30 },
                  { label: 'Phosphorus', value: selected.phosphorus, unit: '%', good: selected.phosphorus >= 20 },
                  { label: 'Potassium', value: selected.potassium, unit: '%', good: selected.potassium >= 50 },
                  { label: 'Organic Matter', value: selected.organicMatter, unit: '%', good: selected.organicMatter >= 2.5 },
                  { label: 'Moisture', value: selected.moisture, unit: '%', good: selected.moisture >= 40 && selected.moisture <= 70 },
                ].map(m => (
                  <div key={m.label} className={styles.metricCard} style={{ borderColor: m.good ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricValue} style={{ color: m.good ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {m.value}{m.unit}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Nutrient Profile</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="nutrient" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Radar dataKey="value" stroke="#0F5E3A" fill="#0F5E3A" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.recommendation}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>💡 Recommendation</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.recommendation}</p>
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <MdScience size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Select a soil analysis to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
