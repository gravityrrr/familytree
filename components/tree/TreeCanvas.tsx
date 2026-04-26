'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Person, Relationship, TreeNode } from '@/types';
import { buildTreeLayout, flattenTree } from '@/lib/utils';
import { PersonNode } from './PersonNode';
import { RelationshipLine, LineGradientDefs } from './RelationshipLine';
import { Users } from 'lucide-react';

interface TreeCanvasProps { persons: Person[]; relationships: Relationship[]; }

const NODE_WIDTH = 176;
const NODE_HEIGHT = 92;
const SPOUSE_GAP = 196;

export function TreeCanvas({ persons, relationships }: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const treeNodes = buildTreeLayout(persons, relationships);
  const flatNodes = flattenTree(treeNodes);

  useEffect(() => {
    if (flatNodes.length > 0 && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      let minX = Infinity, maxX = -Infinity;
      flatNodes.forEach(n => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + NODE_WIDTH); });
      const treeWidth = maxX - minX;
      const centerX = (rect.width - treeWidth * zoom) / 2 - minX * zoom;
      setPan({ x: centerX, y: 40 });
      setZoom(1);
    }
  }, [persons.length, relationships.length]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-tree-node="true"]')) {
      return;
    }
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoom((z) => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
      return;
    }

    // Trackpad/mouse-wheel pan allows moving the tree without click-drag.
    setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
  }, []);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setTouchStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart) {
      const t = e.touches[0];
      setPan({ x: t.clientX - touchStart.x, y: t.clientY - touchStart.y });
    }
  }, [touchStart]);

  // Collect lines
  const lines: React.ReactNode[] = [];
  const spouseNodes: React.ReactNode[] = [];

  function collectAll(node: TreeNode) {
    const pcx = node.x + NODE_WIDTH / 2;
    const pby = node.y + NODE_HEIGHT;

    node.children.forEach((child) => {
      lines.push(
        <RelationshipLine key={`l-${node.person.id}-${child.person.id}`}
          x1={pcx} y1={pby} x2={child.x + NODE_WIDTH / 2} y2={child.y} type="parent-child" />
      );
      collectAll(child);
    });

    node.spouses.forEach((spouse, i) => {
      const sx = node.x + NODE_WIDTH + 20 + i * SPOUSE_GAP;
      lines.push(
        <RelationshipLine key={`s-${node.person.id}-${spouse.id}`}
          x1={node.x + NODE_WIDTH} y1={node.y + NODE_HEIGHT / 2} x2={sx} y2={node.y + NODE_HEIGHT / 2} type="spouse" />
      );
      spouseNodes.push(
        <PersonNode key={`sn-${node.person.id}-${spouse.id}`} person={spouse} x={sx} y={node.y} generation={node.generation} />
      );
    });
  }
  treeNodes.forEach(collectAll);

  if (persons.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-5 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gray-100/80 flex items-center justify-center">
          <Users className="w-10 h-10 text-gray-200" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-gray-400">No one here yet</p>
          <p className="text-sm text-gray-300 mt-1">Add your first family member to start building</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <svg ref={svgRef} className="w-full h-full cursor-crosshair" style={{ touchAction: 'none' }}
        onMouseEnter={() => setCursorVisible(true)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setCursorVisible(false);
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setTouchStart(null)}
      >
        <LineGradientDefs />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {lines}
          {flatNodes.map((n) => <PersonNode key={n.person.id} person={n.person} x={n.x} y={n.y} generation={n.generation} />)}
          {spouseNodes}
        </g>
      </svg>

      {cursorVisible && (
        <div
          className="pointer-events-none absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-500/70 bg-brand-400/10"
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500" />
        </div>
      )}
    </div>
  );
}
