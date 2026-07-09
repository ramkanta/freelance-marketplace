'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { freelancersApi } from '../../../lib/api.freelancers';
import { toast } from 'sonner';
import {
  Loader2, User, Mail, Save, ArrowLeft,
  KeyRound, Star, Briefcase, FileText,
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Design', 'Writing & Content',
  'Digital Marketing', 'Video & Animation', 'Data Science', 'DevOps',
  'Cybersecurity', 'Consulting', 'Photography', 'Other',
];

export default function FreelancerProfilePage() {
  const { user, login, token } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [nameEdited, setNameEdited] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['auth-profile'],
    queryFn: () => api.get('/api/v1/auth/profile').then(r => r.data),
    enabled: !!user,
  });

  const { data: flProfile, isLoading: flLoading } = useQuery({
    queryKey: ['freelancer-profile', user?.id],
    queryFn: () => freelancersApi.getProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  useEffect(() => {
    if (flProfile) {
      setBio((flProfile as any).bio ?? '');
      setCategory((flProfile as any).category ?? '');
      setPortfolioUrl((flProfile as any).portfolio_url ?? '');
    }
  }, [flProfile]);

  const updateNameMutation = useMutation({
    mutationFn: (newName: string) =>
      api.patch('/api/v1/auth/profile', { name: newName }).then(r => r.data),
    onSuccess: (updated: UserProfile) => {
      queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
      if (token) {
        login(token, { id: updated.id, email: updated.email, name: updated.name, role: updated.role as any });
      }
      setNameEdited(false);
      toast.success('Name updated.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update name.');
    },
  });

  const updateFlProfileMutation = useMutation({
    mutationFn: () =>
      freelancersApi.updateProfile(user!.id, { bio, category, portfolio_url: portfolioUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile', user?.id] });
      toast.success('Freelancer profile updated.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update profile.');
    },
  });

  const isLoading = profileLoading || flLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link
          href="/freelancer/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>

        {/* Account info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Account Details
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-400">
                {profile?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold">{profile?.name}</p>
              <p className="text-slate-400 text-sm">{profile?.email}</p>
              {(flProfile as any)?.rating_avg > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">
                    {Number((flProfile as any).rating_avg).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name edit */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setNameEdited(true); }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => updateNameMutation.mutate(name.trim())}
                  disabled={!nameEdited || updateNameMutation.isPending || name.trim() === profile?.name}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
                >
                  {updateNameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Email address
              </label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Freelancer profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            Freelancer Profile
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell clients about your skills and experience..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Portfolio URL</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={e => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => updateFlProfileMutation.mutate()}
                disabled={updateFlProfileMutation.isPending}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {updateFlProfileMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Profile</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Password section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <h3 className="text-white font-semibold text-sm">Password</h3>
              </div>
              <p className="text-slate-400 text-xs">Change your password via email verification.</p>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Reset password →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
