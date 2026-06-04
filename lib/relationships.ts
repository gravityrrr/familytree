import type { Person, Relationship, RelationshipType } from '@/types';

function isOlder(a: Person, b: Person): boolean {
  if (a.birth_date && b.birth_date) return new Date(a.birth_date) < new Date(b.birth_date);
  if (a.birth_year && b.birth_year) return a.birth_year < b.birth_year;
  if (a.birth_year && b.birth_date) return a.birth_year < new Date(b.birth_date).getFullYear();
  if (a.birth_date && b.birth_year) return new Date(a.birth_date).getFullYear() < b.birth_year;
  return false;
}

export function inferTeluguRelationship(
  source: Person,
  target: Person,
  persons: Person[],
  relationships: Relationship[]
): { type: RelationshipType; label: string } | null {
  const personMap = new Map(persons.map((p) => [p.id, p]));
  const adj = new Map<
    string,
    { parents: string[]; children: string[]; spouses: string[]; siblings: string[] }
  >();

  for (const p of persons) {
    adj.set(p.id, { parents: [], children: [], spouses: [], siblings: [] });
  }

  for (const r of relationships) {
    const s = adj.get(r.person_id);
    const t = adj.get(r.related_person_id);
    if (!s || !t) continue;

    if (r.relationship_type === 'parent') {
      if (!s.parents.includes(r.related_person_id)) s.parents.push(r.related_person_id);
      if (!t.children.includes(r.person_id)) t.children.push(r.person_id);
    } else if (r.relationship_type === 'child') {
      if (!s.children.includes(r.related_person_id)) s.children.push(r.related_person_id);
      if (!t.parents.includes(r.person_id)) t.parents.push(r.person_id);
    } else if (r.relationship_type === 'spouse') {
      if (!s.spouses.includes(r.related_person_id)) s.spouses.push(r.related_person_id);
      if (!t.spouses.includes(r.person_id)) t.spouses.push(r.person_id);
    } else if (r.relationship_type === 'sibling') {
      if (!s.siblings.includes(r.related_person_id)) s.siblings.push(r.related_person_id);
      if (!t.siblings.includes(r.person_id)) t.siblings.push(r.person_id);
    }
  }

  // BFS
  const queue: { id: string; path: string[]; edges: string[] }[] = [
    { id: source.id, path: [source.id], edges: [] },
  ];
  const visited = new Set<string>([source.id]);

  let foundPath: { path: string[]; edges: string[] } | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.id === target.id) {
      foundPath = current;
      break;
    }
    if (current.edges.length >= 5) continue; // limit depth to 5

    const links = adj.get(current.id)!;
    
    // Go UP
    for (const pid of links.parents) {
      if (!visited.has(pid)) {
        visited.add(pid);
        queue.push({ id: pid, path: [...current.path, pid], edges: [...current.edges, 'UP'] });
      }
    }
    // Go SIB
    for (const sid of links.siblings) {
      if (!visited.has(sid)) {
        visited.add(sid);
        queue.push({ id: sid, path: [...current.path, sid], edges: [...current.edges, 'UP', 'DOWN'] }); // Normalize sibling edge
      }
    }
    // Go SIDE
    for (const sid of links.spouses) {
      if (!visited.has(sid)) {
        visited.add(sid);
        queue.push({ id: sid, path: [...current.path, sid], edges: [...current.edges, 'SIDE'] });
      }
    }
    // Go DOWN
    for (const cid of links.children) {
      if (!visited.has(cid)) {
        visited.add(cid);
        queue.push({ id: cid, path: [...current.path, cid], edges: [...current.edges, 'DOWN'] });
      }
    }
  }

  if (!foundPath) return null;

  const edgeStr = foundPath.edges.join(',');
  const pNodes = foundPath.path.map((id) => personMap.get(id)!);

  switch (edgeStr) {
    case 'UP': {
      if (target.gender === 'male') return { type: 'parent', label: 'Nanna / Thandri' };
      if (target.gender === 'female') return { type: 'parent', label: 'Amma' };
      return { type: 'parent', label: 'Parent' };
    }
    case 'DOWN': {
      if (target.gender === 'male') return { type: 'child', label: 'Koduku' };
      if (target.gender === 'female') return { type: 'child', label: 'Koothuru' };
      return { type: 'child', label: 'Child' };
    }
    case 'SIDE': {
      if (target.gender === 'male') return { type: 'spouse', label: 'Bhartha' };
      if (target.gender === 'female') return { type: 'spouse', label: 'Bharya' };
      return { type: 'spouse', label: 'Spouse' };
    }
    case 'UP,DOWN':
    case 'UP,SIDE,DOWN': {
      // Sibling / Half-Sibling
      const older = isOlder(target, source);
      if (target.gender === 'male') return { type: 'sibling', label: older ? 'Anna' : 'Thammudu' };
      if (target.gender === 'female') return { type: 'sibling', label: older ? 'Akka' : 'Chelli' };
      return { type: 'sibling', label: 'Sibling' };
    }
    case 'UP,UP': {
      // Grandparent
      const parent = pNodes[1];
      if (parent.gender === 'male') {
        if (target.gender === 'male') return { type: 'grandparent', label: 'Thatha (Nayanamma Husband)' };
        if (target.gender === 'female') return { type: 'grandparent', label: 'Nayanamma' };
      } else if (parent.gender === 'female') {
        if (target.gender === 'male') return { type: 'grandparent', label: 'Thatha (Ammamma Husband)' };
        if (target.gender === 'female') return { type: 'grandparent', label: 'Ammamma' };
      }
      return { type: 'grandparent', label: 'Grandparent' };
    }
    case 'DOWN,DOWN': {
      // Grandchild
      if (target.gender === 'male') return { type: 'grandchild', label: 'Manavadu' };
      if (target.gender === 'female') return { type: 'grandchild', label: 'Manavaralu' };
      return { type: 'grandchild', label: 'Grandchild' };
    }
    case 'UP,UP,DOWN': {
      // Aunt/Uncle
      const parent = pNodes[1];
      const older = isOlder(target, parent);
      if (parent.gender === 'male') {
        if (target.gender === 'male') return { type: 'aunt_uncle', label: older ? 'Peddananna' : 'Babai' };
        if (target.gender === 'female') return { type: 'aunt_uncle', label: 'Attha (Menatha)' };
      } else if (parent.gender === 'female') {
        if (target.gender === 'male') return { type: 'aunt_uncle', label: 'Mamayya / Mava (Menamama)' };
        if (target.gender === 'female') return { type: 'aunt_uncle', label: older ? 'Peddamma' : 'Pinni' };
      }
      return { type: 'aunt_uncle', label: 'Aunt/Uncle' };
    }
    case 'UP,DOWN,DOWN': {
      // Niece/Nephew
      const siblingNode = pNodes[2];
      const isCross = source.gender !== siblingNode.gender;
      if (isCross) {
        if (target.gender === 'male') return { type: 'niece_nephew', label: 'Alludu' };
        if (target.gender === 'female') return { type: 'niece_nephew', label: 'Kodalu' };
      } else {
        if (target.gender === 'male') return { type: 'niece_nephew', label: 'Koduku (Nephew)' };
        if (target.gender === 'female') return { type: 'niece_nephew', label: 'Koothuru (Niece)' };
      }
      return { type: 'niece_nephew', label: 'Niece/Nephew' };
    }
    case 'UP,UP,DOWN,DOWN': {
      // Cousin
      const parent = pNodes[1];
      const parentSibling = pNodes[3];
      const isCross = parent.gender !== parentSibling.gender;
      const older = isOlder(target, source);
      
      if (isCross) {
        if (target.gender === 'male') return { type: 'cousin', label: older ? 'Bava' : 'Maridi (Bammardi)' };
        if (target.gender === 'female') return { type: 'cousin', label: older ? 'Vadina' : 'Maradalu' };
      } else {
        if (target.gender === 'male') return { type: 'cousin', label: older ? 'Anna' : 'Thammudu' };
        if (target.gender === 'female') return { type: 'cousin', label: older ? 'Akka' : 'Chelli' };
      }
      return { type: 'cousin', label: 'Cousin' };
    }
    case 'SIDE,UP': {
      // Spouse's Parent (Parent-in-law)
      if (target.gender === 'male') return { type: 'parent', label: 'Mamayya / Mava' };
      if (target.gender === 'female') return { type: 'parent', label: 'Attha' };
      return { type: 'parent', label: 'Parent-in-Law' };
    }
    case 'DOWN,SIDE': {
      // Child's Spouse (Child-in-law)
      if (target.gender === 'male') return { type: 'child', label: 'Alludu' };
      if (target.gender === 'female') return { type: 'child', label: 'Kodalu' };
      return { type: 'child', label: 'Child-in-Law' };
    }
    case 'UP,DOWN,SIDE': // Sibling's Spouse
    case 'SIDE,UP,DOWN': { // Spouse's Sibling
      const older = isOlder(target, source);
      if (target.gender === 'male') return { type: 'sibling', label: older ? 'Bava' : 'Maridi (Bammardi)' };
      if (target.gender === 'female') return { type: 'sibling', label: older ? 'Vadina' : 'Maradalu' };
      return { type: 'sibling', label: 'In-Law' };
    }

    // --- NEW EXTENDED KINSHIP CASES ---

    case 'UP,UP,UP': {
      // Great-Grandparent
      if (target.gender === 'male') return { type: 'grandparent', label: 'Mutthatha' };
      if (target.gender === 'female') return { type: 'grandparent', label: 'Mutthavva' };
      return { type: 'grandparent', label: 'Great-Grandparent' };
    }
    case 'DOWN,DOWN,DOWN': {
      // Great-Grandchild
      if (target.gender === 'male') return { type: 'grandchild', label: 'Mummanavadu' };
      if (target.gender === 'female') return { type: 'grandchild', label: 'Mummanavaralu' };
      return { type: 'grandchild', label: 'Great-Grandchild' };
    }
    case 'SIDE,UP,UP': {
      // Spouse's Grandparents
      const parentInLaw = pNodes[2];
      if (parentInLaw.gender === 'male') {
        if (target.gender === 'male') return { type: 'grandparent', label: 'Thatha' };
        if (target.gender === 'female') return { type: 'grandparent', label: 'Nayanamma' };
      } else {
        if (target.gender === 'male') return { type: 'grandparent', label: 'Thatha' };
        if (target.gender === 'female') return { type: 'grandparent', label: 'Ammamma' };
      }
      return { type: 'grandparent', label: 'Grandparent-in-Law' };
    }
    case 'UP,UP,UP,DOWN': {
      // Great Aunt/Uncle (Grandparent's Sibling)
      if (target.gender === 'male') return { type: 'grandparent', label: 'Thatha (Great-Uncle)' };
      if (target.gender === 'female') return { type: 'grandparent', label: 'Nayanamma / Ammamma (Great-Aunt)' };
      return { type: 'grandparent', label: 'Great Aunt/Uncle' };
    }
    case 'UP,UP,DOWN,SIDE': {
      // Aunt/Uncle's Spouse
      const parent = pNodes[1];
      const bloodAuntUncle = pNodes[2]; // UP, UP, DOWN -> Aunt/Uncle
      const older = isOlder(bloodAuntUncle, parent); // relative to parent!
      const isCross = parent.gender !== bloodAuntUncle.gender;

      if (isCross) {
        if (target.gender === 'male') return { type: 'aunt_uncle', label: 'Mamayya / Mava' };
        if (target.gender === 'female') return { type: 'aunt_uncle', label: 'Attha' };
      } else {
        if (target.gender === 'male') return { type: 'aunt_uncle', label: older ? 'Peddananna' : 'Babai' };
        if (target.gender === 'female') return { type: 'aunt_uncle', label: older ? 'Peddamma' : 'Pinni' };
      }
      return { type: 'aunt_uncle', label: 'Aunt/Uncle-in-Law' };
    }
    case 'SIDE,UP,DOWN,SIDE': {
      // Co-Siblings-in-law (Wife's Sister's Husband / Husband's Brother's Wife)
      if (source.gender === 'male' && target.gender === 'male') {
        return { type: 'sibling', label: 'Todalludu (Co-Brother)' };
      }
      if (source.gender === 'female' && target.gender === 'female') {
        return { type: 'sibling', label: 'Todikodalu (Co-Sister)' };
      }
      return { type: 'sibling', label: 'Co-sibling-in-law' };
    }
    case 'UP,UP,DOWN,DOWN,SIDE': {
      // Cousin's Spouse
      const parent = pNodes[1];
      const parentSibling = pNodes[3];
      const isCross = parent.gender !== parentSibling.gender;
      const bloodCousin = pNodes[4];
      const older = isOlder(bloodCousin, source);
      
      // If cousin is cross (Bava/Vadina), their spouse is treated like parallel (Anna/Akka)
      if (isCross) {
        if (target.gender === 'male') return { type: 'cousin', label: older ? 'Anna' : 'Thammudu' };
        if (target.gender === 'female') return { type: 'cousin', label: older ? 'Akka' : 'Chelli' };
      } else {
        // If cousin is parallel (Anna/Akka), their spouse is treated like cross (Bava/Vadina)
        if (target.gender === 'male') return { type: 'cousin', label: older ? 'Bava' : 'Maridi (Bammardi)' };
        if (target.gender === 'female') return { type: 'cousin', label: older ? 'Vadina' : 'Maradalu' };
      }
      return { type: 'cousin', label: 'Cousin-in-Law' };
    }
    case 'SIDE,UP,UP,DOWN,DOWN': {
      // Spouse's Cousin
      const spouseParent = pNodes[2];
      const spouseParentSibling = pNodes[4];
      const isCross = spouseParent.gender !== spouseParentSibling.gender;
      const bloodCousin = pNodes[5];
      const older = isOlder(bloodCousin, pNodes[1]); // relative to spouse
      
      if (isCross) {
        if (target.gender === 'male') return { type: 'cousin', label: older ? 'Anna' : 'Thammudu' };
        if (target.gender === 'female') return { type: 'cousin', label: older ? 'Akka' : 'Chelli' };
      } else {
        if (target.gender === 'male') return { type: 'cousin', label: older ? 'Bava' : 'Maridi (Bammardi)' };
        if (target.gender === 'female') return { type: 'cousin', label: older ? 'Vadina' : 'Maradalu' };
      }
      return { type: 'cousin', label: 'Spouse\'s Cousin' };
    }
  }

  return null;
}
