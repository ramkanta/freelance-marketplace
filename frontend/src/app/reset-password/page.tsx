'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle, Check, X } from 'lucide-react';
import { PasswordStrengthMeter } from '../../components/ui/password-strength-meter';
import { meetsMinimumRequirements } from '../../lib/password-strength';

const RESEND_COOLDOWN_SECONDS = 30;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefillEmail = params.get('email') ?? '';

  const [email, setEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setOtpError(false);
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      setOtpError(false);
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const otpString = otp.join('');
  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
  const isValid =
    email.trim() &&
    otpString.length === 6 &&
    meetsMinimumRequirements(newPassword) &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await api.post('/api/v1/auth/reset-password', {
        email,
        otp: otpString,
        newPassword,
      });
      setDone(true);
    } catch (err: any) {
      setOtpError(true);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.error(err?.response?.data?.message ?? 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || !email.trim()) return;
    setResending(true);
    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      toast.success('A new code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp(['', '', '', '', '', '']);
      setOtpError(false);
    } catch {
      toast.success('A new code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }, [cooldown, email]);

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Password updated!</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your password has been changed successfully. You have been signed out of all devices.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Sign in with new password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Enter reset code</h1>
            <p className="text-slate-400 text-sm">
              Enter the 6-digit code sent to your email and choose a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            {!prefillEmail && (
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            {/* OTP inputs */}
            <div role="group" aria-labelledby="otp-label">
              <label id="otp-label" className="block text-sm font-medium text-slate-300 mb-3">Verification code</label>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Digit ${i + 1} of 6`}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-full aspect-square min-w-0 text-center text-lg sm:text-xl font-bold bg-slate-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      otpError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'
                    }`}
                  />
                ))}
              </div>
              {otpError && (
                <p role="alert" className="text-xs text-red-400 mt-2">Invalid or expired code. Please try again.</p>
              )}
              <p className="text-xs text-slate-500 mt-2">Code expires in 15 minutes</p>
            </div>

            {/* New password */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">New password</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-300 mb-2">Confirm new password</label>
              <input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {confirmPassword.length > 0 && (
                <p className={`flex items-center gap-1.5 text-xs mt-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Did not receive a code?{' '}
            {email.trim() ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend code'}
              </button>
            ) : (
              <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Request again
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
