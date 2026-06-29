#!/usr/bin/env node
/**
 * Validate Citizenship knowledge base consistency.
 * Run: node scripts/validate-kb.mjs
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_DIR = join(__dirname, "../assets/data/knowledge");
const STUDENT_Q_DIR = join(KB_DIR, "student-questions");

const index = JSON.parse(readFileSync(join(KB_DIR, "index.json"), "utf8"));
const indexedFiles = new Set((index.topics || []).map((t) => t.file));
const allJson = readdirSync(KB_DIR).filter((f) => f.endsWith(".json") && f !== "index.json" && f !== "synonyms.json");

const errors = [];
const warnings = [];

for (const topic of index.topics || []) {
  const filePath = join(KB_DIR, topic.file);
  if (!existsSync(filePath)) {
    errors.push(`Missing file for topic ${topic.topicId}: ${topic.file}`);
    continue;
  }

  const data = JSON.parse(readFileSync(filePath, "utf8"));
  if (data.topicId !== topic.topicId) {
    errors.push(`${topic.file}: topicId mismatch (${data.topicId} vs ${topic.topicId})`);
  }

  for (let level = 1; level <= 9; level += 1) {
    if (!data.levels?.[String(level)]) {
      warnings.push(`${topic.file}: missing level ${level} (fallback will apply)`);
    }
  }

  const faqPatterns = new Set();
  for (const faq of data.faqs || []) {
    for (const pattern of faq.patterns || []) {
      const key = pattern.toLowerCase();
      if (faqPatterns.has(key)) {
        warnings.push(`${topic.file}: duplicate FAQ pattern "${pattern}"`);
      }
      faqPatterns.add(key);
    }
  }
}

for (const file of allJson) {
  if (!indexedFiles.has(file)) {
    warnings.push(`Orphan file not in index.json: ${file}`);
  }
}

if (existsSync(join(STUDENT_Q_DIR, "index.json"))) {
  const sqIndex = JSON.parse(readFileSync(join(STUDENT_Q_DIR, "index.json"), "utf8"));
  const indexedBanks = new Set();

  for (const bank of sqIndex.banks || []) {
    if (!bank.lessonId || !bank.file) {
      errors.push(`Student questions bank missing lessonId or file`);
      continue;
    }
    const bankPath = join(STUDENT_Q_DIR, bank.file);
    if (!existsSync(bankPath)) {
      errors.push(`Missing student question bank: ${bank.file}`);
      continue;
    }

    const data = JSON.parse(readFileSync(bankPath, "utf8"));
    if (data.lessonId !== bank.lessonId) {
      errors.push(`${bank.file}: lessonId mismatch (${data.lessonId} vs ${bank.lessonId})`);
    }

    const ids = new Set();
    for (const q of data.questions || []) {
      if (!q.id) {
        errors.push(`${bank.file}: question missing id`);
        continue;
      }
      if (ids.has(q.id)) {
        errors.push(`${bank.file}: duplicate question id "${q.id}"`);
      }
      ids.add(q.id);
      if (!q.patterns?.length) {
        warnings.push(`${bank.file}: question ${q.id} has no patterns`);
      }
      if (!q.answer && !q.tutorHint) {
        errors.push(`${bank.file}: question ${q.id} missing answer and tutorHint`);
      }
    }

    indexedBanks.add(bank.file);
    console.log(`  Student questions: ${bank.lessonId} — ${(data.questions || []).length} entries`);
  }

  const bankFiles = readdirSync(STUDENT_Q_DIR).filter((f) => f.endsWith(".json") && f !== "index.json");
  for (const file of bankFiles) {
    if (!indexedBanks.has(file)) {
      warnings.push(`Orphan student question bank not in index: ${file}`);
    }
  }
}

if (errors.length) {
  console.error("KB validation FAILED:");
  errors.forEach((e) => console.error("  ERROR:", e));
} else {
  console.log("KB validation passed:", index.topics.length, "indexed topics");
}

if (warnings.length) {
  console.warn("Warnings:");
  warnings.forEach((w) => console.warn("  WARN:", w));
}

process.exit(errors.length ? 1 : 0);
