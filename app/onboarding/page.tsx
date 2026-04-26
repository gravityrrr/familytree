'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTree, createPerson } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Check, ChevronRight, SkipForward } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [treeName, setTreeName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeId, setTreeId] = useState('');

  const handleStep1 = async () => {
    if (!treeName || !user) return;
    setLoading(true);
    try {
      const tree = await createTree(treeName, user.id);
      setTreeId(tree.id);
      setStep(2);
    } finally { setLoading(false); }
  };

  const handleStep2 = async () => {
    if (!firstName || !user) return;
    setLoading(true);
    try {
      await createPerson({
        tree_id: treeId, first_name: firstName, last_name: lastName || null,
        birth_date: birthDate || null, birth_place: birthPlace || null,
        gender: 'unknown', is_living: true, created_by: user.id,
      });
      setStep(3);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen-safe bg-mesh flex items-center justify-center px-4 py-8">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle compact />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={46} withLabel />
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                s === step ? 'bg-brand-500 scale-125 shadow-[0_0_8px_rgba(24,95,165,0.4)]' : s < step ? 'bg-brand-300' : 'bg-gray-200'
              }`} />
              {s < 3 && (
                <div className={`absolute top-1/2 left-full w-6 h-[2px] -translate-y-1/2 transition-colors duration-500 ${s < step ? 'bg-brand-300' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
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

        {/* Step 2 */}
        {step === 2 && (
          <div className="card rounded-sheet p-8 space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h2 className="font-display text-2xl text-[var(--text-primary)]">Add Yourself</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1.5">Start your tree by adding yourself</p>
            </div>
            <div className="space-y-4">
              <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" required id="onboarding-first-name" />
              <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" id="onboarding-last-name" />
              <Input label="Birth Date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} id="onboarding-birth-date" />
              <Input label="Birthplace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="City, Country" id="onboarding-birth-place" />
            </div>
            <Button onClick={handleStep2} loading={loading} disabled={!firstName} className="w-full" size="lg">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
            <button onClick={() => setStep(3)} className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1 transition-colors">
              <SkipForward className="w-3.5 h-3.5" /> Skip for now
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="card rounded-sheet p-8 space-y-6 animate-fade-in-up text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg animate-scale-in">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Your Tree is Ready</h2>
            <p className="text-sm text-[var(--text-muted)]">Start adding family members to build out your heritage.</p>
            <Button onClick={() => router.push('/tree')} className="w-full" size="lg">
              Go to My Tree
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
