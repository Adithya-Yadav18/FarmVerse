import React, { useState, useEffect } from 'react';
import {
  MdEmergency,
  MdWarning,
  MdPhone,
  MdCheckCircle,
  MdAccessTime,
  MdClose,
  MdDescription,
  MdLocalHospital,
  MdGrass,
  MdOutlineSecurity,
  MdLocationOn,
} from 'react-icons/md';
import styles from './CropRescuePage.module.css';
import rescueService from '../../services/rescueService';
import { useAuth } from '../../context/AuthContext';
import type {
  RescueTicket,
  TriggerSosPayload,
  EmergencyCategoryPreset,
  EmergencyType,
} from '../../types';

export default function CropRescuePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<RescueTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<RescueTicket | null>(null);
  const [presets, setPresets] = useState<EmergencyCategoryPreset[]>([]);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({});

  // SOS Form state
  const [sosForm, setSosForm] = useState<TriggerSosPayload>({
    cropName: 'Sugarcane',
    emergencyType: 'FLOOD_WATERLOGGING',
    severityLevel: 'CRITICAL_IMMEDIATE',
    affectedAcres: 2.5,
    cropGrowthStage: 'Tillering Stage (45-60 Days)',
    symptomsDescription: '',
    farmerName: user?.name || 'Thomas Shelby',
    farmerPhone: user?.phone || '+91 98450 12345',
  });
  const [isSubmittingSos, setIsSubmittingSos] = useState<boolean>(false);

  useEffect(() => {
    if (user?.name) {
      setSosForm(prev => ({
        ...prev,
        farmerName: user.name,
        farmerPhone: user.phone || prev.farmerPhone,
      }));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketList, presetList] = await Promise.all([
        rescueService.getMyTickets(),
        rescueService.getPresets(),
      ]);
      setTickets(ticketList);
      setPresets(presetList);
      if (ticketList.length > 0) {
        setActiveTicket(ticketList[0]);
      }
    } catch (err) {
      console.error('Failed to load crop rescue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSos(true);
    try {
      const created = await rescueService.triggerSos(sosForm);
      setShowSosModal(false);
      await loadData();
      setActiveTicket(created);
      alert(`Emergency Distress Beacon Activated! Ticket Reference: ${created.ticketCode}`);
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
      alert('Could not trigger rescue beacon. Please check details and try again.');
    } finally {
      setIsSubmittingSos(false);
    }
  };

  const handleStepToggle = (stepNum: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const handleStatusUpdate = async (status: string, notes?: string) => {
    if (!activeTicket) return;
    try {
      const updated = await rescueService.updateStatus(activeTicket.id, status, notes);
      setActiveTicket(updated);
      loadData();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'SOS_TRIGGERED': return 1;
      case 'ANTIDOTE_DEPLOYED': return 2;
      case 'AGRONOMIST_DISPATCHED': return 3;
      case 'STABILIZED':
      case 'RESOLVED': return 4;
      default: return 1;
    }
  };

  return (
    <div className={styles.container}>
      {/* 24/7 National Agronomic Emergency Response Banner */}
      <div className={styles.hotlineBanner}>
        <div className={styles.hotlineLeft}>
          <div className={styles.pulsingDot} />
          <span>24/7 NATIONAL CROP EMERGENCY RESPONSE NETWORK</span>
        </div>
        <div>
          <span>Operational Response: Active KVK Agronomist Dispatch • PMFBY Rapid Dossier Verification</span>
        </div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <MdEmergency />
            SOS Crop Rescue & Emergency Antidote Cockpit
          </h1>
          <p className={styles.headerSubtitle}>
            Immediate response protocols for acute agricultural disasters (herbicide burns, flash floods, locust swarms, and hailstorms). Provides automated 4-hour scientific antidotes, assigns local KVK agronomists, and fast-tracks PMFBY disaster dossiers.
          </p>
        </div>

        <button className={styles.sosBeaconBtn} onClick={() => setShowSosModal(true)}>
          <MdEmergency size={24} />
          TRIGGER CROP RESCUE SOS
        </button>
      </header>

      {/* Stats Ribbon */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdLocalHospital />
          </div>
          <div>
            <h4 className={styles.statNum}>&lt; 4 Hours</h4>
            <p className={styles.statLabel}>Critical First-Aid Window</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e8f5e9', color: '#2e7d32' }}>
            <MdGrass />
          </div>
          <div>
            <h4 className={styles.statNum}>88% Avg.</h4>
            <p className={styles.statLabel}>Crop Salvaged via Antidote</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e3f2fd', color: '#1565c0' }}>
            <MdOutlineSecurity />
          </div>
          <div>
            <h4 className={styles.statNum}>Fast-Track</h4>
            <p className={styles.statLabel}>PMFBY Geotagged Claim Filing</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff3e0', color: '#e65100' }}>
            <MdPhone />
          </div>
          <div>
            <h4 className={styles.statNum}>KVK On-Duty</h4>
            <p className={styles.statLabel}>District Officers Assigned</p>
          </div>
        </div>
      </div>

      {/* Active Incident View */}
      {activeTicket ? (
        <div className={styles.activeIncidentCard}>
          <div className={styles.incidentTop}>
            <div className={styles.incidentTitleWrap}>
              <h3>
                🚨 Active Emergency: {activeTicket.emergencyType.replace('_', ' ')}
              </h3>
              <div className={styles.incidentMeta}>
                <span>Ticket: <strong>{activeTicket.ticketCode}</strong></span>
                <span>Crop: <strong>{activeTicket.cropName}</strong> ({activeTicket.affectedAcres} Acres)</span>
                <span>Farm: <strong>{activeTicket.farmName}</strong></span>
                <span>Triggered: {new Date(activeTicket.triggeredAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <span className={`${styles.severityTag} ${styles['severity' + activeTicket.severityLevel]}`}>
              {activeTicket.severityLevel.replace('_', ' ')}
            </span>
          </div>

          {/* 4-Stage Lifecycle Progression */}
          <div className={styles.progressBar}>
            {[
              { idx: 1, label: 'SOS Triggered' },
              { idx: 2, label: 'Antidote Deployed' },
              { idx: 3, label: 'Agronomist Dispatched' },
              { idx: 4, label: 'Crop Stabilized' },
            ].map(step => {
              const currentIdx = getStatusStepIndex(activeTicket.status);
              const isDone = currentIdx > step.idx;
              const isActive = currentIdx === step.idx;

              return (
                <div key={step.idx} className={styles.progressStep}>
                  <div
                    className={`${styles.stepDot} ${
                      isActive ? styles.stepDotActive : isDone ? styles.stepDotCompleted : ''
                    }`}
                  >
                    {isDone ? '✓' : step.idx}
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Antidote Checklist */}
          <div className={styles.antidoteSection}>
            <div className={styles.antidoteHeader}>
              <MdLocalHospital size={20} />
              <span>FIRST 4-HOUR CRITICAL FIRST-AID ANTIDOTE PROTOCOL</span>
            </div>

            <div className={styles.stepsGrid}>
              {activeTicket.firstAidProtocol.map(step => (
                <div key={step.stepNumber} className={styles.stepItem}>
                  <div className={styles.stepBadge}>{step.stepNumber}</div>
                  <div className={styles.stepBody}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5>{step.title}</h5>
                      <span className={styles.stepUrgency}>{step.timingUrgency}</span>
                    </div>
                    <p>{step.actionInstruction}</p>
                    <div className={styles.stepCaution}>⚠️ Caution: {step.caution}</div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!completedSteps[step.stepNumber]}
                        onChange={() => handleStepToggle(step.stepNumber)}
                      />
                      I have executed this emergency step in the field
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agronomist Dispatch Card */}
          <div className={styles.agronomistBox}>
            <div className={styles.agronomistLeft}>
              <div className={styles.officerAvatar}>👨‍🌾</div>
              <div>
                <h4 className={styles.agronomistName}>{activeTicket.assignedAgronomistName}</h4>
                <p className={styles.agronomistRole}>
                  On-Duty District Agricultural Response Officer • KVK Mandya
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <a
                href={`tel:${activeTicket.assignedAgronomistPhone}`}
                className={styles.callBtn}
                style={{ textDecoration: 'none' }}
              >
                <MdPhone /> Call Officer: {activeTicket.assignedAgronomistPhone}
              </a>

              {activeTicket.status === 'SOS_TRIGGERED' && (
                <button
                  className={styles.callBtn}
                  style={{ background: '#1565c0' }}
                  onClick={() => handleStatusUpdate('ANTIDOTE_DEPLOYED')}
                >
                  Mark Antidote Applied
                </button>
              )}

              {activeTicket.status === 'ANTIDOTE_DEPLOYED' && (
                <button
                  className={styles.callBtn}
                  style={{ background: '#2e7d32' }}
                  onClick={() => handleStatusUpdate('STABILIZED', 'Antidote effectively absorbed, new shoots emerging.')}
                >
                  Mark Crop Stabilized
                </button>
              )}
            </div>
          </div>

          {/* PMFBY Disaster Claim Dossier Certificate */}
          {activeTicket.pmfbyDossier && (
            <div className={styles.dossierBox}>
              <div className={styles.dossierTitle}>
                <MdDescription />
                PMFBY Geotagged Disaster Claim Dossier (Pre-Filled)
              </div>
              <div className={styles.dossierGrid}>
                <div className={styles.dossierRow}>
                  <span>Claim Reference:</span>
                  <strong>{activeTicket.pmfbyDossier.claimReference}</strong>
                </div>
                <div className={styles.dossierRow}>
                  <span>Disaster Event:</span>
                  <strong>{activeTicket.pmfbyDossier.disasterEvent}</strong>
                </div>
                <div className={styles.dossierRow}>
                  <span>Geotag Coordinates:</span>
                  <strong>
                    {activeTicket.latitude.toFixed(4)}, {activeTicket.longitude.toFixed(4)}
                  </strong>
                </div>
                <div className={styles.dossierRow}>
                  <span>Estimated Loss:</span>
                  <strong style={{ color: '#c62828' }}>
                    {activeTicket.pmfbyDossier.estimatedLossPercent}% Damage
                  </strong>
                </div>
                <div className={styles.dossierRow}>
                  <span>Fast-Track Claim Payout:</span>
                  <strong style={{ color: '#2e7d32' }}>
                    ₹{activeTicket.pmfbyDossier.estimatedPayoutInr.toLocaleString()}
                  </strong>
                </div>
                <div className={styles.dossierRow}>
                  <span>Filing Status:</span>
                  <strong style={{ color: '#1565c0' }}>
                    {activeTicket.pmfbyDossier.claimStatus.replace('_', ' ')}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: 16 }}>
          <MdCheckCircle size={48} color="#2e7d32" style={{ marginBottom: 12 }} />
          <h3>All Crops Stabilized & Monitored</h3>
          <p style={{ color: '#688577' }}>
            No active emergency SOS tickets at this moment. Tap the red button if your farm encounters sudden disaster.
          </p>
        </div>
      )}

      {/* Incident History Ledger */}
      {tickets.length > 1 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1b4332', marginBottom: 16 }}>
            Past Rescue Incident Ledger
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(t => (
              <div
                key={t.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8f5e9',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveTicket(t)}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1b4332' }}>
                    {t.emergencyType.replace('_', ' ')} • {t.cropName} ({t.affectedAcres} Acres)
                  </div>
                  <div style={{ fontSize: 12, color: '#557565', marginTop: 4 }}>
                    Ticket: {t.ticketCode} • {new Date(t.triggeredAt).toLocaleDateString()} • Farm: {t.farmName}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      background: t.status === 'STABILIZED' ? '#e8f5e9' : '#ffebee',
                      color: t.status === 'STABILIZED' ? '#2e7d32' : '#c62828',
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2e7d32', marginTop: 4 }}>
                    {t.estimatedSalvagePercent}% Salvaged
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {showSosModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <MdEmergency /> Trigger Crop Emergency Rescue SOS
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowSosModal(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleTriggerSos}>
              {/* Category Presets */}
              <div style={{ marginBottom: 16 }}>
                <label className={styles.formLabel}>Select Emergency Disaster Type</label>
                <div className={styles.presetGrid}>
                  {presets.map(p => (
                    <div
                      key={p.type}
                      className={`${styles.presetCard} ${
                        sosForm.emergencyType === p.type ? styles.presetCardActive : ''
                      }`}
                      onClick={() =>
                        setSosForm(prev => ({
                          ...prev,
                          emergencyType: p.type as EmergencyType,
                          severityLevel: p.defaultSeverity as any,
                        }))
                      }
                    >
                      <div className={styles.presetCardTitle}>
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </div>
                      <div className={styles.presetCardDesc}>{p.typicalSymptoms}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Affected Crop Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={sosForm.cropName}
                    onChange={e => setSosForm(prev => ({ ...prev, cropName: e.target.value }))}
                    placeholder="e.g. Sugarcane, Tomato, Paddy, Cotton"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Affected Acreage (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    className={styles.formInput}
                    value={sosForm.affectedAcres}
                    onChange={e => setSosForm(prev => ({ ...prev, affectedAcres: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Severity Level</label>
                  <select
                    className={styles.formSelect}
                    value={sosForm.severityLevel}
                    onChange={e => setSosForm(prev => ({ ...prev, severityLevel: e.target.value as any }))}
                  >
                    <option value="CRITICAL_IMMEDIATE">CRITICAL (Action within 0-4 hours)</option>
                    <option value="HIGH_24H">HIGH (Action within 24 hours)</option>
                    <option value="MODERATE">MODERATE (Warning / Alert)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Crop Growth Stage</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={sosForm.cropGrowthStage}
                    onChange={e => setSosForm(prev => ({ ...prev, cropGrowthStage: e.target.value }))}
                    placeholder="e.g. Vegetative, Tillering, Flowering"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Visible Symptoms & Field Observations</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={sosForm.symptomsDescription || ''}
                  onChange={e => setSosForm(prev => ({ ...prev, symptomsDescription: e.target.value }))}
                  placeholder="Describe sudden leaf burns, standing water depth, pest swarm density, or hailstorm physical damage..."
                  required
                />
              </div>

              <button type="submit" className={styles.launchSosBtn} disabled={isSubmittingSos}>
                <MdEmergency size={20} />
                {isSubmittingSos ? 'ACTIVATING EMERGENCY DISPATCH...' : 'ACTIVATE EMERGENCY SOS BEACON NOW'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
