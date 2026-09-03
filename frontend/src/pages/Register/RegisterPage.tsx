import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdPhone, MdLocationOn, MdKey, MdBadge } from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import styles from '../Login/LoginPage.module.css';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['Admin', 'Farmer', 'Agronomist', 'Normal User']),
  location: z.string().min(2, 'Location / District is required to personalize your weather and dashboard'),
  phoneNumber: z.string().optional(),
  specialization: z.string().optional(),
  adminPasscode: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(d => {
  if (d.role === 'Admin' && (!d.adminPasscode || d.adminPasscode.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Admin authorization passcode is required to create an Admin account',
  path: ['adminPasscode'],
}).refine(d => {
  if ((d.role === 'Farmer' || d.role === 'Agronomist') && (!d.phoneNumber || d.phoneNumber.trim().length < 8)) {
    return false;
  }
  return true;
}, {
  message: 'Phone number is required for agricultural and advisory verification',
  path: ['phoneNumber'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Farmer', location: '' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role,
        location: data.location,
        phoneNumber: data.phoneNumber,
        adminPasscode: data.adminPasscode,
        specialization: data.specialization,
      });
      login(res.tokens.accessToken, res.tokens.refreshToken, res.user);
      toast.success(`Welcome to FarmVerse, ${res.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Registration failed. Email may already be in use or invalid security passcode.';
      toast.error(msg);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.leftOverlay} />
        <div className={styles.leftContent}>
          <Link to="/" className={styles.brand}>
            <div className={styles.brandIcon}><GiWheat size={22} color="#1B4332" /></div>
            <span className={styles.brandName}>FarmVerse</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.leftQuote}
          >
            <h2 className={styles.leftTitle}>Precision Agriculture<br />For Every Stakeholder</h2>
            <p className={styles.leftDesc}>
              Tailored platforms for Farmers, Agronomists, Consumers, and Enterprise Admins.
            </p>
          </motion.div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Create Account</h1>
            <p className={styles.formSubtitle}>Choose your role to get started with tailored precision tools</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
            {/* Role Selection Tabs */}
            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                Select Account Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { role: 'Farmer', label: '🌾 Farmer', desc: 'Manage Land & Crops' },
                  { role: 'Agronomist', label: '🩺 Agronomist', desc: 'Diagnostics & Advisory' },
                  { role: 'Normal User', label: '🛒 Consumer', desc: 'Track Food & Mandi' },
                  { role: 'Admin', label: '🛡️ Admin', desc: 'System Governance' },
                ].map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setValue('role', r.role as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: selectedRole === r.role ? '2px solid var(--color-emerald)' : '1.5px solid var(--border-color)',
                      background: selectedRole === r.role ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-primary)',
                      color: selectedRole === r.role ? 'var(--color-emerald)' : 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('role')} />
              {errors.role && <p style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4 }}>{errors.role.message}</p>}
            </div>

            <Input
              label="Full Name"
              placeholder={selectedRole === 'Agronomist' ? 'Dr. Sarah Connor' : 'Ramesh Patel'}
              leftIcon={<MdPerson size={18} />}
              error={errors.name?.message}
              autoComplete="name"
              {...register('name')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<MdEmail size={18} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            {/* Role-Specific Location Field (Sets weather region immediately!) */}
            <Input
              label={
                selectedRole === 'Farmer'
                  ? 'Farm State / District (Weather Location)'
                  : selectedRole === 'Agronomist'
                  ? 'Operating Region / State (Advisory Zone)'
                  : selectedRole === 'Admin'
                  ? 'HQ / Operating Region'
                  : 'City / District (Local Mandi & Weather)'
              }
              placeholder={
                selectedRole === 'Farmer'
                  ? 'e.g. Punjab, Ludhiana'
                  : selectedRole === 'Agronomist'
                  ? 'e.g. Tamilnadu, India'
                  : 'e.g. Bengaluru, Karnataka'
              }
              leftIcon={<MdLocationOn size={18} />}
              error={errors.location?.message}
              {...register('location')}
            />

            {/* Role-Specific Phone Number (Farmer and Agronomist) */}
            {(selectedRole === 'Farmer' || selectedRole === 'Agronomist') && (
              <Input
                label="Phone Number (SMS & Farm Alerts)"
                placeholder="e.g. 9876543210"
                leftIcon={<MdPhone size={18} />}
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            )}

            {/* Agronomist Specialization Field */}
            {selectedRole === 'Agronomist' && (
              <Input
                label="Agronomy License / Specialization ID"
                placeholder="e.g. AGRO-IN-8492 or Soil Science"
                leftIcon={<MdBadge size={18} />}
                error={errors.specialization?.message}
                {...register('specialization')}
              />
            )}

            {/* Admin Security Gate Passcode */}
            {selectedRole === 'Admin' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 12, borderRadius: 10, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Input
                  label="Admin Security Passcode"
                  type="password"
                  placeholder="Enter organization passcode"
                  leftIcon={<MdKey size={18} />}
                  error={errors.adminPasscode?.message}
                  {...register('adminPasscode')}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  🔒 Creation of Administrator accounts is restricted. Default dev key: <code style={{ color: 'var(--color-emerald)' }}>FARMVERSE_ADMIN_2026</code>
                </p>
              </div>
            )}

            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              leftIcon={<MdLock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              }
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type={showConfirmPw ? 'text' : 'password'}
              placeholder="Repeat password"
              leftIcon={<MdLock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                  aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              }
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Create {selectedRole} Account
            </Button>
          </form>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.switchLink}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
