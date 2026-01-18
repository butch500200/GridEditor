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
}) => {
  // Line dimensions
  const lineLength = cellSize * 0.7;
  const lineThickness = Math.max(2, cellSize * 0.1);

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

        let style: React.CSSProperties = {
          position: 'absolute',
          backgroundColor: PORT_COLORS[port.type],
          borderRadius: '1px',
          zIndex: 10,
        };

        // Position based on direction (port faces outward from this edge)
        switch (effectiveDirection) {
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

        return (
          <div
            key={`port-${index}-${port.type}-${port.direction}`}
            style={style}
            title={
              showTooltips
                ? `${port.type === 'input' ? 'Input' : 'Output'} port (${port.direction})`
                : undefined
            }
          />
        );
      })}
    </>
  );
};
