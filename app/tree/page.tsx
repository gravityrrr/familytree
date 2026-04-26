'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useTree } from '@/hooks/useTree';
import { useAuth } from '@/hooks/useAuth';
import { searchPersons } from '@/lib/db';
import { debounce } from '@/lib/utils';
import type { Person } from '@/types';
import { Plus, TreePine, Users, Search, Settings, Loader2 } from 'lucide-react';

export default function TreePage() {
  return (
    <ProtectedRoute>
      <TreePageContent />
    </ProtectedRoute>
  );
}

function TreePageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTree, persons, relationships, loading, hasTree } = useTree();
  const [activeTab, setActiveTab] = useState<'tree' | 'people' | 'search' | 'settings'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);

  // Redirect to onboarding if no tree
  React.useEffect(() => {
    if (!loading && !hasTree) {
      router.push('/onboarding');
    }
  }, [loading, hasTree, router]);

  const handleSearch = debounce(async (query: string) => {
    if (!query || !activeTree) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await searchPersons(activeTree.id, query);
      setSearchResults(results);
    } finally { setSearching(false); }
  }, 300);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <TreePine className="w-5 h-5 text-brand" />
          <h1 className="text-lg font-bold text-gray-900">{activeTree?.name || 'Family Tree'}</h1>
        </div>
        <span className="text-xs text-gray-400">{persons.length} members</span>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'tree' && (
          <TreeCanvas persons={persons} relationships={relationships} />
        )}

        {activeTab === 'people' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {persons.map((p) => (
              <button key={p.id} className="w-full flex items-center gap-3 p-3 bg-white rounded-card hover:shadow-sm transition-all border border-gray-100" onClick={() => router.push(`/person/${p.id}`)}>
                <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="md" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.first_name} {p.last_name || ''}</p>
                  <p className="text-xs text-gray-500">{p.birth_place || ''}</p>
                </div>
              </button>
            ))}
            {persons.length === 0 && <p className="text-center text-gray-400 text-sm py-12">No family members yet</p>}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }} id="search-persons" />
            {searching && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-brand animate-spin" /></div>}
            {searchResults.map((p) => (
              <button key={p.id} className="w-full flex items-center gap-3 p-3 bg-white rounded-card hover:shadow-sm transition-all border border-gray-100" onClick={() => router.push(`/person/${p.id}`)}>
                <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="md" />
                <div className="text-left"><p className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name || ''}</p></div>
              </button>
            ))}
            {searchQuery && !searching && searchResults.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No results found</p>}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-4">
            <button onClick={() => router.push('/settings')} className="w-full p-4 bg-white rounded-card border border-gray-100 text-left hover:shadow-sm transition-all">
              <p className="text-sm font-medium text-gray-900">Open Settings</p>
              <p className="text-xs text-gray-500 mt-0.5">Account, security, tree preferences</p>
            </button>
          </div>
        )}
      </main>

      {/* FAB: Add person */}
      <button className="fixed bottom-24 right-4 w-14 h-14 bg-brand text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 transition-all hover:scale-105 z-20 no-print" onClick={() => router.push('/person/new')}>
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom navigation */}
      <nav className="bg-white border-t border-gray-100 flex items-center justify-around py-2 px-4 sticky bottom-0 z-10 no-print">
        {[
          { id: 'tree' as const, icon: TreePine, label: 'Tree' },
          { id: 'people' as const, icon: Users, label: 'People' },
          { id: 'search' as const, icon: Search, label: 'Search' },
          { id: 'settings' as const, icon: Settings, label: 'Settings' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${activeTab === id ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab(id)}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
