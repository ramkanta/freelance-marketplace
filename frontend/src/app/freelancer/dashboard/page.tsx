'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { freelancersApi } from '../../../lib/api.freelancers';
import { ordersApi } from '../../../lib/api.orders';
import { servicesApi, type Service } from '../../../lib/api.services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  LayoutDashboard, User, ShieldCheck, Wallet, Star,
  Loader2, Edit3, Landmark, CheckCircle2, Package, Plus, Trash2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ category: '', bio: '' });
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [linkForm, setLinkForm] = useState({ phone: '', accountNumber: '', ifsc: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ title: '', category: '', price: '', description: '', deliveryDays: '3' });

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['freelancer-profile', user?.id],
    queryFn: async () => {
      try {
        return await freelancersApi.getProfile(user!.id);
      } catch (err: any) {
        if (err?.response?.status === 404) router.push('/freelancer/onboard');
        throw err;
      }
    },
    enabled: !!user,
    retry: false,
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: () => freelancersApi.withdrawals(user!.id),
    enabled: !!user && !!profile?.razorpay_fund_account_id,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['freelancer-orders'],
    queryFn: ordersApi.list,
    enabled: !!user,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['freelancer-services', profile?.id],
    queryFn: () => servicesApi.byFreelancer(profile!.id),
    enabled: !!profile?.id,
  });

  // Ledger-derived earnings: sum of escrow_release credits to this freelancer
  const earnings = orders
    .filter(o => o.status === 'payout_released' || o.status === 'completed')
    .reduce((sum, o) => {
      const net = Number(o.amount) * (1 - Number(o.commission_rate) / 100);
      return sum + net;
    }, 0);

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: (data: { category: string; bio: string }) =>
      freelancersApi.updateProfile(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      setEditing(false);
      toast.success('Profile updated successfully.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update profile.'),
  });

  const onboardMutation = useMutation({
    mutationFn: () => freelancersApi.onboardPayouts(user!.id, linkForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      setShowLinkFields(false);
      toast.success('Bank account linked successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to link account.'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => freelancersApi.withdraw(user!.id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setWithdrawAmount('');
      toast.success(`Withdrawal of ₹${data.amount ?? ''} initiated! Status: ${data.status ?? 'PENDING'}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Withdrawal failed.'),
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.markDelivered(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-orders'] });
      toast.success('Order marked as delivered. Waiting for customer approval.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Could not mark delivered.'),
  });

  const createServiceMutation = useMutation({
    mutationFn: () =>
      servicesApi.create({
        title: serviceForm.title,
        category: serviceForm.category,
        price: parseFloat(serviceForm.price),
        description: serviceForm.description || undefined,
        deliveryDays: parseInt(serviceForm.deliveryDays) || 3,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-services'] });
      setShowServiceForm(false);
      setServiceForm({ title: '', category: '', price: '', description: '', deliveryDays: '3' });
      toast.success('Service listing created!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create service.'),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-services'] });
      toast.success('Service removed.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove service.'),
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  const handleLinkBank = (e: React.FormEvent) => {
    e.preventDefault();
    onboardMutation.mutate();
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount.'); return; }
    withdrawMutation.mutate(amt);
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-500" /> Freelancer Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage your profile, services, orders, and payouts</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => queryClient.invalidateQueries()} variant="outline"
              className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer h-10 px-3">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setEditForm({ category: profile?.category ?? '', bio: profile?.bio ?? '' });
                setEditing(!editing);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer h-10 px-4 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Earnings</CardTitle>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">
                {ordersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `₹${earnings.toFixed(2)}`}
              </div>
              <p className="text-xs text-slate-500 mt-1">From completed orders after commission</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Rating</CardTitle>
              <Star className="w-4 h-4 text-amber-400 fill-current" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">
                {profile?.rating_avg?.toFixed(1) ?? '—'} <span className="text-xs text-slate-500">/ 5.0</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Based on customer reviews</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Fee</CardTitle>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">{profile?.commission_tier ?? 15}%</div>
              <p className="text-xs text-slate-500 mt-1">Deducted per completed order</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Profile + Orders (left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" /> Profile Details
                </CardTitle>
                <CardDescription className="text-slate-500">Your public profile seen by clients</CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-slate-700 dark:text-slate-300">Category</Label>
                      <select id="category" value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600">
                        {['Software Development','Graphic Design & Branding','SEO & Content Strategy','Video Editing & Animation','Digital Marketing','Translation & Copywriting'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300">Professional Bio</Label>
                      <textarea id="bio" rows={5} value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="flex w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600" />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setEditing(false)}
                        className="border-slate-300 dark:border-slate-800 cursor-pointer">Cancel</Button>
                      <Button type="submit" disabled={updateProfileMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer flex items-center gap-1.5">
                        {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Category</span>
                      <span className="text-sm font-semibold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded inline-block">
                        {profile?.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Bio</span>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl whitespace-pre-wrap">
                        {profile?.bio || "No bio yet. Click 'Edit Profile' to add one."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Orders */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" /> Active Orders
                </CardTitle>
                <CardDescription className="text-slate-500">Mark orders as delivered once work is complete</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
                  </div>
                ) : orders.filter(o => ['payment_captured', 'service_delivered'].includes(o.status)).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No active orders right now.</p>
                ) : (
                  <div className="space-y-3">
                    {orders
                      .filter(o => ['payment_captured', 'service_delivered'].includes(o.status))
                      .map(order => (
                        <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 gap-4">
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-semibold truncate">{order.services?.title ?? `Order #${order.id.slice(0,8)}`}</p>
                            <p className="text-xs text-slate-500">₹{Number(order.amount).toFixed(2)} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              order.status === 'service_delivered' ? 'bg-blue-500/15 text-blue-400' : 'bg-indigo-500/15 text-indigo-400'
                            }`}>{order.status.replace(/_/g,' ')}</span>
                            {order.status === 'payment_captured' && (
                              <Button onClick={() => deliverMutation.mutate(order.id)}
                                disabled={deliverMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2 cursor-pointer">
                                {deliverMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Delivered'}
                              </Button>
                            )}
                            {order.status === 'service_delivered' && (
                              <span className="text-xs text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Awaiting approval</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdraw (only if bank linked) */}
            {profile?.razorpay_fund_account_id && (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-indigo-400" /> Withdraw Earnings
                  </CardTitle>
                  <CardDescription className="text-slate-500">Instant IMPS payout to your linked bank account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300 text-xs">Amount (INR)</Label>
                      <Input id="amount" type="number" placeholder="₹ Amount to withdraw"
                        value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus-visible:ring-indigo-600 h-10" />
                    </div>
                    <Button type="submit" disabled={withdrawMutation.isPending || !withdrawAmount}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer h-10 px-6 shrink-0">
                      {withdrawMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Processing...</> : 'Withdraw'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Col: Payout Settings + Services */}
          <div className="space-y-6">

            {/* Payout Settings */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-400" /> Payout Settings
                </CardTitle>
                <CardDescription className="text-slate-500">RazorpayX fund account</CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.razorpay_fund_account_id ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">KYC Status</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{profile.kyc_status}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fund Account ID</span>
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300 block truncate">{profile.razorpay_fund_account_id}</span>
                    </div>
                  </div>
                ) : showLinkFields ? (
                  <form onSubmit={handleLinkBank} className="space-y-3">
                    {[
                      { id: 'phone', label: 'Phone Number', placeholder: '10-digit mobile', key: 'phone' as const },
                      { id: 'accountNumber', label: 'Account Number', placeholder: 'Bank account number', key: 'accountNumber' as const },
                      { id: 'ifsc', label: 'IFSC Code', placeholder: 'e.g. HDFC0000261', key: 'ifsc' as const },
                    ].map(f => (
                      <div key={f.id} className="space-y-1">
                        <Label htmlFor={f.id} className="text-slate-700 dark:text-slate-300 text-xs">{f.label}</Label>
                        <Input id={f.id} placeholder={f.placeholder} required value={linkForm[f.key]}
                          onChange={(e) => setLinkForm({ ...linkForm, [f.key]: e.target.value })}
                          className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 h-9 text-xs focus-visible:ring-indigo-600" />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" onClick={() => setShowLinkFields(false)}
                        className="flex-1 border-slate-300 dark:border-slate-800 text-xs cursor-pointer">Cancel</Button>
                      <Button type="submit" disabled={onboardMutation.isPending}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer flex items-center justify-center gap-1">
                        {onboardMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Link Account
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setShowLinkFields(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer flex items-center justify-center gap-1.5">
                    <Landmark className="w-4 h-4" /> Link Bank Account
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* My Services */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" /> My Services
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs mt-0.5">Active gig listings</CardDescription>
                </div>
                <Button onClick={() => setShowServiceForm(!showServiceForm)} size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 px-2 text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {showServiceForm && (
                  <form onSubmit={(e) => { e.preventDefault(); createServiceMutation.mutate(); }}
                    className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/60">
                    <Input placeholder="Service title" required value={serviceForm.title}
                      onChange={e => setServiceForm(f => ({ ...f, title: e.target.value }))}
                      className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800" />
                    <Input placeholder="Category" required value={serviceForm.category}
                      onChange={e => setServiceForm(f => ({ ...f, category: e.target.value }))}
                      className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800" />
                    <Input type="number" placeholder="Price (₹)" required value={serviceForm.price}
                      onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
                      className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800" />
                    <Input type="number" placeholder="Delivery days" value={serviceForm.deliveryDays}
                      onChange={e => setServiceForm(f => ({ ...f, deliveryDays: e.target.value }))}
                      className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowServiceForm(false)}
                        className="flex-1 h-7 text-xs border-slate-300 dark:border-slate-800 cursor-pointer">Cancel</Button>
                      <Button type="submit" disabled={createServiceMutation.isPending}
                        className="flex-1 h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">
                        {createServiceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                      </Button>
                    </div>
                  </form>
                )}
                {servicesLoading ? (
                  <div className="text-center py-4 text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /></div>
                ) : (services as Service[]).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No services yet. Click + to add one.</p>
                ) : (
                  (services as Service[]).map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{svc.title}</p>
                        <p className="text-[10px] text-slate-500">₹{Number(svc.price).toLocaleString()} · {svc.delivery_days}d</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteServiceMutation.mutate(svc.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Withdrawal History */}
        {profile?.razorpay_fund_account_id && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Withdrawal History</CardTitle>
              <CardDescription className="text-slate-500">Historical log of IMPS payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="text-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
              ) : withdrawals.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">No withdrawals yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Payout ID</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {withdrawals.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                            {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.payout_id || 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold">₹{Number(p.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              p.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500'
                              : p.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-amber-500/10 text-amber-500'
                            }`}>{p.status}</span>
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
