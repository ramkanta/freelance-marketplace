import React from 'react';

export const metadata = { title: 'Privacy Policy — Servify' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: July 8, 2026</p>
        </div>

        {[
          {
            title: '1. Information We Collect',
            body: `We collect information you provide directly when you create an account (name, email address, password), set up a freelancer profile (bio, category, bank details for payouts), or communicate through the platform. We also collect transaction data including order details, escrow ledger entries, and payout records. Usage data such as pages visited and features used is collected automatically.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `We use your information to operate the Servify marketplace, process escrow payments and RazorpayX payouts, verify your identity and prevent fraud, send transactional notifications (order updates, payout confirmations), resolve disputes through our mediation process, and improve our platform.`,
          },
          {
            title: '3. Escrow & Financial Data',
            body: `All financial transactions on Servify are recorded in an immutable double-entry ledger. Bank account details and KYC information collected for payout purposes are transmitted securely to RazorpayX and are subject to their privacy policy. We do not store raw card numbers or full bank credentials on our servers.`,
          },
          {
            title: '4. Data Sharing',
            body: `We do not sell your personal data. We share data only with: RazorpayX (for payment processing and freelancer payouts), Supabase (our database infrastructure provider), and law enforcement when legally required. Freelancer public profile information (name, category, rating, bio) is visible to all users.`,
          },
          {
            title: '5. Data Retention',
            body: `Account data is retained for as long as your account is active. Financial records and ledger entries are retained for 7 years to comply with financial regulations. You may request deletion of your account and personal data by contacting support, subject to legal retention requirements.`,
          },
          {
            title: '6. Security',
            body: `We use industry-standard security measures including bcrypt password hashing, JWT access tokens with short expiry, rotating refresh tokens, and HTTPS-only communication. Escrow funds are protected by our double-entry ledger system which prevents unauthorised modifications.`,
          },
          {
            title: '7. Your Rights',
            body: `You have the right to access, correct, or delete your personal data. You may also request a copy of your data in a portable format. To exercise these rights, contact us at privacy@servify.in.`,
          },
          {
            title: '8. Contact',
            body: `For privacy-related questions or concerns, contact our Data Protection team at privacy@servify.in.`,
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
