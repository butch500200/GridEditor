/**
 * @fileoverview Utility functions for grid logic, rotation, and dimensions
 */

import { Direction, Rotation, MachinePort, GridPosition } from '../types';

/**
 * Calculate effective dimensions of a machine after rotation
 * 
 * @param width - Original machine width
 * @param height - Original machine height
 * @param rotation - Rotation in degrees
 * @returns Object containing effective width and height
 */
export const getEffectiveDimensions = (
  width: number,
  height: number,
  rotation: Rotation
): { width: number; height: number } => {
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? height : width,
    height: isRotated ? width : height,
  };
};

/**
 * Calculate the rotated direction based on original direction and machine rotation
 * 
 * @param originalDirection - The original port direction
 * @param rotation - Machine rotation in degrees
 * @returns The effective direction
 */
export const getRotatedDirection = (
  originalDirection: Direction,
  rotation: Rotation
): Direction => {
  const directions: Direction[] = ['N', 'E', 'S', 'W'];
  const rotationSteps = rotation / 90;
  const originalIndex = directions.indexOf(originalDirection);
  const rotatedIndex = (originalIndex + rotationSteps) % 4;
  return directions[rotatedIndex];
};

/**
 * Calculate the rotated port position within the machine
 * 
 * @param port - Original port definition
 * @param machineWidth - Original machine width
 * @param machineHeight - Original machine height
 * @param rotation - Machine rotation in degrees
 * @returns Object containing rotated offsetX and offsetY
 */
export const getRotatedPortPosition = (
  port: Pick<MachinePort, 'offsetX' | 'offsetY'>,
  machineWidth: number,
  machineHeight: number,
  rotation: Rotation
): { offsetX: number; offsetY: number } => {
  if (rotation === 90) {
    return {
      offsetX: machineHeight - 1 - port.offsetY,
      offsetY: port.offsetX,
    };
  }
  if (rotation === 180) {
    return {
      offsetX: machineWidth - 1 - port.offsetX,
      offsetY: machineHeight - 1 - port.offsetY,
    };
  }
  if (rotation === 270) {
    return {
      offsetX: port.offsetY,
      offsetY: machineWidth - 1 - port.offsetX,
    };
  }
  return {
    offsetX: port.offsetX,
    offsetY: port.offsetY,
  };
};

/**
 * Convert direction shorthand to full label
 * 
 * @param dir - Direction code
 * @returns Human-readable direction name
 */
export const getDirectionLabel = (dir: Direction): string => {
  const labels: Record<Direction, string> = {
    N: 'North',
    E: 'East',
    S: 'South',
    W: 'West',
  };
  return labels[dir];
};

/**
 * Calculate a Manhattan path between two grid points, respecting port directions
 * and avoiding obstacles if provided.
 * 
 * @param start - Starting grid position
 * @param startDir - Direction the starting port faces
 * @param end - Ending grid position
 * @param endDir - Direction the ending port faces
 * @param obstacles - Optional set of grid coordinates ("x,y") to avoid
 * @param ignoreCells - Optional set of grid coordinates ("x,y") to allow even if in obstacles
 * @returns Array of grid positions defining the path
 */
export const calculateManhattanPath = (
  start: GridPosition,
  startDir: Direction,
  end: GridPosition,
  endDir: Direction,
  obstacles?: Set<string>,
  ignoreCells?: Set<string>
): GridPosition[] => {
  // 1. Calculate edges (boundary points) for visual connection to machine edge
  const startEdge = { ...start };
  if (startDir === 'N') startEdge.y -= 0.5;
  else if (startDir === 'E') startEdge.x += 0.5;
  else if (startDir === 'S') startEdge.y += 0.5;
  else if (startDir === 'W') startEdge.x -= 0.5;

  const endEdge = { ...end };
  if (endDir === 'N') endEdge.y -= 0.5;
  else if (endDir === 'E') endEdge.x += 0.5;
  else if (endDir === 'S') endEdge.y += 0.5;
  else if (endDir === 'W') endEdge.x -= 0.5;

  // 2. Determine entry/exit cells
  const first = { ...start };
  if (startDir === 'N') first.y--;
  else if (startDir === 'E') first.x++;
  else if (startDir === 'S') first.y++;
  else if (startDir === 'W') first.x--;

  const last = { ...end };
  if (endDir === 'N') last.y--;
  else if (endDir === 'E') last.x++;
  else if (endDir === 'S') last.y++;
  else if (endDir === 'W') last.x--;

  // If we have no obstacles or the start/end are same/adjacent, use simple logic
  if (!obstacles || (first.x === last.x && first.y === last.y)) {
    return simpleManhattanPath(startEdge, first, last, endEdge, start, end);
  }

  // 3. A* Pathfinding from 'first' to 'last'
  const path = findAStarPath(first, last, obstacles, ignoreCells);
  
  if (path.length === 0) {
    // Fallback to simple if no path found
    return simpleManhattanPath(startEdge, first, last, endEdge, start, end);
  }

  // Prepend startEdge and append endEdge
  return [startEdge, ...path, endEdge];
};

/**
 * Simple Manhattan routing fallback
 */
const simpleManhattanPath = (
  startEdge: GridPosition,
  first: GridPosition,
  last: GridPosition,
  endEdge: GridPosition,
  start: GridPosition,
  end: GridPosition
): GridPosition[] => {
  const path: GridPosition[] = [startEdge];
  const isPort = (p: GridPosition) => 
    (p.x === start.x && p.y === start.y) || 
    (p.x === end.x && p.y === end.y);

  if (!isPort(first)) path.push({ ...first });

  let current = { ...first };
  // Orthogonal movement
  while (current.x !== last.x) {
    current.x += current.x < last.x ? 1 : -1;
    if (!isPort(current)) path.push({ ...current });
  }
  while (current.y !== last.y) {
    current.y += current.y < last.y ? 1 : -1;
    if (!isPort(current)) path.push({ ...current });
  }

  if (!isPort(last)) {
    const finalCell = path[path.length - 1];
    if (finalCell.x !== last.x || finalCell.y !== last.y) {
      path.push({ ...last });
    }
  }

  if (path[path.length - 1].x !== endEdge.x || path[path.length - 1].y !== endEdge.y) {
    path.push(endEdge);
  }

  return deduplicatePath(path);
};

/**
 * A* search algorithm
 */
const findAStarPath = (
  start: GridPosition,
  target: GridPosition,
  obstacles: Set<string>,
  ignoreCells?: Set<string>
): GridPosition[] => {
  const openSet: GridPosition[] = [start];
  const openSetKeys = new Set<string>([`${start.x},${start.y}`]);
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, GridPosition>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const posKey = (p: GridPosition) => `${p.x},${p.y}`;
  const h = (p: GridPosition) => Math.abs(p.x - target.x) + Math.abs(p.y - target.y);

  gScore.set(posKey(start), 0);
  fScore.set(posKey(start), h(start));

  let iterations = 0;
  const maxIterations = 10000; // Safety limit to prevent infinite loops

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    // Sort by fScore
    openSet.sort((a, b) => (fScore.get(posKey(a)) || Infinity) - (fScore.get(posKey(b)) || Infinity));
    const current = openSet.shift()!;
    const currentKey = posKey(current);
    openSetKeys.delete(currentKey);
    closedSet.add(currentKey);

    if (current.x === target.x && current.y === target.y) {
      // Reconstruct path
      const result: GridPosition[] = [current];
      let currKey = posKey(current);
      while (cameFrom.has(currKey)) {
        const prev = cameFrom.get(currKey)!;
        result.unshift(prev);
        currKey = posKey(prev);
      }
      return result;
    }

    const neighbors: GridPosition[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      const nKey = posKey(neighbor);

      // Skip if already evaluated
      if (closedSet.has(nKey)) continue;

      // Check bounds - allow reasonable search space around any position
      if (neighbor.x < -50 || neighbor.x >= 150 || neighbor.y < -50 || neighbor.y >= 150) continue;

      // Check obstacles
      if (obstacles.has(nKey) && (!ignoreCells || !ignoreCells.has(nKey))) continue;

      const tentativeGScore = (gScore.get(posKey(current)) || 0) + 1;
      if (tentativeGScore < (gScore.get(nKey) || Infinity)) {
        cameFrom.set(nKey, current);
        gScore.set(nKey, tentativeGScore);
        fScore.set(nKey, tentativeGScore + h(neighbor));
        if (!openSetKeys.has(nKey)) {
          openSet.push(neighbor);
          openSetKeys.add(nKey);
        }
      }
    }
  }

  return [];
};

/**
 * Helper to remove consecutive duplicate points
 */
const deduplicatePath = (path: GridPosition[]): GridPosition[] => {
  return path.filter((p, i) => {
    if (i === 0) return true;
    return p.x !== path[i - 1].x || p.y !== path[i - 1].y;
  });
};
