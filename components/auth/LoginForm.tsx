'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserTrees } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TreePine, Mail, Lock } from 'lucide-react';

/**
 * Login form with email/password authentication.
 * Redirects to /tree on success, or /onboarding if no tree exists.
 */
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        // Check if user has any trees
        const trees = await getUserTrees(data.user.id);
        if (trees.length === 0) {
          router.push('/onboarding');
        } else {
          router.push('/tree');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/10 rounded-2xl mb-4">
            <TreePine className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Family Tree</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your family tree
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-card text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
              id="login-email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10"
              id="login-password"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Accounts are invite-only. Contact your family admin for access.
        </p>
      </div>
    </div>
  );
}
