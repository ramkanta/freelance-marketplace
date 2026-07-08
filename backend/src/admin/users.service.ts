import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

export type UserRole = 'customer' | 'freelancer' | 'support' | 'admin';
export type UserStatus = 'active' | 'banned';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async listUsers(params: {
    role?: UserRole;
    status?: UserStatus;
    query?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, status, query, page = 1, limit = 20 } = params;
    const db = this.supabase.getAdminClient();

    let q = db
      .from('users')
      .select(
        'id, name, email, role, is_banned, created_at, freelancer_profiles(id, category, rating_avg, kyc_status)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (role) q = q.eq('role', role);
    if (status === 'banned') q = q.eq('is_banned', true);
    if (status === 'active') q = q.eq('is_banned', false);
    if (query) q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`);

    const { data, error, count } = await q;
    if (error) throw new BadRequestException(error.message);

    return {
      data: data ?? [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async getUser(userId: string) {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('id, name, email, role, is_banned, created_at, freelancer_profiles(id, category, rating_avg, kyc_status, bio)')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('User not found.');
    return data;
  }

  async banUser(userId: string, adminId: string) {
    if (userId === adminId) throw new BadRequestException('You cannot ban yourself.');

    const { data: target } = await this.supabase.getAdminClient()
      .from('users')
      .select('id, role, is_banned')
      .eq('id', userId)
      .single();

    if (!target) throw new NotFoundException('User not found.');
    if (target.role === 'admin') throw new BadRequestException('Cannot ban another admin.');
    if (target.is_banned) throw new BadRequestException('User is already banned.');

    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({ is_banned: true })
      .eq('id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'User banned successfully.' };
  }

  async unbanUser(userId: string) {
    const { data: target } = await this.supabase.getAdminClient()
      .from('users')
      .select('id, is_banned')
      .eq('id', userId)
      .single();

    if (!target) throw new NotFoundException('User not found.');
    if (!target.is_banned) throw new BadRequestException('User is not banned.');

    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({ is_banned: false })
      .eq('id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'User unbanned successfully.' };
  }

  async changeRole(userId: string, role: UserRole, adminId: string) {
    if (userId === adminId) throw new BadRequestException('You cannot change your own role.');
    const valid: UserRole[] = ['customer', 'freelancer', 'support', 'admin'];
    if (!valid.includes(role)) throw new BadRequestException('Invalid role.');

    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: `User role updated to ${role}.` };
  }

  async getPlatformStats() {
    const db = this.supabase.getAdminClient();

    const [users, orders, disputes, escrow] = await Promise.all([
      db.from('users').select('role, is_banned', { count: 'exact' }),
      db.from('orders').select('status', { count: 'exact' }),
      db.from('disputes').select('status', { count: 'exact' }),
      db.from('ledger_entries')
        .select('entry_type, amount')
        .in('entry_type', ['escrow_lock', 'escrow_release', 'escrow_refund']),
    ]);

    const userRows = users.data ?? [];
    const orderRows = orders.data ?? [];
    const disputeRows = disputes.data ?? [];
    const ledgerRows = escrow.data ?? [];

    const locked = ledgerRows
      .filter(r => r.entry_type === 'escrow_lock')
      .reduce((s, r) => s + Number(r.amount), 0);
    const released = ledgerRows
      .filter(r => r.entry_type === 'escrow_release')
      .reduce((s, r) => s + Number(r.amount), 0);
    const refunded = ledgerRows
      .filter(r => r.entry_type === 'escrow_refund')
      .reduce((s, r) => s + Number(r.amount), 0);

    return {
      users: {
        total: userRows.length,
        customers: userRows.filter(u => u.role === 'customer').length,
        freelancers: userRows.filter(u => u.role === 'freelancer').length,
        support: userRows.filter(u => u.role === 'support').length,
        admins: userRows.filter(u => u.role === 'admin').length,
        banned: userRows.filter(u => u.is_banned).length,
      },
      orders: {
        total: orderRows.length,
        active: orderRows.filter(o => o.status === 'payment_captured').length,
        completed: orderRows.filter(o => ['payout_released', 'completed'].includes(o.status)).length,
        disputed: orderRows.filter(o => o.status === 'disputed').length,
      },
      disputes: {
        open: disputeRows.filter(d => d.status === 'open').length,
        underReview: disputeRows.filter(d => d.status === 'under_review').length,
        resolved: disputeRows.filter(d => d.status.startsWith('resolved')).length,
      },
      escrow: {
        lockedTotal: locked,
        releasedTotal: released,
        refundedTotal: refunded,
        atRisk: locked - released - refunded,
      },
    };
  }
}
