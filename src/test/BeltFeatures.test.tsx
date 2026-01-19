import { describe, it, expect } from 'vitest';
import { calculateManhattanPath } from '../utils/gridUtils';
import { calculateConnectionRates } from '../utils/rateUtils';
import { MachineDef, Recipe, GridItem, Connection } from '../types';

describe('Belt Features', () => {
  describe('Pathfinding with Obstacle Avoidance', () => {
    it('should find a path around an obstacle', () => {
      // Start at (0,0) facing East, end at (4,0) facing West.
      // Obstacle at (2,0)
      const start = { x: 0, y: 0 };
      const startDir = 'E';
      const end = { x: 4, y: 0 };
      const endDir = 'W';
      const obstacles = new Set(['2,0']);

      const path = calculateManhattanPath(start, startDir, end, endDir, obstacles);
      
      // Path should not contain (2,0)
      const pathKeys = path.map(p => `${Math.floor(p.x)},${Math.floor(p.y)}`);
      expect(pathKeys).not.toContain('2,0');
      
      // It should still reach the target cells (startEdge and endEdge are 0.5 offsets, so we check integers)
      expect(pathKeys).toContain('1,0'); // Exit cell
      expect(pathKeys).toContain('3,0'); // Entry cell
    });

    it('should fallback to simple path if no path found', () => {
      const start = { x: 0, y: 0 };
      const startDir = 'E';
      const end = { x: 10, y: 0 };
      const endDir = 'W';
      // Box around start
      const obstacles = new Set(['1,0', '0,1', '1,1', '-1,0', '0,-1']);

      const path = calculateManhattanPath(start, startDir, end, endDir, obstacles);
      expect(path.length).toBeGreaterThan(0);
    });
  });

  describe('Throughput Calculation', () => {
    const minerDef: MachineDef = {
      id: 'miner',
      name: 'Miner',
      width: 1,
      height: 1,
      color: 'blue',
      ports: [{ type: 'output', offsetX: 0, offsetY: 0, direction: 'E' }],
    };

    const splitterDef: MachineDef = {
      id: 'splitter',
      name: 'Splitter',
      width: 1,
      height: 1,
      color: 'green',
      ports: [
        { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
        { type: 'output', offsetX: 0, offsetY: 0, direction: 'N' },
        { type: 'output', offsetX: 0, offsetY: 0, direction: 'S' },
      ],
    };

    const mergerDef: MachineDef = {
      id: 'merger',
      name: 'Merger',
      width: 1,
      height: 1,
      color: 'cyan',
      ports: [
        { type: 'input', offsetX: 0, offsetY: 0, direction: 'N' },
        { type: 'input', offsetX: 0, offsetY: 0, direction: 'S' },
        { type: 'output', offsetX: 0, offsetY: 0, direction: 'E' },
      ],
    };

    const ironRecipe: Recipe = {
      id: 'iron',
      name: 'Iron',
      machineType: 'miner',
      duration: 2,
      inputs: [],
      outputs: [{ itemId: 'iron-ore', amount: 1 }],
    };

    it('calculates production rate correctly (30/min)', () => {
      const gridItems: GridItem[] = [
        { id: 'm1', machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: 'iron' }
      ];
      const connections: Connection[] = [
        { id: 'c1', sourceItemId: 'm1', sourcePortIndex: 0, targetItemId: 'any', targetPortIndex: 0 }
      ];

      const rates = calculateConnectionRates(
        gridItems,
        connections,
        (id) => id === 'miner' ? minerDef : undefined,
        (id) => id === 'iron' ? ironRecipe : undefined
      );

      expect(rates['c1']).toBe(30); // 1 amount / 2 seconds = 0.5/s * 60 = 30/min
    });

    it('splits rate correctly via splitter', () => {
      const gridItems: GridItem[] = [
        { id: 'm1', machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: 'iron' },
        { id: 's1', machineDefId: 'splitter', x: 2, y: 0, rotation: 0, assignedRecipeId: null }
      ];
      const connections: Connection[] = [
        { id: 'c1', sourceItemId: 'm1', sourcePortIndex: 0, targetItemId: 's1', targetPortIndex: 0 },
        { id: 'c2', sourceItemId: 's1', sourcePortIndex: 1, targetItemId: 'any1', targetPortIndex: 0 },
        { id: 'c3', sourceItemId: 's1', sourcePortIndex: 2, targetItemId: 'any2', targetPortIndex: 0 }
      ];

      const rates = calculateConnectionRates(
        gridItems,
        connections,
        (id) => ({ miner: minerDef, splitter: splitterDef }[id as 'miner' | 'splitter']),
        (id) => id === 'iron' ? ironRecipe : undefined
      );

      expect(rates['c1']).toBe(30); // 30/min input
      expect(rates['c2']).toBe(15); // 30 / 2 outputs = 15/min
      expect(rates['c3']).toBe(15);
    });

    it('sums rate correctly via merger', () => {
      const gridItems: GridItem[] = [
        { id: 'm1', machineDefId: 'miner', x: 0, y: -1, rotation: 0, assignedRecipeId: 'iron' },
        { id: 'm2', machineDefId: 'miner', x: 0, y: 1, rotation: 0, assignedRecipeId: 'iron' },
        { id: 'merg1', machineDefId: 'merger', x: 2, y: 0, rotation: 0, assignedRecipeId: null }
      ];
      const connections: Connection[] = [
        { id: 'c1', sourceItemId: 'm1', sourcePortIndex: 0, targetItemId: 'merg1', targetPortIndex: 0 },
        { id: 'c2', sourceItemId: 'm2', sourcePortIndex: 0, targetItemId: 'merg1', targetPortIndex: 1 },
        { id: 'c3', sourceItemId: 'merg1', sourcePortIndex: 2, targetItemId: 'any', targetPortIndex: 0 }
      ];

      const rates = calculateConnectionRates(
        gridItems,
        connections,
        (id) => ({ miner: minerDef, merger: mergerDef }[id as 'miner' | 'merger']),
        (id) => id === 'iron' ? ironRecipe : undefined
      );

      expect(rates['c1']).toBe(30); // 30/min each
      expect(rates['c2']).toBe(30);
      expect(rates['c3']).toBe(60); // 30 + 30 = 60/min
    });
  });
});
