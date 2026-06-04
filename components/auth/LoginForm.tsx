'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { getUserTrees } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Mail, Lock, Sparkles } from 'lucide-react';

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
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-16 relative flex items-center justify-center overflow-hidden">
      {/* Animated gradient spheres in the background */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl animate-float -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/15 to-blue-500/15 blur-3xl animate-float -z-10" style={{ animationDelay: '-3s' }} />

      <div className="w-full max-w-[430px] animate-fade-in-up relative z-10">
        <div className="mb-6 flex items-center justify-end">
          <ThemeToggle compact />
        </div>

        {/* Login frosted card */}
        <div className="relative rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl overflow-hidden p-6 sm:p-10">
          <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-none rounded-[24px]" />
          
          <div className="mb-8 text-center">
            <div className="inline-block transform hover:scale-105 transition-transform duration-300">
              <BrandLogo size={52} withLabel />
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 tracking-wide">
              Sign in to explore your family atlas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 animate-fade-in flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0 border border-red-200 dark:border-red-800/50">
                  <span className="font-black">!</span>
                </div>
                {error}
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                id="login-email"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                id="login-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25" size="lg">
              Sign In
            </Button>
          </form>
        </div>

        <div className="mt-8 flex justify-center">
          <p className="flex items-center gap-2 text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-2xl shadow-md backdrop-blur-md">
            <Lock className="w-4 h-4 text-blue-500" /> Accounts are invite-only. Contact your family admin.
          </p>
        </div>
      </div>
    </div>
  );
}
