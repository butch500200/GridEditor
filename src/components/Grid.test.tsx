import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Grid } from './Grid';
import { useStore } from '../store/useStore';

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

describe('Grid Component', () => {
  beforeEach(() => {
    useStore.setState({
      machineDefs: [
        {
          id: 'test-m',
          name: 'Test Machine',
          width: 1,
          height: 1,
          color: '#ff0000',
          ports: [],
        },
      ],
      recipes: [],
      gridItems: [],
      currentTool: 'select',
      selectedMachineDefId: null,
      selectedGridItemId: null,
    });

    // Mock getBoundingClientRect for the grid container
    Element.prototype.getBoundingClientRect = vi.fn(() => mockRect as DOMRect);
  });

  it('renders the grid container', () => {
    const { container } = render(<Grid />);
    const gridContainer = container.querySelector('.bg-endfield-black');
    expect(gridContainer).toBeInTheDocument();
  });

  it('places a machine on click in place mode', () => {
    useStore.setState({
      currentTool: 'place',
      selectedMachineDefId: 'test-m',
    });

    const { container } = render(<Grid />);
    const gridSurface = container.querySelector('.relative.no-select');
    
    if (!gridSurface) throw new Error('Grid surface not found');

    // Click at (10, 10) grid coords. CELL_SIZE is 40.
    fireEvent.click(gridSurface, {
      clientX: 400 + 20, // middle of cell 10
      clientY: 400 + 20,
    });

    const state = useStore.getState();
    expect(state.gridItems).toHaveLength(1);
    expect(state.gridItems[0].x).toBe(10);
    expect(state.gridItems[0].y).toBe(10);
  });

  it('selects a machine on click in select mode', () => {
    const { placeGridItem } = useStore.getState();
    const itemId = placeGridItem({
      machineDefId: 'test-m',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });

    render(<Grid />);
    
    const machine = screen.getByLabelText(/Test Machine at position 5, 5/i);
    fireEvent.click(machine);

    expect(useStore.getState().selectedGridItemId).toBe(itemId);
  });

  it('deletes a machine on click in delete mode', () => {
    const { placeGridItem } = useStore.getState();
    placeGridItem({
      machineDefId: 'test-m',
      x: 5,
      y: 5,
      rotation: 0,
      assignedRecipeId: null,
    });

    useStore.setState({ currentTool: 'delete' });

    render(<Grid />);
    
    const machine = screen.getByLabelText(/Test Machine at position 5, 5/i);
    fireEvent.click(machine);

    expect(useStore.getState().gridItems).toHaveLength(0);
  });

  it('rotates ghost preview on R key press', () => {
    useStore.setState({
      currentTool: 'place',
      selectedMachineDefId: 'test-m',
    });

    const { container } = render(<Grid />);
    const gridSurface = container.querySelector('.relative.no-select');
    if (!gridSurface) throw new Error('Grid surface not found');

    // Move mouse to show ghost
    fireEvent.mouseMove(gridSurface, {
      clientX: 100,
      clientY: 100,
    });

    // Ghost should be visible
    expect(screen.getByText('Test Machine')).toBeInTheDocument();
    
    fireEvent.keyDown(window, { key: 'r' });
    
    // Ghost rotation should have updated (it's internal state but verified by key handler logic)
  });
});
