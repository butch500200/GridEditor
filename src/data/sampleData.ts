/**
 * @fileoverview Sample machine definitions and recipes for testing
 *
 * Provides a set of example machines and recipes inspired by Endfield's
 * industrial automation theme. These serve as test data and examples
 * for the factory planner.
 */

import type { MachineDef, Recipe } from '../types';

/**
 * Power Pylon definition - used for power distribution
 * Pylons are 2x2 structures that relay power from the Automation Core
 */
export const PYLON_DEF: MachineDef = {
  id: 'pylon',
  name: 'Power Pylon',
  width: 2,
  height: 2,
  color: '#F5C518', // Yellow (Endfield theme)
  ports: [],
  powerConsumption: 0,
};

/**
 * Sample machine definitions representing various factory equipment
 *
 * Color scheme follows Endfield aesthetic:
 * - Primary machines: Blues and teals
 * - Processing: Oranges and yellows
 * - Logistics: Greens
 * - Special: Purples
 */
export const sampleMachineDefs: MachineDef[] = [
  // Basic Production Machines
  {
    id: 'miner-mk1',
    name: 'Miner Mk1',
    width: 2,
    height: 2,
    color: '#5D9CEC',
    powerConsumption: 2,
    ports: [
      { type: 'output', offsetX: 1, offsetY: 1, direction: 'E' },
    ],
  },
  {
    id: 'smelter-mk1',
    name: 'Smelter Mk1',
    width: 2,
    height: 3,
    color: '#FC6E51',
    powerConsumption: 4,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 1, direction: 'W' },
      { type: 'output', offsetX: 1, offsetY: 1, direction: 'E' },
    ],
  },
  {
    id: 'assembler-mk1',
    name: 'Assembler Mk1',
    width: 3,
    height: 3,
    color: '#48CFAD',
    powerConsumption: 6,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
      { type: 'input', offsetX: 0, offsetY: 2, direction: 'W' },
      { type: 'output', offsetX: 2, offsetY: 1, direction: 'E' },
    ],
  },
  {
    id: 'constructor-mk1',
    name: 'Constructor Mk1',
    width: 2,
    height: 2,
    color: '#A0D468',
    powerConsumption: 3,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
      { type: 'output', offsetX: 1, offsetY: 1, direction: 'E' },
    ],
  },
  // Advanced Machines
  {
    id: 'refinery-mk1',
    name: 'Refinery Mk1',
    width: 4,
    height: 3,
    color: '#AC92EC',
    powerConsumption: 8,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 1, direction: 'W' },
      { type: 'output', offsetX: 3, offsetY: 0, direction: 'E' },
      { type: 'output', offsetX: 3, offsetY: 2, direction: 'E' },
    ],
  },
  {
    id: 'chemical-plant',
    name: 'Chemical Plant',
    width: 3,
    height: 4,
    color: '#967ADC',
    powerConsumption: 7,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 1, direction: 'W' },
      { type: 'input', offsetX: 0, offsetY: 2, direction: 'W' },
      { type: 'output', offsetX: 2, offsetY: 1, direction: 'E' },
      { type: 'output', offsetX: 2, offsetY: 2, direction: 'E' },
    ],
  },
  // Logistics
  {
    id: 'splitter',
    name: 'Splitter',
    width: 1,
    height: 1,
    color: '#37BC9B',
    powerConsumption: 1,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
      { type: 'output', offsetX: 0, offsetY: 0, direction: 'N' },
      { type: 'output', offsetX: 0, offsetY: 0, direction: 'S' },
    ],
  },
  {
    id: 'merger',
    name: 'Merger',
    width: 1,
    height: 1,
    color: '#3BAFDA',
    powerConsumption: 1,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'N' },
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'S' },
      { type: 'output', offsetX: 0, offsetY: 0, direction: 'E' },
    ],
  },
  // Storage
  {
    id: 'storage-container',
    name: 'Storage Container',
    width: 2,
    height: 2,
    color: '#656D78',
    powerConsumption: 1,
    ports: [
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
      { type: 'output', offsetX: 1, offsetY: 1, direction: 'E' },
    ],
  },
  // Power
  {
    id: 'power-generator',
    name: 'Power Generator',
    width: 3,
    height: 2,
    color: '#F5C518',
    powerConsumption: 0, // Generators don't consume power
    ports: [
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
    ],
  },
];

/**
 * Sample recipes that can be assigned to machines
 */
export const sampleRecipes: Recipe[] = [
  // Mining recipes
  {
    id: 'mine-iron-ore',
    name: 'Mine Iron Ore',
    machineType: 'miner-mk1',
    duration: 1.0,
    inputs: [],
    outputs: [{ itemId: 'iron-ore', amount: 1 }],
  },
  {
    id: 'mine-copper-ore',
    name: 'Mine Copper Ore',
    machineType: 'miner-mk1',
    duration: 1.0,
    inputs: [],
    outputs: [{ itemId: 'copper-ore', amount: 1 }],
  },
  // Smelting recipes
  {
    id: 'smelt-iron-ingot',
    name: 'Smelt Iron Ingot',
    machineType: 'smelter-mk1',
    duration: 2.0,
    inputs: [{ itemId: 'iron-ore', amount: 1 }],
    outputs: [{ itemId: 'iron-ingot', amount: 1 }],
  },
  {
    id: 'smelt-copper-ingot',
    name: 'Smelt Copper Ingot',
    machineType: 'smelter-mk1',
    duration: 2.0,
    inputs: [{ itemId: 'copper-ore', amount: 1 }],
    outputs: [{ itemId: 'copper-ingot', amount: 1 }],
  },
  {
    id: 'smelt-steel-ingot',
    name: 'Smelt Steel Ingot',
    machineType: 'smelter-mk1',
    duration: 4.0,
    inputs: [{ itemId: 'iron-ingot', amount: 2 }],
    outputs: [{ itemId: 'steel-ingot', amount: 1 }],
  },
  // Constructor recipes
  {
    id: 'make-iron-plate',
    name: 'Iron Plate',
    machineType: 'constructor-mk1',
    duration: 1.5,
    inputs: [{ itemId: 'iron-ingot', amount: 1 }],
    outputs: [{ itemId: 'iron-plate', amount: 1 }],
  },
  {
    id: 'make-copper-wire',
    name: 'Copper Wire',
    machineType: 'constructor-mk1',
    duration: 1.0,
    inputs: [{ itemId: 'copper-ingot', amount: 1 }],
    outputs: [{ itemId: 'copper-wire', amount: 2 }],
  },
  {
    id: 'make-iron-rod',
    name: 'Iron Rod',
    machineType: 'constructor-mk1',
    duration: 1.0,
    inputs: [{ itemId: 'iron-ingot', amount: 1 }],
    outputs: [{ itemId: 'iron-rod', amount: 1 }],
  },
  // Assembler recipes
  {
    id: 'make-circuit-board',
    name: 'Circuit Board',
    machineType: 'assembler-mk1',
    duration: 3.0,
    inputs: [
      { itemId: 'copper-wire', amount: 4 },
      { itemId: 'iron-plate', amount: 2 },
    ],
    outputs: [{ itemId: 'circuit-board', amount: 1 }],
  },
  {
    id: 'make-reinforced-plate',
    name: 'Reinforced Plate',
    machineType: 'assembler-mk1',
    duration: 4.0,
    inputs: [
      { itemId: 'iron-plate', amount: 4 },
      { itemId: 'iron-rod', amount: 2 },
    ],
    outputs: [{ itemId: 'reinforced-plate', amount: 1 }],
  },
  // Refinery recipes
  {
    id: 'refine-crude-oil',
    name: 'Refine Crude Oil',
    machineType: 'refinery-mk1',
    duration: 5.0,
    inputs: [{ itemId: 'crude-oil', amount: 3 }],
    outputs: [
      { itemId: 'fuel', amount: 2 },
      { itemId: 'plastic', amount: 1 },
    ],
  },
  // Power generation
  {
    id: 'burn-fuel',
    name: 'Burn Fuel',
    machineType: 'power-generator',
    duration: 10.0,
    inputs: [{ itemId: 'fuel', amount: 1 }],
    outputs: [],
  },
];

/**
 * Initialize store with sample data
 *
 * @description Loads sample machine definitions and recipes into the store.
 * Call this on app startup to populate the factory planner with test data.
 *
 * @param store - The Zustand store instance
 *
 * @example
 * import { useStore } from './store/useStore';
 * import { initializeSampleData } from './data/sampleData';
 *
 * // In App component or initialization
 * useEffect(() => {
 *   initializeSampleData(useStore.getState());
 * }, []);
 */
export const initializeSampleData = (store: {
  addMachineDef: (def: MachineDef) => void;
  addRecipe: (recipe: Recipe) => void;
}): void => {
  sampleMachineDefs.forEach((def) => store.addMachineDef(def));
  sampleRecipes.forEach((recipe) => store.addRecipe(recipe));
  store.addMachineDef(PYLON_DEF);
};
