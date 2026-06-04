-- Migration 008: Global Gothras

-- 1. Create global gothras dictionary table
CREATE TABLE public.gothras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.gothras ENABLE ROW LEVEL SECURITY;

-- 3. Allow all authenticated users to read gothras
CREATE POLICY "Allow authenticated access to read gothras"
  ON public.gothras FOR SELECT TO authenticated USING (true);

-- 4. Allow all authenticated users to insert gothras
CREATE POLICY "Allow authenticated access to insert gothras"
  ON public.gothras FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Add gothra field to persons table
ALTER TABLE public.persons
ADD COLUMN gothra text;
