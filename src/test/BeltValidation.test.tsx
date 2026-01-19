import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

describe('Belt Validation', () => {
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

  describe('One connection per port validation', () => {
    it('should allow creating a connection on an empty port', () => {
      const { addMachineDef, placeGridItem, addConnection } = useStore.getState();

      // Create a simple machine with one input and one output
      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [
          { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
          { type: 'output', offsetX: 0, offsetY: 0, direction: 'E' },
        ],
      };

      addMachineDef(machineDef);

      // Place two machines
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

      // Create first connection
      addConnection({
        sourceItemId: machine1Id,
        sourcePortIndex: 1,
        targetItemId: machine2Id,
        targetPortIndex: 0,
      });

      const { connections } = useStore.getState();
      expect(connections).toHaveLength(1);
      expect(connections[0].sourceItemId).toBe(machine1Id);
      expect(connections[0].targetItemId).toBe(machine2Id);
    });

    it('should prevent creating a second connection on an already-connected output port', () => {
      const { addMachineDef, placeGridItem, addConnection } = useStore.getState();

      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [
          { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
          { type: 'output', offsetX: 0, offsetY: 0, direction: 'E' },
        ],
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
        y: 0,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Create first connection from machine1 output to machine2 input
      addConnection({
        sourceItemId: machine1Id,
        sourcePortIndex: 1,
        targetItemId: machine2Id,
        targetPortIndex: 0,
      });

      // Try to create second connection from machine1 output (same port) to machine3
      addConnection({
        sourceItemId: machine1Id,
        sourcePortIndex: 1, // Same output port
        targetItemId: machine3Id,
        targetPortIndex: 0,
      });

      const { connections } = useStore.getState();
      // Should still only have 1 connection
      expect(connections).toHaveLength(1);
      expect(connections[0].targetItemId).toBe(machine2Id);
    });

    it('should prevent creating a second connection on an already-connected input port', () => {
      const { addMachineDef, placeGridItem, addConnection } = useStore.getState();

      const machineDef: MachineDef = {
        id: 'test-machine',
        name: 'Test Machine',
        width: 1,
        height: 1,
        color: '#FF0000',
        ports: [
          { type: 'input', offsetX: 0, offsetY: 0, direction: 'W' },
          { type: 'output', offsetX: 0, offsetY: 0, direction: 'E' },
        ],
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
        y: 0,
        rotation: 0,
        assignedRecipeId: null,
      });

      // Create first connection to machine3 input
      addConnection({
        sourceItemId: machine1Id,
        sourcePortIndex: 1,
        targetItemId: machine3Id,
        targetPortIndex: 0,
      });

      // Try to create second connection to machine3 input (same port)
      addConnection({
        sourceItemId: machine2Id,
        sourcePortIndex: 1,
        targetItemId: machine3Id,
        targetPortIndex: 0, // Same input port
      });

      const { connections } = useStore.getState();
      // Should still only have 1 connection
      expect(connections).toHaveLength(1);
      expect(connections[0].sourceItemId).toBe(machine1Id);
    });
  });
});
