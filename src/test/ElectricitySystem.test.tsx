import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { AUTOMATION_CORE_CONFIG, POWER_RANGE } from '../constants';
import { isWithinPowerRange, calculatePoweredMachines } from '../utils/powerUtils';
import { PYLON_DEF } from '../data/sampleData';
import { MachineDef, AutomationCore } from '../types';

describe('Electricity System', () => {
  const testMachine: MachineDef = {
    id: 'test-machine',
    name: 'Test Machine',
    width: 2,
    height: 2,
    color: '#FF0000',
    ports: [],
    powerConsumption: 10,
  };

  const automationCore: AutomationCore = {
    x: AUTOMATION_CORE_CONFIG.X,
    y: AUTOMATION_CORE_CONFIG.Y,
    width: AUTOMATION_CORE_CONFIG.WIDTH,
    height: AUTOMATION_CORE_CONFIG.HEIGHT,
  };

  beforeEach(() => {
    useStore.setState({
      machineDefs: [],
      gridItems: [],
      connections: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
    });
    useStore.getState().addMachineDef(PYLON_DEF);
    useStore.getState().addMachineDef(testMachine);
  });

  it('should have POWER_RANGE constant of 3', () => {
    expect(POWER_RANGE).toBe(3);
  });

  it('VISUAL TEST: 2x2 pylon at (10,10) should power machines at specific distances', () => {
    const { placeGridItem } = useStore.getState();

    // Pylon at (10,10) - occupies cells (10,10) to (11,11)
    const pylonId = placeGridItem({
      machineDefId: 'pylon',
      x: 10,
      y: 10,
      rotation: 0,
      assignedRecipeId: null,
    });

    // Test machines at different positions
    // Machine directly to the right with 3 cell gap
    // Pylon ends at x=11, machine starts at x=15, gap = 15-12 = 3 cells
    const machine3Gap = placeGridItem({
      machineDefId: 'test-machine',
      x: 15,
      y: 10,
      rotation: 0,
      assignedRecipeId: null,
    });

    // Machine directly to the right with 4 cell gap (should NOT be powered)
    // Pylon ends at x=11, machine starts at x=16, gap = 16-12 = 4 cells
    const machine4Gap = placeGridItem({
      machineDefId: 'test-machine',
      x: 16,
      y: 10,
      rotation: 0,
      assignedRecipeId: null,
    });

    const state = useStore.getState();
    const automationCore = state.automationCore;
    const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
    const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

    // Manually mark the pylon as connected (simulating it's connected to core)
    const connectedPylonIds = new Set([pylonId]);

    // Calculate which machines would be powered by this connected pylon
    const poweredMachineIds = new Set<string>();
    for (const machine of machines) {
      const machineDef = state.getMachineDefById(machine.machineDefId);
      const machineWidth = machineDef?.width ?? 2;
      const machineHeight = machineDef?.height ?? 2;

      for (const pylon of pylons.filter(p => connectedPylonIds.has(p.id))) {
        if (isWithinPowerRange(pylon.x, pylon.y, 2, 2, machine.x, machine.y, machineWidth, machineHeight)) {
          poweredMachineIds.add(machine.id);
          break;
        }
      }
    }

    console.log('Pylon at (10,10) to (11,11)');
    console.log('Machine with 3 gap at (15,10) powered?', poweredMachineIds.has(machine3Gap));
    console.log('Machine with 4 gap at (16,10) powered?', poweredMachineIds.has(machine4Gap));

    expect(poweredMachineIds.has(machine3Gap)).toBe(true);
    expect(poweredMachineIds.has(machine4Gap)).toBe(false);
  });

  it('should have pylons as 2x2 structures', () => {
    expect(PYLON_DEF.width).toBe(2);
    expect(PYLON_DEF.height).toBe(2);
  });

  describe('isWithinPowerRange', () => {
    it('should return true for adjacent items (distance = 0)', () => {
      // Two 1x1 items touching
      expect(isWithinPowerRange(0, 0, 1, 1, 1, 0, 1, 1)).toBe(true);
    });

    it('should return true for items within 3 cells', () => {
      // 1x1 at (0,0) and 1x1 at (4,0) - 3 cells apart
      expect(isWithinPowerRange(0, 0, 1, 1, 4, 0, 1, 1)).toBe(true);
    });

    it('should return false for items more than 3 cells apart', () => {
      // 1x1 at (0,0) and 1x1 at (5,0) - 4 cells apart
      expect(isWithinPowerRange(0, 0, 1, 1, 5, 0, 1, 1)).toBe(false);
    });

    it('should work with diagonal distance (Chebyshev)', () => {
      // 1x1 at (0,0) and 1x1 at (3,3) - diagonal but within range (3 cells)
      expect(isWithinPowerRange(0, 0, 1, 1, 4, 4, 1, 1)).toBe(true);

      // 1x1 at (0,0) and 1x1 at (5,5) - diagonal but out of range (4 cells)
      expect(isWithinPowerRange(0, 0, 1, 1, 5, 5, 1, 1)).toBe(false);
    });

    it('should work with 2x2 structures', () => {
      // Two 2x2 boxes side by side touching (distance = 0)
      // Box 1 at (0,0) occupies (0,0)-(1,1), Box 2 at (2,0) occupies (2,0)-(3,1)
      expect(isWithinPowerRange(0, 0, 2, 2, 2, 0, 2, 2)).toBe(true);

      // Two 2x2 boxes with 1 cell gap (distance = 1)
      // Box 1 at (0,0) occupies (0,0)-(1,1), Box 2 at (3,0) occupies (3,0)-(4,1)
      expect(isWithinPowerRange(0, 0, 2, 2, 3, 0, 2, 2)).toBe(true);

      // Two 2x2 boxes with 3 cells gap (distance = 3)
      // Box 1 at (0,0) occupies (0,0)-(1,1), Box 2 at (5,0) occupies (5,0)-(6,1)
      expect(isWithinPowerRange(0, 0, 2, 2, 5, 0, 2, 2)).toBe(true);

      // Two 2x2 boxes with 4 cells gap (distance = 4) - should be FALSE
      // Box 1 at (0,0) occupies (0,0)-(1,1), Box 2 at (6,0) occupies (6,0)-(7,1)
      expect(isWithinPowerRange(0, 0, 2, 2, 6, 0, 2, 2)).toBe(false);
    });
  });

  describe('calculatePoweredMachines', () => {
    it('should connect pylon to automation core within 4 cells', () => {
      const { placeGridItem } = useStore.getState();

      // Place pylon just outside automation core (core ends at x=23, y=23)
      // Place at x=24 to be 1 cell away from core edge
      const pylonId = placeGridItem({
        machineDefId: 'pylon',
        x: 24,
        y: 19, // Middle of core vertically
        rotation: 0,
        assignedRecipeId: null,
      });

      const state = useStore.getState();
      const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
      const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

      const result = calculatePoweredMachines(pylons, machines, automationCore);

      // The pylon itself should be connected (powered)
      expect(result.connectedPylonIds.has(pylonId)).toBe(true);
    });

    it('should not connect pylon beyond 4 cells from core', () => {
      const { placeGridItem } = useStore.getState();

      // Place pylon far from core (core ends at 23, place at 29 = 5 cells away)
      const pylonId = placeGridItem({
        machineDefId: 'pylon',
        x: 29,
        y: 19,
        rotation: 0,
        assignedRecipeId: null,
      });

      const state = useStore.getState();
      const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
      const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

      const result = calculatePoweredMachines(pylons, machines, automationCore);

      // The pylon should NOT be connected
      expect(result.connectedPylonIds.has(pylonId)).toBe(false);
    });

    it('should connect pylon to pylon within 4 cells', () => {
      const { placeGridItem } = useStore.getState();

      // Place first pylon next to core
      const pylon1Id = placeGridItem({
        machineDefId: 'pylon',
        x: 24,
        y: 19,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Place second pylon within range of first pylon
      const pylon2Id = placeGridItem({
        machineDefId: 'pylon',
        x: 28, // 4 cells from pylon1
        y: 19,
        rotation: 0,
        assignedRecipeId: null,
      });

      const state = useStore.getState();
      const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
      const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

      const result = calculatePoweredMachines(pylons, machines, automationCore);

      // Both pylons should be connected
      expect(result.connectedPylonIds.has(pylon1Id)).toBe(true);
      expect(result.connectedPylonIds.has(pylon2Id)).toBe(true);
    });

    it('should power machine within 4 cells of connected pylon', () => {
      const { placeGridItem } = useStore.getState();

      // Place pylon next to core
      placeGridItem({
        machineDefId: 'pylon',
        x: 24,
        y: 19,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Place machine within range of pylon
      const machineId = placeGridItem({
        machineDefId: 'test-machine',
        x: 26, // 2 cells from pylon (considering machine is 2x2)
        y: 18,
        rotation: 0,
        assignedRecipeId: null,
      });

      const state = useStore.getState();
      const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
      const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

      const result = calculatePoweredMachines(pylons, machines, automationCore);

      // Machine should be powered
      expect(result.poweredMachineIds.has(machineId)).toBe(true);
    });

    it('should not power machine if pylon chain broken', () => {
      const { placeGridItem } = useStore.getState();

      // Place single disconnected pylon (far from core)
      placeGridItem({
        machineDefId: 'pylon',
        x: 35,
        y: 35,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Place machine next to disconnected pylon
      const machineId = placeGridItem({
        machineDefId: 'test-machine',
        x: 33,
        y: 34,
        rotation: 0,
        assignedRecipeId: null,
      });

      const state = useStore.getState();
      const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
      const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

      const result = calculatePoweredMachines(pylons, machines, automationCore);

      // Machine should NOT be powered (pylon not connected to core)
      expect(result.poweredMachineIds.has(machineId)).toBe(false);
    });

    it('should power machines via pylon chains (Core -> P1 -> P2 -> Machine)', () => {
      const { placeGridItem } = useStore.getState();

      // Create a chain: Core -> Pylon1 -> Pylon2 -> Machine
      // Core ends at x=23

      // Pylon1 at x=24 (next to core)
      placeGridItem({
        machineDefId: 'pylon',
        x: 24,
        y: 19,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Pylon2 at x=28 (4 cells from Pylon1)
      placeGridItem({
        machineDefId: 'pylon',
        x: 28,
        y: 19,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Machine at x=30 (within 4 cells of Pylon2)
      const machineId = placeGridItem({
        machineDefId: 'test-machine',
        x: 30,
        y: 18,
        rotation: 0,
        assignedRecipeId: null,
      });

      const state = useStore.getState();
      const pylons = state.gridItems.filter(i => i.machineDefId === 'pylon');
      const machines = state.gridItems.filter(i => i.machineDefId !== 'pylon');

      const result = calculatePoweredMachines(pylons, machines, automationCore);

      // Machine should be powered through the chain
      expect(result.poweredMachineIds.has(machineId)).toBe(true);
    });
  });
});
