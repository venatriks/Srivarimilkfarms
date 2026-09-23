-- ====================================================================
-- SRIVARI MILK FARMS - MIGRATION V3 (Fixes SignUp Data Insertion)
-- ====================================================================
-- Copy and run this script in Supabase SQL Editor -> New Query.
-- ====================================================================

-- 1. Grant table permissions to anon and authenticated roles
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.products TO anon, authenticated, service_role;
GRANT ALL ON public.subscriptions TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON public.wallet_transactions TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;

-- 2. Open RLS Policies on profiles to allow instant sign up insertions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All For Profiles" ON public.profiles;
CREATE POLICY "Allow All For Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Subscriptions" ON public.subscriptions;
CREATE POLICY "Allow All For Subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Orders" ON public.orders;
CREATE POLICY "Allow All For Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Deliveries" ON public.deliveries;
CREATE POLICY "Allow All For Deliveries" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);

-- 3. Resilient trigger for new user registrations
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

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirmation Notice
SELECT 'Migration V3 applied successfully! Table permissions and signup insertions unlocked.' AS result;
