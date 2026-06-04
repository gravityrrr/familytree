import type { Person, Relationship, RelationshipType } from '@/types';

export interface GraphNode {
  person: Person;
  edges: { relatedPerson: Person; type: RelationshipType; rawRelation: Relationship }[];
}

export type FamilyGraph = Record<string, GraphNode>;

export interface PathStep {
  from: Person;
  to: Person;
  relationshipType: RelationshipType;
}

export interface RelationshipResult {
  path: PathStep[];
  englishTerm: string;
  teluguTerm: string;
  generationDistance: number;
  commonAncestor: Person | null;
}

/** Get the inverse relationship type */
function getInverseType(type: RelationshipType): RelationshipType {
  const inverses: Record<RelationshipType, RelationshipType> = {
    parent: 'child',
    child: 'parent',
    spouse: 'spouse',
    sibling: 'sibling',
    grandparent: 'grandchild',
    grandchild: 'grandparent',
    aunt_uncle: 'niece_nephew',
    niece_nephew: 'aunt_uncle',
    cousin: 'cousin',
    other: 'other',
  };
  return inverses[type] || 'other';
}

/** Build adjacency list from persons and relationships */
export function buildGraph(persons: Person[], relationships: Relationship[]): FamilyGraph {
  const graph: FamilyGraph = {};

  // Initialize nodes
  for (const p of persons) {
    graph[p.id] = { person: p, edges: [] };
  }

  const personMap = new Map(persons.map((p) => [p.id, p]));

  // Add edges (both directions to be safe)
  for (const r of relationships) {
    const from = personMap.get(r.person_id);
    const to = personMap.get(r.related_person_id);

    if (from && to) {
      // Forward edge
      if (!graph[from.id].edges.some((e) => e.relatedPerson.id === to.id && e.type === r.relationship_type)) {
        graph[from.id].edges.push({ relatedPerson: to, type: r.relationship_type, rawRelation: r });
      }
      
      // Inverse edge (in case it wasn't saved symmetrically in DB)
      const invType = getInverseType(r.relationship_type);
      if (!graph[to.id].edges.some((e) => e.relatedPerson.id === from.id && e.type === invType)) {
        graph[to.id].edges.push({ relatedPerson: from, type: invType, rawRelation: r });
      }
    }
  }

  return graph;
}

/** Find shortest path using BFS */
export function findShortestPath(graph: FamilyGraph, startId: string, endId: string): PathStep[] | null {
  if (startId === endId) return [];
  if (!graph[startId] || !graph[endId]) return null;

  const queue: { id: string; path: PathStep[] }[] = [{ id: startId, path: [] }];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    for (const edge of graph[id].edges) {
      if (!visited.has(edge.relatedPerson.id)) {
        const nextPath = [...path, { from: graph[id].person, to: edge.relatedPerson, relationshipType: edge.type }];
        
        if (edge.relatedPerson.id === endId) {
          return nextPath;
        }

        visited.add(edge.relatedPerson.id);
        queue.push({ id: edge.relatedPerson.id, path: nextPath });
      }
    }
  }

  return null;
}

/** Translate structural path to names */
export function calculateRelationshipTerms(path: PathStep[], startGender: string, endGender: string): { english: string; telugu: string } {
  if (!path || path.length === 0) return { english: 'Self', telugu: 'Self' };
  
  if (path.length === 1) {
    const step = path[0];
    if (step.relationshipType === 'parent') return endGender === 'male' ? { english: 'Father', telugu: 'Nanna' } : endGender === 'female' ? { english: 'Mother', telugu: 'Amma' } : { english: 'Parent', telugu: 'Parent' };
    if (step.relationshipType === 'child') return endGender === 'male' ? { english: 'Son', telugu: 'Koduku' } : endGender === 'female' ? { english: 'Daughter', telugu: 'Koothuru' } : { english: 'Child', telugu: 'Child' };
    if (step.relationshipType === 'sibling') return endGender === 'male' ? { english: 'Brother', telugu: 'Anna/Thamudu' } : endGender === 'female' ? { english: 'Sister', telugu: 'Akka/Chelli' } : { english: 'Sibling', telugu: 'Sibling' };
    if (step.relationshipType === 'spouse') return endGender === 'male' ? { english: 'Husband', telugu: 'Bhartha' } : endGender === 'female' ? { english: 'Wife', telugu: 'Bharya' } : { english: 'Spouse', telugu: 'Spouse' };
    if (step.relationshipType === 'grandparent') return endGender === 'male' ? { english: 'Grandfather', telugu: 'Thatha' } : endGender === 'female' ? { english: 'Grandmother', telugu: 'Ammamma/Nanamma' } : { english: 'Grandparent', telugu: 'Grandparent' };
    if (step.relationshipType === 'grandchild') return endGender === 'male' ? { english: 'Grandson', telugu: 'Manavadu' } : endGender === 'female' ? { english: 'Granddaughter', telugu: 'Manavaralu' } : { english: 'Grandchild', telugu: 'Grandchild' };
  }

  // Complex path mapping
  const types = path.map(p => p.relationshipType);
  
  // Parent's Sibling's Child = Cousin
  if (types.length === 3 && types[0] === 'parent' && types[1] === 'sibling' && types[2] === 'child') {
    return { english: 'Cousin', telugu: 'Bava/Maridi (if male) / Vadina/Maradalu (if female)' };
  }

  // Parent's Sibling = Uncle/Aunt
  if (types.length === 2 && types[0] === 'parent' && types[1] === 'sibling') {
    return endGender === 'male' ? { english: 'Uncle', telugu: 'Babai/Peddananna/Mamayya' } : { english: 'Aunt', telugu: 'Pinni/Peddamma/Atta' };
  }

  // Sibling's Child = Nephew/Niece
  if (types.length === 2 && types[0] === 'sibling' && types[1] === 'child') {
    return endGender === 'male' ? { english: 'Nephew', telugu: 'Alludu/Koduku' } : { english: 'Niece', telugu: 'Kodalu/Koothuru' };
  }

  // Fallback generic describer
  const engDesc = path.map(p => p.relationshipType).join("'s ");
  return { english: `Distant Relation (${engDesc})`, telugu: `Distant Relation` };
}

export function getGenerationDistance(path: PathStep[]): number {
  let dist = 0;
  for (const step of path) {
    if (step.relationshipType === 'parent' || step.relationshipType === 'aunt_uncle') dist += 1;
    else if (step.relationshipType === 'child' || step.relationshipType === 'niece_nephew') dist -= 1;
    else if (step.relationshipType === 'grandparent') dist += 2;
    else if (step.relationshipType === 'grandchild') dist -= 2;
  }
  return dist;
}
