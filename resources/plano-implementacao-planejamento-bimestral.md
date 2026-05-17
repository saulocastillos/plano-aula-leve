# Plano de Implementacao - Planejamento Bimestral (Bertioga)

## Objetivo

Habilitar o app para gerar um novo tipo de documento (`planejamento_bimestral`) com tabela de 5 colunas:

- Aula/Data
- Objetivos de aprendizagem
- Como verificar se o objetivo foi alcancado
- Estrategias didaticas
- Recursos pedagogicos

## Escopo desta entrega

- Manter `plano_aula` funcionando como hoje (limite de 3 arquivos).
- Permitir `planejamento_bimestral` com quantidade livre de arquivos.
- Gerar `.docx` bimestral a partir de template com ancoras e repeticao de linhas.

## Estado atual (ja pronto)

- Tipo de documento na UI.
- Limite por tipo (`plano_aula = 3`, `planejamento_bimestral = livre`).
- Instrucao built-in propria para planejamento bimestral de Bertioga.

## Fases de implementacao

### Fase 1 - Modelo de dados e fluxo de IA

1. Criar schema especifico para `planejamento_bimestral` em `openai-plan.js`.
2. Definir prompt especifico com foco em coerencia entre as 5 colunas.
3. Criar pipeline para muitos arquivos:
   - Sintese por lote.
   - Consolidacao final.
   - Geracao estruturada final.

Entrega esperada:
- JSON de saida com cabecalho + `aulas[]`.

### Fase 2 - Renderizacao DOCX tabular

1. Evoluir `docx-template.js` para suportar repeticao de linha de tabela.
2. Definir placeholders por celula na linha-modelo.
3. Preencher N linhas com base em `aulas[]`.

Entrega esperada:
- Documento com uma linha por aula, sem placeholders sobrando.

### Fase 3 - Integracao no main

1. Em `plans:generate`, rotear por `documentType`.
2. Para `planejamento_bimestral`, usar novo gerador e novo nome de arquivo.
3. Preservar fluxo atual de `plano_aula`.

Entrega esperada:
- Dois fluxos isolados sem regressao.

### Fase 4 - Template e defaults

1. Criar template bimestral em `templates/` com ancoras.
2. Ajustar fallback/default de instrucao e template por tipo (opcional, recomendado).

Entrega esperada:
- Fluxo utilizavel sem configuracao manual repetitiva.

## Especificacao de saida (proposta)

```json
{
  "cabecalho": {
    "bimestre": "1o Bimestre",
    "turma": "9oA, B, C e D",
    "disciplina": "Arte",
    "anoLetivo": "2026",
    "professor": "Nome"
  },
  "aulas": [
    {
      "aulaData": "Acolhimento - 02/02/2026",
      "objetivosAprendizagem": "...",
      "verificacaoObjetivo": "...",
      "estrategiasDidaticas": "...",
      "recursosPedagogicos": "..."
    }
  ]
}
```

## Criterios de aceite

1. `plano_aula` continua com limite 3 e sem mudancas de comportamento.
2. `planejamento_bimestral` aceita mais de 3 arquivos.
3. Geracao bimestral preenche as 5 colunas corretamente.
4. Documento final abre no Word sem corromper layout.
5. Nenhuma ancora `{{...}}` permanece no arquivo final.

## Riscos e mitigacoes

1. Estouro de tokens com muitos arquivos:
- Mitigar com lotes e consolidacao em 2 etapas.

2. Quebra de layout ao clonar linhas:
- Mitigar clonando linha-modelo completa (propriedades de celula e estilo).

3. Inconsistencia entre colunas:
- Mitigar com regras explicitas no prompt e validacao minima de texto vazio.

## Ordem recomendada de execucao

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4

## Fora de escopo agora

- Geracao de planejamento anual completo em um unico arquivo multi-bimestre.
- Edicao visual de tabela no frontend.
- Importacao automatica de calendario escolar externo.
