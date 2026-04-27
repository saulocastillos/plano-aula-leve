---
name: preencher-plano-de-aula-a-partir-do-pptx
description: Use esta instrução quando eu pedir para preencher um template de plano de aula com âncoras `.docx` a partir de 1 a 3 arquivos `.pptx`, consolidando os conteúdos em um único plano e respeitando as configurações de saída definidas na interface.
---

# Instrução

Quando eu mencionar `preencher-plano-de-aula-a-partir-do-pptx`, execute este fluxo.

## Objetivo

Ler de 1 a 3 arquivos `.pptx` de aula, consolidar esses materiais em um único plano de aula, preencher o template `.docx` com âncoras `{{...}}` e gerar um novo documento final. Usar os critérios pedagógicos e editoriais descritos nesta instrução para melhorar a qualidade do preenchimento de cada campo.

## Entradas esperadas

- De 1 a 3 arquivos `.pptx` com o conteúdo de uma aula ou sequência de aulas relacionadas.
- Um arquivo `.docx` com âncoras `{{...}}` como template. O usuário deve indicar qual template usar; se não indicar, perguntar antes de prosseguir.
- A interface pode fornecer explicitamente estes campos de saída, que têm prioridade sobre qualquer inferência do material:
  - nome do professor
  - turmas
  - quantidade de aulas
  - período de realização (início e fim)
- Quando possível, a interface pode pré-preencher `turmas` a partir da leitura dos `.pptx`, mas o valor final continua editável pelo usuário e deve ser respeitado se ele fizer ajustes.

Convenção de caminhos do projeto:

- arquivos-fonte da aula em `entradas/`
- templates em `templates/`
- instruções em `instrucoes/`
- arquivos gerados em `saidas/`

## Resultado esperado

- Gerar uma cópia preenchida do `.docx`.
- Preservar o template original.
- Validar que não restaram placeholders `{{...}}` no arquivo final.
- Garantir que o texto preenchido não seja apenas copiado dos `.pptx`, mas organizado conforme os critérios pedagógicos desta instrução.
- Ser idempotente: repetir a execução com os mesmos arquivos de entrada deve produzir o mesmo arquivo de saída, sem criar variantes desnecessárias nem acumular duplicatas.

## Procedimento

1. Confirmar que todos os arquivos-fonte existem e são legíveis.
2. Confirmar qual template `.docx` será usado. Se o usuário não indicar, perguntar antes de prosseguir.
3. Extrair o texto de todos os `.pptx`, incluindo conteúdo dos slides e, se necessário, slides de orientação para professores.
4. Abrir o template e identificar todas as âncoras `{{...}}`, inclusive quando estiverem quebradas em múltiplos trechos internos do Word. Para cada âncora encontrada, inferir seu significado pelo label ou texto ao redor no template (ex.: `{{RECURSOS}}` aparece logo abaixo de "7. RECURSOS:" — o significado é autoexplicativo).
5. Montar um único plano a partir do conjunto dos materiais, tratando os `.pptx` como partes de uma mesma proposta de aula ou sequência curta de aulas.
6. Analisar cada `.pptx` individualmente antes da síntese final, garantindo que todos contribuam para o plano e que nenhuma fonte seja ignorada.
7. Montar o mapeamento entre as âncoras descobertas e o conteúdo consolidado dos `.pptx`, refinando a redação com base nos critérios descritos nesta instrução.
8. Se a interface tiver fornecido professor, turmas, quantidade de aulas ou período de realização, usar esses valores explicitamente no resultado final.
9. Preencher o `.docx` em uma cópia nova, nunca sobrescrevendo o template original sem pedido explícito.
10. Validar o arquivo final:
    - conferir se o conteúdo principal foi inserido;
    - verificar se não sobrou nenhum `{{...}}`;
    - corrigir placeholders quebrados em múltiplos trechos do XML, se houver;
    - corrigir problemas estruturais do template apenas no arquivo gerado, se necessário.

## Idempotência

Esta instrução deve ser executada de forma idempotente.

- Com os mesmos arquivos de entrada, usar sempre o mesmo caminho de saída derivado do conteúdo.
- Se o arquivo de saída já existir e já estiver consistente com a entrada atual, reutilizá-lo em vez de criar outro.
- Se o arquivo de saída já existir mas estiver desatualizado em relação à entrada atual, atualizá-lo no mesmo caminho.
- Nunca criar nomes incrementais como `copia`, `final`, `novo`, `v2` ou semelhantes, exceto se o usuário pedir explicitamente.
- Nunca duplicar ou renomear template, instrução ou arquivo-fonte apenas por executar o fluxo novamente.
- Se houver necessidade de corrigir um problema estrutural do template, aplicar a correção apenas no arquivo gerado final, de forma determinística.

## Regras de preenchimento

- Priorizar conteúdo explícito dos `.pptx`.
- Inferir o significado de cada âncora pelo contexto do template; não depender de mapeamento fixo.
- Se o template tiver placeholders quebrados em vários trechos internos do Word, tratá-los como um único placeholder lógico.
- Se os `.pptx` não trouxerem um dado objetivo para um campo, preencher com uma marcação pragmática e explícita em vez de inventar informação.
- Quando houver mais de um `.pptx`, consolidar os materiais em um único plano coerente, sem tratar cada apresentação como um plano separado.
- Quando houver 2 ou 3 `.pptx`, é obrigatório considerar o conjunto inteiro; ignorar a segunda ou terceira fonte é erro de execução.
- O plano final deve refletir progressão, complementaridade ou distribuição de atividades entre as fontes sempre que isso estiver presente no material.
- Se a interface informar professor, turmas, quantidade de aulas ou período, esses valores devem prevalecer sobre qualquer inferência do material.
- Manter consistência com o nível de ensino, disciplina, tema, objetivos, metodologia, recursos e avaliação encontrados no material.
- Se o template tiver erro estrutural, como um campo apontando para a âncora errada, corrigir isso apenas no arquivo gerado.
- Não transformar a resposta em transcrição dos slides; consolidar e escrever o plano de aula em formato final de uso.
- Manter o processo determinístico sempre que possível: mesmos insumos devem levar ao mesmo mapeamento, mesmo nome de arquivo e mesma estrutura de saída.
- A quantidade de aulas informada na interface NÃO deve ser usada para gerar, expandir ou reduzir o conteúdo das aulas.

## Regra crítica — quantidade de aulas vs conteúdo

- O número de blocos de aula (Aula 1, Aula 2, etc.) deve ser exatamente igual ao número de arquivos `.pptx`.
- O campo “quantidade de aulas” é apenas informativo no template.
- Nunca criar aulas adicionais com base nesse campo.

## Regra crítica — título das aulas

- O título de cada aula deve ser derivado do nome do arquivo `.pptx`.
- Remover apenas a extensão `.pptx`.
- Aplicar normalização leve obrigatória:
  - corrigir ortografia;
  - corrigir acentuação;
  - ajustar maiúsculas e minúsculas;
  - corrigir espaçamentos;
  - padronizar separadores (usar " - " quando necessário).
- Não é permitido:
  - resumir;
  - reescrever;
  - substituir palavras;
  - interpretar o conteúdo para gerar novo título.

## Preenchimento com múltiplas aulas (2 ou 3 `.pptx`)

Quando o plano consolidar múltiplas aulas num único template, os campos de conteúdo e desenvolvimento devem organizar o material por aula dentro do mesmo bloco, usando o padrão:

Aula 1 – [título normalizado do pptx]

[conteúdo ou descrição da aula 1]

Aula 2 – [título normalizado do pptx]

[conteúdo ou descrição da aula 2]

Regras obrigatórias:

- A quantidade de blocos de aula deve corresponder exclusivamente ao número de arquivos `.pptx`.
- Cada `.pptx` gera exatamente uma aula.
- A ordem das aulas deve seguir a ordem de entrada dos arquivos.

Campos que não variam por aula (professor, turmas, disciplina, recursos, avaliação) são preenchidos uma única vez.

## Defaults permitidos quando faltarem dados

- PROFESSOR: valor da interface; se não houver, "A definir"
- PERÍODO DE REALIZAÇÃO: informação do material; se não houver, "conforme calendário escolar"
- Quantidade de Aulas: valor da interface

## Critérios de redação por campo

- Tema / título da aula: nome do arquivo `.pptx`, com normalização leve.
- Conteúdos: organizados por aula.
- Habilidades / competências: ações observáveis; incluir códigos se houver.
- Desenvolvimento / metodologia: descrever a prática da aula.
- Objetivos: verbos no infinitivo.
- Recursos: materiais concretos.
- Avaliação: critérios observáveis.
- Atividades desenvolvidas: resumo do que foi feito, por aula.

## Nome do arquivo de saída

Salvar em `saidas/`

- 1 aula: plano-de-aula-{disciplina}-{ano}-aula-XX.docx
- múltiplas: plano-de-aula-{disciplina}-{ano}-aulas-XX-YY.docx

Nome deve ser estável entre execuções.

## Resposta final

- informar caminho do arquivo;
- confirmar preservação do template;
- confirmar substituição de placeholders;
- confirmar aplicação das regras;
- indicar uso de fallback, se houver.