import type { Automaton } from '../core/types.ts';
import { computeAutoLayout, getPresetAutomata } from '../core/presets.ts';

const STORAGE_KEY = 'automaton_simulator_models_v1';

function isValidAutomatonShape(raw: unknown): raw is Automaton {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.nome === 'string' &&
    (obj.tipo === 'AFD' || obj.tipo === 'AFN') &&
    Array.isArray(obj.alfabeto) &&
    Array.isArray(obj.estados) &&
    typeof obj.estadoInicial === 'string' &&
    Array.isArray(obj.estadosAceitacao) &&
    typeof obj.transicoes === 'object' &&
    obj.transicoes !== null
  );
}

function normalizeAutomaton(a: Automaton): Automaton {
  const transicoes: Record<string, Record<string, string[]>> = {};
  for (const estado of a.estados) {
    transicoes[estado] = {};
    for (const simbolo of a.alfabeto) {
      const destinos = a.transicoes[estado]?.[simbolo];
      transicoes[estado][simbolo] = Array.isArray(destinos)
        ? destinos.filter((d) => a.estados.includes(d))
        : [];
    }
  }

  return {
    ...a,
    transicoes,
    posicoes: a.posicoes ?? computeAutoLayout(a.estados),
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
    // Ignora erros de quota ou modo privado sem quebrar a aplicação
  }
}

export function exportAutomatonToJson(automaton: Automaton): string {
  return JSON.stringify(automaton, null, 2);
}

export function parseAutomatonFromJson(jsonText: string): { automaton?: Automaton; erro?: string } {
  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!isValidAutomatonShape(parsed)) {
      return {
        erro: 'O arquivo JSON não segue o formato esperado de um autômato (tipo, alfabeto, estados, estadoInicial, estadosAceitacao e transicoes).',
      };
    }

    const normalized = normalizeAutomaton({
      ...parsed,
      id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });

    return { automaton: normalized };
  } catch {
    return { erro: 'Não foi possível ler o arquivo JSON. Verifique se a sintaxe é válida.' };
  }
}
