-- ====================================================================
-- SRIVARI MILK FARMS - MIGRATION V5 (Contact Queries Database Table)
-- ====================================================================
-- Run this script in Supabase SQL Editor -> New Query.
-- ====================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create contact_queries table if it does not exist
CREATE TABLE IF NOT EXISTS public.contact_queries (
    id TEXT PRIMARY KEY DEFAULT ('query-' || floor(random() * 90000 + 10000)::text),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure id column is TEXT if pre-existing as UUID
DO $$
BEGIN
    ALTER TABLE public.contact_queries ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.contact_queries ALTER COLUMN id SET DEFAULT ('query-' || floor(random() * 90000 + 10000)::text);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Grant table permissions to anon, authenticated, and service_role
GRANT ALL ON public.contact_queries TO anon, authenticated, service_role;

-- 4. Open RLS Policies for full access from website & Admin Dashboard
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All For Contact Queries" ON public.contact_queries;
CREATE POLICY "Allow All For Contact Queries" ON public.contact_queries FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed initial queries
INSERT INTO public.contact_queries (id, name, email, phone, subject, message, status, created_at)
VALUES
('query-1001', 'Sunil Varma', 'sunil.v@example.com', '+91 98111 22334', 'Milk Subscription Inquiry', 'Would like to start daily morning 2L A2 milk delivery at Indiranagar from tomorrow.', 'Pending', NOW() - INTERVAL '1 hour'),
('query-1002', 'Meenakshi Iyer', 'meenakshi@example.com', '+91 97222 33445', 'Weekend Farm Tour Booking', 'Looking to visit Srivari Farm with family this Sunday 8 AM. Please confirm availability.', 'In Progress', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Confirmation Notice
SELECT 'Migration V5 applied successfully! Contact Queries database table initialized.' AS result;
