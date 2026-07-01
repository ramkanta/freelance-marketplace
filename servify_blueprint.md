# Comprehensive Technical, Functional, & Business Blueprint: Servify

Servify is an on-demand service and freelance marketplace designed to handle escrow-based checkouts, dynamic split payouts via Razorpay Route (Linked Accounts), and financial auditability utilizing a double-entry ledger engine.

This document serves as the comprehensive source of truth for both system architecture and user-facing workflows.

---

## 1. System Roles & Access Control

To support a dynamic marketplace ecosystem, Servify supports four distinct roles. A single user entity can cycle between both Customer and Freelancer roles under a unified profile, while Admin and Support roles remain strictly isolated.

```
                     ┌────────────────────────────────────────┐
                      │               User Table               │
                      │   - id, email, password_hash, role     │
                      └───────────────────┬────────────────────┘
                                          │
        ┌────────────────────────┬────────┴────────┬────────────────────────┐
        ▼                        ▼                 ▼                        ▼
┌───────────────┐        ┌───────────────┐ ┌───────────────┐        ┌───────────────┐
│ Customer Role │        │Freelancer Role│ │ Support Role  │        │  Admin Role   │
│- Search/Book  │        │- Create Gigs  │ │- Resolve      │        │- Total Access │
│- Wallet/Escrow│        │- Link Bank    │ │  Disputes     │        │- View Revenue │
│- Raise Dispute│        │- Deliver Gigs │ │- Moderate Chat│        │- Override     │
└───────────────┘        └───────────────┘ └───────────────┘        └───────────────┘
```

### 1. The Customer (Buyer)
* **Permissions:** Browse services, lock calendar booking slots, initiate orders, deposit funds to in-app wallets, fund escrow directly via Razorpay Checkout, chat in real-time with freelancers, mark services as delivered, raise disputes, and rate completed services.
* **Key Interface:** Dashboard to track active bookings, manage their personal wallet, release escrow funds, and chat with assigned freelancers.

### 2. The Freelancer (Seller)
* **Permissions:** Set up a professional profile, undergo Razorpay Linked Account onboarding (KYC, bank verification), configure active work availability calendars, list gig services, accept bookings, submit deliverables, and track ledger payouts.
* **Key Interface:** Financial ledger dashboard showing detailed credits, debits, pending/cleared balances, and real-time client chat rooms.

### 3. Support/Moderator (Platform Operations)
* **Permissions:** Limited-access administrative tier. Can access open disputes, read historical logs of disputed real-time chat rooms, and execute partial or full settlement overrides. They cannot access high-level platform revenue tables or alter system-wide payment coefficients.
* **Key Interface:** Mediation portal focusing exclusively on ticket queues, dispute resolution, and chat room archives.

### 4. The Admin (Platform Owner)
* **Permissions:** Complete system access. Oversees platform health, manages dynamic commission algorithms, processes platform ledger settlement sweeps, adjusts system fees, and manages Support/Moderator provisioning.
* **Key Interface:** Executive dashboard displaying platform health metrics, system-wide transaction volumes, and aggregated calculations:
  
  $$\text{Platform Net Revenue} = \sum \text{Platform Revenue Credits}$$

---

## 2. Additional Enterprise Features to Scale the Project

To transform Servify from a standard portfolio project into an enterprise-grade application, the following advanced features are integrated into this architecture:

### A. Performance-Based Platform Commission Tier Automation
Instead of flat commission rates, the backend automatically calculates dynamic platform fees based on historical sales volume ($V$) and rolling average ratings ($R$).

**Mathematical Logic:** The dynamic platform fee percentage ($C_{\text{rate}}$) is calculated using:

$$C_{\text{rate}} = \max\left(C_{\text{min}}, \ C_{\text{base}} - \alpha \cdot R_{\text{avg}} - \beta \cdot \log_{10}(V_{\text{monthly}} + 1)\right)$$

Where:
* $C_{\text{base}}$ = Base commission (e.g., $15\%$)
* $C_{\text{min}}$ = Floor commission limit (e.g., $5\%$)
* $R_{\text{avg}}$ = Average user rating over the last 30 days
* $V_{\text{monthly}}$ = Monthly gross processing volume in INR
* $\alpha, \beta$ = Tuning scaling factors (e.g., $\alpha = 1.5, \beta = 1.0$)

**Technical Implementation:** A daily NestJS cron job or BullMQ worker analyzes freelancer records, recalculates $C_{\text{rate}}$, updates their status in `freelancer_profiles.commission_tier`, and logs the changes.

### B. Dual-Party Evidence Dispute Mediation Portal
* **Workflow:** When a customer marks a booking as disputed, an interactive mediation room is spawned.
* **Technical Implementation:** Next.js uses secure, short-lived pre-signed URLs from AWS S3, allowing customers and freelancers to upload photo/video evidence. Socket.io facilitates real-time chat between the two parties, while an Admin dashboard allows platform operators to review the evidence and execute a partial or total payout split.

### C. Ledger-Backed In-App Customer Wallet
* **Workflow:** Instead of executing a fresh credit card transaction for minor booking adjustments, customers can top-up a digital wallet.
* **Technical Implementation:** The wallet does not write to a mutable `wallet.balance` column. It utilizes the double-entry accounting engine. Depositing funds credits the user's ledger, and booking an order debits the user's ledger and credits the escrow ledger line directly, completely removing external gateway latency at checkout.

### D. Real-Time In-App Chat (WebSockets)
* **Workflow:** Before and during bookings, customers and freelancers discuss scope, submit attachments, and log milestone updates.
* **Technical Implementation:** Implemented using NestJS Gateway (`@nestjs/websockets` via Socket.io) with JWT session handshakes. Chat logs are persisted to PostgreSQL to serve as immutable audit data in case of disputes.

### E. Time-Slot Availability Calendar & Concurrency Lock
* **Workflow:** Freelancers define their weekly schedules. Customers can select and lock precise calendar time slots.
* **Technical Implementation:** To prevent double-booking identical slots, NestJS employs an optimistic lock version check alongside a 5-minute Redis-backed temporary slot lease while the customer is on the checkout page.

### F. Automated Escrow Clawback Protection Queue
* **Workflow:** Prevents "hostage" funds where a customer deserts the platform after a service is marked as completed.
* **Technical Implementation:** Utilizes BullMQ delayed jobs. When a freelancer marks an order as `service_delivered`, a delayed job is scheduled for $T + \text{7 days}$. If the customer does not approve or dispute the delivery within 7 days, the job automatically fires, completes the state machine, generates the ledger entries, and initiates the Razorpay transfer.

---

## 3. End-to-End Layman Walkthrough (User Perspective)

This is how a standard non-technical user experiences the entire lifecycle of a transaction on Servify.

```
[Customer]             [Platform Escrow]            [Freelancer]
    │                          │                          │
    │─── 1. Pays ₹1,000 ──────>│                          │
    │    (Funds Locked)        │                          │
    │                          │                          │
    │                          │─── 2. Notifies Work ────>│
    │                          │    (Work Begins)         │
    │                          │                          │
    │                          │<── 3. Marks Completed ───│
    │                          │                          │
    │─── 4. Confirms Work ────>│                          │
    │                          │                          │
    │                          │─── 5. Route Transfer ───>│
    │                          │    Freelancer: ₹900      │
    │                          │    Platform Fee: ₹100    │
```

1. **Freelancer Joins the Platform:** Priya (a graphic designer) signs up. She inputs her bank account, IFSC, and business PAN to set up a linked profile. She configures her availability calendar, showing she has 3 slots open on Monday, and lists a "Logo Package" for ₹10,000.
2. **Discovery & Consultation:** Amit (a customer) logs in, searches "Logo Design," and filters by "Top-Rated." He finds Priya's profile, clicks her profile, and starts a real-time chat to ask, "Can you design a retro emblem style?" Priya replies, "Yes, select my Monday 10:00 AM slot."
3. **Locking the Time Slot & Depositing Funds:** Amit clicks Priya's calendar, selects Monday at 10:00 AM, and proceeds to pay. Behind the scenes, the system reserves that Monday slot for 5 minutes. Amit has a balance of ₹2,000 in his in-app wallet and pays the remaining ₹8,000 using UPI via Razorpay.
4. **Escrow Holding Phase:** The money is successfully captured. Amit sees that ₹10,000 has left his account. However, Priya does not receive this money yet. It is securely locked in Servify’s digital vault (the escrow holding account). Priya receives a notification: *"Booking confirmed for Monday 10:00 AM! Amit has funded the escrow. You can safely begin work."*
5. **Delivery & Confirmation:** Priya works on the design and uploads the draft through the chat room. Once finished, she uploads the final vector files and clicks "Mark as Delivered." Amit receives the files, reviews the final logo, and clicks "Approve Delivery."
6. **Dynamic Automated Split:** The platform immediately runs the calculations. It reads Priya's high-rating status, determining her commission fee is only 10% (instead of the standard 15%). The platform transfers ₹9,000 directly to Priya's linked bank account via Razorpay Route. The platform keeps ₹1,000 in its master account as commission. Priya’s dashboard instantly reflects her cleared funds, and Amit’s order updates to completed.
7. **What if a Dispute Occurs?:** If Amit was unsatisfied because Priya delivered an empty folder, Amit clicks "File a Dispute" before confirming delivery. The escrow funds remain frozen in the vault. A Support Agent joins their shared chat room to review the communication history. Seeing the empty delivery, the Support Agent clicks "Resolve with Full Customer Refund." The platform instantly processes a ledger transaction returning the ₹10,000 to Amit’s digital wallet.

---

## 4. Deep-Dive Ledger Mechanics (Technical Review)

The cornerstone of financial trust within Servify is the Double-Entry Ledger Accounting Engine.

### The Core Equation
Every transaction must be recorded with equal and offsetting accounts. At any moment, the system's balance sheets must equal zero:

$$\sum \text{Ledger Debits} + \sum \text{Ledger Credits} = 0$$

#### Scenario 1: Customer Deposits ₹10,000 into In-App Wallet
When Amit pays via Razorpay to load his wallet, the following immutable rows are created:

| Entry ID | Wallet ID | Account Type | Entry Type | Amount (Paise) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 001 | W-99 | `customer_deposit` | DEBIT | 1000000 | Gateway accepts ₹10k external funds |
| 002 | W-99 | `customer_wallet` | CREDIT | 1000000 | Amit's digital wallet credited |

#### Scenario 2: Booking an Order using In-App Wallet Balance (₹10,000)
When Amit uses his wallet to book Priya's service, funds are transferred out of his wallet and placed into platform escrow holding:

| Entry ID | Order ID | Account Type | Entry Type | Amount (Paise) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 003 | ORD-501 | `customer_wallet` | DEBIT | 1000000 | Amit's wallet balance decreased |
| 004 | ORD-501 | `platform_holding` | CREDIT | 1000000 | Escrow holding account credited |

#### Scenario 3: Payout Release (10% Commission Applied)
When Amit approves delivery, the escrow holding is emptied, and the money is split between the platform's revenue ledger and Priya's freelancer ledger:

| Entry ID | Order ID | Account Type | Entry Type | Amount (Paise) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 005 | ORD-501 | `platform_holding` | DEBIT | 1000000 | Escrow holding emptied |
| 006 | ORD-501 | `platform_revenue` | CREDIT | 100000 | 10% Platform commission captured |
| 007 | ORD-501 | `freelancer` | CREDIT | 900000 | 90% Priya's direct payout balance |

### Database Read Strategy: Derived Balances
We do not store `user.wallet_balance` as a mutable database column. If Priya requests to view her dashboard balance, NestJS runs a fast indexing query:

```sql
SELECT COALESCE(SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE -amount END), 0) AS balance
FROM ledger_entries
WHERE account_ref_id = $1 AND account_type = 'freelancer';
```

This design prevents database race conditions, eliminates data drift under heavy concurrency, and remains fully audit-proof.

---

## 5. System State Machine & Lifecycle Transitions

```
              [pending_payment]
                       │
                       │  (Wallet pay / Razorpay webhook confirmation)
                       ▼
               [payment_captured]  ◄──────────────────────────┐
                       │                                      │
                       │  (Freelancer: mark delivered)        │
                       ▼                                      │
              [service_delivered]                             │
                 ┌─────┴────────────────┐                     │
                 ▼                      ▼                     │
           (Customer)               (Customer)                │
            [completed]             [disputed]                │
                 │                      │                     │
                 │ (Split Transfer)     │ (Admin/Support)     │ (Full Refund)
                 ▼                      ├─────────────────────┴───────► [refunded]
          [payout_released]             │
                                        └─────────────────────────────► [completed]
```

---

## 6. Comprehensive Relational Database Schema (PostgreSQL)

```sql
-- Core User Table supporting multiple roles
CREATE TYPE user_role AS ENUM ('customer', 'freelancer', 'support', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE freelancer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    bio TEXT,
    rating_avg DECIMAL(3, 2) DEFAULT 5.00,
    commission_tier DECIMAL(5, 2) DEFAULT 15.00, -- dynamic rate percentage
    razorpay_linked_account_id VARCHAR(255),
    kyc_status VARCHAR(50) DEFAULT 'PENDING'
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL, -- in paise
    is_active BOOLEAN DEFAULT TRUE
);

-- Time-slot calendar availability 
CREATE TABLE freelancer_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_freelancer_slot UNIQUE (freelancer_id, slot_start)
);

CREATE TYPE order_status AS ENUM (
    'pending_payment', 'payment_captured', 'service_delivered', 
    'completed', 'disputed', 'refunded', 'payout_released'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id),
    freelancer_id UUID REFERENCES freelancer_profiles(id),
    service_id UUID REFERENCES services(id),
    availability_id UUID REFERENCES freelancer_availabilities(id),
    amount INT NOT NULL, -- in paise
    commission_amount INT NOT NULL,
    status order_status DEFAULT 'pending_payment',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Append-Only Financial Ledger (NEVER UPDATED OR DELETED)
CREATE TYPE ledger_account_type AS ENUM (
    'customer_deposit', 'customer_wallet', 'platform_holding', 'freelancer', 'platform_revenue'
);
CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit');

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    account_type ledger_account_type NOT NULL,
    account_ref_id UUID NOT NULL, -- references either user_id or freelancer_id
    entry_type ledger_entry_type NOT NULL,
    amount INT NOT NULL, -- in paise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    file_attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE REFERENCES orders(id),
    raised_by_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, RESOLVED_RELEASE, RESOLVED_REFUND, RESOLVED_SPLIT
    resolved_by_user_id UUID REFERENCES users(id) -- ID of support/admin agent
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razorpay_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Comprehensive API Routing Matrix

### Authentication & Profiles
* `POST /api/v1/auth/signup` - Registers a new user.
* `POST /api/v1/auth/login` - Authenticates and returns a JWT access token.
* `POST /api/v1/freelancers/onboard` - Accepts bank details to provision a Linked Account on Razorpay Route.

### Gig Services & Scheduling
* `GET /api/v1/freelancers` - Query and filter active listings.
* `POST /api/v1/services` - Creates a new service offering (Freelancer only).
* `GET /api/v1/freelancers/:id/calendar` - Fetches the freelancer's open and booked slots.
* `POST /api/v1/freelancers/calendar/lock` - Places a temporary 5-minute Redis-backed lock on a slot before checkout.

### Order Processing & Escrow Operations
* `POST /api/v1/orders` - Initializes order, locks commission rates, reserves slot, returns checkout config.
* `POST /api/v1/orders/:id/wallet-checkout` - Processes an instant payment using the user's derived ledger balance.
* `POST /api/v1/orders/:id/mark-delivered` - Transition status to `service_delivered` (Freelancer only).
* `POST /api/v1/orders/:id/confirm` - Transition status to `completed` and trigger automatic payout logic.
* `POST /api/v1/orders/:id/dispute` - Transition status to `disputed` and freeze escrow ledger lines.

### Webhook Engine (External Systems)
* `POST /api/v1/webhooks/razorpay` - Cryptographically signs, processes incoming Razorpay payments, and updates local state.

### Real-Time Communications Gateway (WebSockets)
* `WS /chat` - Establishes real-time persistent connections.
  - **Event:** `chat:join` - Joins order session room.
  - **Event:** `chat:message` - Emits/receives messages, logs transaction data into PostgreSQL.

### Administration & Dispute Arbitration
* `GET /api/v1/admin/disputes` - Lists open disputes.
* `POST /api/v1/admin/disputes/:id/resolve` - Support/Admin processes settlements (Full Refund, Full Release, or Partial Split).

---

## 8. Edge Cases & Advanced Mitigations

| Edge Case | Consequence | Mitigation |
| :--- | :--- | :--- |
| **Concurrent Booking Requests** | Two users attempt to book the exact same calendar slot at the same time. | A Postgres unique constraint `unique_freelancer_slot` catches concurrent transaction overlaps, raising an error for the late buyer. |
| **Double Payout Trigger** | Webhook retry and manual clicks attempt to release escrow funds twice. | Wrap transaction in database `SELECT FOR UPDATE` row locks, evaluating current state before payout. |
| **Abandonment of Completed Work** | Customer disappears after service is successfully delivered. | BullMQ delayed job schedules a check for $T + 7\text{ days}$ post-delivery, auto-approving if no dispute is open. |
| **Insufficient Wallet Balances** | User tries to run checkout on a degraded wallet during high load. | NestJS recalculates derived sum balance inside a dedicated PostgreSQL isolation level block before booking approval. |
| **Razorpay Route Transfer Fails** | Network issues prevent payout from landing in freelancer bank account. | Failures transition payout entity to failed, routing payload to a BullMQ retry queue with exponential backoff. |
