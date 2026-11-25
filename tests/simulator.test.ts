import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPresetAutomata } from '../src/core/presets.ts';
import { validateAutomaton, validateWord } from '../src/core/validator.ts';
import { simulateAutomaton } from '../src/core/simulator.ts';

describe('Finite Automaton Simulator (DFA & NFA)', () => {
  const [dfaPreset, nfaPreset] = getPresetAutomata();

  it('validates the built-in DFA and NFA experiment presets', () => {
    assert.equal(validateAutomaton(dfaPreset).valid, true);
    assert.equal(validateAutomaton(nfaPreset).valid, true);
  });

  it('accepts "101" in both DFA and NFA and tracks the 2nd-step active-state divergence', () => {
    const dfaResult = simulateAutomaton(dfaPreset, '101');
    const nfaResult = simulateAutomaton(nfaPreset, '101');

    assert.equal(dfaResult.accepted, true);
    assert.equal(nfaResult.accepted, true);

    // After reading the 2nd symbol ('0' of "101"):
    assert.deepEqual(dfaResult.steps[1].statesAfter, ['q1']);
    assert.deepEqual(nfaResult.steps[1].statesAfter, ['q0', 'q1']);

    // At the end of "101":
    assert.deepEqual(dfaResult.finalActiveStates, ['q2']);
    assert.deepEqual(nfaResult.finalActiveStates, ['q0', 'q2']);
    assert.deepEqual(nfaResult.reachedAcceptingStates, ['q2']);
  });

  it('rejects "010" in both DFA and NFA', () => {
    const dfaResult = simulateAutomaton(dfaPreset, '010');
    const nfaResult = simulateAutomaton(nfaPreset, '010');

    assert.equal(dfaResult.accepted, false);
    assert.equal(nfaResult.accepted, false);
  });

  it('handles the empty word (ε) based on whether the initial state is accepting', () => {
    const rejectedResult = simulateAutomaton(nfaPreset, '');
    assert.equal(rejectedResult.isEmptyWord, true);
    assert.equal(rejectedResult.accepted, false);
    assert.equal(rejectedResult.steps.length, 0);

    const nfaWithAcceptingInitial = {
      ...nfaPreset,
      acceptingStates: ['q0', 'q2'],
    };
    const acceptedResult = simulateAutomaton(nfaWithAcceptingInitial, '');
    assert.equal(acceptedResult.accepted, true);
  });

  it('detects out-of-alphabet symbols with position and explanation', () => {
    const check = validateWord('102', ['0', '1']);
    assert.equal(check.valid, false);
    assert.equal(check.invalidSymbols.length, 1);
    assert.deepEqual(check.invalidSymbols[0], { symbol: '2', position: 3 });
    assert.match(check.errorMessage ?? '', /"2"/);
    assert.match(check.errorMessage ?? '', /posição 3/);
  });

  it('blocks incomplete or non-deterministic DFAs during validation', () => {
    const incompleteDfa = {
      ...dfaPreset,
      transitions: {
        ...dfaPreset.transitions,
        q1: { '0': [], '1': ['q2'] },
      },
    };
    const v1 = validateAutomaton(incompleteDfa);
    assert.equal(v1.valid, false);
    assert.equal(v1.errors[0].code, 'DFA_INCOMPLETE_TRANSITION');

    const nonDetDfa = {
      ...dfaPreset,
      transitions: {
        ...dfaPreset.transitions,
        q0: { '0': ['q0', 'q1'], '1': ['q0'] },
      },
    };
    const v2 = validateAutomaton(nonDetDfa);
    assert.equal(v2.valid, false);
    assert.equal(v2.errors[0].code, 'DFA_NONDETERMINISTIC_TRANSITION');
  });
});
