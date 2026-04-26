'use client';

import React from 'react';

interface RelationshipLineProps {
  /** Start point */
  x1: number;
  y1: number;
  /** End point */
  x2: number;
  y2: number;
  /** Type of connection */
  type: 'parent-child' | 'spouse';
}

/**
 * SVG line connecting two person nodes.
 * Parent-child lines are solid vertical; spouse lines are dashed horizontal.
 */
export function RelationshipLine({
  x1,
  y1,
  x2,
  y2,
  type,
}: RelationshipLineProps) {
  if (type === 'spouse') {
    // Horizontal dashed line for spouse connections
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="6,4"
        className="transition-all duration-300"
      />
    );
  }

  // Vertical line with elbow for parent-child connections
  const midY = (y1 + y2) / 2;

  return (
    <path
      d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
      fill="none"
      stroke="#cbd5e1"
      strokeWidth={1.5}
      className="transition-all duration-300"
    />
  );
}
