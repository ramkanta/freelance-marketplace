'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { freelancersApi } from '../../../lib/api.freelancers';
import { servicesApi, type Service } from '../../../lib/api.services';
import { ordersApi } from '../../../lib/api.orders';
import { reviewsApi, type Review } from '../../../lib/api.reviews';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  ArrowLeft, Star, Clock, ShoppingCart, Loader2,
  BadgeCheck, Briefcase, User, Link2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── KYC badge ───────────────────────────────────────────────────────────────
function KycBadge({ status }: { status: string }) {
  // H11: backend always writes 'APPROVED' (see razorpay.service.ts onboardFreelancer) —
  // this used to check the wrong literal ('verified') and never matched.
  if (status === 'APPROVED')
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
        <BadgeCheck className="w-3 h-3" /> Verified
      </span>
    );
  return (
    <span className="text-[10px] font-bold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
      Unverified
    </span>
  );
}

// ─── Service card ─────────────────────────────────────────────────────────────
function ProfileServiceCard({
  svc,
  isCustomer,
  onBook,
  isBooking,
}: {
  svc: Service;
  isCustomer: boolean;
  onBook: () => void;
  isBooking: boolean;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-colors flex flex-col">
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-xl" />
      <CardContent className="pt-4 pb-4 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
            {svc.category}
          </span>
          <h3 className="text-sm font-bold leading-snug mt-2 line-clamp-2">{svc.title}</h3>
          {svc.description && (
            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{svc.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">Starting at</span>
            <span className="text-lg font-extrabold">₹{Number(svc.price).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-[10px]">{svc.delivery_days}d</span>
            </div>
            {isCustomer ? (
              <Button
                onClick={onBook}
                disabled={isBooking}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-3 cursor-pointer flex items-center gap-1.5"
              >
                {isBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                Book
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled
                className="text-xs h-8 px-3 border-slate-300 dark:border-slate-700 opacity-50 cursor-not-allowed">
                Book
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function FreelancerProfilePage() {
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [bookingServiceId, setBookingServiceId] = React.useState<string | null>(null);
  const [bookedOrderId, setBookedOrderId] = React.useState<string | null>(null);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['freelancer-profile', userId],
    queryFn: () => freelancersApi.getProfile(userId),
    staleTime: 60_000,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['freelancer-services', profile?.id],
    queryFn: () => servicesApi.byFreelancer(profile!.id),
    enabled: !!profile?.id,
    staleTime: 60_000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['freelancer-reviews', userId],
    queryFn: () => reviewsApi.forFreelancer(userId),
    staleTime: 60_000,
  });

  const bookMutation = useMutation({
    mutationFn: (serviceId: string) => ordersApi.create(serviceId),
    onSuccess: (res, serviceId) => {
      setBookingServiceId(null);
      setBookedOrderId(res.order?.id ?? null);
      toast.success('Order created! Proceed to checkout.');
    },
    onError: (err: any) => {
      setBookingServiceId(null);
      toast.error(err?.response?.data?.message ?? 'Failed to create order.');
    },
  });

  const walletCheckoutMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.walletCheckout(orderId),
    onSuccess: (_, orderId) => {
      toast.success('Paid from wallet! Order is now active.');
      router.push(`/orders/${orderId}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Wallet checkout failed.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: () => {
      setBookedOrderId(null);
      toast.success('Order cancelled.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to cancel order.'),
  });

  const handleBook = (serviceId: string) => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'customer') { toast.error('Only customers can book services.'); return; }
    setBookingServiceId(serviceId);
    bookMutation.mutate(serviceId);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-950">
        <p className="text-rose-500 text-sm">Freelancer profile not found.</p>
        <Button variant="outline" onClick={() => router.back()}
          className="border-slate-300 dark:border-slate-700 text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const name = profile.users?.name ?? 'Freelancer';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const isCustomer = user?.role === 'customer';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to services
        </button>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-2xl font-extrabold text-white">{initials}</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold">{name}</h1>
              <KycBadge status={profile.kyc_status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                {profile.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {Number(profile.rating_avg).toFixed(1)}
                </span>
                <span className="text-slate-400">
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {services.length} service{services.length !== 1 ? 's' : ''}
              </span>
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Portfolio
                </a>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Booking confirmation banner */}
        {bookedOrderId && (
          <div className="border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Order created!</p>
              <p className="text-xs text-slate-500 mt-0.5">Pay from your Servify wallet to activate the order.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => walletCheckoutMutation.mutate(bookedOrderId)}
                disabled={walletCheckoutMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4 cursor-pointer flex items-center gap-1.5"
              >
                {walletCheckoutMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ShoppingCart className="w-3.5 h-3.5" />}
                Pay from Wallet
              </Button>
              <Button
                onClick={() => router.push(`/orders/${bookedOrderId}`)}
                variant="outline"
                className="text-xs h-8 px-3 border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                View Order
              </Button>
              <Button onClick={() => cancelMutation.mutate(bookedOrderId)} variant="ghost"
                disabled={cancelMutation.isPending}
                className="text-xs h-8 px-2 text-slate-400 cursor-pointer flex items-center gap-1">
                {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Cancel Order
              </Button>
            </div>
          </div>
        )}

        {/* Services */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Services Offered</h2>
          {servicesLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
              <CardContent className="py-12 text-center text-slate-400 text-sm">
                No active services listed yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {services.filter(s => s.is_active).map(svc => (
                <ProfileServiceCard
                  key={svc.id}
                  svc={svc}
                  isCustomer={isCustomer}
                  onBook={() => handleBook(svc.id)}
                  isBooking={bookMutation.isPending && bookingServiceId === svc.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Client Reviews</h2>
            <div className="space-y-3">
              {reviews.map((r: Review) => (
                <Card key={r.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    {r.comment && <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{r.comment}"</p>}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>— {r.users?.name ?? 'Client'}</span>
                      {r.services?.title && <span className="truncate max-w-[160px]">{r.services.title}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA for guests */}
        {!user && (
          <Card className="border-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/10">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Create a free account to book services with escrow protection.
              </p>
              <div className="flex gap-2 shrink-0">
                <Button onClick={() => router.push('/signup')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4 cursor-pointer">
                  Sign Up Free
                </Button>
                <Button onClick={() => router.push('/login')} variant="outline"
                  className="text-xs h-9 px-4 border-slate-300 dark:border-slate-700 cursor-pointer">
                  Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
