'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { ordersApi, type Order, type LedgerEntry, type OrderStatus } from '../../../lib/api.orders';
import { reviewsApi, type Review } from '../../../lib/api.reviews';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  ArrowLeft, Clock, CheckCircle2, Banknote, ShieldCheck,
  AlertTriangle, XCircle, Loader2, ArrowRightLeft, Package,
  RefreshCw, ChevronDown, ChevronUp, Star,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  description: string;
}> = {
  pending_payment: {
    label: 'Pending Payment',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    icon: <Clock className="w-4 h-4" />,
    description: 'Waiting for payment to be confirmed.',
  },
  payment_captured: {
    label: 'In Progress',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    icon: <Package className="w-4 h-4" />,
    description: 'Funds secured in escrow. Freelancer is working on your order.',
  },
  service_delivered: {
    label: 'Delivered',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: 'Freelancer has marked this order as delivered. Please review and approve.',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: 'Order complete. Escrow released to the freelancer.',
  },
  payout_released: {
    label: 'Paid Out',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <Banknote className="w-4 h-4" />,
    description: 'Funds have been released to the freelancer.',
  },
  disputed: {
    label: 'In Dispute',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/20',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'This order is under mediation. Funds are frozen until resolved.',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    icon: <XCircle className="w-4 h-4" />,
    description: 'Funds have been returned to your wallet.',
  },
};

const TIMELINE: OrderStatus[] = [
  'pending_payment',
  'payment_captured',
  'service_delivered',
  'payout_released',
];

// ─── Ledger entry labels ──────────────────────────────────────────────────────

const LEDGER_LABELS: Record<string, { label: string; colorClass: string }> = {
  customer_deposit: { label: 'Wallet Deposit', colorClass: 'text-emerald-500' },
  escrow_lock: { label: 'Escrow Locked', colorClass: 'text-indigo-500' },
  escrow_release: { label: 'Escrow Released', colorClass: 'text-emerald-500' },
  escrow_refund: { label: 'Refund to Customer', colorClass: 'text-amber-500' },
  platform_commission: { label: 'Platform Fee', colorClass: 'text-slate-400' },
};

// ─── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="cursor-pointer p-0.5 transition-transform hover:scale-110">
          <Star className={`w-6 h-6 transition-colors ${
            n <= (hovered || value)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300 dark:text-slate-700'
          }`} />
        </button>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id && !!user,
    staleTime: 15_000,
  });

  const confirmMutation = useMutation({
    mutationFn: () => ordersApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Delivery confirmed! Escrow released to freelancer.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Could not confirm delivery.'),
  });

  const deliverMutation = useMutation({
    mutationFn: () => ordersApi.markDelivered(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order marked as delivered!');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Could not mark as delivered.'),
  });

  const disputeMutation = useMutation({
    mutationFn: () => ordersApi.dispute(id, disputeReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowDispute(false);
      setDisputeReason('');
      toast.success('Dispute filed. A support agent will review your case.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to file dispute.'),
  });

  const { data: existingReview } = useQuery({
    queryKey: ['review-order', id],
    queryFn: () => reviewsApi.forOrder(id),
    enabled: !!user && !!order && ['payout_released', 'completed'].includes(order?.status ?? ''),
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewsApi.create(id, reviewRating, reviewComment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-order', id] });
      toast.success('Review submitted! Thank you for your feedback.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to submit review.'),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <p className="text-slate-500 text-sm">Please log in to view this order.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-950">
        <p className="text-rose-500 text-sm">Order not found or you don't have access.</p>
        <Button variant="outline" onClick={() => router.back()}
          className="border-slate-300 dark:border-slate-700 text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
  const isCustomer = user.id === order.customer_id;
  const isFreelancer = user.id === order.freelancer_id;
  const ledger: LedgerEntry[] = (order as any).ledgerEntries ?? [];

  // Timeline step index
  const timelineIndex = TIMELINE.indexOf(order.status);
  const effectiveTimelineIndex = order.status === 'completed' ? 3 : timelineIndex;

  const commission = Number(order.amount) * (Number(order.commission_rate) / 100);
  const freelancerNet = Number(order.amount) - commission;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {order.services?.title ?? 'Order Details'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Order #{order.id.slice(0, 8).toUpperCase()} &nbsp;·&nbsp;
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
              {order.services?.category && <> &nbsp;·&nbsp; {order.services.category}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 hover:border-indigo-400 transition-colors cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>

        {/* Status description */}
        <div className={`rounded-xl border p-4 text-sm ${cfg.bg} ${cfg.color}`}>
          {cfg.description}
        </div>

        {/* Timeline */}
        {order.status !== 'disputed' && order.status !== 'refunded' && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-0">
                {TIMELINE.map((step, i) => {
                  const stepCfg = STATUS_CONFIG[step];
                  const done = effectiveTimelineIndex >= i;
                  const current = effectiveTimelineIndex === i;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                          done
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 text-slate-400'
                        } ${current ? 'ring-4 ring-indigo-500/20' : ''}`}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        <span className={`text-[9px] font-bold text-center leading-tight ${done ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                          {stepCfg.label.toUpperCase()}
                        </span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className={`h-0.5 flex-1 -mt-5 transition-colors ${
                          effectiveTimelineIndex > i ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amount summary */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Order Total</span>
              <span className="font-bold">₹{Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Platform Commission ({order.commission_rate}%)</span>
              <span className="text-slate-500">−₹{commission.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-700 dark:text-slate-300">Freelancer Receives</span>
              <span className="text-emerald-600 dark:text-emerald-400">₹{freelancerNet.toFixed(2)}</span>
            </div>
            {order.razorpay_payment_id && (
              <p className="text-[10px] text-slate-400 pt-1">
                Razorpay Payment: <span className="font-mono">{order.razorpay_payment_id}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Customer: approve delivery */}
          {isCustomer && order.status === 'service_delivered' && (
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-10 px-5 cursor-pointer flex items-center gap-2"
            >
              {confirmMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ShieldCheck className="w-4 h-4" />}
              Approve & Release Escrow
            </Button>
          )}

          {/* Freelancer: mark delivered */}
          {isFreelancer && order.status === 'payment_captured' && (
            <Button
              onClick={() => deliverMutation.mutate()}
              disabled={deliverMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm h-10 px-5 cursor-pointer flex items-center gap-2"
            >
              {deliverMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Package className="w-4 h-4" />}
              Mark as Delivered
            </Button>
          )}

          {/* Customer: dispute */}
          {isCustomer && ['payment_captured', 'service_delivered'].includes(order.status) && (
            <Button
              onClick={() => setShowDispute(!showDispute)}
              variant="outline"
              className="border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-sm h-10 px-5 cursor-pointer flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {showDispute ? 'Cancel' : 'File Dispute'}
            </Button>
          )}
        </div>

        {/* Dispute form */}
        {showDispute && (
          <Card className="border-rose-500/20 bg-rose-50 dark:bg-rose-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> File a Dispute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => { e.preventDefault(); if (disputeReason.trim()) disputeMutation.mutate(); }}
                className="space-y-4"
              >
                <textarea
                  placeholder="Explain the issue in detail. A support agent will review your case and the freelancer's response before making a decision."
                  rows={4}
                  required
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
                <Button
                  type="submit"
                  disabled={disputeMutation.isPending || !disputeReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-sm h-9 px-4 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {disputeMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <AlertTriangle className="w-4 h-4" />}
                  Submit Dispute
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Ledger entries */}
        {ledger.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="pb-3">
              <button
                onClick={() => setShowLedger(!showLedger)}
                className="flex items-center justify-between w-full cursor-pointer"
              >
                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                  Escrow Ledger
                  <span className="text-[10px] font-normal text-slate-400">({ledger.length} entries)</span>
                </CardTitle>
                {showLedger
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
            </CardHeader>
            {showLedger && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {ledger.map((entry) => {
                    const meta = LEDGER_LABELS[entry.entry_type] ?? {
                      label: entry.entry_type.replace(/_/g, ' '),
                      colorClass: 'text-slate-400',
                    };
                    return (
                      <div key={entry.id}
                        className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                        <div className="space-y-0.5">
                          <p className={`text-xs font-bold ${meta.colorClass}`}>{meta.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {entry.debit_account} → {entry.credit_account}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(entry.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span className={`text-sm font-extrabold shrink-0 ${meta.colorClass}`}>
                          ₹{Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Review section — visible only when order is complete and user is customer */}
        {isCustomer && ['payout_released', 'completed'].includes(order.status) && (
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Leave a Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingReview ? (
                <div className="space-y-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    ))}
                  </div>
                  {existingReview.comment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{existingReview.comment}"</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Reviewed on {new Date(existingReview.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); reviewMutation.mutate(); }} className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-500">Your rating</p>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-500">Comment (optional)</p>
                    <textarea
                      rows={3}
                      placeholder="How was your experience with this freelancer?"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <Button type="submit" disabled={reviewMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-400 text-white text-sm h-9 px-4 cursor-pointer flex items-center gap-2 disabled:opacity-50">
                    {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                    Submit Review
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
