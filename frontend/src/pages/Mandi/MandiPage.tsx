import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  MdStorefront, MdTrendingUp, MdTrendingDown, MdRefresh,
  MdCalculate, MdCompareArrows, MdVerified, MdInfo, MdSearch,
  MdLocalShipping, MdShield, MdPriceCheck
} from 'react-icons/md';
import { toast } from 'react-hot-toast';

import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

import api from '../../services/api';
import { mandiService } from '../../services/mandiService';
import type {
  Farm, MandiPrice, ArbitrageResponse, CommodityPriceHistory,
  MarketSummaryStats
} from '../../types';
import styles from './MandiPage.module.css';

const CATEGORIES = ['All', 'Grains', 'Vegetables', 'Fruits', 'Cash Crops', 'Oilseeds', 'Spices'];

export default function MandiPage() {
  // Farms state
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Market Prices State
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [summaryStats, setSummaryStats] = useState<MarketSummaryStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Wheat');
  const [priceHistory, setPriceHistory] = useState<CommodityPriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Arbitrage Calculator State
  const [arbitrageQuantity, setArbitrageQuantity] = useState<number>(30);
  const [arbitrageCommodity, setArbitrageCommodity] = useState<string>('Wheat');
  const [arbitrageResult, setArbitrageResult] = useState<ArbitrageResponse | null>(null);
  const [isCalculatingArbitrage, setIsCalculatingArbitrage] = useState<boolean>(false);

  // 1. Load Farms
  const loadFarms = useCallback(async () => {
    try {
      const res = await api.get('/farms');
      const farmList: Farm[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFarms(farmList);
      if (farmList.length > 0 && selectedFarmId === null) {
        setSelectedFarmId(Number(farmList[0].id));
      }
    } catch {
      // Graceful fallback
    }
  }, [selectedFarmId]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  // 2. Load Market Prices & Summary
  const loadPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pricesData, summaryData] = await Promise.all([
        mandiService.getPrices({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
          farmId: selectedFarmId || undefined,
        }),
        mandiService.getSummaryStats(),
      ]);
      setPrices(pricesData);
      setSummaryStats(summaryData);
    } catch {
      toast.error('Failed to load live e-NAM market prices.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, selectedFarmId]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  // 3. Load 30-Day Historical Trend for Selected Commodity
  const loadHistory = useCallback(async (commodity: string) => {
    try {
      const data = await mandiService.getPriceHistory(commodity);
      setPriceHistory(data);
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    loadHistory(selectedCommodity);
  }, [selectedCommodity, loadHistory]);

  // 4. Calculate Mandi Price Arbitrage
  const handleCalculateArbitrage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFarmId) {
      toast.error('Please select a farm.');
      return;
    }
    setIsCalculatingArbitrage(true);
    try {
      const res = await mandiService.calculateArbitrage({
        farmId: selectedFarmId,
        commodity: arbitrageCommodity,
        quantityQuintals: arbitrageQuantity,
      });
      setArbitrageResult(res);
      toast.success(`Arbitrage analysis computed for ${arbitrageCommodity}!`, { icon: '📊' });
    } catch {
      toast.error('Could not compute arbitrage for this commodity.');
    } finally {
      setIsCalculatingArbitrage(false);
    }
  };

  // Run initial arbitrage calculation once farm is selected
  useEffect(() => {
    if (selectedFarmId && !arbitrageResult) {
      handleCalculateArbitrage();
    }
  }, [selectedFarmId]);

  // Admin Data Sync
  const handleAdminSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Synchronizing national e-NAM APMC price feeds...');
    try {
      await mandiService.syncMarketData();
      toast.success('e-NAM market feeds refreshed successfully!', { id: toastId });
      loadPrices();
    } catch {
      toast.error('Sync failed.', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="e-NAM Live Market Prices & Mandi Price Arbitrage"
        subtitle="Real-time APMC commodity rates, Government MSP benchmarks, and cross-mandi freight net profit optimization."
        breadcrumbs={[{ label: 'e-NAM Market Prices' }]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Button
              variant="outline"
              leftIcon={<MdRefresh />}
              loading={isSyncing}
              onClick={handleAdminSync}
            >
              Sync e-NAM Feeds
            </Button>
            <Button
              variant="primary"
              leftIcon={<MdRefresh />}
              onClick={loadPrices}
            >
              Refresh Rates
            </Button>
          </div>
        }
      />

      {/* Live Market Price Ticker */}
      <div className={styles.tickerWrapper}>
        <div className={styles.tickerLabel}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
          LIVE e-NAM TICKER
        </div>
        <div className={styles.tickerList}>
          {prices.slice(0, 8).map(item => (
            <div key={item.id} className={styles.tickerItem}>
              <strong>{item.commodity}</strong>
              <span style={{ color: 'var(--text-muted)' }}>({item.mandiName.replace(' APMC', '').replace(' Mandi', '')})</span>
              <span>₹{item.modalPrice.toLocaleString('en-IN')}/q</span>
              <span style={{ color: item.trend === 'UP' ? 'var(--color-success)' : (item.trend === 'DOWN' ? 'var(--color-error)' : 'var(--text-muted)'), fontWeight: 700 }}>
                {item.trend === 'UP' ? '▲' : (item.trend === 'DOWN' ? '▼' : '●')} {item.priceChangePercent > 0 ? `+${item.priceChangePercent}%` : `${item.priceChangePercent}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mandi Price Arbitrage Calculator Widget */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdCompareArrows style={{ color: 'var(--color-emerald)', fontSize: 24 }} />
              Mandi Price Arbitrage Calculator
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Calculate net profit across mandis after deducting transport/freight costs per quintal.
            </p>
          </div>
          <Badge variant="success" dot>Smart Freight Engine</Badge>
        </div>

        <form onSubmit={handleCalculateArbitrage} className={styles.arbitrageForm}>
          <div className={styles.formGroup}>
            <label>Origin Farm</label>
            <select
              className={styles.selectInput}
              value={selectedFarmId || ''}
              onChange={e => setSelectedFarmId(Number(e.target.value))}
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location || 'Centroid'})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Harvested Commodity</label>
            <select
              className={styles.selectInput}
              value={arbitrageCommodity}
              onChange={e => setArbitrageCommodity(e.target.value)}
            >
              <option value="Wheat">Wheat (Grains)</option>
              <option value="Paddy">Paddy / Basmati (Grains)</option>
              <option value="Apple">Apple (Fruits)</option>
              <option value="Cotton">Cotton (Cash Crop)</option>
              <option value="Maize">Maize (Grains)</option>
              <option value="Tomato">Tomato (Vegetables)</option>
              <option value="Onion">Onion (Vegetables)</option>
              <option value="Soybean">Soybean (Oilseeds)</option>
              <option value="Sugarcane">Sugarcane (Cash Crop)</option>
              <option value="Tea">Tea (Plantation)</option>
              <option value="Spices">Spices / Black Pepper</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Quantity (Quintals / 100kg)</label>
            <input
              type="number"
              min="1"
              max="5000"
              className={styles.textInput}
              value={arbitrageQuantity}
              onChange={e => setArbitrageQuantity(Number(e.target.value))}
              placeholder="e.g. 50"
            />
          </div>

          <Button
            variant="primary"
            leftIcon={<MdCalculate />}
            type="submit"
            loading={isCalculatingArbitrage}
          >
            Compute Net Profit
          </Button>
        </form>

        {/* Arbitrage Recommendation Callout Banner */}
        {arbitrageResult && arbitrageResult.additionalProfit > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 16 }}
            className={styles.arbitrageBanner}
          >
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-emerald)', letterSpacing: 0.5 }}>
                ★ Best Arbitrage Recommendation
              </span>
              <h4 style={{ margin: '4px 0', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                Sell at {arbitrageResult.recommendedMandiName}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                Transporting your {arbitrageResult.quantityQuintals} quintals to <strong>{arbitrageResult.recommendedMandiName}</strong> yields an extra{' '}
                <strong style={{ color: 'var(--color-success)' }}>+₹{arbitrageResult.additionalProfit.toLocaleString('en-IN')} (+{arbitrageResult.percentageGain}%)</strong> net profit over your local market ({arbitrageResult.localMandiName}) even after paying all freight costs!
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Net Farmer Realization</span>
              <strong style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-emerald)' }}>
                ₹{arbitrageResult.recommendedNetProfit.toLocaleString('en-IN')}
              </strong>
            </div>
          </motion.div>
        )}

        {/* Arbitrage Mandis Breakdown Table */}
        {arbitrageResult && (
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table className={styles.arbitrageTable}>
              <thead>
                <tr>
                  <th>APMC Mandi</th>
                  <th>Distance from Farm</th>
                  <th>Modal Rate (₹/q)</th>
                  <th>Freight Deduction (₹/q)</th>
                  <th>Net Payout Rate</th>
                  <th>Total Net Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {arbitrageResult.mandiOptions.map((opt, idx) => (
                  <tr key={idx} className={opt.isRecommended ? styles.highlightRow : ''}>
                    <td>
                      <strong>{opt.mandiName}</strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>{opt.district}, {opt.state}</span>
                    </td>
                    <td>{opt.distanceKm} km</td>
                    <td>₹{opt.modalPrice.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-error)' }}>-₹{opt.transportCostPerQuintal}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-emerald)' }}>₹{opt.netPricePerQuintal.toLocaleString('en-IN')}/q</td>
                    <td style={{ fontSize: 15, fontWeight: 800 }}>₹{opt.netProfit.toLocaleString('en-IN')}</td>
                    <td>
                      {opt.isRecommended ? (
                        <Badge variant="success" dot>Highest Profit</Badge>
                      ) : (
                        <Badge variant="neutral">Alternative</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 30-Day Historical Trend & MSP Benchmark Chart */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              30-Day Price Trend vs Govt. MSP Benchmark: {selectedCommodity}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Tracking daily modal prices against the official Government Minimum Support Price (MSP) benchmark line.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Wheat', 'Paddy', 'Apple', 'Cotton', 'Tomato', 'Onion'].map(crop => (
              <button
                key={crop}
                type="button"
                className={`${styles.pillButton} ${selectedCommodity === crop ? styles.pillButtonActive : ''}`}
                onClick={() => setSelectedCommodity(crop)}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={priceHistory} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#107850" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#107850" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <RechartsTooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }}
              formatter={(val: unknown) => typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}/q` : String(val)}
            />
            {priceHistory.length > 0 && (
              <ReferenceLine
                y={priceHistory[0].mspPrice}
                label={{ value: `Govt. MSP (₹${priceHistory[0].mspPrice})`, fill: '#EF4444', fontSize: 12 }}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth={2}
              />
            )}
            <Area type="monotone" dataKey="modalPrice" stroke="#107850" strokeWidth={2.5} fill="url(#priceGradient)" name="Modal Price" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Filter Pills & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div className={styles.categoryPills}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`${styles.pillButton} ${selectedCategory === cat ? styles.pillButtonActive : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)', fontSize: 18 }} />
          <input
            type="text"
            className={styles.textInput}
            style={{ width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
            placeholder="Search commodity, mandi, state..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Commodity Cards Grid */}
      <div className={styles.commodityGrid}>
        {prices.map(item => (
          <div key={item.id} className={styles.commodityCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
                  {item.category}
                </span>
                <h4 style={{ margin: '2px 0 0 0', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {item.commodity}
                </h4>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.variety || 'Standard Quality'}
                </span>
              </div>
              <Badge
                variant={item.trend === 'UP' ? 'success' : (item.trend === 'DOWN' ? 'error' : 'neutral')}
                dot
              >
                {item.trend === 'UP' ? '▲' : (item.trend === 'DOWN' ? '▼' : '●')} {item.priceChangePercent > 0 ? `+${item.priceChangePercent}%` : `${item.priceChangePercent}%`}
              </Badge>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Modal Price</span>
                <strong style={{ fontSize: 20, color: 'var(--text-primary)' }}>
                  ₹{item.modalPrice.toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> / quintal</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Range</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  ₹{item.minPrice} - ₹{item.maxPrice}
                </span>
              </div>
            </div>

            {/* MSP Comparison Status */}
            {item.mspPrice && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Govt. MSP: ₹{item.mspPrice.toLocaleString('en-IN')}</span>
                {item.mspSpread >= 0 ? (
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                    +₹{item.mspSpread.toLocaleString('en-IN')} above MSP
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>
                    -₹{Math.abs(item.mspSpread).toLocaleString('en-IN')} below MSP
                  </span>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>📍 {item.mandiName} ({item.state})</span>
              {item.distanceKm !== null && <span>{item.distanceKm} km</span>}
            </div>

            <Button
              variant="outline"
              size="sm"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => {
                setArbitrageCommodity(item.commodity);
                setSelectedCommodity(item.commodity);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            >
              Analyze Arbitrage for {item.commodity}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
