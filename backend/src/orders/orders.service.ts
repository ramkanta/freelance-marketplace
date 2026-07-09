import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase.service';
import { DisputesService } from '../disputes/disputes.service';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { DisputeOrderDto } from './dto/dispute-order.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => DisputesService))
    private readonly disputesService: DisputesService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Derived balance — never a mutable column ───────────────────────────────
  async getWalletBalance(userId: string): Promise<number> {
    const client = this.supabaseService.getAdminClient();

    // Credits: customer_deposit and escrow_refund into customer_wallet
    const { data: credits } = await client
      .from('ledger_entries')
      .select('amount')
      .eq('credit_account', `customer_wallet:${userId}`)
      .in('entry_type', ['customer_deposit', 'escrow_refund']);

    // Debits: escrow_lock out of customer_wallet
    const { data: debits } = await client
      .from('ledger_entries')
      .select('amount')
      .eq('debit_account', `customer_wallet:${userId}`)
      .eq('entry_type', 'escrow_lock');

    const totalCredits = (credits ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalDebits = (debits ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return totalCredits - totalDebits;
  }

  // ─── Step 1: Create Razorpay order for wallet top-up ────────────────────────
  async createWalletTopupOrder(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive.');

    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new BadRequestException('Payment gateway not configured.');
    }

    const amountPaise = Math.round(amount * 100);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to create payment order. Please try again.');
    }

    const rzpOrder = await response.json() as { id: string };

    return {
      razorpayOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      key: razorpayKeyId,
    };
  }

  // ─── Step 2: Verify Razorpay payment signature and credit wallet ─────────────
  async verifyWalletTopup(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) throw new BadRequestException('Payment gateway not configured.');

    // Razorpay signature = HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId, keySecret)
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Payment verification failed. Invalid signature.');
    }

    // Fetch actual amount from Razorpay to prevent tampering
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${keySecret}`).toString('base64')}`,
      },
    });
    const rzpOrder = await orderRes.json() as { amount: number; status: string };

    if (rzpOrder.status !== 'paid') {
      throw new BadRequestException('Payment not completed.');
    }

    const amount = rzpOrder.amount / 100; // convert paise to rupees
    return this.depositToWallet(userId, amount, razorpayPaymentId);
  }

  // ─── Wallet top-up (records ledger entry — called after payment verified) ───
  async depositToWallet(userId: string, amount: number, razorpayPaymentId?: string) {
    const client = this.supabaseService.getAdminClient();

    if (amount <= 0) throw new BadRequestException('Deposit amount must be positive.');

    const { data, error } = await client
      .from('ledger_entries')
      .insert({
        entry_type: 'customer_deposit',
        debit_account: 'razorpay_gateway',
        credit_account: `customer_wallet:${userId}`,
        amount,
        meta: razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {},
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Deposit failed: ${error.message}`);

    const newBalance = await this.getWalletBalance(userId);

    // Fetch user for email — non-fatal
    const { data: user } = await this.supabaseService.getAdminClient()
      .from('users').select('email, name').eq('id', userId).maybeSingle();
    if (user) {
      this.emailService.sendWalletDeposit(user.email, user.name, amount, newBalance).catch(() => {});
    }

    return { balance: newBalance, entry: data };
  }

  // ─── Create order — lock commission rate, create Razorpay order ─────────────
  async createOrder(customerId: string, dto: CreateOrderDto) {
    const client = this.supabaseService.getAdminClient();

    // Fetch service + freelancer commission tier
    const { data: service } = await client
      .from('services')
      .select('id, price, freelancer_id, is_active, freelancer_profiles(user_id, commission_tier)')
      .eq('id', dto.serviceId)
      .eq('is_active', true)
      .maybeSingle();

    if (!service) throw new NotFoundException('Service not found or no longer active.');

    const profile = (service as any).freelancer_profiles;
    const freelancerId: string = profile.user_id;
    const commissionRate: number = Number(profile.commission_tier ?? 15);

    if (freelancerId === customerId) {
      throw new BadRequestException('You cannot book your own service.');
    }

    // Create Razorpay order (amount in paise)
    const amountPaise = Math.round(Number(service.price) * 100);
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    let razorpayOrderId: string | null = null;
    if (razorpayKeyId && razorpayKeySecret) {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({ amount: amountPaise, currency: 'INR' }),
      });
      const rzpOrder = await response.json() as { id?: string };
      razorpayOrderId = rzpOrder.id ?? null;
    }

    const { data: order, error } = await client
      .from('orders')
      .insert({
        service_id: service.id,
        customer_id: customerId,
        freelancer_id: freelancerId,
        amount: service.price,
        commission_rate: commissionRate,
        razorpay_order_id: razorpayOrderId,
        status: 'pending_payment',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Order creation failed: ${error.message}`);

    return {
      order,
      razorpayConfig: {
        key: razorpayKeyId,
        amount: amountPaise,
        currency: 'INR',
        order_id: razorpayOrderId,
      },
    };
  }

  // ─── Wallet checkout (deducts from ledger balance — no Razorpay gateway) ────
  async walletCheckout(orderId: string, customerId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .eq('status', 'pending_payment')
      .maybeSingle();

    if (!order) throw new NotFoundException('Order not found or already paid.');

    const balance = await this.getWalletBalance(customerId);
    if (balance < Number(order.amount)) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: ₹${order.amount}, Available: ₹${balance.toFixed(2)}`,
      );
    }

    // Ledger: customer_wallet → platform_holding
    const { error: ledgerError } = await client.from('ledger_entries').insert({
      order_id: orderId,
      entry_type: 'escrow_lock',
      debit_account: `customer_wallet:${customerId}`,
      credit_account: `platform_holding:${orderId}`,
      amount: order.amount,
      meta: { method: 'wallet' },
    });

    if (ledgerError) throw new BadRequestException(`Ledger write failed: ${ledgerError.message}`);

    const { data: updated, error: updateError } = await client
      .from('orders')
      .update({ status: 'payment_captured', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) throw new BadRequestException(`Order update failed: ${updateError.message}`);

    // Email both parties
    const db = this.supabaseService.getAdminClient();
    const [{ data: customer }, { data: freelancer }, { data: svc }] = await Promise.all([
      db.from('users').select('email, name').eq('id', customerId).maybeSingle(),
      db.from('users').select('email, name').eq('id', updated.freelancer_id).maybeSingle(),
      db.from('services').select('title').eq('id', updated.service_id).maybeSingle(),
    ]);
    const serviceTitle = (svc as any)?.title ?? 'Service';
    const commission = Number(updated.amount) * Number(updated.commission_rate) / 100;
    if (customer) {
      this.emailService.sendOrderConfirmedCustomer(customer.email, customer.name, serviceTitle, Number(updated.amount), updated.id).catch(() => {});
    }
    if (freelancer) {
      this.emailService.sendOrderReceivedFreelancer(freelancer.email, freelancer.name, serviceTitle, Number(updated.amount), commission, updated.id).catch(() => {});
    }

    return updated;
  }

  // ─── List orders for the authenticated user ──────────────────────────────────
  async listOrders(userId: string, role: string) {
    const client = this.supabaseService.getAdminClient();

    const field = role === 'freelancer' ? 'freelancer_id' : 'customer_id';

    const { data, error } = await client
      .from('orders')
      .select('*, services(title, category)')
      .eq(field, userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(`Failed to fetch orders: ${error.message}`);
    return data;
  }

  // ─── Single order detail ─────────────────────────────────────────────────────
  async getOrder(orderId: string, userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: order } = await client
      .from('orders')
      .select('*, services(title, category, description)')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) throw new NotFoundException('Order not found.');

    if (order.customer_id !== userId && order.freelancer_id !== userId) {
      throw new ForbiddenException('You do not have access to this order.');
    }

    const { data: ledger } = await client
      .from('ledger_entries')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    return { ...order, ledgerEntries: ledger ?? [] };
  }

  // ─── Freelancer marks order delivered ───────────────────────────────────────
  async markDelivered(orderId: string, freelancerId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('freelancer_id', freelancerId)
      .eq('status', 'payment_captured')
      .maybeSingle();

    if (!order) throw new NotFoundException('Order not found or not in a deliverable state.');

    const { data, error } = await client
      .from('orders')
      .update({ status: 'service_delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Failed to update order: ${error.message}`);

    // Notify customer that delivery has been marked
    const { data: orderRow } = await this.supabaseService.getAdminClient()
      .from('orders').select('customer_id, service_id').eq('id', orderId).maybeSingle();
    if (orderRow) {
      const [{ data: cust }, { data: svcRow }] = await Promise.all([
        this.supabaseService.getAdminClient().from('users').select('email, name').eq('id', orderRow.customer_id).maybeSingle(),
        this.supabaseService.getAdminClient().from('services').select('title').eq('id', orderRow.service_id).maybeSingle(),
      ]);
      if (cust) {
        this.emailService.sendDeliveryMarked(cust.email, cust.name, (svcRow as any)?.title ?? 'Service', orderId).catch(() => {});
      }
    }

    return data;
  }

  // ─── Customer confirms delivery — triggers payout ledger entries ─────────────
  async confirmDelivery(orderId: string, customerId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .eq('status', 'service_delivered')
      .maybeSingle();

    if (!order) throw new NotFoundException('Order not found or not yet delivered.');

    const totalAmount = Number(order.amount);
    const commissionRate = Number(order.commission_rate);
    const platformCut = parseFloat(((totalAmount * commissionRate) / 100).toFixed(2));
    const freelancerCut = parseFloat((totalAmount - platformCut).toFixed(2));

    // Ledger: platform_holding → freelancer_wallet + platform_revenue
    const { error: ledgerError } = await client.from('ledger_entries').insert([
      {
        order_id: orderId,
        entry_type: 'escrow_release',
        debit_account: `platform_holding:${orderId}`,
        credit_account: `freelancer_wallet:${order.freelancer_id}`,
        amount: freelancerCut,
        meta: { commission_rate: commissionRate },
      },
      {
        order_id: orderId,
        entry_type: 'platform_commission',
        debit_account: `platform_holding:${orderId}`,
        credit_account: 'platform_revenue',
        amount: platformCut,
        meta: { commission_rate: commissionRate },
      },
    ]);

    if (ledgerError) throw new BadRequestException(`Ledger write failed: ${ledgerError.message}`);

    const { data, error } = await client
      .from('orders')
      .update({ status: 'payout_released', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Order update failed: ${error.message}`);

    // Email both parties about payment release
    const db2 = this.supabaseService.getAdminClient();
    const [{ data: cust2 }, { data: free2 }, { data: svc2 }] = await Promise.all([
      db2.from('users').select('email, name').eq('id', customerId).maybeSingle(),
      db2.from('users').select('email, name').eq('id', data.freelancer_id).maybeSingle(),
      db2.from('services').select('title').eq('id', data.service_id).maybeSingle(),
    ]);
    const title2 = (svc2 as any)?.title ?? 'Service';
    if (cust2) {
      this.emailService.sendDeliveryConfirmedCustomer(cust2.email, cust2.name, title2, orderId).catch(() => {});
    }
    if (free2) {
      this.emailService.sendDeliveryConfirmedFreelancer(free2.email, free2.name, title2, freelancerCut, orderId).catch(() => {});
    }

    return { order: data, freelancerCut, platformCut };
  }

  // ─── Customer files a dispute — freezes escrow ───────────────────────────────
  async fileDispute(orderId: string, customerId: string, dto: DisputeOrderDto) {
    const client = this.supabaseService.getAdminClient();

    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .in('status', ['payment_captured', 'service_delivered'])
      .maybeSingle();

    if (!order) {
      throw new NotFoundException('Order not found or not in a disputable state.');
    }

    const { data, error } = await client
      .from('orders')
      .update({ status: 'disputed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw new BadRequestException(`Failed to dispute order: ${error.message}`);

    // Create the disputes record
    const dispute = await this.disputesService.openDispute(orderId, customerId, dto.reason);

    // Email both parties about dispute
    const db3 = this.supabaseService.getAdminClient();
    const [{ data: cust3 }, { data: free3 }, { data: svc3 }] = await Promise.all([
      db3.from('users').select('email, name').eq('id', customerId).maybeSingle(),
      db3.from('users').select('email, name').eq('id', data.freelancer_id).maybeSingle(),
      db3.from('services').select('title').eq('id', data.service_id).maybeSingle(),
    ]);
    const title3 = (svc3 as any)?.title ?? 'Service';
    if (cust3) {
      this.emailService.sendDisputeFiledCustomer(cust3.email, cust3.name, title3, orderId).catch(() => {});
    }
    if (free3) {
      this.emailService.sendDisputeFiledFreelancer(free3.email, free3.name, title3, dto.reason, orderId).catch(() => {});
    }

    return { order: data, dispute, message: 'Dispute filed. Escrow is frozen pending mediation.' };
  }

  // ─── Razorpay webhook processor ──────────────────────────────────────────────
  async handleRazorpayWebhook(
    body: Record<string, unknown>,
    signature: string,
    rawBody: string,
  ) {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      if (expected !== signature) {
        throw new ForbiddenException('Invalid webhook signature.');
      }
    }

    const eventId = body.id as string;
    const eventType = body.event as string;

    const client = this.supabaseService.getAdminClient();

    // Deduplicate — ignore already-processed events
    const { error: dedupError } = await client.from('webhook_events').insert({
      razorpay_event_id: eventId,
      event_type: eventType,
    });
    if (dedupError) return { status: 'duplicate', eventId };

    if (eventType === 'payment.captured') {
      const payment = (body.payload as any)?.payment?.entity;
      const razorpayOrderId: string = payment?.order_id;
      const razorpayPaymentId: string = payment?.id;
      const amountPaise: number = payment?.amount;

      const { data: order } = await client
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .eq('status', 'pending_payment')
        .maybeSingle();

      if (order) {
        const amount = amountPaise / 100;

        await client.from('ledger_entries').insert({
          order_id: order.id,
          entry_type: 'escrow_lock',
          debit_account: 'razorpay_gateway',
          credit_account: `platform_holding:${order.id}`,
          amount,
          meta: { razorpay_payment_id: razorpayPaymentId },
        });

        await client
          .from('orders')
          .update({
            status: 'payment_captured',
            razorpay_payment_id: razorpayPaymentId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }
    }

    return { status: 'processed', eventType };
  }
}
