/**
 * @fileoverview Main grid component for the factory planner
 *
 * Renders the placement grid with:
 * - Background grid cells
 * - Placed machines
 * - Ghost placement preview
 * - Drag-to-move functionality for existing machines
 * - Panning and scrolling
 * - Click to place/select interactions
 */

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import {
  useStore,
  useGridItems,
  useGhostPlacement,
  useDragMoveState,
} from '../store/useStore';
import { GRID_CONFIG } from '../constants';
import { getEffectiveDimensions } from '../utils/gridUtils';
import { PortIndicators } from './PortIndicators';
import type { GridItem, MachineDef, Rotation, GhostPlacement, DragMoveState } from '../types';

/**
 * @description Props for rendering a placed machine
 */
interface PlacedMachineProps {
  /** The grid item data */
  item: GridItem;
  /** The machine definition */
  machineDef: MachineDef;
  /** Cell size in pixels */
  cellSize: number;
  /** Whether this machine is selected */
  isSelected: boolean;
  /** Whether this machine is being dragged */
  isDragging: boolean;
  /** Click handler */
  onClick: () => void;
  /** Mouse down handler for drag initiation */
  onMouseDown: (e: React.MouseEvent) => void;
}

/**
 * @description Renders a placed machine on the grid
 *
 * @param props - Component props
 * @returns Rendered machine element
 */
const PlacedMachine: React.FC<PlacedMachineProps> = ({
  item,
  machineDef,
  cellSize,
  isSelected,
  isDragging,
  onClick,
  onMouseDown,
}) => {
  // Calculate effective dimensions based on rotation
  const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions(
    machineDef.width,
    machineDef.height,
    item.rotation
  );

  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.x * cellSize,
    top: item.y * cellSize,
    width: effectiveWidth * cellSize,
    height: effectiveHeight * cellSize,
    backgroundColor: isDragging ? `${machineDef.color}40` : machineDef.color,
    border: isDragging
      ? '2px dashed rgba(255,255,255,0.4)'
      : isSelected
        ? '2px solid #F5C518'
        : '1px solid rgba(255,255,255,0.2)',
    boxShadow: isSelected && !isDragging ? '0 0 15px rgba(245, 197, 24, 0.5)' : 'none',
    borderRadius: '4px',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'box-shadow 0.2s, border 0.2s',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) {
          onClick();
        }
      }}
      onMouseDown={onMouseDown}
      className="flex items-center justify-center"
      role="button"
      aria-label={`${machineDef.name} at position ${item.x}, ${item.y}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Port indicators */}
      {!isDragging && (
        <PortIndicators
          ports={machineDef.ports}
          machineWidth={machineDef.width}
          machineHeight={machineDef.height}
          cellSize={cellSize}
          rotation={item.rotation}
        />
      )}
      <span
        className="text-white/80 text-xs font-medium text-center px-1 truncate"
        style={{ maxWidth: '100%', opacity: isDragging ? 0.5 : 1 }}
      >
        {machineDef.name}
      </span>
    </div>
  );
};

/**
 * @description Props for the ghost preview component
 */
interface GhostPreviewProps {
  /** Ghost placement data */
  ghost: GhostPlacement;
  /** Machine definition */
  machineDef: MachineDef;
  /** Cell size in pixels */
  cellSize: number;
}

/**
 * @description Renders the ghost placement preview
 *
 * Shows where a machine will be placed with visual feedback
 * for valid (green) or invalid (red) placement.
 *
 * @param props - Component props
 * @returns Rendered ghost preview
 */
const GhostPreview: React.FC<GhostPreviewProps> = ({
  ghost,
  machineDef,
  cellSize,
}) => {
  // Calculate effective dimensions based on rotation
  const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions(
    machineDef.width,
    machineDef.height,
    ghost.rotation
  );

  const baseColor = ghost.isValid ? 'rgba(72, 207, 173, 0.6)' : 'rgba(255, 100, 100, 0.6)';
  const borderColor = ghost.isValid ? '#48CFAD' : '#FF6464';

  const style: React.CSSProperties = {
    position: 'absolute',
    left: ghost.x * cellSize,
    top: ghost.y * cellSize,
    width: effectiveWidth * cellSize,
    height: effectiveHeight * cellSize,
    backgroundColor: baseColor,
    border: `2px dashed ${borderColor}`,
    borderRadius: '4px',
    pointerEvents: 'none',
    zIndex: 100,
  };

  return (
    <div style={style} className="flex items-center justify-center">
      {/* Port indicators on ghost */}
      <PortIndicators
        ports={machineDef.ports}
        machineWidth={machineDef.width}
        machineHeight={machineDef.height}
        cellSize={cellSize}
        rotation={ghost.rotation}
      />
      <span className="text-white/80 text-xs font-medium">
        {machineDef.name}
      </span>
    </div>
  );
};

/**
 * @description Props for the drag move ghost component
 */
interface DragMoveGhostProps {
  /** Drag move state */
  dragState: DragMoveState;
  /** Machine definition */
  machineDef: MachineDef;
  /** Cell size in pixels */
  cellSize: number;
}

/**
 * @description Renders the ghost preview while dragging a machine to move it
 *
 * Shows where the machine will land with valid (green) or invalid (red) feedback.
 *
 * @param props - Component props
 * @returns Rendered drag move ghost
 */
const DragMoveGhost: React.FC<DragMoveGhostProps> = ({
  dragState,
  machineDef,
  cellSize,
}) => {
  // Calculate effective dimensions based on rotation
  const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions(
    machineDef.width,
    machineDef.height,
    dragState.currentRotation
  );

  const baseColor = dragState.isValid ? 'rgba(72, 207, 173, 0.7)' : 'rgba(255, 100, 100, 0.7)';
  const borderColor = dragState.isValid ? '#48CFAD' : '#FF6464';

  const style: React.CSSProperties = {
    position: 'absolute',
    left: dragState.currentX * cellSize,
    top: dragState.currentY * cellSize,
    width: effectiveWidth * cellSize,
    height: effectiveHeight * cellSize,
    backgroundColor: baseColor,
    border: `2px dashed ${borderColor}`,
    borderRadius: '4px',
    pointerEvents: 'none',
    zIndex: 100,
  };

  return (
    <div style={style} className="flex items-center justify-center">
      {/* Port indicators on drag ghost */}
      <PortIndicators
        ports={machineDef.ports}
        machineWidth={machineDef.width}
        machineHeight={machineDef.height}
        cellSize={cellSize}
        rotation={dragState.currentRotation}
      />
      <span className="text-white/80 text-xs font-medium">
        {machineDef.name}
      </span>
    </div>
  );
};

/**
 * @description Main grid component
 *
 * Features:
 * - Renders 50x50 grid cells
 * - Displays placed machines
 * - Shows ghost placement preview
 * - Drag-to-move existing machines
 * - Handles click to place/select
 * - Supports keyboard rotation (R key)
 * - Scrollable/pannable container
 *
 * @example
 * <Grid />
 */
export const Grid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridItems = useGridItems();
  const ghostPlacement = useGhostPlacement();
  const dragMoveState = useDragMoveState();

  const selectedMachineDefId = useStore((state) => state.selectedMachineDefId);
  const selectedGridItemId = useStore((state) => state.selectedGridItemId);
  const currentTool = useStore((state) => state.currentTool);
  const getMachineDefById = useStore((state) => state.getMachineDefById);
  const isPlacementValid = useStore((state) => state.isPlacementValid);
  const setGhostPlacement = useStore((state) => state.setGhostPlacement);
  const placeGridItem = useStore((state) => state.placeGridItem);
  const selectGridItem = useStore((state) => state.selectGridItem);
  const removeGridItem = useStore((state) => state.removeGridItem);
  const clearSelection = useStore((state) => state.clearSelection);
  const startDragMove = useStore((state) => state.startDragMove);
  const updateDragMove = useStore((state) => state.updateDragMove);
  const rotateDragMove = useStore((state) => state.rotateDragMove);
  const completeDragMove = useStore((state) => state.completeDragMove);
  const cancelDragMove = useStore((state) => state.cancelDragMove);

  // Track current ghost rotation locally for keyboard control
  const [ghostRotation, setGhostRotation] = useState<Rotation>(0);

  // Track if we're in a drag operation
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const { WIDTH, HEIGHT, CELL_SIZE } = GRID_CONFIG;
  const gridWidth = WIDTH * CELL_SIZE;
  const gridHeight = HEIGHT * CELL_SIZE;

  /**
   * Get machine definition for ghost preview
   */
  const ghostMachineDef = useMemo(() => {
    if (!selectedMachineDefId) return null;
    return getMachineDefById(selectedMachineDefId);
  }, [selectedMachineDefId, getMachineDefById]);

  /**
   * Get machine definition for drag move ghost
   */
  const dragMoveMachineDef = useMemo(() => {
    if (!dragMoveState) return null;
    return getMachineDefById(dragMoveState.machineDefId);
  }, [dragMoveState, getMachineDefById]);

  /**
   * Convert mouse position to grid coordinates
   */
  const getGridPosition = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!containerRef.current) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      const x = Math.floor((clientX - rect.left + scrollLeft) / CELL_SIZE);
      const y = Math.floor((clientY - rect.top + scrollTop) / CELL_SIZE);

      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
        return null;
      }

      return { x, y };
    },
    [CELL_SIZE, WIDTH, HEIGHT]
  );

  /**
   * Handle mouse move for ghost preview and drag operations
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getGridPosition(e.clientX, e.clientY);

      // Handle drag-to-move
      if (dragMoveState && isDraggingRef.current) {
        if (pos) {
          updateDragMove(pos.x, pos.y);
        }
        return;
      }

      // Handle regular ghost placement preview
      if (!selectedMachineDefId || currentTool !== 'place') {
        if (ghostPlacement) {
          setGhostPlacement(null);
        }
        return;
      }

      if (!pos) {
        setGhostPlacement(null);
        return;
      }

      const isValid = isPlacementValid(
        selectedMachineDefId,
        pos.x,
        pos.y,
        ghostRotation
      );

      setGhostPlacement({
        machineDefId: selectedMachineDefId,
        x: pos.x,
        y: pos.y,
        rotation: ghostRotation,
        isValid,
      });
    },
    [
      selectedMachineDefId,
      currentTool,
      ghostPlacement,
      getGridPosition,
      isPlacementValid,
      ghostRotation,
      setGhostPlacement,
      dragMoveState,
      updateDragMove,
    ]
  );

  /**
   * Handle mouse leave - clear ghost
   */
  const handleMouseLeave = useCallback(() => {
    if (ghostPlacement) {
      setGhostPlacement(null);
    }
  }, [ghostPlacement, setGhostPlacement]);

  /**
   * Handle mouse up - complete drag move
   */
  const handleMouseUp = useCallback(() => {
    if (dragMoveState && isDraggingRef.current) {
      completeDragMove();
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
    }
  }, [dragMoveState, completeDragMove]);

  /**
   * Handle machine mouse down for drag initiation
   */
  const handleMachineMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      // Only allow dragging with left mouse button and in select mode
      if (e.button !== 0 || currentTool === 'delete') return;

      e.preventDefault();
      e.stopPropagation();

      const pos = getGridPosition(e.clientX, e.clientY);
      if (!pos) return;

      // Start the drag operation
      isDraggingRef.current = true;
      dragStartPosRef.current = pos;
      startDragMove(itemId);
    },
    [currentTool, getGridPosition, startDragMove]
  );

  /**
   * Handle grid click for placement or selection
   */
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't handle clicks if we just finished dragging
      if (isDraggingRef.current) return;

      const pos = getGridPosition(e.clientX, e.clientY);
      if (!pos) return;

      // Handle delete tool
      if (currentTool === 'delete') {
        // Find machine at this position
        for (const item of gridItems) {
          const machineDef = getMachineDefById(item.machineDefId);
          if (!machineDef) continue;

          const isRotated = item.rotation === 90 || item.rotation === 270;
          const w = isRotated ? machineDef.height : machineDef.width;
          const h = isRotated ? machineDef.width : machineDef.height;

          if (
            pos.x >= item.x &&
            pos.x < item.x + w &&
            pos.y >= item.y &&
            pos.y < item.y + h
          ) {
            removeGridItem(item.id);
            return;
          }
        }
        return;
      }

      // Handle placement
      if (selectedMachineDefId && currentTool === 'place') {
        if (isPlacementValid(selectedMachineDefId, pos.x, pos.y, ghostRotation)) {
          placeGridItem({
            machineDefId: selectedMachineDefId,
            x: pos.x,
            y: pos.y,
            rotation: ghostRotation,
            assignedRecipeId: null,
          });
        }
        return;
      }

      // Handle select tool - clicking empty space clears selection
      if (currentTool === 'select') {
        clearSelection();
      }
    },
    [
      getGridPosition,
      currentTool,
      gridItems,
      selectedMachineDefId,
      ghostRotation,
      getMachineDefById,
      isPlacementValid,
      placeGridItem,
      removeGridItem,
      clearSelection,
    ]
  );

  /**
   * Handle machine click for selection
   */
  const handleMachineClick = useCallback(
    (itemId: string) => {
      if (currentTool === 'delete') {
        removeGridItem(itemId);
      } else {
        selectGridItem(itemId);
      }
    },
    [currentTool, removeGridItem, selectGridItem]
  );

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // R to rotate ghost
      if (e.key === 'r' || e.key === 'R') {
        if (selectedMachineDefId && currentTool === 'place') {
          setGhostRotation((prev) => ((prev + 90) % 360) as Rotation);
        }
        else if ( isDraggingRef.current ){
          rotateDragMove();
        }
      }

      // Escape to cancel placement or drag
      if (e.key === 'Escape') {
        if (dragMoveState) {
          cancelDragMove();
          isDraggingRef.current = false;
          dragStartPosRef.current = null;
        } else {
          clearSelection();
          setGhostRotation(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMachineDefId, currentTool, clearSelection, dragMoveState, cancelDragMove, rotateDragMove]);

  /**
   * Handle global mouse up for drag completion
   */
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragMoveState && isDraggingRef.current) {
        completeDragMove();
        isDraggingRef.current = false;
        dragStartPosRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragMoveState, completeDragMove]);

  /**
   * Update ghost when rotation changes
   */
  useEffect(() => {
    if (ghostPlacement && selectedMachineDefId) {
      const isValid = isPlacementValid(
        selectedMachineDefId,
        ghostPlacement.x,
        ghostPlacement.y,
        ghostRotation
      );

      setGhostPlacement({
        ...ghostPlacement,
        rotation: ghostRotation,
        isValid,
      });
    }
  }, [ghostRotation]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Reset ghost rotation when machine selection changes
   */
  useEffect(() => {
    setGhostRotation(0);
  }, [selectedMachineDefId]);

  /**
   * Generate grid lines using CSS background
   */
  const gridStyle: React.CSSProperties = useMemo(
    () => ({
      width: gridWidth,
      height: gridHeight,
      backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
      backgroundImage: `
        linear-gradient(to right, rgba(58, 58, 58, 0.5) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(58, 58, 58, 0.5) 1px, transparent 1px)
      `,
      backgroundColor: '#1A1A1A',
    }),
    [gridWidth, gridHeight, CELL_SIZE]
  );

  /**
   * Cursor style based on current tool and drag state
   */
  const cursorStyle = useMemo(() => {
    if (dragMoveState) {
      return 'grabbing';
    }
    if (currentTool === 'place' && selectedMachineDefId) {
      return 'crosshair';
    }
    if (currentTool === 'delete') {
      return 'not-allowed';
    }
    return 'default';
  }, [currentTool, selectedMachineDefId, dragMoveState]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-endfield-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleGridClick}
      onMouseUp={handleMouseUp}
      style={{ cursor: cursorStyle }}
    >
      <div className="relative no-select" style={gridStyle}>
        {/* Render placed machines */}
        {gridItems.map((item) => {
          const machineDef = getMachineDefById(item.machineDefId);
          if (!machineDef) return null;

          const isDragging = dragMoveState?.gridItemId === item.id;

          return (
            <PlacedMachine
              key={item.id}
              item={item}
              machineDef={machineDef}
              cellSize={CELL_SIZE}
              isSelected={selectedGridItemId === item.id}
              isDragging={isDragging}
              onClick={() => handleMachineClick(item.id)}
              onMouseDown={(e) => handleMachineMouseDown(e, item.id)}
            />
          );
        })}

        {/* Render ghost preview for new placement */}
        {ghostPlacement && ghostMachineDef && !dragMoveState && (
          <GhostPreview
            ghost={ghostPlacement}
            machineDef={ghostMachineDef}
            cellSize={CELL_SIZE}
          />
        )}

        {/* Render drag move ghost */}
        {dragMoveState && dragMoveMachineDef && (
          <DragMoveGhost
            dragState={dragMoveState}
            machineDef={dragMoveMachineDef}
            cellSize={CELL_SIZE}
          />
        )}
      </div>
    </div>
  );
};
