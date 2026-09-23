-- ============================================================
-- SRIVARI MILK FARMS
-- SUPABASE SECURITY HARDENING
-- ============================================================
--
-- Purpose:
--   Replace overly permissive public/authenticated access with
--   proper Row Level Security (RLS).
--
-- IMPORTANT:
--   - Run this script ONCE in Supabase SQL Editor.
--   - Do NOT run the old migration_v2.sql ... migration_v6.sql
--     again after this.
--   - This script assumes public.is_admin() already exists.
--
-- ============================================================


-- ============================================================
-- 1. ENABLE RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. REMOVE OLD / OVERLY PERMISSIVE POLICIES
-- ============================================================
--
-- We intentionally drop known old policy names.
-- We also dynamically remove any remaining policies on these
-- application tables so old USING(true) policies cannot remain.
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT
            schemaname,
            tablename,
            policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'profiles',
              'products',
              'subscriptions',
              'orders',
              'order_items',
              'deliveries',
              'wallet_transactions',
              'audit_logs',
              'contact_queries',
              'employees'
          )
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname,
            r.schemaname,
            r.tablename
        );
    END LOOP;
END
$$;


-- ============================================================
-- 3. PROFILES
-- ============================================================
--
-- Rules:
--   Anonymous:
--       Cannot read/update/delete profiles.
--
--   Authenticated customer:
--       Can read own profile.
--       Can update own profile.
--       Cannot promote themselves to admin.
--       Cannot change wallet/status/subscription security fields.
--
--   Admin:
--       Full profile management.
--
-- ============================================================


-- Customer can read only their own profile.
CREATE POLICY "profiles_customer_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
);


-- Admin can read all profiles.
CREATE POLICY "profiles_admin_read_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- Customer can insert their own profile.
--
-- The trigger below prevents a normal customer from creating
-- an admin profile.
CREATE POLICY "profiles_customer_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
);


-- Admin can insert profiles for other users.
CREATE POLICY "profiles_admin_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


-- Customer can update their own profile.
--
-- A BEFORE UPDATE trigger below protects sensitive fields.
CREATE POLICY "profiles_customer_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);


-- Admin can update all profiles.
CREATE POLICY "profiles_admin_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- Admin can delete profiles.
CREATE POLICY "profiles_admin_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);


-- ============================================================
-- 4. PROTECT PROFILE SECURITY FIELDS
-- ============================================================
--
-- Customers must not be able to change:
--
--   role
--   wallet_balance
--   subscription_active
--   status
--
-- through the normal frontend profile update.
--
-- Admins are allowed to change these fields.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    -- If the caller is not an administrator,
    -- preserve security-sensitive fields.
    IF NOT public.is_admin() THEN

        NEW.role := OLD.role;
        NEW.wallet_balance := OLD.wallet_balance;
        NEW.subscription_active := OLD.subscription_active;
        NEW.status := OLD.status;

    END IF;

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS protect_profile_sensitive_fields_trigger
ON public.profiles;


CREATE TRIGGER protect_profile_sensitive_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_fields();


-- ============================================================
-- 5. PROTECT PROFILE INSERTS
-- ============================================================
--
-- A normal authenticated user can create only a customer
-- profile. Admin-created profiles can use the requested role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_insert_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    IF NOT public.is_admin() THEN

        NEW.role := 'customer';
        NEW.status := 'Active';

        -- Prevent a normal user from giving themselves money.
        NEW.wallet_balance := 1000;

        -- New customers start according to the application default.
        NEW.subscription_active := COALESCE(
            NEW.subscription_active,
            true
        );

    END IF;

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS protect_profile_insert_fields_trigger
ON public.profiles;


CREATE TRIGGER protect_profile_insert_fields_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_insert_fields();


-- ============================================================
-- 6. PRODUCTS
-- ============================================================
--
-- Public users:
--   Can read products.
--
-- Admin:
--   Can insert/update/delete products.
--
-- Nobody else can modify products.
-- ============================================================

CREATE POLICY "products_public_read"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
    true
);


CREATE POLICY "products_admin_insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "products_admin_update"
ON public.products
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "products_admin_delete"
ON public.products
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);


-- ============================================================
-- 7. SUBSCRIPTIONS
-- ============================================================
--
-- Customer:
--   Read/create/update/delete only their own subscriptions.
--
-- Admin:
--   Full access.
-- ============================================================

CREATE POLICY "subscriptions_customer_read_own"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


CREATE POLICY "subscriptions_customer_insert_own"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);


CREATE POLICY "subscriptions_customer_update_own"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


CREATE POLICY "subscriptions_customer_delete_own"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


CREATE POLICY "subscriptions_admin_all"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 8. ORDERS
-- ============================================================
--
-- Customer:
--   Can see/create/update/delete only their own orders.
--
-- Admin:
--   Full access.
-- ============================================================

CREATE POLICY "orders_customer_read_own"
ON public.orders
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


CREATE POLICY "orders_customer_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);


CREATE POLICY "orders_customer_update_own"
ON public.orders
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


CREATE POLICY "orders_customer_delete_own"
ON public.orders
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


CREATE POLICY "orders_admin_all"
ON public.orders
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================
--
-- order_items does not contain user_id.
--
-- Ownership is therefore determined through the parent order.
-- ============================================================

CREATE POLICY "order_items_customer_read_own"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = auth.uid()
    )
);


CREATE POLICY "order_items_customer_insert_own"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = auth.uid()
    )
);


CREATE POLICY "order_items_customer_update_own"
ON public.order_items
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = auth.uid()
    )
);


CREATE POLICY "order_items_customer_delete_own"
ON public.order_items
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = auth.uid()
    )
);


CREATE POLICY "order_items_admin_all"
ON public.order_items
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 10. DELIVERIES
-- ============================================================
--
-- Customer:
--   Can see only their deliveries.
--
-- Admin:
--   Full access.
--
-- Customers cannot change delivery status.
-- ============================================================

CREATE POLICY "deliveries_customer_read_own"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
    customer_id = auth.uid()
);


CREATE POLICY "deliveries_admin_all"
ON public.deliveries
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 11. WALLET TRANSACTIONS
-- ============================================================
--
-- Customer:
--   Read only their own transactions.
--
-- Admin:
--   Full access.
--
-- Customers cannot insert or modify wallet transactions.
-- ============================================================

CREATE POLICY "wallet_transactions_customer_read_own"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


CREATE POLICY "wallet_transactions_admin_all"
ON public.wallet_transactions
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
--
-- Customer:
--   Can insert an audit record only for themselves.
--   Cannot read/update/delete audit logs.
--
-- Admin:
--   Full access.
--
-- This matches the updated frontend logAction() function,
-- which sends actor_id = authenticated user's ID.
-- ============================================================

CREATE POLICY "audit_logs_authenticated_insert_own"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    actor_id = auth.uid()
);


CREATE POLICY "audit_logs_admin_read"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


CREATE POLICY "audit_logs_admin_update"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "audit_logs_admin_delete"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);


-- ============================================================
-- 13. CONTACT QUERIES
-- ============================================================
--
-- Public:
--   Can submit a contact query.
--
-- Public:
--   Cannot read, update or delete queries.
--
-- Admin:
--   Full access.
--
-- Status is forced to Pending for public submissions.
-- ============================================================

CREATE POLICY "contact_queries_public_insert"
ON public.contact_queries
FOR INSERT
TO anon, authenticated
WITH CHECK (
    COALESCE(status, 'Pending') = 'Pending'
);


CREATE POLICY "contact_queries_admin_all"
ON public.contact_queries
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 14. EMPLOYEES
-- ============================================================
--
-- Employee information is private.
--
-- Admin only.
-- ============================================================

CREATE POLICY "employees_admin_all"
ON public.employees
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 15. REMOVE EXCESSIVE TABLE PRIVILEGES
-- ============================================================
--
-- RLS controls rows, but PostgreSQL table privileges still
-- matter. The old migrations granted excessive privileges such
-- as TRUNCATE, REFERENCES and TRIGGER to anon/authenticated.
--
-- First remove everything.
-- Then grant only what the application requires.
-- ============================================================


-- ----------------------------
-- PROFILES
-- ----------------------------

REVOKE ALL ON TABLE public.profiles
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.profiles
TO authenticated;

GRANT DELETE
ON TABLE public.profiles
TO authenticated;


-- ----------------------------
-- PRODUCTS
-- ----------------------------

REVOKE ALL ON TABLE public.products
FROM anon, authenticated;

GRANT SELECT
ON TABLE public.products
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.products
TO authenticated;


-- ----------------------------
-- SUBSCRIPTIONS
-- ----------------------------

REVOKE ALL ON TABLE public.subscriptions
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.subscriptions
TO authenticated;


-- ----------------------------
-- ORDERS
-- ----------------------------

REVOKE ALL ON TABLE public.orders
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.orders
TO authenticated;


-- ----------------------------
-- ORDER ITEMS
-- ----------------------------

REVOKE ALL ON TABLE public.order_items
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.order_items
TO authenticated;


-- ----------------------------
-- DELIVERIES
-- ----------------------------

REVOKE ALL ON TABLE public.deliveries
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.deliveries
TO authenticated;


-- ----------------------------
-- WALLET TRANSACTIONS
-- ----------------------------

REVOKE ALL ON TABLE public.wallet_transactions
FROM anon, authenticated;

GRANT SELECT
ON TABLE public.wallet_transactions
TO authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.wallet_transactions
TO authenticated;


-- ----------------------------
-- AUDIT LOGS
-- ----------------------------

REVOKE ALL ON TABLE public.audit_logs
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.audit_logs
TO authenticated;


-- ----------------------------
-- CONTACT QUERIES
-- ----------------------------

REVOKE ALL ON TABLE public.contact_queries
FROM anon, authenticated;

GRANT INSERT
ON TABLE public.contact_queries
TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.contact_queries
TO authenticated;


-- ----------------------------
-- EMPLOYEES
-- ----------------------------

REVOKE ALL ON TABLE public.employees
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.employees
TO authenticated;


-- ============================================================
-- 16. FUNCTION EXECUTE PRIVILEGES
-- ============================================================
--
-- Keep is_admin() callable because RLS policies use it.
-- Restrict the profile protection functions to the roles that
-- need them.
-- ============================================================

GRANT EXECUTE ON FUNCTION public.is_admin()
TO anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.protect_profile_sensitive_fields()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.protect_profile_insert_fields()
TO authenticated;


-- ============================================================
-- 17. FORCE RLS
-- ============================================================
--
-- FORCE RLS makes RLS apply even to table owners in normal
-- application contexts.
--
-- service_role / postgres administrative operations are not
-- intended to be used by the browser.
-- ============================================================

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contact_queries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;


-- ============================================================
-- 18. SECURITY COMMENTS
-- ============================================================

COMMENT ON TABLE public.profiles IS
'User profiles protected by ownership-based RLS and admin access.';

COMMENT ON TABLE public.products IS
'Publicly readable products. Product modifications restricted to admins.';

COMMENT ON TABLE public.orders IS
'Orders protected by customer ownership and admin access.';

COMMENT ON TABLE public.order_items IS
'Order items protected through ownership of the parent order.';

COMMENT ON TABLE public.subscriptions IS
'Subscriptions protected by customer ownership and admin access.';

COMMENT ON TABLE public.deliveries IS
'Customer deliveries protected by customer ownership and admin access.';

COMMENT ON TABLE public.wallet_transactions IS
'Wallet transactions are private to the customer and administrators.';

COMMENT ON TABLE public.audit_logs IS
'Audit records are private and administrator-readable. Authenticated users can create only their own audit records.';

COMMENT ON TABLE public.contact_queries IS
'Public contact submissions are insert-only for visitors; administrators manage submitted queries.';

COMMENT ON TABLE public.employees IS
'Employee records are administrator-only.';


-- ============================================================
-- DONE
-- ============================================================
--
-- Security hardening has been applied.
--
-- Next:
--   1. Verify policies.
--   2. Test customer login.
--   3. Test admin login.
--   4. Test product visibility.
--   5. Test contact form.
--   6. Test customer orders/subscriptions.
--
-- ============================================================