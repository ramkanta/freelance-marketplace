import React from 'react';
import Link from 'next/link';
import {
  Search, Shield, Wallet, Star, ArrowRight, Zap,
  CheckCircle2, Lock, Banknote, HeadphonesIcon,
  Code2, Palette, Megaphone, Video, FileText, Globe,
} from 'lucide-react';

// ─── Static data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { icon: Code2,        label: 'Software Development',         href: '/services?category=Software+Development' },
  { icon: Palette,      label: 'Graphic Design & Branding',    href: '/services?category=Graphic+Design+%26+Branding' },
  { icon: Megaphone,    label: 'Digital Marketing',            href: '/services?category=Digital+Marketing' },
  { icon: Video,        label: 'Video Editing & Animation',    href: '/services?category=Video+Editing+%26+Animation' },
  { icon: FileText,     label: 'SEO & Content Strategy',       href: '/services?category=SEO+%26+Content+Strategy' },
  { icon: Globe,        label: 'Translation & Copywriting',    href: '/services?category=Translation+%26+Copywriting' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse & Book',
    desc: 'Search expert freelancers by skill, price, or delivery time. Book instantly with no upfront commitment.',
  },
  {
    step: '02',
    title: 'Funds Locked in Escrow',
    desc: 'Your payment is secured in our double-entry escrow vault. The freelancer starts work knowing funds are guaranteed.',
  },
  {
    step: '03',
    title: 'Review & Approve',
    desc: 'Once delivered, review the work. Approve to release funds, or raise a dispute — our support team mediates fairly.',
  },
  {
    step: '04',
    title: 'Instant Payout',
    desc: 'Approved funds reach the freelancer via Razorpay within minutes. Commission is split transparently.',
  },
];

const VALUE_PROPS = [
  {
    icon: Lock,
    title: 'Escrow-Protected Vault',
    desc: `Funds are locked immutably until you approve delivery. No freelancer access until you're satisfied.`,
  },
  {
    icon: Wallet,
    title: 'Audit-Proof Ledger',
    desc: 'Every rupee is tracked with double-entry accounting. Full transaction history, always visible.',
  },
  {
    icon: Zap,
    title: 'Instant RazorpayX Payouts',
    desc: 'Approved earnings hit the freelancer's bank account in minutes, not days.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Human Dispute Mediation',
    desc: 'If something goes wrong, our support agents step in to review evidence and resolve fairly.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Graphic Designer',
    rating: 5,
    text: `I've tried 4 platforms — Servify is the only one where I actually trust the payment process. Escrow releases are instant.`,
  },
  {
    name: 'Rahul Mehta',
    role: 'Startup Founder',
    rating: 5,
    text: 'We hired 3 developers through Servify. The escrow system gives us confidence to work with new freelancers without risk.',
  },
  {
    name: 'Ananya Rao',
    role: 'Content Strategist',
    rating: 5,
    text: 'The dispute resolution is actually fair. I had one issue and it was resolved in 48 hours with full payment.',
  },
];

const STATS = [
  { value: '₹2.4Cr+', label: 'Escrow Processed' },
  { value: '1,200+', label: 'Verified Freelancers' },
  { value: '8,500+', label: 'Orders Completed' },
  { value: '98.2%', label: 'Satisfaction Rate' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        {/* Glow blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/8 dark:bg-indigo-500/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-violet-500/6 dark:bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-8">
            <Shield className="w-3.5 h-3.5" /> Escrow-Protected · Powered by RazorpayX
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[3.75rem] font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-900 dark:text-white">
            Hire Expert Freelancers <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              With Zero Payment Risk
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every transaction is secured by escrow. Funds are released only when you approve. Disputes resolved by real humans.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/80">
            <div className="flex-grow flex items-center gap-3 px-4 py-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="What service do you need today?"
                readOnly
                className="w-full bg-transparent border-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none text-sm cursor-pointer"
                onClick={() => { window.location.href = '/services'; }}
              />
            </div>
            <Link
              href="/services"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6 py-3 transition-colors text-sm text-center shadow-sm shadow-indigo-600/20"
            >
              Browse Services
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-xs text-slate-500">
            {['No fees until you hire', 'Escrow on every order', '48h dispute resolution'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category grid ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Browse by Category</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Thousands of services across every digital discipline, all backed by escrow.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORIES.map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}
                className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 transition-all">
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">How Servify Works</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              From search to payout in 4 simple steps — designed to protect everyone.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-indigo-300/50 dark:via-indigo-700/40 to-transparent" />
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 flex flex-col items-center justify-center shadow-sm z-10 shrink-0">
                  <span className="text-[10px] font-black text-indigo-400 tracking-widest">{step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value props ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Built on Financial Trust
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              No custody risks, no delayed payouts. Every transaction is verifiable and transparent.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="flex gap-4 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Trusted by Freelancers & Clients</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, rating, text }) => (
              <div key={name}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">"{text}"</p>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{name}</p>
                  <p className="text-[11px] text-slate-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-white to-indigo-50 dark:from-slate-950 dark:to-indigo-950/20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Ready to Get Started?
          </h2>
          <p className="text-slate-500 text-base mb-10 max-w-lg mx-auto">
            Join thousands of businesses and freelancers already using Servify's escrow-secured marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3.5 transition-colors text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/services"
              className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold rounded-xl px-8 py-3.5 transition-colors text-sm flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Browse Services
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-6">No credit card required · Free to browse · Pay only when you hire</p>
        </div>
      </section>

    </div>
  );
}
