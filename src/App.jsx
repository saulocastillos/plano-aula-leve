import { useEffect, useRef, useState } from "react";

const MODEL_OPTIONS = [
  {
    value: "gpt-5.4-nano",
    label: "GPT-5.4 Nano",
    comboLabel: "GPT-5.4 Nano - ~R$ 0,01 por plano - Limitado, mas veloz",
    specialty:
      "Bom para testes rapidos e baratos, mas tende a simplificar mais o resultado.",
    estimate: "~R$ 0,01 por plano",
  },
  {
    value: "gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    comboLabel: "GPT-5.4 Mini - ~R$ 0,04 por plano - Custo e velocidade",
    specialty:
      "Melhor ponto de partida para uso diario, com bom equilibrio entre qualidade, custo e rapidez.",
    estimate: "~R$ 0,04 por plano",
  },
  {
    value: "gpt-5.4",
    label: "GPT-5.4",
    comboLabel: "GPT-5.4 - ~R$ 0,13 por plano - Mais qualidade",
    specialty:
      "Entrega respostas mais consistentes e refinadas quando o material exige melhor interpretacao.",
    estimate: "~R$ 0,13 por plano",
  },
];

const SORT_OPTIONS = [
  { value: "modified-desc", label: "Mais recentes" },
  { value: "modified-asc", label: "Mais antigos" },
  { value: "name-asc", label: "Nome A-Z" },
  { value: "name-desc", label: "Nome Z-A" },
];

const DOCUMENT_TYPES = [
  { value: "plano_aula", label: "Plano de aula", maxFiles: 3 },
  { value: "planejamento_bimestral", label: "Planejamento bimestral", maxFiles: null },
];

const BIMESTRAL_INSTRUCTION_FILE_NAME =
  "instrucao-padrao-planejamento-bimestral.md";
const BIMESTRAL_TEMPLATE_PATTERN = /planejamento.*bimestral/i;
const SCHEDULE_MODE_OPTIONS = [
  { value: "quantidade", label: "Por quantidade de aulas" },
  { value: "data_fim", label: "Por data final" },
];
const CADENCE_OPTIONS = [
  { value: "semanal", label: "Semanal (1x por semana)", disabled: false },
  { value: "2x-semana", label: "2 vezes por semana", disabled: true },
  { value: "3x-semana", label: "3 vezes por semana", disabled: true },
];

function getDocumentTypeConfig(documentType) {
  return (
    DOCUMENT_TYPES.find((option) => option.value === documentType) ||
    DOCUMENT_TYPES[0]
  );
}

function isBimestralInstruction(instruction) {
  return (
    instruction?.fileName === BIMESTRAL_INSTRUCTION_FILE_NAME
  );
}

function isBimestralTemplate(template) {
  return BIMESTRAL_TEMPLATE_PATTERN.test(String(template?.fileName || ""));
}

function filterInstructionsByDocumentType(instructions, documentType) {
  const items = Array.isArray(instructions) ? instructions : [];
  if (documentType === "planejamento_bimestral") {
    return items.filter(isBimestralInstruction);
  }
  return items.filter((instruction) => !isBimestralInstruction(instruction));
}

function filterTemplatesByDocumentType(templates, documentType) {
  const items = Array.isArray(templates) ? templates : [];
  if (documentType === "planejamento_bimestral") {
    return items.filter(isBimestralTemplate);
  }
  return items.filter((template) => !isBimestralTemplate(template));
}

function getPlanoLeveApi() {
  if (!window.planoLeveApi) {
    throw new Error(
      "A ponte do Electron não está disponível. Reinicie o app para carregar o preload atualizado.",
    );
  }
  return window.planoLeveApi;
}

function getBaseName(targetPath) {
  return (
    String(targetPath || "")
      .split("/")
      .pop() || targetPath
  );
}

function mergeFiles(currentFiles, nextFiles) {
  const registry = new Map(currentFiles.map((file) => [file.path, file]));
  for (const file of nextFiles) {
    const current = registry.get(file.path);
    registry.set(file.path, {
      ...file,
      active: current?.active ?? true,
    });
  }
  return Array.from(registry.values());
}

function sortFiles(files, sortBy) {
  const nextFiles = [...files];
  nextFiles.sort((left, right) => {
    if (sortBy === "name-asc") {
      return left.name.localeCompare(right.name, "pt-BR");
    }
    if (sortBy === "name-desc") {
      return right.name.localeCompare(left.name, "pt-BR");
    }
    if (sortBy === "modified-asc") {
      return (left.modifiedAtMs ?? 0) - (right.modifiedAtMs ?? 0);
    }
    return (right.modifiedAtMs ?? 0) - (left.modifiedAtMs ?? 0);
  });
  return nextFiles;
}

function formatModifiedDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusTone({ busy, result, status }) {
  if (busy) {
    return "busy";
  }
  if ((result?.failedCount ?? 0) > 0 && (result?.count ?? 0) === 0) {
    return "error";
  }
  if ((result?.failedCount ?? 0) > 0) {
    return "warn";
  }
  if (result?.count > 0) {
    return "success";
  }
  if (status) {
    return "neutral";
  }
  return "neutral";
}

function getInstructionLabel(instruction) {
  if (!instruction) {
    return "";
  }

  if (instruction.fileName === "instrucao-padrao-bertioga.md") {
    return "Instrução padrão - Bertioga";
  }
  if (instruction.fileName === "instrucao-padrao-jose-da-costa.md") {
    return "Instrução padrão - José da Costa";
  }
  if (instruction.fileName === "instrucao-padrao-planejamento-bimestral.md") {
    return "Instrução padrão - Planejamento bimestral (Bertioga)";
  }

  return instruction.fileName;
}

function getTemplateLabel(template) {
  if (!template) {
    return "";
  }

  return template.isDefaultBuiltIn
    ? "Template padrão do app"
    : template.fileName;
}

function instructionFileNameToFriendlyName(fileName) {
  const base = String(fileName || "")
    .replace(/\.md$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!base) {
    return "";
  }

  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

function friendlyNameToInstructionFileName(value) {
  const normalized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalized || "instrucao"}.md`;
}

function splitTextLines(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").split("\n");
}

function buildLineDiffEntries(previousText, nextText) {
  const previousLines = splitTextLines(previousText);
  const nextLines = splitTextLines(nextText);
  const matrix = Array.from({ length: previousLines.length + 1 }, () =>
    Array(nextLines.length + 1).fill(0),
  );

  for (let leftIndex = previousLines.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (
      let rightIndex = nextLines.length - 1;
      rightIndex >= 0;
      rightIndex -= 1
    ) {
      if (previousLines[leftIndex] === nextLines[rightIndex]) {
        matrix[leftIndex][rightIndex] = matrix[leftIndex + 1][rightIndex + 1] + 1;
      } else {
        matrix[leftIndex][rightIndex] = Math.max(
          matrix[leftIndex + 1][rightIndex],
          matrix[leftIndex][rightIndex + 1],
        );
      }
    }
  }

  const entries = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < previousLines.length && rightIndex < nextLines.length) {
    if (previousLines[leftIndex] === nextLines[rightIndex]) {
      entries.push({ type: "unchanged", text: previousLines[leftIndex] });
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    if (matrix[leftIndex + 1][rightIndex] >= matrix[leftIndex][rightIndex + 1]) {
      entries.push({ type: "removed", text: previousLines[leftIndex] });
      leftIndex += 1;
    } else {
      entries.push({ type: "added", text: nextLines[rightIndex] });
      rightIndex += 1;
    }
  }

  while (leftIndex < previousLines.length) {
    entries.push({ type: "removed", text: previousLines[leftIndex] });
    leftIndex += 1;
  }

  while (rightIndex < nextLines.length) {
    entries.push({ type: "added", text: nextLines[rightIndex] });
    rightIndex += 1;
  }

  return entries;
}

function InfoTip({ text }) {
  return (
    <span className="info-tip-wrap">
      <button className="info-tip" type="button" aria-label={text}>
        ?
      </button>
      <span className="info-tip-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function SettingsModal({
  open,
  settings,
  projectPaths,
  onClose,
  onSave,
  onPreviewFontScale,
  onChangeDirectory,
}) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const selectedModel =
    MODEL_OPTIONS.find(
      (option) => option.value === (draft.model ?? "gpt-5.4-mini"),
    ) || MODEL_OPTIONS.find((option) => option.value === "gpt-5.4-mini");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!open) {
      return;
    }

    onPreviewFontScale?.(draft.fontScale ?? 100);
  }, [draft.fontScale, onPreviewFontScale, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajustes</h2>
          <button className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <label className="field">
          <span>OpenAI API key</span>
          <input
            type="password"
            placeholder="sk-..."
            value={draft.apiKey ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                apiKey: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Professor padrão</span>
          <input
            type="text"
            placeholder="Nome do professor"
            value={draft.professorName ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                professorName: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Tamanho da fonte</span>
          <input
            type="range"
            min="75"
            max="160"
            step="1"
            value={draft.fontScale ?? 100}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                fontScale: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="field">
          <span>Modelo</span>
          <select
            value={draft.model ?? "gpt-5.4-mini"}
            onChange={(event) =>
              setDraft((current) => ({ ...current, model: event.target.value }))
            }
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.comboLabel}
              </option>
            ))}
          </select>
          <small>
            {selectedModel?.specialty} Estimativa tipica:{" "}
            {selectedModel?.estimate}.
          </small>
        </label>

        <div className="project-paths modal-paths">
          <p>
            <strong>Salvar planos em</strong>
            <span>{projectPaths?.saidasDir || "—"}</span>
          </p>
          <div className="inline-actions">
            <button
              className="secondary-button"
              onClick={() => onChangeDirectory("output")}
              type="button"
            >
              Alterar saída
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="primary-button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(draft);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructionManagerModal({
  open,
  instructions,
  defaultInstructionFileName,
  draft,
  aiPrompt,
  aiHistory,
  aiBusy,
  aiProposal,
  onClose,
  onSelectDefault,
  onDraftChange,
  onSave,
  onDelete,
  onNew,
  onResetDefault,
  onAiPromptChange,
  onImproveWithAi,
  onAcceptAiProposal,
  onRejectAiProposal,
  onSeedPromptFromSelection
}) {
  const composerRef = useRef(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState("");

  useEffect(() => {
    setSelectedExcerpt("");
  }, [draft.fileName]);

  if (!open) {
    return null;
  }

  const friendlyName = draft.fileName
    ? instructionFileNameToFriendlyName(draft.fileName)
    : "";
  const selectedInstruction = instructions.find(
    (instruction) => instruction.fileName === draft.fileName,
  );
  const canDeleteInstruction =
    Boolean(selectedInstruction) && !selectedInstruction.isBuiltIn;
  const diffEntries = aiProposal?.didChangeContent
    ? buildLineDiffEntries(aiProposal.baseContent, aiProposal.revisedContent)
    : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-card-editor"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Instruções</h2>
          <div className="inline-actions">
            <button className="secondary-button" onClick={onNew}>
              Nova instrução
            </button>
            <button
              className="secondary-button"
              onClick={() => onDelete(draft.fileName)}
              disabled={!canDeleteInstruction}
              title={
                canDeleteInstruction
                  ? "Remover a instrução selecionada"
                  : "As instruções padrão do app não podem ser removidas."
              }
            >
              Remover instrução
            </button>
            <button className="secondary-button" onClick={onResetDefault}>
              Resetar padrão
            </button>
            <button className="primary-button" onClick={() => onSave(draft)}>
              Salvar
            </button>
            <button className="ghost-button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        <div className="instruction-workspace">
          <section className="instruction-editor-panel">
            <label className="field field-tight">
              <span>Nome da instrução</span>
              <input
                type="text"
                value={friendlyName}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    fileName: friendlyNameToInstructionFileName(event.target.value),
                  })
                }
                placeholder="Nova instrução"
              />
            </label>

            <label className="field field-tight">
              <span>Editor da instrução</span>
              <div className="instruction-editor-wrap">
                {selectedExcerpt && !aiProposal ? (
                  <button
                    className="selection-popover"
                    type="button"
                    onClick={() => {
                      onSeedPromptFromSelection(selectedExcerpt);
                      requestAnimationFrame(() => composerRef.current?.focus());
                    }}
                  >
                    Melhorar trecho com IA
                  </button>
                ) : null}

                {aiProposal ? (
                  <div className="editor-proposal-shell instruction-textarea instruction-textarea-large">
                    <div className="proposal-header">
                      <div>
                        <strong>Revisão sugerida pela IA</strong>
                        <p>{aiProposal.summary}</p>
                      </div>
                      <div className="inline-actions">
                        <button className="secondary-button" onClick={onRejectAiProposal}>
                          Descartar
                        </button>
                        <button
                          className="primary-button"
                          onClick={onAcceptAiProposal}
                          disabled={!aiProposal.didChangeContent}
                        >
                          Aceitar correção
                        </button>
                      </div>
                    </div>

                    {aiProposal.didChangeContent ? (
                      <div className="proposal-diff proposal-diff-inline">
                        {diffEntries.map((entry, index) => (
                          <div
                            className={`proposal-line proposal-line-${entry.type}`}
                            key={`${entry.type}-${index}`}
                          >
                            <span className="proposal-line-mark">
                              {entry.type === "added"
                                ? "+"
                                : entry.type === "removed"
                                  ? "−"
                                  : " "}
                            </span>
                            <span>{entry.text || " "}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="proposal-note">
                        A IA respondeu à conversa, mas não propôs mudança no texto da instrução.
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="instruction-textarea instruction-textarea-large"
                    value={draft.content ?? ""}
                    onChange={(event) =>
                      onDraftChange({ ...draft, content: event.target.value })
                    }
                    onSelect={(event) => {
                      const selectedText = event.target.value.slice(
                        event.target.selectionStart,
                        event.target.selectionEnd,
                      );
                      setSelectedExcerpt(selectedText.trim());
                    }}
                  />
                )}
              </div>
              <small>
                Edite livremente, revise a estrutura e depois salve. O conteúdo continua em
                Markdown.
              </small>
            </label>
          </section>

          <aside className="instruction-assistant-panel">
            <div className="assistant-header">
              <h3>Melhorar com IA</h3>
              <p>
                Converse com a instrução, peça ajustes e revise a proposta antes de aceitar.
              </p>
            </div>

            <div className="assistant-history">
              {aiHistory.length === 0 ? (
                <div className="assistant-empty">
                  <strong>Nenhuma melhoria pedida ainda.</strong>
                  <p>Use esse painel para conversar com a instrução e ir refinando o texto.</p>
                </div>
              ) : (
                aiHistory.map((entry, index) => (
                  <article
                    className={`assistant-message assistant-message-${entry.role}`}
                    key={`${entry.role}-${index}`}
                  >
                    <strong>{entry.role === "user" ? "Você" : "IA"}</strong>
                    <p>{entry.content}</p>
                  </article>
                ))
              )}
            </div>

            <div className="assistant-composer">
              <textarea
                ref={composerRef}
                className="assistant-textarea assistant-textarea-composer"
                value={aiPrompt}
                onChange={(event) => onAiPromptChange(event.target.value)}
                placeholder="Peça alterações, pergunte o que mudou ou cole um objetivo de revisão. Ex.: deixe a instrução mais objetiva e reescreva apenas o trecho selecionado."
              />
              <button
                className="primary-button primary-button-block"
                onClick={onImproveWithAi}
                disabled={aiBusy}
              >
                {aiBusy ? "Melhorando..." : "Enviar para IA"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TemplateManagerModal({
  open,
  templates,
  defaultTemplateFileName,
  onClose,
  onSelectDefault,
  onImport,
  onResetBuiltIns,
  onDelete
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-card-wide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Templates</h2>
          <div className="inline-actions">
            <button className="secondary-button" onClick={onResetBuiltIns}>
              Restaurar padrões
            </button>
            <button className="secondary-button" onClick={onImport}>
              Importar template
            </button>
            <button className="ghost-button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        <div className="instructions-list">
          {templates.map((template) => (
            <div className="instruction-row" key={template.fileName}>
              <label className="instruction-choice">
                <input
                  type="radio"
                  name="default-template"
                  checked={defaultTemplateFileName === template.fileName}
                  onChange={() => onSelectDefault(template.fileName)}
                />
                <span>
                  <strong>{getTemplateLabel(template)}</strong>
                  <small>
                    {template.isBuiltIn ? "Template padrão do app" : "Arquivo salvo em templates/"}
                  </small>
                </span>
              </label>

              <div className="inline-actions template-row-actions">
                <button
                  className="ghost-button"
                  onClick={() => onDelete(template)}
                  disabled={template.isBuiltIn}
                  title={
                    template.isBuiltIn
                      ? "Os templates padrão do app não podem ser removidos."
                      : "Remover template"
                  }
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourcesCard({
  files,
  documentType,
  onToggleActive,
  onRemoveFile,
  onPick,
}) {
  const activeCount = files.filter((file) => file.active).length;
  const sortedFiles = sortFiles(files, "modified-desc");
  const documentTypeConfig = getDocumentTypeConfig(documentType);
  const isLimited = Number.isInteger(documentTypeConfig.maxFiles);

  return (
    <section className="panel workspace-panel">
      <div className="panel-heading">
        <div>
          <h2>Fontes</h2>
          <p className="panel-copy">
            {isLimited
              ? `Use até ${documentTypeConfig.maxFiles} arquivos \`.pptx\` para montar um único plano.`
              : "Use quantos arquivos `.pptx` precisar para montar o planejamento."}
          </p>
        </div>
        <div className="panel-count">
          <strong>
            {isLimited ? `${activeCount}/${documentTypeConfig.maxFiles}` : activeCount}
          </strong>
          <span>fontes ativas</span>
        </div>
      </div>

      <div className="toolbar">
        <button className="primary-button" onClick={onPick}>
          Selecionar arquivos
        </button>
      </div>

      {sortedFiles.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum arquivo selecionado.</strong>
          <p>
            {isLimited
              ? `Escolha de 1 a ${documentTypeConfig.maxFiles} arquivos \`.pptx\` para alimentar o plano.`
              : "Escolha os arquivos `.pptx` para alimentar o planejamento."}
          </p>
        </div>
      ) : (
        <div className="file-table">
          <div className="file-table-head">
            <span>Usar</span>
            <span>Arquivo</span>
            <span>Modificado em</span>
            <span></span>
          </div>

          {sortedFiles.map((file) => (
            <div
              className={`file-table-row ${file.active ? "active" : ""}`}
              key={file.path}
            >
              <label className="check-cell">
                <input
                  type="checkbox"
                  checked={Boolean(file.active)}
                  onChange={() => onToggleActive(file.path)}
                />
              </label>
              <div className="file-main">
                <strong>{file.name || getBaseName(file.path)}</strong>
                <span>{file.path}</span>
              </div>
              <span className="file-date">
                {formatModifiedDate(file.modifiedAt)}
              </span>
              <button
                className="ghost-button ghost-button-small"
                onClick={() => onRemoveFile(file.path)}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="selection-footer">
        <span>{activeCount} arquivo(s) entram na geração</span>
        <span>{files.length - activeCount} fora do plano</span>
      </div>
    </section>
  );
}

function PlanConfigCard({
  planConfig,
  onPlanConfigChange,
  onClearFields,
  onProfessorBlur,
  defaultInstructionFileName,
  availableInstructions,
  onSelectDefaultInstruction,
  onOpenManager,
  defaultTemplateFileName,
  availableTemplates,
  onSetDefaultTemplate,
  onOpenTemplateManager,
  outputDir,
  onChangeOutputDirectory,
}) {
  const isBimestral = planConfig.documentType === "planejamento_bimestral";
  return (
    <section className="panel sidebar-panel">
      <div className="panel-heading">
        <div>
          <h2>Configuração</h2>
          <p className="panel-copy">
            Defina os campos de saída do documento antes de gerar.
          </p>
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Tipo de documento</span>
          <select
            value={planConfig.documentType || "plano_aula"}
            onChange={(event) =>
              onPlanConfigChange({ documentType: event.target.value })
            }
          >
            {DOCUMENT_TYPES.map((documentType) => (
              <option key={documentType.value} value={documentType.value}>
                {documentType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Professor</span>
          <input
            type="text"
            value={planConfig.professor}
            onChange={(event) =>
              onPlanConfigChange({ professor: event.target.value })
            }
            onBlur={(event) => onProfessorBlur(event.target.value)}
            placeholder="Nome do professor"
          />
        </label>

        <label className="field">
          <span>Turmas</span>
          <input
            type="text"
            value={planConfig.turmas}
            onChange={(event) =>
              onPlanConfigChange({ turmas: event.target.value })
            }
            placeholder="Ano/série e segmento"
          />
        </label>
      </div>

      <div className="field-row">
        <div>
          <label className="field">
            <span className="field-label-with-tip">
              Instrução ativa
              <InfoTip text="Define as regras que a IA vai seguir para interpretar os arquivos e escrever o plano de aula." />
            </span>
            <select
              value={defaultInstructionFileName || ""}
              onChange={(event) =>
                onSelectDefaultInstruction(event.target.value)
              }
            >
              {availableInstructions.map((instruction) => (
                <option key={instruction.fileName} value={instruction.fileName}>
                  {getInstructionLabel(instruction)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="ghost-button ghost-button-wide"
            onClick={onOpenManager}
          >
            Gerenciar instruções
          </button>
        </div>

        <div>
          <label className="field">
            <span className="field-label-with-tip">
              Template
              <InfoTip text="É o modelo .docx usado como base do documento final, com a estrutura visual e os campos preenchidos automaticamente." />
            </span>
            <select
              value={defaultTemplateFileName || ""}
              onChange={(event) => onSetDefaultTemplate(event.target.value)}
            >
              {availableTemplates.map((template) => (
                <option key={template.fileName} value={template.fileName}>
                  {getTemplateLabel(template)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="ghost-button ghost-button-wide"
            onClick={onOpenTemplateManager}
          >
            Gerenciar templates
          </button>
        </div>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Período de</span>
          <input
            type="date"
            value={planConfig.dataDe}
            onChange={(event) =>
              onPlanConfigChange({ dataDe: event.target.value })
            }
          />
        </label>

        {isBimestral ? (
          <label className="field">
            <span>Cadência</span>
            <select
              value={planConfig.cadencia || "semanal"}
              onChange={(event) =>
                onPlanConfigChange({ cadencia: event.target.value })
              }
            >
              {CADENCE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={Boolean(option.disabled)}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>Quantidade de aulas</span>
            <input
              type="number"
              min="1"
              max="99"
              value={planConfig.quantidadeAulas}
              onChange={(event) =>
                onPlanConfigChange({ quantidadeAulas: event.target.value, dataAte: "" })
              }
              placeholder="1"
            />
          </label>
        )}

        {isBimestral ? (
          <label className="field">
            <span>Planejar por</span>
            <select
              value={planConfig.scheduleMode || "quantidade"}
              onChange={(event) => {
                const scheduleMode = event.target.value;
                onPlanConfigChange({
                  scheduleMode,
                  quantidadeAulas:
                    scheduleMode === "data_fim" ? "" : planConfig.quantidadeAulas,
                  dataAte: scheduleMode === "quantidade" ? "" : planConfig.dataAte,
                });
              }}
            >
              {SCHEDULE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>Período até</span>
            <input
              type="date"
              value={planConfig.dataAte}
              onChange={(event) =>
                onPlanConfigChange({ dataAte: event.target.value, quantidadeAulas: "" })
              }
            />
          </label>
        )}

        {isBimestral ? (
          (planConfig.scheduleMode || "quantidade") === "quantidade" ? (
            <label className="field">
              <span>Quantidade de aulas</span>
              <input
                type="number"
                min="1"
                max="99"
                value={planConfig.quantidadeAulas}
                onChange={(event) =>
                  onPlanConfigChange({ quantidadeAulas: event.target.value, dataAte: "" })
                }
                placeholder="1"
              />
            </label>
          ) : (
            <label className="field">
              <span>Período até</span>
              <input
                type="date"
                value={planConfig.dataAte}
                onChange={(event) =>
                  onPlanConfigChange({ dataAte: event.target.value, quantidadeAulas: "" })
                }
              />
            </label>
          )
        ) : null}
      </div>

      <button className="ghost-button ghost-button-wide" onClick={onClearFields}>
        Limpar campos
      </button>

      <div className="config-output-card">
        <strong>Salvar documento em</strong>
        <span>{outputDir || "—"}</span>
        <button
          className="secondary-button"
          onClick={onChangeOutputDirectory}
          type="button"
        >
          Selecionar pasta de saída
        </button>
      </div>
    </section>
  );
}

function ResultSection({ busy, status, result, onRevealOutput }) {
  const tone = getStatusTone({ busy, result, status });
  const showBanner =
    busy || Boolean(status) || tone === "success" || tone === "warn" || tone === "error";

  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <h2>Resultado</h2>
      </div>

      {showBanner ? (
        <div className={`status-banner ${tone}`}>
          <strong>{busy ? "Gerando plano de aula..." : status}</strong>
        </div>
      ) : null}

      {!result ? (
        <div className="empty-state empty-state-result">
          <div className="empty-state-mark">Plano</div>
          <div>
            <strong>Nenhum plano gerado ainda.</strong>
            <p>Quando a geração terminar, o documento final aparece aqui.</p>
          </div>
        </div>
      ) : (
        <div className="result-layout">
          <div className="result-meta-card">
            <div className="meta-stack">
              <div>
                <span>Total gerado</span>
                <strong>{result.count} arquivo(s)</strong>
              </div>
              <div>
                <span>Falhas</span>
                <strong>{result.failedCount ?? 0}</strong>
              </div>
              <div>
                <span>Modelo</span>
                <strong>{result.model}</strong>
              </div>
              <div>
                <span>Instrução</span>
                <strong>{result.instructionFileName}</strong>
              </div>
            </div>
          </div>

          <div className="result-stream">
            {result.items.length > 0 ? (
              <div className="document-list">
                {result.items.map((item) => (
                  <article className="document-card" key={item.outputPath}>
                    <div className="document-copy">
                      <h3>{item.summary.tema}</h3>
                      <p>
                        {item.summary.disciplina} • {item.summary.turma}
                      </p>
                      <code>{item.outputPath}</code>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => onRevealOutput(item.outputPath)}
                    >
                      Mostrar na pasta
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {(result.failures?.length ?? 0) > 0 ? (
              <div className="failure-list">
                {result.failures.map((failure) => (
                  <div className="failure-item" key={failure.inputPath}>
                    <p>
                      <strong>{failure.fileName}</strong>
                    </p>
                    <p>{failure.message}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [appState, setAppState] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sortBy, setSortBy] = useState("modified-desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [fontScalePreview, setFontScalePreview] = useState(null);
  const [instructionManagerOpen, setInstructionManagerOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: "",
    model: "gpt-5.4-mini",
    fontScale: 100,
    documentType: "plano_aula",
    professorName: "",
    defaultTemplateFileName: "",
    apiKeyConfigured: false,
  });
  const [planConfig, setPlanConfig] = useState({
    documentType: "plano_aula",
    professor: "",
    turmas: "",
    quantidadeAulas: "",
    dataDe: "",
    dataAte: "",
    scheduleMode: "quantidade",
    cadencia: "semanal",
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [instructionDraft, setInstructionDraft] = useState({
    fileName: "",
    content: "",
  });
  const [instructionAiPrompt, setInstructionAiPrompt] = useState("");
  const [instructionAiHistory, setInstructionAiHistory] = useState([]);
  const [instructionAiBusy, setInstructionAiBusy] = useState(false);
  const [instructionAiProposal, setInstructionAiProposal] = useState(null);
  const [instructionAiSelectedExcerpt, setInstructionAiSelectedExcerpt] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const nextState = await getPlanoLeveApi().getAppState();
        setAppState(nextState);
        setSettings(nextState.settings);
        setPlanConfig({
          documentType: nextState.settings.documentType || "plano_aula",
          professor: nextState.settings.professorName || "",
          turmas: nextState.settings.planTurmas || "",
          quantidadeAulas: nextState.settings.planQuantidadeAulas ?? "1",
          dataDe: nextState.settings.planDataDe || "",
          dataAte: nextState.settings.planDataAte || "",
          scheduleMode: nextState.settings.planScheduleMode || "quantidade",
          cadencia: nextState.settings.planCadencia || "semanal",
        });
      } catch (error) {
        setStatus(error.message || "Não foi possível inicializar o app.");
      }
    }

    load();
  }, []);

  useEffect(() => {
    const scale = Math.min(
      160,
      Math.max(75, Number(fontScalePreview ?? settings.fontScale) || 100),
    );
    document.documentElement.style.fontSize = `${scale}%`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontScalePreview, settings.fontScale]);

  async function refreshState() {
    const nextState = await getPlanoLeveApi().getAppState();
    setAppState(nextState);
    setSettings(nextState.settings);
    return nextState;
  }

  useEffect(() => {
    if (!instructionManagerOpen) {
      return;
    }

    const selectedInstruction = (appState?.instructions ?? []).find(
      (instruction) => instruction.fileName === settings.defaultInstructionFileName,
    );

    if (selectedInstruction) {
      setInstructionDraft({
        fileName: selectedInstruction.fileName,
        content: selectedInstruction.content,
      });
      setInstructionAiProposal(null);
      setInstructionAiSelectedExcerpt("");
    }
  }, [instructionManagerOpen, appState, settings.defaultInstructionFileName]);

  useEffect(() => {
    const documentType = planConfig.documentType || settings.documentType || "plano_aula";
    const maxFiles = getDocumentTypeConfig(documentType).maxFiles;
    if (!Number.isInteger(maxFiles)) {
      return;
    }
    if (selectedFiles.length <= maxFiles) {
      return;
    }

    setSelectedFiles((current) => current.slice(0, maxFiles));
    setStatus(`O tipo "Plano de aula" aceita no máximo ${maxFiles} arquivos ativos.`);
  }, [planConfig.documentType, selectedFiles.length, settings.documentType]);

  useEffect(() => {
    const documentType = planConfig.documentType || settings.documentType || "plano_aula";
    const filteredInstructions = filterInstructionsByDocumentType(
      appState?.instructions ?? [],
      documentType,
    );
    const filteredTemplates = filterTemplatesByDocumentType(
      appState?.templates ?? [],
      documentType,
    );

    const instructionIsValid = filteredInstructions.some(
      (instruction) => instruction.fileName === settings.defaultInstructionFileName,
    );
    const templateIsValid = filteredTemplates.some(
      (template) => template.fileName === settings.defaultTemplateFileName,
    );

    if (!instructionIsValid && filteredInstructions[0]?.fileName) {
      void handleSetDefaultInstruction(filteredInstructions[0].fileName);
    }
    if (!templateIsValid && filteredTemplates[0]?.fileName) {
      void handleSetDefaultTemplate(filteredTemplates[0].fileName);
    }
  }, [
    appState,
    planConfig.documentType,
    settings.defaultInstructionFileName,
    settings.defaultTemplateFileName,
    settings.documentType,
  ]);

  async function handlePickFile() {
    try {
      setStatus("Abrindo seletor de arquivo...");
      const api = getPlanoLeveApi();
      const picked =
        (await api.pickInputFiles?.()) ??
        (() => {
          throw new Error(
            "O preload atual não expõe seleção múltipla. Reinicie o app para atualizar o processo Electron.",
          );
        })();

      if (picked.length === 0) {
        setStatus("Seleção cancelada.");
        return;
      }

      const merged = mergeFiles(selectedFiles, picked);
      const documentType = planConfig.documentType || settings.documentType || "plano_aula";
      const documentTypeConfig = getDocumentTypeConfig(documentType);
      const maxFiles = documentTypeConfig.maxFiles;
      const limited = Number.isInteger(maxFiles) ? merged.slice(0, maxFiles) : merged;
      setSelectedFiles(limited);
      if (Number.isInteger(maxFiles) && merged.length > maxFiles) {
        setStatus(
          `Use no máximo ${maxFiles} arquivos para plano de aula. Os excedentes foram ignorados.`,
        );
      } else {
        setStatus(`${picked.length} arquivo(s) adicionado(s).`);
      }

      const detected = await api.detectPlanFields?.({
        documentType,
        inputPaths: limited
          .filter((file) => file.active)
          .map((file) => file.path),
      });
      if (detected?.turmas && !String(planConfig.turmas || "").trim()) {
        applyPlanConfigPatch({ turmas: detected.turmas });
      }
    } catch (error) {
      setStatus(
        error.message || "Não foi possível abrir o seletor de arquivo.",
      );
    }
  }

  async function handleSaveSettings(nextSettings) {
    try {
      const saved = await getPlanoLeveApi().saveSettings(nextSettings);
      setSettings(saved);
      setPlanConfig((current) => ({
        ...current,
        professor: current.professor || saved.professorName || "",
        turmas: current.turmas || saved.planTurmas || "",
        quantidadeAulas: current.quantidadeAulas ?? saved.planQuantidadeAulas ?? "1",
        dataDe: current.dataDe || saved.planDataDe || "",
        dataAte: current.dataAte || saved.planDataAte || "",
        scheduleMode: current.scheduleMode || saved.planScheduleMode || "quantidade",
        cadencia: current.cadencia || saved.planCadencia || "semanal",
      }));
      setFontScalePreview(null);
      setModalOpen(false);
      setStatus("Configuração salva com sucesso.");
    } catch (error) {
      setStatus(error.message || "Não foi possível salvar a configuração.");
      throw error;
    }
  }

  async function persistProfessorName(nextProfessor) {
    const normalized = String(nextProfessor || "").trim();
    if (normalized === String(settings.professorName || "").trim()) {
      return;
    }

    try {
      const saved = await getPlanoLeveApi().saveSettings({
        ...settings,
        professorName: normalized,
      });
      setSettings(saved);
    } catch (error) {
      setStatus(
        error.message || "Não foi possível salvar o nome do professor.",
      );
    }
  }

  async function persistPlanConfig(nextConfig) {
    try {
      const saved = await getPlanoLeveApi().saveSettings({
        ...settings,
        documentType: String(nextConfig.documentType || "plano_aula").trim() || "plano_aula",
        professorName: String(nextConfig.professor || "").trim(),
        planTurmas: String(nextConfig.turmas || "").trim(),
        planQuantidadeAulas: String(nextConfig.quantidadeAulas ?? "").trim(),
        planDataDe: String(nextConfig.dataDe || "").trim(),
        planDataAte: String(nextConfig.dataAte || "").trim(),
        planScheduleMode:
          String(nextConfig.scheduleMode || "quantidade").trim() || "quantidade",
        planCadencia: String(nextConfig.cadencia || "semanal").trim() || "semanal",
      });
      setSettings(saved);
    } catch (error) {
      setStatus(
        error.message || "Não foi possível salvar a configuração do plano.",
      );
    }
  }

  function applyPlanConfigPatch(patch) {
    setPlanConfig((current) => {
      const nextConfig =
        typeof patch === "function" ? patch(current) : { ...current, ...patch };
      void persistPlanConfig(nextConfig);
      return nextConfig;
    });
  }

  async function handleSetDefaultInstruction(fileName) {
    const saved = await getPlanoLeveApi().setDefaultInstruction(fileName);
    setSettings((current) => ({
      ...current,
      defaultInstructionFileName: saved.defaultInstructionFileName,
    }));
    setInstructionAiHistory([]);
    setInstructionAiPrompt("");
    setInstructionAiProposal(null);
    setInstructionAiSelectedExcerpt("");
    await refreshState();
    setStatus(`Instrução default definida para ${fileName}.`);
  }

  async function handleSetDefaultTemplate(fileName) {
    const saved = await getPlanoLeveApi().setDefaultTemplate(fileName);
    setSettings((current) => ({
      ...current,
      defaultTemplateFileName: saved.defaultTemplateFileName,
    }));
    await refreshState();
    setStatus(`Template padrão definido para ${fileName}.`);
  }

  async function handleSaveInstruction(nextDraft) {
    if (!nextDraft.fileName.trim()) {
      setStatus("Defina um nome de arquivo para a instrução.");
      return;
    }

    const saved = await getPlanoLeveApi().saveInstruction(nextDraft);
    await getPlanoLeveApi().setDefaultInstruction(saved.fileName);
    const nextState = await refreshState();
    const selectedInstruction =
      nextState.instructions.find(
        (instruction) => instruction.fileName === saved.fileName,
      ) || saved;
    setInstructionDraft({
      fileName: selectedInstruction.fileName,
      content: selectedInstruction.content ?? nextDraft.content,
    });
    setInstructionAiProposal(null);
    setStatus(`Instrução salva em instrucoes/${saved.fileName}.`);
  }

  async function handleResetDefaultInstruction() {
    const saved = await getPlanoLeveApi().resetDefaultInstruction(
      instructionDraft.fileName,
    );
    await refreshState();
    setInstructionDraft({
      fileName: saved.fileName,
      content: saved.content,
    });
    setInstructionAiProposal(null);
    setInstructionAiHistory([]);
    setInstructionAiPrompt("");
    setInstructionAiSelectedExcerpt("");
    setStatus(`Instrução padrão restaurada em instrucoes/${saved.fileName}.`);
  }

  async function handleImproveInstructionWithAi() {
    if (!instructionAiPrompt.trim()) {
      setStatus("Descreva a melhoria que você quer aplicar na instrução.");
      return;
    }

    const requestText = instructionAiPrompt.trim();
    const nextUserMessage = { role: "user", content: requestText };
    const nextHistory = [...instructionAiHistory, nextUserMessage];
    setInstructionAiBusy(true);
    setInstructionAiHistory(nextHistory);
    setInstructionAiPrompt("");

    try {
      const improved = await getPlanoLeveApi().improveInstruction({
        fileName: instructionDraft.fileName,
        content: instructionDraft.content,
        request: requestText,
        selectedExcerpt: instructionAiSelectedExcerpt,
        history: nextHistory,
      });

      setInstructionAiHistory((current) => [
        ...current,
        { role: "assistant", content: improved.summary },
      ]);
      setInstructionAiProposal(
        improved.didChangeContent
          ? {
              summary: improved.summary,
              didChangeContent: true,
              baseContent: instructionDraft.content,
              revisedContent: improved.revisedContent,
            }
          : null,
      );
      setInstructionAiSelectedExcerpt("");
      setStatus(
        improved.didChangeContent
          ? "A IA preparou uma revisão. Revise e aceite ou descarte a correção."
          : "A IA respondeu à conversa sem alterar o texto da instrução.",
      );
    } catch (error) {
      setStatus(error.message || "Não foi possível melhorar a instrução com IA.");
    } finally {
      setInstructionAiBusy(false);
    }
  }

  async function handleDeleteInstruction(fileName) {
    if (!fileName) {
      return;
    }

    try {
      await getPlanoLeveApi().deleteInstruction(fileName);
      const nextState = await refreshState();
      const fallbackInstruction =
        nextState.instructions.find(
          (instruction) =>
            instruction.fileName === nextState.settings.defaultInstructionFileName,
        ) || nextState.instructions[0];

      setInstructionDraft({
        fileName: fallbackInstruction?.fileName || "",
        content: fallbackInstruction?.content || "",
      });
      setInstructionAiHistory([]);
      setInstructionAiPrompt("");
      setInstructionAiProposal(null);
      setInstructionAiSelectedExcerpt("");
      setStatus(`Instrução removida: ${fileName}.`);
    } catch (error) {
      setStatus(error.message || "Não foi possível remover a instrução.");
    }
  }

  function handleAcceptAiProposal() {
    if (!instructionAiProposal?.didChangeContent) {
      setInstructionAiProposal(null);
      return;
    }

    setInstructionDraft((current) => ({
      ...current,
      content: instructionAiProposal.revisedContent,
    }));
    setInstructionAiProposal(null);
    setStatus("Correção aplicada ao editor. Salve a instrução quando estiver satisfeito.");
  }

  function handleRejectAiProposal() {
    setInstructionAiProposal(null);
    setStatus("Revisão descartada.");
  }

  function handleSeedPromptFromSelection(selectedExcerpt) {
    const nextExcerpt = String(selectedExcerpt || "").trim();
    if (!nextExcerpt) {
      return;
    }

    setInstructionAiSelectedExcerpt(nextExcerpt);
    setInstructionAiPrompt(
      [
        "Quero melhorar apenas este trecho da instrução, preservando o restante do arquivo.",
        "",
        "Trecho selecionado:",
        '"""',
        nextExcerpt,
        '"""',
        "",
        "Objetivo da revisão:",
      ].join("\n"),
    );
    setStatus("Trecho enviado para a caixa de conversa da IA.");
  }

  function handleInstructionDraftChange(nextDraft) {
    setInstructionDraft(nextDraft);
    setInstructionAiProposal(null);
  }

  async function handleGenerate() {
    const documentType = planConfig.documentType || "plano_aula";
    const isBimestral = documentType === "planejamento_bimestral";
    const scheduleMode = planConfig.scheduleMode || "quantidade";
    const inputPaths = selectedFiles
      .filter((file) => file.active)
      .map((file) => file.path);

    if (inputPaths.length === 0) {
      setStatus("Selecione pelo menos um arquivo .pptx antes de gerar.");
      return;
    }
    if (isBimestral && !String(planConfig.dataDe || "").trim()) {
      setStatus("No planejamento bimestral, informe a data inicial em 'Período de'.");
      return;
    }
    if (
      isBimestral &&
      scheduleMode === "quantidade" &&
      !(Number(planConfig.quantidadeAulas) > 0)
    ) {
      setStatus("Informe uma quantidade de aulas válida (maior que zero).");
      return;
    }
    if (
      isBimestral &&
      scheduleMode === "data_fim" &&
      !String(planConfig.dataAte || "").trim()
    ) {
      setStatus("No modo por data final, informe o campo 'Período até'.");
      return;
    }

    setBusy(true);
    setStatus(
      documentType === "planejamento_bimestral"
        ? "Gerando planejamento bimestral com IA..."
        : "Gerando plano de aula com IA...",
    );
    setResult(null);

    try {
      await persistPlanConfig(planConfig);
      const api = getPlanoLeveApi();
      const dataAte = isBimestral
        ? scheduleMode === "data_fim"
          ? planConfig.dataAte
          : ""
        : planConfig.dataAte || planConfig.dataDe;
      const generation =
        (await api.generatePlans?.({
          documentType,
          inputPaths,
          outputConfig: {
            professor: planConfig.professor,
            turmas: planConfig.turmas,
            quantidadeAulas: planConfig.quantidadeAulas,
            dataDe: planConfig.dataDe,
            dataAte,
            scheduleMode: planConfig.scheduleMode || "quantidade",
            cadencia: planConfig.cadencia || "semanal",
          },
        })) ??
        (() => {
          throw new Error(
            "O preload atual não expõe geração do plano. Reinicie o app para atualizar o processo Electron.",
          );
        })();
      setResult(generation);
      if ((generation.failedCount ?? 0) === 0) {
        setStatus(
          documentType === "planejamento_bimestral"
            ? "Planejamento bimestral gerado com sucesso."
            : "Plano de aula gerado com sucesso.",
        );
      } else if ((generation.count ?? 0) === 0) {
        const firstFailureMessage = generation.failures?.[0]?.message;
        setStatus(firstFailureMessage || "Nenhum plano foi gerado.");
      } else {
        setStatus("Plano gerado com alertas.");
      }
      await refreshState();
    } catch (error) {
      setStatus(error.message || "Não foi possível gerar o plano.");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeDirectory(kind) {
    try {
      const nextDir = await getPlanoLeveApi().pickDirectory(kind);
      if (!nextDir) {
        setStatus("Seleção de pasta cancelada.");
        return;
      }

      const nextSettings = {
        ...settings,
        [kind === "output" ? "outputDir" : "inputDir"]: nextDir,
      };
      const saved = await getPlanoLeveApi().saveSettings(nextSettings);
      setSettings(saved);
      await refreshState();
      setStatus(
        kind === "output" ? "Pasta de saída atualizada." : "Pasta atualizada.",
      );
    } catch (error) {
      setStatus(error.message || "Não foi possível atualizar a pasta.");
    }
  }

  async function handlePickTemplate() {
    try {
      const sourcePath = await getPlanoLeveApi().pickTemplateFile();
      if (!sourcePath) {
        setStatus("Seleção de template cancelada.");
        return;
      }

      const imported = await getPlanoLeveApi().importTemplate(sourcePath);
      await refreshState();
      await handleSetDefaultTemplate(imported.fileName);
      setStatus(`Template importado em templates/${imported.fileName}.`);
    } catch (error) {
      setStatus(error.message || "Não foi possível importar o template.");
    }
  }

  async function handleDeleteTemplate(template) {
    if (!template?.fileName) {
      return;
    }

    try {
      await getPlanoLeveApi().deleteTemplate(template.fileName);
      await refreshState();
      setStatus(`Template removido: ${template.fileName}.`);
    } catch (error) {
      setStatus(error.message || "Não foi possível remover o template.");
    }
  }

  async function handleResetBuiltInTemplates() {
    try {
      await getPlanoLeveApi().resetBuiltInTemplates();
      await refreshState();
      setStatus(
        "Templates padrão restaurados: modelo com âncoras, Bertioga, José da Costa e Planejamento Bimestral Bertioga.",
      );
    } catch (error) {
      setStatus(error.message || "Não foi possível restaurar os templates padrão.");
    }
  }

  function handleClearPlanFields() {
    applyPlanConfigPatch({
      professor: "",
      turmas: "",
      quantidadeAulas: "",
      dataDe: "",
      dataAte: "",
      scheduleMode: "quantidade",
      cadencia: "semanal",
    });
    setStatus("Campos da configuração limpos.");
  }

  const activeDocumentType = planConfig.documentType || settings.documentType || "plano_aula";
  const availableInstructions = filterInstructionsByDocumentType(
    appState?.instructions ?? [],
    activeDocumentType,
  );
  const availableTemplates = filterTemplatesByDocumentType(
    appState?.templates ?? [],
    activeDocumentType,
  );
  const activeCount = selectedFiles.filter((file) => file.active).length;
  const maxFiles = getDocumentTypeConfig(activeDocumentType).maxFiles;
  const canGenerate =
    activeCount > 0 &&
    (!Number.isInteger(maxFiles) || activeCount <= maxFiles) &&
    !busy;

  return (
    <div className="app-shell">
      <main className="main-layout">
        <header className="topbar-minimal">
          <h1>🪶 Plano de Aula Leve</h1>
          <button className="ghost-button" onClick={() => setModalOpen(true)}>
            Ajustes
          </button>
        </header>

        <SourcesCard
          files={selectedFiles}
          documentType={activeDocumentType}
          onToggleActive={(targetPath) =>
            setSelectedFiles((current) =>
              current.map((file) =>
                file.path === targetPath
                  ? { ...file, active: !file.active }
                  : file,
              ),
            )
          }
          onRemoveFile={(targetPath) =>
            setSelectedFiles((current) =>
              current.filter((file) => file.path !== targetPath),
            )
          }
          onPick={handlePickFile}
        />

        <PlanConfigCard
          planConfig={planConfig}
          onPlanConfigChange={applyPlanConfigPatch}
          onClearFields={handleClearPlanFields}
          onProfessorBlur={persistProfessorName}
          defaultInstructionFileName={settings.defaultInstructionFileName}
          availableInstructions={availableInstructions}
          onSelectDefaultInstruction={handleSetDefaultInstruction}
          onOpenManager={() => setInstructionManagerOpen(true)}
          defaultTemplateFileName={settings.defaultTemplateFileName}
          availableTemplates={availableTemplates}
          onSetDefaultTemplate={handleSetDefaultTemplate}
          onOpenTemplateManager={() => setTemplateManagerOpen(true)}
          outputDir={appState?.projectPaths?.saidasDir}
          onChangeOutputDirectory={() => handleChangeDirectory("output")}
        />

        <div className="generate-wrapper">
          <button
            className="primary-button primary-button-block primary-button-large"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {busy ? "Gerando..." : "Gerar"}
          </button>
        </div>

        <ResultSection
          busy={busy}
          status={status}
          result={result}
          onRevealOutput={(outputPath) => getPlanoLeveApi().revealPath(outputPath)}
        />
      </main>

      <SettingsModal
        open={modalOpen}
        settings={settings}
        projectPaths={appState?.projectPaths}
        onClose={() => {
          setFontScalePreview(null);
          setModalOpen(false);
        }}
        onSave={handleSaveSettings}
        onPreviewFontScale={setFontScalePreview}
        onChangeDirectory={handleChangeDirectory}
      />
      <InstructionManagerModal
        open={instructionManagerOpen}
        instructions={availableInstructions}
        defaultInstructionFileName={settings.defaultInstructionFileName}
        draft={instructionDraft}
        aiPrompt={instructionAiPrompt}
        aiHistory={instructionAiHistory}
        aiBusy={instructionAiBusy}
        aiProposal={instructionAiProposal}
        onClose={() => setInstructionManagerOpen(false)}
        onSelectDefault={handleSetDefaultInstruction}
        onDraftChange={handleInstructionDraftChange}
        onSave={handleSaveInstruction}
        onDelete={handleDeleteInstruction}
        onNew={() => {
          setInstructionDraft({
            fileName: "nova-instrucao.md",
            content: "",
          });
          setInstructionAiHistory([]);
          setInstructionAiPrompt("");
          setInstructionAiProposal(null);
          setInstructionAiSelectedExcerpt("");
        }}
        onResetDefault={handleResetDefaultInstruction}
        onAiPromptChange={(value) => {
          setInstructionAiPrompt(value);
          if (!String(value || "").trim()) {
            setInstructionAiSelectedExcerpt("");
          }
        }}
        onImproveWithAi={handleImproveInstructionWithAi}
        onAcceptAiProposal={handleAcceptAiProposal}
        onRejectAiProposal={handleRejectAiProposal}
        onSeedPromptFromSelection={handleSeedPromptFromSelection}
      />
      <TemplateManagerModal
        open={templateManagerOpen}
        templates={availableTemplates}
        defaultTemplateFileName={settings.defaultTemplateFileName}
        onClose={() => setTemplateManagerOpen(false)}
        onSelectDefault={handleSetDefaultTemplate}
        onImport={handlePickTemplate}
        onResetBuiltIns={handleResetBuiltInTemplates}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}
