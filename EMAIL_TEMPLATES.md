# Servify — Email Templates Tracking

Tracks every transactional email sent by the platform via Brevo. Source files:
- Templates: [`backend/src/email/email.templates.ts`](backend/src/email/email.templates.ts)
- Send methods: [`backend/src/email/email.service.ts`](backend/src/email/email.service.ts)
- Env config: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `FRONTEND_URL` in `backend/.env`

**Status legend:** ✅ done · 🟡 in progress · ⬜ not started

---

## Auth

- [x] ✅ **Welcome email** (signup) — `sendWelcome` → `templates.welcome`. Sent from `auth.service.ts` on successful signup. Role-aware CTA links to the correct dashboard.
- [x] ✅ **Login alert** — `sendLoginAlert` → `templates.loginAlert`. Sent from `auth.service.ts` on every successful login. Security notice, no CTA (intentional).
- [x] ✅ **Password reset OTP** (forgot password) — `sendPasswordReset` → `templates.passwordReset`. Sent from `auth.service.ts` `forgotPassword()`. 6-digit OTP, 15-min expiry, now includes a direct "Enter Reset Code" link pre-filled with the user's email.
- [x] ✅ **Password changed confirmation** (NEW) — `sendPasswordChanged` → `templates.passwordChanged`. Sent from `auth.service.ts` `resetPassword()` after a successful reset. Security notice matching the login-alert pattern; warns the user if they didn't make the change.

## Wallet

- [x] ✅ **Wallet top-up confirmation** — `sendWalletDeposit` → `templates.walletDeposit`. Sent from `orders.service.ts` `depositToWallet()` after a verified Razorpay payment credits the wallet.

## Orders

- [x] ✅ **Order confirmed (customer)** — `sendOrderConfirmedCustomer` → `templates.orderConfirmedCustomer`. Sent on wallet checkout — funds locked in escrow.
- [x] ✅ **New order received (freelancer)** — `sendOrderReceivedFreelancer` → `templates.orderReceivedFreelancer`. Sent on wallet checkout — shows freelancer's net amount after commission.
- [x] ✅ **Delivery marked (customer)** — `sendDeliveryMarked` → `templates.deliveryMarked`. Sent when freelancer marks the order delivered.
- [x] ✅ **Payment released (freelancer)** — `sendDeliveryConfirmedFreelancer` → `templates.deliveryConfirmedFreelancer`. Sent when customer approves delivery — escrow released to freelancer wallet.
- [x] ✅ **Order complete (customer)** — `sendDeliveryConfirmedCustomer` → `templates.deliveryConfirmedCustomer`. Sent alongside the above; invites the customer to leave a review.

## Disputes

- [x] ✅ **Dispute raised (freelancer)** — `sendDisputeFiledFreelancer` → `templates.disputeFiledFreelancer`. Sent when a customer files a dispute.
- [x] ✅ **Dispute filed confirmation (customer)** — `sendDisputeFiledCustomer` → `templates.disputeFiledCustomer`. Sent to the filer confirming receipt.
- [x] ✅ **Dispute under review** — `sendDisputeUnderReview` → `templates.disputeUnderReview`. Sent to both parties when an admin assigns a support agent.
- [x] ✅ **Dispute resolved — refund** — `sendDisputeResolvedRefund` → `templates.disputeResolvedRefund`. Sent to the customer (and a `0`-amount release notice to the freelancer) on full refund.
- [x] ✅ **Dispute resolved — release** — `sendDisputeResolvedRelease` → `templates.disputeResolvedRelease`. Sent to the freelancer (and a `0`-amount refund notice to the customer) on full release.
- [x] ✅ **Dispute resolved — split** — `sendDisputeResolvedSplit` → `templates.disputeResolvedSplit`. Sent to both parties with their respective share. Now role-aware — the "View Wallet" CTA links to the correct dashboard per recipient (customer vs freelancer).
- [x] ✅ **Dispute escalated** — `sendDisputeEscalated` → `templates.disputeEscalated`. Sent to both parties when a support agent escalates to admin review.

## Freelancer payouts

- [x] ✅ **Withdrawal initiated** — `sendWithdrawalInitiated` → `templates.withdrawalInitiated`. Sent from `freelancers.service.ts` `withdrawEarnings()` once the RazorpayX payout is reserved.

## Admin actions

- [x] ✅ **Account suspended** — `sendAccountBanned` → `templates.accountBanned`. Sent from `admin/users.service.ts` `banUser()`.
- [x] ✅ **Account reinstated** — `sendAccountUnbanned` → `templates.accountUnbanned`. Sent from `admin/users.service.ts` `unbanUser()`.
- [x] ✅ **Role changed** — `sendRoleChanged` → `templates.roleChanged`. Sent from `admin/users.service.ts` `changeRole()`.

---

## Fixes applied in this pass

- [x] Added `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` to `backend/.env` (live values) and documented in `backend/.env.example`.
- [x] Added `FRONTEND_URL` env var (`backend/.env` + `.env.example`) — the base URL every email CTA link is built from.
- [x] **Fixed 18 dead `href="#"` CTA buttons** across every template — each now links to a real, correct frontend route:
  - Dashboard links are **role-aware** (`/customer/dashboard` vs `/freelancer/dashboard`) via a `dashboardLink(role)` helper.
  - Order-related emails link to `/orders/{orderId}` via an `orderLink(orderId)` helper.
  - Footer "Privacy Policy" / "Terms of Service" links now point to the real `/privacy` and `/terms` pages instead of `#`.
- [x] Added the missing **password-changed confirmation email** — a standard security-notification pattern that was present for login but missing for password reset.
- [x] `passwordReset` template now also embeds the user's email in its "Enter Reset Code" CTA link so clicking it pre-fills the reset-password form.
- [x] `disputeResolvedSplit` is now role-aware (previously both customer and freelancer got a link to `#` — now each gets their own correct dashboard link).

## Verified already working (no changes needed)

- [x] All 20 pre-existing email service methods are called from the correct place in the codebase (signup, login, forgot-password, wallet top-up, order lifecycle, dispute lifecycle, withdrawal, admin actions) — confirmed via full codebase grep before making changes.
- [x] All emails are fire-and-forget (`.catch(() => {})`) — a failed send never blocks or crashes the underlying money/auth operation.
- [x] `EmailService` gracefully no-ops (with a warning log) if `BREVO_API_KEY`/`BREVO_SENDER_EMAIL` aren't configured, rather than throwing.
- [x] Every template shares a consistent branded header/footer, uses real ₹ currency formatting (`en-IN` locale), and has a clear single CTA per email.

## Not started / intentionally out of scope

- [ ] No review-received email (freelancer notified when a customer leaves a review) — not part of the original flow list; would need a new hook in `reviews.service.ts` if wanted.
- [ ] No "order about to auto-complete" reminder (e.g. day 12 of the 14-day dispute window mentioned in `deliveryMarked`) — would require a scheduled job, out of scope for template wiring.
- [ ] Email previews/testing UI — no dev route currently renders these templates in-browser for visual QA; would need a small `/dev/email-preview` admin-only route if desired later.
