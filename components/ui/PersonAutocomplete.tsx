'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Person } from '@/types';

interface PersonAutocompleteProps {
  label?: string;
  value: string;
  onChange: (id: string) => void;
  persons: Person[];
  placeholder?: string;
  excludeId?: string;
}

export function PersonAutocomplete({ label, value, onChange, persons, placeholder = 'Search person...', excludeId }: PersonAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPerson = persons.find(p => p.id === value);

  useEffect(() => {
    if (selectedPerson) {
      setQuery(`${selectedPerson.first_name} ${selectedPerson.last_name || ''}`.trim());
    } else {
      setQuery('');
    }
  }, [value, selectedPerson]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query to selected person if clicking outside
        if (selectedPerson) {
          setQuery(`${selectedPerson.first_name} ${selectedPerson.last_name || ''}`.trim());
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPerson]);

  const filteredPersons = useMemo(() => {
    let filtered = persons;
    if (excludeId) {
      filtered = filtered.filter(p => p.id !== excludeId);
    }
    if (!query) return filtered.slice(0, 50); // limit to 50 when empty
    
    const q = query.toLowerCase();
    return filtered.filter(p => 
      p.first_name.toLowerCase().includes(q) || 
      (p.last_name?.toLowerCase().includes(q)) ||
      (p.nickname?.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [persons, query, excludeId]);

  const handleSelect = (person: Person) => {
    onChange(person.id);
    setQuery(`${person.first_name} ${person.last_name || ''}`.trim());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={wrapperRef}>
      {label && (
        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none z-10" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (value && e.target.value !== `${selectedPerson?.first_name} ${selectedPerson?.last_name || ''}`.trim()) {
              onChange(''); // clear selection if typing changes it
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal shadow-sm"
          autoComplete="off"
        />
        
        {value ? (
          <button 
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
          >
            <span className="text-xs font-bold leading-none select-none">&times;</span>
          </button>
        ) : (
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 py-1">
            {filteredPersons.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No matching persons found
              </div>
            ) : (
              filteredPersons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3"
                >
                  <Avatar firstName={p.first_name} lastName={p.last_name} photoUrl={p.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {p.first_name} {p.last_name || ''} {p.nickname ? `(${p.nickname})` : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {p.birth_year ? `b. ${p.birth_year}` : 'Unknown birth year'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
