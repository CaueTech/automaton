export type AutomatonType = 'AFD' | 'AFN';

export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Representação unificada para AFD e AFN.
 * Em ambos os modos, transicoes[estado][simbolo] é uma lista de estados destino:
 * - No AFD, deve conter exatamente 1 estado.
 * - No AFN, pode conter 0, 1 ou vários estados.
 */
export interface Automaton {
  id: string;
  nome: string;
  descricao?: string;
  tipo: AutomatonType;
  alfabeto: string[];
  estados: string[];
  estadoInicial: string;
  estadosAceitacao: string[];
  transicoes: Record<string, Record<string, string[]>>;
  posicoes?: Record<string, NodePosition>;
}

export interface ValidationIssue {
  codigo:
    | 'SEM_ESTADOS'
    | 'SEM_ALFABETO'
    | 'INICIAL_INVALIDO'
    | 'ACEITACAO_INVALIDA'
    | 'AFD_TRANSICAO_INCOMPLETA'
    | 'AFD_TRANSICAO_NAO_DETERMINISTICA'
    | 'DESTINO_INEXISTENTE';
  mensagem: string;
  estado?: string;
  simbolo?: string;
}

export interface AutomatonValidationResult {
  valido: boolean;
  erros: ValidationIssue[];
}

export interface InvalidSymbolOccurrence {
  simbolo: string;
  posicao: number; // 1-indexed para exibição didática
}

export interface WordValidationResult {
  valida: boolean;
  simbolosInvalidos: InvalidSymbolOccurrence[];
  mensagemErro?: string;
}

export interface FiredTransition {
  origem: string;
  simbolo: string;
  destinos: string[];
}

export interface SimulationStep {
  indice: number; // 1-indexed (passo 1 = 1º símbolo lido)
  simbolo: string;
  estadosAntes: string[];
  estadosDepois: string[];
  transicoesDisparadas: FiredTransition[];
}

export interface SimulationResult {
  palavra: string;
  palavraVazia: boolean;
  passos: SimulationStep[];
  estadosFinaisAtivos: string[];
  estadosAceitacaoAlcancados: string[];
  aceita: boolean;
  justificativa: string;
}
