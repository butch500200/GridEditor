import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { PYLON_DEF } from '../data/sampleData';

describe('Pylon Hotkey', () => {
  beforeEach(() => {
    useStore.setState({
      machineDefs: [],
      gridItems: [],
      connections: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
      selectedMachineDefId: null,
      currentTool: 'select',
    });
  });

  it('should have pylon definition available', () => {
    expect(PYLON_DEF).toBeDefined();
    expect(PYLON_DEF.id).toBe('pylon');
    expect(PYLON_DEF.name).toBe('Power Pylon');
    expect(PYLON_DEF.width).toBe(2);
    expect(PYLON_DEF.height).toBe(2);
    expect(PYLON_DEF.powerConsumption).toBe(0);
  });

  it('should enter pylon placement mode when selectMachineDef is called with pylon', () => {
    // Add pylon def to store first
    useStore.getState().addMachineDef(PYLON_DEF);

    const { selectMachineDef } = useStore.getState();
    selectMachineDef('pylon');

    const state = useStore.getState();
    expect(state.selectedMachineDefId).toBe('pylon');
    expect(state.currentTool).toBe('place');
  });

  it('should toggle off pylon placement when selectMachineDef is called with null', () => {
    // Add pylon def and select it
    useStore.getState().addMachineDef(PYLON_DEF);
    const { selectMachineDef } = useStore.getState();

    // Enter pylon mode
    selectMachineDef('pylon');
    expect(useStore.getState().selectedMachineDefId).toBe('pylon');

    // Exit pylon mode
    selectMachineDef(null);

    const state = useStore.getState();
    expect(state.selectedMachineDefId).toBeNull();
    expect(state.currentTool).toBe('select');
  });

  it('should be able to place pylon on grid', () => {
    // Add pylon def to store
    useStore.getState().addMachineDef(PYLON_DEF);

    const { placeGridItem, isPlacementValid } = useStore.getState();

    // Check pylon can be placed
    expect(isPlacementValid('pylon', 5, 5, 0)).toBe(true);

    // Place pylon
    const pylonId = placeGridItem({
      machineDefId: 'pylon',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });

    const state = useStore.getState();
    expect(state.gridItems).toHaveLength(1);
    expect(state.gridItems[0].machineDefId).toBe('pylon');
  });
});
