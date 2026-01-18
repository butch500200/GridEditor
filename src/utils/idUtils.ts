/**
 * @fileoverview Utility functions for generating unique identifiers
 */

/**
 * Generate a unique ID with an optional prefix
 * 
 * @param prefix - Prefix for the ID (e.g., 'machine', 'recipe', 'item')
 * @returns A unique string ID
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
