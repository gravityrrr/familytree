'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Person, Relationship, TreeNode } from '@/types';
import { buildTreeLayout, flattenTree } from '@/lib/utils';
import { PersonNode } from './PersonNode';
import { RelationshipLine, LineGradientDefs } from './RelationshipLine';
import { Users, ZoomIn, ZoomOut, Target } from 'lucide-react';

interface TreeCanvasProps { persons: Person[]; relationships: Relationship[]; }

const NODE_WIDTH = 176;
const NODE_HEIGHT = 92;
const SPOUSE_GAP = 196;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;

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
    if (!svgRef.current || !hasValidBounds) return nextPan;

    const rect = svgRef.current.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;
    
    const treeMinX = contentBounds.minX * nextZoom;
    const treeMaxX = contentBounds.maxX * nextZoom;
    const treeMinY = contentBounds.minY * nextZoom;
    const treeMaxY = contentBounds.maxY * nextZoom;

    // Allow panning freely but keep the tree somewhat near the screen
    const padX = Math.min(vw * 0.8, (treeMaxX - treeMinX) * 0.8);
    const padY = Math.min(vh * 0.8, (treeMaxY - treeMinY) * 0.8);

    const minPanX = -treeMaxX + vw - padX;
    const maxPanX = -treeMinX + padX;
    const minPanY = -treeMaxY + vh - padY;
    const maxPanY = -treeMinY + padY;

    // If the limits are inverted (tree is very small), just let them pan within a wide area
    let clampedX = nextPan.x;
    if (minPanX <= maxPanX) {
      clampedX = Math.min(Math.max(clampedX, minPanX), maxPanX);
    }

    let clampedY = nextPan.y;
    if (minPanY <= maxPanY) {
      clampedY = Math.min(Math.max(clampedY, minPanY), maxPanY);
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

  const hasCentered = useRef(false);
  useEffect(() => {
    if (flatNodes.length > 0 && svgRef.current && !hasCentered.current) {
      hasCentered.current = true;
      const rect = svgRef.current.getBoundingClientRect();
      const treeWidth = contentBounds.maxX - contentBounds.minX;
      const treeHeight = contentBounds.maxY - contentBounds.minY;
      const centerX = (rect.width - treeWidth) / 2 - contentBounds.minX;
      const centerY = Math.max(120, (rect.height - treeHeight) / 2 - contentBounds.minY);
      setPan(clampPan({ x: centerX, y: centerY }, 1));
      setZoom(1);
    }
  }, [clampPan, flatNodes.length, contentBounds.minX, contentBounds.maxX, contentBounds.minY, contentBounds.maxY]);

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
    stopAnimation();
    
    // Check if user is scrolling with wheel (pan) or pinching (zoom)
    const isPinch = e.ctrlKey || e.metaKey;
    const isMouseWheel = e.deltaY % 1 !== 0 || Math.abs(e.deltaY) >= 50;

    // We'll use vertical wheel for zooming to be intuitive, or pinch to zoom.
    // If they hold Shift, we could pan horizontally, but zooming is usually preferred for maps.
    
    if (isPinch || isMouseWheel || true) { // Always zoom on wheel for map-like interface
      setZoom((z) => {
        const zoomFactor = isPinch ? 0.01 : 0.002;
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * zoomFactor));
        
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          setPan((prev) => {
            const newX = mouseX - (mouseX - prev.x) * (nextZoom / z);
            const newY = mouseY - (mouseY - prev.y) * (nextZoom / z);
            return clampPan({ x: newX, y: newY }, nextZoom);
          });
        } else {
          setPan((prev) => clampPan(prev, nextZoom));
        }
        return nextZoom;
      });
    }
  }, [clampPan, stopAnimation]);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number | null>(null);

  const getPinchDistance = (touches: React.TouchList) => {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  };

  const getPinchCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    stopAnimation();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setTouchStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
    } else if (e.touches.length === 2) {
      setInitialPinchDist(getPinchDistance(e.touches));
      setInitialPinchZoom(zoom);
    }
  }, [pan, stopAnimation, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart) {
      const t = e.touches[0];
      setPan(clampPan({ x: t.clientX - touchStart.x, y: t.clientY - touchStart.y }, zoom));
    } else if (e.touches.length === 2 && initialPinchDist && initialPinchZoom && svgRef.current) {
      const dist = getPinchDistance(e.touches);
      const center = getPinchCenter(e.touches);
      const rect = svgRef.current.getBoundingClientRect();
      const localCenterX = center.x - rect.left;
      const localCenterY = center.y - rect.top;

      const scale = dist / initialPinchDist;
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialPinchZoom * scale));
      
      setZoom((z) => {
        setPan((prev) => {
          const newX = localCenterX - (localCenterX - prev.x) * (nextZoom / z);
          const newY = localCenterY - (localCenterY - prev.y) * (nextZoom / z);
          return clampPan({ x: newX, y: newY }, nextZoom);
        });
        return nextZoom;
      });
    }
  }, [clampPan, touchStart, zoom, initialPinchDist, initialPinchZoom]);

  const handleZoomChange = useCallback((newZoom: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setZoom((z) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      setPan((prev) => {
        const newX = centerX - (centerX - prev.x) * (nextZoom / z);
        const newY = centerY - (centerY - prev.y) * (nextZoom / z);
        return clampPan({ x: newX, y: newY }, nextZoom);
      });
      return nextZoom;
    });
  }, [clampPan]);

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
        {/* Crucial transparent rect to catch mouse drag events on empty SVG areas */}
        <rect width="100%" height="100%" fill="transparent" />
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

      {/* On-Screen Zoom / Pan Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 no-print">
        <div className="flex flex-col bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-glass-lg overflow-hidden">
          <button 
            className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors press"
            onClick={() => handleZoomChange(zoom + 0.2)}
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="h-[1px] w-full bg-[var(--border)]" />
          <button 
            className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors press"
            onClick={() => handleZoomChange(zoom - 0.2)}
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
        <button 
          className="p-3 bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-glass-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors press"
          onClick={() => {
            if (flatNodes.length > 0 && svgRef.current) {
              const rect = svgRef.current.getBoundingClientRect();
              const treeWidth = contentBounds.maxX - contentBounds.minX;
              const treeHeight = contentBounds.maxY - contentBounds.minY;
              const centerX = (rect.width - treeWidth) / 2 - contentBounds.minX;
              const centerY = Math.max(120, (rect.height - treeHeight) / 2 - contentBounds.minY);
              setPan(clampPan({ x: centerX, y: centerY }, 1));
              setZoom(1);
            }
          }}
          title="Recenter Tree"
        >
          <Target className="w-5 h-5" />
        </button>
      </div>

      {/* Polished Minimap */}
      {hasValidBounds && viewport.width > 0 && viewport.height > 0 && (allNodes.length > 12 || (contentBounds.maxX - contentBounds.minX) > viewport.width * 1.25) && (
        <div
          data-minimap="true"
          className="absolute bottom-24 left-4 sm:left-6 z-30 h-[120px] w-[180px] rounded-2xl border border-brand-500/20 bg-[var(--surface)]/70 p-2 backdrop-blur-xl shadow-glass-lg cursor-pointer overflow-hidden ring-1 ring-white/10 dark:ring-white/5 transition-all hover:border-brand-500/40"
          onMouseDown={(e) => handleMinimapJump(e.clientX, e.clientY)}
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-2xl shadow-inner-glow pointer-events-none" />
          
          {(() => {
            const mapWidth = 180;
            const mapHeight = 120;
            const mapPadding = 12;
            const contentWidth = contentBounds.maxX - contentBounds.minX;
            const contentHeight = contentBounds.maxY - contentBounds.minY;
            const scale = Math.min((mapWidth - mapPadding * 2) / contentWidth, (mapHeight - mapPadding * 2) / contentHeight);
            const viewX = (-pan.x / zoom - contentBounds.minX) * scale + mapPadding;
            const viewY = (-pan.y / zoom - contentBounds.minY) * scale + mapPadding;
            const viewW = (viewport.width / zoom) * scale;
            const viewH = (viewport.height / zoom) * scale;

            return (
              <svg className="h-full w-full drop-shadow-md" viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
                {allNodes.map((node) => (
                  <rect
                    key={`mini-${node.key}`}
                    x={(node.x - contentBounds.minX) * scale + mapPadding}
                    y={(node.y - contentBounds.minY) * scale + mapPadding}
                    width={Math.max(3, NODE_WIDTH * scale)}
                    height={Math.max(2.5, NODE_HEIGHT * scale)}
                    rx={3}
                    fill={selectedNodeId === node.person.id ? '#378ADD' : '#64748b'}
                    opacity={selectedNodeId === node.person.id ? 1 : 0.6}
                  />
                ))}
                <rect
                  x={viewX}
                  y={viewY}
                  width={Math.max(10, viewW)}
                  height={Math.max(8, viewH)}
                  rx={6}
                  fill="rgba(55, 138, 221, 0.1)"
                  stroke="#378ADD"
                  strokeWidth={1.5}
                />
              </svg>
            );
          })()}
        </div>
      )}
    </div>
  );
}
