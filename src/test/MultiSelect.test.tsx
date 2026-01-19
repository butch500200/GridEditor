import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

describe('Multi-Selection', () => {
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

  describe('Ctrl+Click selection', () => {
    it('should select a single machine when clicking without Ctrl', () => {
      const { addMachineDef, placeGridItem, selectGridItem } = useStore.getState();

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

      selectGridItem(machine1Id);

      const { selectedGridItemIds, selectedGridItemId } = useStore.getState();
      expect(selectedGridItemIds).toEqual([machine1Id]);
      expect(selectedGridItemId).toBe(machine1Id);
    });

    it('should add a machine to selection when Ctrl+clicking', () => {
      const { addMachineDef, placeGridItem, selectGridItem, toggleGridItemSelection } = useStore.getState();

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

      // First select machine1
      selectGridItem(machine1Id);

      // Then Ctrl+click machine2 (toggle)
      toggleGridItemSelection(machine2Id);

      const { selectedGridItemIds } = useStore.getState();
      expect(selectedGridItemIds).toHaveLength(2);
      expect(selectedGridItemIds).toContain(machine1Id);
      expect(selectedGridItemIds).toContain(machine2Id);
    });

    it('should remove a machine from selection when Ctrl+clicking an already-selected machine', () => {
      const { addMachineDef, placeGridItem, setSelectedGridItems, toggleGridItemSelection } = useStore.getState();

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

      // Select both machines
      setSelectedGridItems([machine1Id, machine2Id]);

      // Ctrl+click machine1 to deselect it
      toggleGridItemSelection(machine1Id);

      const { selectedGridItemIds } = useStore.getState();
      expect(selectedGridItemIds).toHaveLength(1);
      expect(selectedGridItemIds).toContain(machine2Id);
      expect(selectedGridItemIds).not.toContain(machine1Id);
    });

    it('should copy and paste multiple selected machines', () => {
      const { addMachineDef, placeGridItem, setSelectedGridItems, copyToClipboard, pasteFromClipboard } = useStore.getState();

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

      // Select both machines
      setSelectedGridItems([machine1Id, machine2Id]);

      // Copy
      copyToClipboard();

      // Paste at a different location
      pasteFromClipboard(10, 10);

      const { gridItems } = useStore.getState();
      // Should now have 4 machines total (2 original + 2 pasted)
      expect(gridItems).toHaveLength(4);

      // Check that the pasted machines maintain relative positions
      const pastedMachines = gridItems.filter(i => i.id !== machine1Id && i.id !== machine2Id);

      expect(pastedMachines).toHaveLength(2);

      // Check relative offset is maintained (machine2 is 2 cells right of machine1)
      const pastedSorted = pastedMachines.sort((a, b) => a.x - b.x);
      expect(pastedSorted[1].x - pastedSorted[0].x).toBe(2);
    });
  });
});
