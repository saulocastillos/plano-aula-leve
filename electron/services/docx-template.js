import fs from "node:fs/promises";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import path from "node:path";
import { extractOfficeArchive, packOfficeArchive } from "./archive.js";

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const XML_NS = "http://www.w3.org/XML/1998/namespace";

function isElement(node, localName) {
  return node?.nodeType === 1 && node.localName === localName;
}

function elementChildren(node, localName) {
  return Array.from(node.childNodes || []).filter((child) =>
    localName ? isElement(child, localName) : child.nodeType === 1
  );
}

function getTextNodes(node, accumulator = []) {
  for (const child of Array.from(node.childNodes || [])) {
    if (isElement(child, "t")) {
      accumulator.push(child);
    } else {
      getTextNodes(child, accumulator);
    }
  }
  return accumulator;
}

function getNodeText(node) {
  return getTextNodes(node)
    .map((textNode) => textNode.textContent ?? "")
    .join("");
}

function findAncestor(node, localName) {
  let current = node?.parentNode ?? null;
  while (current) {
    if (isElement(current, localName)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function cloneNodeDeep(node) {
  return node ? node.cloneNode(true) : null;
}

function setParagraphText(document, paragraph, nextText) {
  const paragraphProps = elementChildren(paragraph, "pPr")[0] ?? null;
  const firstRun = elementChildren(paragraph, "r")[0] ?? null;
  const firstRunProps = firstRun ? elementChildren(firstRun, "rPr")[0] ?? null : null;

  const removable = Array.from(paragraph.childNodes || []).filter(
    (child) => !(paragraphProps && child === paragraphProps)
  );
  for (const child of removable) {
    paragraph.removeChild(child);
  }

  const run = document.createElementNS(WORD_NS, "w:r");
  if (firstRunProps) {
    run.appendChild(cloneNodeDeep(firstRunProps));
  }

  const chunks = String(nextText).split("\n");
  chunks.forEach((chunk, index) => {
    const textNode = document.createElementNS(WORD_NS, "w:t");
    if (chunk.startsWith(" ") || chunk.endsWith(" ") || chunk.includes("  ")) {
      textNode.setAttributeNS(XML_NS, "xml:space", "preserve");
    }
    textNode.appendChild(document.createTextNode(chunk));
    run.appendChild(textNode);

    if (index < chunks.length - 1) {
      run.appendChild(document.createElementNS(WORD_NS, "w:br"));
    }
  });

  paragraph.appendChild(run);
}

export async function fillTemplate({
  templatePath,
  outputPath,
  replacements
}) {
  const extractedDir = await extractOfficeArchive(templatePath, "profe-docx");
  const documentXmlPath = path.join(extractedDir, "word", "document.xml");
  const xml = await fs.readFile(documentXmlPath, "utf8");

  const document = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(document.getElementsByTagNameNS(WORD_NS, "p"));

  for (const paragraph of paragraphs) {
    const textNodes = getTextNodes(paragraph);
    if (textNodes.length === 0) {
      continue;
    }

    const combined = textNodes.map((node) => node.textContent ?? "").join("");
    let nextText = combined;

    for (const [placeholder, value] of Object.entries(replacements)) {
      nextText = nextText.replaceAll(placeholder, value);
    }

    const tableCell = findAncestor(paragraph, "tc");
    const cellText = tableCell ? getNodeText(tableCell) : "";
    if (cellText.includes("Quantidade de Aulas:") && combined.includes("{{AVALIACAO}}")) {
      nextText = nextText.replaceAll(replacements["{{AVALIACAO}}"], replacements["{{QTD_AULAS}}"]);
    }

    if (combined.trim() === "´") {
      nextText = "";
    }

    if (nextText !== combined) {
      setParagraphText(document, paragraph, nextText);
    }
  }

  const serialized = new XMLSerializer().serializeToString(document);
  await fs.writeFile(documentXmlPath, serialized, "utf8");
  await packOfficeArchive(extractedDir, outputPath);
}
