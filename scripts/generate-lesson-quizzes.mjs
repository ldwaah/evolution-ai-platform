#!/usr/bin/env node
/**
 * Scaffold end-of-lesson quiz JSON (3 questions × 3 options).
 * Run: node scripts/generate-lesson-quizzes.mjs
 * Edit assets/data/lesson-quizzes/lesson-N.json to replace placeholder text.
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../assets/data/lesson-quizzes");

const CORRECT_PATTERNS = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
  [0, 2, 1],
  [1, 0, 2],
  [2, 1, 0],
];

function buildQuiz(lessonNum) {
  const lessonId = `lesson-${lessonNum}`;
  const pattern = CORRECT_PATTERNS[(lessonNum - 1) % CORRECT_PATTERNS.length];
  const questions = [1, 2, 3].map((n, i) => ({
    id: `q${n}`,
    text: `Lesson ${lessonNum} — Question ${n}`,
    options: ["Option 1", "Option 2", "Option 3"],
    correctIndex: pattern[i],
  }));

  return {
    lessonId,
    title: `End of lesson ${lessonNum} check`,
    questions,
    maxPoints: 10,
  };
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (let n = 1; n <= 27; n += 1) {
  const outPath = join(OUT_DIR, `lesson-${n}.json`);
  if (existsSync(outPath)) continue;
  writeFileSync(outPath, `${JSON.stringify(buildQuiz(n), null, 2)}\n`);
  written += 1;
}

console.log(`Done: ${written} quiz files written to ${OUT_DIR}`);
