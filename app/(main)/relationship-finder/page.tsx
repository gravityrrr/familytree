'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useTree } from '@/hooks/useTree';
import { getPersonsInTree, getRelationshipsInTree } from '@/lib/db';
import { buildGraph, findShortestPath, calculateRelationshipTerms, getGenerationDistance, type FamilyGraph, type PathStep } from '@/lib/graph';
import { inferTeluguRelationship } from '@/lib/relationships';
import type { Person, Relationship } from '@/types';
import { PersonAutocomplete } from '@/components/ui/PersonAutocomplete';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Loader2, ArrowRight, Network, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function RelationshipFinderPage() {
  return <RelationshipFinderContent />;
}

function RelationshipFinderContent() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { activeTree, persons, relationships, loading: treeLoading } = useTree();
  
  const [graph, setGraph] = useState<FamilyGraph | null>(null);
  
  const [personAId, setPersonAId] = useState('');
  const [personBId, setPersonBId] = useState('');
  
  const [path, setPath] = useState<PathStep[] | null>(null);
  const [termsAtoB, setTermsAtoB] = useState<{ english: string, telugu: string } | null>(null);
  const [termsBtoA, setTermsBtoA] = useState<{ english: string, telugu: string } | null>(null);
  const [genDist, setGenDist] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (authLoading || treeLoading) return;
    if (!activeTree) {
      router.push('/dashboard');
    }
  }, [activeTree, authLoading, treeLoading, router]);

  useEffect(() => {
    if (persons.length > 0 && relationships.length > 0) {
      setGraph(buildGraph(persons, relationships));
    }
  }, [persons, relationships]);


  const handleCalculate = () => {
    if (!graph || !personAId || !personBId) return;
    
    const pA = persons.find(p => p.id === personAId);
    const pB = persons.find(p => p.id === personBId);
    if (!pA || !pB) return;

    const shortestPath = findShortestPath(graph, personAId, personBId);
    const inversePath = findShortestPath(graph, personBId, personAId);
    
    setPath(shortestPath);
    setSearched(true);
    
    if (shortestPath && shortestPath.length > 0 && inversePath) {
      // What A is to B (B is source, A is target)
      const basicAtoB = calculateRelationshipTerms(inversePath, pB.gender || 'other', pA.gender || 'other');
      const teluguAtoB = inferTeluguRelationship(pB, pA, persons, relationships);
      setTermsAtoB({ 
        english: basicAtoB.english, 
        telugu: teluguAtoB ? teluguAtoB.label : basicAtoB.telugu 
      });

      // What B is to A (A is source, B is target)
      const basicBtoA = calculateRelationshipTerms(shortestPath, pA.gender || 'other', pB.gender || 'other');
      const teluguBtoA = inferTeluguRelationship(pA, pB, persons, relationships);
      setTermsBtoA({ 
        english: basicBtoA.english, 
        telugu: teluguBtoA ? teluguBtoA.label : basicBtoA.telugu 
      });

      setGenDist(getGenerationDistance(inversePath));
    } else {
      setTermsAtoB(null);
      setTermsBtoA(null);
      setGenDist(null);
    }
  };

  const getPersonA = () => persons.find(p => p.id === personAId);
  const getPersonB = () => persons.find(p => p.id === personBId);

  if (treeLoading || authLoading) {
    return (
      <div className="h-full flex flex-col">
        <header className="sticky top-0 z-30 px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between safe-top">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
              <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col pb-24 overflow-y-auto">
      <header className="sticky top-0 z-30 px-4 py-3 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <Link href="/tree" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">Relationship Finder</h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{activeTree?.name}</p>
          </div>
        </div>
        <ThemeToggle compact />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-inner border border-brand-200 dark:border-brand-500/30">
            <Network className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Find Relationship</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Select two people to discover exactly how they are connected in your family tree.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 mb-8 space-y-6">
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="z-20 w-full relative">
              <PersonAutocomplete
                label="Person 1"
                value={personAId}
                onChange={setPersonAId}
                persons={persons}
                excludeId={personBId}
                placeholder="Search first person..."
              />
            </div>
            
            <div className="hidden sm:flex h-12 items-center justify-center px-2 pb-1 relative z-10">
              <Network className="w-5 h-5 text-brand-500" />
            </div>

            <div className="z-10 w-full relative">
              <PersonAutocomplete
                label="Person 2"
                value={personBId}
                onChange={setPersonBId}
                persons={persons}
                excludeId={personAId}
                placeholder="Search second person..."
              />
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCalculate}
            disabled={!personAId || !personBId || personAId === personBId}
          >
            Calculate Relationship
          </Button>
        </div>

        {searched && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {path === null ? (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 text-center">
                <p className="text-amber-800 dark:text-amber-400 font-medium">No connection found.</p>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">These two people don't seem to be connected by blood or marriage in the tree.</p>
              </div>
            ) : path.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 text-center">
                <p className="text-slate-800 dark:text-slate-200 font-medium">You selected the same person!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Primary Result */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-brand-100 dark:border-brand-500/20 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-400 to-indigo-500" />
                  
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 mb-8 mt-2">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Avatar url={getPersonA()?.photo_url} fallback={getPersonA()?.first_name || ''} size={80} className="ring-4 ring-slate-50 dark:ring-slate-950 shadow-md" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{getPersonA()?.first_name}</span>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Person 1</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center border border-brand-100 dark:border-brand-500/20">
                        <Network className="w-5 h-5 text-brand-500" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 text-center">
                      <Avatar url={getPersonB()?.photo_url} fallback={getPersonB()?.first_name || ''} size={80} className="ring-4 ring-slate-50 dark:ring-slate-950 shadow-md" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{getPersonB()?.first_name}</span>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Person 2</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* A to B */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong className="text-slate-900 dark:text-slate-100">{getPersonA()?.first_name}</strong> is the <strong className="text-slate-900 dark:text-slate-100">{termsAtoB?.english}</strong> of <strong className="text-slate-900 dark:text-slate-100">{getPersonB()?.first_name}</strong>
                      </p>
                      {termsAtoB?.telugu && termsAtoB.telugu !== 'Self' && termsAtoB.telugu !== 'Distant Relation' && (
                        <div className="px-4 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-full border border-orange-100 dark:border-orange-500/20">
                          <span className="text-orange-600 dark:text-orange-400 font-bold">{termsAtoB.telugu}</span>
                        </div>
                      )}
                    </div>

                    {/* B to A */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong className="text-slate-900 dark:text-slate-100">{getPersonB()?.first_name}</strong> is the <strong className="text-slate-900 dark:text-slate-100">{termsBtoA?.english}</strong> of <strong className="text-slate-900 dark:text-slate-100">{getPersonA()?.first_name}</strong>
                      </p>
                      {termsBtoA?.telugu && termsBtoA.telugu !== 'Self' && termsBtoA.telugu !== 'Distant Relation' && (
                        <div className="px-4 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-full border border-orange-100 dark:border-orange-500/20">
                          <span className="text-orange-600 dark:text-orange-400 font-bold">{termsBtoA.telugu}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 divide-x divide-slate-100 dark:divide-slate-800">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Distance</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {path.length} {path.length === 1 ? 'step' : 'steps'} away
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Generation</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {genDist === 0 ? 'Same Generation' : genDist! > 0 ? `${Math.abs(genDist!)} Gen Below` : `${Math.abs(genDist!)} Gen Above`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Path Visualizer */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Network className="w-4 h-4 text-brand-500" />
                    Exact Path Trace
                  </h3>
                  
                  <div className="space-y-0 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />
                    
                    {/* Start Node */}
                    <div className="relative flex items-center gap-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-sm">
                        <Avatar url={getPersonA()?.photo_url} fallback={getPersonA()?.first_name || ''} size={24} />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{getPersonA()?.first_name} {getPersonA()?.last_name}</span>
                    </div>

                    {/* Path Steps */}
                    {path.map((step, idx) => (
                      <div key={idx} className="relative flex items-center gap-4 py-3">
                        <div className="w-8 flex justify-center z-10">
                          <div className="w-2 h-2 rounded-full bg-brand-400 ring-4 ring-white dark:ring-slate-900" />
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Step {idx + 1}</span>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            is <span className="font-semibold text-brand-600 dark:text-brand-400">{step.relationshipType}</span> to <span className="font-medium text-slate-900 dark:text-slate-100">{step.to.first_name}</span>
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* End Node */}
                    <div className="relative flex items-center gap-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-brand-500 border-2 border-white dark:border-slate-900 flex items-center justify-center z-10 shadow-sm text-white">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Target reached!</span>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
