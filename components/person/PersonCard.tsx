'use client';

import React from 'react';
import type { Person } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { getLifespan } from '@/lib/utils';
import { MapPin, Calendar } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  relationshipTags?: string[];
  onAvatarClick?: () => void;
}

/**
 * Hero section for the person profile page.
 * Shows large avatar, name, dates, and relationship tags.
 */
export function PersonCard({
  person,
  relationshipTags = [],
  onAvatarClick,
}: PersonCardProps) {
  const lifespan = getLifespan(person);

  return (
    <div className="flex flex-col items-center text-center pt-8 pb-6 px-6">
      {/* Large avatar with tap-to-upload */}
      <div className="relative mb-4">
        <Avatar
          firstName={person.first_name}
          lastName={person.last_name}
          photoUrl={person.photo_url}
          size="xl"
          generationLevel={3}
          onClick={onAvatarClick}
        />
        {onAvatarClick && (
          <div className="absolute bottom-0 right-0 w-7 h-7 bg-brand rounded-full flex items-center justify-center shadow-sm border-2 border-white cursor-pointer">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <h1 className="text-2xl font-bold text-gray-900">
        {person.first_name} {person.last_name || ''}
      </h1>

      {person.nickname && (
        <p className="text-sm text-gray-500 mt-0.5">
          &ldquo;{person.nickname}&rdquo;
        </p>
      )}

      {/* Lifespan */}
      {lifespan && (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{lifespan}</span>
        </div>
      )}

      {/* Birthplace */}
      {person.birth_place && (
        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          <span>{person.birth_place}</span>
        </div>
      )}

      {/* Relationship tags */}
      {relationshipTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {relationshipTags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-brand/10 text-brand text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
