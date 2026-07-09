import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { EmailService } from '../email/email.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AssignDisputeDto } from './dto/assign-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Create dispute when customer files via /orders/:id/dispute ──────────────
  // Called internally from OrdersService — also creates the disputes record
  async openDispute(orderId: string, filedBy: string, reason: string) {
    const client = this.supabaseService.getAdminClient();

    // Prevent duplicate disputes on the same order
    const { data: existing } = await client
      .from('disputes')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) throw new BadRequestException('A dispute already exists for this order.');

    const { data, error } = await client
      .from('disputes')
      .insert({ order_id: orderId, filed_by: filedBy, reason, status: 'open' })
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Failed to open dispute: ${error.message}`);
    return data;
  }

  // ─── List disputes — admin sees all, support sees assigned only ──────────────
  async listDisputes(role: string, userId: string, status?: string) {
    const client = this.supabaseService.getAdminClient();

    let builder = client
      .from('disputes')
      .select(`
        *,
        orders ( id, amount, commission_rate, service_id, customer_id, freelancer_id ),
        users!disputes_filed_by_fkey ( name, email )
      `)
      .order('created_at', { ascending: false });

    if (role === 'support') {
      builder = builder.eq('assigned_to', userId);
    }

    if (status) {
      builder = builder.eq('status', status);
    }

    const { data, error } = await builder;
    if (error) throw new BadRequestException(`Failed to fetch disputes: ${error.message}`);
    return data;
  }

  // ─── Single dispute detail ───────────────────────────────────────────────────
  async getDispute(disputeId: string, role: string, userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('disputes')
      .select(`
        *,
        orders ( *, services ( title, category ) ),
        users!disputes_filed_by_fkey ( name, email )
      `)
      .eq('id', disputeId)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Dispute not found.');

    if (role === 'support' && data.assigned_to !== userId) {
      throw new ForbiddenException('This dispute is not assigned to you.');
    }

    return data;
  }

  // ─── Assign dispute to a support agent (admin only) ─────────────────────────
  async assignDispute(disputeId: string, dto: AssignDisputeDto) {
    const client = this.supabaseService.getAdminClient();

    const { data: dispute } = await client
      .from('disputes')
      .select('id, status')
      .eq('id', disputeId)
      .maybeSingle();

    if (!dispute) throw new NotFoundException('Dispute not found.');
    if (dispute.status !== 'open') {
      throw new BadRequestException('Only open disputes can be assigned.');
    }

    const { data, error } = await client
      .from('disputes')
      .update({
        assigned_to: dto.supportAgentId,
        status: 'under_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Failed to assign dispute: ${error.message}`);

    // Notify both parties that the dispute is under review
    const db = this.supabaseService.getAdminClient();
    const { data: orderRow } = await db.from('orders').select('customer_id, freelancer_id').eq('id', data.order_id).maybeSingle();
    if (orderRow) {
      const [{ data: cust }, { data: free }] = await Promise.all([
        db.from('users').select('email, name').eq('id', orderRow.customer_id).maybeSingle(),
        db.from('users').select('email, name').eq('id', orderRow.freelancer_id).maybeSingle(),
      ]);
      if (cust) this.emailService.sendDisputeUnderReview(cust.email, cust.name, data.order_id).catch(() => {});
      if (free) this.emailService.sendDisputeUnderReview(free.email, free.name, data.order_id).catch(() => {});
    }

    return data;
  }

  // ─── Resolve dispute — writes ledger entries and closes the case ─────────────
  async resolveDispute(disputeId: string, dto: ResolveDisputeDto, resolvedBy: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: dispute } = await client
      .from('disputes')
      .select('*, orders(*)')
      .eq('id', disputeId)
      .in('status', ['open', 'under_review'])
      .maybeSingle();

    if (!dispute) throw new NotFoundException('Dispute not found or already resolved.');

    const order = (dispute as any).orders;
    const orderId: string = order.id;
    const totalAmount: number = Number(order.amount);
    const commissionRate: number = Number(order.commission_rate);

    const ledgerEntries: Record<string, unknown>[] = [];

    if (dto.resolution === 'resolved_refund') {
      // Full refund → platform_holding → customer_wallet
      ledgerEntries.push({
        order_id: orderId,
        entry_type: 'escrow_refund',
        debit_account: `platform_holding:${orderId}`,
        credit_account: `customer_wallet:${order.customer_id}`,
        amount: totalAmount,
        meta: { resolution: 'full_refund', resolved_by: resolvedBy },
      });

    } else if (dto.resolution === 'resolved_release') {
      // Full release → platform_holding → freelancer + platform_revenue
      const platformCut = parseFloat(((totalAmount * commissionRate) / 100).toFixed(2));
      const freelancerCut = parseFloat((totalAmount - platformCut).toFixed(2));

      ledgerEntries.push(
        {
          order_id: orderId,
          entry_type: 'escrow_release',
          debit_account: `platform_holding:${orderId}`,
          credit_account: `freelancer_wallet:${order.freelancer_id}`,
          amount: freelancerCut,
          meta: { resolution: 'full_release', resolved_by: resolvedBy },
        },
        {
          order_id: orderId,
          entry_type: 'platform_commission',
          debit_account: `platform_holding:${orderId}`,
          credit_account: 'platform_revenue',
          amount: platformCut,
          meta: { resolution: 'full_release', resolved_by: resolvedBy },
        },
      );

    } else if (dto.resolution === 'resolved_split') {
      // Partial split — arbiter sets customer refund percentage
      const customerPct = dto.customerRefundPercent ?? 50;
      const freelancerPct = 100 - customerPct;
      const customerRefund = parseFloat(((totalAmount * customerPct) / 100).toFixed(2));
      const freelancerGross = parseFloat(((totalAmount * freelancerPct) / 100).toFixed(2));
      const platformCut = parseFloat(((freelancerGross * commissionRate) / 100).toFixed(2));
      const freelancerNet = parseFloat((freelancerGross - platformCut).toFixed(2));

      ledgerEntries.push(
        {
          order_id: orderId,
          entry_type: 'escrow_refund',
          debit_account: `platform_holding:${orderId}`,
          credit_account: `customer_wallet:${order.customer_id}`,
          amount: customerRefund,
          meta: { resolution: 'split', customer_pct: customerPct, resolved_by: resolvedBy },
        },
        {
          order_id: orderId,
          entry_type: 'escrow_release',
          debit_account: `platform_holding:${orderId}`,
          credit_account: `freelancer_wallet:${order.freelancer_id}`,
          amount: freelancerNet,
          meta: { resolution: 'split', freelancer_pct: freelancerPct, resolved_by: resolvedBy },
        },
        {
          order_id: orderId,
          entry_type: 'platform_commission',
          debit_account: `platform_holding:${orderId}`,
          credit_account: 'platform_revenue',
          amount: platformCut,
          meta: { resolution: 'split', resolved_by: resolvedBy },
        },
      );
    }

    // Write ledger entries atomically
    const { error: ledgerError } = await client.from('ledger_entries').insert(ledgerEntries);
    if (ledgerError) throw new BadRequestException(`Ledger write failed: ${ledgerError.message}`);

    // Update order status
    const orderStatus =
      dto.resolution === 'resolved_refund' ? 'refunded' : 'payout_released';

    await client
      .from('orders')
      .update({ status: orderStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    // Close dispute
    const { data: resolved, error: disputeError } = await client
      .from('disputes')
      .update({
        status: dto.resolution,
        resolution_note: dto.resolutionNote ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select('*')
      .single();

    if (disputeError) throw new BadRequestException(`Failed to close dispute: ${disputeError.message}`);

    // Email both parties about resolution
    const db2 = this.supabaseService.getAdminClient();
    const [{ data: cust2 }, { data: free2 }] = await Promise.all([
      db2.from('users').select('email, name').eq('id', order.customer_id).maybeSingle(),
      db2.from('users').select('email, name').eq('id', order.freelancer_id).maybeSingle(),
    ]);
    const note = dto.resolutionNote ?? '';

    if (dto.resolution === 'resolved_refund') {
      if (cust2) this.emailService.sendDisputeResolvedRefund(cust2.email, cust2.name, totalAmount, orderId, note).catch(() => {});
      if (free2) this.emailService.sendDisputeResolvedRelease(free2.email, free2.name, 0, orderId, note).catch(() => {});
    } else if (dto.resolution === 'resolved_release') {
      const platformCut2 = parseFloat(((totalAmount * commissionRate) / 100).toFixed(2));
      const freelancerNet2 = parseFloat((totalAmount - platformCut2).toFixed(2));
      if (free2) this.emailService.sendDisputeResolvedRelease(free2.email, free2.name, freelancerNet2, orderId, note).catch(() => {});
      if (cust2) this.emailService.sendDisputeResolvedRefund(cust2.email, cust2.name, 0, orderId, note).catch(() => {});
    } else if (dto.resolution === 'resolved_split') {
      const custPct2 = dto.customerRefundPercent ?? 50;
      const freePct2 = 100 - custPct2;
      const custAmt2 = parseFloat(((totalAmount * custPct2) / 100).toFixed(2));
      const freeGross2 = parseFloat(((totalAmount * freePct2) / 100).toFixed(2));
      const freeCom2 = parseFloat(((freeGross2 * commissionRate) / 100).toFixed(2));
      const freeNet2 = parseFloat((freeGross2 - freeCom2).toFixed(2));
      if (cust2) this.emailService.sendDisputeResolvedSplit(cust2.email, cust2.name, custAmt2, orderId, note).catch(() => {});
      if (free2) this.emailService.sendDisputeResolvedSplit(free2.email, free2.name, freeNet2, orderId, note).catch(() => {});
    }

    return { dispute: resolved, ledgerEntriesWritten: ledgerEntries.length };
  }

  // ─── Escalate dispute (support → admin queue) ────────────────────────────────
  async escalateDispute(disputeId: string, userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: dispute } = await client
      .from('disputes')
      .select('id, status, assigned_to')
      .eq('id', disputeId)
      .maybeSingle();

    if (!dispute) throw new NotFoundException('Dispute not found.');
    if (dispute.assigned_to !== userId) {
      throw new ForbiddenException('Only the assigned agent can escalate this dispute.');
    }

    const { data, error } = await client
      .from('disputes')
      .update({ status: 'escalated', updated_at: new Date().toISOString() })
      .eq('id', disputeId)
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Failed to escalate dispute: ${error.message}`);

    // Notify both parties about escalation
    const db3 = this.supabaseService.getAdminClient();
    const { data: orderRow3 } = await db3.from('orders').select('customer_id, freelancer_id').eq('id', data.order_id).maybeSingle();
    if (orderRow3) {
      const [{ data: cust3 }, { data: free3 }] = await Promise.all([
        db3.from('users').select('email, name').eq('id', orderRow3.customer_id).maybeSingle(),
        db3.from('users').select('email, name').eq('id', orderRow3.freelancer_id).maybeSingle(),
      ]);
      if (cust3) this.emailService.sendDisputeEscalated(cust3.email, cust3.name, data.order_id).catch(() => {});
      if (free3) this.emailService.sendDisputeEscalated(free3.email, free3.name, data.order_id).catch(() => {});
    }

    return data;
  }

  // ─── Upload evidence URL (appends to evidence_urls JSONB array) ──────────────
  async addEvidenceUrl(disputeId: string, userId: string, url: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: dispute } = await client
      .from('disputes')
      .select('id, filed_by, evidence_urls, status')
      .eq('id', disputeId)
      .maybeSingle();

    if (!dispute) throw new NotFoundException('Dispute not found.');
    if (dispute.filed_by !== userId) {
      throw new ForbiddenException('Only the dispute filer can add evidence.');
    }
    if (!['open', 'under_review'].includes(dispute.status)) {
      throw new BadRequestException('Evidence cannot be added to a resolved dispute.');
    }

    const existingUrls: string[] = dispute.evidence_urls ?? [];
    const updatedUrls = [...existingUrls, url];

    const { data, error } = await client
      .from('disputes')
      .update({ evidence_urls: updatedUrls, updated_at: new Date().toISOString() })
      .eq('id', disputeId)
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Failed to add evidence: ${error.message}`);
    return data;
  }

  // ─── Generate Supabase Storage pre-signed upload URL ────────────────────────
  async getUploadUrl(disputeId: string, userId: string, fileName: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: dispute } = await client
      .from('disputes')
      .select('id, filed_by')
      .eq('id', disputeId)
      .maybeSingle();

    if (!dispute) throw new NotFoundException('Dispute not found.');
    if (dispute.filed_by !== userId) {
      throw new ForbiddenException('Only the dispute filer can upload evidence.');
    }

    const filePath = `disputes/${disputeId}/${Date.now()}_${fileName}`;
    const { data, error } = await client.storage
      .from('evidence')
      .createSignedUploadUrl(filePath);

    if (error) throw new BadRequestException(`Failed to generate upload URL: ${error.message}`);
    return { uploadUrl: data.signedUrl, filePath, token: data.token };
  }
}
