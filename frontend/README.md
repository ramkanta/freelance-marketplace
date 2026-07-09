# Servify — Frontend

Next.js 15 App Router frontend for the Servify freelance marketplace.

## Stack

- **Next.js 15** — App Router, server + client components
- **React 19** — with React Query v5 for server state
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible component primitives
- **Sonner** — toast notifications
- **js-cookie** — JWT token storage
- **axios** — HTTP client with 401 interceptor + silent refresh

## Setup

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_RAZORPAY_KEY_ID
npm run dev
```

Runs on `http://localhost:3001` (or 3000 if backend is not running).

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/services` | Browse + search service listings |
| `/services/[id]` | Service detail with booking + reviews |
| `/freelancers/[id]` | Freelancer public profile |
| `/login` | Email + password login |
| `/signup` | Customer or freelancer registration |
| `/forgot-password` | Request OTP reset email |
| `/reset-password` | Enter OTP + new password |
| `/customer/dashboard` | Orders, wallet top-up, dispute filing |
| `/customer/profile` | Edit name, reset password |
| `/freelancer/dashboard` | Services, orders, payouts (tabbed) |
| `/freelancer/profile` | Edit bio, category, portfolio URL |
| `/freelancer/onboard` | First-time freelancer profile setup |
| `/orders/[id]` | Order detail, timeline, ledger, review |
| `/admin/dashboard` | Analytics, disputes, migrations, settings |
| `/admin/users` | User management (ban, role change) |

## Auth

`AuthProvider` (`src/providers/AuthProvider.tsx`) stores user state in memory and syncs with `localStorage` + cookies. The axios interceptor in `src/lib/api.ts` silently refreshes the access token on 401 and fires a `auth:user-updated` custom event so the provider updates without a page reload.

## API Clients

All typed in `src/lib/`:

- `api.orders.ts` — orders, wallet top-up (Razorpay), wallet checkout
- `api.services.ts` — service CRUD, listing, detail
- `api.freelancers.ts` — profiles, withdrawals, payout onboarding
- `api.reviews.ts` — create, list by freelancer/service/order
- `api.disputes.ts` — file, assign, resolve, evidence upload
- `api.admin.ts` — platform stats, user management
