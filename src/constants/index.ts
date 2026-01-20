/**
 * @fileoverview Shared constants for the Endfield Factory Planner
 */

/**
 * Grid configuration constants
 */
export const GRID_CONFIG = {
  /** Width of the grid in cells */
  WIDTH: 40,
  /** Height of the grid in cells */
  HEIGHT: 40,
  /** Size of each cell in pixels */
  CELL_SIZE: 40,
} as const;

/**
 * Automation Core configuration - the central power hub
 */
export const AUTOMATION_CORE_CONFIG = {
  /** Width of the automation core in cells */
  WIDTH: 9,
  /** Height of the automation core in cells */
  HEIGHT: 9,
  /** X position (centered in grid) */
  X: Math.floor((GRID_CONFIG.WIDTH - 9) / 2),
  /** Y position (centered in grid) */
  Y: Math.floor((GRID_CONFIG.HEIGHT - 9) / 2),
} as const;

/**
 * Power system configuration
 */
export const POWER_RANGE = 3; // Maximum distance for power connections (Chebyshev distance)

/**
 * Port indicator colors
 */
export const PORT_COLORS = {
  input: '#22C55E', // Green for inputs
  output: '#3B82F6', // Blue for outputs
} as const;

/**
 * Default colors available for machine selection
 */
export const MACHINE_COLORS = [
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
