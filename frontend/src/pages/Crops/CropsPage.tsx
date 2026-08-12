import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdGrass } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { SearchFilter } from '../../components/ui/SearchFilter/SearchFilter';
import { Table, type Column } from '../../components/ui/Table/Table';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils';
import type { Crop } from '../../types';

const MOCK_CROPS: Crop[] = [
  { id: '1', name: 'Wheat', variety: 'HD-2967', farmId: '1', farmName: 'North Valley Farm', plantedDate: '2024-11-01T00:00:00Z', expectedHarvestDate: '2025-03-15T00:00:00Z', status: 'Growing', area: 12, yield: 0, createdAt: '2024-11-01T00:00:00Z' },
  { id: '2', name: 'Rice', variety: 'Basmati 370', farmId: '1', farmName: 'North Valley Farm', plantedDate: '2024-06-10T00:00:00Z', expectedHarvestDate: '2024-10-20T00:00:00Z', status: 'Harvested', area: 8, yield: 42, createdAt: '2024-06-10T00:00:00Z' },
  { id: '3', name: 'Corn', variety: 'Pioneer P30B74', farmId: '2', farmName: 'Riverside Estate', plantedDate: '2024-04-05T00:00:00Z', expectedHarvestDate: '2024-08-30T00:00:00Z', status: 'Flowering', area: 15, yield: 0, createdAt: '2024-04-05T00:00:00Z' },
  { id: '4', name: 'Soybean', variety: 'JS-335', farmId: '2', farmName: 'Riverside Estate', plantedDate: '2024-07-01T00:00:00Z', expectedHarvestDate: '2024-11-10T00:00:00Z', status: 'Planted', area: 10, yield: 0, createdAt: '2024-07-01T00:00:00Z' },
  { id: '5', name: 'Cotton', variety: 'DCH-32', farmId: '3', farmName: 'Golden Fields', plantedDate: '2024-05-20T00:00:00Z', expectedHarvestDate: '2024-12-01T00:00:00Z', status: 'Growing', area: 20, yield: 0, createdAt: '2024-05-20T00:00:00Z' },
  { id: '6', name: 'Tomato', variety: 'Pusa Ruby', farmId: '1', farmName: 'North Valley Farm', plantedDate: '2024-09-15T00:00:00Z', expectedHarvestDate: '2024-12-30T00:00:00Z', status: 'Failed', area: 3, yield: 0, createdAt: '2024-09-15T00:00:00Z' },
];

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setTimeout(() => { setCrops(MOCK_CROPS); setLoading(false); }, 700); }, []);

  const filtered = crops.filter(c => {
    const m = c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.farmName.toLowerCase().includes(debouncedSearch.toLowerCase());
    return m && (!statusFilter || c.status === statusFilter);
  });

  const { page, totalPages, goToPage, canPrev, canNext, pageNumbers, limit } = usePagination({ total: filtered.length });
  const paged = filtered.slice((page - 1) * limit, page * limit) as unknown as Record<string, unknown>[];

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'name', label: 'Crop Name', sortable: true },
    { key: 'variety', label: 'Variety' },
    { key: 'farmName', label: 'Farm' },
    { key: 'area', label: 'Area (ha)', sortable: true, render: v => `${v} ha` },
    { key: 'plantedDate', label: 'Planted', render: v => formatDate(v as string) },
    { key: 'expectedHarvestDate', label: 'Harvest', render: v => formatDate(v as string) },
    { key: 'status', label: 'Status', render: v => <Badge variant={statusVariant(v as string)} dot>{v as string}</Badge> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="ghost" size="sm">Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteId(row.id as string)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Crop Management"
        subtitle="Track and manage all your crop cycles."
        breadcrumbs={[{ label: 'Crops' }]}
        actions={<Button leftIcon={<MdAdd />}>Add Crop</Button>}
      />

      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search crops or farms..."
        filters={[{
          key: 'status', label: 'Status',
          options: ['Planted', 'Growing', 'Flowering', 'Harvested', 'Failed'].map(s => ({ label: s, value: s })),
          value: statusFilter, onChange: setStatusFilter,
        }]}
        onClear={() => { setSearch(''); setStatusFilter(''); }}
      />

      <div style={{ marginTop: 20 }}>
        <Table
          columns={columns}
          data={paged}
          loading={loading}
          emptyMessage="No crops found"
          emptyIcon={<MdGrass />}
          keyExtractor={r => r.id as string}
        />
        <Pagination
          page={page} totalPages={totalPages} onPageChange={goToPage}
          canPrev={canPrev} canNext={canNext} pageNumbers={pageNumbers}
          total={filtered.length} limit={limit}
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { setCrops(c => c.filter(x => x.id !== deleteId)); toast.success('Crop deleted'); setDeleteId(null); }}
        message="Delete this crop record permanently?"
        confirmLabel="Delete Crop"
      />
    </div>
  );
}
