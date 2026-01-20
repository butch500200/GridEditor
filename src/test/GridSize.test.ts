import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { GRID_CONFIG } from '../constants';
import { MachineDef } from '../types';

describe('Grid Size Configuration', () => {
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

  it('should have grid width of 40', () => {
    expect(GRID_CONFIG.WIDTH).toBe(40);
  });

  it('should have grid height of 40', () => {
    expect(GRID_CONFIG.HEIGHT).toBe(40);
  });

  it('should reject placement at x >= 40', () => {
    const { isPlacementValid } = useStore.getState();
    expect(isPlacementValid('test-1x1', 40, 0, 0)).toBe(false);
    expect(isPlacementValid('test-1x1', 41, 0, 0)).toBe(false);
  });

  it('should reject placement at y >= 40', () => {
    const { isPlacementValid } = useStore.getState();
    expect(isPlacementValid('test-1x1', 0, 40, 0)).toBe(false);
    expect(isPlacementValid('test-1x1', 0, 41, 0)).toBe(false);
  });

  it('should accept placement at (39, 39)', () => {
    const { isPlacementValid } = useStore.getState();
    expect(isPlacementValid('test-1x1', 39, 39, 0)).toBe(true);
  });

  it('should accept placement at (0, 0)', () => {
    const { isPlacementValid } = useStore.getState();
    expect(isPlacementValid('test-1x1', 0, 0, 0)).toBe(true);
  });
});
