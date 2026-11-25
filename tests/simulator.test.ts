import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPresetAutomata } from '../src/core/presets.ts';
import { validateAutomaton, validateWord } from '../src/core/validator.ts';
import { simulateAutomaton } from '../src/core/simulator.ts';

describe('Finite Automaton Simulator (DFA & NFA)', () => {
  const [afdPreset, afnPreset] = getPresetAutomata();

  it('validates the built-in DFA and NFA experiment presets', () => {
    assert.equal(validateAutomaton(afdPreset).valido, true);
    assert.equal(validateAutomaton(afnPreset).valido, true);
  });

  it('accepts "101" in both DFA and NFA and tracks the 2nd-step active-state divergence', () => {
    const resAfd = simulateAutomaton(afdPreset, '101');
    const resAfn = simulateAutomaton(afnPreset, '101');

    assert.equal(resAfd.aceita, true);
    assert.equal(resAfn.aceita, true);

    // After reading the 2nd symbol ('0' of "101"):
    assert.deepEqual(resAfd.passos[1].estadosDepois, ['q1']);
    assert.deepEqual(resAfn.passos[1].estadosDepois, ['q0', 'q1']);

    // At the end of "101":
    assert.deepEqual(resAfd.estadosFinaisAtivos, ['q2']);
    assert.deepEqual(resAfn.estadosFinaisAtivos, ['q0', 'q2']);
    assert.deepEqual(resAfn.estadosAceitacaoAlcancados, ['q2']);
  });

  it('rejects "010" in both DFA and NFA', () => {
    const resAfd = simulateAutomaton(afdPreset, '010');
    const resAfn = simulateAutomaton(afnPreset, '010');

    assert.equal(resAfd.aceita, false);
    assert.equal(resAfn.aceita, false);
  });

  it('handles the empty word (ε) based on whether the initial state is accepting', () => {
    const resRejeita = simulateAutomaton(afnPreset, '');
    assert.equal(resRejeita.palavraVazia, true);
    assert.equal(resRejeita.aceita, false);
    assert.equal(resRejeita.passos.length, 0);

    const afnWithAcceptingInitial = {
      ...afnPreset,
      estadosAceitacao: ['q0', 'q2'],
    };
    const resAceita = simulateAutomaton(afnWithAcceptingInitial, '');
    assert.equal(resAceita.aceita, true);
  });

  it('detects out-of-alphabet symbols with position and explanation', () => {
    const check = validateWord('102', ['0', '1']);
    assert.equal(check.valida, false);
    assert.equal(check.simbolosInvalidos.length, 1);
    assert.deepEqual(check.simbolosInvalidos[0], { simbolo: '2', posicao: 3 });
    assert.match(check.mensagemErro ?? '', /"2"/);
    assert.match(check.mensagemErro ?? '', /posição 3/);
  });

  it('blocks incomplete or non-deterministic DFAs during validation', () => {
    const incompleteDfa = {
      ...afdPreset,
      transicoes: {
        ...afdPreset.transicoes,
        q1: { '0': [], '1': ['q2'] },
      },
    };
    const v1 = validateAutomaton(incompleteDfa);
    assert.equal(v1.valido, false);
    assert.equal(v1.erros[0].codigo, 'AFD_TRANSICAO_INCOMPLETA');

    const nonDetDfa = {
      ...afdPreset,
      transicoes: {
        ...afdPreset.transicoes,
        q0: { '0': ['q0', 'q1'], '1': ['q0'] },
      },
    };
    const v2 = validateAutomaton(nonDetDfa);
    assert.equal(v2.valido, false);
    assert.equal(v2.erros[0].codigo, 'AFD_TRANSICAO_NAO_DETERMINISTICA');
  });
});
