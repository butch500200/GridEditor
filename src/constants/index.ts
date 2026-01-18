/**
 * @fileoverview Shared constants for the Endfield Factory Planner
 */

/**
 * Grid configuration constants
 */
export const GRID_CONFIG = {
  /** Width of the grid in cells */
  WIDTH: 50,
  /** Height of the grid in cells */
  HEIGHT: 50,
  /** Size of each cell in pixels */
  CELL_SIZE: 40,
} as const;

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
