import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Grid } from '../components/Grid';
import { useStore } from '../store/useStore';
import { MachineDef } from '../types';

// Mock getBoundingClientRect
const mockRect = {
  left: 0,
  top: 0,
  width: 1000,
  height: 1000,
  right: 1000,
  bottom: 1000,
  x: 0,
  y: 0,
  toJSON: () => {},
};

describe('Belt UX', () => {
  const minerDef: MachineDef = {
    id: 'miner',
    name: 'Miner',
    width: 1,
    height: 1,
    color: 'blue',
    ports: [{ type: 'output', offsetX: 0, offsetY: 0, direction: 'E' }],
  };

  const smelterDef: MachineDef = {
    id: 'smelter',
    name: 'Smelter',
    width: 1,
    height: 1,
    color: 'orange',
    ports: [{ type: 'input', offsetX: 0, offsetY: 0, direction: 'W' }],
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

    Element.prototype.getBoundingClientRect = vi.fn(() => mockRect as DOMRect);
  });

  it('creates a belt by dragging from one port to another', () => {
    const { placeGridItem } = useStore.getState();
    const sourceId = placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });
    const targetId = placeGridItem({ machineDefId: 'smelter', x: 5, y: 0, rotation: 0, assignedRecipeId: null });

    const { container } = render(<Grid />);

    // Find the ports. Miner has output at (0,0) E. Smelter has input at (5,0) W.
    // In our simplified test, we just look for the port indicators.
    const ports = screen.getAllByTitle(/port/i);
    expect(ports).toHaveLength(2);

    const sourcePort = ports.find(p => p.getAttribute('title')?.includes('Output'))!;
    const targetPort = ports.find(p => p.getAttribute('title')?.includes('Input'))!;

    // 1. Mouse down on source port
    fireEvent.mouseDown(sourcePort);
    expect(useStore.getState().activePort).not.toBeNull();
    expect(useStore.getState().activePort?.itemId).toBe(sourceId);

    // Trigger mouseMove to set dragMousePos for preview
    const gridContainer = container.querySelector('.bg-endfield-black')!;
    fireEvent.mouseMove(gridContainer, { clientX: 10, clientY: 10 });

    // 2. Check for connection preview
    // The preview is a path inside the svg layer
    const paths = container.querySelectorAll('svg path');
    // Before mouse up, we expect 0 connections + 1 preview = 1 path
    // Actually, each connection has 2 paths (background + tracks)
    // So if 0 connections, we expect 1 path (preview)
    expect(paths).toHaveLength(1);

    // 3. Mouse up on target port
    fireEvent.mouseUp(targetPort);

    const state = useStore.getState();
    expect(state.connections).toHaveLength(1);
    expect(state.connections[0].sourceItemId).toBe(sourceId);
    expect(state.connections[0].targetItemId).toBe(targetId);
  });

  it('creates a belt by clicking two ports sequentially', () => {
    const { placeGridItem } = useStore.getState();
    const sourceId = placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });
    const targetId = placeGridItem({ machineDefId: 'smelter', x: 5, y: 0, rotation: 0, assignedRecipeId: null });

    render(<Grid />);

    const ports = screen.getAllByTitle(/port/i);
    const sourcePort = ports.find(p => p.getAttribute('title')?.includes('Output'))!;
    const targetPort = ports.find(p => p.getAttribute('title')?.includes('Input'))!;

    // 1. Click source port (MouseDown + MouseUp)
    fireEvent.mouseDown(sourcePort);
    fireEvent.mouseUp(sourcePort);
    expect(useStore.getState().activePort?.itemId).toBe(sourceId);

    // 2. Click target port
    fireEvent.mouseDown(targetPort);
    fireEvent.mouseUp(targetPort);

    const state = useStore.getState();
    expect(state.connections).toHaveLength(1);
    expect(state.connections[0].sourceItemId).toBe(sourceId);
    expect(state.connections[0].targetItemId).toBe(targetId);
  });
  
  it('does not drag machines when clicking a port', () => {
    const { placeGridItem } = useStore.getState();
    placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });

    render(<Grid />);
    
    // Find a port
    const port = screen.getAllByTitle(/port/i)[0];
    
    // Attempt to drag from port
    fireEvent.mouseDown(port, { button: 0 });
    
    // Should NOT start dragging machine
    expect(useStore.getState().dragMoveState).toBeNull();
    // SHOULD start creating belt
    expect(useStore.getState().activePort).not.toBeNull();
  });

  it('drags machine when clicking machine body (not port)', () => {
    const { placeGridItem } = useStore.getState();
    const itemId = placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });

    render(<Grid />);
    
    const machine = screen.getByLabelText(/Miner at position 0, 0/i);
    
    // Attempt to drag machine body
    fireEvent.mouseDown(machine, { button: 0 });
    
    expect(useStore.getState().dragMoveState?.gridItemId).toBe(itemId);
  });

  it('selects and deletes a connection', () => {
    const { placeGridItem, addConnection } = useStore.getState();
    const sourceId = placeGridItem({ machineDefId: 'miner', x: 0, y: 0, rotation: 0, assignedRecipeId: null });
    const targetId = placeGridItem({ machineDefId: 'smelter', x: 5, y: 0, rotation: 0, assignedRecipeId: null });

    addConnection({
      sourceItemId: sourceId,
      sourcePortIndex: 0,
      targetItemId: targetId,
      targetPortIndex: 0,
    });

    const { container } = render(<Grid />);
    
    // Find the connection line
    const belt = container.querySelector('svg g.group');
    if (!belt) throw new Error('Belt not found');
    
    // Click to select
    fireEvent.click(belt);
    expect(useStore.getState().selectedConnectionId).not.toBeNull();
    
    // Find delete button (circle inside g)
    const deleteButton = container.querySelector('svg g g.cursor-pointer');
    if (!deleteButton) throw new Error('Delete button not found');
    
    fireEvent.click(deleteButton);
    expect(useStore.getState().connections).toHaveLength(0);
    expect(useStore.getState().selectedConnectionId).toBeNull();
  });
});
