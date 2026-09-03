import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdGrass, MdSecurity } from 'react-icons/md';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Button } from '../../components/ui/Button/Button';
import { SearchFilter } from '../../components/ui/SearchFilter/SearchFilter';
import { Table, type Column } from '../../components/ui/Table/Table';
import { Badge, statusVariant } from '../../components/ui/Badge/Badge';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { Modal } from '../../components/ui/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils';
import type { Crop, Farm } from '../../types';
import api from '../../services/api';

export default function CropsPage() {
  const { user } = useAuth();
  const isAgronomist = user?.role === 'Agronomist';
  const isAdmin = user?.role === 'Admin';
  const canManageCrops = !isAgronomist || isAdmin;

  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCrop, setNewCrop] = useState<Partial<Crop> & { farmId?: string }>({ status: 'Planted', area: 0 });
  const [editCrop, setEditCrop] = useState<Crop | null>(null);

  // Fetch real crops and farms
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cropsRes, farmsRes] = await Promise.all([
          api.get('/crops'),
          api.get('/farms')
        ]);
        setCrops(cropsRes.data);
        setFarms(farmsRes.data);
      } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to load crop records';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = crops.filter(c => {
    const m = c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.farmName?.toLowerCase().includes(debouncedSearch.toLowerCase());
    return m && (!statusFilter || c.status === statusFilter);
  });

  const { page, totalPages, goToPage, canPrev, canNext, pageNumbers, limit } = usePagination({ total: filtered.length });
  const paged = filtered.slice((page - 1) * limit, page * limit) as unknown as Record<string, unknown>[];

  const handleAdd = async () => {
    const name = (newCrop.name || '').trim();
    const variety = (newCrop.variety || '').trim();
    const farmId = newCrop.farmId;
    const areaNum = Number(newCrop.area);
    const planted = newCrop.plantedDate;
    const harvest = newCrop.expectedHarvestDate;

    if (name.length < 2 || name.length > 100) {
      toast.error('Crop name must be between 2 and 100 characters');
      return;
    }
    if (variety.length < 1 || variety.length > 100) {
      toast.error('Variety is required');
      return;
    }
    if (!farmId) {
      toast.error('Please select an active farm');
      return;
    }
    if (isNaN(areaNum) || areaNum <= 0) {
      toast.error('Crop area must be greater than 0 hectares');
      return;
    }
    if (!planted) {
      toast.error('Planting date is required');
      return;
    }
    if (!harvest) {
      toast.error('Expected harvest date is required');
      return;
    }
    if (new Date(harvest) < new Date(planted)) {
      toast.error('Expected harvest date cannot be before planting date');
      return;
    }

    // Capacity verification
    const chosenFarm = farms.find(f => String(f.id) === String(farmId));
    if (chosenFarm && chosenFarm.area && areaNum > chosenFarm.area) {
      toast.error(`Crop area (${areaNum} ha) exceeds total farm acreage (${chosenFarm.area} ha)`);
      return;
    }

    try {
      const response = await api.post('/crops', {
        cropName: name,
        variety,
        plantingDate: planted,
        expectedHarvestDate: harvest,
        status: newCrop.status || 'Planted',
        area: areaNum,
        farmId: Number(farmId)
      });
      setCrops(prev => [response.data, ...prev]);
      toast.success('Crop registered successfully');
      setShowAddModal(false);
      setNewCrop({ status: 'Planted', area: 0 });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to add crop';
      toast.error(msg);
    }
  };

  const handleEditSave = async () => {
    if (!editCrop) return;
    const name = (editCrop.name || '').trim();
    const variety = (editCrop.variety || '').trim();
    const areaNum = Number(editCrop.area);
    const planted = editCrop.plantedDate;
    const harvest = editCrop.expectedHarvestDate;

    if (name.length < 2 || name.length > 100) {
      toast.error('Crop name must be between 2 and 100 characters');
      return;
    }
    if (variety.length < 1 || variety.length > 100) {
      toast.error('Variety is required');
      return;
    }
    if (isNaN(areaNum) || areaNum <= 0) {
      toast.error('Crop area must be greater than 0 hectares');
      return;
    }
    if (planted && harvest && new Date(harvest) < new Date(planted)) {
      toast.error('Expected harvest date cannot be before planting date');
      return;
    }

    try {
      await api.put(`/crops/${editCrop.id}`, {
        cropName: name,
        variety,
        plantingDate: planted,
        expectedHarvestDate: harvest,
        status: editCrop.status,
        area: areaNum,
      });
      setCrops(prev => prev.map(f => f.id === editCrop.id ? { ...editCrop, name, variety, area: areaNum } : f));
      toast.success('Crop updated successfully');
      setEditCrop(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to update crop';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/crops/${deleteId}`);
      setCrops(c => c.filter(x => String(x.id) !== deleteId));
      toast.success('Crop cycle removed');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete crop';
      toast.error(msg);
    } finally {
      setDeleteId(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'name', label: 'Crop Name', sortable: true },
    { key: 'variety', label: 'Variety' },
    { key: 'farmName', label: 'Farm' },
    { key: 'area', label: 'Area (ha)', sortable: true, render: v => `${v || 0} ha` },
    { key: 'plantedDate', label: 'Planted', render: v => v ? formatDate(v as string) : '-' },
    { key: 'expectedHarvestDate', label: 'Harvest', render: v => v ? formatDate(v as string) : '-' },
    { key: 'status', label: 'Status', render: v => <Badge variant={statusVariant(v as string || 'Unknown')} dot>{v as string || 'Unknown'}</Badge> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        canManageCrops ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="ghost" size="sm" onClick={() => setEditCrop(row as unknown as Crop)}>Edit</Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteId(row.id as string)}>Delete</Button>
          </div>
        ) : (
          <Badge variant="info">Surveillance</Badge>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isAgronomist ? "Crop Cycle Surveillance" : "Crop Management"}
        subtitle={
          isAgronomist
            ? "Monitoring crop phenology, variety performance, and harvest timelines across fields."
            : "Track and manage all your active crop cycles, planting dates, and harvest projections."
        }
        breadcrumbs={[{ label: 'Crops' }]}
        actions={
          canManageCrops ? (
            <Button leftIcon={<MdAdd />} onClick={() => setShowAddModal(true)}>Add Crop</Button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--color-primary, #3B82F6)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              <MdSecurity size={16} /> Agronomist Field View
            </div>
          )
        }
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
        onConfirm={handleDelete}
        message="Delete this crop record permanently? This action cannot be undone."
        confirmLabel="Delete Crop"
      />

      {/* ADD CROP MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Crop Cycle"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAdd}>Add Crop</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Crop Name" placeholder="e.g. Wheat" value={newCrop.name || ''} onChange={e => setNewCrop({...newCrop, name: e.target.value})} />
          <Input label="Variety" placeholder="e.g. HD-2967" value={newCrop.variety || ''} onChange={e => setNewCrop({...newCrop, variety: e.target.value})} />
          
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Select Farm</label>
            <select 
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={newCrop.farmId || ''} 
              onChange={e => setNewCrop({...newCrop, farmId: e.target.value})}
            >
              <option value="" disabled>Select a farm...</option>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name} ({f.area || 0} ha)</option>)}
            </select>
          </div>

          <Input label="Area (hectares)" type="number" placeholder="e.g. 12" value={newCrop.area as number || ''} onChange={e => setNewCrop({...newCrop, area: Number(e.target.value)})} />
          <Input label="Planted Date" type="date" value={newCrop.plantedDate ? newCrop.plantedDate.split('T')[0] : ''} onChange={e => setNewCrop({...newCrop, plantedDate: e.target.value})} />
          <Input label="Expected Harvest Date" type="date" value={newCrop.expectedHarvestDate ? newCrop.expectedHarvestDate.split('T')[0] : ''} onChange={e => setNewCrop({...newCrop, expectedHarvestDate: e.target.value})} />
          
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Growth Stage / Status</label>
            <select 
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={newCrop.status || 'Planted'} 
              onChange={e => setNewCrop({...newCrop, status: e.target.value as Crop['status']})}
            >
              <option value="Planted">Planted</option>
              <option value="Growing">Growing</option>
              <option value="Flowering">Flowering</option>
              <option value="Harvested">Harvested</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* EDIT CROP MODAL */}
      <Modal isOpen={!!editCrop} onClose={() => setEditCrop(null)} title="Edit Crop Details"
        footer={<><Button variant="ghost" onClick={() => setEditCrop(null)}>Cancel</Button><Button onClick={handleEditSave}>Save Changes</Button></>}>
        {editCrop && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Crop Name" value={editCrop.name || ''} onChange={e => setEditCrop({...editCrop, name: e.target.value})} />
            <Input label="Variety" value={editCrop.variety || ''} onChange={e => setEditCrop({...editCrop, variety: e.target.value})} />
            <Input label="Area (hectares)" type="number" value={editCrop.area || 0} onChange={e => setEditCrop({...editCrop, area: Number(e.target.value)})} />
            <Input label="Planted Date" type="date" value={editCrop.plantedDate ? editCrop.plantedDate.split('T')[0] : ''} onChange={e => setEditCrop({...editCrop, plantedDate: e.target.value})} />
            <Input label="Expected Harvest Date" type="date" value={editCrop.expectedHarvestDate ? editCrop.expectedHarvestDate.split('T')[0] : ''} onChange={e => setEditCrop({...editCrop, expectedHarvestDate: e.target.value})} />
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Growth Stage / Status</label>
              <select 
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
                value={editCrop.status || 'Planted'} 
                onChange={e => setEditCrop({...editCrop, status: e.target.value as Crop['status']})}
              >
                <option value="Planted">Planted</option>
                <option value="Growing">Growing</option>
                <option value="Flowering">Flowering</option>
                <option value="Harvested">Harvested</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}