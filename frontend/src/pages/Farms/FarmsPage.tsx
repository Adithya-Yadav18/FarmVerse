import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdAdd, MdLocationOn, MdAgriculture } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { SearchFilter } from '../../components/ui/SearchFilter/SearchFilter';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import type { Farm } from '../../types';
import styles from './FarmsPage.module.css';

const MOCK_FARMS: Farm[] = [
  { id: '1', name: 'North Valley Farm', location: 'Punjab, India', area: 45, areaUnit: 'hectares', soilType: 'Alluvial', status: 'Active', ownerId: '1', crops: ['Wheat', 'Rice'], createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
  { id: '2', name: 'Riverside Estate', location: 'Haryana, India', area: 32, areaUnit: 'hectares', soilType: 'Sandy Loam', status: 'Active', ownerId: '1', crops: ['Corn', 'Soybean'], createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-06-10T00:00:00Z' },
  { id: '3', name: 'Golden Fields', location: 'UP, India', area: 60, areaUnit: 'hectares', soilType: 'Clay', status: 'Inactive', ownerId: '1', crops: ['Cotton'], createdAt: '2024-03-12T00:00:00Z', updatedAt: '2024-05-22T00:00:00Z' },
  { id: '4', name: 'Green Acres', location: 'MP, India', area: 28, areaUnit: 'hectares', soilType: 'Red Soil', status: 'Harvested', ownerId: '1', crops: ['Sugarcane'], createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-06-15T00:00:00Z' },
  { id: '5', name: 'Sunflower Ranch', location: 'Rajasthan, India', area: 52, areaUnit: 'hectares', soilType: 'Desert Sandy', status: 'Active', ownerId: '1', crops: ['Sunflower', 'Groundnut'], createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-06-18T00:00:00Z' },
];

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLoc, setNewFarmLoc] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setTimeout(() => { setFarms(MOCK_FARMS); setLoading(false); }, 700);
  }, []);

  const filtered = farms.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      f.location.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { page, totalPages, goToPage, canPrev, canNext, pageNumbers, limit } = usePagination({ total: filtered.length, pageSize: 6 });
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const handleDelete = () => {
    if (!deleteId) return;
    setFarms(prev => prev.filter(f => f.id !== deleteId));
    toast.success('Farm deleted successfully');
    setDeleteId(null);
  };

  const handleAdd = () => {
    if (!newFarmName.trim()) { toast.error('Farm name is required'); return; }
    const newFarm: Farm = {
      id: String(Date.now()), name: newFarmName, location: newFarmLoc,
      area: 0, areaUnit: 'hectares', soilType: 'Unknown', status: 'Active',
      ownerId: '1', crops: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setFarms(prev => [newFarm, ...prev]);
    toast.success('Farm added successfully');
    setShowAddModal(false);
    setNewFarmName(''); setNewFarmLoc('');
  };

  return (
    <div>
      <PageHeader
        title="Farms"
        subtitle="Manage all your registered farms and fields."
        breadcrumbs={[{ label: 'Farms' }]}
        actions={
          <Button leftIcon={<MdAdd />} onClick={() => setShowAddModal(true)}>
            Add Farm
          </Button>
        }
      />

      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search farms..."
        filters={[{
          key: 'status', label: 'Status',
          options: [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }, { label: 'Harvested', value: 'Harvested' }],
          value: statusFilter, onChange: setStatusFilter,
        }]}
        onClear={() => { setSearch(''); setStatusFilter(''); }}
      />

      <div className={styles.farmsGrid} style={{ marginTop: 24 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : paged.map((farm, i) => (
            <motion.div
              key={farm.id}
              className={styles.farmCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className={styles.farmCardHeader}>
                <div className={styles.farmIcon}><MdAgriculture size={22} /></div>
                <Badge variant={statusVariant(farm.status)} dot>{farm.status}</Badge>
              </div>
              <h3 className={styles.farmName}>{farm.name}</h3>
              <p className={styles.farmLoc}><MdLocationOn size={14} /> {farm.location}</p>
              <div className={styles.farmMeta}>
                <span>{farm.area} {farm.areaUnit}</span>
                <span>{farm.soilType}</span>
              </div>
              <div className={styles.farmCrops}>
                {farm.crops.slice(0, 3).map(c => (
                  <span key={c} className={styles.cropTag}>{c}</span>
                ))}
              </div>
              <div className={styles.farmActions}>
                <Button variant="outline" size="sm" style={{ flex: 1 }}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteId(farm.id)}>Delete</Button>
              </div>
            </motion.div>
          ))
        }
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <MdAgriculture size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No farms found. Try adjusting your search.</p>
        </div>
      )}

      <Pagination
        page={page} totalPages={totalPages} onPageChange={goToPage}
        canPrev={canPrev} canNext={canNext} pageNumbers={pageNumbers}
        total={filtered.length} limit={limit}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Farm"
        message="Are you sure you want to delete this farm? All associated data will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Farm"
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Farm"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAdd}>Add Farm</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Farm Name" placeholder="e.g. North Valley Farm" value={newFarmName} onChange={e => setNewFarmName(e.target.value)} />
          <Input label="Location" placeholder="e.g. Punjab, India" value={newFarmLoc} onChange={e => setNewFarmLoc(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
