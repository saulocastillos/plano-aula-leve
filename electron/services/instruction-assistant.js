const INSTRUCTION_ASSISTANT_SCHEMA = {
  name: "instruction_assistant_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      didChangeContent: { type: "boolean" },
      revisedContent: { type: "string" }
    },
    required: ["summary", "didChangeContent", "revisedContent"]
  }
};

function extractStructuredOutput(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = [];

  for (const item of outputs) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem?.type === "output_text" && typeof contentItem.text === "string") {
        textParts.push(contentItem.text);
      }
    }
  }

  if (textParts.length > 0) {
    return textParts.join("\n").trim();
  }

  throw new Error("A OpenAI não retornou texto estruturado para melhorar a instrução.");
}

function isQuestionOnlyRequest(userRequest) {
  const normalized = String(userRequest || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.endsWith("?")) {
    return true;
  }

  return [
    "o que",
    "por que",
    "porque",
    "qual foi",
    "quais foram",
    "como ficou",
    "o que voce fez",
    "o que você fez"
  ].some((prefix) => normalized.startsWith(prefix));
}

function buildImprovePrompt({
  fileName,
  currentContent,
  userRequest,
  conversationHistory,
  selectedExcerpt,
  strictRetry = false
}) {
  const historyText = Array.isArray(conversationHistory)
    ? conversationHistory
        .slice(-12)
        .map((entry) => {
          const label = entry?.role === "assistant" ? "IA" : "Usuário";
          return `${label}: ${String(entry?.content || "").trim()}`;
        })
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    "Você é um editor especialista em instruções para um app que gera planos de aula.",
    "Seu trabalho é melhorar uma instrução existente em Markdown sem perder a intenção do usuário.",
    "Responda apenas com JSON compatível com o schema solicitado.",
    "O campo revisedContent deve conter a instrução completa revisada, pronta para salvar.",
    "A prioridade máxima é obedecer ao pedido MAIS RECENTE do usuário.",
    "Quando o pedido do usuário implicar mudança, revisedContent deve refletir essa mudança de forma explícita.",
    "Quando o pedido atual for só uma pergunta sobre o que foi feito, o que mudou ou por que algo foi alterado, responda isso em summary, marque didChangeContent como false e devolva revisedContent igual ao conteúdo atual.",
    "Se houver mudança real no texto, marque didChangeContent como true e reescreva a instrução completa no campo revisedContent.",
    "Mantenha o texto em português do Brasil.",
    "Evite floreio. Prefira clareza operacional, regras verificáveis e boa estrutura.",
    "Se o pedido do usuário for parcial, aplique apenas a mudança pedida e preserve o restante.",
    "Se houver um trecho selecionado, concentre a revisão nesse trecho e preserve o restante da instrução o máximo possível.",
    "Se o pedido mandar adicionar, remover, reescrever, encurtar, detalhar, trocar tom, trocar termos ou mudar estrutura, a mudança deve aparecer no revisedContent.",
    "É erro responder apenas com comentário, resumo ou justificativa quando o usuário pediu edição.",
    "Antes de responder, verifique se revisedContent realmente incorpora a mudança pedida.",
    strictRetry
      ? "Tentativa anterior falhou em obedecer ao pedido de edição. Nesta resposta, trate o pedido como obrigatório e reescreva o texto para refletir a mudança."
      : null,
    "",
    `Arquivo: ${fileName || "instrucao.md"}`,
    "",
    "Histórico recente da conversa:",
    historyText || "Sem histórico anterior.",
    "",
    "Trecho selecionado no editor:",
    selectedExcerpt || "Nenhum trecho selecionado.",
    "",
    "Pedido do usuário:",
    userRequest,
    "",
    "Conteúdo atual da instrução:",
    "```md",
    currentContent,
    "```"
  ].join("\n");
}

async function requestImprovedInstruction({
  apiKey,
  model,
  prompt
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
          ...INSTRUCTION_ASSISTANT_SCHEMA
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
  return JSON.parse(extractStructuredOutput(payload));
}

export async function improveInstruction({
  apiKey,
  model,
  fileName,
  currentContent,
  userRequest,
  conversationHistory = [],
  selectedExcerpt = ""
}) {
  const firstResult = await requestImprovedInstruction({
    apiKey,
    model,
    prompt: buildImprovePrompt({
      fileName,
      currentContent,
      userRequest,
      conversationHistory,
      selectedExcerpt
    })
  });

  const askedForEdit = !isQuestionOnlyRequest(userRequest);
  const changedContent =
    Boolean(firstResult?.didChangeContent) &&
    String(firstResult?.revisedContent || "") !== String(currentContent || "");

  if (!askedForEdit || changedContent) {
    return firstResult;
  }

  const retryResult = await requestImprovedInstruction({
    apiKey,
    model,
    prompt: buildImprovePrompt({
      fileName,
      currentContent,
      userRequest,
      conversationHistory,
      selectedExcerpt,
      strictRetry: true
    })
  });

  return retryResult;
}
