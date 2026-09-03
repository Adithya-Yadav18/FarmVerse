import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Farmer' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.register(data);
      login(res.tokens.accessToken, res.tokens.refreshToken, res.user);
      toast.success(`Welcome to FarmVerse, ${res.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Email may already be in use or server is unreachable.';
      toast.error(`Registration failed. ${msg}`);
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
            <h2 className={styles.leftTitle}>Join 12,000+<br />Smart Farmers</h2>
            <p className={styles.leftDesc}>Start managing your farm with intelligence, precision, and insight.</p>
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
            <h1 className={styles.formTitle}>Create account</h1>
            <p className={styles.formSubtitle}>Start your FarmVerse journey today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Farmer"
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

            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                Role
              </label>
              <select
                {...register('role')}
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontSize: 'var(--text-base)', outline: 'none',
                }}
              >
                <option value="Farmer">Farmer</option>
                <option value="Agronomist">Agronomist</option>
                <option value="Admin">Admin</option>
                <option value="Normal User">Normal User</option>
              </select>
              {errors.role && <p style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4 }}>{errors.role.message}</p>}
            </div>

            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              leftIcon={<MdLock size={18} />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
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
              Create Account
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
