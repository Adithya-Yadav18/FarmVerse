import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MdAgriculture, MdCloud, MdAutoAwesome, MdWaterDrop,
  MdBugReport, MdAssessment, MdArrowForward, MdCheck,
  MdMenu, MdClose,
} from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import { useScrolled } from '../../hooks/useScrollSpy';
import { initials } from '../../utils';
import { Footer } from '../../layouts/Footer/Footer';
import styles from './HomePage.module.css';

const FEATURES = [
  { icon: <MdAgriculture size={28} />, title: 'Farm Management', desc: 'Track all your farms, fields, and operations in one unified platform.' },
  { icon: <GiWheat size={28} />, title: 'Crop Intelligence', desc: 'Monitor crop cycles, growth stages, and yield forecasts with precision.' },
  { icon: <MdCloud size={28} />, title: 'Weather Insights', desc: 'Hyper-local weather data and forecasts tailored to your farm locations.' },
  { icon: <MdWaterDrop size={28} />, title: 'Smart Irrigation', desc: 'Automated irrigation schedules driven by soil moisture and weather data.' },
  { icon: <MdBugReport size={28} />, title: 'Disease Detection', desc: 'AI-powered plant disease identification before it spreads to your harvest.' },
  { icon: <MdAutoAwesome size={28} />, title: 'AI Recommendations', desc: 'Data-driven crop recommendations optimised for your soil and climate.' },
];

const STATS = [
  { value: '12,000+', label: 'Farms Managed' },
  { value: '98%', label: 'Yield Accuracy' },
  { value: '40%', label: 'Water Saved' },
  { value: '24/7', label: 'Monitoring' },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const scrolled = useScrolled(20);
  const heroRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <header className={`${styles.nav} ${scrolled ? styles.navSolid : ''}`}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.navLogo} onClick={closeMenu}>
            <div className={styles.navLogoIcon}><GiWheat size={20} color="#1B4332" /></div>
            <span className={styles.navLogoText}>FarmVerse</span>
          </Link>

          <nav className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#stats" className={styles.navLink}>Platform</a>
            <a href="#contact" className={styles.navLink}>Contact</a>
          </nav>

          <div className={styles.navActions}>
            {isAuthenticated ? (
              <>
                <button
                  className={styles.navProfile}
                  onClick={() => navigate('/dashboard')}
                  aria-label="Go to dashboard"
                >
                  <div className={styles.navAvatar}>{user ? initials(user.name) : 'U'}</div>
                </button>
                <Link to="/dashboard" className={styles.btnPrimary}>
                  Dashboard <MdArrowForward />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.btnOutlineGold}>Sign In</Link>
                <Link to="/register" className={styles.btnPrimary}>Get Started</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.navMenuBtn}
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <button
            type="button"
            className={styles.mobileOverlay}
            onClick={closeMenu}
            aria-label="Close menu"
          />
        )}

        <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
          <nav className={styles.mobileNavLinks}>
            <a href="#features" className={styles.mobileNavLink} onClick={closeMenu}>Features</a>
            <a href="#stats" className={styles.mobileNavLink} onClick={closeMenu}>Platform</a>
            <a href="#contact" className={styles.mobileNavLink} onClick={closeMenu}>Contact</a>
          </nav>
          <div className={styles.mobileNavActions}>
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.mobileCtaPrimary} onClick={closeMenu}>
                Go to Dashboard <MdArrowForward />
              </Link>
            ) : (
              <>
                <Link to="/register" className={styles.mobileCtaPrimary} onClick={closeMenu}>
                  Get Started <MdArrowForward />
                </Link>
                <Link to="/login" className={styles.mobileCtaSecondary} onClick={closeMenu}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />

        {/* Floating particles */}
        <div className={styles.particles}>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 20}%` }}
              animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroTag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GiWheat /> Next-Gen Smart Agriculture
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            Farm Smarter.<br />
            <span className={styles.heroGold}>Harvest Better.</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            FarmVerse brings AI, IoT, and precision agriculture together in one
            enterprise platform — empowering farmers, agronomists, and agribusinesses
            to make data-driven decisions at scale.
          </motion.p>

          <motion.div
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.ctaPrimary}>
                Go to Dashboard <MdArrowForward />
              </Link>
            ) : (
              <>
                <Link to="/register" className={styles.ctaPrimary}>
                  Start Free Trial <MdArrowForward />
                </Link>
                <Link to="/login" className={styles.ctaSecondary}>
                  Sign In
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            className={styles.heroTrust}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {['No credit card required', 'Free 30-day trial', 'Cancel anytime'].map(t => (
              <span key={t} className={styles.trustItem}>
                <MdCheck size={14} /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        <div className={styles.heroScrollHint}>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            ↓
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className={styles.statItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className={styles.sectionTag}>Platform Features</span>
            <h2 className={styles.sectionTitle}>Everything your farm needs</h2>
            <p className={styles.sectionDesc}>
              A complete suite of tools designed to optimise every aspect of modern agriculture.
            </p>
          </motion.div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.container}>
          <motion.div
            className={styles.ctaBannerInner}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.ctaBannerTitle}>Ready to transform your farm?</h2>
            <p className={styles.ctaBannerDesc}>Join 12,000+ farms already using FarmVerse to grow smarter.</p>
            <div className={styles.ctaBannerActions}>
              <Link to="/register" className={styles.ctaPrimary}>Get Started Free</Link>
              <Link to="/login" className={styles.ctaSecondaryDark}>Sign In</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer variant="public" />
    </div>
  );
}
