/**
 * @fileoverview Power indicator component
 *
 * Displays a lightning bolt icon to indicate a machine is powered.
 */

import React from 'react';

/**
 * Lightning bolt icon component showing power status
 */
export const PowerIndicator: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 2,
        right: 2,
        width: 14,
        height: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5C518', // Yellow
        zIndex: 10,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
};
