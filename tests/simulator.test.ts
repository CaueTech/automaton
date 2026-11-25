import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPresetAutomata } from '../src/core/presets.ts';
import { validateAutomaton, validateWord } from '../src/core/validator.ts';
import { simulateAutomaton } from '../src/core/simulator.ts';

describe('Simulador de Autômatos Finitos (AFD e AFN)', () => {
  const [afdPreset, afnPreset] = getPresetAutomata();

  it('valida corretamente os presets AFD e AFN do experimento', () => {
    assert.equal(validateAutomaton(afdPreset).valido, true);
    assert.equal(validateAutomaton(afnPreset).valido, true);
  });

  it('AFD e AFN aceitam "101" e mostram a diferença de estados ativos no 2º passo', () => {
    const resAfd = simulateAutomaton(afdPreset, '101');
    const resAfn = simulateAutomaton(afnPreset, '101');

    assert.equal(resAfd.aceita, true);
    assert.equal(resAfn.aceita, true);

    // Após ler o 2º símbolo ('0' de "101"):
    assert.deepEqual(resAfd.passos[1].estadosDepois, ['q1']);
    assert.deepEqual(resAfn.passos[1].estadosDepois, ['q0', 'q1']);

    // Ao final de "101":
    assert.deepEqual(resAfd.estadosFinaisAtivos, ['q2']);
    assert.deepEqual(resAfn.estadosFinaisAtivos, ['q0', 'q2']);
    assert.deepEqual(resAfn.estadosAceitacaoAlcancados, ['q2']);
  });

  it('AFD e AFN rejeitam "010"', () => {
    const resAfd = simulateAutomaton(afdPreset, '010');
    const resAfn = simulateAutomaton(afnPreset, '010');

    assert.equal(resAfd.aceita, false);
    assert.equal(resAfn.aceita, false);
  });

  it('trata corretamente a palavra vazia (ε)', () => {
    const resRejeita = simulateAutomaton(afnPreset, '');
    assert.equal(resRejeita.palavraVazia, true);
    assert.equal(resRejeita.aceita, false);
    assert.equal(resRejeita.passos.length, 0);

    const afnComInicialAceitacao = {
      ...afnPreset,
      estadosAceitacao: ['q0', 'q2'],
    };
    const resAceita = simulateAutomaton(afnComInicialAceitacao, '');
    assert.equal(resAceita.aceita, true);
  });

  it('identifica símbolos fora do alfabeto com posição e explicação', () => {
    const check = validateWord('102', ['0', '1']);
    assert.equal(check.valida, false);
    assert.equal(check.simbolosInvalidos.length, 1);
    assert.deepEqual(check.simbolosInvalidos[0], { simbolo: '2', posicao: 3 });
    assert.match(check.mensagemErro ?? '', /"2"/);
    assert.match(check.mensagemErro ?? '', /posição 3/);
  });

  it('bloqueia AFD incompleto ou não determinístico na validação', () => {
    const afdIncompleto = {
      ...afdPreset,
      transicoes: {
        ...afdPreset.transicoes,
        q1: { '0': [], '1': ['q2'] },
      },
    };
    const v1 = validateAutomaton(afdIncompleto);
    assert.equal(v1.valido, false);
    assert.equal(v1.erros[0].codigo, 'AFD_TRANSICAO_INCOMPLETA');

    const afdMulti = {
      ...afdPreset,
      transicoes: {
        ...afdPreset.transicoes,
        q0: { '0': ['q0', 'q1'], '1': ['q0'] },
      },
    };
    const v2 = validateAutomaton(afdMulti);
    assert.equal(v2.valido, false);
    assert.equal(v2.erros[0].codigo, 'AFD_TRANSICAO_NAO_DETERMINISTICA');
  });
});
