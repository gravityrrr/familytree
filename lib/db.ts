import { getSupabase } from './supabase';
import type { Tree, Person, Relationship, FamilyEvent } from '@/types';

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

export async function getUserTrees(userId: string): Promise<Tree[]> {
  const { data, error } = await getSupabase()
    .from('trees')
    .select('*')
    .eq('owner_id', userId)
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

export async function createPerson(personData: Partial<Person>): Promise<Person> {
  const { data, error } = await getSupabase()
    .from('persons')
    .insert(personData)
    .select()
    .single();
  if (error) throw error;
  return data;
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
  if (error) throw error;
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
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,nickname.ilike.%${query}%`)
    .order('first_name', { ascending: true })
    .limit(20);
  if (error) throw error;
  return data || [];
}

// ============================================================
// Relationships
// ============================================================

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

export async function deleteRelationship(id: string): Promise<void> {
  const { error } = await getSupabase().from('relationships').delete().eq('id', id);
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
