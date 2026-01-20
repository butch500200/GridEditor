import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

describe('Multi-Selection Drag to Move', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      gridItems: [],
      connections: [],
      machineDefs: [],
      recipes: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
      selectedMachineDefId: null,
      selectedConnectionId: null,
      currentTool: 'select',
      ghostPlacement: null,
      dragMoveState: null,
      activePort: null,
      activeModal: null,
      editingMachineId: null,
      editingRecipeId: null,
      clipboard: null,
    });
  });

  describe('Dragging multiple selected machines', () => {
    it('should start drag move for all selected machines when dragging one of them', () => {
      const { addMachineDef, placeGridItem, setSelectedGridItems, startDragMove } = useStore.getState();

      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [],
      };

      addMachineDef(machineDef);

      const machine1Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 0,
        y: 0,
        rotation: 0,
        assignedRecipeId: null,
      });

      const machine2Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 2,
        y: 0,
        rotation: 0,
        assignedRecipeId: null,
      });

      const machine3Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 4,
        y: 2,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Select machine1 and machine2 (but not machine3)
      setSelectedGridItems([machine1Id, machine2Id]);

      // Start dragging machine1
      startDragMove(machine1Id);

      const { dragMoveState } = useStore.getState();

      // Should have drag state for all selected machines
      expect(dragMoveState).not.toBeNull();
      // The drag state should include all selected machines, not just the one being dragged
      if (dragMoveState) {
        // Check if it's tracking multiple machines
        expect(dragMoveState.gridItemId).toBe(machine1Id); // Primary dragged item
        // We'll need to add a field to track all dragged items
      }
    });

    it('should move all selected machines together maintaining relative positions', () => {
      const {
        addMachineDef,
        placeGridItem,
        setSelectedGridItems,
        startDragMove,
        updateDragMove,
        completeDragMove
      } = useStore.getState();

      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [],
      };

      addMachineDef(machineDef);

      // Place machines with specific relative positions
      const machine1Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 5,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      const machine2Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 7,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      const machine3Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 6,
        y: 8,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Select all three machines
      setSelectedGridItems([machine1Id, machine2Id, machine3Id]);

      // Start dragging machine1
      startDragMove(machine1Id);

      // Move to new position (offset by +3, +2)
      updateDragMove(8, 7);

      // Complete the drag
      completeDragMove();

      const { gridItems } = useStore.getState();
      const m1 = gridItems.find(i => i.id === machine1Id)!;
      const m2 = gridItems.find(i => i.id === machine2Id)!;
      const m3 = gridItems.find(i => i.id === machine3Id)!;

      // All machines should have moved by the same offset
      expect(m1.x).toBe(8);
      expect(m1.y).toBe(7);

      expect(m2.x).toBe(10); // 7 + 3
      expect(m2.y).toBe(7);  // 5 + 2

      expect(m3.x).toBe(9);  // 6 + 3
      expect(m3.y).toBe(10); // 8 + 2
    });

    it('should cancel drag for all selected machines when drag is cancelled', () => {
      const {
        addMachineDef,
        placeGridItem,
        setSelectedGridItems,
        startDragMove,
        updateDragMove,
        cancelDragMove
      } = useStore.getState();

      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [],
      };

      addMachineDef(machineDef);

      const machine1Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 5,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      const machine2Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 7,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Select both machines
      setSelectedGridItems([machine1Id, machine2Id]);

      // Start dragging
      startDragMove(machine1Id);

      // Move to new position
      updateDragMove(10, 10);

      // Cancel the drag
      cancelDragMove();

      const { gridItems, dragMoveState } = useStore.getState();
      const m1 = gridItems.find(i => i.id === machine1Id)!;
      const m2 = gridItems.find(i => i.id === machine2Id)!;

      // Machines should be back at original positions
      expect(m1.x).toBe(5);
      expect(m1.y).toBe(5);
      expect(m2.x).toBe(7);
      expect(m2.y).toBe(5);

      // Drag state should be cleared
      expect(dragMoveState).toBeNull();
    });

    it('should not allow invalid placement when dragging multiple machines', () => {
      const {
        addMachineDef,
        placeGridItem,
        setSelectedGridItems,
        startDragMove,
        updateDragMove,
        completeDragMove
      } = useStore.getState();

      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [],
      };

      addMachineDef(machineDef);

      const machine1Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 5,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      const machine2Id = placeGridItem({
        machineDefId: 'test-machine',
        x: 7,
        y: 5,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Place a blocking machine
      const blockerId = placeGridItem({
        machineDefId: 'test-machine',
        x: 10,
        y: 10,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Select machine1 and machine2
      setSelectedGridItems([machine1Id, machine2Id]);

      // Start dragging
      startDragMove(machine1Id);

      // Try to move to a position where machine2 would collide with blocker
      // If machine1 moves to (8, 10), machine2 would be at (10, 10) - collision!
      updateDragMove(8, 10);

      // Complete the drag - it should fail or snap to valid position
      completeDragMove();

      const { gridItems } = useStore.getState();
      const m1 = gridItems.find(i => i.id === machine1Id)!;
      const m2 = gridItems.find(i => i.id === machine2Id)!;
      const blocker = gridItems.find(i => i.id === blockerId)!;

      // Machines should either stay at original position or find valid position
      // They should NOT overlap with the blocker
      const m2OverlapsBlocker = m2.x === blocker.x && m2.y === blocker.y;
      expect(m2OverlapsBlocker).toBe(false);
    });
  });
});
