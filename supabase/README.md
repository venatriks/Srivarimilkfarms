# 🥛 Srivari Milk Farms - Supabase Setup & Security Guide

This directory contains the production-ready PostgreSQL database schema, private security policies, triggers, and seed data for **Srivari Milk Farms**.

---

## 🔒 Password Security & Privacy Architecture

- **Private & Encrypted Passwords**: Passwords for both Customer and Admin accounts are stored **privately** inside Supabase's isolated `auth.users` schema using standard one-way `bcrypt` password hashing.
- **Zero Table Exposure**: User passwords are **NEVER** stored, copied, or exposed inside `public.profiles` or any publicly accessible tables/APIs.
- **Customer Password Resets**: Handled securely via Supabase Auth API (`supabase.auth.resetPasswordForEmail(email)`), sending an encrypted one-time password recovery link directly to the customer's email.

---

## 🚀 Quick Setup Instructions

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in or create an account.
2. Click **New Project**, select a name (e.g., `Srivari Milk Farms`) and database region.

---

### Step 2: Run the Updated SQL Schema Script
1. In your Supabase Dashboard, open the **SQL Editor** tab.
2. Click **New Query**.
3. Copy all code from [`supabase/schema.sql`](file:///d:/Dairy/Dairy/supabase/schema.sql) and paste it into the editor.
4. Click **Run** (or press `Ctrl + Enter`).
5. All tables, security RLS policies, trigger handlers, and seed products will be created.

---

### Step 3: Connect Your App
In your project root, make sure your `.env` file contains your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Table Structure & Security Policies

| Table | Purpose | Security Policy |
|---|---|---|
| `auth.users` | Encrypted passwords, email, & system auth | Fully Private (Internal Supabase Auth Schema) |
| `public.profiles` | User profile details (name, role, phone, address, wallet) | User views/updates own profile; Admin views all |
| `public.products` | Dairy products & lab metrics | Public Read; Admin Write |
| `public.subscriptions` | Daily morning milk subscriptions | User manages own; Admin manages all |
| `public.orders` | Placed customer orders | User views own; Admin manages all |
| `public.deliveries` | 5:00 AM Delivery Runner dispatch | Admin full access |
| `public.audit_logs` | Audit trail & customer password reset logs | Admin access only |
