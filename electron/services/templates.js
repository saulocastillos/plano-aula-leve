import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_TEMPLATE_FILE_NAME = "plano-de-aula-template-com-ancoras.docx";

function sanitizeTemplateFileName(fileName) {
  const safe = String(fileName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  const base = safe.replace(/\.docx$/i, "");
  return `${base || "template"}.docx`;
}

export async function listTemplates(templatesDir) {
  await fs.mkdir(templatesDir, { recursive: true });
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".docx"))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
    .map((entry) => ({
      fileName: entry.name,
      path: path.join(templatesDir, entry.name),
      isDefaultBuiltIn: entry.name === DEFAULT_TEMPLATE_FILE_NAME
    }));

  return files;
}

export async function importTemplate(templatesDir, sourcePath) {
  await fs.mkdir(templatesDir, { recursive: true });
  const nextFileName = sanitizeTemplateFileName(path.basename(sourcePath));
  const destinationPath = path.join(templatesDir, nextFileName);
  await fs.copyFile(sourcePath, destinationPath);
  return {
    fileName: nextFileName,
    path: destinationPath
  };
}
