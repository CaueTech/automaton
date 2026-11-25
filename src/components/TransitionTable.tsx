import type { Automaton, FiredTransition } from '../core/types.ts';

interface TransitionTableProps {
  automaton: Automaton;
  activeStates: string[];
  firedTransitions: FiredTransition[];
  onSetDfaTransition: (estado: string, simbolo: string, destino: string) => void;
  onToggleNfaTransition: (estado: string, simbolo: string, destino: string) => void;
}

export function TransitionTable({
  automaton,
  activeStates,
  firedTransitions,
  onSetDfaTransition,
  onToggleNfaTransition,
}: TransitionTableProps) {
  const activeSet = new Set(activeStates);
  const firedCellKeys = new Set(firedTransitions.map((t) => `${t.origem}::${t.simbolo}`));

  return (
    <section className="panel table-panel" aria-label="Tabela de transições editável">
      <div className="panel-header">
        <div>
          <h2>Tabela de Transições (δ)</h2>
          <p className="panel-subtitle">
            {automaton.tipo === 'AFD'
              ? 'Modo AFD: cada par (estado, símbolo) exige exatamente 1 destino.'
              : 'Modo AFN: clique nos estados para ativar 0, 1 ou múltiplos destinos.'}
          </p>
        </div>
      </div>

      {automaton.estados.length === 0 || automaton.alfabeto.length === 0 ? (
        <p className="empty-hint">
          Cadastre pelo menos um estado e um símbolo no alfabeto para preencher a tabela.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="transition-table">
            <thead>
              <tr>
                <th scope="col">Estado</th>
                {automaton.alfabeto.map((simbolo) => (
                  <th key={simbolo} scope="col" className="col-symbol">
                    {simbolo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {automaton.estados.map((estado) => {
                const isInitial = automaton.estadoInicial === estado;
                const isAccepting = automaton.estadosAceitacao.includes(estado);
                const isActive = activeSet.has(estado);

                return (
                  <tr key={estado} className={isActive ? 'row-active' : ''}>
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
                      <span className="state-label-mono">{estado}</span>
                    </th>

                    {automaton.alfabeto.map((simbolo) => {
                      const destinos = automaton.transicoes[estado]?.[simbolo] ?? [];
                      const isFired = firedCellKeys.has(`${estado}::${simbolo}`);
                      const isMissingDfa = automaton.tipo === 'AFD' && destinos.length !== 1;

                      return (
                        <td
                          key={simbolo}
                          className={[
                            'transition-cell',
                            isFired ? 'cell-fired' : '',
                            isMissingDfa ? 'cell-warning' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {automaton.tipo === 'AFD' ? (
                            <select
                              aria-label={`Transição AFD de ${estado} com símbolo ${simbolo}`}
                              className="dfa-select"
                              value={destinos[0] ?? ''}
                              onChange={(e) => onSetDfaTransition(estado, simbolo, e.target.value)}
                            >
                              <option value="">— Selecione —</option>
                              {automaton.estados.map((dest) => (
                                <option key={dest} value={dest}>
                                  {dest}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="nfa-dest-group">
                              {automaton.estados.map((dest) => {
                                const selected = destinos.includes(dest);
                                return (
                                  <button
                                    key={dest}
                                    type="button"
                                    className={`nfa-dest-chip ${selected ? 'selected' : ''}`}
                                    aria-pressed={selected}
                                    onClick={() => onToggleNfaTransition(estado, simbolo, dest)}
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
