'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonForm } from '@/components/person/PersonForm';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { createPerson, createRelationship, searchPersons, getPersonById } from '@/lib/db';
import type { Person, RelationshipType } from '@/types';
import { ArrowLeft, Loader2, Search, Link2 } from 'lucide-react';

export default function NewPersonPage() {
  return <ProtectedRoute><ToastProvider><NewPersonContent /></ToastProvider></ProtectedRoute>;
}

function NewPersonContent() {
  const router = useRouter();
  const { user, canEdit, loading: authLoading } = useAuth();
  const { activeTree, loading: treeLoading } = useTree();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialRelatedTo = searchParams.get('relatedTo');
  const initialType = searchParams.get('type') as RelationshipType;

  const [relationship, setRelationship] = useState<RelationshipType>(initialType || ('' as RelationshipType));
  const [linkedPersonId, setLinkedPersonId] = useState(initialRelatedTo || '');
  const [linkedPerson, setLinkedPerson] = useState<Person | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState<Person[]>([]);

  useEffect(() => {
    if (!authLoading && !canEdit) {
      router.replace('/tree');
    }
  }, [canEdit, authLoading, router]);

  useEffect(() => {
    if (initialRelatedTo) {
      getPersonById(initialRelatedTo).then(setLinkedPerson).catch(console.error);
    }
  }, [initialRelatedTo]);

  useEffect(() => {
    if (!linkSearch || !activeTree) {
      const id = requestAnimationFrame(() => setLinkResults([]));
      return () => cancelAnimationFrame(id);
    }
    const timer = setTimeout(async () => {
      const results = await searchPersons(activeTree.id, linkSearch);
      setLinkResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [linkSearch, activeTree]);

  if (authLoading || treeLoading || !activeTree) {
    return <div className="min-h-screen-safe flex items-center justify-center bg-mesh"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>;
  }

  const handleSubmit = async (data: Partial<Person>) => {
    if (!user || !canEdit) return;
    const { person: newPerson, isNew } = await createPerson({ ...data, tree_id: activeTree.id, created_by: user.id });
    if (linkedPersonId && relationship) {
      await createRelationship({ tree_id: activeTree.id, person_id: linkedPersonId, related_person_id: newPerson.id, relationship_type: relationship });
    }
    
    if (!isNew) {
      showToast(`This person already exists in the tree! We've automatically linked them.`, 'success');
    } else {
      showToast('Person added to tree', 'success');
    }
    
    router.push(`/person/${newPerson.id}`);
  };

  return (
    <div className="min-h-screen-safe bg-slate-50 dark:bg-slate-950">
      <header className="fixed top-4 left-4 right-4 z-30 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-lg flex items-center justify-between safe-top">
        <button onClick={() => router.push('/tree')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Person</h1>
        <div className="w-9" />
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 space-y-5 animate-fade-in-up pt-24 pb-12">
        {/* Link to existing person */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Link to Existing Person</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Connect to someone already in your tree</p>
            </div>
          </div>
          
          {linkedPerson ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-3">
                <Avatar firstName={linkedPerson.first_name} lastName={linkedPerson.last_name} photoUrl={linkedPerson.photo_url} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{linkedPerson.first_name} {linkedPerson.last_name || ''}</p>
                  <p className="text-[10px] text-slate-500">Selected Person</p>
                </div>
              </div>
              {!initialRelatedTo && (
                <button 
                  onClick={() => { setLinkedPerson(null); setLinkedPersonId(''); setLinkSearch(''); }}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 px-2 py-1"
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <Input placeholder="Search existing persons..." value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} className="pl-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" id="link-search" />
              </div>
              {linkResults.length > 0 && (
                <div className="space-y-1 mt-3 max-h-40 overflow-y-auto">
                  {linkResults.map((p) => (
                    <button key={p.id} className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800`} 
                      onClick={() => { 
                        setLinkedPersonId(p.id); 
                        setLinkedPerson(p);
                        setLinkResults([]); 
                      }}
                    >
                      <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="sm" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.first_name} {p.last_name || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <PersonForm onSubmit={handleSubmit} showRelationship relationship={relationship} onRelationshipChange={setRelationship} />
      </div>
    </div>
  );
}
