-- SUVIDHA ONE Razorpay Integration Migration
-- Adds Razorpay-specific fields to payments table

-- Add new columns for Razorpay integration
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS kiosk_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_data TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS webhook_received BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS captured BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_phone ON payments(phone);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_kiosk_id ON payments(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Payment status tracking table for admin dashboard
CREATE TABLE IF NOT EXISTS payment_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(payment_id),
    event_type VARCHAR(50) NOT NULL, -- 'created', 'authorized', 'captured', 'failed', 'refunded'
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);

-- Daily revenue summary for admin dashboard
CREATE TABLE IF NOT EXISTS daily_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revenue_date DATE NOT NULL,
    kiosk_id VARCHAR(100),
    service_type VARCHAR(50),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(revenue_date, kiosk_id, service_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue(revenue_date);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_kiosk ON daily_revenue(kiosk_id);

-- Offline payment queue for kiosk sync
CREATE TABLE IF NOT EXISTS offline_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_id VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    local_timestamp TIMESTAMPTZ NOT NULL,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, synced, failed
    sync_attempts INTEGER NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ,
    payment_id UUID REFERENCES payments(payment_id),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offline_payments_sync_status ON offline_payments(sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_payments_kiosk ON offline_payments(kiosk_id);
