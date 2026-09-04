import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  MdAutoAwesome, MdTrendingUp, MdCheckCircle, MdWarning,
  MdChat, MdSend, MdWaterDrop, MdScience, MdLandscape,
  MdTune, MdDeleteOutline, MdRestartAlt
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import api from '../../services/api';
import type { CropRecommendation, Farm, SoilAnalysis } from '../../types';
import styles from './AIPage.module.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  "How to prepare soil before wheat sowing?",
  "What is the best N-P-K fertilizer ratio for tomatoes?",
  "Organic remedies for whitefly & aphid control",
  "How does soil pH affect phosphorus availability?"
];

export default function AIPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'chat'>('recommendations');

  // Farm & Soil State
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('Rabi (Winter Oct-Mar)');
  const [soilData, setSoilData] = useState<SoilAnalysis | null>(null);

  // Farmer's Custom Target Crops and Custom Parameters
  const [preferredCrops, setPreferredCrops] = useState('');
  const [showCustomSoil, setShowCustomSoil] = useState(false);
  const [customParams, setCustomParams] = useState({
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    moisture: ''
  });

  // Recommendations State
  const [recs, setRecs] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [selected, setSelected] = useState<CropRecommendation | null>(null);

  // Persistent Chat State (saved to localStorage per user email)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const storageKey = `farmverse_chat_${user?.email || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved chat', e);
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello ${user?.name || 'Farmer'}! I am FarmVerse AI, your intelligent agronomy advisor. Ask me anything about crop planning, soil chemistry, pest management, or irrigation cycles.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [showClearChatDialog, setShowClearChatDialog] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      const storageKey = `farmverse_chat_${user?.email || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat to localStorage', e);
    }
  }, [messages, user?.email]);

  // 1. Initial Data Load
  useEffect(() => {
    const loadFarms = async () => {
      try {
        setLoading(true);
        const { data: farmList } = await api.get<Farm[]>('/farms');
        setFarms(farmList || []);
        if (farmList && farmList.length > 0) {
          const firstFarm = farmList[0];
          setSelectedFarmId(String(firstFarm.id));
          loadFarmDetails(firstFarm.id);
        }
      } catch (err) {
        console.error('Failed to load farms', err);
      } finally {
        setLoading(false);
      }
    };
    loadFarms();
  }, []);

  // 2. Load Soil and Existing Recommendations for selected farm
  const loadFarmDetails = async (farmId: string | number) => {
    try {
      // Fetch soil data from backend endpoint
      const { data: soilList } = await api.get<any[]>(`/soil/farm/${farmId}`).catch(() => ({ data: [] }));
      if (soilList && soilList.length > 0) {
        const latest = soilList[0];
        setSoilData({
          id: String(latest.id),
          farmId: String(farmId),
          farmName: latest.farmName || 'Selected Farm',
          sampleDate: latest.recordedAt || '',
          ph: latest.phLevel || 6.8,
          nitrogen: latest.nitrogen || 42,
          phosphorus: latest.phosphorus || 28,
          potassium: latest.potassium || 65,
          organicMatter: latest.organicCarbon || 0.6,
          moisture: latest.moisture || 35,
          recommendation: latest.recommendation || '',
          status: 'Optimal'
        });
      } else {
        setSoilData(null);
      }

      // Fetch saved recommendations
      const saved = await aiService.getSavedRecommendations(Number(farmId)).catch(() => []);
      if (saved.length > 0) {
        setRecs(saved);
        setSelected(saved[0]);
      } else {
        setRecs([]);
        setSelected(null);
      }
    } catch (err) {
      console.error('Error loading farm details', err);
    }
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    if (id) {
      loadFarmDetails(id);
    }
  };

  // 3. Generate New AI Recommendations
  const handleGenerateRecommendations = async () => {
    if (!selectedFarmId) {
      toast.error('Please select a farm plot');
      return;
    }
    try {
      setGenerating(true);
      const payload: any = {
        farmId: Number(selectedFarmId),
        season: selectedSeason,
        preferredCrops: preferredCrops.trim() || undefined
      };

      if (customParams.ph) payload.customPh = Number(customParams.ph);
      if (customParams.nitrogen) payload.customNitrogen = Number(customParams.nitrogen);
      if (customParams.phosphorus) payload.customPhosphorus = Number(customParams.phosphorus);
      if (customParams.potassium) payload.customPotassium = Number(customParams.potassium);
      if (customParams.moisture) payload.customMoisture = Number(customParams.moisture);

      const generated = await aiService.generateRecommendations(payload);
      setRecs(generated);
      if (generated.length > 0) {
        setSelected(generated[0]);
        toast.success(`Generated ${generated.length} crop recommendations tailored to your farm!`);
      } else {
        toast.error('No recommendations returned. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to generate recommendations', err);
      toast.error(err.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  // 4. One-Click Adopt to Active Crop Plan
  const handleAdoptCrop = async () => {
    if (!selected || !selectedFarmId) return;
    try {
      setAdopting(true);
      await aiService.adoptCrop({
        farmId: Number(selectedFarmId),
        cropName: selected.cropName,
        variety: 'Recommended High-Yield Variety',
        season: selected.season,
        area: 2.0
      });
      toast.success(`🎉 ${selected.cropName} successfully added to your active Crop Lifecycle!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add crop to plan');
    } finally {
      setAdopting(false);
    }
  };

  // 5. Send Chat Message to Gemini AI
  const handleSendMessage = async (customText?: string) => {
    const text = customText || chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const historyContext = messages.slice(-4).map(m => `${m.sender}: ${m.text}`).join('\n');
      const res = await aiService.chatWithAdvisory(text, historyContext, selectedFarmId ? Number(selectedFarmId) : undefined);

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      toast.error('Failed to receive AI reply');
    } finally {
      setChatLoading(false);
    }
  };

  // Clear Chat History
  const handleClearChat = () => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      sender: 'ai',
      text: `Chat history cleared! Ask me anything about crop planning, soil chemistry, or pest management.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
    localStorage.removeItem(`farmverse_chat_${user?.email || 'guest'}`);
    setShowClearChatDialog(false);
    toast.success('Chat history cleared');
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentFarm = farms.find(f => String(f.id) === selectedFarmId);
  const chartData = recs.map(r => ({
    name: r.cropName.split(' ')[0],
    score: r.suitabilityScore,
    revenue: Math.round(r.estimatedRevenue / 1000)
  }));

  // Active parameter values (reflecting custom overrides if set)
  const activePh = customParams.ph ? `${customParams.ph} (Custom)` : (soilData ? `${soilData.ph} (Lab)` : '6.8 (Baseline)');
  const activeN = customParams.nitrogen ? `${customParams.nitrogen} kg/ha (Custom)` : (soilData ? `${soilData.nitrogen} kg/ha (Lab)` : '42 kg/ha');
  const activeP = customParams.phosphorus ? `${customParams.phosphorus} kg/ha (Custom)` : (soilData ? `${soilData.phosphorus} kg/ha (Lab)` : '28 kg/ha');
  const activeK = customParams.potassium ? `${customParams.potassium} kg/ha (Custom)` : (soilData ? `${soilData.potassium} kg/ha (Lab)` : '65 kg/ha');
  const activeM = customParams.moisture ? `${customParams.moisture}% (Custom)` : (soilData ? `${soilData.moisture}% (Lab)` : '35%');

  return (
    <div>
      <PageHeader
        title="AI Agricultural Intelligence & Crop Advisory"
        subtitle="Soil chemistry and meteorological synthesis powering precision crop suitability and conversational advisory."
        breadcrumbs={[{ label: 'AI Advisory' }]}
        actions={
          <Button
            leftIcon={<MdAutoAwesome />}
            variant="gold"
            loading={generating}
            onClick={handleGenerateRecommendations}
            disabled={!selectedFarmId}
          >
            {generating ? 'Analyzing Soil & Weather...' : 'Generate Recommendations'}
          </Button>
        }
      />

      {/* DUAL TAB SWITCHER */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'recommendations' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <MdTrendingUp size={18} /> Crop Suitability Engine
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MdChat size={18} /> FarmVerse AI Chatbot
        </button>
      </div>

      {activeTab === 'recommendations' ? (
        <>
          {/* Farm & Real Soil Condition Banner */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdAutoAwesome color="var(--color-gold, #D4AF37)" />
                  Target Farm & Soil Environment
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Synthesizing real N-P-K chemical levels and geographic climate to rank high-yield crops.
                </p>
              </div>

              {/* Farm and Season Selectors */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}
                  value={selectedFarmId}
                  onChange={handleFarmChange}
                >
                  {farms.length === 0 && <option value="">No farms found</option>}
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
                  ))}
                </select>

                <select
                  style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(e.target.value)}
                >
                  <option value="Rabi (Winter Oct-Mar)">Rabi (Winter: Oct-Mar)</option>
                  <option value="Kharif (Monsoon Jun-Oct)">Kharif (Monsoon: Jun-Oct)</option>
                  <option value="Zaid (Summer Mar-Jun)">Zaid (Summer: Mar-Jun)</option>
                  <option value="Annual Commercial Crop">Annual Commercial Crop</option>
                </select>

                <Button
                  variant={showCustomSoil ? 'primary' : 'outline'}
                  size="sm"
                  leftIcon={<MdTune />}
                  onClick={() => setShowCustomSoil(!showCustomSoil)}
                >
                  {showCustomSoil ? 'Hide Parameters' : 'Custom Parameters'}
                </Button>
              </div>
            </div>

            {/* Optional Farmer Custom Crops Input */}
            <div style={{ marginTop: 14 }}>
              <Input
                label="Optional: Specify Target Crops to Analyze (e.g. Watermelon, Cotton, Maize, Tomato, Soybean)"
                placeholder="Leave blank to let AI auto-select the top 3 crops, or type crops you wish to evaluate..."
                value={preferredCrops}
                onChange={e => setPreferredCrops(e.target.value)}
              />
            </div>

            {/* Custom Soil Chemistry Controls */}
            {showCustomSoil && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Manual Soil Parameter Simulation (What-If Analysis)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomParams({ ph: '', nitrogen: '', phosphorus: '', potassium: '', moisture: '' })}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary, #3B82F6)', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <MdRestartAlt size={14} /> Reset to Lab Test
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <Input
                    label="pH (0-14)"
                    type="number"
                    step="0.1"
                    placeholder={soilData ? String(soilData.ph) : '6.8'}
                    value={customParams.ph}
                    onChange={e => setCustomParams({ ...customParams, ph: e.target.value })}
                  />
                  <Input
                    label="N (kg/ha)"
                    type="number"
                    placeholder={soilData ? String(soilData.nitrogen) : '42'}
                    value={customParams.nitrogen}
                    onChange={e => setCustomParams({ ...customParams, nitrogen: e.target.value })}
                  />
                  <Input
                    label="P (kg/ha)"
                    type="number"
                    placeholder={soilData ? String(soilData.phosphorus) : '28'}
                    value={customParams.phosphorus}
                    onChange={e => setCustomParams({ ...customParams, phosphorus: e.target.value })}
                  />
                  <Input
                    label="K (kg/ha)"
                    type="number"
                    placeholder={soilData ? String(soilData.potassium) : '65'}
                    value={customParams.potassium}
                    onChange={e => setCustomParams({ ...customParams, potassium: e.target.value })}
                  />
                  <Input
                    label="Moisture (%)"
                    type="number"
                    placeholder={soilData ? String(soilData.moisture) : '35'}
                    value={customParams.moisture}
                    onChange={e => setCustomParams({ ...customParams, moisture: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Live Soil Chemistry Chips */}
            <div className={styles.conditionBar}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Soil Parameters:
              </span>
              <span className={styles.conditionChip}>
                <MdScience size={14} color="var(--color-primary, #3B82F6)" />
                pH: <strong>{activePh}</strong>
              </span>
              <span className={styles.conditionChip}>
                Nitrogen (N): <strong>{activeN}</strong>
              </span>
              <span className={styles.conditionChip}>
                Phosphorus (P): <strong>{activeP}</strong>
              </span>
              <span className={styles.conditionChip}>
                Potassium (K): <strong>{activeK}</strong>
              </span>
              <span className={styles.conditionChip}>
                <MdWaterDrop size={14} color="var(--color-primary, #3B82F6)" />
                Moisture: <strong>{activeM}</strong>
              </span>
              <span className={styles.conditionChip}>
                <MdLandscape size={14} color="var(--color-emerald, #10B981)" />
                Soil Type: <strong>{currentFarm?.soilType || 'Alluvial Loam'}</strong>
              </span>
            </div>
          </Card>

          {/* Comparison Analytics Charts */}
          {recs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
              <Card>
                <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Suitability Score Comparison</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Calculated by Gemini AI based on pH & moisture tolerance</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                    <Bar dataKey="score" fill="#10B981" radius={[4, 4, 0, 0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Revenue Potential</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Estimated gross revenue realization (₹ in thousands)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} formatter={(v) => [`₹${v}k`, 'Estimated Revenue']} />
                    <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Revenue ₹k" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Recommendations Layout */}
          <div className={styles.layout}>
            {/* Left Column: Crop List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loading || generating ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : recs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                  <MdAutoAwesome size={40} style={{ opacity: 0.3, marginBottom: 10, color: 'var(--color-gold, #D4AF37)' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No Active Crop Recommendations</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Click &ldquo;Generate Recommendations&rdquo; to analyze your farm&apos;s soil and weather.
                  </p>
                  <Button variant="primary" size="sm" onClick={handleGenerateRecommendations}>
                    Generate Now
                  </Button>
                </div>
              ) : (
                recs.map((r, i) => (
                  <motion.div
                    key={r.id || i}
                    className={`${styles.recCard} ${selected?.id === r.id ? styles.recCardActive : ''}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setSelected(r)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <h4 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{r.cropName}</h4>
                      <span style={{ fontWeight: 800, color: r.suitabilityScore >= 85 ? 'var(--color-emerald, #10B981)' : 'var(--color-gold, #D4AF37)', fontSize: 18 }}>
                        {r.suitabilityScore}%
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.season}</p>
                    <div style={{ marginTop: 10, height: 6, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.suitabilityScore}%`, background: 'linear-gradient(90deg, var(--color-emerald, #10B981), var(--color-gold, #D4AF37))', borderRadius: 99 }} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                      Est. Revenue: <strong style={{ color: 'var(--color-gold, #D4AF37)' }}>₹{Math.round(r.estimatedRevenue).toLocaleString()}</strong>
                    </p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Right Column: Detailed Crop Card */}
            {selected ? (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{selected.cropName}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{selected.season}</p>
                  </div>
                  <Badge variant={selected.suitabilityScore >= 85 ? 'success' : 'warning'}>
                    {selected.suitabilityScore}% Suitability Match
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { icon: '🌾', label: 'Expected Yield', value: `${selected.expectedYield} t/ha` },
                    { icon: '💰', label: 'Est. Revenue', value: `₹${Math.round(selected.estimatedRevenue).toLocaleString()}` },
                    { icon: '💧', label: 'Water Need', value: selected.waterRequirement },
                    { icon: '🪨', label: 'Soil Type', value: selected.soilRequirement },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        {m.icon} {m.label}
                      </p>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Compatibility Reasons */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdCheckCircle color="var(--color-emerald, #10B981)" /> Why this crop matches your soil & climate
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.reasons.map((r, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--color-emerald, #10B981)', flexShrink: 0 }}>✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdWarning color="var(--color-warning, #F59E0B)" /> Agronomic risks to monitor
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.risks.map((risk, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--color-warning, #F59E0B)', flexShrink: 0 }}>⚠</span> {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Adopt Crop Action Button */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    variant="primary"
                    leftIcon={<MdTrendingUp />}
                    loading={adopting}
                    onClick={handleAdoptCrop}
                  >
                    Add to Active Crop Plan
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('chat')}>
                    Ask AI About This Crop
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </>
      ) : (
        /* CONVERSATIONAL AI CHATBOT TAB */
        <div className={styles.chatContainer}>
          {/* Chat Header with Clear Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-emerald, #10B981)', display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                FarmVerse AI Agronomy Assistant
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<MdDeleteOutline />}
              onClick={() => setShowClearChatDialog(true)}
              style={{ color: 'var(--color-error, #EF4444)' }}
            >
              Clear Chat
            </Button>
          </div>

          <div className={styles.chatMessages}>
            {messages.map(m => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${m.sender === 'user' ? styles.userRow : styles.aiRow}`}
              >
                <div className={`${styles.avatar} ${m.sender === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
                  {m.sender === 'user' ? '👤' : '🤖'}
                </div>
                <div>
                  <div className={`${styles.bubble} ${m.sender === 'user' ? styles.userBubble : styles.aiBubble}`}>
                    <p style={{ whiteSpace: 'pre-line' }}>{m.text}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
                <div className={`${styles.avatar} ${styles.aiAvatar}`}>🤖</div>
                <div className={`${styles.bubble} ${styles.aiBubble}`}>
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>FarmVerse AI is thinking...</p>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick suggestions */}
          <div className={styles.suggestionBar}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              Suggestions:
            </span>
            {suggestions.map((s, i) => (
              <button key={i} className={styles.suggestionChip} onClick={() => handleSendMessage(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            className={styles.chatInputBar}
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          >
            <input
              className={styles.chatInput}
              placeholder="Ask FarmVerse AI anything about fertilizers, sowing dates, pest remedies..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={chatLoading}
            />
            <Button type="submit" variant="primary" leftIcon={<MdSend />} disabled={!chatInput.trim() || chatLoading}>
              Send
            </Button>
          </form>
        </div>
      )}

      {/* Clear Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearChatDialog}
        onClose={() => setShowClearChatDialog(false)}
        onConfirm={handleClearChat}
        title="Clear Chat History"
        message="Are you sure you want to delete all chat messages? This cannot be undone."
      />
    </div>
  );
}
