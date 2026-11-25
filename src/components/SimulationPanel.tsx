import type {
  Automaton,
  AutomatonValidationResult,
  SimulationResult,
  WordValidationResult,
} from '../core/types.ts';

interface SimulationPanelProps {
  automaton: Automaton;
  automatonValidation: AutomatonValidationResult;
  word: string;
  wordValidation: WordValidationResult;
  simulation: SimulationResult | null;
  currentStepIndex: number; // 0 = initial state (before reading symbols), 1..N = after symbol i
  onChangeWord: (word: string) => void;
  onRunFull: () => void;
  onStartStepByStep: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onJumpToStep: (stepIndex: number) => void;
  onResetSimulation: () => void;
}

const EXPERIMENT_SAMPLES = [
  { label: '101', value: '101', hint: 'Aceita (termina em 01)' },
  { label: '010', value: '010', hint: 'Rejeita' },
  { label: 'ε (vazia)', value: '', hint: 'Palavra vazia' },
  { label: '102', value: '102', hint: 'Símbolo fora do alfabeto {0, 1}' },
];

export function SimulationPanel({
  automaton,
  automatonValidation,
  word,
  wordValidation,
  simulation,
  currentStepIndex,
  onChangeWord,
  onRunFull,
  onStartStepByStep,
  onPrevStep,
  onNextStep,
  onJumpToStep,
  onResetSimulation,
}: SimulationPanelProps) {
  const typeLabel = automaton.type === 'DFA' ? 'AFD' : 'AFN';
  const canSimulate = automatonValidation.valid && wordValidation.valid;
  const totalSteps = simulation?.steps.length ?? 0;
  const isFinished = simulation !== null && currentStepIndex === totalSteps;
  const currentStep =
    simulation && currentStepIndex > 0 ? simulation.steps[currentStepIndex - 1] : null;

  const currentActiveStates = simulation
    ? currentStepIndex === 0
      ? automaton.initialState
        ? [automaton.initialState]
        : []
      : simulation.steps[currentStepIndex - 1].statesAfter
    : [];

  return (
    <section className="panel simulation-panel" aria-label="Simulador de palavras">
      <div className="panel-header">
        <div>
          <h2>Simulação</h2>
          <p className="panel-subtitle">
            Digite uma palavra (ou deixe vazio para testar ε) e execute de uma vez ou passo a passo.
          </p>
        </div>
      </div>

      <div className="sim-input-row">
        <div className="field-group sim-word-field">
          <label htmlFor="input-word">Palavra de entrada</label>
          <input
            id="input-word"
            type="text"
            className="text-input input-mono input-word"
            value={word}
            onChange={(e) => onChangeWord(e.target.value)}
            placeholder="Deixe vazio para palavra vazia (ε) ou digite ex.: 101"
          />
        </div>

        <div className="sim-primary-actions">
          <button
            id="btn-run-full"
            type="button"
            className="btn btn-primary"
            disabled={!canSimulate}
            onClick={onRunFull}
          >
            Executar tudo
          </button>
          <button
            id="btn-start-step"
            type="button"
            className="btn btn-secondary"
            disabled={!canSimulate}
            onClick={onStartStepByStep}
          >
            Passo a passo
          </button>
          {simulation && (
            <button
              id="btn-reset-sim"
              type="button"
              className="btn btn-ghost"
              onClick={onResetSimulation}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="sample-bar">
        <span className="sample-label">Exemplos do experimento:</span>
        {EXPERIMENT_SAMPLES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            className="sample-chip"
            title={sample.hint}
            onClick={() => onChangeWord(sample.value)}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {!wordValidation.valid && wordValidation.errorMessage && (
        <div className="alert alert-error" role="alert">
          <strong>Entrada inválida:</strong> {wordValidation.errorMessage}
        </div>
      )}

      {!automatonValidation.valid && (
        <div className="alert alert-warning" role="status">
          Corrija as pendências na definição do {typeLabel} acima antes de executar a simulação.
        </div>
      )}

      {simulation && (
        <div className="sim-results">
          {/* Step-by-step controls and input tape */}
          <div className="sim-stepper-bar">
            <div className="tape-container" aria-label="Fita de símbolos da palavra">
              <span className="tape-title">Fita:</span>
              {simulation.isEmptyWord ? (
                <span className="tape-cell tape-cell-active">ε</span>
              ) : (
                <div className="tape-cells">
                  {simulation.word.split('').map((ch, idx) => {
                    const stepNum = idx + 1;
                    const isCurrent = stepNum === currentStepIndex;
                    const isRead = stepNum < currentStepIndex;
                    return (
                      <button
                        key={`${idx}-${ch}`}
                        type="button"
                        className={[
                          'tape-cell',
                          isCurrent ? 'tape-cell-active' : '',
                          isRead ? 'tape-cell-read' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => onJumpToStep(stepNum)}
                        title={`Ir para o passo ${stepNum} (símbolo "${ch}")`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="stepper-controls">
              <button
                id="btn-step-prev"
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentStepIndex <= 0}
                onClick={onPrevStep}
              >
                ← Anterior
              </button>
              <span className="step-counter">
                Passo {currentStepIndex} de {totalSteps}
              </span>
              <button
                id="btn-step-next"
                type="button"
                className="btn btn-primary btn-sm"
                disabled={currentStepIndex >= totalSteps}
                onClick={onNextStep}
              >
                Próximo →
              </button>
            </div>
          </div>

          {/* Current step inspector */}
          <div className="step-inspector">
            {currentStepIndex === 0 ? (
              <div className="step-cards">
                <div className="step-metric">
                  <span className="metric-label">Momento</span>
                  <span className="metric-value">Início (antes da leitura)</span>
                </div>
                <div className="step-metric">
                  <span className="metric-label">Estados ativos</span>
                  <div className="state-badge-row">
                    {currentActiveStates.map((state) => (
                      <span key={state} className="state-pill state-pill-active">
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : currentStep ? (
              <>
                <div className="step-cards">
                  <div className="step-metric">
                    <span className="metric-label">Símbolo lido (pos. {currentStep.index})</span>
                    <span className="metric-value metric-symbol">{currentStep.symbol}</span>
                  </div>

                  <div className="step-metric">
                    <span className="metric-label">Estados ativos antes</span>
                    <div className="state-badge-row">
                      {currentStep.statesBefore.length > 0 ? (
                        currentStep.statesBefore.map((state) => (
                          <span key={state} className="state-pill">
                            {state}
                          </span>
                        ))
                      ) : (
                        <span className="state-pill state-pill-empty">∅</span>
                      )}
                    </div>
                  </div>

                  <div className="step-metric">
                    <span className="metric-label">Estados ativos depois</span>
                    <div className="state-badge-row">
                      {currentStep.statesAfter.length > 0 ? (
                        currentStep.statesAfter.map((state) => (
                          <span key={state} className="state-pill state-pill-active">
                            {state}
                          </span>
                        ))
                      ) : (
                        <span className="state-pill state-pill-empty">∅ (sem destinos)</span>
                      )}
                    </div>
                  </div>
                </div>

                {currentStep.firedTransitions.length > 0 && (
                  <div className="fired-transitions-box">
                    <span className="fired-title">Transições avaliadas neste passo:</span>
                    <div className="fired-list">
                      {currentStep.firedTransitions.map((transition, idx) => (
                        <code key={`${transition.from}-${idx}`} className="fired-formula">
                          δ({transition.from}, {transition.symbol}) ={' '}
                          {transition.to.length > 0 ? `{${transition.to.join(', ')}}` : '∅'}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Final verdict */}
          {isFinished && (
            <div
              className={`verdict-banner ${simulation.accepted ? 'verdict-accepted' : 'verdict-rejected'}`}
              role="status"
            >
              <div className="verdict-header">
                <span className="verdict-status">
                  {simulation.accepted ? 'PALAVRA ACEITA' : 'PALAVRA REJEITADA'}
                </span>
                <span className="verdict-word">
                  Entrada: <code>{simulation.isEmptyWord ? 'ε (vazia)' : simulation.word}</code>
                </span>
              </div>
              <p className="verdict-reason">{simulation.justification}</p>
              <div className="verdict-states">
                <span>Estados ativos ao final:</span>
                {simulation.finalActiveStates.length > 0 ? (
                  simulation.finalActiveStates.map((state) => {
                    const isAccepting = simulation.reachedAcceptingStates.includes(state);
                    return (
                      <span
                        key={state}
                        className={`state-pill ${isAccepting ? 'state-pill-accepting' : ''}`}
                      >
                        {state}
                        {isAccepting ? ' (aceitação)' : ''}
                      </span>
                    );
                  })
                ) : (
                  <span className="state-pill state-pill-empty">∅</span>
                )}
              </div>
            </div>
          )}

          {/* Step history */}
          {simulation.steps.length > 0 && (
            <div className="history-section">
              <h3>Histórico de leitura</h3>
              <div className="table-scroll">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Passo</th>
                      <th>Símbolo</th>
                      <th>Estados antes</th>
                      <th>Estados depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.steps.map((step) => {
                      const isCurrent = step.index === currentStepIndex;
                      const isFuture = step.index > currentStepIndex;
                      return (
                        <tr
                          key={step.index}
                          className={[
                            isCurrent ? 'history-row-current' : '',
                            isFuture ? 'history-row-future' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => onJumpToStep(step.index)}
                        >
                          <td className="mono">{step.index}</td>
                          <td className="mono">{step.symbol}</td>
                          <td className="mono">
                            {step.statesBefore.length > 0
                              ? `{${step.statesBefore.join(', ')}}`
                              : '∅'}
                          </td>
                          <td className="mono">
                            {step.statesAfter.length > 0
                              ? `{${step.statesAfter.join(', ')}}`
                              : '∅'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
