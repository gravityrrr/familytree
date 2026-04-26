'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonForm } from '@/components/person/PersonForm';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { createPerson, createRelationship, searchPersons } from '@/lib/db';
import type { Person, RelationshipType } from '@/types';
import { ArrowLeft, Loader2, Search } from 'lucide-react';

export default function NewPersonPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <NewPersonContent />
      </ToastProvider>
    </ProtectedRoute>
  );
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

  // Search for existing persons to link
  useEffect(() => {
    if (!linkSearch || !activeTree) { setLinkResults([]); return; }
    const timer = setTimeout(async () => {
      const results = await searchPersons(activeTree.id, linkSearch);
      setLinkResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [linkSearch, activeTree]);

  if (treeLoading || !activeTree) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (data: Partial<Person>) => {
    if (!user) return;
    const newPerson = await createPerson({
      ...data,
      tree_id: activeTree.id,
      created_by: user.id,
    });

    // Create relationship if linked to existing person
    if (linkedPersonId && relationship) {
      await createRelationship({
        tree_id: activeTree.id,
        person_id: linkedPersonId,
        related_person_id: newPerson.id,
        relationship_type: relationship,
      });
    }

    showToast('Person added to tree');
    router.push(`/person/${newPerson.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Add Person</h1>
        <div className="w-7" />
      </header>

      <div className="max-w-lg mx-auto px-6 py-4 space-y-6">
        {/* Link to existing person */}
        <div className="space-y-3 bg-gray-50 rounded-card p-4">
          <h3 className="text-sm font-semibold text-gray-700">Link to Existing Person</h3>
          <p className="text-xs text-gray-500">Optionally connect this new person to someone already in your tree</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search existing persons..." value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} className="pl-10" id="link-search" />
          </div>
          {linkResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {linkResults.map((p) => (
                <button key={p.id} className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${linkedPersonId === p.id ? 'bg-brand/10 border border-brand/30' : 'hover:bg-gray-100'}`} onClick={() => { setLinkedPersonId(p.id); setLinkSearch(`${p.first_name} ${p.last_name || ''}`); setLinkResults([]); }}>
                  <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="sm" />
                  <span className="text-sm text-gray-900">{p.first_name} {p.last_name || ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <PersonForm
          onSubmit={handleSubmit}
          showRelationship
          relationship={relationship}
          onRelationshipChange={setRelationship}
        />
      </div>
    </div>
  );
}
