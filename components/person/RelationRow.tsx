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
      <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-6">{title}</h3>
      <div className="flex gap-2.5 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {relationships.map((rel) => {
          const person = rel.related_person;
          if (!person) return null;
          return (
            <button
              key={rel.id}
              className="flex flex-col items-center gap-1.5 min-w-[80px] p-2.5 rounded-xl hover:bg-[var(--surface-soft)] border border-transparent hover:border-[var(--border)] transition-all duration-200 press group"
              onClick={() => router.push(`/person/${person.id}`)}
            >
              <div className="transition-transform duration-200 group-hover:scale-105">
                <Avatar firstName={person.first_name} lastName={person.last_name} photoUrl={person.photo_url} size="md" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate max-w-[80px]">{person.first_name}</span>
              <span className="text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wide">
                {rel.custom_label || relationshipLabel(rel.relationship_type)}
              </span>
            </button>
          );
        })}

        {onAdd && (
          <button 
            className="flex flex-col items-center gap-1.5 min-w-[80px] p-2.5 rounded-xl hover:bg-[var(--surface-soft)] border border-transparent hover:border-[var(--border)] transition-all duration-200 press" 
            onClick={onAdd}
            title={`Add new ${title.toLowerCase()}`}
          >
            <div className="w-11 h-11 rounded-full bg-[var(--surface-soft)] flex items-center justify-center border-2 border-dashed border-[var(--border)] transition-colors hover:border-brand-500/50 hover:bg-brand-50/10 dark:hover:bg-brand-500/10">
              <Plus className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">Add</span>
          </button>
        )}

        {relationships.length === 0 && !onAdd && (
          <p className="text-sm text-[var(--text-muted)] italic pl-1">None added yet</p>
        )}
      </div>
    </div>
  );
}
