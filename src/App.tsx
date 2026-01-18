/**
 * @fileoverview Main application component
 *
 * Entry point for the Endfield Factory Planner React application.
 * Sets up the three-panel layout and initializes sample data.
 */

import React, { useEffect } from 'react';
import { Sidebar, Inspector, Grid, MachineBuilder, RecipeBuilder } from './components';
import { useStore, useActiveModal } from './store/useStore';
import { GRID_CONFIG } from './constants';
import { initializeSampleData } from './data/sampleData';

/**
 * @description Header component with application title and branding
 *
 * Displays the Endfield Factory Planner logo/title and provides
 * a consistent top bar across the application.
 */
const Header: React.FC = () => {
  return (
    <header className="h-12 bg-endfield-dark-gray border-b border-endfield-mid-gray flex items-center px-4">
      <div className="flex items-center gap-3">
        {/* Logo/Icon */}
        <div className="w-8 h-8 bg-endfield-yellow rounded flex items-center justify-center">
          <span className="text-endfield-black font-bold text-lg">E</span>
        </div>
        {/* Title */}
        <h1 className="text-endfield-off-white font-semibold text-lg tracking-wide">
          Endfield Factory Planner
        </h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Version/Status indicator */}
      <div className="text-endfield-muted text-xs">
        v0.2.0 - Phase 1, 2 & 3
      </div>
    </header>
  );
};

/**
 * @description Status bar component showing grid info and keyboard shortcuts
 */
const StatusBar: React.FC = () => {
  const gridItems = useStore((state) => state.gridItems);
  const currentTool = useStore((state) => state.currentTool);
  const selectedMachineDefId = useStore((state) => state.selectedMachineDefId);
  const dragMoveState = useStore((state) => state.dragMoveState);

  /**
   * Get status message based on current state
   */
  const getStatusMessage = (): string => {
    if (dragMoveState) {
      return 'Dragging machine | Release to place | Esc to cancel';
    }
    if (currentTool === 'place' && selectedMachineDefId) {
      return 'Click to place | R to rotate | Esc to cancel';
    }
    if (currentTool === 'delete') {
      return 'Click on a machine to delete it | Esc to cancel';
    }
    return 'Select a machine from the sidebar, or drag placed machines to move them';
  };

  return (
    <footer className="h-8 bg-endfield-dark-gray border-t border-endfield-mid-gray flex items-center px-4 text-xs">
      <div className="text-endfield-muted">
        {getStatusMessage()}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4 text-endfield-muted">
        <span>Machines: {gridItems.length}</span>
        <span>Grid: {GRID_CONFIG.WIDTH}x{GRID_CONFIG.HEIGHT}</span>
        <span>Cell: {GRID_CONFIG.CELL_SIZE}px</span>
      </div>
    </footer>
  );
};

/**
 * @description Main application component
 *
 * Renders the complete factory planner interface with:
 * - Header bar with branding
 * - Three-panel layout (Sidebar, Grid, Inspector)
 * - Status bar with keyboard shortcuts
 *
 * Initializes sample data on mount.
 *
 * @example
 * // In main.tsx
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 */
const App: React.FC = () => {
  const addMachineDef = useStore((state) => state.addMachineDef);
  const addRecipe = useStore((state) => state.addRecipe);
  const machineDefs = useStore((state) => state.machineDefs);
  const activeModal = useActiveModal();
  const closeModal = useStore((state) => state.closeModal);

  /**
   * Initialize sample data on first render
   * Only runs once when machineDefs is empty
   */
  useEffect(() => {
    if (machineDefs.length === 0) {
      initializeSampleData({ addMachineDef, addRecipe });
    }
  }, [machineDefs.length, addMachineDef, addRecipe]);

  return (
    <div className="h-screen flex flex-col bg-endfield-black">
      {/* Header */}
      <Header />

      {/* Main content area with three-panel layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Machine Palette */}
        <Sidebar />

        {/* Center - Grid Canvas */}
        <Grid />

        {/* Right - Inspector Panel */}
        <Inspector />
      </main>

      {/* Status Bar */}
      <StatusBar />

      {/* Modal Overlays */}
      {activeModal === 'machineBuilder' && (
        <MachineBuilder onClose={closeModal} />
      )}
      {activeModal === 'recipeBuilder' && (
        <RecipeBuilder onClose={closeModal} />
      )}
    </div>
  );
};

export default App;
