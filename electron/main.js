import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { extractPptxText } from "./services/pptx.js";
import { fillTemplate } from "./services/docx-template.js";
import { improveInstruction } from "./services/instruction-assistant.js";
import { generatePlanData } from "./services/openai-plan.js";
import {
  getDefaultInputDir,
  getDefaultOutputDir,
  getProjectPaths,
  seedBundledResources
} from "./services/paths.js";
import {
  DEFAULT_INSTRUCTION_FILE_NAME,
  deleteInstruction,
  ensureDefaultInstructionFile,
  listInstructions,
  readInstruction,
  resetDefaultInstruction,
  saveInstruction
} from "./services/instructions.js";
import {
  BUILT_IN_TEMPLATE_FILE_NAMES,
  DEFAULT_TEMPLATE_FILE_NAME,
  deleteTemplate,
  importTemplate,
  listTemplates,
  resetBuiltInTemplates
} from "./services/templates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFileName = "settings.json";

function ensureTwoDigits(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits.padStart(2, "0").slice(-2);
}

function sanitizeFileNamePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseWords(value) {
  return sanitizeFileNamePart(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function sentenceCaseWords(value) {
  const normalized = sanitizeFileNamePart(value).toLowerCase();
  return normalized.replace(/^[a-z]/, (char) => char.toUpperCase());
}

function humanizeAnoSerie(value) {
  return sentenceCaseWords(String(value || "").replace(/[-_]+/g, " "));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSettingsPath() {
  return path.join(app.getPath("userData"), settingsFileName);
}

async function readSettings() {
  try {
    const raw = await fs.readFile(getSettingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || "",
      model: parsed.model || "gpt-5.4-mini",
      fontScale: Number(parsed.fontScale) || 100,
      professorName: parsed.professorName || "",
      planTurmas: parsed.planTurmas || "",
      planQuantidadeAulas: parsed.planQuantidadeAulas ?? "1",
      planDataDe: parsed.planDataDe || "",
      planDataAte: parsed.planDataAte || "",
      inputDir: parsed.inputDir || getDefaultInputDir(),
      outputDir: parsed.outputDir || getDefaultOutputDir(),
      defaultTemplateFileName:
        parsed.defaultTemplateFileName || DEFAULT_TEMPLATE_FILE_NAME,
      defaultInstructionFileName:
        parsed.defaultInstructionFileName || DEFAULT_INSTRUCTION_FILE_NAME
    };
  } catch {
    return {
      apiKey: "",
      model: "gpt-5.4-mini",
      fontScale: 100,
      professorName: "",
      planTurmas: "",
      planQuantidadeAulas: "1",
      planDataDe: "",
      planDataAte: "",
      inputDir: getDefaultInputDir(),
      outputDir: getDefaultOutputDir(),
      defaultTemplateFileName: DEFAULT_TEMPLATE_FILE_NAME,
      defaultInstructionFileName: DEFAULT_INSTRUCTION_FILE_NAME
    };
  }
}

async function writeSettings(nextSettings) {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(nextSettings, null, 2), "utf8");
  return nextSettings;
}

async function buildOutputPath(planData, projectPaths) {
  const { saidasDir } = projectPaths;
  const disciplinaLabel = titleCaseWords(planData.disciplina || "Disciplina");
  const anoSerieLabel = humanizeAnoSerie(
    planData.anoSerieSlug || planData.turmas || "Ano"
  );
  const aulaNumero = ensureTwoDigits(planData.aulaNumero || "1");
  const baseFileName = `Plano de Aula - ${disciplinaLabel} - ${anoSerieLabel} - Aula ${aulaNumero}`;
  const filePattern = new RegExp(
    `^${escapeRegExp(baseFileName)} - (\\d+)\\.docx$`,
    "i"
  );

  await fs.mkdir(saidasDir, { recursive: true });
  const entries = await fs.readdir(saidasDir, { withFileTypes: true });
  const highestSequence = entries.reduce((highest, entry) => {
    if (!entry.isFile()) {
      return highest;
    }

    const match = entry.name.match(filePattern);
    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]) || 0);
  }, 0);

  const nextSequence = String(highestSequence + 1).padStart(3, "0");
  return path.join(saidasDir, `${baseFileName} - ${nextSequence}.docx`);
}

async function buildInputRecord(targetPath) {
  const stats = await fs.stat(targetPath);
  return {
    name: path.basename(targetPath),
    path: targetPath,
    modifiedAt: stats.mtime.toISOString(),
    modifiedAtMs: stats.mtimeMs
  };
}

function detectTurmasFromText(text) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  const explicitMatch = normalized.match(
    /turmas?\s*[:\-]\s*([^.|\n\r]+?)(?:slide\s+\d+[: ]|$)/i
  );
  if (explicitMatch?.[1]) {
    return explicitMatch[1].trim();
  }

  const matches = [
    ...normalized.matchAll(
      /\b(\d{1,2}\s*(?:º|°|o|ª|a)?\s*(?:ano|anos|serie|série))\b/gi
    )
  ]
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const unique = [...new Set(matches)];
  if (unique.length === 0) {
    return "";
  }

  return unique.slice(0, 3).join(", ");
}

function mapPlanToTemplate(planData) {
  return {
    "{{DISCIPLINA-TITULO}}": planData.disciplinaTitulo,
    "{{PROFESSOR}}": planData.professor,
    "{{TURMAS}}": planData.turmas,
    "{{DISCIPLINA}}": planData.disciplina,
    "{{TEMA_DA_AULA}}": planData.temaDaAula,
    "{{CONTEÚDO}}": planData.conteudo,
    "{{CONTEUDOS}}": planData.conteudo,
    "{{HABILIDADES}}": planData.habilidades,
    "{{METODOLOGIA}}": planData.metodologia,
    "{{DESENVOLVIMENTO}}": planData.metodologia,
    "{{OBJETIVOS}}": planData.objetivos,
    "{{RECURSOS}}": planData.recursos,
    "{{AVALIACAO}}": planData.avaliacao,
    "{{ATIVIDADES_DESENVOLVIDAS}}": planData.metodologia,
    "{{QTD_AULAS}}": planData.quantidadeAulas,
    "{{DATA_DE}}": planData.dataDe,
    "{{DATA-ATÉ}}": planData.dataAte,
    "{{DATA_ATE}}": planData.dataAte
  };
}

async function resolveTemplatePath(projectPaths, fileName) {
  if (fileName) {
    const candidate = path.join(projectPaths.templatesDir, fileName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // arquivo não encontrado — cai no fallback abaixo
    }
  }

  const available = await listTemplates(projectPaths.templatesDir);
  if (available.length > 0) {
    return available[0].path;
  }

  throw new Error(
    "Nenhum template .docx encontrado em templates/. Importe ou adicione um template antes de gerar o plano."
  );
}

function formatPlanDate(value) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
}

function normalizePlanData(planData, outputConfig, settings) {
  const professor =
    String(outputConfig?.professor || "").trim() ||
    String(settings.professorName || "").trim() ||
    planData.professor ||
    "A definir";

  const turmas =
    String(outputConfig?.turmas || "").trim() ||
    String(settings.planTurmas || "").trim() ||
    planData.turmas ||
    "A definir";

  const quantidadeAulas =
    String(outputConfig?.quantidadeAulas || "").trim() ||
    String(settings.planQuantidadeAulas || "").trim() ||
    planData.quantidadeAulas ||
    "A definir";

  const dataDe =
    formatPlanDate(outputConfig?.dataDe) ||
    formatPlanDate(settings.planDataDe) ||
    planData.dataDe ||
    "conforme calendário escolar";

  const dataAte =
    formatPlanDate(outputConfig?.dataAte) ||
    formatPlanDate(settings.planDataAte) ||
    planData.dataAte ||
    dataDe;

  return {
    ...planData,
    professor,
    turmas,
    quantidadeAulas,
    dataDe,
    dataAte
  };
}

async function createMainWindow() {
  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", "electron", "preload.cjs")
    : path.join(__dirname, "..", "electron", "preload.cjs");
  const appIconPath = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", "assets", "icon.png")
    : path.join(__dirname, "..", "assets", "icon.png");

  const window = new BrowserWindow({
    width: 1260,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#efe2c6",
    icon: appIconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.handle("app:get-state", async () => {
  let settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  seedBundledResources(projectPaths);
  await ensureDefaultInstructionFile(projectPaths.instrucoesDir);
  const files = await fs.readdir(projectPaths.entradasDir, { withFileTypes: true });
  const instructions = await listInstructions(projectPaths.instrucoesDir);
  const templates = await listTemplates(projectPaths.templatesDir);

  const instructionExists = instructions.some(
    (instruction) => instruction.fileName === settings.defaultInstructionFileName
  );
  if (!instructionExists && instructions.length > 0) {
    settings = { ...settings, defaultInstructionFileName: instructions[0].fileName };
    await writeSettings(settings);
  }

  const templateExists = templates.some(
    (template) => template.fileName === settings.defaultTemplateFileName
  );
  if (!templateExists && templates.length > 0) {
    settings = { ...settings, defaultTemplateFileName: templates[0].fileName };
    await writeSettings(settings);
  }

  const availableInputs = await Promise.all(
    files
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pptx"))
      .map((entry) => buildInputRecord(path.join(projectPaths.entradasDir, entry.name)))
  );

  return {
    projectPaths,
    settings: {
      ...settings,
      apiKeyConfigured: Boolean(settings.apiKey)
    },
    instructions,
    templates,
    availableInputs
  };
});

ipcMain.handle("settings:get", async () => {
  const settings = await readSettings();
  return {
    ...settings,
    apiKeyConfigured: Boolean(settings.apiKey)
  };
});

ipcMain.handle("settings:save", async (_event, settings) => {
  const trimmed = {
    apiKey: String(settings.apiKey ?? "").trim(),
    model: String(settings.model ?? "gpt-5.4-mini").trim() || "gpt-5.4-mini",
    fontScale: Math.min(160, Math.max(75, Number(settings.fontScale) || 100)),
    professorName: String(settings.professorName ?? "").trim(),
    planTurmas: String(settings.planTurmas ?? "").trim(),
    planQuantidadeAulas: String(settings.planQuantidadeAulas ?? "").trim(),
    planDataDe: String(settings.planDataDe ?? "").trim(),
    planDataAte: String(settings.planDataAte ?? "").trim(),
    inputDir: String(settings.inputDir ?? getDefaultInputDir()).trim() || getDefaultInputDir(),
    outputDir:
      String(settings.outputDir ?? getDefaultOutputDir()).trim() || getDefaultOutputDir(),
    defaultTemplateFileName:
      String(settings.defaultTemplateFileName ?? DEFAULT_TEMPLATE_FILE_NAME).trim() ||
      DEFAULT_TEMPLATE_FILE_NAME,
    defaultInstructionFileName:
      String(settings.defaultInstructionFileName ?? DEFAULT_INSTRUCTION_FILE_NAME).trim() ||
      DEFAULT_INSTRUCTION_FILE_NAME
  };
  const projectPaths = getProjectPaths(trimmed);
  await fs.mkdir(projectPaths.entradasDir, { recursive: true });
  await fs.mkdir(projectPaths.saidasDir, { recursive: true });
  const saved = await writeSettings(trimmed);
  return {
    ...saved,
    apiKeyConfigured: Boolean(saved.apiKey)
  };
});

ipcMain.handle("files:pick-inputs", async () => {
  const settings = await readSettings();
  const { entradasDir } = getProjectPaths(settings);
  const activeWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(activeWindow, {
    title: "Selecionar aulas em PowerPoint",
    defaultPath: entradasDir,
    properties: ["openFile", "multiSelections"],
    buttonLabel: "Selecionar arquivos",
    filters: [{ name: "PowerPoint", extensions: ["pptx"] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  return Promise.all(result.filePaths.map((filePath) => buildInputRecord(filePath)));
});

ipcMain.handle("plans:detect-fields", async (_event, payload) => {
  const inputPaths = Array.isArray(payload?.inputPaths)
    ? payload.inputPaths.filter(Boolean).slice(0, 3)
    : [];

  if (inputPaths.length === 0) {
    return { turmas: "" };
  }

  const texts = await Promise.all(
    inputPaths.map(async (inputPath) => {
      const { fullText } = await extractPptxText(inputPath);
      return fullText;
    })
  );

  return {
    turmas: detectTurmasFromText(texts.join("\n"))
  };
});

ipcMain.handle("files:pick-directory", async (_event, kind) => {
  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  const activeWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const defaultPath =
    kind === "output" ? projectPaths.saidasDir : projectPaths.entradasDir;
  const result = await dialog.showOpenDialog(activeWindow, {
    title: kind === "output" ? "Selecionar pasta de saída" : "Selecionar pasta de entrada",
    defaultPath,
    properties: ["openDirectory", "createDirectory", "promptToCreate"],
    buttonLabel: "Selecionar pasta"
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("templates:pick-template", async () => {
  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  const activeWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(activeWindow, {
    title: "Selecionar template DOCX",
    defaultPath: projectPaths.templatesDir,
    properties: ["openFile"],
    buttonLabel: "Selecionar template",
    filters: [{ name: "Word", extensions: ["docx"] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("instructions:save", async (_event, payload) => {
  const projectPaths = getProjectPaths();
  const saved = await saveInstruction(projectPaths.instrucoesDir, {
    fileName: payload?.fileName,
    content: payload?.content
  });
  return readInstruction(projectPaths.instrucoesDir, saved.fileName);
});

ipcMain.handle("instructions:delete", async (_event, fileName) => {
  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  const removed = await deleteInstruction(projectPaths.instrucoesDir, fileName);
  const instructions = await listInstructions(projectPaths.instrucoesDir);

  let defaultInstructionFileName = settings.defaultInstructionFileName;
  if (defaultInstructionFileName === removed.fileName) {
    defaultInstructionFileName =
      instructions.find((instruction) => instruction.isDefaultBuiltIn)?.fileName ||
      instructions[0]?.fileName ||
      DEFAULT_INSTRUCTION_FILE_NAME;

    await writeSettings({
      ...settings,
      defaultInstructionFileName
    });
  }

  return {
    deletedFileName: removed.fileName,
    defaultInstructionFileName
  };
});

ipcMain.handle("instructions:improve", async (_event, payload) => {
  const settings = await readSettings();
  if (!settings.apiKey) {
    throw new Error("Configure a OpenAI API key antes de pedir melhorias para a instrução.");
  }

  return improveInstruction({
    apiKey: settings.apiKey,
    model: settings.model || "gpt-5.4-mini",
    fileName: payload?.fileName,
    currentContent: String(payload?.content || ""),
    userRequest: String(payload?.request || "").trim(),
    selectedExcerpt: String(payload?.selectedExcerpt || "").trim(),
    conversationHistory: Array.isArray(payload?.history) ? payload.history : []
  });
});

ipcMain.handle("instructions:reset-default", async (_event, fileName) => {
  const projectPaths = getProjectPaths();
  const instruction = await resetDefaultInstruction(projectPaths.instrucoesDir, fileName);
  const settings = await readSettings();
  await writeSettings({
    ...settings,
    defaultInstructionFileName: instruction.fileName
  });
  return instruction;
});

ipcMain.handle("instructions:set-default", async (_event, fileName) => {
  const settings = await readSettings();
  const nextSettings = {
    ...settings,
    defaultInstructionFileName: String(fileName || DEFAULT_INSTRUCTION_FILE_NAME)
  };
  await writeSettings(nextSettings);
  return nextSettings;
});

ipcMain.handle("templates:import", async (_event, sourcePath) => {
  if (!sourcePath) {
    throw new Error("Nenhum template foi selecionado.");
  }

  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  const imported = await importTemplate(projectPaths.templatesDir, sourcePath);
  return imported;
});

ipcMain.handle("templates:delete", async (_event, fileName) => {
  if (!fileName) {
    throw new Error("Nenhum template foi informado.");
  }

  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  return deleteTemplate(projectPaths.templatesDir, fileName);
});

ipcMain.handle("templates:reset-built-ins", async () => {
  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  const templates = await resetBuiltInTemplates(
    projectPaths.templatesDir,
    projectPaths.bundledTemplatesDir
  );

  const defaultTemplateFileName = templates.some(
    (template) => template.fileName === settings.defaultTemplateFileName
  )
    ? settings.defaultTemplateFileName
    : BUILT_IN_TEMPLATE_FILE_NAMES.includes(DEFAULT_TEMPLATE_FILE_NAME)
      ? DEFAULT_TEMPLATE_FILE_NAME
      : templates[0]?.fileName || DEFAULT_TEMPLATE_FILE_NAME;

  await writeSettings({
    ...settings,
    defaultTemplateFileName
  });

  return {
    templates,
    defaultTemplateFileName
  };
});

ipcMain.handle("templates:set-default", async (_event, fileName) => {
  const settings = await readSettings();
  const nextSettings = {
    ...settings,
    defaultTemplateFileName: String(fileName || DEFAULT_TEMPLATE_FILE_NAME)
  };
  await writeSettings(nextSettings);
  return nextSettings;
});

ipcMain.handle("files:open-path", async (_event, targetPath) => {
  if (!targetPath) {
    return false;
  }
  await shell.openPath(targetPath);
  return true;
});

ipcMain.handle("files:reveal-path", async (_event, targetPath) => {
  if (!targetPath) {
    return false;
  }
  shell.showItemInFolder(targetPath);
  return true;
});

ipcMain.handle("plans:generate", async (_event, payload) => {
  const inputPaths = Array.isArray(payload?.inputPaths)
    ? payload.inputPaths.filter(Boolean)
    : [];
  const outputConfig = payload?.outputConfig || {};

  if (inputPaths.length === 0) {
    throw new Error("Selecione pelo menos um arquivo .pptx.");
  }
  if (inputPaths.length > 3) {
    throw new Error("Use no máximo 3 arquivos .pptx por plano de aula.");
  }

  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  seedBundledResources(projectPaths);
  if (!settings.apiKey) {
    throw new Error("Configure a OpenAI API key antes de gerar o plano.");
  }

  const activeInstruction = await readInstruction(
    projectPaths.instrucoesDir,
    settings.defaultInstructionFileName || DEFAULT_INSTRUCTION_FILE_NAME
  );

  try {
    const sources = [];
    for (const inputPath of inputPaths) {
      const { fullText } = await extractPptxText(inputPath);
      sources.push({
        fileName: path.basename(inputPath),
        fullText
      });
    }

    const rawPlanData = await generatePlanData({
      apiKey: settings.apiKey,
      model: settings.model || "gpt-5.4-mini",
      sources,
      instructionContent: activeInstruction.content,
      instructionFileName: activeInstruction.fileName,
      outputConfig
    });

    const planData = normalizePlanData(rawPlanData, outputConfig, settings);
    const outputPath = await buildOutputPath(planData, projectPaths);
    const replacements = mapPlanToTemplate(planData);
    const templatePath = await resolveTemplatePath(
      projectPaths,
      settings.defaultTemplateFileName
    );
    await fillTemplate({ templatePath, outputPath, replacements });

    return {
      count: 1,
      failedCount: 0,
      model: settings.model || "gpt-5.4-mini",
      instructionFileName: activeInstruction.fileName,
      items: [
        {
          inputPaths,
          outputPath,
          summary: {
            disciplina: planData.disciplina,
            turma: planData.turmas,
            tema: planData.temaDaAula
          }
        }
      ],
      failures: []
    };
  } catch (error) {
    return {
      count: 0,
      failedCount: 1,
      model: settings.model || "gpt-5.4-mini",
      instructionFileName: activeInstruction.fileName,
      items: [],
      failures: [
        {
          inputPath: inputPaths.join(", "),
          fileName: inputPaths.map((inputPath) => path.basename(inputPath)).join(", "),
          message: error instanceof Error ? error.message : "Falha desconhecida na geração."
        }
      ]
    };
  }
});

ipcMain.handle("files:clear-inputs", async () => {
  const settings = await readSettings();
  const projectPaths = getProjectPaths(settings);
  const files = await fs.readdir(projectPaths.entradasDir, { withFileTypes: true });
  const targets = files
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pptx"))
    .map((entry) => path.join(projectPaths.entradasDir, entry.name));

  for (const target of targets) {
    await fs.unlink(target);
  }

  return {
    removedCount: targets.length
  };
});

app.whenReady().then(async () => {
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
