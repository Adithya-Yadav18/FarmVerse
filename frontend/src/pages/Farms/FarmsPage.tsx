import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdAdd, MdLocationOn, MdAgriculture, MdEdit, MdSecurity, MdVisibility } from 'react-icons/md';
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
import { useAuth } from '../../context/AuthContext';
import type { Farm } from '../../types';
import styles from './FarmsPage.module.css';
import api from '../../services/api';

export default function FarmsPage() {
  const { user } = useAuth();
  const isAgronomist = user?.role === 'Agronomist';
  const isAdmin = user?.role === 'Admin';
  const canManageFarms = !isAgronomist || isAdmin;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarm, setNewFarm] = useState<{ name: string; location: string; area: string; soilType: string; status: Farm['status'] }>({
    name: '', location: '', area: '', soilType: '', status: 'Active'
  });
  
  const [editFarm, setEditFarm] = useState<Farm | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoading(true);
        const response = await api.get('/farms');
        setFarms(response.data.filter((f: Farm) => f !== null));
      } catch (error: any) {
        const msg = error.response?.data?.message || 'Failed to load farms from database';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, []);

  const filtered = farms.filter(f => {
    const farmName = f.name ? String(f.name).toLowerCase() : "";
    const farmLoc = f.location ? String(f.location).toLowerCase() : "";
    const farmStatus = f.status ? String(f.status) : "";
    
    const matchSearch = farmName.includes(debouncedSearch.toLowerCase()) ||
                        farmLoc.includes(debouncedSearch.toLowerCase());
                        
    const matchStatus = !statusFilter || farmStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const { page, totalPages, goToPage, canPrev, canNext, pageNumbers, limit } = usePagination({ total: filtered.length, pageSize: 6 });
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/farms/${deleteId}`);
      setFarms(prev => prev.filter(f => String(f.id) !== deleteId));
      toast.success('Farm deleted successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete farm';
      toast.error(msg);
    } finally {
      setDeleteId(null);
    }
  };

  const handleAdd = async () => {
    const name = newFarm.name.trim();
    const location = newFarm.location.trim();
    const areaNum = Number(newFarm.area);
    const soilType = newFarm.soilType.trim();

    if (name.length < 2 || name.length > 100) {
      toast.error('Farm name must be between 2 and 100 characters');
      return;
    }
    if (location.length < 2 || location.length > 150) {
      toast.error('Location must be between 2 and 150 characters');
      return;
    }
    if (isNaN(areaNum) || areaNum <= 0) {
      toast.error('Farm area must be greater than 0 hectares');
      return;
    }
    if (areaNum > 100000) {
      toast.error('Farm area cannot exceed 100,000 hectares');
      return;
    }
    if (soilType.length < 2 || soilType.length > 50) {
      toast.error('Soil type must be between 2 and 50 characters');
      return;
    }

    try {
      const response = await api.post('/farms', {
        name,
        location,
        area: areaNum,
        soilType,
        status: newFarm.status
      });
      setFarms(prev => [response.data, ...prev]);
      toast.success('Farm registered successfully');
      setShowAddModal(false);
      setNewFarm({ name: '', location: '', area: '', soilType: '', status: 'Active' });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to add farm';
      toast.error(msg);
    }
  };

  const handleEditSave = async () => {
    if (!editFarm) return;
    const name = (editFarm.name || '').trim();
    const location = (editFarm.location || '').trim();
    const areaNum = Number(editFarm.area);
    const soilType = (editFarm.soilType || '').trim();

    if (name.length < 2 || name.length > 100) {
      toast.error('Farm name must be between 2 and 100 characters');
      return;
    }
    if (location.length < 2 || location.length > 150) {
      toast.error('Location must be between 2 and 150 characters');
      return;
    }
    if (isNaN(areaNum) || areaNum <= 0) {
      toast.error('Farm area must be greater than 0 hectares');
      return;
    }
    if (areaNum > 100000) {
      toast.error('Farm area cannot exceed 100,000 hectares');
      return;
    }
    if (soilType.length < 2 || soilType.length > 50) {
      toast.error('Soil type must be between 2 and 50 characters');
      return;
    }

    try {
      await api.put(`/farms/${editFarm.id}`, {
        name,
        location,
        area: areaNum,
        soilType,
        status: editFarm.status
      });
      setFarms(prev => prev.map(f => f.id === editFarm.id ? { ...editFarm, name, location, area: areaNum, soilType } : f));
      toast.success('Farm updated successfully');
      setEditFarm(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to update farm';
      toast.error(msg);
    }
  };

  return (
    <div>
      <PageHeader
        title={isAgronomist ? "Farm & Field Surveillance" : "Farms & Fields"}
        subtitle={
          isAgronomist
            ? "Inspecting all registered agricultural plots, acreage, and soil baselines across linked farms."
            : "Manage all your registered farms, boundaries, and soil baselines."
        }
        breadcrumbs={[{ label: 'Farms' }]}
        actions={
          canManageFarms ? (
            <Button leftIcon={<MdAdd />} onClick={() => setShowAddModal(true)}>
              Add Farm
            </Button>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--color-primary, #3B82F6)', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              <MdSecurity size={16} /> Agronomist Inspection View
            </div>
          )
        }
      />

      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Search farms by name or location..."
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
              key={farm.id || i}
              className={styles.farmCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className={styles.farmCardHeader}>
                <div className={styles.farmIcon}><MdAgriculture size={22} /></div>
                <Badge variant={statusVariant(farm.status || 'Unknown')} dot>{farm.status || 'Unknown'}</Badge>
              </div>
              <h3 className={styles.farmName}>{farm.name || 'Unnamed Farm'}</h3>
              <p className={styles.farmLoc}><MdLocationOn size={14} /> {farm.location || 'Unknown Location'}</p>
              <div className={styles.farmMeta}>
                <span>{farm.area || 0} {farm.areaUnit || 'hectares'}</span>
                <span>{farm.soilType || 'Unknown Soil'}</span>
              </div>
              <div className={styles.farmCrops}>
                {farm.crops?.slice(0, 3).map(c => (
                  <span key={c} className={styles.cropTag}>{c}</span>
                ))}
              </div>

              {canManageFarms ? (
                <div className={styles.farmActions}>
                  <Button variant="outline" size="sm" style={{ flex: 1 }} leftIcon={<MdEdit />} onClick={() => setEditFarm(farm)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(String(farm.id))}>Delete</Button>
                </div>
              ) : (
                <div className={styles.farmActions}>
                  <Button variant="ghost" size="sm" style={{ flex: 1 }} leftIcon={<MdVisibility />}>
                    View Soil & Crops
                  </Button>
                </div>
              )}
            </motion.div>
          ))
        }
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <MdAgriculture size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No farms found. Try adjusting your search or register a new farm.</p>
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

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Farm"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAdd}>Add Farm</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Farm Name" placeholder="e.g. North Valley Farm" value={newFarm.name} onChange={e => setNewFarm({...newFarm, name: e.target.value})} />
          <Input label="Location" placeholder="e.g. Punjab, India" value={newFarm.location} onChange={e => setNewFarm({...newFarm, location: e.target.value})} />
          <Input label="Area (hectares)" type="number" placeholder="e.g. 45" value={newFarm.area} onChange={e => setNewFarm({...newFarm, area: e.target.value})} />
          <Input label="Soil Type" placeholder="e.g. Alluvial" value={newFarm.soilType} onChange={e => setNewFarm({...newFarm, soilType: e.target.value})} />
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Status</label>
            <select 
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
              value={newFarm.status} 
              onChange={e => setNewFarm({...newFarm, status: e.target.value as Farm['status']})}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Harvested">Harvested</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editFarm} onClose={() => setEditFarm(null)} title="Edit Farm Details"
        footer={<><Button variant="ghost" onClick={() => setEditFarm(null)}>Cancel</Button><Button onClick={handleEditSave}>Save Changes</Button></>}>
        {editFarm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Farm Name" value={editFarm.name || ''} onChange={e => setEditFarm({...editFarm, name: e.target.value})} />
            <Input label="Location" value={editFarm.location || ''} onChange={e => setEditFarm({...editFarm, location: e.target.value})} />
            <Input label="Area (hectares)" type="number" value={editFarm.area || 0} onChange={e => setEditFarm({...editFarm, area: Number(e.target.value)})} />
            <Input label="Soil Type" value={editFarm.soilType || ''} onChange={e => setEditFarm({...editFarm, soilType: e.target.value})} />
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Status</label>
              <select 
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }}
                value={editFarm.status || 'Active'} 
                onChange={e => setEditFarm({...editFarm, status: e.target.value as Farm['status']})}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Harvested">Harvested</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}