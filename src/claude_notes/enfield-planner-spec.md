# Project Specification: Enfield AIC Planning Tool

## 1. Project Overview
We are building a **web-based visual planning tool** for "Enfield AIC". The goal is to allow users to design production layouts on a 2D grid. Users can place processing units (machines), connect them via inputs/outputs, and assign recipes to calculate throughput.

**Current Phase Goals:**
1.  **Grid System:** An interactive canvas to place items.
2.  **Machine Editor:** A UI to define machine footprints (size) and I/O ports.
3.  **Recipe Editor:** A UI to define inputs, outputs, and processing time.
4.  **Mock Data:** The system must handle "missing data" gracefully by using editable JSON structures or local storage.

---

## 2. Technology Stack
* **Framework:** React (Vite)
* **Language:** TypeScript (Strict mode)
* **State Management:** Zustand (Essential for managing the grid state and drag-and-drop operations without prop drilling).
* **Styling:** Tailwind CSS (For rapid UI development).
* **Icons:** Lucide-React.
* **UI Components:** Shadcn/UI (optional, but preferred for modals/forms).

---

## 3. Core Data Models

### A. Machine Definition (`MachineDef`)
* **id:** string (unique)
* **name:** string
* **width:** number (grid cells)
* **height:** number (grid cells)
* **color:** string (hex for visual distinction)
* **ports:** Array of objects:
    * `type`: 'input' | 'output'
    * `offsetX`: number (0 to width)
    * `offsetY`: number (0 to height)
    * `direction`: 'N' | 'E' | 'S' | 'W'

### B. Recipe (`Recipe`)
* **id:** string
* **name:** string
* **machineType:** string (ID of the `MachineDef` compatible with this recipe)
* **duration:** number (seconds)
* **inputs:** Array `{ itemId: string, amount: number }`
* **outputs:** Array `{ itemId: string, amount: number }`

### C. Grid Item (Placed Instance)
* **id:** string (UUID)
* **machineDefId:** string
* **x:** number (grid coordinate)
* **y:** number (grid coordinate)
* **rotation:** number (0, 90, 180, 270)
* **assignedRecipeId:** string | null

---

## 4. UI/UX Requirements

### A. The Planner Grid (Main View)
* **Visuals:** large fixed grid (e.g., 50x50), can be changed if required.
* **Interaction:**
    * Click to select a cell/machine.
    * Drag to move machines.
    * Visual indicators for "Input" and "Output" ports on the machines.
* **Connections:**
    * Visual lines (SVG or Canvas overlay) connecting an Output port of Machine A to an Input port of Machine B.
    * *Constraint:* Connections are only valid if the item types match (for future logic, currently just visual).

### B. The Editors (Sidebar/Modals)
* **Machine Creator:**
    * Form to set Name, Color, Width, Height.
    * Visual "Port Placer": A mini-grid where the user clicks edges to toggle input/output ports.
* **Recipe Creator:**
    * Simple form to add Item Inputs (Name + Qty), Item Outputs (Name + Qty), and Time.

### C. The Aesthetics (the css)
* **Colors:**
    * Stick to similar colors in endfield being yellow, black and slightly off white.
* **Design:**
    * Sleek modern and minimalistic design with favoring straight lines

---

## 5. Implementation Roadmap (Step-by-Step)

### Phase 1: Setup & State
1.  Initialize Vite + React + TS + Tailwind. [ ]
2.  Set up the `useStore` (Zustand) to hold `machines`, `recipes`, and `gridItems`. [ ]
3.  Create the basic layout: Sidebar (Left) for tools, Main Area for Grid, Inspector (Right) for details. [ ]

### HARD STOP FOR HUMAN VERIFCATION

### Phase 2: The Grid Engine
1.  Create a `Grid` component that renders cells based on a `cellSize` constant (e.g., 40px). [ ]
2.  Implement "Ghost Placement": When hovering with a selected machine from the sidebar, show where it will snap. [ ]
3.  Implement validation: Prevent placing machines on top of others. [ ]

### HARD STOP FOR HUMAN VERIFCATION

### Phase 3: The Creators
1.  Build the `MachineBuilder` component. This needs a dynamic preview of the machine box. [ ]
2.  Build the `RecipeBuilder` component. [ ]

### HARD STOP FOR HUMAN VERIFCATION

### Phase 4: Connections
1.  Implement an SVG layer on top of the grid. [ ]
2.  Draw bezier curves or straight lines between connected ports, These are to simulate belts between the machines. These should follow the grids  [ ]

---

### Phase 5
Always use Test Driven Development (TDD) to build the features.
1. Make the grid a 40*40 grid.
2. Multiselector need to keep the selected items still selected after placed.
3. Pressing the backspace or delete button should remove selected machines and selected belts
4. Add a static 9*9 automation core in the center of the grid.
5. Need to implement electricity, pylons will power the machines. The electricity souce is the automation core, and pylons connect to any pylon or electic souce if its within 4 spaces, and powers any machies within 4 spaces in any direction including diagonals.
6. Powered machines will have an icon indicating power
7. Different machines will pull different amounts of power. Must display total power needed
8. Have a hotkey of p to start placing power pylons
