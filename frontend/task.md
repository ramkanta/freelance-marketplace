# Servify Frontend Development Tasks

This task list tracks the progress of the Next.js frontend implementation and its integration with the NestJS backend.

> **Note on mocked data:** Several dashboard pages are UI-complete but run on hardcoded mock data.
> Tasks marked `[~]` mean the UI shell is built but the feature is NOT connected to real backend APIs yet.

---

## Phase 1: Setup & Initialization
- [x] Initialize Next.js app with TypeScript and Tailwind CSS
- [x] Configure shadcn/ui component library (`button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`)
- [x] Set up Axios base client with JWT authorization interceptors (`lib/api.ts`)
- [x] Set up TanStack React Query Provider (`providers/QueryProvider.tsx`)
- [x] Set up AuthProvider context with cookie-based token storage (`providers/AuthProvider.tsx`)
- [x] Set up Next.js middleware for protected route redirects (`middleware.ts`)

---

## Phase 2: Core Pages & UI Design
- [x] **Home Page / Marketplace Landing Page** (`/`)
  - [x] Design hero section with search bar placeholder
  - [x] Design 3-column value props cards (Escrow, Ledger, Split Payouts)
  - [x] Design top-rated freelancer showcase cards (currently hardcoded static data)
  - [x] Responsive mobile hamburger menu & navigation drawer
  - [x] Light & dark mode toggle with localStorage persistence
  - [ ] Wire up "Find Experts" / "Explore Gigs" / "How it Works" nav links (currently `href="#"`)
  - [ ] Wire up homepage search box to `GET /api/v1/services?query=` when services API exists
  - [ ] Replace hardcoded freelancer cards with real data from `GET /api/v1/freelancers`
  - [ ] Add role-based dashboard shortcut link in navbar after login (freelancer → `/freelancer/dashboard`, customer → `/customer/dashboard`)
  - [ ] Fix footer Privacy Policy and Terms of Service dead links
- [x] **Authentication Screens**
  - [x] Build `/signup` page with form validation and role selector
  - [x] Build `/login` page with form validation
  - [ ] Add responsive breakpoints to Login page (currently renders identically on all screen sizes)
  - [ ] Add responsive breakpoints to Signup page (currently renders identically on all screen sizes)
  - [ ] Add light mode support to Login/Signup pages (currently hardcoded dark `bg-slate-950`)

---

## Phase 3: Backend API Integration (Auth)
- [x] Integrate signup API (`POST /api/v1/auth/signup`)
- [x] Integrate login API (`POST /api/v1/auth/login`)
- [x] JWT token storage in secure cookie (7-day expiry, sameSite strict)
- [x] Auth session display and Logout action in homepage navbar
- [x] Route guard middleware redirecting unauthenticated users from protected routes

---

## Phase 4: Freelancer Profile Dashboard
- [x] Freelancer onboarding form UI (`/freelancer/onboard`) — category, bio
- [x] Integrate onboarding API (`POST /api/v1/freelancers`)
- [x] Freelancer dashboard: profile detail view with edit mode (`/freelancer/dashboard`)
- [x] Freelancer dashboard: RazorpayX bank account onboarding form (Phone, Account No., IFSC)
- [x] Freelancer dashboard: instant withdrawal form (amount input + trigger)
- [x] Freelancer dashboard: withdrawal history log table (payout ID, amount, status, date)
- [ ] Add responsive breakpoints to Freelancer Onboard page (currently no `sm:/md:/lg:` classes)
- [ ] Connect Freelancer dashboard wallet balance to real ledger API (currently hardcoded `₹1,500.00`)

---

## Phase 5: Quality Fixes & Shared Components (Must Do Before New Pages)
- [ ] **Create shared `<Navbar />` component** — currently every page rebuilds its own header from scratch
  - [ ] Sticky header with Servify logo
  - [ ] Role-aware navigation links (different links per role)
  - [ ] Auth state display (user name, logout button)
  - [ ] Mobile hamburger drawer
  - [ ] Dark/light mode toggle
- [ ] **Add role-based redirect after login** — currently all users land on homepage with no dashboard link
  - [ ] `freelancer` role → redirect to `/freelancer/dashboard`
  - [ ] `customer` role → redirect to `/customer/dashboard`
  - [ ] `support` role → redirect to `/support/dashboard`
  - [ ] `admin` role → redirect to `/admin/dashboard`
- [ ] **Replace all `alert()` calls with a toast notification component** (11 raw `alert()` calls across 4 pages)
- [ ] **Fix non-standard Tailwind color classes** — `slate-850` and `slate-905` don't exist in Tailwind's palette (49 occurrences — replace with `slate-800` or `slate-900`)
- [ ] **Remove duplicate `/admin/migrations` standalone page** — same functionality already exists as a tab in `/admin/dashboard`
- [ ] Remove unused `Label` import from `customer/dashboard/page.tsx`
- [ ] Remove unused `Label` import from `support/dashboard/page.tsx`

---

## Phase 6: Multi-Role Dashboard API Integration
- [ ] **Freelancer Dashboard**
  - [ ] Connect wallet balance to real ledger balance API
  - [ ] Connect withdrawal history to real `GET /api/v1/freelancers/:userId/withdrawals`
  - [ ] Add responsive improvements to sparse sections (currently 6 breakpoints across 578 lines)
- [ ] **Customer Dashboard** (`/customer/dashboard`)
  - [~] Bookings list UI shell exists — connect to real `GET /api/v1/orders` when orders API is ready
  - [~] Wallet balance UI exists — connect to real ledger balance API
  - [~] Deposit form UI exists — integrate Razorpay Checkout for real wallet top-up
  - [~] Dispute form UI exists — wire to real `POST /api/v1/orders/:id/dispute`
  - [ ] Add "Confirm Delivery" action wired to real `POST /api/v1/orders/:id/confirm`
  - [ ] Add responsive improvements to stat cards section (3 cards stacked vertically, no grid on mobile)
- [ ] **Admin Dashboard Console** (`/admin/dashboard`)
  - [~] Analytics tab UI exists — connect to real `GET /api/v1/admin/stats` when available
  - [ ] Build real charts/graphs for escrow volumes and revenue (currently an empty placeholder div)
  - [~] Disputes tab UI exists — connect to real `GET /api/v1/admin/disputes`
  - [ ] Wire dispute resolution buttons to real `POST /api/v1/admin/disputes/:id/resolve`
  - [~] Settings tab UI exists — wire commission save to real backend config endpoint
  - [ ] Fix admin tab bar overflow on mobile (4 text tabs in a row with no wrapping or scroll)
  - [ ] Add admin user management panel (view users, change roles, suspend accounts)
- [ ] **Support Dashboard** (`/support/dashboard`)
  - [~] Dispute case list UI exists — connect to real `GET /api/v1/admin/disputes?assignedTo=me`
  - [~] Mediation chat UI exists — upgrade to real Socket.io WebSocket when Phase 7 is ready
  - [ ] Fix `lg:grid-cols-3` grid — add `md:` breakpoint fallback (currently collapses abruptly on tablets)

---

## Phase 7: Services Marketplace & Booking Flow (Not Started)
- [ ] Build public `/services` browse page — display gig listings from `GET /api/v1/services`
  - [ ] Category filter, price range filter, rating sort
  - [ ] Service card grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- [ ] Build individual freelancer profile page (`/freelancers/:id`)
  - [ ] Profile header (name, category, rating, bio)
  - [ ] Service listings by this freelancer
  - [ ] Availability calendar UI (weekly grid with open/booked slots)
- [ ] Build time-slot booking UI
  - [ ] Slot selection with 5-minute lock indicator (countdown timer during checkout)
  - [ ] Order summary (service, slot, price, commission breakdown)
  - [ ] Razorpay Checkout integration for payment
- [ ] Build order tracking/status page (`/orders/:id`)
  - [ ] Order status timeline (pending → captured → delivered → completed)
  - [ ] Receipt/invoice view with ledger entry breakdown
  - [ ] "Mark as Delivered" button for freelancer
  - [ ] "Confirm Delivery" and "File Dispute" buttons for customer
- [ ] Add pagination controls to all list views (bookings, services, reviews)

---

## Phase 8: Real-time Chat Integration (Depends on Backend Phase 5)
- [ ] Install and configure Socket.io client
- [ ] Build chat message component (message bubbles, sender name, timestamp)
- [ ] Integrate real-time chat into order page (`/orders/:id`)
  - [ ] Connect to WebSocket gateway with JWT auth on socket handshake
  - [ ] Emit `chat:join` on page load to subscribe to order room
  - [ ] Send and receive `chat:message` events in real time
  - [ ] Load historical messages from `GET /api/v1/orders/:id/messages` on mount
- [ ] Upgrade support dashboard mediation room to real Socket.io chat

---

## Phase 9: Evidence Uploads & Dispute UI (Depends on Backend Phase 6)
- [ ] Build file upload component for dispute evidence
  - [ ] Fetch Supabase Storage pre-signed upload URL from backend
  - [ ] Support image and video file types
  - [ ] Show upload progress bar and preview thumbnail
- [ ] Add evidence upload section to dispute filing form in customer dashboard
- [ ] Display uploaded evidence files in support dashboard mediation workspace

---

## Phase 10: Ratings & Reviews (Depends on Backend Phase 8)
- [ ] Build star-rating submission form shown after order reaches `completed` status
- [ ] Display freelancer reviews list on public profile page
- [ ] Show average rating badge on freelancer cards on homepage and services page

---

## Phase 11: Notifications
- [ ] Add notification bell icon to shared Navbar
- [ ] Build notifications dropdown (new message, order status change, dispute opened)
- [ ] Poll for unread notifications via React Query (`GET /api/v1/notifications` at 30s interval)
