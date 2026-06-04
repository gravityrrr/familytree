-- ============================================================
-- Migration 004: Join Requests and Tree Access Control
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create join_requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id uuid REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tree_id, user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- 2. Join Requests Policies
DROP POLICY IF EXISTS "Users can insert own requests" ON public.join_requests;
CREATE POLICY "Users can insert own requests"
  ON public.join_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own requests" ON public.join_requests;
CREATE POLICY "Users can view own requests"
  ON public.join_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tree owners can manage requests" ON public.join_requests;
CREATE POLICY "Tree owners can manage requests"
  ON public.join_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()));

-- 3. Revoke open access policies from Migration 002
DROP POLICY IF EXISTS "Allow authenticated access to trees" ON public.trees;
DROP POLICY IF EXISTS "Allow authenticated access to persons" ON public.persons;
DROP POLICY IF EXISTS "Allow authenticated access to relationships" ON public.relationships;
DROP POLICY IF EXISTS "Allow authenticated access to events" ON public.events;

-- 4. Create Strict Access Policies

DROP POLICY IF EXISTS "Anyone can view trees" ON public.trees;
CREATE POLICY "Anyone can view trees"
  ON public.trees FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can insert trees" ON public.trees;
CREATE POLICY "Only admins can insert trees"
  ON public.trees FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Owners can manage trees" ON public.trees;
CREATE POLICY "Owners can manage trees"
  ON public.trees FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete trees" ON public.trees;
CREATE POLICY "Owners can delete trees"
  ON public.trees FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Members can access persons" ON public.persons;
CREATE POLICY "Members can access persons"
  ON public.persons FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.join_requests j WHERE j.tree_id = tree_id AND j.user_id = auth.uid() AND j.status = 'approved')
  );

DROP POLICY IF EXISTS "Members can access relationships" ON public.relationships;
CREATE POLICY "Members can access relationships"
  ON public.relationships FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.join_requests j WHERE j.tree_id = tree_id AND j.user_id = auth.uid() AND j.status = 'approved')
  );

DROP POLICY IF EXISTS "Members can access events" ON public.events;
CREATE POLICY "Members can access events"
  ON public.events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.persons p 
      WHERE p.id = person_id AND (
        EXISTS (SELECT 1 FROM public.trees t WHERE t.id = p.tree_id AND t.owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.join_requests j WHERE j.tree_id = p.tree_id AND j.user_id = auth.uid() AND j.status = 'approved')
      )
    )
  );
