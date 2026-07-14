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

  // ─── Get the dispute for a given order — customer/freelancer on that order only ──
  // Previously there was no way for the customer who filed a dispute (or the
  // freelancer on that order) to look up the dispute record at all — every
  // read endpoint was admin/support-only, which made the evidence-upload flow
  // unreachable since it needs the dispute id.
  async getDisputeByOrder(orderId: string, userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('disputes')
      .select('*, orders!inner(customer_id, freelancer_id)')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('No dispute found for this order.');

    const order = (data as any).orders;
    if (order.customer_id !== userId && order.freelancer_id !== userId) {
      throw new ForbiddenException('You do not have access to this dispute.');
    }

    delete (data as any).orders;
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
  // Atomic: locking, escrow-funded check (H5), split-percentage math (H4-safe —
  // the freelancer/customer "other side" is always computed by subtraction, so
  // the three debits always sum exactly to the locked amount), the ledger
  // writes, and both status transitions happen inside resolve_order_dispute()
  // (C5) — two concurrent resolve calls can never both disburse escrow.
  async resolveDispute(disputeId: string, dto: ResolveDisputeDto, resolvedBy: string, role: string) {
    const client = this.supabaseService.getAdminClient();

    // H3: support agents may only resolve disputes assigned to them; admins can
    // resolve any dispute.
    const { data: disputeRow } = await client
      .from('disputes')
      .select('id, assigned_to, status')
      .eq('id', disputeId)
      .maybeSingle();

    if (!disputeRow) throw new NotFoundException('Dispute not found or already resolved.');
    if (role === 'support' && disputeRow.assigned_to !== resolvedBy) {
      throw new ForbiddenException('This dispute is not assigned to you.');
    }

    const { data: rpcResult, error: rpcError } = await client
      .rpc('resolve_order_dispute', {
        p_dispute_id: disputeId,
        p_resolution: dto.resolution,
        p_customer_pct: dto.customerRefundPercent ?? 50,
        p_resolution_note: dto.resolutionNote ?? null,
        p_resolved_by: resolvedBy,
      })
      .single();

    if (rpcError) {
      const msg = rpcError.message ?? '';
      if (msg.includes('dispute_not_found_or_already_resolved')) {
        throw new NotFoundException('Dispute not found or already resolved.');
      }
      if (msg.includes('escrow_not_fully_funded')) {
        throw new BadRequestException('Escrow for this order is not fully funded; cannot resolve.');
      }
      throw new BadRequestException(`Failed to resolve dispute: ${msg}`);
    }

    const { order_id, customer_refund, freelancer_net, platform_cut } = rpcResult as {
      order_id: string;
      customer_refund: number;
      freelancer_net: number;
      platform_cut: number;
      updated_order: Record<string, any>;
    };
    const orderId = order_id;

    const { data: resolved, error: fetchErr } = await client
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();
    if (fetchErr) throw new BadRequestException(`Failed to load resolved dispute: ${fetchErr.message}`);

    const { data: orderRowForEmail } = await client
      .from('orders')
      .select('customer_id, freelancer_id')
      .eq('id', orderId)
      .maybeSingle();
    const order = { ...orderRowForEmail, id: orderId };

    // Email both parties about resolution — using the exact amounts the RPC
    // actually wrote to the ledger, not a re-derived calculation (avoids the
    // "email says X, ledger says Y" drift the old independent-rounding code had).
    const db2 = this.supabaseService.getAdminClient();
    const [{ data: cust2 }, { data: free2 }] = await Promise.all([
      db2.from('users').select('email, name').eq('id', order.customer_id).maybeSingle(),
      db2.from('users').select('email, name').eq('id', order.freelancer_id).maybeSingle(),
    ]);
    const note = dto.resolutionNote ?? '';

    if (dto.resolution === 'resolved_refund') {
      if (cust2) this.emailService.sendDisputeResolvedRefund(cust2.email, cust2.name, Number(customer_refund), orderId, note).catch(() => {});
      if (free2) this.emailService.sendDisputeResolvedRelease(free2.email, free2.name, 0, orderId, note).catch(() => {});
    } else if (dto.resolution === 'resolved_release') {
      if (free2) this.emailService.sendDisputeResolvedRelease(free2.email, free2.name, Number(freelancer_net), orderId, note).catch(() => {});
      if (cust2) this.emailService.sendDisputeResolvedRefund(cust2.email, cust2.name, 0, orderId, note).catch(() => {});
    } else if (dto.resolution === 'resolved_split') {
      if (cust2) this.emailService.sendDisputeResolvedSplit(cust2.email, cust2.name, Number(customer_refund), orderId, note, 'customer').catch(() => {});
      if (free2) this.emailService.sendDisputeResolvedSplit(free2.email, free2.name, Number(freelancer_net), orderId, note, 'freelancer').catch(() => {});
    }

    return { dispute: resolved, orderId, customerRefund: Number(customer_refund), freelancerNet: Number(freelancer_net), platformCut: Number(platform_cut) };
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
