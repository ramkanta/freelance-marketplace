import Link from 'next/link';
import { Search, Shield, Wallet, Star, ArrowRight, Zap, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Servify
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="#" className="hover:text-white transition-colors">Find Experts</Link>
            <Link href="#" className="hover:text-white transition-colors">Explore Gigs</Link>
            <Link href="#" className="hover:text-white transition-colors">How it Works</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-full px-5 py-2.5 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-8 animate-pulse">
            <Shield className="w-3.5 h-3.5" /> Escrow Payout Protection Enabled
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-8 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Find the Perfect Expert <br className="hidden md:inline" /> For Any On-Demand Service
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Audit-proof ledgers, dynamic split payouts via Razorpay, and instant secure checkouts. Empowering trusted transactions between clients and freelancers.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl backdrop-blur">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <Search className="w-5 h-5 text-slate-500 shrink-0" />
              <input 
                type="text" 
                placeholder="What service do you need today?" 
                className="w-full bg-transparent border-none text-slate-200 placeholder:text-slate-500 focus:outline-none text-sm"
              />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-6 py-3 transition-colors text-sm shadow-md shadow-indigo-600/10">
              Search Experts
            </button>
          </div>
        </div>
      </section>

      {/* 3. Value Props Section */}
      <section className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
              Built on Financial Trust & Transparency
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Say goodbye to transaction delays and platform custody risks. Our ledger system protects both parties.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Prop 1 */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl transition-all hover:border-slate-800 hover:bg-slate-900/60 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Escrow Protected Vault</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Client funds are locked securely in digital escrow. Freelancers begin work knowing funds are guaranteed, and releases happen only upon approval.
              </p>
            </div>

            {/* Prop 2 */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl transition-all hover:border-slate-800 hover:bg-slate-900/60 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Double-Entry Ledger Wallet</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our audit-proof double-entry accounting engine records all credits, debits, and deposits immutably. Instant checkout payments with zero latency.
              </p>
            </div>

            {/* Prop 3 */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl transition-all hover:border-slate-800 hover:bg-slate-900/60 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Dynamic Split Payouts</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Calculations determine platform commission fees dynamically based on freelancer performance. Payouts route instantly via Razorpay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Top Freelancers Grid */}
      <section className="py-20 border-t border-slate-900 bg-slate-900/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
                Top Rated Experts Ready to Deliver
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                Explore profiles of verified freelancers with proven track records on our platform.
              </p>
            </div>
            <Link 
              href="#" 
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Browse all freelancers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Freelancer 1 */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Priya Sharma</h3>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Graphic Design
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> 5.0
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  "Specializing in vector layouts, brand guidelines, and emblem design. I deliver scalable and creative print/digital designs."
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                <span className="text-xs text-slate-500">Commission Tier: 10%</span>
                <Link href="/signup" className="text-xs font-semibold text-white hover:text-indigo-400 transition-all flex items-center gap-1">
                  Book Slot <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Freelancer 2 */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Amit Kumar</h3>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Full-Stack Dev
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> 4.9
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  "Building secure NestJS APIs and responsive Next.js web applications. I focus on database indexing, Redis setups, and scalability."
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                <span className="text-xs text-slate-500">Commission Tier: 12%</span>
                <Link href="/signup" className="text-xs font-semibold text-white hover:text-indigo-400 transition-all flex items-center gap-1">
                  Book Slot <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Freelancer 3 */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Sarah Lopez</h3>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Content Strategy
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> 4.8
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  "SEO-optimized copywriting, technical documentation, and product launch marketing content designed to convert leads."
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                <span className="text-xs text-slate-500">Commission Tier: 15%</span>
                <Link href="/signup" className="text-xs font-semibold text-white hover:text-indigo-400 transition-all flex items-center gap-1">
                  Book Slot <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-slate-900 py-12 bg-slate-950 text-slate-500 text-xs">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-400">Servify Marketplace</span>
          </div>
          <p>© 2026 Servify Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
