-- ====================================================================
-- SRIVARI MILK FARMS - MIGRATION V6 (Employees & Delivery Staff Table)
-- ====================================================================
-- Run this script in Supabase SQL Editor -> New Query.
-- ====================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create employees table if it does not exist
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY DEFAULT ('emp-' || floor(random() * 9000 + 1000)::text),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Delivery Agent',
    address TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    salary NUMERIC(10, 2) DEFAULT 20000.00,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns and id type are TEXT if table pre-existed
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Delivery Agent';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2) DEFAULT 20000.00;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

DO $$
BEGIN
    ALTER TABLE public.employees ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.employees ALTER COLUMN id SET DEFAULT ('emp-' || floor(random() * 9000 + 1000)::text);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Grant table permissions to anon, authenticated, and service_role
GRANT ALL ON public.employees TO anon, authenticated, service_role;

-- 4. Open RLS Policies for full CRUD from Admin Dashboard
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All For Employees" ON public.employees;
CREATE POLICY "Allow All For Employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- 5. Initial Seed Employees (Delivery Agents & Internal Staff)
INSERT INTO public.employees (id, name, phone, email, role, category, address, joining_date, salary, status)
VALUES
('emp-101', 'Ramesh Gowda', '+91 98765 11223', 'ramesh.gowda@srivarimilkfarms.com', 'Delivery Agent (Route #4)', 'Delivery Agent', 'D.Hirehal Village, Anantapur Dist, AP', '2025-06-15', 22000.00, 'Active'),
('emp-102', 'Suresh Patil', '+91 97444 88990', 'suresh.p@srivarimilkfarms.com', 'Delivery Agent (Route #1)', 'Delivery Agent', 'Rajeev Nagar, Rayadurg, AP', '2025-08-01', 20000.00, 'Active'),
('emp-103', 'Dr. Vijay Kumar', '+91 99000 44556', 'dr.vijay@srivarimilkfarms.com', 'Quality Inspector & Dairy Specialist', 'Internal Staff', 'Survey 197/A Farm HQ, Rayadurg Taluk', '2024-01-10', 45000.00, 'Active'),
('emp-104', 'Manjunath B', '+91 98450 77112', 'manjunath@srivarimilkfarms.com', 'Farm Operations Manager', 'Internal Staff', 'Anantapur Town, AP', '2024-03-15', 38000.00, 'Active')
ON CONFLICT (id) DO NOTHING;

-- Confirmation Notice
SELECT 'Migration V6 applied successfully! Employees database table initialized.' AS result;
