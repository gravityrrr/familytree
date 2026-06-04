// ============================================================
// TypeScript types matching the Supabase DB schema exactly
// ============================================================

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  self_person_id: string | null;
  role?: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface ProfileClaim {
  id: string;
  user_id: string;
  person_id: string;
  tree_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Tree {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  tree_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // joined fields
  user?: Profile;
  tree?: Tree;
}

export interface Gothra {
  id: string;
  name: string;
  created_at: string;
}

export interface Person {
  id: string;
  tree_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  nickname: string | null;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birth_date: string | null;
  birth_year: number | null;
  birth_place: string | null;
  birth_area: string | null;
  death_date: string | null;
  death_place: string | null;
  death_area: string | null;
  is_living: boolean;
  bio: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  aadhar_number: string | null;
  system_id: string | null;
  gothra: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin'
  | 'other';

export interface Relationship {
  id: string;
  tree_id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: RelationshipType;
  created_at: string;
  // Joined fields (optional, populated by queries)
  related_person?: Person;
  person?: Person;
  // Custom label (optional, dynamically inferred or populated)
  custom_label?: string | null;
}

export type EventType =
  | 'birth'
  | 'death'
  | 'marriage'
  | 'divorce'
  | 'moved'
  | 'graduated'
  | 'military'
  | 'other';

export interface FamilyEvent {
  id: string;
  person_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_year: number | null;
  event_place: string | null;
  event_type: EventType;
  created_at: string;
}

// Tree visualisation node with layout coordinates
export interface TreeNode {
  person: Person;
  x: number;
  y: number;
  generation: number;
  children: TreeNode[];
  spouses: Person[];
  parentIds: string[];
}

// Generation colour scheme
export interface GenerationColor {
  bg: string;
  fg: string;
  ring: string;
}

// Onboarding state
export interface OnboardingState {
  step: 1 | 2 | 3;
  treeName: string;
  person: Partial<Person>;
}
