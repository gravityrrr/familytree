'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonCard } from '@/components/person/PersonCard';
import { RelationRow } from '@/components/person/RelationRow';
import { Timeline } from '@/components/person/Timeline';
import { PhotoUpload } from '@/components/person/PhotoUpload';
import { FactGrid } from '@/components/ui/FactGrid';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { usePerson } from '@/hooks/usePerson';
import { updatePerson } from '@/lib/db';
import { uploadPhoto, uploadPhotoFromUrl } from '@/lib/storage';
import { formatDate, calculateAge, relationshipLabel } from '@/lib/utils';
import { Pencil, TreePine, User, FileEdit, StickyNote, Loader2, ArrowLeft } from 'lucide-react';

export default function PersonPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <PersonPageContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}

function PersonPageContent() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;
  const { person, relationships, events, loading, refresh } = usePerson(personId);
  const { showToast } = useToast();
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'notes'>('profile');

  if (loading || !person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  // Group relationships by type
  const parents = relationships.filter((r) => r.relationship_type === 'parent');
  const children = relationships.filter((r) => r.relationship_type === 'child');
  const spouses = relationships.filter((r) => r.relationship_type === 'spouse');
  const siblings = relationships.filter((r) => r.relationship_type === 'sibling');
  const others = relationships.filter((r) => !['parent', 'child', 'spouse', 'sibling'].includes(r.relationship_type));

  const relationshipTags = relationships.map((r) => relationshipLabel(r.relationship_type));

  // Build facts
  const facts = [
    { label: 'Born', value: formatDate(person.birth_date) || (person.birth_year ? `~${person.birth_year}` : null) },
    { label: 'Birthplace', value: person.birth_place },
    { label: 'Age', value: person.birth_date ? `${calculateAge(person.birth_date, person.death_date)} years` : null },
    { label: 'Status', value: person.is_living ? 'Living' : 'Deceased' },
    { label: 'Passed', value: formatDate(person.death_date) },
    { label: 'Death Place', value: person.death_place },
  ];

  const handlePhotoUpload = async (file: File) => {
    const url = await uploadPhoto(person.id, file);
    await updatePerson(person.id, { photo_url: url });
    refresh();
    showToast('Photo updated');
  };

  const handleUrlUpload = async (url: string) => {
    const publicUrl = await uploadPhotoFromUrl(person.id, url);
    await updatePerson(person.id, { photo_url: publicUrl });
    refresh();
    showToast('Photo updated');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <h1 className="text-base font-semibold text-gray-900">Profile</h1>
        <button onClick={() => router.push(`/person/${person.id}/edit`)} className="p-1 hover:bg-gray-100 rounded-full"><Pencil className="w-5 h-5 text-gray-600" /></button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Hero card */}
        <PersonCard person={person} relationshipTags={[...new Set(relationshipTags)]} onAvatarClick={() => setPhotoSheetOpen(true)} />

        {/* Relationship rows */}
        <div className="space-y-4 py-4">
          {parents.length > 0 && <RelationRow title="Parents" relationships={parents} onAdd={() => router.push('/person/new')} />}
          {(spouses.length > 0 || children.length > 0) && (
            <RelationRow title="Spouse & Children" relationships={[...spouses, ...children]} onAdd={() => router.push('/person/new')} />
          )}
          {siblings.length > 0 && <RelationRow title="Siblings" relationships={siblings} onAdd={() => router.push('/person/new')} />}
          {others.length > 0 && <RelationRow title="Other Relations" relationships={others} />}
          {relationships.length === 0 && (
            <RelationRow title="Relationships" relationships={[]} onAdd={() => router.push('/person/new')} />
          )}
        </div>

        {/* Facts grid */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Life Facts</h3>
          <FactGrid facts={facts} />
        </div>

        {/* Bio */}
        {person.bio && (
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Biography</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{person.bio}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="py-4">
          <h3 className="text-sm font-semibold text-gray-900 px-6 mb-3">Timeline</h3>
          <Timeline events={events} />
        </div>
      </main>

      {/* Photo upload sheet */}
      <PhotoUpload open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} onUpload={handlePhotoUpload} onUrlUpload={handleUrlUpload} currentPhotoUrl={person.photo_url} />

      {/* Bottom nav */}
      <nav className="bg-white border-t border-gray-100 flex items-center justify-around py-2 px-4 sticky bottom-0 z-10">
        {[
          { id: 'tree' as const, icon: TreePine, label: 'Tree', action: () => router.push('/tree') },
          { id: 'profile' as const, icon: User, label: 'Profile', action: () => setActiveTab('profile') },
          { id: 'edit' as const, icon: FileEdit, label: 'Edit', action: () => router.push(`/person/${person.id}/edit`) },
          { id: 'notes' as const, icon: StickyNote, label: 'Notes', action: () => setActiveTab('notes') },
        ].map(({ id, icon: Icon, label, action }) => (
          <button key={id} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${activeTab === id ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`} onClick={action}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
