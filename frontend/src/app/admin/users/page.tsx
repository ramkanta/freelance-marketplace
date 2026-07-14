'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { adminUsersApi, type AdminUser, type UserRole, type UserStatus } from '../../../lib/api.admin';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Users, Search, Ban, ShieldCheck, ChevronLeft, ChevronRight,
  Loader2, ArrowLeft, BadgeCheck, RefreshCw, UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<UserRole, string> = {
  admin:      'bg-violet-500/10 text-violet-500',
  support:    'bg-blue-500/10 text-blue-500',
  freelancer: 'bg-indigo-500/10 text-indigo-500',
  customer:   'bg-slate-500/10 text-slate-500',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${ROLE_COLORS[role] ?? 'bg-slate-500/10 text-slate-500'}`}>
      {role}
    </span>
  );
}

// ─── Role change popover ──────────────────────────────────────────────────────
const ROLES: UserRole[] = ['customer', 'freelancer', 'support', 'admin'];

function RoleMenu({ userId, current, onSelect }: {
  userId: string;
  current: UserRole;
  onSelect: (role: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        title="Change role"
        aria-label="Change role"
        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-400 transition-colors cursor-pointer">
        <UserCog className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 min-w-[130px]">
          {ROLES.map(r => (
            <button key={r} onClick={() => { onSelect(r); setOpen(false); }}
              disabled={r === current}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                r === current
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600'
              }`}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedQuery(v); setPage(1); }, 400);
  };

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminUsersApi.stats,
    staleTime: 30_000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', debouncedQuery, roleFilter, statusFilter, page],
    queryFn: () => adminUsersApi.list({
      query: debouncedQuery || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    staleTime: 15_000,
  });

  const users: AdminUser[] = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const banMutation = useMutation({
    mutationFn: adminUsersApi.ban,
    onSuccess: () => { toast.success('User banned.'); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to ban user.'),
  });

  const unbanMutation = useMutation({
    mutationFn: adminUsersApi.unban,
    onSuccess: () => { toast.success('User unbanned.'); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to unban user.'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminUsersApi.changeRole(userId, role),
    onSuccess: (_, { role }) => { toast.success(`Role updated to ${role}.`); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to change role.'),
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <p className="text-rose-500 text-sm">Admin access only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/dashboard')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 hover:border-indigo-400 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-500" /> User Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Ban, unban, and reassign user roles across the platform</p>
            </div>
          </div>
          <button onClick={() => refetch()}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 hover:border-indigo-400 transition-colors cursor-pointer self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Users',   value: stats.users.total },
              { label: 'Customers',     value: stats.users.customers },
              { label: 'Freelancers',   value: stats.users.freelancers },
              { label: 'Support',       value: stats.users.support },
              { label: 'Admins',        value: stats.users.admins },
              { label: 'Banned',        value: stats.users.banned, danger: true },
            ].map(({ label, value, danger }) => (
              <Card key={label} className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                <CardContent className="pt-4 pb-3">
                  <p className={`text-2xl font-extrabold ${danger && value > 0 ? 'text-rose-500' : ''}`}>{value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search name or email..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
            />
          </div>
          <select value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
            className="h-9 text-xs px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as UserStatus | ''); setPage(1); }}
            className="h-9 text-xs px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
          {meta && (
            <span className="text-xs text-slate-400 ml-auto">{meta.total} user{meta.total !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Table */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
          {isLoading ? (
            <CardContent className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
            </CardContent>
          ) : error ? (
            <CardContent className="text-center py-16 text-rose-500 text-sm">
              Failed to load users.
            </CardContent>
          ) : users.length === 0 ? (
            <CardContent className="text-center py-16 text-slate-400 text-sm">
              No users found matching your filters.
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3">User</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3">Role</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3">Status</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3 hidden sm:table-cell">Joined</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3 hidden lg:table-cell">Freelancer Info</th>
                    <th className="text-right text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => {
                    const isBanning = banMutation.isPending && banMutation.variables === u.id;
                    const isUnbanning = unbanMutation.isPending && unbanMutation.variables === u.id;
                    const isMe = u.id === user.id;
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${u.is_banned ? 'opacity-60' : ''}`}>
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-white">
                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate flex items-center gap-1">
                                {u.name}
                                {isMe && <span className="text-[9px] text-indigo-400">(you)</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            u.is_banned
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {u.is_banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-[11px] text-slate-400 hidden sm:table-cell">
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        {/* Freelancer info */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {u.freelancer_profiles ? (
                            <div className="text-[10px] text-slate-500 space-y-0.5">
                              <p>{u.freelancer_profiles.category}</p>
                              <p className="flex items-center gap-1">
                                ★ {Number(u.freelancer_profiles.rating_avg).toFixed(1)}
                                {u.freelancer_profiles.kyc_status === 'APPROVED' && (
                                  <BadgeCheck className="w-3 h-3 text-emerald-500" />
                                )}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isMe && (
                              <RoleMenu
                                userId={u.id}
                                current={u.role}
                                onSelect={role => roleMutation.mutate({ userId: u.id, role })}
                              />
                            )}
                            {!isMe && (
                              u.is_banned ? (
                                <button
                                  onClick={() => unbanMutation.mutate(u.id)}
                                  disabled={isUnbanning}
                                  title="Unban user"
                                  className="p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer disabled:opacity-50">
                                  {isUnbanning
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <ShieldCheck className="w-3.5 h-3.5" />}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (confirm(`Ban ${u.name}? They will lose platform access.`))
                                      banMutation.mutate(u.id);
                                  }}
                                  disabled={isBanning || u.role === 'admin'}
                                  title={u.role === 'admin' ? 'Cannot ban admins' : 'Ban user'}
                                  className="p-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                                  {isBanning
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Ban className="w-3.5 h-3.5" />}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 px-3 border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-500">
              Page <span className="font-bold text-slate-900 dark:text-slate-100">{page}</span> of {meta.totalPages}
            </span>
            <Button variant="outline" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
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
