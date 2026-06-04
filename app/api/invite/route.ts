import { createServerSupabase } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/invite
 * Admin-only endpoint to send an invite email to a new user.
 * Uses the service role key to bypass RLS.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify the requesting user is authenticated
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the user profile to check roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = session.user.email === 'rushil.reddy4726@gmail.com' || profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only administrators can send invites' },
        { status: 403 }
      );
    }

    // 3. Get target email from request
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 4. Verify service role key is set
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('Invite Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not defined.');
      return NextResponse.json(
        { error: 'Server configuration error: Service role key is missing.' },
        { status: 500 }
      );
    }

    // 5. Use service role key to invite user
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    const { data, error } = await serviceSupabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error('Supabase Invite Admin Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error('Invite API Catch-All Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
