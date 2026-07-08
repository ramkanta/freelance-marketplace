# Servify Backend Development Tasks

This is the living task list tracking the implementation progress of the Servify NestJS backend.

---

## Phase 1: Setup & Initialization
- [x] Initialize NestJS project starter
- [x] Configure Prettier, ESLint, and TypeScript settings
- [x] Integrate Swagger API documentation (`/api` route with Bearer auth)
- [x] Set up Supabase JS SDK client connection (`SupabaseModule`)
- [ ] Configure Docker Compose for local PostgreSQL and Redis
- [ ] Add `.env.example` documenting all required environment variables (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAYX_ACCOUNT_NUMBER`, `JWT_SECRET`)
- [ ] Fix broken `app.controller.spec.ts` test (references non-existent `getHello()` method)
- [ ] Remove empty `src/db/` placeholder folder or populate it with a database module

---

## Phase 2: Authentication & Profiles
- [x] Implement `users` table and registration/login flow — JWT token generation (`POST /api/v1/auth/signup`, `POST /api/v1/auth/login`)
- [x] Implement `freelancer_profiles` creation and profile management (`POST /api/v1/freelancers`, `GET /api/v1/freelancers/:userId`, `PATCH /api/v1/freelancers/:userId`)
- [x] Implement `GET /api/v1/freelancers` — query all active freelancer listings
- [x] Integrate RazorpayX contact + fund account onboarding (`POST /api/v1/freelancers/:userId/onboard-payouts`)
- [x] Integrate RazorpayX instant payout/withdrawal trigger (`POST /api/v1/freelancers/:userId/withdraw`)
- [x] Implement withdrawal history log query (`GET /api/v1/freelancers/:userId/withdrawals`)

---

## Phase 2.5: Security & Guards
- [x] Create `JwtAuthGuard` (`src/auth/jwt-auth.guard.ts`) — validates Bearer token, no passport dependency
- [x] Create `@Public()` decorator (`src/auth/public.decorator.ts`) — opt-out for open endpoints
- [x] Apply `JwtAuthGuard` globally via `APP_GUARD` in `AppModule` — all routes protected by default
- [x] Create `RolesGuard` (`src/auth/roles.guard.ts`) with `@Roles()` decorator — applied globally
- [x] Apply `@Roles('admin')` to entire `AdminController` (migrations endpoints)
- [x] Apply `@Roles('freelancer')` to `POST /api/v1/freelancers` (profile creation)
- [x] Mark `GET /api/v1/freelancers` and `GET /api/v1/freelancers/:userId` as `@Public()` (browse)
- [x] Mark `POST /api/v1/auth/signup` and `POST /api/v1/auth/login` as `@Public()`
- [x] Added `@ApiBearerAuth()` to controllers so Swagger UI shows the Authorize button
- [ ] Apply `@Roles('admin', 'support')` guard to dispute resolution endpoints (Phase 6)
- [ ] Add `@nestjs/throttler` rate limiting on auth endpoints (`/signup`, `/login`)
- [ ] Implement short-lived access tokens (15 min) + refresh token rotation strategy

---

## Phase 3: Services & Booking Calendar
- [x] Create `services` table migration (`20260708000000_create_services_table.sql`)
- [x] Implement `POST /api/v1/services` — freelancer creates a gig listing (`@Roles('freelancer')`)
- [x] Implement `GET /api/v1/services` — public browse with filters: category, minPrice, maxPrice, keyword, pagination
- [x] Implement `GET /api/v1/services/:id` — single service detail with freelancer profile join
- [x] Implement `PATCH /api/v1/services/:id` — freelancer updates own service (ownership check)
- [x] Implement `DELETE /api/v1/services/:id` — soft-delete own service (sets is_active=false)
- [x] Implement `GET /api/v1/services/by-freelancer/:freelancerProfileId` — all services by a freelancer
- [ ] Create `freelancer_availabilities` table migration
- [ ] Implement `POST /api/v1/freelancers/:id/availability` — freelancer sets available time slots
- [ ] Implement `GET /api/v1/freelancers/:id/calendar` — fetch open and booked slots
- [ ] Implement `POST /api/v1/freelancers/calendar/lock` — 5-minute Redis-backed slot lease
- [ ] Implement `DELETE /api/v1/freelancers/calendar/lock` — release slot lease on abort

---

## Phase 4: Order Management & Ledger Engine ✅ COMPLETE
- [x] `orders` table migration with `order_status` enum (7 states)
- [x] `ledger_entries` table migration — append-only, NEVER updated/deleted
- [x] `webhook_events` table migration — deduplication via unique `razorpay_event_id`
- [x] `POST /api/v1/orders` — create order, lock commission rate, returns Razorpay checkout config
- [x] `POST /api/v1/orders/:id/wallet-checkout` — pay using ledger balance (no gateway)
- [x] `GET /api/v1/orders` — list orders for authenticated user (customer or freelancer)
- [x] `GET /api/v1/orders/:id` — order detail with full ledger entry history
- [x] `GET /api/v1/orders/wallet/balance` — derived balance from ledger SUM (no mutable column)
- [x] `POST /api/v1/orders/wallet/deposit` — record wallet top-up into ledger
- [x] Double-Entry Ledger Engine
  - [x] `customer_deposit`: razorpay_gateway → customer_wallet:{userId}
  - [x] `escrow_lock`: customer_wallet:{userId} → platform_holding:{orderId}
  - [x] `escrow_release`: platform_holding:{orderId} → freelancer_wallet:{userId}
  - [x] `platform_commission`: platform_holding:{orderId} → platform_revenue
  - [x] Refund flow: platform_holding:{orderId} → customer_wallet:{userId} (via dispute resolution)
- [x] `POST /api/v1/orders/:id/mark-delivered` — freelancer marks delivered
- [x] `POST /api/v1/orders/:id/confirm` — customer confirms, triggers commission split + payout ledger entries
- [x] `POST /api/v1/orders/:id/dispute` — freezes escrow, transitions to `disputed`
- [x] `POST /api/v1/webhooks/razorpay` — HMAC-SHA256 verified, idempotent via webhook_events dedup

---

## Phase 5: Real-time Communications & WebSockets
- [ ] Install `@nestjs/websockets` and `socket.io` packages
- [ ] Create `chat_rooms` and `chat_messages` table migrations
- [ ] Set up Socket.io WebSocket gateway (`WS /chat`) with JWT handshake authentication
- [ ] Implement `chat:join` event — client joins order-specific room
- [ ] Implement `chat:message` event — emit and receive messages, persist to `chat_messages` table
- [ ] Implement `GET /api/v1/orders/:id/messages` — fetch historical chat messages for an order
- [ ] Create chat room automatically when an order reaches `payment_captured` status

---

## Phase 6: Mediation & Dispute Resolution ✅ COMPLETE
- [x] `disputes` table migration with `dispute_status` enum, assigned_to, evidence_urls JSONB
- [x] `POST /api/v1/orders/:id/dispute` — creates dispute record + freezes order to `disputed`
- [x] `GET /api/v1/disputes` — admin sees all, support sees own assigned cases, optional status filter
- [x] `GET /api/v1/disputes/:id` — dispute detail with order + service join
- [x] `POST /api/v1/disputes/:id/assign` — admin assigns dispute to support agent (admin only)
- [x] `POST /api/v1/disputes/:id/resolve` — 3 resolution modes with ledger entries:
  - [x] `resolved_refund` → platform_holding → customer_wallet (full refund)
  - [x] `resolved_release` → platform_holding → freelancer_wallet + platform_revenue
  - [x] `resolved_split` → proportional split with arbiter-set percentage + commission cut
- [x] `POST /api/v1/disputes/:id/escalate` — support escalates to admin queue
- [x] `POST /api/v1/disputes/:id/upload-url` — Supabase Storage pre-signed upload URL
- [x] `POST /api/v1/disputes/:id/evidence` — append uploaded file URL to dispute record
- [x] Orders ↔ Disputes circular dependency resolved via `forwardRef()`

---

## Phase 7: Queues & Automation
- [ ] Install BullMQ and `ioredis` packages
- [ ] Set up BullMQ queue module connected to Redis
- [ ] Implement automated escrow clawback delayed job
  - [ ] Schedule job for T + 7 days when freelancer marks order `service_delivered`
  - [ ] Job fires: if order still `service_delivered` (no dispute, no customer confirm), auto-complete and release payout
- [ ] Implement daily cron job for dynamic commission tier recalculation
  - [ ] Query `rating_avg` (last 30 days) and `V_monthly` (gross volume) per freelancer
  - [ ] Apply formula: `C_rate = max(C_min, C_base - α × R_avg - β × log10(V_monthly + 1))`
  - [ ] Update `freelancer_profiles.commission_tier` and log changes
- [ ] Implement transactional email notifications (Resend or Nodemailer)
  - [ ] Booking confirmed (customer + freelancer)
  - [ ] Escrow released / payout sent (freelancer)
  - [ ] Dispute opened (customer + freelancer + support)
  - [ ] Order auto-approved after 7-day clawback

---

## Phase 8: Ratings & Reviews
- [ ] Create `reviews` table migration (`order_id`, `reviewer_id`, `reviewee_id`, `rating` 1-5, `comment`)
- [ ] Implement `POST /api/v1/orders/:id/review` — customer submits rating after order `completed`
- [ ] Implement recalculation of `freelancer_profiles.rating_avg` on each new review submission
- [ ] Implement `GET /api/v1/freelancers/:id/reviews` — paginated review list for a freelancer profile

---

## Phase 9: Admin & Platform Management
- [ ] Implement `GET /api/v1/admin/users` — paginated user list with role filter (admin only)
- [ ] Implement `PATCH /api/v1/admin/users/:id/role` — admin changes user role (provision support agents)
- [ ] Implement `PATCH /api/v1/admin/users/:id/suspend` — admin suspends a user account
- [ ] Implement `GET /api/v1/admin/stats` — platform-wide aggregate stats (total escrow, active gigs, dispute count, monthly revenue)
- [ ] Add pagination (`?page=&limit=`) to all list endpoints (orders, services, disputes, withdrawals, reviews)

---

## Phase 10: Next.js Frontend Status (tracked in `frontend/task.md`)

> See `frontend/task.md` for all frontend tasks.

**Backend APIs needed by frontend (summary of blockers):**
- `GET /api/v1/services` — needed by services marketplace browse page
- `POST /api/v1/orders` — needed by booking/checkout flow
- `GET /api/v1/orders` — needed by customer/freelancer dashboards
- `GET /api/v1/admin/stats` — needed by admin analytics tab
- `GET /api/v1/admin/disputes` — needed by admin disputes tab
- WebSocket gateway — needed by real-time chat in support and order pages
