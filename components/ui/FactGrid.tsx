'use client';

import React from 'react';

interface FactItem { label: string; value: string | null | undefined; }
interface FactGridProps { facts: FactItem[]; }

export function FactGrid({ facts }: FactGridProps) {
  const visibleFacts = facts.filter((f) => f.value);
  if (visibleFacts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {visibleFacts.map((fact, idx) => (
        <div
          key={fact.label}
          className="bg-surface-200/60 rounded-xl p-3.5 space-y-1 hover:bg-surface-300/60 transition-colors duration-200 animate-fade-in-up"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
            {fact.label}
          </p>
          <p className="text-[13px] font-semibold text-gray-800">{fact.value}</p>
        </div>
      ))}
    </div>
  );
}
