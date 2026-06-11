'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { getLifespan, getGenerationColor } from '@/lib/utils';
import { Link2 } from 'lucide-react';

interface PersonNodeProps {
  person: Person;
  x: number;
  y: number;
  generation: number;
  selected?: boolean;
  isSelf?: boolean;
  isHovered?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
  onNodeDoubleClick?: () => void;
  onLinkStart?: (e: React.MouseEvent, personId: string) => void;
}

export function PersonNode({ 
  person, 
  x, 
  y, 
  generation, 
  selected = false, 
  isSelf = false, 
  isHovered = false,
  onHoverChange,
  onNodeDoubleClick, 
  onLinkStart 
}: PersonNodeProps) {
  const router = useRouter();
  const colors = getGenerationColor(generation);
  const lifespan = getLifespan(person);
  
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
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

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      onHoverChange?.(true);
    }, 400); // 400ms delay to prevent accidental hovers while moving mouse fast
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    onHoverChange?.(false);
  };

  return (
    <foreignObject 
      x={x - 30} 
      y={y - 40} 
      width={236} 
      height={350}
      style={{ overflow: 'visible' }}
    >
      {/* iOS WebKit: foreignObject content is treated as XHTML automatically */}
      <div
        data-tree-node="true"
        data-person-id={person.id}
        className={`group relative w-[176px] mx-[30px] mt-[40px] cursor-pointer press ${
          isHovered 
            ? 'scale-110 -translate-y-2 z-50' 
            : 'hover:scale-105 hover:-translate-y-1'
        }`}
        style={{ 
          pointerEvents: 'auto',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          transform: isHovered 
            ? 'scale(1.1) translateY(-8px) translateZ(0)' 
            : 'translateZ(0)',
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Link Handle */}
        <div 
          className={`absolute -right-3 top-6 z-30 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            onLinkStart?.(e, person.id);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform border-2 border-white dark:border-slate-900">
            <Link2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Animated glowing border background */}
        <div 
          className={`w-full rounded-2xl transition-all duration-300 ${selected ? 'animate-pulse-soft opacity-100' : (isHovered ? 'opacity-100' : 'opacity-90')}`}
          style={{
            background: isSelf 
              ? 'linear-gradient(135deg, #378ADD 0%, #185FA5 100%)' 
              : `linear-gradient(135deg, ${colors.ring}90, ${colors.ring}30)`,
            padding: '2px',
            boxShadow: isHovered 
              ? `0 10px 40px -10px ${colors.ring}90, 0 0 25px ${colors.ring}60` 
              : (selected ? `0 0 25px ${colors.ring}60` : `0 4px 20px -2px ${colors.ring}40`),
          }}
        >
          {/* Main card background */}
          <div className={`w-full min-h-[89px] rounded-[14px] shadow-inner-glow flex flex-col items-center justify-start pt-7 pb-3 relative`}>
            {/* Light mode background */}
            <div className="absolute inset-0 dark:hidden rounded-[14px] -z-10" style={{ backgroundColor: isSelf ? '#F0F7FF' : colors.bg }} />
            {/* Dark mode background - solid dark slate to make text pop, with a subtle tint for 'isSelf' */}
            <div className={`absolute inset-0 hidden dark:block rounded-[14px] -z-10 ${isSelf ? 'bg-slate-800' : 'bg-slate-900'}`} />

            {/* Basic Info */}
            <div className="text-center px-2 w-full mt-0 relative z-10 flex-shrink-0">
              <p className="font-display text-[16px] font-bold tracking-tight truncate dark:!text-white" style={{ color: colors.fg }}>
                {person.first_name} {person.middle_name ? <span className="dark:opacity-100 opacity-90">{person.middle_name} </span> : ''}<span className="dark:opacity-100 opacity-80 font-medium">{person.last_name || ''}</span>
              </p>
              {lifespan && (
                <p className="font-sans text-[11.5px] font-semibold uppercase tracking-wider mt-0.5 dark:!text-slate-300 dark:!opacity-100" style={{ color: colors.fg, opacity: 0.7 }}>
                  {lifespan}
                </p>
              )}
            </div>

            {/* Expanded Details on Hover */}
            {isHovered && (
              <div className="w-full px-3 pt-2.5 mt-2.5 border-t relative z-10 text-left animate-in fade-in slide-in-from-top-2 flex-1" style={{ borderColor: `${colors.ring}40` }}>
                {person.gothra && (
                  <p className="text-[9.5px] mb-1 truncate dark:!text-slate-200" style={{ color: colors.fg }}><span className="font-bold opacity-80 uppercase tracking-wide">Gothra:</span> <span className="opacity-100">{person.gothra}</span></p>
                )}
                {(person.birth_area || person.birth_place) && (
                  <p className="text-[9.5px] mb-1 truncate dark:!text-slate-200" style={{ color: colors.fg }}><span className="font-bold opacity-80 uppercase tracking-wide">Born:</span> <span className="opacity-100">{person.birth_area ? `${person.birth_area}, ` : ''}{person.birth_place}</span></p>
                )}
                {(person.death_area || person.death_place) && (
                  <p className="text-[9.5px] mb-1 truncate dark:!text-slate-200" style={{ color: colors.fg }}><span className="font-bold opacity-80 uppercase tracking-wide">Died:</span> <span className="opacity-100">{person.death_area ? `${person.death_area}, ` : ''}{person.death_place}</span></p>
                )}
                {person.bio && (
                  <p className="text-[9.5px] mt-1.5 line-clamp-3 leading-relaxed opacity-100 dark:!text-slate-300" style={{ color: colors.fg }}>
                    {person.bio}
                  </p>
                )}
                {!person.birth_place && !person.birth_area && !person.death_place && !person.death_area && !person.bio && (
                   <p className="text-[9px] italic opacity-70 text-center mt-2 mb-1 dark:!text-slate-400" style={{ color: colors.fg }}>No additional details</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overlapping Avatar */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 drop-shadow-md transition-transform duration-300 hover:scale-110" style={{ pointerEvents: 'none' }}>
          <Avatar 
            firstName={person.first_name} 
            lastName={person.last_name} 
            photoUrl={person.photo_url} 
            size="md" 
            generationLevel={generation} 
          />
        </div>
        
        {/* "You" badge */}
        {isSelf && (
          <span className="absolute -top-3 right-3.5 z-20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500 text-white shadow-sm border border-white dark:border-gray-800" style={{ pointerEvents: 'none' }}>
            You
          </span>
        )}
        
        {/* Selection highlight */}
        {selected && (
          <div 
            className="absolute -inset-1 rounded-3xl animate-pulse-soft -z-10 blur-md pointer-events-none"
            style={{ backgroundColor: `${colors.ring}40` }}
          />
        )}
      </div>
    </foreignObject>
  );
}
