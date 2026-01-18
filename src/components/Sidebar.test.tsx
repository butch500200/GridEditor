import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { useStore } from '../store/useStore';

describe('Sidebar Component', () => {
  beforeEach(() => {
    useStore.setState({
      machineDefs: [
        {
          id: 'm1',
          name: 'Machine 1',
          width: 1,
          height: 1,
          color: 'red',
          ports: [],
        },
      ],
      recipes: [],
      currentTool: 'select',
      selectedMachineDefId: null,
    });
  });

  it('switches tools', () => {
    render(<Sidebar />);
    
    const deleteTool = screen.getByLabelText('Delete');
    fireEvent.click(deleteTool);
    
    expect(useStore.getState().currentTool).toBe('delete');
    
    const selectTool = screen.getByLabelText('Select');
    fireEvent.click(selectTool);
    
    expect(useStore.getState().currentTool).toBe('select');
  });

  it('selects a machine definition', () => {
    render(<Sidebar />);
    
    const machineItem = screen.getByText('Machine 1');
    fireEvent.click(machineItem);
    
    expect(useStore.getState().selectedMachineDefId).toBe('m1');
    expect(useStore.getState().currentTool).toBe('place');
  });

  it('opens machine builder on "Create Machine" button click', () => {
    render(<Sidebar />);
    
    const addButton = screen.getByLabelText(/Create new machine/i);
    fireEvent.click(addButton);
    
    expect(useStore.getState().activeModal).toBe('machineBuilder');
  });
});
