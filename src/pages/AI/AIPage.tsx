import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdAutoAwesome, MdTrendingUp, MdCheckCircle, MdWarning } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import type { CropRecommendation } from '../../types';
import styles from './AIPage.module.css';

const MOCK_RECS: CropRecommendation[] = [
  { id: '1', farmId: '1', cropName: 'Wheat', suitabilityScore: 92, expectedYield: 4.8, estimatedRevenue: 144000, waterRequirement: 'Low-Medium', soilRequirement: 'Alluvial, Well-drained', season: 'Rabi (Oct-Mar)', reasons: ['Optimal pH (6.8)', 'Good nitrogen levels', 'Suitable temperature range', 'Adequate rainfall expected'], risks: ['Monitor for rust disease', 'Late frost risk in March'] },
  { id: '2', farmId: '1', cropName: 'Mustard', suitabilityScore: 85, expectedYield: 1.9, estimatedRevenue: 95000, waterRequirement: 'Low', soilRequirement: 'Sandy Loam', season: 'Rabi (Oct-Feb)', reasons: ['Drought tolerant', 'Good for sandy loam', 'High market demand'], risks: ['Aphid infestation possible', 'Needs timely irrigation'] },
  { id: '3', farmId: '1', cropName: 'Potato', suitabilityScore: 78, expectedYield: 22, estimatedRevenue: 198000, waterRequirement: 'Medium-High', soilRequirement: 'Loamy, Well-drained', season: 'Winter (Nov-Feb)', reasons: ['Good soil structure', 'Cold season benefits', 'High revenue potential'], risks: ['Late blight risk', 'Requires intensive water management', 'Storage logistics needed'] },
];

export default function AIPage() {
  const [recs, setRecs] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CropRecommendation | null>(null);

  useEffect(() => { setTimeout(() => { setRecs(MOCK_RECS); setSelected(MOCK_RECS[0]); setLoading(false); }, 900); }, []);

  const chartData = recs.map(r => ({ name: r.cropName, score: r.suitabilityScore, revenue: r.estimatedRevenue / 1000 }));

  return (
    <div>
      <PageHeader
        title="AI Crop Recommendations"
        subtitle="Machine learning–driven crop recommendations based on soil, weather, and market data."
        breadcrumbs={[{ label: 'AI Recommendations' }]}
        actions={<Button leftIcon={<MdAutoAwesome />} variant="gold">Generate Recommendations</Button>}
      />

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 36 }}>🤖</div>
          <div>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>AI Analysis Complete</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Based on your soil analysis (pH 6.8, N:42%, P:28%, K:65%), historical weather patterns, current market prices, and your farm profile — here are the top crop recommendations for <strong>North Valley Farm</strong> for the upcoming Rabi season.
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Suitability Score Comparison</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Higher = better fit for your farm</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Bar dataKey="score" fill="#0F5E3A" radius={[4, 4, 0, 0]} name="Score %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Revenue Potential</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Estimated revenue (₹ thousands)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} formatter={(v) => [`₹${v}k`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Revenue ₹k" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className={styles.layout}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : recs.map((r, i) => (
              <motion.div
                key={r.id}
                className={`${styles.recCard} ${selected?.id === r.id ? styles.recCardActive : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelected(r)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{r.cropName}</h4>
                  <span style={{ fontWeight: 800, color: r.suitabilityScore >= 85 ? 'var(--color-success)' : 'var(--color-warning)', fontSize: 18 }}>{r.suitabilityScore}%</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.season}</p>
                <div style={{ marginTop: 10, height: 6, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.suitabilityScore}%`, background: 'linear-gradient(90deg, var(--color-emerald), var(--color-gold))', borderRadius: 99 }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Est. Revenue: <strong style={{ color: 'var(--color-gold)' }}>₹{r.estimatedRevenue.toLocaleString()}</strong></p>
              </motion.div>
            ))
          }
        </div>

        {selected && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{selected.cropName}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{selected.season}</p>
              </div>
              <Badge variant={selected.suitabilityScore >= 85 ? 'success' : 'warning'}>
                {selected.suitabilityScore}% Match
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { icon: '🌾', label: 'Expected Yield', value: `${selected.expectedYield} t/ha` },
                { icon: '💰', label: 'Est. Revenue', value: `₹${selected.estimatedRevenue.toLocaleString()}` },
                { icon: '💧', label: 'Water Need', value: selected.waterRequirement },
                { icon: '🪨', label: 'Soil Type', value: selected.soilRequirement },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{m.icon} {m.label}</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdCheckCircle color="var(--color-success)" /> Why this crop suits your farm
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.reasons.map(r => (
                  <li key={r} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>✓</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdWarning color="var(--color-warning)" /> Risk factors to watch
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.risks.map(r => (
                  <li key={r} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--color-warning)', flexShrink: 0 }}>⚠</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Button variant="primary" leftIcon={<MdTrendingUp />}>Add to Crop Plan</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
