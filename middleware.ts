import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
        },
        remove(name: string, options: Record<string, unknown>) {
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, '', options as Parameters<typeof res.cookies.set>[2]);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Allow login page without auth
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If logged in and trying to access login, redirect to tree
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/tree', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
