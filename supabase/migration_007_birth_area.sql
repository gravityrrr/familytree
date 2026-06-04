-- Migration 007: Area fields

ALTER TABLE public.persons
ADD COLUMN birth_area text,
ADD COLUMN death_area text;
