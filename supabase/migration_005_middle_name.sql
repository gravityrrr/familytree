-- Migration: Add middle_name to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS middle_name TEXT;
