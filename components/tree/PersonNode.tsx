'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { getLifespan, getGenerationColor } from '@/lib/utils';

interface PersonNodeProps {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

/**
 * Individual person card rendered as a foreignObject inside SVG.
 * Shows avatar, name, and lifespan dates.
 */
export function PersonNode({ person, x, y, generation }: PersonNodeProps) {
  const router = useRouter();
  const colors = getGenerationColor(generation);
  const lifespan = getLifespan(person);

  return (
    <foreignObject x={x} y={y} width={170} height={90}>
      <div
        className="w-full h-full rounded-card shadow-sm border border-gray-100 flex items-center gap-3 px-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: colors.bg }}
        onClick={() => router.push(`/person/${person.id}`)}
      >
        <Avatar
          firstName={person.first_name}
          lastName={person.last_name}
          photoUrl={person.photo_url}
          size="md"
          generationLevel={generation}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: colors.fg }}
          >
            {person.first_name}
          </p>
          <p
            className="text-xs truncate"
            style={{ color: colors.fg, opacity: 0.7 }}
          >
            {person.last_name || ''}
          </p>
          {lifespan && (
            <p
              className="text-[10px] mt-0.5"
              style={{ color: colors.fg, opacity: 0.5 }}
            >
              {lifespan}
            </p>
          )}
        </div>
      </div>
    </foreignObject>
  );
}
