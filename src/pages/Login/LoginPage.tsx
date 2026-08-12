import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import styles from './LoginPage.module.css';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  if (isAuthenticated) { navigate(from, { replace: true }); }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data);
      login(res.tokens.accessToken, res.tokens.refreshToken, res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid email/password or server is unreachable.';
      toast.error(`Login failed. ${msg}`);
    }
  };

  // ── Demo login (for testing without backend) ──────────────────────────────
  const handleDemoLogin = () => {
    const demoUser = { id: '1', name: 'Demo Farmer', email: 'demo@farmverse.io', role: 'Farmer' as const, createdAt: new Date().toISOString() };
    login('demo_access_token', 'demo_refresh_token', demoUser);
    toast.success('Logged in as Demo Farmer');
    navigate('/dashboard', { replace: true });
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
            <h2 className={styles.leftTitle}>Grow smarter.<br />Farm better.</h2>
            <p className={styles.leftDesc}>Enterprise-grade agriculture intelligence at your fingertips.</p>
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
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>Sign in to your FarmVerse account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<MdEmail size={18} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<MdLock size={18} />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                  {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              }
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />

            <div className={styles.forgotRow}>
              <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>

            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Sign In
            </Button>

            <div className={styles.divider}><span>or</span></div>

            <Button type="button" variant="outline" fullWidth size="lg" onClick={handleDemoLogin}>
              Continue with Demo Account
            </Button>
          </form>

          <p className={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.switchLink}>Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
