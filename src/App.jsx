import { useEffect, useState } from "react";

const MODEL_OPTIONS = [
  { value: "gpt-5.4-mini", label: "gpt-5.4-mini", hint: "Melhor equilíbrio entre custo e qualidade." },
  { value: "gpt-5.5", label: "gpt-5.5", hint: "Maior qualidade, com custo mais alto." }
];

const SORT_OPTIONS = [
  { value: "modified-desc", label: "Mais recentes" },
  { value: "modified-asc", label: "Mais antigos" },
  { value: "name-asc", label: "Nome A-Z" },
  { value: "name-desc", label: "Nome Z-A" }
];

function getProfeApi() {
  if (!window.profeApi) {
    throw new Error(
      "A ponte do Electron não está disponível. Reinicie o app para carregar o preload atualizado."
    );
  }
  return window.profeApi;
}

function getBaseName(targetPath) {
  return String(targetPath || "").split("/").pop() || targetPath;
}

function mergeFiles(currentFiles, nextFiles) {
  const registry = new Map(currentFiles.map((file) => [file.path, file]));
  for (const file of nextFiles) {
    const current = registry.get(file.path);
    registry.set(file.path, {
      ...file,
      active: current?.active ?? true
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
      timeStyle: "short"
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

function SettingsModal({
  open,
  settings,
  projectPaths,
  onClose,
  onSave,
  onChangeDirectory,
  onPickTemplate,
  onSetDefaultTemplate
}) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

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
              setDraft((current) => ({ ...current, apiKey: event.target.value }))
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
              setDraft((current) => ({ ...current, professorName: event.target.value }))
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
                {option.label}
              </option>
            ))}
          </select>
          <small>
            {MODEL_OPTIONS.find((option) => option.value === draft.model)?.hint}
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
          <p>
            <strong>Template</strong>
            <span>{projectPaths?.defaultTemplatePath || "—"}</span>
          </p>
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
  onClose,
  onSelectDefault,
  onEdit,
  onNew,
  onResetDefault
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Instruções</h2>
          <div className="inline-actions">
            <button className="secondary-button" onClick={onNew}>
              Nova instrução
            </button>
            <button className="secondary-button" onClick={onResetDefault}>
              Resetar padrão
            </button>
            <button className="ghost-button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        <div className="instructions-list">
          {instructions.map((instruction) => (
            <div className="instruction-row" key={instruction.fileName}>
              <label className="instruction-choice">
                <input
                  type="radio"
                  name="default-instruction"
                  checked={defaultInstructionFileName === instruction.fileName}
                  onChange={() => onSelectDefault(instruction.fileName)}
                />
                <span>
                  <strong>{instruction.fileName}</strong>
                  <small>
                    {instruction.isDefaultBuiltIn
                      ? "Instrução padrão do app"
                      : "Arquivo salvo em instrucoes/"}
                  </small>
                </span>
              </label>

              <button className="ghost-button" onClick={() => onEdit(instruction)}>
                Editar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstructionEditorModal({ open, draft, onClose, onChange, onSave }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar instrução</h2>
          <button className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <label className="field">
          <span>Nome do arquivo</span>
          <input
            type="text"
            placeholder="minha-instrucao.md"
            value={draft.fileName ?? ""}
            onChange={(event) => onChange({ ...draft, fileName: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Conteúdo</span>
          <textarea
            className="instruction-textarea"
            value={draft.content ?? ""}
            onChange={(event) => onChange({ ...draft, content: event.target.value })}
          />
        </label>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" onClick={() => onSave(draft)}>
            Salvar instrução
          </button>
        </div>
      </div>
    </div>
  );
}

function SourcesCard({
  files,
  onToggleActive,
  onRemoveFile,
  onPick
}) {
  const activeCount = files.filter((file) => file.active).length;
  const sortedFiles = sortFiles(files, "modified-desc");

  return (
    <section className="panel workspace-panel">
      <div className="panel-heading">
        <div>
          <h2>Fontes</h2>
          <p className="panel-copy">Use até 3 arquivos `.pptx` para montar um único plano.</p>
        </div>
        <div className="panel-count">
          <strong>{activeCount}/3</strong>
          <span>fontes ativas</span>
        </div>
      </div>

      <div className="toolbar">
        <button className="secondary-button" onClick={onPick}>
          Selecionar arquivos
        </button>
      </div>

      {sortedFiles.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum arquivo selecionado.</strong>
          <p>Escolha de 1 a 3 arquivos `.pptx` para alimentar o plano.</p>
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
            <div className={`file-table-row ${file.active ? "active" : ""}`} key={file.path}>
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
              <span className="file-date">{formatModifiedDate(file.modifiedAt)}</span>
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
  onProfessorBlur,
  defaultInstructionFileName,
  availableInstructions,
  onSelectDefaultInstruction,
  onOpenManager,
  defaultTemplateFileName,
  availableTemplates,
  onSetDefaultTemplate,
  onPickTemplate
}) {
  return (
    <section className="panel sidebar-panel">
      <div className="panel-heading">
        <div>
          <h2>Configuração</h2>
          <p className="panel-copy">Defina os campos de saída do documento antes de gerar.</p>
        </div>
      </div>

      <div className="field-row">
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
            <span>Instrução ativa</span>
            <select
              value={defaultInstructionFileName || ""}
              onChange={(event) => onSelectDefaultInstruction(event.target.value)}
            >
              {availableInstructions.map((instruction) => (
                <option key={instruction.fileName} value={instruction.fileName}>
                  {instruction.fileName}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost-button ghost-button-wide" onClick={onOpenManager}>
            Gerenciar instruções
          </button>
        </div>

        <div>
          <label className="field">
            <span>Template</span>
            <select
              value={defaultTemplateFileName || ""}
              onChange={(event) => onSetDefaultTemplate(event.target.value)}
            >
              {availableTemplates.map((template) => (
                <option key={template.fileName} value={template.fileName}>
                  {template.fileName}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost-button ghost-button-wide" onClick={onPickTemplate}>
            Importar template
          </button>
        </div>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Quantidade de aulas</span>
          <input
            type="number"
            min="1"
            max="99"
            value={planConfig.quantidadeAulas}
            onChange={(event) =>
              onPlanConfigChange({ quantidadeAulas: event.target.value })
            }
            placeholder="1"
          />
        </label>

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

        <label className="field">
          <span>Período até</span>
          <input
            type="date"
            value={planConfig.dataAte}
            onChange={(event) =>
              onPlanConfigChange({ dataAte: event.target.value })
            }
          />
        </label>
      </div>
    </section>
  );
}

function ResultSection({ busy, status, result, onOpenOutput }) {
  const tone = getStatusTone({ busy, result, status });
  const showBanner = busy || tone === "success" || tone === "warn" || tone === "error";

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
                      <p>{item.summary.disciplina} • {item.summary.turma}</p>
                      <code>{item.outputPath}</code>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => onOpenOutput(item.outputPath)}
                    >
                      Abrir
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
  const [instructionManagerOpen, setInstructionManagerOpen] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: "",
    model: "gpt-5.4-mini",
    professorName: "",
    defaultTemplateFileName: "",
    apiKeyConfigured: false
  });
  const [planConfig, setPlanConfig] = useState({
    professor: "",
    turmas: "",
    quantidadeAulas: "1",
    dataDe: "",
    dataAte: ""
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [instructionDraft, setInstructionDraft] = useState({
    fileName: "",
    content: ""
  });

  useEffect(() => {
    async function load() {
      try {
        const nextState = await getProfeApi().getAppState();
        setAppState(nextState);
        setSettings(nextState.settings);
        setPlanConfig({
          professor: nextState.settings.professorName || "",
          turmas: nextState.settings.planTurmas || "",
          quantidadeAulas: nextState.settings.planQuantidadeAulas || "1",
          dataDe: nextState.settings.planDataDe || "",
          dataAte: nextState.settings.planDataAte || ""
        });
      } catch (error) {
        setStatus(error.message || "Não foi possível inicializar o app.");
      }
    }

    load();
  }, []);

  async function refreshState() {
    const nextState = await getProfeApi().getAppState();
    setAppState(nextState);
    setSettings(nextState.settings);
    return nextState;
  }

  async function handlePickFile() {
    try {
      setStatus("Abrindo seletor de arquivo...");
      const api = getProfeApi();
      const picked =
        (await api.pickInputFiles?.()) ??
        (() => {
          throw new Error(
            "O preload atual não expõe seleção múltipla. Reinicie o app para atualizar o processo Electron."
          );
        })();

      if (picked.length === 0) {
        setStatus("Seleção cancelada.");
        return;
      }

      const merged = mergeFiles(selectedFiles, picked);
      const limited = merged.slice(0, 3);
      setSelectedFiles(limited);
      if (merged.length > 3) {
        setStatus("Use no máximo 3 arquivos por plano. Os excedentes foram ignorados.");
      } else {
        setStatus(`${picked.length} arquivo(s) adicionado(s).`);
      }

      const detected = await api.detectPlanFields?.({
        inputPaths: limited.filter((file) => file.active).map((file) => file.path)
      });
      if (detected?.turmas && !String(planConfig.turmas || "").trim()) {
        applyPlanConfigPatch({ turmas: detected.turmas });
      }
    } catch (error) {
      setStatus(error.message || "Não foi possível abrir o seletor de arquivo.");
    }
  }

  async function handleSaveSettings(nextSettings) {
    try {
      const saved = await getProfeApi().saveSettings(nextSettings);
      setSettings(saved);
      setPlanConfig((current) => ({
        ...current,
        professor: current.professor || saved.professorName || "",
        turmas: current.turmas || saved.planTurmas || "",
        quantidadeAulas: current.quantidadeAulas || saved.planQuantidadeAulas || "1",
        dataDe: current.dataDe || saved.planDataDe || "",
        dataAte: current.dataAte || saved.planDataAte || ""
      }));
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
      const saved = await getProfeApi().saveSettings({
        ...settings,
        professorName: normalized
      });
      setSettings(saved);
    } catch (error) {
      setStatus(error.message || "Não foi possível salvar o nome do professor.");
    }
  }

  async function persistPlanConfig(nextConfig) {
    try {
      const saved = await getProfeApi().saveSettings({
        ...settings,
        professorName: String(nextConfig.professor || "").trim(),
        planTurmas: String(nextConfig.turmas || "").trim(),
        planQuantidadeAulas: String(nextConfig.quantidadeAulas || "").trim() || "1",
        planDataDe: String(nextConfig.dataDe || "").trim(),
        planDataAte: String(nextConfig.dataAte || "").trim()
      });
      setSettings(saved);
    } catch (error) {
      setStatus(error.message || "Não foi possível salvar a configuração do plano.");
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
    const saved = await getProfeApi().setDefaultInstruction(fileName);
    setSettings((current) => ({
      ...current,
      defaultInstructionFileName: saved.defaultInstructionFileName
    }));
    await refreshState();
    setStatus(`Instrução default definida para ${fileName}.`);
  }

  async function handleSetDefaultTemplate(fileName) {
    const saved = await getProfeApi().setDefaultTemplate(fileName);
    setSettings((current) => ({
      ...current,
      defaultTemplateFileName: saved.defaultTemplateFileName
    }));
    await refreshState();
    setStatus(`Template padrão definido para ${fileName}.`);
  }

  async function handleSaveInstruction(nextDraft) {
    if (!nextDraft.fileName.trim()) {
      setStatus("Defina um nome de arquivo para a instrução.");
      return;
    }

    const saved = await getProfeApi().saveInstruction(nextDraft);
    setEditorOpen(false);
    await refreshState();
    setStatus(`Instrução salva em instrucoes/${saved.fileName}.`);
  }

  async function handleResetDefaultInstruction() {
    const saved = await getProfeApi().resetDefaultInstruction();
    await refreshState();
    setStatus(`Instrução padrão restaurada em instrucoes/${saved.fileName}.`);
  }

  async function handleGenerate() {
    const inputPaths = selectedFiles.filter((file) => file.active).map((file) => file.path);

    if (inputPaths.length === 0) {
      setStatus("Selecione pelo menos um arquivo .pptx antes de gerar.");
      return;
    }

    setBusy(true);
    setStatus("Gerando plano de aula com IA...");
    setResult(null);

    try {
      await persistPlanConfig(planConfig);
      const api = getProfeApi();
      const generation =
        (await api.generatePlans?.({
          inputPaths,
          outputConfig: {
            professor: planConfig.professor,
            turmas: planConfig.turmas,
            quantidadeAulas: planConfig.quantidadeAulas,
            dataDe: planConfig.dataDe,
            dataAte: planConfig.dataAte || planConfig.dataDe
          }
        })) ??
        (() => {
          throw new Error(
            "O preload atual não expõe geração do plano. Reinicie o app para atualizar o processo Electron."
          );
        })();
      setResult(generation);
      if ((generation.failedCount ?? 0) === 0) {
        setStatus("Plano de aula gerado com sucesso.");
      } else if ((generation.count ?? 0) === 0) {
        setStatus("Nenhum plano foi gerado.");
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
      const nextDir = await getProfeApi().pickDirectory(kind);
      if (!nextDir) {
        setStatus("Seleção de pasta cancelada.");
        return;
      }

      const nextSettings = {
        ...settings,
        [kind === "output" ? "outputDir" : "inputDir"]: nextDir
      };
      const saved = await getProfeApi().saveSettings(nextSettings);
      setSettings(saved);
      await refreshState();
      setStatus(kind === "output" ? "Pasta de saída atualizada." : "Pasta atualizada.");
    } catch (error) {
      setStatus(error.message || "Não foi possível atualizar a pasta.");
    }
  }

  async function handlePickTemplate() {
    try {
      const sourcePath = await getProfeApi().pickTemplateFile();
      if (!sourcePath) {
        setStatus("Seleção de template cancelada.");
        return;
      }

      const imported = await getProfeApi().importTemplate(sourcePath);
      await refreshState();
      await handleSetDefaultTemplate(imported.fileName);
      setStatus(`Template importado em templates/${imported.fileName}.`);
    } catch (error) {
      setStatus(error.message || "Não foi possível importar o template.");
    }
  }

  const apiReady = settings.apiKeyConfigured || Boolean(settings.apiKey);
  const availableInstructions = appState?.instructions ?? [];
  const activeCount = selectedFiles.filter((file) => file.active).length;
  const canGenerate = activeCount > 0 && activeCount <= 3 && !busy && apiReady;

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
          onToggleActive={(targetPath) =>
            setSelectedFiles((current) =>
              current.map((file) =>
                file.path === targetPath ? { ...file, active: !file.active } : file
              )
            )
          }
          onRemoveFile={(targetPath) =>
            setSelectedFiles((current) => current.filter((file) => file.path !== targetPath))
          }
          onPick={handlePickFile}
        />

        <PlanConfigCard
          planConfig={planConfig}
          onPlanConfigChange={applyPlanConfigPatch}
          onProfessorBlur={persistProfessorName}
          defaultInstructionFileName={settings.defaultInstructionFileName}
          availableInstructions={availableInstructions}
          onSelectDefaultInstruction={handleSetDefaultInstruction}
          onOpenManager={() => setInstructionManagerOpen(true)}
          defaultTemplateFileName={settings.defaultTemplateFileName}
          availableTemplates={appState?.templates ?? []}
          onSetDefaultTemplate={handleSetDefaultTemplate}
          onPickTemplate={handlePickTemplate}
        />

        <div className="generate-wrapper">
          <button
            className="primary-button primary-button-block primary-button-large"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {busy ? "Gerando..." : "Gerar plano"}
          </button>
        </div>

        <ResultSection
          busy={busy}
          status={status}
          result={result}
          onOpenOutput={(outputPath) => getProfeApi().openPath(outputPath)}
        />
      </main>

      <SettingsModal
        open={modalOpen}
        settings={settings}
        projectPaths={appState?.projectPaths}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSettings}
        onChangeDirectory={handleChangeDirectory}
        onPickTemplate={handlePickTemplate}
        onSetDefaultTemplate={handleSetDefaultTemplate}
      />
      <InstructionManagerModal
        open={instructionManagerOpen}
        instructions={availableInstructions}
        defaultInstructionFileName={settings.defaultInstructionFileName}
        onClose={() => setInstructionManagerOpen(false)}
        onSelectDefault={handleSetDefaultInstruction}
        onEdit={(instruction) => {
          setInstructionDraft({
            fileName: instruction.fileName,
            content: instruction.content
          });
          setInstructionManagerOpen(false);
          setEditorOpen(true);
        }}
        onNew={() => {
          setInstructionDraft({
            fileName: "nova-instrucao.md",
            content: ""
          });
          setInstructionManagerOpen(false);
          setEditorOpen(true);
        }}
        onResetDefault={handleResetDefaultInstruction}
      />
      <InstructionEditorModal
        open={editorOpen}
        draft={instructionDraft}
        onClose={() => setEditorOpen(false)}
        onChange={setInstructionDraft}
        onSave={handleSaveInstruction}
      />
    </div>
  );
}
