'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { 
  ShieldAlert, MessageSquare, ArrowLeftRight, CheckSquare, 
  Send, Loader2, UserCheck, AlertCircle 
} from 'lucide-react';

interface DisputeCase {
  id: string;
  serviceTitle: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  reason: string;
  date: string;
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
}

interface ChatMessage {
  id: string;
  sender: 'client' | 'freelancer' | 'support';
  senderName: string;
  text: string;
  timestamp: string;
}

export default function SupportDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if user is not support or admin
  useEffect(() => {
    if (user && user.role !== 'support' && user.role !== 'admin') {
      router.push('/');
    }
  }, [user]);

  // Mocked dispute cases assigned to this support agent
  const [cases, setCases] = useState<DisputeCase[]>([
    {
      id: 'disp_101',
      serviceTitle: 'SEO Content Campaign Audit',
      clientName: 'Rohan Sharma',
      freelancerName: 'Priya Patel',
      amount: 3200,
      reason: 'The seller did not optimize for local keywords as written in our agreement terms.',
      date: '2026-07-04',
      status: 'OPEN',
    }
  ]);

  const [activeCase, setActiveCase] = useState<DisputeCase | null>(cases[0]);
  
  // Chat messaging states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'client',
      senderName: 'Rohan Sharma (Client)',
      text: 'I specifically requested local SEO audit, but Priya sent a generic audit report instead.',
      timestamp: '11:20 AM',
    },
    {
      id: 'm2',
      sender: 'freelancer',
      senderName: 'Priya Patel (Freelancer)',
      text: 'The audit includes a comprehensive keyword analysis covering all regional metrics. The client is making excuses.',
      timestamp: '11:24 AM',
    }
  ]);

  const [replyText, setReplyText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: 'support',
      senderName: `${user.name} (Support Agent)`,
      text: replyText,
      timestamp: 'Just Now',
    };

    setMessages([...messages, newMsg]);
    setReplyText('');
  };

  const handleEscalate = (caseId: string) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'ESCALATED' } : c));
    if (activeCase && activeCase.id === caseId) {
      setActiveCase({ ...activeCase, status: 'ESCALATED' });
    }
    alert('This dispute case has been successfully escalated to the admin review queue.');
  };

  const handleResolve = (caseId: string) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'RESOLVED' } : c));
    if (activeCase && activeCase.id === caseId) {
      setActiveCase({ ...activeCase, status: 'RESOLVED' });
    }
    alert('Ticket marked as resolved successfully.');
  };

  if (!user || (user.role !== 'support' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center">
        <Card className="border-red-500/20 bg-red-950/5 max-w-md w-full backdrop-blur p-6">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-4">You do not have the credentials required to access the support dashboard console.</p>
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
              <UserCheck className="w-6 h-6 text-indigo-500" /> Support Desk Portal
            </h1>
            <p className="text-xs text-slate-500">Mediate active customer disputes and audit project contracts</p>
          </div>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer h-10 px-4 self-start"
          >
            Go Home
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Dispute Case Queue (Left Col) */}
          <div className="space-y-6">
            <Card className="border-slate-850 bg-slate-900/40 backdrop-blur h-full">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold">Assigned Tickets</CardTitle>
                <CardDescription className="text-slate-400">Open dispute cases awaiting mediation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCase(c)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer block ${
                      activeCase?.id === c.id 
                        ? 'bg-indigo-600/10 border-indigo-500' 
                        : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">{c.id}</span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        c.status === 'RESOLVED' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : c.status === 'ESCALATED'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block mb-1 truncate">{c.serviceTitle}</span>
                    <span className="text-[10px] text-slate-500 block">Requested: {c.date}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Active Case Mediation Workspace (Right 2 cols) */}
          <div className="lg:col-span-2">
            {activeCase ? (
              <div className="space-y-6">
                
                {/* Details Card */}
                <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-900">
                    <div>
                      <CardTitle className="text-white text-lg font-bold">Workspace: {activeCase.id}</CardTitle>
                      <CardDescription className="text-slate-400">Escrow Value: <strong>₹{activeCase.amount}</strong></CardDescription>
                    </div>
                    
                    <div className="flex gap-2">
                      {activeCase.status === 'OPEN' && (
                        <>
                          <Button 
                            onClick={() => handleEscalate(activeCase.id)}
                            variant="outline"
                            className="border-slate-800 text-rose-400 hover:bg-slate-900 text-xs h-8 px-3 cursor-pointer"
                          >
                            Escalate
                          </Button>
                          <Button 
                            onClick={() => handleResolve(activeCase.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 cursor-pointer"
                          >
                            Resolve Ticket
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-xs grid grid-cols-2 gap-2 border-b border-slate-900 pb-3 text-slate-400">
                      <span>Client Account: <strong className="text-slate-300">{activeCase.clientName}</strong></span>
                      <span>Freelancer Account: <strong className="text-slate-300">{activeCase.freelancerName}</strong></span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-xs leading-relaxed text-slate-300">
                      <strong className="text-slate-400 block mb-1">Contract Dispute Filing Description:</strong>
                      {activeCase.reason}
                    </div>
                  </CardContent>
                </Card>

                {/* Mediation Chat Room */}
                <Card className="border-slate-850 bg-slate-900/40 backdrop-blur">
                  <CardHeader className="pb-3 border-b border-slate-900">
                    <CardTitle className="text-white text-sm font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-400" /> Active Mediation Chat Room
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    
                    {/* Chat Messages Log */}
                    <div className="h-64 overflow-y-auto border border-slate-850 bg-slate-950/60 rounded-xl p-4 space-y-3">
                      {messages.map((m) => (
                        <div 
                          key={m.id} 
                          className={`flex flex-col max-w-[80%] rounded-xl p-3 text-xs ${
                            m.sender === 'support' 
                              ? 'bg-indigo-600 text-white ml-auto' 
                              : m.sender === 'client'
                              ? 'bg-slate-905 border border-slate-800 text-slate-200'
                              : 'bg-slate-900/90 border border-slate-800/60 text-slate-200'
                          }`}
                        >
                          <span className={`font-bold block mb-1 text-[10px] ${
                            m.sender === 'support' ? 'text-indigo-200' : 'text-slate-400'
                          }`}>
                            {m.senderName}
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                          <span className="text-[8px] text-slate-500 mt-1 block text-right">{m.timestamp}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chat Inputs */}
                    {activeCase.status === 'OPEN' ? (
                      <form onSubmit={handleSendMessage} className="flex gap-3">
                        <Input
                          placeholder="Type mediation instructions or message to parties..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 bg-slate-950 border-slate-850 focus-visible:ring-indigo-600 text-white placeholder:text-slate-600 h-10 text-xs"
                        />
                        <Button 
                          type="submit" 
                          disabled={!replyText.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-4 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center py-4 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-500">
                        This mediation chat room is closed because the ticket is marked as {activeCase.status}.
                      </div>
                    )}

                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl py-16">
                <span className="text-slate-500 text-sm">Select an assigned ticket case to start mediation.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
