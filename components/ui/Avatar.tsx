'use client';

import React from 'react';
import Image from 'next/image';
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

  const borders = {
    sm: 'border-[2px]',
    md: 'border-[2.5px]',
    lg: 'border-[3px]',
    xl: 'border-[3.5px]',
  };

  return (
    <div
      className={`${sizes[size]} ${borders[size]} border-white dark:border-gray-900 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: photoUrl ? 'transparent' : colors.bg,
        color: colors.fg,
        borderColor: colors.ring,
      }}
      onClick={onClick}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={`${firstName} ${lastName || ''}`} fill className="object-cover" unoptimized />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}
