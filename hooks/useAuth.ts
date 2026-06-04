'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { getProfile } from '@/lib/db';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

/**
 * Hook to get and listen to the current auth state.
 * Also fetches the user's profile (including self_person_id).
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch {
      // Profile may not exist yet (pre-trigger)
    }
  }, []);

  useEffect(() => {
    // Get initial session
    getSupabase().auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event: string, session: Session | null) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const role = user?.email === 'rushil.reddy4726@gmail.com' ? 'admin' : (profile?.role ?? 'viewer');
  const canEdit = role === 'admin' || role === 'editor';

  return {
    user,
    profile,
    selfPersonId: profile?.self_person_id ?? null,
    role,
    canEdit,
    loading,
    signOut,
    refreshProfile,
  };
}
