import type { Automaton, FiredTransition } from '../core/types.ts';

interface TransitionTableProps {
  automaton: Automaton;
  activeStates: string[];
  firedTransitions: FiredTransition[];
  onSetDfaTransition: (state: string, symbol: string, destination: string) => void;
  onToggleNfaTransition: (state: string, symbol: string, destination: string) => void;
}

export function TransitionTable({
  automaton,
  activeStates,
  firedTransitions,
  onSetDfaTransition,
  onToggleNfaTransition,
}: TransitionTableProps) {
  const activeSet = new Set(activeStates);
  const firedCellKeys = new Set(firedTransitions.map((t) => `${t.from}::${t.symbol}`));

  return (
    <section className="panel table-panel" aria-label="Tabela de transições editável">
      <div className="panel-header">
        <div>
          <h2>Tabela de Transições (δ)</h2>
          <p className="panel-subtitle">
            {automaton.type === 'DFA'
              ? 'Modo AFD: cada par (estado, símbolo) exige exatamente 1 destino.'
              : 'Modo AFN: clique nos estados para ativar 0, 1 ou múltiplos destinos.'}
          </p>
        </div>
      </div>

      {automaton.states.length === 0 || automaton.alphabet.length === 0 ? (
        <p className="empty-hint">
          Cadastre pelo menos um estado e um símbolo no alfabeto para preencher a tabela.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="transition-table">
            <thead>
              <tr>
                <th scope="col">Estado</th>
                {automaton.alphabet.map((symbol) => (
                  <th key={symbol} scope="col" className="col-symbol">
                    {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {automaton.states.map((state) => {
                const isInitial = automaton.initialState === state;
                const isAccepting = automaton.acceptingStates.includes(state);
                const isActive = activeSet.has(state);

                return (
                  <tr key={state} className={isActive ? 'row-active' : ''}>
                    <th scope="row" className="state-cell">
                      <span className="state-markers">
                        {isInitial && (
                          <span className="marker-initial" title="Estado inicial">
                            →
                          </span>
                        )}
                        {isAccepting && (
                          <span className="marker-accepting" title="Estado de aceitação">
                            *
                          </span>
                        )}
                      </span>
                      <span className="state-label-mono">{state}</span>
                    </th>

                    {automaton.alphabet.map((symbol) => {
                      const destinations = automaton.transitions[state]?.[symbol] ?? [];
                      const isFired = firedCellKeys.has(`${state}::${symbol}`);
                      const isMissingDfa = automaton.type === 'DFA' && destinations.length !== 1;

                      return (
                        <td
                          key={symbol}
                          className={[
                            'transition-cell',
                            isFired ? 'cell-fired' : '',
                            isMissingDfa ? 'cell-warning' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {automaton.type === 'DFA' ? (
                            <select
                              aria-label={`Transição AFD de ${state} com símbolo ${symbol}`}
                              className="dfa-select"
                              value={destinations[0] ?? ''}
                              onChange={(e) => onSetDfaTransition(state, symbol, e.target.value)}
                            >
                              <option value="">— Selecione —</option>
                              {automaton.states.map((dest) => (
                                <option key={dest} value={dest}>
                                  {dest}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="nfa-dest-group">
                              {automaton.states.map((dest) => {
                                const selected = destinations.includes(dest);
                                return (
                                  <button
                                    key={dest}
                                    type="button"
                                    className={`nfa-dest-chip ${selected ? 'selected' : ''}`}
                                    aria-pressed={selected}
                                    onClick={() => onToggleNfaTransition(state, symbol, dest)}
                                  >
                                    {dest}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
