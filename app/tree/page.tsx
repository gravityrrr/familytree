'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useTree } from '@/hooks/useTree';
import { searchPersons } from '@/lib/db';
import { debounce, getLifespan } from '@/lib/utils';
import type { Person } from '@/types';
import { Plus, Users, Search, Settings, Loader2, ChevronRight, Network } from 'lucide-react';

export default function TreePage() {
  return <ProtectedRoute><TreePageContent /></ProtectedRoute>;
}

function TreePageContent() {
  const router = useRouter();
  const { activeTree, persons, relationships, loading, hasTree } = useTree();
  const [activeTab, setActiveTab] = useState<'tree' | 'people' | 'search' | 'settings'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);

  React.useEffect(() => {
    if (!loading && !hasTree) router.push('/onboarding');
  }, [loading, hasTree, router]);

  const handleSearch = debounce(async (query: string) => {
    if (!query || !activeTree) { setSearchResults([]); return; }
    setSearching(true);
    try { const results = await searchPersons(activeTree.id, query); setSearchResults(results); }
    finally { setSearching(false); }
  }, 300);

  if (loading) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading your tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-mesh flex flex-col">
      {/* Header */}
      <header className="sticky-header px-4 sm:px-6 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <BrandLogo size={34} />
          <div>
            <h1 className="font-display text-[1.05rem] leading-tight tracking-tight text-[var(--text-primary)]">{activeTree?.name || 'KinRoot'}</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{persons.length} {persons.length === 1 ? 'member' : 'members'}</p>
          </div>
        </div>
        <ThemeToggle compact />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'tree' && (
          <TreeCanvas persons={persons} relationships={relationships} />
        )}

        {activeTab === 'people' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 stagger-fade">
            {persons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-base font-semibold text-[var(--text-muted)]">No family members yet</p>
                <p className="text-sm text-[var(--text-muted)]/80 mt-1">Tap + to add your first person</p>
              </div>
            )}
            {persons.map((p) => (
              <button key={p.id} className="w-full flex items-center gap-3.5 p-3.5 card rounded-xl hover-lift press" onClick={() => router.push(`/person/${p.id}`)}>
                <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="md" />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.first_name} {p.last_name || ''}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{getLifespan(p) || p.birth_place || 'No details'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]/60 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-brand-500 transition-colors pointer-events-none" />
              <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }} className="pl-11" id="search-persons" />
            </div>
            {searching && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-brand-500 animate-spin" /></div>}
            <div className="space-y-2 stagger-fade">
              {searchResults.map((p) => (
                <button key={p.id} className="w-full flex items-center gap-3.5 p-3.5 card rounded-xl hover-lift press" onClick={() => router.push(`/person/${p.id}`)}>
                  <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="md" />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{p.first_name} {p.last_name || ''}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{p.birth_place || ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]/60 flex-shrink-0" />
                </button>
              ))}
            </div>
            {searchQuery && !searching && searchResults.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <Search className="w-10 h-10 text-[var(--text-muted)]/40 mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">No results for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-4 sm:p-6 animate-fade-in-up">
            <button onClick={() => router.push('/settings')} className="w-full p-5 card rounded-xl hover-lift press text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-soft)] flex items-center justify-center border border-[var(--border)]">
                  <Settings className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Open Settings</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Account, security, tree preferences</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]/60 ml-auto" />
              </div>
            </button>
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        className="fixed bottom-24 right-4 sm:right-6 w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-400 text-white rounded-2xl fab flex items-center justify-center z-20 no-print"
        onClick={() => router.push('/person/new')}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom navigation */}
      <nav className="bottom-nav flex items-center justify-around py-2 px-4 safe-bottom sticky bottom-0 z-30 no-print">
        {[
          { id: 'tree' as const, icon: Network, label: 'Tree' },
          { id: 'people' as const, icon: Users, label: 'People' },
          { id: 'search' as const, icon: Search, label: 'Search' },
          { id: 'settings' as const, icon: Settings, label: 'Settings' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-300 press ${
              activeTab === id
                ? 'text-brand-500 bg-brand-50/80 dark:bg-brand-900/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
