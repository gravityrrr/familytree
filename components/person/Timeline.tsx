'use client';

import React from 'react';
import type { FamilyEvent } from '@/types';
import { formatDate } from '@/lib/utils';
import { Heart, Skull, Church, Scale, MapPin, GraduationCap, Shield, Star } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  birth: <Heart className="w-3.5 h-3.5 text-pink-500" />,
  death: <Skull className="w-3.5 h-3.5 text-gray-500" />,
  marriage: <Church className="w-3.5 h-3.5 text-purple-500" />,
  divorce: <Scale className="w-3.5 h-3.5 text-orange-500" />,
  moved: <MapPin className="w-3.5 h-3.5 text-blue-500" />,
  graduated: <GraduationCap className="w-3.5 h-3.5 text-green-500" />,
  military: <Shield className="w-3.5 h-3.5 text-gray-600" />,
  other: <Star className="w-3.5 h-3.5 text-amber-500" />,
};

const EVENT_COLORS: Record<string, string> = {
  birth: 'bg-pink-50 ring-1 ring-pink-100', death: 'bg-gray-50 ring-1 ring-gray-100',
  marriage: 'bg-purple-50 ring-1 ring-purple-100', divorce: 'bg-orange-50 ring-1 ring-orange-100',
  moved: 'bg-blue-50 ring-1 ring-blue-100', graduated: 'bg-green-50 ring-1 ring-green-100',
  military: 'bg-gray-50 ring-1 ring-gray-100', other: 'bg-amber-50 ring-1 ring-amber-100',
};

export function Timeline({ events }: { events: FamilyEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-300 italic px-6">No events recorded yet</p>;
  }

  return (
    <div className="space-y-0 px-6 stagger-fade">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${EVENT_COLORS[event.event_type] || EVENT_COLORS.other}`}>
              {EVENT_ICONS[event.event_type] || EVENT_ICONS.other}
            </div>
            {idx < events.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-gray-200 to-transparent my-1" />}
          </div>
          <div className="pb-5 pt-1 flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800">{event.title}</p>
            {event.description && <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{event.description}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              {event.event_date && <span className="text-[10px] text-gray-400 font-medium">{formatDate(event.event_date)}</span>}
              {event.event_place && <span className="text-[10px] text-gray-400">· {event.event_place}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
