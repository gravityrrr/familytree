'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { getUserTrees } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Mail, Lock } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await getSupabase().auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      if (data.user) {
        const trees = await getUserTrees(data.user.id);
        router.push(trees.length === 0 ? '/onboarding' : '/tree');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-mesh px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[430px] animate-fade-in-up">
        <div className="mb-6 flex items-center justify-end">
          <ThemeToggle compact />
        </div>

        <div className="card rounded-sheet p-6 sm:p-8">
          <div className="mb-7 text-center">
            <BrandLogo size={48} withLabel />
            <p className="mt-3 text-sm text-[var(--text-muted)]">Sign in to explore your family atlas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50/80 border border-red-100 rounded-xl text-sm text-red-700 animate-fade-in flex items-center gap-2 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-300">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-xs">!</span>
                </div>
                {error}
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-200 pointer-events-none" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-11"
                id="login-email"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-200 pointer-events-none" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-11"
                id="login-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-6 tracking-wide">
          Accounts are invite-only · Contact your family admin for access
        </p>
      </div>
    </div>
  );
}
