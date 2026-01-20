import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { GRID_CONFIG, AUTOMATION_CORE_CONFIG } from '../constants';
import { MachineDef } from '../types';

describe('Automation Core', () => {
  const testMachine: MachineDef = {
    id: 'test-1x1',
    name: 'Test 1x1',
    width: 1,
    height: 1,
    color: '#FF0000',
    ports: [],
  };

  beforeEach(() => {
    useStore.setState({
      machineDefs: [],
      gridItems: [],
      connections: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
    });
    useStore.getState().addMachineDef(testMachine);
  });

  it('should have automation core config with 9x9 size', () => {
    expect(AUTOMATION_CORE_CONFIG.WIDTH).toBe(9);
    expect(AUTOMATION_CORE_CONFIG.HEIGHT).toBe(9);
  });

  it('should have automation core at center of grid', () => {
    // For 40x40 grid with 9x9 core: (40-9)/2 = 15.5 -> 15
    const expectedX = Math.floor((GRID_CONFIG.WIDTH - AUTOMATION_CORE_CONFIG.WIDTH) / 2);
    const expectedY = Math.floor((GRID_CONFIG.HEIGHT - AUTOMATION_CORE_CONFIG.HEIGHT) / 2);

    expect(AUTOMATION_CORE_CONFIG.X).toBe(expectedX);
    expect(AUTOMATION_CORE_CONFIG.Y).toBe(expectedY);
    expect(AUTOMATION_CORE_CONFIG.X).toBe(15);
    expect(AUTOMATION_CORE_CONFIG.Y).toBe(15);
  });

  it('should prevent placing machines on the automation core', () => {
    const { isPlacementValid } = useStore.getState();

    // Try to place at center of automation core
    expect(isPlacementValid('test-1x1', 19, 19, 0)).toBe(false);

    // Try to place at top-left corner of automation core
    expect(isPlacementValid('test-1x1', 15, 15, 0)).toBe(false);

    // Try to place at bottom-right corner of automation core (15+9-1 = 23)
    expect(isPlacementValid('test-1x1', 23, 23, 0)).toBe(false);
  });

  it('should allow placing machines adjacent to automation core', () => {
    const { isPlacementValid } = useStore.getState();

    // Place just to the left of automation core (x = 14)
    expect(isPlacementValid('test-1x1', 14, 15, 0)).toBe(true);

    // Place just above automation core (y = 14)
    expect(isPlacementValid('test-1x1', 15, 14, 0)).toBe(true);

    // Place just to the right of automation core (x = 24, since core ends at 23)
    expect(isPlacementValid('test-1x1', 24, 15, 0)).toBe(true);

    // Place just below automation core (y = 24)
    expect(isPlacementValid('test-1x1', 15, 24, 0)).toBe(true);
  });

  it('should prevent larger machines from overlapping automation core', () => {
    const largeMachine: MachineDef = {
      id: 'test-3x3',
      name: 'Test 3x3',
      width: 3,
      height: 3,
      color: '#00FF00',
      ports: [],
    };
    useStore.getState().addMachineDef(largeMachine);

    const { isPlacementValid } = useStore.getState();

    // A 3x3 machine placed at (13, 13) would overlap at (13-15, 13-15) to (15, 15)
    // Actually, a 3x3 at (13, 13) occupies (13-15, 13-15) which overlaps with core at (15, 15)
    expect(isPlacementValid('test-3x3', 13, 13, 0)).toBe(false);

    // A 3x3 machine placed at (12, 12) occupies (12-14, 12-14) - no overlap
    expect(isPlacementValid('test-3x3', 12, 12, 0)).toBe(true);
  });

  it('should have automation core state in the store', () => {
    const state = useStore.getState();
    expect(state.automationCore).toBeDefined();
    expect(state.automationCore.x).toBe(AUTOMATION_CORE_CONFIG.X);
    expect(state.automationCore.y).toBe(AUTOMATION_CORE_CONFIG.Y);
    expect(state.automationCore.width).toBe(AUTOMATION_CORE_CONFIG.WIDTH);
    expect(state.automationCore.height).toBe(AUTOMATION_CORE_CONFIG.HEIGHT);
  });
});
