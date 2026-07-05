'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { 
  LayoutDashboard, User, ShieldCheck, Wallet, Star, 
  Settings, Loader2, AlertCircle, Edit3, Save, Landmark, HelpCircle 
} from 'lucide-react';

interface FreelancerProfile {
  id: string;
  user_id: string;
  category: string;
  bio: string;
  rating_avg: number;
  commission_tier: number;
  razorpay_linked_account_id: string | null;
  kyc_status: string;
}

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ category: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/freelancers/${user.id}`);
      setProfile(response.data);
      setEditForm({
        category: response.data.category,
        bio: response.data.bio,
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Not onboarded yet
        router.push('/freelancer/onboard');
      } else {
        setError(err.response?.data?.message || 'Failed to load profile details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const response = await api.patch(`/api/v1/freelancers/${user.id}`, editForm);
      setProfile(response.data);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-500" /> Freelancer Dashboard
            </h1>
            <p className="text-xs text-slate-500">Manage your profile, gigs, payments, and ratings</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer h-10 px-4"
            >
              Go Home
            </Button>
            <Button
              onClick={() => setEditing(!editing)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer h-10 px-4 flex items-center gap-2"
            >
              {editing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card 1: Wallet & Earnings */}
          <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Wallet Balance
              </CardTitle>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">₹0.00</div>
              <p className="text-xs text-slate-500 mt-1">Direct payout Ledger balance</p>
            </CardContent>
          </Card>

          {/* Card 2: Rating */}
          <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Rating
              </CardTitle>
              <Star className="w-4 h-4 text-amber-400 fill-current" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white flex items-center gap-1.5">
                {profile?.rating_avg.toFixed(1)} <span className="text-xs text-slate-500">/ 5.0</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Based on recent customer reviews</p>
            </CardContent>
          </Card>

          {/* Card 3: Commission Tier */}
          <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Platform Fees
              </CardTitle>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {profile?.commission_tier}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Dynamically scales down with high ratings</p>
            </CardContent>
          </Card>

        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Profile Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" /> Profile Details
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your public profile details seen by clients during slot bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-slate-300">Category</Label>
                      <select
                        id="category"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                      >
                        <option value="Software Development" className="bg-slate-950">Software Development</option>
                        <option value="Graphic Design & Branding" className="bg-slate-950">Graphic Design & Branding</option>
                        <option value="SEO & Content Strategy" className="bg-slate-950">SEO & Content Strategy</option>
                        <option value="Video Editing & Animation" className="bg-slate-950">Video Editing & Animation</option>
                        <option value="Digital Marketing" className="bg-slate-950">Digital Marketing</option>
                        <option value="Translation & Copywriting" className="bg-slate-950">Translation & Copywriting</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-slate-300">Professional Bio</Label>
                      <textarea
                        id="bio"
                        rows={6}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="flex w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                        className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer flex items-center gap-1.5"
                      >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Professional Category
                      </span>
                      <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded inline-block">
                        {profile?.category}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Professional Bio
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-850 p-4 rounded-xl whitespace-pre-wrap">
                        {profile?.bio || "No biography added yet. Click 'Edit Profile' to add details."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Settings (Right 1 col) */}
          <div className="space-y-6">
            <Card className="border-slate-850 bg-slate-900/40 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-400" /> Payout Payouts
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Link your bank account to receive customer booking payouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">KYC Status</span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      profile?.kyc_status === 'APPROVED' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {profile?.kyc_status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Razorpay Account ID</span>
                    <span className="text-xs font-mono text-slate-500">
                      {profile?.razorpay_linked_account_id || 'Not Connected'}
                    </span>
                  </div>
                </div>

                {!profile?.razorpay_linked_account_id && (
                  <Button
                    onClick={() => router.push('#')} // Payout link later
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Landmark className="w-4 h-4" /> Link Bank Account
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
