'use client';

import React from 'react';
import { getInitials, getGenerationColor } from '@/lib/utils';

interface AvatarProps {
  firstName: string;
  lastName?: string | null;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  generationLevel?: number;
  className?: string;
  onClick?: () => void;
}

export function Avatar({ firstName, lastName, photoUrl, size = 'md', generationLevel = 3, className = '', onClick }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const colors = getGenerationColor(generationLevel);

  const sizes = {
    sm: 'w-9 h-9 text-[11px]',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const rings = {
    sm: 'ring-[2px] ring-offset-[1.5px]',
    md: 'ring-[2.5px] ring-offset-[1.5px]',
    lg: 'ring-[3px] ring-offset-2',
    xl: 'ring-[3.5px] ring-offset-2',
  };

  return (
    <div
      className={`${sizes[size]} ${rings[size]} ring-offset-white rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: photoUrl ? 'transparent' : colors.bg,
        color: colors.fg,
        // @ts-expect-error CSS custom property for ring colour
        '--tw-ring-color': colors.ring,
      }}
      onClick={onClick}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={`${firstName} ${lastName || ''}`} className="w-full h-full object-cover" />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}
