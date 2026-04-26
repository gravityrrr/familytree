'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Person, Relationship, TreeNode } from '@/types';
import { buildTreeLayout, flattenTree } from '@/lib/utils';
import { PersonNode } from './PersonNode';
import { RelationshipLine } from './RelationshipLine';
import { Users } from 'lucide-react';

interface TreeCanvasProps {
  persons: Person[];
  relationships: Relationship[];
}

const NODE_WIDTH = 170;
const NODE_HEIGHT = 90;
const SPOUSE_GAP = 190;

/**
 * SVG-based family tree visualisation.
 * Supports pan and zoom via mouse drag and scroll wheel.
 */
export function TreeCanvas({ persons, relationships }: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build the tree layout
  const treeNodes = buildTreeLayout(persons, relationships);
  const flatNodes = flattenTree(treeNodes);

  // Auto-center the tree on first render
  useEffect(() => {
    if (flatNodes.length > 0 && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      // Find the bounding box of all nodes
      let minX = Infinity, maxX = -Infinity;
      flatNodes.forEach(n => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x + NODE_WIDTH);
      });
      const treeWidth = maxX - minX;
      const centerX = (rect.width - treeWidth * zoom) / 2 - minX * zoom;
      setPan({ x: centerX, y: 40 });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons.length]);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)));
  }, []);

  // Touch support for mobile pan
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    },
    [pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && touchStart) {
        const touch = e.touches[0];
        setPan({
          x: touch.clientX - touchStart.x,
          y: touch.clientY - touchStart.y,
        });
      }
    },
    [touchStart]
  );

  // Collect lines to draw
  const lines: React.ReactNode[] = [];

  function collectLines(node: TreeNode) {
    const parentCenterX = node.x + NODE_WIDTH / 2;
    const parentBottomY = node.y + NODE_HEIGHT;

    // Lines to children
    node.children.forEach((child) => {
      const childCenterX = child.x + NODE_WIDTH / 2;
      const childTopY = child.y;
      lines.push(
        <RelationshipLine
          key={`line-${node.person.id}-${child.person.id}`}
          x1={parentCenterX}
          y1={parentBottomY}
          x2={childCenterX}
          y2={childTopY}
          type="parent-child"
        />
      );
      collectLines(child);
    });

    // Lines to spouses
    node.spouses.forEach((spouse, i) => {
      const spouseX = node.x + NODE_WIDTH + 20 + i * SPOUSE_GAP;
      lines.push(
        <RelationshipLine
          key={`spouse-${node.person.id}-${spouse.id}`}
          x1={node.x + NODE_WIDTH}
          y1={node.y + NODE_HEIGHT / 2}
          x2={spouseX}
          y2={node.y + NODE_HEIGHT / 2}
          type="spouse"
        />
      );
    });
  }

  treeNodes.forEach(collectLines);

  // Collect spouse nodes to render
  const spouseNodes: React.ReactNode[] = [];
  function collectSpouseNodes(node: TreeNode) {
    node.spouses.forEach((spouse, i) => {
      const spouseX = node.x + NODE_WIDTH + 20 + i * SPOUSE_GAP;
      spouseNodes.push(
        <PersonNode
          key={`spouse-node-${spouse.id}`}
          person={spouse}
          x={spouseX}
          y={node.y}
          generation={node.generation}
        />
      );
    });
    node.children.forEach(collectSpouseNodes);
  }
  treeNodes.forEach(collectSpouseNodes);

  if (persons.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 p-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-10 h-10 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">No one here yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add your first family member to start building your tree
          </p>
        </div>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full flex-1 cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setTouchStart(null)}
    >
      <g
        transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
      >
        {/* Draw lines first (behind nodes) */}
        {lines}

        {/* Draw person nodes */}
        {flatNodes.map((node) => (
          <PersonNode
            key={node.person.id}
            person={node.person}
            x={node.x}
            y={node.y}
            generation={node.generation}
          />
        ))}

        {/* Draw spouse nodes */}
        {spouseNodes}
      </g>
    </svg>
  );
}
