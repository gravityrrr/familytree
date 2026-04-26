'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonForm } from '@/components/person/PersonForm';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { createPerson, createRelationship, searchPersons } from '@/lib/db';
import type { Person, RelationshipType } from '@/types';
import { ArrowLeft, Loader2, Search, Link2 } from 'lucide-react';

export default function NewPersonPage() {
  return <ProtectedRoute><ToastProvider><NewPersonContent /></ToastProvider></ProtectedRoute>;
}

function NewPersonContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTree, loading: treeLoading } = useTree();
  const { showToast } = useToast();
  const [relationship, setRelationship] = useState<RelationshipType>('' as RelationshipType);
  const [linkedPersonId, setLinkedPersonId] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState<Person[]>([]);

  useEffect(() => {
    if (!linkSearch || !activeTree) { setLinkResults([]); return; }
    const timer = setTimeout(async () => {
      const results = await searchPersons(activeTree.id, linkSearch);
      setLinkResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [linkSearch, activeTree]);

  if (treeLoading || !activeTree) {
    return <div className="min-h-screen-safe flex items-center justify-center bg-mesh"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>;
  }

  const handleSubmit = async (data: Partial<Person>) => {
    if (!user) return;
    const newPerson = await createPerson({ ...data, tree_id: activeTree.id, created_by: user.id });
    if (linkedPersonId && relationship) {
      await createRelationship({ tree_id: activeTree.id, person_id: linkedPersonId, related_person_id: newPerson.id, relationship_type: relationship });
    }
    showToast('Person added to tree');
    router.push(`/person/${newPerson.id}`);
  };

  return (
    <div className="min-h-screen-safe bg-mesh">
      <header className="sticky-header px-4 sm:px-6 py-3 flex items-center justify-between safe-top">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors press">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-sm font-bold text-gray-900">Add Person</h1>
        <div className="w-9" />
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 space-y-5 animate-fade-in-up">
        {/* Link to existing person */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Link to Existing Person</h3>
              <p className="text-[10px] text-gray-400">Connect to someone already in your tree</p>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <Input placeholder="Search existing persons..." value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} className="pl-10" id="link-search" />
          </div>
          {linkResults.length > 0 && (
            <div className="space-y-1 mt-3 max-h-40 overflow-y-auto">
              {linkResults.map((p) => (
                <button key={p.id} className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-200 press ${linkedPersonId === p.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-gray-50'}`} onClick={() => { setLinkedPersonId(p.id); setLinkSearch(`${p.first_name} ${p.last_name || ''}`); setLinkResults([]); }}>
                  <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="sm" />
                  <span className="text-sm font-medium text-gray-800">{p.first_name} {p.last_name || ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <PersonForm onSubmit={handleSubmit} showRelationship relationship={relationship} onRelationshipChange={setRelationship} />
      </div>
    </div>
  );
}
