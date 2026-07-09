'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Loader2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { toast } from 'sonner';

const ROLE_DASHBOARD: Record<string, string> = {
  customer: '/customer/dashboard',
  freelancer: '/freelancer/dashboard',
  support: '/support/dashboard',
  admin: '/admin/dashboard',
};

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/v1/auth/login', formData);
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, user, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(ROLE_DASHBOARD[user.role] ?? '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-8rem)]">

      {/* Left branding panel — lg screens only */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 flex-col justify-between p-12 border-r border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-10 w-fit">
            <Shield className="w-3 h-3" /> Escrow Protected Platform
          </span>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            The marketplace built on financial trust.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Double-entry ledger accounting, dynamic commission tiers, and escrow-protected payouts — all in one platform.
          </p>
        </div>
        <div className="space-y-3">
          {[
            'Funds locked in escrow until delivery is confirmed',
            'Dynamic commissions based on freelancer performance',
            'Audit-proof ledger for every transaction',
          ].map((point) => (
            <div key={point} className="flex items-start gap-2.5 text-xs text-slate-400">
              <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</div>
              {point}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 px-4 sm:px-8 md:px-12 py-12">
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
                Welcome back
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-center">
                Sign in to your Servify account
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-500 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                    <Link href="#" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                  ) : 'Sign In'}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <p className="w-full text-xs text-center text-slate-500 dark:text-slate-500">
                <Link href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Forgot your password?
                </Link>
              </p>
              <p className="w-full text-xs text-center text-slate-500 dark:text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
