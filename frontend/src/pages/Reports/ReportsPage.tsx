import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdAssessment,
  MdDownload,
  MdRefresh,
  MdVisibility,
  MdDeleteOutline,
  MdAdd,
  MdFilterList,
  MdScience,
  MdWaterDrop,
  MdBugReport,
  MdAgriculture,
  MdDateRange,
  MdCheckCircle,
} from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { Modal } from '../../components/ui/Modal/Modal';
import { reportService } from '../../services/reportService';
import api from '../../services/api';
import type { Report, ReportStats, GenerateReportRequest, Farm } from '../../types';
import toast from 'react-hot-toast';

const CHART_DATA = [
  { month: 'Jul', revenue: 42, cost: 28 },
  { month: 'Aug', revenue: 38, cost: 25 },
  { month: 'Sep', revenue: 55, cost: 30 },
  { month: 'Oct', revenue: 62, cost: 33 },
  { month: 'Nov', revenue: 48, cost: 28 },
  { month: 'Dec', revenue: 71, cost: 35 },
];

const CATEGORIES = [
  { key: 'ALL', label: 'All Dossiers', icon: <MdFilterList /> },
  { key: 'AGRONOMY_COMPREHENSIVE', label: 'Field Comprehensive', icon: <MdAgriculture /> },
  { key: 'SOIL_NUTRIENT', label: 'Soil & Chemistry', icon: <MdScience /> },
  { key: 'DISEASE_SURVEILLANCE', label: 'Crop Pathology', icon: <MdBugReport /> },
  { key: 'IRRIGATION_EFFICIENCY', label: 'Water & Irrigation', icon: <MdWaterDrop /> },
  { key: 'CROP_CYCLE_SUMMARY', label: 'Phenology & Harvest', icon: <MdAssessment /> },
];

const TYPE_BADGE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  AGRONOMY_COMPREHENSIVE: { bg: 'rgba(16, 120, 80, 0.12)', color: '#0F5E3A', label: 'Comprehensive' },
  SOIL_NUTRIENT: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', label: 'Soil Health' },
  DISEASE_SURVEILLANCE: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', label: 'Pathology' },
  IRRIGATION_EFFICIENCY: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', label: 'Irrigation' },
  CROP_CYCLE_SUMMARY: { bg: 'rgba(217, 160, 30, 0.15)', color: '#B47E10', label: 'Crop Cycle' },
  // Backward compatibility aliases
  Yield: { bg: 'rgba(16, 120, 80, 0.12)', color: '#0F5E3A', label: 'Yield' },
  Soil: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', label: 'Soil' },
  Water: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', label: 'Water' },
  Financial: { bg: 'rgba(217, 160, 30, 0.15)', color: '#B47E10', label: 'Financial' },
  Pest: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', label: 'Pest' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generation Modal state
  const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genForm, setGenForm] = useState<GenerateReportRequest>({
    farmId: undefined,
    reportType: 'AGRONOMY_COMPREHENSIVE',
    dateRange: 'Last 30 Days',
    notes: '',
  });

  // Preview Modal state
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
    id: string | number | null;
  }>({
    isOpen: false,
    url: null,
    title: '',
    id: null,
  });

  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  // Fetch Reports and Stats from Backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportsData, statsData] = await Promise.allSettled([
        reportService.getReports(activeCategory),
        reportService.getReportStats(),
      ]);

      if (reportsData.status === 'fulfilled') {
        setReports(reportsData.value);
      }
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
    } catch {
      toast.error('Failed to load reports from server.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  // Fetch Farms for Generator Dropdown
  const loadFarms = useCallback(async () => {
    try {
      const res = await api.get('/farms');
      if (Array.isArray(res.data)) {
        setFarms(res.data);
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        setFarms(res.data.data);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadData();
    loadFarms();
  }, [loadData, loadFarms]);

  // Handle Generate Submission
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genForm.reportType) {
      toast.error('Please select a report type.');
      return;
    }

    setIsGenerating(true);
    try {
      const newReport = await reportService.generateReport(genForm);
      toast.success(`Dossier "${newReport.reportTitle || 'Report'}" generated successfully!`);
      setIsGenerateOpen(false);
      setGenForm({
        farmId: undefined,
        reportType: 'AGRONOMY_COMPREHENSIVE',
        dateRange: 'Last 30 Days',
        notes: '',
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating PDF report.';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Binary Download
  const handleDownload = async (report: Report) => {
    setDownloadingId(report.id);
    const toastId = toast.loading(`Preparing PDF download for "${report.reportTitle || report.title}"...`);
    try {
      const filename = `${(report.reportTitle || report.title || 'FarmVerse_Report').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      await reportService.downloadReport(report.id, filename);
      toast.success('Download complete!', { id: toastId });
      loadData(); // Refresh download count
    } catch {
      toast.error('Failed to download PDF. Please try again.', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Preview
  const handlePreview = async (report: Report) => {
    const toastId = toast.loading('Rendering PDF preview...');
    try {
      const url = await reportService.previewReportUrl(report.id);
      setPreviewState({
        isOpen: true,
        url,
        title: report.reportTitle || report.title || 'Agronomy Report Preview',
        id: report.id,
      });
      toast.dismiss(toastId);
    } catch {
      toast.error('Failed to render PDF preview.', { id: toastId });
    }
  };

  const closePreview = () => {
    if (previewState.url) {
      window.URL.revokeObjectURL(previewState.url);
    }
    setPreviewState({ isOpen: false, url: null, title: '', id: null });
  };

  // Handle Delete
  const handleDelete = async (id: string | number, title?: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this report'}"?`)) {
      return;
    }
    try {
      await reportService.deleteReport(id);
      toast.success('Report removed.');
      setReports(prev => prev.filter(r => r.id !== id));
      loadData();
    } catch {
      toast.error('Failed to delete report.');
    }
  };

  // Client-side Filter
  const filteredReports = reports.filter(r => {
    const title = (r.reportTitle || r.title || '').toLowerCase();
    const farm = (r.farmName || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || farm.includes(query);
  });

  return (
    <div>
      <PageHeader
        title="Agronomy Reports & Field Dossiers"
        subtitle="Cryptographically verified PDF reports aggregating multi-domain sensor telemetry, soil tests, and AI pathology."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" leftIcon={<MdRefresh />} onClick={loadData}>
              Refresh
            </Button>
            <Button variant="primary" leftIcon={<MdAdd />} onClick={() => setIsGenerateOpen(true)}>
              Generate Report
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 120, 80, 0.12)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <MdAgriculture />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Dossiers</p>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {stats ? stats.totalReports : reports.length}
              </h3>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <MdScience />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Soil Analyses</p>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {stats ? stats.soilCount : reports.filter(r => (r.reportType || r.type) === 'SOIL_NUTRIENT').length}
              </h3>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <MdBugReport />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pathology Audits</p>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {stats ? stats.diseaseCount : reports.filter(r => (r.reportType || r.type) === 'DISEASE_SURVEILLANCE').length}
              </h3>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217, 160, 30, 0.15)', color: '#B47E10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <MdDownload />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>PDF Downloads</p>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {stats ? stats.totalDownloads : reports.reduce((sum, r) => sum + (r.downloadCount || 0), 0)}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics & Performance Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Farm Yield & Revenue Dynamics</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Financial and operational balance trajectory (₹ lakhs, last 6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F5E3A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0F5E3A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
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
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Agronomy Compliance & Index</h3>
          {[
            { label: 'Soil Health Index', value: '88/100', trend: '+4 pts', up: true },
            { label: 'Phytosanitary Risk', value: 'Low', trend: '-12%', up: true },
            { label: 'Irrigation Water Savings', value: '28.4 kL', trend: '+18%', up: true },
            { label: 'Field Verification Ratio', value: '100%', trend: 'Certified', up: true },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                <span style={{ fontSize: 12, color: s.up ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>{s.trend}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: activeCategory === cat.key ? '1px solid var(--color-emerald)' : '1px solid var(--border-color)',
                background: activeCategory === cat.key ? 'var(--color-emerald)' : 'var(--bg-card)',
                color: activeCategory === cat.key ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ width: 280 }}>
          <input
            type="text"
            placeholder="Search dossiers or farms..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Dossier Cards List */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Available Agronomy Dossiers ({filteredReports.length})
          </h3>
          {isLoading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading documents...</span>}
        </div>

        {filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <MdAssessment style={{ fontSize: 48, opacity: 0.4, marginBottom: 8 }} />
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No reports found</h4>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Generate an agronomy dossier to synthesize soil, crop, and irrigation telemetry.</p>
            <Button variant="primary" leftIcon={<MdAdd />} onClick={() => setIsGenerateOpen(true)}>
              Generate First Dossier
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence>
              {filteredReports.map((r, i) => {
                const reportType = r.reportType || r.type || 'AGRONOMY_COMPREHENSIVE';
                const badgeInfo = TYPE_BADGE_STYLE[reportType] || { bg: 'rgba(16, 120, 80, 0.12)', color: '#0F5E3A', label: 'Report' };

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '16px 20px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--border-radius)',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 280 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: badgeInfo.bg,
                          color: badgeInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <MdAssessment />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>
                            {r.reportTitle || r.title || 'Agronomy Report'}
                          </h4>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: badgeInfo.bg,
                              color: badgeInfo.color,
                            }}
                          >
                            {badgeInfo.label}
                          </span>
                          <Badge variant={(r.status === 'READY' || r.status === 'Ready') ? 'success' : 'warning'} dot>
                            {r.status || 'READY'}
                          </Badge>
                        </div>

                        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span>Farm: <strong>{r.farmName || 'All Farms'}</strong></span>
                          <span>•</span>
                          <span>Range: <strong>{r.dateRange || r.period || 'Season'}</strong></span>
                          <span>•</span>
                          <span>Size: <strong>{r.fileSize || r.size || 'PDF'}</strong></span>
                          {r.downloadCount !== undefined && (
                            <>
                              <span>•</span>
                              <span>Downloads: <strong>{r.downloadCount}</strong></span>
                            </>
                          )}
                        </p>

                        {r.summary && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, maxWidth: 680, lineHeight: 1.4 }}>
                            {r.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<MdVisibility />}
                        onClick={() => handlePreview(r)}
                      >
                        Preview
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<MdDownload />}
                        loading={downloadingId === r.id}
                        onClick={() => handleDownload(r)}
                      >
                        Download PDF
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id, r.reportTitle || r.title)}
                        aria-label="Delete report"
                      >
                        <MdDeleteOutline style={{ fontSize: 18, color: 'var(--color-error)' }} />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Synthesize Agronomy PDF Dossier"
        size="lg"
      >
        <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Generate a certified, vector-rendered PDF document integrating live telemetry from sensor networks, lab tests, and disease surveillance models.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Target Farm Scope
            </label>
            <select
              value={genForm.farmId ?? ''}
              onChange={e => setGenForm({ ...genForm, farmId: e.target.value ? Number(e.target.value) : undefined })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              <option value="">All Registered Farms / Global Scope</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location || 'Active'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Dossier Classification / Report Type
            </label>
            <select
              value={genForm.reportType}
              onChange={e => setGenForm({ ...genForm, reportType: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              <option value="AGRONOMY_COMPREHENSIVE">Comprehensive Agronomy & Field Health Dossier (Full Suite)</option>
              <option value="SOIL_NUTRIENT">Soil Chemistry & Macronutrient Telemetry (pH, N-P-K, Moisture)</option>
              <option value="DISEASE_SURVEILLANCE">Crop Pathology & AI Disease Surveillance Audit</option>
              <option value="IRRIGATION_EFFICIENCY">Precision Water Balance & Irrigation Regimen</option>
              <option value="CROP_CYCLE_SUMMARY">Crop Phenology & Seasonal Cultivation Cycle</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Reporting Time Horizon
            </label>
            <select
              value={genForm.dateRange}
              onChange={e => setGenForm({ ...genForm, dateRange: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Current Season (Q1 2026)">Current Season (Q1 2026)</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Annual Audit 2026">Annual Audit 2026</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Agronomist Directives & Special Observations (Optional)
            </label>
            <textarea
              rows={3}
              value={genForm.notes}
              onChange={e => setGenForm({ ...genForm, notes: e.target.value })}
              placeholder="e.g., Note down foliar nitrogen recommendations, biosecurity measures, or soil amendment plans..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="outline" type="button" onClick={() => setIsGenerateOpen(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isGenerating}>
              {isGenerating ? 'Synthesizing Vector PDF...' : 'Compile & Save PDF'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* In-Browser PDF Preview Modal */}
      <Modal
        isOpen={previewState.isOpen}
        onClose={closePreview}
        title={previewState.title}
        size="xl"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 14px', borderRadius: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              OpenPDF Dynamic Vector Preview • 100% Client-Side Rendered
            </span>
            {previewState.id && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<MdDownload />}
                onClick={() => {
                  const target = reports.find(r => r.id === previewState.id);
                  if (target) handleDownload(target);
                }}
              >
                Save Copy
              </Button>
            )}
          </div>

          {previewState.url && (
            <iframe
              src={previewState.url}
              title="PDF Report Viewer"
              style={{
                width: '100%',
                height: '70vh',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                background: '#FFFFFF',
              }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={closePreview}>
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
