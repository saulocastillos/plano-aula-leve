import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_TEMPLATE_FILE_NAME = "plano-de-aula-template-com-ancoras.docx";
export const BUILT_IN_TEMPLATE_FILE_NAMES = [
  DEFAULT_TEMPLATE_FILE_NAME,
  "Plano de Aula - Bertioga.docx",
  "Plano de Aula - José da Costa.docx",
  "Planejamento - Bertioga - Bimestral.docx"
];

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
      isBuiltIn: BUILT_IN_TEMPLATE_FILE_NAMES.includes(entry.name),
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

export async function deleteTemplate(templatesDir, fileName) {
  const nextFileName = sanitizeTemplateFileName(fileName);
  if (BUILT_IN_TEMPLATE_FILE_NAMES.includes(nextFileName)) {
    throw new Error("Os templates padrão do app não podem ser removidos.");
  }

  const targetPath = path.join(templatesDir, nextFileName);
  await fs.unlink(targetPath);

  return {
    fileName: nextFileName,
    path: targetPath
  };
}

export async function resetBuiltInTemplates(templatesDir, bundledTemplatesDir) {
  await fs.mkdir(templatesDir, { recursive: true });
  const builtInTemplates = await Promise.all(
    BUILT_IN_TEMPLATE_FILE_NAMES.map(async (fileName) => {
      const sourcePath = path.join(bundledTemplatesDir, fileName);
      const content = await fs.readFile(sourcePath);
      return { fileName, content };
    })
  );
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".docx"))
      .map((entry) => fs.unlink(path.join(templatesDir, entry.name)))
  );

  await Promise.all(
    builtInTemplates.map(async ({ fileName, content }) => {
      const destinationPath = path.join(templatesDir, fileName);
      await fs.writeFile(destinationPath, content);
    })
  );

  return listTemplates(templatesDir);
}
