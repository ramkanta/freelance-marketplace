'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Database, Play, CheckCircle2, XCircle, ArrowLeft, Loader2, Code2 } from 'lucide-react';

interface Migration {
  name: string;
  sql: string;
}

interface MigrationResult {
  name: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  detail?: string;
  error?: string;
}

export default function AdminMigrations() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MigrationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMigrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/admin/migrations');
      setMigrations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load migrations list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
  }, []);

  const handleRunMigrations = async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const response = await api.post('/api/v1/admin/migrations/run');
      setResults(response.data.results);
      // Refresh list to update database schema cash
      fetchMigrations();
    } catch (err: any) {
      if (err.response?.data?.results) {
        setResults(err.response.data.results);
      }
      setError(err.response?.data?.message || 'Failed to execute migrations.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
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
              <p className="text-xs text-slate-500">Manual migration manager & SQL query runner</p>
            </div>
          </div>

          <Button
            onClick={handleRunMigrations}
            disabled={running || loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Migrations
              </>
            )}
          </Button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <XCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* Execution Results */}
        {results && (
          <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Execution Results
              </CardTitle>
              <CardDescription className="text-slate-400">
                Log reports for executed migration files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((res, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start justify-between p-3.5 rounded-lg border text-sm ${
                    res.status === 'SUCCESS' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : res.status === 'SKIPPED'
                      ? 'bg-slate-800/30 border-slate-800/50 text-slate-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-semibold block font-mono text-xs">{res.name}</span>
                    {res.detail && <span className="text-xs text-slate-500 block">{res.detail}</span>}
                    {res.error && <span className="text-xs text-red-500 font-mono block mt-1">{res.error}</span>}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    res.status === 'SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : res.status === 'SKIPPED'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {res.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available Migration Files */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-500" /> Tracked Migration Files
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : migrations.length === 0 ? (
            <p className="text-slate-500 text-sm">No migration scripts found in the codebase.</p>
          ) : (
            <div className="grid gap-4">
              {migrations.map((mig, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/60 border border-slate-900 rounded-xl overflow-hidden"
                >
                  <div className="bg-slate-900/80 border-b border-slate-850 px-5 py-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-200 font-semibold">{mig.name}</span>
                    <span className="text-xs text-slate-500">SQL Script</span>
                  </div>
                  <div className="p-4 bg-slate-950/80">
                    <pre className="text-xs text-indigo-300 font-mono overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {mig.sql}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
