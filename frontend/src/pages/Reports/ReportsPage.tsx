import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdAssessment, MdDownload, MdRefresh } from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import toast from 'react-hot-toast';

const REPORTS = [
  { id: '1', title: 'Monthly Yield Report', type: 'Yield', period: 'December 2024', generatedAt: '2025-01-01T10:00:00Z', status: 'Ready', size: '2.4 MB' },
  { id: '2', title: 'Soil Health Analysis', type: 'Soil', period: 'Q4 2024', generatedAt: '2025-01-02T08:00:00Z', status: 'Ready', size: '1.8 MB' },
  { id: '3', title: 'Water Usage Report', type: 'Water', period: 'December 2024', generatedAt: '2025-01-01T12:00:00Z', status: 'Ready', size: '1.2 MB' },
  { id: '4', title: 'Financial Summary', type: 'Financial', period: 'FY 2024-25', generatedAt: '', status: 'Generating', size: '—' },
  { id: '5', title: 'Pest & Disease Report', type: 'Pest', period: 'Q4 2024', generatedAt: '2024-12-31T15:00:00Z', status: 'Ready', size: '3.1 MB' },
];

const CHART_DATA = [
  { month: 'Jul', revenue: 42, cost: 28 },
  { month: 'Aug', revenue: 38, cost: 25 },
  { month: 'Sep', revenue: 55, cost: 30 },
  { month: 'Oct', revenue: 62, cost: 33 },
  { month: 'Nov', revenue: 48, cost: 28 },
  { month: 'Dec', revenue: 71, cost: 35 },
];

const TYPE_COLOR: Record<string, string> = { Yield: 'var(--color-emerald)', Soil: '#8B5CF6', Water: 'var(--color-info)', Financial: 'var(--color-gold)', Pest: 'var(--color-error)' };

export default function ReportsPage() {
  const [reports, setReports] = useState(REPORTS);

  const handleDownload = (title: string) => toast.success(`Downloading "${title}"...`);
  const handleGenerate = () => { toast.success('Generating new report...'); };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Download and analyse farm performance reports."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={<Button leftIcon={<MdRefresh />} onClick={handleGenerate}>Generate Report</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Revenue vs Cost Trend</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>₹ lakhs, last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F5E3A" stopOpacity={0.2} /><stop offset="95%" stopColor="#0F5E3A" stopOpacity={0} /></linearGradient>
                <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0F5E3A" fill="url(#rev)" strokeWidth={2.5} name="Revenue ₹L" />
              <Area type="monotone" dataKey="cost" stroke="#EF4444" fill="url(#cost)" strokeWidth={2} name="Cost ₹L" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Quick Stats</h3>
          {[
            { label: 'Total Revenue (Dec)', value: '₹71L', trend: '+18%', up: true },
            { label: 'Total Expenses (Dec)', value: '₹35L', trend: '+6%', up: false },
            { label: 'Net Profit', value: '₹36L', trend: '+32%', up: true },
            { label: 'Yield Efficiency', value: '94%', trend: '+2%', up: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                <span style={{ fontSize: 12, color: s.up ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>{s.up ? '↑' : '↓'} {s.trend}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Available Reports</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${TYPE_COLOR[r.type]}22`, color: TYPE_COLOR[r.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                <MdAssessment />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{r.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.type} · {r.period} {r.size !== '—' && `· ${r.size}`}</p>
              </div>
              <Badge variant={r.status === 'Ready' ? 'success' : 'warning'} dot>{r.status}</Badge>
              {r.status === 'Ready' && (
                <Button variant="outline" size="sm" leftIcon={<MdDownload />} onClick={() => handleDownload(r.title)}>
                  Download
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
