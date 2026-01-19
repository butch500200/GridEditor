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
import {
  getEffectiveDimensions,
  getRotatedPortPosition,
  getRotatedDirection,
  calculateManhattanPath,
} from '../utils/gridUtils';
import { calculateConnectionRates } from '../utils/rateUtils';
import { PortIndicators } from './PortIndicators';
import type {
  GridItem,
  MachineDef,
  Rotation,
  GhostPlacement,
  DragMoveState,
  Connection,
  ActivePort,
  GridPosition,
} from '../types';

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
  onClick: (e: React.MouseEvent) => void;
  /** Mouse down handler for drag initiation */
  onMouseDown: (e: React.MouseEvent) => void;
  /** Callback when a port is clicked */
  onPortClick?: (portIndex: number) => void;
  /** Callback when a port mouse down */
  onPortMouseDown?: (portIndex: number) => void;
  /** Callback when a port mouse up */
  onPortMouseUp?: (portIndex: number) => void;
  /** Active port for connection */
  activePortIndex?: number;
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
  onPortClick,
  onPortMouseDown,
  onPortMouseUp,
  activePortIndex,
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
    backgroundColor: isDragging ? `${machineDef.color}40` : `${machineDef.color}CC`,
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
          onClick(e);
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
          onClick(e as any);
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
          onPortClick={onPortClick}
          onPortMouseDown={onPortMouseDown}
          onPortMouseUp={onPortMouseUp}
          activePortIndex={activePortIndex}
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
  const getMachineDefById = useStore((state) => state.getMachineDefById);

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
    <>
      {/* Primary dragged machine ghost */}
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

      {/* Additional dragged machines ghosts (multi-selection) */}
      {dragState.draggedItems?.map((draggedItem) => {
        const itemMachineDef = getMachineDefById(draggedItem.id.split('-')[0] || '');
        if (!itemMachineDef) {
          // Try to get from gridItems
          const gridItems = useStore.getState().gridItems;
          const item = gridItems.find(i => i.id === draggedItem.id);
          if (!item) return null;
          const def = getMachineDefById(item.machineDefId);
          if (!def) return null;

          const { width: w, height: h } = getEffectiveDimensions(
            def.width,
            def.height,
            draggedItem.originalRotation
          );

          const itemStyle: React.CSSProperties = {
            position: 'absolute',
            left: (dragState.currentX + draggedItem.offsetX) * cellSize,
            top: (dragState.currentY + draggedItem.offsetY) * cellSize,
            width: w * cellSize,
            height: h * cellSize,
            backgroundColor: baseColor,
            border: `2px dashed ${borderColor}`,
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 100,
          };

          return (
            <div key={draggedItem.id} style={itemStyle} className="flex items-center justify-center">
              <PortIndicators
                ports={def.ports}
                machineWidth={def.width}
                machineHeight={def.height}
                cellSize={cellSize}
                rotation={draggedItem.originalRotation}
              />
              <span className="text-white/80 text-xs font-medium">
                {def.name}
              </span>
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

/**
 * @description Renders a belt connection line with moving items
 */
const ConnectionLine: React.FC<{
  connection: Connection;
  cellSize: number;
  gridItems: GridItem[];
  getMachineDefById: (id: string) => MachineDef | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  obstacles: Set<string>;
  rate: number;
}> = ({ connection, cellSize, gridItems, getMachineDefById, isSelected, onSelect, onDelete, obstacles, rate }) => {
  const sourceItem = gridItems.find((i) => i.id === connection.sourceItemId);
  const targetItem = gridItems.find((i) => i.id === connection.targetItemId);

  if (!sourceItem || !targetItem) return null;

  const sourceDef = getMachineDefById(sourceItem.machineDefId);
  const targetDef = getMachineDefById(targetItem.machineDefId);

  if (!sourceDef || !targetDef) return null;

  const sourcePortDef = sourceDef.ports[connection.sourcePortIndex];
  const targetPortDef = targetDef.ports[connection.targetPortIndex];

  const sourcePortPos = getRotatedPortPosition(
    sourcePortDef,
    sourceDef.width,
    sourceDef.height,
    sourceItem.rotation
  );
  const targetPortPos = getRotatedPortPosition(
    targetPortDef,
    targetDef.width,
    targetDef.height,
    targetItem.rotation
  );

  const ignoreCells = useMemo(() => {
    const cells = new Set<string>();
    // Only allow the specific port cells, not the entire machines
    cells.add(`${sourceItem.x + sourcePortPos.offsetX},${sourceItem.y + sourcePortPos.offsetY}`);
    cells.add(`${targetItem.x + targetPortPos.offsetX},${targetItem.y + targetPortPos.offsetY}`);
    return cells;
  }, [sourceItem, targetItem, sourcePortPos, targetPortPos]);

  const path = calculateManhattanPath(
    {
      x: sourceItem.x + sourcePortPos.offsetX,
      y: sourceItem.y + sourcePortPos.offsetY,
    },
    getRotatedDirection(sourcePortDef.direction, sourceItem.rotation),
    {
      x: targetItem.x + targetPortPos.offsetX,
      y: targetItem.y + targetPortPos.offsetY,
    },
    getRotatedDirection(targetPortDef.direction, targetItem.rotation),
    obstacles,
    ignoreCells
  );

  const points = path.map(
    (p) => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`
  );
  const d = `M ${points.join(' L ')}`;

  // Calculate midpoint for delete button and rate label
  const midPointIndex = Math.floor(path.length / 2);
  const midPoint = path[midPointIndex];
  const midX = midPoint.x * cellSize + cellSize / 2;
  const midY = midPoint.y * cellSize + cellSize / 2;

  return (
    <g 
      className="cursor-pointer group" 
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Invisible thicker path for easier clicking */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={cellSize * 0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Selection highlight */}
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#F5C518"
          strokeWidth={cellSize * 0.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.4 }}
        />
      )}
      {/* Belt background */}
      <path
        d={d}
        fill="none"
        stroke={isSelected ? '#F5C518' : 'rgba(40, 40, 40, 0.8)'}
        strokeWidth={cellSize * 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-200"
      />
      {/* Belt tracks */}
      <path
        d={d}
        fill="none"
        stroke="rgba(80, 80, 80, 0.5)"
        strokeWidth={cellSize * 0.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${cellSize * 0.1} ${cellSize * 0.1}`}
      />
      {/* Moving items animation - only show if rate > 0 */}
      {rate > 0 && [0, 0.25, 0.5, 0.75].map((offset) => (
        <circle key={offset} r={cellSize * 0.12} fill="#F5C518" opacity={0.9}>
          <animateMotion
            path={d}
            dur="3s"
            repeatCount="indefinite"
            begin={`${offset * 3}s`}
          />
        </circle>
      ))}

      {/* Rate label */}
      {rate > 0 && (
        <text
          x={midX}
          y={midY - 15}
          textAnchor="middle"
          fill="#F5C518"
          fontSize={10}
          fontWeight="bold"
          className="pointer-events-none select-none"
          style={{ textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          {rate.toFixed(0)}/min
        </text>
      )}

      {/* Delete button (only visible when selected or hovered) */}
      {(isSelected) && (
        <g 
          transform={`translate(${midX}, ${midY})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="cursor-pointer"
        >
          <circle r={12} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
          <path 
            d="M -4 -4 L 4 4 M -4 4 L 4 -4" 
            stroke="#FFFFFF" 
            strokeWidth={2} 
            strokeLinecap="round" 
          />
        </g>
      )}
    </g>
  );
};

/**
 * @description Renders a preview connection line while dragging
 */
const ConnectionPreview: React.FC<{
  activePort: ActivePort;
  cursorPos: GridPosition;
  cellSize: number;
  gridItems: GridItem[];
  getMachineDefById: (id: string) => MachineDef | undefined;
  obstacles: Set<string>;
}> = ({ activePort, cursorPos, cellSize, gridItems, getMachineDefById, obstacles }) => {
  const item = gridItems.find((i) => i.id === activePort.itemId);
  const def = item ? getMachineDefById(item.machineDefId) : null;

  if (!item || !def) return null;

  const portDef = def.ports[activePort.portIndex];
  const portPos = getRotatedPortPosition(
    portDef,
    def.width,
    def.height,
    item.rotation
  );

  const start = {
    x: item.x + portPos.offsetX,
    y: item.y + portPos.offsetY,
  };

  const ignoreCells = useMemo(() => {
    const cells = new Set<string>();
    // Only allow the specific port cell, not the entire machine
    cells.add(`${start.x},${start.y}`);
    return cells;
  }, [start]);

  // Check if cursor is over an obstacle - if so, skip A* for performance
  const cursorKey = `${Math.floor(cursorPos.x)},${Math.floor(cursorPos.y)}`;
  const isTargetBlocked = obstacles.has(cursorKey);

  const path = calculateManhattanPath(
    start,
    getRotatedDirection(portDef.direction, item.rotation),
    cursorPos,
    'N', // Default direction for cursor
    isTargetBlocked ? undefined : obstacles, // Skip obstacle avoidance if target is blocked
    ignoreCells
  );

  const points = path.map(
    (p) => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`
  );
  const d = `M ${points.join(' L ')}`;

  return (
    <path
      d={d}
      fill="none"
      stroke="rgba(245, 197, 24, 0.5)"
      strokeWidth={cellSize * 0.3}
      strokeDasharray={`${cellSize * 0.2} ${cellSize * 0.1}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  const multiGhostPlacement = useStore((state) => state.multiGhostPlacement);
  const connections = useStore((state) => state.connections);
  const activePort = useStore((state) => state.activePort);
  const selectedConnectionId = useStore((state) => state.selectedConnectionId);

  const selectedMachineDefId = useStore((state) => state.selectedMachineDefId);
  const selectedGridItemIds = useStore((state) => state.selectedGridItemIds);
  const currentTool = useStore((state) => state.currentTool);
  const getMachineDefById = useStore((state) => state.getMachineDefById);
  const isPlacementValid = useStore((state) => state.isPlacementValid);
  const setGhostPlacement = useStore((state) => state.setGhostPlacement);
  const placeGridItem = useStore((state) => state.placeGridItem);
  const selectGridItem = useStore((state) => state.selectGridItem);
  const selectConnection = useStore((state) => state.selectConnection);
  const removeGridItem = useStore((state) => state.removeGridItem);
  const removeConnection = useStore((state) => state.removeConnection);
  const clearSelection = useStore((state) => state.clearSelection);
  const startDragMove = useStore((state) => state.startDragMove);
  const updateDragMove = useStore((state) => state.updateDragMove);
  const rotateDragMove = useStore((state) => state.rotateDragMove);
  const completeDragMove = useStore((state) => state.completeDragMove);
  const cancelDragMove = useStore((state) => state.cancelDragMove);
  const addConnection = useStore((state) => state.addConnection);
  const setActivePort = useStore((state) => state.setActivePort);
  const updateMultiGhostPlacement = useStore((state) => state.updateMultiGhostPlacement);
  const confirmMultiGhostPlacement = useStore((state) => state.confirmMultiGhostPlacement);
  const cancelMultiGhostPlacement = useStore((state) => state.cancelMultiGhostPlacement);

  /**
   * Memoized set of all occupied grid cells for pathfinding avoidance
   */
  const occupiedCells = useMemo(() => {
    const cells = new Set<string>();
    gridItems.forEach((item) => {
      const def = getMachineDefById(item.machineDefId);
      if (!def) return;
      const { width, height } = getEffectiveDimensions(def.width, def.height, item.rotation);
      for (let ox = 0; ox < width; ox++) {
        for (let oy = 0; oy < height; oy++) {
          cells.add(`${item.x + ox},${item.y + oy}`);
        }
      }
    });
    return cells;
  }, [gridItems, getMachineDefById]);

  /**
   * Calculate throughput for all connections
   * Simple propagation logic for splitters, mergers, and production machines
   */
  const connectionRates = useMemo(() => {
    return calculateConnectionRates(
      gridItems,
      connections,
      getMachineDefById,
      useStore.getState().getRecipeById
    );
  }, [connections, gridItems, getMachineDefById]);

  // Track current ghost rotation locally for keyboard control
  const [ghostRotation, setGhostRotation] = useState<Rotation>(0);

  // Track mouse position for connection preview
  const [dragMousePos, setDragMousePos] = useState<GridPosition | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

      // Handle connection dragging preview
      if (activePort) {
        if (pos) {
          setDragMousePos(pos);
        }
        return;
      }

      // Handle drag-to-move
      if (dragMoveState && isDraggingRef.current) {
        if (pos) {
          updateDragMove(pos.x, pos.y);
        }
        return;
      }

      // Handle multi-ghost placement (paste mode)
      if (multiGhostPlacement && currentTool === 'place') {
        if (pos) {
          updateMultiGhostPlacement(pos.x, pos.y);
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
      multiGhostPlacement,
      updateMultiGhostPlacement,
      activePort,
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
   * Handle port interaction (clicks and drags)
   */
  const handlePortMouseDown = useCallback(
    (itemId: string, portIndex: number) => {
      const item = gridItems.find((i) => i.id === itemId);
      const machineDef = item ? getMachineDefById(item.machineDefId) : null;
      if (!item || !machineDef) return;

      const port = machineDef.ports[portIndex];

      if (!activePort) {
        // Start connection
        setActivePort({ itemId, portIndex, type: port.type });
        setIsConnecting(true);
      } else {
        // Try to complete connection (click-to-click)
        if (activePort.itemId === itemId) {
          setActivePort(null);
          setIsConnecting(false);
          return;
        }

        if (activePort.type === port.type) {
          setActivePort(null);
          setIsConnecting(false);
          return;
        }

        const source = activePort.type === 'output' ? activePort : { itemId, portIndex, type: port.type };
        const target = activePort.type === 'input' ? activePort : { itemId, portIndex, type: port.type };

        addConnection({
          sourceItemId: source.itemId,
          sourcePortIndex: source.portIndex,
          targetItemId: target.itemId,
          targetPortIndex: target.portIndex,
        });
        setIsConnecting(false);
        setDragMousePos(null);
      }
    },
    [currentTool, gridItems, getMachineDefById, activePort, setActivePort, addConnection]
  );

  const handlePortMouseUp = useCallback(
    (itemId: string, portIndex: number) => {
      if (!activePort || !isConnecting) return;

      // Only complete if we are on a different machine
      if (activePort.itemId !== itemId) {
        const item = gridItems.find((i) => i.id === itemId);
        const machineDef = item ? getMachineDefById(item.machineDefId) : null;
        if (!item || !machineDef) return;

        const port = machineDef.ports[portIndex];
        if (activePort.type !== port.type) {
          const source = activePort.type === 'output' ? activePort : { itemId, portIndex, type: port.type };
          const target = activePort.type === 'input' ? activePort : { itemId, portIndex, type: port.type };

          // Validation now happens in the store
          addConnection({
            sourceItemId: source.itemId,
            sourcePortIndex: source.portIndex,
            targetItemId: target.itemId,
            targetPortIndex: target.portIndex,
          });
        }
      }

      setIsConnecting(false);
      setDragMousePos(null);
    },
    [currentTool, activePort, isConnecting, gridItems, getMachineDefById, addConnection]
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

      // Handle multi-ghost placement (paste mode)
      if (multiGhostPlacement && currentTool === 'place') {
        confirmMultiGhostPlacement();
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
        setIsConnecting(false);
        setDragMousePos(null);
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
      multiGhostPlacement,
      confirmMultiGhostPlacement,
    ]
  );

  /**
   * Handle machine click for selection
   */
  const handleMachineClick = useCallback(
    (itemId: string, e: React.MouseEvent) => {
      if (currentTool === 'delete') {
        removeGridItem(itemId);
      } else {
        // Check if Ctrl (or Cmd on Mac) is held
        if (e.ctrlKey || e.metaKey) {
          // Toggle this item in the selection
          useStore.getState().toggleGridItemSelection(itemId);
        } else {
          // Regular click - select only this item
          selectGridItem(itemId);
        }
      }
    },
    [currentTool, removeGridItem, selectGridItem]
  );

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C to copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const { selectedGridItemIds, copyToClipboard } = useStore.getState();
        if (selectedGridItemIds.length > 0) {
          e.preventDefault();
          copyToClipboard();
        }
      }

      // Ctrl+V to paste (enters placement mode)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        const { pasteSelection } = useStore.getState();
        pasteSelection();
      }

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
        } else if (multiGhostPlacement) {
          cancelMultiGhostPlacement();
        } else {
          clearSelection();
          setGhostRotation(0);
          setDragMousePos(null);
          setIsConnecting(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMachineDefId, currentTool, clearSelection, dragMoveState, cancelDragMove, rotateDragMove, multiGhostPlacement, cancelMultiGhostPlacement]);

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
      setIsConnecting(false);
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

  /**
   * Handle right-click to cancel/exit modes (like ESC)
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu from appearing

    if (dragMoveState) {
      cancelDragMove();
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
    } else {
      clearSelection();
      setGhostRotation(0);
      setDragMousePos(null);
      setIsConnecting(false);
    }
  }, [dragMoveState, cancelDragMove, clearSelection]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-endfield-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleGridClick}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{ cursor: cursorStyle }}
    >
      <div className="relative no-select" style={gridStyle}>
        {/* SVG layer for connections */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: gridWidth,
            height: gridHeight,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              cellSize={CELL_SIZE}
              gridItems={gridItems}
              getMachineDefById={getMachineDefById}
              isSelected={selectedConnectionId === conn.id}
              onSelect={() => selectConnection(conn.id)}
              onDelete={() => removeConnection(conn.id)}
              obstacles={occupiedCells}
              rate={connectionRates[conn.id] || 0}
            />
          ))}

            {/* Render connection preview */}
            {activePort && dragMousePos && (
              <ConnectionPreview
                activePort={activePort}
                cursorPos={dragMousePos}
                cellSize={CELL_SIZE}
                gridItems={gridItems}
                getMachineDefById={getMachineDefById}
                obstacles={occupiedCells}
              />
            )}
        </svg>

        {/* Render placed machines */}
        {gridItems.map((item) => {
          const machineDef = getMachineDefById(item.machineDefId);
          if (!machineDef) return null;

          // Check if this item is being dragged (primary or in multi-selection)
          const isDragging = dragMoveState?.gridItemId === item.id ||
            dragMoveState?.draggedItems?.some(d => d.id === item.id);
          const activePortForThisItem = activePort?.itemId === item.id ? activePort.portIndex : undefined;

          return (
            <PlacedMachine
              key={item.id}
              item={item}
              machineDef={machineDef}
              cellSize={CELL_SIZE}
              isSelected={selectedGridItemIds.includes(item.id)}
              isDragging={isDragging}
              onClick={(e) => handleMachineClick(item.id, e)}
              onMouseDown={(e) => handleMachineMouseDown(e, item.id)}
              onPortMouseDown={(portIndex) => handlePortMouseDown(item.id, portIndex)}
              onPortMouseUp={(portIndex) => handlePortMouseUp(item.id, portIndex)}
              activePortIndex={activePortForThisItem}
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

        {/* Render multi-ghost placement (paste mode) */}
        {multiGhostPlacement && !dragMoveState && (
          <>
            {multiGhostPlacement.machines.map((machine, index) => {
              const machineDef = getMachineDefById(machine.machineDefId);
              if (!machineDef) return null;

              const ghostX = multiGhostPlacement.currentX + machine.offsetX;
              const ghostY = multiGhostPlacement.currentY + machine.offsetY;

              return (
                <GhostPreview
                  key={index}
                  ghost={{
                    machineDefId: machine.machineDefId,
                    x: ghostX,
                    y: ghostY,
                    rotation: machine.rotation,
                    isValid: multiGhostPlacement.isValid,
                  }}
                  machineDef={machineDef}
                  cellSize={CELL_SIZE}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
