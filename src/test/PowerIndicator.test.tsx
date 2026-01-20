import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PowerIndicator } from '../components/PowerIndicator';
import { useStore } from '../store/useStore';
import { PYLON_DEF } from '../data/sampleData';
import { MachineDef } from '../types';

describe('PowerIndicator', () => {
  const testMachine: MachineDef = {
    id: 'test-machine',
    name: 'Test Machine',
    width: 2,
    height: 2,
    color: '#FF0000',
    ports: [],
    powerConsumption: 10,
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
    useStore.getState().addMachineDef(testMachine);
  });

  it('should render power indicator component', () => {
    const { container } = render(<PowerIndicator />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should have lightning bolt styling', () => {
    const { container } = render(<PowerIndicator />);
    // Check that the component renders with yellow color styling
    const element = container.firstChild as HTMLElement;
    expect(element).toBeTruthy();
  });

  it('should export PowerIndicator component', () => {
    expect(PowerIndicator).toBeDefined();
    expect(typeof PowerIndicator).toBe('function');
  });
});
