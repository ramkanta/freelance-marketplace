'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { ConfirmDialog } from '../ui/confirm-dialog';
import {
  Zap, Sun, Moon, LogOut, Menu, X,
  LayoutDashboard, UserCheck,
} from 'lucide-react';

const ROLE_DASHBOARD: Record<string, string> = {
  customer: '/customer/dashboard',
  freelancer: '/freelancer/dashboard',
  support: '/support/dashboard',
  admin: '/admin/dashboard',
};

// Only customer/freelancer have a dedicated profile page today.
const ROLE_PROFILE: Record<string, string> = {
  customer: '/customer/profile',
  freelancer: '/freelancer/profile',
};

const NAV_LINKS = [
  { label: 'Find Experts', href: '/services' },
  { label: 'How it Works', href: '/#how-it-works' },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const dashboardHref = user?.role ? ROLE_DASHBOARD[user.role] : '/';
  const profileHref = user?.role ? ROLE_PROFILE[user.role] : undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 dark:border-slate-900 dark:bg-slate-950/80 backdrop-blur transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Servify
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`transition-colors ${
                pathname === link.href
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin/migrations"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 transition-colors"
            >
              DB Console
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  aria-current={pathname === dashboardHref ? 'page' : undefined}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                    pathname === dashboardHref
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                {profileHref ? (
                  <Link
                    href={profileHref}
                    title="View your profile"
                    className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    {user?.name}
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    {user?.name}
                  </span>
                )}
                <button
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-full px-3.5 py-1.5 transition-all bg-red-500/5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-full px-5 py-2.5 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 px-6 py-5 space-y-4 shadow-xl">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-slate-900 dark:hover:text-white py-1 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                href="/admin/migrations"
                className="text-indigo-600 dark:text-indigo-400 font-semibold py-1"
                onClick={() => setMobileOpen(false)}
              >
                DB Console
              </Link>
            )}
          </nav>

          <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                {profileHref ? (
                  <Link
                    href={profileHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    Signed in as <span className="font-semibold text-indigo-500 ml-1">{user?.name}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    Signed in as <span className="font-semibold text-indigo-500 ml-1">{user?.name}</span>
                  </div>
                )}
                <Link
                  href={dashboardHref}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full py-2.5 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); setLogoutConfirmOpen(true); }}
                  className="w-full text-center text-sm font-semibold text-red-500 border border-red-500/20 rounded-full py-2.5 bg-red-500/5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full text-center text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-full py-2.5"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="w-full text-center text-sm font-medium bg-indigo-600 text-white rounded-full py-2.5 shadow"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out of Servify?"
        description="You'll need to sign in again to access your dashboard, orders, and wallet."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="danger"
        onConfirm={logout}
      />
    </header>
  );
}
