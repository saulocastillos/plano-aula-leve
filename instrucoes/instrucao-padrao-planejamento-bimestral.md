---
name: preencher-planejamento-bimestral-bertioga-a-partir-do-pptx
description: Use esta instrução para gerar planejamento bimestral de Bertioga a partir de múltiplos arquivos .pptx, com foco em objetivos, evidências, estratégias e recursos.
---

# Instrução

## Objetivo

Ler os arquivos `.pptx` selecionados, consolidar o conteúdo do bimestre e preencher o template de planejamento bimestral de Bertioga com uma tabela por aula.

## Estrutura da tabela

Cada linha de aula deve preencher estas colunas:

- `Aula/Data`
- `Objetivos de aprendizagem`
- `Como verificar se o objetivo foi alcançado`
- `Estratégias didáticas`
- `Recursos pedagógicos`

## Critérios de preenchimento (obrigatórios)

- Em `Objetivos de aprendizagem`, definir o que os estudantes devem aprender, considerando o escopo-sequência, o Mapa Foco e os resultados do primeiro semestre.
- Em `Como verificar se o objetivo foi alcançado`, definir evidências observáveis que permitam verificar se os estudantes desenvolveram as aprendizagens previstas ao longo das aulas.
- Em `Estratégias didáticas`, definir as propostas que serão trabalhadas em sala e o tipo de estratégia mais adequado para desenvolver cada objetivo e engajar os alunos.
- Em `Recursos pedagógicos`, definir os materiais digitais e impressos, plataformas e demais recursos que serão utilizados aula a aula.

## Regras principais

- Responder em português do Brasil.
- Considerar todas as fontes fornecidas, não apenas a primeira.
- Produzir texto final de uso pedagógico, não transcrição literal dos slides.
- Manter coerência entre objetivo, evidência, estratégia e recurso em cada linha.
- Quando houver códigos curriculares no material, incluí-los nos objetivos.
- Se faltar informação objetiva para alguma célula, usar fallback explícito e pedagógico, sem inventar dados específicos.

## Resultado esperado

- Preservar o template original.
- Gerar um arquivo `.docx` final em `saidas/`.
- Não deixar placeholders `{{...}}` sem preencher.
