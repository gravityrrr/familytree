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
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const VIEWPORT_PADDING = 72;

interface RenderNode {
  key: string;
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export function TreeCanvas({ persons, relationships }: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  const treeNodes = buildTreeLayout(persons, relationships);
  const flatNodes = flattenTree(treeNodes);

  const spouseNodes: RenderNode[] = [];
  const lines: React.ReactNode[] = [];

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
      spouseNodes.push({
        key: `sn-${node.person.id}-${spouse.id}`,
        person: spouse,
        x: sx,
        y: node.y,
        generation: node.generation,
      });
    });
  }
  treeNodes.forEach(collectAll);

  const allNodes: RenderNode[] = [
    ...flatNodes.map((n) => ({ key: n.person.id, person: n.person, x: n.x, y: n.y, generation: n.generation })),
    ...spouseNodes,
  ];

  const contentBounds = allNodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x + NODE_WIDTH),
      maxY: Math.max(acc.maxY, node.y + NODE_HEIGHT),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const hasValidBounds = Number.isFinite(contentBounds.minX);

  const clampPan = useCallback((nextPan: { x: number; y: number }, nextZoom: number) => {
    if (!svgRef.current || !hasValidBounds) {
      return nextPan;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;
    const minX = contentBounds.minX * nextZoom;
    const maxX = contentBounds.maxX * nextZoom;
    const minY = contentBounds.minY * nextZoom;
    const maxY = contentBounds.maxY * nextZoom;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    let clampedX = nextPan.x;
    let clampedY = nextPan.y;

    if (contentWidth + VIEWPORT_PADDING * 2 <= vw) {
      clampedX = (vw - contentWidth) / 2 - minX;
    } else {
      const maxPanX = VIEWPORT_PADDING - minX;
      const minPanX = vw - VIEWPORT_PADDING - maxX;
      clampedX = Math.min(maxPanX, Math.max(minPanX, clampedX));
    }

    if (contentHeight + VIEWPORT_PADDING * 2 <= vh) {
      clampedY = (vh - contentHeight) / 2 - minY;
    } else {
      const maxPanY = VIEWPORT_PADDING - minY;
      const minPanY = vh - VIEWPORT_PADDING - maxY;
      clampedY = Math.min(maxPanY, Math.max(minPanY, clampedY));
    }

    return { x: clampedX, y: clampedY };
  }, [contentBounds.maxX, contentBounds.maxY, contentBounds.minX, contentBounds.minY, hasValidBounds]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startInertia = useCallback(() => {
    const friction = 0.92;
    const minVelocity = 0.05;

    const tick = () => {
      velocityRef.current.x *= friction;
      velocityRef.current.y *= friction;

      if (Math.abs(velocityRef.current.x) < minVelocity && Math.abs(velocityRef.current.y) < minVelocity) {
        stopAnimation();
        return;
      }

      setPan((prev) => clampPan({
        x: prev.x + velocityRef.current.x * 16,
        y: prev.y + velocityRef.current.y * 16,
      }, zoom));

      animationRef.current = requestAnimationFrame(tick);
    };

    stopAnimation();
    animationRef.current = requestAnimationFrame(tick);
  }, [clampPan, stopAnimation, zoom]);

  useEffect(() => {
    if (flatNodes.length > 0 && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      let minX = Infinity, maxX = -Infinity;
      flatNodes.forEach(n => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + NODE_WIDTH); });
      const treeWidth = maxX - minX;
      const centerX = (rect.width - treeWidth * zoom) / 2 - minX * zoom;
      setPan(clampPan({ x: centerX, y: 40 }, 1));
      setZoom(1);
    }
  }, [clampPan, flatNodes, persons.length, relationships.length, zoom]);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const updateViewport = () => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(svgRef.current);
    window.addEventListener('resize', updateViewport);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-tree-node="true"]')) {
      return;
    }
    stopAnimation();
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velocityRef.current = { x: 0, y: 0 };
  }, [pan, stopAnimation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (!dragging) return;

    const now = performance.now();
    const prev = lastMoveRef.current;
    if (prev) {
      const dt = Math.max(8, now - prev.t);
      velocityRef.current = {
        x: (e.clientX - prev.x) / dt,
        y: (e.clientY - prev.y) / dt,
      };
    }
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };

    setPan(clampPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }, zoom));
  }, [clampPan, dragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const velocity = Math.hypot(velocityRef.current.x, velocityRef.current.y);
      if (velocity > 0.08) {
        startInertia();
      }
    }
    setDragging(false);
    lastMoveRef.current = null;
  }, [dragging, startInertia]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    stopAnimation();

    if (e.ctrlKey || e.metaKey) {
      setZoom((z) => {
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.001));
        setPan((prev) => clampPan(prev, nextZoom));
        return nextZoom;
      });
      return;
    }

    // Trackpad/mouse-wheel pan allows moving the tree without click-drag.
    setPan((prev) => clampPan({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }, zoom));
  }, [clampPan, stopAnimation, zoom]);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      stopAnimation();
      const t = e.touches[0];
      setTouchStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
    }
  }, [pan, stopAnimation]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart) {
      const t = e.touches[0];
      setPan(clampPan({ x: t.clientX - touchStart.x, y: t.clientY - touchStart.y }, zoom));
    }
  }, [clampPan, touchStart, zoom]);

  const centerNode = useCallback((node: { x: number; y: number; person: Person }) => {
    if (!svgRef.current) {
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const target = clampPan(
      {
        x: rect.width / 2 - (node.x + NODE_WIDTH / 2) * zoom,
        y: rect.height / 2 - (node.y + NODE_HEIGHT / 2) * zoom,
      },
      zoom
    );

    setSelectedNodeId(node.person.id);
    setPan(target);
  }, [clampPan, zoom]);

  const handleMinimapJump = useCallback((clientX: number, clientY: number) => {
    if (!hasValidBounds || !svgRef.current || viewport.width === 0 || viewport.height === 0) {
      return;
    }

    const mapWidth = 180;
    const mapHeight = 120;
    const mapPadding = 8;
    const contentWidth = contentBounds.maxX - contentBounds.minX;
    const contentHeight = contentBounds.maxY - contentBounds.minY;
    const scale = Math.min((mapWidth - mapPadding * 2) / contentWidth, (mapHeight - mapPadding * 2) / contentHeight);

    const box = svgRef.current.parentElement?.querySelector('[data-minimap="true"]')?.getBoundingClientRect();
    if (!box) return;

    const localX = clientX - box.left;
    const localY = clientY - box.top;
    const contentX = (localX - mapPadding) / scale + contentBounds.minX;
    const contentY = (localY - mapPadding) / scale + contentBounds.minY;

    const targetPan = clampPan({
      x: viewport.width / 2 - contentX * zoom,
      y: viewport.height / 2 - contentY * zoom,
    }, zoom);

    setPan(targetPan);
  }, [clampPan, contentBounds.maxX, contentBounds.maxY, contentBounds.minX, contentBounds.minY, hasValidBounds, viewport.height, viewport.width, zoom]);

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
        onDoubleClick={(e) => {
          if ((e.target as Element).closest('[data-tree-node="true"]')) {
            return;
          }
          setPan(clampPan({ x: 0, y: 0 }, zoom));
        }}
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
          {flatNodes.map((n) => (
            <PersonNode
              key={n.person.id}
              person={n.person}
              x={n.x}
              y={n.y}
              generation={n.generation}
              selected={selectedNodeId === n.person.id}
              onNodeDoubleClick={() => centerNode(n)}
            />
          ))}
          {spouseNodes.map((sp) => (
            <PersonNode
              key={sp.key}
              person={sp.person}
              x={sp.x}
              y={sp.y}
              generation={sp.generation}
              selected={selectedNodeId === sp.person.id}
              onNodeDoubleClick={() => centerNode(sp)}
            />
          ))}
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

      {hasValidBounds && viewport.width > 0 && viewport.height > 0 && (allNodes.length > 12 || (contentBounds.maxX - contentBounds.minX) > viewport.width * 1.25) && (
        <div
          data-minimap="true"
          className="absolute bottom-4 left-4 z-30 h-[120px] w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 p-2 backdrop-blur"
          onMouseDown={(e) => handleMinimapJump(e.clientX, e.clientY)}
        >
          {(() => {
            const mapWidth = 180;
            const mapHeight = 120;
            const mapPadding = 8;
            const contentWidth = contentBounds.maxX - contentBounds.minX;
            const contentHeight = contentBounds.maxY - contentBounds.minY;
            const scale = Math.min((mapWidth - mapPadding * 2) / contentWidth, (mapHeight - mapPadding * 2) / contentHeight);
            const viewX = (-pan.x / zoom - contentBounds.minX) * scale + mapPadding;
            const viewY = (-pan.y / zoom - contentBounds.minY) * scale + mapPadding;
            const viewW = (viewport.width / zoom) * scale;
            const viewH = (viewport.height / zoom) * scale;

            return (
              <svg className="h-full w-full" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
                <rect x={0} y={0} width={mapWidth} height={mapHeight} rx={12} fill="transparent" />
                {allNodes.map((node) => (
                  <rect
                    key={`mini-${node.key}`}
                    x={(node.x - contentBounds.minX) * scale + mapPadding}
                    y={(node.y - contentBounds.minY) * scale + mapPadding}
                    width={Math.max(2.5, NODE_WIDTH * scale)}
                    height={Math.max(2, NODE_HEIGHT * scale)}
                    rx={2}
                    fill={selectedNodeId === node.person.id ? '#185FA5' : '#94a3b8'}
                    opacity={selectedNodeId === node.person.id ? 0.85 : 0.5}
                  />
                ))}
                <rect
                  x={viewX}
                  y={viewY}
                  width={Math.max(10, viewW)}
                  height={Math.max(8, viewH)}
                  rx={4}
                  fill="none"
                  stroke="#185FA5"
                  strokeWidth={1.4}
                />
              </svg>
            );
          })()}
        </div>
      )}
    </div>
  );
}
