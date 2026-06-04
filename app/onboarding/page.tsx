'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTree, createPerson, updateProfile, getUserTrees, getPersonsInTree } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Check, ChevronRight, SkipForward, Loader2, Link2, UserPlus } from 'lucide-react';
import type { Tree, Person } from '@/types';

const GENDER_OPTIONS = [
  { value: 'unknown', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function OnboardingPage() {
  const { user, refreshProfile, selfPersonId } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [treeName, setTreeName] = useState('');
  
  // Person form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('unknown');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [checkingTrees, setCheckingTrees] = useState(true);
  const [treeId, setTreeId] = useState('');
  const [existingTree, setExistingTree] = useState<Tree | null>(null);
  const [treePersons, setTreePersons] = useState<Person[]>([]);
  
  // Single tree claim state
  const [joinMode, setJoinMode] = useState<'link' | 'create'>('create');
  const [selectedPersonId, setSelectedPersonId] = useState('');

  // 1. Check for existing trees
  useEffect(() => {
    if (!user) return;
    let active = true;
    
    const checkTrees = async () => {
      try {
        const trees = await getUserTrees(user.id);
        if (!active) return;
        if (trees.length > 0) {
          const firstTree = trees[0];
          setExistingTree(firstTree);
          setTreeId(firstTree.id);
          setTreeName(firstTree.name);
          
          const persons = await getPersonsInTree(firstTree.id);
          if (!active) return;
          setTreePersons(persons);
          
          // Skip Step 1 (create tree) if it already exists
          setStep(2);
          setJoinMode('create');
          setSelectedPersonId('');
        }
      } catch (err) {
        console.error('Error loading existing trees:', err);
      } finally {
        if (active) setCheckingTrees(false);
      }
    };
    
    checkTrees();
    return () => { active = false; };
  }, [user]);

  // If user already has selfPersonId or is not an admin without a tree, redirect to dashboard
  useEffect(() => {
    if (selfPersonId) {
      router.push('/dashboard');
    } else if (user && user.role !== 'admin' && !checkingTrees && !existingTree) {
      // Non-admins cannot create trees, so they shouldn't be in onboarding if they don't have a tree
      router.push('/dashboard');
    }
  }, [selfPersonId, user, checkingTrees, existingTree, router]);

  const handleStep1 = async () => {
    if (!treeName || !user) return;
    setLoading(true);
    try {
      const tree = await createTree(treeName, user.id);
      setTreeId(tree.id);
      setStep(2);
      setJoinMode('create');
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleLinkPerson = async () => {
    if (!selectedPersonId || !user) return;
    setLoading(true);
    try {
      const selectedPerson = treePersons.find(p => p.id === selectedPersonId);
      if (!selectedPerson) return;
      
      await updateProfile(user.id, {
        self_person_id: selectedPerson.id,
        first_name: selectedPerson.first_name,
        last_name: selectedPerson.last_name || null,
      });
      await refreshProfile();
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleStep2Create = async () => {
    if (!firstName || !user) return;
    setLoading(true);
    try {
      const { person } = await createPerson({
        tree_id: treeId,
        first_name: firstName,
        last_name: lastName || null,
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        gender: gender as 'male' | 'female' | 'other' | 'unknown',
        is_living: true,
        created_by: user.id,
      });

      // Link this person to the user's profile
      await updateProfile(user.id, {
        self_person_id: person.id,
        first_name: firstName,
        last_name: lastName || null,
      });
      await refreshProfile();

      setStep(3);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  if (checkingTrees) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm text-[var(--text-muted)] font-medium">Setting up onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-mesh flex items-center justify-center px-4 py-8">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle compact />
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={46} withLabel />
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                s === step ? 'bg-brand-500 scale-125 shadow-[0_0_8px_rgba(24,95,165,0.4)]' : s < step ? 'bg-brand-300' : 'bg-[var(--border)]'
              }`} />
              {s < 3 && (
                <div className={`absolute top-1/2 left-full w-6 h-[2px] -translate-y-1/2 transition-colors duration-500 ${s < step ? 'bg-brand-300' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Create/Name Tree */}
        {step === 1 && (
          <div className="card rounded-sheet p-8 space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="font-display text-2xl text-[var(--text-primary)]">Name Your Family Tree</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1.5">Choose a name that represents your family</p>
            </div>
            <Input label="Tree Name" value={treeName} onChange={(e) => setTreeName(e.target.value)} placeholder="e.g. The Johnson Family" id="onboarding-tree-name" />
            <Button onClick={handleStep1} loading={loading} disabled={!treeName} className="w-full" size="lg">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Add Yourself or Join Tree */}
        {step === 2 && (
          <div className="card rounded-sheet p-6 sm:p-8 space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="font-display text-2xl text-[var(--text-primary)]">
                {existingTree ? `Join ${existingTree.name}` : 'Add Yourself'}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1.5">
                {existingTree 
                  ? "Connect your user account to your profile node in the family tree."
                  : "You'll be the starting point of your family tree."
                }
              </p>
            </div>

            {/* Select flow if tree exists */}
            {existingTree && treePersons.length > 0 && (
              <div className="flex p-1 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setJoinMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    joinMode === 'link'
                      ? 'bg-[var(--surface)] text-brand-500 shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Already on tree
                </button>
                <button
                  type="button"
                  onClick={() => setJoinMode('create')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    joinMode === 'create'
                      ? 'bg-[var(--surface)] text-brand-500 shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create new profile
                </button>
              </div>
            )}

            {joinMode === 'link' && existingTree && (
              <div className="space-y-4 animate-fade-in">
                <Select
                  label="Select your profile node"
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  options={treePersons.map(p => ({
                    value: p.id,
                    label: `${p.first_name} ${p.last_name || ''} ${p.nickname ? `(${p.nickname})` : ''}`
                  }))}
                  id="onboarding-select-person"
                />
                <Button onClick={handleLinkPerson} loading={loading} disabled={!selectedPersonId} className="w-full" size="lg">
                  Link Account <Check className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {(joinMode === 'create' || !existingTree) && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-4">
                  <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" required id="onboarding-first-name" />
                  <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" id="onboarding-last-name" />
                  <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} options={GENDER_OPTIONS} id="onboarding-gender" />
                  <Input label="Birth Date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} id="onboarding-birth-date" />
                  <Input label="Birthplace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="City, Country" id="onboarding-birth-place" />
                </div>
                <Button onClick={handleStep2Create} loading={loading} disabled={!firstName} className="w-full" size="lg">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {!existingTree && (
              <button onClick={() => setStep(3)} className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1 transition-colors">
                <SkipForward className="w-3.5 h-3.5" /> Skip for now
              </button>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="card rounded-sheet p-8 space-y-6 animate-fade-in-up text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg animate-scale-in">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Your Tree is Ready</h2>
            <p className="text-sm text-[var(--text-muted)]">Start adding family members to build out your heritage.</p>
            <Button onClick={() => router.push(`/tree?id=${treeId}`)} className="w-full" size="lg">
              Go to My Tree
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
