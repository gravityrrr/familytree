'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { getLifespan, getGenerationColor } from '@/lib/utils';

interface PersonNodeProps { person: Person; x: number; y: number; generation: number; }

export function PersonNode({ person, x, y, generation }: PersonNodeProps) {
  const router = useRouter();
  const colors = getGenerationColor(generation);
  const lifespan = getLifespan(person);

  return (
    <foreignObject x={x} y={y} width={176} height={92}>
      <div
        data-tree-node="true"
        className="w-full h-full rounded-2xl shadow-card border flex items-center gap-3 px-3.5 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 press"
        style={{
          backgroundColor: `${colors.bg}ee`,
          borderColor: `${colors.ring}30`,
          backdropFilter: 'blur(8px)',
        }}
        onClick={() => router.push(`/person/${person.id}`)}
      >
        <Avatar firstName={person.first_name} lastName={person.last_name} photoUrl={person.photo_url} size="md" generationLevel={generation} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold truncate leading-tight" style={{ color: colors.fg }}>
            {person.first_name}
          </p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: colors.fg, opacity: 0.6 }}>
            {person.last_name || ''}
          </p>
          {lifespan && (
            <p className="text-[9px] mt-1 font-medium tracking-wide" style={{ color: colors.fg, opacity: 0.4 }}>
              {lifespan}
            </p>
          )}
        </div>
      </div>
    </foreignObject>
  );
}
