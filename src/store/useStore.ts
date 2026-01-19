/**
 * @fileoverview Zustand store for Endfield Factory Planner
 *
 * Central state management for the factory planner including:
 * - Machine definitions (blueprints)
 * - Recipes
 * - Placed grid items
 * - Selection and tool state
 * - Ghost placement preview
 */

import { create } from 'zustand';
import { GRID_CONFIG } from '../constants';
import { generateId } from '../utils/idUtils';
import { getEffectiveDimensions } from '../utils/gridUtils';
import type {
  MachineDef,
  Recipe,
  GridItem,
  GhostPlacement,
  ToolType,
  Rotation,
  BoundingBox,
  DragMoveState,
  Connection,
  ActivePort,
} from '../types';

/**
 * @description Modal types for the application
 */
export type ModalType = 'machineBuilder' | 'recipeBuilder' | null;

/**
 * @description Main application state interface
 */
interface FactoryState {
  // Data
  /** Available machine definitions (blueprints) */
  machineDefs: MachineDef[];
  /** Available recipes */
  recipes: Recipe[];
  /** Placed machines on the grid */
  gridItems: GridItem[];
  /** Belt connections between machines */
  connections: Connection[];

  // UI State
  /** Currently selected tool */
  currentTool: ToolType;
  /** Currently selected machine definition ID (for placing) */
  selectedMachineDefId: string | null;
  /** Currently selected placed item ID (for inspection) */
  selectedGridItemId: string | null;
  /** Currently selected placed item IDs (for multi-selection) */
  selectedGridItemIds: string[];
  /** Currently selected connection ID */
  selectedConnectionId: string | null;
  /** Ghost placement preview state */
  ghostPlacement: GhostPlacement | null;
  /** Drag-to-move state for moving existing machines */
  dragMoveState: DragMoveState | null;
  /** Currently selected port for starting/ending a connection */
  activePort: ActivePort | null;
  /** Currently open modal */
  activeModal: ModalType;
  /** Machine being edited (null for new) */
  editingMachineId: string | null;
  /** Recipe being edited (null for new) */
  editingRecipeId: string | null;
  /** Clipboard data for copy/paste */
  clipboard: {
    gridItems: Omit<GridItem, 'id'>[];
    connections: Array<{
      sourceIndex: number;
      sourcePortIndex: number;
      targetIndex: number;
      targetPortIndex: number;
    }>;
  } | null;

  // Actions - Machine Definitions
  /** Add a new machine definition */
  addMachineDef: (def: MachineDef) => void;
  /** Update an existing machine definition */
  updateMachineDef: (id: string, updates: Partial<Omit<MachineDef, 'id'>>) => void;
  /** Delete a machine definition */
  deleteMachineDef: (id: string) => void;
  /** Get a machine definition by ID */
  getMachineDefById: (id: string) => MachineDef | undefined;

  // Actions - Recipes
  /** Add a new recipe */
  addRecipe: (recipe: Recipe) => void;
  /** Update an existing recipe */
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id'>>) => void;
  /** Delete a recipe */
  deleteRecipe: (id: string) => void;
  /** Get recipes for a specific machine type */
  getRecipesForMachine: (machineType: string) => Recipe[];
  /** Get a recipe by ID */
  getRecipeById: (id: string) => Recipe | undefined;

  // Actions - Grid Items
  /** Place a new machine on the grid */
  placeGridItem: (item: Omit<GridItem, 'id'>) => string;
  /** Remove a machine from the grid */
  removeGridItem: (id: string) => void;
  /** Update a grid item */
  updateGridItem: (id: string, updates: Partial<GridItem>) => void;
  /** Check if a position is valid for placement */
  isPlacementValid: (
    machineDefId: string,
    x: number,
    y: number,
    rotation: Rotation,
    excludeItemId?: string
  ) => boolean;
  /** Get bounding box for a placed or ghost machine */
  getMachineBoundingBox: (
    machineDefId: string,
    x: number,
    y: number,
    rotation: Rotation
  ) => BoundingBox | null;

  // Actions - Connections
  /** Add a new connection between ports */
  addConnection: (connection: Omit<Connection, 'id'>) => void;
  /** Remove a connection by ID */
  removeConnection: (id: string) => void;

  // Actions - UI State
  /** Set the current tool */
  setCurrentTool: (tool: ToolType) => void;
  /** Select a machine definition for placement */
  selectMachineDef: (id: string | null) => void;
  /** Select a placed grid item for inspection */
  selectGridItem: (id: string | null) => void;
  /** Toggle a grid item in multi-selection */
  toggleGridItemSelection: (id: string) => void;
  /** Set multiple selected grid items */
  setSelectedGridItems: (ids: string[]) => void;
  /** Select a connection for inspection/deletion */
  selectConnection: (id: string | null) => void;
  /** Update ghost placement preview */
  setGhostPlacement: (ghost: GhostPlacement | null) => void;
  /** Set the active port for connection creation */
  setActivePort: (activePort: ActivePort | null) => void;
  /** Clear all selection state */
  clearSelection: () => void;

  // Actions - Clipboard
  /** Copy selected items to clipboard */
  copyToClipboard: () => void;
  /** Paste from clipboard at position */
  pasteFromClipboard: (targetX: number, targetY: number) => void;

  // Actions - Modals
  /** Open the machine builder modal (optionally for editing) */
  openMachineBuilder: (machineId?: string) => void;
  /** Open the recipe builder modal (optionally for editing) */
  openRecipeBuilder: (recipeId?: string) => void;
  /** Close any open modal */
  closeModal: () => void;

  // Actions - Drag to Move
  /** Start dragging a placed machine to move it */
  startDragMove: (gridItemId: string) => void;
  /** Update the drag position while moving */
  updateDragMove: (x: number, y: number) => void;
  /** Rotate the machine being dragged */
  rotateDragMove: () => void;
  /** Complete the drag move, placing at new position if valid */
  completeDragMove: () => void;
  /** Cancel the drag move, returning to original position */
  cancelDragMove: () => void;
}

export const useStore = create<FactoryState>((set, get) => ({
  // Initial Data
  machineDefs: [],
  recipes: [],
  gridItems: [],
  connections: [],

  // Initial UI State
  currentTool: 'select',
  selectedMachineDefId: null,
  selectedGridItemId: null,
  selectedGridItemIds: [],
  selectedConnectionId: null,
  ghostPlacement: null,
  dragMoveState: null,
  activePort: null,
  activeModal: null,
  editingMachineId: null,
  editingRecipeId: null,
  clipboard: null,

  // Machine Definition Actions
  addMachineDef: (def) => {
    set((state) => ({
      machineDefs: [...state.machineDefs, def],
    }));
  },

  updateMachineDef: (id, updates) => {
    set((state) => ({
      machineDefs: state.machineDefs.map((def) =>
        def.id === id ? { ...def, ...updates } : def
      ),
    }));
  },

  deleteMachineDef: (id) => {
    set((state) => {
      const itemIdsToRemove = state.gridItems
        .filter((item) => item.machineDefId === id)
        .map((item) => item.id);

      return {
        machineDefs: state.machineDefs.filter((def) => def.id !== id),
        // Also remove any placed instances of this machine
        gridItems: state.gridItems.filter((item) => item.machineDefId !== id),
        // Remove associated connections
        connections: state.connections.filter(
          (c) =>
            !itemIdsToRemove.includes(c.sourceItemId) &&
            !itemIdsToRemove.includes(c.targetItemId)
        ),
        // Clear selection if the deleted machine was selected
        selectedMachineDefId:
          state.selectedMachineDefId === id ? null : state.selectedMachineDefId,
      };
    });
  },

  getMachineDefById: (id) => {
    return get().machineDefs.find((def) => def.id === id);
  },

  // Recipe Actions
  addRecipe: (recipe) => {
    set((state) => ({
      recipes: [...state.recipes, recipe],
    }));
  },

  updateRecipe: (id, updates) => {
    set((state) => ({
      recipes: state.recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, ...updates } : recipe
      ),
    }));
  },

  deleteRecipe: (id) => {
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
      // Clear recipe assignment from any machines using this recipe
      gridItems: state.gridItems.map((item) =>
        item.assignedRecipeId === id
          ? { ...item, assignedRecipeId: null }
          : item
      ),
    }));
  },

  getRecipesForMachine: (machineType) => {
    return get().recipes.filter((r) => r.machineType === machineType);
  },

  getRecipeById: (id) => {
    return get().recipes.find((recipe) => recipe.id === id);
  },

  // Grid Item Actions
  placeGridItem: (item) => {
    const id = generateId('item');
    const newItem: GridItem = { ...item, id };

    set((state) => ({
      gridItems: [...state.gridItems, newItem],
    }));

    return id;
  },

  removeGridItem: (id) => {
    set((state) => ({
      gridItems: state.gridItems.filter((item) => item.id !== id),
      // Remove associated connections
      connections: state.connections.filter(
        (c) => c.sourceItemId !== id && c.targetItemId !== id
      ),
      // Clear selection if the removed item was selected
      selectedGridItemId:
        state.selectedGridItemId === id ? null : state.selectedGridItemId,
    }));
  },

  updateGridItem: (id, updates) => {
    set((state) => ({
      gridItems: state.gridItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  getMachineBoundingBox: (machineDefId, x, y, rotation) => {
    const machineDef = get().getMachineDefById(machineDefId);
    if (!machineDef) return null;

    // Calculate effective dimensions based on rotation
    const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions(
      machineDef.width,
      machineDef.height,
      rotation
    );

    return {
      minX: x,
      minY: y,
      maxX: x + effectiveWidth - 1,
      maxY: y + effectiveHeight - 1,
    };
  },

  // Connection Actions
  addConnection: (connection) => {
    const state = get();

    // Validate: check if source port already has a connection
    const sourceHasConnection = state.connections.some(
      (c) => c.sourceItemId === connection.sourceItemId && c.sourcePortIndex === connection.sourcePortIndex
    );

    // Validate: check if target port already has a connection
    const targetHasConnection = state.connections.some(
      (c) => c.targetItemId === connection.targetItemId && c.targetPortIndex === connection.targetPortIndex
    );

    // Only add connection if both ports are free
    if (!sourceHasConnection && !targetHasConnection) {
      const id = generateId('conn');
      set((state) => ({
        connections: [...state.connections, { ...connection, id }],
        activePort: null, // Reset after successful connection
      }));
    } else {
      // Still reset activePort even if connection failed
      set({ activePort: null });
    }
  },

  removeConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
      selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
    }));
  },

  isPlacementValid: (machineDefId, x, y, rotation, excludeItemId) => {
    const state = get();
    const boundingBox = state.getMachineBoundingBox(machineDefId, x, y, rotation);

    if (!boundingBox) return false;

    // Check grid bounds
    if (
      boundingBox.minX < 0 ||
      boundingBox.minY < 0 ||
      boundingBox.maxX >= GRID_CONFIG.WIDTH ||
      boundingBox.maxY >= GRID_CONFIG.HEIGHT
    ) {
      return false;
    }

    // Check collision with existing items
    for (const item of state.gridItems) {
      // Skip the item being moved (if any)
      if (excludeItemId && item.id === excludeItemId) continue;

      const itemBox = state.getMachineBoundingBox(
        item.machineDefId,
        item.x,
        item.y,
        item.rotation
      );

      if (!itemBox) continue;

      // Check for overlap (AABB collision)
      const hasCollision = !(
        boundingBox.maxX < itemBox.minX ||
        boundingBox.minX > itemBox.maxX ||
        boundingBox.maxY < itemBox.minY ||
        boundingBox.minY > itemBox.maxY
      );

      if (hasCollision) return false;
    }

    return true;
  },

  // UI State Actions
  setCurrentTool: (tool) => {
    set({
      currentTool: tool,
      // Clear ghost when switching tools
      ghostPlacement: tool === 'place' ? get().ghostPlacement : null,
    });
  },

  selectMachineDef: (id) => {
    set({
      selectedMachineDefId: id,
      selectedGridItemId: null, // Clear grid item selection
      selectedConnectionId: null, // Clear connection selection
      currentTool: id ? 'place' : 'select',
      ghostPlacement: null,
    });
  },

  selectGridItem: (id) => {
    set({
      selectedGridItemId: id,
      selectedGridItemIds: id ? [id] : [], // Sync with multi-selection
      selectedMachineDefId: null, // Clear machine def selection
      selectedConnectionId: null, // Clear connection selection
      currentTool: 'select',
      ghostPlacement: null,
    });
  },

  toggleGridItemSelection: (id) => {
    set((state) => {
      const isSelected = state.selectedGridItemIds.includes(id);
      const newSelection = isSelected
        ? state.selectedGridItemIds.filter((itemId) => itemId !== id)
        : [...state.selectedGridItemIds, id];

      return {
        selectedGridItemIds: newSelection,
        selectedGridItemId: newSelection.length === 1 ? newSelection[0] : null,
        selectedMachineDefId: null,
        selectedConnectionId: null,
        currentTool: 'select',
      };
    });
  },

  setSelectedGridItems: (ids) => {
    set({
      selectedGridItemIds: ids,
      selectedGridItemId: ids.length === 1 ? ids[0] : null,
      selectedMachineDefId: null,
      selectedConnectionId: null,
      currentTool: 'select',
    });
  },

  selectConnection: (id) => {
    set({
      selectedConnectionId: id,
      selectedGridItemId: null,
      selectedMachineDefId: null,
      currentTool: 'select',
      ghostPlacement: null,
    });
  },

  setGhostPlacement: (ghost) => {
    set({ ghostPlacement: ghost });
  },

  setActivePort: (activePort) => {
    set({ activePort });
  },

  clearSelection: () => {
    set({
      selectedMachineDefId: null,
      selectedGridItemId: null,
      selectedGridItemIds: [],
      selectedConnectionId: null,
      currentTool: 'select',
      ghostPlacement: null,
      dragMoveState: null,
      activePort: null,
    });
  },

  // Clipboard Actions
  copyToClipboard: () => {
    const state = get();
    const { selectedGridItemIds, gridItems, connections } = state;

    if (selectedGridItemIds.length === 0) return;

    // Get selected items
    const selectedItems = gridItems.filter((item) =>
      selectedGridItemIds.includes(item.id)
    );

    // Create ID mapping (original ID -> index)
    const itemIdToIndex = new Map<string, number>();
    selectedItems.forEach((item, index) => {
      itemIdToIndex.set(item.id, index);
    });

    // Get connections between selected items and convert to indices
    const selectedConnections = connections
      .filter((conn) =>
        selectedGridItemIds.includes(conn.sourceItemId) &&
        selectedGridItemIds.includes(conn.targetItemId)
      )
      .map((conn) => ({
        sourceIndex: itemIdToIndex.get(conn.sourceItemId)!,
        sourcePortIndex: conn.sourcePortIndex,
        targetIndex: itemIdToIndex.get(conn.targetItemId)!,
        targetPortIndex: conn.targetPortIndex,
      }));

    // Store in clipboard without IDs
    set({
      clipboard: {
        gridItems: selectedItems.map(({ id, ...item }) => item),
        connections: selectedConnections,
      },
    });
  },

  pasteFromClipboard: (targetX, targetY) => {
    const state = get();
    const { clipboard, isPlacementValid } = state;

    if (!clipboard || clipboard.gridItems.length === 0) return;

    // Find bounding box of clipboard items
    let minX = Infinity, minY = Infinity;
    clipboard.gridItems.forEach((item) => {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
    });

    // Calculate offset to place at target position
    const offsetX = targetX - minX;
    const offsetY = targetY - minY;

    // Try to place all items, finding closest valid position if needed
    const newItems: GridItem[] = [];
    const oldToNewIdMap = new Map<number, string>();

    clipboard.gridItems.forEach((item, index) => {
      let newX = item.x + offsetX;
      let newY = item.y + offsetY;

      // Try to find closest valid position if target is invalid
      if (!isPlacementValid(item.machineDefId, newX, newY, item.rotation)) {
        // Simple spiral search for valid position
        let found = false;
        for (let radius = 1; radius <= 20 && !found; radius++) {
          for (let dx = -radius; dx <= radius && !found; dx++) {
            for (let dy = -radius; dy <= radius && !found; dy++) {
              if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                const testX = newX + dx;
                const testY = newY + dy;
                if (isPlacementValid(item.machineDefId, testX, testY, item.rotation)) {
                  newX = testX;
                  newY = testY;
                  found = true;
                }
              }
            }
          }
        }
        if (!found) return; // Skip this item if no valid position found
      }

      // Add the item to the list
      const newId = generateId('item');
      newItems.push({
        ...item,
        id: newId,
        x: newX,
        y: newY,
      });
      oldToNewIdMap.set(index, newId);
    });

    // Recreate connections with new IDs
    const newConnections: Connection[] = [];
    clipboard.connections.forEach((conn) => {
      const newSourceId = oldToNewIdMap.get(conn.sourceIndex);
      const newTargetId = oldToNewIdMap.get(conn.targetIndex);

      if (newSourceId && newTargetId) {
        newConnections.push({
          id: generateId('conn'),
          sourceItemId: newSourceId,
          sourcePortIndex: conn.sourcePortIndex,
          targetItemId: newTargetId,
          targetPortIndex: conn.targetPortIndex,
        });
      }
    });

    // Update state once with all new items and connections
    set((state) => ({
      gridItems: [...state.gridItems, ...newItems],
      connections: [...state.connections, ...newConnections],
      selectedGridItemIds: newItems.map(item => item.id),
    }));
  },

  // Modal Actions
  openMachineBuilder: (machineId) => {
    set({
      activeModal: 'machineBuilder',
      editingMachineId: machineId ?? null,
    });
  },

  openRecipeBuilder: (recipeId) => {
    set({
      activeModal: 'recipeBuilder',
      editingRecipeId: recipeId ?? null,
    });
  },

  closeModal: () => {
    set({
      activeModal: null,
      editingMachineId: null,
      editingRecipeId: null,
    });
  },

  // Drag to Move Actions
  startDragMove: (gridItemId) => {
    const state = get();
    const gridItem = state.gridItems.find((item) => item.id === gridItemId);
    if (!gridItem) return;

    set({
      dragMoveState: {
        gridItemId,
        machineDefId: gridItem.machineDefId,
        originalX: gridItem.x,
        originalY: gridItem.y,
        originalRotation: gridItem.rotation,
        currentX: gridItem.x,
        currentY: gridItem.y,
        currentRotation: gridItem.rotation,
        isValid: true, // Starting position is always valid
      },
      selectedGridItemId: null, // Clear selection while dragging
      ghostPlacement: null, // Clear any ghost placement
    });
  },

  updateDragMove: (x, y) => {
    const state = get();
    if (!state.dragMoveState) return;

    const isValid = state.isPlacementValid(
      state.dragMoveState.machineDefId,
      x,
      y,
      state.dragMoveState.currentRotation,
      state.dragMoveState.gridItemId // Exclude the item being moved from collision checks
    );

    set({
      dragMoveState: {
        ...state.dragMoveState,
        currentX: x,
        currentY: y,
        isValid,
      },
    });
  },
  
  rotateDragMove: () => {
    const state = get();
    if (!state.dragMoveState) return;

    const newRotation = ((state.dragMoveState.currentRotation + 90) % 360) as Rotation;
    const isValid = state.isPlacementValid(
      state.dragMoveState.machineDefId,
      state.dragMoveState.currentX,
      state.dragMoveState.currentY,
      newRotation,
      state.dragMoveState.gridItemId
    );

    set({
      dragMoveState: {
        ...state.dragMoveState,
        currentRotation: newRotation,
        isValid,
      },
    });
  },

  completeDragMove: () => {
    const state = get();
    if (!state.dragMoveState) return;

    if (state.dragMoveState.isValid) {
      // Update the grid item position
      state.updateGridItem(state.dragMoveState.gridItemId, {
        x: state.dragMoveState.currentX,
        y: state.dragMoveState.currentY,
        rotation: state.dragMoveState.currentRotation,
      });
    }
    // If not valid, the item stays at original position

    set({
      dragMoveState: null,
      selectedGridItemId: state.dragMoveState.gridItemId, // Select the moved item
    });
  },

  cancelDragMove: () => {
    const state = get();
    if (!state.dragMoveState) return;

    set({
      dragMoveState: null,
      selectedGridItemId: state.dragMoveState.gridItemId, // Select the item that was being moved
    });
  },
}));

/**
 * Selector hooks for commonly used state slices
 * Using selectors prevents unnecessary re-renders
 */

/** Select just the machine definitions */
export const useMachineDefs = () => useStore((state) => state.machineDefs);

/** Select just the grid items */
export const useGridItems = () => useStore((state) => state.gridItems);

/** Select the current tool */
export const useCurrentTool = () => useStore((state) => state.currentTool);

/** Select ghost placement state */
export const useGhostPlacement = () => useStore((state) => state.ghostPlacement);

/** Select drag move state */
export const useDragMoveState = () => useStore((state) => state.dragMoveState);

/** Select the currently selected machine definition */
export const useSelectedMachineDef = () => {
  const selectedId = useStore((state) => state.selectedMachineDefId);
  const getMachineDefById = useStore((state) => state.getMachineDefById);
  return selectedId ? getMachineDefById(selectedId) : null;
};

/** Select the currently selected grid item */
export const useSelectedGridItem = () => {
  const selectedId = useStore((state) => state.selectedGridItemId);
  const gridItems = useStore((state) => state.gridItems);
  return gridItems.find((item) => item.id === selectedId) ?? null;
};

/** Select just the recipes */
export const useRecipes = () => useStore((state) => state.recipes);

/** Select the active modal type */
export const useActiveModal = () => useStore((state) => state.activeModal);

/** Select the editing machine ID */
export const useEditingMachineId = () => useStore((state) => state.editingMachineId);

/** Select the editing recipe ID */
export const useEditingRecipeId = () => useStore((state) => state.editingRecipeId);
