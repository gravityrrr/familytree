'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PersonForm } from '@/components/person/PersonForm';
import { PhotoUpload } from '@/components/person/PhotoUpload';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { usePerson } from '@/hooks/usePerson';
import { useAuth } from '@/hooks/useAuth';
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
  const { person, loading: personLoading, refresh } = usePerson(personId);
  const { canEdit, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !canEdit) {
      router.replace('/tree');
    }
  }, [canEdit, authLoading, router]);

  if (authLoading || personLoading || !person) {
    return (
      <div className="min-h-screen-safe bg-slate-50 dark:bg-slate-950 flex flex-col">
        <header className="sticky-header border-b-2 border-slate-200 dark:border-slate-800 safe-top">
          <div className="px-6 sm:px-8 py-3 flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="w-24 h-5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="w-9 h-9" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </main>
      </div>
    );
  }

  const handleSubmit = async (data: Partial<Person>) => {
    if (!canEdit) return;
    await updatePerson(person.id, data);
    showToast('Changes saved');
    router.push(`/person/${person.id}`);
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    await deletePerson(person.id);
    showToast('Person removed from tree');
    router.push('/tree');
  };

  const handlePhotoUpload = async (file: File) => {
    if (!canEdit) return;
    const url = await uploadPhoto(person.id, file);
    await updatePerson(person.id, { photo_url: url });
    refresh(); showToast('Photo updated');
  };

  const handleUrlUpload = async (url: string) => {
    if (!canEdit) return;
    const publicUrl = await uploadPhotoFromUrl(person.id, url);
    await updatePerson(person.id, { photo_url: publicUrl });
    refresh(); showToast('Photo updated');
  };

  return (
    <div className="min-h-screen-safe bg-slate-50 dark:bg-slate-950">
      <header className="sticky-header border-b-2 border-slate-200 dark:border-slate-800 safe-top">
        <div className="px-6 sm:px-8 py-3 flex items-center justify-between">
          <Link href={`/person/${person.id}`} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors press">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Person</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 animate-fade-in-up pt-6 pb-12">
        <PersonForm initialData={person} onSubmit={handleSubmit} onDelete={handleDelete} isEdit onPhotoUpload={() => setPhotoSheetOpen(true)} />
      </div>

      <PhotoUpload open={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} onUpload={handlePhotoUpload} onUrlUpload={handleUrlUpload} currentPhotoUrl={person.photo_url} />
    </div>
  );
}
