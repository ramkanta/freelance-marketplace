'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  User, Wallet, Search, Calendar, Landmark,
  AlertTriangle, CheckCircle, ShieldAlert, History, ArrowUpRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  serviceTitle: string;
  freelancerName: string;
  price: number;
  date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'DISPUTED' | 'COMPLETED';
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Mocked Bookings list for Customer
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'book_1',
      serviceTitle: 'React & Tailwind App Customization',
      freelancerName: 'Amit Kumar',
      price: 1500,
      date: '2026-07-05',
      status: 'DELIVERED',
    },
    {
      id: 'book_2',
      serviceTitle: 'SEO Campaign & Content Strategy Audit',
      freelancerName: 'Rohan Sharma',
      price: 3200,
      date: '2026-07-04',
      status: 'IN_PROGRESS',
    }
  ]);

  // Wallet and deposit state
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Dispute state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    setDepositing(true);
    setTimeout(() => {
      setBalance(prev => prev + amt);
      setDepositAmount('');
      setDepositing(false);
      toast.success(`₹${amt} successfully loaded into your Servify Escrow wallet!`);
    }, 1200);
  };

  const handleFileDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !disputeReason.trim()) return;

    // Update state to show booking as disputed
    setBookings(prev => 
      prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'DISPUTED' } : b)
    );
    setDisputeSubmitted(true);
    setTimeout(() => {
      setDisputeSubmitted(false);
      setSelectedBooking(null);
      setDisputeReason('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-500" /> Client Portal
            </h1>
            <p className="text-xs text-slate-500">Manage bookings, escrow deposits, and resolve disputes</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer h-10 px-4"
            >
              Go Home
            </Button>
            <Button
              onClick={() => router.push('/')} // Home directs to marketplace list
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10 cursor-pointer h-10 px-4 flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Find Services
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Escrow Wallet */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Escrow Wallet
              </CardTitle>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">₹{balance.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Pre-funded credits for quick slot bookings</p>
            </CardContent>
          </Card>

          {/* Active Bookings */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Bookings
              </CardTitle>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {bookings.filter(b => b.status !== 'COMPLETED').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Services currently in progress or awaiting delivery</p>
            </CardContent>
          </Card>

          {/* Dispute Status */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mediation Cases
              </CardTitle>
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {bookings.filter(b => b.status === 'DISPUTED').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Disputed orders assigned to support arbiters</p>
            </CardContent>
          </Card>

        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Bookings Tracker (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold">Your Bookings</CardTitle>
                <CardDescription className="text-slate-400">
                  Track progress, approve completions, or file cancellations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    You have no service bookings. Browse the home page to hire a freelancer!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{booking.serviceTitle}</span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              booking.status === 'DELIVERED' 
                                ? 'bg-emerald-500/15 text-emerald-400' 
                                : booking.status === 'DISPUTED'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-indigo-500/15 text-indigo-400'
                            }`}>
                              {booking.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>Freelancer: <b className="text-slate-300">{booking.freelancerName}</b></span>
                            <span>•</span>
                            <span>Booked: {booking.date}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-400">₹{booking.price}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {booking.status === 'DELIVERED' && (
                            <Button 
                              onClick={() => {
                                setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'COMPLETED' } : b));
                                toast.success('Project marked as completed! Escrow funds released to freelancer.');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 cursor-pointer"
                            >
                              Approve & Release
                            </Button>
                          )}
                          {booking.status !== 'DISPUTED' && booking.status !== 'COMPLETED' && (
                            <Button 
                              onClick={() => setSelectedBooking(booking)}
                              variant="outline"
                              className="border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white text-xs h-8 px-3 cursor-pointer"
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

            {/* Dispute Modal/Form Overlay */}
            {selectedBooking && (
              <Card className="border-rose-500/20 bg-rose-950/5 backdrop-blur animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" /> Dispute Booking: {selectedBooking.serviceTitle}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Explain the issues you are facing. A platform support agent will step in to mediate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {disputeSubmitted ? (
                    <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-sm">
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span>Dispute filed successfully. Redirecting details to support agents...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleFileDispute} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-slate-300">Mediation Request Reason</Label>
                        <textarea
                          id="reason"
                          placeholder="Please provide complete details about why you want to dispute this order (e.g. seller missed deadline, did not deliver as specified)..."
                          required
                          rows={4}
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="flex w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setSelectedBooking(null)}
                          className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-rose-600 hover:bg-rose-500 text-white font-medium cursor-pointer"
                        >
                          File Dispute Ticket
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Wallet Deposits (Right 1 col) */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-400" /> Wallet Deposits
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Fund your escrow wallet balance instantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="deposit" className="text-slate-300 text-xs">Amount (INR)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      placeholder="₹ Amount to add"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-600"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={depositing || !depositAmount}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {depositing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        Fund Wallet
                      </>
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
