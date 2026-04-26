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
import { Pencil, Network, User, FileEdit, StickyNote, Loader2, ArrowLeft } from 'lucide-react';

export default function PersonPage() {
  return <ProtectedRoute><ToastProvider><PersonPageContent /></ToastProvider></ProtectedRoute>;
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
      <div className="min-h-screen-safe flex items-center justify-center bg-mesh">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const parents = relationships.filter((r) => r.relationship_type === 'parent');
  const children = relationships.filter((r) => r.relationship_type === 'child');
  const spouses = relationships.filter((r) => r.relationship_type === 'spouse');
  const siblings = relationships.filter((r) => r.relationship_type === 'sibling');
  const others = relationships.filter((r) => !['parent', 'child', 'spouse', 'sibling'].includes(r.relationship_type));
  const relationshipTags = [...new Set(relationships.map((r) => relationshipLabel(r.relationship_type)))];

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
    refresh(); showToast('Photo updated');
  };

  const handleUrlUpload = async (url: string) => {
    const publicUrl = await uploadPhotoFromUrl(person.id, url);
    await updatePerson(person.id, { photo_url: publicUrl });
    refresh(); showToast('Photo updated');
  };

  return (
    <div className="min-h-screen-safe bg-white flex flex-col">
      {/* Header */}
      <header className="sticky-header px-4 sm:px-6 py-3 flex items-center justify-between safe-top">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors press">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-sm font-bold text-gray-900">Profile</h1>
        <button onClick={() => router.push(`/person/${person.id}/edit`)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors press">
          <Pencil className="w-4.5 h-4.5 text-gray-600" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <PersonCard person={person} relationshipTags={relationshipTags} onAvatarClick={() => setPhotoSheetOpen(true)} />

        {/* Relationships */}
        <div className="space-y-5 py-5">
          {parents.length > 0 && <RelationRow title="Parents" relationships={parents} onAdd={() => router.push('/person/new')} />}
          {(spouses.length > 0 || children.length > 0) && (
            <RelationRow title="Spouse & Children" relationships={[...spouses, ...children]} onAdd={() => router.push('/person/new')} />
          )}
          {siblings.length > 0 && <RelationRow title="Siblings" relationships={siblings} onAdd={() => router.push('/person/new')} />}
          {others.length > 0 && <RelationRow title="Other Relations" relationships={others} />}
          {relationships.length === 0 && <RelationRow title="Relationships" relationships={[]} onAdd={() => router.push('/person/new')} />}
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-gray-100" />

        {/* Facts */}
        <div className="px-6 py-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Life Facts</h3>
          <FactGrid facts={facts} />
        </div>

        {/* Bio */}
        {person.bio && (
          <>
            <div className="mx-6 border-t border-gray-100" />
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Biography</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{person.bio}</p>
            </div>
          </>
        )}

        {/* Timeline */}
        <div className="mx-6 border-t border-gray-100" />
        <div className="py-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-6 mb-3">Timeline</h3>
          <Timeline events={events} />
        </div>
      </main>

      <PhotoUpload open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} onUpload={handlePhotoUpload} onUrlUpload={handleUrlUpload} currentPhotoUrl={person.photo_url} />

      {/* Floating Bottom Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 safe-bottom no-print">
        <nav className="flex items-center justify-around p-1.5 rounded-full bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] shadow-glass-lg shadow-brand-500/10">
          {[
            { id: 'tree' as const, icon: Network, label: 'Tree', action: () => router.push('/tree') },
            { id: 'profile' as const, icon: User, label: 'Profile', action: () => setActiveTab('profile') },
            { id: 'edit' as const, icon: FileEdit, label: 'Edit', action: () => router.push(`/person/${person.id}/edit`) },
            { id: 'notes' as const, icon: StickyNote, label: 'Notes', action: () => setActiveTab('notes') },
          ].map(({ id, icon: Icon, label, action }) => (
            <button
              key={id}
              className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 press ${
                activeTab === id
                  ? 'text-brand-500'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={action}
            >
              {activeTab === id && (
                <div className="absolute inset-0 bg-brand-50/80 dark:bg-brand-500/15 rounded-full -z-10 animate-scale-in" />
              )}
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wide">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
