# Servify Frontend Development Tasks

This task list tracks the progress of the Next.js frontend implementation and its integration with the NestJS backend.

> **Note on mocked data:** Several dashboard pages are UI-complete but run on hardcoded mock data.
> Tasks marked `[~]` mean the UI shell is built but the feature is NOT connected to real backend APIs yet.

---

## UI Foundation — Step-by-Step Implementation Order

> **Do these in order before touching any new feature pages.**
> Every page depends on these. Building dashboards before this foundation exists means rewriting everything later.

### Step 1 — Shared Navbar Component (`src/components/layout/Navbar.tsx`)
- [x] Create shared `<Navbar />` component used by all pages via root `layout.tsx`
  - [x] Servify logo (left side)
  - [x] Role-aware nav links — different links shown per role (customer / freelancer / admin / support)
  - [x] Auth state: show user name + role badge when logged in; show Sign In / Get Started when not
  - [x] Role-based dashboard quick link after login (`/customer/dashboard`, `/freelancer/dashboard`, etc.)
  - [x] Logout button
  - [x] Dark / light mode toggle (moved here from homepage local state)
  - [x] Mobile hamburger drawer (full menu on small screens)
  - [x] Fully responsive: `hidden md:flex` desktop nav + `md:hidden` mobile trigger

### Step 2 — Shared Footer Component (`src/components/layout/Footer.tsx`)
- [x] Create shared `<Footer />` component used by all pages via root `layout.tsx`
  - [x] Servify logo + tagline
  - [x] Navigation columns (Company, Legal)
  - [x] Privacy Policy and Terms of Service links (real routes, not dead `href="#"`)
  - [x] Copyright line
  - [x] Responsive: stacked on mobile, columns on desktop

### Step 3 — Global Theme System (lift out of homepage local state)
- [x] Move dark/light theme logic from `app/page.tsx` into `ThemeProvider` (`providers/ThemeProvider.tsx`)
  - [x] Apply `dark` class on `<html>` globally so all pages inherit the theme
  - [x] Persist theme preference in localStorage
  - [x] Respect system `prefers-color-scheme` as default
  - [x] Remove the duplicated theme toggle code from `app/page.tsx`
- [x] Add `dark:` variant Tailwind classes to Login, Signup, and Onboard pages

### Step 4 — Fix Login & Signup Pages
- [x] Add responsive breakpoints to `/login` — split layout: branding panel left (`lg:w-1/2`), form right
- [x] Add responsive breakpoints to `/signup` — split layout with stats panel
- [x] Add light mode support to both pages (inherits from global ThemeProvider)
- [x] Add responsive breakpoints to `/freelancer/onboard` — split layout with 3-step guide panel

### Step 5 — Fix Homepage
- [x] Remove the inline Navbar/header from `app/page.tsx` — uses shared `<Navbar />` via root layout
- [x] Remove the inline Footer from `app/page.tsx` — uses shared `<Footer />` via root layout
- [x] "Search Experts" button links to `/services`
- [x] `id="how-it-works"` anchor added to How It Works section
- [x] Role-based redirect after login implemented in login/signup pages via `ROLE_DASHBOARD` map
- [ ] Replace hardcoded 3 freelancer cards with real data from `GET /api/v1/freelancers` (when API ready)

### Step 6 — Dashboard UI Polish (all 4 dashboards)
- [x] Dashboards use shared `<Navbar />` and `<Footer />` via root layout (no per-page inline header)
- [x] Replace all 11 raw `alert()` calls with sonner toast notifications
  - [x] Installed and configured `sonner` with `<Toaster />` in root layout
  - [x] Replaced: 3 in `freelancer/dashboard`, 2 in `customer/dashboard`, 2 in `support/dashboard`, 4 in `admin/dashboard`
- [x] Fixed all `slate-850` and `slate-905` non-standard Tailwind colors (replaced with `slate-800` / `slate-900`)
- [x] **Customer Dashboard** mobile fixes
  - [x] 3 stat cards use `grid md:grid-cols-3`
- [x] **Admin Dashboard** mobile fixes
  - [x] Tab bar uses `flex flex-wrap gap-1` — no overflow on mobile
- [x] **Support Dashboard** tablet fix
  - [x] Grid uses `md:grid-cols-2 lg:grid-cols-3` — no abrupt collapse on tablets
- [x] `Label` import cleaned up in both `customer/dashboard` and `support/dashboard`
- [x] Fixed Vercel build: renamed `middleware.ts` → `proxy.ts`, export renamed to `proxy()`
- [x] Fixed ThemeProvider SSR crash (`useTheme must be used within ThemeProvider` on `/_not-found`)

---

## Phase 1: Setup & Initialization
- [x] Initialize Next.js app with TypeScript and Tailwind CSS
- [x] Configure shadcn/ui component library (`button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`)
- [x] Set up Axios base client with JWT authorization interceptors (`lib/api.ts`)
- [x] Set up TanStack React Query Provider (`providers/QueryProvider.tsx`)
- [x] Set up AuthProvider context with cookie-based token storage (`providers/AuthProvider.tsx`)
- [x] Set up Next.js proxy for protected route redirects (`proxy.ts` — renamed from `middleware.ts` for Next.js 16.2.10)

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
  - [x] Role-based dashboard shortcut link in shared Navbar (role → dashboard route via `ROLE_DASHBOARD` map)
  - [x] Footer Privacy Policy and Terms of Service use real routes (not dead links)
- [x] **Authentication Screens**
  - [x] Build `/signup` page with form validation and role selector
  - [x] Build `/login` page with form validation
  - [x] Responsive split layout on Login (branding panel left, form right — `lg:w-1/2`)
  - [x] Responsive split layout on Signup (stats panel left, form right)
  - [x] Full light/dark mode support on Login and Signup pages

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

## Phase 5: Quality Fixes & Shared Components ✅ COMPLETE
- [x] **Create shared `<Navbar />` component** (`src/components/layout/Navbar.tsx`)
  - [x] Sticky header with Servify logo
  - [x] Role-aware navigation links (different links per role)
  - [x] Auth state display (user name + role badge, logout button)
  - [x] Mobile hamburger drawer
  - [x] Dark/light mode toggle
- [x] **Role-based redirect after login** — implemented in login/signup via `ROLE_DASHBOARD` map
  - [x] `freelancer` → `/freelancer/dashboard`
  - [x] `customer` → `/customer/dashboard`
  - [x] `support` → `/support/dashboard`
  - [x] `admin` → `/admin/dashboard`
- [x] **Replaced all 11 `alert()` calls** with sonner toasts across all 4 dashboards
- [x] **Fixed all 49 non-standard Tailwind color classes** (`slate-850` → `slate-800`, `slate-905` → `slate-900`)
- [ ] **Remove duplicate `/admin/migrations` standalone page** — same functionality already exists as a tab in `/admin/dashboard`
- [x] Removed unused `Label` import from `customer/dashboard/page.tsx` (Label IS used — kept correctly)
- [x] Cleaned up `Label` import in `support/dashboard/page.tsx` (confirmed unused, removed)

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
  - [x] Fix admin tab bar overflow on mobile — uses `flex flex-wrap gap-1`
  - [ ] Add admin user management panel (view users, change roles, suspend accounts)
- [ ] **Support Dashboard** (`/support/dashboard`)
  - [~] Dispute case list UI exists — connect to real `GET /api/v1/admin/disputes?assignedTo=me`
  - [~] Mediation chat UI exists — upgrade to real Socket.io WebSocket when Phase 7 is ready
  - [x] Fix `lg:grid-cols-3` grid — now uses `md:grid-cols-2 lg:grid-cols-3`

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
