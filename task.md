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
- [ ] Implement `freelancer_profiles` creation and details management
- [ ] Integrate Razorpay onboarding endpoints (provisioning Linked Accounts)

## Phase 3: Services & Booking Calendar
- [ ] Implement gig `services` creation and active listings query
- [ ] Create `freelancer_availabilities` calendar schema
- [ ] Implement temporary 5-minute Redis-backed calendar slot lease/locking logic

## Phase 4: Order Management & Ledger Engine
- [ ] Create `orders` table and state machine transitions
- [ ] Implement the append-only `ledger_entries` Double-Entry Accounting Engine
- [ ] Implement derived balance calculation query for the customer wallet
- [ ] Build Razorpay Route split payment integration (escrow payouts & platform commission)
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
