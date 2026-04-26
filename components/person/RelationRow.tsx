'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Relationship } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { relationshipLabel } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface RelationRowProps {
  title: string;
  relationships: Relationship[];
  onAdd?: () => void;
}

/**
 * Horizontal scrollable row of relation chips.
 * Each chip shows avatar + name + role, tappable to navigate.
 * Ends with an "+ Add" chip.
 */
export function RelationRow({ title, relationships, onAdd }: RelationRowProps) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 px-6">{title}</h3>
      <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {relationships.map((rel) => {
          const person = rel.related_person;
          if (!person) return null;
          return (
            <button
              key={rel.id}
              className="flex flex-col items-center gap-1.5 min-w-[72px] p-2 rounded-card hover:bg-gray-50 transition-colors"
              onClick={() => router.push(`/person/${person.id}`)}
            >
              <Avatar
                firstName={person.first_name}
                lastName={person.last_name}
                photoUrl={person.photo_url}
                size="md"
              />
              <span className="text-xs font-medium text-gray-900 truncate max-w-[72px]">
                {person.first_name}
              </span>
              <span className="text-[10px] text-gray-500">
                {relationshipLabel(rel.relationship_type)}
              </span>
            </button>
          );
        })}

        {/* Add chip */}
        {onAdd && (
          <button
            className="flex flex-col items-center gap-1.5 min-w-[72px] p-2 rounded-card hover:bg-gray-50 transition-colors"
            onClick={onAdd}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xs font-medium text-gray-500">Add</span>
          </button>
        )}

        {relationships.length === 0 && !onAdd && (
          <p className="text-sm text-gray-400 italic">None added yet</p>
        )}
      </div>
    </div>
  );
}
