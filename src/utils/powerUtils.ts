/**
 * @fileoverview Power/electricity system utilities
 *
 * Handles power distribution calculations from the Automation Core
 * through pylons to machines.
 */

import { POWER_RANGE } from '../constants';
import type { GridItem, MachineDef, AutomationCore } from '../types';

/**
 * Calculate minimum edge-to-edge Chebyshev distance between two bounding boxes.
 * This is the "within X cells including diagonals" distance.
 *
 * @param x1 - X position of first box
 * @param y1 - Y position of first box
 * @param w1 - Width of first box
 * @param h1 - Height of first box
 * @param x2 - X position of second box
 * @param y2 - Y position of second box
 * @param w2 - Width of second box
 * @param h2 - Height of second box
 * @returns Whether the boxes are within POWER_RANGE cells of each other
 */
export const isWithinPowerRange = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean => {
  // Calculate edge-to-edge distance
  // If boxes overlap or touch, distance is 0
  const dx = Math.max(0, Math.max(x1, x2) - Math.min(x1 + w1, x2 + w2));
  const dy = Math.max(0, Math.max(y1, y2) - Math.min(y1 + h1, y2 + h2));

  // Chebyshev distance (max of dx, dy)
  return Math.max(dx, dy) <= POWER_RANGE;
};

/**
 * Result of power calculation
 */
export interface PowerResult {
  /** Set of pylon IDs that are connected to the automation core */
  connectedPylonIds: Set<string>;
  /** Set of machine IDs that are powered */
  poweredMachineIds: Set<string>;
}

/**
 * Calculate which machines are powered by tracing connections from
 * the Automation Core through pylons to machines.
 *
 * Algorithm (BFS):
 * 1. Find all pylons within range of the automation core -> add to connected set
 * 2. For each newly connected pylon, find more pylons within range
 * 3. Repeat until no new pylons found
 * 4. For each connected pylon, find machines within range
 *
 * @param pylons - Array of pylon grid items
 * @param machines - Array of non-pylon machine grid items with their dimensions
 * @param automationCore - The automation core bounds
 * @param getMachineDefById - Function to lookup machine definitions
 * @returns Set of powered machine IDs
 */
export function calculatePoweredMachines(
  pylons: GridItem[],
  machines: GridItem[],
  automationCore: AutomationCore,
  getMachineDefById?: (id: string) => MachineDef | undefined
): PowerResult {
  const connectedPylonIds = new Set<string>();
  const poweredMachineIds = new Set<string>();

  // Queue for BFS - start with pylons that can connect to the core
  const queue: GridItem[] = [];

  // Find pylons within range of automation core
  for (const pylon of pylons) {
    if (
      isWithinPowerRange(
        automationCore.x,
        automationCore.y,
        automationCore.width,
        automationCore.height,
        pylon.x,
        pylon.y,
        2, // Pylons are 2x2
        2
      )
    ) {
      connectedPylonIds.add(pylon.id);
      queue.push(pylon);
    }
  }

  // BFS to find all connected pylons
  while (queue.length > 0) {
    const currentPylon = queue.shift()!;

    for (const pylon of pylons) {
      if (connectedPylonIds.has(pylon.id)) continue;

      if (
        isWithinPowerRange(
          currentPylon.x,
          currentPylon.y,
          2,
          2,
          pylon.x,
          pylon.y,
          2,
          2
        )
      ) {
        connectedPylonIds.add(pylon.id);
        queue.push(pylon);
      }
    }
  }

  // Now find all machines within range of connected pylons
  for (const machine of machines) {
    // Get actual machine dimensions from definition, fallback to 2x2
    const machineDef = getMachineDefById?.(machine.machineDefId);
    const machineWidth = machineDef?.width ?? 2;
    const machineHeight = machineDef?.height ?? 2;

    for (const pylonId of connectedPylonIds) {
      const pylon = pylons.find((p) => p.id === pylonId);
      if (!pylon) continue;

      if (
        isWithinPowerRange(
          pylon.x,
          pylon.y,
          2,
          2,
          machine.x,
          machine.y,
          machineWidth,
          machineHeight
        )
      ) {
        poweredMachineIds.add(machine.id);
        break; // Machine is powered, no need to check other pylons
      }
    }
  }

  return {
    connectedPylonIds,
    poweredMachineIds,
  };
}
