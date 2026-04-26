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

export function RelationRow({ title, relationships, onAdd }: RelationRowProps) {
  const router = useRouter();

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-6">{title}</h3>
      <div className="flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {relationships.map((rel) => {
          const person = rel.related_person;
          if (!person) return null;
          return (
            <button key={rel.id} className="flex flex-col items-center gap-1.5 min-w-[76px] p-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 press group" onClick={() => router.push(`/person/${person.id}`)}>
              <div className="transition-transform duration-200 group-hover:scale-105">
                <Avatar firstName={person.first_name} lastName={person.last_name} photoUrl={person.photo_url} size="md" />
              </div>
              <span className="text-[11px] font-semibold text-gray-800 truncate max-w-[76px]">{person.first_name}</span>
              <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">{relationshipLabel(rel.relationship_type)}</span>
            </button>
          );
        })}

        {onAdd && (
          <button className="flex flex-col items-center gap-1.5 min-w-[76px] p-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 press" onClick={onAdd}>
            <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-[11px] font-semibold text-gray-400">Add</span>
          </button>
        )}

        {relationships.length === 0 && !onAdd && (
          <p className="text-sm text-gray-300 italic pl-1">None added yet</p>
        )}
      </div>
    </div>
  );
}
