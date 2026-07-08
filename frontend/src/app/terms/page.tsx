import React from 'react';

export const metadata = { title: 'Terms of Service — Servify' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: July 8, 2026</p>
        </div>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By creating an account or using the Servify platform, you agree to these Terms of Service. If you do not agree, you may not use Servify. These terms apply to all users including customers, freelancers, and support staff.`,
          },
          {
            title: '2. The Servify Platform',
            body: `Servify is a freelance marketplace that connects customers with freelancers. All payments are held in escrow and released only upon customer approval or dispute resolution. Servify acts as a neutral intermediary and is not a party to any service agreement between customers and freelancers.`,
          },
          {
            title: '3. Escrow & Payments',
            body: `When a customer books a service, funds are locked in Servify's escrow vault. Funds are released to the freelancer only when the customer approves delivery, or when a dispute is resolved in the freelancer's favour. Servify deducts a platform commission from each transaction before releasing funds. Commission rates are displayed at the time of booking.`,
          },
          {
            title: '4. Disputes',
            body: `Either party may raise a dispute for orders in "In Progress" or "Delivered" status. Disputes are reviewed by Servify's support team, who may request evidence from both parties. Servify's resolution decision is final and binding. Funds remain frozen in escrow during dispute review.`,
          },
          {
            title: '5. Freelancer Obligations',
            body: `Freelancers must deliver services as described in their listings, within the stated delivery time. Freelancers must complete KYC verification to receive payouts. Misrepresentation of skills or services is grounds for account suspension.`,
          },
          {
            title: '6. Customer Obligations',
            body: `Customers must ensure sufficient wallet balance before booking. Customers must review and respond to deliveries within 14 days; after this period, orders may be auto-completed. Customers may not attempt to bypass the escrow system.`,
          },
          {
            title: '7. Prohibited Conduct',
            body: `Users may not: circumvent the escrow system by transacting outside Servify, create fake accounts or reviews, engage in harassment or abuse, upload illegal content, or attempt to compromise platform security. Violations will result in immediate account suspension and possible legal action.`,
          },
          {
            title: '8. Account Termination',
            body: `Servify reserves the right to suspend or terminate accounts that violate these terms, at our sole discretion. Funds in escrow at the time of termination will be handled in accordance with our dispute resolution process.`,
          },
          {
            title: '9. Limitation of Liability',
            body: `Servify is not liable for the quality of services delivered by freelancers, losses arising from platform downtime, or indirect or consequential damages. Our maximum liability to any user is limited to the amount held in escrow for the relevant order.`,
          },
          {
            title: '10. Contact',
            body: `For questions about these terms, contact legal@servify.in.`,
          },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
