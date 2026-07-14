'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { Loader2, User, Mail, Shield, Save, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function CustomerProfilePage() {
  const { user, login, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [edited, setEdited] = useState(false);

  // Redirect unauthenticated users
  React.useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['auth-profile'],
    queryFn: () => api.get('/api/v1/auth/profile').then(r => r.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (newName: string) =>
      api.patch('/api/v1/auth/profile', { name: newName }).then(r => r.data),
    onSuccess: (updated: UserProfile) => {
      queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
      // Update AuthProvider so navbar reflects new name
      if (token) {
        login(token, { id: updated.id, email: updated.email, name: updated.name, role: updated.role as any });
      }
      setEdited(false);
      toast.success('Profile updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update profile.');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === profile?.name) return;
    updateMutation.mutate(name.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 px-4 py-10 transition-colors">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">My Profile</h1>

        {/* Profile card */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {profile?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-semibold text-lg">{profile?.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{profile?.email}</p>
              <span className="inline-block mt-1 text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full capitalize">
                {profile?.role}
              </span>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <User className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setEdited(true); }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Email address
              </label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Shield className="w-4 h-4 inline mr-1.5 text-slate-400" />
                Account role
              </label>
              <input
                type="text"
                value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-400 dark:text-slate-500 cursor-not-allowed capitalize"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}
              </p>
              <button
                type="submit"
                disabled={!edited || updateMutation.isPending || name.trim() === profile?.name}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Password section */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Password</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Change your account password via email verification.</p>
            </div>
            <Link
              href={`/forgot-password`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Reset password →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
