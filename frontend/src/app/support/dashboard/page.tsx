'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { disputesApi, type Dispute } from '../../../lib/api.disputes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  ShieldAlert, CheckSquare, Loader2, UserCheck,
  AlertCircle, RefreshCw, ArrowUpRight, FileX
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-500',
  under_review: 'bg-indigo-500/10 text-indigo-400',
  escalated: 'bg-rose-500/10 text-rose-400',
  resolved_refund: 'bg-emerald-500/10 text-emerald-400',
  resolved_release: 'bg-emerald-500/10 text-emerald-400',
  resolved_split: 'bg-emerald-500/10 text-emerald-400',
};

const isResolved = (status: string) =>
  ['resolved_refund', 'resolved_release', 'resolved_split'].includes(status);

export default function SupportDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeCase, setActiveCase] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [splitPercent, setSplitPercent] = useState('50');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Redirect non-support users
  useEffect(() => {
    if (user && user.role !== 'support' && user.role !== 'admin') router.push('/');
  }, [user, router]);

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const { data: disputes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['disputes', statusFilter],
    queryFn: () => disputesApi.list(statusFilter || undefined),
    enabled: !!user && (user.role === 'support' || user.role === 'admin'),
    refetchInterval: 30_000, // poll every 30s
  });

  // Keep activeCase in sync if the list updates
  useEffect(() => {
    if (activeCase) {
      const updated = disputes.find(d => d.id === activeCase.id);
      if (updated) setActiveCase(updated);
    } else if (disputes.length > 0) {
      setActiveCase(disputes[0]);
    }
  }, [disputes]);

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const resolveMutation = useMutation({
    mutationFn: (payload: {
      resolution: 'resolved_refund' | 'resolved_release' | 'resolved_split';
      customerRefundPercent?: number;
    }) =>
      disputesApi.resolve(activeCase!.id, {
        ...payload,
        resolutionNote: resolutionNote.trim() || undefined,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setResolutionNote('');
      const label =
        vars.resolution === 'resolved_refund' ? 'Full refund issued to customer.'
        : vars.resolution === 'resolved_release' ? 'Escrow released to freelancer.'
        : `Split: ${vars.customerRefundPercent}% refund, rest to freelancer.`;
      toast.success(`Dispute resolved. ${label}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to resolve dispute.'),
  });

  const escalateMutation = useMutation({
    mutationFn: () => disputesApi.escalate(activeCase!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.info('Dispute escalated to admin review queue.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to escalate.'),
  });

  // Admin-only: assign to self (quick assign)
  const assignMutation = useMutation({
    mutationFn: (disputeId: string) =>
      disputesApi.assign(disputeId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute assigned to you and moved to under review.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to assign dispute.'),
  });

  if (!user || (user.role !== 'support' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 px-6 text-center">
        <Card className="border-rose-500/20 bg-rose-50 dark:bg-red-950/5 max-w-md w-full p-6">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-4">You do not have permission to access the support portal.</p>
          <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full">Return Home</Button>
        </Card>
      </div>
    );
  }

  const openCount = disputes.filter(d => d.status === 'open').length;
  const underReviewCount = disputes.filter(d => d.status === 'under_review').length;
  const resolvedCount = disputes.filter(d => isResolved(d.status)).length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-500" /> Support Desk Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">Mediate disputes and manage escrow resolutions</p>
          </div>
          <Button onClick={() => refetch()} variant="outline"
            className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer h-10 px-4 self-start flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open', value: openCount, color: 'text-amber-500' },
            { label: 'Under Review', value: underReviewCount, color: 'text-indigo-400' },
            { label: 'Resolved', value: resolvedCount, color: 'text-emerald-500' },
          ].map(s => (
            <Card key={s.label} className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-extrabold ${s.color}`}>{isLoading ? '—' : s.value}</div>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'open', 'under_review', 'escalated', 'resolved_refund', 'resolved_release'].map(f => (
            <button key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                statusFilter === f
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500'
              }`}>
              {f === '' ? 'All' : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Main workspace */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Case Queue */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Assigned Tickets</h2>

            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading cases...
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-rose-500 text-sm py-4">
                <AlertCircle className="w-4 h-4" /> Failed to load disputes.
              </div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <FileX className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No dispute cases found.
              </div>
            ) : (
              disputes.map(c => (
                <button key={c.id} onClick={() => setActiveCase(c)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer block ${
                    activeCase?.id === c.id
                      ? 'bg-indigo-600/10 border-indigo-500'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-indigo-400/50'
                  }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase truncate">{c.id.slice(0, 12)}…</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_STYLES[c.status] ?? 'bg-slate-500/10 text-slate-400'}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate mb-1">
                    {c.orders?.services?.title ?? `Order #${c.order_id.slice(0, 8)}`}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ₹{Number(c.orders?.amount ?? 0).toLocaleString()} · {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Workspace */}
          <div className="lg:col-span-2">
            {!activeCase ? (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl py-20">
                <span className="text-slate-400 text-sm">Select a ticket to start mediation.</span>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Case Details */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                  <CardHeader className="flex flex-row items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
                    <div>
                      <CardTitle className="text-base font-bold">
                        {activeCase.orders?.services?.title ?? `Order #${activeCase.order_id.slice(0, 8)}`}
                      </CardTitle>
                      <CardDescription className="text-slate-500 mt-0.5">
                        Escrow: <strong className="text-slate-700 dark:text-slate-300">₹{Number(activeCase.orders?.amount ?? 0).toLocaleString()}</strong>
                        {' · '}Filed by: <strong className="text-slate-700 dark:text-slate-300">{activeCase.users?.name ?? 'Customer'}</strong>
                      </CardDescription>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded shrink-0 ${STATUS_STYLES[activeCase.status] ?? ''}`}>
                      {activeCase.status.replace(/_/g, ' ')}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">

                    {/* Dispute reason */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-500 dark:text-slate-400 block mb-1">Dispute Reason:</strong>
                      {activeCase.reason}
                    </div>

                    {/* Evidence files */}
                    {activeCase.evidence_urls?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evidence Files</p>
                        <div className="flex flex-wrap gap-2">
                          {activeCase.evidence_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-indigo-500 hover:underline flex items-center gap-1 border border-indigo-200 dark:border-indigo-900 rounded px-2 py-1">
                              <ArrowUpRight className="w-3 h-3" /> File {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin assign button */}
                    {user.role === 'admin' && activeCase.status === 'open' && (
                      <Button onClick={() => assignMutation.mutate(activeCase.id)}
                        disabled={assignMutation.isPending} variant="outline"
                        className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs h-8 cursor-pointer">
                        {assignMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Assign to Me
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Resolution Panel */}
                {!isResolved(activeCase.status) && activeCase.status !== 'escalated' ? (
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-indigo-400" /> Resolve Dispute
                      </CardTitle>
                      <CardDescription className="text-slate-500 text-xs">
                        Choose a resolution. This writes permanent ledger entries and cannot be undone.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">

                      {/* Resolution note */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 font-medium">Internal Resolution Note (optional)</label>
                        <Input value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                          placeholder="Summarize your mediation decision..."
                          className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-sm focus-visible:ring-indigo-600" />
                      </div>

                      {/* Split percentage */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 font-medium">
                          Split — Customer Refund % <span className="text-indigo-400 font-bold">{splitPercent}%</span>
                          <span className="text-slate-400"> / Freelancer {100 - parseInt(splitPercent || '50')}%</span>
                        </label>
                        <input type="range" min={0} max={100} value={splitPercent}
                          onChange={e => setSplitPercent(e.target.value)}
                          className="w-full accent-indigo-600 cursor-pointer" />
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <Button onClick={() => resolveMutation.mutate({ resolution: 'resolved_refund' })}
                          disabled={resolveMutation.isPending}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-9 cursor-pointer flex items-center justify-center gap-1">
                          {resolveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Full Refund
                        </Button>
                        <Button onClick={() => resolveMutation.mutate({
                          resolution: 'resolved_split',
                          customerRefundPercent: parseInt(splitPercent),
                        })}
                          disabled={resolveMutation.isPending}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 cursor-pointer flex items-center justify-center gap-1">
                          {resolveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Split ({splitPercent}%)
                        </Button>
                        <Button onClick={() => resolveMutation.mutate({ resolution: 'resolved_release' })}
                          disabled={resolveMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 cursor-pointer flex items-center justify-center gap-1">
                          {resolveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Full Release
                        </Button>
                      </div>

                      {/* Escalate */}
                      {user.role === 'support' && (
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Button variant="outline" onClick={() => escalateMutation.mutate()}
                            disabled={escalateMutation.isPending}
                            className="w-full border-slate-300 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs h-8 cursor-pointer">
                            {escalateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                            Escalate to Admin
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/10">
                    <CardContent className="pt-5 pb-4 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
                      <CheckSquare className="w-5 h-5 shrink-0" />
                      <span>
                        {activeCase.status === 'escalated'
                          ? 'This dispute has been escalated to admin review.'
                          : `Resolved: ${activeCase.status.replace(/_/g, ' ')}.`}
                        {activeCase.resolution_note && (
                          <span className="block text-xs text-slate-500 mt-1">{activeCase.resolution_note}</span>
                        )}
                      </span>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
