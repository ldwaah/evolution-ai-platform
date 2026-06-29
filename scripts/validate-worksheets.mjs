#!/usr/bin/env node
/**
 * Validate in-lesson worksheet JSON files.
 * Run: node scripts/validate-worksheets.mjs
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WS_DIR = join(__dirname, "../assets/data/lesson-worksheets");
const VALID_TYPES = new Set(["word-bank-pick", "binary-sort"]);

const errors = [];
const warnings = [];

function expectString(value, label, file) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${file}: ${label} must be a non-empty string`);
    return false;
  }
  return true;
}

function validateWorksheet(ws, file, index) {
  const prefix = `${file} worksheets[${index}]`;

  if (!expectString(ws.id, "id", prefix)) return;
  if (typeof ws.triggerAfterSlideIndex !== "number" || ws.triggerAfterSlideIndex < 0) {
    errors.push(`${prefix}: triggerAfterSlideIndex must be a non-negative number`);
  }
  if (!expectString(ws.title, "title", prefix)) return;
  if (!VALID_TYPES.has(ws.type)) {
    errors.push(`${prefix}: unknown type "${ws.type}"`);
    return;
  }
  if (!expectString(ws.instruction, "instruction", prefix)) return;

  if (ws.type === "word-bank-pick") {
    if (!Array.isArray(ws.options) || ws.options.length < 2) {
      errors.push(`${prefix}: word-bank-pick needs at least 2 options`);
    }
    const pickCount = Number(ws.pickCount);
    if (!Number.isFinite(pickCount) || pickCount < 1) {
      errors.push(`${prefix}: pickCount must be a positive number`);
    } else if (Array.isArray(ws.options) && pickCount > ws.options.length) {
      errors.push(`${prefix}: pickCount cannot exceed options length`);
    }
  }

  if (ws.type === "binary-sort") {
    if (!Array.isArray(ws.categories) || ws.categories.length !== 2) {
      errors.push(`${prefix}: binary-sort needs exactly 2 categories`);
    } else {
      const categoryIds = new Set();
      ws.categories.forEach((cat, catIndex) => {
        if (!expectString(cat.id, `categories[${catIndex}].id`, prefix)) return;
        if (!expectString(cat.label, `categories[${catIndex}].label`, prefix)) return;
        categoryIds.add(cat.id);
      });

      if (!Array.isArray(ws.items) || ws.items.length < 1) {
        errors.push(`${prefix}: binary-sort needs at least 1 item`);
      } else {
        const itemIds = new Set();
        ws.items.forEach((item, itemIndex) => {
          if (!expectString(item.id, `items[${itemIndex}].id`, prefix)) return;
          if (!expectString(item.text, `items[${itemIndex}].text`, prefix)) return;
          if (itemIds.has(item.id)) {
            errors.push(`${prefix}: duplicate item id "${item.id}"`);
          }
          itemIds.add(item.id);
          if (!categoryIds.has(item.correctCategory)) {
            errors.push(`${prefix}: items[${itemIndex}].correctCategory "${item.correctCategory}" not in categories`);
          }
        });
      }
    }
  }

  if (ws.levels && typeof ws.levels === "object") {
    for (const [levelKey, levelCopy] of Object.entries(ws.levels)) {
      const levelNum = Number(levelKey);
      if (!Number.isFinite(levelNum) || levelNum < 1 || levelNum > 9) {
        warnings.push(`${prefix}: levels key "${levelKey}" is outside 1–9`);
      }
      if (levelCopy?.instruction && typeof levelCopy.instruction !== "string") {
        errors.push(`${prefix}: levels[${levelKey}].instruction must be a string`);
      }
    }
  }
}

if (!existsSync(WS_DIR)) {
  console.error("Worksheet directory missing:", WS_DIR);
  process.exit(1);
}

const files = readdirSync(WS_DIR).filter((f) => f.endsWith(".json"));
if (!files.length) {
  warnings.push("No worksheet JSON files found");
}

const seenIds = new Map();

for (const file of files) {
  const filePath = join(WS_DIR, file);
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    errors.push(`${file}: invalid JSON (${err.message})`);
    continue;
  }

  const expectedLessonId = file.replace(/\.json$/, "");
  if (data.lessonId !== expectedLessonId) {
    errors.push(`${file}: lessonId "${data.lessonId}" should match filename "${expectedLessonId}"`);
  }

  if (!Array.isArray(data.worksheets) || !data.worksheets.length) {
    warnings.push(`${file}: no worksheets defined`);
    continue;
  }

  const triggers = new Set();
  data.worksheets.forEach((ws, index) => {
    validateWorksheet(ws, file, index);
    const key = `${data.lessonId}:${ws.id}`;
    if (ws.id && seenIds.has(key)) {
      errors.push(`${file}: duplicate worksheet id "${ws.id}" (also in ${seenIds.get(key)})`);
    } else if (ws.id) {
      seenIds.set(key, file);
    }
    if (typeof ws.triggerAfterSlideIndex === "number") {
      if (triggers.has(ws.triggerAfterSlideIndex)) {
        errors.push(`${file}: duplicate triggerAfterSlideIndex ${ws.triggerAfterSlideIndex}`);
      }
      triggers.add(ws.triggerAfterSlideIndex);
    }
  });
}

for (const warning of warnings) console.warn("WARN:", warning);

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  errors.forEach((err) => console.error(" -", err));
  process.exit(1);
}

console.log(`OK: validated ${files.length} worksheet file(s)`);
