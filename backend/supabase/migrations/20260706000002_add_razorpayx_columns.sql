-- Add columns for RazorpayX Payouts (Contacts and Fund Accounts)
ALTER TABLE freelancer_profiles
ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_fund_account_id VARCHAR(255);
