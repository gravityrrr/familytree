'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
import { searchGothras, createGothra } from '@/lib/db';
import type { Gothra } from '@/types';

interface GothraAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
}

export function GothraAutocomplete({ label, value, onChange, placeholder, id }: GothraAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Gothra[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2 || query === value) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchGothras(query);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        console.error('Error fetching gothras:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (gothraName: string) => {
    setQuery(gothraName);
    onChange(gothraName);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleCreateNew = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const newGothra = await createGothra(query);
      handleSelect(newGothra.name);
    } catch (err) {
      console.error('Failed to create Gothra:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
  };

  // Check if exact match exists in suggestions to hide the "Create new" button
  const exactMatchExists = suggestions.some(s => s.name.toLowerCase() === query.toLowerCase());

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </label>
      )}
      <div className="relative">
        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all placeholder:text-slate-400"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
          </div>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s.name)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
              </button>
            ))}
            
            {!exactMatchExists && query.length >= 2 && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full text-left px-4 py-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/10 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 transition-colors border-t border-slate-100 dark:border-slate-800 flex items-center gap-3"
              >
                <div className="w-4 h-4 rounded-full bg-brand-200 dark:bg-brand-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold">+</span>
                </div>
                <span className="text-sm font-medium">Create new Gothra: "{query}"</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
