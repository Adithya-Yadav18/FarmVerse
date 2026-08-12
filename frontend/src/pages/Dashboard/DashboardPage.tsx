import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MdAgriculture, MdGrass, MdWarning, MdWaterDrop,
  MdTrendingUp, MdHealthAndSafety,
} from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { StatCard } from '../../components/ui/Card/Card';
import { Card } from '../../components/ui/Card/Card';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardPage.module.css';

// ── Mock data (replace with API calls) ───────────────────────────────────────
const yieldTrend = [
  { month: 'Jan', yield: 420, target: 400 },
  { month: 'Feb', yield: 380, target: 400 },
  { month: 'Mar', yield: 510, target: 450 },
  { month: 'Apr', yield: 470, target: 450 },
  { month: 'May', yield: 620, target: 500 },
  { month: 'Jun', yield: 590, target: 500 },
  { month: 'Jul', yield: 680, target: 550 },
];

const cropDist = [
  { name: 'Wheat', value: 35 },
  { name: 'Rice', value: 28 },
  { name: 'Corn', value: 20 },
  { name: 'Soybean', value: 12 },
  { name: 'Others', value: 5 },
];

const waterUsage = [
  { week: 'W1', usage: 1200, optimal: 1000 },
  { week: 'W2', usage: 980, optimal: 1000 },
  { week: 'W3', usage: 1100, optimal: 1000 },
  { week: 'W4', usage: 870, optimal: 1000 },
  { week: 'W5', usage: 950, optimal: 1000 },
  { week: 'W6', usage: 1050, optimal: 1000 },
];

const COLORS = ['#0F5E3A', '#52B788', '#D4AF37', '#F59E0B', '#9CA3AF'];

const recentActivity = [
  { id: 1, type: 'Farm Update', desc: 'North Field irrigation schedule updated', time: '2h ago', color: '#0F5E3A' },
  { id: 2, type: 'Alert', desc: 'Soil moisture low in Block B — action needed', time: '4h ago', color: '#F59E0B' },
  { id: 3, type: 'Harvest', desc: 'Wheat harvest completed — Block C (12.4 tonnes)', time: '1d ago', color: '#52B788' },
  { id: 4, type: 'Disease', desc: 'Early blight detected in Tomato Crop – Sector 3', time: '2d ago', color: '#EF4444' },
  { id: 5, type: 'Report', desc: 'Monthly yield report generated', time: '3d ago', color: '#3B82F6' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'Farmer'} 👋`}
        subtitle="Here's what's happening across your farms today."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Farms" value="8" change={12} icon={<MdAgriculture />} iconBg="#D8F3DC" iconColor="#0F5E3A" />
            <StatCard label="Active Crops" value="24" change={8} icon={<MdGrass />} iconBg="#D8F3DC" iconColor="#52B788" />
            <StatCard label="Pending Alerts" value="3" change={-2} icon={<MdWarning />} iconBg="#FEF3C7" iconColor="#F59E0B" />
            <StatCard label="Water Usage (kL)" value="4,820" change={-5} icon={<MdWaterDrop />} iconBg="#DBEAFE" iconColor="#3B82F6" />
            <StatCard label="Yield Forecast (t)" value="142" change={15} icon={<MdTrendingUp />} iconBg="#D8F3DC" iconColor="#0F5E3A" />
            <StatCard label="Soil Health" value="87%" change={3} icon={<MdHealthAndSafety />} iconBg="#D8F3DC" iconColor="#52B788" />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className={styles.chartsGrid}>
        {/* Yield Trend */}
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Yield Trend</h3>
          <p className={styles.chartSub}>Monthly yield vs target (tonnes)</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yieldTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F5E3A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0F5E3A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="yield" stroke="#0F5E3A" strokeWidth={2.5} fill="url(#yieldGrad)" name="Actual" />
              <Area type="monotone" dataKey="target" stroke="#D4AF37" strokeWidth={2} strokeDasharray="5 4" fill="none" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Crop Distribution */}
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Crop Distribution</h3>
          <p className={styles.chartSub}>Share by crop type (%)</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={cropDist} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                dataKey="value" paddingAngle={3} nameKey="name">
                {cropDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Water Usage + Activity ── */}
      <div className={styles.bottomGrid}>
        <Card className={styles.waterCard}>
          <h3 className={styles.chartTitle}>Weekly Water Usage</h3>
          <p className={styles.chartSub}>Actual vs optimal (kL)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waterUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Bar dataKey="usage" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Usage" />
              <Bar dataKey="optimal" fill="#D8F3DC" radius={[4, 4, 0, 0]} name="Optimal" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Feed */}
        <Card className={styles.activityCard}>
          <h3 className={styles.chartTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
            {recentActivity.map((a, i) => (
              <motion.div
                key={a.id}
                className={styles.activityItem}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className={styles.activityDot} style={{ background: a.color }} />
                <div className={styles.activityContent}>
                  <span className={styles.activityType} style={{ color: a.color }}>{a.type}</span>
                  <p className={styles.activityDesc}>{a.desc}</p>
                </div>
                <span className={styles.activityTime}>{a.time}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
