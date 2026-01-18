/**
 * @fileoverview Utility functions for grid logic, rotation, and dimensions
 */

import { Direction, Rotation, MachinePort } from '../types';

/**
 * Calculate effective dimensions of a machine after rotation
 * 
 * @param width - Original machine width
 * @param height - Original machine height
 * @param rotation - Rotation in degrees
 * @returns Object containing effective width and height
 */
export const getEffectiveDimensions = (
  width: number,
  height: number,
  rotation: Rotation
): { width: number; height: number } => {
  const isRotated = rotation === 90 || rotation === 270;
  return {
    width: isRotated ? height : width,
    height: isRotated ? width : height,
  };
};

/**
 * Calculate the rotated direction based on original direction and machine rotation
 * 
 * @param originalDirection - The original port direction
 * @param rotation - Machine rotation in degrees
 * @returns The effective direction
 */
export const getRotatedDirection = (
  originalDirection: Direction,
  rotation: Rotation
): Direction => {
  const directions: Direction[] = ['N', 'E', 'S', 'W'];
  const rotationSteps = rotation / 90;
  const originalIndex = directions.indexOf(originalDirection);
  const rotatedIndex = (originalIndex + rotationSteps) % 4;
  return directions[rotatedIndex];
};

/**
 * Calculate the rotated port position within the machine
 * 
 * @param port - Original port definition
 * @param machineWidth - Original machine width
 * @param machineHeight - Original machine height
 * @param rotation - Machine rotation in degrees
 * @returns Object containing rotated offsetX and offsetY
 */
export const getRotatedPortPosition = (
  port: Pick<MachinePort, 'offsetX' | 'offsetY'>,
  machineWidth: number,
  machineHeight: number,
  rotation: Rotation
): { offsetX: number; offsetY: number } => {
  if (rotation === 90) {
    return {
      offsetX: machineHeight - 1 - port.offsetY,
      offsetY: port.offsetX,
    };
  }
  if (rotation === 180) {
    return {
      offsetX: machineWidth - 1 - port.offsetX,
      offsetY: machineHeight - 1 - port.offsetY,
    };
  }
  if (rotation === 270) {
    return {
      offsetX: port.offsetY,
      offsetY: machineWidth - 1 - port.offsetX,
    };
  }
  return {
    offsetX: port.offsetX,
    offsetY: port.offsetY,
  };
};

/**
 * Convert direction shorthand to full label
 * 
 * @param dir - Direction code
 * @returns Human-readable direction name
 */
export const getDirectionLabel = (dir: Direction): string => {
  const labels: Record<Direction, string> = {
    N: 'North',
    E: 'East',
    S: 'South',
    W: 'West',
  };
  return labels[dir];
};
