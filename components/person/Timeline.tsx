'use client';

import React from 'react';
import type { FamilyEvent } from '@/types';
import { formatDate } from '@/lib/utils';
import { Heart, Skull, Church, Scale, MapPin, GraduationCap, Shield, Star } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  birth: <Heart className="w-4 h-4 text-pink-500" />,
  death: <Skull className="w-4 h-4 text-gray-500" />,
  marriage: <Church className="w-4 h-4 text-purple-500" />,
  divorce: <Scale className="w-4 h-4 text-orange-500" />,
  moved: <MapPin className="w-4 h-4 text-blue-500" />,
  graduated: <GraduationCap className="w-4 h-4 text-green-500" />,
  military: <Shield className="w-4 h-4 text-gray-600" />,
  other: <Star className="w-4 h-4 text-amber-500" />,
};

const EVENT_COLORS: Record<string, string> = {
  birth: 'bg-pink-100', death: 'bg-gray-100', marriage: 'bg-purple-100',
  divorce: 'bg-orange-100', moved: 'bg-blue-100', graduated: 'bg-green-100',
  military: 'bg-gray-100', other: 'bg-amber-100',
};

interface TimelineProps { events: FamilyEvent[]; }

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 italic px-6">No events recorded yet</p>;
  }

  return (
    <div className="space-y-0 px-6">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${EVENT_COLORS[event.event_type] || 'bg-gray-100'}`}>
              {EVENT_ICONS[event.event_type] || EVENT_ICONS.other}
            </div>
            {idx < events.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
          </div>
          <div className="pb-4 pt-1 flex-1">
            <p className="text-sm font-medium text-gray-900">{event.title}</p>
            {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
            <div className="flex items-center gap-2 mt-1">
              {event.event_date && <span className="text-xs text-gray-400">{formatDate(event.event_date)}</span>}
              {event.event_place && <span className="text-xs text-gray-400">• {event.event_place}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
