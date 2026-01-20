import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

describe('Delete Key Removes Selected Items', () => {
  const testMachine: MachineDef = {
    id: 'test-machine',
    name: 'Test Machine',
    width: 2,
    height: 2,
    color: '#FF0000',
    ports: [
      { type: 'output', offsetX: 1, offsetY: 0, direction: 'E' },
      { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
    ],
  };

  beforeEach(() => {
    useStore.setState({
      machineDefs: [],
      gridItems: [],
      connections: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
      currentTool: 'select',
    });
    useStore.getState().addMachineDef(testMachine);
  });

  it('should have removeSelectedGridItems action in store', () => {
    const { removeSelectedGridItems } = useStore.getState();
    expect(removeSelectedGridItems).toBeDefined();
    expect(typeof removeSelectedGridItems).toBe('function');
  });

  it('should remove all selected items when removeSelectedGridItems is called', () => {
    const { placeGridItem, setSelectedGridItems, removeSelectedGridItems } = useStore.getState();

    // Place three machines
    const item1Id = placeGridItem({
      machineDefId: 'test-machine',
      x: 0,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item2Id = placeGridItem({
      machineDefId: 'test-machine',
      x: 5,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item3Id = placeGridItem({
      machineDefId: 'test-machine',
      x: 10,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });

    // Select first two items
    setSelectedGridItems([item1Id, item2Id]);
    expect(useStore.getState().selectedGridItemIds).toHaveLength(2);

    // Remove selected items
    removeSelectedGridItems();

    const state = useStore.getState();
    // Should only have the unselected item remaining
    expect(state.gridItems).toHaveLength(1);
    expect(state.gridItems[0].id).toBe(item3Id);
  });

  it('should remove connections associated with deleted items', () => {
    const { placeGridItem, setSelectedGridItems, addConnection, removeSelectedGridItems } = useStore.getState();

    // Place two machines
    const item1Id = placeGridItem({
      machineDefId: 'test-machine',
      x: 0,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item2Id = placeGridItem({
      machineDefId: 'test-machine',
      x: 5,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });

    // Create a connection between them
    addConnection({
      sourceItemId: item1Id,
      sourcePortIndex: 0,
      targetItemId: item2Id,
      targetPortIndex: 1,
    });

    expect(useStore.getState().connections).toHaveLength(1);

    // Select and delete item1
    setSelectedGridItems([item1Id]);
    removeSelectedGridItems();

    const state = useStore.getState();
    // Connection should be removed because source item was deleted
    expect(state.connections).toHaveLength(0);
    expect(state.gridItems).toHaveLength(1);
  });

  it('should clear selection after deletion', () => {
    const { placeGridItem, setSelectedGridItems, removeSelectedGridItems } = useStore.getState();

    const item1Id = placeGridItem({
      machineDefId: 'test-machine',
      x: 0,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });

    setSelectedGridItems([item1Id]);
    expect(useStore.getState().selectedGridItemIds).toHaveLength(1);

    removeSelectedGridItems();

    const state = useStore.getState();
    expect(state.selectedGridItemIds).toHaveLength(0);
    expect(state.selectedGridItemId).toBeNull();
  });

  it('should do nothing if no items are selected', () => {
    const { placeGridItem, removeSelectedGridItems } = useStore.getState();

    placeGridItem({
      machineDefId: 'test-machine',
      x: 0,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });

    expect(useStore.getState().gridItems).toHaveLength(1);
    expect(useStore.getState().selectedGridItemIds).toHaveLength(0);

    // Call removeSelectedGridItems with nothing selected
    removeSelectedGridItems();

    // Should still have the machine
    expect(useStore.getState().gridItems).toHaveLength(1);
  });
});
