import type {
  Automaton,
  AutomatonValidationResult,
  InvalidSymbolOccurrence,
  ValidationIssue,
  WordValidationResult,
} from './types.ts';

/**
 * Valida a consistência estrutural de um AFD ou AFN.
 */
export function validateAutomaton(automaton: Automaton): AutomatonValidationResult {
  const erros: ValidationIssue[] = [];
  const stateSet = new Set(automaton.estados);

  if (automaton.estados.length === 0) {
    erros.push({
      codigo: 'SEM_ESTADOS',
      mensagem: 'Cadastre pelo menos um estado antes de simular.',
    });
  }

  if (automaton.alfabeto.length === 0) {
    erros.push({
      codigo: 'SEM_ALFABETO',
      mensagem: 'Cadastre pelo menos um símbolo no alfabeto.',
    });
  }

  if (!automaton.estadoInicial || !stateSet.has(automaton.estadoInicial)) {
    erros.push({
      codigo: 'INICIAL_INVALIDO',
      mensagem: 'Selecione um estado inicial válido.',
    });
  }

  for (const aceitacao of automaton.estadosAceitacao) {
    if (!stateSet.has(aceitacao)) {
      erros.push({
        codigo: 'ACEITACAO_INVALIDA',
        mensagem: `O estado de aceitação "${aceitacao}" não existe na lista de estados.`,
        estado: aceitacao,
      });
    }
  }

  for (const estado of automaton.estados) {
    for (const simbolo of automaton.alfabeto) {
      const destinos = automaton.transicoes[estado]?.[simbolo] ?? [];

      for (const destino of destinos) {
        if (!stateSet.has(destino)) {
          erros.push({
            codigo: 'DESTINO_INEXISTENTE',
            mensagem: `A transição δ(${estado}, ${simbolo}) aponta para o estado inexistente "${destino}".`,
            estado,
            simbolo,
          });
        }
      }

      if (automaton.tipo === 'AFD') {
        if (destinos.length === 0) {
          erros.push({
            codigo: 'AFD_TRANSICAO_INCOMPLETA',
            mensagem: `No modo AFD, δ(${estado}, ${simbolo}) precisa ter exatamente 1 destino definido.`,
            estado,
            simbolo,
          });
        } else if (destinos.length > 1) {
          erros.push({
            codigo: 'AFD_TRANSICAO_NAO_DETERMINISTICA',
            mensagem: `No modo AFD, δ(${estado}, ${simbolo}) possui ${destinos.length} destinos (${destinos.join(', ')}), mas deve ter apenas 1.`,
            estado,
            simbolo,
          });
        }
      }
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Valida se todos os símbolos da palavra pertencem ao alfabeto cadastrado.
 * A palavra vazia ("") é sempre válida.
 */
export function validateWord(palavra: string, alfabeto: string[]): WordValidationResult {
  if (palavra.length === 0) {
    return { valida: true, simbolosInvalidos: [] };
  }

  const alphabetSet = new Set(alfabeto);
  const simbolosInvalidos: InvalidSymbolOccurrence[] = [];

  for (let i = 0; i < palavra.length; i++) {
    const ch = palavra[i];
    if (!alphabetSet.has(ch)) {
      simbolosInvalidos.push({ simbolo: ch, posicao: i + 1 });
    }
  }

  if (simbolosInvalidos.length === 0) {
    return { valida: true, simbolosInvalidos: [] };
  }

  const alfabetoFmt = `{${alfabeto.join(', ')}}`;
  let mensagemErro: string;

  if (simbolosInvalidos.length === 1) {
    const unico = simbolosInvalidos[0];
    mensagemErro = `Símbolo inválido "${unico.simbolo}" na posição ${unico.posicao}: ele não pertence ao alfabeto cadastrado ${alfabetoFmt}.`;
  } else {
    const detalhes = simbolosInvalidos
      .map((item) => `"${item.simbolo}" (pos. ${item.posicao})`)
      .join(', ');
    mensagemErro = `Foram encontrados símbolos fora do alfabeto cadastrado ${alfabetoFmt}: ${detalhes}.`;
  }

  return {
    valida: false,
    simbolosInvalidos,
    mensagemErro,
  };
}
