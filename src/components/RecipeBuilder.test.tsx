import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeBuilder } from './RecipeBuilder';
import { useStore } from '../store/useStore';

describe('RecipeBuilder Component', () => {
  beforeEach(() => {
    useStore.setState({
      machineDefs: [
        { id: 'm1', name: 'Assembler', width: 1, height: 1, color: 'blue', ports: [] }
      ],
      recipes: []
    });
  });

  it('creates a new recipe on save', () => {
    const onClose = vi.fn();
    render(<RecipeBuilder onClose={onClose} />);
    
    // Fill in name
    const nameInput = screen.getByLabelText(/Recipe Name/i);
    fireEvent.change(nameInput, { target: { value: 'Iron Gear' } });
    
    // Select machine
    const machineSelect = screen.getByLabelText(/Machine Type/i);
    fireEvent.change(machineSelect, { target: { value: 'm1' } });
    
    // Fill in duration
    const durationInput = screen.getByLabelText(/Duration/i);
    fireEvent.change(durationInput, { target: { value: '1.5' } });
    
    // Click save
    const saveButton = screen.getByLabelText('Create recipe');
    fireEvent.click(saveButton);
    
    const state = useStore.getState();
    const newRecipe = state.recipes.find(r => r.name === 'Iron Gear');
    expect(newRecipe).toBeDefined();
    expect(newRecipe?.machineType).toBe('m1');
    expect(newRecipe?.duration).toBe(1.5);
    expect(onClose).toHaveBeenCalled();
  });
});
