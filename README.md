# Automaton — Simulador de Autômatos Finitos (AFD / AFN)

Aplicação web em **React + TypeScript + Vite** inspirada no [JFLAP](https://www.jflap.org/), desenvolvida para a disciplina de **Teoria da Computação** (Universidade Senai Cimatec).

## Funcionalidades

- **Construção de AFDs e AFNs sem alterar o código-fonte:** escolha do modelo, cadastro do alfabeto ($\Sigma$), estados ($Q$), estado inicial ($q_0$), estados de aceitação ($F$) e tabela de transições ($\delta$) editável.
- **Validação automática:**
  - No modo **AFD**, garante exatamente 1 destino por par `(estado, símbolo)`.
  - No modo **AFN**, permite 0, 1 ou múltiplos destinos por par `(estado, símbolo)`.
  - Na entrada da palavra, identifica símbolos fora do alfabeto cadastrado e explica o erro.
- **Visualização sincronizada:** tabela de transições editável lado a lado com o **grafo visual interativo em SVG** (com suporte a arrastar estados e botão de auto-organizar).
- **Simulação completa e passo a passo:** exibe fita de leitura, símbolo atual, estados ativos antes e depois da leitura, transições disparadas e veredito final justificado (incluindo suporte à palavra vazia $\varepsilon$).
- **Persistência e modelos do experimento:** salvamento automático no `localStorage`, importação/exportação em JSON e presets prontos para **AFD** e **AFN** de palavras binárias terminadas em `01`.

## Como executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18+ (recomendado 22+)

### Instalação e execução local

```bash
npm install
npm run dev
```

Acesse o endereço exibido no terminal (por padrão `http://localhost:5173`).

### Testes do motor de simulação

```bash
npm test
```

## Estrutura do projeto

```text
src/
├── core/
│   ├── types.ts              # Tipos de Autômato, Passo e Resultado
│   ├── validator.ts          # Validações de AFD/AFN e alfabeto
│   ├── simulator.ts          # Motor de simulação completa e passo a passo
│   └── presets.ts            # Presets do experimento (AFD e AFN - termina em 01)
├── storage/
│   └── automataStorage.ts    # Persistência em localStorage e import/export JSON
├── components/
│   ├── AutomatonSidebar.tsx  # Gerenciamento de autômatos salvos
│   ├── AutomatonEditor.tsx   # Configuração de modelo, alfabeto e estados
│   ├── TransitionTable.tsx   # Tabela de transições editável
│   ├── AutomatonGraph.tsx    # Grafo visual SVG interativo
│   └── SimulationPanel.tsx   # Simulação, controles passo a passo e justificativa
├── App.tsx                   # Orquestração da aplicação
├── main.tsx                  # Ponto de entrada React
└── index.css                 # Estilos (Vanilla CSS)
tests/
└── simulator.test.ts         # Testes unitários do motor e validações
```
