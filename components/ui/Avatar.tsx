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

/**
 * Avatar component that shows a photo or coloured initials.
 * Ring colour is determined by generation level.
 */
export function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = 'md',
  generationLevel = 3,
  className = '',
  onClick,
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const colors = getGenerationColor(generationLevel);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const ringWidths = {
    sm: 'ring-2',
    md: 'ring-2',
    lg: 'ring-[3px]',
    xl: 'ring-[3px]',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full ${ringWidths[size]} flex-shrink-0 overflow-hidden flex items-center justify-center font-semibold cursor-pointer transition-transform hover:scale-105 ${className}`}
      style={{
        backgroundColor: photoUrl ? 'transparent' : colors.bg,
        color: colors.fg,
        // @ts-expect-error CSS custom property for ring colour
        '--tw-ring-color': colors.ring,
      }}
      onClick={onClick}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${firstName} ${lastName || ''}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
