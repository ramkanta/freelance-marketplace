'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { disputesApi, type Dispute } from '../../../lib/api.disputes';
import { adminUsersApi, type PlatformStats } from '../../../lib/api.admin';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  ShieldAlert, Settings, Database, BarChart3,
  Loader2, AlertCircle, Play, CheckCircle, RefreshCw, XCircle, Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Migration {
  name: string;
  executed: boolean;
  sql?: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-500',
  under_review: 'bg-indigo-500/10 text-indigo-400',
  escalated: 'bg-rose-500/10 text-rose-400',
  resolved_refund: 'bg-emerald-500/10 text-emerald-400',
  resolved_release: 'bg-emerald-500/10 text-emerald-400',
  resolved_split: 'bg-emerald-500/10 text-emerald-400',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'analytics' | 'disputes' | 'migrations' | 'settings'>('analytics');
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [splitPercent, setSplitPercent] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/');
  }, [user, router]);

  // ─── Platform stats ──────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: adminUsersApi.stats,
    enabled: !!user && user.role === 'admin',
    staleTime: 60_000,
  });

  // ─── Disputes ────────────────────────────────────────────────────────────────
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<string>('');
  const { data: disputes = [], isLoading: disputesLoading, refetch: refetchDisputes } = useQuery({
    queryKey: ['admin-disputes', disputeStatusFilter],
    queryFn: () => disputesApi.list(disputeStatusFilter || undefined),
    enabled: !!user && user.role === 'admin',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution, customerRefundPercent }: {
      id: string;
      resolution: 'resolved_refund' | 'resolved_release' | 'resolved_split';
      customerRefundPercent?: number;
    }) => disputesApi.resolve(id, { resolution, customerRefundPercent, resolutionNote: resolutionNote[id] || undefined }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolutionNote(prev => { const n = { ...prev }; delete n[vars.id]; return n; });
      const label = vars.resolution === 'resolved_refund' ? 'Full refund issued.'
        : vars.resolution === 'resolved_release' ? 'Escrow released to freelancer.'
        : `Split: ${vars.customerRefundPercent}% to customer.`;
      toast.success(`Dispute resolved. ${label}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Resolution failed.'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ disputeId, agentId }: { disputeId: string; agentId: string }) =>
      disputesApi.assign(disputeId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Dispute assigned and moved to under review.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Assignment failed.'),
  });

  // ─── Migrations ──────────────────────────────────────────────────────────────
  const fetchMigrations = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const res = await api.get('/api/v1/admin/migrations');
      setMigrations(res.data);
    } catch (err: any) {
      setDbError(err.response?.data?.message ?? 'Failed to load migrations.');
    } finally {
      setDbLoading(false);
    }
  };

  const runAll = async () => {
    if (!confirm('Run ALL pending migrations against the production database now? This cannot be undone.')) return;
    setDbLoading(true);
    setDbError(null);
    try {
      await api.post('/api/v1/admin/migrations/run');
      toast.success('All pending migrations executed.');
      fetchMigrations();
    } catch (err: any) {
      setDbError(err.response?.data?.message ?? 'Migration run failed.');
      setDbLoading(false);
    }
  };

  const runSingle = async (name: string) => {
    if (!confirm(`Run migration "${name}" against the production database now? This cannot be undone.`)) return;
    setDbLoading(true);
    setDbError(null);
    try {
      await api.post('/api/v1/admin/migrations/run-single', { name });
      toast.success(`Migration ${name} executed.`);
      fetchMigrations();
    } catch (err: any) {
      setDbError(err.response?.data?.message ?? `Migration ${name} failed.`);
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'migrations') fetchMigrations();
  }, [activeTab]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 px-6 text-center">
        <Card className="border-rose-500/20 max-w-md w-full p-6">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-4">Admin credentials required.</p>
          <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full">Return Home</Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'disputes', label: 'Disputes', icon: ShieldAlert },
    { id: 'migrations', label: 'Migrations', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-500" /> Admin Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">Monitor platform, resolve disputes, run migrations</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
            <Button onClick={() => router.push('/admin/users')}
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-xs h-9 px-3 cursor-pointer flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Users
            </Button>
          </div>
        </div>

        {/* ── Analytics ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Users */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Users</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: 'Total', value: stats?.users.total, color: '' },
                  { label: 'Customers', value: stats?.users.customers, color: 'text-indigo-500' },
                  { label: 'Freelancers', value: stats?.users.freelancers, color: 'text-violet-500' },
                  { label: 'Support', value: stats?.users.support, color: 'text-blue-500' },
                  { label: 'Admins', value: stats?.users.admins, color: 'text-amber-500' },
                  { label: 'Banned', value: stats?.users.banned, color: 'text-rose-500' },
                ].map(s => (
                  <Card key={s.label} className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <CardContent className="pt-4 pb-3">
                      <div className={`text-2xl font-extrabold ${s.color}`}>
                        {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value ?? 0}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Orders */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Orders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Orders', value: stats?.orders.total, color: '' },
                  { label: 'Active', value: stats?.orders.active, color: 'text-indigo-500' },
                  { label: 'Completed', value: stats?.orders.completed, color: 'text-emerald-500' },
                  { label: 'Disputed', value: stats?.orders.disputed, color: 'text-rose-500' },
                ].map(s => (
                  <Card key={s.label} className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <CardContent className="pt-4 pb-3">
                      <div className={`text-2xl font-extrabold ${s.color}`}>
                        {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value ?? 0}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Escrow */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Escrow Ledger</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'At Risk', value: stats ? `₹${Number(stats.escrow.atRisk).toLocaleString('en-IN')}` : '—', color: 'text-rose-500' },
                  { label: 'Locked', value: stats ? `₹${Number(stats.escrow.lockedTotal).toLocaleString('en-IN')}` : '—', color: 'text-amber-500' },
                  { label: 'Released', value: stats ? `₹${Number(stats.escrow.releasedTotal).toLocaleString('en-IN')}` : '—', color: 'text-emerald-500' },
                  { label: 'Refunded', value: stats ? `₹${Number(stats.escrow.refundedTotal).toLocaleString('en-IN')}` : '—', color: 'text-slate-400' },
                ].map(s => (
                  <Card key={s.label} className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <CardContent className="pt-4 pb-3">
                      <div className={`text-xl font-extrabold ${s.color}`}>
                        {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Disputes summary */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Disputes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Open', value: stats?.disputes.open, color: 'text-amber-500' },
                  { label: 'Under Review', value: stats?.disputes.underReview, color: 'text-indigo-500' },
                  { label: 'Resolved', value: stats?.disputes.resolved, color: 'text-emerald-500' },
                ].map(s => (
                  <Card key={s.label} className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <CardContent className="pt-4 pb-3">
                      <div className={`text-2xl font-extrabold ${s.color}`}>
                        {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value ?? 0}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Disputes ── */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold">All Disputes</h2>
              <div className="flex items-center gap-2">
                <select
                  value={disputeStatusFilter}
                  onChange={(e) => setDisputeStatusFilter(e.target.value)}
                  className="text-xs h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="under_review">Under review</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved_refund">Resolved — refund</option>
                  <option value="resolved_release">Resolved — release</option>
                  <option value="resolved_split">Resolved — split</option>
                </select>
                <Button onClick={() => refetchDisputes()} variant="outline" size="sm"
                  className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer h-8 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
              </div>
            </div>

            {disputesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                No disputes found.
              </div>
            ) : (
              disputes.map(dispute => {
                const resolved = ['resolved_refund','resolved_release','resolved_split'].includes(dispute.status);
                const pct = splitPercent[dispute.id] ?? '50';
                return (
                  <div key={dispute.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 font-bold block mb-0.5">{dispute.id.slice(0,16)}…</span>
                        <span className="text-sm font-bold">{dispute.orders?.services?.title ?? `Order #${dispute.order_id.slice(0,8)}`}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_STYLES[dispute.status] ?? ''}`}>
                          {dispute.status.replace(/_/g,' ')}
                        </span>
                        <span className="text-sm font-extrabold text-indigo-500">₹{Number(dispute.orders?.amount ?? 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 rounded-lg leading-relaxed">
                      <strong className="text-slate-400 block mb-1">Reason:</strong>{dispute.reason}
                    </p>

                    {!resolved && (
                      <div className="space-y-3 pt-1">
                        {/* Assign to self */}
                        {dispute.status === 'open' && (
                          <Button onClick={() => assignMutation.mutate({ disputeId: dispute.id, agentId: user.id })}
                            disabled={assignMutation.isPending} variant="outline" size="sm"
                            className="border-slate-300 dark:border-slate-700 text-xs cursor-pointer h-8">
                            {assignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                            Assign to Me
                          </Button>
                        )}

                        {/* Resolution note */}
                        <Input
                          value={resolutionNote[dispute.id] ?? ''}
                          onChange={e => setResolutionNote(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                          placeholder="Optional resolution note..."
                          className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs h-8 focus-visible:ring-indigo-600" />

                        {/* Split slider */}
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500">
                            Split — Customer <span className="text-indigo-500 font-bold">{pct}%</span> / Freelancer {100 - parseInt(pct)}%
                          </p>
                          <input type="range" min={0} max={100} value={pct}
                            onChange={e => setSplitPercent(p => ({ ...p, [dispute.id]: e.target.value }))}
                            className="w-full accent-indigo-600 cursor-pointer" />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button onClick={() => resolveMutation.mutate({ id: dispute.id, resolution: 'resolved_refund' })}
                            disabled={resolveMutation.isPending}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-8 px-3 cursor-pointer flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Full Refund
                          </Button>
                          <Button onClick={() => resolveMutation.mutate({ id: dispute.id, resolution: 'resolved_split', customerRefundPercent: parseInt(pct) })}
                            disabled={resolveMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3 cursor-pointer flex items-center gap-1">
                            Split ({pct}%)
                          </Button>
                          <Button onClick={() => resolveMutation.mutate({ id: dispute.id, resolution: 'resolved_release' })}
                            disabled={resolveMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 cursor-pointer flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Full Release
                          </Button>
                        </div>
                      </div>
                    )}

                    {resolved && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> {dispute.status.replace(/_/g,' ')}
                        {dispute.resolution_note && ` — ${dispute.resolution_note}`}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Migrations ── */}
        {activeTab === 'migrations' && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">SQL Migration Console</CardTitle>
                <CardDescription className="text-slate-500">Run migrations from <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">backend/supabase/migrations/</code></CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={fetchMigrations} variant="outline" disabled={dbLoading}
                  className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 h-9 px-3 cursor-pointer">
                  <RefreshCw className={`w-4 h-4 mr-1 ${dbLoading ? 'animate-spin' : ''}`} /> Reload
                </Button>
                <Button onClick={runAll} disabled={dbLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-3 cursor-pointer">
                  <Play className="w-4 h-4 mr-1 fill-current" /> Run All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dbError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{dbError}
                </div>
              )}
              {dbLoading && migrations.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : migrations.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No migration files found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">File</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {migrations.map(m => (
                        <tr key={m.name} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{m.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${m.executed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {m.executed ? 'Executed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!m.executed && (
                              <Button onClick={() => runSingle(m.name)} size="sm" disabled={dbLoading}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 px-3 cursor-pointer">
                                Run
                              </Button>
                            )}
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

        {/* ── Settings ── */}
        {/* H12: there is no backend endpoint to persist a global commission rate —
            commission is locked per-freelancer at onboarding time (commission_tier).
            The form used to fake a "Settings saved" toast with no API call, which
            told admins a change had taken effect when nothing happened. Until a
            real config endpoint exists, be honest about that instead. */}
        {activeTab === 'settings' && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 max-w-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Platform Configuration</CardTitle>
              <CardDescription className="text-slate-500">Global commission and transaction settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Not yet configurable platform-wide</p>
                  <p className="text-xs mt-1 text-amber-700/80 dark:text-amber-400/70">
                    Commission is set per freelancer at onboarding time and locked to their profile
                    (<code className="text-[11px]">commission_tier</code>). A global override endpoint
                    hasn't been built yet — this section will be wired up once it exists.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
