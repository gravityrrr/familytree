'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';

interface LocationAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
}

export function LocationAutocomplete({ label, value, onChange, placeholder, id }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastSelectedRef = useRef<string | null>(null);

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
    if (!value || value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (value === lastSelectedRef.current) {
      // User just selected this from the list, don't refetch
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`, {
          headers: {
            'User-Agent': 'FamilyTreeApp/1.0',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        const data = await res.json();
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (placeName: string) => {
    lastSelectedRef.current = placeName;
    onChange(placeName);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    lastSelectedRef.current = null;
    onChange(e.target.value); 
  };

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={value || ''}
          onChange={handleChange}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all placeholder:text-slate-400"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
          </div>
        )}

        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {suggestions.map((s, i) => {
              // Extract the first part as main text and rest as secondary
              const parts = s.display_name.split(', ');
              const mainText = parts[0];
              const subText = parts.slice(1).join(', ');
              
              return (
                <button
                  key={s.place_id || i}
                  type="button"
                  onClick={() => handleSelect(s.display_name)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">{mainText}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">{subText}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
