import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  MdEnergySavingsLeaf, MdLocalFlorist, MdWbSunny, MdWaterDrop,
  MdAgriculture, MdVerified, MdShoppingCart, MdReceipt, MdRefresh,
  MdClose, MdArrowForward, MdInfoOutline, MdCheckCircle, MdSell
} from 'react-icons/md';
import { toast } from 'react-hot-toast';

import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Modal } from '../../components/ui/Modal/Modal';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

import api from '../../services/api';
import { carbonService } from '../../services/carbonService';
import type {
  Farm, CarbonAuditRequest, CarbonAuditResult,
  CarbonCreditListing, CertificateReceipt
} from '../../types';
import styles from './CarbonPage.module.css';

export default function CarbonPage() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'ledger' | 'marketplace'>('ledger');

  // Farms State
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Audit State
  const [auditResult, setAuditResult] = useState<CarbonAuditResult | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(true);

  // Interactive Green Simulator State
  const [dieselLiters, setDieselLiters] = useState<number>(160);
  const [fertilizerKg, setFertilizerKg] = useState<number>(100);
  const [electricityKwh, setElectricityKwh] = useState<number>(400);
  const [tillageMethod, setTillageMethod] = useState<'CONVENTIONAL' | 'REDUCED' | 'NO_TILL'>('REDUCED');
  const [stubbleAvoided, setStubbleAvoided] = useState<boolean>(true);
  const [solarPump, setSolarPump] = useState<boolean>(true);
  const [dripActive, setDripActive] = useState<boolean>(true);
  const [biocharTons, setBiocharTons] = useState<number>(4.0);
  const [treeCount, setTreeCount] = useState<number>(75);
  const [coverAcres, setCoverAcres] = useState<number>(2.5);

  // Marketplace State
  const [listings, setListings] = useState<CarbonCreditListing[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<CarbonCreditListing | null>(null);

  // List Credits Modal
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [creditsToList, setCreditsToList] = useState<number>(1.0);
  const [pricePerCredit, setPricePerCredit] = useState<number>(1850);
  const [isListing, setIsListing] = useState<boolean>(false);

  // Buy Modal
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerOrg, setBuyerOrg] = useState<string>('');
  const [creditsToBuy, setCreditsToBuy] = useState<number>(1.0);
  const [isBuying, setIsBuying] = useState<boolean>(false);

  // Certificate Modal
  const [certificateReceipt, setCertificateReceipt] = useState<CertificateReceipt | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  // Debounce ref
  const debounceRef = useRef<any>(null);

  // 1. Fetch Farms List
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await api.get('/farms');
        const farmList: Farm[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setFarms(farmList);
        if (farmList.length > 0 && selectedFarmId === null) {
          setSelectedFarmId(Number(farmList[0].id));
        }
      } catch {
        toast.error('Failed to load farms.');
      }
    };
    fetchFarms();
  }, []);

  // 2. Load Audit for Selected Farm
  const loadAudit = useCallback(async (farmId: number) => {
    setIsLoadingAudit(true);
    try {
      const data = await carbonService.getLatestAudit(farmId);
      setAuditResult(data);
    } catch {
      toast.error('Failed to load carbon audit telemetry.');
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId !== null) {
      loadAudit(selectedFarmId);
    }
  }, [selectedFarmId, loadAudit]);

  // 3. Load Marketplace Listings
  const loadMarketplace = useCallback(async () => {
    setIsLoadingMarket(true);
    try {
      const data = await carbonService.getMarketplace();
      setListings(data);
    } catch {
      toast.error('Failed to load carbon credit marketplace.');
    } finally {
      setIsLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      loadMarketplace();
    }
  }, [activeTab, loadMarketplace]);

  // 4. Run Interactive Audit Recalculation
  const runRecalculation = useCallback(async () => {
    if (!selectedFarmId) return;

    const req: CarbonAuditRequest = {
      farmId: selectedFarmId,
      dieselUsageLiters: dieselLiters,
      syntheticFertilizerKg: fertilizerKg,
      electricityKwh: electricityKwh,
      tillageMethod: tillageMethod,
      stubbleBurningAvoided: stubbleAvoided,
      solarPumpInstalled: solarPump,
      dripIrrigationActive: dripActive,
      biocharCompostTons: biocharTons,
      agroforestryTreesCount: treeCount,
      coverCroppingAcres: coverAcres
    };

    try {
      const updated = await carbonService.audit(req);
      setAuditResult(updated);
    } catch {
      // Quiet fail during rapid sliding
    }
  }, [
    selectedFarmId, dieselLiters, fertilizerKg, electricityKwh,
    tillageMethod, stubbleAvoided, solarPump, dripActive,
    biocharTons, treeCount, coverAcres
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runRecalculation();
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runRecalculation]);

  // 5. Handle List Credits
  const handleOpenListModal = () => {
    if (!auditResult || auditResult.carbonCreditsMinted <= 0) {
      toast.error('Your farm needs positive verified carbon credits to list on the exchange.');
      return;
    }
    setCreditsToList(auditResult.carbonCreditsMinted);
    setIsListModalOpen(true);
  };

  const handleConfirmList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;
    setIsListing(true);
    const toastId = toast.loading('Listing verified carbon credits on marketplace...');
    try {
      await carbonService.listCredits({
        farmId: selectedFarmId,
        creditsToList: creditsToList,
        pricePerCreditInr: pricePerCredit
      });
      toast.success('Carbon credits listed successfully! Buyers can now purchase your offsets.', { id: toastId });
      setIsListModalOpen(false);
      if (activeTab === 'marketplace') loadMarketplace();
    } catch {
      toast.error('Failed to list carbon credits.', { id: toastId });
    } finally {
      setIsListing(false);
    }
  };

  // 6. Handle Buy Credits
  const handleOpenBuyModal = (listing: CarbonCreditListing) => {
    setSelectedListing(listing);
    setCreditsToBuy(listing.creditsAvailable);
    setIsBuyModalOpen(true);
  };

  const handleConfirmBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setIsBuying(true);
    const toastId = toast.loading('Processing carbon offset retirement and minting certificate...');
    try {
      const receipt = await carbonService.buyCredits(selectedListing.id, {
        creditsToBuy: creditsToBuy,
        buyerName: buyerName.trim() || 'Eco-Conscious Partner',
        buyerEmail: 'user@example.com',
        buyerOrganization: buyerOrg.trim() || 'Corporate ESG Offsets'
      });
      setCertificateReceipt(receipt);
      setIsBuyModalOpen(false);
      setIsCertModalOpen(true);
      toast.success('Carbon credits retired! Certificate generated.', { id: toastId });
      loadMarketplace();
    } catch {
      toast.error('Failed to complete carbon purchase.', { id: toastId });
    } finally {
      setIsBuying(false);
    }
  };

  const comparisonChartData = [
    {
      category: 'Gross Emissions',
      amount: auditResult ? auditResult.totalEmissionsKgCo2 : 1200,
      fill: '#EF4444'
    },
    {
      category: 'Regenerative Sequestration',
      amount: auditResult ? auditResult.totalSequestrationKgCo2 : 3100,
      fill: '#107850'
    }
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Carbon Footprint Tracker & Green Carbon Credits"
        subtitle="IPCC Tier-1 farm GHG emissions auditing, regenerative sequestration accounting, and corporate carbon credit offset exchange."
        breadcrumbs={[{ label: 'Carbon Tracker' }]}
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

            <Button
              variant="outline"
              leftIcon={<MdRefresh />}
              onClick={() => selectedFarmId && loadAudit(selectedFarmId)}
            >
              Recalculate Audit
            </Button>

            <Button
              variant="primary"
              leftIcon={<MdSell />}
              onClick={handleOpenListModal}
            >
              List Carbon Credits
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'ledger' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <MdEnergySavingsLeaf /> Farm Carbon Ledger & Green Simulator
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'marketplace' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          <MdShoppingCart /> Carbon Credits Marketplace ({listings.length})
        </button>
      </div>

      {activeTab === 'ledger' && (
        <>
          {/* Top 4 KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${auditResult?.isNetNegative ? styles.kpiCardGreen : ''}`}>
              <span className={styles.kpiLabel}>Net Carbon Balance (CO₂e)</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: auditResult?.isNetNegative ? 'var(--color-emerald)' : '#ef4444' }}>
                  {auditResult ? `${auditResult.netCarbonTonnesCo2 > 0 ? `+${auditResult.netCarbonTonnesCo2}` : auditResult.netCarbonTonnesCo2} tCO₂e` : '-2.15 tCO₂e'}
                </span>
                {auditResult?.isNetNegative ? (
                  <Badge variant="success" dot>Net Negative (Green Sink)</Badge>
                ) : (
                  <Badge variant="warning" dot>Net Emitter</Badge>
                )}
              </div>
              <span className={styles.kpiSubtext}>
                Emissions: {auditResult ? `${(auditResult.totalEmissionsKgCo2 / 1000).toFixed(2)}t` : '1.25t'} • Sequestration: {auditResult ? `${(auditResult.totalSequestrationKgCo2 / 1000).toFixed(2)}t` : '3.40t'}
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Verified Carbon Credits Minted</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: 'var(--color-emerald)' }}>
                  {auditResult ? `${auditResult.carbonCreditsMinted.toFixed(1)} Credits` : '2.1 Credits'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 700 }}>
                  ● IPCC Verified
                </span>
              </div>
              <span className={styles.kpiSubtext}>
                1 Credit = 1.0 Tonne of sequestered atmospheric CO₂e
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Estimated Offset Value (₹)</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#0284C7' }}>
                  {auditResult ? `₹${Math.round(auditResult.estimatedMonetizationInr).toLocaleString('en-IN')}` : '₹3,885'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  @ ₹1,850/credit
                </span>
              </div>
              <span className={styles.kpiSubtext}>
                Annual supplementary revenue from regenerative farming
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Eco-Canopy Sustainability Tier</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {auditResult?.carbonRating === 'NET_NEGATIVE_A_PLUS' ? 'A+ Prime' : (auditResult?.carbonRating === 'LOW_CARBON_A' ? 'A Green' : 'B Standard')}
                </span>
                <Badge variant="success">Certified</Badge>
              </div>
              <span className={styles.kpiSubtext}>
                Serial: {auditResult?.certificateSerial || 'FV-CARB-2026-F1-001'}
              </span>
            </div>
          </div>

          {/* 2-Column Dashboard Grid */}
          <div className={styles.dashboardGrid}>
            {/* Left: Comparative Chart & Breakdown Lists */}
            <div className={styles.breakdownSection}>
              {/* Comparative Emissions vs Sequestration Bar Chart */}
              <Card>
                <h4 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Carbon Balance: Gross Emissions vs Regenerative Sequestration (kg CO₂e)
                </h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={comparisonChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} width={150} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [`${v} kg CO₂e`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                      {comparisonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Emissions Breakdown */}
              <Card>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#EF4444' }}>
                  🔥 Gross Emission Drivers Breakdown
                </h4>
                <div className={styles.itemList}>
                  {auditResult?.emissionsBreakdown.map((item, idx) => (
                    <div key={idx} className={styles.itemCard}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemName}>
                          {item.icon} {item.sourceName}
                        </span>
                        <span className={styles.itemAmount}>{item.amountKgCo2} kg ({item.percentOfTotal}%)</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFillRed} style={{ width: `${Math.min(100, item.percentOfTotal)}%` }} />
                      </div>
                      <span className={styles.itemTip}>💡 {item.mitigationTip}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sequestration Breakdown */}
              <Card>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: 'var(--color-emerald)' }}>
                  🌳 Regenerative Carbon Sequestration Sinks
                </h4>
                <div className={styles.itemList}>
                  {auditResult?.sequestrationBreakdown.map((item, idx) => (
                    <div key={idx} className={styles.itemCard}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemName}>
                          {item.icon} {item.practiceName}
                        </span>
                        <span className={styles.itemAmount} style={{ color: 'var(--color-emerald)' }}>
                          +{item.amountKgCo2} kg ({item.percentOfTotal}%)
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFillGreen} style={{ width: `${Math.min(100, item.percentOfTotal)}%` }} />
                      </div>
                      <span className={styles.itemTip}>⏳ Permanence: {item.permanenceYears}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Interactive Green Action Simulator */}
            <div className={styles.simulatorCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdEnergySavingsLeaf style={{ color: 'var(--color-emerald)' }} /> Interactive Green Action Simulator
                </h3>
                <span style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 700 }}>● Live Recalculation</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                Simulate adopting regenerative practices to observe immediate emissions reductions and new carbon credit gains.
              </p>

              {/* Toggles */}
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle}>☀️ Solar Pump (PM-KUSUM)</span>
                  <span className={styles.toggleDesc}>Displaces diesel & grid pumping power</span>
                </div>
                <input
                  type="checkbox"
                  checked={solarPump}
                  onChange={e => setSolarPump(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#107850', cursor: 'pointer' }}
                />
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle}>💧 Precision Micro-Drip</span>
                  <span className={styles.toggleDesc}>Reduces pumping runtime by 35%</span>
                </div>
                <input
                  type="checkbox"
                  checked={dripActive}
                  onChange={e => setDripActive(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#107850', cursor: 'pointer' }}
                />
              </div>

              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle}>🚫 Zero Stubble Burning</span>
                  <span className={styles.toggleDesc}>Bio-incorporates straw into soil humus</span>
                </div>
                <input
                  type="checkbox"
                  checked={stubbleAvoided}
                  onChange={e => setStubbleAvoided(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#107850', cursor: 'pointer' }}
                />
              </div>

              {/* Sliders */}
              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>🌳 Agroforestry Trees</span>
                  <strong style={{ color: 'var(--color-emerald)' }}>{treeCount} Trees (+{treeCount * 22} kg CO₂)</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="10"
                  value={treeCount}
                  onChange={e => setTreeCount(parseInt(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>🧱 Biochar Compost Application</span>
                  <strong style={{ color: 'var(--color-emerald)' }}>{biocharTons} Tons (+{biocharTons * 1800} kg CO₂)</strong>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.5"
                  value={biocharTons}
                  onChange={e => setBiocharTons(parseFloat(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>🌿 Leguminous Cover Cropping</span>
                  <strong style={{ color: 'var(--color-emerald)' }}>{coverAcres} Acres (+{coverAcres * 1200} kg CO₂)</strong>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.5"
                  value={coverAcres}
                  onChange={e => setCoverAcres(parseFloat(e.target.value))}
                  className={styles.sliderInput}
                />
              </div>

              {/* Actionable Advice Box */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 8, marginTop: 4 }}>
                <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  🌱 Agronomic Recommendations:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {auditResult?.actionableRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'marketplace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  🌍 Corporate & Consumer Carbon Offset Exchange
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Purchase and permanently retire verified agricultural carbon credits directly from Indian regenerative smallholder farmers.
                </p>
              </div>
              <Button variant="primary" leftIcon={<MdSell />} onClick={handleOpenListModal}>
                List My Farm Credits
              </Button>
            </div>
          </Card>

          {isLoadingMarket ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} height={200} />
              ))}
            </div>
          ) : (
            <div className={styles.marketplaceGrid}>
              {listings.map(l => (
                <div key={l.id} className={styles.marketCard}>
                  <div className={styles.marketHeader}>
                    <div>
                      <div className={styles.marketFarmName}>{l.farmName}</div>
                      <div className={styles.marketLocation}>📍 {l.location} • Farmer: {l.farmerName}</div>
                    </div>
                    <Badge variant="success" dot>Verified</Badge>
                  </div>

                  <div className={styles.marketMetrics}>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>Available</span>
                      <span className={styles.metricValue} style={{ color: 'var(--color-emerald)' }}>
                        {l.creditsAvailable.toFixed(1)} Credits
                      </span>
                    </div>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>Price / Credit</span>
                      <span className={styles.metricValue}>
                        ₹{l.pricePerCreditInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.marketSerial}>{l.certificateSerial}</span>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<MdVerified />}
                      onClick={() => handleOpenBuyModal(l)}
                    >
                      Buy & Retire
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List Credits Modal */}
      <Modal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title="List Verified Carbon Credits on Exchange"
        size="sm"
      >
        <form onSubmit={handleConfirmList} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            List your verified net-negative carbon credits on the FarmVerse corporate carbon offset marketplace.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Credits to List (Available: {auditResult?.carbonCreditsMinted || 0} Credits)
            </label>
            <input
              type="number"
              min="0.1"
              max={auditResult?.carbonCreditsMinted || 1}
              step="0.1"
              required
              value={creditsToList}
              onChange={e => setCreditsToList(parseFloat(e.target.value))}
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

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Price per Credit (₹ INR)
            </label>
            <input
              type="number"
              min="1000"
              max="5000"
              step="50"
              required
              value={pricePerCredit}
              onChange={e => setPricePerCredit(parseFloat(e.target.value))}
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
            <div>Total Revenue Expected: <strong style={{ color: 'var(--color-emerald)' }}>₹{Math.round(creditsToList * pricePerCredit).toLocaleString('en-IN')}</strong></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="outline" type="button" onClick={() => setIsListModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isListing}>
              Confirm Marketplace Listing
            </Button>
          </div>
        </form>
      </Modal>

      {/* Buy Credits Modal */}
      <Modal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        title="Purchase & Retire Carbon Offsets"
        size="md"
      >
        <form onSubmit={handleConfirmBuy} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Retire carbon credits from <strong>{selectedListing?.farmName}</strong> to permanently offset your personal or corporate emissions.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Buyer Name / Authorized Signatory
            </label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
              placeholder="e.g. Adithya Yadav"
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

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Company / ESG Organization (Optional)
            </label>
            <input
              type="text"
              value={buyerOrg}
              onChange={e => setBuyerOrg(e.target.value)}
              placeholder="e.g. GreenTech Agri Solutions Ltd."
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

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Credits to Retire (Max: {selectedListing?.creditsAvailable} Credits)
            </label>
            <input
              type="number"
              min="0.1"
              max={selectedListing?.creditsAvailable || 1}
              step="0.1"
              required
              value={creditsToBuy}
              onChange={e => setCreditsToBuy(parseFloat(e.target.value))}
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

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>
            Total Payment: <strong style={{ color: 'var(--color-emerald)', fontSize: 16 }}>₹{Math.round(creditsToBuy * (selectedListing?.pricePerCreditInr || 1850)).toLocaleString('en-IN')}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="outline" type="button" onClick={() => setIsBuyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isBuying}>
              Confirm & Mint Offset Certificate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Certificate of Carbon Sequestration Modal */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Official Certificate of Carbon Sequestration"
        size="md"
      >
        {certificateReceipt && (
          <div className={styles.certContainer}>
            <div className={styles.certHeader}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🌱</div>
              <div className={styles.certTitle}>Certificate of Carbon Sequestration</div>
              <div className={styles.certSerial}>Serial: {certificateReceipt.certificateSerial}</div>
            </div>

            <div className={styles.certDetails}>
              <div>
                This certifies that <strong>{certificateReceipt.buyerName}</strong> ({certificateReceipt.buyerOrganization}) has permanently retired and neutralized:
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399', textAlign: 'center', padding: '10px 0' }}>
                {certificateReceipt.creditsRetired} Metric Tonnes of CO₂e
              </div>
              <div>
                Originated from verified regenerative smallholder farming practices at:
                <br />
                <strong>{certificateReceipt.farmName}</strong> ({certificateReceipt.location})
                <br />
                Managed by farmer partner <strong>{certificateReceipt.farmerName}</strong>.
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
                Issued on: <strong>{certificateReceipt.issuedAt}</strong>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Cryptographic Verification Hash:</span>
              <div className={styles.certHash}>{certificateReceipt.verificationHash}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button variant="outline" onClick={() => setIsCertModalOpen(false)}>
                Close Certificate
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
