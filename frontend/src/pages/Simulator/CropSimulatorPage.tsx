import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  MdAutoAwesome, MdWaterDrop, MdScience, MdThermostat, MdCalendarToday,
  MdBugReport, MdSave, MdCompare, MdDelete, MdClose, MdTrendingUp,
  MdTrendingDown, MdShield, MdEnergySavingsLeaf, MdLightbulb
} from 'react-icons/md';
import { toast } from 'react-hot-toast';

import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Modal } from '../../components/ui/Modal/Modal';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

import api from '../../services/api';
import { simulationService } from '../../services/simulationService';
import type {
  Farm, Crop, CropSimulationRequest, CropSimulationResult,
  SavedScenarioSummary, SimulationPreset
} from '../../types';
import styles from './CropSimulatorPage.module.css';

const DEFAULT_CROPS = [
  'Wheat', 'Rice', 'Cotton', 'Tomato', 'Maize', 'Sugarcane', 'Soybean', 'Potato', 'Onion'
];

export default function CropSimulatorPage() {
  // Farms & Crops State
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropName, setSelectedCropName] = useState<string>('Wheat');

  // Simulator Sliders & Inputs State
  const [scenarioName, setScenarioName] = useState<string>('Custom What-If Run');
  const [waterAdjustment, setWaterAdjustment] = useState<number>(0); // -50% to +50%
  const [fertilizerAdjustment, setFertilizerAdjustment] = useState<number>(100); // 0% to 200%
  const [tempOffset, setTempOffset] = useState<number>(0.0); // -3.0°C to +5.0°C
  const [sowingShift, setSowingShift] = useState<number>(0); // -15 to +30 days
  const [pestPressure, setPestPressure] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [irrigationMethod, setIrrigationMethod] = useState<'FLOOD' | 'DRIP' | 'SPRINKLER' | 'MULCH_DRIP'>('FLOOD');

  // Calculation Results & State
  const [simulationResult, setSimulationResult] = useState<CropSimulationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [presets, setPresets] = useState<SimulationPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Saved Scenarios Drawer State
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioSummary[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [scenarioNameToSave, setScenarioNameToSave] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<any>(null);

  // 1. Load Initial Farms and Presets
  useEffect(() => {
    const initData = async () => {
      try {
        const [farmsRes, presetsRes] = await Promise.all([
          api.get('/farms'),
          simulationService.getPresets()
        ]);
        const farmList: Farm[] = Array.isArray(farmsRes.data) ? farmsRes.data : (farmsRes.data?.data || []);
        setFarms(farmList);
        if (farmList.length > 0 && selectedFarmId === null) {
          setSelectedFarmId(Number(farmList[0].id));
        }
        setPresets(presetsRes);
      } catch {
        toast.error('Failed to initialize simulation parameters.');
      }
    };
    initData();
  }, []);

  // 2. Load Crops & Saved Scenarios for Selected Farm
  const loadFarmData = useCallback(async (farmId: number) => {
    try {
      const [cropsRes, savedRes] = await Promise.allSettled([
        api.get('/crops'),
        simulationService.getSaved(farmId)
      ]);

      if (cropsRes.status === 'fulfilled') {
        const list: Crop[] = Array.isArray(cropsRes.value.data) ? cropsRes.value.data : (cropsRes.value.data?.data || []);
        const farmCrops = list.filter(c => Number(c.farmId) === Number(farmId));
        setCrops(farmCrops);
        if (farmCrops.length > 0 && farmCrops[0].name) {
          setSelectedCropName(farmCrops[0].name);
        }
      }

      if (savedRes.status === 'fulfilled') {
        setSavedScenarios(savedRes.value);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId !== null) {
      loadFarmData(selectedFarmId);
    }
  }, [selectedFarmId, loadFarmData]);

  // 3. Trigger Simulation Calculation (Debounced)
  const runCalculation = useCallback(async () => {
    if (!selectedFarmId) return;
    setIsCalculating(true);

    const payload: CropSimulationRequest = {
      farmId: selectedFarmId,
      cropName: selectedCropName,
      scenarioName: scenarioName,
      waterAdjustmentPercent: waterAdjustment,
      fertilizerAdjustmentPercent: fertilizerAdjustment,
      temperatureOffset: tempOffset,
      sowingShiftDays: sowingShift,
      pestPressure: pestPressure,
      irrigationMethod: irrigationMethod
    };

    try {
      const res = await simulationService.calculate(payload);
      setSimulationResult(res);
    } catch {
      // Quiet fail on rapid slide
    } finally {
      setIsCalculating(false);
    }
  }, [
    selectedFarmId, selectedCropName, scenarioName,
    waterAdjustment, fertilizerAdjustment, tempOffset,
    sowingShift, pestPressure, irrigationMethod
  ]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runCalculation();
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [runCalculation]);

  // 4. Handle Preset Selection
  const handleSelectPreset = (preset: SimulationPreset) => {
    setActivePresetId(preset.id);
    setScenarioName(preset.title);
    setWaterAdjustment(preset.waterAdjustmentPercent);
    setFertilizerAdjustment(preset.fertilizerAdjustmentPercent);
    setTempOffset(preset.temperatureOffset);
    setSowingShift(preset.sowingShiftDays);
    setPestPressure(preset.pestPressure);
    setIrrigationMethod(preset.irrigationMethod);
    toast(`Preset applied: ${preset.title}`, { icon: preset.icon });
  };

  // 5. Handle Save Scenario
  const handleOpenSaveModal = () => {
    setScenarioNameToSave(scenarioName || `${selectedCropName} What-If Run`);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving scenario simulation...');

    const payload: CropSimulationRequest = {
      farmId: selectedFarmId,
      cropName: selectedCropName,
      scenarioName: scenarioNameToSave.trim() || 'Custom Scenario',
      waterAdjustmentPercent: waterAdjustment,
      fertilizerAdjustmentPercent: fertilizerAdjustment,
      temperatureOffset: tempOffset,
      sowingShiftDays: sowingShift,
      pestPressure: pestPressure,
      irrigationMethod: irrigationMethod
    };

    try {
      const saved = await simulationService.save(payload);
      setSimulationResult(saved);
      toast.success('Simulation scenario saved to your farm ledger!', { id: toastId });
      setIsSaveModalOpen(false);
      loadFarmData(selectedFarmId);
    } catch {
      toast.error('Failed to save simulation scenario.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Delete Saved Scenario
  const handleDeleteScenario = async (id: number) => {
    try {
      await simulationService.delete(id);
      setSavedScenarios(prev => prev.filter(s => s.id !== id));
      toast.success('Scenario deleted.');
    } catch {
      toast.error('Failed to delete scenario.');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Generative Crop Simulator & 'What-If' Yield Engine"
        subtitle="Simulate climatic shocks, NPK fertilizer variations, and irrigation transitions to project harvest yields and profit margins before planting."
        breadcrumbs={[{ label: 'Crop Simulator' }]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Farm Selector */}
            {farms.length > 0 && (
              <select
                value={selectedFarmId || ''}
                onChange={e => setSelectedFarmId(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location || 'Active'})
                  </option>
                ))}
              </select>
            )}

            {/* Crop Selector */}
            <select
              value={selectedCropName}
              onChange={e => {
                setSelectedCropName(e.target.value);
                setActivePresetId(null);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {DEFAULT_CROPS.map(c => (
                <option key={c} value={c}>
                  🌾 {c}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              leftIcon={<MdCompare />}
              onClick={() => setIsDrawerOpen(true)}
            >
              Saved Scenarios ({savedScenarios.length})
            </Button>

            <Button
              variant="primary"
              leftIcon={<MdSave />}
              onClick={handleOpenSaveModal}
            >
              Save Scenario
            </Button>
          </div>
        }
      />

      {/* Benchmark Presets Bar */}
      <div className={styles.presetsSection}>
        <div className={styles.presetsHeader}>
          <span className={styles.presetsTitle}>⚡ Quick Climate & Agronomic Benchmark Presets</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click to test resilience against real-world scenarios</span>
        </div>
        <div className={styles.presetsGrid}>
          {presets.map(p => (
            <div
              key={p.id}
              className={`${styles.presetCard} ${activePresetId === p.id ? styles.presetCardActive : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              <span className={styles.presetIcon}>{p.icon}</span>
              <div>
                <div className={styles.presetName}>{p.title}</div>
                <div className={styles.presetDesc}>{p.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Live Telemetry Projections on Right */}
      <div className={styles.simulatorGrid}>
        {/* Left Column: Interactive Agronomic Sliders */}
        <div className={styles.slidersColumn}>
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdScience style={{ color: 'var(--color-emerald)' }} /> Agronomic Stress & Input Matrix
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 1. Water Supply Slider */}
              <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                  <label className={styles.controlLabel}>
                    <MdWaterDrop style={{ color: '#0284C7' }} /> Water / Irrigation Availability
                  </label>
                  <span className={styles.controlValueBadge} style={{ color: waterAdjustment < 0 ? '#ef4444' : (waterAdjustment === 0 ? '#107850' : '#0284C7') }}>
                    {waterAdjustment > 0 ? `+${waterAdjustment}%` : `${waterAdjustment}%`}
                    {waterAdjustment <= -30 ? ' (Drought)' : (waterAdjustment < 0 ? ' (Deficit)' : (waterAdjustment === 0 ? ' (Optimal)' : ' (Excess)'))}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={waterAdjustment}
                  onChange={e => {
                    setWaterAdjustment(parseInt(e.target.value));
                    setActivePresetId(null);
                  }}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderLabels}>
                  <span>-50% (Severe Drought)</span>
                  <span>0% (Optimal)</span>
                  <span>+50% (Waterlogging)</span>
                </div>
              </div>

              {/* 2. NPK Fertilizer Dosage */}
              <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                  <label className={styles.controlLabel}>
                    🧪 NPK Fertilizer Dosage
                  </label>
                  <span className={styles.controlValueBadge} style={{ color: fertilizerAdjustment > 140 ? '#ef4444' : (fertilizerAdjustment >= 90 && fertilizerAdjustment <= 120 ? '#107850' : '#f59e0b') }}>
                    {fertilizerAdjustment}%
                    {fertilizerAdjustment > 140 ? ' (Chemical Burn)' : (fertilizerAdjustment < 70 ? ' (Deficient)' : ' (Balanced)')}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={fertilizerAdjustment}
                  onChange={e => {
                    setFertilizerAdjustment(parseInt(e.target.value));
                    setActivePresetId(null);
                  }}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderLabels}>
                  <span>0% (Zero Input)</span>
                  <span>100% (Recommended)</span>
                  <span>200% (Over-fertilization)</span>
                </div>
              </div>

              {/* 3. Temperature Offset */}
              <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                  <label className={styles.controlLabel}>
                    <MdThermostat style={{ color: '#f59e0b' }} /> Temperature Shift
                  </label>
                  <span className={styles.controlValueBadge} style={{ color: tempOffset > 1.5 ? '#ef4444' : (tempOffset < -1.0 ? '#0284C7' : '#107850') }}>
                    {tempOffset > 0 ? `+${tempOffset.toFixed(1)}°C` : `${tempOffset.toFixed(1)}°C`}
                    {tempOffset >= 2.0 ? ' (Heatwave)' : (tempOffset <= -1.5 ? ' (Cold Shock)' : ' (Normal)')}
                  </span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="5.0"
                  step="0.5"
                  value={tempOffset}
                  onChange={e => {
                    setTempOffset(parseFloat(e.target.value));
                    setActivePresetId(null);
                  }}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderLabels}>
                  <span>-3.0°C (Frost)</span>
                  <span>0.0°C (Seasonal)</span>
                  <span>+5.0°C (Extreme Heat)</span>
                </div>
              </div>

              {/* 4. Sowing Date Shift */}
              <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                  <label className={styles.controlLabel}>
                    <MdCalendarToday style={{ color: '#8b5cf6' }} /> Sowing Date Shift
                  </label>
                  <span className={styles.controlValueBadge}>
                    {sowingShift > 0 ? `+${sowingShift} Days Late` : (sowingShift < 0 ? `${Math.abs(sowingShift)} Days Early` : 'On-Time')}
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="30"
                  step="3"
                  value={sowingShift}
                  onChange={e => {
                    setSowingShift(parseInt(e.target.value));
                    setActivePresetId(null);
                  }}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderLabels}>
                  <span>-15 Days (Early)</span>
                  <span>Optimal Sowing Window</span>
                  <span>+30 Days (Delayed)</span>
                </div>
              </div>

              {/* 5. Pest & Disease Infestation Level */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  <MdBugReport style={{ color: '#ef4444' }} /> Pest & Pathogen Pressure
                </label>
                <div className={styles.pestGroup}>
                  {(['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.pestButton} ${pestPressure === p ? styles.pestButtonActive : ''}`}
                      onClick={() => {
                        setPestPressure(p);
                        setActivePresetId(null);
                      }}
                    >
                      {p === 'NONE' ? '🛡️ None' : (p === 'LOW' ? '🟢 Low' : (p === 'MEDIUM' ? '🟡 Med' : '🔴 Outbreak'))}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Irrigation Technology & Field Practice Switch */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>
                  ⚙️ Irrigation Technology & Management
                </label>
                <div className={styles.methodGrid}>
                  <button
                    type="button"
                    className={`${styles.methodButton} ${irrigationMethod === 'FLOOD' ? styles.methodButtonActive : ''}`}
                    onClick={() => {
                      setIrrigationMethod('FLOOD');
                      setActivePresetId(null);
                    }}
                  >
                    <span className={styles.methodTitle}>🌊 Traditional Flood</span>
                    <span className={styles.methodPerk}>Baseline standard • 40% loss</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.methodButton} ${irrigationMethod === 'DRIP' ? styles.methodButtonActive : ''}`}
                    onClick={() => {
                      setIrrigationMethod('DRIP');
                      setActivePresetId(null);
                    }}
                  >
                    <span className={styles.methodTitle}>💧 Precision Drip</span>
                    <span className={styles.methodPerk}>+18% Yield • -35% Water</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.methodButton} ${irrigationMethod === 'SPRINKLER' ? styles.methodButtonActive : ''}`}
                    onClick={() => {
                      setIrrigationMethod('SPRINKLER');
                      setActivePresetId(null);
                    }}
                  >
                    <span className={styles.methodTitle}>🌧️ Sprinkler System</span>
                    <span className={styles.methodPerk}>+8% Yield • -18% Water</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.methodButton} ${irrigationMethod === 'MULCH_DRIP' ? styles.methodButtonActive : ''}`}
                    onClick={() => {
                      setIrrigationMethod('MULCH_DRIP');
                      setActivePresetId(null);
                    }}
                  >
                    <span className={styles.methodTitle}>🌿 Organic Mulch & Drip</span>
                    <span className={styles.methodPerk}>+25% Yield • -45% Water</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Telemetry Projections & Yield Curve */}
        <div className={styles.resultsColumn}>
          {/* 4 Live KPI Gauges */}
          <div className={styles.kpiRow}>
            {/* Projected Harvest Yield */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Projected Harvest Yield</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {simulationResult ? `${simulationResult.projectedYieldQuintals.toFixed(1)} Q/A` : '18.5 Q/A'}
                </span>
                {simulationResult && (
                  <span className={simulationResult.yieldChangePercent >= 0 ? styles.kpiDeltaGain : styles.kpiDeltaLoss}>
                    {simulationResult.yieldChangePercent >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                    {simulationResult.yieldChangePercent >= 0 ? `+${simulationResult.yieldChangePercent}%` : `${simulationResult.yieldChangePercent}%`}
                  </span>
                )}
              </div>
              <span className={styles.kpiSubtext}>
                Baseline: {simulationResult ? `${simulationResult.baselineYieldQuintals} Q/A` : '18.5 Q/A'}
              </span>
            </div>

            {/* Estimated Net Profit */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Estimated Net Profit (₹/Acre)</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: simulationResult && simulationResult.netProfitPerAcre < 0 ? '#dc2626' : 'var(--color-emerald)' }}>
                  {simulationResult ? `₹${Math.round(simulationResult.netProfitPerAcre).toLocaleString('en-IN')}` : '₹28,500'}
                </span>
                {simulationResult && (
                  <span className={simulationResult.profitChangePercent >= 0 ? styles.kpiDeltaGain : styles.kpiDeltaLoss}>
                    {simulationResult.profitChangePercent >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                    {simulationResult.profitChangePercent >= 0 ? `+${simulationResult.profitChangePercent}%` : `${simulationResult.profitChangePercent}%`}
                  </span>
                )}
              </div>
              <span className={styles.kpiSubtext}>
                Gross: {simulationResult ? `₹${Math.round(simulationResult.grossRevenuePerAcre).toLocaleString('en-IN')}` : '—'} • Input Cost: {simulationResult ? `₹${Math.round(simulationResult.inputCostPerAcre).toLocaleString('en-IN')}` : '—'}
              </span>
            </div>

            {/* Climate Resilience Score */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Climate Resilience Index</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {simulationResult ? `${simulationResult.resilienceIndex} / 100` : '78 / 100'}
                </span>
                {simulationResult && (
                  <Badge
                    variant={simulationResult.riskLevel === 'LOW' ? 'success' : (simulationResult.riskLevel === 'MODERATE' ? 'warning' : 'error')}
                    dot
                  >
                    {simulationResult.riskLevel} RISK
                  </Badge>
                )}
              </div>
              <span className={styles.kpiSubtext}>
                Shield against rainfall volatility & temperature shocks
              </span>
            </div>

            {/* Water-Use Efficiency */}
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Water Consumption Footprint</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#0284C7' }}>
                  {simulationResult ? `${simulationResult.waterEfficiencyLitersPerKg} L/kg` : '1,890 L/kg'}
                </span>
              </div>
              <span className={styles.kpiSubtext}>
                Total: {simulationResult ? `${(simulationResult.waterConsumptionLitersPerAcre / 1000000).toFixed(2)}M Liters/Acre` : '3.5M L/A'}
              </span>
            </div>
          </div>

          {/* Recharts Biomass & Phenology Growth Progression Chart */}
          <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  12-Week Phenological Biomass Growth Curve
                </h4>
                <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Comparing Baseline S-Curve against Simulated Stress/Boost trajectory
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: '#94A3B8' }}>— Baseline</span>
                <span style={{ color: '#107850' }}>● Simulated</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={simulationResult?.weeklyGrowthCurve || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="simBiomassGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#107850" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#107850" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis
                  dataKey="week"
                  tickFormatter={v => `Wk ${v}`}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 105]}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <RechartsTooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                  formatter={(value: any, name: any) => [`${value}% Biomass`, name === 'simulatedBiomass' ? 'Simulated' : 'Baseline']}
                  labelFormatter={(label: any) => {
                    const pt = simulationResult?.weeklyGrowthCurve.find(p => p.week === label);
                    return `Week ${label}: ${pt?.stageName || 'Growth Stage'}`;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="baselineBiomass"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  name="baselineBiomass"
                />
                <Area
                  type="monotone"
                  dataKey="simulatedBiomass"
                  stroke="#107850"
                  strokeWidth={2.5}
                  fill="url(#simBiomassGradient)"
                  name="simulatedBiomass"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Actionable Advice & Warnings */}
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdLightbulb style={{ color: '#eab308' }} /> Agronomic Actionable Guidance
            </h4>

            {simulationResult?.riskWarnings && simulationResult.riskWarnings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {simulationResult.riskWarnings.map((w, idx) => (
                  <div key={idx} className={styles.warningItem}>
                    ⚠️ <strong>Warning:</strong> {w}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.adviceList}>
              {simulationResult?.actionableAdvice.map((a, idx) => (
                <div key={idx} className={styles.adviceItem}>
                  💡 {a}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Save Scenario Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Save Simulation Scenario"
        size="sm"
      >
        <form onSubmit={handleConfirmSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Save this &quot;What-If&quot; run to your farm ledger so you can compare multiple planting scenarios side-by-side.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Scenario Name
            </label>
            <input
              type="text"
              required
              value={scenarioNameToSave}
              onChange={e => setScenarioNameToSave(e.target.value)}
              placeholder="e.g. 2026 Wheat Drip vs Flood"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div>Crop: <strong>{selectedCropName}</strong> • Tech: <strong>{irrigationMethod}</strong></div>
            <div>Projected Yield: <strong>{simulationResult?.projectedYieldQuintals} Q/A</strong> ({simulationResult?.yieldChangePercent}% delta)</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="outline" type="button" onClick={() => setIsSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSaving}>
              Save to Farm Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Saved Scenarios Comparison Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              className={styles.drawerOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Saved &quot;What-If&quot; Scenarios
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}
                >
                  <MdClose />
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Compare historical simulated strategies for this farm.
              </p>

              {savedScenarios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No saved scenarios yet. Use &quot;Save Scenario&quot; to log your runs.
                </div>
              ) : (
                <div className={styles.scenarioList}>
                  {savedScenarios.map(s => (
                    <div key={s.id} className={styles.scenarioCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.scenarioName}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Crop: <strong>{s.cropName}</strong> • {s.irrigationMethod} • {s.createdAt}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteScenario(s.id)}
                          title="Delete Scenario"
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}
                        >
                          <MdDelete />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                        <div style={{ background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Yield</span>
                          <strong>{s.projectedYieldQuintals} Q/A</strong> ({s.yieldChangePercent}%)
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Net Profit</span>
                          <strong style={{ color: 'var(--color-emerald)' }}>₹{Math.round(s.netProfitPerAcre).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
