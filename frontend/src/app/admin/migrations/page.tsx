'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Database, Play, CheckCircle2, XCircle, ArrowLeft, Loader2, Code2, AlertTriangle } from 'lucide-react';

interface Migration {
  name: string;
  sql: string;
  executed: boolean;
}

export default function AdminMigrations() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [runningSingle, setRunningSingle] = useState<Record<string, boolean>>({});
  const [migrationErrors, setMigrationErrors] = useState<Record<string, string>>({});
  const [migrationSuccesses, setMigrationSuccesses] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchMigrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/admin/migrations');
      setMigrations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to database or read migrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
  }, []);

  const handleRunAllMigrations = async () => {
    setRunningAll(true);
    setError(null);
    setMigrationErrors({});
    setMigrationSuccesses({});
    try {
      const response = await api.post('/api/v1/admin/migrations/run');
      const results = response.data.results || [];
      
      const newErrors: Record<string, string> = {};
      const newSuccesses: Record<string, boolean> = {};
      
      results.forEach((r: any) => {
        if (r.status === 'FAILED') {
          newErrors[r.name] = r.error || 'Execution failed';
        } else if (r.status === 'SUCCESS') {
          newSuccesses[r.name] = true;
        }
      });

      setMigrationErrors(newErrors);
      setMigrationSuccesses(newSuccesses);
      fetchMigrations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while running migrations.');
      if (err.response?.data?.results) {
        const newErrors: Record<string, string> = {};
        err.response.data.results.forEach((r: any) => {
          if (r.status === 'FAILED') {
            newErrors[r.name] = r.error || 'Execution failed';
          }
        });
        setMigrationErrors(newErrors);
      }
    } finally {
      setRunningAll(false);
    }
  };

  const handleRunSingleMigration = async (name: string) => {
    setRunningSingle(prev => ({ ...prev, [name]: true }));
    setMigrationErrors(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    setMigrationSuccesses(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });

    try {
      await api.post('/api/v1/admin/migrations/run-single', { name });
      setMigrationSuccesses(prev => ({ ...prev, [name]: true }));
      fetchMigrations();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Execution failed';
      setMigrationErrors(prev => ({ ...prev, [name]: errMsg }));
    } finally {
      setRunningSingle(prev => ({ ...prev, [name]: false }));
    }
  };

  const pendingCount = migrations.filter(m => !m.executed).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-500" /> Database Console
              </h1>
              <p className="text-xs text-slate-500">Run individual SQL migrations or trigger all at once.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchMigrations}
              variant="outline"
              disabled={loading || runningAll}
              className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
            >
              Refresh
            </Button>
            <Button
              onClick={handleRunAllMigrations}
              disabled={runningAll || loading || pendingCount === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-2"
            >
              {runningAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running All...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run All Pending ({pendingCount})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Global Connection Error Banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <div>
              <span className="font-semibold block mb-1">Database Connection Offline</span>
              <p className="text-xs text-slate-400">{error}</p>
              <p className="text-xs text-indigo-400 mt-2">
                Tip: Verify that you have added your <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">DATABASE_URL</code> environment variable on Render and that it is not commented out.
              </p>
            </div>
          </div>
        )}

        {/* List of Migration Files */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-500" /> Tracked Migration Files
          </h2>
          
          {loading && migrations.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : migrations.length === 0 && !error ? (
            <p className="text-slate-500 text-sm">No SQL scripts found in backend/supabase/migrations/.</p>
          ) : (
            <div className="grid gap-6">
              {migrations.map((mig) => {
                const isRunning = runningSingle[mig.name];
                const executionError = migrationErrors[mig.name];
                const executionSuccess = migrationSuccesses[mig.name];
                
                return (
                  <div 
                    key={mig.name} 
                    className={`bg-slate-900/40 border rounded-2xl overflow-hidden transition-all duration-300 ${
                      executionError 
                        ? 'border-red-500/30 shadow-lg shadow-red-950/10' 
                        : executionSuccess || mig.executed
                        ? 'border-emerald-500/20 bg-emerald-950/5'
                        : 'border-slate-850'
                    }`}
                  >
                    {/* Header of migration card */}
                    <div className="bg-slate-900/80 border-b border-slate-850 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-mono text-sm text-slate-200 font-semibold block">{mig.name}</span>
                        <span className="text-xs text-slate-500 block">SQL Script</span>
                      </div>
                      
                      {/* State Tags and Run Buttons */}
                      <div className="flex items-center gap-3 self-start sm:self-center">
                        {mig.executed || executionSuccess ? (
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            Executed
                          </span>
                        ) : (
                          <>
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                              Pending
                            </span>
                            <Button
                              onClick={() => handleRunSingleMigration(mig.name)}
                              disabled={isRunning || runningAll}
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer shadow px-3 py-1.5 h-auto flex items-center gap-1"
                            >
                              {isRunning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                              Run
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SQL Body */}
                    <div className="p-5 bg-slate-950/60">
                      <pre className="text-xs text-indigo-300/80 font-mono overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {mig.sql}
                      </pre>
                    </div>

                    {/* Embedded Error Log Panel */}
                    {executionError && (
                      <div className="border-t border-red-500/20 bg-red-950/10 p-5 space-y-2">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                          <XCircle className="w-4 h-4 text-red-500" /> Migration Execution Failed
                        </div>
                        <pre className="text-xs font-mono text-red-300 bg-red-950/30 border border-red-500/10 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                          {executionError}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
