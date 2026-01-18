/**
 * @fileoverview Recipe Builder Modal Component
 *
 * A modal dialog for creating and editing recipes.
 * Allows users to define recipe name, machine type, duration,
 * and dynamic lists of input/output items with amounts.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  useStore,
  useMachineDefs,
  useEditingRecipeId,
} from '../store/useStore';
import { generateId } from '../utils/idUtils';
import type { Recipe, RecipeIO } from '../types';

/**
 * @description Props for the IOList component
 */
interface IOListProps {
  /** Label for the section (e.g., "Inputs" or "Outputs") */
  label: string;
  /** Array of input/output items */
  items: RecipeIO[];
  /** Callback to update items */
  onItemsChange: (items: RecipeIO[]) => void;
  /** Color for the add button */
  accentColor: string;
}

/**
 * @description Dynamic list component for recipe inputs or outputs
 *
 * Displays a list of items with item name and amount fields,
 * with add and remove functionality.
 *
 * @param props - Component props
 * @returns Rendered IO list
 */
const IOList: React.FC<IOListProps> = ({
  label,
  items,
  onItemsChange,
  accentColor,
}) => {
  /**
   * Add a new empty item to the list
   */
  const handleAdd = useCallback(() => {
    onItemsChange([...items, { itemId: '', amount: 1 }]);
  }, [items, onItemsChange]);

  /**
   * Update an item at a specific index
   */
  const handleUpdate = useCallback(
    (index: number, field: keyof RecipeIO, value: string | number) => {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        [field]: field === 'amount' ? Math.max(0, Number(value)) : value,
      };
      onItemsChange(newItems);
    },
    [items, onItemsChange]
  );

  /**
   * Remove an item at a specific index
   */
  const handleRemove = useCallback(
    (index: number) => {
      onItemsChange(items.filter((_, i) => i !== index));
    },
    [items, onItemsChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-endfield-off-white">
          {label}
        </label>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
          style={{ backgroundColor: accentColor, color: '#0A0A0A' }}
          aria-label={`Add ${label.toLowerCase().slice(0, -1)}`}
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-endfield-muted italic text-center py-3 bg-endfield-mid-gray/50 rounded">
          No {label.toLowerCase()} defined
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${label}-${index}`}
              className="flex items-center gap-2 bg-endfield-mid-gray p-2 rounded"
            >
              {/* Item Name */}
              <input
                type="text"
                value={item.itemId}
                onChange={(e) => handleUpdate(index, 'itemId', e.target.value)}
                placeholder="Item name..."
                className="flex-1 px-2 py-1 bg-endfield-dark-gray border border-endfield-light-gray rounded text-endfield-off-white text-sm placeholder-endfield-muted focus:outline-none focus:border-endfield-yellow"
              />

              {/* Amount */}
              <input
                type="number"
                value={item.amount}
                onChange={(e) => handleUpdate(index, 'amount', e.target.value)}
                min={0}
                step={0.1}
                className="w-20 px-2 py-1 bg-endfield-dark-gray border border-endfield-light-gray rounded text-endfield-off-white text-sm text-center focus:outline-none focus:border-endfield-yellow"
              />

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(index)}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                aria-label={`Remove ${item.itemId || 'item'}`}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * @description Props for the RecipeBuilder component
 */
interface RecipeBuilderProps {
  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * @description Recipe Builder modal component
 *
 * Provides a form for creating and editing recipes with:
 * - Text input for recipe name
 * - Dropdown for machine type selection
 * - Number input for duration (processing time)
 * - Dynamic lists for inputs and outputs
 *
 * @param props - Component props
 *
 * @example
 * <RecipeBuilder onClose={() => setShowBuilder(false)} />
 */
export const RecipeBuilder: React.FC<RecipeBuilderProps> = ({ onClose }) => {
  const editingRecipeId = useEditingRecipeId();
  const machineDefs = useMachineDefs();
  const getRecipeById = useStore((state) => state.getRecipeById);
  const addRecipe = useStore((state) => state.addRecipe);
  const updateRecipe = useStore((state) => state.updateRecipe);

  // Get existing recipe if editing
  const existingRecipe = editingRecipeId
    ? getRecipeById(editingRecipeId)
    : undefined;

  // Form state
  const [name, setName] = useState(existingRecipe?.name ?? '');
  const [machineType, setMachineType] = useState(
    existingRecipe?.machineType ?? (machineDefs[0]?.id ?? '')
  );
  const [duration, setDuration] = useState(existingRecipe?.duration ?? 1);
  const [inputs, setInputs] = useState<RecipeIO[]>(
    existingRecipe?.inputs ?? []
  );
  const [outputs, setOutputs] = useState<RecipeIO[]>(
    existingRecipe?.outputs ?? []
  );

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Reset form when editing recipe changes
   */
  useEffect(() => {
    if (existingRecipe) {
      setName(existingRecipe.name);
      setMachineType(existingRecipe.machineType);
      setDuration(existingRecipe.duration);
      setInputs([...existingRecipe.inputs]);
      setOutputs([...existingRecipe.outputs]);
    }
  }, [existingRecipe]);

  /**
   * Validate the form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!machineType) {
      newErrors.machineType = 'Machine type is required';
    }

    if (duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    // Validate inputs - check for empty item names
    const invalidInputs = inputs.filter((item) => !item.itemId.trim());
    if (invalidInputs.length > 0) {
      newErrors.inputs = 'All input items must have a name';
    }

    // Validate outputs - check for empty item names
    const invalidOutputs = outputs.filter((item) => !item.itemId.trim());
    if (invalidOutputs.length > 0) {
      newErrors.outputs = 'All output items must have a name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, machineType, duration, inputs, outputs]);

  /**
   * Handle form submission
   */
  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    const recipeData: Omit<Recipe, 'id'> = {
      name: name.trim(),
      machineType,
      duration,
      inputs: inputs.filter((item) => item.itemId.trim()),
      outputs: outputs.filter((item) => item.itemId.trim()),
    };

    if (editingRecipeId) {
      updateRecipe(editingRecipeId, recipeData);
    } else {
      const newRecipe: Recipe = {
        id: generateId('recipe'),
        ...recipeData,
      };
      addRecipe(newRecipe);
    }

    onClose();
  }, [
    validateForm,
    name,
    machineType,
    duration,
    inputs,
    outputs,
    editingRecipeId,
    updateRecipe,
    addRecipe,
    onClose,
  ]);

  /**
   * Handle escape key to close
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  /**
   * Get the selected machine info for display
   */
  const selectedMachine = machineDefs.find((m) => m.id === machineType);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-endfield-dark-gray rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-endfield-mid-gray">
          <h2 className="text-lg font-semibold text-endfield-yellow">
            {editingRecipeId ? 'Edit Recipe' : 'Create Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-endfield-mid-gray rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-endfield-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Name Input */}
          <div>
            <label
              htmlFor="recipe-name"
              className="block text-sm font-medium text-endfield-off-white mb-2"
            >
              Recipe Name
            </label>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipe name..."
              className={`w-full px-3 py-2 bg-endfield-mid-gray border rounded text-endfield-off-white placeholder-endfield-muted focus:outline-none focus:border-endfield-yellow ${
                errors.name ? 'border-red-500' : 'border-endfield-light-gray'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Machine Type Dropdown */}
          <div>
            <label
              htmlFor="recipe-machine"
              className="block text-sm font-medium text-endfield-off-white mb-2"
            >
              Machine Type
            </label>
            <select
              id="recipe-machine"
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              className={`w-full px-3 py-2 bg-endfield-mid-gray border rounded text-endfield-off-white focus:outline-none focus:border-endfield-yellow appearance-none cursor-pointer ${
                errors.machineType
                  ? 'border-red-500'
                  : 'border-endfield-light-gray'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '16px',
              }}
            >
              {machineDefs.length === 0 ? (
                <option value="">No machines available</option>
              ) : (
                machineDefs.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))
              )}
            </select>
            {errors.machineType && (
              <p className="mt-1 text-xs text-red-500">{errors.machineType}</p>
            )}
            {selectedMachine && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedMachine.color }}
                />
                <span className="text-xs text-endfield-muted">
                  {selectedMachine.width}x{selectedMachine.height} cells
                </span>
              </div>
            )}
          </div>

          {/* Duration Input */}
          <div>
            <label
              htmlFor="recipe-duration"
              className="block text-sm font-medium text-endfield-off-white mb-2"
            >
              Duration (seconds)
            </label>
            <input
              id="recipe-duration"
              type="number"
              value={duration}
              onChange={(e) =>
                setDuration(Math.max(0.1, parseFloat(e.target.value) || 0.1))
              }
              min={0.1}
              step={0.1}
              className={`w-full px-3 py-2 bg-endfield-mid-gray border rounded text-endfield-off-white focus:outline-none focus:border-endfield-yellow ${
                errors.duration ? 'border-red-500' : 'border-endfield-light-gray'
              }`}
            />
            {errors.duration && (
              <p className="mt-1 text-xs text-red-500">{errors.duration}</p>
            )}
            <p className="mt-1 text-xs text-endfield-muted">
              Processing time per crafting cycle
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-endfield-mid-gray" />

          {/* Inputs Section */}
          <div>
            <IOList
              label="Inputs"
              items={inputs}
              onItemsChange={setInputs}
              accentColor="#22C55E"
            />
            {errors.inputs && (
              <p className="mt-1 text-xs text-red-500">{errors.inputs}</p>
            )}
          </div>

          {/* Outputs Section */}
          <div>
            <IOList
              label="Outputs"
              items={outputs}
              onItemsChange={setOutputs}
              accentColor="#3B82F6"
            />
            {errors.outputs && (
              <p className="mt-1 text-xs text-red-500">{errors.outputs}</p>
            )}
          </div>

          {/* Recipe Summary */}
          <div className="bg-endfield-mid-gray/50 rounded p-4 text-sm">
            <h4 className="font-medium text-endfield-off-white mb-2">
              Recipe Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-endfield-muted">
              <div>Duration:</div>
              <div className="text-endfield-off-white">{duration}s</div>
              <div>Inputs:</div>
              <div className="text-endfield-off-white">
                {inputs.filter((i) => i.itemId.trim()).length} items
              </div>
              <div>Outputs:</div>
              <div className="text-endfield-off-white">
                {outputs.filter((o) => o.itemId.trim()).length} items
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-endfield-mid-gray">
          <button onClick={onClose} className="btn-ghost" aria-label="Cancel">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            aria-label={editingRecipeId ? 'Save changes' : 'Create recipe'}
          >
            {editingRecipeId ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
};
