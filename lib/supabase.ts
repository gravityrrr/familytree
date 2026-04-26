import { createBrowserClient } from '@supabase/ssr';

type Client = ReturnType<typeof createBrowserClient>;

let _supabase: Client | null = null;

/**
 * Browser-side Supabase client (lazy singleton).
 * Defers creation until first access so static prerendering
 * doesn't crash when env vars are unavailable.
 */
export function getSupabase(): Client {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}
