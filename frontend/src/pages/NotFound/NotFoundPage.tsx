import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdArrowBack } from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', maxWidth: 480 }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>
          <GiWheat color="var(--color-emerald)" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 900,
          color: 'var(--color-emerald)', lineHeight: 1, marginBottom: 0,
          opacity: 0.15,
        }}>
          404
        </h1>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: 12, marginTop: -16,
        }}>
          Page Not Found
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          The page you're looking for has been harvested or doesn't exist. Let's get you back to greener pastures.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'linear-gradient(135deg, var(--color-emerald), var(--color-forest))',
              borderRadius: 99, color: '#fff', fontWeight: 700, textDecoration: 'none',
              boxShadow: 'var(--shadow-green)', transition: 'all 0.2s',
            }}
          >
            <MdArrowBack /> Go to Dashboard
          </Link>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', border: '1.5px solid var(--border-color)',
              borderRadius: 99, color: 'var(--text-primary)', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s', background: 'var(--bg-card)',
            }}
          >
            Go to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
