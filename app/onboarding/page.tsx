'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTree, createPerson } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TreePine, User, Check, ChevronRight, SkipForward } from 'lucide-react';

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
        tree_id: treeId,
        first_name: firstName,
        last_name: lastName || null,
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        gender: 'unknown',
        is_living: true,
        created_by: user.id,
      });
      setStep(3);
    } finally { setLoading(false); }
  };

  const handleSkip = () => setStep(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${s === step ? 'bg-brand scale-125' : s < step ? 'bg-brand/50' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step 1: Name your tree */}
        {step === 1 && (
          <div className="bg-white rounded-sheet shadow-sm border border-gray-100 p-8 space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-brand/10 rounded-2xl mb-4">
                <TreePine className="w-7 h-7 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Name Your Family Tree</h2>
              <p className="text-sm text-gray-500 mt-1">Choose a name for your family tree</p>
            </div>
            <Input label="Tree Name" value={treeName} onChange={(e) => setTreeName(e.target.value)} placeholder="e.g. The Johnson Family" id="onboarding-tree-name" />
            <Button onClick={handleStep1} loading={loading} disabled={!treeName} className="w-full" size="lg">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Add yourself */}
        {step === 2 && (
          <div className="bg-white rounded-sheet shadow-sm border border-gray-100 p-8 space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 rounded-2xl mb-4">
                <User className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add Yourself</h2>
              <p className="text-sm text-gray-500 mt-1">Start your tree by adding yourself</p>
            </div>
            <div className="space-y-4">
              <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" required id="onboarding-first-name" />
              <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" id="onboarding-last-name" />
              <Input label="Birth Date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} id="onboarding-birth-date" />
              <Input label="Birthplace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="City, Country" id="onboarding-birth-place" />
            </div>
            <Button onClick={handleStep2} loading={loading} disabled={!firstName} className="w-full" size="lg">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <button onClick={handleSkip} className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mt-2">
              <SkipForward className="w-3.5 h-3.5" /> Skip for now
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-sheet shadow-sm border border-gray-100 p-8 space-y-6 animate-fadeIn text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-2">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Tree is Ready!</h2>
            <p className="text-sm text-gray-500">Start adding family members to build out your tree.</p>
            <Button onClick={() => router.push('/tree')} className="w-full" size="lg">
              Go to My Tree <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
