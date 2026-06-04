-- ============================================================
-- Migration 010: Update User Role RPC
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_role(target_user_id uuid, new_role text)
RETURNS void SECURITY DEFINER AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to update roles';
  END IF;

  -- Ensure valid role
  IF new_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;
