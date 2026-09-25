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
ALTER TABLE public.one_time_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. REMOVE OLD / OVERLY PERMISSIVE POLICIES
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'profiles',
              'products',
              'subscriptions',
              'orders',
              'order_items',
              'one_time_orders',
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

CREATE POLICY "profiles_customer_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_admin_read_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "profiles_customer_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "profiles_customer_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());


-- ============================================================
-- 4. PROTECT PROFILE SECURITY FIELDS
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

        -- New customers start with zero wallet balance.
        NEW.wallet_balance := 0;

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

CREATE POLICY "products_public_read"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "products_admin_insert"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_delete"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin());


-- ============================================================
-- 7. SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "subscriptions_customer_read_own"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "subscriptions_customer_insert_own"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_customer_update_own"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_customer_delete_own"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 8. ORDERS
-- ============================================================

CREATE POLICY "orders_customer_read_own"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_customer_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_customer_update_own"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_customer_delete_own"
ON public.orders
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_admin_all"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 9. ONE-TIME ORDERS
-- ============================================================
--
-- Guest:
--   - Can create an order ONLY through create_one_time_order().
--   - Cannot directly SELECT/INSERT/UPDATE/DELETE orders.
--
-- Admin:
--   - Can read and manage all one-time orders.
--
-- ============================================================

CREATE POLICY "one_time_orders_admin_all"
ON public.one_time_orders
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


-- ============================================================
-- 10. ORDER ITEMS
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
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 11. DELIVERIES
-- ============================================================

CREATE POLICY "deliveries_customer_read_own"
ON public.deliveries
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "deliveries_admin_all"
ON public.deliveries
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 12. WALLET TRANSACTIONS
-- ============================================================

CREATE POLICY "wallet_transactions_customer_read_own"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "wallet_transactions_admin_all"
ON public.wallet_transactions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 13. AUDIT LOGS
-- ============================================================

CREATE POLICY "audit_logs_authenticated_insert_own"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE POLICY "audit_logs_admin_read"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "audit_logs_admin_update"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "audit_logs_admin_delete"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.is_admin());


-- ============================================================
-- 14. CONTACT QUERIES
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
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- 15. EMPLOYEES
-- ============================================================

CREATE POLICY "employees_admin_all"
ON public.employees
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================
-- SECURE GUEST ONE-TIME ORDER CREATION
-- ============================================================
--
-- SECURITY DEFINER is intentional:
-- guests have no direct INSERT privilege on one_time_orders.
-- The function performs all validation and inserts only trusted
-- server-calculated values.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_one_time_order(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_address TEXT,
    p_items JSONB,
    p_delivery_slot TEXT DEFAULT '5:30 AM - 6:30 AM',
    p_instructions TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'UPI Instant Pay'
)
RETURNS public.one_time_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id TEXT;
    v_total NUMERIC(10,2) := 0;
    v_item JSONB;
    v_product RECORD;
    v_quantity INTEGER;
    v_items JSONB := '[]'::jsonb;
    v_order public.one_time_orders;
BEGIN

    IF trim(COALESCE(p_customer_name, '')) = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;

    IF trim(COALESCE(p_customer_email, '')) = '' THEN
        RAISE EXCEPTION 'Customer email is required';
    END IF;

    IF trim(COALESCE(p_customer_phone, '')) = '' THEN
        RAISE EXCEPTION 'Customer phone is required';
    END IF;

    IF trim(COALESCE(p_address, '')) = '' THEN
        RAISE EXCEPTION 'Delivery address is required';
    END IF;

    IF COALESCE(NULLIF(trim(p_payment_method), ''), 'UPI Instant Pay')
    NOT IN ('UPI Instant Pay', 'Cash on Delivery')
    THEN
        RAISE EXCEPTION 'Invalid payment method';
    END IF;

    IF p_items IS NULL
       OR jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) = 0
    THEN
        RAISE EXCEPTION 'Order must contain at least one item';
    END IF;

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_items)
    LOOP

        IF NOT (v_item ? 'product_id') THEN
            RAISE EXCEPTION
                'Each order item requires product_id';
        END IF;

        IF NOT (v_item ? 'quantity') THEN
            RAISE EXCEPTION
                'Each order item requires quantity';
        END IF;

        BEGIN
            v_quantity := (v_item->>'quantity')::INTEGER;
        EXCEPTION
            WHEN invalid_text_representation THEN
                RAISE EXCEPTION
                    'Quantity must be a valid whole number';
        END;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION
                'Quantity must be greater than zero';
        END IF;

        SELECT
            id,
            name,
            price,
            unit,
            in_stock,
            stock_count
        INTO v_product
        FROM public.products
        WHERE id = v_item->>'product_id';

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'Product % does not exist',
                v_item->>'product_id';
        END IF;

        IF COALESCE(v_product.in_stock, false) = false THEN
            RAISE EXCEPTION
                'Product % is currently out of stock',
                v_product.name;
        END IF;

        IF COALESCE(v_product.stock_count, 0) < v_quantity THEN
            RAISE EXCEPTION
                'Insufficient stock for %',
                v_product.name;
        END IF;

        v_items :=
            v_items ||
            jsonb_build_array(
                jsonb_build_object(
                    'product_id', v_product.id,
                    'product_name', v_product.name,
                    'quantity', v_quantity,
                    'unit', v_product.unit,
                    'price', v_product.price,
                    'line_total',
                        ROUND(
                            v_product.price * v_quantity,
                            2
                        )
                )
            );

        v_total :=
            v_total +
            (v_product.price * v_quantity);

    END LOOP;

    v_order_id :=
        'OTO-' ||
        floor(random() * 90000 + 10000)::text;

    INSERT INTO public.one_time_orders (
        id,
        customer_name,
        customer_email,
        customer_phone,
        address,
        delivery_slot,
        instructions,
        items,
        total_amount,
        payment_method,
        payment_status,
        status,
        order_date,
        created_at
    )
    VALUES (
        v_order_id,
        trim(p_customer_name),
        lower(trim(p_customer_email)),
        trim(p_customer_phone),
        trim(p_address),

        COALESCE(
            NULLIF(trim(p_delivery_slot), ''),
            '5:30 AM - 6:30 AM'
        ),

        NULLIF(
            trim(COALESCE(p_instructions, '')),
            ''
        ),

        v_items,

        ROUND(v_total, 2),

        COALESCE(
            NULLIF(trim(p_payment_method), ''),
            'UPI Instant Pay'
        ),

        'Pending',
        'Confirmed',
        CURRENT_DATE,
        NOW()
    )
    RETURNING *
    INTO v_order;

    RETURN v_order;

END;
$$;


-- ============================================================
-- FUNCTION SECURITY
-- ============================================================

REVOKE EXECUTE
ON FUNCTION public.create_one_time_order(
    text, text, text, text, jsonb, text, text, text
)
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.create_one_time_order(
    text, text, text, text, jsonb, text, text, text
)
FROM authenticated;

REVOKE EXECUTE
ON FUNCTION public.create_one_time_order(
    text, text, text, text, jsonb, text, text, text
)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.create_one_time_order(
    text, text, text, text, jsonb, text, text, text
)
TO anon, authenticated;


-- ============================================================
-- 16. REMOVE EXCESSIVE TABLE PRIVILEGES
-- ============================================================

REVOKE ALL ON TABLE public.profiles
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.profiles
TO authenticated;


REVOKE ALL ON TABLE public.products
FROM anon, authenticated;

GRANT SELECT
ON TABLE public.products
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.products
TO authenticated;


REVOKE ALL ON TABLE public.subscriptions
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.subscriptions
TO authenticated;


REVOKE ALL ON TABLE public.orders
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.orders
TO authenticated;


REVOKE ALL ON TABLE public.one_time_orders
FROM anon, authenticated;

-- No direct table access for guests.
-- RLS allows only administrators among authenticated users.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.one_time_orders
TO authenticated;


REVOKE ALL ON TABLE public.order_items
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.order_items
TO authenticated;


REVOKE ALL ON TABLE public.deliveries
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.deliveries
TO authenticated;


REVOKE ALL ON TABLE public.wallet_transactions
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.wallet_transactions
TO authenticated;


REVOKE ALL ON TABLE public.audit_logs
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.audit_logs
TO authenticated;


REVOKE ALL ON TABLE public.contact_queries
FROM anon, authenticated;

GRANT INSERT
ON TABLE public.contact_queries
TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.contact_queries
TO authenticated;


REVOKE ALL ON TABLE public.employees
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.employees
TO authenticated;


-- ============================================================
-- 17. FUNCTION EXECUTE PRIVILEGES
-- ============================================================

GRANT EXECUTE
ON FUNCTION public.is_admin()
TO anon, authenticated;


-- ============================================================
-- 18. FORCE RLS
-- ============================================================

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contact_queries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;


-- ============================================================
-- 19. SECURITY COMMENTS
-- ============================================================

COMMENT ON TABLE public.profiles IS
'User profiles protected by ownership-based RLS and admin access. New customer profiles start with zero wallet balance.';

COMMENT ON TABLE public.products IS
'Publicly readable products. Product modifications restricted to admins.';

COMMENT ON TABLE public.orders IS
'Orders protected by customer ownership and admin access.';

COMMENT ON TABLE public.one_time_orders IS
'Guest one-time orders are created only through create_one_time_order(). Direct guest table access is prohibited. Administrators can manage all orders.';

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
--   7. Test guest one-time checkout.
--
-- ============================================================
