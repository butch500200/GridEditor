/**
 * @fileoverview Right inspector panel component
 *
 * Displays detailed information about the currently selected machine
 * or grid item. Shows properties, assigned recipes, and allows editing
 * of machine configurations.
 */

import React from 'react';
import { Info, Cog, ArrowRight, ArrowLeft, Clock, RotateCw, Trash2 } from 'lucide-react';
import { useStore, useSelectedGridItem } from '../store/useStore';
import { getDirectionLabel } from '../utils/gridUtils';
import type { GridItem, MachineDef, Recipe } from '../types';

/**
 * @description Props for the PropertyRow component
 */
interface PropertyRowProps {
  /** Property label */
  label: string;
  /** Property value */
  value: React.ReactNode;
}

/**
 * @description Displays a single property row
 */
const PropertyRow: React.FC<PropertyRowProps> = ({ label, value }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b border-endfield-mid-gray">
      <span className="text-endfield-muted text-sm">{label}</span>
      <span className="text-endfield-off-white text-sm font-medium">{value}</span>
    </div>
  );
};

/**
 * @description Props for machine details section
 */
interface MachineDetailsProps {
  /** The machine definition */
  machineDef: MachineDef;
  /** The placed grid item (if inspecting a placed machine) */
  gridItem?: GridItem;
  /** Available recipes for this machine type */
  recipes: Recipe[];
}

/**
 * @description Displays detailed machine information
 */
const MachineDetails: React.FC<MachineDetailsProps> = ({
  machineDef,
  gridItem,
  recipes,
}) => {
  const updateGridItem = useStore((state) => state.updateGridItem);
  const removeGridItem = useStore((state) => state.removeGridItem);

  // Find currently assigned recipe
  const assignedRecipe = gridItem?.assignedRecipeId
    ? recipes.find((r) => r.id === gridItem.assignedRecipeId)
    : null;

  /**
   * Handle recipe selection change
   */
  const handleRecipeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!gridItem) return;
    const recipeId = e.target.value || null;
    updateGridItem(gridItem.id, { assignedRecipeId: recipeId });
  };

  /**
   * Handle rotation change
   */
  const handleRotate = () => {
    if (!gridItem) return;
    const newRotation = ((gridItem.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    updateGridItem(gridItem.id, { rotation: newRotation });
  };

  /**
   * Handle delete
   */
  const handleDelete = () => {
    if (!gridItem) return;
    removeGridItem(gridItem.id);
  };

  return (
    <div className="space-y-4">
      {/* Machine Preview */}
      <div className="flex items-center gap-4 p-4 bg-endfield-mid-gray rounded">
        <div
          className="w-16 h-16 rounded flex items-center justify-center"
          style={{ backgroundColor: machineDef.color }}
        >
          <Cog className="w-8 h-8 text-white/80" />
        </div>
        <div>
          <h3 className="text-endfield-off-white font-semibold text-lg">
            {machineDef.name}
          </h3>
          <p className="text-endfield-muted text-sm">
            {machineDef.width}x{machineDef.height} cells
          </p>
        </div>
      </div>

      {/* Position and Rotation (only for placed items) */}
      {gridItem && (
        <div className="space-y-1">
          <h4 className="text-endfield-yellow text-xs uppercase tracking-wider font-semibold mb-2">
            Position
          </h4>
          <PropertyRow label="X" value={gridItem.x} />
          <PropertyRow label="Y" value={gridItem.y} />
          <PropertyRow label="Rotation" value={`${gridItem.rotation}°`} />
        </div>
      )}

      {/* Ports */}
      <div className="space-y-1">
        <h4 className="text-endfield-yellow text-xs uppercase tracking-wider font-semibold mb-2">
          Ports
        </h4>
        {machineDef.ports.map((port, index) => (
          <div
            key={index}
            className="flex items-center gap-2 py-2 border-b border-endfield-mid-gray"
          >
            {port.type === 'input' ? (
              <ArrowRight className="w-4 h-4 text-green-400" />
            ) : (
              <ArrowLeft className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-endfield-off-white text-sm capitalize">
              {port.type}
            </span>
            <span className="text-endfield-muted text-sm">
              ({port.offsetX}, {port.offsetY}) - {getDirectionLabel(port.direction)}
            </span>
          </div>
        ))}
      </div>

      {/* Recipe Assignment (only for placed items) */}
      {gridItem && recipes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-endfield-yellow text-xs uppercase tracking-wider font-semibold">
            Recipe
          </h4>
          <select
            value={gridItem.assignedRecipeId || ''}
            onChange={handleRecipeChange}
            className="w-full bg-endfield-mid-gray text-endfield-off-white
                       border border-endfield-light-gray rounded px-3 py-2 text-sm
                       focus:outline-none focus:border-endfield-yellow"
          >
            <option value="">No recipe assigned</option>
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>

          {/* Recipe Details */}
          {assignedRecipe && (
            <div className="bg-endfield-mid-gray p-3 rounded mt-2 space-y-2">
              <div className="flex items-center gap-2 text-endfield-muted text-xs">
                <Clock className="w-3 h-3" />
                <span>{assignedRecipe.duration}s per cycle</span>
              </div>
              {assignedRecipe.inputs.length > 0 && (
                <div>
                  <span className="text-xs text-green-400">Inputs:</span>
                  <ul className="text-xs text-endfield-off-white ml-2">
                    {assignedRecipe.inputs.map((input, i) => (
                      <li key={i}>
                        {input.amount}x {input.itemId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {assignedRecipe.outputs.length > 0 && (
                <div>
                  <span className="text-xs text-blue-400">Outputs:</span>
                  <ul className="text-xs text-endfield-off-white ml-2">
                    {assignedRecipe.outputs.map((output, i) => (
                      <li key={i}>
                        {output.amount}x {output.itemId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions (only for placed items) */}
      {gridItem && (
        <div className="space-y-2 pt-4 border-t border-endfield-mid-gray">
          <button
            onClick={handleRotate}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Rotate 90°
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded
                       bg-red-900/50 text-red-400 border border-red-800
                       hover:bg-red-900 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Machine
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * @description Empty state when nothing is selected
 */
const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Info className="w-12 h-12 text-endfield-muted mb-4" />
      <h3 className="text-endfield-off-white font-medium mb-2">Nothing Selected</h3>
      <p className="text-endfield-muted text-sm">
        Select a machine from the palette to place it, or click on a placed machine
        to view its details.
      </p>
    </div>
  );
};

/**
 * @description Right inspector panel showing details of selected items
 *
 * Features:
 * - Machine definition details
 * - Position and rotation info
 * - Port configuration
 * - Recipe assignment
 * - Edit actions (rotate, delete)
 *
 * @example
 * <Inspector />
 */
export const Inspector: React.FC = () => {
  const selectedMachineDefId = useStore((state) => state.selectedMachineDefId);
  const getMachineDefById = useStore((state) => state.getMachineDefById);
  const getRecipesForMachine = useStore((state) => state.getRecipesForMachine);
  const selectedGridItem = useSelectedGridItem();

  // Determine what to show
  let machineDef: MachineDef | undefined;
  let recipes: Recipe[] = [];

  if (selectedGridItem) {
    // Showing a placed machine
    machineDef = getMachineDefById(selectedGridItem.machineDefId);
    if (machineDef) {
      recipes = getRecipesForMachine(machineDef.id);
    }
  } else if (selectedMachineDefId) {
    // Showing a machine definition for placement
    machineDef = getMachineDefById(selectedMachineDefId);
    if (machineDef) {
      recipes = getRecipesForMachine(machineDef.id);
    }
  }

  return (
    <aside className="panel w-72 flex flex-col h-full border-l border-r-0">
      {/* Header */}
      <div className="panel-header flex items-center gap-2">
        <Info className="w-4 h-4" />
        <span>Inspector</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {machineDef ? (
          <MachineDetails
            machineDef={machineDef}
            gridItem={selectedGridItem ?? undefined}
            recipes={recipes}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </aside>
  );
};
