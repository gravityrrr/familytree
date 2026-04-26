import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 * Uses NEXT_PUBLIC env vars automatically.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
