import fs from "node:fs/promises";
import path from "node:path";
import { extractOfficeArchive } from "./archive.js";

function decodeXmlText(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function extractTextsFromSlide(xml) {
  const matches = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)];
  return matches
    .map((match) => decodeXmlText(match[1]))
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function extractPptxText(filePath) {
  const extractedDir = await extractOfficeArchive(filePath, "profe-pptx");
  const slidesDir = path.join(extractedDir, "ppt", "slides");
  const slideFiles = (await fs.readdir(slidesDir))
    .filter((name) => /^slide\d+\.xml$/.test(name))
    .sort((left, right) => {
      const leftNumber = Number(left.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      const rightNumber = Number(right.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return leftNumber - rightNumber;
    });

  const slides = [];
  for (const slideFile of slideFiles) {
    const xml = await fs.readFile(path.join(slidesDir, slideFile), "utf8");
    const texts = extractTextsFromSlide(xml);
    if (texts.length > 0) {
      slides.push({
        slide: Number(slideFile.match(/slide(\d+)\.xml$/)?.[1] ?? 0),
        text: texts.join(" ")
      });
    }
  }

  const fullText = slides
    .map((slide) => `Slide ${slide.slide}: ${slide.text}`)
    .join("\n");

  return {
    slides,
    fullText
  };
}
