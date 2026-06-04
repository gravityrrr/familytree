'use client';

import React from 'react';
import type { Person } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { getLifespan } from '@/lib/utils';
import { MapPin, Calendar, Camera } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  relationshipTags?: string[];
  onAvatarClick?: () => void;
}

export function PersonCard({ person, relationshipTags = [], onAvatarClick }: PersonCardProps) {
  const lifespan = getLifespan(person);

  return (
    <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Gradient header background */}
      <div className="absolute inset-0 h-36 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/5 dark:from-blue-500/15" />
      <div className="absolute top-0 left-0 right-0 h-36 bg-[radial-gradient(circle_at_30%_-20%,rgba(59,130,246,0.15),transparent_60%)]" />

      <div className="relative flex flex-col items-center text-center pt-10 pb-6 px-6 animate-fade-in-up">
        {/* Avatar */}
        <div className="relative mb-5 group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 blur-md opacity-25 group-hover:opacity-40 transition-opacity scale-110" />
          <Avatar firstName={person.first_name} lastName={person.last_name} photoUrl={person.photo_url} size="xl" generationLevel={3} onClick={onAvatarClick} />
          {onAvatarClick && (
            <button 
              onClick={onAvatarClick} 
              className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 transition-transform hover:scale-110 active:scale-95"
              title="Change Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {person.first_name} <span className="opacity-90 font-medium">{person.last_name || ''}</span>
        </h1>

        {person.nickname && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">&ldquo;{person.nickname}&rdquo;</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3.5">
          {lifespan && (
            <span className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />{lifespan}
            </span>
          )}
          {person.birth_place && (
            <span className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm animate-fade-in">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />{person.birth_place}
            </span>
          )}
        </div>

        {/* Tags */}
        {relationshipTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {relationshipTags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
