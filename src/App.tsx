import { useEffect, useMemo, useState } from 'react';
import type {
  Automaton,
  AutomatonType,
  NodePosition,
  SimulationResult,
} from './core/types.ts';
import {
  computeAutoLayout,
  createEmptyAutomaton,
  getPresetAutomata,
} from './core/presets.ts';
import { validateAutomaton, validateWord } from './core/validator.ts';
import { simulateAutomaton } from './core/simulator.ts';
import {
  exportAutomatonToJson,
  loadAutomataFromStorage,
  parseAutomatonFromJson,
  saveAutomataToStorage,
} from './storage/automataStorage.ts';
import { AutomatonSidebar } from './components/AutomatonSidebar.tsx';
import { AutomatonEditor } from './components/AutomatonEditor.tsx';
import { TransitionTable } from './components/TransitionTable.tsx';
import { AutomatonGraph } from './components/AutomatonGraph.tsx';
import { SimulationPanel } from './components/SimulationPanel.tsx';

export function App() {
  const [automata, setAutomata] = useState<Automaton[]>(() => loadAutomataFromStorage());
  const [selectedId, setSelectedId] = useState<string>(() => loadAutomataFromStorage()[0]?.id ?? '');
  const [word, setWord] = useState<string>('101');
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [importError, setImportError] = useState<string | null>(null);

  // Automatic persistence to localStorage
  useEffect(() => {
    saveAutomataToStorage(automata);
  }, [automata]);

  const currentAutomaton = useMemo(
    () => automata.find((a) => a.id === selectedId) ?? automata[0],
    [automata, selectedId],
  );

  // Ensure selectedId always points to an existing automaton
  useEffect(() => {
    if (currentAutomaton && currentAutomaton.id !== selectedId) {
      setSelectedId(currentAutomaton.id);
    }
  }, [currentAutomaton, selectedId]);

  const automatonValidation = useMemo(
    () => validateAutomaton(currentAutomaton),
    [currentAutomaton],
  );

  const wordValidation = useMemo(
    () => validateWord(word, currentAutomaton.alphabet),
    [word, currentAutomaton.alphabet],
  );

  const clearSimulation = () => {
    setSimulation(null);
    setCurrentStepIndex(0);
  };

  const updateCurrentAutomaton = (updater: (prev: Automaton) => Automaton, resetSim = true) => {
    setAutomata((prevList) =>
      prevList.map((item) => (item.id === currentAutomaton.id ? updater(item) : item)),
    );
    if (resetSim) {
      clearSimulation();
    }
  };

  // --- Automaton management ---
  const handleSelectAutomaton = (id: string) => {
    setSelectedId(id);
    setImportError(null);
    clearSimulation();
  };

  const handleCreateAutomaton = (type: AutomatonType) => {
    const created = createEmptyAutomaton(type, automata.length);
    setAutomata((prev) => [...prev, created]);
    setSelectedId(created.id);
    setImportError(null);
    clearSimulation();
  };

  const handleDeleteAutomaton = (id: string) => {
    if (automata.length <= 1) return;
    const filtered = automata.filter((a) => a.id !== id);
    setAutomata(filtered);
    if (selectedId === id) {
      setSelectedId(filtered[0].id);
      clearSimulation();
    }
  };

  const handleExportAutomaton = (automaton: Automaton) => {
    const json = exportAutomatonToJson(automaton);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = automaton.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${safeName || 'automaton'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAutomaton = (jsonText: string) => {
    const { automaton, error } = parseAutomatonFromJson(jsonText);
    if (error || !automaton) {
      setImportError(error ?? 'Falha ao importar JSON.');
      return;
    }
    setImportError(null);
    setAutomata((prev) => [...prev, automaton]);
    setSelectedId(automaton.id);
    clearSimulation();
  };

  const handleResetPresets = () => {
    const presets = getPresetAutomata();
    const customModels = automata.filter((a) => !a.id.startsWith('preset-'));
    const merged = [...presets, ...customModels];
    setAutomata(merged);
    setSelectedId(presets[0].id);
    setImportError(null);
    clearSimulation();
  };

  // --- Current automaton editing ---
  const handleChangeName = (name: string) => {
    updateCurrentAutomaton((prev) => ({ ...prev, name }), false);
  };

  const handleChangeType = (type: AutomatonType) => {
    updateCurrentAutomaton((prev) => {
      if (prev.type === type) return prev;
      const transitions: Record<string, Record<string, string[]>> = {};
      for (const state of prev.states) {
        transitions[state] = {};
        for (const symbol of prev.alphabet) {
          const current = prev.transitions[state]?.[symbol] ?? [];
          // When converting NFA -> DFA, keep only the first destination if multiple exist
          transitions[state][symbol] = type === 'DFA' ? current.slice(0, 1) : [...current];
        }
      }
      return { ...prev, type, transitions };
    });
  };

  const handleAddSymbol = (symbol: string) => {
    updateCurrentAutomaton((prev) => {
      const alphabet = [...prev.alphabet, symbol];
      const transitions: Record<string, Record<string, string[]>> = {};
      for (const state of prev.states) {
        transitions[state] = {
          ...(prev.transitions[state] ?? {}),
          [symbol]: [],
        };
      }
      return { ...prev, alphabet, transitions };
    });
  };

  const handleRemoveSymbol = (symbol: string) => {
    updateCurrentAutomaton((prev) => {
      const alphabet = prev.alphabet.filter((s) => s !== symbol);
      const transitions: Record<string, Record<string, string[]>> = {};
      for (const state of prev.states) {
        const copy = { ...(prev.transitions[state] ?? {}) };
        delete copy[symbol];
        transitions[state] = copy;
      }
      return { ...prev, alphabet, transitions };
    });
  };

  const handleAddState = (state: string) => {
    updateCurrentAutomaton((prev) => {
      const states = [...prev.states, state];
      const transitions: Record<string, Record<string, string[]>> = { ...prev.transitions };
      transitions[state] = {};
      for (const symbol of prev.alphabet) {
        transitions[state][symbol] = [];
      }
      const autoPositions = computeAutoLayout(states);
      const positions: Record<string, NodePosition> = {
        ...(prev.positions ?? {}),
        [state]: autoPositions[state],
      };
      return {
        ...prev,
        states,
        initialState: prev.initialState || state,
        transitions,
        positions,
      };
    });
  };

  const handleRemoveState = (state: string) => {
    updateCurrentAutomaton((prev) => {
      const states = prev.states.filter((s) => s !== state);
      const acceptingStates = prev.acceptingStates.filter((s) => s !== state);
      const initialState =
        prev.initialState === state ? (states[0] ?? '') : prev.initialState;

      const transitions: Record<string, Record<string, string[]>> = {};
      for (const from of states) {
        transitions[from] = {};
        for (const symbol of prev.alphabet) {
          const destinations = prev.transitions[from]?.[symbol] ?? [];
          transitions[from][symbol] = destinations.filter((d) => d !== state);
        }
      }

      const positions = { ...(prev.positions ?? {}) };
      delete positions[state];

      return {
        ...prev,
        states,
        initialState,
        acceptingStates,
        transitions,
        positions,
      };
    });
  };

  const handleSetInitialState = (state: string) => {
    updateCurrentAutomaton((prev) => ({ ...prev, initialState: state }));
  };

  const handleToggleAcceptingState = (state: string) => {
    updateCurrentAutomaton((prev) => {
      const exists = prev.acceptingStates.includes(state);
      const acceptingStates = exists
        ? prev.acceptingStates.filter((s) => s !== state)
        : [...prev.acceptingStates, state];
      return { ...prev, acceptingStates };
    });
  };

  const handleSetDfaTransition = (state: string, symbol: string, destination: string) => {
    updateCurrentAutomaton((prev) => ({
      ...prev,
      transitions: {
        ...prev.transitions,
        [state]: {
          ...(prev.transitions[state] ?? {}),
          [symbol]: destination ? [destination] : [],
        },
      },
    }));
  };

  const handleToggleNfaTransition = (state: string, symbol: string, destination: string) => {
    updateCurrentAutomaton((prev) => {
      const current = prev.transitions[state]?.[symbol] ?? [];
      const exists = current.includes(destination);
      const next = exists ? current.filter((d) => d !== destination) : [...current, destination];
      return {
        ...prev,
        transitions: {
          ...prev.transitions,
          [state]: {
            ...(prev.transitions[state] ?? {}),
            [symbol]: next,
          },
        },
      };
    });
  };

  const handleMoveNode = (state: string, pos: NodePosition) => {
    updateCurrentAutomaton(
      (prev) => ({
        ...prev,
        positions: {
          ...(prev.positions ?? {}),
          [state]: pos,
        },
      }),
      false,
    );
  };

  const handleAutoLayout = () => {
    updateCurrentAutomaton(
      (prev) => ({
        ...prev,
        positions: computeAutoLayout(prev.states),
      }),
      false,
    );
  };

  // --- Simulation ---
  const handleChangeWord = (nextWord: string) => {
    setWord(nextWord);
    clearSimulation();
  };

  const handleRunFull = () => {
    if (!automatonValidation.valid || !wordValidation.valid) return;
    const result = simulateAutomaton(currentAutomaton, word);
    setSimulation(result);
    setCurrentStepIndex(result.steps.length);
  };

  const handleStartStepByStep = () => {
    if (!automatonValidation.valid || !wordValidation.valid) return;
    const result = simulateAutomaton(currentAutomaton, word);
    setSimulation(result);
    setCurrentStepIndex(0);
  };

  const activeStatesForVisuals = useMemo(() => {
    if (!simulation) return [];
    if (currentStepIndex === 0) {
      return currentAutomaton.initialState ? [currentAutomaton.initialState] : [];
    }
    return simulation.steps[currentStepIndex - 1]?.statesAfter ?? [];
  }, [simulation, currentStepIndex, currentAutomaton.initialState]);

  const firedTransitionsForVisuals = useMemo(() => {
    if (!simulation || currentStepIndex === 0) return [];
    return simulation.steps[currentStepIndex - 1]?.firedTransitions ?? [];
  }, [simulation, currentStepIndex]);

  const finalDecisionForGraph = useMemo<'accepted' | 'rejected' | null>(() => {
    if (!simulation || currentStepIndex !== simulation.steps.length) return null;
    return simulation.accepted ? 'accepted' : 'rejected';
  }, [simulation, currentStepIndex]);

  const currentTypeLabel = currentAutomaton.type === 'DFA' ? 'AFD' : 'AFN';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1>Automaton</h1>
          <span className="brand-subtitle">
            Simulador de Autômatos Finitos (AFD &amp; AFN) — Teoria da Computação
          </span>
        </div>
        <div className="header-meta">
          <span className={`type-badge type-${currentAutomaton.type.toLowerCase()}`}>
            {currentTypeLabel}
          </span>
          <span className="header-model-name">{currentAutomaton.name}</span>
        </div>
      </header>

      <div className="app-body">
        <AutomatonSidebar
          automata={automata}
          selectedId={currentAutomaton.id}
          onSelect={handleSelectAutomaton}
          onCreate={handleCreateAutomaton}
          onDelete={handleDeleteAutomaton}
          onExport={handleExportAutomaton}
          onImport={handleImportAutomaton}
          onResetPresets={handleResetPresets}
          importError={importError}
        />

        <main className="workspace">
          <AutomatonEditor
            automaton={currentAutomaton}
            validation={automatonValidation}
            onChangeName={handleChangeName}
            onChangeType={handleChangeType}
            onAddSymbol={handleAddSymbol}
            onRemoveSymbol={handleRemoveSymbol}
            onAddState={handleAddState}
            onRemoveState={handleRemoveState}
            onSetInitialState={handleSetInitialState}
            onToggleAcceptingState={handleToggleAcceptingState}
          />

          <div className="visual-split">
            <TransitionTable
              automaton={currentAutomaton}
              activeStates={activeStatesForVisuals}
              firedTransitions={firedTransitionsForVisuals}
              onSetDfaTransition={handleSetDfaTransition}
              onToggleNfaTransition={handleToggleNfaTransition}
            />

            <AutomatonGraph
              automaton={currentAutomaton}
              activeStates={activeStatesForVisuals}
              firedTransitions={firedTransitionsForVisuals}
              finalDecision={finalDecisionForGraph}
              onMoveNode={handleMoveNode}
              onAutoLayout={handleAutoLayout}
            />
          </div>

          <SimulationPanel
            automaton={currentAutomaton}
            automatonValidation={automatonValidation}
            word={word}
            wordValidation={wordValidation}
            simulation={simulation}
            currentStepIndex={currentStepIndex}
            onChangeWord={handleChangeWord}
            onRunFull={handleRunFull}
            onStartStepByStep={handleStartStepByStep}
            onPrevStep={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            onNextStep={() =>
              setCurrentStepIndex((i) =>
                simulation ? Math.min(simulation.steps.length, i + 1) : i,
              )
            }
            onJumpToStep={(idx) => setCurrentStepIndex(idx)}
            onResetSimulation={clearSimulation}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
