'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Software Development',
  'Graphic Design & Branding',
  'SEO & Content Strategy',
  'Video Editing & Animation',
  'Digital Marketing',
  'Translation & Copywriting',
];

export default function FreelancerOnboard() {
  const { user, token, login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ category: CATEGORIES[0], bio: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/v1/freelancers', { userId: user.id, ...formData });
      if (token) {
        login(token, { ...user, role: 'freelancer' as const });
      }
      toast.success('Freelancer profile created! Redirecting to your dashboard...');
      setSuccess(true);
      setTimeout(() => router.push('/freelancer/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set up freelancer profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-slate-950 px-4 py-20">
        <Card className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/10 max-w-sm w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Profile Created!</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
              Your freelancer account is now active. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-[calc(100vh-8rem)]">

      {/* Left info panel — lg screens */}
      <div className="hidden lg:flex lg:w-2/5 bg-slate-950 flex-col justify-center p-12 border-r border-slate-800">
        <h2 className="text-2xl font-extrabold text-white mb-4 leading-tight">
          Start accepting bookings in minutes.
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Complete your profile and Servify will automatically set up your payout account. Clients can start booking your calendar slots right away.
        </p>
        <div className="space-y-4">
          {[
            { step: '1', label: 'Complete your profile', desc: 'Tell clients what you do and how you can help them.' },
            { step: '2', label: 'Link your bank account', desc: 'Add your account details for instant RazorpayX payouts.' },
            { step: '3', label: 'Start getting booked', desc: 'Clients discover and book your calendar slots directly.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 px-4 sm:px-8 md:px-12 py-12">
        <div className="w-full max-w-sm sm:max-w-lg">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
                Complete your profile
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-center">
                Tell clients about your expertise to start receiving bookings.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-500 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-slate-700 dark:text-slate-300">Service Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm text-slate-900 dark:text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300">Professional Bio</Label>
                  <textarea
                    id="bio"
                    placeholder="Describe your skillset, past experiences, and what services you offer..."
                    required
                    rows={5}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="flex w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer py-2.5"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting profile...</>
                  ) : 'Complete Setup'}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="text-xs text-slate-400 dark:text-slate-500 text-center">
                By completing setup, your account role upgrades to Freelancer automatically.
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
