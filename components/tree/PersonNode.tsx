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
    <foreignObject x={x} y={y - 16} width={180} height={110} style={{ overflow: 'visible' }}>
      <div
        data-tree-node="true"
        className="relative w-[176px] h-[92px] mt-4 ml-[2px] cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-glass-lg press"
        onClick={handleClick}
      >
        {/* Animated glowing border background */}
        <div 
          className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${selected ? 'animate-pulse-soft opacity-100' : 'opacity-80'}`}
          style={{
            background: `linear-gradient(135deg, ${colors.ring}60, ${colors.ring}20)`,
            padding: '1.5px',
          }}
        >
          {/* Main card background (no backdrop-filter to prevent SVG rendering bugs) */}
          <div 
            className="absolute inset-[1.5px] rounded-[14.5px] shadow-inner-glow flex flex-col items-center justify-end pb-3"
            style={{
              backgroundColor: colors.bg,
            }}
          >
            <div className="text-center px-2 w-full mt-7">
              <p className="font-display text-[14px] font-bold tracking-tight truncate" style={{ color: colors.fg }}>
                {person.first_name} <span className="opacity-80 font-medium">{person.last_name || ''}</span>
              </p>
              {lifespan && (
                <p className="font-sans text-[10px] uppercase tracking-wider mt-0.5" style={{ color: colors.fg, opacity: 0.6 }}>
                  {lifespan}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Overlapping Avatar */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 drop-shadow-md transition-transform duration-300 hover:scale-110">
          <Avatar 
            firstName={person.first_name} 
            lastName={person.last_name} 
            photoUrl={person.photo_url} 
            size="md" 
            generationLevel={generation} 
          />
        </div>
        
        {/* Selection highlight */}
        {selected && (
          <div 
            className="absolute -inset-1 rounded-3xl animate-pulse-soft -z-10 blur-md"
            style={{ backgroundColor: `${colors.ring}40` }}
          />
        )}
      </div>
    </foreignObject>
  );
}
