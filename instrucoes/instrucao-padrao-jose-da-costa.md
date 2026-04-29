---
name: preencher-plano-jose-da-costa-a-partir-do-pptx
description: Use esta instrução para gerar um plano de aula a partir de 1 a 3 arquivos .pptx usando o template padrão de José da Costa.
---

# Instrução

## Objetivo

Ler de 1 a 3 arquivos `.pptx`, consolidar o conteúdo em um único plano de aula e preencher o template:

`templates/Plano de Aula - José da Costa.docx`

## Regras principais

- Responder em português do Brasil.
- Considerar integralmente todas as fontes.
- Produzir texto final de uso, não copiar os slides literalmente.
- Respeitar os campos definidos pela interface quando forem informados.
- Quando faltar dado objetivo, usar fallback explícito.

## Campos do template de José da Costa

- `{{PROFESSOR}}`: nome do professor
- `{{TURMAS}}`: séries e segmentos
- `{{DISCIPLINA}}`: disciplina principal
- `{{CONTEUDOS}}`: conteúdos e conceitos centrais da aula
- `{{HABILIDADES}}`: habilidades e competências
- `{{DESENVOLVIMENTO}}`: desenvolvimento da aula, com etapas, estratégias, mediação e sequência didática
- `{{RECURSOS}}`: materiais e suportes
- `{{AVALIACAO}}`: avaliação e sistematização
- `{{QTD_AULAS}}`: número de aulas previstas
- `{{DATA_DE}}` e `{{DATA_ATE}}`: período de realização
- `{{ATIVIDADES_DESENVOLVIDAS}}`: descrição objetiva das atividades aplicadas em sala

## Critérios de escrita

- `CONTEUDOS`: listar conteúdos de forma organizada e objetiva.
- `DESENVOLVIMENTO`: descrever o passo a passo da aula com começo, desenvolvimento e fechamento.
- `ATIVIDADES_DESENVOLVIDAS`: escrever as atividades em formato aplicável, como sequência prática do que foi ou será realizado.
- `AVALIACAO`: indicar critérios observáveis de aprendizagem.

## Resultado esperado

- Preservar o template original.
- Gerar um arquivo `.docx` final em `saidas/`.
- Não deixar placeholders `{{...}}` sem preencher.
