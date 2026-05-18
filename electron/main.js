import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import electronUpdater from "electron-updater";
import { extractPptxText } from "./services/pptx.js";
import { fillTemplate } from "./services/docx-template.js";
import { improveInstruction } from "./services/instruction-assistant.js";
import { generateBimestralPlanData, generatePlanData } from "./services/openai-plan.js";
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

const { autoUpdater } = electronUpdater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFileName = "settings.json";
const DEFAULT_DOCUMENT_TYPE = "plano_aula";
const LIMITED_DOCUMENT_TYPES = new Set(["plano_aula"]);
const DEFAULT_CADENCE = "semanal";
const DEFAULT_SCHEDULE_MODE = "quantidade";
const UPDATE_CHECK_DELAY_MS = 2500;
const UPDATE_POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;

function sanitizeDocumentType(value) {
  const normalized = String(value || "").trim();
  return normalized === "planejamento_bimestral"
    ? "planejamento_bimestral"
    : DEFAULT_DOCUMENT_TYPE;
}

function isDocumentTypeLimited(value) {
  return LIMITED_DOCUMENT_TYPES.has(sanitizeDocumentType(value));
}

function sanitizeCadence(value) {
  const normalized = String(value || "").trim();
  if (["semanal", "2x-semana", "3x-semana"].includes(normalized)) {
    return normalized;
  }
  return DEFAULT_CADENCE;
}

function sanitizeScheduleMode(value) {
  const normalized = String(value || "").trim();
  if (["quantidade", "data_fim"].includes(normalized)) {
    return normalized;
  }
  return DEFAULT_SCHEDULE_MODE;
}

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

function getLessonOrderFromFileName(filePath) {
  const baseName = path.basename(String(filePath || ""));
  const normalized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const match = normalized.match(/\baula\s*[-_ ]*(\d{1,3})\b/i);
  if (!match) {
    return null;
  }
  const lessonNumber = Number(match[1]);
  return Number.isFinite(lessonNumber) ? lessonNumber : null;
}

function sortInputPathsByLessonOrder(inputPaths) {
  return [...inputPaths]
    .map((filePath, index) => ({
      filePath,
      index,
      lessonOrder: getLessonOrderFromFileName(filePath),
      baseName: path.basename(String(filePath || ""))
    }))
    .sort((left, right) => {
      const leftHasOrder = Number.isFinite(left.lessonOrder);
      const rightHasOrder = Number.isFinite(right.lessonOrder);

      if (leftHasOrder && rightHasOrder && left.lessonOrder !== right.lessonOrder) {
        return left.lessonOrder - right.lessonOrder;
      }
      if (leftHasOrder !== rightHasOrder) {
        return leftHasOrder ? -1 : 1;
      }

      const byName = left.baseName.localeCompare(right.baseName, "pt-BR", {
        sensitivity: "base",
        numeric: true
      });
      if (byName !== 0) {
        return byName;
      }

      return left.index - right.index;
    })
    .map((item) => item.filePath);
}

function collectSourceLessonNumbers(inputPaths) {
  const values = inputPaths
    .map((filePath) => getLessonOrderFromFileName(filePath))
    .filter((value) => Number.isFinite(value));
  return [...new Set(values)];
}

function buildBimestralSourceSplitPlan(sources, targetCount) {
  const sourceCount = sources.length;
  if (targetCount < sourceCount) {
    throw new Error(
      `Não é possível gerar ${targetCount} aulas com ${sourceCount} arquivos-fonte sem descartar conteúdo.`
    );
  }
  if (targetCount > sourceCount * 3) {
    throw new Error(
      `Com ${sourceCount} arquivos-fonte, o máximo suportado é ${sourceCount * 3} aulas (até 3 por fonte).`
    );
  }

  const ranked = [...sources].sort((left, right) => {
    const bySize = (right.fullText?.length || 0) - (left.fullText?.length || 0);
    if (bySize !== 0) {
      return bySize;
    }
    return left.sourceLessonNumber - right.sourceLessonNumber;
  });

  const partsBySource = new Map(sources.map((source) => [source.sourceLessonNumber, 1]));
  let remaining = targetCount - sourceCount;

  // Preferência por dividir em 2 (passo 1).
  for (const source of ranked) {
    if (remaining <= 0) {
      break;
    }
    const current = partsBySource.get(source.sourceLessonNumber) || 1;
    if (current < 2) {
      partsBySource.set(source.sourceLessonNumber, 2);
      remaining -= 1;
    }
  }

  // Só usa 3 quando necessário (passo 2).
  for (const source of ranked) {
    if (remaining <= 0) {
      break;
    }
    const current = partsBySource.get(source.sourceLessonNumber) || 1;
    if (current < 3) {
      partsBySource.set(source.sourceLessonNumber, 3);
      remaining -= 1;
    }
  }

  if (remaining > 0) {
    throw new Error(
      "Não foi possível distribuir a quantidade de aulas solicitada dentro do limite máximo de 3 por fonte."
    );
  }

  const parts = sources
    .map((source) => ({
      sourceLessonNumber: source.sourceLessonNumber,
      parts: partsBySource.get(source.sourceLessonNumber) || 1
    }))
    .sort((left, right) => left.sourceLessonNumber - right.sourceLessonNumber);

  const counts = Object.fromEntries(
    parts.map((entry) => [String(entry.sourceLessonNumber), entry.parts])
  );
  const human = parts
    .map((entry) => `Aula ${entry.sourceLessonNumber} => ${entry.parts} parte(s)`)
    .join("; ");

  return { counts, human };
}

const GENERIC_TURMA_LABELS = [
  /anos?\s+finais?/i,
  /ensino\s+fundamental\s*(?:ii|2)/i,
  /fundamental\s*(?:ii|2)/i,
  /segmento\s+final/i
];

function sanitizeTurmasValue(value) {
  let normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  if (GENERIC_TURMA_LABELS.some((pattern) => pattern.test(normalized))) {
    for (const pattern of GENERIC_TURMA_LABELS) {
      normalized = normalized
        .replace(new RegExp(`\\s*[-–—,:]?\\s*${pattern.source}`, "i"), "")
        .replace(new RegExp(`${pattern.source}\\s*[-–—,:]?\\s*`, "i"), "")
        .trim();
    }
  }

  if (!normalized || GENERIC_TURMA_LABELS.some((pattern) => pattern.test(normalized))) {
    return "";
  }

  return normalized;
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
      documentType: sanitizeDocumentType(parsed.documentType),
      professorName: parsed.professorName || "",
      planTurmas: parsed.planTurmas || "",
      planQuantidadeAulas: parsed.planQuantidadeAulas ?? "1",
      planDataDe: parsed.planDataDe || "",
      planDataAte: parsed.planDataAte || "",
      planCadencia: sanitizeCadence(parsed.planCadencia),
      planScheduleMode: sanitizeScheduleMode(parsed.planScheduleMode),
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
      documentType: DEFAULT_DOCUMENT_TYPE,
      professorName: "",
      planTurmas: "",
      planQuantidadeAulas: "1",
      planDataDe: "",
      planDataAte: "",
      planCadencia: DEFAULT_CADENCE,
      planScheduleMode: DEFAULT_SCHEDULE_MODE,
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

async function buildBimestralOutputPath(planData, projectPaths) {
  const { saidasDir } = projectPaths;
  const turmaLabel = sentenceCaseWords(planData.turma || "Turma");
  const bimestreLabel = sentenceCaseWords(planData.bimestre || "Bimestre");
  const anoLetivoLabel = sanitizeFileNamePart(planData.anoLetivo || "Ano");
  const baseFileName = `Planejamento - ${turmaLabel} - ${bimestreLabel} - ${anoLetivoLabel}`;
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
    return sanitizeTurmasValue(explicitMatch[1]);
  }

  const matches = [
    ...normalized.matchAll(
      /\b(\d{1,2}\s*(?:º|°|o|ª|a)?\s*(?:ano|anos|serie|série))\b/gi
    )
  ]
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter((label) => {
      const numberMatch = label.match(/\d{1,2}/);
      if (!numberMatch) {
        return false;
      }

      const yearNumber = Number(numberMatch[0]);
      if (Number.isNaN(yearNumber)) {
        return false;
      }

      // Evita falsos positivos do tipo "44 anos" (idade/tempo no texto),
      // mantendo apenas séries escolares plausíveis.
      return yearNumber >= 1 && yearNumber <= 12;
    })
    .filter(Boolean);

  const unique = [...new Set(matches)];
  if (unique.length === 0) {
    return "";
  }

  return sanitizeTurmasValue(unique.slice(0, 3).join(", "));
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

function mapBimestralToTemplate(planData) {
  return {
    "{{BIMESTRE}}": planData.bimestre,
    "{{TURMA}}": planData.turma,
    "{{TURMAS}}": planData.turma,
    "{{DISCIPLINA}}": planData.disciplina,
    "{{ANO_LETIVO}}": planData.anoLetivo,
    "{{ANOLETIVO}}": planData.anoLetivo,
    "{{PROFESSOR}}": planData.professor
  };
}

function mapBimestralRowsToTemplate(planData) {
  const rows = Array.isArray(planData.aulas) ? planData.aulas : [];
  return rows.map((row) => {
    const aulaData = String(row.aulaData || "").trim();
    const objetivosAprendizagem = String(row.objetivosAprendizagem || "").trim();
    const verificacaoObjetivo = String(row.verificacaoObjetivo || "").trim();
    const estrategiasDidaticas = String(row.estrategiasDidaticas || "").trim();
    const recursosPedagogicos = String(row.recursosPedagogicos || "").trim();

    return {
      "{{AULA_DATA}}": aulaData,
      "{{AULA-DATA}}": aulaData,
      "{{OBJETIVOS_APRENDIZAGEM}}": objetivosAprendizagem,
      "{{OBJETIVOS-DE-APRENDIZAGEM}}": objetivosAprendizagem,
      "{{COMO_VERIFICAR_OBJETIVO}}": verificacaoObjetivo,
      "{{COMO_VERIFICAR_SE_OBJETIVO_FOI_ALCANCADO}}": verificacaoObjetivo,
      "{{ESTRATEGIAS_DIDATICAS}}": estrategiasDidaticas,
      "{{ESTRATÉGIAS_DIDÁTICAS}}": estrategiasDidaticas,
      "{{RECURSOS_PEDAGOGICOS}}": recursosPedagogicos,
      "{{RECURSOS_PEDAGÓGICOS}}": recursosPedagogicos
    };
  });
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

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function parseIsoDate(value) {
  const normalized = String(value || "").trim();
  if (!isIsoDate(normalized)) {
    return null;
  }

  const [year, month, day] = normalized.split("-").map((part) => Number(part));
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateToBr(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildCadenceWeekdays(startDate, cadence) {
  const startDay = startDate.getDay();
  if (cadence === "2x-semana") {
    return [startDay, (startDay + 2) % 7];
  }
  if (cadence === "3x-semana") {
    return [startDay, (startDay + 2) % 7, (startDay + 4) % 7];
  }
  return [startDay];
}

function generateDatesByCount(startDate, count, cadence) {
  const weekdays = buildCadenceWeekdays(startDate, cadence);
  const dates = [];
  const cursor = new Date(startDate);
  const safetyLimit = Math.max(count * 30, 3650);

  let steps = 0;
  while (dates.length < count && steps < safetyLimit) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
    steps += 1;
  }

  return dates;
}

function generateDatesUntilEnd(startDate, endDate, cadence) {
  const weekdays = buildCadenceWeekdays(startDate, cadence);
  const dates = [];
  const cursor = new Date(startDate);
  const safetyLimit = 3650;

  let steps = 0;
  while (cursor <= endDate && steps < safetyLimit) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
    steps += 1;
  }

  return dates;
}

function normalizeTopicTokens(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function hasTopicOverlap(leftValue, rightValue) {
  const leftTokens = new Set(normalizeTopicTokens(leftValue));
  const rightTokens = new Set(normalizeTopicTokens(rightValue));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return false;
  }

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      return true;
    }
  }
  return false;
}

function estimateBimestralClassCount(outputConfig, settings) {
  const cadence = sanitizeCadence(outputConfig?.cadencia || settings.planCadencia);
  const scheduleMode = sanitizeScheduleMode(
    outputConfig?.scheduleMode || settings.planScheduleMode
  );
  const startDate =
    parseIsoDate(outputConfig?.dataDe) || parseIsoDate(settings.planDataDe);
  const endDate =
    parseIsoDate(outputConfig?.dataAte) || parseIsoDate(settings.planDataAte);
  const requestedCount = Math.max(
    1,
    Number.parseInt(
      String(outputConfig?.quantidadeAulas || settings.planQuantidadeAulas || 1),
      10
    ) || 1
  );

  if (!startDate) {
    return requestedCount;
  }
  if (scheduleMode === "data_fim" && endDate && endDate >= startDate) {
    return Math.max(1, generateDatesUntilEnd(startDate, endDate, cadence).length);
  }
  return requestedCount;
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
    sanitizeTurmasValue(planData.turmas) ||
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

function normalizeBimestralPlanData(planData, outputConfig, settings) {
  const professor =
    String(outputConfig?.professor || "").trim() ||
    String(settings.professorName || "").trim() ||
    String(planData.professor || "").trim() ||
    "A definir";

  const turma =
    String(outputConfig?.turmas || "").trim() ||
    String(settings.planTurmas || "").trim() ||
    sanitizeTurmasValue(planData.turma) ||
    "A definir";

  const disciplina = String(planData.disciplina || "").trim() || "A definir";
  const bimestre = String(planData.bimestre || "").trim() || "A definir";
  const anoLetivo = String(planData.anoLetivo || "").trim() || "A definir";
  const modelRows = Array.isArray(planData.aulas)
    ? planData.aulas
        .map((row) => ({
          fonteAulaNumero: Number.parseInt(String(row?.fonteAulaNumero || ""), 10) || null,
          tituloAula: String(row?.tituloAula || "").trim(),
          ehContinuacao: Boolean(row?.ehContinuacao),
          objetivosAprendizagem: String(row?.objetivosAprendizagem || "").trim(),
          verificacaoObjetivo: String(row?.verificacaoObjetivo || "").trim(),
          estrategiasDidaticas: String(row?.estrategiasDidaticas || "").trim(),
          recursosPedagogicos: String(row?.recursosPedagogicos || "").trim()
        }))
        .filter(
          (row) =>
            row.fonteAulaNumero ||
            row.tituloAula ||
            row.objetivosAprendizagem ||
            row.verificacaoObjetivo ||
            row.estrategiasDidaticas ||
            row.recursosPedagogicos
        )
    : [];

  const cadence = sanitizeCadence(outputConfig?.cadencia || settings.planCadencia);
  const scheduleMode = sanitizeScheduleMode(
    outputConfig?.scheduleMode || settings.planScheduleMode
  );
  const startDate =
    parseIsoDate(outputConfig?.dataDe) || parseIsoDate(settings.planDataDe);
  const endDate =
    parseIsoDate(outputConfig?.dataAte) || parseIsoDate(settings.planDataAte);
  const requestedCount = Math.max(
    1,
    Number.parseInt(
      String(outputConfig?.quantidadeAulas || settings.planQuantidadeAulas || modelRows.length || 1),
      10
    ) || 1
  );

  if (!startDate) {
    throw new Error(
      "No planejamento bimestral, informe a data inicial para calcular as aulas."
    );
  }
  if (scheduleMode === "data_fim" && !endDate) {
    throw new Error(
      "No planejamento bimestral por data final, informe o campo 'Período até'."
    );
  }
  if (scheduleMode === "data_fim" && endDate && endDate < startDate) {
    throw new Error("A data final do planejamento deve ser igual ou posterior à data inicial.");
  }

  const classDates =
    scheduleMode === "data_fim" && endDate
      ? generateDatesUntilEnd(startDate, endDate, cadence)
      : generateDatesByCount(startDate, requestedCount, cadence);

  if (classDates.length === 0) {
    throw new Error(
      "Nenhuma aula foi calculada com os parâmetros informados. Ajuste data inicial, data final ou cadência."
    );
  }

  const targetCount = classDates.length;
  if (modelRows.length !== targetCount) {
    throw new Error(
      `A IA retornou ${modelRows.length} aulas, mas o planejamento exige ${targetCount}. Gere novamente para ajustar a divisão das aulas-fonte.`
    );
  }

  const sourceSplitCount = new Map();
  for (const row of modelRows) {
    if (!Number.isFinite(row.fonteAulaNumero)) {
      continue;
    }
    const current = sourceSplitCount.get(row.fonteAulaNumero) || 0;
    sourceSplitCount.set(row.fonteAulaNumero, current + 1);
  }

  for (const [sourceLesson, splitCount] of sourceSplitCount.entries()) {
    if (splitCount > 3) {
      throw new Error(
        `A aula-fonte ${sourceLesson} foi dividida em ${splitCount} partes. O máximo permitido é 3.`
      );
    }
  }

  const plannedSplitCounts =
    outputConfig?.sourceSplitPlanCounts &&
    typeof outputConfig.sourceSplitPlanCounts === "object"
      ? outputConfig.sourceSplitPlanCounts
      : null;

  if (plannedSplitCounts) {
    const plannedEntries = Object.entries(plannedSplitCounts);
    for (const [sourceLessonRaw, plannedCountRaw] of plannedEntries) {
      const sourceLesson = Number(sourceLessonRaw);
      const plannedCount = Number(plannedCountRaw);
      if (!Number.isFinite(sourceLesson) || !Number.isFinite(plannedCount)) {
        continue;
      }
      const actualCount = sourceSplitCount.get(sourceLesson) || 0;
      if (actualCount !== plannedCount) {
        throw new Error(
          `Divisão inválida da aula-fonte ${sourceLesson}: esperado ${plannedCount} parte(s), recebido ${actualCount}.`
        );
      }
    }
  }

  const rows = [];
  for (let index = 0; index < targetCount; index += 1) {
    const base = modelRows[index];
    const previousBase = index > 0 ? modelRows[index - 1] : null;
    const sameSourceAsPrevious =
      previousBase &&
      Number.isFinite(base.fonteAulaNumero) &&
      Number.isFinite(previousBase.fonteAulaNumero) &&
      base.fonteAulaNumero === previousBase.fonteAulaNumero;
    const previousRow = index > 0 ? rows[index - 1] : null;
    const previousWasContinuation = Boolean(previousRow?.ehContinuacaoInterno);
    const tituloBase = String(base.tituloAula || "Assunto").trim() || "Assunto";
    const previousTopicTitle = String(previousRow?.tituloBaseInterno || "").trim();
    const relatesToPreviousTopic =
      sameSourceAsPrevious &&
      previousTopicTitle &&
      hasTopicOverlap(tituloBase, previousTopicTitle);

    const ehContinuacaoSolicitada = Boolean(base.ehContinuacao);
    const ehContinuacao =
      ehContinuacaoSolicitada &&
      relatesToPreviousTopic &&
      !previousWasContinuation;

    const tituloAula = ehContinuacao
      ? `Continuação do assunto (${previousTopicTitle})`
      : tituloBase;
    const dataLabel = formatDateToBr(classDates[index]);

    rows.push({
      aulaData: `Aula ${index + 1} - ${tituloAula} - ${dataLabel}`,
      objetivosAprendizagem: base.objetivosAprendizagem || "A definir",
      verificacaoObjetivo: base.verificacaoObjetivo || "A definir",
      estrategiasDidaticas: base.estrategiasDidaticas || "A definir",
      recursosPedagogicos: base.recursosPedagogicos || "A definir",
      ehContinuacaoInterno: ehContinuacao,
      tituloBaseInterno: ehContinuacao ? previousTopicTitle : tituloBase
    });
  }

  return {
    bimestre,
    turma,
    disciplina,
    anoLetivo,
    professor,
    aulas: rows.map((row) => ({
      aulaData: row.aulaData,
      objetivosAprendizagem: row.objetivosAprendizagem,
      verificacaoObjetivo: row.verificacaoObjetivo,
      estrategiasDidaticas: row.estrategiasDidaticas,
      recursosPedagogicos: row.recursosPedagogicos
    }))
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

function getActiveWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || null;
}

function setupAutoUpdate() {
  if (!app.isPackaged || process.platform !== "win32") {
    return;
  }

  if (!process.env.GH_TOKEN) {
    console.warn("[updater] GH_TOKEN não configurado; auto-update do repositório privado está desativado.");
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", (error) => {
    const reason = error instanceof Error ? error.message : String(error || "erro desconhecido");
    console.error("[updater] Falha no auto-update:", reason);
  });

  autoUpdater.on("update-available", async (info) => {
    try {
      const window = getActiveWindow() || undefined;
      const { response } = await dialog.showMessageBox(window, {
        type: "info",
        buttons: ["Baixar agora", "Depois"],
        defaultId: 0,
        cancelId: 1,
        title: "Atualização disponível",
        message: `Uma nova versão (${info?.version || "nova"}) está disponível.`,
        detail: "Deseja baixar a atualização agora?"
      });

      if (response === 0) {
        await autoUpdater.downloadUpdate();
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : String(error || "erro desconhecido");
      console.error("[updater] Não foi possível abrir diálogo de atualização:", reason);
    }
  });

  autoUpdater.on("update-downloaded", async (info) => {
    try {
      const window = getActiveWindow() || undefined;
      const { response } = await dialog.showMessageBox(window, {
        type: "info",
        buttons: ["Reiniciar agora", "Depois"],
        defaultId: 0,
        cancelId: 1,
        title: "Atualização pronta",
        message: `A versão ${info?.version || "mais recente"} foi baixada.`,
        detail: "O aplicativo precisa reiniciar para concluir a atualização."
      });

      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : String(error || "erro desconhecido");
      console.error("[updater] Não foi possível abrir diálogo de reinício:", reason);
    }
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      const reason =
        error instanceof Error ? error.message : String(error || "erro desconhecido");
      console.error("[updater] Falha ao verificar atualizações:", reason);
    });
  }, UPDATE_CHECK_DELAY_MS);

  const updateTimer = setInterval(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      const reason =
        error instanceof Error ? error.message : String(error || "erro desconhecido");
      console.error("[updater] Falha ao verificar atualizações:", reason);
    });
  }, UPDATE_POLL_INTERVAL_MS);
  updateTimer.unref?.();
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
    appVersion: app.getVersion(),
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
    documentType: sanitizeDocumentType(settings.documentType),
    professorName: String(settings.professorName ?? "").trim(),
    planTurmas: String(settings.planTurmas ?? "").trim(),
    planQuantidadeAulas: String(settings.planQuantidadeAulas ?? "").trim(),
    planDataDe: String(settings.planDataDe ?? "").trim(),
    planDataAte: String(settings.planDataAte ?? "").trim(),
    planCadencia: sanitizeCadence(settings.planCadencia),
    planScheduleMode: sanitizeScheduleMode(settings.planScheduleMode),
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
  const documentType = sanitizeDocumentType(payload?.documentType);
  const rawInputPaths = Array.isArray(payload?.inputPaths)
    ? payload.inputPaths
        .filter(Boolean)
        .slice(0, isDocumentTypeLimited(documentType) ? 3 : undefined)
    : [];
  const inputPaths = sortInputPathsByLessonOrder(rawInputPaths);

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
  const documentType = sanitizeDocumentType(payload?.documentType);
  const rawInputPaths = Array.isArray(payload?.inputPaths)
    ? payload.inputPaths.filter(Boolean)
    : [];
  const inputPaths = sortInputPathsByLessonOrder(rawInputPaths);
  const outputConfig = payload?.outputConfig || {};

  if (inputPaths.length === 0) {
    throw new Error("Selecione pelo menos um arquivo .pptx.");
  }
  if (isDocumentTypeLimited(documentType) && inputPaths.length > 3) {
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
    for (const [index, inputPath] of inputPaths.entries()) {
      const { fullText } = await extractPptxText(inputPath);
      const detectedLesson = getLessonOrderFromFileName(inputPath);
      sources.push({
        fileName: path.basename(inputPath),
        fullText,
        sourceLessonNumber:
          Number.isFinite(detectedLesson) ? detectedLesson : index + 1
      });
    }

    const templatePath = await resolveTemplatePath(
      projectPaths,
      settings.defaultTemplateFileName
    );

    let outputPath = "";
    let summary = {
      disciplina: "",
      turma: "",
      tema: ""
    };

    if (documentType === "planejamento_bimestral") {
      const targetBimestralCount = estimateBimestralClassCount(outputConfig, settings);
      const sourceLessonNumbers = collectSourceLessonNumbers(inputPaths);
      const splitPlan = buildBimestralSourceSplitPlan(sources, targetBimestralCount);
      const bimestralOutputConfig = {
        ...outputConfig,
        quantidadeAulas: String(targetBimestralCount),
        sourceLessonNumbers:
          sourceLessonNumbers.length > 0
            ? sourceLessonNumbers.join(", ")
            : sources.map((source) => source.sourceLessonNumber).join(", "),
        sourceSplitPlanHuman: splitPlan.human,
        sourceSplitPlanCounts: splitPlan.counts
      };
      const rawBimestralData = await generateBimestralPlanData({
        apiKey: settings.apiKey,
        model: settings.model || "gpt-5.4-mini",
        sources,
        instructionContent: activeInstruction.content,
        instructionFileName: activeInstruction.fileName,
        outputConfig: bimestralOutputConfig
      });

      const bimestralData = normalizeBimestralPlanData(
        rawBimestralData,
        bimestralOutputConfig,
        settings
      );
      const replacements = mapBimestralToTemplate(bimestralData);
      const tableRows = mapBimestralRowsToTemplate(bimestralData);
      outputPath = await buildBimestralOutputPath(bimestralData, projectPaths);
      await fillTemplate({ templatePath, outputPath, replacements, tableRows });

      summary = {
        disciplina: bimestralData.disciplina,
        turma: bimestralData.turma,
        tema: `Planejamento ${bimestralData.bimestre}`
      };
    } else {
      const rawPlanData = await generatePlanData({
        apiKey: settings.apiKey,
        model: settings.model || "gpt-5.4-mini",
        sources,
        instructionContent: activeInstruction.content,
        instructionFileName: activeInstruction.fileName,
        outputConfig
      });

      const planData = normalizePlanData(rawPlanData, outputConfig, settings);
      const replacements = mapPlanToTemplate(planData);
      outputPath = await buildOutputPath(planData, projectPaths);
      await fillTemplate({ templatePath, outputPath, replacements });

      summary = {
        disciplina: planData.disciplina,
        turma: planData.turmas,
        tema: planData.temaDaAula
      };
    }

    return {
      count: 1,
      failedCount: 0,
      model: settings.model || "gpt-5.4-mini",
      instructionFileName: activeInstruction.fileName,
      items: [
        {
          inputPaths,
          outputPath,
          summary
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
  setupAutoUpdate();

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
