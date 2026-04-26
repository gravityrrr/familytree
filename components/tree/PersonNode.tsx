'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { getLifespan, getGenerationColor } from '@/lib/utils';

interface PersonNodeProps {
  person: Person;
  x: number;
  y: number;
  generation: number;
  selected?: boolean;
  onNodeDoubleClick?: () => void;
}

export function PersonNode({ person, x, y, generation, selected = false, onNodeDoubleClick }: PersonNodeProps) {
  const router = useRouter();
  const colors = getGenerationColor(generation);
  const lifespan = getLifespan(person);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onNodeDoubleClick?.();
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      router.push(`/person/${person.id}`);
      clickTimerRef.current = null;
    }, 220);
  };

  return (
    <foreignObject x={x} y={y} width={176} height={92}>
      <div
        data-tree-node="true"
        className={`w-full h-full rounded-2xl shadow-card border flex items-center gap-3 px-3.5 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 press ${selected ? 'ring-2 ring-brand-400/60' : ''}`}
        style={{
          backgroundColor: `${colors.bg}ee`,
          borderColor: selected ? `${colors.ring}80` : `${colors.ring}30`,
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClick}
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
