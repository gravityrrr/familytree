'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonForm } from '@/components/person/PersonForm';
import { PhotoUpload } from '@/components/person/PhotoUpload';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { usePerson } from '@/hooks/usePerson';
import { updatePerson, deletePerson } from '@/lib/db';
import { uploadPhoto, uploadPhotoFromUrl } from '@/lib/storage';
import type { Person } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditPersonPage() {
  return <ProtectedRoute><ToastProvider><EditPersonContent /></ToastProvider></ProtectedRoute>;
}

function EditPersonContent() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;
  const { person, loading, refresh } = usePerson(personId);
  const { showToast } = useToast();
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  if (loading || !person) {
    return <div className="min-h-screen-safe flex items-center justify-center bg-mesh"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>;
  }

  const handleSubmit = async (data: Partial<Person>) => {
    await updatePerson(person.id, data);
    showToast('Changes saved');
    router.push(`/person/${person.id}`);
  };

  const handleDelete = async () => {
    await deletePerson(person.id);
    showToast('Person removed from tree');
    router.push('/tree');
  };

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
    <div className="min-h-screen-safe bg-mesh">
      <header className="sticky-header px-4 sm:px-6 py-3 flex items-center justify-between safe-top">
        <button onClick={() => router.back()} className="p-2 hover:bg-[var(--surface-soft)] rounded-xl transition-colors press">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
        <h1 className="text-sm font-bold text-[var(--text-primary)]">Edit Person</h1>
        <div className="w-9" />
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 animate-fade-in-up">
        <PersonForm initialData={person} onSubmit={handleSubmit} onDelete={handleDelete} isEdit onPhotoUpload={() => setPhotoSheetOpen(true)} />
      </div>

      <PhotoUpload open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} onUpload={handlePhotoUpload} onUrlUpload={handleUrlUpload} currentPhotoUrl={person.photo_url} />
    </div>
  );
}
