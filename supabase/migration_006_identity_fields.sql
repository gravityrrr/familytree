-- Migration 006: Identity Fields for Deduplication

-- Add identity fields to the persons table
ALTER TABLE public.persons
ADD COLUMN phone text,
ADD COLUMN email text,
ADD COLUMN aadhar_number text,
ADD COLUMN system_id text;

-- Add unique constraints to ensure identity is unique within the same tree
-- Note: We use conditional uniqueness (WHERE ... IS NOT NULL) because
-- multiple people can have NULL for these fields.

CREATE UNIQUE INDEX idx_persons_phone ON public.persons (tree_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX idx_persons_email ON public.persons (tree_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_persons_aadhar ON public.persons (tree_id, aadhar_number) WHERE aadhar_number IS NOT NULL;
CREATE UNIQUE INDEX idx_persons_system_id ON public.persons (tree_id, system_id) WHERE system_id IS NOT NULL;
