import type { GenerationColor, Person, Relationship, TreeNode } from '@/types';

// ============================================================
// String & Display Utilities
// ============================================================

/** Get initials from first and last name (e.g. "John Doe" → "JD") */
export function getInitials(firstName: string, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
}

/** Format an ISO date string to a human-readable format: "14 Mar 1938" */
export function formatDate(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Calculate age from birth date (and optional death date) */
export function calculateAge(birthDate: string, deathDate?: string | null): number {
  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Get year string from either birth_date or birth_year */
export function getYearDisplay(date: string | null, year: number | null): string {
  if (date) return new Date(date).getFullYear().toString();
  if (year) return year.toString();
  return '';
}

/** Get a date range string like "1938 – 2021" or "1938 – Present" */
export function getLifespan(person: Person): string {
  const birth = getYearDisplay(person.birth_date, person.birth_year);
  if (!birth) return '';
  if (!person.is_living && person.death_date) {
    const death = new Date(person.death_date).getFullYear().toString();
    return `${birth} – ${death}`;
  }
  if (!person.is_living) return `${birth} – ?`;
  return `${birth} – Present`;
}

// ============================================================
// Generation Colour System
// ============================================================

const GENERATION_COLORS: GenerationColor[] = [
  { bg: '#EEEDFE', fg: '#3C3489', ring: '#7F77DD' }, // great-grandparents (purple)
  { bg: '#E6F1FB', fg: '#0C447C', ring: '#378ADD' }, // grandparents (blue)
  { bg: '#E1F5EE', fg: '#085041', ring: '#1D9E75' }, // parents (green)
  { bg: '#E6F1FB', fg: '#185FA5', ring: '#185FA5' }, // self (brand blue)
  { bg: '#FAEEDA', fg: '#633806', ring: '#BA7517' }, // children (amber)
  { bg: '#FBEAF0', fg: '#72243E', ring: '#D4537E' }, // grandchildren (pink)
];

/** Get generation colour by level (0 = great-grandparent, 3 = self, 4 = child) */
export function getGenerationColor(level: number): GenerationColor {
  const clamped = Math.max(0, Math.min(level, GENERATION_COLORS.length - 1));
  return GENERATION_COLORS[clamped];
}

// ============================================================
// Tree Layout Algorithm
// ============================================================

/**
 * Build a tree layout with x,y coordinates for each person node.
 * Uses a simplified hierarchical layout:
 * 1. Find root nodes (persons with no parents in the dataset)
 * 2. Lay out top-down by generation
 * 3. Space siblings horizontally
 */
export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[]
): TreeNode[] {
  if (persons.length === 0) return [];

  // Build adjacency maps
  const childToParents = new Map<string, string[]>();
  const parentToChildren = new Map<string, string[]>();
  const personSpouses = new Map<string, string[]>();

  relationships.forEach((rel) => {
    if (rel.relationship_type === 'parent') {
      // person_id is the parent of related_person_id
      const children = parentToChildren.get(rel.person_id) || [];
      children.push(rel.related_person_id);
      parentToChildren.set(rel.person_id, children);

      const parents = childToParents.get(rel.related_person_id) || [];
      parents.push(rel.person_id);
      childToParents.set(rel.related_person_id, parents);
    } else if (rel.relationship_type === 'child') {
      // person_id is a child of related_person_id
      const parents = childToParents.get(rel.person_id) || [];
      parents.push(rel.related_person_id);
      childToParents.set(rel.person_id, parents);

      const children = parentToChildren.get(rel.related_person_id) || [];
      children.push(rel.person_id);
      parentToChildren.set(rel.related_person_id, children);
    } else if (rel.relationship_type === 'spouse') {
      const s1 = personSpouses.get(rel.person_id) || [];
      s1.push(rel.related_person_id);
      personSpouses.set(rel.person_id, s1);

      const s2 = personSpouses.get(rel.related_person_id) || [];
      s2.push(rel.person_id);
      personSpouses.set(rel.related_person_id, s2);
    }
  });

  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Find roots: persons with no parents in this dataset
  const roots = persons.filter((p) => {
    const parents = childToParents.get(p.id);
    return !parents || parents.length === 0;
  });

  // Deduplicate: if a spouse of a root is also a root, keep only one
  const rootSet = new Set(roots.map((r) => r.id));
  const processedRoots = new Set<string>();

  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 100;
  const H_GAP = 40; // horizontal gap between siblings
  const V_GAP = 80; // vertical gap between generations
  const SPOUSE_GAP = 20; // gap between spouses

  let currentX = 0;

  // Recursive function to build tree nodes
  function buildNode(personId: string, generation: number, visited: Set<string>): TreeNode | null {
    if (visited.has(personId)) return null;
    visited.add(personId);

    const person = personMap.get(personId);
    if (!person) return null;

    const spouseIds = (personSpouses.get(personId) || []).filter(
      (sid) => !visited.has(sid)
    );
    const spouses = spouseIds
      .map((sid) => personMap.get(sid))
      .filter(Boolean) as Person[];
    spouseIds.forEach((sid) => visited.add(sid));

    const childIds = parentToChildren.get(personId) || [];
    // Also include children of spouses
    spouseIds.forEach((sid) => {
      const sc = parentToChildren.get(sid) || [];
      sc.forEach((cid) => {
        if (!childIds.includes(cid)) childIds.push(cid);
      });
    });

    const childNodes: TreeNode[] = [];
    childIds.forEach((cid) => {
      const childNode = buildNode(cid, generation + 1, visited);
      if (childNode) childNodes.push(childNode);
    });

    // Calculate x position
    let x: number;
    if (childNodes.length > 0) {
      // Center above children
      const leftmost = childNodes[0].x;
      const rightmost = childNodes[childNodes.length - 1].x;
      x = (leftmost + rightmost) / 2;
    } else {
      x = currentX;
      currentX += NODE_WIDTH + H_GAP + spouses.length * (NODE_WIDTH + SPOUSE_GAP);
    }

    const y = generation * (NODE_HEIGHT + V_GAP);

    return {
      person,
      x,
      y,
      generation,
      children: childNodes,
      spouses,
      parentIds: childToParents.get(personId) || [],
    };
  }

  const treeNodes: TreeNode[] = [];
  const globalVisited = new Set<string>();

  // Build from each root
  roots.forEach((root) => {
    if (processedRoots.has(root.id)) return;
    processedRoots.add(root.id);

    const node = buildNode(root.id, 0, globalVisited);
    if (node) treeNodes.push(node);
  });

  // Handle orphan nodes (not connected to any root)
  persons.forEach((p) => {
    if (!globalVisited.has(p.id)) {
      const node = buildNode(p.id, 0, globalVisited);
      if (node) treeNodes.push(node);
    }
  });

  return treeNodes;
}

/** Flatten a tree of TreeNode into a flat array */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const flat: TreeNode[] = [];
  function walk(node: TreeNode) {
    flat.push(node);
    node.children.forEach(walk);
  }
  nodes.forEach(walk);
  return flat;
}

// ============================================================
// Misc
// ============================================================

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Relationship type display label */
export function relationshipLabel(type: string): string {
  const labels: Record<string, string> = {
    parent: 'Parent',
    child: 'Child',
    spouse: 'Spouse',
    sibling: 'Sibling',
    grandparent: 'Grandparent',
    grandchild: 'Grandchild',
    aunt_uncle: 'Aunt/Uncle',
    niece_nephew: 'Niece/Nephew',
    cousin: 'Cousin',
    other: 'Other',
  };
  return labels[type] || type;
}
