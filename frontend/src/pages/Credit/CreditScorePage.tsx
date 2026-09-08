import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSpeed,
  MdVerified,
  MdAccountBalance,
  MdCheckCircle,
  MdWarning,
  MdInfo,
  MdScience,
  MdSatelliteAlt,
  MdCalculate,
  MdArrowForward,
  MdAttachMoney,
  MdRefresh,
  MdCheck,
  MdShield,
  MdTrendingUp,
  MdWaterDrop,
  MdVolumeUp,
  MdLocationOn,
  MdSupportAgent,
  MdPerson,
  MdPhone,
  MdHelpOutline,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { creditService } from '../../services/creditService';
import type {
  CreditScoreResponse,
  LoanOffer,
  LoanApplication,
  Farm,
  KendraCenter,
  SahayakResponse,
} from '../../types';
import { Badge } from '../../components/ui/Badge/Badge';
import toast from 'react-hot-toast';
import styles from './CreditScorePage.module.css';

export const CreditScorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Role detection
  const rawRole = (user?.role || 'Farmer').toLowerCase();
  const isAgronomist = rawRole.includes('agronomist');
  const isAdmin = rawRole.includes('admin');
  const canReviewLoans = isAdmin;
  const canEndorse = isAgronomist || isAdmin;

  // View state
  const [activeTab, setActiveTab] = useState<'DIAGNOSTICS' | 'OFFERS' | 'CALCULATOR' | 'APPLICATIONS' | 'SAHAYAK'>('DIAGNOSTICS');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);
  const [scoreData, setScoreData] = useState<CreditScoreResponse | null>(null);
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);

  // Kisan Visual Loan Finder & Voice Guidance
  const [selectedNeed, setSelectedNeed] = useState<'CROP_INPUT' | 'SOLAR_EQUIPMENT' | 'WAREHOUSE_ADVANCE' | 'ALL'>('CROP_INPUT');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingOfferId, setSpeakingOfferId] = useState<string | null>(null);

  // Doorstep Sahayak & Kendra Centers state
  const [kendras, setKendras] = useState<KendraCenter[]>([]);
  const [loadingKendras, setLoadingKendras] = useState<boolean>(false);
  const [showSahayakModal, setShowSahayakModal] = useState<boolean>(false);
  const [sahayakName, setSahayakName] = useState<string>(user?.name || '');
  const [sahayakPhone, setSahayakPhone] = useState<string>(user?.phone || '');
  const [sahayakVillage, setSahayakVillage] = useState<string>('');
  const [sahayakLoanType, setSahayakLoanType] = useState<string>('Kisan Credit Card (KCC) Crop Working Capital');
  const [sahayakAssistanceType, setSahayakAssistanceType] = useState<string>('DOORSTEP_VISIT');
  const [sahayakPreferredTime, setSahayakPreferredTime] = useState<string>('Morning (9 AM - 12 PM)');
  const [submittingSahayak, setSubmittingSahayak] = useState<boolean>(false);
  const [assignedSahayakResponse, setAssignedSahayakResponse] = useState<SahayakResponse | null>(null);

  // EMI Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(150000);
  const [calcTenure, setCalcTenure] = useState<number>(12);
  const [kccSubvention, setKccSubvention] = useState<boolean>(true);

  // Apply Loan Modal state
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [loanType, setLoanType] = useState<string>('CROP_INPUT');
  const [applyAmount, setApplyAmount] = useState<number>(100000);
  const [applyTenure, setApplyTenure] = useState<number>(12);
  const [applyPurpose, setApplyPurpose] = useState<string>('Certified organic seeds, bio-fertilizers & micro-drip equipment');

  // Agronomist Endorse Modal
  const [showEndorseModal, setShowEndorseModal] = useState<boolean>(false);
  const [endorseNotes, setEndorseNotes] = useState<string>('Inspected farm plot. Verified high soil humus, efficient drip irrigation, and zero pathogen presence across seasons.');

  // Admin Review Modal
  const [reviewModalApp, setReviewModalApp] = useState<LoanApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'DISBURSED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('Underwritten and verified via FarmVerse Telemetry Passport.');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (user?.name && !sahayakName) setSahayakName(user.name);
    if (user?.phone && !sahayakPhone) setSahayakPhone(user.phone);
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const farmsRes = await api.get('/farms').catch(() => ({ data: [] }));
      const loadedFarms: Farm[] = Array.isArray(farmsRes.data) ? farmsRes.data.filter((f: Farm) => f != null) : [];
      setFarms(loadedFarms);

      const targetFarmId = loadedFarms.length > 0 ? Number(loadedFarms[0].id) : 1;
      setSelectedFarmId(targetFarmId);

      await Promise.all([
        fetchScoreAndData(targetFarmId),
        loadKendras(targetFarmId),
      ]);
    } catch (err) {
      console.error('Failed to load initial credit telemetry', err);
      toast.error('Could not load credit scoring data');
    } finally {
      setLoading(false);
    }
  };

  const loadKendras = async (farmId: number) => {
    try {
      setLoadingKendras(true);
      const data = await creditService.getKendraCenters(farmId);
      setKendras(data);
    } catch (err) {
      console.error('Failed to load Kendras', err);
    } finally {
      setLoadingKendras(false);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingOfferId(null);
  };

  const speakText = (text: string, offerId?: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Voice playback not supported in this browser.');
      return;
    }
    if (isSpeaking && speakingOfferId === offerId) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (offerId) setSpeakingOfferId(offerId);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingOfferId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingOfferId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakOffer = (offer: LoanOffer) => {
    const text = `Loan Yojana: ${offer.title}. Isme aapko ${offer.interestRateAnnual} percent byaj par ${offer.maxAmount} rupaye tak ka loan pre-approved milta hai. Subsidized interest aur bina kisi collateral ke approve hota hai. Key benefits: ${offer.keyBenefits.join('. ')}.`;
    speakText(text, offer.id);
  };

  const speakCurrentNeed = (need: string) => {
    let text = '';
    if (need === 'CROP_INPUT') {
      text = 'Kisan bhaiyo aur behno, beej, khad aur mazdoori ke liye Kisan Credit Card loan sabse behtar hai. Isme sarkar teen pratishat byaj chhoot deti hai aur aapko sirf char pratishat byaj dena hota hai. Telemetry passport se bina zameen ke kagaz girvi rakhe approval milta hai.';
    } else if (need === 'SOLAR_EQUIPMENT') {
      text = 'Solar pump aur micro drip sinchayi ke liye NABARD aur PM-KUSUM yojana me chalis pratishat subsidy milti hai. Isse diesel ka kharch poora bach jata hai aur byaj dar cheh point paanch pratishat rehti hai.';
    } else if (need === 'WAREHOUSE_ADVANCE') {
      text = 'Mandi me daam kam hone par fasal godown me rakh kar electronic receipt par advance le sakte hain. Iska byaj dar paanch point paanch pratishat hai.';
    } else {
      text = 'Aapki farm telemetry aur mitti ki jaanch ke aadhar par teen sarkari yojanaayein uplabdh hain. Kisi bhi card par click karke turant aavedan karein ya Doorstep Sahayak bulayein.';
    }
    speakText(text, 'GUIDE');
  };

  const handleSahayakSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sahayakPhone.trim()) {
      toast.error('Please enter a mobile phone number');
      return;
    }
    try {
      setSubmittingSahayak(true);
      const farmObj = farms.find(f => Number(f.id) === Number(selectedFarmId));
      const res = await creditService.requestSahayak({
        farmerName: sahayakName || user?.name || 'Farmer Producer',
        phoneNumber: sahayakPhone,
        village: sahayakVillage || farmObj?.location || 'Gram Panchayat Center',
        assistanceType: sahayakAssistanceType === 'PHONE_CALLBACK' ? 'PHONE_CALLBACK' : 'DOORSTEP_VISIT',
        preferredLanguage: 'Hindi / Regional',
        notes: `${sahayakLoanType} | Preferred Time: ${sahayakPreferredTime}`,
      });
      setAssignedSahayakResponse(res);
      toast.success('Doorstep Sahayak dispatched! A verified Bank Mitra will visit your farm.');
    } catch (err) {
      toast.error('Failed to request Sahayak assistance');
    } finally {
      setSubmittingSahayak(false);
    }
  };

  const fetchScoreAndData = async (farmId: number) => {
    try {
      const [scoreRes, offersRes, appsRes] = await Promise.all([
        creditService.getCreditScore(farmId),
        creditService.getLoanOffers(farmId),
        creditService.getApplications(farmId),
      ]);
      setScoreData(scoreRes);
      setOffers(offersRes);
      setApplications(appsRes);
    } catch (err) {
      console.error('Telemetry query error', err);
    }
  };

  const handleFarmChange = async (newFarmId: number) => {
    setSelectedFarmId(newFarmId);
    setLoading(true);
    await Promise.all([
      fetchScoreAndData(newFarmId),
      loadKendras(newFarmId),
    ]);
    setLoading(false);
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const updated = await creditService.recalculateScore(selectedFarmId);
      setScoreData(updated);
      toast.success(`Credit Score updated to ${updated.score} with latest farm telemetry!`);
    } catch (err) {
      toast.error('Failed to recalculate credit score');
    } finally {
      setRecalculating(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (applyAmount <= 0) {
      toast.error('Please enter a valid loan amount');
      return;
    }

    try {
      const created = await creditService.applyForLoan({
        farmId: selectedFarmId,
        loanType,
        amountRequested: applyAmount,
        tenureMonths: applyTenure,
        purpose: applyPurpose,
      });

      if (created.status === 'APPROVED') {
        toast.success(`🎉 Instant Approval! Loan ${created.applicationNumber} approved for ₹${created.amountRequested.toLocaleString('en-IN')}`);
      } else {
        toast.success(`Application ${created.applicationNumber} submitted for underwriting!`);
      }

      setApplications([created, ...applications]);
      setShowApplyModal(false);
      setActiveTab('APPLICATIONS');
    } catch (err) {
      toast.error('Failed to submit loan application');
    }
  };

  const handleEndorseSubmit = async () => {
    try {
      const updated = await creditService.endorseFarm(selectedFarmId, endorseNotes);
      setScoreData(updated);
      setShowEndorseModal(false);
      toast.success('Agronomist Credit Endorsement granted (+35 pts bonus)!');
    } catch (err) {
      toast.error('Failed to submit endorsement');
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewModalApp) return;
    try {
      const updated = await creditService.reviewApplication(reviewModalApp.id, {
        status: reviewStatus,
        underwritingNotes: reviewNotes,
      });
      toast.success(`Application ${updated.applicationNumber} marked as ${updated.status}`);
      setApplications(applications.map(a => (a.id === updated.id ? updated : a)));
      setReviewModalApp(null);
    } catch (err) {
      toast.error('Failed to update loan status');
    }
  };

  // Calculate EMI for the interactive calculator
  const effectiveRate = kccSubvention ? 4.0 : 9.5;
  const monthlyRate = (effectiveRate / 12.0) / 100.0;
  const calculatedEmi = Math.round((calcAmount * monthlyRate * Math.pow(1 + monthlyRate, calcTenure)) / (Math.pow(1 + monthlyRate, calcTenure) - 1));
  const totalRepayment = calculatedEmi * calcTenure;
  const totalInterest = Math.max(0, totalRepayment - calcAmount);

  // Interest saved with KCC
  const standardMonthlyRate = (9.5 / 12.0) / 100.0;
  const standardEmi = Math.round((calcAmount * standardMonthlyRate * Math.pow(1 + standardMonthlyRate, calcTenure)) / (Math.pow(1 + standardMonthlyRate, calcTenure) - 1));
  const standardTotalInterest = Math.max(0, (standardEmi * calcTenure) - calcAmount);
  const subventionSavings = Math.max(0, standardTotalInterest - totalInterest);

  // Gauge calculations (score ranges from 300 to 900)
  const score = scoreData?.score || 750;
  const scorePercent = Math.min(100, Math.max(0, ((score - 300) / 600) * 100));
  // Needle angle: -180 deg to 0 deg
  const needleAngle = -180 + (scorePercent / 100) * 180;

  return (
    <div className={styles.container}>
      {/* ─── Header ─── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <MdAccountBalance style={{ color: '#10b981' }} />
            FarmVerse Alternative Agri-Credit Scoring & Micro-Loan Engine
          </h1>
          <p>
            Telemetry-backed creditworthiness (300-900), collateral-free KCC interest subvention, and instant agricultural micro-loans.
          </p>
        </div>

        <div className={styles.headerActions}>
          {farms.length > 0 && (
            <select
              className={styles.inputField}
              value={selectedFarmId}
              onChange={e => handleFarmChange(Number(e.target.value))}
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location || 'India'})
                </option>
              ))}
            </select>
          )}

          <button
            className={`${styles.btnSm} ${styles.btnPrimary}`}
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            <MdRefresh className={recalculating ? 'spin' : ''} />
            {recalculating ? 'Syncing Telemetry...' : 'Recalculate Score'}
          </button>
        </div>
      </div>

      {/* ─── Authenticated User Status Bar ─── */}
      <div className={styles.userStatusBar}>
        <div className={styles.userStatusLeft}>
          <div className={styles.userBadgeDot} />
          <span>
            Connected as <strong>{user?.name || 'Producer'}</strong>
          </span>
          <span className={styles.badgeRole}>
            {user?.role || 'Farmer'}
          </span>
          {scoreData?.kccEligible && (
            <span className={styles.badgeSpecial}>
              <MdCheck style={{ verticalAlign: 'middle' }} /> KCC 4.0% Subvention Pre-Qualified
            </span>
          )}
          {scoreData?.agronomistEndorsed && (
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
              <MdVerified style={{ verticalAlign: 'middle' }} /> Agronomist Endorsed
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Borrowing Power Cap: <strong>₹{(scoreData?.maxPreApprovedLimit || 350000).toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* ─── Mode Tabs ─── */}
      <div className={styles.tabGroup}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'DIAGNOSTICS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('DIAGNOSTICS')}
        >
          <MdSpeed /> Credit Score & Diagnostics
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'OFFERS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('OFFERS')}
        >
          <MdAttachMoney /> Pre-Approved Loans ({offers.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'CALCULATOR' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('CALCULATOR')}
        >
          <MdCalculate /> EMI & Subvention Calculator
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'APPLICATIONS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('APPLICATIONS')}
        >
          <MdCheckCircle /> Loan Applications Ledger ({applications.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'SAHAYAK' ? styles.activeTab : ''}`}
          onClick={() => {
            setActiveTab('SAHAYAK');
            if (kendras.length === 0) loadKendras(selectedFarmId);
          }}
        >
          <MdSupportAgent /> Doorstep Sahayak & Kendra Locator
        </button>
      </div>

      {/* ─── Tab 1: Credit Score & Telemetry Diagnostics ─── */}
      {activeTab === 'DIAGNOSTICS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.gaugeGrid}>
            {/* Speedometer Gauge Hero Card */}
            <div className={styles.scoreHeroCard}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                FarmVerse Verified Credit Score
              </span>

              {/* Semi-Circular SVG Speedometer Gauge */}
              <div className={styles.gaugeContainer}>
                <svg className={styles.gaugeSvg} viewBox="0 0 240 130">
                  <defs>
                    <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="35%" stopColor="#f59e0b" />
                      <stop offset="70%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Gauge Arc Background Track */}
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  {/* Active Gauge Arc Fill */}
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="url(#scoreGaugeGrad)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * (scorePercent / 100))}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                  {/* Center Pivot Needle */}
                  <g transform={`translate(120, 120) rotate(${needleAngle})`} style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <line x1="0" y1="0" x2="80" y2="0" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="7" fill="#10b981" stroke="#fff" strokeWidth="2" />
                  </g>
                </svg>

                <div className={styles.scoreNumber}>{score}</div>
              </div>

              <div className={styles.scoreScaleLabel}>Scale: 300 (Sub-Prime) to 900 (Prime A)</div>

              <div className={`${styles.tierTag} ${
                scoreData?.tier === 'PRIME_A' ? styles.tierPrime :
                scoreData?.tier === 'SUPERIOR_B' ? styles.tierSuperior :
                scoreData?.tier === 'STANDARD_C' ? styles.tierStandard : styles.tierHighRisk
              }`}>
                <MdShield /> {scoreData?.tierLabel || 'Prime Tier A'}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px' }}>
                Calculated from {scoreData?.farmName || 'your farm'} telemetry, Copernicus Sentinel-2 canopy vigour, and verified soil purity index.
              </p>

              <div className={styles.borrowingPowerBox}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pre-Approved Micro-Loan Limit</div>
                  <div className={styles.borrowingPowerVal}>₹{(scoreData?.maxPreApprovedLimit || 450000).toLocaleString('en-IN')}</div>
                </div>
                <button
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                  onClick={() => {
                    setApplyAmount(scoreData?.maxPreApprovedLimit || 100000);
                    setShowApplyModal(true);
                  }}
                >
                  <MdAttachMoney /> Claim Pre-Approval
                </button>
              </div>

              {canEndorse && (
                <div style={{ marginTop: '14px' }}>
                  <button
                    className={`${styles.btnSm} ${styles.btnOutline}`}
                    onClick={() => setShowEndorseModal(true)}
                  >
                    <MdVerified style={{ color: '#10b981' }} />
                    {scoreData?.agronomistEndorsed ? 'Update Agronomist Endorsement' : 'Grant Agronomist Endorsement (+35 Pts)'}
                  </button>
                </div>
              )}
            </div>

            {/* 4 Telemetry Score Pillars */}
            <div className={styles.pillarsGrid}>
              {scoreData?.pillars?.map((pillar, idx) => (
                <div key={pillar.key || idx} className={styles.pillarCard}>
                  <div className={styles.pillarHeader}>
                    <div className={styles.pillarName}>
                      {pillar.key === 'SOIL_HEALTH' && <MdScience style={{ color: '#10b981' }} />}
                      {pillar.key === 'SATELLITE_NDVI' && <MdSatelliteAlt style={{ color: '#3b82f6' }} />}
                      {pillar.key === 'HARVEST_TRACEABILITY' && <MdCheckCircle style={{ color: '#f59e0b' }} />}
                      {pillar.key === 'WATER_RESILIENCE' && <MdWaterDrop style={{ color: '#06b6d4' }} />}
                      {pillar.name}
                    </div>
                    <div className={styles.pillarScoreVal}>{pillar.score}/100</div>
                  </div>

                  <div className={styles.pillarProgressBar}>
                    <div className={styles.pillarProgressFill} style={{ width: `${pillar.score}%` }} />
                  </div>

                  <div className={styles.pillarMetric}>
                    <strong>Telemetry:</strong> {pillar.telemetryMetric}
                  </div>

                  <div className={styles.pillarNotes}>
                    {pillar.impactNotes}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MdTrendingUp style={{ color: '#10b981' }} />
              Telemetry Score Improvement Pathways
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {scoreData?.recommendations?.map((rec, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px', borderRadius: '50%', display: 'flex', fontSize: '13px' }}>
                    <MdCheck />
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab 2: Pre-Approved Micro-Loan Offers ─── */}
      {activeTab === 'OFFERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ─── Kisan 1-Minute Visual Loan Finder ("Kaunsa Loan Mere Liye Hai?") ─── */}
          <div className={styles.kisanGuideCard}>
            <div className={styles.kisanGuideHeader}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <MdHelpOutline style={{ color: '#10b981', fontSize: '20px' }} />
                  Kisan Loan Margdarshak — Kaunsa Loan Mere Liye Hai?
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  For farmers who need quick guidance: Tap what you need money for below to see the best government-subsidized scheme.
                </p>
              </div>

              <button
                type="button"
                className={styles.audioListenBtn}
                onClick={() => speakCurrentNeed(selectedNeed)}
              >
                <MdVolumeUp /> {isSpeaking && speakingOfferId === 'GUIDE' ? 'Rokein (Stop Voice)' : 'Awaaz me Samjhein (Voice Guide)'}
              </button>
            </div>

            <div className={styles.needsGrid}>
              <button
                type="button"
                className={`${styles.needOptionBtn} ${selectedNeed === 'CROP_INPUT' ? styles.needOptionActive : ''}`}
                onClick={() => setSelectedNeed('CROP_INPUT')}
              >
                <span className={styles.needEmoji}>🌱</span>
                <div>
                  <div className={styles.needLabel}>Beej, Khad & Lagat</div>
                  <div className={styles.needSub}>Seeds, Fertilizer & Field Labor (KCC @ 4%)</div>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.needOptionBtn} ${selectedNeed === 'SOLAR_EQUIPMENT' ? styles.needOptionActive : ''}`}
                onClick={() => setSelectedNeed('SOLAR_EQUIPMENT')}
              >
                <span className={styles.needEmoji}>☀️</span>
                <div>
                  <div className={styles.needLabel}>Solar Pump & Sinchayi</div>
                  <div className={styles.needSub}>Solar Pumping & Drip Systems (@ 6.5%)</div>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.needOptionBtn} ${selectedNeed === 'WAREHOUSE_ADVANCE' ? styles.needOptionActive : ''}`}
                onClick={() => setSelectedNeed('WAREHOUSE_ADVANCE')}
              >
                <span className={styles.needEmoji}>🏢</span>
                <div>
                  <div className={styles.needLabel}>Godown / Mandi Advance</div>
                  <div className={styles.needSub}>Avoid Distress Sale with e-NWR (@ 5.5%)</div>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.needOptionBtn} ${selectedNeed === 'ALL' ? styles.needOptionActive : ''}`}
                onClick={() => setSelectedNeed('ALL')}
              >
                <span className={styles.needEmoji}>📋</span>
                <div>
                  <div className={styles.needLabel}>Sabhi Loans Dekhein</div>
                  <div className={styles.needSub}>View All Pre-Approved Government Schemes</div>
                </div>
              </button>
            </div>

            {/* Live Recommendation Spotlight */}
            <div className={styles.recommendationSpotlight}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
                  Aapke Liye Sabse Up-yukt Yojana (Recommended For You)
                </span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedNeed === 'CROP_INPUT' && 'Kisan Credit Card (KCC) Crop Working Capital (4.0% p.a.)'}
                  {selectedNeed === 'SOLAR_EQUIPMENT' && 'NABARD Solar Micro-Drip Equipment Finance (6.5% p.a.)'}
                  {selectedNeed === 'WAREHOUSE_ADVANCE' && 'e-NWR Post-Harvest Mandi Liquidity Advance (5.5% p.a.)'}
                  {selectedNeed === 'ALL' && 'All 3 Pre-Approved Schemes Available with Telemetry Passport'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {selectedNeed === 'CROP_INPUT' && 'Sarkar 3% byaj subvention deti hai. Bina kisi zameen ke girvi rakhe, FarmVerse soil & harvest passport par turant milta hai.'}
                  {selectedNeed === 'SOLAR_EQUIPMENT' && 'PM-KUSUM 40% capital subsidy ke saath. Diesel kharch zero hota hai aur fasal me 60% paani bachta hai.'}
                  {selectedNeed === 'WAREHOUSE_ADVANCE' && 'Mandi me daam badhne tak intezaar karein. Fasal godown me jama karke 24 ghante me advance paayein.'}
                  {selectedNeed === 'ALL' && 'Neeche diye gaye kisi bhi card par click karke turant aavedan karein ya Doorstep Sahayak bulayein.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                  onClick={() => {
                    const matchedType = selectedNeed === 'SOLAR_EQUIPMENT' ? 'SOLAR_EQUIPMENT' : selectedNeed === 'WAREHOUSE_ADVANCE' ? 'POST_HARVEST_STORAGE' : 'CROP_INPUT';
                    setLoanType(matchedType);
                    setShowApplyModal(true);
                  }}
                >
                  Apply Directly
                </button>
                <button
                  type="button"
                  className={`${styles.btnSm} ${styles.btnOutline}`}
                  onClick={() => setActiveTab('SAHAYAK')}
                >
                  <MdSupportAgent /> Help Me Apply (Doorstep Sahayak)
                </button>
              </div>
            </div>
          </div>

          {/* ─── Loan Offer Cards Grid (With Non-Overlapping Header) ─── */}
          <div className={styles.offersGrid}>
            {(selectedNeed === 'ALL'
              ? offers
              : offers.filter(o => {
                  if (selectedNeed === 'CROP_INPUT') return o.id.includes('KCC') || o.category.includes('CROP') || o.title.toLowerCase().includes('crop');
                  if (selectedNeed === 'SOLAR_EQUIPMENT') return o.id.includes('SOLAR') || o.title.toLowerCase().includes('solar');
                  if (selectedNeed === 'WAREHOUSE_ADVANCE') return o.id.includes('WAREHOUSE') || o.title.toLowerCase().includes('harvest');
                  return true;
                }).length > 0
                ? offers.filter(o => {
                    if (selectedNeed === 'CROP_INPUT') return o.id.includes('KCC') || o.category.includes('CROP') || o.title.toLowerCase().includes('crop');
                    if (selectedNeed === 'SOLAR_EQUIPMENT') return o.id.includes('SOLAR') || o.title.toLowerCase().includes('solar');
                    if (selectedNeed === 'WAREHOUSE_ADVANCE') return o.id.includes('WAREHOUSE') || o.title.toLowerCase().includes('harvest');
                    return true;
                  })
                : offers
            ).map(offer => (
              <div key={offer.id} className={styles.offerCard}>
                {/* Fixed Non-Overlapping Card Header */}
                <div className={styles.offerCardHeader}>
                  <h3 className={styles.offerTitle}>{offer.title}</h3>
                  <span className={styles.offerBadge}>
                    {offer.kccSubsidized ? '4% KCC Subsidized' : 'NABARD Supported'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <button
                    type="button"
                    className={styles.audioListenBtn}
                    onClick={() => speakOffer(offer)}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    <MdVolumeUp /> {speakingOfferId === offer.id ? 'Bol raha hai (Stop)' : 'Awaaz me Suney (Listen)'}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {offer.id}</span>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{offer.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subsidized Interest</div>
                    <div className={styles.offerRate}>
                      {offer.interestRateAnnual}% <span className={styles.offerRateSub}>p.a.</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pre-Approved Up To</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      ₹{offer.maxAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <ul className={styles.offerBenefitsList}>
                  {offer.keyBenefits.map((b, i) => (
                    <li key={i} className={styles.offerBenefitItem}>
                      <MdCheckCircle style={{ color: '#10b981', fontSize: '15px', flexShrink: 0, marginTop: '2px' }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '10px' }}
                  onClick={() => {
                    setLoanType(offer.id === 'OFFER_SOLAR_DRIP' ? 'SOLAR_EQUIPMENT' : offer.id === 'OFFER_WAREHOUSE_ADVANCE' ? 'POST_HARVEST_STORAGE' : 'CROP_INPUT');
                    setApplyAmount(Math.min(offer.maxAmount, 150000));
                    setShowApplyModal(true);
                  }}
                >
                  Apply with 1-Click Telemetry Passport
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 3: Interactive EMI & Subvention Calculator ─── */}
      {activeTab === 'CALCULATOR' && (
        <div className={styles.calcCard}>
          {/* Sliders Area */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Interactive Agricultural EMI & Subsidy Calculator
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Simulate monthly repayments with government Kisan Credit Card (KCC) interest rate subvention.
            </p>

            {/* Slider 1: Loan Amount */}
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span>Loan Principal Amount</span>
                <span className={styles.sliderValue}>₹{calcAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="25000"
                max="500000"
                step="5000"
                className={styles.rangeInput}
                value={calcAmount}
                onChange={e => setCalcAmount(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>₹25,000</span>
                <span>₹2,50,000</span>
                <span>₹5,00,000</span>
              </div>
            </div>

            {/* Slider 2: Tenure Months */}
            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span>Repayment Tenure</span>
                <span className={styles.sliderValue}>{calcTenure} Months ({Math.round(calcTenure / 12 * 10) / 10} Years)</span>
              </div>
              <input
                type="range"
                min="3"
                max="36"
                step="1"
                className={styles.rangeInput}
                value={calcTenure}
                onChange={e => setCalcTenure(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>3 Months</span>
                <span>12 Months</span>
                <span>36 Months</span>
              </div>
            </div>

            {/* Toggle KCC Subvention */}
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Kisan Credit Card (KCC) 3% Interest Subvention
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Effective 4.0% interest rate on timely seasonal repayments
                </div>
              </div>
              <input
                type="checkbox"
                checked={kccSubvention}
                onChange={e => setKccSubvention(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className={styles.calcResultsBox}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Estimated Monthly EMI
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                ₹{calculatedEmi.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                at {effectiveRate}% annual effective interest
              </div>
            </div>

            <div className={styles.calcResultItem}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Principal Borrowed</span>
              <span className={styles.calcResultVal}>₹{calcAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className={styles.calcResultItem}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Interest Payable</span>
              <span className={styles.calcResultVal}>₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>

            {kccSubvention && (
              <div className={styles.calcResultItem} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: '700' }}>KCC Subvention Savings</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#10b981' }}>₹{subventionSavings.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className={styles.calcResultItem}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Repayment</span>
              <span className={styles.calcResultVal}>₹{totalRepayment.toLocaleString('en-IN')}</span>
            </div>

            <button
              className={`${styles.btnSm} ${styles.btnPrimary}`}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '8px' }}
              onClick={() => {
                setApplyAmount(calcAmount);
                setApplyTenure(calcTenure);
                setShowApplyModal(true);
              }}
            >
              Apply With This Plan
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab 4: Loan Applications Ledger ─── */}
      {activeTab === 'APPLICATIONS' && (
        <div className={styles.tableCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Agricultural Micro-Loan Applications Ledger
            </h3>
            <button
              className={`${styles.btnSm} ${styles.btnPrimary}`}
              onClick={() => setShowApplyModal(true)}
            >
              + New Loan Application
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>App Number</th>
                <th>Loan Category</th>
                <th>Farm Origin</th>
                <th>Amount Requested</th>
                <th>Tenure</th>
                <th>Monthly EMI</th>
                <th>Interest Rate</th>
                <th>Status</th>
                <th>Applied Date</th>
                {canReviewLoans && <th>Admin Action</th>}
              </tr>
            </thead>
            <tbody>
              {applications.length > 0 ? (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#10b981' }}>
                        {app.applicationNumber}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {app.loanType === 'CROP_INPUT' ? 'KCC Seasonal Input' :
                         app.loanType === 'SOLAR_EQUIPMENT' ? 'Solar Equipment' :
                         app.loanType === 'POST_HARVEST_STORAGE' ? 'Warehouse Advance' : 'Crop Emergency'}
                      </strong>
                    </td>
                    <td>
                      <div>{app.farmName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.farmLocation}</div>
                    </td>
                    <td>
                      <strong>₹{app.amountRequested.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>{app.tenureMonths} Months</td>
                    <td>₹{app.monthlyEmi.toLocaleString('en-IN')} / mo</td>
                    <td>
                      <Badge variant="info">{app.interestRate}% p.a.</Badge>
                    </td>
                    <td>
                      <Badge
                        variant={
                          app.status === 'DISBURSED' || app.status === 'APPROVED' ? 'success' :
                          app.status === 'PENDING' ? 'warning' : 'error'
                        }
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {app.appliedAt ? app.appliedAt.split('T')[0] : 'Today'}
                    </td>
                    {canReviewLoans && (
                      <td>
                        <button
                          className={`${styles.btnSm} ${styles.btnOutline}`}
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          onClick={() => {
                            setReviewModalApp(app);
                            setReviewStatus('DISBURSED');
                          }}
                        >
                          Review / Disburse
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canReviewLoans ? 10 : 9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No loan applications on record. Apply using your pre-approved credit score above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab 5: Doorstep Sahayak & Kendra Locator ─── */}
      {activeTab === 'SAHAYAK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Toll-Free Helpline Banner */}
          <div className={styles.helplineBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%', display: 'flex', fontSize: '24px' }}>
                <MdPhone />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.3px' }}>
                  24x7 Kisan Call Centre (Toll-Free): 1800-180-1551 / 1551
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Free telephone advice and loan application assistance in your native mother tongue. Uneducated farmers can dial directly.
                </div>
              </div>
            </div>
            <a
              href="tel:18001801551"
              className={styles.btnSm}
              style={{ background: '#fff', color: '#065f46', fontWeight: '800', textDecoration: 'none' }}
            >
              <MdPhone /> Call Helpline Now
            </a>
          </div>

          {/* Doorstep Sahayak Dispatch Card */}
          <div className={styles.sahayakSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <MdSupportAgent style={{ color: '#10b981', fontSize: '22px' }} />
                  Ghar Baithe Kisan Sahayak Seva (Doorstep Banking Mitra)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0', maxWidth: '750px' }}>
                  Can&apos;t read English or visit a bank branch? Request a certified Gram Panchayat Kisan Mitra to visit your farm with a mobile biometric thumb-scanner. They will complete your zero-paperwork e-KYC and loan application right at your doorstep.
                </p>
              </div>

              <button
                className={`${styles.btnSm} ${styles.btnPrimary}`}
                onClick={() => setShowSahayakModal(true)}
              >
                <MdPerson /> Request Doorstep Sahayak Visit
              </button>
            </div>

            {/* If Sahayak Request Confirmed, show assignment banner */}
            {assignedSahayakResponse && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10b981', borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: '800', fontSize: '15px' }}>
                  <MdCheckCircle /> {assignedSahayakResponse.message}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Ticket / Ref Number:</span>
                    <div style={{ fontWeight: '700' }}>{assignedSahayakResponse.ticketNumber}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Kendra Officer:</span>
                    <div style={{ fontWeight: '700' }}>{assignedSahayakResponse.assignedOfficer}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Officer Phone:</span>
                    <div style={{ fontWeight: '700' }}>{assignedSahayakResponse.officerPhone}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Expected Visit Time:</span>
                    <div style={{ fontWeight: '700' }}>{assignedSahayakResponse.expectedVisitTime}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Physical Kendra Centers Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <MdLocationOn style={{ color: '#3b82f6', fontSize: '20px' }} />
                Nazdeeki Sahayata Kendra & Bank Sakha (Nearby Physical Centers)
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Walk into any of these authorized physical centers with your Aadhaar card for instant offline assistance.
              </span>
            </div>

            {loadingKendras ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Finding nearby banking kendras...
              </div>
            ) : (
              <div className={styles.kendrasGrid}>
                {kendras.map((kendra, idx) => (
                  <div key={idx} className={styles.kendraCard}>
                    <div className={styles.kendraHeader}>
                      <div>
                        <div className={styles.kendraTitle}>{kendra.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {kendra.type}
                        </div>
                      </div>
                      <span className={styles.kendraDist}>{kendra.distanceKm}</span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MdLocationOn style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span>{kendra.address}</span>
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Contact Person:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{kendra.contactPerson}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Helpline Phone:</span>
                        <a href={`tel:${kendra.phone}`} style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MdPhone style={{ fontSize: '14px' }} /> {kendra.phone}
                        </a>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <strong>Services:</strong> {kendra.services}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 1-Click Loan Application Modal ─── */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdAccountBalance style={{ color: '#10b981' }} />
              Apply for Agricultural Credit
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              Your verified farm telemetry passport (Score: {score}) will be attached for instant collateral-free underwriting.
            </p>

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Loan Facility Category</label>
                <select
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={loanType}
                  onChange={e => setLoanType(e.target.value)}
                >
                  <option value="CROP_INPUT">Kisan Credit Card Seasonal Input (4.0% p.a.)</option>
                  <option value="SOLAR_EQUIPMENT">Solar Drip Irrigation Equipment (6.5% p.a.)</option>
                  <option value="POST_HARVEST_STORAGE">e-NWR Warehouse Storage Advance (5.5% p.a.)</option>
                  <option value="EMERGENCY_RESCUE">Emergency Micro-Credit Rescue (5.0% p.a.)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Amount (₹ INR)</label>
                  <input
                    type="number"
                    min="10000"
                    max="500000"
                    step="5000"
                    className={styles.inputField}
                    style={{ width: '100%', marginTop: '4px' }}
                    value={applyAmount}
                    onChange={e => setApplyAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Tenure (Months)</label>
                  <select
                    className={styles.inputField}
                    style={{ width: '100%', marginTop: '4px' }}
                    value={applyTenure}
                    onChange={e => setApplyTenure(Number(e.target.value))}
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Purpose of Funds</label>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={applyPurpose}
                  onChange={e => setApplyPurpose(e.target.value)}
                  placeholder="e.g. Certified organic seeds, solar pump battery"
                  required
                />
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                🔒 <strong>Zero Paperwork:</strong> No property hypothecation or income tax filings needed. Collateral is guaranteed by FarmVerse verified farm output.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className={`${styles.btnSm} ${styles.btnOutline}`}
                  onClick={() => setShowApplyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Agronomist Endorsement Modal ─── */}
      {showEndorseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdVerified style={{ color: '#10b981' }} />
              Grant Agronomist Credit Endorsement
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              Officially certify {scoreData?.farmerName}&apos;s farm practices to award a +35 points creditworthiness bonus.
            </p>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Agronomist Inspection & Credit Guarantee Notes</label>
              <textarea
                className={styles.inputField}
                style={{ width: '100%', height: '90px', marginTop: '4px', resize: 'none' }}
                value={endorseNotes}
                onChange={e => setEndorseNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                className={`${styles.btnSm} ${styles.btnOutline}`}
                onClick={() => setShowEndorseModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.btnSm} ${styles.btnPrimary}`}
                onClick={handleEndorseSubmit}
              >
                Grant Official Endorsement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Admin Review Modal ─── */}
      {reviewModalApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdShield style={{ color: '#3b82f6' }} />
              Review Loan {reviewModalApp.applicationNumber}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              Requested: <strong>₹{reviewModalApp.amountRequested.toLocaleString('en-IN')}</strong> by {reviewModalApp.farmerName}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Underwriting Decision</label>
                <select
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value as any)}
                >
                  <option value="APPROVED">APPROVE Loan</option>
                  <option value="DISBURSED">DISBURSE Funds Directly</option>
                  <option value="REJECTED">REJECT Application</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Underwriter / Bank Comments</label>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  className={`${styles.btnSm} ${styles.btnOutline}`}
                  onClick={() => setReviewModalApp(null)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                  onClick={handleReviewSubmit}
                >
                  Save Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Doorstep Sahayak Request Modal ─── */}
      {showSahayakModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdSupportAgent style={{ color: '#10b981' }} />
              Request Doorstep Kisan Sahayak (Bank Mitra)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              A certified local Gram Panchayat banking correspondent will visit your farm with a mobile thumb-scanner for offline loan processing.
            </p>

            <form onSubmit={handleSahayakSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Farmer Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    style={{ width: '100%', marginTop: '4px' }}
                    value={sahayakName}
                    onChange={e => setSahayakName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Mobile Number</label>
                  <input
                    type="tel"
                    className={styles.inputField}
                    style={{ width: '100%', marginTop: '4px' }}
                    value={sahayakPhone}
                    onChange={e => setSahayakPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Village / Gram Panchayat / Farm Address</label>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={sahayakVillage}
                  onChange={e => setSahayakVillage(e.target.value)}
                  placeholder="e.g. Rampur Kalan, Tehsil Shahbad"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Loan Scheme of Interest</label>
                <select
                  className={styles.inputField}
                  style={{ width: '100%', marginTop: '4px' }}
                  value={sahayakLoanType}
                  onChange={e => setSahayakLoanType(e.target.value)}
                >
                  <option value="Kisan Credit Card (KCC) Crop Working Capital">Kisan Credit Card (KCC) Crop Working Capital (4%)</option>
                  <option value="NABARD Solar Micro-Drip Equipment Loan">NABARD Solar Micro-Drip Equipment Loan (6.5%)</option>
                  <option value="e-NWR Post-Harvest Liquidity Advance">e-NWR Post-Harvest Liquidity Advance (5.5%)</option>
                  <option value="General Loan Advice & Credit Scoring">General Guidance on Which Loan to Choose</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Assistance Required</label>
                  <select
                    className={styles.inputField}
                    style={{ width: '100%', marginTop: '4px' }}
                    value={sahayakAssistanceType}
                    onChange={e => setSahayakAssistanceType(e.target.value)}
                  >
                    <option value="BIOMETRIC_KYC">Thumbprint Biometric e-KYC</option>
                    <option value="FORM_FILLING">Complete Offline Form Filling</option>
                    <option value="TELEMETRY_VERIFICATION">Farm Plot Physical Survey</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Preferred Visit Time</label>
                  <select
                    className={styles.inputField}
                    style={{ width: '100%', marginTop: '4px' }}
                    value={sahayakPreferredTime}
                    onChange={e => setSahayakPreferredTime(e.target.value)}
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                    <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#10b981' }}>
                🌿 <strong>100% Free Doorstep Service:</strong> Kisan Sahayaks are certified government Bank Mitras under the National Rural Livelihoods Mission. No fees are charged.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className={`${styles.btnSm} ${styles.btnOutline}`}
                  onClick={() => setShowSahayakModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSahayak}
                  className={`${styles.btnSm} ${styles.btnPrimary}`}
                >
                  {submittingSahayak ? 'Dispatching Sahayak...' : 'Confirm Doorstep Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditScorePage;
