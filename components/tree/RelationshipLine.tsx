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
        stroke="#d4537e" 
        strokeWidth={2.5} 
        strokeDasharray="6,8" 
        strokeLinecap="round"
        opacity={0.8}
        className="tree-line-animate"
      />
    );
  }

  // Fluid Bezier curve for parent-child
  const midY = (y1 + y2) / 2;
  const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

  return (
    <g>
      {/* Subtle background line */}
      <path
        d={path}
        fill="none" 
        stroke="#94a3b8" 
        strokeWidth={3} 
        opacity={0.2}
      />
      {/* Flowing data line — uses CSS animation instead of SVG <animate> for better iOS performance */}
      <path
        d={path}
        fill="none" 
        stroke="#378ADD" 
        strokeWidth={2} 
        strokeDasharray="8,12"
        strokeLinecap="round"
        opacity={0.9}
        className="tree-line-animate"
      />
    </g>
  );
}

export function LineGradientDefs() {
  return null;
}
