import type { Automaton, AutomatonType, NodePosition } from './types.ts';

/**
 * Calcula posições bem distribuídas para o grafo SVG (layout horizontal para até 4 estados,
 * ou circular para quantidades maiores).
 */
export function computeAutoLayout(
  estados: string[],
  width = 640,
  height = 300,
): Record<string, NodePosition> {
  const posicoes: Record<string, NodePosition> = {};
  const count = estados.length;
  if (count === 0) return posicoes;

  if (count <= 4) {
    const marginX = 95;
    const usableW = Math.max(width - marginX * 2, 120);
    const stepX = count === 1 ? 0 : usableW / (count - 1);
    const centerY = Math.round(height / 2);

    estados.forEach((estado, index) => {
      posicoes[estado] = {
        x: Math.round(count === 1 ? width / 2 : marginX + index * stepX),
        y: centerY,
      };
    });
    return posicoes;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.min(width * 0.36, 220);
  const radiusY = Math.min(height * 0.34, 105);

  estados.forEach((estado, index) => {
    const angle = Math.PI + (2 * Math.PI * index) / count;
    posicoes[estado] = {
      x: Math.round(centerX + radiusX * Math.cos(angle)),
      y: Math.round(centerY + radiusY * Math.sin(angle)),
    };
  });

  return posicoes;
}

/**
 * Modelos obrigatórios do experimento descrito no edital:
 * palavras binárias terminadas em "01" (AFD e AFN).
 */
export function getPresetAutomata(): Automaton[] {
  return [
    {
      id: 'preset-afd-01',
      nome: 'AFD — Termina em 01',
      descricao:
        'Autômato Finito Determinístico que reconhece palavras binárias terminadas em 01. Segue sempre um único estado ativo por passo.',
      tipo: 'AFD',
      alfabeto: ['0', '1'],
      estados: ['q0', 'q1', 'q2'],
      estadoInicial: 'q0',
      estadosAceitacao: ['q2'],
      transicoes: {
        q0: { '0': ['q1'], '1': ['q0'] },
        q1: { '0': ['q1'], '1': ['q2'] },
        q2: { '0': ['q1'], '1': ['q0'] },
      },
      posicoes: {
        q0: { x: 115, y: 155 },
        q1: { x: 320, y: 155 },
        q2: { x: 525, y: 155 },
      },
    },
    {
      id: 'preset-afn-01',
      nome: 'AFN — Termina em 01',
      descricao:
        'Autômato Finito Não Determinístico que reconhece palavras binárias terminadas em 01. Ao ler 0 em q0, mantém q0 ativo e também testa q1 como início do sufixo 01.',
      tipo: 'AFN',
      alfabeto: ['0', '1'],
      estados: ['q0', 'q1', 'q2'],
      estadoInicial: 'q0',
      estadosAceitacao: ['q2'],
      transicoes: {
        q0: { '0': ['q0', 'q1'], '1': ['q0'] },
        q1: { '0': [], '1': ['q2'] },
        q2: { '0': [], '1': [] },
      },
      posicoes: {
        q0: { x: 115, y: 155 },
        q1: { x: 320, y: 155 },
        q2: { x: 525, y: 155 },
      },
    },
  ];
}

export function createEmptyAutomaton(tipo: AutomatonType, count: number): Automaton {
  const id = `automato-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const estados = ['q0', 'q1'];
  const alfabeto = ['0', '1'];

  const transicoes: Record<string, Record<string, string[]>> =
    tipo === 'AFD'
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
    nome: `Novo ${tipo} #${count + 1}`,
    descricao: '',
    tipo,
    alfabeto,
    estados,
    estadoInicial: 'q0',
    estadosAceitacao: ['q1'],
    transicoes,
    posicoes: computeAutoLayout(estados),
  };
}
