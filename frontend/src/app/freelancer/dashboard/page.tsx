'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { freelancersApi } from '../../../lib/api.freelancers';
import { ordersApi } from '../../../lib/api.orders';
import { servicesApi, type Service } from '../../../lib/api.services';
import { toast } from 'sonner';
import {
  LayoutDashboard, User, Wallet, Star, Loader2, Edit3, Landmark,
  CheckCircle2, Package, Plus, Trash2, RefreshCw,
  ShieldCheck, TrendingUp, Clock, ToggleLeft, ToggleRight, X, Save,
  History, ArrowDownToLine, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Design', 'Writing & Content',
  'Digital Marketing', 'Video & Animation', 'Data Science', 'DevOps',
  'Cybersecurity', 'Consulting', 'Photography', 'Other',
];

// ── helpers ───────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  const m: Record<string, string> = {
    payment_captured: 'bg-indigo-500/15 text-indigo-400',
    service_delivered: 'bg-blue-500/15 text-blue-400',
    payout_released: 'bg-emerald-500/15 text-emerald-400',
    disputed: 'bg-rose-500/15 text-rose-400',
    refunded: 'bg-amber-500/15 text-amber-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
  };
  return m[s] ?? 'bg-slate-500/15 text-slate-400';
};

const rupee = (n: number) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'services' | 'payouts'>('overview');
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [linkForm, setLinkForm] = useState({ phone: '', accountNumber: '', ifsc: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // service form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ title: '', category: '', price: '', description: '', deliveryDays: '3' });

  // edit service inline
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({ title: '', category: '', price: '', description: '', deliveryDays: '' });

  // ── Queries ───────────────────────────────────────────────────────────────
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

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['freelancer-orders', user?.id],
    queryFn: ordersApi.list,
    enabled: !!user,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['freelancer-services', profile?.id],
    queryFn: () => servicesApi.byFreelancer(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: () => freelancersApi.withdrawals(user!.id),
    enabled: !!user,
  });

  // ── Derived stats ─────────────────────────────────────────────────────────
  // Total net earnings from all payout_released / completed orders
  const totalEarnings = orders
    .filter(o => ['payout_released', 'completed'].includes(o.status))
    .reduce((sum, o) => {
      const net = Number(o.amount) * (1 - Number(o.commission_rate) / 100);
      return sum + net;
    }, 0);

  // Available to withdraw = total earnings minus already-withdrawn amounts
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'SUCCESS')
    .reduce((sum, w) => sum + Number(w.amount), 0);
  const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

  const activeOrders = orders.filter(o => ['payment_captured', 'service_delivered'].includes(o.status));
  const activeServices = (services as Service[]).filter(s => s.is_active);
  const commissionRate = Number((profile as any)?.commission_tier ?? 15);
  const ratingAvg = Number((profile as any)?.rating_avg ?? 0);

  // ── Mutations ─────────────────────────────────────────────────────────────
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', user?.id] });
      setWithdrawAmount('');
      toast.success('Withdrawal initiated! Funds arrive in 1–2 business days.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Withdrawal failed.'),
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.markDelivered(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-orders', user?.id] });
      toast.success('Marked as delivered. Waiting for customer approval.');
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
      queryClient.invalidateQueries({ queryKey: ['freelancer-services', profile?.id] });
      setShowServiceForm(false);
      setServiceForm({ title: '', category: '', price: '', description: '', deliveryDays: '3' });
      toast.success('Service created!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create service.'),
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof servicesApi.update>[1] }) =>
      servicesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-services', profile?.id] });
      setEditingServiceId(null);
      toast.success('Service updated.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update service.'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      servicesApi.update(id, { isActive }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-services', profile?.id] });
      toast.success(vars.isActive ? 'Service is now active.' : 'Service paused.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to toggle service.'),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-services', profile?.id] });
      toast.success('Service removed.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove service.'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount.'); return; }
    if (amt > availableBalance) { toast.error(`Maximum available: ${rupee(availableBalance)}`); return; }
    if (!(profile as any)?.razorpay_fund_account_id) {
      toast.error('Please link your bank account first.'); return;
    }
    withdrawMutation.mutate(amt);
  };

  const startEditService = (svc: Service) => {
    setEditingServiceId(svc.id);
    setEditServiceForm({
      title: svc.title,
      category: svc.category,
      price: String(svc.price),
      description: svc.description ?? '',
      deliveryDays: String(svc.delivery_days),
    });
  };

  const handleSaveService = (id: string) => {
    updateServiceMutation.mutate({
      id,
      payload: {
        title: editServiceForm.title,
        category: editServiceForm.category,
        price: parseFloat(editServiceForm.price),
        description: editServiceForm.description,
        deliveryDays: parseInt(editServiceForm.deliveryDays) || 3,
      },
    });
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: Package, badge: activeOrders.length || undefined },
    { key: 'services', label: 'Services', icon: Star },
    { key: 'payouts', label: 'Payouts', icon: Wallet },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top header ── */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-indigo-400">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{(profile as any)?.category ?? 'Freelancer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/freelancer/profile"
              className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
              Edit Profile
            </Link>
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="p-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none gap-1 pb-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.badge ? (
                  <span className="bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Total Earned', value: rupee(totalEarnings),
                  sub: 'After platform fee', icon: TrendingUp, color: 'text-emerald-400',
                },
                {
                  label: 'Available', value: rupee(availableBalance),
                  sub: 'Ready to withdraw', icon: Wallet, color: 'text-indigo-400',
                },
                {
                  label: 'Rating', value: ratingAvg > 0 ? `${ratingAvg.toFixed(1)} ★` : '—',
                  sub: 'Customer avg', icon: Star, color: 'text-amber-400',
                },
                {
                  label: 'Platform Fee', value: `${commissionRate}%`,
                  sub: 'Per completed order', icon: ShieldCheck, color: 'text-slate-400',
                },
              ].map(s => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  {ordersLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <p className="text-xl font-extrabold text-white">{s.value}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick payout CTA if no bank linked */}
            {!(profile as any)?.razorpay_fund_account_id && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-300">Bank account not linked</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Link your bank to withdraw earnings via RazorpayX IMPS.</p>
                </div>
                <button onClick={() => setActiveTab('payouts')}
                  className="text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg transition-colors flex-shrink-0">
                  Link Bank
                </button>
              </div>
            )}

            {/* Recent active orders preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" /> Active Orders
                  {activeOrders.length > 0 && (
                    <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeOrders.length}
                    </span>
                  )}
                </h3>
                <button onClick={() => setActiveTab('orders')}
                  className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
              </div>
              {ordersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
              ) : activeOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No active orders right now.</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {activeOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {order.services?.title ?? `Order #${order.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rupee(Number(order.amount))} · {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex-shrink-0 ${statusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      {order.status === 'payment_captured' && (
                        <button
                          onClick={() => deliverMutation.mutate(order.id)}
                          disabled={deliverMutation.isPending}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                          {deliverMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Deliver'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Services summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-400" /> My Services
                  <span className="text-slate-500 font-normal text-xs">
                    {activeServices.length} active / {(services as Service[]).length} total
                  </span>
                </h3>
                <button onClick={() => setActiveTab('services')}
                  className="text-xs text-indigo-400 hover:text-indigo-300">Manage →</button>
              </div>
              {servicesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
              ) : (services as Service[]).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No services yet.</p>
                  <button onClick={() => { setActiveTab('services'); setShowServiceForm(true); }}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">+ Create your first service</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {(services as Service[]).slice(0, 3).map(svc => (
                    <div key={svc.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{svc.title}</p>
                        <p className="text-xs text-slate-500">{rupee(Number(svc.price))} · {svc.delivery_days}d delivery</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${svc.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {svc.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ ORDERS TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">All Orders</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your complete order history</p>
            </div>
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">No orders yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {orders.map(order => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {order.services?.title ?? `Order #${order.id.slice(0, 8).toUpperCase()}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-slate-400">
                          {rupee(Number(order.amount))} → You get {rupee(Number(order.amount) * (1 - Number(order.commission_rate) / 100))}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      {order.status === 'payment_captured' && (
                        <button
                          onClick={() => deliverMutation.mutate(order.id)}
                          disabled={deliverMutation.isPending}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
                          {deliverMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Delivered'}
                        </button>
                      )}
                      {order.status === 'service_delivered' && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Awaiting approval
                        </span>
                      )}
                      <Link href={`/orders/${order.id}`}
                        className="text-xs text-slate-500 hover:text-indigo-400 border border-slate-700 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition-colors">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SERVICES TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">My Services</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeServices.length} active · {(services as Service[]).length - activeServices.length} paused
                </p>
              </div>
              <button
                onClick={() => setShowServiceForm(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors">
                {showServiceForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showServiceForm ? 'Cancel' : 'New Service'}
              </button>
            </div>

            {/* Create form */}
            {showServiceForm && (
              <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5">
                <h4 className="text-sm font-bold text-white mb-4">New Service</h4>
                <form
                  onSubmit={e => { e.preventDefault(); createServiceMutation.mutate(); }}
                  className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
                      <input
                        required
                        value={serviceForm.title}
                        onChange={e => setServiceForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. I will build your React website"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Category *</label>
                      <select
                        required
                        value={serviceForm.category}
                        onChange={e => setServiceForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Price (₹) *</label>
                      <input
                        required type="number" min="1"
                        value={serviceForm.price}
                        onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="e.g. 2500"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Delivery Days *</label>
                      <input
                        required type="number" min="1"
                        value={serviceForm.deliveryDays}
                        onChange={e => setServiceForm(f => ({ ...f, deliveryDays: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                      <textarea
                        rows={3}
                        value={serviceForm.description}
                        onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe what you offer..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-1">
                    <button type="button" onClick={() => setShowServiceForm(false)}
                      className="text-sm text-slate-400 hover:text-white px-4 py-2 border border-slate-700 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={createServiceMutation.isPending}
                      className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
                      {createServiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Service
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Services list */}
            {servicesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
            ) : (services as Service[]).length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center">
                <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No services yet.</p>
                <button onClick={() => setShowServiceForm(true)}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">+ Create your first service</button>
              </div>
            ) : (
              <div className="space-y-3">
                {(services as Service[]).map(svc => (
                  <div key={svc.id} className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${svc.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-70'}`}>
                    {editingServiceId === svc.id ? (
                      /* ── Edit mode ── */
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-white">Edit Service</p>
                          <button onClick={() => setEditingServiceId(null)} className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                            <input
                              value={editServiceForm.title}
                              onChange={e => setEditServiceForm(f => ({ ...f, title: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                            <select
                              value={editServiceForm.category}
                              onChange={e => setEditServiceForm(f => ({ ...f, category: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Price (₹)</label>
                            <input type="number" min="1"
                              value={editServiceForm.price}
                              onChange={e => setEditServiceForm(f => ({ ...f, price: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Delivery Days</label>
                            <input type="number" min="1"
                              value={editServiceForm.deliveryDays}
                              onChange={e => setEditServiceForm(f => ({ ...f, deliveryDays: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                            <textarea rows={3}
                              value={editServiceForm.description}
                              onChange={e => setEditServiceForm(f => ({ ...f, description: e.target.value }))}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-4">
                          <button onClick={() => setEditingServiceId(null)}
                            className="text-sm text-slate-400 hover:text-white px-4 py-2 border border-slate-700 rounded-xl transition-colors">
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveService(svc.id)}
                            disabled={updateServiceMutation.isPending}
                            className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
                            {updateServiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── View mode ── */
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-white truncate">{svc.title}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${svc.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                              {svc.is_active ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 mt-1">
                            <span className="text-xs text-slate-400">{rupee(Number(svc.price))}</span>
                            <span className="text-xs text-slate-500">{svc.delivery_days}d delivery</span>
                            <span className="text-xs text-slate-600">{svc.category}</span>
                          </div>
                          {svc.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Toggle active/inactive */}
                          <button
                            onClick={() => toggleActiveMutation.mutate({ id: svc.id, isActive: !svc.is_active })}
                            disabled={toggleActiveMutation.isPending}
                            title={svc.is_active ? 'Pause service' : 'Activate service'}
                            className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors">
                            {svc.is_active
                              ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                              : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => startEditService(svc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {/* Delete (soft) */}
                          <button
                            onClick={() => {
                              if (confirm('Remove this service? It will be soft-deleted and hidden from listings.')) {
                                deleteServiceMutation.mutate(svc.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ PAYOUTS TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'payouts' && (
          <div className="space-y-5">
            {/* Balance summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Earned', value: rupee(totalEarnings), color: 'text-emerald-400' },
                { label: 'Total Withdrawn', value: rupee(totalWithdrawn), color: 'text-slate-300' },
                { label: 'Available Now', value: rupee(availableBalance), color: 'text-indigo-400' },
              ].map(s => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{s.label}</p>
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Bank account / payout settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Landmark className="w-4 h-4 text-slate-400" /> Payout Settings
              </h3>
              {(profile as any)?.razorpay_fund_account_id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status</span>
                    <span className="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase text-[10px]">
                      {(profile as any).kyc_status ?? 'LINKED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Fund Account ID</span>
                    <span className="font-mono text-slate-400 truncate ml-4 text-right">{(profile as any).razorpay_fund_account_id}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-3">
                    <p className="text-xs text-slate-500">Bank account linked via RazorpayX. Payouts arrive via IMPS within 1–2 business days.</p>
                  </div>
                </div>
              ) : showLinkFields ? (
                <form onSubmit={e => { e.preventDefault(); onboardMutation.mutate(); }} className="space-y-3">
                  {[
                    { id: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', key: 'phone' as const },
                    { id: 'accountNumber', label: 'Bank Account Number', placeholder: 'Your account number', key: 'accountNumber' as const },
                    { id: 'ifsc', label: 'IFSC Code', placeholder: 'e.g. HDFC0000261', key: 'ifsc' as const },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                      <input
                        id={f.id} required
                        placeholder={f.placeholder}
                        value={linkForm[f.key]}
                        onChange={e => setLinkForm(v => ({ ...v, [f.key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowLinkFields(false)}
                      className="flex-1 text-sm text-slate-400 hover:text-white border border-slate-700 py-2.5 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={onboardMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors">
                      {onboardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                      Link Account
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowLinkFields(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors">
                  <Landmark className="w-4 h-4" /> Link Bank Account
                </button>
              )}
            </div>

            {/* Withdraw form — only if bank linked */}
            {(profile as any)?.razorpay_fund_account_id && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <ArrowDownToLine className="w-4 h-4 text-indigo-400" /> Withdraw Earnings
                </h3>
                {availableBalance <= 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">No available balance to withdraw.</p>
                    <p className="text-xs text-slate-600 mt-1">Complete more orders to earn.</p>
                  </div>
                ) : (
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Amount (₹) — Available: <span className="text-white">{rupee(availableBalance)}</span>
                      </label>
                      <input
                        type="number" min="1" max={availableBalance}
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder={`Max ${rupee(availableBalance)}`}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button type="submit" disabled={withdrawMutation.isPending || !withdrawAmount}
                      className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                      {withdrawMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Withdraw via IMPS'}
                    </button>
                    <p className="text-xs text-slate-500 text-center">Funds arrive in 1–2 business days</p>
                  </form>
                )}
              </div>
            )}

            {/* Withdrawal history */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-white">Withdrawal History</h3>
              </div>
              {withdrawalsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
              ) : withdrawals.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No withdrawals yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-800">
                      <tr>
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-5 py-3">Date</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-500 px-5 py-3 hidden sm:table-cell">Payout ID</th>
                        <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-5 py-3">Amount</th>
                        <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {withdrawals.map(w => (
                        <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(w.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-500 hidden sm:table-cell">{w.payout_id ?? 'N/A'}</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-white">{rupee(Number(w.amount))}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              w.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400'
                              : w.status === 'FAILED' ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-amber-500/15 text-amber-400'
                            }`}>{w.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
