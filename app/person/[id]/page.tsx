'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonCard } from '@/components/person/PersonCard';
import { RelationRow } from '@/components/person/RelationRow';
import { Timeline } from '@/components/person/Timeline';
import { PhotoUpload } from '@/components/person/PhotoUpload';
import { EventFormSheet } from '@/components/person/EventFormSheet';
import { RelationshipManagerSheet } from '@/components/person/RelationshipManagerSheet';
import { AddRelationshipSheet } from '@/components/person/AddRelationshipSheet';
import { FactGrid } from '@/components/ui/FactGrid';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { usePerson } from '@/hooks/usePerson';
import { useAuth } from '@/hooks/useAuth';
import { updatePerson, createEvent, deleteEvent, deleteBidirectionalRelationship, createBidirectionalRelationship, getPersonsInTree, getRelationshipsInTree } from '@/lib/db';
import { uploadPhoto, uploadPhotoFromUrl } from '@/lib/storage';
import { formatDate, calculateAge, relationshipLabel } from '@/lib/utils';
import { inferTeluguRelationship } from '@/lib/relationships';
import { Pencil, Network, User, FileEdit, StickyNote, Loader2, ArrowLeft, PlusCircle } from 'lucide-react';
import type { EventType, Person, Relationship } from '@/types';

export default function PersonPage() {
  return <ProtectedRoute><ToastProvider><PersonPageContent /></ToastProvider></ProtectedRoute>;
}

function PersonPageContent() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;
  const { person, relationships, events, loading, refresh } = usePerson(personId);
  const { canEdit } = useAuth();
  const { showToast } = useToast();

  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const [relationSheetOpen, setRelationSheetOpen] = useState(false);
  const [addRelationSheetOpen, setAddRelationSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'notes'>('profile');

  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [allRelationships, setAllRelationships] = useState<Relationship[]>([]);

  React.useEffect(() => {
    if (person?.tree_id) {
      getPersonsInTree(person.tree_id).then(setAllPersons).catch(console.error);
      getRelationshipsInTree(person.tree_id).then(setAllRelationships).catch(console.error);
    }
  }, [person?.tree_id, relationships]); // re-fetch if relationships change

  const enrichedRelationships = React.useMemo(() => {
    if (!person || allPersons.length === 0 || allRelationships.length === 0) return relationships;
    return relationships.map(rel => {
      if (rel.related_person) {
        const inference = inferTeluguRelationship(person, rel.related_person, allPersons, allRelationships);
        if (inference && inference.label) {
          return { ...rel, custom_label: inference.label };
        }
      }
      return rel;
    });
  }, [person, relationships, allPersons, allRelationships]);

  if (loading || !person) {
    return (
      <div className="min-h-screen-safe bg-[var(--bg)] flex flex-col">
        <header className="sticky-header px-4 sm:px-6 py-3 flex items-center justify-between safe-top">
          <div className="w-9 h-9 rounded-xl bg-[var(--surface-soft)] animate-pulse" />
          <div className="w-16 h-5 rounded bg-[var(--surface-soft)] animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-[var(--surface-soft)] animate-pulse" />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </main>
      </div>
    );
  }

  const parents = enrichedRelationships.filter((r) => r.relationship_type === 'parent');
  const children = enrichedRelationships.filter((r) => r.relationship_type === 'child');
  const spouses = enrichedRelationships.filter((r) => r.relationship_type === 'spouse');
  const siblings = enrichedRelationships.filter((r) => r.relationship_type === 'sibling');
  const others = enrichedRelationships.filter((r) => !['parent', 'child', 'spouse', 'sibling'].includes(r.relationship_type));
  const relationshipTags = [...new Set(enrichedRelationships.map((r) => r.custom_label || relationshipLabel(r.relationship_type)))];

  const facts = [
    { label: 'Born', value: formatDate(person.birth_date) || (person.birth_year ? `~${person.birth_year}` : null) },
    { label: 'Birthplace', value: person.birth_place },
    { label: 'Age', value: person.birth_date ? `${calculateAge(person.birth_date, person.death_date)} years` : null },
    { label: 'Status', value: person.is_living ? 'Living' : 'Deceased' },
    { label: 'Passed', value: formatDate(person.death_date) },
    { label: 'Death Place', value: person.death_place },
  ];

  const handlePhotoUpload = async (file: File) => {
    if (!canEdit) return;
    try {
      const url = await uploadPhoto(person.id, file);
      await updatePerson(person.id, { photo_url: url });
      refresh();
      showToast('Photo updated');
    } catch {
      showToast('Failed to upload photo', 'error');
    }
  };

  const handleUrlUpload = async (url: string) => {
    if (!canEdit) return;
    try {
      const publicUrl = await uploadPhotoFromUrl(person.id, url);
      await updatePerson(person.id, { photo_url: publicUrl });
      refresh();
      showToast('Photo updated');
    } catch {
      showToast('Failed to load image from URL', 'error');
    }
  };

  const handleAddEvent = async (eventData: {
    title: string;
    event_type: EventType;
    event_date: string | null;
    event_year: number | null;
    event_place: string | null;
    description: string | null;
  }) => {
    if (!canEdit) return;
    try {
      await createEvent({
        ...eventData,
        person_id: person.id,
      });
      refresh();
      showToast('Event added to timeline');
    } catch {
      showToast('Failed to add event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!canEdit) return;
    try {
      await deleteEvent(eventId);
      refresh();
      showToast('Event removed');
    } catch {
      showToast('Failed to delete event', 'error');
    }
  };

  const handleDeleteRelationship = async (relatedPersonId: string) => {
    if (!canEdit) return;
    try {
      await deleteBidirectionalRelationship(person.id, relatedPersonId);
      refresh();
      showToast('Connection removed');
    } catch {
      showToast('Failed to remove relationship', 'error');
    }
  };

  const handleAddExistingRelation = async (relatedPersonId: string, type: any) => {
    if (!canEdit) return;
    try {
      await createBidirectionalRelationship({
        tree_id: person.tree_id,
        person_id: person.id,
        related_person_id: relatedPersonId,
        relationship_type: type,
      });
      refresh();
      showToast('Relationship added');
    } catch {
      showToast('Failed to add relationship', 'error');
    }
  };

  const navItems = [
    { id: 'tree' as const, icon: Network, label: 'Tree', href: '/tree' },
    { id: 'profile' as const, icon: User, label: 'Profile', action: () => setActiveTab('profile') },
    ...(canEdit ? [{ id: 'edit' as const, icon: FileEdit, label: 'Edit', href: `/person/${person.id}/edit` }] : []),
    { id: 'notes' as const, icon: StickyNote, label: 'Notes', action: () => setActiveTab('notes') },
  ];

  return (
    <div className="min-h-screen-safe bg-[var(--bg)] flex flex-col">
      {/* Header */}
      <header className="sticky-header px-4 sm:px-6 py-3 flex items-center justify-between safe-top">
        <Link href="/tree" className="p-2 hover:bg-[var(--surface-soft)] rounded-xl transition-colors press">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <h1 className="text-sm font-bold text-[var(--text-primary)]">Profile</h1>
        {canEdit ? (
          <Link href={`/person/${person.id}/edit`} className="p-2 hover:bg-[var(--surface-soft)] rounded-xl transition-colors press">
            <Pencil className="w-4.5 h-4.5 text-[var(--text-muted)]" />
          </Link>
        ) : (
          <div className="w-8.5" />
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24 max-w-lg mx-auto w-full">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm mt-4 overflow-hidden mx-4">
          <PersonCard 
            person={person} 
            relationshipTags={relationshipTags} 
            onAvatarClick={canEdit ? () => setPhotoSheetOpen(true) : undefined} 
          />

          {/* Relationships Header */}
          <div className="px-6 pt-5 pb-1 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Relationships</h3>
            {canEdit && relationships.length > 0 && (
              <button
                onClick={() => setRelationSheetOpen(true)}
                className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors flex items-center gap-1 press"
              >
                Manage
              </button>
            )}
          </div>

          {/* Relationships Rows */}
          <div className="space-y-4 pb-5">
            {parents.length > 0 && (
              <RelationRow 
                title="Parents" 
                relationships={parents} 
                onAdd={canEdit ? () => setAddRelationSheetOpen(true) : undefined} 
              />
            )}
            {(spouses.length > 0 || children.length > 0) && (
              <RelationRow 
                title="Spouse & Children" 
                relationships={[...spouses, ...children]} 
                onAdd={canEdit ? () => setAddRelationSheetOpen(true) : undefined} 
              />
            )}
            {siblings.length > 0 && (
              <RelationRow 
                title="Siblings" 
                relationships={siblings} 
                onAdd={canEdit ? () => setAddRelationSheetOpen(true) : undefined} 
              />
            )}
            {others.length > 0 && <RelationRow title="Other Relations" relationships={others} />}
            {relationships.length === 0 && (
              <RelationRow 
                title="Connections" 
                relationships={[]} 
                onAdd={canEdit ? () => setAddRelationSheetOpen(true) : undefined} 
              />
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 border-t border-[var(--border)]" />

          {/* Facts */}
          <div className="px-6 py-5">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Life Facts</h3>
            <FactGrid facts={facts} />
          </div>

          {/* Bio */}
          {person.bio && (
            <>
              <div className="mx-6 border-t border-[var(--border)]" />
              <div className="px-6 py-5">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">Biography</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{person.bio}</p>
              </div>
            </>
          )}

          {/* Timeline Header */}
          <div className="mx-6 border-t border-[var(--border)]" />
          <div className="px-6 pt-5 pb-2 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Timeline</h3>
            {canEdit && (
              <button
                onClick={() => setEventSheetOpen(true)}
                className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors flex items-center gap-1.5 press"
              >
                <PlusCircle className="w-4 h-4" /> Add Event
              </button>
            )}
          </div>

          {/* Timeline List */}
          <div className="pb-5">
            <Timeline 
              events={events} 
              canEdit={canEdit} 
              onDeleteEvent={handleDeleteEvent} 
            />
          </div>
        </div>
      </main>

      {/* Sheets / Drawers */}
      <PhotoUpload 
        open={photoSheetOpen} 
        onClose={() => setPhotoSheetOpen(false)} 
        onUpload={handlePhotoUpload} 
        onUrlUpload={handleUrlUpload} 
        currentPhotoUrl={person.photo_url} 
      />

      <EventFormSheet 
        open={eventSheetOpen} 
        onClose={() => setEventSheetOpen(false)} 
        onSubmit={handleAddEvent} 
      />

      <RelationshipManagerSheet 
        open={relationSheetOpen} 
        onClose={() => setRelationSheetOpen(false)} 
        relationships={relationships} 
        onDeleteRelationship={handleDeleteRelationship} 
      />

      <AddRelationshipSheet
        open={addRelationSheetOpen}
        onClose={() => setAddRelationSheetOpen(false)}
        person={person}
        onSubmitExisting={handleAddExistingRelation}
      />

      {/* Floating Bottom Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 safe-bottom no-print">
        <nav className="flex items-center justify-around p-1.5 rounded-full bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] shadow-glass-lg shadow-brand-500/10">
          {navItems.map((item) => {
            const { id, icon: Icon, label, action, href } = item;
            const activeClass = activeTab === id ? 'text-brand-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]';
            const sharedClass = `relative flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 press ${activeClass}`;

            const content = (
              <>
                {activeTab === id && (
                  <div className="absolute inset-0 bg-brand-50/80 dark:bg-brand-500/15 rounded-full -z-10 animate-scale-in" />
                )}
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-semibold tracking-wide">{label}</span>
              </>
            );

            if (href) {
              return (
                <Link key={id} href={href} className={sharedClass}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={id} onClick={action} className={sharedClass}>
                {content}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
