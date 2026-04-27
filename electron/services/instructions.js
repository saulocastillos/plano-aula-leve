import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_INSTRUCTION_FILE_NAME = "preencher-plano-de-aula-a-partir-do-pptx.md";

export const DEFAULT_INSTRUCTION_CONTENT = `---
name: preencher-plano-de-aula-a-partir-do-pptx
description: Use esta instrução quando eu pedir para preencher o template de plano de aula com âncoras \`.docx\` a partir de 1 a 3 arquivos \`.pptx\`, consolidando os conteúdos em um único plano e respeitando as configurações de saída definidas na interface.
---

# Instrução

Quando eu mencionar \`preencher-plano-de-aula-a-partir-do-pptx\`, execute este fluxo.

## Objetivo

Ler de 1 a 3 arquivos \`.pptx\` de aula, consolidar esses materiais em um único plano de aula, preencher o template \`.docx\` com âncoras \`{{...}}\` e gerar um novo documento final. Usar os critérios pedagógicos e editoriais descritos nesta instrução para melhorar a qualidade do preenchimento de cada campo.

## Entradas esperadas

- De 1 a 3 arquivos \`.pptx\` com o conteúdo de uma aula ou sequência de aulas relacionadas.
- Como template padrão de saída, usar:
  \`templates/plano-de-aula-template-com-ancoras.docx\`
- Opcionalmente, aceitar outro template \`.docx\` com âncoras se o usuário indicar explicitamente.
- A interface pode fornecer explicitamente estes campos de saída, que têm prioridade sobre qualquer inferência do material:
  - nome do professor
  - turmas
  - quantidade de aulas
  - período de realização (\`DATA_DE\` e \`DATA-ATÉ\`)
- Quando possível, a interface pode pré-preencher \`turmas\` a partir da leitura dos \`.pptx\`, mas o valor final continua editável pelo usuário e deve ser respeitado se ele fizer ajustes.

Convenção de caminhos do projeto:

- arquivos-fonte da aula em \`entradas/\`
- templates em \`templates/\`
- instruções em \`instrucoes/\`
- arquivos gerados em \`saidas/\`

## Resultado esperado

- Gerar uma cópia preenchida do \`.docx\`.
- Preservar o template original.
- Validar que não restaram placeholders \`{{...}}\` no arquivo final.
- Garantir que o texto preenchido não seja apenas copiado dos \`.pptx\`, mas organizado conforme os critérios pedagógicos desta instrução.
- Ser idempotente: repetir a execução com os mesmos arquivos de entrada deve produzir o mesmo arquivo de saída, sem criar variantes desnecessárias nem acumular duplicatas.

## Procedimento

1. Confirmar que todos os arquivos-fonte existem e são legíveis.
2. Se o usuário não indicar outro template, usar como base o arquivo:
   \`templates/plano-de-aula-template-com-ancoras.docx\`
3. Extrair o texto de todos os \`.pptx\`, incluindo conteúdo dos slides e, se necessário, slides de orientação para professores.
4. Identificar todas as âncoras do template \`{{...}}\`, inclusive quando estiverem quebradas em múltiplos trechos internos do Word.
5. Montar um único plano a partir do conjunto dos materiais, tratando os \`.pptx\` como partes de uma mesma proposta de aula ou sequência curta de aulas.
6. Analisar cada \`.pptx\` individualmente antes da síntese final, garantindo que todos contribuam para o plano e que nenhuma fonte seja ignorada.
7. Montar o mapeamento entre as âncoras do template e o conteúdo consolidado dos \`.pptx\`, refinando a redação com base nos critérios descritos nesta instrução.
8. Se a interface tiver fornecido professor, turmas, quantidade de aulas ou período de realização, usar esses valores explicitamente no resultado final.
9. Preencher o \`.docx\` em uma cópia nova, nunca sobrescrevendo o template original sem pedido explícito.
10. Validar o arquivo final:
   - conferir se o conteúdo principal foi inserido;
   - verificar se não sobrou nenhum \`{{...}}\`;
   - corrigir placeholders quebrados em múltiplos trechos do XML, se houver;
   - corrigir problemas estruturais do template apenas no arquivo gerado, se necessário.

## Idempotência

Esta instrução deve ser executada de forma idempotente.

- Com os mesmos arquivos de entrada, usar sempre o mesmo caminho de saída derivado do conteúdo.
- Se o arquivo de saída já existir e já estiver consistente com a entrada atual, reutilizá-lo em vez de criar outro.
- Se o arquivo de saída já existir mas estiver desatualizado em relação à entrada atual, atualizá-lo no mesmo caminho.
- Nunca criar nomes incrementais como \`copia\`, \`final\`, \`novo\`, \`v2\` ou semelhantes, exceto se o usuário pedir explicitamente.
- Nunca duplicar ou renomear template, instrução ou arquivo-fonte apenas por executar o fluxo novamente.
- Se houver necessidade de corrigir um problema estrutural do template, aplicar a correção apenas no arquivo gerado final, de forma determinística.

## Regras de preenchimento

- Priorizar conteúdo explícito dos \`.pptx\`.
- Tratar o arquivo \`templates/plano-de-aula-template-com-ancoras.docx\` como template padrão de saída.
- Se o template tiver placeholders quebrados em vários trechos internos do Word, tratá-los como um único placeholder lógico.
- Se os \`.pptx\` não trouxerem um dado objetivo para um campo, preencher com uma marcação pragmática e explícita em vez de inventar informação.
- Quando houver mais de um \`.pptx\`, consolidar os materiais em um único plano coerente, sem tratar cada apresentação como um plano separado.
- Quando houver 2 ou 3 \`.pptx\`, é obrigatório considerar o conjunto inteiro; ignorar a segunda ou terceira fonte é erro de execução.
- O plano final deve refletir progressão, complementaridade ou distribuição de atividades entre as fontes sempre que isso estiver presente no material.
- Se a interface informar professor, turmas, quantidade de aulas ou período, esses valores devem prevalecer sobre qualquer inferência do material.
- Manter consistência com o nível de ensino, disciplina, tema, objetivos, metodologia, recursos e avaliação encontrados no material.
- Se o template tiver erro estrutural, como um campo apontando para a âncora errada, corrigir isso apenas no arquivo gerado.
- Não transformar a resposta em transcrição dos slides; consolidar e escrever o plano de aula em formato final de uso.
- Manter o processo determinístico sempre que possível: mesmos insumos devem levar ao mesmo mapeamento, mesmo nome de arquivo e mesma estrutura de saída.

## Defaults permitidos quando faltarem dados

- \`PROFESSOR\`: usar o valor configurado na interface; se não houver, \`A definir\`
- \`PERÍODO DE REALIZAÇÃO\`: usar informação objetiva do material; se não houver, usar algo como \`conforme calendário escolar\`
- \`Quantidade de Aulas\`: usar o valor configurado na interface; se não houver, inferir pelo material apenas se for seguro; caso contrário, usar \`A definir\`

## Mapeamento sugerido

- \`{{DISCIPLINA-TITULO}}\`: combinação curta para o cabeçalho, como \`Arte - 9º ano\`
- \`{{DISCIPLINA}}\`: disciplina principal do material
- \`{{TURMAS}}\`: ano/série e segmento, preferindo o valor explicitamente configurado na interface quando houver
- \`{{TEMA_DA_AULA}}\`: título central da aula
- \`{{CONTEÚDO}}\`: tópicos e conceitos trabalhados
- \`{{HABILIDADES}}\`: habilidades, competências e códigos curriculares presentes
- \`{{METODOLOGIA}}\`: dinâmica, estratégias, etapas e condução da aula
- \`{{OBJETIVOS}}\`: objetivos de aprendizagem explícitos ou claramente inferíveis
- \`{{RECURSOS}}\`: materiais e recursos necessários
- \`{{AVALIACAO}}\`: critérios, dimensão avaliada e forma de observação/sistematização
- \`{{DATA_DE}}\` e \`{{DATA-ATÉ}}\`: período de realização, preferindo os valores explicitamente configurados na interface quando houver

## Critérios de redação por campo

Usar estes critérios para melhorar a qualidade do preenchimento das âncoras:

- \`{{TEMA_DA_AULA}}\`: escrever um tema específico, claro e diretamente ligado ao recorte da aula.
- \`{{CONTEÚDO}}\`: desdobrar o tema em tópicos e conceitos que realmente serão trabalhados na aula.
- \`{{HABILIDADES}}\`: priorizar habilidades como ações observáveis de aprendizagem; incluir códigos curriculares quando estiverem no material.
- \`{{METODOLOGIA}}\`: descrever como a aula acontecerá de fato, com estratégias, dinâmica, mediação, escuta, análise, exposição, prática e socialização.
- \`{{OBJETIVOS}}\`: redigir objetivos claros, preferencialmente com verbos no infinitivo e, quando fizer sentido, explicitar a finalidade do desenvolvimento proposto.
- \`{{RECURSOS}}\`: listar materiais e suportes concretos necessários para executar a aula, detalhando itens e quantidades quando isso estiver claro no material.
- \`{{AVALIACAO}}\`: indicar como a aprendizagem será observada ou verificada e quais critérios serão considerados.

## Observações do template com âncoras

O template \`templates/plano-de-aula-template-com-ancoras.docx\` tem um problema estrutural:

- o campo \`Quantidade de Aulas\` reaproveita a âncora \`{{AVALIACAO}}\`;
- ao preencher, corrigir isso apenas no arquivo final gerado, substituindo esse trecho pelo valor adequado de quantidade de aulas.

## Nome do arquivo de saída

Salvar o resultado sempre na pasta:

\`saidas/\`

Usar obrigatoriamente esta convenção de nome:

\`plano-de-aula-{disciplina-slug}-{ano-serie-slug}-aula-{nn}.docx\`

Regras para composição:

- \`disciplina-slug\`: disciplina em minúsculas, sem acentos e com palavras separadas por hífen.
- \`ano-serie-slug\`: ano ou série em minúsculas, sem acentos e com palavras separadas por hífen.
- \`nn\`: número da aula com dois dígitos, como \`01\`, \`02\`, \`03\`.

Exemplo:

\`saidas/plano-de-aula-arte-9o-ano-aula-01.docx\`

Esse nome deve ser estável entre execuções com os mesmos insumos.

## Resposta final

Na resposta final:

- informar o caminho do arquivo gerado;
- dizer se o template original foi preservado;
- dizer se todos os placeholders foram substituídos;
- dizer se os critérios desta instrução foram aplicados no refinamento do texto;
- apontar rapidamente qualquer campo preenchido com fallback.
`;

function sanitizeInstructionFileName(fileName) {
  const safe = String(fileName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  const base = safe.replace(/\.md$/i, "");
  return `${base || "instrucao"}.md`;
}

export async function ensureDefaultInstructionFile(instrucoesDir) {
  const defaultPath = path.join(instrucoesDir, DEFAULT_INSTRUCTION_FILE_NAME);
  try {
    await fs.access(defaultPath);
  } catch {
    await fs.writeFile(defaultPath, DEFAULT_INSTRUCTION_CONTENT, "utf8");
  }
  return defaultPath;
}

export async function listInstructions(instrucoesDir) {
  await ensureDefaultInstructionFile(instrucoesDir);
  const entries = await fs.readdir(instrucoesDir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
      .map(async (entry) => {
        const filePath = path.join(instrucoesDir, entry.name);
        const content = await fs.readFile(filePath, "utf8");
        return {
          fileName: entry.name,
          path: filePath,
          content,
          isDefaultBuiltIn: entry.name === DEFAULT_INSTRUCTION_FILE_NAME
        };
      })
  );

  return files;
}

export async function saveInstruction(instrucoesDir, { fileName, content }) {
  await fs.mkdir(instrucoesDir, { recursive: true });
  const nextFileName = sanitizeInstructionFileName(fileName);
  const filePath = path.join(instrucoesDir, nextFileName);
  await fs.writeFile(filePath, String(content ?? ""), "utf8");
  return {
    fileName: nextFileName,
    path: filePath
  };
}

export async function readInstruction(instrucoesDir, fileName) {
  await ensureDefaultInstructionFile(instrucoesDir);
  const nextFileName = sanitizeInstructionFileName(fileName);
  const filePath = path.join(instrucoesDir, nextFileName);
  const content = await fs.readFile(filePath, "utf8");
  return {
    fileName: nextFileName,
    path: filePath,
    content,
    isDefaultBuiltIn: nextFileName === DEFAULT_INSTRUCTION_FILE_NAME
  };
}

export async function resetDefaultInstruction(instrucoesDir) {
  await fs.mkdir(instrucoesDir, { recursive: true });
  const filePath = path.join(instrucoesDir, DEFAULT_INSTRUCTION_FILE_NAME);
  await fs.writeFile(filePath, DEFAULT_INSTRUCTION_CONTENT, "utf8");
  return {
    fileName: DEFAULT_INSTRUCTION_FILE_NAME,
    path: filePath,
    content: DEFAULT_INSTRUCTION_CONTENT,
    isDefaultBuiltIn: true
  };
}
