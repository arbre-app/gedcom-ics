import {SelectionGedcom} from 'read-gedcom';

export const exploreAscending = (
  gedcom: SelectionGedcom,
  initialIndividuals: Set<string>,
  generations: number
): Set<string> => {
  let queue = [...initialIndividuals];
  const visited = new Set(initialIndividuals);
  for (let i = 0; i < generations; i++) {
    const nextQueue: string[] = [];
    queue.forEach(id => {
      const family = gedcom.getIndividualRecord(id).getFamilyAsChild();
      return [family.getHusband(), family.getWife()]
        .map(s => s.getIndividualRecord()[0]?.pointer)
        .filter((nextId): nextId is string => nextId != null)
        .filter(nextId => !visited.has(nextId))
        .forEach(nextId => {
          nextQueue.push(nextId);
          visited.add(nextId);
        });
    });
    queue = nextQueue;
  }
  return visited;
};

export const exploreDescending = (
  gedcom: SelectionGedcom,
  initialIndividuals: Set<string>
): Set<string> => {
  let queue = [...initialIndividuals];
  const visited = new Set(initialIndividuals);
  while (queue.length > 0) {
    const nextQueue: string[] = [];
    queue.forEach(id => {
      const family = gedcom.getIndividualRecord(id).getFamilyAsSpouse();
      [family.getHusband(), family.getWife()]
        .map(s => s.getIndividualRecord()[0]?.pointer)
        .filter((spouseId): spouseId is string => spouseId != null)
        .forEach(spouseId => visited.add(spouseId));
      return family
        .getChild()
        .arraySelect()
        .map(s => s.getIndividualRecord()[0]?.pointer)
        .filter((nextId): nextId is string => nextId != null)
        .filter(nextId => !visited.has(nextId))
        .forEach(nextId => {
          nextQueue.push(nextId);
          visited.add(nextId);
        });
    });
    queue = nextQueue;
  }
  return visited;
};

export const exploreAscendingDescending = (
  gedcom: SelectionGedcom,
  initialIndividuals: Set<string>,
  generations: number
): Set<string> =>
  exploreDescending(
    gedcom,
    exploreAscending(gedcom, initialIndividuals, generations)
  );
