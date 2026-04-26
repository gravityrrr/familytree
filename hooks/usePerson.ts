'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPersonById, getRelationships, getEvents } from '@/lib/db';
import type { Person, Relationship, FamilyEvent } from '@/types';

/**
 * Hook to load a single person with their relationships and events.
 */
export function usePerson(personId: string | null) {
  const [person, setPerson] = useState<Person | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!personId) return;
    try {
      setLoading(true);
      const [personData, rels, evts] = await Promise.all([
        getPersonById(personId),
        getRelationships(personId),
        getEvents(personId),
      ]);
      setPerson(personData);
      setRelationships(rels);
      setEvents(evts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load person');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    load();
  }, [load]);

  return { person, relationships, events, loading, error, refresh: load };
}
