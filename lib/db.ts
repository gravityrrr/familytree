import { getSupabase } from './supabase';
import type { Tree, Person, Relationship, FamilyEvent, Profile, RelationshipType, Gothra, ProfileClaim } from '@/types';

// ============================================================
// Profiles
// ============================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data || null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function updateUserRole(userId: string, newRole: 'admin' | 'editor' | 'viewer'): Promise<void> {
  const { error } = await getSupabase().rpc('update_user_role', {
    target_user_id: userId,
    new_role: newRole
  });
  if (error) throw error;
}
export async function upsertProfile(
  profile: Partial<Profile> & { id: string }
): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .order('email', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ============================================================
// Trees
// ============================================================

export async function createTree(name: string, ownerId: string): Promise<Tree> {
  const { data, error } = await getSupabase()
    .from('trees')
    .insert({ name, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserTrees(userId: string, role?: string): Promise<Tree[]> {
  // If role is passed directly, use it to avoid an extra DB call.
  // Otherwise fallback to checking DB.
  let isAdmin = role === 'admin';
  if (!role) {
    const { data: profile } = await getSupabase()
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }
  
  if (isAdmin) {
    const { data } = await getSupabase().from('trees').select('*').order('created_at', { ascending: false });
    return data || [];
  }

  const [ownedRes, joinedRes] = await Promise.all([
    getSupabase().from('trees').select('*').eq('owner_id', userId),
    getSupabase().from('join_requests').select('tree:tree_id(*)').eq('user_id', userId).eq('status', 'approved')
  ]);
  
  const owned = ownedRes.data || [];
  const joined = (joinedRes.data || []).map((r: any) => r.tree).filter(Boolean) as Tree[];
  
  const allTrees = [...owned, ...joined];
  const uniqueTrees = Array.from(new Map(allTrees.map(t => [t.id, t])).values());
  
  return uniqueTrees.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getAllPublicTrees(): Promise<Tree[]> {
  const { data, error } = await getSupabase()
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============================================================
// Persons
// ============================================================

export async function getPersonById(id: string): Promise<Person> {
  const { data, error } = await getSupabase()
    .from('persons')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getPersonsInTree(treeId: string): Promise<Person[]> {
  const { data, error } = await getSupabase()
    .from('persons')
    .select('*')
    .eq('tree_id', treeId)
    .order('first_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function findPersonByIdentity(
  treeId: string, 
  identity: { phone?: string | null, email?: string | null }
): Promise<Person | null> {
  if (!identity.phone && !identity.email) return null;
  
  let query = getSupabase().from('persons').select('*').eq('tree_id', treeId);
  
  const conditions = [];
  if (identity.phone) conditions.push(`phone.eq.${identity.phone}`);
  if (identity.email) conditions.push(`email.eq.${identity.email}`);
  
  if (conditions.length === 0) return null;
  
  query = query.or(conditions.join(','));
  
  const { data, error } = await query;
  if (error) throw error;
  
  return data && data.length > 0 ? data[0] : null;
}

export async function searchGothras(query: string): Promise<Gothra[]> {
  if (!query) return [];
  const { data, error } = await getSupabase()
    .from('gothras')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function createGothra(name: string): Promise<Gothra> {
  // Try to find exact match first to avoid unique constraint errors
  const { data: existing } = await getSupabase()
    .from('gothras')
    .select('*')
    .ilike('name', name)
    .single();
    
  if (existing) return existing;

  const { data, error } = await getSupabase()
    .from('gothras')
    .insert({ name })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function createPerson(personData: Partial<Person>): Promise<{ person: Person, isNew: boolean }> {
  // Check for existing person if identity fields are provided
  if (personData.tree_id && (personData.phone || personData.email)) {
    const existing = await findPersonByIdentity(personData.tree_id, personData);
    if (existing) {
      return { person: existing, isNew: false };
    }
  }

  const { data, error } = await getSupabase()
    .from('persons')
    .insert(personData)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('phone')) throw new Error('This phone number already exists in the tree.');
      if (error.message.includes('email')) throw new Error('This email address already exists in the tree.');
      throw new Error('A person with this unique identifier already exists.');
    }
    throw error;
  }
  return { person: data, isNew: true };
}

export async function updatePerson(
  id: string,
  updates: Partial<Person>
): Promise<Person> {
  const { data, error } = await getSupabase()
    .from('persons')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('phone')) throw new Error('This phone number already exists in the tree.');
      if (error.message.includes('email')) throw new Error('This email address already exists in the tree.');
      throw new Error('A person with this unique identifier already exists.');
    }
    throw error;
  }
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await getSupabase().from('persons').delete().eq('id', id);
  if (error) throw error;
}

export async function searchPersons(
  treeId: string,
  query: string
): Promise<Person[]> {
  const { data, error } = await getSupabase()
    .from('persons')
    .select('*')
    .eq('tree_id', treeId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,nickname.ilike.%${query}%,phone.ilike.%${query}%,gothra.ilike.%${query}%`)
    .order('first_name', { ascending: true })
    .limit(20);
  if (error) throw error;
  return data || [];
}

// ============================================================
// Relationships
// ============================================================

/** Map a relationship type to its inverse */
function getInverseType(type: RelationshipType): RelationshipType {
  const inverses: Record<RelationshipType, RelationshipType> = {
    parent: 'child',
    child: 'parent',
    spouse: 'spouse',
    sibling: 'sibling',
    grandparent: 'grandchild',
    grandchild: 'grandparent',
    aunt_uncle: 'niece_nephew',
    niece_nephew: 'aunt_uncle',
    cousin: 'cousin',
    other: 'other',
  };
  return inverses[type] || 'other';
}

export async function getRelationships(personId: string): Promise<Relationship[]> {
  const { data, error } = await getSupabase()
    .from('relationships')
    .select('*, related_person:related_person_id(*)')
    .eq('person_id', personId);
  if (error) throw error;
  return data || [];
}

export async function getRelationshipsInTree(treeId: string): Promise<Relationship[]> {
  const { data, error } = await getSupabase()
    .from('relationships')
    .select('*')
    .eq('tree_id', treeId);
  if (error) throw error;
  return data || [];
}

export async function createRelationship(
  relData: Partial<Relationship>
): Promise<Relationship> {
  const { data, error } = await getSupabase()
    .from('relationships')
    .insert(relData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a relationship AND its inverse automatically.
 * e.g. A→B (parent) also creates B→A (child).
 * Silently ignores duplicate errors on the inverse.
 */
export async function createBidirectionalRelationship(
  relData: {
    tree_id: string;
    person_id: string;
    related_person_id: string;
    relationship_type: RelationshipType;
  }
): Promise<Relationship> {
  // Create the primary relationship
  const primary = await createRelationship(relData);

  // Create the inverse (ignore if it already exists)
  try {
    await createRelationship({
      tree_id: relData.tree_id,
      person_id: relData.related_person_id,
      related_person_id: relData.person_id,
      relationship_type: getInverseType(relData.relationship_type),
    });
  } catch {
    // Duplicate relationship — that's fine, ignore
  }

  return primary;
}

export async function deleteRelationship(id: string): Promise<void> {
  const { error } = await getSupabase().from('relationships').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteBidirectionalRelationship(
  personId: string,
  relatedPersonId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('relationships')
    .delete()
    .or(`and(person_id.eq.${personId},related_person_id.eq.${relatedPersonId}),and(person_id.eq.${relatedPersonId},related_person_id.eq.${personId})`);
  if (error) throw error;
}

// ============================================================
// Events / Timeline
// ============================================================

export async function getEvents(personId: string): Promise<FamilyEvent[]> {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .eq('person_id', personId)
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createEvent(
  eventData: Partial<FamilyEvent>
): Promise<FamilyEvent> {
  const { data, error } = await getSupabase()
    .from('events')
    .insert(eventData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(
  id: string,
  updates: Partial<FamilyEvent>
): Promise<FamilyEvent> {
  const { data, error } = await getSupabase()
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await getSupabase().from('events').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Join Requests
// ============================================================

export async function requestJoinTree(treeId: string, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('join_requests')
    .insert({ tree_id: treeId, user_id: userId, status: 'pending' });
  if (error && error.code !== '23505') throw error; // ignore unique constraint duplicate
}

export async function getPendingRequestsForOwner(): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from('join_requests')
    .select('*, tree:tree_id(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  if (!data || data.length === 0) return [];

  // Fetch user profiles separately since join_requests references auth.users not profiles directly
  const userIds = data.map((r: any) => r.user_id);
  const { data: profiles } = await getSupabase()
    .from('profiles')
    .select('id, email, first_name, last_name, avatar_url')
    .in('id', userIds);

  return data.map((req: any) => ({
    ...req,
    user: profiles?.find((p: any) => p.id === req.user_id) || { id: req.user_id, first_name: 'Unknown', email: '' }
  }));
}

export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await getSupabase()
    .from('join_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw error;
}

export async function getUserJoinRequests(userId: string): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from('join_requests')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// ==========================================
// PROFILE CLAIMS
// ==========================================

export async function searchClaimableProfiles(phone: string) {
  const { data, error } = await getSupabase().rpc('search_claimable_profiles', {
    search_phone: phone,
  });
  if (error) throw error;
  return data as { person_id: string; first_name: string; last_name: string | null; tree_id: string; tree_name: string }[];
}

export async function createProfileClaim(personId: string, treeId: string): Promise<ProfileClaim> {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await getSupabase()
    .from('profile_claims')
    .insert({
      user_id: user.id,
      person_id: personId,
      tree_id: treeId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ProfileClaim;
}

export async function getPendingClaimsForAdmin(): Promise<(ProfileClaim & { persons: Person })[]> {
  const { data, error } = await getSupabase()
    .from('profile_claims')
    .select('*, persons(*)')
    .eq('status', 'pending');

  if (error) throw error;
  return data as any;
}

export async function approveProfileClaim(claimId: string): Promise<void> {
  const { error } = await getSupabase().rpc('approve_profile_claim', {
    claim_id: claimId,
  });
  if (error) throw error;
}

export async function rejectProfileClaim(claimId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('profile_claims')
    .update({ status: 'rejected' })
    .eq('id', claimId);

  if (error) throw error;
}
