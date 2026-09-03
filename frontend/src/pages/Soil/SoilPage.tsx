import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { MdScience, MdAdd, MdDelete } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { SearchFilter } from '../../components/ui/SearchFilter/SearchFilter';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Farm } from '../../types';
import styles from './SoilPage.module.css';

export default function SoilPage() {
  const [soils, setSoils] = useState<any[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSoil, setNewSoil] = useState<any>({ farmId: '', phLevel: '', nitrogen: '', phosphorus: '', potassium: '', organicCarbon: '', moisture: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [soilRes, farmsRes] = await Promise.all([
          api.get('/soil'),
          api.get('/farms')
        ]);
        setSoils(soilRes.data);
        setFarms(farmsRes.data);
        if (soilRes.data.length > 0) setSelected(soilRes.data[0]);
      } catch (error) {
        toast.error('Failed to load soil data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSoil = async () => {
    if (!newSoil.farmId) { toast.error('Please select a farm'); return; }
    
    const ph = Number(newSoil.phLevel);
    if (!newSoil.phLevel || isNaN(ph) || ph < 0.0 || ph > 14.0) {
      toast.error('pH must be between 0.0 and 14.0');
      return;
    }

    const n = Number(newSoil.nitrogen);
    if (newSoil.nitrogen === '' || isNaN(n) || n < 0 || n > 100) {
      toast.error('Nitrogen must be between 0% and 100%');
      return;
    }

    const p = Number(newSoil.phosphorus);
    if (newSoil.phosphorus === '' || isNaN(p) || p < 0 || p > 100) {
      toast.error('Phosphorus must be between 0% and 100%');
      return;
    }

    const k = Number(newSoil.potassium);
    if (newSoil.potassium === '' || isNaN(k) || k < 0 || k > 100) {
      toast.error('Potassium must be between 0% and 100%');
      return;
    }

    const oc = Number(newSoil.organicCarbon);
    if (newSoil.organicCarbon === '' || isNaN(oc) || oc < 0 || oc > 20) {
      toast.error('Organic Carbon must be between 0% and 20%');
      return;
    }

    const m = Number(newSoil.moisture);
    if (newSoil.moisture === '' || isNaN(m) || m < 0 || m > 100) {
      toast.error('Moisture must be between 0% and 100%');
      return;
    }

    if (n === 0 && p === 0 && k === 0 && oc === 0 && m === 0) {
      toast.error('Please provide valid soil test measurements (not all zeroes)');
      return;
    }

    try {
      const response = await api.post('/soil', {
        farmId: Number(newSoil.farmId),
        phLevel: ph,
        moisture: m,
        nitrogen: n,
        phosphorus: p,
        potassium: k,
        organicCarbon: oc
      });
      setSoils(prev => [response.data, ...prev]);
      setSelected(response.data);
      toast.success('Soil analysis added successfully');
      setShowAddModal(false);
      setNewSoil({ farmId: '', phLevel: '', nitrogen: '', phosphorus: '', potassium: '', organicCarbon: '', moisture: '' });
    } catch (error) {
      toast.error('Failed to add soil analysis');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/soil/${id}`);
      setSoils(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Soil analysis deleted');
    } catch (error) {
      toast.error('Failed to delete soil analysis');
    }
  };

  // Helper function to calculate status dynamically
  const getStatus = (s: any) => {
    if (!s) return 'Optimal';
    if (s.phLevel < 5.5 || s.nitrogen < 15) return 'Critical';
    if (s.phLevel < 6.0 || s.nitrogen < 30) return 'Needs Attention';
    return 'Optimal';
  };

  const filtered = soils.filter(s => 
    s.farm?.farmName?.toLowerCase().includes(search.toLowerCase()) || 
    s.farmName?.toLowerCase().includes(search.toLowerCase())
  );

  const radarData = selected ? [
    { nutrient: 'Nitrogen', value: selected.nitrogen || 0, max: 100 },
    { nutrient: 'Phosphorus', value: selected.phosphorus || 0, max: 100 },
    { nutrient: 'Potassium', value: selected.potassium || 0, max: 100 },
    { nutrient: 'Org. Carbon', value: (selected.organicCarbon || 0) * 10, max: 100 },
    { nutrient: 'Moisture', value: selected.moisture || 0, max: 100 },
  ] : [];

  return (
    <div>
      <PageHeader
        title="Soil Analysis"
        subtitle="Monitor soil health metrics across all farms."
        breadcrumbs={[{ label: 'Soil Analysis' }]}
        actions={<Button leftIcon={<MdAdd />} onClick={() => setShowAddModal(true)}>New Analysis</Button>}
      />

      <div className={styles.layout}>
        {/* List */}
        <div className={styles.list}>
          <SearchFilter searchValue={search} onSearchChange={setSearch} placeholder="Search farms..." />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : filtered.map((s, i) => {
                  const status = getStatus(s);
                  const farmName = s.farmName || 'Unknown Farm';
                  return (
                    <motion.div
                      key={s.id}
                      className={`${styles.soilCard} ${selected?.id === s.id ? styles.soilCardActive : ''}`}
                      style={{ background: 'var(--bg-secondary)', borderColor: selected?.id === s.id ? 'var(--color-gold)' : 'var(--border-color)' }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => setSelected(s)}
                    >
                      <div className={styles.soilCardTop}>
                        <div className={styles.soilIcon}><MdScience size={20} /></div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Badge variant={statusVariant(status)}>{status}</Badge>
                          <MdDelete size={18} style={{ cursor: 'pointer', color: 'var(--color-danger)' }} onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} />
                        </div>
                      </div>
                      <h4 className={styles.soilFarm}>{farmName}</h4>
                      <p className={styles.soilDate}>Sampled {s.recordedAt ? new Date(s.recordedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                      <div className={styles.soilStats}>
                        <span>pH {s.phLevel || 'N/A'}</span>
                        <span>N {s.nitrogen || 0}%</span>
                        <span>P {s.phosphorus || 0}%</span>
                        <span>K {s.potassium || 0}%</span>
                      </div>
                    </motion.div>
                  );
                })
            }
          </div>
        </div>

        {/* Detail */}
        <div className={styles.detail}>
          {selected ? (
            <Card>
              <div className={styles.detailHeader}>
                <div>
                  <h2 className={styles.detailTitle}>{selected.farmName || 'Unknown Farm'}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sample date: {selected.recordedAt ? new Date(selected.recordedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <Badge variant={statusVariant(getStatus(selected))} dot>{getStatus(selected)}</Badge>
              </div>

              <div className={styles.metricsGrid}>
                {[
                  { label: 'pH Level', value: selected.phLevel, unit: '', good: selected.phLevel >= 6 && selected.phLevel <= 7.5 },
                  { label: 'Nitrogen', value: selected.nitrogen, unit: '%', good: selected.nitrogen >= 30 },
                  { label: 'Phosphorus', value: selected.phosphorus, unit: '%', good: selected.phosphorus >= 20 },
                  { label: 'Potassium', value: selected.potassium, unit: '%', good: selected.potassium >= 50 },
                  { label: 'Org. Carbon', value: selected.organicCarbon, unit: '%', good: selected.organicCarbon >= 2.5 },
                  { label: 'Moisture', value: selected.moisture, unit: '%', good: selected.moisture >= 40 && selected.moisture <= 70 },
                ].map(m => (
                  <div key={m.label} className={styles.metricCard} style={{ borderColor: m.good ? 'var(--color-success)' : 'var(--color-warning)', background: 'var(--bg-secondary)' }}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.metricValue} style={{ color: m.good ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {m.value || 'N/A'}{m.unit}
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
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* UPDATED: AI Recommendation Box */}
              <div className={styles.recommendation} style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid var(--color-gold)', padding: 16, borderRadius: 10, marginTop: 20 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>🤖 AI Recommendation</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {selected.recommendation || "Analyzing soil data..."}
                </p>
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <MdScience size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Select a soil analysis to view details or add a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD SOIL MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Soil Analysis"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAddSoil}>Save Analysis</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Select Farm</label>
            <select 
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={newSoil.farmId} 
              onChange={e => setNewSoil({...newSoil, farmId: e.target.value})}
            >
              <option value="" disabled>Select a farm...</option>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <Input label="pH Level (0.0 - 14.0)" type="number" step="0.1" min="0" max="14" placeholder="e.g. 6.5" value={newSoil.phLevel} onChange={e => setNewSoil({...newSoil, phLevel: e.target.value})} />
          <Input label="Nitrogen (%) (0 - 100)" type="number" step="1" min="0" max="100" placeholder="e.g. 45" value={newSoil.nitrogen} onChange={e => setNewSoil({...newSoil, nitrogen: e.target.value})} />
          <Input label="Phosphorus (%) (0 - 100)" type="number" step="1" min="0" max="100" placeholder="e.g. 30" value={newSoil.phosphorus} onChange={e => setNewSoil({...newSoil, phosphorus: e.target.value})} />
          <Input label="Potassium (%) (0 - 100)" type="number" step="1" min="0" max="100" placeholder="e.g. 60" value={newSoil.potassium} onChange={e => setNewSoil({...newSoil, potassium: e.target.value})} />
          <Input label="Organic Carbon (%) (0 - 20)" type="number" step="0.1" min="0" max="20" placeholder="e.g. 2.5" value={newSoil.organicCarbon} onChange={e => setNewSoil({...newSoil, organicCarbon: e.target.value})} />
          <Input label="Moisture (%) (0 - 100)" type="number" step="1" min="0" max="100" placeholder="e.g. 55" value={newSoil.moisture} onChange={e => setNewSoil({...newSoil, moisture: e.target.value})} />
        </div>
      </Modal>
    </div>
  );
}