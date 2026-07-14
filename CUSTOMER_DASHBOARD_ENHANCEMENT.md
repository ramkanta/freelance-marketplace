# Servify — Customer Experience Deep-Dive & Enhancement Plan

> **Deep research audit** of the full customer-facing experience: dashboard, profile, services discovery, booking/checkout flow, and order tracking — triggered by live screenshots showing a sparse dashboard, a broken dark-mode profile page, and generic-looking service cards.
> **Findings-only — nothing in this document has been fixed.** Each item is a checkbox task for future work.

**Date:** 2026-07-14
**Method:** 4 parallel deep-research passes across the full customer journey (dashboard/profile → services browsing → checkout → order tracking), verified against actual code with file:line references, cross-checked against the live screenshots provided.

---

## Executive Summary

| Area | Grade | Headline |
|---|---|---|
| Dashboard layout | 🔴 D | 1/3 of the main grid is a near-empty wallet-top-up form; no charts, no activity feed, no spending summary — matches the "empty whitespace" seen in the screenshot |
| Profile page | 🔴 F | **Confirmed bug**: hardcoded dark theme, ignores the light/dark toggle entirely — the only page in the app that does this |
| Services discovery | 🔴 F | **No avatar/photo/portfolio-image column exists anywhere in the database** — the "generic-looking cards" in the screenshot are a structural data-model gap, not a rendering bug |
| Checkout / booking flow | 🔴 F | **No dedicated checkout page** — booking logic is copy-pasted across 3 different files; "complete via Razorpay" is dead text with no working code path; cancelled/abandoned orders live in the database forever with no cancel endpoint |
| Order tracking | 🔴 F | "Delivery" is a bare status flag with no way to see the actual work product; no messaging channel once escrow is locked; blind approve-or-dispute with no revision option; raw `debit_account → credit_account` UUID strings shown to customers |
| Navigation | 🟡 C | No shared layout/sidebar connecting Dashboard ↔ Profile ↔ Orders ↔ Wallet — everything is crammed into two disconnected pages |

**The single most consequential finding:** payment happens *before* any scoping conversation, and the platform provides **no messaging system at all** for that conversation to happen afterward either. Combined with "delivery" being a pure status flag (no file/link upload), a customer's entire experience after paying is: wait silently → get a status flip → blindly approve or escalate to a formal dispute. There is no middle ground.

---

## 1. Customer Dashboard — Layout & Missing Widgets

**File:** `frontend/src/app/customer/dashboard/page.tsx`

### Layout & visual hierarchy
- [ ] **HIGH** — The main content grid (`grid-cols-1 lg:grid-cols-3`, line 242) gives Wallet Deposits a full 1/3-width column containing only a label, one number input, and one button (lines 366-402) — nothing else renders in that column. Since the orders panel next to it is always taller once there's more than one order, this produces genuine dead/empty space at the bottom of the wallet column — exactly what's visible in the screenshot. Gold standard: a compact wallet widget (balance + "Add Funds" button opening a modal) freeing the reclaimed space for deposit history / spending chart.
- [ ] **MEDIUM** — Stat cards (lines 202-239) are three structurally identical boxes — same shell, same icon-in-header pattern, no trend/sparkline, no severity color-coding (the Disputes card uses the same indigo icon as Wallet even though a non-zero dispute count should read as urgent/amber-red).
- [ ] **MEDIUM** — Responsive grid has only a single breakpoint jump: `grid-cols-1 lg:grid-cols-3` (line 242) means tablet widths (768–1023px) render everything full-width stacked, so the near-empty wallet card looks even more awkward sitting full-width alone between two content-heavy panels. No `md:` intermediate treatment exists.

### Missing widgets (none of these exist anywhere in the dashboard)
- [ ] **HIGH** — Spending summary / chart. No chart library is even imported; `orders` data (already fetched) would trivially support a status-breakdown donut or spend-over-time line, but only two flat derived counts are computed (`activeOrders.length`, `disputedOrders.length`).
- [ ] **HIGH** — Recent activity / notification timeline (also flagged in §5 — no notification system exists at all in the product).
- [ ] **MEDIUM** — Saved/favorite freelancers or a "book again" affordance. `orders` already contains `freelancer_id`, but it's never surfaced as an actionable rebook button.
- [ ] **MEDIUM** — Deposit/transaction history preview. Confirmed: `walletApi` in `api.orders.ts` only exposes `balance`, `createTopupOrder`, `verifyTopup` — there is no `history`/`transactions` endpoint at all, so even the data plumbing for "recent deposits" doesn't exist yet. *(Backend gap, not just frontend.)*
- [ ] **LOW** — Upcoming delivery countdown on the dashboard (blocked on the same `delivery_days`-not-tracked-post-purchase gap detailed in §4).

### "Your Bookings" list quality
- [ ] **HIGH** — No status filter, search, sort, or pagination — `ordersApi.list()` has no page/limit params on the backend either, so this doesn't scale past a handful of orders (same root gap flagged in the earlier `DASHBOARD_GOLD_STANDARD_TASKS.md` audit — still unfixed).
- [ ] **MEDIUM** — No freelancer name/avatar on each order row — only title, status badge, date, amount, category (lines 271-288).
- [ ] **LOW** — Empty state (lines 260-263) is plain text with no CTA button, even though a "Find Services" button already exists elsewhere on the same page and could be reused.

---

## 2. Customer Profile — Confirmed Dark-Mode Bug + Missing Account Features

**File:** `frontend/src/app/customer/profile/page.tsx`

### The dark-theme bug (confirmed root cause)
- [ ] **HIGH — Fix immediately, it's a one-file, well-understood bug.** `customer/profile/page.tsx` uses **zero `dark:` variant classes anywhere in the file** (verified by grep — zero matches) — every color is a hardcoded dark literal: `bg-slate-950` (lines 70, 77), `bg-slate-900 border-slate-800` (line 91), `text-white`/`text-slate-400` with no light equivalents (lines 100-101, 115-148, 170). This is why the screenshot shows a light navbar sitting above a permanently-dark profile card — `ThemeProvider.tsx` and the toggle work correctly everywhere else in the app (confirmed: `customer/dashboard/page.tsx` line 171 does this correctly — `bg-white dark:bg-slate-950 ... transition-colors` — that exact pattern is the fix, just apply it to every hardcoded class in the profile file).

### Missing account-settings features (vs. a real "Account Settings" page)
- [ ] **MEDIUM** — Profile photo upload. Avatar is currently a generated initial-letter circle only, no `<input type="file">`, no upload endpoint. *(Blocked on the same missing avatar/photo column flagged in §3 — a schema change, not just a frontend one.)*
- [ ] **MEDIUM** — In-page password change (currently just an external link to `/forgot-password` — no current-password-confirmation change flow while already logged in).
- [ ] **MEDIUM** — Notification preferences (email/SMS toggles) — moot until a notification system exists at all (§5), but flagging for the roadmap.
- [ ] **LOW** — Connected/saved payment methods list — notable gap given the app already integrates Razorpay for wallet top-ups but has no payment-method management surface.
- [ ] **LOW** — Two-factor authentication toggle, session management (active devices / logout-all), delete/deactivate account option — none exist.
- [ ] **LOW** — Billing/order history deep link from the profile page (currently only a generic "Back to dashboard" link).

---

## 3. Services Discovery — Cards, Search/Filter, and the Root Data-Model Gap

**Files:** `frontend/src/app/services/page.tsx`, `frontend/src/app/services/[id]/page.tsx`, `frontend/src/app/freelancers/[id]/page.tsx`

### The structural root cause (read this first)
A repo-wide grep across every migration confirms: **there is no `avatar`/`photo`/`thumbnail`/`image` column anywhere in the schema** — not on `users`, not on `freelancer_profiles`, not on `services`. There is also no skills/tags array, no review-count or orders-completed counter, and no response-time field. This is the actual reason the service cards in the screenshot look generic and undifferentiated — **it cannot be fixed by frontend changes alone.** Separately, the seed script (`backend/src/db/seed.ts:150-163`) generates literally templated content — `` `Expert ${category} Services - Tier ${i+1}` ``, freelancer names like `Freelancer 1`...`Freelancer 15`, and byte-identical description text per category — which compounds the visual sameness on top of the missing-image problem.

- [ ] **HIGH (schema)** — Add an `avatar_url` column to `users` (or `freelancer_profiles`), plus upload support, so cards/profiles/reviews can show a real photo instead of initials-in-a-box everywhere.
- [ ] **HIGH (schema)** — Add a service cover-image / portfolio-media table. Currently the only "visual" element on any card is a 1.5px decorative gradient stripe, identical on every card regardless of category.
- [ ] **HIGH (schema)** — Add a `skills`/`tags` array to `freelancer_profiles` (currently only a single `category` string) to enable real multi-skill filtering and richer profile display.
- [ ] **MEDIUM (schema + query)** — Add a denormalized review-count (or a fast aggregate query) — `rating_avg` exists but the *count* backing it is never shown next to the star rating anywhere (card, detail page, or freelancer profile), even though on the freelancer profile page the `reviews` array is already fetched and `.length` is sitting right there unused.
- [ ] **HIGH (schema)** — Add orders-completed / response-time tracking — neither exists in any form, blocking the "12 people ordered this in 30 days" style urgency/trust signals real marketplaces use to drive conversion.
- [ ] **LOW (seed data)** — Rewrite the seed script to generate varied, realistic freelancer names and non-templated descriptions so local/demo data doesn't look artificially repetitive on top of the real structural gaps above.

### Search & filter — confirmed backend DTO limits
The entire set of backend-supported query params today is `category`, `minPrice`, `maxPrice`, `query`, `page`, `limit` — confirmed by reading `query-services.dto.ts` directly. **No sort parameter exists at all**; `services.service.ts` hardcodes `.order('created_at', desc)`.
- [ ] **HIGH (backend)** — Add a `sortBy`/`sortOrder` param (price asc/desc, newest — these need no schema change, just a DTO + query addition) and a sort dropdown in the UI. True "best-selling"/"top-rated" sort is blocked on the orders-completed/review-count schema gap above.
- [ ] **HIGH (backend)** — Add a delivery-time filter. `delivery_days` already exists on `services` — this is purely a missing DTO param + `.lte()` clause + UI control, **no schema change needed**.
- [ ] **MEDIUM (backend)** — Add a "Verified only" filter using the existing `kyc_status` column (needs a join-filter added to `findAll()`, not a new column).
- [ ] **MEDIUM (frontend)** — Multi-select category instead of single-select pills (small backend `.in()` change + frontend UI change, not a schema change).
- [ ] **LOW (frontend)** — Recently-viewed services via localStorage — fully frontend-feasible, no backend change needed.

### Service detail page (`services/[id]/page.tsx`)
- [ ] **MEDIUM (frontend, easy win)** — Render an inline "More from this freelancer" carousel using `servicesApi.byFreelancer()`, which already exists and is already used elsewhere — currently the detail page only links out to the freelancer's profile instead of showing their other services inline.
- [ ] **MEDIUM (schema)** — Structured "what's included" / deliverables breakdown instead of one free-text `description` field.
- [ ] **MEDIUM (backend)** — A "related services" endpoint (filter by category excluding current id — no schema change, just a new query).
- [x] ✅ The sticky price/booking sidebar while scrolling a long description is already correctly implemented — no gap here.

### Freelancer public profile page (`freelancers/[id]/page.tsx`)
- [ ] **HIGH (frontend bug — easy win)** — `portfolio_url` is fetched into the `FreelancerProfile` type and used in the update form, but **is never rendered anywhere on the public profile page** — confirmed by reading the full file. This is a pure oversight, not a data gap — fix by simply adding a "Portfolio" link/button where the profile data already exists.
- [ ] **LOW (frontend, easy win)** — Show the review count next to the rating in the profile header stat row — the `reviews` array is already fetched on this exact page (`page.tsx:115-119`), just not wired into the stat display.
- [ ] **HIGH (schema)** — No skills/tags list, no response-time/completion-rate stats, no tiered badges beyond binary KYC verified/unverified, no certifications, no video intro — all blocked on schema additions.
- [ ] **HIGH (missing feature)** — No "message this freelancer before booking" — there is no messaging system anywhere in the codebase (see §4 and §5 for the full impact of this).
- [ ] **MEDIUM (schema)** — No freelancer reply-to-review capability — `reviews` table has no reply column.

---

## 4. Checkout / Booking Flow — The Biggest Structural Gap

**Files:** `frontend/src/app/services/page.tsx`, `frontend/src/app/services/[id]/page.tsx`, `frontend/src/app/freelancers/[id]/page.tsx`, `backend/src/orders/orders.service.ts`, `backend/src/orders/orders.controller.ts`, `backend/src/orders/dto/create-order.dto.ts`

### No dedicated checkout — logic triplicated across 3 files
- [ ] **HIGH** — There is no `/checkout` route at all. "Checkout" is an inline banner/card injected directly into whichever page the booking button was clicked from — and this exact same booking logic (create-order mutation, wallet-checkout mutation, toast copy, Pay/Cancel buttons) is **independently copy-pasted in three separate components**: `services/page.tsx` (lines 92-111, 209-229), `services/[id]/page.tsx` (lines 41-61, 253-270), and `freelancers/[id]/page.tsx` (lines 121-149, 222-253) — three divergent implementations of the same feature instead of one shared component or a real routed step.
- [ ] **HIGH** — Consolidate into a single shared `<CheckoutPanel/>` component (or a real `/checkout/[orderId]` route) used identically from all three entry points — this alone would fix the inconsistent post-payment behavior below.

### No order review step before payment
- [ ] **HIGH** — None of the three checkout surfaces show a pre-payment recap (service title, price, freelancer name, delivery timeline, platform fee) — the customer has already committed (the order row is already created in the DB) before ever seeing a summary. The `services/page.tsx` banner literally only says "Order created successfully! Pay via your Servify wallet or complete via Razorpay." with zero recap.

### No requirements-gathering — confirmed, with full downstream impact traced
- [ ] **HIGH** — `CreateOrderDto` is exactly `{ serviceId: string }` — zero fields for scope, requirements, attachments, or notes. Confirmed end-to-end: customer pays → escrow locks → freelancer sees the order with **no scope information at all**, and — critically — **there is no messaging system anywhere in the codebase** for the freelancer to ask what the customer actually wants. The only in-product path forward is guessing from the generic service description, or exchanging contact info off-platform. Fixing this needs both: (a) a requirements field on `CreateOrderDto` + a UI step to fill it before payment, and (b) some form of order-scoped messaging (see the missing-features doc `DASHBOARD_GOLD_STANDARD_TASKS.md` for the full messaging-system scope, which was already flagged there as the single largest missing feature in the product).

### "Complete via Razorpay" is dead, misleading text
- [ ] **HIGH** — The banner tells every customer they can "complete via Razorpay," but tracing the code confirms this is **unreachable**: `createOrder` does build a real `razorpayConfig` (key, amount, currency, order_id) and returns it, but it is never consumed anywhere in the frontend — `ordersApi.create`'s return type doesn't even type it, and no component destructures it. The only place the Razorpay checkout widget is actually opened in the whole app is for **wallet top-up** on the customer dashboard, not for direct order payment. Either build the missing Razorpay-for-orders UI, or remove the misleading text until it exists.

### Insufficient balance — no smooth resume flow
- [ ] **HIGH** — When wallet balance is too low, the backend returns a clear `Required: ₹X, Available: ₹Y` error message, but the frontend does nothing with it except a transient toast. The customer must: read the toast, manually compute the shortfall, navigate away to `/customer/dashboard`, complete a *separate* Razorpay top-up round trip, then navigate back — and because `bookingId`/`bookedOrderId` is plain `useState` (not persisted), a full page revisit **loses the pending-order state entirely**, forcing them to re-click "Book" from scratch. Gold standard: an inline "Top up ₹X and continue" action that auto-resumes checkout after the top-up succeeds.

### Post-payment confirmation — inconsistent, no real receipt
- [ ] **MEDIUM-HIGH** — Three different post-payment destinations depending on which page you booked from: `services/page.tsx` dumps the customer on `/customer/dashboard` with just a toast (no order number shown before leaving); the other two correctly route to `/orders/[id]`. Even the "good" path repurposes the order-management page as a receipt — no dedicated confirmation screen, no "what happens next" explainer, and (see §5 below) it shows raw ledger internals rather than a customer-friendly receipt.

### Cancelled orders are permanent, orphaned database rows
- [ ] **HIGH** — Clicking "Cancel" on any of the three checkout surfaces **only clears local React state** — no backend call is made. Confirmed: no cancel/expire endpoint exists anywhere in `orders.controller.ts`, no cancellation SQL function exists alongside the other order RPCs, and no TTL/cron job exists for stale `pending_payment` orders. Every abandoned booking — whether cancelled explicitly or just navigated away from — leaves a permanent, unpaid `pending_payment` row in the customer's order history forever, indistinguishable from an order they still intend to pay. Needs: a real `POST /orders/:id/cancel` endpoint (customer-owned, `pending_payment`-only) at minimum, ideally plus a background job to auto-expire very old pending orders.

### Fee transparency at the moment of payment
- [ ] **MEDIUM** — The commission rate is never shown to the customer during checkout or on the booking summary — it only appears post-purchase on the order detail page, and even there it's framed as money deducted from the *freelancer's* payout, not disclosed to the customer as part of what they're paying before they commit.

### Trust signals inconsistent across the three checkout surfaces
- [ ] **LOW** — Escrow/security messaging exists on the service detail page's static sidebar but is completely absent from the actual payment banner on `services/page.tsx` and `freelancers/[id]/page.tsx` — the moment of paying is exactly when reassurance messaging matters most.

---

## 5. Order Tracking & Post-Purchase — The "Silent Wait, Then Blind Approve" Problem

**File:** `frontend/src/app/orders/[id]/page.tsx`, `backend/src/orders/orders.service.ts`

### No delivery countdown / SLA visibility — confirmed, fully traced
- [ ] **HIGH** — `delivery_days` exists on `services` and is used everywhere *pre-purchase* (service cards, detail page, freelancer profile), but is **never selected in `getOrder`/`listOrders`, never in the frontend `Order` type, and never rendered anywhere post-purchase.** The customer has zero way to know if a freelancer is on schedule or overdue. Fix: add `delivery_days` (or better, a computed `expected_delivery_at` timestamp) to the order select queries and render an "Expected by [date]" / overdue banner on the order detail page and dashboard rows.

### No in-order communication — confirmed dead end
- [ ] **HIGH** — Zero messaging/chat module exists anywhere in the codebase (confirmed via repo-wide search). Once escrow is locked, the customer's *only* interactive options are wait silently or **File Dispute** — there is no lightweight way to ask a question or request a status update. Filing a formal dispute (which explicitly tells the customer "a support agent will review your case and the freelancer's response") is a wildly disproportionate escalation for "how's it going?" This is the single largest missing feature blocking a healthy post-purchase experience — see the messaging-system entry in `DASHBOARD_GOLD_STANDARD_TASKS.md` §6 for the full scope of building this (deliberately not attempted there either, given the size).

### "Delivery" is a bare status flag — no deliverable transport
- [ ] **HIGH** — Traced `markDelivered` end-to-end: the freelancer's "Mark as Delivered" button has no file picker, no URL field, no message textarea — it POSTs with **zero payload**, and the backend does nothing but flip `status` to `service_delivered`. There is no `deliverable_url`/`deliverable_files` column on `orders`, and no storage/upload path analogous to the one that already exists for dispute evidence (`disputesApi.getUploadUrl`/`addEvidence` — built recently, fully functional, and a direct template for this fix). The customer's "Please review and approve" banner has genuinely nothing to review inside the platform.
- [ ] **HIGH** — Build the mirror image of the dispute-evidence upload feature for deliverables: a `deliverable_url`/`deliverable_files` field, an upload UI on the freelancer's "Mark Delivered" action, and a display/download UI on the customer's order detail page before the Approve button.

### Blind approve, no revision option
- [ ] **HIGH** — Because there's nothing to review (above), "Approve & Release Escrow" is definitionally a blind approval based on off-platform trust. The two action buttons (Approve vs. Dispute) carry equal visual weight with no evidence panel between them.
- [ ] **HIGH** — There is no "Request Changes / Revision" middle ground — the `order_status` enum has no `revision_requested` value, and the frontend only branches on Approve-or-Dispute. A customer who wants a small tweak has to choose between silently approving (losing leverage) or triggering a full adversarial mediation dispute for what might be a two-line fix. This is a real product gap, not just UI polish — needs a new order status + a lightweight "send back with a note" action that doesn't involve support/admin at all.

### Review flow gaps
- [ ] **MEDIUM** — Reviews are **not editable after submission** — confirmed via the reviews controller/service (only `POST`, no `PATCH`/`PUT`/`DELETE`; a second review attempt on the same order is explicitly blocked). A customer who mis-clicks a star rating has no recourse.
- [ ] **MEDIUM** — No reminder/nudge if the customer doesn't review right away (blocked on the missing notification system, §above) — and no "leave a review" prompt surfaced at the dashboard order-list level; the customer must click into each completed order individually to discover the review form at the bottom of the page.

### Raw accounting internals shown to customers
- [ ] **MEDIUM-HIGH** — The escrow ledger section on the order detail page maps `entry_type` to a friendly label ("Escrow Locked", "Refund to Customer" — good), but then renders this immediately below every entry: `{entry.debit_account} → {entry.credit_account}` — literally printing strings like `customer_wallet:8f2a1c4e-... → platform_holding:3b7d9e21-...` in monospace, including raw UUIDs, directly to a non-technical buyer. Fix: either hide this internal detail entirely for customer-role viewers, or translate account identifiers into friendly labels the same way `entry_type` already is.

### Status stepper gaps
- [ ] **MEDIUM** — The 4-step order-progress stepper collapses two distinct backend statuses (`completed` and `payout_released`) onto the same visual "step 4," labelled "PAID OUT" even when the real status is merely `completed` — mildly misleading.
- [ ] **MEDIUM** — The stepper is hidden entirely for `disputed`/`refunded` orders — exactly the cases where a customer most wants visual reassurance about where the case stands. A dispute-specific sub-timeline (filed → under review → resolved) would close this.

### No in-app notifications
- [ ] **HIGH** — Confirmed: no notifications table, no bell icon, no unread badge anywhere in the product. The only way a customer learns a freelancer delivered or a dispute resolved is email, or manually revisiting the order page and clicking the manual refresh button. *(Same root gap as the missing-notifications entry already tracked in `DASHBOARD_GOLD_STANDARD_TASKS.md`.)*

---

## 6. Consolidated Data-Model Gaps (need a migration, not just UI work)

These recur across multiple sections above — listed once here so scoping/estimation doesn't double-count them:

- [ ] `avatar_url` on `users` or `freelancer_profiles` (blocks avatars on cards, detail pages, profiles, reviews)
- [ ] Service cover-image / portfolio-media table (blocks card thumbnails, detail-page galleries)
- [ ] `skills`/`tags` array on `freelancer_profiles`
- [ ] Review-count aggregate (denormalized column or fast query) — blocks "★ 4.7 (32 reviews)" everywhere
- [ ] Orders-completed / response-time tracking on `freelancer_profiles`
- [ ] Structured deliverables/FAQ fields on `services` (currently one free-text `description`)
- [ ] Freelancer badge/tier system beyond binary KYC status
- [ ] Reply-to-review column on `reviews`
- [ ] `deliverable_url`/`deliverable_files` on `orders` (or a linked evidence-style table, mirroring the dispute-evidence pattern already built)
- [ ] `revision_requested` value added to the `order_status` enum
- [ ] Requirements/brief field(s) on `orders` or a linked table, captured at booking time
- [ ] A `cancelled` order status + cancellation endpoint
- [ ] Wallet transaction-history endpoint (data likely reconstructable from `ledger_entries`, needs a dedicated customer-facing query)
- [ ] Full messaging/conversations schema (largest single item — already tracked separately in `DASHBOARD_GOLD_STANDARD_TASKS.md`)
- [ ] Notifications table (already tracked separately in `DASHBOARD_GOLD_STANDARD_TASKS.md`)

---

## Priority Roadmap (suggested, not prescriptive)

**Phase 1 — Fast, high-confidence fixes (no schema changes, no ambiguity)**
1. Fix the profile page dark-mode bug — copy the `bg-white dark:bg-slate-950` pattern from the dashboard file into every hardcoded class in `customer/profile/page.tsx`.
2. Render the already-fetched `portfolio_url` on the freelancer public profile page (currently fetched, never displayed).
3. Show review count next to rating on the freelancer profile header (data already fetched on that page).
4. Add a delivery-time sort/filter param to the services search (no schema change — `delivery_days` already exists).
5. Add a cancel-order endpoint for `pending_payment` orders + wire up the existing "Cancel" buttons to actually call it.
6. Fix or remove the "complete via Razorpay" dead text in the checkout banners.
7. Add a "Retry" button to the services-grid and orders-list error states.

**Phase 2 — Consolidate the checkout flow**
8. Build one shared checkout component/route, replacing the three duplicated implementations.
9. Add an order-review/summary step before payment.
10. Add an inline "top up and continue" flow for insufficient balance.
11. Unify post-payment routing so every entry point lands on the same confirmation experience.

**Phase 3 — Close the post-purchase trust gap**
12. Add deliverable upload/display (mirror the already-built dispute-evidence pattern).
13. Add a `revision_requested` middle ground between approve and dispute.
14. Add delivery countdown/SLA display on the order detail page and dashboard.
15. Humanize or hide the raw ledger `debit_account → credit_account` strings for customer-role viewers.

**Phase 4 — Data-model investment (larger, sequence per business priority)**
16. Avatar/photo columns + upload flow.
17. Service cover images / portfolio gallery.
18. Skills/tags, review-count, orders-completed, response-time aggregates.
19. Requirements-gathering at booking time.
20. Messaging system (largest single item — cross-reference `DASHBOARD_GOLD_STANDARD_TASKS.md` §6 for full scope).
21. In-app notifications (same cross-reference).

---

*End of research. No code was changed. This document is a task-tracking checklist for future implementation work — check items off as they're completed. Cross-reference `AUDIT_FINDINGS.md` (security/financial) and `DASHBOARD_GOLD_STANDARD_TASKS.md` (auth UX, all three dashboards, SEO, missing-features catalogue) for the rest of the platform.*
