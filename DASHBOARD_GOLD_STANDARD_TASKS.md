# Servify — Dashboard, Auth & Gold-Standard UX Audit

> **Deep research audit** covering: auth flows (login/signup/forgot-password/OTP/password UX), all three dashboards (customer, freelancer, admin), cross-cutting SEO/navigation, and a feature-completeness gap analysis against industry-standard marketplace platforms (Upwork/Fiverr).
> **Findings-only — nothing in this document has been fixed.** Each item is a checkbox task for future work.

**Date:** 2026-07-13
**Method:** 6 parallel deep-research passes across the full frontend + relevant backend, verified against actual code (file:line references and grep evidence throughout — every "absent" claim was confirmed via search, not assumed).

---

## Executive Summary

| Area | Grade | Headline |
|---|---|---|
| Password UX (show/hide, strength meter) | 🔴 F | Zero password strength meters, zero show/hide toggles on login/signup, no confirm-password field anywhere |
| Forgot-password / OTP flow | 🟡 C | Functionally works end-to-end and OTP input UX is genuinely good, but no resend cooldown, weak rate-limiting, no inline error handling |
| Signup security | 🟡 C | No CAPTCHA, no Terms/Privacy consent checkbox, no account lockout on login |
| Customer dashboard | 🔴 D | No search/pagination/export on orders, no spending report, orphaned Profile page (unreachable from nav) |
| Freelancer dashboard | 🔴 D | No pagination on any of 3 lists, no CSV export anywhere, tab state lost on refresh, no error states on any query |
| Admin dashboard | 🔴 D | **No audit log anywhere in the product**, no user detail page despite backend already supporting it, no confirmation dialog before running raw SQL migrations |
| SEO | 🔴 F | No `robots.txt`/`sitemap.xml`, no JSON-LD, no Open Graph, all public listing/detail pages are `'use client'` (blocks `generateMetadata` entirely) |
| Navigation (site-wide) | 🟡 C | Solid semantic HTML and real `<Link>` anchors, but zero breadcrumbs anywhere, tab state never URL-synced on any dashboard |
| Tooltips | 🔴 F | No `Tooltip` component exists in the codebase at all — every icon-only button across all 3 dashboards lacks one |
| Feature completeness vs. industry standard | 🔴 F | 21 of 24 standard marketplace features (messaging, notifications, service tiers, milestones, 2FA, wishlist, skills/tags, invoicing, job-posting/proposals, etc.) are **completely absent** — confirmed via grep, not assumed |

**The single highest-leverage fix:** converting `services/page.tsx`, `services/[id]/page.tsx`, and `freelancers/[id]/page.tsx` from `'use client'` to server components (with client islands for interactivity) unblocks per-page metadata, JSON-LD, and reliable crawling all at once — this is called out by the SEO research as the one architectural change that resolves 4 HIGH findings simultaneously.

---

## 1. Auth Flows & Password UX

### 1a. Password field UX
- [ ] **HIGH** — Add show/hide (eye icon) toggle to login password field. *(`login/page.tsx:123-132` — reset-password already has this pattern at lines 146-163, reuse it)*
- [ ] **HIGH** — Add show/hide toggle to signup password field. *(`signup/page.tsx:130-142`)*
- [ ] **HIGH** — Add a live password strength meter (weak/medium/strong bar checking length + uppercase + lowercase + number + special char) to signup and reset-password. Currently none exists anywhere. *(`signup/page.tsx`, `reset-password/page.tsx`)*
- [ ] **HIGH** — Show password requirements as a checklist BEFORE submit, not just a placeholder hint. *(`signup/page.tsx:130-142`, `reset-password/page.tsx:151`)*
- [ ] **HIGH** — Add backend password complexity policy — currently only `MinLength(6)`, no uppercase/number/special-char requirement. *(`backend/src/auth/dto/signup.dto.ts:11`, `backend/src/auth/dto/reset-password.dto.ts:12`)*
- [ ] **HIGH** — Add confirm-password field to signup with real-time match validation. Currently doesn't exist — signup state only has `{ name, email, password, role }`. *(`signup/page.tsx:23`)*
- [ ] **MEDIUM** — Add confirm-password field to reset-password page (same gap). *(`reset-password/page.tsx:144-164`)*

### 1b. Forgot password / OTP flow
- [x] ✅ Confirmed working end-to-end: request OTP → email → OTP+new password → success, including refresh-token revocation and confirmation email.
- [x] ✅ OTP input UX is genuinely good — 6 individual boxes, auto-advance, backspace navigation, paste-to-split support. *(`reset-password/page.tsx:23-46`)*
- [ ] **MEDIUM** — Add an inline "Resend OTP" button with a visible cooldown timer (e.g. 30-60s) directly on the reset-password page. Currently the only option is a full navigation back to `/forgot-password` and re-entering the email. *(`reset-password/page.tsx:183-186`)*
- [ ] **MEDIUM** — Show client-side rate-limit feedback on the forgot-password page (currently no cooldown indicator at all if a user spams the request button). *(`forgot-password/page.tsx:48-53`)*
- [ ] **LOW** — Show wrong-OTP errors inline near the OTP boxes (with the boxes cleared/highlighted red), not just a toast. *(`reset-password/page.tsx:63`)*
- [ ] **MEDIUM** — Tighten OTP endpoint rate limiting: currently 5 requests/minute, **global/IP-scoped, not per-account**, with no per-OTP attempt lockout. Bind the throttle key to the target email/account and add a hard lockout after ~5-10 wrong OTP attempts. *(`backend/src/auth/auth.controller.ts:55,63`)*

### 1c. Signup flow
- [ ] **HIGH** — Add a Terms of Service / Privacy Policy consent checkbox, required before signup submits. Currently doesn't exist anywhere in the form or DTO. *(`signup/page.tsx`, `backend/src/auth/dto/signup.dto.ts`)*
- [ ] **HIGH** — Add CAPTCHA / bot protection to signup, login, and forgot-password. Currently zero bot protection beyond generic rate limiting. *(all three forms)*
- [ ] **MEDIUM** — Upgrade role selection from a plain `<select>` dropdown to a clearer card-based selector explaining what each role unlocks. *(`signup/page.tsx:146-155`)*
- [ ] **LOW** — Add client-side email format validation beyond native HTML5 `type="email"` (inline regex check before submit). *(`signup/page.tsx:118-127`, `login/page.tsx:104-113`)*

### 1d. Login flow
- [ ] **HIGH** — Add account lockout / progressive delay after repeated failed login attempts (currently zero per-account protection — only a generic 10/min IP-based throttle, trivially bypassed via distributed IPs). *(`auth.service.ts:100-130`)*
- [ ] **HIGH** — Add a "Remember me" option to login (currently refresh-token duration is a fixed 30 days server-side with no user control). *(`login/page.tsx:94-144`, `auth.service.ts:13`)*
- [x] ✅ Generic "Invalid email or password" error (doesn't reveal which field is wrong) — this is the *correct* security pattern, keep it. *(`auth.service.ts:113,115,118`)*
- [ ] **LOW** — Consider only sending the "new sign-in detected" email for new devices/locations, not every single login (currently fires every time, risks desensitizing users to real alerts). *(`auth.service.ts:124`)*

### 1e. General auth UX/accessibility
- [x] ✅ Loading states (disabled button + spinner) are correctly implemented on all 4 auth forms — no gap here.
- [ ] **HIGH** — Add `autocomplete` attributes across all auth forms — currently **zero** anywhere (`autocomplete="email"`, `"current-password"`, `"new-password"`). Hurts password manager UX and browser autofill. *(all 4 pages)*
- [ ] **MEDIUM** — Fix `<label>`/`<input>` association on forgot-password and reset-password pages — currently no `htmlFor`/`id` pairing (login/signup already do this correctly via shadcn `Label`/`Input`, reuse that pattern). *(`forgot-password/page.tsx:80-90`, `reset-password/page.tsx:110-119,144-154`)*
- [ ] **MEDIUM** — Add `role="group"`/`aria-label` to the OTP input group for screen reader users. *(`reset-password/page.tsx:126-138`)*
- [ ] **MEDIUM** — Add `aria-live="polite"` or `role="alert"` to error message boxes on login/signup so screen readers announce submission errors. *(`login/page.tsx:95-100`, `signup/page.tsx:95-100`)*
- [ ] **LOW** — Add `aria-label` ("Show password"/"Hide password") to the password visibility toggle button. *(`reset-password/page.tsx:156-162`)*
- [ ] **LOW** — Verify OTP box row doesn't cramp on very narrow (<360px) viewports — unverified in this research, flag for a manual mobile check. *(`reset-password/page.tsx:125-139`)*

---

## 2. Customer Dashboard

**Files:** `customer/dashboard/page.tsx`, `customer/profile/page.tsx`, `orders/[id]/page.tsx`, `services/page.tsx`, `services/[id]/page.tsx`

### Navigation
- [ ] **HIGH** — Add breadcrumbs across the customer flow (none exist anywhere). Order detail's only "back" affordance is `router.back()`, which does nothing useful if the page is opened via a direct/bookmarked link. *(`orders/[id]/page.tsx:236-267`)*
- [ ] **HIGH** — Add a link from Order Detail back to the Customer Dashboard (currently zero links — only browser-history-dependent back button). *(`orders/[id]/page.tsx`)*
- [ ] **HIGH** — **Fix: Customer Profile page is unreachable from anywhere in the UI.** The user's name in the Navbar is plain text, not a link — there is no path from Dashboard or Navbar to `/customer/profile` except typing the URL directly. *(`Navbar.tsx:90-93`, confirmed no reference to `/customer/profile` anywhere in `customer/dashboard/page.tsx`)*
- [ ] **MEDIUM** — Add active-state indication in Navbar (no `usePathname()` check, no `aria-current`, no active-underline currently). *(`Navbar.tsx:46-64,82-88`)*

### SEO (see also Section 5)
- [ ] **HIGH** — `services/page.tsx` and `services/[id]/page.tsx` are `'use client'`, losing all Next.js metadata capability for the platform's main SEO-relevant public pages. *(architectural fix — see Section 5)*
- [ ] **HIGH** — No JSON-LD structured data on service detail pages despite having all needed data (price, rating, delivery time, reviews). *(`services/[id]/page.tsx`)*

### Orders listing (customer dashboard)
- [ ] **HIGH** — Add search box for orders (by service name, status, date range). Currently zero filtering UI. *(`customer/dashboard/page.tsx:262-311`)*
- [ ] **HIGH** — Add pagination — currently the entire unpaginated order history is dumped in one scroll. `ordersApi.list` has no `page`/`limit` params at all. *(`api.orders.ts:39`, `customer/dashboard/page.tsx:29-33`)*
- [ ] **HIGH** — Add CSV/Excel export of order history (needed for accounting/tax). No export library is even installed in the project. *(entire app)*
- [ ] **HIGH** — Add sortable columns (date, amount, status). Currently fixed to whatever order the API returns. *(`customer/dashboard/page.tsx`)*
- [ ] **MEDIUM** — Add a "Retry" button to the orders error state (currently static text only, forces full page reload). *(`customer/dashboard/page.tsx:254-257`)*
- [ ] **MEDIUM** — Improve empty state with an icon + actionable CTA button (currently text-only sentence with no clickable link). *(`customer/dashboard/page.tsx:258-261`)*
- [ ] **NOTE** — `services/page.tsx` already has a *good* implementation of search+debounce+filter+pagination+skeleton-loading+empty-state — reuse that exact pattern for the orders list instead of building new.

### Data card / spending report
- [ ] **HIGH** — Add a spending summary/report view — currently only 3 shallow stat tiles (wallet balance, active bookings, disputes count), computed by filtering the entire unpaginated client-side order array (doesn't scale). No total-spend KPI, no spend-over-time chart, no orders-by-status breakdown, no average order value. *(`customer/dashboard/page.tsx:154-155,200-237`)*

### Tooltips
- [ ] **HIGH** — Add tooltip/aria-label to the icon-only Refresh button (both on dashboard and order detail page). *(`customer/dashboard/page.tsx:183-189`, `orders/[id]/page.tsx:259-262`)*
- [ ] **MEDIUM** — Add tooltip explaining status badges on the orders list view (order detail page already has this via `STATUS_CONFIG.description`, but it's not surfaced on the list). *(`customer/dashboard/page.tsx:274-276`)*
- [ ] **MEDIUM** — Add `title` fallback for truncated category text. *(`services/[id]/page.tsx:244`)*
- [ ] **LOW** — Add tooltip/copy-to-clipboard for truncated order IDs and the Razorpay payment ID. *(`customer/dashboard/page.tsx:272`, `orders/[id]/page.tsx:251,332-335`)*

### Other gold-standard gaps
- [ ] **MEDIUM** — Replace spinner-only loading states with skeleton loaders matching the eventual layout (services listing already does this correctly — reuse the pattern). *(`customer/dashboard/page.tsx:250-253`, `customer/profile/page.tsx:68-74`, `orders/[id]/page.tsx:200-206`)*
- [ ] **MEDIUM** — Fix Profile page ignoring the light/dark theme toggle — hardcodes `bg-slate-950` with no light-mode variant, unlike every other page in the app. *(`customer/profile/page.tsx:70,77`)*
- [ ] **LOW** — Add a global wallet transaction/statement view (currently ledger is only viewable per-order via an accordion, no unified statement). *(`orders/[id]/page.tsx:419-467`)*
- [ ] **LOW** — Consider a notification/activity feed (currently only ephemeral toasts, no persistent history).

---

## 3. Freelancer Dashboard

**Files:** `freelancer/dashboard/page.tsx` (Overview/Orders/Services/Payouts tabs), `freelancer/profile/page.tsx`, `freelancer/onboard/page.tsx`

### Navigation
- [ ] **HIGH** — Sync tab state to the URL (`?tab=orders` etc). Currently pure `useState` — refresh, back-button, or a deep link always resets to Overview. *(`freelancer/dashboard/page.tsx:47,285`)*
- [ ] **MEDIUM** — Add breadcrumbs for nested views (e.g. order detail linked from the dashboard). *(whole file)*

### SEO
- [ ] **MEDIUM** — Add per-route document titles via a `layout.tsx` under `app/freelancer/` (currently every page — dashboard, profile, onboarding — shares the identical generic root title, making them indistinguishable in browser tabs/history). *(`layout.tsx:21-24`)*

### Orders tab
- [ ] **HIGH** — Add pagination (currently unpaginated — `ordersApi.list` has no page/limit params, confirmed same backend gap as customer dashboard). *(`freelancer/dashboard/page.tsx:458`)*
- [ ] **HIGH** — Add search box + status filter. *(`freelancer/dashboard/page.tsx:446-500`)*
- [ ] **HIGH** — Add CSV export of order history. *(`freelancer/dashboard/page.tsx:446-500`)*
- [ ] **MEDIUM** — Add sortable columns.

### Services tab
- [ ] **HIGH** — Add pagination for the freelancer's own service list — note the public `servicesApi.list` **already supports** `page`/`limit`/`query`/`category`, this plumbing just isn't reused for `byFreelancer`. *(`freelancer/dashboard/page.tsx:606`, cf. `api.services.ts:31-42`)*
- [ ] **HIGH** — Add search-by-name / category filter box (12 categories exist but no way to filter by them). *(`freelancer/dashboard/page.tsx:503-728`)*
- [ ] **MEDIUM** — Add CSV export of the services catalog.
- [ ] **MEDIUM** — Add sortable columns (price, delivery time, active status).
- [ ] **HIGH** — Add bulk actions (bulk activate/deactivate) — currently every service can only be toggled one at a time.
- [ ] **HIGH** — Add a "duplicate service" feature (currently requires retyping the whole form from scratch).
- [ ] **HIGH** — Add per-service performance stats (views, booking count, conversion) — the `Service` type doesn't even carry this data yet. *(`api.services.ts:3-22`)*

### Withdrawals / Payouts tab
- [ ] **HIGH** — Add pagination (currently unpaginated). *(`freelancer/dashboard/page.tsx:863`)*
- [ ] **HIGH** — Add CSV/Excel export — **this is the single most important export gap in the app**, since freelancers need a downloadable earnings ledger for tax filing. *(`freelancer/dashboard/page.tsx:841-883`)*
- [ ] **MEDIUM** — Add search/filter (by status, date range).
- [ ] **MEDIUM** — Add sortable columns.
- [ ] **HIGH** — Add a visual status stepper/tracker for pending payouts (Requested → Processing → Bank Transfer → Completed) — currently only a flat status badge with no ETA or pipeline visibility.
- [ ] **MEDIUM** — Disclose whether any fee is deducted from withdrawals — currently the timeline ("1-2 business days") is disclosed but fee information is completely absent from the withdraw form.
- [x] ✅ Zero-balance state, table responsive column-hiding on mobile — already handled well.

### Data card / earnings report
- [ ] **HIGH** — Add an earnings report section: monthly/weekly breakdown, earnings-over-time chart, average order value, completion rate (delivered vs disputed vs refunded ratio). Currently only 3-4 raw stat tiles with zero drill-down, despite all the underlying data already being fetched client-side. *(`freelancer/dashboard/page.tsx:310-342,734-745`)*
- [ ] **MEDIUM** — Add a tooltip/info-icon explaining why "Available" balance can differ from "Total Earned" (the business logic — PENDING withdrawals reserved instantly — is explained in a backend code comment but never surfaced to the user). *(`freelancer/dashboard/page.tsx:317-319,738`, `backend/src/freelancers/freelancers.service.ts:47-51`)*

### Tooltips
- [ ] **HIGH** — Add tooltip/aria-label to the Edit (pencil) icon button on service rows — currently zero label at all. *(`freelancer/dashboard/page.tsx:705-709`)*
- [ ] **HIGH** — Add tooltip/aria-label to the Delete (trash) icon button on service rows. *(`freelancer/dashboard/page.tsx:711-719`)*
- [ ] **MEDIUM** — Add tooltip to the global Refresh button explaining what it refreshes. *(`freelancer/dashboard/page.tsx:271-275`)*
- [ ] **MEDIUM** — Add tooltip explaining what "Pause" does to a service (hides from marketplace but keeps existing orders alive) — first-time freelancers won't know this implication. *(`freelancer/dashboard/page.tsx:679-683`)*
- [ ] **LOW** — Add tooltip/copy for truncated order IDs and the Fund Account ID. *(`freelancer/dashboard/page.tsx:383,461-463,762`)*

### Correctness / robustness
- [ ] **HIGH** — **Fix: all `useQuery` calls silently ignore `isError`/`error`.** A failed fetch (500, network drop) currently renders identically to "you have zero orders/services" — this is a trust/correctness issue, not just polish. *(`freelancer/dashboard/page.tsx:61-100`, `freelancer/profile/page.tsx:40-50`)*
- [ ] **MEDIUM** — Add visible keyboard focus-ring styling to tab buttons (currently keyboard-focusable but with no visual focus indicator). *(`freelancer/dashboard/page.tsx:283-298`)*
- [ ] **MEDIUM** — Reconcile the mixed card-layout (Orders/Services) vs table-layout (Withdrawals) inconsistency within the same dashboard.
- [ ] **LOW** — Replace spinner-only loading with skeleton loaders.

---

## 4. Admin Dashboard

**Files:** `admin/dashboard/page.tsx` (Analytics/Disputes/Migrations/Settings tabs), `admin/users/page.tsx`, `admin/migrations/page.tsx`

### Navigation
- [ ] **HIGH** — Sync tab state to the URL (same gap as freelancer dashboard). *(`admin/dashboard/page.tsx:39`)*
- [ ] **HIGH** — Add breadcrumbs (none exist anywhere in the admin panel).
- [ ] **HIGH** — **Build a user detail page.** The backend already exposes `GET /api/v1/admin/users/:userId` fully (returns profile, KYC, bio) but **nothing in the frontend calls it** — `adminUsersApi` has no `get(userId)` method at all, and the users table has no row click / detail drill-down. *(`backend/src/admin/users.controller.ts:34-37`, `users.service.ts:68-77`, `frontend/src/lib/api.admin.ts:29-46`)*
- [ ] **MEDIUM** — Replace the flat top-tab-row + one-off "Users" button with a proper shared admin layout (sidebar nav) that scales as more admin sections get added.
- [ ] **MEDIUM** — Resolve the duplicated Migrations UI — `/admin/migrations` (standalone page) and the Migrations tab inside `admin/dashboard/page.tsx` implement the same feature independently and can drift (confirmed: the standalone page shows raw SQL per migration, the dashboard tab doesn't).

### SEO / crawlability
- [ ] **MEDIUM** — Add explicit `noindex, nofollow` metadata (or a segment-level layout export) to all `/admin/*` routes, plus a `Disallow: /admin` rule once `robots.txt` is added (see Section 5).

### Users list
- [x] ✅ Search by name/email works both frontend and backend, correctly sanitized against PostgREST injection.
- [x] ✅ Role filter and active/banned status filter both work frontend + backend.
- [ ] **MEDIUM** — Add a page-size selector (20/50/100) — backend already accepts an arbitrary `limit` param, just not exposed in the UI. *(`admin/users/page.tsx:99`)*
- [ ] **HIGH** — Add CSV export of the user list — **no export endpoint exists at all**, backend or frontend. *(`backend/src/admin/users.controller.ts`, `admin/users/page.tsx`)*
- [ ] **MEDIUM** — Add sortable columns — backend hardcodes `.order('created_at', desc)` with no `sortBy`/`sortDir` param support at all. *(`users.controller.ts:19-32`, `users.service.ts:27-44`)*
- [ ] **HIGH** — Add bulk actions (bulk ban, bulk role change) — no bulk endpoint exists on the backend, only single-user PATCH routes. *(`users.controller.ts:39-56`)*
- [ ] **HIGH** — Make table rows clickable → user detail view (blocked until the detail page above is built).
- [ ] **LOW** — Support searching by user ID in addition to name/email.

### Disputes list
- [ ] **HIGH** — Wire up the status filter dropdown in the UI — **the backend already accepts a `status` query param** (`disputesApi.list(status?)`), it's just never called with a value from the frontend. *(`disputes.controller.ts:17-22`, `admin/dashboard/page.tsx:61`)*
- [ ] **HIGH** — Add pagination — the backend query has **no pagination at all** (no count, no `.range()`), unlike the users list which already paginates. At scale this becomes a real backend performance problem, not just a UX gap. *(backend `disputes.service.ts`)*
- [ ] **HIGH** — Add CSV export of disputes for compliance/audit record-keeping.
- [ ] **MEDIUM** — Add sortable columns (amount, filing date, status).
- [ ] **MEDIUM** — Add date-range and amount filters (backend gap — no such params exist).
- [ ] **LOW** — Add tooltip/copy for truncated dispute IDs and order IDs.

### Analytics tab
- [ ] **HIGH** — Add actual charts/graphs — currently pure stat-tile numbers with **zero visualization** anywhere (no trend line, no bar/pie chart, no sparkline). `getPlatformStats()` only returns aggregate counts, no time-series data. *(`admin/dashboard/page.tsx:187-279`, `users.service.ts:146-200`)*
- [ ] **HIGH** — Add a date-range filter for analytics (currently an unconditional full-table scan every time, no way to view "last 7 days" vs "last 30 days").
- [ ] **MEDIUM** — Add a "Download report" export (PDF/CSV) for finance/ops reconciliation.
- [ ] **LOW** — Invalidate the `platform-stats` query after mutations (ban/role-change/dispute-resolve) instead of relying solely on a 60s `staleTime` — an admin who just banned 5 users has to wait or navigate away/back to see updated counts.

### Migrations panel (UX lens — security already covered separately)
- [ ] **HIGH** — Add a confirmation dialog before running any migration (single or "Run All"). Currently **zero confirmation** for raw SQL execution against production, while the much-less-dangerous user-ban action already has a `confirm()` guard — this is backwards. *(`admin/dashboard/page.tsx:396-399,433-436`, `migrations/page.tsx:173-189,255-267`)*
- [ ] **HIGH** — Add an `executed_by` column to the migration tracker table and record the actor on every run — currently the tracker only records *that* and *when*, never *who*. *(`backend/src/admin/admin.service.ts:41-49,101-107`)*
- [ ] **MEDIUM** — Show the raw SQL before execution on the dashboard-tab version too (the standalone `/admin/migrations` page already does this, the dashboard tab doesn't — inconsistent).
- [ ] **LOW** — Add a server-side lock during migration runs so two admins can't simultaneously trigger "Run All" from separate sessions.

### Audit trail — the biggest gap in the whole admin panel
- [ ] **HIGH** — **Build an admin action audit log.** Confirmed via full-codebase grep: there is **no `audit_log`/`admin_actions` table or endpoint anywhere in the product.** Specifically:
  - `banUser`/`unbanUser`/`changeRole` only use `adminId` for a self-action guard — the actor is **never persisted**, so there's no way to answer "who banned this user" after the fact. *(`users.service.ts:79-144`)*
  - Disputes are slightly better — `resolved_by` is captured and stored in `ledger_entries.metadata`, but it's never surfaced in any UI (stored but invisible).
  - Migrations have zero actor tracking at all (see above).
  - **Gold standard:** a dedicated `admin_audit_log` table (actor_id, action, target_type, target_id, metadata, timestamp) written on every mutating admin action, with a browsable/filterable UI tab. This is table-stakes for any admin panel used by multiple ops/support staff.

### Tooltips
- [ ] **MEDIUM** — Add tooltip/aria-label to the icon-only "change role" button. *(`admin/users/page.tsx:44-47`)*
- [ ] **MEDIUM** — Add a tooltip to "Run All"/migration buttons warning what they actually do (executes SQL against production immediately) given the destructiveness. *(`admin/dashboard/page.tsx:392-399`)*
- [ ] **LOW** — Add tooltips explaining ambiguous multi-word dispute statuses (`under_review`, `escalated`, `resolved_split`).
- [ ] **LOW** — Add tooltip explaining the KYC-approved checkmark icon on the freelancer info column.
- [ ] **LOW** — Add tooltip/copy affordance for truncated dispute/order IDs.

### Other
- [ ] **MEDIUM** — Consider a "view as user" / impersonation feature for support debugging (common in gold-standard admin panels, currently absent).
- [ ] **LOW** — Add visible role/permission-scope indicator so support agents know which capabilities they have vs full admins.
- [ ] **LOW** — Add keyboard shortcuts for power users (search focus, row navigation).
- [ ] **LOW** — Add a dense-mode/compact-row toggle for the users table.

---

## 5. Cross-Cutting SEO & Navigation

**The core structural issue:** `services/page.tsx`, `services/[id]/page.tsx`, and `freelancers/[id]/page.tsx` — the three most SEO-valuable public pages in the entire app — are all `'use client'`. This is a Next.js App Router constraint: client components **cannot** export `generateMetadata`, cannot emit server-rendered JSON-LD reliably, and their content is populated after hydration via `useQuery`, which non-JS-executing crawlers/social unfurlers (Twitter, Slack, WhatsApp bots) may see as empty.

- [ ] **HIGH — Architectural fix (unblocks everything below):** convert `services/page.tsx`, `services/[id]/page.tsx`, `freelancers/[id]/page.tsx` to server components that fetch data server-side, with client "islands" only for interactive bits (search box, filters, booking buttons). This single change unblocks metadata, JSON-LD, and reliable crawling simultaneously.

### Metadata
- [ ] **HIGH** — Add `generateMetadata`/`metadata` to the homepage, services listing, service detail (dynamic per-listing), and freelancer profile (dynamic per-profile) — currently every page in the app except 3 static legal pages falls back to the single generic root title. *(`page.tsx`, `services/page.tsx`, `services/[id]/page.tsx`, `freelancers/[id]/page.tsx`)*
- [ ] **MEDIUM** — Add `metadataBase`, a `title.template` (e.g. `%s | Servify`), `viewport`/`themeColor`, and richer `icons`/manifest config to the root layout. *(`app/layout.tsx:21-24`)*

### robots.txt / sitemap.xml
- [ ] **HIGH** — Add `src/app/robots.ts` disallowing `/admin`, `/customer`, `/freelancer/dashboard`, `/freelancer/onboard`, `/freelancer/profile`, `/orders`, `/support`. Currently doesn't exist at all.
- [ ] **HIGH** — Add `src/app/sitemap.ts` that server-fetches all active service and freelancer IDs and emits their URLs. Currently doesn't exist — no discovery path for the marketplace's long-tail inventory.

### Structured data
- [ ] **HIGH** — Add JSON-LD `Service`/`Product` + `AggregateRating` schema to service detail pages (all needed data — price, rating, delivery time, reviews — is already fetched, just not emitted as structured data).
- [ ] **HIGH** — Add JSON-LD `Person`/`ProfilePage` + `AggregateRating` schema to freelancer profile pages.
- [ ] **MEDIUM** — Add `Organization`/`WebSite` JSON-LD to the homepage/root layout.

### Open Graph / social sharing
- [ ] **HIGH** — Add `openGraph`/`twitter` metadata at the root and per-page overrides for service/freelancer pages. Currently sharing any listing link on Slack/WhatsApp/X shows no title/description/image card at all.
- [ ] **MEDIUM** — Consider dynamic OG image generation (`opengraph-image.tsx`) for service listings.

### Canonical URLs & the `?category=` bug
- [ ] **HIGH** — **Fix functional bug:** `services/page.tsx` filter state (`query`, `category`, `minPrice`, `maxPrice`, `page`) lives only in client `useState`, never read from `useSearchParams()`. This means the homepage's category pill links (e.g. `/services?category=Software+Development`) **silently fail to apply the filter** on load — a real broken-deep-link bug, not just an SEO nicety. *(`services/page.tsx`, source links in `page.tsx`)*
- [ ] **MEDIUM** — Once filter state is URL-synced, add `alternates: { canonical: '.../services' }` (stripped of query params) to avoid duplicate-content dilution across filtered/paginated variants.

### Navigation structure
- [ ] **HIGH** — Add breadcrumbs (with `BreadcrumbList` JSON-LD) on service detail, freelancer profile, and order detail pages — currently zero anywhere, and the "Back" affordances are non-crawlable `<button onClick={() => router.back()}>` elements, not real links. *(`services/[id]/page.tsx`, `freelancers/[id]/page.tsx`, `orders/[id]/page.tsx`)*
- [ ] **LOW-MEDIUM** — Fix dead footer link: "About Servify" points to `/#about`, an anchor that doesn't exist anywhere on the homepage. *(`Footer.tsx`)*
- [ ] **LOW** — Add a Categories sitemap-style column and a Contact link to the footer (no `/contact` route exists at all currently).
- [ ] **LOW** — Centralize the duplicated `CATEGORIES` array (currently independently defined in both `page.tsx` and `services/page.tsx` — a maintenance/drift risk).
- [x] ✅ Positive: all primary navigation uses real `next/link` anchors (crawlable), semantic landmarks (`header`/`nav`/`main`/`footer`) are correctly used exactly once each at the layout level.

### Performance / Core Web Vitals (forward-looking)
- [ ] **LOW (today) / MEDIUM-HIGH (forward-looking)** — Configure `images.remotePatterns` in `next.config.ts` and standardize on `next/image` now, before real profile photos/portfolio images are added (currently the app has zero raster images — avatars are CSS gradient initials — so this is currently moot but will bite immediately once images are introduced).

---

## 6. Missing Features vs. Industry Standard (Upwork/Fiverr-style marketplaces)

This section is a **feature-completeness gap analysis**, distinct from the UX-polish findings above — these are entire modules/capabilities that are standard on major freelance marketplaces and are **completely absent** from this codebase, not existing features with rough edges. Every "absent" claim below was verified via grep/search against both `backend/src` and `frontend/src` — nothing here is assumed from general marketplace knowledge without codebase confirmation.

**Architecture context confirmed during this pass:** backend modules are `auth`, `freelancers`, `admin`, `razorpay`, `services`, `orders`, `disputes`, `reviews`, `email` — no `messaging`, `notifications`, `offers`, or `jobs` module exists. Neither `package.json` (frontend or backend) has `socket.io`, `passport`, `@nestjs/schedule`, a PDF library, or any push-notification SDK. 15 DB migrations exist, none for messages, notifications, favorites, skills/tags, milestones, offers, or job postings. **This confirms the platform is built exclusively as a Fiverr-style fixed-gig marketplace — there is no Upwork-style job-posting/proposal/bidding model at all.**

### Completely absent (❌) — confirmed via grep, zero matches
- [ ] **HIGH** — **Messaging/chat system.** No buyer-seller communication channel before or during an order exists at all — no chat module, no `socket.io` dependency in either package.json, no conversation table. Customers and freelancers currently have no way to discuss project details except the fixed-price service description and the dispute-reason textarea.
- [ ] **HIGH** — **In-app notifications** (bell icon / notification center). Only email notifications exist (`backend/src/email/`); there is no notifications table, no bell-icon component, no `/notifications` route. A user has no way to review past events without digging through their inbox.
- [ ] **HIGH** — **Service packages/tiers** (Fiverr's Basic/Standard/Premium model). `services` table has a single `price DECIMAL(10,2)` column and `CreateServiceDto`/`UpdateServiceDto` only accept one `price`/`deliveryDays` pair — freelancers cannot offer tiered pricing for the same service.
- [ ] **HIGH** — **Order requirements form.** `CreateOrderDto` is literally just `{ serviceId: string }` — booking captures zero project details, no structured questionnaire, no file upload at time of order. Freelancers only learn what the customer actually wants after the order is already paid and locked in escrow.
- [ ] **HIGH** — **Revision requests.** The order status enum (`pending_payment, payment_captured, service_delivered, completed, disputed, refunded, payout_released`) has no `revision_requested` state — the flow is strictly binary approve-or-dispute. A customer who wants a minor tweak has no option except to open a formal dispute.
- [ ] **HIGH** — **Skills/tags system.** Both `freelancer_profiles.category` and `services.category` are single-value `VARCHAR(100)` strings, not an array of skills/tags. There's no way to filter/search by multiple skills, and freelancers can't showcase a skill set beyond one category label.
- [ ] **HIGH** — **Auto-complete/auto-release of escrow.** No `@nestjs/schedule` dependency, no cron job anywhere. If a customer never clicks "confirm delivery," the order sits in `service_delivered` indefinitely with no time-based fallback — industry standard is to auto-release escrow to the freelancer after N days of customer inactivity.
- [ ] **HIGH** — **Cancellation flow.** No `cancel` action exists on orders at all — a customer or freelancer cannot cancel an order pre-delivery outside of the adversarial dispute path.
- [ ] **MEDIUM** — **Custom offers/quotes.** No way for a freelancer to send a custom-priced quote to a specific client outside their fixed service listing (common for bespoke/large projects).
- [ ] **MEDIUM** — **Milestones/partial payments.** No milestone concept anywhere — every order is a single lump-sum escrow lock/release, unsuitable for large multi-stage projects.
- [ ] **MEDIUM** — **Two-factor authentication for login.** The existing OTP mechanism is scoped exclusively to password reset (`auth.service.ts` `forgotPassword`/`resetPassword`) — login itself (`POST /auth/login`) is bare email+password with no optional 2FA step.
- [ ] **MEDIUM** — **Social login/OAuth** (Google, GitHub, etc.). No `passport` or OAuth SDK anywhere; signup/login is email+password only.
- [ ] **MEDIUM** — **Freelancer verification levels/badges** beyond payout KYC. `kyc_status` exists purely as a RazorpayX payout gate (APPROVED/PENDING) — there's no "Top Rated," "Rising Talent," or trust-badge system that surfaces on the public profile to help customers choose.
- [ ] **MEDIUM** — **Wishlist/saved freelancers or services.** No favorites/bookmark table or endpoint anywhere — customers can't save a service or freelancer to revisit later.
- [ ] **MEDIUM** — **Freelancer availability/calendar.** No availability or booking-slot concept — customers have no visibility into a freelancer's current capacity/queue before booking.
- [ ] **MEDIUM** — **Tax invoice generation (GST PDF).** No PDF-generation library and no invoice endpoint, despite this being an Indian marketplace processing real payments via Razorpay — customers/freelancers have no downloadable invoice for accounting or tax filing.
- [ ] **MEDIUM** — **Multi-currency support.** Currency is a hardcoded `'INR'` literal in five separate places (`orders.service.ts`, `razorpay.service.ts`) rather than a configurable field — the platform cannot serve international customers/freelancers without a code change at every currency reference point.
- [ ] **LOW** — **Team/agency accounts.** `users` table has no company/organization concept — every account is a single individual, no way for an agency to operate multiple freelancers under one umbrella account.
- [ ] **LOW** — **Freelancer analytics** (profile views, service impressions, conversion rate). No view-count or analytics columns anywhere — freelancers can't tell which of their listings are actually being seen vs. booked.
- [ ] **LOW** — **Referral/affiliate program.** No referral mechanism anywhere in the codebase.
- [ ] **LOW** — **PWA/mobile app support.** No manifest.json, no service worker, no React Native directory — web-only, no installable app experience.
- [ ] **LOW** — **Client company/business profiles.** No B2B account type — every customer is treated as an individual, no company name/business fields.
- [ ] **LOW** — **In-app portfolio gallery.** Freelancers only get a single external `portfolio_url` link column — no in-app gallery of work samples/images typical of Fiverr seller profiles.
- [ ] **LOW** — **Buyer/seller protection policy pages.** Only generic `terms`/`privacy`/`cookies` pages exist — no dedicated "Trust & Safety" or protection-policy content typical of established marketplaces.
- [ ] **LOW** — **Search sort options.** `query-services.dto.ts` supports category/price/text filtering and pagination, but no sort-by parameter (best-selling, newest, highest-rated) at all.

### Partially present (🟡)
- [ ] **HIGH — Dispute evidence upload has a backend but zero frontend.** `disputes.controller.ts` fully implements `POST :id/upload-url` and `POST :id/evidence`, but no page in the entire frontend renders a file-upload widget or calls these endpoints — the only dispute UI is a plain textarea for a text reason (`orders/[id]/page.tsx`). This capability is built but completely unreachable by users. *(Also flagged as L7 in `AUDIT_FINDINGS.md`.)*
- [ ] **LOW — Support role exists but is disputes-only.** The `support` role and `/support/dashboard` route exist, but their scope is limited entirely to dispute mediation — there's no general customer-support ticketing system separate from disputes (e.g. "my payment didn't show up" outside the context of a formal order dispute).

### Confirmed already implemented — do not re-flag as missing
- [x] ✅ **Wallet/store-credit system** — fully implemented (`wallet/balance`, `wallet/topup-order`, `wallet/verify-topup`, `:id/wallet-checkout`) and is actually a feature *beyond* the Upwork/Fiverr baseline (neither platform has a prepaid wallet model).
- [x] ✅ **Double-entry escrow ledger** — genuinely more rigorous than most competitors' opaque internal balance tracking.
- [x] ✅ **Reviews system** — exists and is wired (see `reviews` module), covered in prior audits for UX polish, not a missing feature.
- [x] ✅ **Dispute mediation with admin/support resolution (refund/release/split)** — a real, functioning mediation system, more structured than many smaller marketplaces offer.

---

## Priority Roadmap (suggested, not prescriptive)

**Phase 1 — Trust & security-adjacent UX** (do alongside/right after the financial-security fixes in `AUDIT_FINDINGS.md`)
1. Password show/hide + strength meter + confirm-password (signup, reset-password)
2. Terms/Privacy consent checkbox on signup
3. Account lockout on repeated failed logins
4. Admin audit log (biggest single gap in the admin panel)
5. Admin migration confirmation dialog + actor tracking

**Phase 2 — Core dashboard usability**
6. Pagination + search on every listing (customer orders, freelancer orders/services/withdrawals, admin users/disputes)
7. CSV export on every listing (especially freelancer withdrawals — tax-critical)
8. Fix orphaned Customer Profile page (unreachable from nav)
9. All `useQuery` calls handle `isError` properly (freelancer dashboard)
10. Admin user detail page (backend already supports it)

**Phase 3 — SEO architecture**
11. Convert services/freelancer public pages to server components
12. Add robots.txt, sitemap.ts, per-page metadata, JSON-LD, Open Graph
13. Fix the `?category=` deep-link bug

**Phase 4 — Polish**
14. Tooltips on every icon-only button across all 3 dashboards
15. Breadcrumbs everywhere
16. URL-sync tab state on freelancer/admin dashboards
17. Earnings/spending report pages with charts
18. Everything else marked LOW above

**Phase 5 — Missing-feature roadmap** (product decisions, not bug fixes — sequence based on business priority)
19. Order requirements form + cancellation flow + revision requests — these three close the biggest *trust* gaps in the core booking flow and are comparatively low-effort schema/flow additions
20. Wire up the dispute evidence upload UI to the already-built backend endpoints (quick win — no new backend work needed)
21. In-app notifications (bell icon) — highest leverage for engagement/retention before investing in messaging
22. Messaging/chat system — the largest single feature gap, but also the largest build (real-time infra, moderation, notification integration)
23. Service packages/tiers + skills/tags — meaningfully improves both freelancer merchandising and customer search/filter quality
24. Auto-release escrow after N days — closes an operational gap (orders stuck indefinitely) with a single cron job
25. 2FA for login, social login, tax invoicing, multi-currency, milestones, custom offers, verification badges, wishlist, availability calendar — larger/lower-urgency items, sequence per business roadmap

---

*End of research. No code was changed. This document is a task-tracking checklist for future implementation work — check items off as they're completed.*
