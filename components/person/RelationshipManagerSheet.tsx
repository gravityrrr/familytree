'use client';

import React, { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { relationshipLabel } from '@/lib/utils';
import { Trash2, Loader2, Link } from 'lucide-react';
import type { Relationship } from '@/types';

interface RelationshipManagerSheetProps {
  open: boolean;
  onClose: () => void;
  relationships: Relationship[];
  onDeleteRelationship: (relatedPersonId: string) => Promise<void>;
}

export function RelationshipManagerSheet({
  open,
  onClose,
  relationships,
  onDeleteRelationship,
}: RelationshipManagerSheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (relatedPersonId: string) => {
    setDeletingId(relatedPersonId);
    try {
      await onDeleteRelationship(relatedPersonId);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Manage Connections">
      <div className="space-y-4">
        <p className="text-xs text-[var(--text-muted)]">
          Manage family relationships for this person. Removing a connection will delete the link in both directions.
        </p>

        {relationships.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center">
            <Link className="w-6 h-6 text-[var(--text-muted)]/40 mb-2" />
            <p className="text-sm font-medium text-[var(--text-muted)]">No connections established yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto pr-1">
            {relationships.map((rel) => {
              const person = rel.related_person;
              if (!person) return null;
              const isDeleting = deletingId === person.id;

              return (
                <div key={rel.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      firstName={person.first_name}
                      lastName={person.last_name}
                      photoUrl={person.photo_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {person.first_name} {person.last_name || ''}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                        {relationshipLabel(rel.relationship_type)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(person.id)}
                    disabled={isDeleting}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors press"
                    title="Remove connection"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
