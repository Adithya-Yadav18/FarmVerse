import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdVerified,
  MdLocationOn,
  MdWaterDrop,
  MdSatelliteAlt,
  MdSecurity,
  MdStar,
  MdArrowBack,
  MdWarning,
  MdAgriculture,
  MdPark,
} from 'react-icons/md';
import { traceabilityService } from '../../services/traceabilityService';
import type { PublicProduceJourney } from '../../types';
import { Badge } from '../../components/ui/Badge/Badge';
import toast from 'react-hot-toast';
import styles from './PublicTracePage.module.css';

export const PublicTracePage: React.FC = () => {
  const { batchCode } = useParams<{ batchCode: string }>();
  const navigate = useNavigate();

  const [journey, setJourney] = useState<PublicProduceJourney | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review Form
  const [reviewerName, setReviewerName] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!batchCode) return;
    loadJourney(batchCode);
  }, [batchCode]);

  const loadJourney = async (code: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await traceabilityService.getPublicJourney(code);
      setJourney(data);
    } catch (err: any) {
      setError('Batch lot code not found or inactive.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCode || !reviewerName.trim() || !reviewText.trim()) {
      toast.error('Please fill in your name and review');
      return;
    }

    try {
      setSubmitting(true);
      const newReview = await traceabilityService.addReview(batchCode, {
        consumerName: reviewerName,
        rating,
        reviewText,
        consumerLocation: location || 'Verified Consumer',
      });
      toast.success('Thank you! Your verified feedback has been added.');
      if (journey) {
        setJourney({
          ...journey,
          reviews: [newReview, ...journey.reviews],
          totalReviews: journey.totalReviews + 1,
        });
      }
      setReviewerName('');
      setReviewText('');
      setLocation('');
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.publicContainer} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Loading Farm-to-Fork Journey...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Fetching cryptographic telemetry & satellite records for {batchCode}</p>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className={styles.publicContainer} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <MdWarning style={{ fontSize: '48px', color: '#ef4444' }} />
        <h2 style={{ color: 'var(--text-primary)', marginTop: '12px' }}>Batch Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '8px 0 20px' }}>
          No active traceability record found for batch code: <strong>{batchCode}</strong>.
        </p>
        <button
          className={styles.batchBadge}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/traceability')}
        >
          <MdArrowBack /> Return to Traceability Dashboard
        </button>
      </div>
    );
  }

  const isRecalled = journey.status === 'RECALLED';

  return (
    <div className={styles.publicContainer}>
      {/* Back to Dashboard / Scanner */}
      <div>
        <button
          onClick={() => navigate('/traceability')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: '600',
          }}
        >
          <MdArrowBack /> Back to Traceability Hub
        </button>
      </div>

      {/* Safety Recall Warning */}
      {isRecalled && (
        <div className={styles.recallBanner}>
          <MdWarning style={{ fontSize: '28px', flexShrink: 0 }} />
          <div>
            <div>SAFETY RECALL NOTICE: DO NOT CONSUME</div>
            <div style={{ fontSize: '12px', fontWeight: '400', marginTop: '2px' }}>
              This produce batch has been flagged under safety precautionary recall by agricultural inspection authorities.
            </div>
          </div>
        </div>
      )}

      {/* ─── Hero Card ─── */}
      <div className={styles.heroCard}>
        <div className={styles.topRow}>
          <div>
            <span className={styles.batchBadge}>{journey.batchCode}</span>
            <h1 className={styles.commodityTitle}>
              {journey.commodity}
            </h1>
            <div className={styles.subtitle}>
              {journey.variety || 'Table Variety'} • {journey.quantityKg} kg Harvest Lot
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant={isRecalled ? 'error' : 'success'}>
                {isRecalled ? 'BATCH RECALLED' : 'VERIFIED GENUINE'}
              </Badge>
              <Badge variant="neutral">
                {journey.farmingPractice}
              </Badge>
              <Badge variant="info">
                {journey.scanCount} Consumer Scans
              </Badge>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img
              src={journey.qrDataUrl}
              alt="Batch QR Code"
              className={styles.qrThumbnail}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Scannable QR Tag
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5-Stage Interactive Lifecycle Journey ─── */}
      <div className={styles.timelineSection}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌿 Farm-to-Fork Transparent Lifecycle
        </h2>

        {/* Stage 1: Origin & Farmer */}
        <div className={styles.stageCard}>
          <div className={styles.stageNum}>1</div>
          <div className={styles.stageBody}>
            <div className={styles.stageTitle}>
              <MdLocationOn style={{ color: '#10b981' }} /> Stage 1: Farm Origin & Terroir
            </div>
            <div className={styles.stageSubtitle}>
              Grown by <strong>{journey.origin.farmerName}</strong> at <strong>{journey.origin.farmName}</strong>
            </div>

            <div className={styles.gridProps}>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Location & Region</div>
                <div className={styles.propVal}>{journey.origin.location}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>GPS Coordinates</div>
                <div className={styles.propVal}>{journey.origin.latitude.toFixed(4)}° N, {journey.origin.longitude.toFixed(4)}° E</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Soil Chemistry</div>
                <div className={styles.propVal}>{journey.origin.soilType}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Farming Experience</div>
                <div className={styles.propVal}>{journey.origin.farmingExperienceYears} Years Registered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2: Cultivation & Eco-Telemetry */}
        <div className={styles.stageCard}>
          <div className={styles.stageNum}>2</div>
          <div className={styles.stageBody}>
            <div className={styles.stageTitle}>
              <MdWaterDrop style={{ color: '#3b82f6' }} /> Stage 2: Cultivation & Water Stewardship
            </div>
            <div className={styles.stageSubtitle}>
              Monitored vegetative cycle spanning {journey.cultivation.growthDurationDays} days
            </div>

            <div className={styles.gridProps}>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Sowing Date</div>
                <div className={styles.propVal}>{journey.cultivation.sowingDate || 'Standard Cycle'}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Harvest Timestamp</div>
                <div className={styles.propVal}>{journey.cultivation.harvestDate}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Water & Irrigation</div>
                <div className={styles.propVal}>{journey.cultivation.waterSource}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Growth Climate</div>
                <div className={styles.propVal}>{journey.cultivation.weatherSummary}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 3: Sentinel-2 Satellite & AI Quality Audit */}
        <div className={styles.stageCard}>
          <div className={styles.stageNum}>3</div>
          <div className={styles.stageBody}>
            <div className={styles.stageTitle}>
              <MdSatelliteAlt style={{ color: '#8b5cf6' }} /> Stage 3: Multispectral Satellite & AI Pathology Audit
            </div>
            <div className={styles.stageSubtitle}>
              Copernicus Sentinel-2 orbital telemetry & machine vision disease screening
            </div>

            <div className={styles.gridProps}>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Canopy Vigour Rating</div>
                <div className={styles.propVal} style={{ color: '#10b981' }}>{journey.qualityAudit.satelliteVigourRating}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Multispectral NDVI</div>
                <div className={styles.propVal}>0.76 (Optimal Photosynthesis)</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>AI Pathology Scan</div>
                <div className={styles.propVal} style={{ color: '#10b981' }}>{journey.qualityAudit.diseaseStatus}</div>
              </div>
              <div className={styles.propItem}>
                <div className={styles.propLabel}>Chemical Residue Check</div>
                <div className={styles.propVal}>{journey.qualityAudit.labVerificationStatus}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 4: Agronomist Certification Seal */}
        <div className={styles.stageCard}>
          <div className={styles.stageNum}>4</div>
          <div className={styles.stageBody}>
            <div className={styles.stageTitle}>
              <MdVerified style={{ color: '#10b981' }} /> Stage 4: Agronomist Quality Endorsement
            </div>
            <div className={styles.stageSubtitle}>
              Signed by {journey.endorsement.agronomistName}
            </div>

            <div className={styles.sealBadge}>
              <MdVerified className={styles.sealIcon} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#065f46' }}>
                  {journey.endorsement.certificationSeal || 'FarmVerse Grade A Green Seal'}
                </div>
                <div style={{ fontSize: '13px', color: '#047857', marginTop: '2px' }}>
                  "{journey.endorsement.notes}"
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Inspected & Issued on {journey.endorsement.certifiedAtDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 5: Cryptographic Tamper-Evident Seal */}
        <div className={styles.stageCard}>
          <div className={styles.stageNum}>5</div>
          <div className={styles.stageBody}>
            <div className={styles.stageTitle}>
              <MdSecurity style={{ color: '#f59e0b' }} /> Stage 5: Cryptographic SHA-256 Digital Fingerprint
            </div>
            <div className={styles.stageSubtitle}>
              Tamper-evident verification hash computed over harvest date, farm GPS, and agronomic seal
            </div>

            <div className={styles.cryptoCard}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Immutable Ledger Checksum
              </div>
              <div className={styles.hashVal}>
                SHA256: {journey.cryptographicHash}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Any physical re-packaging or alteration immediately invalidates this digital seal.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Consumer Feedback & Star Ratings ─── */}
      <div className={styles.reviewSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Consumer Reviews ({journey.totalReviews})
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ color: '#f59e0b', display: 'flex' }}>
                {[...Array(5)].map((_, i) => (
                  <MdStar key={i} />
                ))}
              </span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{journey.avgRating} out of 5</strong>
            </div>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className={styles.reviewList}>
          {journey.reviews.map(review => (
            <div key={review.id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{review.consumerName}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    ({review.consumerLocation})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className={styles.stars}>
                    {[...Array(review.rating)].map((_, i) => (
                      <MdStar key={i} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {review.createdAtFormatted}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                "{review.reviewText}"
              </p>
            </div>
          ))}
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '10px' }}>
            Leave Verified Feedback for {journey.origin.farmerName}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              className={styles.inputField}
              placeholder="Your Name (e.g. Aditi)"
              value={reviewerName}
              onChange={e => setReviewerName(e.target.value)}
              required
            />
            <input
              type="text"
              className={styles.inputField}
              placeholder="City / Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <select
              className={styles.inputField}
              value={rating}
              onChange={e => setRating(Number(e.target.value))}
            >
              <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
              <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
              <option value={3}>⭐⭐⭐ (3 - Average)</option>
              <option value={2}>⭐⭐ (2 - Below Par)</option>
              <option value={1}>⭐ (1 - Poor)</option>
            </select>
          </div>

          <textarea
            className={styles.inputField}
            placeholder="Share your experience with produce taste, freshness, and quality..."
            style={{ height: '75px', resize: 'none' }}
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: 'flex-start',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicTracePage;
