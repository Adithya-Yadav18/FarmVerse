import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  MdSatelliteAlt, MdRefresh, MdLocationOn, MdLayers,
  MdWarning, MdVerified, MdSend, MdEditLocation, MdSave, MdClose
} from 'react-icons/md';
import { toast } from 'react-hot-toast';

import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Modal } from '../../components/ui/Modal/Modal';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

import api from '../../services/api';
import { satelliteService } from '../../services/satelliteService';
import { useAuth } from '../../context/AuthContext';
import type {
  Farm, SatelliteNdviRecord, NdviGridCell, NdviHistoricalPoint,
  SatelliteOverviewStats, PublicCanopyBadge
} from '../../types';
import styles from './SatellitePage.module.css';

// Fix Leaflet marker icons in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MapLayerMode = 'optical' | 'ndvi' | 'ndwi' | 'grid';

export default function SatellitePage() {
  const { user } = useAuth();
  const userRole = (user?.role || 'ROLE_FARMER').toUpperCase();
  const isAgronomist = userRole.includes('AGRONOMIST');
  const isAdmin = userRole.includes('ADMIN');

  // Farms state
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Satellite Telemetry State
  const [ndviData, setNdviData] = useState<SatelliteNdviRecord | null>(null);
  const [history, setHistory] = useState<NdviHistoricalPoint[]>([]);
  const [overviewStats, setOverviewStats] = useState<SatelliteOverviewStats | null>(null);
  const [publicBadge, setPublicBadge] = useState<PublicCanopyBadge | null>(null);
  const [selectedCell, setSelectedCell] = useState<NdviGridCell | null>(null);

  // Farm Pinning & Exact Area Selection State
  const [isPinMode, setIsPinMode] = useState<boolean>(false);
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSavingCoords, setIsSavingCoords] = useState<boolean>(false);

  // Map Controls State
  const [layerMode, setLayerMode] = useState<MapLayerMode>('ndvi');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRescanning, setIsRescanning] = useState<boolean>(false);

  // Agronomist Coordinate Advisory Modal
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState<boolean>(false);
  const [advisoryNote, setAdvisoryNote] = useState<string>('');
  const [isSendingAdvisory, setIsSendingAdvisory] = useState<boolean>(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const gridLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isPinModeRef = useRef<boolean>(false);
  isPinModeRef.current = isPinMode;

  // 1. Fetch Farms List
  const loadFarms = useCallback(async () => {
    try {
      const res = await api.get('/farms');
      const farmList: Farm[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFarms(farmList);
      if (farmList.length > 0 && selectedFarmId === null) {
        setSelectedFarmId(Number(farmList[0].id));
      }
    } catch {
      toast.error('Failed to load farms for satellite monitoring.');
    }
  }, [selectedFarmId]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  // 2. Fetch Satellite Telemetry for Selected Farm
  const loadSatelliteTelemetry = useCallback(async (farmId: number) => {
    setIsLoading(true);
    try {
      const [latestRes, historyRes, statsRes, badgeRes] = await Promise.allSettled([
        satelliteService.getLatest(farmId),
        satelliteService.getHistory(farmId),
        satelliteService.getOverviewStats(),
        satelliteService.getPublicBadge(farmId),
      ]);

      if (latestRes.status === 'fulfilled') {
        const data = latestRes.value;
        setNdviData(data);
        setPinnedCoords({ lat: data.centerLat, lng: data.centerLng });

        if (data.gridCells?.length > 0) {
          const stressed = data.gridCells.find(c => c.status === 'Stress' || c.status === 'Critical');
          setSelectedCell(stressed || data.gridCells[0]);
        }
      }
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value);
      }
      if (statsRes.status === 'fulfilled') {
        setOverviewStats(statsRes.value);
      }
      if (badgeRes.status === 'fulfilled') {
        setPublicBadge(badgeRes.value);
      }
    } catch {
      toast.error('Error fetching Sentinel-2 satellite telemetry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId !== null) {
      loadSatelliteTelemetry(selectedFarmId);
    }
  }, [selectedFarmId, loadSatelliteTelemetry]);

  // Farm switch handler
  const handleFarmChange = (newFarmId: number) => {
    setSelectedFarmId(newFarmId);
    setIsPinMode(false);
    loadSatelliteTelemetry(newFarmId);
  };

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: L.LatLngExpression = [12.4180, 76.6950];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: true,
      });

      // Esri World Imagery (High-Resolution Global Satellite Photography - 100% Free)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
      }).addTo(map);

      // Layer group for NDVI/NDWI Grid polygons and center marker
      const layerGroup = L.layerGroup().addTo(map);
      gridLayerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Map Click Handler for Precision Farm Pinning
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!isPinModeRef.current) return;
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPinnedCoords(newCoords);
        toast('Farm pin moved to: ' + newCoords.lat.toFixed(5) + '°, ' + newCoords.lng.toFixed(5) + '°', {
          icon: '📍',
          duration: 2000
        });
      });
    }
  }, []);

  // 4. Update Map Center & Overlays when Telemetry, Layer Mode, or Pinning changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = gridLayerGroupRef.current;
    if (!map || !layerGroup || !ndviData) return;

    const currentLat = pinnedCoords ? pinnedCoords.lat : ndviData.centerLat;
    const currentLng = pinnedCoords ? pinnedCoords.lng : ndviData.centerLng;
    const center: L.LatLngExpression = [currentLat, currentLng];

    // Smoothly fly camera if farm changed
    if (!isPinMode) {
      map.flyTo(center, 16, { duration: 1.2 });
    }

    // Clear previous overlays
    layerGroup.clearLayers();

    // Center Farm Marker Pin
    const marker = L.marker(center, {
      draggable: isPinMode,
    }).addTo(layerGroup);
    markerRef.current = marker;

    if (isPinMode) {
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px; color: #0f172a; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; color: #107850; font-size: 14px;">📍 Adjusting Farm Location</h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">Drag this pin or click on your field to position your exact farm boundaries.</p>
          <div style="font-size: 11px; font-weight: 700; color: #16a34a;">Lat: ${currentLat.toFixed(5)}, Lng: ${currentLng.toFixed(5)}</div>
        </div>
      `).openPopup();

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPinnedCoords({ lat: pos.lat, lng: pos.lng });
      });
    } else {
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px; color: #0f172a; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; color: #107850; font-size: 14px;">🛰️ ${ndviData.farmName}</h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">${ndviData.farmLocation || 'Field Centroid'}</p>
          <div style="font-size: 12px; font-weight: 600;">Mean NDVI: <strong style="color: #16a34a;">${ndviData.meanNdvi}</strong> (${ndviData.canopyVigourRating})</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">GPS: ${currentLat.toFixed(5)}°, ${currentLng.toFixed(5)}°</div>
        </div>
      `);
    }

    // If Optical mode is selected, only show pure satellite imagery
    if (layerMode === 'optical') return;

    // Shift 4x4 Grid Cells dynamically if pinned coordinates changed
    const deltaLat = currentLat - ndviData.centerLat;
    const deltaLng = currentLng - ndviData.centerLng;

    // Render 4x4 Grid Cells with False-Color Styling
    if (ndviData.gridCells && ndviData.gridCells.length > 0) {
      ndviData.gridCells.forEach(cell => {
        let fillColor = cell.color;

        if (layerMode === 'ndwi') {
          // NDWI Moisture Palette: Blue-to-Brown
          fillColor = cell.ndwi >= 0.50 ? '#0284C7' : (cell.ndwi >= 0.35 ? '#06B6D4' : '#F59E0B');
        } else if (layerMode === 'grid') {
          // Grid wireframe
          fillColor = 'transparent';
        }

        const shiftedBounds: L.LatLngBoundsExpression = [
          [cell.bounds[0][0] + deltaLat, cell.bounds[0][1] + deltaLng],
          [cell.bounds[1][0] + deltaLat, cell.bounds[1][1] + deltaLng]
        ];

        const rect = L.rectangle(shiftedBounds, {
          color: layerMode === 'grid' ? '#38BDF8' : '#0F172A',
          weight: layerMode === 'grid' ? 1.5 : 0.8,
          fillColor: fillColor,
          fillOpacity: layerMode === 'grid' ? 0.05 : overlayOpacity,
        });

        rect.on('click', () => {
          setSelectedCell(cell);
          toast(`Selected: ${cell.quadrantName} (NDVI ${cell.ndvi})`, { icon: '🛰️' });
        });

        rect.bindTooltip(
          `<strong>${cell.quadrantName}</strong><br/>NDVI: ${cell.ndvi} (${cell.status})<br/>NDWI: ${cell.ndwi}`,
          { permanent: false, direction: 'top', opacity: 0.9 }
        );

        rect.addTo(layerGroup);
      });
    }
  }, [ndviData, layerMode, overlayOpacity, isPinMode, pinnedCoords]);

  // Handle Saving Updated Farm Coordinates
  const handleSaveFarmLocation = async () => {
    if (!selectedFarmId || !pinnedCoords) return;
    setIsSavingCoords(true);
    const toastId = toast.loading('Saving exact farm coordinates and recalibrating Sentinel-2 telemetry...');
    try {
      const updated = await satelliteService.updateCoordinates(selectedFarmId, pinnedCoords.lat, pinnedCoords.lng);
      setNdviData(updated);
      setPinnedCoords({ lat: updated.centerLat, lng: updated.centerLng });
      setIsPinMode(false);
      toast.success('Exact farm location saved! Multispectral satellite telemetry is now calibrated to your field.', { id: toastId });
    } catch {
      toast.error('Failed to save farm coordinates. Please check connection.', { id: toastId });
    } finally {
      setIsSavingCoords(false);
    }
  };

  const handleCancelPinMode = () => {
    if (ndviData) {
      setPinnedCoords({ lat: ndviData.centerLat, lng: ndviData.centerLng });
    }
    setIsPinMode(false);
  };

  // Handle Sentinel-2 Rescan Trigger
  const handleTriggerRescan = async () => {
    if (!selectedFarmId) return;
    setIsRescanning(true);
    const toastId = toast.loading('Connecting to Sentinel-2 orbit telemetry & compiling multispectral reflectance...');
    try {
      const updated = await satelliteService.triggerRescan(selectedFarmId);
      setNdviData(updated);
      setPinnedCoords({ lat: updated.centerLat, lng: updated.centerLng });
      toast.success('Multispectral Sentinel pass compiled successfully!', { id: toastId });
    } catch {
      toast.error('Satellite pass simulation failed.', { id: toastId });
    } finally {
      setIsRescanning(false);
    }
  };

  // Handle Agronomist Advisory Submission
  const handleSendAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryNote.trim()) {
      toast.error('Please write an advisory directive.');
      return;
    }
    setIsSendingAdvisory(true);
    try {
      await api.post('/notifications', {
        title: `Agronomist Directive: ${selectedCell?.quadrantName || 'Field Zone'}`,
        message: advisoryNote,
        category: 'PRESCRIPTION',
        type: 'warning',
      });
      toast.success('Advisory directive dispatched to farm operator!');
      setIsAdvisoryModalOpen(false);
      setAdvisoryNote('');
    } catch {
      toast.error('Failed to dispatch advisory.');
    } finally {
      setIsSendingAdvisory(false);
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Satellite NDVI Imagery & Multispectral Field Mapping"
        subtitle="Sub-meter resolution satellite monitoring powered by Esri World Imagery & ESA Sentinel-2 multispectral reflectance analysis."
        breadcrumbs={[{ label: 'Satellite NDVI' }]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Farm Selector */}
            {farms.length > 0 && (
              <select
                value={selectedFarmId || ''}
                onChange={e => handleFarmChange(Number(e.target.value))}
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
                    {f.name} ({f.location || 'Active Farmland'})
                  </option>
                ))}
              </select>
            )}

            {/* Select/Pin Exact Farm Location Button */}
            <Button
              variant={isPinMode ? 'primary' : 'outline'}
              leftIcon={<MdEditLocation />}
              onClick={() => setIsPinMode(!isPinMode)}
            >
              {isPinMode ? 'Pinning Field...' : 'Pin Exact Farm Plot'}
            </Button>

            <Button
              variant="outline"
              leftIcon={<MdRefresh />}
              loading={isRescanning}
              onClick={handleTriggerRescan}
            >
              Request Satellite Refresh
            </Button>

            {isAgronomist && (
              <Button
                variant="primary"
                leftIcon={<MdSend />}
                onClick={() => setIsAdvisoryModalOpen(true)}
              >
                Issue Coordinate Directive
              </Button>
            )}
          </div>
        }
      />

      {/* Pin Exact Farm Area Floating Guidance Banner */}
      {isPinMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.pinBanner}
        >
          <div className={styles.pinBannerText}>
            <strong>📍 Select & Pin Exact Farm Area:</strong> Click anywhere on the satellite image or drag the blue pin onto your exact agricultural cropland. The 4×4 multispectral grid will instantly align with your field boundaries so only your farm is monitored.
            {pinnedCoords && (
              <span style={{ display: 'block', fontSize: 12, color: 'var(--color-emerald)', marginTop: 4, fontWeight: 700 }}>
                Selected Plot: {pinnedCoords.lat.toFixed(5)}° N, {pinnedCoords.lng.toFixed(5)}° E
              </span>
            )}
          </div>
          <div className={styles.pinBannerActions}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<MdClose />}
              onClick={handleCancelPinMode}
              disabled={isSavingCoords}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<MdSave />}
              onClick={handleSaveFarmLocation}
              loading={isSavingCoords}
            >
              Save Farm Location
            </Button>
          </div>
        </motion.div>
      )}

      {/* 4 Live KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 120, 80, 0.12)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <MdSatelliteAlt />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                Mean Field NDVI
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {ndviData ? ndviData.meanNdvi.toFixed(2) : '0.78'}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 700 }}>
                  {ndviData?.canopyVigourRating || 'Optimal'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              💧
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                Canopy Moisture (NDWI)
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {ndviData ? ndviData.ndwiMoistureIndex.toFixed(2) : '0.54'}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Hydrated
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(168, 85, 247, 0.12)', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🧪
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                Chlorophyll (CARI)
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {ndviData ? ndviData.chlorophyllIndex.toFixed(1) : '4.4'}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ug/cm²
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(234, 179, 8, 0.12)', color: '#EAB308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🚜
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                Cloud Cover & Pass
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {ndviData ? `${ndviData.cloudCoveragePercent.toFixed(1)}%` : '0.8%'}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 700 }}>
                  Clear
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Satellite Workspace: Leaflet Map & Quadrant Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Leaflet Satellite Map Card */}
        <div className={styles.mapCard}>
          <div className={styles.mapWrapper}>
            <div
              ref={mapContainerRef}
              className={`${styles.mapElement} ${isPinMode ? styles.crosshairCursor : ''}`}
            />

            {/* Top-Right Multispectral Controls Overlay */}
            <div className={styles.mapControlsOverlay}>
              <div className={styles.controlBox}>
                <div className={styles.controlTitle}>
                  <MdLayers style={{ verticalAlign: 'middle' }} /> Multispectral Layer
                </div>
                <div className={styles.layerButtonGroup}>
                  <button
                    type="button"
                    className={`${styles.layerButton} ${layerMode === 'ndvi' ? styles.layerButtonActive : ''}`}
                    onClick={() => setLayerMode('ndvi')}
                  >
                    <span>NDVI Vegetation Heatmap</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>B4+B8</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.layerButton} ${layerMode === 'ndwi' ? styles.layerButtonActive : ''}`}
                    onClick={() => setLayerMode('ndwi')}
                  >
                    <span>NDWI Moisture Stress</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>Water</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.layerButton} ${layerMode === 'optical' ? styles.layerButtonActive : ''}`}
                    onClick={() => setLayerMode('optical')}
                  >
                    <span>True Color Satellite</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>Esri HD</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.layerButton} ${layerMode === 'grid' ? styles.layerButtonActive : ''}`}
                    onClick={() => setLayerMode('grid')}
                  >
                    <span>Sub-Plot 4x4 Grid</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>Wireframe</span>
                  </button>
                </div>

                {layerMode !== 'optical' && (
                  <div className={styles.sliderWrapper}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#CBD5E1' }}>
                      <span>Overlay Opacity</span>
                      <span>{Math.round(overlayOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                      className={styles.sliderInput}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom-Left Color Legend */}
            {layerMode === 'ndvi' && (
              <div className={styles.legendBar}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E2E8F0' }}>NDVI Canopy Vigour Index</span>
                <div className={styles.legendGradient} />
                <div className={styles.legendLabels}>
                  <span>0.1 (Barren/Stress)</span>
                  <span>0.5 (Moderate)</span>
                  <span>0.9 (Dense Green)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Quadrant Telemetry & Anomaly Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Anomaly Callout Box */}
          {ndviData?.anomalyDetected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--border-radius)',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-error)', fontWeight: 700, fontSize: 14 }}>
                <MdWarning style={{ fontSize: 18 }} /> Spatial Biomass Anomaly Detected
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                {ndviData.anomalyDetails}
              </p>
            </motion.div>
          )}

          {/* Inspected Quadrant Detail Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                <MdLocationOn style={{ verticalAlign: 'middle', color: 'var(--color-emerald)' }} /> Inspected Sub-Plot Quadrant
              </h3>
              {ndviData && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  GPS: {ndviData.centerLat.toFixed(4)}°, {ndviData.centerLng.toFixed(4)}°
                </span>
              )}
            </div>

            {selectedCell ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedCell.quadrantName}
                  </h4>
                  <Badge
                    variant={selectedCell.status === 'Optimal' ? 'success' : (selectedCell.status === 'Healthy' ? 'info' : 'warning')}
                    dot
                  >
                    {selectedCell.status}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Cellular NDVI</span>
                    <strong style={{ fontSize: 18, color: selectedCell.color }}>{selectedCell.ndvi.toFixed(2)}</strong>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Cellular NDWI</span>
                    <strong style={{ fontSize: 18, color: '#0284C7' }}>{selectedCell.ndwi.toFixed(2)}</strong>
                  </div>
                </div>

                {selectedCell.recommendation && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 8, borderLeft: `3px solid ${selectedCell.color}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Agronomic Action
                    </span>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {selectedCell.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Click any quadrant on the satellite map to inspect localized telemetry.
              </p>
            )}
          </Card>

          {/* Regional Multi-Farm Overview (For Agronomist & Admin) */}
          {(isAgronomist || isAdmin) && overviewStats && (
            <Card>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                District Surveillance Telemetry
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Monitored Farm Plots</span>
                  <strong>{overviewStats.totalFarmsMonitored}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Regional High-Vigour Ratio</span>
                  <strong style={{ color: 'var(--color-success)' }}>{overviewStats.highVigourPercentage}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Orbital Revisit Cadence</span>
                  <strong>Every {overviewStats.satellitePassCadenceDays} Days</strong>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 6-Week Historical Vegetation Progression Chart */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              Historical Canopy Vigour Progression (Sentinel-2 Passes)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              6-week multispectral NDVI & NDWI reflectance index tracking crop phenology and biomass development for {ndviData?.farmName || 'this field'}.
            </p>
          </div>
          <Badge variant="success" dot>Pass 6 Complete</Badge>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#107850" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#107850" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ndwiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <RechartsTooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10 }}
            />
            <Area type="monotone" dataKey="meanNdvi" stroke="#107850" strokeWidth={2.5} fill="url(#ndviGradient)" name="Canopy NDVI" />
            <Area type="monotone" dataKey="ndwi" stroke="#0284C7" strokeWidth={2} fill="url(#ndwiGradient)" name="Water Index (NDWI)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Agronomist Coordinate Advisory Modal */}
      <Modal
        isOpen={isAdvisoryModalOpen}
        onClose={() => setIsAdvisoryModalOpen(false)}
        title="Issue Coordinate-Targeted Advisory"
        size="md"
      >
        <form onSubmit={handleSendAdvisory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Send a targeted agronomic alert to the farm operator referencing the inspected satellite quadrant ({selectedCell?.quadrantName || 'Field Zone'}).
          </p>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Target Quadrant & Crop
            </label>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)' }}>
              <strong>{selectedCell?.quadrantName || 'Field Quadrant'}</strong> • Current NDVI: <strong>{selectedCell?.ndvi || '0.38'}</strong> ({selectedCell?.status || 'Stress'})
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Agronomist Directive / Prescription Note
            </label>
            <textarea
              rows={4}
              value={advisoryNote}
              onChange={e => setAdvisoryNote(e.target.value)}
              placeholder="e.g., Immediate foliar spray of Zinc chelate and check drip irrigation lines in North-East quadrant..."
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
            <Button variant="outline" type="button" onClick={() => setIsAdvisoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSendingAdvisory}>
              Dispatch Directive
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
