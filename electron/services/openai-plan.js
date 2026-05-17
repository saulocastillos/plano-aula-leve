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

const BIMESTRAL_PLAN_SCHEMA = {
  name: "planejamento_bimestral",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      bimestre: { type: "string" },
      turma: { type: "string" },
      disciplina: { type: "string" },
      anoLetivo: { type: "string" },
      professor: { type: "string" },
      aulas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            fonteAulaNumero: { type: "integer" },
            tituloAula: { type: "string" },
            ehContinuacao: { type: "boolean" },
            objetivosAprendizagem: { type: "string" },
            verificacaoObjetivo: { type: "string" },
            estrategiasDidaticas: { type: "string" },
            recursosPedagogicos: { type: "string" }
          },
          required: [
            "fonteAulaNumero",
            "tituloAula",
            "ehContinuacao",
            "objetivosAprendizagem",
            "verificacaoObjetivo",
            "estrategiasDidaticas",
            "recursosPedagogicos"
          ]
        }
      }
    },
    required: ["bimestre", "turma", "disciplina", "anoLetivo", "professor", "aulas"]
  }
};

function clampText(value, maxChars) {
  const text = String(value || "").trim();
  if (!text || text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[TRUNCADO PELO APP PARA CABER NO CONTEXTO]`;
}

function buildSourceBlock(sources, { totalCharBudget, perSourceMaxChars }) {
  const sourceCount = Math.max(1, sources.length);
  const perSourceBudget = Math.max(1200, Math.floor(totalCharBudget / sourceCount));
  const effectivePerSourceMax = Math.max(1200, Math.min(perSourceMaxChars, perSourceBudget));

  return sources
    .map((source, index) => {
      const compactText = clampText(source.fullText, effectivePerSourceMax);
      return `### INICIO_FONTE_${index + 1}\nArquivo: ${source.fileName}\n${compactText}\n### FIM_FONTE_${index + 1}`;
    })
    .join("\n\n---\n\n");
}

function extractStructuredOutput(payload, contextLabel) {
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

  throw new Error(`A OpenAI não retornou texto estruturado para ${contextLabel}.`);
}

async function requestStructuredJson({
  apiKey,
  model,
  prompt,
  schema,
  contextLabel
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          ...schema
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
  const outputText = extractStructuredOutput(payload, contextLabel);

  return JSON.parse(outputText);
}

function buildPlanPrompt({
  sources,
  instructionContent,
  instructionFileName,
  outputConfig
}) {
  const sourceNames = sources.map((source) => source.fileName).join(", ");
  const sourceBlock = buildSourceBlock(sources, {
    totalCharBudget: 110000,
    perSourceMaxChars: 25000
  });

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
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBimestralPrompt({
  sources,
  instructionContent,
  instructionFileName,
  outputConfig,
  strictCountMode = false
}) {
  const sourceNames = sources.map((source) => source.fileName).join(", ");
  const sourceBlock = buildSourceBlock(sources, {
    totalCharBudget: 120000,
    perSourceMaxChars: 8000
  });

  const explicitOutputRules = [
    outputConfig?.professor ? `- professor: usar exatamente "${outputConfig.professor}"` : null,
    outputConfig?.turmas ? `- turma: usar exatamente "${outputConfig.turmas}"` : null,
    outputConfig?.quantidadeAulas
      ? `- quantidade-alvo de aulas: "${outputConfig.quantidadeAulas}"`
      : null,
    outputConfig?.dataDe ? `- considerar início do período informado: "${outputConfig.dataDe}"` : null,
    outputConfig?.dataAte ? `- considerar fim do período informado: "${outputConfig.dataAte}"` : null,
    outputConfig?.cadencia ? `- cadência informada: "${outputConfig.cadencia}"` : null,
    outputConfig?.scheduleMode
      ? `- modo de planejamento: "${outputConfig.scheduleMode}" (quantidade ou data_fim)`
      : null,
    outputConfig?.sourceLessonNumbers
      ? `- aulas-fonte disponíveis (pela ordem): ${outputConfig.sourceLessonNumbers}`
      : null,
    outputConfig?.sourceSplitPlanHuman
      ? `- plano de divisão obrigatório por fonte: ${outputConfig.sourceSplitPlanHuman}`
      : null
  ].filter(Boolean);

  return [
    "Você vai gerar um planejamento bimestral de Bertioga a partir de conteúdo de múltiplos arquivos PPTX.",
    "Responda apenas com JSON compatível com o schema solicitado.",
    "Escreva em português do Brasil.",
    "Use redação final de uso pedagógico; não copie texto cru dos slides.",
    "Considere todas as fontes recebidas e distribua o conteúdo em uma sequência coerente de aulas.",
    "As fontes já estão ordenadas por aula e essa ordem cronológica deve ser respeitada.",
    "Não antecipe conteúdo de uma fonte posterior para antes de concluir a progressão das fontes anteriores.",
    "Cada item de aulas DEVE manter coerência entre objetivo, evidência, estratégia e recurso.",
    "Cada item deve indicar 'fonteAulaNumero' (número da aula-fonte de origem).",
    "Use 'tituloAula' sem data e sem numeração (a aplicação adicionará 'Aula X - ... - DD/MM/AAAA').",
    "Quando uma aula-fonte for grande, você pode dividi-la em 2 aulas (preferencial) e no máximo 3 aulas.",
    "Evite dividir em 3, use apenas quando realmente necessário.",
    "Nunca gere sequência longa de continuações para fontes diferentes.",
    "Use 'ehContinuacao=true' apenas quando a aula for continuação direta da aula imediatamente anterior e da mesma fonte.",
    "Em aulas não continuação, use 'ehContinuacao=false'.",
    instructionContent
      ? `Use a instrução abaixo como regra principal de transformação. Arquivo da instrução: ${instructionFileName || "instrucao-default.md"}`
      : "Use os critérios abaixo como regra principal de transformação.",
    instructionContent ? "" : null,
    instructionContent || null,
    instructionContent ? "" : null,
    "Critérios editoriais para as colunas:",
    "- objetivosAprendizagem: definir o que os estudantes devem aprender, considerando escopo-sequência, Mapa Foco e resultados do semestre",
    "- verificacaoObjetivo: definir evidências observáveis com texto curto, humano e objetivo",
    "- verificacaoObjetivo: variar a redação entre aulas, evitando repetição de frases iniciais",
    "- verificacaoObjetivo: preferir 1 frase curta (ou 2 no máximo), sem listas longas",
    "- estrategiasDidaticas: definir propostas de sala e estratégias para engajar e desenvolver cada objetivo",
    "- recursosPedagogicos: definir materiais digitais/impressos, plataformas e recursos usados aula a aula",
    "- tituloAula: descrever o assunto/tema da aula em poucas palavras",
    "- em continuidade, usar tituloAula coerente com o assunto anterior",
    "- dividir por fonte: cada fonte pode aparecer no máximo 3 vezes; preferir 1 ou 2 vezes",
    outputConfig?.sourceSplitPlanHuman
      ? "- respeitar exatamente o plano de divisão por fonte informado nas configurações de saída"
      : null,
    outputConfig?.quantidadeAulas
      ? `- gerar EXATAMENTE ${outputConfig.quantidadeAulas} itens no array 'aulas'`
      : null,
    outputConfig?.quantidadeAulas
      ? "- se houver menos fontes do que aulas necessárias, subdividir as aulas-fonte maiores em partes/continuações até completar a quantidade exata"
      : null,
    strictCountMode
      ? "- validação estrita: o array 'aulas' deve ter exatamente a quantidade solicitada, sem faltar e sem sobrar"
      : null,
    explicitOutputRules.length > 0 ? "" : null,
    explicitOutputRules.length > 0 ? "Configurações de saída definidas pela interface:" : null,
    explicitOutputRules.length > 0 ? explicitOutputRules.join("\n") : null,
    "",
    `Quantidade de arquivos-fonte: ${sources.length}`,
    `Arquivos-fonte: ${sourceNames}`,
    "",
    "Conteúdo extraído dos PPTX:",
    sourceBlock
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generatePlanData({
  apiKey,
  model,
  sources,
  instructionContent,
  instructionFileName,
  outputConfig
}) {
  const prompt = buildPlanPrompt({
    sources,
    instructionContent,
    instructionFileName,
    outputConfig
  });

  return requestStructuredJson({
    apiKey,
    model,
    prompt,
    schema: PLAN_SCHEMA,
    contextLabel: "o plano de aula"
  });
}

export async function generateBimestralPlanData({
  apiKey,
  model,
  sources,
  instructionContent,
  instructionFileName,
  outputConfig
}) {
  const requestedCount = Number.parseInt(String(outputConfig?.quantidadeAulas || ""), 10);
  const hasStrictCount = Number.isFinite(requestedCount) && requestedCount > 0;

  const firstPrompt = buildBimestralPrompt({
    sources,
    instructionContent,
    instructionFileName,
    outputConfig
  });

  let firstResult = await requestStructuredJson({
    apiKey,
    model,
    prompt: firstPrompt,
    schema: BIMESTRAL_PLAN_SCHEMA,
    contextLabel: "o planejamento bimestral"
  });

  if (!hasStrictCount) {
    return firstResult;
  }

  const firstCount = Array.isArray(firstResult?.aulas) ? firstResult.aulas.length : 0;
  if (firstCount === requestedCount) {
    return firstResult;
  }

  const retryPrompt = buildBimestralPrompt({
    sources,
    instructionContent,
    instructionFileName,
    outputConfig,
    strictCountMode: true
  });

  const retryResult = await requestStructuredJson({
    apiKey,
    model,
    prompt: retryPrompt,
    schema: BIMESTRAL_PLAN_SCHEMA,
    contextLabel: "o planejamento bimestral"
  });

  const retryCount = Array.isArray(retryResult?.aulas) ? retryResult.aulas.length : 0;
  if (retryCount !== requestedCount) {
    throw new Error(
      `A IA retornou ${retryCount} aulas, mas eram necessárias ${requestedCount}. Ajuste as fontes/instrução e gere novamente.`
    );
  }

  return retryResult;
}
