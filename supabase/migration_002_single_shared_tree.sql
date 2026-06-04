-- ============================================================
-- Migration 002: Single Shared Tree & Role-Based Access Control
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer'));

-- 2. Modify the trigger function to automatically set 'rushil.reddy4726@gmail.com' as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'rushil.reddy4726@gmail.com' THEN 'admin' ELSE 'viewer' END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update existing user if present
UPDATE public.profiles SET role = 'admin' WHERE email = 'rushil.reddy4726@gmail.com';

-- 4. Enable RLS on all tables
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing restrictive policies
DROP POLICY IF EXISTS "Owner can access their trees" ON public.trees;
DROP POLICY IF EXISTS "Access persons in own tree" ON public.persons;
DROP POLICY IF EXISTS "Access relationships in own tree" ON public.relationships;
DROP POLICY IF EXISTS "Access events for own persons" ON public.events;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 6. Create collaborative policies for authenticated users
CREATE POLICY "Allow authenticated access to trees"
  ON public.trees FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to persons"
  ON public.persons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to relationships"
  ON public.relationships FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to events"
  ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
