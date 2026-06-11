'use client';

import React from 'react';
import Link from 'next/link';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LayoutDashboard } from 'lucide-react';

export function TreeHeader() {
  const { activeTree, persons } = useTree();
  const { selfPersonId } = useAuth();
  
  const selfPerson = selfPersonId ? persons.find(p => p.id === selfPersonId) : null;

  return (
    <header className="fixed top-4 left-4 right-4 z-30 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-lg flex items-center justify-between safe-top">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
          <LayoutDashboard className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-[0.95rem] leading-tight font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{activeTree?.name || 'VamshaVrksha'}</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{persons.length} {persons.length === 1 ? 'member' : 'members'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle compact />
        {selfPerson && (
          <Link href={`/person/${selfPerson.id}`} className="transition-transform hover:scale-105 active:scale-95">
            <Avatar firstName={selfPerson.first_name} lastName={selfPerson.last_name} photoUrl={selfPerson.photo_url} size="sm" generationLevel={3} />
          </Link>
        )}
      </div>
    </header>
  );
}
