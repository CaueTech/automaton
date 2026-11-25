import type { Automaton } from '../core/types.ts';
import { computeAutoLayout, getPresetAutomata } from '../core/presets.ts';

const STORAGE_KEY = 'automaton_simulator_models_v2';

function isValidAutomatonShape(raw: unknown): raw is Automaton {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (obj.type === 'DFA' || obj.type === 'NFA') &&
    Array.isArray(obj.alphabet) &&
    Array.isArray(obj.states) &&
    typeof obj.initialState === 'string' &&
    Array.isArray(obj.acceptingStates) &&
    typeof obj.transitions === 'object' &&
    obj.transitions !== null
  );
}

function normalizeAutomaton(automaton: Automaton): Automaton {
  const transitions: Record<string, Record<string, string[]>> = {};
  for (const state of automaton.states) {
    transitions[state] = {};
    for (const symbol of automaton.alphabet) {
      const destinations = automaton.transitions[state]?.[symbol];
      transitions[state][symbol] = Array.isArray(destinations)
        ? destinations.filter((dest) => automaton.states.includes(dest))
        : [];
    }
  }

  return {
    ...automaton,
    transitions,
    positions: automaton.positions ?? computeAutoLayout(automaton.states),
  };
}

export function loadAutomataFromStorage(): Automaton[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const presets = getPresetAutomata();
      saveAutomataToStorage(presets);
      return presets;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getPresetAutomata();
    }

    const valid = parsed.filter(isValidAutomatonShape).map(normalizeAutomaton);
    return valid.length > 0 ? valid : getPresetAutomata();
  } catch {
    return getPresetAutomata();
  }
}

export function saveAutomataToStorage(automata: Automaton[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(automata));
  } catch {
    // Ignore quota or private-mode storage errors without breaking the app
  }
}

export function exportAutomatonToJson(automaton: Automaton): string {
  return JSON.stringify(automaton, null, 2);
}

export function parseAutomatonFromJson(
  jsonText: string,
): { automaton?: Automaton; error?: string } {
  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!isValidAutomatonShape(parsed)) {
      return {
        error:
          'O arquivo JSON não segue o formato esperado de um autômato (type, alphabet, states, initialState, acceptingStates e transitions).',
      };
    }

    const normalized = normalizeAutomaton({
      ...parsed,
      id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });

    return { automaton: normalized };
  } catch {
    return { error: 'Não foi possível ler o arquivo JSON. Verifique se a sintaxe é válida.' };
  }
}
