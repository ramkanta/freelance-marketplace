'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  LayoutDashboard, User, ShieldCheck, Wallet, Star,
  Loader2, AlertCircle, Edit3, Save, Landmark, HelpCircle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface FreelancerProfile {
  id: string;
  user_id: string;
  category: string;
  bio: string;
  rating_avg: number;
  commission_tier: number;
  razorpay_contact_id: string | null;
  razorpay_fund_account_id: string | null;
  kyc_status: string;
}

interface Payout {
  id: string;
  amount: number;
  payout_id: string | null;
  status: string;
  created_at: string;
}

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ category: '', bio: '' });
  const [saving, setSaving] = useState(false);
  
  // RazorpayX Payout Onboarding States
  const [linking, setLinking] = useState(false);
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [linkForm, setLinkForm] = useState({ phone: '', accountNumber: '', ifsc: '' });

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
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

      // Fetch Payouts Log
      try {
        const payoutsRes = await api.get(`/api/v1/freelancers/${user.id}/withdrawals`);
        setPayouts(payoutsRes.data);
      } catch (err) {
        console.error('Failed to retrieve payouts log:', err);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
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

  const handleLinkBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!linkForm.phone.trim() || !linkForm.accountNumber.trim() || !linkForm.ifsc.trim()) {
      toast.error('All fields are required.');
      return;
    }

    setLinking(true);
    setError(null);
    try {
      await api.post(`/api/v1/freelancers/${user.id}/onboard-payouts`, {
        phone: linkForm.phone,
        accountNumber: linkForm.accountNumber,
        ifsc: linkForm.ifsc,
      });
      toast.success('Bank account linked successfully for Payouts!');
      setShowLinkFields(false);
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to onboard payouts. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAmount) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setWithdrawing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await api.post(`/api/v1/freelancers/${user.id}/withdraw`, { amount: amt });
      setSuccessMsg(`Withdrawal of ₹${amt} initiated successfully! Status: ${response.data.status}`);
      setWithdrawAmount('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Withdrawal transaction failed.');
    } finally {
      setWithdrawing(false);
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
            <p className="text-xs text-slate-500">Manage your profile, withdrawal options, and ratings</p>
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

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card 1: Wallet & Earnings */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Wallet Balance
              </CardTitle>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">₹1,500.00</div>
              <p className="text-xs text-slate-500 mt-1">Available balance for immediate withdrawal</p>
            </CardContent>
          </Card>

          {/* Card 2: Rating */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
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
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
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
              <p className="text-xs text-slate-500 mt-1">Platform split automatically scales down</p>
            </CardContent>
          </Card>

        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Profile Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
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
                      <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800 p-4 rounded-xl whitespace-pre-wrap">
                        {profile?.bio || "No biography added yet. Click 'Edit Profile' to add details."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdraw Section */}
            {profile?.razorpay_fund_account_id && (
              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-indigo-400" /> Withdraw Earnings
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Withdraw your earnings directly to your bank account instantly via IMPS.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="amount" className="text-slate-300 text-xs">Amount (INR)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="₹ Amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600 h-10"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={withdrawing || !withdrawAmount}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer h-10 px-6 shrink-0"
                    >
                      {withdrawing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          Processing...
                        </>
                      ) : (
                        'Request Withdrawal'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Settings (Right 1 col) */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-400" /> Payout Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your linked RazorpayX fund account configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {profile?.razorpay_fund_account_id ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">Verification</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        {profile?.kyc_status}
                      </span>
                    </div>
                    <div className="space-y-1 border-t border-slate-900 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Fund Account ID
                      </span>
                      <span className="text-xs font-mono text-slate-300 block overflow-hidden text-ellipsis">
                        {profile.razorpay_fund_account_id}
                      </span>
                    </div>
                    <div className="space-y-1 border-t border-slate-900 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Contact ID
                      </span>
                      <span className="text-xs font-mono text-slate-300 block overflow-hidden text-ellipsis">
                        {profile.razorpay_contact_id}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {showLinkFields ? (
                      <form onSubmit={handleLinkBankAccount} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-slate-300 text-xs">Phone Number</Label>
                          <Input
                            id="phone"
                            type="text"
                            placeholder="10-digit mobile number"
                            required
                            value={linkForm.phone}
                            onChange={(e) => setLinkForm({ ...linkForm, phone: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600 h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="accountNumber" className="text-slate-300 text-xs">Bank Account Number</Label>
                          <Input
                            id="accountNumber"
                            type="text"
                            placeholder="Your bank account number"
                            required
                            value={linkForm.accountNumber}
                            onChange={(e) => setLinkForm({ ...linkForm, accountNumber: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600 h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="ifsc" className="text-slate-300 text-xs">IFSC Code</Label>
                          <Input
                            id="ifsc"
                            type="text"
                            placeholder="e.g. HDFC0000261"
                            required
                            value={linkForm.ifsc}
                            onChange={(e) => setLinkForm({ ...linkForm, ifsc: e.target.value })}
                            className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600 h-9 text-xs"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLinkFields(false)}
                            className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs py-1 h-auto cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={linking}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-1.5 h-auto cursor-pointer flex items-center gap-1"
                          >
                            {linking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Link Account
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        onClick={() => setShowLinkFields(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Landmark className="w-4 h-4" /> Link Bank Account
                      </Button>
                    )}
                  </div>
                )}
                
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Withdrawals Log Table (Full Width) */}
        {profile?.razorpay_fund_account_id && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">
                Withdrawal History
              </CardTitle>
              <CardDescription className="text-slate-400">
                A historical log of your IMPS payouts requested through the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No payout records found. Your withdrawal requests will show up here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-350">
                    <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Payout ID</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/20">
                          <td className="px-4 py-3 text-slate-300">
                            {new Date(p.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">
                            {p.payout_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-white">
                            ₹{p.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              p.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : p.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
