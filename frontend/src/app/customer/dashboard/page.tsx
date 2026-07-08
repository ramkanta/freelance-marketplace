'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { ordersApi, walletApi, type Order } from '../../../lib/api.orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  User, Wallet, Search, Calendar, Landmark,
  AlertTriangle, CheckCircle, ShieldAlert, ArrowUpRight, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [depositAmount, setDepositAmount] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
    enabled: !!user,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.balance,
    enabled: !!user,
  });

  const balance = walletData?.balance ?? 0;

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const depositMutation = useMutation({
    mutationFn: (amount: number) => walletApi.deposit(amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setDepositAmount('');
      toast.success(`₹${data.entry.amount} loaded into your Servify Escrow wallet!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Deposit failed. Please try again.');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.confirm(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Delivery confirmed! Escrow funds released to freelancer.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Could not confirm delivery.');
    },
  });

  const disputeMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      ordersApi.dispute(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrder(null);
      setDisputeReason('');
      toast.success('Dispute filed. A support agent will review your case.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to file dispute.');
    },
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    depositMutation.mutate(amt);
  };

  const handleFileDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !disputeReason.trim()) return;
    disputeMutation.mutate({ orderId: selectedOrder.id, reason: disputeReason });
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'payout_released' && o.status !== 'refunded');
  const disputedOrders = orders.filter(o => o.status === 'disputed');

  const statusBadge = (status: Order['status']) => {
    const map: Record<string, string> = {
      pending_payment: 'bg-yellow-500/15 text-yellow-400',
      payment_captured: 'bg-indigo-500/15 text-indigo-400',
      service_delivered: 'bg-blue-500/15 text-blue-400',
      completed: 'bg-emerald-500/15 text-emerald-400',
      payout_released: 'bg-emerald-500/15 text-emerald-400',
      disputed: 'bg-rose-500/15 text-rose-400',
      refunded: 'bg-slate-500/15 text-slate-400',
    };
    return map[status] ?? 'bg-slate-500/15 text-slate-400';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 md:p-12 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-500" /> Client Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage bookings, escrow deposits, and resolve disputes</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => queryClient.invalidateQueries()}
              variant="outline"
              className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer h-10 px-4"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => router.push('/services')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer h-10 px-4 flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Find Services
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Escrow Wallet</CardTitle>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">
                {walletLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `₹${balance.toFixed(2)}`}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pre-funded credits for bookings</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Bookings</CardTitle>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">
                {ordersLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : activeOrders.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Services in progress or awaiting delivery</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Mediation Cases</CardTitle>
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">{disputedOrders.length}</div>
              <p className="text-xs text-slate-500 mt-1">Disputed orders with frozen escrow</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Orders List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Your Bookings</CardTitle>
                <CardDescription className="text-slate-500">Track progress, approve completions, or file disputes</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" /> Loading orders...
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12 text-rose-500 text-sm">
                    Failed to load orders. Check your connection and refresh.
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No bookings yet. Browse services to hire a freelancer!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">
                              {order.services?.title ?? `Order #${order.id.slice(0, 8)}`}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${statusBadge(order.status)}`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                            <span>{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-500">₹{Number(order.amount).toFixed(2)}</span>
                            {order.services?.category && (
                              <><span>•</span><span>{order.services.category}</span></>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {order.status === 'service_delivered' && (
                            <Button
                              onClick={() => confirmMutation.mutate(order.id)}
                              disabled={confirmMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 cursor-pointer"
                            >
                              {confirmMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve & Release'}
                            </Button>
                          )}
                          {['payment_captured', 'service_delivered'].includes(order.status) && (
                            <Button
                              onClick={() => setSelectedOrder(order)}
                              variant="outline"
                              className="border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs h-8 px-3 cursor-pointer"
                            >
                              File Dispute
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dispute Form */}
            {selectedOrder && (
              <Card className="border-rose-500/20 bg-rose-50 dark:bg-rose-950/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Dispute: {selectedOrder.services?.title ?? `Order #${selectedOrder.id.slice(0, 8)}`}
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Explain the issue. A support agent will step in to mediate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {disputeMutation.isSuccess ? (
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-sm">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      Dispute filed. Support agents have been notified.
                    </div>
                  ) : (
                    <form onSubmit={handleFileDispute} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-slate-700 dark:text-slate-300">Dispute Reason</Label>
                        <textarea
                          id="reason"
                          placeholder="Describe in detail why you are disputing this order..."
                          required
                          rows={4}
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="flex w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={() => setSelectedOrder(null)}
                          className="border-slate-300 dark:border-slate-800 cursor-pointer">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={disputeMutation.isPending}
                          className="bg-rose-600 hover:bg-rose-500 text-white cursor-pointer">
                          {disputeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'File Dispute'}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Wallet */}
          <div>
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-400" /> Wallet Deposits
                </CardTitle>
                <CardDescription className="text-slate-500">Fund your escrow wallet instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="deposit" className="text-slate-700 dark:text-slate-300 text-xs">Amount (INR)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      placeholder="₹ Amount to add"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus-visible:ring-indigo-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={depositMutation.isPending || !depositAmount}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {depositMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><ArrowUpRight className="w-4 h-4" /> Fund Wallet</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
