import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdSecurity, MdArrowBack, MdRefresh } from 'react-icons/md';
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

  // MFA State
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaEmail, setMfaEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  // Cooldown countdown timer for Resend Code
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data);
      if (res.mfaRequired) {
        setIsMfaStep(true);
        setMfaEmail(res.email || data.email);
        setDemoOtp(res.otpCode || '');
        setOtpValue(res.otpCode || ''); // Pre-fill for ultra-smooth testing/demo
        setCountdown(60);
        toast('Two-Factor Authentication required. Enter the 6-digit verification code.', {
          icon: '🛡️',
        });
        return;
      }

      login(res.tokens.accessToken, res.tokens.refreshToken, res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Invalid email/password or server is unreachable.';
      toast.error(msg);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue || otpValue.trim().length !== 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await authService.verifyMfa({
        email: mfaEmail,
        otp: otpValue.trim(),
      });
      login(res.tokens.accessToken, res.tokens.refreshToken, res.user);
      toast.success(`Identity verified! Welcome, ${res.user.name || 'Farmer'}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Invalid or expired verification code.';
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendMfa = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    try {
      const res = await authService.resendMfa({ email: mfaEmail });
      setDemoOtp(res.otpCode || '');
      setOtpValue(res.otpCode || '');
      setCountdown(60);
      toast.success('New verification code issued!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to resend code.';
      toast.error(msg);
    } finally {
      setIsResending(false);
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
            <h2 className={styles.leftTitle}>Grow smarter.<br />Farm better.</h2>
            <p className={styles.leftDesc}>Enterprise-grade agriculture intelligence at your fingertips.</p>
          </motion.div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <AnimatePresence mode="wait">
          {!isMfaStep ? (
            /* Standard Sign In Form */
            <motion.div
              key="login-form"
              className={styles.formCard}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
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
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                    >
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
              </form>

              <p className={styles.switchText}>
                Don't have an account?{' '}
                <Link to="/register" className={styles.switchLink}>Create one</Link>
              </p>
            </motion.div>
          ) : (
            /* Two-Factor Authentication (MFA) Form */
            <motion.div
              key="mfa-form"
              className={styles.formCard}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  <MdSecurity />
                </div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Two-Factor Auth
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                    Security verification for <strong>{mfaEmail}</strong>
                  </p>
                </div>
              </div>

              {/* Demo Helper Banner */}
              {demoOtp && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.08))',
                    border: '1.5px dashed var(--color-emerald)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      🔐 Verification Code Issued:
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: 18,
                        letterSpacing: 3,
                        color: 'var(--color-emerald)',
                        background: 'var(--bg-primary)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {demoOtp}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, marginTop: 6 }}>
                    Enter this 6-digit code below to verify your device and sign in.
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyMfa} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: 10,
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      borderRadius: 10,
                      border: '2px solid var(--color-emerald)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <Button type="submit" fullWidth loading={isVerifyingOtp} size="lg">
                  Verify & Sign In
                </Button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setIsMfaStep(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <MdArrowBack size={16} /> Back to Sign In
                </button>

                <button
                  type="button"
                  onClick={handleResendMfa}
                  disabled={countdown > 0 || isResending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: countdown > 0 ? 'var(--text-muted)' : 'var(--color-emerald)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <MdRefresh size={16} />
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
