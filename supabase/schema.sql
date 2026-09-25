-- ====================================================================
-- SRIVARI MILK FARMS - SUPABASE DATABASE SCHEMA & SEED DATA
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('Active', 'Paused', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('Pending', 'In Transit', 'Delivered', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('Confirmed', 'Processing', 'Delivered', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 3. TABLES DEFINITION
-- ====================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'customer',
    address TEXT,
    wallet_balance NUMERIC(10, 2) DEFAULT 1000.00,
    subscription_active BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
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

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY DEFAULT ('sub-' || floor(random() * 9000 + 1000)::text),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'Liter',
    frequency TEXT DEFAULT 'Daily Morning',
    delivery_slot TEXT DEFAULT '5:30 AM - 6:30 AM',
    status subscription_status DEFAULT 'Active',
    start_date DATE DEFAULT CURRENT_DATE,
    price_per_day NUMERIC(10, 2) NOT NULL,
    bottles_exchanged INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ORD-' || floor(random() * 90000 + 10000)::text),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status DEFAULT 'Confirmed',
    delivery_slot TEXT DEFAULT '5:30 AM - 6:30 AM Tomorrow',
    payment_method TEXT DEFAULT 'Srivari Wallet',
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ONE-TIME ORDERS
-- ====================================================================
-- Secure guest checkout design:
--
--   - Guests can create orders through create_one_time_order().
--   - Guests cannot directly SELECT orders.
--   - Guests cannot directly UPDATE or DELETE orders.
--   - Guests cannot directly manipulate payment/status/total fields.
--   - Admins can view and manage all one-time orders.
--
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.one_time_orders (
    id TEXT PRIMARY KEY DEFAULT (
        'OTO-' || floor(random() * 90000 + 10000)::text
    ),

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,

    address TEXT NOT NULL,

    delivery_slot TEXT NOT NULL
        DEFAULT '5:30 AM - 6:30 AM',

    instructions TEXT,

    items JSONB NOT NULL
        DEFAULT '[]'::jsonb,

    total_amount NUMERIC(10, 2) NOT NULL
        CHECK (total_amount >= 0),

    payment_method TEXT NOT NULL
        DEFAULT 'UPI Instant Pay',

    payment_status TEXT NOT NULL
        DEFAULT 'Pending'
        CHECK (
            payment_status IN (
                'Pending',
                'Paid',
                'Failed',
                'Refunded'
            )
        ),

    status TEXT NOT NULL
        DEFAULT 'Confirmed'
        CHECK (
            status IN (
                'Confirmed',
                'Processing',
                'Delivered',
                'Cancelled'
            )
        ),

    order_date DATE NOT NULL
        DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

-- Index for Admin Dashboard sorting/filtering
CREATE INDEX IF NOT EXISTS idx_one_time_orders_created_at
ON public.one_time_orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_one_time_orders_status
ON public.one_time_orders (status);

CREATE INDEX IF NOT EXISTS idx_one_time_orders_payment_status
ON public.one_time_orders (payment_status);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

-- DELIVERIES
CREATE TABLE IF NOT EXISTS public.deliveries (
    id TEXT PRIMARY KEY DEFAULT ('dist-' || floor(random() * 900 + 100)::text),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    quantity TEXT NOT NULL,
    product TEXT NOT NULL,
    delivery_slot TEXT DEFAULT '5:30 AM - 6:30 AM',
    bottle_return_count INT DEFAULT 0,
    status delivery_status DEFAULT 'Pending',
    delivery_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT ('tx-' || floor(random() * 9000 + 1000)::text),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    balance_after NUMERIC(10, 2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 4. GRANTS & ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.products TO anon, authenticated, service_role;
GRANT ALL ON public.subscriptions TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
--GRANT ALL ON public.one_time_orders TO anon, authenticated, service_role;
GRANT ALL ON public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON public.wallet_transactions TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow All For Profiles" ON public.profiles;
CREATE POLICY "Allow All For Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Subscriptions" ON public.subscriptions;
CREATE POLICY "Allow All For Subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Orders" ON public.orders;
CREATE POLICY "Allow All For Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Deliveries" ON public.deliveries;
CREATE POLICY "Allow All For Deliveries" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- 5. AUTOMATIC TRIGGER FOR AUTH.USERS -> PUBLIC.PROFILES
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone, address, wallet_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'customer'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    1000.00
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 6. INITIAL PRODUCTS SEED DATA
-- ====================================================================

INSERT INTO public.products (id, name, category, price, unit, rating, reviews_count, image, badge, description, in_stock, stock_count, subscription_available, lab_parameters, nutritional_info)
VALUES
('p1', 'Pure A2 Desi Cow Milk', 'Raw Milk', 75.00, '1 Liter Bottle', 4.90, 342, 'images/a2_milk.jpg', 'Bestseller', '100% Unprocessed, raw single-origin A2 milk from grass-fed Gir & Sahiwal cows. Delivered in chilled eco glass bottles by 5:30 AM daily.', true, 450, true,
 '{"fatPercentage": "4.6%", "snfPercentage": "8.9%", "somaticCellCount": "110,000 / ml (Ultra Clean)", "a2CaseinPurity": "100% DNA Certified A2/A2", "antibiotics": "0.00% (Nil)", "addedWater": "0.00%", "preservatives": "0.00%", "chillingTemperature": "3.8°C"}'::jsonb,
 '{"calories": "68 kcal", "protein": "3.4 g", "carbs": "4.8 g", "fat": "4.6 g", "calcium": "125 mg"}'::jsonb),

('p2', 'Traditional Vedic Bilona Ghee', 'Cultured Ghee', 1400.00, '1 Liter Glass Jar', 5.00, 218, 'images/bilona_ghee.jpg', 'Vedic Craft', 'Hand-churned from cultured A2 curd using wooden Bilona, slowly heated over natural cow-dung firewood. Rich aromatic golden granules.', true, 85, true,
 '{"fatPercentage": "99.8%", "snfPercentage": "0.2%", "somaticCellCount": "N/A (Pure Fat)", "a2CaseinPurity": "Made from 100% A2 Curd", "freeFattyAcids": "0.22%", "peroxideValue": "< 1.0 meq/kg", "preservatives": "0.00%", "chillingTemperature": "Room Temp Storable"}'::jsonb,
 '{"calories": "898 kcal", "protein": "0.0 g", "carbs": "0.0 g", "fat": "99.8 g", "calcium": "5 mg"}'::jsonb),

('p3', 'Artisanal Fresh Farm Paneer', 'Fresh Paneer & Curd', 140.00, '200 Gram Pack', 4.80, 154, 'images/paneer.jpg', 'Farm Fresh', 'Hand-crafted cottage cheese coagulated with organic citrus juice. Melt-in-mouth soft texture packed with natural protein.', true, 120, true,
 '{"fatPercentage": "22.5%", "snfPercentage": "High Solid", "somaticCellCount": "Pass", "a2CaseinPurity": "100% A2 Cow Milk Origin", "antibiotics": "0.00%", "addedWater": "0.00%", "preservatives": "0.00%", "chillingTemperature": "4.0°C"}'::jsonb,
 '{"calories": "265 kcal", "protein": "18.5 g", "carbs": "2.1 g", "fat": "20.8 g", "calcium": "208 mg"}'::jsonb),

('p4', 'Earthen Pot Fresh A2 Curd', 'Fresh Paneer & Curd', 65.00, '500g Clay Matka', 4.90, 189, 'images/curd.jpg', 'Clay Pot Set', 'Naturally set in authentic unglazed clay pots with active heirloom probiotic cultures. Naturally thick, gut-soothing and digestive.', true, 200, true,
 '{"fatPercentage": "4.8%", "snfPercentage": "9.1%", "somaticCellCount": "Pass", "a2CaseinPurity": "100% A2 Cow Milk", "probioticCount": "> 2 Billion CFU/g", "addedWater": "0.00%", "preservatives": "0.00%", "chillingTemperature": "4.2°C"}'::jsonb,
 '{"calories": "62 kcal", "protein": "3.6 g", "carbs": "4.2 g", "fat": "4.5 g", "calcium": "140 mg"}'::jsonb),

('p5', 'Handcrafted White Makhan Butter', 'Farm Specials', 210.00, '250g Glass Tub', 4.90, 96, 'images/butter.jpg', 'Traditional', 'Pure white unsalted butter slow-churned daily from fresh A2 milk cream. Perfect for parathas, hot rotis, and baking.', true, 60, true,
 '{"fatPercentage": "82.5%", "snfPercentage": "2.5%", "somaticCellCount": "Pass", "a2CaseinPurity": "100% A2 Milk Cream", "saltContent": "0.00% (Unsalted)", "addedWater": "15% Natural Moisture", "preservatives": "0.00%", "chillingTemperature": "4.0°C"}'::jsonb,
 '{"calories": "740 kcal", "protein": "0.9 g", "carbs": "0.6 g", "fat": "82.0 g", "calcium": "24 mg"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
price = EXCLUDED.price,
image = EXCLUDED.image,
description = EXCLUDED.description;
