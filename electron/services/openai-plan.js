const PLAN_SCHEMA = {
  name: "plano_de_aula",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      disciplinaTitulo: { type: "string" },
      professor: { type: "string" },
      turmas: { type: "string" },
      disciplina: { type: "string" },
      temaDaAula: { type: "string" },
      conteudo: { type: "string" },
      habilidades: { type: "string" },
      metodologia: { type: "string" },
      objetivos: { type: "string" },
      recursos: { type: "string" },
      avaliacao: { type: "string" },
      quantidadeAulas: { type: "string" },
      dataDe: { type: "string" },
      dataAte: { type: "string" },
      aulaNumero: { type: "string" },
      anoSerieSlug: { type: "string" }
    },
    required: [
      "disciplinaTitulo",
      "professor",
      "turmas",
      "disciplina",
      "temaDaAula",
      "conteudo",
      "habilidades",
      "metodologia",
      "objetivos",
      "recursos",
      "avaliacao",
      "quantidadeAulas",
      "dataDe",
      "dataAte",
      "aulaNumero",
      "anoSerieSlug"
    ]
  }
};

function buildPrompt({
  sources,
  instructionContent,
  instructionFileName,
  outputConfig
}) {
  const sourceNames = sources.map((source) => source.fileName).join(", ");
  const sourceBlock = sources
    .map(
      (source, index) =>
        `### INICIO_FONTE_${index + 1}\nArquivo: ${source.fileName}\n${source.fullText}\n### FIM_FONTE_${index + 1}`
    )
    .join("\n\n---\n\n");

  const explicitOutputRules = [
    outputConfig?.professor ? `- professor: usar exatamente "${outputConfig.professor}"` : null,
    outputConfig?.turmas ? `- turmas: usar exatamente "${outputConfig.turmas}"` : null,
    outputConfig?.quantidadeAulas
      ? `- quantidade de aulas: usar exatamente "${outputConfig.quantidadeAulas}"`
      : null,
    outputConfig?.dataDe ? `- data inicial do período: usar exatamente "${outputConfig.dataDe}"` : null,
    outputConfig?.dataAte ? `- data final do período: usar exatamente "${outputConfig.dataAte}"` : null
  ].filter(Boolean);

  return [
    "Você vai transformar o conteúdo de uma ou mais aulas em PowerPoint em um único plano de aula pronto para preencher um template DOCX.",
    "Responda apenas com JSON compatível com o schema solicitado.",
    "Escreva em português do Brasil.",
    "Use redação final de uso, não copie instruções de metadocumento, não use placeholders.",
    "Você DEVE considerar integralmente todas as fontes fornecidas.",
    "É um erro basear o plano apenas na primeira fonte quando houver 2 ou 3 arquivos.",
    "Se houver múltiplas fontes, trate o conjunto como uma sequência pedagógica única e coerente.",
    "Antes de responder, compare as fontes e incorpore contribuições de cada uma no plano final.",
    instructionContent
      ? `Use a instrução abaixo como regra principal de transformação. Arquivo da instrução: ${instructionFileName || "instrucao-default.md"}`
      : "Use os critérios abaixo como regra principal de transformação.",
    instructionContent ? "" : null,
    instructionContent || null,
    instructionContent ? "" : null,
    "Critérios editoriais:",
    "- tema específico e claro",
    "- conteúdo como tópicos/conceitos efetivamente trabalhados",
    "- habilidades como ações observáveis; incluir códigos curriculares se existirem no material",
    "- metodologia descrevendo como a aula acontece",
    "- objetivos com verbos no infinitivo e foco no que o estudante desenvolverá",
    "- recursos concretos",
    "- avaliação com critérios observáveis",
    "- professor deve ser 'A definir' se não houver nome no material",
    "- período de realização deve usar informação do material; se não houver, usar 'conforme calendário escolar'",
    "- quantidade de aulas deve ser inferida apenas se segura; caso contrário, usar 'A definir'",
    "- em turmas, não use rótulos genéricos como 'Anos Finais'; prefira ano/série específico, e se não houver dado seguro use 'A definir'",
    "- aulaNumero deve ter apenas dois dígitos, como 01",
    "- anoSerieSlug deve ser um slug curto, como '9o-ano' ou '1a-serie'",
    "- com 2 ou 3 fontes, o tema, o conteúdo, a metodologia e a avaliação devem refletir o conjunto das fontes, não apenas a primeira",
    explicitOutputRules.length > 0 ? "" : null,
    explicitOutputRules.length > 0 ? "Configurações de saída definidas pela interface:" : null,
    explicitOutputRules.length > 0 ? explicitOutputRules.join("\n") : null,
    "",
    `Quantidade de arquivos-fonte: ${sources.length}`,
    `Arquivos-fonte: ${sourceNames}`,
    "",
    "Conteúdo extraído dos PPTX:",
    sourceBlock
  ].filter(Boolean).join("\n");
}

function extractStructuredOutput(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = [];
  const refusals = [];

  for (const item of outputs) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem?.type === "output_text" && typeof contentItem.text === "string") {
        textParts.push(contentItem.text);
      }
      if (contentItem?.type === "refusal" && typeof contentItem.refusal === "string") {
        refusals.push(contentItem.refusal);
      }
    }
  }

  if (textParts.length > 0) {
    return textParts.join("\n").trim();
  }

  if (refusals.length > 0) {
    throw new Error(`A OpenAI recusou a geração: ${refusals.join(" ")}`);
  }

  if (payload?.status === "incomplete") {
    const reason =
      payload?.incomplete_details?.reason ||
      payload?.incomplete_details?.type ||
      "resposta incompleta";
    throw new Error(`A OpenAI retornou uma resposta incompleta: ${reason}.`);
  }

  throw new Error("A OpenAI não retornou texto estruturado para o plano de aula.");
}

export async function generatePlanData({
  apiKey,
  model,
  sources,
  instructionContent,
  instructionFileName,
  outputConfig
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: buildPrompt({
        sources,
        instructionContent,
        instructionFileName,
        outputConfig
      }),
      text: {
        format: {
          type: "json_schema",
          ...PLAN_SCHEMA
        },
        verbosity: "medium"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha na OpenAI API: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = extractStructuredOutput(payload);

  return JSON.parse(outputText);
}
