'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Person, Relationship, TreeNode } from '@/types';
import { buildTreeLayout, flattenTree } from '@/lib/utils';
import { PersonNode } from './PersonNode';
import { RelationshipLine, LineGradientDefs } from './RelationshipLine';
import { Users, ZoomIn, ZoomOut, Target } from 'lucide-react';

interface TreeCanvasProps {
  persons: Person[];
  relationships: Relationship[];
  selfPersonId?: string | null;
  onAddRelationship?: (sourceId: string, targetId: string, type: string) => Promise<void>;
}

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

export function TreeCanvas({ persons, relationships, selfPersonId, onAddRelationship }: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const [linkDrag, setLinkDrag] = useState<{
    startNodeId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [linkModal, setLinkModal] = useState<{
    sourceId: string;
    targetId: string;
    x: number;
    y: number;
  } | null>(null);
  
  const [addingRelation, setAddingRelation] = useState(false);

  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  const treeNodes = buildTreeLayout(persons, relationships, selfPersonId ?? undefined);
  const flatNodes = flattenTree(treeNodes);

  const spouseNodes: RenderNode[] = [];
  const lines: React.ReactNode[] = [];

  // 1. Collect all spouse nodes and draw spouse lines
  function collectSpouses(node: TreeNode) {
    node.spouses.forEach((spouse, i) => {
      const sx = node.x + NODE_WIDTH + 20 + i * SPOUSE_GAP;
      spouseNodes.push({
        key: `sn-${node.person.id}-${spouse.id}`,
        person: spouse,
        x: sx,
        y: node.y,
        generation: node.generation,
      });
      lines.push(
        <RelationshipLine key={`s-${node.person.id}-${spouse.id}`}
          x1={node.x + NODE_WIDTH} y1={node.y + NODE_HEIGHT / 2} x2={sx} y2={node.y + NODE_HEIGHT / 2} type="spouse" />
      );
    });
    node.children.forEach(collectSpouses);
  }
  treeNodes.forEach(collectSpouses);

  const allNodes: RenderNode[] = [
    ...flatNodes.map((n) => ({ key: n.person.id, person: n.person, x: n.x, y: n.y, generation: n.generation })),
    ...spouseNodes,
  ];

  // Sort nodes so the hovered node is rendered last (on top)
  const sortedNodes = [...allNodes].sort((a, b) => {
    if (a.person.id === hoveredNodeId) return 1;
    if (b.person.id === hoveredNodeId) return -1;
    return 0;
  });

  // 2. Build maps from relationships for global line drawing
  const nodePos = new Map<string, { x: number, y: number }>();
  allNodes.forEach(n => nodePos.set(n.person.id, { x: n.x, y: n.y }));

  const childToParents = new Map<string, string[]>();
  const personSpouses = new Map<string, string[]>();

  relationships.forEach((rel) => {
    if (rel.relationship_type === 'parent') {
      const parents = childToParents.get(rel.person_id) || [];
      if (!parents.includes(rel.related_person_id)) parents.push(rel.related_person_id);
      childToParents.set(rel.person_id, parents);
    } else if (rel.relationship_type === 'child') {
      const parents = childToParents.get(rel.related_person_id) || [];
      if (!parents.includes(rel.person_id)) parents.push(rel.person_id);
      childToParents.set(rel.related_person_id, parents);
    } else if (rel.relationship_type === 'spouse') {
      const s1 = personSpouses.get(rel.person_id) || [];
      if (!s1.includes(rel.related_person_id)) s1.push(rel.related_person_id);
      personSpouses.set(rel.person_id, s1);

      const s2 = personSpouses.get(rel.related_person_id) || [];
      if (!s2.includes(rel.person_id)) s2.push(rel.person_id);
      personSpouses.set(rel.related_person_id, s2);
    }
  });

  // 3. Draw parent-child lines globally
  allNodes.forEach((childNode) => {
    const parents = childToParents.get(childNode.person.id) || [];
    if (parents.length === 0) return;

    const handledParents = new Set<string>();
    
    // Check if any two parents are spouses to draw a unified V-line
    if (parents.length >= 2) {
      for (let i = 0; i < parents.length; i++) {
        for (let j = i + 1; j < parents.length; j++) {
          const p1 = parents[i];
          const p2 = parents[j];
          if ((personSpouses.get(p1) || []).includes(p2)) {
            const pos1 = nodePos.get(p1);
            const pos2 = nodePos.get(p2);
            if (pos1 && pos2 && !handledParents.has(p1) && !handledParents.has(p2)) {
              // Midpoint of the spouse line
              const midX = (pos1.x + pos2.x + NODE_WIDTH) / 2;
              const midY = pos1.y + NODE_HEIGHT / 2;
              lines.push(
                <RelationshipLine key={`l-shared-${p1}-${p2}-${childNode.person.id}`}
                  x1={midX} y1={midY} x2={childNode.x + NODE_WIDTH / 2} y2={childNode.y} type="parent-child" />
              );
              handledParents.add(p1);
              handledParents.add(p2);
            }
          }
        }
      }
    }

    // Draw individual lines for any parents that weren't part of a spouse pair
    parents.forEach(p => {
      if (!handledParents.has(p)) {
        const pos = nodePos.get(p);
        if (pos) {
          lines.push(
            <RelationshipLine key={`l-${p}-${childNode.person.id}`}
              x1={pos.x + NODE_WIDTH / 2} y1={pos.y + NODE_HEIGHT} x2={childNode.x + NODE_WIDTH / 2} y2={childNode.y} type="parent-child" />
          );
        }
      }
    });
  });

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

    const padX = Math.min(vw * 0.8, (treeMaxX - treeMinX) * 0.8);
    const padY = Math.min(vh * 0.8, (treeMaxY - treeMinY) * 0.8);

    const minPanX = -treeMaxX + vw - padX;
    const maxPanX = -treeMinX + padX;
    const minPanY = -treeMaxY + vh - padY;
    const maxPanY = -treeMinY + padY;

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

  // Center on self node or tree center on first load
  const hasCentered = useRef(false);
  useEffect(() => {
    if (flatNodes.length > 0 && svgRef.current && !hasCentered.current) {
      hasCentered.current = true;
      const rect = svgRef.current.getBoundingClientRect();

      // Try to center on self node
      const selfNode = selfPersonId
        ? allNodes.find(n => n.person.id === selfPersonId)
        : null;

      if (selfNode) {
        const centerX = rect.width / 2 - (selfNode.x + NODE_WIDTH / 2);
        const centerY = rect.height / 2 - (selfNode.y + NODE_HEIGHT / 2);
        setPan(clampPan({ x: centerX, y: centerY }, 1));
      } else {
        const treeWidth = contentBounds.maxX - contentBounds.minX;
        const treeHeight = contentBounds.maxY - contentBounds.minY;
        const centerX = (rect.width - treeWidth) / 2 - contentBounds.minX;
        const centerY = Math.max(120, (rect.height - treeHeight) / 2 - contentBounds.minY);
        setPan(clampPan({ x: centerX, y: centerY }, 1));
      }
      setZoom(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatNodes.length]);

  useEffect(() => {
    if (!svgRef.current) return;

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
    if (linkModal) return;
    if ((e.target as Element).closest('[data-tree-node="true"]')) return;
    stopAnimation();
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velocityRef.current = { x: 0, y: 0 };
  }, [pan, stopAnimation, linkModal]);

  const handleLinkStart = useCallback((e: React.MouseEvent, personId: string) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    setLinkDrag({
      startNodeId: personId,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  }, [pan, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      
      if (linkDrag) {
        setLinkDrag(prev => prev ? {
          ...prev,
          currentX: (e.clientX - rect.left - pan.x) / zoom,
          currentY: (e.clientY - rect.top - pan.y) / zoom,
        } : null);
        return;
      }
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

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (linkDrag) {
      const nodeEl = (e.target as Element).closest('[data-tree-node="true"]');
      if (nodeEl) {
        const targetId = nodeEl.getAttribute('data-person-id');
        if (targetId && targetId !== linkDrag.startNodeId) {
          // Open Modal
          if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            setLinkModal({
              sourceId: linkDrag.startNodeId,
              targetId,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }
        }
      }
      setLinkDrag(null);
      return;
    }

    if (dragging) {
      const velocity = Math.hypot(velocityRef.current.x, velocityRef.current.y);
      if (velocity > 0.08) startInertia();
    }
    setDragging(false);
    lastMoveRef.current = null;
  }, [dragging, startInertia, linkDrag]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    stopAnimation();
    const isPinch = e.ctrlKey || e.metaKey;

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
  }, [clampPan, stopAnimation]);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number | null>(null);

  const getPinchDistance = (touches: React.TouchList) => {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
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
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
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

  const centerOnSelf = useCallback(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    const selfNode = selfPersonId ? allNodes.find(n => n.person.id === selfPersonId) : null;

    if (selfNode) {
      const target = clampPan({
        x: rect.width / 2 - (selfNode.x + NODE_WIDTH / 2),
        y: rect.height / 2 - (selfNode.y + NODE_HEIGHT / 2),
      }, 1);
      setPan(target);
      setZoom(1);
      setSelectedNodeId(selfNode.person.id);
    } else if (flatNodes.length > 0) {
      const treeWidth = contentBounds.maxX - contentBounds.minX;
      const treeHeight = contentBounds.maxY - contentBounds.minY;
      const centerX = (rect.width - treeWidth) / 2 - contentBounds.minX;
      const centerY = Math.max(120, (rect.height - treeHeight) / 2 - contentBounds.minY);
      setPan(clampPan({ x: centerX, y: centerY }, 1));
      setZoom(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfPersonId, clampPan, flatNodes.length]);

  const centerNode = useCallback((node: { x: number; y: number; person: Person }) => {
    if (!svgRef.current) return;

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
    if (!hasValidBounds || !svgRef.current || viewport.width === 0 || viewport.height === 0) return;

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
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-5 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center border border-[var(--border)]">
          <Users className="w-10 h-10 text-[var(--text-muted)]/40" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-[var(--text-muted)]">No one here yet</p>
          <p className="text-sm text-[var(--text-muted)]/70 mt-1">Add your first family member to start building</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none">
      <svg ref={svgRef} className="absolute inset-0 w-full h-full cursor-crosshair" style={{ touchAction: 'none' }}
        onMouseEnter={() => setCursorVisible(true)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={(e) => {
          if ((e.target as Element).closest('[data-tree-node="true"]')) return;
          centerOnSelf();
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
        <rect width="100%" height="100%" fill="transparent" />
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {lines}
          {sortedNodes.map((n) => (
            <PersonNode
              key={n.key}
              person={n.person}
              x={n.x}
              y={n.y}
              generation={n.generation}
              isSelf={n.person.id === selfPersonId}
              selected={selectedNodeId === n.person.id}
              isHovered={hoveredNodeId === n.person.id}
              onHoverChange={(h) => setHoveredNodeId(h ? n.person.id : null)}
              onNodeDoubleClick={() => centerNode(n)}
              onLinkStart={handleLinkStart}
            />
          ))}
          {/* Active Link Drag Line */}
          {linkDrag && (
            <path 
              d={`M ${linkDrag.startX} ${linkDrag.startY} Q ${linkDrag.startX} ${(linkDrag.startY + linkDrag.currentY)/2} ${linkDrag.currentX} ${linkDrag.currentY}`}
              fill="none"
              stroke="#378ADD"
              strokeWidth={3}
              strokeDasharray="6 6"
              className="animate-dash"
            />
          )}
        </g>
      </svg>
      
      {/* Link Type Modal */}
      {linkModal && (
        <>
          <div className="absolute inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setLinkModal(null)} />
          <div 
            className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 w-56 animate-scale-in"
            style={{ 
              left: Math.min(linkModal.x + 10, viewport.width - 240), 
              top: Math.min(linkModal.y + 10, viewport.height - 200) 
            }}
          >
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Add Relationship</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { type: 'parent', label: 'Parent' },
                { type: 'child', label: 'Child' },
                { type: 'spouse', label: 'Spouse' },
                { type: 'sibling', label: 'Sibling' }
              ].map((rel) => (
                <button
                  key={rel.type}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/20 transition-colors"
                  onClick={async () => {
                    if (onAddRelationship) {
                      setAddingRelation(true);
                      await onAddRelationship(linkModal.sourceId, linkModal.targetId, rel.type);
                      setAddingRelation(false);
                    }
                    setLinkModal(null);
                  }}
                  disabled={addingRelation}
                >
                  {rel.label}
                </button>
              ))}
            </div>
            {addingRelation && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center rounded-xl"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        </>
      )}

      {cursorVisible && (
        <div
          className="pointer-events-none absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-500/70 bg-brand-400/10"
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500" />
        </div>
      )}

      {/* Zoom Controls */}
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
          onClick={centerOnSelf}
          title="Center on Me"
        >
          <Target className="w-5 h-5" />
        </button>
      </div>

      {/* Minimap */}
      {hasValidBounds && viewport.width > 0 && viewport.height > 0 && (allNodes.length > 12 || (contentBounds.maxX - contentBounds.minX) > viewport.width * 1.25) && (
        <div
          data-minimap="true"
          className="absolute bottom-24 left-4 sm:left-6 z-30 h-[120px] w-[180px] rounded-2xl border border-brand-500/20 bg-[var(--surface)]/70 p-2 backdrop-blur-xl shadow-glass-lg cursor-pointer overflow-hidden ring-1 ring-white/10 dark:ring-white/5 transition-all hover:border-brand-500/40"
          onMouseDown={(e) => handleMinimapJump(e.clientX, e.clientY)}
        >
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
                    fill={node.person.id === selfPersonId ? '#185FA5' : selectedNodeId === node.person.id ? '#378ADD' : '#64748b'}
                    opacity={node.person.id === selfPersonId || selectedNodeId === node.person.id ? 1 : 0.6}
                  />
                ))}
                <rect
                  x={viewX} y={viewY}
                  width={Math.max(10, viewW)} height={Math.max(8, viewH)}
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
