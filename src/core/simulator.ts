import type {
  Automaton,
  FiredTransition,
  SimulationResult,
  SimulationStep,
} from './types.ts';

function sortByStateOrder(states: Set<string>, order: string[]): string[] {
  const indexMap = new Map(order.map((s, idx) => [s, idx]));
  return Array.from(states).sort(
    (a, b) => (indexMap.get(a) ?? Number.MAX_SAFE_INTEGER) - (indexMap.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Runs a full simulation of a DFA (AFD) or NFA (AFN) on the given input word (including empty word).
 * Returns every intermediate step (to power step-by-step execution) along with the final justification.
 */
export function simulateAutomaton(automaton: Automaton, palavra: string): SimulationResult {
  const acceptingSet = new Set(automaton.estadosAceitacao);
  let activeStates: string[] = automaton.estadoInicial ? [automaton.estadoInicial] : [];
  const passos: SimulationStep[] = [];

  for (let i = 0; i < palavra.length; i++) {
    const simbolo = palavra[i];
    const estadosAntes = [...activeStates];
    const nextStateSet = new Set<string>();
    const transicoesDisparadas: FiredTransition[] = [];

    for (const origem of estadosAntes) {
      const destinos = automaton.transicoes[origem]?.[simbolo] ?? [];
      transicoesDisparadas.push({
        origem,
        simbolo,
        destinos: [...destinos],
      });
      for (const destino of destinos) {
        nextStateSet.add(destino);
      }
    }

    const estadosDepois = sortByStateOrder(nextStateSet, automaton.estados);

    passos.push({
      indice: i + 1,
      simbolo,
      estadosAntes,
      estadosDepois,
      transicoesDisparadas,
    });

    activeStates = estadosDepois;
  }

  const estadosAceitacaoAlcancados = activeStates.filter((estado) => acceptingSet.has(estado));
  const aceita = estadosAceitacaoAlcancados.length > 0;
  const palavraVazia = palavra.length === 0;
  const justificativa = buildJustification({
    automaton,
    palavraVazia,
    estadosFinaisAtivos: activeStates,
    estadosAceitacaoAlcancados,
    aceita,
  });

  return {
    palavra,
    palavraVazia,
    passos,
    estadosFinaisAtivos: activeStates,
    estadosAceitacaoAlcancados,
    aceita,
    justificativa,
  };
}

function buildJustification(params: {
  automaton: Automaton;
  palavraVazia: boolean;
  estadosFinaisAtivos: string[];
  estadosAceitacaoAlcancados: string[];
  aceita: boolean;
}): string {
  const { automaton, palavraVazia, estadosFinaisAtivos, estadosAceitacaoAlcancados, aceita } = params;

  if (palavraVazia) {
    if (aceita) {
      return `A palavra vazia (ε) foi aceita porque o estado inicial ${automaton.estadoInicial} também é um estado de aceitação.`;
    }
    return `A palavra vazia (ε) foi rejeitada porque o estado inicial ${automaton.estadoInicial} não é um estado de aceitação.`;
  }

  if (estadosFinaisAtivos.length === 0) {
    return `A palavra foi rejeitada porque todos os caminhos possíveis foram encerrados sem transição disponível (conjunto de estados ativos vazio: ∅).`;
  }

  if (automaton.tipo === 'AFD') {
    const estadoFinal = estadosFinaisAtivos[0];
    if (aceita) {
      return `A palavra foi aceita porque, ao final da leitura, o AFD terminou no estado ${estadoFinal}, que é um estado de aceitação.`;
    }
    return `A palavra foi rejeitada porque, ao final da leitura, o AFD terminou no estado ${estadoFinal}, que não é um estado de aceitação.`;
  }

  // NFA (AFN)
  const ativosFmt = `{${estadosFinaisAtivos.join(', ')}}`;
  if (aceita) {
    const aceitosFmt = estadosAceitacaoAlcancados.join(', ');
    if (estadosFinaisAtivos.length > 1) {
      return `A palavra foi aceita porque, entre os estados ativos ao final ${ativosFmt}, pelo menos um caminho alcançou um estado de aceitação (${aceitosFmt}).`;
    }
    return `A palavra foi aceita porque o AFN terminou no estado ativo ${aceitosFmt}, que é um estado de aceitação.`;
  }

  return `A palavra foi rejeitada porque nenhum dos estados ativos ao final da leitura ${ativosFmt} é um estado de aceitação.`;
}
