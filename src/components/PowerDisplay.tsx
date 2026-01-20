/**
 * @fileoverview Power display component
 *
 * Shows power consumption statistics: total power needed,
 * powered vs unpowered breakdown.
 */

import React, { useMemo } from 'react';
import { useStore, useGridItems } from '../store/useStore';

/**
 * Power display component showing power stats
 */
export const PowerDisplay: React.FC = () => {
  const gridItems = useGridItems();
  const getMachineDefById = useStore((state) => state.getMachineDefById);
  const powerState = useStore((state) => state.powerState);

  const powerStats = useMemo(() => {
    const machines = gridItems.filter((item) => item.machineDefId !== 'pylon');

    // Calculate power consumption using already-calculated powerState
    let totalPower = 0;
    let poweredPower = 0;

    for (const machine of machines) {
      const machineDef = getMachineDefById(machine.machineDefId);
      const consumption = machineDef?.powerConsumption ?? 0;
      totalPower += consumption;

      if (powerState.poweredMachineIds.has(machine.id)) {
        poweredPower += consumption;
      }
    }

    return {
      totalPower,
      poweredPower,
      unpoweredPower: totalPower - poweredPower,
      poweredCount: powerState.poweredMachineIds.size,
      totalMachineCount: machines.length,
    };
  }, [gridItems, getMachineDefById, powerState]);

  return (
    <div
      data-testid="power-display"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        backgroundColor: '#2D2D2D',
        borderRadius: 4,
        fontSize: 12,
        color: '#E0E0E0',
      }}
    >
      {/* Lightning bolt icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="#F5C518"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>

      {/* Power stats */}
      <span>
        {powerStats.poweredPower}/{powerStats.totalPower} kW
      </span>

      {/* Unpowered warning */}
      {powerStats.unpoweredPower > 0 && (
        <span style={{ color: '#EF4444', marginLeft: 4 }}>
          ({powerStats.unpoweredPower} unpowered)
        </span>
      )}
    </div>
  );
};
