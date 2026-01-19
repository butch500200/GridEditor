/**
 * @fileoverview Type definitions for Endfield Factory Planner
 *
 * Contains all core data models used throughout the application including
 * machine definitions, recipes, and grid placement items.
 */

/**
 * Direction enum for port facing directions
 * N = North (up), E = East (right), S = South (down), W = West (left)
 */
export type Direction = 'N' | 'E' | 'S' | 'W';

/**
 * Port type for inputs and outputs on machines
 */
export type PortType = 'input' | 'output';

/**
 * @description Represents a connection port on a machine
 * Ports define where items can enter or exit a machine.
 *
 * @property type - Whether this port accepts inputs or produces outputs
 * @property offsetX - Horizontal offset from machine origin (in grid cells)
 * @property offsetY - Vertical offset from machine origin (in grid cells)
 * @property direction - The direction the port faces (for connection logic)
 */
export interface MachinePort {
  type: PortType;
  offsetX: number;
  offsetY: number;
  direction: Direction;
}

/**
 * @description Defines a type of machine that can be placed on the grid
 * This is the "blueprint" for a machine, not an instance.
 *
 * @property id - Unique identifier for this machine type
 * @property name - Human-readable display name
 * @property width - Width in grid cells
 * @property height - Height in grid cells
 * @property color - Hex color code for visual representation
 * @property ports - Array of input/output ports on this machine
 *
 * @example
 * const assembler: MachineDef = {
 *   id: 'assembler-mk1',
 *   name: 'Assembler Mk1',
 *   width: 3,
 *   height: 3,
 *   color: '#4A90D9',
 *   ports: [
 *     { type: 'input', offsetX: 0, offsetY: 1, direction: 'W' },
 *     { type: 'output', offsetX: 2, offsetY: 1, direction: 'E' }
 *   ]
 * };
 */
export interface MachineDef {
  id: string;
  name: string;
  width: number;
  height: number;
  color: string;
  ports: MachinePort[];
}

/**
 * @description Represents an input or output requirement for a recipe
 *
 * @property itemId - Identifier for the item type
 * @property amount - Quantity required/produced per cycle
 */
export interface RecipeIO {
  itemId: string;
  amount: number;
}

/**
 * @description Defines a crafting recipe that can be assigned to a machine
 *
 * @property id - Unique identifier for this recipe
 * @property name - Human-readable display name
 * @property machineType - The machine type ID this recipe can run on
 * @property duration - Time in seconds to complete one cycle
 * @property inputs - Array of required input items
 * @property outputs - Array of produced output items
 *
 * @example
 * const ironPlateRecipe: Recipe = {
 *   id: 'iron-plate',
 *   name: 'Iron Plate',
 *   machineType: 'smelter-mk1',
 *   duration: 3.2,
 *   inputs: [{ itemId: 'iron-ore', amount: 1 }],
 *   outputs: [{ itemId: 'iron-plate', amount: 1 }]
 * };
 */
export interface Recipe {
  id: string;
  name: string;
  machineType: string;
  duration: number;
  inputs: RecipeIO[];
  outputs: RecipeIO[];
}

/**
 * @description Rotation values in degrees for placed machines
 */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * @description Represents a placed machine instance on the grid
 * This is an actual placed machine, referencing a MachineDef.
 *
 * @property id - Unique identifier for this placed instance
 * @property machineDefId - Reference to the MachineDef this is an instance of
 * @property x - X coordinate on the grid (left edge)
 * @property y - Y coordinate on the grid (top edge)
 * @property rotation - Rotation in degrees (0, 90, 180, 270)
 * @property assignedRecipeId - Optional recipe assigned to this machine
 *
 * @example
 * const placedAssembler: GridItem = {
 *   id: 'machine-001',
 *   machineDefId: 'assembler-mk1',
 *   x: 10,
 *   y: 5,
 *   rotation: 0,
 *   assignedRecipeId: 'copper-wire'
 * };
 */
export interface GridItem {
  id: string;
  machineDefId: string;
  x: number;
  y: number;
  rotation: Rotation;
  assignedRecipeId: string | null;
}

/**
 * @description Grid position as a simple coordinate pair
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * @description Represents the current state of ghost placement preview
 *
 * @property machineDefId - The machine type being placed
 * @property x - Current ghost X position
 * @property y - Current ghost Y position
 * @property rotation - Current ghost rotation
 * @property isValid - Whether the placement is valid (no collisions)
 */
export interface GhostPlacement {
  machineDefId: string;
  x: number;
  y: number;
  rotation: Rotation;
  isValid: boolean;
}

/**
 * @description Tool types available in the editor
 */
export type ToolType = 'select' | 'place' | 'delete';

/**
 * @description Represents a belt connection between two machine ports
 *
 * @property id - Unique identifier for this connection
 * @property sourceItemId - ID of the source grid item (output port)
 * @property sourcePortIndex - Index of the port on the source machine
 * @property targetItemId - ID of the target grid item (input port)
 * @property targetPortIndex - Index of the port on the target machine
 * @property path - Array of grid coordinates defining the belt's path
 */
export interface Connection {
  id: string;
  sourceItemId: string;
  sourcePortIndex: number;
  targetItemId: string;
  targetPortIndex: number;
}

/**
 * @description State for currently selected port during connection creation
 */
export interface ActivePort {
  itemId: string;
  portIndex: number;
  type: PortType;
}

/**
 * @description Bounding box for collision detection
 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * @description Represents the state when dragging an existing machine to move it
 *
 * @property gridItemId - The ID of the grid item being dragged
 * @property machineDefId - The machine definition ID for rendering
 * @property originalX - The original X position before dragging started
 * @property originalY - The original Y position before dragging started
 * @property originalRotation - The original rotation before dragging started
 * @property currentX - Current ghost X position while dragging
 * @property currentY - Current ghost Y position while dragging
 * @property isValid - Whether the current drop position is valid
 */
export interface DragMoveState {
  gridItemId: string; // Primary item being dragged
  machineDefId: string;
  originalX: number;
  originalY: number;
  originalRotation: Rotation;
  currentX: number;
  currentY: number;
  currentRotation: Rotation;
  isValid: boolean;
  // Multi-selection support
  draggedItems?: Array<{
    id: string;
    originalX: number;
    originalY: number;
    originalRotation: Rotation;
    offsetX: number; // Offset from primary item
    offsetY: number;
  }>;
}

/**
 * @description Represents a machine in multi-ghost placement mode
 * Used when pasting multiple machines at once
 */
export interface MultiGhostMachine {
  machineDefId: string;
  offsetX: number;
  offsetY: number;
  rotation: Rotation;
  assignedRecipeId: string | null;
}

/**
 * @description State for placing multiple machines at once (e.g., from paste)
 * Similar to ghost placement but handles multiple machines with relative offsets
 */
export interface MultiGhostPlacement {
  machines: MultiGhostMachine[];
  currentX: number;
  currentY: number;
  isValid: boolean;
}
