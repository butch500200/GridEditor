/**
 * @fileoverview Unified port indicators component
 * 
 * Renders port indicator lines for machines in both the grid and sidebar previews.
 * Handles rotation, scaling, and different port types (input/output).
 */

import React from 'react';
import { MachinePort, Rotation } from '../types';
import { PORT_COLORS } from '../constants';
import { getRotatedDirection, getRotatedPortPosition } from '../utils/gridUtils';

/**
 * @description Props for the PortIndicators component
 */
interface PortIndicatorsProps {
  /** Array of ports to render */
  ports: MachinePort[];
  /** Original machine width in cells */
  machineWidth: number;
  /** Original machine height in cells */
  machineHeight: number;
  /** Size of each cell in pixels */
  cellSize: number;
  /** Machine rotation in degrees (default: 0) */
  rotation?: Rotation;
  /** Whether to show tooltips (default: true) */
  showTooltips?: boolean;
  /** Callback when a port is clicked */
  onPortClick?: (portIndex: number) => void;
  /** Callback when a port mouse down */
  onPortMouseDown?: (portIndex: number) => void;
  /** Callback when a port mouse up */
  onPortMouseUp?: (portIndex: number) => void;
  /** Index of the currently active port if any */
  activePortIndex?: number;
}

/**
 * @description Renders port indicator lines on a machine
 *
 * @param props - Component props
 * @returns Rendered port indicators
 */
export const PortIndicators: React.FC<PortIndicatorsProps> = ({
  ports,
  machineWidth,
  machineHeight,
  cellSize,
  rotation = 0,
  showTooltips = true,
  onPortClick,
  onPortMouseDown,
  onPortMouseUp,
  activePortIndex,
}) => {
  // Line dimensions
  const lineLength = cellSize * 0.8;
  const lineThickness = Math.max(4, cellSize * 0.15);
  const hitAreaSize = cellSize * 0.9;

  return (
    <>
      {ports.map((port, index) => {
        const effectiveDirection = getRotatedDirection(port.direction, rotation);
        const { offsetX, offsetY } = getRotatedPortPosition(
          port,
          machineWidth,
          machineHeight,
          rotation
        );

        // Base position at the center of the cell
        const cellCenterX = offsetX * cellSize + cellSize / 2;
        const cellCenterY = offsetY * cellSize + cellSize / 2;

        const isActive = activePortIndex === index;

        // Visual indicator style
        let indicatorStyle: React.CSSProperties = {
          position: 'absolute',
          backgroundColor: isActive ? '#FFFFFF' : PORT_COLORS[port.type],
          borderRadius: '2px',
          boxShadow: isActive ? '0 0 12px #FFFFFF, 0 0 4px rgba(0,0,0,0.5)' : '0 0 4px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease',
          zIndex: 2,
          pointerEvents: 'none', // Indicator doesn't catch events, hit area does
        };

        // Hit area style (larger transparent box for easier clicking)
        let hitAreaStyle: React.CSSProperties = {
          position: 'absolute',
          width: hitAreaSize,
          height: hitAreaSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100, // Very high to be above everything else in the machine
          // background: 'rgba(255,0,0,0.1)', // Debug: show hit area
        };

        // Position based on direction (port faces outward from this edge)
        switch (effectiveDirection) {
          case 'N': // Top edge
            indicatorStyle = {
              ...indicatorStyle,
              width: lineLength,
              height: lineThickness,
              left: cellCenterX - lineLength / 2,
              top: -lineThickness / 2,
            };
            hitAreaStyle = {
              ...hitAreaStyle,
              left: cellCenterX - hitAreaSize / 2,
              top: -hitAreaSize / 2,
            };
            break;
          case 'E': // Right edge
            indicatorStyle = {
              ...indicatorStyle,
              width: lineThickness,
              height: lineLength,
              right: -lineThickness / 2,
              top: cellCenterY - lineLength / 2,
            };
            hitAreaStyle = {
              ...hitAreaStyle,
              right: -hitAreaSize / 2,
              top: cellCenterY - hitAreaSize / 2,
            };
            break;
          case 'S': // Bottom edge
            indicatorStyle = {
              ...indicatorStyle,
              width: lineLength,
              height: lineThickness,
              left: cellCenterX - lineLength / 2,
              bottom: -lineThickness / 2,
            };
            hitAreaStyle = {
              ...hitAreaStyle,
              left: cellCenterX - hitAreaSize / 2,
              bottom: -hitAreaSize / 2,
            };
            break;
          case 'W': // Left edge
            indicatorStyle = {
              ...indicatorStyle,
              width: lineThickness,
              height: lineLength,
              left: -lineThickness / 2,
              top: cellCenterY - lineLength / 2,
            };
            hitAreaStyle = {
              ...hitAreaStyle,
              left: -hitAreaSize / 2,
              top: cellCenterY - hitAreaSize / 2,
            };
            break;
        }

        return (
          <div key={`port-group-${index}`}>
            {/* Visual Indicator */}
            <div style={indicatorStyle} />
            
            {/* Hit Area */}
            <div
              style={hitAreaStyle}
              onClick={(e) => {
                e.stopPropagation();
                if (onPortClick) onPortClick(index);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (onPortMouseDown) onPortMouseDown(index);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (onPortMouseUp) onPortMouseUp(index);
              }}
              title={
                showTooltips
                  ? `${port.type === 'input' ? 'Input' : 'Output'} port (${port.direction})`
                  : undefined
              }
              className="port-hit-area hover:scale-110 transition-transform"
            />
          </div>
        );
      })}
    </>
  );
};
