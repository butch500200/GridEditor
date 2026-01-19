import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

describe('Belt Connections', () => {
  const minerDef: MachineDef = {
    id: 'miner',
    name: 'Miner',
    width: 2,
    height: 2,
    color: 'blue',
    ports: [{ type: 'output', offsetX: 1, offsetY: 1, direction: 'E' }],
  };

  const smelterDef: MachineDef = {
    id: 'smelter',
    name: 'Smelter',
    width: 2,
    height: 3,
    color: 'orange',
    ports: [{ type: 'input', offsetX: 0, offsetY: 1, direction: 'W' }],
  };

  beforeEach(() => {
    useStore.setState({
      machineDefs: [minerDef, smelterDef],
      recipes: [],
      gridItems: [],
      connections: [],
      currentTool: 'select',
      selectedMachineDefId: null,
      selectedGridItemId: null,
      ghostPlacement: null,
      dragMoveState: null,
      activePort: null,
    });
  });

  it('should add a connection between two machines', () => {
    const { placeGridItem, addConnection } = useStore.getState();
    
    const sourceId = placeGridItem({
      machineDefId: 'miner',
      x: 0,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });
    
    const targetId = placeGridItem({
      machineDefId: 'smelter',
      x: 5,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });

    addConnection({
      sourceItemId: sourceId,
      sourcePortIndex: 0,
      targetItemId: targetId,
      targetPortIndex: 0,
    });

    const state = useStore.getState();
    expect(state.connections).toHaveLength(1);
    expect(state.connections[0].sourceItemId).toBe(sourceId);
    expect(state.connections[0].targetItemId).toBe(targetId);
  });

  it('should remove connections when a machine is deleted', () => {
    const { placeGridItem, addConnection, removeGridItem } = useStore.getState();
    
    const sourceId = placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });
    const targetId = placeGridItem({ machineDefId: 'smelter', x: 5, y: 0, rotation: 0, assignedRecipeId: null });

    addConnection({
      sourceItemId: sourceId,
      sourcePortIndex: 0,
      targetItemId: targetId,
      targetPortIndex: 0,
    });

    expect(useStore.getState().connections).toHaveLength(1);

    removeGridItem(sourceId);
    expect(useStore.getState().connections).toHaveLength(0);
  });

  it('should remove connections when a machine definition is deleted', () => {
    const { placeGridItem, addConnection, deleteMachineDef } = useStore.getState();
    
    const sourceId = placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });
    const targetId = placeGridItem({ machineDefId: 'smelter', x: 5, y: 0, rotation: 0, assignedRecipeId: null });

    addConnection({
      sourceItemId: sourceId,
      sourcePortIndex: 0,
      targetItemId: targetId,
      targetPortIndex: 0,
    });

    deleteMachineDef('miner');
    expect(useStore.getState().connections).toHaveLength(0);
  });

  it('should manage activePort state', () => {
    const { setActivePort } = useStore.getState();
    
    setActivePort({ itemId: 'item-1', portIndex: 0, type: 'output' });
    expect(useStore.getState().activePort).toEqual({ itemId: 'item-1', portIndex: 0, type: 'output' });
    
    setActivePort(null);
    expect(useStore.getState().activePort).toBeNull();
  });
});
