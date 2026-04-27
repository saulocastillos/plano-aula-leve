import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
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

const devProjectRoot = resolveProjectRoot(__dirname);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function getBundledRoot() {
  return app.isPackaged ? process.resourcesPath : devProjectRoot;
}

function getWritableRoot() {
  return app.isPackaged
    ? path.join(app.getPath("userData"), "workspace")
    : devProjectRoot;
}

function copyMissingFiles(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyMissingFiles(sourcePath, targetPath);
      continue;
    }

    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

export function getProjectRoot() {
  return getWritableRoot();
}

export function getDefaultInputDir() {
  return path.join(getWritableRoot(), "entradas");
}

export function getDefaultOutputDir() {
  return path.join(getWritableRoot(), "saidas");
}

export function getProjectPaths(settings = {}) {
  const bundledRoot = getBundledRoot();
  const writableRoot = getWritableRoot();
  const entradasDir = path.resolve(settings.inputDir || getDefaultInputDir());
  const saidasDir = path.resolve(settings.outputDir || getDefaultOutputDir());

  return {
    root: writableRoot,
    bundledRoot,
    entradasDir: ensureDir(entradasDir),
    saidasDir: ensureDir(saidasDir),
    templatesDir: ensureDir(path.join(writableRoot, "templates")),
    instrucoesDir: ensureDir(path.join(writableRoot, "instrucoes")),
    bundledTemplatesDir: path.join(bundledRoot, "templates"),
    bundledInstrucoesDir: path.join(bundledRoot, "instrucoes"),
    defaultTemplatePath: path.join(
      writableRoot,
      "templates",
      settings.defaultTemplateFileName || DEFAULT_TEMPLATE_FILE_NAME
    )
  };
}

export function seedBundledResources(projectPaths) {
  copyMissingFiles(projectPaths.bundledTemplatesDir, projectPaths.templatesDir);
  copyMissingFiles(projectPaths.bundledInstrucoesDir, projectPaths.instrucoesDir);
}
