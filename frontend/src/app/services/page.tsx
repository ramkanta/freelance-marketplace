'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { servicesApi, type Service, type ServiceSortOption } from '../../lib/api.services';
import { ordersApi } from '../../lib/api.orders';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Search, Star, Clock, Filter, X,
  Loader2, ShoppingCart, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const CATEGORIES = [
  'All',
  'Software Development',
  'Graphic Design & Branding',
  'SEO & Content Strategy',
  'Video Editing & Animation',
  'Digital Marketing',
  'Translation & Copywriting',
];

const SORT_OPTIONS: { value: ServiceSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'delivery_fast', label: 'Fastest Delivery' },
];

function ServicesPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state is initialized from the URL so category deep-links (e.g. the
  // homepage's /services?category=X pills) actually apply on load, and so the
  // current search/filter/page state is shareable and survives a refresh.
  const [query, setQuery] = useState(searchParams.get('query') ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('query') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [maxDeliveryDays, setMaxDeliveryDays] = useState(searchParams.get('maxDeliveryDays') ?? '');
  const [sortBy, setSortBy] = useState<ServiceSortOption>((searchParams.get('sortBy') as ServiceSortOption) || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1') || 1);
  const [showFilters, setShowFilters] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Keep the URL in sync with filter state (shallow — no scroll/history spam).
  const syncUrl = (next: { query?: string; category?: string; minPrice?: string; maxPrice?: string; maxDeliveryDays?: string; sortBy?: ServiceSortOption; page?: number }) => {
    const params = new URLSearchParams();
    const q = next.query ?? debouncedQuery;
    const c = next.category ?? category;
    const min = next.minPrice ?? minPrice;
    const max = next.maxPrice ?? maxPrice;
    const delivery = next.maxDeliveryDays ?? maxDeliveryDays;
    const sort = next.sortBy ?? sortBy;
    const p = next.page ?? page;
    if (q) params.set('query', q);
    if (c) params.set('category', c);
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
    if (delivery) params.set('maxDeliveryDays', delivery);
    if (sort && sort !== 'newest') params.set('sortBy', sort);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    router.replace(qs ? `/services?${qs}` : '/services', { scroll: false });
  };

  // Debounce search input
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val);
      setPage(1);
      syncUrl({ query: val, page: 1 });
    }, 400);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['services', debouncedQuery, category, minPrice, maxPrice, maxDeliveryDays, sortBy, page],
    queryFn: () =>
      servicesApi.list({
        query: debouncedQuery || undefined,
        category: category || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        maxDeliveryDays: maxDeliveryDays ? parseInt(maxDeliveryDays, 10) : undefined,
        sortBy,
        page,
        limit: 12,
      }),
    staleTime: 30_000,
  });

  const services: Service[] = data?.data ?? [];
  const meta = data?.meta;

  const bookMutation = useMutation({
    mutationFn: (serviceId: string) => ordersApi.create(serviceId),
    onSuccess: (res) => {
      setBookingId(res.order.id);
      toast.success('Order created! Pay from your wallet to activate it.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to create order.'),
  });

  const walletCheckoutMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.walletCheckout(orderId),
    onSuccess: () => {
      toast.success('Paid from wallet! Order is now active.');
      setBookingId(null);
      router.push('/customer/dashboard');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Wallet checkout failed.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: () => {
      setBookingId(null);
      toast.success('Order cancelled.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to cancel order.'),
  });

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMaxDeliveryDays('');
    setSortBy('newest');
    setPage(1);
    router.replace('/services', { scroll: false });
  };

  const hasFilters = debouncedQuery || category || minPrice || maxPrice || maxDeliveryDays || sortBy !== 'newest';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">

      {/* Hero search bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Find Expert Freelancers</h1>
          <p className="text-slate-500 text-sm">All services protected by escrow. Pay only when you're satisfied.</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services, skills, or keywords..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => {
                const next = c === 'All' ? '' : c;
                setCategory(next);
                setPage(1);
                syncUrl({ category: next, page: 1 });
              }}
              className={`shrink-0 text-xs px-4 py-2 rounded-full border transition-colors cursor-pointer ${
                (c === 'All' && !category) || category === c
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-500'
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500'
              }`}>
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {meta && (
              <p className="text-xs text-slate-500">
                {meta.total} service{meta.total !== 1 ? 's' : ''} found
              </p>
            )}
            <select
              value={sortBy}
              onChange={e => {
                const val = e.target.value as ServiceSortOption;
                setSortBy(val);
                setPage(1);
                syncUrl({ sortBy: val, page: 1 });
              }}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price & delivery filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 items-center p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0">Min ₹</label>
              <Input type="number" placeholder="0" value={minPrice}
                onChange={e => { setMinPrice(e.target.value); setPage(1); syncUrl({ minPrice: e.target.value, page: 1 }); }}
                className="w-28 h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0">Max ₹</label>
              <Input type="number" placeholder="Any" value={maxPrice}
                onChange={e => { setMaxPrice(e.target.value); setPage(1); syncUrl({ maxPrice: e.target.value, page: 1 }); }}
                className="w-28 h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0">Max delivery (days)</label>
              <Input type="number" placeholder="Any" value={maxDeliveryDays}
                onChange={e => { setMaxDeliveryDays(e.target.value); setPage(1); syncUrl({ maxDeliveryDays: e.target.value, page: 1 }); }}
                className="w-24 h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700" />
            </div>
          </div>
        )}

        {/* Booking confirmation modal */}
        {bookingId && (
          <div className="border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Order created successfully!</p>
              <p className="text-xs text-slate-500 mt-0.5">Pay via your Servify wallet to activate the order.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => walletCheckoutMutation.mutate(bookingId)}
                disabled={walletCheckoutMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4 cursor-pointer flex items-center gap-1">
                {walletCheckoutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                Pay from Wallet
              </Button>
              <Button onClick={() => cancelMutation.mutate(bookingId)} variant="outline"
                disabled={cancelMutation.isPending}
                className="text-xs h-8 px-3 border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1">
                {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-rose-500 text-sm">Failed to load services. Check your connection and try again.</p>
            <button onClick={() => refetch()}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg px-4 py-2 cursor-pointer transition-colors">
              Retry
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-slate-500 font-medium">No services found.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-indigo-500 hover:underline cursor-pointer">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isCustomer={user?.role === 'customer'}
                isLoggedIn={!!user}
                onBook={() => {
                  if (!user || user.role !== 'customer') {
                    toast.error('Only customers can book services.');
                    return;
                  }
                  bookMutation.mutate(svc.id);
                }}
                isBooking={bookMutation.isPending && bookMutation.variables === svc.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => { const p = Math.max(1, page - 1); setPage(p); syncUrl({ page: p }); }}
              disabled={page === 1}
              className="h-9 px-3 border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-500">
              Page <span className="font-bold text-slate-900 dark:text-slate-100">{page}</span> of {meta.totalPages}
            </span>
            <Button variant="outline" onClick={() => { const p = Math.min(meta.totalPages, page + 1); setPage(p); syncUrl({ page: p }); }}
              disabled={page === meta.totalPages}
              className="h-9 px-3 border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesPageInner />
    </Suspense>
  );
}

function ServiceCard({ service: svc, isCustomer, isLoggedIn, onBook, isBooking }: {
  service: Service;
  isCustomer: boolean;
  isLoggedIn: boolean;
  onBook: () => void;
  isBooking: boolean;
}) {
  const freelancerName = svc.freelancer_profiles?.users?.name ?? 'Freelancer';
  const freelancerUserId = svc.freelancer_profiles?.user_id;
  const rating = svc.freelancer_profiles?.rating_avg ?? 5.0;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-colors group flex flex-col">
      {/* Category stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-xl" />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
            {svc.category}
          </span>
          <div className="flex items-center gap-1 text-amber-400 shrink-0">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{Number(rating).toFixed(1)}</span>
          </div>
        </div>
        <Link href={`/services/${svc.id}`}>
          <CardTitle className="text-sm font-bold leading-snug mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 cursor-pointer">
            {svc.title}
          </CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4 pb-4">
        {svc.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{svc.description}</p>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">
              by{' '}
              {freelancerUserId ? (
                <Link href={`/freelancers/${freelancerUserId}`}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                  {freelancerName}
                </Link>
              ) : (
                <span className="font-semibold text-slate-700 dark:text-slate-300">{freelancerName}</span>
              )}
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-[10px]">{svc.delivery_days}d delivery</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Starting at</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                ₹{Number(svc.price).toLocaleString('en-IN')}
              </span>
            </div>
            {isCustomer ? (
              <Button onClick={onBook} disabled={isBooking}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4 cursor-pointer flex items-center gap-1.5">
                {isBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                Book Now
              </Button>
            ) : !isLoggedIn ? (
              <Link href="/login">
                <Button variant="outline" size="sm"
                  className="text-xs h-8 px-3 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer">
                  Log in to book
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm"
                className="text-xs h-8 px-3 border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                disabled>
                View only
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
