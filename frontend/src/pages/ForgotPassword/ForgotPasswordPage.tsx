import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdArrowBack, MdKey, MdCheckCircle } from 'react-icons/md';
import { GiWheat } from 'react-icons/gi';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import styles from '../Login/LoginPage.module.css';

// Step 1: Request Reset Code Schema
const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotFormData = z.infer<typeof forgotSchema>;

// Step 2: Reset Password Schema
const resetSchema = z.object({
  code: z.string().min(4, 'Enter the verification code sent or generated'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [targetEmail, setTargetEmail] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Form 1: Forgot Request
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  // Form 2: Reset Password
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Step 1 Submit: Generate Reset Code
  const onForgotSubmit = async (data: ForgotFormData) => {
    try {
      const res = await authService.forgotPassword(data.email);
      setTargetEmail(data.email);
      if (res.resetToken) {
        setResetValue('code', res.resetToken);
      }
      toast.success(res.message || 'Verification code generated!');
      setStep('reset');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'No registered account found with this email.';
      toast.error(msg);
    }
  };

  // Step 2 Submit: Update Password with Code
  const onResetSubmit = async (data: ResetFormData) => {
    try {
      const res = await authService.resetPassword({
        email: targetEmail,
        token: data.code,
        password: data.newPassword,
      });
      toast.success(res.message || 'Password reset successfully! Please log in.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Invalid or expired code. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left Panel */}
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
            <h2 className={styles.leftTitle}>Recover access.<br />Stay in control.</h2>
            <p className={styles.leftDesc}>Secure password recovery to keep your farm data safe and accessible.</p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {step === 'request' ? (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Forgot password?</h1>
                <p className={styles.formSubtitle}>Enter your registered email address to receive a secure recovery code.</p>
              </div>

              <form onSubmit={handleForgotSubmit(onForgotSubmit)} noValidate className={styles.form}>
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<MdEmail size={18} />}
                  error={forgotErrors.email?.message}
                  autoComplete="email"
                  {...registerForgot('email')}
                />

                <Button type="submit" fullWidth loading={isForgotSubmitting} size="lg">
                  Send Recovery Code
                </Button>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <Link to="/login" className={styles.switchLink} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdArrowBack size={16} /> Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className={styles.formHeader}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-emerald)', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  <MdCheckCircle size={16} /> Code generated for {targetEmail}
                </div>
                <h1 className={styles.formTitle}>Reset password</h1>
                <p className={styles.formSubtitle}>Enter the verification code and set your new password.</p>
              </div>

              <form onSubmit={handleResetSubmit(onResetSubmit)} noValidate className={styles.form}>
                <Input
                  label="6-Digit Verification Code"
                  placeholder="e.g. 542891"
                  leftIcon={<MdKey size={18} />}
                  error={resetErrors.code?.message}
                  autoComplete="one-time-code"
                  {...registerReset('code')}
                />

                <Input
                  label="New Password"
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
                  error={resetErrors.newPassword?.message}
                  autoComplete="new-password"
                  {...registerReset('newPassword')}
                />

                <Input
                  label="Confirm New Password"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Repeat new password"
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
                  error={resetErrors.confirmPassword?.message}
                  autoComplete="new-password"
                  {...registerReset('confirmPassword')}
                />

                <Button type="submit" fullWidth loading={isResetSubmitting} size="lg">
                  Update Password & Sign In
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, textDecoration: 'underline', padding: 0 }}
                  >
                    Change email
                  </button>
                  <Link to="/login" className={styles.switchLink} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdArrowBack size={16} /> Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
