'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Zap, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function FreelancerOnboard() {
  const { user, token, login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: 'Software Development',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const payload = {
        userId: user.id,
        category: formData.category,
        bio: formData.bio,
      };
      
      const response = await api.post('/api/v1/freelancers', payload);
      
      // Upgrade the role of the user in our local Auth state
      if (token) {
        const updatedUser = { ...user, role: 'freelancer' as const };
        login(token, updatedUser);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to set up freelancer profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Software Development',
    'Graphic Design & Branding',
    'SEO & Content Strategy',
    'Video Editing & Animation',
    'Digital Marketing',
    'Translation & Copywriting'
  ];

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
        <Card className="border-emerald-500/20 bg-emerald-950/5 max-w-md w-full backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Profile Created!
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Your freelancer account is now active. Redirecting you to the home page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Servify</span>
        </div>

        <Card className="border-slate-850 bg-slate-900/60 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
              Complete your profile
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Provide details about your expert services to start getting client bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-slate-300">Service Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-950">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-slate-300">Professional Bio</Label>
                <textarea
                  id="bio"
                  placeholder="Describe your skillset, past experiences, and what services you offer..."
                  required
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="flex w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md shadow-indigo-600/10 cursor-pointer py-2.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting profile...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-850/50 mt-4 pt-4">
            <span className="text-xs text-slate-500">
              By setting up, your account role upgrades to Freelancer automatically.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
