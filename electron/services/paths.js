import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_TEMPLATE_FILE_NAME } from "./templates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveProjectRoot(startDir) {
  const candidates = [
    startDir,
    path.resolve(startDir, ".."),
    path.resolve(startDir, "..", ".."),
    process.cwd()
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }

  return path.resolve(startDir, "..");
}

const projectRoot = resolveProjectRoot(__dirname);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function getProjectRoot() {
  return projectRoot;
}

export function getDefaultInputDir() {
  return path.join(projectRoot, "entradas");
}

export function getDefaultOutputDir() {
  return path.join(projectRoot, "saidas");
}

export function getProjectPaths(settings = {}) {
  const entradasDir = path.resolve(settings.inputDir || getDefaultInputDir());
  const saidasDir = path.resolve(settings.outputDir || getDefaultOutputDir());

  return {
    root: projectRoot,
    entradasDir: ensureDir(entradasDir),
    saidasDir: ensureDir(saidasDir),
    templatesDir: ensureDir(path.join(projectRoot, "templates")),
    instrucoesDir: ensureDir(path.join(projectRoot, "instrucoes")),
    defaultTemplatePath: path.join(
      projectRoot,
      "templates",
      settings.defaultTemplateFileName || DEFAULT_TEMPLATE_FILE_NAME
    )
  };
}
