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
    <div className="relative overflow-hidden">
      {/* Gradient header background */}
      <div className="absolute inset-0 h-36 bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-pink-500/5" />
      <div className="absolute top-0 left-0 right-0 h-36 bg-[radial-gradient(circle_at_30%_-20%,rgba(24,95,165,0.12),transparent_60%)]" />

      <div className="relative flex flex-col items-center text-center pt-10 pb-6 px-6 animate-fade-in-up">
        {/* Avatar */}
        <div className="relative mb-5 group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400 to-purple-400 blur-md opacity-20 group-hover:opacity-30 transition-opacity scale-110" />
          <Avatar firstName={person.first_name} lastName={person.last_name} photoUrl={person.photo_url} size="xl" generationLevel={3} onClick={onAvatarClick} />
          {onAvatarClick && (
            <button onClick={onAvatarClick} className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-400 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 press">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {person.first_name} {person.last_name || ''}
        </h1>

        {person.nickname && (
          <p className="text-sm text-gray-400 mt-0.5 italic">&ldquo;{person.nickname}&rdquo;</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
          {lifespan && (
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />{lifespan}
            </span>
          )}
          {person.birth_place && (
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500 bg-gray-100/60 px-3 py-1 rounded-full">
              <MapPin className="w-3.5 h-3.5" />{person.birth_place}
            </span>
          )}
        </div>

        {/* Tags */}
        {relationshipTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {relationshipTags.map((tag) => (
              <span key={tag} className="chip bg-brand-50 text-brand-600 border border-brand-100/50">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
