-- Create freelancer_profiles table linked to users table
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    bio TEXT,
    rating_avg DECIMAL(3, 2) DEFAULT 5.00,
    commission_tier DECIMAL(5, 2) DEFAULT 15.00, -- dynamic rate percentage
    razorpay_linked_account_id VARCHAR(255),
    kyc_status VARCHAR(50) DEFAULT 'PENDING'
);
