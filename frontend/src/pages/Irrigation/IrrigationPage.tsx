import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdWaterDrop, MdPlayArrow, MdPause, MdStop } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { StatCard } from '../../components/ui/Card/Card';
import { SearchFilter } from '../../components/ui/SearchFilter/SearchFilter';
import { Table, type Column } from '../../components/ui/Table/Table';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import type { IrrigationSchedule } from '../../types';

const MOCK: IrrigationSchedule[] = [
  { id: '1', farmId: '1', farmName: 'North Valley Farm', zone: 'Zone A', startTime: '2025-01-10T06:00:00Z', duration: 45, waterVolume: 2400, status: 'Active', method: 'Drip', automated: true, nextRun: '2025-01-11T06:00:00Z' },
  { id: '2', farmId: '1', farmName: 'North Valley Farm', zone: 'Zone B', startTime: '2025-01-10T08:00:00Z', duration: 30, waterVolume: 1800, status: 'Scheduled', method: 'Sprinkler', automated: true, nextRun: '2025-01-12T08:00:00Z' },
  { id: '3', farmId: '2', farmName: 'Riverside Estate', zone: 'Block C', startTime: '2025-01-09T14:00:00Z', duration: 60, waterVolume: 3200, status: 'Completed', method: 'Flood', automated: false },
  { id: '4', farmId: '3', farmName: 'Golden Fields', zone: 'Sector 1', startTime: '2025-01-10T10:00:00Z', duration: 90, waterVolume: 5400, status: 'Paused', method: 'Center Pivot', automated: true },
];

export default function IrrigationPage() {
  const [data, setData] = useState<IrrigationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setTimeout(() => { setData(MOCK); setLoading(false); }, 700); }, []);

  const filtered = data.filter(d =>
    (d.farmName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      d.zone.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  );

  const { page, totalPages, goToPage, canPrev, canNext, pageNumbers, limit } = usePagination({ total: filtered.length });
  const paged = filtered.slice((page - 1) * limit, page * limit) as unknown as Record<string, unknown>[];

  const toggleStatus = (id: string, action: string) => {
    setData(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newStatus = action === 'start' ? 'Active' : action === 'pause' ? 'Paused' : 'Completed';
      toast.success(`Zone ${action}ed successfully`);
      return { ...d, status: newStatus as IrrigationSchedule['status'] };
    }));
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'farmName', label: 'Farm', sortable: true },
    { key: 'zone', label: 'Zone' },
    { key: 'method', label: 'Method' },
    { key: 'duration', label: 'Duration', render: v => `${v} min` },
    { key: 'waterVolume', label: 'Volume', render: v => `${Number(v).toLocaleString()} L` },
    { key: 'automated', label: 'Auto', render: v => <Badge variant={v ? 'success' : 'neutral'}>{v ? 'Yes' : 'No'}</Badge> },
    { key: 'status', label: 'Status', render: v => <Badge variant={statusVariant(v as string)} dot>{v as string}</Badge> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => {
        const s = row.status as string;
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            {s !== 'Active' && <button onClick={() => toggleStatus(row.id as string, 'start')} style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center' }}><MdPlayArrow /></button>}
            {s === 'Active' && <button onClick={() => toggleStatus(row.id as string, 'pause')} style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center' }}><MdPause /></button>}
            <button onClick={() => toggleStatus(row.id as string, 'stop')} style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center' }}><MdStop /></button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Irrigation Management"
        subtitle="Monitor and control irrigation schedules across all zones."
        breadcrumbs={[{ label: 'Irrigation' }]}
        actions={<Button leftIcon={<MdAdd />}>New Schedule</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
        <StatCard label="Active Zones" value={data.filter(d => d.status === 'Active').length.toString()} icon={<MdWaterDrop />} iconBg="#DBEAFE" iconColor="#3B82F6" />
        <StatCard label="Scheduled" value={data.filter(d => d.status === 'Scheduled').length.toString()} icon={<MdWaterDrop />} iconBg="#FEF3C7" iconColor="#F59E0B" />
        <StatCard label="Today's Usage (L)" value={data.reduce((a, d) => a + (d.status !== 'Scheduled' ? d.waterVolume : 0), 0).toLocaleString()} icon={<MdWaterDrop />} iconBg="#D8F3DC" iconColor="#0F5E3A" />
        <StatCard label="Automated" value={data.filter(d => d.automated).length.toString()} icon={<MdWaterDrop />} iconBg="#D8F3DC" iconColor="#52B788" />
      </div>

      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search farm or zone..."
        filters={[{
          key: 'status', label: 'Status',
          options: ['Active', 'Scheduled', 'Completed', 'Paused'].map(s => ({ label: s, value: s })),
          value: statusFilter, onChange: setStatusFilter,
        }]}
        onClear={() => { setSearch(''); setStatusFilter(''); }}
      />

      <div style={{ marginTop: 20 }}>
        <Table columns={columns} data={paged} loading={loading} emptyMessage="No irrigation schedules found" keyExtractor={r => r.id as string} />
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} canPrev={canPrev} canNext={canNext} pageNumbers={pageNumbers} total={filtered.length} limit={limit} />
      </div>
    </div>
  );
}
