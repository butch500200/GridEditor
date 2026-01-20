import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

describe('Paste as Placement Mode', () => {
  let drillDef: MachineDef;
  let smelterDef: MachineDef;

  beforeEach(() => {
    useStore.setState({
      gridItems: [],
      connections: [],
      machineDefs: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
      dragMoveState: null,
      multiGhostPlacement: null,
      currentTool: 'select',
      ghostPlacement: null,
      clipboard: null,
    });

    // Create test machine defs
    drillDef = {
      id: 'drill',
      name: 'Drill',
      width: 2,
      height: 2,
      color: '#FF0000',
      ports: [],
    };

    smelterDef = {
      id: 'smelter',
      name: 'Smelter',
      width: 2,
      height: 2,
      color: '#00FF00',
      ports: [],
    };

    useStore.getState().addMachineDef(drillDef);
    useStore.getState().addMachineDef(smelterDef);
  });

  it('should enter placement mode after paste with copied machines', () => {
    const { placeGridItem, setSelectedGridItems, copySelection, pasteSelection } = useStore.getState();

    // Add and select two machines
    const item1Id = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item2Id = placeGridItem({
      machineDefId: 'drill',
      x: 10,
      y: 5,
      rotation: 90,
      assignedRecipeId: null,
    });
    setSelectedGridItems([item1Id, item2Id]);

    // Copy the selection
    copySelection();

    // Paste should enter placement mode
    pasteSelection();

    const state = useStore.getState();

    // Should be in placement mode with multi-ghost state
    expect(state.multiGhostPlacement).toBeTruthy();
    expect(state.multiGhostPlacement?.machines).toHaveLength(2);
    expect(state.currentTool).toBe('place');
  });

  it('should validate all machines in paste placement mode', () => {
    const { placeGridItem, setSelectedGridItems, copySelection, pasteSelection, updateMultiGhostPlacement } = useStore.getState();

    // Add existing machine to create obstacle
    placeGridItem({
      machineDefId: 'drill',
      x: 8,
      y: 8,
      rotation: 0,
      assignedRecipeId: null,
    });

    // Add and copy two machines
    const item1Id = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item2Id = placeGridItem({
      machineDefId: 'drill',
      x: 10,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    setSelectedGridItems([item1Id, item2Id]);
    copySelection();

    // Paste enters placement mode
    pasteSelection();

    // Try to place over obstacle (position 8,8 should collide)
    updateMultiGhostPlacement(8, 8);

    let state = useStore.getState();
    // Should be invalid due to collision
    expect(state.multiGhostPlacement?.isValid).toBe(false);

    // Try valid position
    updateMultiGhostPlacement(25, 25);

    state = useStore.getState();
    // Should be valid now
    expect(state.multiGhostPlacement?.isValid).toBe(true);
  });

  it('should place all machines when confirming paste placement', () => {
    const { placeGridItem, setSelectedGridItems, copySelection, pasteSelection, updateMultiGhostPlacement, confirmMultiGhostPlacement } = useStore.getState();

    // Add and copy two machines with recipes
    const item1Id = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item2Id = placeGridItem({
      machineDefId: 'smelter',
      x: 10,
      y: 5,
      rotation: 90,
      assignedRecipeId: 'iron_ingot',
    });
    setSelectedGridItems([item1Id, item2Id]);
    copySelection();

    // Paste and place
    pasteSelection();
    updateMultiGhostPlacement(25, 25);
    confirmMultiGhostPlacement();

    const state = useStore.getState();

    // Should have 4 machines total now
    expect(state.gridItems).toHaveLength(4);

    // New machines should be at correct positions with correct properties
    const newItems = state.gridItems.filter(item => item.x >= 25);
    expect(newItems).toHaveLength(2);

    // Check offsets are preserved (item2 was 5 units to the right)
    const newItem1 = newItems.find(item => item.machineDefId === 'drill');
    const newItem2 = newItems.find(item => item.machineDefId === 'smelter');
    expect(newItem1?.x).toBe(25);
    expect(newItem1?.y).toBe(25);
    expect(newItem2?.x).toBe(30); // 25 + 5 offset
    expect(newItem2?.y).toBe(25);
    expect(newItem2?.rotation).toBe(90);

    // Recipe should be preserved
    expect(newItem2?.assignedRecipeId).toBe('iron_ingot');

    // Should exit placement mode
    expect(state.multiGhostPlacement).toBeNull();
  });

  it('should cancel paste placement with ESC', () => {
    const { placeGridItem, selectGridItem, copySelection, pasteSelection, cancelMultiGhostPlacement } = useStore.getState();

    // Add and copy machine
    const item1Id = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    selectGridItem(item1Id);
    copySelection();

    // Paste enters placement mode
    pasteSelection();

    expect(useStore.getState().multiGhostPlacement).toBeTruthy();

    // Cancel placement
    cancelMultiGhostPlacement();

    const state = useStore.getState();

    // Should exit placement mode without adding machines
    expect(state.multiGhostPlacement).toBeNull();
    expect(state.gridItems).toHaveLength(1); // Still only original
  });

  it('should not place when position is invalid', () => {
    const { placeGridItem, selectGridItem, copySelection, pasteSelection, updateMultiGhostPlacement, confirmMultiGhostPlacement } = useStore.getState();

    // Add obstacle outside automation core (core is at 15-23)
    placeGridItem({
      machineDefId: 'drill',
      x: 30,
      y: 30,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item1Id = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    selectGridItem(item1Id);
    copySelection();

    // Paste and try to place over obstacle
    pasteSelection();
    updateMultiGhostPlacement(30, 30);
    confirmMultiGhostPlacement();

    const state = useStore.getState();

    // Should not place - still only 2 machines
    expect(state.gridItems).toHaveLength(2);

    // Should still be in placement mode
    expect(state.multiGhostPlacement).toBeTruthy();
  });

  it('should select all newly placed machines after confirming paste', () => {
    const { placeGridItem, setSelectedGridItems, copySelection, pasteSelection, updateMultiGhostPlacement, confirmMultiGhostPlacement } = useStore.getState();

    // Add and copy two machines
    const item1Id = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    const item2Id = placeGridItem({
      machineDefId: 'smelter',
      x: 10,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    setSelectedGridItems([item1Id, item2Id]);
    copySelection();

    // Paste and place
    pasteSelection();
    updateMultiGhostPlacement(25, 25);
    confirmMultiGhostPlacement();

    const state = useStore.getState();

    // Should have 4 machines total now
    expect(state.gridItems).toHaveLength(4);

    // Newly pasted machines should be selected
    expect(state.selectedGridItemIds).toHaveLength(2);

    // The selected IDs should be the new machines (not the originals)
    expect(state.selectedGridItemIds).not.toContain(item1Id);
    expect(state.selectedGridItemIds).not.toContain(item2Id);

    // All selected items should exist in gridItems
    state.selectedGridItemIds.forEach(id => {
      expect(state.gridItems.find(item => item.id === id)).toBeDefined();
    });
  });

  it('should have newly pasted machines selected for immediate drag', () => {
    const { placeGridItem, selectGridItem, copySelection, pasteSelection, updateMultiGhostPlacement, confirmMultiGhostPlacement } = useStore.getState();

    // Add and copy a single machine
    const originalId = placeGridItem({
      machineDefId: 'drill',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });
    selectGridItem(originalId);
    copySelection();

    // Paste and place
    pasteSelection();
    updateMultiGhostPlacement(25, 25);
    confirmMultiGhostPlacement();

    const state = useStore.getState();

    // Should have 2 machines total
    expect(state.gridItems).toHaveLength(2);

    // The new machine should be selected (not the original)
    expect(state.selectedGridItemIds).toHaveLength(1);
    expect(state.selectedGridItemIds[0]).not.toBe(originalId);

    // If single selection, selectedGridItemId should also be set
    expect(state.selectedGridItemId).toBe(state.selectedGridItemIds[0]);
  });
});
