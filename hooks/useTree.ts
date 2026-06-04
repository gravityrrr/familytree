'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUserTrees, getPersonsInTree, getRelationshipsInTree } from '@/lib/db';
import type { Tree, Person, Relationship } from '@/types';
import { useAuth } from './useAuth';

/**
 * Hook to load the user's trees, persons, and relationships.
 */
export function useTree(treeId?: string | null) {
  const { user } = useAuth();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [activeTree, setActiveTree] = useState<Tree | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrees = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userTrees = await getUserTrees(user.id);
      setTrees(userTrees);
      if (userTrees.length > 0) {
        if (treeId) {
          const found = userTrees.find(t => t.id === treeId);
          setActiveTree(found || userTrees[0]);
        } else {
          setActiveTree(userTrees[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trees');
    } finally {
      setLoading(false);
    }
  }, [user, treeId]);

  const loadTreeData = useCallback(async () => {
    if (!activeTree) return;
    try {
      setLoading(true);
      const [treePersons, treeRels] = await Promise.all([
        getPersonsInTree(activeTree.id),
        getRelationshipsInTree(activeTree.id),
      ]);
      setPersons(treePersons);
      setRelationships(treeRels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tree data');
    } finally {
      setLoading(false);
    }
  }, [activeTree]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { loadTrees(); });
    return () => cancelAnimationFrame(id);
  }, [loadTrees]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { loadTreeData(); });
    return () => cancelAnimationFrame(id);
  }, [loadTreeData]);

  const refresh = useCallback(() => {
    loadTreeData();
  }, [loadTreeData]);

  return {
    trees,
    activeTree,
    setActiveTree,
    persons,
    relationships,
    loading,
    error,
    refresh,
    hasTree: trees.length > 0,
  };
}
