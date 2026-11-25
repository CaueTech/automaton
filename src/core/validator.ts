import type {
  Automaton,
  AutomatonValidationResult,
  InvalidSymbolOccurrence,
  ValidationIssue,
  WordValidationResult,
} from './types.ts';

/**
 * Validates the structural consistency of a DFA (AFD) or NFA (AFN).
 */
export function validateAutomaton(automaton: Automaton): AutomatonValidationResult {
  const errors: ValidationIssue[] = [];
  const stateSet = new Set(automaton.states);

  if (automaton.states.length === 0) {
    errors.push({
      code: 'NO_STATES',
      message: 'Cadastre pelo menos um estado antes de simular.',
    });
  }

  if (automaton.alphabet.length === 0) {
    errors.push({
      code: 'NO_ALPHABET',
      message: 'Cadastre pelo menos um símbolo no alfabeto.',
    });
  }

  if (!automaton.initialState || !stateSet.has(automaton.initialState)) {
    errors.push({
      code: 'INVALID_INITIAL_STATE',
      message: 'Selecione um estado inicial válido.',
    });
  }

  for (const acceptingState of automaton.acceptingStates) {
    if (!stateSet.has(acceptingState)) {
      errors.push({
        code: 'INVALID_ACCEPTING_STATE',
        message: `O estado de aceitação "${acceptingState}" não existe na lista de estados.`,
        state: acceptingState,
      });
    }
  }

  for (const state of automaton.states) {
    for (const symbol of automaton.alphabet) {
      const destinations = automaton.transitions[state]?.[symbol] ?? [];

      for (const destination of destinations) {
        if (!stateSet.has(destination)) {
          errors.push({
            code: 'UNKNOWN_DESTINATION',
            message: `A transição δ(${state}, ${symbol}) aponta para o estado inexistente "${destination}".`,
            state,
            symbol,
          });
        }
      }

      if (automaton.type === 'DFA') {
        if (destinations.length === 0) {
          errors.push({
            code: 'DFA_INCOMPLETE_TRANSITION',
            message: `No modo AFD, δ(${state}, ${symbol}) precisa ter exatamente 1 destino definido.`,
            state,
            symbol,
          });
        } else if (destinations.length > 1) {
          errors.push({
            code: 'DFA_NONDETERMINISTIC_TRANSITION',
            message: `No modo AFD, δ(${state}, ${symbol}) possui ${destinations.length} destinos (${destinations.join(', ')}), mas deve ter apenas 1.`,
            state,
            symbol,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that every symbol in the input word belongs to the configured alphabet.
 * The empty word ("") is always valid.
 */
export function validateWord(word: string, alphabet: string[]): WordValidationResult {
  if (word.length === 0) {
    return { valid: true, invalidSymbols: [] };
  }

  const alphabetSet = new Set(alphabet);
  const invalidSymbols: InvalidSymbolOccurrence[] = [];

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (!alphabetSet.has(ch)) {
      invalidSymbols.push({ symbol: ch, position: i + 1 });
    }
  }

  if (invalidSymbols.length === 0) {
    return { valid: true, invalidSymbols: [] };
  }

  const formattedAlphabet = `{${alphabet.join(', ')}}`;
  let errorMessage: string;

  if (invalidSymbols.length === 1) {
    const single = invalidSymbols[0];
    errorMessage = `Símbolo inválido "${single.symbol}" na posição ${single.position}: ele não pertence ao alfabeto cadastrado ${formattedAlphabet}.`;
  } else {
    const details = invalidSymbols
      .map((item) => `"${item.symbol}" (pos. ${item.position})`)
      .join(', ');
    errorMessage = `Foram encontrados símbolos fora do alfabeto cadastrado ${formattedAlphabet}: ${details}.`;
  }

  return {
    valid: false,
    invalidSymbols,
    errorMessage,
  };
}
