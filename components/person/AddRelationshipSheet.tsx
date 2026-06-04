'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { searchPersons, getPersonsInTree, getRelationshipsInTree } from '@/lib/db';
import { inferTeluguRelationship } from '@/lib/relationships';
import type { Person, RelationshipType, Relationship } from '@/types';
import { Search, UserPlus, Link2, Loader2, Sparkles } from 'lucide-react';

interface AddRelationshipSheetProps {
  open: boolean;
  onClose: () => void;
  person: Person;
  onSubmitExisting: (relatedPersonId: string, type: RelationshipType) => Promise<void>;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'niece_nephew', label: 'Niece/Nephew' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'other', label: 'Other' },
];

export function AddRelationshipSheet({ open, onClose, person, onSubmitExisting }: AddRelationshipSheetProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'existing'>('select');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('parent');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [allRelationships, setAllRelationships] = useState<Relationship[]>([]);
  const [suggestedLabel, setSuggestedLabel] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setMode('select');
      setRelationshipType('parent');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPersonId(null);
      setSubmitting(false);
      setSuggestedLabel(null);

      // Fetch full graph for relationship inference
      getPersonsInTree(person.tree_id).then(setAllPersons).catch(console.error);
      getRelationshipsInTree(person.tree_id).then(setAllRelationships).catch(console.error);
    }
  }, [open, person.tree_id]);

  // Debounced search
  useEffect(() => {
    if (mode !== 'existing' || !searchQuery) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPersons(person.tree_id, searchQuery);
        // Exclude self and already selected
        setSearchResults(results.filter(p => p.id !== person.id));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, mode, person.tree_id, person.id]);

  // Infer relationship when person is selected
  useEffect(() => {
    if (selectedPersonId && allPersons.length > 0 && allRelationships.length > 0) {
      const targetPerson = allPersons.find(p => p.id === selectedPersonId);
      if (targetPerson) {
        const inference = inferTeluguRelationship(person, targetPerson, allPersons, allRelationships);
        if (inference) {
          setRelationshipType(inference.type);
          setSuggestedLabel(inference.label);
        } else {
          setSuggestedLabel(null);
        }
      }
    } else {
      setSuggestedLabel(null);
    }
  }, [selectedPersonId, allPersons, allRelationships, person]);

  const handleCreateNew = () => {
    onClose();
    router.push(`/person/new?relatedTo=${person.id}&type=${relationshipType}`);
  };

  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    setSubmitting(true);
    try {
      await onSubmitExisting(selectedPersonId, relationshipType);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Add Relation to ${person.first_name}`}>
      {mode === 'select' ? (
        <div className="space-y-6">
          <Select
            label="What is this person's relationship to you?"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
            options={RELATIONSHIP_OPTIONS}
            id="rel-type-select"
          />

          <div className="pt-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Is this person already in the tree?</p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setMode('existing')}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Yes, link existing person</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Connect to someone you already added</p>
                </div>
              </button>

              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">No, create new person</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add a brand new person to the tree</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitExisting} className="space-y-5 flex flex-col h-full min-h-[60vh]">
          <div>
            <button 
              type="button" 
              onClick={() => setMode('select')}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 mb-4 inline-flex items-center gap-1"
            >
              &larr; Back
            </button>
            
            <Select
              label="Relationship"
              value={relationshipType}
              onChange={(e) => {
                setRelationshipType(e.target.value as RelationshipType);
                setSuggestedLabel(null); // Clear suggestion on manual override
              }}
              options={RELATIONSHIP_OPTIONS}
              id="rel-type-select-existing"
            />
            
            {suggestedLabel && (
              <div className="mt-2.5 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-lg animate-in slide-in-from-top-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-medium">
                  Suggested: <strong className="font-bold">{suggestedLabel}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="relative group mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input 
                placeholder="Search by name..." 
                value={searchQuery} 
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedPersonId(null);
                }} 
                className="pl-10" 
                id="link-search" 
              />
            </div>
            
            {searching && <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>}
            
            {!searching && searchResults.length > 0 && (
              <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
                {searchResults.map((p) => (
                  <button 
                    key={p.id} 
                    type="button"
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      selectedPersonId === p.id 
                        ? 'bg-brand-50 border-brand-200 dark:bg-brand-500/20 border dark:border-brand-500/50' 
                        : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800/50'
                    }`} 
                    onClick={() => setSelectedPersonId(p.id)}
                  >
                    <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="sm" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {p.first_name} {p.last_name || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">No matching persons found in this tree.</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setMode('select')}>Cancel</Button>
            <Button type="submit" loading={submitting} disabled={!selectedPersonId} className="flex-1">Link Person</Button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
