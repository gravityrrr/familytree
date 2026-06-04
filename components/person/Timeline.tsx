'use client';

import React from 'react';
import type { FamilyEvent } from '@/types';
import { formatDate } from '@/lib/utils';
import { Heart, Skull, Church, Scale, MapPin, GraduationCap, Shield, Star, Trash2 } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  birth: <Heart className="w-3.5 h-3.5 text-pink-500" />,
  death: <Skull className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />,
  marriage: <Church className="w-3.5 h-3.5 text-purple-500" />,
  divorce: <Scale className="w-3.5 h-3.5 text-orange-500" />,
  moved: <MapPin className="w-3.5 h-3.5 text-blue-500" />,
  graduated: <GraduationCap className="w-3.5 h-3.5 text-green-500" />,
  military: <Shield className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />,
  other: <Star className="w-3.5 h-3.5 text-amber-500" />,
};

const EVENT_COLORS: Record<string, string> = {
  birth: 'bg-pink-50 ring-1 ring-pink-100/50 dark:bg-pink-950/20 dark:ring-pink-900/30',
  death: 'bg-gray-50 ring-1 ring-gray-100/50 dark:bg-gray-900/30 dark:ring-gray-800/30',
  marriage: 'bg-purple-50 ring-1 ring-purple-100/50 dark:bg-purple-950/20 dark:ring-purple-900/30',
  divorce: 'bg-orange-50 ring-1 ring-orange-100/50 dark:bg-orange-950/20 dark:ring-orange-900/30',
  moved: 'bg-blue-50 ring-1 ring-blue-100/50 dark:bg-blue-950/20 dark:ring-blue-900/30',
  graduated: 'bg-green-50 ring-1 ring-green-100/50 dark:bg-green-950/20 dark:ring-green-900/30',
  military: 'bg-gray-50 ring-1 ring-gray-100/50 dark:bg-gray-900/30 dark:ring-gray-800/30',
  other: 'bg-amber-50 ring-1 ring-amber-100/50 dark:bg-amber-950/20 dark:ring-amber-900/30',
};

interface TimelineProps {
  events: FamilyEvent[];
  canEdit?: boolean;
  onDeleteEvent?: (id: string) => Promise<void> | void;
}

export function Timeline({ events, canEdit = false, onDeleteEvent }: TimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] italic px-6">No events recorded yet</p>;
  }

  return (
    <div className="space-y-0 px-6 stagger-fade">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-3.5 group">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${EVENT_COLORS[event.event_type] || EVENT_COLORS.other}`}>
              {EVENT_ICONS[event.event_type] || EVENT_ICONS.other}
            </div>
            {idx < events.length - 1 && (
              <div className="w-px flex-1 bg-gradient-to-b from-[var(--border)] to-transparent my-1" />
            )}
          </div>
          <div className="pb-5 pt-1 flex-1 min-w-0 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{event.title}</p>
              {event.description && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{event.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {event.event_date && (
                  <span className="text-[10px] text-[var(--text-muted)]/70 font-medium">
                    {formatDate(event.event_date)}
                  </span>
                )}
                {event.event_place && (
                  <span className="text-[10px] text-[var(--text-muted)]/70">
                    · {event.event_place}
                  </span>
                )}
              </div>
            </div>

            {canEdit && onDeleteEvent && (
              <button
                onClick={() => onDeleteEvent(event.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-[var(--text-muted)]/60 transition-all press flex-shrink-0"
                title="Delete event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
