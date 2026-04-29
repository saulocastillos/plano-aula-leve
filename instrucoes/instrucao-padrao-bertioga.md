---
name: preencher-plano-bertioga-a-partir-do-pptx
description: Use esta instrução para gerar um plano de aula a partir de 1 a 3 arquivos .pptx usando o template padrão de Bertioga.
---

# Instrução

## Objetivo

Ler de 1 a 3 arquivos `.pptx`, consolidar o conteúdo em um único plano de aula e preencher o template:

`templates/Plano de Aula - Bertioga.docx`

## Regras principais

- Responder em português do Brasil.
- Considerar todas as fontes fornecidas, nunca apenas a primeira.
- Produzir texto final de uso pedagógico, não transcrição de slide.
- Se a interface informar professor, turmas, quantidade de aulas ou período, esses valores têm prioridade.
- Quando faltar dado objetivo, usar fallback explícito em vez de inventar.

## Campos do template de Bertioga

- `{{DISCIPLINA-TITULO}}`: cabeçalho curto, como `Arte - 8o ano`
- `{{PROFESSOR}}`: nome do professor
- `{{TURMAS}}`: ano/série e segmento
- `{{DISCIPLINA}}`: disciplina principal
- `{{TEMA_DA_AULA}}`: tema central da aula
- `{{CONTEÚDO}}`: tópicos e conceitos efetivamente trabalhados
- `{{HABILIDADES}}`: habilidades e competências, com códigos curriculares quando existirem
- `{{METODOLOGIA}}`: condução da aula, etapas, dinâmica, mediação e estratégias
- `{{OBJETIVOS}}`: objetivos de aprendizagem claros
- `{{RECURSOS}}`: materiais e suportes necessários
- `{{AVALIACAO}}`: avaliação e sistematização
- `{{QTD_AULAS}}`: número de aulas
- `{{DATA_DE}}` e `{{DATA-ATÉ}}`: período de realização

## Critérios de escrita

- `CONTEÚDO`: listar conceitos, tópicos e recortes do que será estudado.
- `METODOLOGIA`: explicar como a aula acontece de fato, com começo, desenvolvimento e fechamento.
- `AVALIACAO`: indicar como a aprendizagem será observada, registrada ou verificada.
- `OBJETIVOS`: usar verbos no infinitivo e foco no que o estudante desenvolverá.

## Observação estrutural

No template de Bertioga, o campo `Quantidade de Aulas` pode reaproveitar a âncora `{{AVALIACAO}}`. Corrigir isso apenas no arquivo final gerado.

## Resultado esperado

- Preservar o template original.
- Gerar um arquivo `.docx` final em `saidas/`.
- Não deixar placeholders `{{...}}` sem preencher.
