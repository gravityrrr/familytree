'use client';

import React from 'react';

interface RelationshipLineProps {
  x1: number; y1: number;
  x2: number; y2: number;
  type: 'parent-child' | 'spouse';
}

export function RelationshipLine({ x1, y1, x2, y2, type }: RelationshipLineProps) {
  if (type === 'spouse') {
    return (
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="url(#spouseGradient)" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.6}
      />
    );
  }

  const midY = (y1 + y2) / 2;
  return (
    <path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none" stroke="url(#parentGradient)" strokeWidth={1.5} opacity={0.5}
    />
  );
}

/** SVG gradient definitions — render once inside the SVG */
export function LineGradientDefs() {
  return (
    <defs>
      <linearGradient id="parentGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="spouseGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#d4537e" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#7f77dd" stopOpacity={0.5} />
      </linearGradient>
    </defs>
  );
}
