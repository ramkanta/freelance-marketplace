# Servify Development Tasks

This is the living task list tracking the implementation progress of the Servify marketplace backend.

## Phase 1: Setup & Initialization
- [x] Initialize NestJS project starter
- [x] Configure Prettier, ESLint, and TypeScript settings
- [x] Integrate Swagger API documentation (`/api` route)
- [x] Set up Supabase JS SDK client connection
- [ ] Configure Docker Compose for local PostgreSQL and Redis

## Phase 2: Authentication & Profiles
- [x] Implement `users` table and registration/login flow (JWT authentication)
- [x] Implement `freelancer_profiles` creation and details management
- [x] Integrate RazorpayX onboarding & payout endpoints (Contacts, Fund Accounts & Payouts)

## Phase 3: Services & Booking Calendar
- [ ] Implement gig `services` creation and active listings query
- [ ] Create `freelancer_availabilities` calendar schema
- [ ] Implement temporary 5-minute Redis-backed calendar slot lease/locking logic

## Phase 4: Order Management & Ledger Engine
- [ ] Create `orders` table and state machine transitions
- [ ] Implement the append-only `ledger_entries` Double-Entry Accounting Engine
- [ ] Implement derived balance calculation query for the customer wallet
- [ ] Build RazorpayX payout/withdraw integration (escrow payouts & platform commission)
- [ ] Implement cryptographically signed webhook processor for Razorpay events

## Phase 5: Real-time Communications & WebSockets
- [ ] Set up Socket.io WebSocket gateway (`WS /chat`) with JWT handshake
- [ ] Build chat message persistence in PostgreSQL

## Phase 6: Mediation & Dispute Resolution
- [ ] Implement dispute creation (`disputes` table)
- [ ] Spawn interactive mediation rooms upon dispute trigger
- [ ] Integrate AWS S3 pre-signed URLs for dispute file evidence uploads
- [ ] Build admin/support dispute resolution payouts and ledger overrides

## Phase 7: Queues & Automation Tiers
- [ ] Set up BullMQ for delayed job queues
- [ ] Implement automated escrow clawback (7-day auto-approval queue)
- [ ] Implement daily cron job for recalculating performance-based commission tier percentages ($C_{\text{rate}}$)

## Phase 8: Next.js Frontend Integration
- [x] Initialize Next.js app inside `frontend/` folder
- [x] Configure Tailwind CSS and shadcn/ui library
- [x] Set up TanStack React Query Provider and Axios API client
- [x] Create Login & Signup pages UI with form validation
- [x] Integrate Authentication pages with backend APIs
- [x] Implement Freelancer Profiles onboarding form and dashboard UI
- [ ] Upgrade **Freelancer Dashboard** with Withdrawals History Log (status tracking)
- [ ] Build **Customer Dashboard** (`/customer/dashboard`)
  - [ ] Browse services marketplace & top-rated sellers
  - [ ] View active bookings/orders & receipt invoices
  - [ ] View customer wallet ledger balance & deposit history
  - [ ] File order disputes/cancellation triggers
- [ ] Build **Admin Console Dashboard** (`/admin/dashboard`)
  - [ ] Platform statistics (Total Escrow, Active Gigs, Dispute metrics)
  - [ ] Integrate Database Migrations Runner tab (moved from separate page)
  - [ ] Platform settings (Global commission tier configurations)
  - [ ] Open disputes list & arbiter override controls
- [ ] Build **Support Agent Dashboard** (`/support/dashboard`)
  - [ ] View assigned disputes & open mediation room tickets
  - [ ] Support-side chat client wrapper for WebSocket rooms

