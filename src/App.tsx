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
    () => validateWord(word, currentAutomaton.alfabeto),
    [word, currentAutomaton.alfabeto],
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

  const handleCreateAutomaton = (tipo: AutomatonType) => {
    const novo = createEmptyAutomaton(tipo, automata.length);
    setAutomata((prev) => [...prev, novo]);
    setSelectedId(novo.id);
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
    const safeName = automaton.nome
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${safeName || 'automato'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAutomaton = (jsonText: string) => {
    const { automaton, erro } = parseAutomatonFromJson(jsonText);
    if (erro || !automaton) {
      setImportError(erro ?? 'Falha ao importar JSON.');
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
  const handleChangeName = (nome: string) => {
    updateCurrentAutomaton((prev) => ({ ...prev, nome }), false);
  };

  const handleChangeType = (tipo: AutomatonType) => {
    updateCurrentAutomaton((prev) => {
      if (prev.tipo === tipo) return prev;
      const transicoes: Record<string, Record<string, string[]>> = {};
      for (const estado of prev.estados) {
        transicoes[estado] = {};
        for (const simbolo of prev.alfabeto) {
          const atual = prev.transicoes[estado]?.[simbolo] ?? [];
          // When converting NFA -> DFA, keep only the first destination if multiple exist
          transicoes[estado][simbolo] = tipo === 'AFD' ? atual.slice(0, 1) : [...atual];
        }
      }
      return { ...prev, tipo, transicoes };
    });
  };

  const handleAddSymbol = (simbolo: string) => {
    updateCurrentAutomaton((prev) => {
      const alfabeto = [...prev.alfabeto, simbolo];
      const transicoes: Record<string, Record<string, string[]>> = {};
      for (const estado of prev.estados) {
        transicoes[estado] = {
          ...(prev.transicoes[estado] ?? {}),
          [simbolo]: [],
        };
      }
      return { ...prev, alfabeto, transicoes };
    });
  };

  const handleRemoveSymbol = (simbolo: string) => {
    updateCurrentAutomaton((prev) => {
      const alfabeto = prev.alfabeto.filter((s) => s !== simbolo);
      const transicoes: Record<string, Record<string, string[]>> = {};
      for (const estado of prev.estados) {
        const copy = { ...(prev.transicoes[estado] ?? {}) };
        delete copy[simbolo];
        transicoes[estado] = copy;
      }
      return { ...prev, alfabeto, transicoes };
    });
  };

  const handleAddState = (estado: string) => {
    updateCurrentAutomaton((prev) => {
      const estados = [...prev.estados, estado];
      const transicoes: Record<string, Record<string, string[]>> = { ...prev.transicoes };
      transicoes[estado] = {};
      for (const simbolo of prev.alfabeto) {
        transicoes[estado][simbolo] = [];
      }
      const autoPos = computeAutoLayout(estados);
      const posicoes: Record<string, NodePosition> = {
        ...(prev.posicoes ?? {}),
        [estado]: autoPos[estado],
      };
      return {
        ...prev,
        estados,
        estadoInicial: prev.estadoInicial || estado,
        transicoes,
        posicoes,
      };
    });
  };

  const handleRemoveState = (estado: string) => {
    updateCurrentAutomaton((prev) => {
      const estados = prev.estados.filter((e) => e !== estado);
      const estadosAceitacao = prev.estadosAceitacao.filter((e) => e !== estado);
      const estadoInicial =
        prev.estadoInicial === estado ? (estados[0] ?? '') : prev.estadoInicial;

      const transicoes: Record<string, Record<string, string[]>> = {};
      for (const origem of estados) {
        transicoes[origem] = {};
        for (const simbolo of prev.alfabeto) {
          const destinos = prev.transicoes[origem]?.[simbolo] ?? [];
          transicoes[origem][simbolo] = destinos.filter((d) => d !== estado);
        }
      }

      const posicoes = { ...(prev.posicoes ?? {}) };
      delete posicoes[estado];

      return {
        ...prev,
        estados,
        estadoInicial,
        estadosAceitacao,
        transicoes,
        posicoes,
      };
    });
  };

  const handleSetInitialState = (estado: string) => {
    updateCurrentAutomaton((prev) => ({ ...prev, estadoInicial: estado }));
  };

  const handleToggleAcceptingState = (estado: string) => {
    updateCurrentAutomaton((prev) => {
      const exists = prev.estadosAceitacao.includes(estado);
      const estadosAceitacao = exists
        ? prev.estadosAceitacao.filter((e) => e !== estado)
        : [...prev.estadosAceitacao, estado];
      return { ...prev, estadosAceitacao };
    });
  };

  const handleSetDfaTransition = (estado: string, simbolo: string, destino: string) => {
    updateCurrentAutomaton((prev) => ({
      ...prev,
      transicoes: {
        ...prev.transicoes,
        [estado]: {
          ...(prev.transicoes[estado] ?? {}),
          [simbolo]: destino ? [destino] : [],
        },
      },
    }));
  };

  const handleToggleNfaTransition = (estado: string, simbolo: string, destino: string) => {
    updateCurrentAutomaton((prev) => {
      const atual = prev.transicoes[estado]?.[simbolo] ?? [];
      const exists = atual.includes(destino);
      const next = exists ? atual.filter((d) => d !== destino) : [...atual, destino];
      return {
        ...prev,
        transicoes: {
          ...prev.transicoes,
          [estado]: {
            ...(prev.transicoes[estado] ?? {}),
            [simbolo]: next,
          },
        },
      };
    });
  };

  const handleMoveNode = (estado: string, pos: NodePosition) => {
    updateCurrentAutomaton(
      (prev) => ({
        ...prev,
        posicoes: {
          ...(prev.posicoes ?? {}),
          [estado]: pos,
        },
      }),
      false,
    );
  };

  const handleAutoLayout = () => {
    updateCurrentAutomaton(
      (prev) => ({
        ...prev,
        posicoes: computeAutoLayout(prev.estados),
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
    if (!automatonValidation.valido || !wordValidation.valida) return;
    const result = simulateAutomaton(currentAutomaton, word);
    setSimulation(result);
    setCurrentStepIndex(result.passos.length);
  };

  const handleStartStepByStep = () => {
    if (!automatonValidation.valido || !wordValidation.valida) return;
    const result = simulateAutomaton(currentAutomaton, word);
    setSimulation(result);
    setCurrentStepIndex(0);
  };

  const activeStatesForVisuals = useMemo(() => {
    if (!simulation) return [];
    if (currentStepIndex === 0) {
      return currentAutomaton.estadoInicial ? [currentAutomaton.estadoInicial] : [];
    }
    return simulation.passos[currentStepIndex - 1]?.estadosDepois ?? [];
  }, [simulation, currentStepIndex, currentAutomaton.estadoInicial]);

  const firedTransitionsForVisuals = useMemo(() => {
    if (!simulation || currentStepIndex === 0) return [];
    return simulation.passos[currentStepIndex - 1]?.transicoesDisparadas ?? [];
  }, [simulation, currentStepIndex]);

  const finalDecisionForGraph = useMemo<'accepted' | 'rejected' | null>(() => {
    if (!simulation || currentStepIndex !== simulation.passos.length) return null;
    return simulation.aceita ? 'accepted' : 'rejected';
  }, [simulation, currentStepIndex]);

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
          <span className={`type-badge type-${currentAutomaton.tipo.toLowerCase()}`}>
            {currentAutomaton.tipo}
          </span>
          <span className="header-model-name">{currentAutomaton.nome}</span>
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
                simulation ? Math.min(simulation.passos.length, i + 1) : i,
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
