'use client';

import React from 'react';

interface FactItem {
  label: string;
  value: string | null | undefined;
}

interface FactGridProps {
  facts: FactItem[];
}

/**
 * 2-column grid displaying life facts (Born, Birthplace, Married, etc.)
 */
export function FactGrid({ facts }: FactGridProps) {
  // Only show facts that have a value
  const visibleFacts = facts.filter((f) => f.value);

  if (visibleFacts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {visibleFacts.map((fact) => (
        <div
          key={fact.label}
          className="bg-gray-50 rounded-card p-3 space-y-0.5"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {fact.label}
          </p>
          <p className="text-sm font-medium text-gray-900">{fact.value}</p>
        </div>
      ))}
    </div>
  );
}
