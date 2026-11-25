# Automaton — Finite Automaton Simulator (DFA / NFA)

A **React + TypeScript + Vite** web application inspired by [JFLAP](https://www.jflap.org/), built for the **Theory of Computation** course (Universidade Senai Cimatec).

## Features

- **Build DFAs and NFAs without editing source code:** choose the model (`AFD` / `AFN`), configure the alphabet ($\Sigma$), states ($Q$), initial state ($q_0$), accepting states ($F$), and an editable transition table ($\delta$).
- **Built-in validation:**
  - In **DFA (`AFD`)** mode, enforces exactly 1 destination state per `(state, symbol)` pair.
  - In **NFA (`AFN`)** mode, allows 0, 1, or multiple destination states per `(state, symbol)` pair.
  - On word input, detects any symbol outside the configured alphabet and explains the exact error and position.
- **Synchronized views:** editable transition table side by side with an **interactive SVG state diagram** (supports dragging nodes and an auto-layout action).
- **Full and step-by-step simulation:** displays the input tape, current symbol, active states before and after reading, fired transitions, empty word ($\varepsilon$) support, and a justified accept/reject verdict.
- **Persistence & experiment presets:** automatic persistence in `localStorage`, JSON import/export, and built-in presets for the **DFA** and **NFA** recognizing binary strings ending in `01`.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (22+ recommended to run the native TypeScript test suite)

### Install and run locally

```bash
npm install
npm run dev
```

Open the local URL printed in your terminal (by default `http://localhost:5173`).

### Run simulation engine tests

```bash
npm test
```

## Project Structure

```text
src/
├── core/
│   ├── types.ts              # Automaton, simulation step, and result types
│   ├── validator.ts          # DFA/NFA structural rules and alphabet validation
│   ├── simulator.ts          # Full and step-by-step simulation engine
│   └── presets.ts            # Experiment presets (DFA & NFA ending in 01) and layout helper
├── storage/
│   └── automataStorage.ts    # localStorage persistence and JSON import/export
├── components/
│   ├── AutomatonSidebar.tsx  # Saved automata manager, import/export, preset restore
│   ├── AutomatonEditor.tsx   # Model type, alphabet, states, initial and accepting flags
│   ├── TransitionTable.tsx   # Editable transition table synchronized with simulation
│   ├── AutomatonGraph.tsx    # Interactive SVG graph with live active-state highlighting
│   └── SimulationPanel.tsx   # Word input, step-by-step controls, trace, and verdict
├── App.tsx                   # Main application state and layout composition
├── main.tsx                  # React entry point
└── index.css                 # Design tokens and layout styles (Vanilla CSS)
tests/
└── simulator.test.ts         # Unit tests for validation and simulation engine
```
