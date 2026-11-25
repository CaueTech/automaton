import { useState } from 'react';
import type { Automaton, AutomatonType, AutomatonValidationResult } from '../core/types.ts';

interface AutomatonEditorProps {
  automaton: Automaton;
  validation: AutomatonValidationResult;
  onChangeName: (name: string) => void;
  onChangeType: (type: AutomatonType) => void;
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
  onAddState: (state: string) => void;
  onRemoveState: (state: string) => void;
  onSetInitialState: (state: string) => void;
  onToggleAcceptingState: (state: string) => void;
}

export function AutomatonEditor({
  automaton,
  validation,
  onChangeName,
  onChangeType,
  onAddSymbol,
  onRemoveSymbol,
  onAddState,
  onRemoveState,
  onSetInitialState,
  onToggleAcceptingState,
}: AutomatonEditorProps) {
  const [symbolInput, setSymbolInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);

  const typeLabel = automaton.type === 'DFA' ? 'AFD' : 'AFN';

  const suggestNextState = (): string => {
    let idx = automaton.states.length;
    while (automaton.states.includes(`q${idx}`)) {
      idx++;
    }
    return `q${idx}`;
  };

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = symbolInput.trim();
    if (!cleaned) {
      setSymbolError('Digite um símbolo.');
      return;
    }
    if (cleaned.length > 1) {
      setSymbolError('Cada símbolo do alfabeto deve ter exatamente 1 caractere.');
      return;
    }
    if (automaton.alphabet.includes(cleaned)) {
      setSymbolError(`O símbolo "${cleaned}" já está no alfabeto.`);
      return;
    }
    setSymbolError(null);
    onAddSymbol(cleaned);
    setSymbolInput('');
  };

  const handleAddState = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = stateInput.trim() || suggestNextState();
    if (automaton.states.includes(cleaned)) {
      setStateError(`O estado "${cleaned}" já existe.`);
      return;
    }
    setStateError(null);
    onAddState(cleaned);
    setStateInput('');
  };

  return (
    <section className="panel editor-panel" aria-label="Configuração do autômato">
      <div className="editor-top-row">
        <div className="field-group field-name">
          <label htmlFor="automaton-name">Nome do autômato</label>
          <input
            id="automaton-name"
            type="text"
            className="text-input"
            value={automaton.name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Ex.: AFN — Termina em 01"
          />
        </div>

        <div className="field-group field-model">
          <span className="field-label">Modelo</span>
          <div className="segmented-control" role="radiogroup" aria-label="Tipo de autômato">
            <button
              id="mode-dfa"
              type="button"
              role="radio"
              aria-checked={automaton.type === 'DFA'}
              className={`segmented-btn ${automaton.type === 'DFA' ? 'active' : ''}`}
              onClick={() => onChangeType('DFA')}
            >
              AFD
            </button>
            <button
              id="mode-nfa"
              type="button"
              role="radio"
              aria-checked={automaton.type === 'NFA'}
              className={`segmented-btn ${automaton.type === 'NFA' ? 'active' : ''}`}
              onClick={() => onChangeType('NFA')}
            >
              AFN
            </button>
          </div>
        </div>
      </div>

      {automaton.description && <p className="editor-description">{automaton.description}</p>}

      <div className="editor-grid">
        {/* Alphabet */}
        <div className="editor-block">
          <div className="block-header">
            <h3>Alfabeto (Σ)</h3>
            <span className="hint">1 caractere por símbolo</span>
          </div>

          <form className="inline-form" onSubmit={handleAddSymbol}>
            <input
              id="input-add-symbol"
              type="text"
              maxLength={1}
              className="text-input input-mono"
              value={symbolInput}
              onChange={(e) => {
                setSymbolInput(e.target.value);
                setSymbolError(null);
              }}
              placeholder="Ex.: 0, 1, a"
              aria-label="Novo símbolo do alfabeto"
            />
            <button id="btn-add-symbol" type="submit" className="btn btn-secondary btn-sm">
              Adicionar
            </button>
          </form>
          {symbolError && <p className="field-error">{symbolError}</p>}

          <div className="chip-list">
            {automaton.alphabet.map((symbol) => (
              <span key={symbol} className="chip chip-mono">
                {symbol}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remover símbolo ${symbol}`}
                  onClick={() => onRemoveSymbol(symbol)}
                >
                  ×
                </button>
              </span>
            ))}
            {automaton.alphabet.length === 0 && (
              <span className="empty-hint">Nenhum símbolo cadastrado.</span>
            )}
          </div>
        </div>

        {/* States */}
        <div className="editor-block">
          <div className="block-header">
            <h3>Estados (Q)</h3>
            <span className="hint">Defina inicial (→) e aceitação (*)</span>
          </div>

          <form className="inline-form" onSubmit={handleAddState}>
            <input
              id="input-add-state"
              type="text"
              maxLength={10}
              className="text-input input-mono"
              value={stateInput}
              onChange={(e) => {
                setStateInput(e.target.value);
                setStateError(null);
              }}
              placeholder={`Ex.: ${suggestNextState()}`}
              aria-label="Nome do novo estado"
            />
            <button id="btn-add-state" type="submit" className="btn btn-secondary btn-sm">
              Adicionar
            </button>
          </form>
          {stateError && <p className="field-error">{stateError}</p>}

          <div className="state-config-list">
            {automaton.states.map((state) => {
              const isInitial = automaton.initialState === state;
              const isAccepting = automaton.acceptingStates.includes(state);
              return (
                <div key={state} className="state-config-item">
                  <span className="state-name-mono">{state}</span>
                  <div className="state-config-controls">
                    <button
                      type="button"
                      className={`mini-toggle ${isInitial ? 'is-initial' : ''}`}
                      onClick={() => onSetInitialState(state)}
                      title="Marcar como estado inicial"
                    >
                      → Inicial
                    </button>
                    <button
                      type="button"
                      className={`mini-toggle ${isAccepting ? 'is-accepting' : ''}`}
                      onClick={() => onToggleAcceptingState(state)}
                      title="Alternar estado de aceitação"
                    >
                      * Aceitação
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label={`Remover estado ${state}`}
                      title={`Remover estado ${state}`}
                      onClick={() => onRemoveState(state)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
            {automaton.states.length === 0 && (
              <span className="empty-hint">Nenhum estado cadastrado.</span>
            )}
          </div>
        </div>
      </div>

      {!validation.valid && (
        <div className="alert alert-warning" role="status">
          <strong>Atenção na definição do {typeLabel}:</strong>
          <ul>
            {validation.errors.slice(0, 4).map((issue, idx) => (
              <li key={`${issue.code}-${idx}`}>{issue.message}</li>
            ))}
            {validation.errors.length > 4 && (
              <li>...e mais {validation.errors.length - 4} pendência(s).</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
