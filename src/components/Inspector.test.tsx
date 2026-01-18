import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Inspector } from './Inspector';
import { useStore } from '../store/useStore';

describe('Inspector Component', () => {
  const testMachine = {
    id: 'm1',
    name: 'Assembler',
    width: 2,
    height: 2,
    color: 'blue',
    ports: [],
  };

  beforeEach(() => {
    useStore.setState({
      machineDefs: [testMachine],
      recipes: [
        {
          id: 'r1',
          name: 'Iron Plate',
          machineType: 'm1',
          duration: 2,
          inputs: [],
          outputs: [],
        },
      ],
      gridItems: [
        {
          id: 'gi1',
          machineDefId: 'm1',
          x: 10,
          y: 10,
          rotation: 0,
          assignedRecipeId: null,
        },
      ],
      selectedGridItemId: 'gi1',
    });
  });

  it('displays information about the selected machine', () => {
    render(<Inspector />);
    expect(screen.getByText('Assembler')).toBeInTheDocument();
    // Position is split into rows
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
    expect(screen.getAllByText('10')).toHaveLength(2);
  });

  it('allows changing the assigned recipe', () => {
    render(<Inspector />);
    
    // Find the recipe select. It should have options for recipes matching machineType.
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'r1' } });
    
    const item = useStore.getState().gridItems.find(i => i.id === 'gi1');
    expect(item?.assignedRecipeId).toBe('r1');
  });

  it('deletes the selected machine', () => {
    render(<Inspector />);
    
    const deleteButton = screen.getByText(/Delete Machine/i);
    fireEvent.click(deleteButton);
    
    expect(useStore.getState().gridItems).toHaveLength(0);
    expect(useStore.getState().selectedGridItemId).toBeNull();
  });
});
