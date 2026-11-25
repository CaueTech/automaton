export type AutomatonType = 'DFA' | 'NFA';

export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Unified representation for both DFA (AFD) and NFA (AFN).
 * In both modes, transitions[state][symbol] is a list of destination states:
 * - In DFA mode, it must contain exactly 1 state.
 * - In NFA mode, it may contain 0, 1, or multiple states.
 */
export interface Automaton {
  id: string;
  name: string;
  description?: string;
  type: AutomatonType;
  alphabet: string[];
  states: string[];
  initialState: string;
  acceptingStates: string[];
  transitions: Record<string, Record<string, string[]>>;
  positions?: Record<string, NodePosition>;
}

export interface ValidationIssue {
  code:
    | 'NO_STATES'
    | 'NO_ALPHABET'
    | 'INVALID_INITIAL_STATE'
    | 'INVALID_ACCEPTING_STATE'
    | 'DFA_INCOMPLETE_TRANSITION'
    | 'DFA_NONDETERMINISTIC_TRANSITION'
    | 'UNKNOWN_DESTINATION';
  message: string;
  state?: string;
  symbol?: string;
}

export interface AutomatonValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

export interface InvalidSymbolOccurrence {
  symbol: string;
  position: number; // 1-indexed for user-facing display
}

export interface WordValidationResult {
  valid: boolean;
  invalidSymbols: InvalidSymbolOccurrence[];
  errorMessage?: string;
}

export interface FiredTransition {
  from: string;
  symbol: string;
  to: string[];
}

export interface SimulationStep {
  index: number; // 1-indexed (step 1 = 1st symbol read)
  symbol: string;
  statesBefore: string[];
  statesAfter: string[];
  firedTransitions: FiredTransition[];
}

export interface SimulationResult {
  word: string;
  isEmptyWord: boolean;
  steps: SimulationStep[];
  finalActiveStates: string[];
  reachedAcceptingStates: string[];
  accepted: boolean;
  justification: string;
}
