import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_INSTRUCTION_FILE_NAME = "instrucao-padrao-bertioga.md";
export const JOSE_DA_COSTA_INSTRUCTION_FILE_NAME = "instrucao-padrao-jose-da-costa.md";
export const BIMESTRAL_INSTRUCTION_FILE_NAME = "instrucao-padrao-planejamento-bimestral.md";
export const BUILT_IN_INSTRUCTION_FILE_NAMES = [
  DEFAULT_INSTRUCTION_FILE_NAME,
  JOSE_DA_COSTA_INSTRUCTION_FILE_NAME,
  BIMESTRAL_INSTRUCTION_FILE_NAME
];
const LEGACY_GENERIC_INSTRUCTION_FILE_NAME = "instrucao-padrao-plano-de-aula.md";
const LEGACY_DEFAULT_INSTRUCTION_FILE_NAME = "preencher-plano-de-aula-a-partir-do-pptx.md";

export const DEFAULT_INSTRUCTION_CONTENT = `---
name: preencher-plano-bertioga-a-partir-do-pptx
description: Use esta instrução para gerar um plano de aula a partir de 1 a 3 arquivos .pptx usando o template padrão de Bertioga.
---

# Instrução

## Objetivo

Ler de 1 a 3 arquivos \`.pptx\`, consolidar o conteúdo em um único plano de aula e preencher o template:

\`templates/Plano de Aula - Bertioga.docx\`

## Regras principais

- Responder em português do Brasil.
- Considerar todas as fontes fornecidas, nunca apenas a primeira.
- Produzir texto final de uso pedagógico, não transcrição de slide.
- Se a interface informar professor, turmas, quantidade de aulas ou período, esses valores têm prioridade.
- Quando faltar dado objetivo, usar fallback explícito em vez de inventar.

## Campos do template de Bertioga

- \`{{DISCIPLINA-TITULO}}\`: cabeçalho curto, como \`Arte - 8o ano\`
- \`{{PROFESSOR}}\`: nome do professor
- \`{{TURMAS}}\`: ano/série e segmento
- \`{{DISCIPLINA}}\`: disciplina principal
- \`{{TEMA_DA_AULA}}\`: tema central da aula
- \`{{CONTEÚDO}}\`: tópicos e conceitos efetivamente trabalhados
- \`{{HABILIDADES}}\`: habilidades e competências, com códigos curriculares quando existirem
- \`{{METODOLOGIA}}\`: condução da aula, etapas, dinâmica, mediação e estratégias
- \`{{OBJETIVOS}}\`: objetivos de aprendizagem claros
- \`{{RECURSOS}}\`: materiais e suportes necessários
- \`{{AVALIACAO}}\`: avaliação e sistematização
- \`{{QTD_AULAS}}\`: número de aulas
- \`{{DATA_DE}}\` e \`{{DATA-ATÉ}}\`: período de realização

## Critérios de escrita

- \`CONTEÚDO\`: listar conceitos, tópicos e recortes do que será estudado.
- \`METODOLOGIA\`: explicar como a aula acontece de fato, com começo, desenvolvimento e fechamento.
- \`AVALIACAO\`: indicar como a aprendizagem será observada, registrada ou verificada.
- \`OBJETIVOS\`: usar verbos no infinitivo e foco no que o estudante desenvolverá.

## Observação estrutural

No template de Bertioga, o campo \`Quantidade de Aulas\` pode reaproveitar a âncora \`{{AVALIACAO}}\`. Corrigir isso apenas no arquivo final gerado.

## Resultado esperado

- Preservar o template original.
- Gerar um arquivo \`.docx\` final em \`saidas/\`.
- Não deixar placeholders \`{{...}}\` sem preencher.
`;

export const JOSE_DA_COSTA_INSTRUCTION_CONTENT = `---
name: preencher-plano-jose-da-costa-a-partir-do-pptx
description: Use esta instrução para gerar um plano de aula a partir de 1 a 3 arquivos .pptx usando o template padrão de José da Costa.
---

# Instrução

## Objetivo

Ler de 1 a 3 arquivos \`.pptx\`, consolidar o conteúdo em um único plano de aula e preencher o template:

\`templates/Plano de Aula - José da Costa.docx\`

## Regras principais

- Responder em português do Brasil.
- Considerar integralmente todas as fontes.
- Produzir texto final de uso, não copiar os slides literalmente.
- Respeitar os campos definidos pela interface quando forem informados.
- Quando faltar dado objetivo, usar fallback explícito.

## Campos do template de José da Costa

- \`{{PROFESSOR}}\`: nome do professor
- \`{{TURMAS}}\`: séries e segmentos
- \`{{DISCIPLINA}}\`: disciplina principal
- \`{{CONTEUDOS}}\`: conteúdos e conceitos centrais da aula
- \`{{HABILIDADES}}\`: habilidades e competências
- \`{{DESENVOLVIMENTO}}\`: desenvolvimento da aula, com etapas, estratégias, mediação e sequência didática
- \`{{RECURSOS}}\`: materiais e suportes
- \`{{AVALIACAO}}\`: avaliação e sistematização
- \`{{QTD_AULAS}}\`: número de aulas previstas
- \`{{DATA_DE}}\` e \`{{DATA_ATE}}\`: período de realização
- \`{{ATIVIDADES_DESENVOLVIDAS}}\`: descrição objetiva das atividades aplicadas em sala

## Critérios de escrita

- \`CONTEUDOS\`: listar conteúdos de forma organizada e objetiva.
- \`DESENVOLVIMENTO\`: descrever o passo a passo da aula com começo, desenvolvimento e fechamento.
- \`ATIVIDADES_DESENVOLVIDAS\`: escrever as atividades em formato aplicável, como sequência prática do que foi ou será realizado.
- \`AVALIACAO\`: indicar critérios observáveis de aprendizagem.

## Resultado esperado

- Preservar o template original.
- Gerar um arquivo \`.docx\` final em \`saidas/\`.
- Não deixar placeholders \`{{...}}\` sem preencher.
`;

export const BIMESTRAL_INSTRUCTION_CONTENT = `---
name: preencher-planejamento-bimestral-bertioga-a-partir-do-pptx
description: Use esta instrução para gerar planejamento bimestral de Bertioga a partir de múltiplos arquivos .pptx, com foco em objetivos, evidências, estratégias e recursos.
---

# Instrução

## Objetivo

Ler os arquivos \`.pptx\` selecionados, consolidar o conteúdo do bimestre e preencher o template de planejamento bimestral de Bertioga com uma tabela por aula.

## Estrutura da tabela

Cada linha de aula deve preencher estas colunas:

- \`Aula/Data\`
- \`Objetivos de aprendizagem\`
- \`Como verificar se o objetivo foi alcançado\`
- \`Estratégias didáticas\`
- \`Recursos pedagógicos\`

## Critérios de preenchimento (obrigatórios)

- Em \`Objetivos de aprendizagem\`, definir o que os estudantes devem aprender, considerando o escopo-sequência, o Mapa Foco e os resultados do primeiro semestre.
- Em \`Como verificar se o objetivo foi alcançado\`, definir evidências observáveis que permitam verificar se os estudantes desenvolveram as aprendizagens previstas ao longo das aulas.
- Em \`Estratégias didáticas\`, definir as propostas que serão trabalhadas em sala e o tipo de estratégia mais adequado para desenvolver cada objetivo e engajar os alunos.
- Em \`Recursos pedagógicos\`, definir os materiais digitais e impressos, plataformas e demais recursos que serão utilizados aula a aula.

## Regras principais

- Responder em português do Brasil.
- Considerar todas as fontes fornecidas, não apenas a primeira.
- Produzir texto final de uso pedagógico, não transcrição literal dos slides.
- Manter coerência entre objetivo, evidência, estratégia e recurso em cada linha.
- Quando houver códigos curriculares no material, incluí-los nos objetivos.
- Se faltar informação objetiva para alguma célula, usar fallback explícito e pedagógico, sem inventar dados específicos.

## Resultado esperado

- Preservar o template original.
- Gerar um arquivo \`.docx\` final em \`saidas/\`.
- Não deixar placeholders \`{{...}}\` sem preencher.
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
  await fs.mkdir(instrucoesDir, { recursive: true });
  const defaultPath = path.join(instrucoesDir, DEFAULT_INSTRUCTION_FILE_NAME);
  const josePath = path.join(instrucoesDir, JOSE_DA_COSTA_INSTRUCTION_FILE_NAME);
  const bimestralPath = path.join(instrucoesDir, BIMESTRAL_INSTRUCTION_FILE_NAME);
  const legacyGenericPath = path.join(instrucoesDir, LEGACY_GENERIC_INSTRUCTION_FILE_NAME);
  const legacyDefaultPath = path.join(instrucoesDir, LEGACY_DEFAULT_INSTRUCTION_FILE_NAME);

  try {
    await fs.access(defaultPath);
  } catch {
    try {
      await fs.access(legacyGenericPath);
      await fs.rename(legacyGenericPath, defaultPath);
    } catch {
      try {
        await fs.access(legacyDefaultPath);
        await fs.rename(legacyDefaultPath, defaultPath);
      } catch {
        await fs.writeFile(defaultPath, DEFAULT_INSTRUCTION_CONTENT, "utf8");
      }
    }
  }

  try {
    await fs.access(josePath);
  } catch {
    await fs.writeFile(josePath, JOSE_DA_COSTA_INSTRUCTION_CONTENT, "utf8");
  }

  try {
    await fs.access(bimestralPath);
  } catch {
    await fs.writeFile(bimestralPath, BIMESTRAL_INSTRUCTION_CONTENT, "utf8");
  }

  try {
    await fs.access(legacyGenericPath);
    await fs.unlink(legacyGenericPath);
  } catch {
    // sem legado extra para limpar
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
          isBuiltIn: BUILT_IN_INSTRUCTION_FILE_NAMES.includes(entry.name),
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
    isBuiltIn: BUILT_IN_INSTRUCTION_FILE_NAMES.includes(nextFileName),
    isDefaultBuiltIn: nextFileName === DEFAULT_INSTRUCTION_FILE_NAME
  };
}

export async function deleteInstruction(instrucoesDir, fileName) {
  await ensureDefaultInstructionFile(instrucoesDir);
  const nextFileName = sanitizeInstructionFileName(fileName);

  if (BUILT_IN_INSTRUCTION_FILE_NAMES.includes(nextFileName)) {
    throw new Error("As instruções padrão do app não podem ser removidas.");
  }

  const filePath = path.join(instrucoesDir, nextFileName);
  await fs.unlink(filePath);
  return {
    fileName: nextFileName,
    path: filePath
  };
}

export async function resetDefaultInstruction(instrucoesDir, fileName = DEFAULT_INSTRUCTION_FILE_NAME) {
  await fs.mkdir(instrucoesDir, { recursive: true });
  const nextFileName = sanitizeInstructionFileName(fileName);
  const targetFileName = BUILT_IN_INSTRUCTION_FILE_NAMES.includes(nextFileName)
    ? nextFileName
    : DEFAULT_INSTRUCTION_FILE_NAME;
  const filePath = path.join(instrucoesDir, targetFileName);
  const content =
    targetFileName === JOSE_DA_COSTA_INSTRUCTION_FILE_NAME
      ? JOSE_DA_COSTA_INSTRUCTION_CONTENT
      : targetFileName === BIMESTRAL_INSTRUCTION_FILE_NAME
        ? BIMESTRAL_INSTRUCTION_CONTENT
        : DEFAULT_INSTRUCTION_CONTENT;
  await fs.writeFile(filePath, content, "utf8");
  return {
    fileName: targetFileName,
    path: filePath,
    content,
    isBuiltIn: true,
    isDefaultBuiltIn: targetFileName === DEFAULT_INSTRUCTION_FILE_NAME
  };
}
