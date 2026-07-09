import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { templates } from './email.templates';

interface SendParams {
  to: { email: string; name: string };
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  private async send({ to, subject, html }: SendParams): Promise<void> {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL');
    const senderName = this.config.get<string>('BREVO_SENDER_NAME') || 'Servify';

    if (!apiKey || !senderEmail) {
      this.logger.warn(`Email skipped (BREVO_API_KEY or BREVO_SENDER_EMAIL not set): ${subject}`);
      return;
    }

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to.email, name: to.name }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Brevo send failed [${res.status}]: ${err}`);
      } else {
        this.logger.log(`Email sent → ${to.email} | ${subject}`);
      }
    } catch (err) {
      // Never let email failure crash the main request
      this.logger.error(`Brevo network error: ${err}`);
    }
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async sendWelcome(to: string, name: string, role: string) {
    await this.send({
      to: { email: to, name },
      subject: `Welcome to Servify, ${name}!`,
      html: templates.welcome(name, role),
    });
  }

  async sendLoginAlert(to: string, name: string) {
    await this.send({
      to: { email: to, name },
      subject: 'New sign-in to your Servify account',
      html: templates.loginAlert(name),
    });
  }

  // ─── Wallet ──────────────────────────────────────────────────────────────

  async sendWalletDeposit(to: string, name: string, depositAmount: number, newBalance: number) {
    await this.send({
      to: { email: to, name },
      subject: `₹${Number(depositAmount).toLocaleString('en-IN')} added to your Servify wallet`,
      html: templates.walletDeposit(name, depositAmount, newBalance),
    });
  }

  // ─── Orders ──────────────────────────────────────────────────────────────

  async sendOrderConfirmedCustomer(to: string, name: string, serviceTitle: string, orderAmount: number, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: `Order confirmed — ${serviceTitle}`,
      html: templates.orderConfirmedCustomer(name, serviceTitle, orderAmount, orderId),
    });
  }

  async sendOrderReceivedFreelancer(to: string, name: string, serviceTitle: string, orderAmount: number, commission: number, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: `New order received — ${serviceTitle}`,
      html: templates.orderReceivedFreelancer(name, serviceTitle, orderAmount, commission, orderId),
    });
  }

  async sendDeliveryMarked(to: string, name: string, serviceTitle: string, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: `Your order has been delivered — ${serviceTitle}`,
      html: templates.deliveryMarked(name, serviceTitle, orderId),
    });
  }

  async sendDeliveryConfirmedFreelancer(to: string, name: string, serviceTitle: string, netAmount: number, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: `Payment released — ₹${Number(netAmount).toLocaleString('en-IN')} in your wallet`,
      html: templates.deliveryConfirmedFreelancer(name, serviceTitle, netAmount, orderId),
    });
  }

  async sendDeliveryConfirmedCustomer(to: string, name: string, serviceTitle: string, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: `Order complete — ${serviceTitle}`,
      html: templates.deliveryConfirmedCustomer(name, serviceTitle, orderId),
    });
  }

  // ─── Disputes ────────────────────────────────────────────────────────────

  async sendDisputeFiledFreelancer(to: string, name: string, serviceTitle: string, reason: string, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: `Dispute raised on your order — ${serviceTitle}`,
      html: templates.disputeFiledFreelancer(name, serviceTitle, reason, orderId),
    });
  }

  async sendDisputeFiledCustomer(to: string, name: string, serviceTitle: string, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Your dispute has been filed — we will be in touch',
      html: templates.disputeFiledCustomer(name, serviceTitle, orderId),
    });
  }

  async sendDisputeUnderReview(to: string, name: string, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Your dispute is under review',
      html: templates.disputeUnderReview(name, orderId),
    });
  }

  async sendDisputeResolvedRefund(to: string, name: string, refundAmount: number, orderId: string, note: string) {
    await this.send({
      to: { email: to, name },
      subject: `Dispute resolved — ₹${Number(refundAmount).toLocaleString('en-IN')} refunded to your wallet`,
      html: templates.disputeResolvedRefund(name, refundAmount, orderId, note),
    });
  }

  async sendDisputeResolvedRelease(to: string, name: string, releaseAmount: number, orderId: string, note: string) {
    await this.send({
      to: { email: to, name },
      subject: `Dispute resolved — ₹${Number(releaseAmount).toLocaleString('en-IN')} released to your wallet`,
      html: templates.disputeResolvedRelease(name, releaseAmount, orderId, note),
    });
  }

  async sendDisputeResolvedSplit(to: string, name: string, yourAmount: number, orderId: string, note: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Dispute resolved — split decision',
      html: templates.disputeResolvedSplit(name, yourAmount, orderId, note),
    });
  }

  async sendDisputeEscalated(to: string, name: string, orderId: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Your dispute has been escalated',
      html: templates.disputeEscalated(name, orderId),
    });
  }

  // ─── Freelancer ───────────────────────────────────────────────────────────

  async sendWithdrawalInitiated(to: string, name: string, withdrawAmount: number) {
    await this.send({
      to: { email: to, name },
      subject: `Withdrawal of ₹${Number(withdrawAmount).toLocaleString('en-IN')} initiated`,
      html: templates.withdrawalInitiated(name, withdrawAmount),
    });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async sendAccountBanned(to: string, name: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Your Servify account has been suspended',
      html: templates.accountBanned(name),
    });
  }

  async sendAccountUnbanned(to: string, name: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Your Servify account has been reinstated',
      html: templates.accountUnbanned(name),
    });
  }

  async sendPasswordReset(to: string, name: string, otp: string) {
    await this.send({
      to: { email: to, name },
      subject: `${otp} is your Servify password reset code`,
      html: templates.passwordReset(name, otp),
    });
  }

  async sendRoleChanged(to: string, name: string, newRole: string) {
    await this.send({
      to: { email: to, name },
      subject: 'Your Servify account role has been updated',
      html: templates.roleChanged(name, newRole),
    });
  }
}
