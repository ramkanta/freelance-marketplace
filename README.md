# Servify — Freelance Marketplace with Escrow Payments

A full-stack freelance marketplace where customers hire freelancers, funds are held in escrow until delivery is approved, and payouts are processed via RazorpayX IMPS. Built as a portfolio project demonstrating production-grade architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, React Query v5 |
| Backend | NestJS 11, Fastify adapter, Swagger |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | JWT access tokens (15 min) + refresh token rotation (SHA-256 hashed, 30 days) |
| Payments | Razorpay checkout (wallet top-up), RazorpayX (freelancer payouts via IMPS) |
| Email | Brevo transactional email (20+ lifecycle events) |
| Accounting | Double-entry ledger (`ledger_entries` table, append-only) |

---

## Project Structure

```
freelance-marketplace/
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── auth/         # JWT auth, refresh tokens, OTP password reset
│   │   ├── orders/       # Order lifecycle, escrow, wallet top-up
│   │   ├── services/     # Freelancer service listings
│   │   ├── freelancers/  # Profiles, RazorpayX onboarding, withdrawals
│   │   ├── disputes/     # Dispute filing, mediation, resolution
│   │   ├── reviews/      # Customer reviews per order
│   │   ├── admin/        # User management, migrations console, platform stats
│   │   ├── email/        # Brevo email service (global module)
│   │   └── razorpay/     # Razorpay + RazorpayX service
│   └── supabase/
│       └── migrations/   # SQL migration files (run via Admin Console)
└── frontend/         # Next.js App Router
    └── src/
        ├── app/
        │   ├── (public)  landing, services, freelancers/[id], services/[id]
        │   ├── customer/ dashboard, profile
        │   ├── freelancer/ dashboard, profile, onboard
        │   ├── admin/    dashboard (analytics, disputes, migrations), users
        │   ├── orders/[id]
        │   ├── login, signup, forgot-password, reset-password
        │   └── privacy, terms, cookies
        ├── lib/          # Typed API clients (api.orders, api.services, ...)
        └── providers/    # AuthProvider, ThemeProvider
```

---

## Core Flows

### Order Lifecycle
```
Customer funds wallet (Razorpay checkout + HMAC-SHA256 verify)
  → Browse services → Book → Wallet checkout (escrow lock)
  → Freelancer marks delivered → Customer approves
  → Escrow released → Freelancer withdraws (RazorpayX IMPS)
```

### Dispute Flow
```
Customer files dispute → Escrow frozen → Admin assigns to support agent
  → Agent reviews → Resolve: Full Refund | Full Release | Split %
  → Ledger updated + emails sent to both parties
```

### Auth Flow
```
Signup/Login → JWT access token (15 min) + refresh token (30 days, SHA-256 hashed in DB)
  → Silent refresh on 401 (axios interceptor, retry queue)
  → Password reset: OTP email (6-digit, 15 min expiry) → all devices logged out on reset
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode works)
- A [Brevo](https://brevo.com) account for transactional email

### 1. Clone & install

```bash
git clone <repo-url>
cd freelance-marketplace

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL,
#          JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
#          RAZORPAYX_ACCOUNT_NUMBER, BREVO_API_KEY, BREVO_SENDER_EMAIL

# Frontend
cp frontend/.env.example frontend/.env.local
# Fill in: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_RAZORPAY_KEY_ID
```

### 3. Run database migrations

Start the backend, log in as admin, go to **Admin → Migrations** and click **Run All**. Migrations are idempotent (safe to re-run).

Or run them directly via psql:
```bash
psql $DATABASE_URL -f backend/supabase/migrations/<filename>.sql
```

### 4. Start development servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend && npm run start:dev

# Terminal 2 — Frontend (http://localhost:3001)
cd frontend && npm run dev
```

Swagger API docs: `http://localhost:3000/api/docs`

---

## Key Features

### For Customers
- Browse and search freelancer services (filter by category, price range)
- Fund Servify wallet via Razorpay (HMAC-SHA256 signature verified server-side)
- Book services — funds locked in escrow until approval
- Approve delivery to release payment, or file a dispute
- Leave reviews after order completion
- Full order timeline with escrow ledger breakdown

### For Freelancers
- Create and manage services (title, category, price, delivery days)
- Toggle services active/paused
- Edit services inline
- View orders, mark as delivered
- Link bank account via RazorpayX for IMPS payouts
- Withdraw earnings (server-side balance validation)
- View withdrawal history

### For Admins
- Platform analytics: users, orders, escrow totals, dispute breakdown (real-time from DB)
- Dispute management: assign to agent, resolve with full refund / full release / custom split
- User management: search, filter by role/status, ban/unban, change roles
- SQL migration console: run individual or all pending migrations from the UI

---

## Security Notes

- All freelancer mutation routes (`PATCH`, withdraw, onboard) require `@Roles('freelancer')` + ownership check (`req.user.sub === params.userId`)
- Wallet top-up: amount verified via Razorpay API server-side (prevents client-side tampering)
- Withdrawal: server-side available-balance check before any Razorpay payout is triggered
- Password reset: OTP always returns same response regardless of email existence (prevents enumeration)
- Refresh tokens: SHA-256 hashed in DB, rotated on every use, all revoked on password reset
- Admin routes: `@Roles('admin')` guard on all admin controllers

---

## Environment Variables Reference

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list with descriptions.

---

## Deployment

| Service | Platform |
|---|---|
| Backend | Render (Web Service, Node 20) |
| Frontend | Vercel |
| Database | Supabase (hosted PostgreSQL) |
| Email | Brevo |
| Payments | Razorpay (India) |

---

## License

MIT
