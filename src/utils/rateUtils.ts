import { GridItem, MachineDef, Connection, Recipe } from '../types';

/**
 * Checks if a machine has all required inputs connected
 *
 * @param item - The grid item to check
 * @param def - The machine definition
 * @param recipe - The assigned recipe
 * @param connections - All connections
 * @returns true if all inputs are satisfied, false otherwise
 */
const hasRequiredInputs = (
  item: GridItem,
  def: MachineDef,
  recipe: Recipe,
  connections: Connection[]
): boolean => {
  // Machines without input requirements always produce
  if (!recipe.inputs || recipe.inputs.length === 0) return true;

  // Get all input ports for this machine
  const inputPorts = def.ports.filter(p => p.type === 'input');

  // Get all connections feeding into this machine's input ports
  const incomingConnections = connections.filter(
    c => c.targetItemId === item.id && inputPorts.some((_, idx) => idx === c.targetPortIndex)
  );

  // For now, just check if at least one input connection exists per required input item
  // A more sophisticated check would verify the exact items being supplied
  const requiredInputCount = recipe.inputs.length;
  const connectedInputCount = incomingConnections.length;

  return connectedInputCount >= requiredInputCount;
};

/**
 * Calculates throughput for all connections in the grid.
 *
 * @param gridItems - All placed machines
 * @param connections - All belt connections
 * @param getMachineDefById - Function to get machine definition
 * @param getRecipeById - Function to get recipe definition
 * @returns Record mapping connection ID to its throughput rate
 */
export const calculateConnectionRates = (
  gridItems: GridItem[],
  connections: Connection[],
  getMachineDefById: (id: string) => MachineDef | undefined,
  getRecipeById: (id: string) => Recipe | undefined
): Record<string, number> => {
  const rates: Record<string, number> = {};

  // Helper to recursively calculate output rate of a machine's port
  const getMachinePortRate = (itemId: string, portIndex: number, visited = new Set<string>()): number => {
    const visitKey = `${itemId}:${portIndex}`;
    if (visited.has(visitKey)) return 0;
    visited.add(visitKey);

    const item = gridItems.find(i => i.id === itemId);
    const def = item ? getMachineDefById(item.machineDefId) : null;
    if (!item || !def) return 0;

    const port = def.ports[portIndex];
    if (port.type === 'input') return 0;

    // Splitter Logic: Divide total input rate among all active output connections
    if (def.id === 'splitter') {
      const inputPortIndices = def.ports.map((p, i) => p.type === 'input' ? i : -1).filter(i => i !== -1);
      let totalInputRate = 0;
      inputPortIndices.forEach(idx => {
        const incoming = connections.filter(c => c.targetItemId === itemId && c.targetPortIndex === idx);
        incoming.forEach(c => {
          totalInputRate += getMachinePortRate(c.sourceItemId, c.sourcePortIndex, new Set(visited));
        });
      });
      
      const activeOutputs = connections.filter(c => c.sourceItemId === itemId);
      return activeOutputs.length > 0 ? totalInputRate / activeOutputs.length : 0;
    }

    // Merger Logic: Sum all input rates and pass to output
    if (def.id === 'merger') {
      const inputPortIndices = def.ports.map((p, i) => p.type === 'input' ? i : -1).filter(i => i !== -1);
      let totalInputRate = 0;
      inputPortIndices.forEach(idx => {
        const incoming = connections.filter(c => c.targetItemId === itemId && c.targetPortIndex === idx);
        incoming.forEach(c => {
          totalInputRate += getMachinePortRate(c.sourceItemId, c.sourcePortIndex, new Set(visited));
        });
      });
      return totalInputRate;
    }

    // Production Machine Logic: Rate = Recipe Output / Duration
    if (!item.assignedRecipeId) return 0;
    const recipe = getRecipeById(item.assignedRecipeId);
    if (!recipe) return 0;

    // Check if all required inputs are connected
    if (!hasRequiredInputs(item, def, recipe, connections)) {
      return 0; // No output if inputs aren't satisfied
    }

    const totalOutputAmount = recipe.outputs.reduce((sum, o) => sum + o.amount, 0);
    const baseRate = totalOutputAmount / recipe.duration;
    const outputPorts = def.ports.filter(p => p.type === 'output');

    // Split production rate among available output ports
    return baseRate / (outputPorts.length || 1);
  };

  connections.forEach(conn => {
    // Convert from per second to per minute
    rates[conn.id] = getMachinePortRate(conn.sourceItemId, conn.sourcePortIndex) * 60;
  });

  return rates;
};
