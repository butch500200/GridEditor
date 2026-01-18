/**
 * @fileoverview Machine Builder Modal Component
 *
 * A modal dialog for creating and editing machine definitions.
 * Features a visual port placer that allows users to click on
 * machine edges to add/toggle input and output ports.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useStore, useEditingMachineId } from '../store/useStore';
import type { MachineDef, MachinePort, Direction, PortType } from '../types';

/**
 * Port indicator colors matching the grid and sidebar
 */
const PORT_COLORS = {
  input: '#22C55E',
  output: '#3B82F6',
} as const;

/**
 * Default colors available for machine selection
 */
const DEFAULT_COLORS = [
  '#5D9CEC', // Blue
  '#FC6E51', // Orange
  '#48CFAD', // Teal
  '#A0D468', // Green
  '#AC92EC', // Purple
  '#967ADC', // Violet
  '#37BC9B', // Emerald
  '#3BAFDA', // Cyan
  '#656D78', // Gray
  '#F5C518', // Yellow (Endfield)
  '#ED5565', // Red
  '#FFCE54', // Gold
] as const;

/**
 * Generate a unique ID for new machine definitions
 */
const generateMachineId = (): string => {
  return `machine-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * @description Props for the PortPlacer mini-grid preview component
 */
interface PortPlacerProps {
  /** Machine width in grid cells */
  width: number;
  /** Machine height in grid cells */
  height: number;
  /** Current machine color */
  color: string;
  /** Current ports array */
  ports: MachinePort[];
  /** Callback when a port is toggled */
  onPortToggle: (offsetX: number, offsetY: number, direction: Direction) => void;
}

/**
 * @description Visual port placer component
 *
 * Renders a preview of the machine with clickable edges for
 * adding/cycling through port types (none -> input -> output -> none).
 *
 * @param props - Component props
 * @returns Rendered port placer grid
 */
const PortPlacer: React.FC<PortPlacerProps> = ({
  width,
  height,
  color,
  ports,
  onPortToggle,
}) => {
  const cellSize = 40;
  const previewWidth = width * cellSize;
  const previewHeight = height * cellSize;

  /**
   * Find port at a specific position and direction
   */
  const findPort = useCallback(
    (offsetX: number, offsetY: number, direction: Direction): MachinePort | undefined => {
      return ports.find(
        (p) => p.offsetX === offsetX && p.offsetY === offsetY && p.direction === direction
      );
    },
    [ports]
  );

  /**
   * Render clickable edge indicators for a cell
   */
  const renderCellEdges = useCallback(
    (cellX: number, cellY: number) => {
      const edges: Array<{
        direction: Direction;
        isEdge: boolean;
        style: React.CSSProperties;
      }> = [
        {
          direction: 'N',
          isEdge: cellY === 0,
          style: {
            top: 0,
            left: '20%',
            right: '20%',
            height: 6,
            cursor: 'pointer',
          },
        },
        {
          direction: 'E',
          isEdge: cellX === width - 1,
          style: {
            right: 0,
            top: '20%',
            bottom: '20%',
            width: 6,
            cursor: 'pointer',
          },
        },
        {
          direction: 'S',
          isEdge: cellY === height - 1,
          style: {
            bottom: 0,
            left: '20%',
            right: '20%',
            height: 6,
            cursor: 'pointer',
          },
        },
        {
          direction: 'W',
          isEdge: cellX === 0,
          style: {
            left: 0,
            top: '20%',
            bottom: '20%',
            width: 6,
            cursor: 'pointer',
          },
        },
      ];

      return edges
        .filter((edge) => edge.isEdge)
        .map((edge) => {
          const port = findPort(cellX, cellY, edge.direction);
          const backgroundColor = port
            ? PORT_COLORS[port.type]
            : 'rgba(255, 255, 255, 0.2)';

          return (
            <div
              key={`${cellX}-${cellY}-${edge.direction}`}
              className="absolute transition-all duration-150 hover:opacity-100"
              style={{
                ...edge.style,
                backgroundColor,
                opacity: port ? 1 : 0.5,
                borderRadius: 2,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPortToggle(cellX, cellY, edge.direction);
              }}
              title={`Click to toggle port (${edge.direction}): ${
                port ? `${port.type} port` : 'no port'
              }`}
            />
          );
        });
    },
    [width, height, findPort, onPortToggle]
  );

  /**
   * Render grid cells for the machine preview
   */
  const renderCells = useMemo(() => {
    const cells: React.ReactNode[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        cells.push(
          <div
            key={`cell-${x}-${y}`}
            className="absolute border border-white/20"
            style={{
              left: x * cellSize,
              top: y * cellSize,
              width: cellSize,
              height: cellSize,
            }}
          >
            {renderCellEdges(x, y)}
          </div>
        );
      }
    }

    return cells;
  }, [width, height, cellSize, renderCellEdges]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Instructions */}
      <div className="text-xs text-endfield-muted text-center">
        Click on edges to add/cycle ports: None &rarr;{' '}
        <span style={{ color: PORT_COLORS.input }}>Input</span> &rarr;{' '}
        <span style={{ color: PORT_COLORS.output }}>Output</span> &rarr; None
      </div>

      {/* Machine preview container */}
      <div
        className="relative bg-endfield-mid-gray rounded p-4"
        style={{
          minWidth: Math.max(previewWidth + 32, 200),
          minHeight: Math.max(previewHeight + 32, 200),
        }}
      >
        {/* Machine shape */}
        <div
          className="relative rounded-sm mx-auto"
          style={{
            width: previewWidth,
            height: previewHeight,
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}40`,
          }}
        >
          {renderCells}
        </div>
      </div>

      {/* Port legend */}
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: PORT_COLORS.input }}
          />
          <span className="text-endfield-off-white">Input Port</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: PORT_COLORS.output }}
          />
          <span className="text-endfield-off-white">Output Port</span>
        </div>
      </div>
    </div>
  );
};

/**
 * @description Props for the MachineBuilder component
 */
interface MachineBuilderProps {
  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * @description Machine Builder modal component
 *
 * Provides a form for creating and editing machine definitions with:
 * - Text input for machine name
 * - Color picker with preset colors
 * - Width/Height number inputs (1-10 cells)
 * - Visual port placer for adding/editing ports on machine edges
 * - Live preview of the machine appearance
 *
 * @param props - Component props
 *
 * @example
 * <MachineBuilder onClose={() => setShowBuilder(false)} />
 */
export const MachineBuilder: React.FC<MachineBuilderProps> = ({ onClose }) => {
  const editingMachineId = useEditingMachineId();
  const getMachineDefById = useStore((state) => state.getMachineDefById);
  const addMachineDef = useStore((state) => state.addMachineDef);
  const updateMachineDef = useStore((state) => state.updateMachineDef);

  // Get existing machine if editing
  const existingMachine = editingMachineId
    ? getMachineDefById(editingMachineId)
    : undefined;

  // Form state
  const [name, setName] = useState(existingMachine?.name ?? '');
  const [color, setColor] = useState(existingMachine?.color ?? DEFAULT_COLORS[0]);
  const [width, setWidth] = useState(existingMachine?.width ?? 2);
  const [height, setHeight] = useState(existingMachine?.height ?? 2);
  const [ports, setPorts] = useState<MachinePort[]>(existingMachine?.ports ?? []);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Reset form when editing machine changes
   */
  useEffect(() => {
    if (existingMachine) {
      setName(existingMachine.name);
      setColor(existingMachine.color);
      setWidth(existingMachine.width);
      setHeight(existingMachine.height);
      setPorts([...existingMachine.ports]);
    }
  }, [existingMachine]);

  /**
   * Filter out ports that are outside the new dimensions when size changes
   */
  useEffect(() => {
    setPorts((currentPorts) =>
      currentPorts.filter((port) => {
        // Check if port is still within bounds based on direction
        const isValid =
          port.offsetX < width &&
          port.offsetY < height &&
          ((port.direction === 'N' && port.offsetY === 0) ||
            (port.direction === 'S' && port.offsetY === height - 1) ||
            (port.direction === 'W' && port.offsetX === 0) ||
            (port.direction === 'E' && port.offsetX === width - 1) ||
            // Keep internal ports (though we don't create them in this UI)
            (port.offsetX > 0 &&
              port.offsetX < width - 1 &&
              port.offsetY > 0 &&
              port.offsetY < height - 1));

        return isValid;
      })
    );
  }, [width, height]);

  /**
   * Handle port toggle on edge click
   * Cycles: none -> input -> output -> none
   */
  const handlePortToggle = useCallback(
    (offsetX: number, offsetY: number, direction: Direction) => {
      setPorts((currentPorts) => {
        const existingIndex = currentPorts.findIndex(
          (p) =>
            p.offsetX === offsetX &&
            p.offsetY === offsetY &&
            p.direction === direction
        );

        if (existingIndex === -1) {
          // No port exists, add input port
          return [
            ...currentPorts,
            { type: 'input' as PortType, offsetX, offsetY, direction },
          ];
        }

        const existingPort = currentPorts[existingIndex];

        if (existingPort.type === 'input') {
          // Change to output
          const newPorts = [...currentPorts];
          newPorts[existingIndex] = { ...existingPort, type: 'output' };
          return newPorts;
        }

        // Output port, remove it
        return currentPorts.filter((_, i) => i !== existingIndex);
      });
    },
    []
  );

  /**
   * Validate the form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (width < 1 || width > 10) {
      newErrors.width = 'Width must be between 1 and 10';
    }

    if (height < 1 || height > 10) {
      newErrors.height = 'Height must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, width, height]);

  /**
   * Handle form submission
   */
  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    const machineData: Omit<MachineDef, 'id'> = {
      name: name.trim(),
      color,
      width,
      height,
      ports,
    };

    if (editingMachineId) {
      updateMachineDef(editingMachineId, machineData);
    } else {
      const newMachine: MachineDef = {
        id: generateMachineId(),
        ...machineData,
      };
      addMachineDef(newMachine);
    }

    onClose();
  }, [
    validateForm,
    name,
    color,
    width,
    height,
    ports,
    editingMachineId,
    updateMachineDef,
    addMachineDef,
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
   * Count ports by type
   */
  const inputCount = ports.filter((p) => p.type === 'input').length;
  const outputCount = ports.filter((p) => p.type === 'output').length;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-endfield-dark-gray rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-endfield-mid-gray">
          <h2 className="text-lg font-semibold text-endfield-yellow">
            {editingMachineId ? 'Edit Machine' : 'Create Machine'}
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
        <div className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label
              htmlFor="machine-name"
              className="block text-sm font-medium text-endfield-off-white mb-2"
            >
              Machine Name
            </label>
            <input
              id="machine-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter machine name..."
              className={`w-full px-3 py-2 bg-endfield-mid-gray border rounded text-endfield-off-white placeholder-endfield-muted focus:outline-none focus:border-endfield-yellow ${
                errors.name ? 'border-red-500' : 'border-endfield-light-gray'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-endfield-off-white mb-2">
              Machine Color
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded transition-all ${
                    color === c
                      ? 'ring-2 ring-endfield-yellow ring-offset-2 ring-offset-endfield-dark-gray'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                  title={c}
                />
              ))}
            </div>
            {/* Custom color input */}
            <div className="flex items-center gap-2 mt-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="px-2 py-1 bg-endfield-mid-gray border border-endfield-light-gray rounded text-endfield-off-white text-sm font-mono w-24"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Width */}
            <div>
              <label
                htmlFor="machine-width"
                className="block text-sm font-medium text-endfield-off-white mb-2"
              >
                Width (cells)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWidth((w) => Math.max(1, w - 1))}
                  className="p-2 bg-endfield-mid-gray hover:bg-endfield-light-gray rounded transition-colors"
                  disabled={width <= 1}
                  aria-label="Decrease width"
                >
                  <Minus className="w-4 h-4 text-endfield-off-white" />
                </button>
                <input
                  id="machine-width"
                  type="number"
                  min={1}
                  max={10}
                  value={width}
                  onChange={(e) =>
                    setWidth(
                      Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                    )
                  }
                  className={`flex-1 px-3 py-2 bg-endfield-mid-gray border rounded text-endfield-off-white text-center focus:outline-none focus:border-endfield-yellow ${
                    errors.width ? 'border-red-500' : 'border-endfield-light-gray'
                  }`}
                />
                <button
                  onClick={() => setWidth((w) => Math.min(10, w + 1))}
                  className="p-2 bg-endfield-mid-gray hover:bg-endfield-light-gray rounded transition-colors"
                  disabled={width >= 10}
                  aria-label="Increase width"
                >
                  <Plus className="w-4 h-4 text-endfield-off-white" />
                </button>
              </div>
              {errors.width && (
                <p className="mt-1 text-xs text-red-500">{errors.width}</p>
              )}
            </div>

            {/* Height */}
            <div>
              <label
                htmlFor="machine-height"
                className="block text-sm font-medium text-endfield-off-white mb-2"
              >
                Height (cells)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHeight((h) => Math.max(1, h - 1))}
                  className="p-2 bg-endfield-mid-gray hover:bg-endfield-light-gray rounded transition-colors"
                  disabled={height <= 1}
                  aria-label="Decrease height"
                >
                  <Minus className="w-4 h-4 text-endfield-off-white" />
                </button>
                <input
                  id="machine-height"
                  type="number"
                  min={1}
                  max={10}
                  value={height}
                  onChange={(e) =>
                    setHeight(
                      Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                    )
                  }
                  className={`flex-1 px-3 py-2 bg-endfield-mid-gray border rounded text-endfield-off-white text-center focus:outline-none focus:border-endfield-yellow ${
                    errors.height ? 'border-red-500' : 'border-endfield-light-gray'
                  }`}
                />
                <button
                  onClick={() => setHeight((h) => Math.min(10, h + 1))}
                  className="p-2 bg-endfield-mid-gray hover:bg-endfield-light-gray rounded transition-colors"
                  disabled={height >= 10}
                  aria-label="Increase height"
                >
                  <Plus className="w-4 h-4 text-endfield-off-white" />
                </button>
              </div>
              {errors.height && (
                <p className="mt-1 text-xs text-red-500">{errors.height}</p>
              )}
            </div>
          </div>

          {/* Port Placer */}
          <div>
            <label className="block text-sm font-medium text-endfield-off-white mb-2">
              Port Configuration
            </label>
            <PortPlacer
              width={width}
              height={height}
              color={color}
              ports={ports}
              onPortToggle={handlePortToggle}
            />
          </div>

          {/* Port Summary */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-endfield-muted">Inputs:</span>
              <span
                className="font-medium"
                style={{ color: PORT_COLORS.input }}
              >
                {inputCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-endfield-muted">Outputs:</span>
              <span
                className="font-medium"
                style={{ color: PORT_COLORS.output }}
              >
                {outputCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-endfield-muted">Size:</span>
              <span className="font-medium text-endfield-off-white">
                {width} x {height}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-endfield-mid-gray">
          <button
            onClick={onClose}
            className="btn-ghost"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            aria-label={editingMachineId ? 'Save changes' : 'Create machine'}
          >
            {editingMachineId ? 'Save Changes' : 'Create Machine'}
          </button>
        </div>
      </div>
    </div>
  );
};
