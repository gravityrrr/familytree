-- ============================================================
-- Family Tree Database Schema for Supabase
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================

-- Family tree (one user can have multiple trees)
create table if not exists trees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- Users (mirrors Supabase auth.users, stores extra profile info)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Person in the family tree (NOT the logged-in user — a family member)
create table if not exists persons (
  id uuid default gen_random_uuid() primary key,
  tree_id uuid references trees(id) on delete cascade,
  first_name text not null,
  last_name text,
  nickname text,
  gender text check (gender in ('male','female','other','unknown')),
  birth_date date,
  birth_year int,
  birth_place text,
  death_date date,
  death_place text,
  is_living boolean default true,
  bio text,
  photo_url text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Relationships between persons
create table if not exists relationships (
  id uuid default gen_random_uuid() primary key,
  tree_id uuid references trees(id) on delete cascade,
  person_id uuid references persons(id) on delete cascade,
  related_person_id uuid references persons(id) on delete cascade,
  relationship_type text check (relationship_type in (
    'parent','child','spouse','sibling','grandparent',
    'grandchild','aunt_uncle','niece_nephew','cousin','other'
  )),
  created_at timestamp with time zone default now(),
  unique(person_id, related_person_id, relationship_type)
);

-- Tree events / timeline entries
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  person_id uuid references persons(id) on delete cascade,
  title text not null,
  description text,
  event_date date,
  event_year int,
  event_place text,
  event_type text check (event_type in (
    'birth','death','marriage','divorce','moved',
    'graduated','military','other'
  )),
  created_at timestamp with time zone default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table trees enable row level security;
alter table persons enable row level security;
alter table relationships enable row level security;
alter table events enable row level security;

-- Profiles: users can read/update only their own
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Trees: only owner can access
create policy "Owner can access their trees"
  on trees for all using (auth.uid() = owner_id);

-- Persons: only if user owns the tree
create policy "Access persons in own tree"
  on persons for all using (
    exists (select 1 from trees where trees.id = persons.tree_id
    and trees.owner_id = auth.uid())
  );

-- Relationships
create policy "Access relationships in own tree"
  on relationships for all using (
    exists (select 1 from trees where trees.id = relationships.tree_id
    and trees.owner_id = auth.uid())
  );

-- Events
create policy "Access events for own persons"
  on events for all using (
    exists (
      select 1 from persons
      join trees on trees.id = persons.tree_id
      where persons.id = events.person_id
      and trees.owner_id = auth.uid()
    )
  );
