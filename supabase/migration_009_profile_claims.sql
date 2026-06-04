-- ============================================================
-- Migration 009: Profile Claims
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profile_claims (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_id uuid REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  tree_id uuid REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, person_id)
);

ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own claims
DROP POLICY IF EXISTS "Users can view own claims" ON public.profile_claims;
CREATE POLICY "Users can view own claims" ON public.profile_claims
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Users can insert their own claims
DROP POLICY IF EXISTS "Users can insert own claims" ON public.profile_claims;
CREATE POLICY "Users can insert own claims" ON public.profile_claims
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Tree Admins/Owners can view claims for their trees
DROP POLICY IF EXISTS "Admins can view claims for their trees" ON public.profile_claims;
CREATE POLICY "Admins can view claims for their trees" ON public.profile_claims
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 4. Tree Admins/Owners can update claims for their trees
DROP POLICY IF EXISTS "Admins can update claims for their trees" ON public.profile_claims;
CREATE POLICY "Admins can update claims for their trees" ON public.profile_claims
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.trees t WHERE t.id = tree_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Function for searching claimable profiles by phone number securely
CREATE OR REPLACE FUNCTION search_claimable_profiles(search_phone text)
RETURNS TABLE (
  person_id uuid,
  first_name text,
  last_name text,
  tree_id uuid,
  tree_name text
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, t.id, t.name
  FROM public.persons p
  JOIN public.trees t ON p.tree_id = t.id
  WHERE REPLACE(p.phone, ' ', '') = REPLACE(search_phone, ' ', '')
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles prof WHERE prof.self_person_id = p.id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to approve a claim and process side effects
CREATE OR REPLACE FUNCTION approve_profile_claim(claim_id uuid)
RETURNS void SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_person_id uuid;
  v_tree_id uuid;
  v_status text;
  v_is_admin boolean;
BEGIN
  -- Get claim details
  SELECT user_id, person_id, tree_id, status 
  INTO v_user_id, v_person_id, v_tree_id, v_status
  FROM public.profile_claims WHERE id = claim_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Claim is not pending';
  END IF;

  -- Verify caller is admin or owner
  SELECT EXISTS (
    SELECT 1 FROM public.trees t WHERE t.id = v_tree_id AND t.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to approve this claim';
  END IF;

  -- 1. Update profiles.self_person_id
  UPDATE public.profiles SET self_person_id = v_person_id WHERE id = v_user_id;

  -- 2. Upsert an approved join_request for the tree
  INSERT INTO public.join_requests (tree_id, user_id, status)
  VALUES (v_tree_id, v_user_id, 'approved')
  ON CONFLICT (tree_id, user_id) DO UPDATE SET status = 'approved';

  -- 3. Update claim status to approved
  UPDATE public.profile_claims SET status = 'approved' WHERE id = claim_id;

  -- 4. Mark any other pending claims for this person_id or user_id as rejected (since it's a 1:1 mapping)
  UPDATE public.profile_claims SET status = 'rejected' 
  WHERE (person_id = v_person_id OR user_id = v_user_id) AND id != claim_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql;
