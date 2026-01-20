import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PowerDisplay } from '../components/PowerDisplay';
import { useStore } from '../store/useStore';
import { PYLON_DEF } from '../data/sampleData';
import { MachineDef } from '../types';

describe('Power Consumption Display', () => {
  const machine10kW: MachineDef = {
    id: 'machine-10kw',
    name: 'Machine 10kW',
    width: 2,
    height: 2,
    color: '#FF0000',
    ports: [],
    powerConsumption: 10,
  };

  const machine20kW: MachineDef = {
    id: 'machine-20kw',
    name: 'Machine 20kW',
    width: 2,
    height: 2,
    color: '#00FF00',
    ports: [],
    powerConsumption: 20,
  };

  const machineNoPower: MachineDef = {
    id: 'machine-no-power',
    name: 'Machine No Power',
    width: 1,
    height: 1,
    color: '#0000FF',
    ports: [],
    // No powerConsumption defined (defaults to 0)
  };

  beforeEach(() => {
    useStore.setState({
      machineDefs: [],
      gridItems: [],
      connections: [],
      selectedGridItemIds: [],
      selectedGridItemId: null,
    });
    useStore.getState().addMachineDef(PYLON_DEF);
    useStore.getState().addMachineDef(machine10kW);
    useStore.getState().addMachineDef(machine20kW);
    useStore.getState().addMachineDef(machineNoPower);
  });

  it('should have powerConsumption property on MachineDef', () => {
    expect(machine10kW.powerConsumption).toBe(10);
    expect(machine20kW.powerConsumption).toBe(20);
    expect(machineNoPower.powerConsumption).toBeUndefined();
    expect(PYLON_DEF.powerConsumption).toBe(0);
  });

  it('should render PowerDisplay component', () => {
    render(<PowerDisplay />);
    // The component should render without errors
    expect(screen.getByTestId('power-display')).toBeTruthy();
  });

  it('should show zero power when no machines are placed', () => {
    render(<PowerDisplay />);
    // Should show 0/0 when no machines
    expect(screen.getByText(/0.*\/.*0/)).toBeTruthy();
  });

  it('should calculate total power needed by all machines', () => {
    const { placeGridItem } = useStore.getState();

    // Place two machines
    placeGridItem({
      machineDefId: 'machine-10kw',
      x: 0,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });
    placeGridItem({
      machineDefId: 'machine-20kw',
      x: 5,
      y: 0,
      rotation: 0,
      assignedRecipeId: null,
    });

    render(<PowerDisplay />);
    // Should show total of 30 kW in the display
    expect(screen.getByText(/\/30 kW/)).toBeTruthy();
  });

  it('should export PowerDisplay component', () => {
    expect(PowerDisplay).toBeDefined();
    expect(typeof PowerDisplay).toBe('function');
  });
});
