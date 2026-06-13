'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TreeHeader } from '@/components/tree/TreeHeader';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { getLifespan } from '@/lib/utils';
import { Users, ChevronRight, Loader2, Plus, Search } from 'lucide-react';

export default function PeoplePage() {
  const router = useRouter();
  const { selfPersonId, canEdit } = useAuth();
  const { persons, loading, hasTree, error } = useTree();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGothra, setSelectedGothra] = useState('');

  const availableGothras = useMemo(() => {
    const gothras = new Set<string>();
    persons.forEach(p => {
      if (p.gothra) gothras.add(p.gothra.trim());
    });
    return Array.from(gothras).sort();
  }, [persons]);

  const filteredPersons = useMemo(() => {
    let result = persons;
    
    if (selectedGothra) {
      result = result.filter(p => p.gothra?.trim() === selectedGothra);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.first_name.toLowerCase().includes(q) || 
        (p.last_name?.toLowerCase().includes(q)) ||
        (p.phone?.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [persons, searchQuery, selectedGothra]);

  useEffect(() => {
    if (!loading && !hasTree && !error) {
      router.replace('/dashboard');
    }
  }, [loading, hasTree, error, router]);

  if (loading || (!hasTree && !error)) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden">
      <TreeHeader />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 pt-24 pb-28">
        <div className="flex gap-2 mb-4">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none" />
            <Input 
              placeholder="Search by name or phone..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" 
              id="search-persons" 
            />
          </div>
          <select
            value={selectedGothra}
            onChange={(e) => setSelectedGothra(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-800 text-[var(--text-primary)] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 max-w-[140px] sm:max-w-[180px] truncate"
          >
            <option value="">All Gothras</option>
            {availableGothras.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        
        {persons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400">No family members yet</p>
            <p className="text-sm text-slate-400/80 mt-1">Tap + to add your first person</p>
          </div>
        )}
        
        {(searchQuery || selectedGothra) && filteredPersons.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Search className="w-10 h-10 text-slate-400/40 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No results found.</p>
          </div>
        )}
        
        <div className="space-y-2 stagger-fade">
          {filteredPersons.map((p) => (
          <Link href={`/person/${p.id}`} key={p.id} className="w-full flex items-center gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
            <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="md" />
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{p.first_name} {p.last_name || ''}</p>
                {p.id === selfPersonId && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 flex-shrink-0">You</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{getLifespan(p) || p.birth_place || 'No details'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </Link>
          ))}
        </div>
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
