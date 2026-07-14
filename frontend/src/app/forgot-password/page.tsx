'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = useCallback(async () => {
    setLoading(true);
    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Always show success — never reveal if email exists
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await sendCode();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await sendCode();
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-500/15 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
          <p className="text-slate-400 text-sm mb-6">
            If <span className="text-white font-medium">{email}</span> is registered with Servify, you will receive a 6-digit reset code within a few minutes.
          </p>
          <button
            onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors mb-4"
          >
            Enter Reset Code
          </button>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-400"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Did not receive it? Resend code'}
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
            <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Forgot your password?</h1>
            <p className="text-slate-400 text-sm">
              Enter your email and we will send you a 6-digit reset code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
