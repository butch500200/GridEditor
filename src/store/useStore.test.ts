import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { MachineDef } from '../types';

describe('useStore', () => {
  beforeEach(() => {
    // Manually reset state because Zustand persists it in the module scope
    useStore.setState({
      machineDefs: [],
      recipes: [],
      gridItems: [],
      currentTool: 'select',
      selectedMachineDefId: null,
      selectedGridItemId: null,
      ghostPlacement: null,
      dragMoveState: null,
      activeModal: null,
      editingMachineId: null,
      editingRecipeId: null,
    });
  });

  describe('Machine Definitions', () => {
    const testMachine: MachineDef = {
      id: 'test-machine',
      name: 'Test Machine',
      width: 2,
      height: 2,
      color: '#ff0000',
      ports: [],
    };

    it('should add a machine definition', () => {
      const { addMachineDef } = useStore.getState();
      addMachineDef(testMachine);
      expect(useStore.getState().machineDefs).toContainEqual(testMachine);
    });

    it('should update a machine definition', () => {
      const { addMachineDef, updateMachineDef } = useStore.getState();
      addMachineDef(testMachine);
      updateMachineDef('test-machine', { name: 'Updated Machine' });
      expect(useStore.getState().machineDefs[0].name).toBe('Updated Machine');
    });

    it('should delete a machine definition and its instances', () => {
      const { addMachineDef, placeGridItem, deleteMachineDef } = useStore.getState();
      addMachineDef(testMachine);
      placeGridItem({
        machineDefId: 'test-machine',
        x: 0,
        y: 0,
        rotation: 0,
        assignedRecipeId: null,
      });
      
      deleteMachineDef('test-machine');
      expect(useStore.getState().machineDefs).toHaveLength(0);
      expect(useStore.getState().gridItems).toHaveLength(0);
    });
  });

  describe('Grid Placement & Validation', () => {
    const smallMachine: MachineDef = {
      id: 'small',
      name: 'Small',
      width: 1,
      height: 1,
      color: '#00ff00',
      ports: [],
    };

    const rectMachine: MachineDef = {
      id: 'rect',
      name: 'Rect',
      width: 2,
      height: 1,
      color: '#0000ff',
      ports: [],
    };

    beforeEach(() => {
      const { addMachineDef } = useStore.getState();
      addMachineDef(smallMachine);
      addMachineDef(rectMachine);
    });

    it('should validate placement within bounds', () => {
      const { isPlacementValid } = useStore.getState();
      // Valid
      expect(isPlacementValid('small', 0, 0, 0)).toBe(true);
      expect(isPlacementValid('small', 49, 49, 0)).toBe(true);
      
      // Invalid (out of bounds)
      expect(isPlacementValid('small', -1, 0, 0)).toBe(false);
      expect(isPlacementValid('small', 50, 0, 0)).toBe(false);
      expect(isPlacementValid('small', 0, 50, 0)).toBe(false);
    });

    it('should validate placement with rotation', () => {
      const { isPlacementValid } = useStore.getState();
      // 2x1 machine at 49,0 rotated 90deg becomes 1x2.
      // At 49,0 with 90deg rotation, it occupies (49,0) and (49,1). Valid.
      expect(isPlacementValid('rect', 49, 0, 90)).toBe(true);
      
      // 2x1 machine at 49,0 with 0deg rotation occupies (49,0) and (50,0). Invalid.
      expect(isPlacementValid('rect', 49, 0, 0)).toBe(false);
    });

    it('should detect collisions between machines', () => {
      const { placeGridItem, isPlacementValid } = useStore.getState();
      
      placeGridItem({
        machineDefId: 'small',
        x: 5,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Same spot
      expect(isPlacementValid('small', 5, 5, 0)).toBe(false);
      // Overlapping with 2x1
      expect(isPlacementValid('rect', 4, 5, 0)).toBe(false); // occupies (4,5) and (5,5)
      // Adjacent (no overlap)
      expect(isPlacementValid('small', 4, 5, 0)).toBe(true);
    });
  });

  describe('Drag and Move', () => {
    beforeEach(() => {
      const { addMachineDef, placeGridItem } = useStore.getState();
      addMachineDef({
        id: 'm1',
        name: 'M1',
        width: 1,
        height: 1,
        color: 'red',
        ports: [],
      });
      placeGridItem({
        machineDefId: 'm1',
        x: 2,
        y: 2,
        rotation: 0,
        assignedRecipeId: null,
      });
    });

    it('should start drag move correctly', () => {
      const { gridItems, startDragMove } = useStore.getState();
      const itemId = gridItems[0].id;
      
      startDragMove(itemId);
      
      const state = useStore.getState().dragMoveState;
      expect(state).not.toBeNull();
      expect(state?.gridItemId).toBe(itemId);
      expect(state?.originalX).toBe(2);
      expect(state?.isValid).toBe(true);
    });

    it('should update drag move position and validation', () => {
      const { gridItems, startDragMove, updateDragMove, placeGridItem } = useStore.getState();
      const itemId = gridItems[0].id;
      
      // Place an obstacle
      placeGridItem({
        machineDefId: 'm1',
        x: 10,
        y: 10,
        rotation: 0,
        assignedRecipeId: null,
      });

      startDragMove(itemId);
      
      // Move to valid empty spot
      updateDragMove(5, 5);
      expect(useStore.getState().dragMoveState?.currentX).toBe(5);
      expect(useStore.getState().dragMoveState?.isValid).toBe(true);
      
      // Move to occupied spot
      updateDragMove(10, 10);
      expect(useStore.getState().dragMoveState?.isValid).toBe(false);
    });

    it('should rotate machine while dragging', () => {
      const { startDragMove, rotateDragMove, addMachineDef } = useStore.getState();
      addMachineDef({
        id: 'rect',
        name: 'Rect',
        width: 2,
        height: 1,
        color: 'blue',
        ports: [],
      });
      const { placeGridItem } = useStore.getState();
      const rectId = placeGridItem({
        machineDefId: 'rect',
        x: 0,
        y: 0,
        rotation: 0,
        assignedRecipeId: null,
      });

      startDragMove(rectId);
      rotateDragMove();
      
      expect(useStore.getState().dragMoveState?.currentRotation).toBe(90);
    });

    it('should complete drag move and update item position', () => {
      const { gridItems, startDragMove, updateDragMove, completeDragMove } = useStore.getState();
      const itemId = gridItems[0].id;
      
      startDragMove(itemId);
      updateDragMove(7, 8);
      completeDragMove();
      
      const updatedItem = useStore.getState().gridItems.find(i => i.id === itemId);
      expect(updatedItem?.x).toBe(7);
      expect(updatedItem?.y).toBe(8);
      expect(useStore.getState().dragMoveState).toBeNull();
    });

    it('should cancel drag move and restore original position', () => {
      const { gridItems, startDragMove, updateDragMove, cancelDragMove } = useStore.getState();
      const itemId = gridItems[0].id;
      
      startDragMove(itemId);
      updateDragMove(7, 8);
      cancelDragMove();
      
      const item = useStore.getState().gridItems.find(i => i.id === itemId);
      expect(item?.x).toBe(2);
      expect(item?.y).toBe(2);
      expect(useStore.getState().dragMoveState).toBeNull();
    });
  });
});
