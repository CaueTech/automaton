import { useState } from 'react';
import type { Automaton, AutomatonType, AutomatonValidationResult } from '../core/types.ts';

interface AutomatonEditorProps {
  automaton: Automaton;
  validation: AutomatonValidationResult;
  onChangeName: (nome: string) => void;
  onChangeType: (tipo: AutomatonType) => void;
  onAddSymbol: (simbolo: string) => void;
  onRemoveSymbol: (simbolo: string) => void;
  onAddState: (estado: string) => void;
  onRemoveState: (estado: string) => void;
  onSetInitialState: (estado: string) => void;
  onToggleAcceptingState: (estado: string) => void;
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

  const suggestNextState = (): string => {
    let idx = automaton.estados.length;
    while (automaton.estados.includes(`q${idx}`)) {
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
    if (automaton.alfabeto.includes(cleaned)) {
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
    if (automaton.estados.includes(cleaned)) {
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
            value={automaton.nome}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Ex.: AFN — Termina em 01"
          />
        </div>

        <div className="field-group field-model">
          <span className="field-label">Modelo</span>
          <div className="segmented-control" role="radiogroup" aria-label="Tipo de autômato">
            <button
              id="mode-afd"
              type="button"
              role="radio"
              aria-checked={automaton.tipo === 'AFD'}
              className={`segmented-btn ${automaton.tipo === 'AFD' ? 'active' : ''}`}
              onClick={() => onChangeType('AFD')}
            >
              AFD
            </button>
            <button
              id="mode-afn"
              type="button"
              role="radio"
              aria-checked={automaton.tipo === 'AFN'}
              className={`segmented-btn ${automaton.tipo === 'AFN' ? 'active' : ''}`}
              onClick={() => onChangeType('AFN')}
            >
              AFN
            </button>
          </div>
        </div>
      </div>

      {automaton.descricao && <p className="editor-description">{automaton.descricao}</p>}

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
            {automaton.alfabeto.map((simbolo) => (
              <span key={simbolo} className="chip chip-mono">
                {simbolo}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remover símbolo ${simbolo}`}
                  onClick={() => onRemoveSymbol(simbolo)}
                >
                  ×
                </button>
              </span>
            ))}
            {automaton.alfabeto.length === 0 && (
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
            {automaton.estados.map((estado) => {
              const isInitial = automaton.estadoInicial === estado;
              const isAccepting = automaton.estadosAceitacao.includes(estado);
              return (
                <div key={estado} className="state-config-item">
                  <span className="state-name-mono">{estado}</span>
                  <div className="state-config-controls">
                    <button
                      type="button"
                      className={`mini-toggle ${isInitial ? 'is-initial' : ''}`}
                      onClick={() => onSetInitialState(estado)}
                      title="Marcar como estado inicial"
                    >
                      → Inicial
                    </button>
                    <button
                      type="button"
                      className={`mini-toggle ${isAccepting ? 'is-accepting' : ''}`}
                      onClick={() => onToggleAcceptingState(estado)}
                      title="Alternar estado de aceitação"
                    >
                      * Aceitação
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label={`Remover estado ${estado}`}
                      title={`Remover estado ${estado}`}
                      onClick={() => onRemoveState(estado)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
            {automaton.estados.length === 0 && (
              <span className="empty-hint">Nenhum estado cadastrado.</span>
            )}
          </div>
        </div>
      </div>

      {!validation.valido && (
        <div className="alert alert-warning" role="status">
          <strong>Atenção na definição do {automaton.tipo}:</strong>
          <ul>
            {validation.erros.slice(0, 4).map((erro, idx) => (
              <li key={`${erro.codigo}-${idx}`}>{erro.mensagem}</li>
            ))}
            {validation.erros.length > 4 && (
              <li>...e mais {validation.erros.length - 4} pendência(s).</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
