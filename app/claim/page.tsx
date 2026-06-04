'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { searchClaimableProfiles, createProfileClaim } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Search, Loader2, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';

export default function ClaimPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <ClaimContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}

function ClaimContent() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already linked, redirect to dashboard
  if (!authLoading && profile?.self_person_id) {
    router.push('/dashboard');
    return null;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const results = await searchClaimableProfiles(phone.trim());
      setProfiles(results);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error searching profiles', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleClaim = async (personId: string, treeId: string) => {
    setClaimingId(personId);
    try {
      await createProfileClaim(personId, treeId);
      setSuccess(true);
      showToast('Claim request sent successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error creating claim', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 relative flex flex-col items-center">
      <header className="w-full max-w-lg mb-8 animate-fade-in-down flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size={36} />
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">KinRoot</h1>
        </div>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>Skip for now</Button>
      </header>

      <main className="w-full max-w-lg animate-fade-in-up">
        {success ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl border border-emerald-100 dark:border-emerald-900/50">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Request Sent!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Your profile claim request has been sent to the Tree Administrator. You will gain access to the tree as soon as they approve it.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
              Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Claim Your Profile</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                If your family member has already added you to a tree, enter your registered phone number to find and claim your profile.
              </p>
            </div>

            <form onSubmit={handleSearch} className="mb-8 relative group">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number..."
                    className="pl-11 h-12 w-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900"
                    required
                  />
                </div>
                <Button type="submit" loading={searching} className="h-12 px-6">
                  Find
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              {hasSearched && profiles.length === 0 && !searching && (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No matching profiles found.</p>
                  <p className="text-xs text-slate-400 mt-1">Make sure the phone number matches what your family member entered exactly.</p>
                </div>
              )}

              {profiles.map(p => (
                <div key={p.person_id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                      {p.first_name} {p.last_name || ''}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      in <span className="font-semibold text-brand-600 dark:text-brand-400">{p.tree_name}</span>
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleClaim(p.person_id, p.tree_id)}
                    loading={claimingId === p.person_id}
                    disabled={claimingId !== null && claimingId !== p.person_id}
                    className="shrink-0"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Claim Profile
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
