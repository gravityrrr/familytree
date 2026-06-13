'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { TreeHeader } from '@/components/tree/TreeHeader';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { getLifespan } from '@/lib/utils';
import { createBidirectionalRelationship } from '@/lib/db';
import { Loader2, Plus } from 'lucide-react';

export default function TreePage() {
  return <TreePageContent />;
}

function TreePageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const treeId = searchParams.get('id');
  const { selfPersonId, canEdit } = useAuth();
  const { activeTree, persons, relationships, loading, hasTree, error, refresh } = useTree(treeId);

  // Find self person for display
  const selfPerson = selfPersonId ? persons.find(p => p.id === selfPersonId) : null;

  useEffect(() => {
    if (!loading && !hasTree && !error) {
      router.replace('/dashboard');
    }
  }, [loading, hasTree, error, router]);

  const handleAddRelationship = async (sourceId: string, targetId: string, type: string) => {
    if (!canEdit || !activeTree) return;
    try {
      await createBidirectionalRelationship({
        tree_id: activeTree.id,
        person_id: sourceId,
        related_person_id: targetId,
        relationship_type: type as any,
      });
      refresh();
      showToast('Relationship added successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to add relationship', 'error');
    }
  };



  if (loading || (!hasTree && !error)) {
    return (
      <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
        <header className="absolute top-0 left-0 right-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b-2 border-slate-200 dark:border-slate-800 shadow-sm safe-top">
          <div className="px-6 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div>
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-1" />
              <div className="h-2 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
          <p className="text-sm text-[var(--text-muted)] font-medium">Loading your tree...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden">
      <TreeHeader />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TreeCanvas 
          persons={persons} 
          relationships={relationships} 
          selfPersonId={selfPersonId} 
          onAddRelationship={handleAddRelationship} 
        />
      </main>

      {/* Floating FAB */}
      {canEdit && (
        <Link
          href="/person/new"
          className="fixed bottom-24 right-4 sm:right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl flex items-center justify-center z-40 no-print shadow-xl shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
