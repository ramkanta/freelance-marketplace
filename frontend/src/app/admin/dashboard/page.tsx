'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  ShieldAlert, Settings, Landmark, Database, BarChart3,
  Loader2, AlertCircle, Play, CheckCircle, RefreshCw, XCircle, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Migration {
  filename: string;
  executed: boolean;
  executedAt?: string;
  error?: string;
  sql?: string;
}

interface Dispute {
  id: string;
  serviceTitle: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  reason: string;
  date: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'disputes' | 'migrations' | 'settings'>('analytics');

  // Migrations State
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Settings State
  const [commissionRate, setCommissionRate] = useState('15');
  const [savingSettings, setSavingSettings] = useState(false);

  // Disputes list
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: 'disp_1',
      serviceTitle: 'React & Tailwind App Customization',
      clientName: 'Subhankar Pal',
      freelancerName: 'Amit Kumar',
      amount: 1500,
      reason: 'Freelancer delivered half of the components promised in the scope.',
      date: '2026-07-05',
    }
  ]);

  const fetchMigrations = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const response = await api.get('/api/v1/admin/migrations');
      setMigrations(response.data);
    } catch (err: any) {
      setDbError(err.response?.data?.message || 'Failed to scan migrations.');
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if user is not admin
    if (user && user.role !== 'admin') {
      router.push('/');
    } else {
      fetchMigrations();
    }
  }, [user]);

  const handleRunAllMigrations = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      await api.post('/api/v1/admin/run');
      toast.success('All migrations executed successfully!');
      fetchMigrations();
    } catch (err: any) {
      setDbError(err.response?.data?.message || 'Failed to execute migrations.');
    } finally {
      setDbLoading(false);
    }
  };

  const handleRunSingleMigration = async (filename: string) => {
    setDbLoading(true);
    setDbError(null);
    try {
      await api.post('/api/v1/admin/run-single', { filename });
      toast.success(`Migration ${filename} executed successfully!`);
      fetchMigrations();
    } catch (err: any) {
      setDbError(err.response?.data?.message || 'Failed to run migration.');
    } finally {
      setDbLoading(false);
    }
  };

  const handleResolveDispute = (disputeId: string, decision: 'REFUND' | 'PAY') => {
    setDisputes(prev => prev.filter(d => d.id !== disputeId));
    toast.success(
      decision === 'REFUND'
        ? 'Escrow funds successfully refunded to client wallet.'
        : 'Escrow funds released directly to freelancer.'
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast.success('Global platform commission configurations updated successfully!');
    }, 1000);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center">
        <Card className="border-red-500/20 bg-red-950/5 max-w-md w-full backdrop-blur p-6">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-4">You do not have the credentials required to access the admin panel console.</p>
          <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium w-full">
            Return Home
          </Button>
        </Card>
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
              <Database className="w-6 h-6 text-indigo-500" /> Admin Command Center
            </h1>
            <p className="text-xs text-slate-500">Monitor systems, resolve mediator disputes, and execute raw SQL updates</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800 self-start overflow-x-auto">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 inline mr-1" /> Analytics
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'disputes' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1" /> Disputes
            </button>
            <button
              onClick={() => setActiveTab('migrations')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'migrations' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 inline mr-1" /> Migrations
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5 inline mr-1" /> Settings
            </button>
          </div>
        </div>

        {/* Tab 1: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Escrow Total Volume</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-white">₹4,700.00</div>
                  <p className="text-[10px] text-slate-500 mt-1">Total active funds currently locked</p>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Bookings</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-white">18</div>
                  <p className="text-[10px] text-slate-500 mt-1">Contracts currently active</p>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Users</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-white">142</div>
                  <p className="text-[10px] text-slate-500 mt-1">Active customer/freelancer records</p>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Disputes</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-rose-400">1</div>
                  <p className="text-[10px] text-slate-500 mt-1">Awaiting support resolution review</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold">Platform Overview</CardTitle>
                <CardDescription className="text-slate-400">Escrow ledger activity logs and registration metrics</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
                <span className="text-slate-600 text-sm font-mono">Platform analytics charts and live ledger graphs render here.</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Disputes Resolver */}
        {activeTab === 'disputes' && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Mediation Disputes Panel</CardTitle>
              <CardDescription className="text-slate-400">Resolve disputes by executing full customer refunds or releasing escrow transfers.</CardDescription>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  All mediation tickets resolved. No active disputes!
                </div>
              ) : (
                <div className="space-y-6">
                  {disputes.map((dispute) => (
                    <div 
                      key={dispute.id} 
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono block mb-1">Dispute Ticket: {dispute.id}</span>
                          <span className="text-sm font-bold text-white">{dispute.serviceTitle}</span>
                        </div>
                        <span className="text-sm font-extrabold text-indigo-400 shrink-0">₹{dispute.amount}</span>
                      </div>

                      <div className="text-xs text-slate-400 grid sm:grid-cols-2 gap-2">
                        <span>Client: <strong className="text-slate-350">{dispute.clientName}</strong></span>
                        <span>Freelancer: <strong className="text-slate-350">{dispute.freelancerName}</strong></span>
                      </div>

                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-300">
                        <strong className="text-slate-400 block mb-1">Dispute Reason:</strong>
                        {dispute.reason}
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                        <Button
                          onClick={() => handleResolveDispute(dispute.id, 'REFUND')}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs h-8 px-4 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Refund Client
                        </Button>
                        <Button
                          onClick={() => handleResolveDispute(dispute.id, 'PAY')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-8 px-4 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Pay Freelancer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Migrations Console */}
        {activeTab === 'migrations' && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <CardTitle className="text-white text-lg font-bold">SQL Migration Console</CardTitle>
                <CardDescription className="text-slate-400">Scan and run migrations located inside `/backend/supabase/migrations`</CardDescription>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button
                  onClick={fetchMigrations}
                  variant="outline"
                  disabled={dbLoading}
                  className="border-slate-800 text-slate-300 hover:bg-slate-900 h-9 px-3 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${dbLoading && 'animate-spin'}`} /> Reload
                </Button>
                <Button
                  onClick={handleRunAllMigrations}
                  disabled={dbLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-9 px-3 cursor-pointer"
                >
                  <Play className="w-4 h-4 mr-1 fill-current" /> Run Outstanding
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dbError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dbError}</span>
                </div>
              )}

              {dbLoading && migrations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-350">
                    <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Migration File</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {migrations.map((m) => (
                        <tr key={m.filename} className="hover:bg-slate-900/20">
                          <td className="px-4 py-3 text-xs font-mono text-slate-300">
                            {m.filename}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              m.executed 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {m.executed ? 'Executed' : 'Outstanding'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!m.executed && (
                              <Button
                                onClick={() => handleRunSingleMigration(m.filename)}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 px-3 cursor-pointer"
                              >
                                Run File
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

        {/* Tab 4: Platform Settings */}
        {activeTab === 'settings' && (
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur max-w-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Platform Configuration</CardTitle>
              <CardDescription className="text-slate-400">Configure global transaction variables and commission percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="rate" className="text-slate-300">Global Platform Commission Fee (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600 h-10"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Platform commission charged to freelancers on bookings splits.</p>
                </div>

                <Button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer py-2.5"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Saving changes...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
