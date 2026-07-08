import React from 'react';

export const metadata = { title: 'Cookie Policy — Servify' };

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cookie Policy</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: July 8, 2026</p>
        </div>

        {[
          {
            title: '1. What Are Cookies',
            body: `Cookies are small text files stored on your device by your browser. Servify uses cookies to keep you logged in, remember your preferences, and ensure the platform works securely.`,
          },
          {
            title: '2. Cookies We Use',
            body: `We use the following cookies: accessToken (1-day session cookie storing your JWT access token, required for authentication), refreshToken (30-day persistent cookie used to silently renew your session without requiring you to log in again). Both cookies are set with Secure and SameSite=Strict flags to prevent cross-site access.`,
          },
          {
            title: '3. Essential Cookies',
            body: `The authentication cookies listed above are strictly necessary for Servify to function. Without them, you cannot log in, access your dashboard, or make bookings. These cookies cannot be opted out of while using the platform.`,
          },
          {
            title: '4. No Tracking or Advertising Cookies',
            body: `Servify does not use third-party advertising cookies, cross-site tracking pixels, or analytics cookies that share your data with external parties. We do not serve targeted advertisements.`,
          },
          {
            title: '5. Managing Cookies',
            body: `You can clear cookies at any time through your browser settings. Clearing the accessToken or refreshToken cookies will log you out of Servify. Most browsers allow you to block cookies, but doing so will prevent you from using authenticated features of the platform.`,
          },
          {
            title: '6. Contact',
            body: `For questions about our use of cookies, contact privacy@servify.in.`,
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
