import type {
  Automaton,
  FiredTransition,
  SimulationResult,
  SimulationStep,
} from './types.ts';

function sortByStateOrder(states: Set<string>, order: string[]): string[] {
  const indexMap = new Map(order.map((s, idx) => [s, idx]));
  return Array.from(states).sort(
    (a, b) =>
      (indexMap.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (indexMap.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Runs a full simulation of a DFA (AFD) or NFA (AFN) on the given input word (including empty word).
 * Returns every intermediate step (to power step-by-step execution) along with the final justification.
 */
export function simulateAutomaton(automaton: Automaton, word: string): SimulationResult {
  const acceptingSet = new Set(automaton.acceptingStates);
  let activeStates: string[] = automaton.initialState ? [automaton.initialState] : [];
  const steps: SimulationStep[] = [];

  for (let i = 0; i < word.length; i++) {
    const symbol = word[i];
    const statesBefore = [...activeStates];
    const nextStateSet = new Set<string>();
    const firedTransitions: FiredTransition[] = [];

    for (const from of statesBefore) {
      const destinations = automaton.transitions[from]?.[symbol] ?? [];
      firedTransitions.push({
        from,
        symbol,
        to: [...destinations],
      });
      for (const destination of destinations) {
        nextStateSet.add(destination);
      }
    }

    const statesAfter = sortByStateOrder(nextStateSet, automaton.states);

    steps.push({
      index: i + 1,
      symbol,
      statesBefore,
      statesAfter,
      firedTransitions,
    });

    activeStates = statesAfter;
  }

  const reachedAcceptingStates = activeStates.filter((state) => acceptingSet.has(state));
  const accepted = reachedAcceptingStates.length > 0;
  const isEmptyWord = word.length === 0;
  const justification = buildJustification({
    automaton,
    isEmptyWord,
    finalActiveStates: activeStates,
    reachedAcceptingStates,
    accepted,
  });

  return {
    word,
    isEmptyWord,
    steps,
    finalActiveStates: activeStates,
    reachedAcceptingStates,
    accepted,
    justification,
  };
}

function buildJustification(params: {
  automaton: Automaton;
  isEmptyWord: boolean;
  finalActiveStates: string[];
  reachedAcceptingStates: string[];
  accepted: boolean;
}): string {
  const { automaton, isEmptyWord, finalActiveStates, reachedAcceptingStates, accepted } = params;

  if (isEmptyWord) {
    if (accepted) {
      return `A palavra vazia (ε) foi aceita porque o estado inicial ${automaton.initialState} também é um estado de aceitação.`;
    }
    return `A palavra vazia (ε) foi rejeitada porque o estado inicial ${automaton.initialState} não é um estado de aceitação.`;
  }

  if (finalActiveStates.length === 0) {
    return `A palavra foi rejeitada porque todos os caminhos possíveis foram encerrados sem transição disponível (conjunto de estados ativos vazio: ∅).`;
  }

  if (automaton.type === 'DFA') {
    const finalState = finalActiveStates[0];
    if (accepted) {
      return `A palavra foi aceita porque, ao final da leitura, o AFD terminou no estado ${finalState}, que é um estado de aceitação.`;
    }
    return `A palavra foi rejeitada porque, ao final da leitura, o AFD terminou no estado ${finalState}, que não é um estado de aceitação.`;
  }

  // NFA (AFN)
  const formattedActive = `{${finalActiveStates.join(', ')}}`;
  if (accepted) {
    const formattedAccepted = reachedAcceptingStates.join(', ');
    if (finalActiveStates.length > 1) {
      return `A palavra foi aceita porque, entre os estados ativos ao final ${formattedActive}, pelo menos um caminho alcançou um estado de aceitação (${formattedAccepted}).`;
    }
    return `A palavra foi aceita porque o AFN terminou no estado ativo ${formattedAccepted}, que é um estado de aceitação.`;
  }

  return `A palavra foi rejeitada porque nenhum dos estados ativos ao final da leitura ${formattedActive} é um estado de aceitação.`;
}
