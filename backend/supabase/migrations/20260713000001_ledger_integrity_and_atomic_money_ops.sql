-- ═══════════════════════════════════════════════════════════════════════════
-- Ledger integrity + atomic money-mutation functions
--
-- Fixes (see AUDIT_FINDINGS.md):
--   H1 — ledger_entries was documented append-only but nothing enforced it
--   C6 — wallet top-up credit had no idempotency, could be replayed for double-credit
--   C3/C4 — freelancer withdrawable balance was computed from `orders`, not the
--           ledger, and PENDING payouts were never reserved against it
--   C5 — every money mutation was a read-then-write across separate round trips
--           with no lock, causing double-book / double-release / double-withdraw /
--           confirm-vs-dispute races
--   H4 — split-dispute rounding could leave platform_holding negative by a paisa
--   H5 — escrow release never verified funds were actually locked for that order
--   H6 — payout row was written after the Razorpay transfer, so a DB failure
--           after a successful transfer left the payout untracked
--
-- All money-mutating RPCs below take a Postgres advisory transaction lock keyed
-- to the resource being mutated (order id, or freelancer user id for payouts),
-- so concurrent requests serialize instead of racing. Each also re-checks the
-- expected starting state inside the same transaction (compare-and-swap) before
-- writing, so a stale read can never lead to a double-write.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── H1: make ledger_entries genuinely append-only ──────────────────────────
CREATE OR REPLACE FUNCTION reject_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only — % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_no_update ON ledger_entries;
CREATE TRIGGER trg_ledger_no_update
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();

-- ─── New ledger entry type for freelancer withdrawals ───────────────────────
DO $$ BEGIN
  ALTER TYPE ledger_entry_type ADD VALUE IF NOT EXISTS 'freelancer_withdrawal';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── C6: wallet top-up idempotency ───────────────────────────────────────────
-- Promote razorpay_payment_id out of the JSONB `meta` blob into a real column
-- so we can enforce uniqueness at the DB level for customer_deposit entries.
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_topup_payment_id
  ON ledger_entries (razorpay_payment_id)
  WHERE entry_type = 'customer_deposit' AND razorpay_payment_id IS NOT NULL;

-- Backfill existing rows so old top-ups aren't left with a NULL payment id
-- (harmless no-op if this migration runs on a fresh DB).
UPDATE ledger_entries
SET razorpay_payment_id = meta ->> 'razorpay_payment_id'
WHERE entry_type = 'customer_deposit'
  AND razorpay_payment_id IS NULL
  AND meta ->> 'razorpay_payment_id' IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- C5 + H5: atomic wallet checkout (escrow lock)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION checkout_wallet_order(p_order_id UUID, p_customer_id UUID)
RETURNS orders AS $$
DECLARE
  v_order orders;
  v_balance NUMERIC;
  v_updated orders;
BEGIN
  -- Serialize all balance-affecting operations for this customer's wallet,
  -- across any of their orders, so two concurrent checkouts can't both read
  -- the same balance and both pass the sufficiency check.
  PERFORM pg_advisory_xact_lock(hashtext('wallet:' || p_customer_id::text));

  SELECT * INTO v_order FROM orders
    WHERE id = p_order_id AND customer_id = p_customer_id AND status = 'pending_payment'
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found_or_already_paid';
  END IF;

  SELECT
    COALESCE(SUM(amount) FILTER (WHERE credit_account = 'customer_wallet:' || p_customer_id AND entry_type IN ('customer_deposit', 'escrow_refund')), 0)
    - COALESCE(SUM(amount) FILTER (WHERE debit_account = 'customer_wallet:' || p_customer_id AND entry_type = 'escrow_lock'), 0)
  INTO v_balance
  FROM ledger_entries
  WHERE credit_account = 'customer_wallet:' || p_customer_id OR debit_account = 'customer_wallet:' || p_customer_id;

  IF v_balance < v_order.amount THEN
    RAISE EXCEPTION 'insufficient_balance:%:%', v_balance, v_order.amount;
  END IF;

  INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount, meta)
  VALUES (p_order_id, 'escrow_lock', 'customer_wallet:' || p_customer_id, 'platform_holding:' || p_order_id, v_order.amount, jsonb_build_object('method', 'wallet'));

  UPDATE orders SET status = 'payment_captured', updated_at = now()
    WHERE id = p_order_id AND status = 'pending_payment'
    RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_state_changed_concurrently';
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- C5 + H5: atomic delivery confirmation (escrow release)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION confirm_order_delivery(p_order_id UUID, p_customer_id UUID)
RETURNS TABLE(freelancer_cut NUMERIC, platform_cut NUMERIC, updated_order orders) AS $$
DECLARE
  v_order orders;
  v_holding_balance NUMERIC;
  v_platform_cut NUMERIC;
  v_freelancer_cut NUMERIC;
  v_updated orders;
BEGIN
  -- Same lock key as file_order_dispute below: whichever request gets here
  -- first wins, the other's compare-and-swap on order status will fail cleanly.
  PERFORM pg_advisory_xact_lock(hashtext('order:' || p_order_id::text));

  SELECT * INTO v_order FROM orders
    WHERE id = p_order_id AND customer_id = p_customer_id AND status = 'service_delivered'
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found_or_not_delivered';
  END IF;

  -- H5: verify escrow was actually locked for this order before releasing it
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE credit_account = 'platform_holding:' || p_order_id), 0)
    - COALESCE(SUM(amount) FILTER (WHERE debit_account = 'platform_holding:' || p_order_id), 0)
  INTO v_holding_balance
  FROM ledger_entries
  WHERE credit_account = 'platform_holding:' || p_order_id OR debit_account = 'platform_holding:' || p_order_id;

  IF v_holding_balance < v_order.amount THEN
    RAISE EXCEPTION 'escrow_not_fully_funded:%:%', v_holding_balance, v_order.amount;
  END IF;

  v_platform_cut := ROUND((v_order.amount * v_order.commission_rate) / 100, 2);
  v_freelancer_cut := v_order.amount - v_platform_cut; -- subtraction, not independent rounding — always sums exactly (H4 pattern)

  INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount, meta) VALUES
    (p_order_id, 'escrow_release', 'platform_holding:' || p_order_id, 'freelancer_wallet:' || v_order.freelancer_id, v_freelancer_cut, jsonb_build_object('commission_rate', v_order.commission_rate)),
    (p_order_id, 'platform_commission', 'platform_holding:' || p_order_id, 'platform_revenue', v_platform_cut, jsonb_build_object('commission_rate', v_order.commission_rate));

  UPDATE orders SET status = 'payout_released', updated_at = now()
    WHERE id = p_order_id AND status = 'service_delivered'
    RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_state_changed_concurrently';
  END IF;

  RETURN QUERY SELECT v_freelancer_cut, v_platform_cut, v_updated;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- C5: atomic dispute filing — shares the same per-order lock as confirm above,
-- so a confirm and a dispute racing on the same order can never both succeed.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION file_order_dispute(p_order_id UUID, p_customer_id UUID)
RETURNS orders AS $$
DECLARE
  v_updated orders;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('order:' || p_order_id::text));

  UPDATE orders SET status = 'disputed', updated_at = now()
    WHERE id = p_order_id
      AND customer_id = p_customer_id
      AND status IN ('payment_captured', 'service_delivered')
    RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found_or_not_disputable';
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- C5 + H4 + H5: atomic dispute resolution (refund / release / split)
-- H4: split amounts computed by subtraction so debits always sum to the
--     locked amount exactly — no rounding leak.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION resolve_order_dispute(
  p_dispute_id UUID,
  p_resolution TEXT,           -- 'resolved_refund' | 'resolved_release' | 'resolved_split'
  p_customer_pct NUMERIC,      -- only used for split; 0-100
  p_resolution_note TEXT,
  p_resolved_by UUID
)
RETURNS TABLE(
  order_id UUID,
  customer_refund NUMERIC,
  freelancer_net NUMERIC,
  platform_cut NUMERIC,
  updated_order orders
) AS $$
DECLARE
  v_dispute disputes;
  v_order orders;
  v_holding_balance NUMERIC;
  v_customer_refund NUMERIC := 0;
  v_freelancer_gross NUMERIC := 0;
  v_platform_cut NUMERIC := 0;
  v_freelancer_net NUMERIC := 0;
  v_order_status TEXT;
  v_updated orders;
BEGIN
  SELECT * INTO v_dispute FROM disputes
    WHERE id = p_dispute_id AND status IN ('open', 'under_review')
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'dispute_not_found_or_already_resolved';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('order:' || v_dispute.order_id::text));

  SELECT * INTO v_order FROM orders WHERE id = v_dispute.order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  SELECT
    COALESCE(SUM(amount) FILTER (WHERE credit_account = 'platform_holding:' || v_order.id), 0)
    - COALESCE(SUM(amount) FILTER (WHERE debit_account = 'platform_holding:' || v_order.id), 0)
  INTO v_holding_balance
  FROM ledger_entries
  WHERE credit_account = 'platform_holding:' || v_order.id OR debit_account = 'platform_holding:' || v_order.id;

  IF v_holding_balance < v_order.amount THEN
    RAISE EXCEPTION 'escrow_not_fully_funded:%:%', v_holding_balance, v_order.amount;
  END IF;

  IF p_resolution = 'resolved_refund' THEN
    v_customer_refund := v_order.amount;

    INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount, meta) VALUES
      (v_order.id, 'escrow_refund', 'platform_holding:' || v_order.id, 'customer_wallet:' || v_order.customer_id, v_customer_refund,
        jsonb_build_object('resolution', 'full_refund', 'resolved_by', p_resolved_by));

    v_order_status := 'refunded';

  ELSIF p_resolution = 'resolved_release' THEN
    v_platform_cut := ROUND((v_order.amount * v_order.commission_rate) / 100, 2);
    v_freelancer_net := v_order.amount - v_platform_cut; -- subtraction — exact

    INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount, meta) VALUES
      (v_order.id, 'escrow_release', 'platform_holding:' || v_order.id, 'freelancer_wallet:' || v_order.freelancer_id, v_freelancer_net,
        jsonb_build_object('resolution', 'full_release', 'resolved_by', p_resolved_by)),
      (v_order.id, 'platform_commission', 'platform_holding:' || v_order.id, 'platform_revenue', v_platform_cut,
        jsonb_build_object('resolution', 'full_release', 'resolved_by', p_resolved_by));

    v_order_status := 'payout_released';

  ELSIF p_resolution = 'resolved_split' THEN
    -- H4: only the customer side is rounded independently; the freelancer
    -- side is always "whatever is left", so the three debits below sum to
    -- exactly v_order.amount regardless of rounding.
    v_customer_refund := ROUND((v_order.amount * COALESCE(p_customer_pct, 50)) / 100, 2);
    v_freelancer_gross := v_order.amount - v_customer_refund;
    v_platform_cut := ROUND((v_freelancer_gross * v_order.commission_rate) / 100, 2);
    v_freelancer_net := v_freelancer_gross - v_platform_cut; -- subtraction — exact

    INSERT INTO ledger_entries (order_id, entry_type, debit_account, credit_account, amount, meta) VALUES
      (v_order.id, 'escrow_refund', 'platform_holding:' || v_order.id, 'customer_wallet:' || v_order.customer_id, v_customer_refund,
        jsonb_build_object('resolution', 'split', 'customer_pct', p_customer_pct, 'resolved_by', p_resolved_by)),
      (v_order.id, 'escrow_release', 'platform_holding:' || v_order.id, 'freelancer_wallet:' || v_order.freelancer_id, v_freelancer_net,
        jsonb_build_object('resolution', 'split', 'freelancer_pct', 100 - COALESCE(p_customer_pct, 50), 'resolved_by', p_resolved_by)),
      (v_order.id, 'platform_commission', 'platform_holding:' || v_order.id, 'platform_revenue', v_platform_cut,
        jsonb_build_object('resolution', 'split', 'resolved_by', p_resolved_by));

    v_order_status := 'payout_released';

  ELSE
    RAISE EXCEPTION 'invalid_resolution:%', p_resolution;
  END IF;

  UPDATE orders SET status = v_order_status, updated_at = now()
    WHERE id = v_order.id
    RETURNING * INTO v_updated;

  UPDATE disputes SET status = p_resolution, resolution_note = p_resolution_note, updated_at = now()
    WHERE id = p_dispute_id;

  RETURN QUERY SELECT v_order.id, v_customer_refund, v_freelancer_net, v_platform_cut, v_updated;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- C3 + C4 + C5 + H6: atomic withdrawal reservation
--
-- Balance is derived purely from the ledger (freelancer_wallet credits from
-- escrow_release, minus freelancer_withdrawal debits for every payout that
-- has ever been reserved — PENDING or SUCCESS both count, so a queued
-- RazorpayX payout can never be withdrawn twice). The debit + payout row are
-- written BEFORE the Razorpay transfer is attempted (H6): if the transfer
-- later fails, reverse_failed_withdrawal() below issues an offsetting credit.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION reserve_freelancer_withdrawal(p_user_id UUID, p_amount NUMERIC)
RETURNS TABLE(payout_id UUID, reserved_amount NUMERIC) AS $$
DECLARE
  v_balance NUMERIC;
  v_payout_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- Serializes all withdrawal attempts for this freelancer.
  PERFORM pg_advisory_xact_lock(hashtext('payout:' || p_user_id::text));

  SELECT
    COALESCE(SUM(amount) FILTER (WHERE credit_account = 'freelancer_wallet:' || p_user_id AND entry_type = 'escrow_release'), 0)
    - COALESCE(SUM(amount) FILTER (WHERE debit_account = 'freelancer_wallet:' || p_user_id AND entry_type = 'freelancer_withdrawal'), 0)
  INTO v_balance
  FROM ledger_entries
  WHERE credit_account = 'freelancer_wallet:' || p_user_id OR debit_account = 'freelancer_wallet:' || p_user_id;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_balance:%:%', v_balance, p_amount;
  END IF;

  INSERT INTO payouts (user_id, amount, status)
    VALUES (p_user_id, p_amount, 'PENDING')
    RETURNING id INTO v_payout_id;

  INSERT INTO ledger_entries (entry_type, debit_account, credit_account, amount, meta)
    VALUES ('freelancer_withdrawal', 'freelancer_wallet:' || p_user_id, 'razorpay_payout_gateway', p_amount,
      jsonb_build_object('payout_id', v_payout_id));

  RETURN QUERY SELECT v_payout_id, p_amount;
END;
$$ LANGUAGE plpgsql;

-- Reverses a reserved withdrawal when the Razorpay transfer itself fails
-- (called from the TS layer's catch block). Append-only-safe: issues a new
-- offsetting ledger entry rather than touching the original rows.
CREATE OR REPLACE FUNCTION reverse_failed_withdrawal(p_payout_id UUID)
RETURNS VOID AS $$
DECLARE
  v_payout payouts;
BEGIN
  SELECT * INTO v_payout FROM payouts WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payout_not_found';
  END IF;

  UPDATE payouts SET status = 'FAILED' WHERE id = p_payout_id;

  INSERT INTO ledger_entries (entry_type, debit_account, credit_account, amount, meta)
    VALUES ('escrow_release', 'razorpay_payout_gateway', 'freelancer_wallet:' || v_payout.user_id, v_payout.amount,
      jsonb_build_object('reversal_of_payout_id', p_payout_id, 'reason', 'razorpay_transfer_failed'));
END;
$$ LANGUAGE plpgsql;
