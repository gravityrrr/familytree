-- Migration 011: Remove Aadhar

-- Drop the unique index for Aadhar
DROP INDEX IF EXISTS public.idx_persons_aadhar;

-- Remove the aadhar_number column from the persons table
ALTER TABLE public.persons
DROP COLUMN IF EXISTS aadhar_number;
