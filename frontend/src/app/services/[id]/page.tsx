'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { servicesApi } from '../../../lib/api.services';
import { ordersApi } from '../../../lib/api.orders';
import { reviewsApi, type Review } from '../../../lib/api.reviews';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  ArrowLeft, Star, Clock, ShoppingCart, Loader2,
  BadgeCheck, Briefcase, User, Calendar, Tag,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [bookedOrderId, setBookedOrderId] = useState<string | null>(null);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.get(id),
    staleTime: 60_000,
    enabled: !!id,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['service-reviews', id],
    queryFn: () => reviewsApi.forService(id),
    staleTime: 60_000,
    enabled: !!id,
  });

  const bookMutation = useMutation({
    mutationFn: () => ordersApi.create(id),
    onSuccess: (res) => {
      setBookedOrderId(res.order?.id ?? null);
      toast.success('Order created! Proceed to wallet checkout.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to create order.'),
  });

  const walletCheckoutMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.walletCheckout(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Paid from wallet! Order is now active.');
      router.push(`/orders/${orderId}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Wallet checkout failed.'),
  });

  const handleBook = () => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'customer') { toast.error('Only customers can book services.'); return; }
    bookMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-950">
        <p className="text-rose-500 text-sm">Service not found.</p>
        <Button variant="outline" onClick={() => router.back()}
          className="border-slate-300 dark:border-slate-700 text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const freelancer = service.freelancer_profiles;
  const freelancerName = freelancer?.users?.name ?? 'Freelancer';
  const freelancerUserId = freelancer?.user_id;
  const rating = Number(freelancer?.rating_avg ?? 5).toFixed(1);
  const isCustomer = user?.role === 'customer';

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to services
        </button>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: service details ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Category + Title */}
            <div>
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mb-5" />
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full mb-3">
                <Tag className="w-3 h-3" /> {service.category}
              </span>
              <h1 className="text-2xl font-extrabold leading-tight mt-2">{service.title}</h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{rating}</span>
                  {reviews.length > 0 && (
                    <span className="text-slate-400">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {service.delivery_days} day delivery
                </span>
              </div>
            </div>

            {/* Description */}
            {service.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">About this service</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            )}

            {/* Freelancer card */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/40">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">About the Freelancer</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                  <span className="text-lg font-extrabold text-white">
                    {freelancerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{freelancerName}</p>
                    {freelancer?.kyc_status === 'APPROVED' && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  {freelancer?.category && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <Briefcase className="w-3 h-3" /> {freelancer.category}
                    </p>
                  )}
                  {freelancer?.bio && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mt-1">{freelancer.bio}</p>
                  )}
                  {freelancerUserId && (
                    <Link href={`/freelancers/${freelancerUserId}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 mt-2 transition-colors">
                      <User className="w-3 h-3" /> View full profile →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-4">
                Client Reviews
                {avgRating && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    · {avgRating} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              {reviewsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No reviews yet. Be the first to book!</p>
              ) : (
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
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{r.comment}"</p>
                        )}
                        <p className="text-[11px] text-slate-400">— {r.users?.name ?? 'Client'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: booking card ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900/60 space-y-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Starting at</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    ₹{Number(service.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Delivery</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{service.delivery_days} days</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-right max-w-[130px] truncate">{service.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400" /> Rating</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{rating} / 5.0</span>
                  </div>
                </div>

                {/* Booking CTA */}
                {bookedOrderId ? (
                  <div className="space-y-2">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold text-center">
                      Order created! Pay to activate.
                    </p>
                    <Button
                      onClick={() => walletCheckoutMutation.mutate(bookedOrderId)}
                      disabled={walletCheckoutMutation.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer flex items-center justify-center gap-2">
                      {walletCheckoutMutation.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                        : <><ShoppingCart className="w-4 h-4" /> Pay from Wallet</>}
                    </Button>
                    <Button variant="outline" onClick={() => setBookedOrderId(null)}
                      className="w-full text-xs border-slate-300 dark:border-slate-700 cursor-pointer">
                      Cancel
                    </Button>
                  </div>
                ) : isCustomer ? (
                  <Button
                    onClick={handleBook}
                    disabled={bookMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer flex items-center justify-center gap-2">
                    {bookMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating order…</>
                      : <><ShoppingCart className="w-4 h-4" /> Book This Service</>}
                  </Button>
                ) : !user ? (
                  <Link href="/login" className="block">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer">
                      Log in to Book
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full opacity-50 cursor-not-allowed">
                    Only customers can book
                  </Button>
                )}

                <p className="text-[10px] text-slate-400 text-center">
                  Funds held in escrow until you approve delivery
                </p>
              </div>

              {/* Escrow trust badge */}
              <div className="border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">🔒 Escrow Protected</p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 mt-1">
                  Payment is released only after you approve the delivery.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
