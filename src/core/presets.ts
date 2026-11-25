import type { Automaton, AutomatonType, NodePosition } from './types.ts';

/**
 * Computes evenly spaced node coordinates for the SVG graph (horizontal layout for up to 4 states,
 * or elliptical layout for larger state sets).
 */
export function computeAutoLayout(
  states: string[],
  width = 640,
  height = 300,
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const count = states.length;
  if (count === 0) return positions;

  if (count <= 4) {
    const marginX = 95;
    const usableW = Math.max(width - marginX * 2, 120);
    const stepX = count === 1 ? 0 : usableW / (count - 1);
    const centerY = Math.round(height / 2);

    states.forEach((state, index) => {
      positions[state] = {
        x: Math.round(count === 1 ? width / 2 : marginX + index * stepX),
        y: centerY,
      };
    });
    return positions;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.min(width * 0.36, 220);
  const radiusY = Math.min(height * 0.34, 105);

  states.forEach((state, index) => {
    const angle = Math.PI + (2 * Math.PI * index) / count;
    positions[state] = {
      x: Math.round(centerX + radiusX * Math.cos(angle)),
      y: Math.round(centerY + radiusY * Math.sin(angle)),
    };
  });

  return positions;
}

/**
 * Required experiment presets described in the assignment:
 * DFA (AFD) and NFA (AFN) recognizing binary words ending in "01".
 */
export function getPresetAutomata(): Automaton[] {
  return [
    {
      id: 'preset-dfa-01',
      name: 'AFD — Termina em 01',
      description:
        'Autômato Finito Determinístico que reconhece palavras binárias terminadas em 01. Segue sempre um único estado ativo por passo.',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: ['q0', 'q1', 'q2'],
      initialState: 'q0',
      acceptingStates: ['q2'],
      transitions: {
        q0: { '0': ['q1'], '1': ['q0'] },
        q1: { '0': ['q1'], '1': ['q2'] },
        q2: { '0': ['q1'], '1': ['q0'] },
      },
      positions: {
        q0: { x: 115, y: 155 },
        q1: { x: 320, y: 155 },
        q2: { x: 525, y: 155 },
      },
    },
    {
      id: 'preset-nfa-01',
      name: 'AFN — Termina em 01',
      description:
        'Autômato Finito Não Determinístico que reconhece palavras binárias terminadas em 01. Ao ler 0 em q0, mantém q0 ativo e também testa q1 como início do sufixo 01.',
      type: 'NFA',
      alphabet: ['0', '1'],
      states: ['q0', 'q1', 'q2'],
      initialState: 'q0',
      acceptingStates: ['q2'],
      transitions: {
        q0: { '0': ['q0', 'q1'], '1': ['q0'] },
        q1: { '0': [], '1': ['q2'] },
        q2: { '0': [], '1': [] },
      },
      positions: {
        q0: { x: 115, y: 155 },
        q1: { x: 320, y: 155 },
        q2: { x: 525, y: 155 },
      },
    },
  ];
}

export function createEmptyAutomaton(type: AutomatonType, count: number): Automaton {
  const id = `automaton-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const states = ['q0', 'q1'];
  const alphabet = ['0', '1'];
  const typeLabel = type === 'DFA' ? 'AFD' : 'AFN';

  const transitions: Record<string, Record<string, string[]>> =
    type === 'DFA'
      ? {
          q0: { '0': ['q0'], '1': ['q1'] },
          q1: { '0': ['q0'], '1': ['q1'] },
        }
      : {
          q0: { '0': ['q0'], '1': ['q1'] },
          q1: { '0': [], '1': [] },
        };

  return {
    id,
    name: `Novo ${typeLabel} #${count + 1}`,
    description: '',
    type,
    alphabet,
    states,
    initialState: 'q0',
    acceptingStates: ['q1'],
    transitions,
    positions: computeAutoLayout(states),
  };
}
