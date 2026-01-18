import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MachineBuilder } from './MachineBuilder';
import { useStore } from '../store/useStore';

describe('MachineBuilder Component', () => {
  it('creates a new machine definition on save', () => {
    const onClose = vi.fn();
    render(<MachineBuilder onClose={onClose} />);
    
    // Fill in name
    const nameInput = screen.getByPlaceholderText(/Enter machine name.../i);
    fireEvent.change(nameInput, { target: { value: 'New Assembler' } });
    
    // Change width
    const widthInput = screen.getByLabelText(/Width \(cells\)/i);
    fireEvent.change(widthInput, { target: { value: '3' } });
    
    // Click save
    const saveButton = screen.getByLabelText('Create machine');
    fireEvent.click(saveButton);
    
    const state = useStore.getState();
    const newMachine = state.machineDefs.find(m => m.name === 'New Assembler');
    expect(newMachine).toBeDefined();
    expect(newMachine?.width).toBe(3);
    expect(onClose).toHaveBeenCalled();
  });

  it('validates required fields', () => {
    const onClose = vi.fn();
    render(<MachineBuilder onClose={onClose} />);
    
    // Try to save without name
    const saveButton = screen.getByLabelText('Create machine');
    fireEvent.click(saveButton);
    
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
