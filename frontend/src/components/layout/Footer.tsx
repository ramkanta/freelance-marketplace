import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

const LINKS = {
  Company: [
    { label: 'About Servify', href: '/#about' },
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'Browse Experts', href: '/services' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-500 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Servify</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500 max-w-xs">
              On-demand freelance marketplace with escrow-protected payments, double-entry ledger accounting, and dynamic split payouts via Razorpay.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 dark:border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© 2026 Servify Inc. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-600">
            <Zap className="w-3 h-3 text-indigo-500" />
            <span>Escrow & Ledger Powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
