import React from 'react';
import Link from 'next/link';
import { Search, Shield, Wallet, Star, ArrowRight, Zap } from 'lucide-react';

const FREELANCERS = [
  {
    name: 'Priya Sharma',
    category: 'Graphic Design',
    rating: '5.0',
    commission: '10%',
    bio: 'Specializing in vector layouts, brand guidelines, and emblem design. I deliver scalable and creative print/digital designs.',
  },
  {
    name: 'Amit Kumar',
    category: 'Full-Stack Dev',
    rating: '4.9',
    commission: '12%',
    bio: 'Building secure NestJS APIs and responsive Next.js web applications. I focus on database indexing, Redis setups, and scalability.',
  },
  {
    name: 'Sarah Lopez',
    category: 'Content Strategy',
    rating: '4.8',
    commission: '15%',
    bio: 'SEO-optimized copywriting, technical documentation, and product launch marketing content designed to convert leads.',
  },
];

const VALUE_PROPS = [
  {
    icon: Shield,
    title: 'Escrow Protected Vault',
    desc: 'Client funds are locked securely in digital escrow. Freelancers begin work knowing funds are guaranteed, and releases happen only upon approval.',
  },
  {
    icon: Wallet,
    title: 'Double-Entry Ledger',
    desc: 'Our audit-proof double-entry accounting engine records all credits, debits, and deposits immutably. Instant checkout payments with zero latency.',
  },
  {
    icon: Zap,
    title: 'Dynamic Split Payouts',
    desc: 'Platform commission fees are calculated dynamically based on freelancer performance. Payouts route instantly via Razorpay.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col selection:bg-indigo-500 selection:text-white">

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-slate-50 dark:bg-slate-950/20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-8 animate-pulse">
            <Shield className="w-3.5 h-3.5" /> Escrow Payout Protection Enabled
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-8 text-slate-900 dark:text-white">
            Find the Perfect Expert <br className="hidden md:inline" /> For Any On-Demand Service
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Audit-proof ledgers, dynamic split payouts via Razorpay, and instant secure checkouts. Empowering trusted transactions between clients and freelancers.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl backdrop-blur">
            <div className="flex-grow flex items-center gap-3 px-4 py-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="What service do you need today?"
                className="w-full bg-transparent border-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none text-sm"
              />
            </div>
            <Link
              href="/services"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-6 py-3 transition-colors text-sm shadow-md shadow-indigo-600/10 text-center"
            >
              Search Experts
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works anchor */}
      <div id="how-it-works" />

      {/* Value Props */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Built on Financial Trust & Transparency
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              Say goodbye to transaction delays and platform custody risks. Our ledger system protects both parties.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl transition-all hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/60 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Freelancers */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                Top Rated Experts Ready to Deliver
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                Explore profiles of verified freelancers with proven track records on our platform.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors shrink-0"
            >
              Browse all freelancers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {FREELANCERS.map((f) => (
              <div
                key={f.name}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.name}</h3>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded mt-1 inline-block">
                        {f.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current" /> {f.rating}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    "{f.bio}"
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-xs text-slate-500">Commission Tier: {f.commission}</span>
                  <Link
                    href="/signup"
                    className="text-xs font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1"
                  >
                    Book Slot <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
