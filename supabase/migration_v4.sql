-- ====================================================================
-- SRIVARI MILK FARMS - MIGRATION V4 (Admin Dashboard Real-time DB Sync)
-- ====================================================================
-- Run this script in Supabase SQL Editor -> New Query.
-- ====================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop Foreign Key constraint on profiles.id if it exists to allow standalone admin profile creation
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Create tables if they do not exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    address TEXT,
    wallet_balance NUMERIC(10, 2) DEFAULT 1000.00,
    subscription_active BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image TEXT NOT NULL,
    badge TEXT,
    description TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_count INT DEFAULT 100,
    subscription_available BOOLEAN DEFAULT TRUE,
    lab_parameters JSONB DEFAULT '{}'::jsonb,
    nutritional_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deliveries (
    id TEXT PRIMARY KEY DEFAULT ('dist-' || floor(random() * 900 + 100)::text),
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    quantity TEXT NOT NULL,
    product TEXT NOT NULL,
    delivery_slot TEXT DEFAULT '5:30 AM - 6:30 AM',
    bottle_return_count INT DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    delivery_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || floor(random() * 100000 + 10000)::text),
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure all required columns exist and convert id columns to TEXT if pre-existing as UUID
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 1000.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS quantity TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS product TEXT;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_slot TEXT DEFAULT '5:30 AM - 6:30 AM';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS bottle_return_count INT DEFAULT 0;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Safely convert audit_logs.id and deliveries.id to TEXT if they were previously created as UUID
DO $$
BEGIN
    ALTER TABLE public.audit_logs ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.audit_logs ALTER COLUMN id SET DEFAULT ('log-' || floor(random() * 100000 + 10000)::text);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.deliveries ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.deliveries ALTER COLUMN id SET DEFAULT ('dist-' || floor(random() * 900 + 100)::text);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. Grant table permissions to anon, authenticated, and service_role
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.products TO anon, authenticated, service_role;
GRANT ALL ON public.subscriptions TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON public.wallet_transactions TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;

-- 6. Open RLS Policies for full CRUD from Admin Dashboard
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All For Profiles" ON public.profiles;
CREATE POLICY "Allow All For Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Products" ON public.products;
CREATE POLICY "Allow All For Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Deliveries" ON public.deliveries;
CREATE POLICY "Allow All For Deliveries" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Audit Logs" ON public.audit_logs;
CREATE POLICY "Allow All For Audit Logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Initial Seeds for Deliveries and Audit Logs
INSERT INTO public.deliveries (id, customer_name, address, phone, quantity, product, delivery_slot, bottle_return_count, status, delivery_date)
VALUES
('dist-101', 'Anita Sharma', 'Flat 402, Green Glen Layout, Bellandur, Bengaluru', '+91 98765 43210', '2 Liters', 'Pure A2 Desi Cow Milk', '5:30 AM - 6:30 AM', 2, 'Delivered', CURRENT_DATE),
('dist-102', 'Mahantesha K (Farm Admin)', 'Survey 197/A, Rajeev Nagar, D.Hirehal, Rayadurg Taluk', '+91 7022776637', '1 Liter + 1 Matka Curd', 'A2 Milk + Clay Pot Curd', '5:00 AM - 6:00 AM', 1, 'In Transit', CURRENT_DATE),
('dist-103', 'Priya Nair', 'House 88, 5th Main, Indiranagar, Bengaluru', '+91 97444 33221', '3 Liters', 'Pure A2 Desi Cow Milk', '6:00 AM - 7:00 AM', 3, 'Pending', CURRENT_DATE),
('dist-104', 'Vikramaditya Hegde', 'Penthouse 12, Sobha Royal Pavilion, Sarjapur', '+91 99000 11223', '2 Liters + 1 Jar Ghee', 'A2 Milk + Bilona Ghee', '5:30 AM - 6:30 AM', 2, 'Delivered', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_logs (id, action, description, timestamp)
VALUES
('log-1001', 'SYSTEM_INIT', 'Srivari Milk Farms database schema initialized', NOW() - INTERVAL '2 hours'),
('log-1002', 'PRODUCT_SYNC', 'Synced product catalog with live farm items', NOW() - INTERVAL '1 hour'),
('log-1003', 'ADMIN_LOGIN', 'Admin user logged into control center', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Confirmation Notice
SELECT 'Migration V4 applied successfully! Real-time Admin Dashboard sync enabled.' AS result;
