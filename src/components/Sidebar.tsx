/**
 * @fileoverview Left sidebar component - Machine palette
 *
 * Displays available machine definitions that users can select
 * and place on the grid. Provides visual previews of each machine
 * type with their colors, dimensions, and port indicators.
 */

import React, { useState } from 'react';
import {
  Factory,
  MousePointer2,
  Trash2,
  RotateCw,
  Plus,
  BookOpen,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore, useMachineDefs, useCurrentTool, useRecipes } from '../store/useStore';
import type { MachineDef, MachinePort, ToolType, Recipe } from '../types';

/**
 * Port indicator colors (matching Grid.tsx)
 */
const PORT_COLORS = {
  input: '#22C55E', // Green for inputs
  output: '#3B82F6', // Blue for outputs
} as const;

/**
 * @description Calculates the visual position of a port indicator line for sidebar preview
 *
 * @param port - The port definition
 * @param machineWidth - Width of the machine in cells
 * @param machineHeight - Height of the machine in cells
 * @param previewWidth - Width of the preview box in pixels
 * @param previewHeight - Height of the preview box in pixels
 * @param scale - Scale factor from machine cells to preview pixels
 * @returns Style object for positioning the port indicator
 */
const getSidebarPortIndicatorStyle = (
  port: MachinePort,
  _machineWidth: number,
  _machineHeight: number,
  _previewWidth: number,
  _previewHeight: number,
  scale: number
): React.CSSProperties => {
  // Scale the line dimensions for sidebar preview
  const cellSizeInPreview = 20 * scale;
  const lineLength = cellSizeInPreview * .8;
  const lineThickness = 2;

  // Calculate cell center position in preview coordinates
  const cellCenterX = port.offsetX * cellSizeInPreview + cellSizeInPreview / 2;
  const cellCenterY = port.offsetY * cellSizeInPreview + cellSizeInPreview / 2;

  let style: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: PORT_COLORS[port.type],
    borderRadius: '1px',
    zIndex: 10,
  };

  // Position based on direction (port faces outward from this edge)
  switch (port.direction) {
    case 'N': // Top edge
      style = {
        ...style,
        width: lineLength,
        height: lineThickness,
        left: cellCenterX - lineLength / 2,
        top: 0,
      };
      break;
    case 'E': // Right edge
      style = {
        ...style,
        width: lineThickness,
        height: lineLength,
        right: 0,
        top: cellCenterY - lineLength / 2,
      };
      break;
    case 'S': // Bottom edge
      style = {
        ...style,
        width: lineLength,
        height: lineThickness,
        left: cellCenterX - lineLength / 2,
        bottom: 0,
      };
      break;
    case 'W': // Left edge
      style = {
        ...style,
        width: lineThickness,
        height: lineLength,
        left: 0,
        top: cellCenterY - lineLength / 2,
      };
      break;
  }

  return style;
};

/**
 * @description Props for the SidebarPortIndicators component
 */
interface SidebarPortIndicatorsProps {
  /** Array of ports to render */
  ports: MachinePort[];
  /** Machine width in cells */
  machineWidth: number;
  /** Machine height in cells */
  machineHeight: number;
  /** Preview width in pixels */
  previewWidth: number;
  /** Preview height in pixels */
  previewHeight: number;
  /** Scale factor */
  scale: number;
}

/**
 * @description Renders port indicator lines on a sidebar machine preview
 *
 * Input ports are shown in green, output ports in blue.
 * Lines appear on the edge of the preview based on port direction.
 *
 * @param props - Component props
 * @returns Rendered port indicators
 */
const SidebarPortIndicators: React.FC<SidebarPortIndicatorsProps> = ({
  ports,
  machineWidth,
  machineHeight,
  previewWidth,
  previewHeight,
  scale,
}) => {
  return (
    <>
      {ports.map((port, index) => (
        <div
          key={`sidebar-port-${index}-${port.type}-${port.direction}`}
          style={getSidebarPortIndicatorStyle(
            port,
            machineWidth,
            machineHeight,
            previewWidth,
            previewHeight,
            scale
          )}
          title={`${port.type === 'input' ? 'Input' : 'Output'} port (${port.direction})`}
        />
      ))}
    </>
  );
};

/**
 * @description Props for the MachineCard component
 */
interface MachineCardProps {
  /** The machine definition to display */
  machine: MachineDef;
  /** Whether this machine is currently selected */
  isSelected: boolean;
  /** Callback when the card is clicked */
  onClick: () => void;
  /** Callback when the edit button is clicked */
  onEdit: () => void;
}

/**
 * @description Individual machine card in the palette
 *
 * Displays a visual preview of the machine with its name, dimensions,
 * color, and port indicators. Shows selection state with border highlight.
 *
 * @param props - Component props
 * @returns Rendered machine card
 */
const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  isSelected,
  onClick,
  onEdit,
}) => {
  // Calculate a preview size that fits in the card (max 80px width)
  const maxPreviewSize = 80;
  const scale = Math.min(
    maxPreviewSize / (machine.width * 20),
    maxPreviewSize / (machine.height * 20)
  );
  const previewWidth = machine.width * 20 * scale;
  const previewHeight = machine.height * 20 * scale;

  return (
    <button
      onClick={onClick}
      className={`machine-card w-full text-left ${isSelected ? 'selected' : ''}`}
      aria-pressed={isSelected}
      aria-label={`Select ${machine.name} (${machine.width}x${machine.height})`}
    >
      <div className="flex items-center gap-3">
        {/* Machine preview */}
        <div
          className="flex-shrink-0 rounded flex items-center justify-center"
          style={{
            width: maxPreviewSize,
            height: maxPreviewSize,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="rounded-sm relative"
            style={{
              width: previewWidth,
              height: previewHeight,
              backgroundColor: machine.color,
              boxShadow: `0 0 10px ${machine.color}40`,
            }}
          >
            {/* Port indicators on preview */}
            <SidebarPortIndicators
              ports={machine.ports}
              machineWidth={machine.width}
              machineHeight={machine.height}
              previewWidth={previewWidth}
              previewHeight={previewHeight}
              scale={scale}
            />
          </div>
        </div>

        {/* Machine info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-endfield-off-white font-medium text-sm truncate flex-1">
              {machine.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 hover:bg-endfield-light-gray rounded transition-colors ml-1"
              aria-label={`Edit ${machine.name}`}
              title="Edit machine"
            >
              <Pencil className="w-3 h-3 text-endfield-muted hover:text-endfield-yellow" />
            </button>
          </div>
          <p className="text-endfield-muted text-xs mt-1">
            {machine.width} x {machine.height} cells
          </p>
          <p className="text-endfield-muted text-xs">
            <span style={{ color: PORT_COLORS.input }}>
              {machine.ports.filter((p) => p.type === 'input').length} in
            </span>
            {' / '}
            <span style={{ color: PORT_COLORS.output }}>
              {machine.ports.filter((p) => p.type === 'output').length} out
            </span>
          </p>
        </div>
      </div>
    </button>
  );
};

/**
 * @description Props for the RecipeCard component
 */
interface RecipeCardProps {
  /** The recipe to display */
  recipe: Recipe;
  /** The machine this recipe is for */
  machine: MachineDef | undefined;
  /** Callback when the edit button is clicked */
  onEdit: () => void;
}

/**
 * @description Individual recipe card in the recipes list
 *
 * Displays recipe information including name, duration, and I/O counts.
 * Shows the associated machine color for visual reference.
 *
 * @param props - Component props
 * @returns Rendered recipe card
 */
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, machine, onEdit }) => {
  return (
    <div className="bg-endfield-mid-gray p-3 rounded border border-transparent hover:border-endfield-light-gray transition-all">
      <div className="flex items-start gap-3">
        {/* Machine color indicator */}
        <div
          className="w-3 h-3 rounded mt-1 flex-shrink-0"
          style={{ backgroundColor: machine?.color ?? '#666' }}
          title={machine?.name ?? 'Unknown machine'}
        />

        {/* Recipe info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-endfield-off-white font-medium text-sm truncate flex-1">
              {recipe.name}
            </h4>
            <button
              onClick={onEdit}
              className="p-1 hover:bg-endfield-light-gray rounded transition-colors ml-1"
              aria-label={`Edit ${recipe.name}`}
              title="Edit recipe"
            >
              <Pencil className="w-3 h-3 text-endfield-muted hover:text-endfield-yellow" />
            </button>
          </div>
          <p className="text-endfield-muted text-xs mt-1">
            {machine?.name ?? 'Unknown'} | {recipe.duration}s
          </p>
          <p className="text-endfield-muted text-xs">
            <span style={{ color: PORT_COLORS.input }}>
              {recipe.inputs.length} inputs
            </span>
            {' -> '}
            <span style={{ color: PORT_COLORS.output }}>
              {recipe.outputs.length} outputs
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * @description Props for tool button component
 */
interface ToolButtonProps {
  /** Tool type identifier */
  tool: ToolType;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Button label for accessibility */
  label: string;
  /** Whether this tool is currently active */
  isActive: boolean;
  /** Callback when clicked */
  onClick: () => void;
}

/**
 * @description Tool selection button
 */
const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded transition-all text-sm
        ${
          isActive
            ? 'bg-endfield-yellow text-endfield-black'
            : 'bg-endfield-mid-gray text-endfield-off-white hover:bg-endfield-light-gray'
        }`}
      aria-pressed={isActive}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

/**
 * Sidebar tab types
 */
type SidebarTab = 'machines' | 'recipes';

/**
 * @description Left sidebar containing the machine palette, recipes, and tool selection
 *
 * Features:
 * - Tool selection (Select, Place, Delete)
 * - Tabbed view for machines and recipes
 * - Visual machine previews with port indicators
 * - Create and edit buttons for machines and recipes
 * - Selection state management
 *
 * @example
 * <Sidebar />
 */
export const Sidebar: React.FC = () => {
  const machineDefs = useMachineDefs();
  const recipes = useRecipes();
  const currentTool = useCurrentTool();
  const selectedMachineDefId = useStore((state) => state.selectedMachineDefId);
  const selectMachineDef = useStore((state) => state.selectMachineDef);
  const setCurrentTool = useStore((state) => state.setCurrentTool);
  const clearSelection = useStore((state) => state.clearSelection);
  const openMachineBuilder = useStore((state) => state.openMachineBuilder);
  const openRecipeBuilder = useStore((state) => state.openRecipeBuilder);
  const getMachineDefById = useStore((state) => state.getMachineDefById);

  // Tab state
  const [activeTab, setActiveTab] = useState<SidebarTab>('machines');
  // Recipe section collapsed state
  const [recipesExpanded, setRecipesExpanded] = useState(true);

  /**
   * Handle machine card click - select for placement
   */
  const handleMachineClick = (machineId: string) => {
    if (selectedMachineDefId === machineId) {
      // Deselect if clicking the same machine
      clearSelection();
    } else {
      selectMachineDef(machineId);
    }
  };

  /**
   * Handle tool button click
   */
  const handleToolClick = (tool: ToolType) => {
    if (tool === 'select') {
      clearSelection();
    } else {
      setCurrentTool(tool);
    }
  };

  return (
    <aside className="panel w-64 flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex border-b border-endfield-mid-gray">
        <button
          onClick={() => setActiveTab('machines')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
            activeTab === 'machines'
              ? 'text-endfield-yellow border-b-2 border-endfield-yellow bg-endfield-mid-gray/30'
              : 'text-endfield-muted hover:text-endfield-off-white'
          }`}
          aria-selected={activeTab === 'machines'}
        >
          <Factory className="w-4 h-4" />
          Machines
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
            activeTab === 'recipes'
              ? 'text-endfield-yellow border-b-2 border-endfield-yellow bg-endfield-mid-gray/30'
              : 'text-endfield-muted hover:text-endfield-off-white'
          }`}
          aria-selected={activeTab === 'recipes'}
        >
          <BookOpen className="w-4 h-4" />
          Recipes
        </button>
      </div>

      {/* Machines Tab Content */}
      {activeTab === 'machines' && (
        <>
          {/* Tool Selection */}
          <div className="p-3 border-b border-endfield-mid-gray">
            <div className="flex gap-2">
              <ToolButton
                tool="select"
                icon={<MousePointer2 className="w-4 h-4" />}
                label="Select"
                isActive={currentTool === 'select' && !selectedMachineDefId}
                onClick={() => handleToolClick('select')}
              />
              <ToolButton
                tool="delete"
                icon={<Trash2 className="w-4 h-4" />}
                label="Delete"
                isActive={currentTool === 'delete'}
                onClick={() => handleToolClick('delete')}
              />
            </div>
          </div>

          {/* Rotation hint when placing */}
          {selectedMachineDefId && (
            <div className="px-3 py-2 bg-endfield-mid-gray/50 border-b border-endfield-mid-gray">
              <div className="flex items-center gap-2 text-xs text-endfield-muted">
                <RotateCw className="w-3 h-3" />
                <span>Press R to rotate</span>
              </div>
            </div>
          )}

          {/* Port Legend */}
          <div className="px-3 py-2 border-b border-endfield-mid-gray bg-endfield-mid-gray/30">
            <div className="flex items-center gap-4 text-xs text-endfield-muted">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: PORT_COLORS.input }}
                />
                <span>Input</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: PORT_COLORS.output }}
                />
                <span>Output</span>
              </div>
            </div>
          </div>

          {/* Create Machine Button */}
          <div className="p-3 border-b border-endfield-mid-gray">
            <button
              onClick={() => openMachineBuilder()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-endfield-yellow text-endfield-black font-medium text-sm rounded hover:bg-endfield-yellow-light transition-colors"
              aria-label="Create new machine"
            >
              <Plus className="w-4 h-4" />
              Create Machine
            </button>
          </div>

          {/* Machine List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {machineDefs.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  isSelected={selectedMachineDefId === machine.id}
                  onClick={() => handleMachineClick(machine.id)}
                  onEdit={() => openMachineBuilder(machine.id)}
                />
              ))}
            </div>

            {machineDefs.length === 0 && (
              <div className="text-center text-endfield-muted py-8">
                <p>No machines available</p>
                <p className="text-xs mt-2">
                  Click "Create Machine" to add one
                </p>
              </div>
            )}
          </div>

          {/* Footer with stats */}
          <div className="p-3 border-t border-endfield-mid-gray text-xs text-endfield-muted">
            {machineDefs.length} machines available
          </div>
        </>
      )}

      {/* Recipes Tab Content */}
      {activeTab === 'recipes' && (
        <>
          {/* Create Recipe Button */}
          <div className="p-3 border-b border-endfield-mid-gray">
            <button
              onClick={() => openRecipeBuilder()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-endfield-yellow text-endfield-black font-medium text-sm rounded hover:bg-endfield-yellow-light transition-colors"
              aria-label="Create new recipe"
            >
              <Plus className="w-4 h-4" />
              Create Recipe
            </button>
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto">
            {/* Collapsible section header */}
            <button
              onClick={() => setRecipesExpanded(!recipesExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 bg-endfield-mid-gray/30 hover:bg-endfield-mid-gray/50 transition-colors"
              aria-expanded={recipesExpanded}
            >
              <span className="text-sm text-endfield-off-white font-medium">
                All Recipes ({recipes.length})
              </span>
              {recipesExpanded ? (
                <ChevronUp className="w-4 h-4 text-endfield-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-endfield-muted" />
              )}
            </button>

            {recipesExpanded && (
              <div className="p-3 space-y-2">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    machine={getMachineDefById(recipe.machineType)}
                    onEdit={() => openRecipeBuilder(recipe.id)}
                  />
                ))}

                {recipes.length === 0 && (
                  <div className="text-center text-endfield-muted py-8">
                    <p>No recipes available</p>
                    <p className="text-xs mt-2">
                      Click "Create Recipe" to add one
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with stats */}
          <div className="p-3 border-t border-endfield-mid-gray text-xs text-endfield-muted">
            {recipes.length} recipes available
          </div>
        </>
      )}
    </aside>
  );
};
