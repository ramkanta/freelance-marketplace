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

## Phase 2.5: Security & Guards (Critical — All Endpoints Currently Unprotected)
- [ ] Create `JwtStrategy` and `JwtAuthGuard` using `@nestjs/passport`
- [ ] Apply `JwtAuthGuard` to all protected endpoints (freelancers, orders, disputes, admin, chat)
- [ ] Create `RolesGuard` with `@Roles()` decorator for role-based access control
- [ ] Apply `@Roles('admin')` guard to all admin endpoints
- [ ] Apply `@Roles('admin', 'support')` guard to dispute resolution endpoints
- [ ] Apply `@Roles('freelancer')` guard to service creation and delivery endpoints
- [ ] Add `@nestjs/throttler` rate limiting on auth endpoints (`/signup`, `/login`)
- [ ] Implement short-lived access tokens (15 min) + refresh token rotation strategy
- [ ] Remove the intentional "unprotected for development" comment from middleware — protect the migration endpoints in production

---

## Phase 3: Services & Booking Calendar
- [ ] Create `services` table migration
- [ ] Implement `POST /api/v1/services` — freelancer creates a gig/service listing
- [ ] Implement `GET /api/v1/services` — public query with filters (category, minPrice, maxPrice, rating)
- [ ] Implement `GET /api/v1/services/:id` — single service detail
- [ ] Create `freelancer_availabilities` table migration
- [ ] Implement `POST /api/v1/freelancers/:id/availability` — freelancer sets available time slots
- [ ] Implement `GET /api/v1/freelancers/:id/calendar` — fetch open and booked slots for a freelancer
- [ ] Implement `POST /api/v1/freelancers/calendar/lock` — 5-minute Redis-backed slot lease before checkout
- [ ] Implement `DELETE /api/v1/freelancers/calendar/lock` — release slot lease on checkout abort

---

## Phase 4: Order Management & Ledger Engine
- [ ] Create `orders` table migration with `order_status` enum (`pending_payment`, `payment_captured`, `service_delivered`, `completed`, `disputed`, `refunded`, `payout_released`)
- [ ] Create `ledger_entries` table migration (append-only, never updated or deleted)
- [ ] Implement `POST /api/v1/orders` — initialize order, lock commission rate, reserve calendar slot, return Razorpay checkout config
- [ ] Implement `POST /api/v1/orders/:id/wallet-checkout` — instant payment using customer's derived ledger balance
- [ ] Implement `GET /api/v1/orders` — list orders for authenticated customer or freelancer
- [ ] Implement `GET /api/v1/orders/:id` — single order detail with ledger entries
- [ ] Implement the append-only Double-Entry Ledger Accounting Engine
  - [ ] `customer_deposit` → `customer_wallet` entries on wallet top-up
  - [ ] `customer_wallet` → `platform_holding` entries on order escrow lock
  - [ ] `platform_holding` → `freelancer` + `platform_revenue` entries on payout release
  - [ ] `platform_holding` → `customer_wallet` entries on full refund
- [ ] Implement derived balance calculation query (`SELECT COALESCE(SUM(...)) FROM ledger_entries`) — no mutable balance column
- [ ] Implement `POST /api/v1/orders/:id/mark-delivered` — freelancer marks order as `service_delivered`
- [ ] Implement `POST /api/v1/orders/:id/confirm` — customer approves delivery, triggers payout logic with dynamic commission
- [ ] Implement `POST /api/v1/orders/:id/dispute` — customer transitions order to `disputed`, freezes escrow
- [ ] Implement cryptographically signed webhook processor for Razorpay events (`POST /api/v1/webhooks/razorpay`)
  - [ ] Verify `x-razorpay-signature` HMAC-SHA256 header on every incoming webhook
  - [ ] Deduplicate events via `webhook_events` table (`razorpay_event_id` unique constraint)
  - [ ] Handle `payment.captured` event — transition order to `payment_captured`, write ledger entries

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

## Phase 6: Mediation & Dispute Resolution
- [ ] Create `disputes` table migration
- [ ] Implement `POST /api/v1/orders/:id/dispute` — create dispute record, freeze escrow ledger lines
- [ ] Spawn mediation chat room on dispute creation (assign support agent automatically or via queue)
- [ ] Implement `GET /api/v1/admin/disputes` — list all open disputes (admin/support only)
- [ ] Implement `POST /api/v1/admin/disputes/:id/resolve` — support/admin executes settlement
  - [ ] Full refund → write `platform_holding` → `customer_wallet` ledger entry
  - [ ] Full release → write `platform_holding` → `freelancer` + `platform_revenue` entries
  - [ ] Partial split → write proportional ledger entries as configured by arbiter
- [ ] Replace AWS S3 with Supabase Storage for dispute file evidence (same stack, no extra AWS dependency)
  - [ ] Implement `POST /api/v1/disputes/:id/upload-url` — generate Supabase Storage pre-signed upload URL
  - [ ] Store uploaded evidence file URLs on the `disputes` record

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
