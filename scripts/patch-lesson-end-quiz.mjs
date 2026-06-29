#!/usr/bin/env node
/**
 * Wire end-of-lesson quiz into lesson HTML files (2–27).
 * Run: node scripts/patch-lesson-end-quiz.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");
const LESSONS_ROOT = join(ROOT, "lessons/citizenship");

const QUIZ_MOUNT = `
            <div class="lesson-content-card lesson-content-card--quiz">
              <div data-lesson-end-quiz aria-label="End of lesson quiz"></div>
            </div>`;

const QUIZ_SCRIPT = `  <script src="../../../assets/js/lesson-end-quiz.js?v=end-quiz-step" data-auto-init></script>`;

function patchLesson(html, lessonId) {
  if (html.includes("data-lesson-end-quiz")) {
    if (!html.includes("lesson-end-quiz.js")) {
      html = html.replace(
        /<script src="\.\.\/\.\.\/\.\.\/assets\/js\/lesson-tutor\.js"><\/script>/,
        `${QUIZ_SCRIPT}\n  <script src="../../../assets/js/lesson-tutor.js"></script>`,
      );
    }
    return html;
  }

  html = html.replace(
    /(\s*)<\/div>\s*\n(\s*)<\/article>/,
    `$1${QUIZ_MOUNT}\n$1</div>\n$2</article>`,
  );

  html = html.replace(
    /function refresh\(\) \{\s*\n(\s*)if \(getDone\(\)\.has\(PROGRESS_KEY\)\)/,
    `function refresh() {\n$1if (getDone().has(PROGRESS_KEY))`,
  );

  if (!html.includes("end quiz")) {
    html = html.replace(
      /(function refresh\(\) \{[\s\S]*?)(\n\s*\}\n\n\s*btn\.addEventListener)/,
      (match, head, tail) => {
        if (head.includes("EvoLessonEndQuiz")) return match;
        return `${head}
      else if (window.EvoLessonEndQuiz && !window.EvoLessonEndQuiz.isComplete("${lessonId}")) {
        btn.textContent = "Complete the end quiz first";
        btn.disabled = true;
      }${tail}`;
      },
    );
  }

  html = html.replace(
    /btn\.addEventListener\("click", \(\) => \{\s*\n(\s*)if \(getDone\(\)\.has\(PROGRESS_KEY\)\) return;/,
    `btn.addEventListener("click", () => {
$1if (getDone().has(PROGRESS_KEY)) return;
$1if (window.EvoLessonEndQuiz && !window.EvoLessonEndQuiz.isComplete("${lessonId}")) return;`,
  );

  if (!html.includes("lesson-end-quiz.js")) {
    html = html.replace(
      /<script src="\.\.\/\.\.\/\.\.\/assets\/js\/lesson-tutor\.js"><\/script>/,
      `${QUIZ_SCRIPT}\n  <script src="../../../assets/js/lesson-tutor.js"></script>`,
    );
  }

  if (!html.includes("__evoLessonChat")) {
    html = html.replace(
      /window\.addEventListener\("load", \(\) => \{/,
      `window.addEventListener("load", () => {
      globalThis.__evoLessonChat = null;`,
    );
    html = html.replace(
      /(if \(window\.EvoLessonLiveChat\) \{[\s\S]*?init\(\{[\s\S]*?\}\);[\s\S]*?\})/,
      `$1
      globalThis.__evoLessonChat = globalThis.__evoLessonChat || window.__evoLessonChat;`,
    );
  }

  return html;
}

function walk(dir) {
  let count = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      count += walk(path);
      continue;
    }
    if (!/^lesson-\d+\.html$/.test(name)) continue;
    if (name === "lesson-1.html") continue;

    const lessonId = name.replace(".html", "");
    const html = readFileSync(path, "utf8");
    const next = patchLesson(html, lessonId);
    if (next !== html) {
      writeFileSync(path, next);
      console.log("Patched", path);
      count += 1;
    }
  }
  return count;
}

const patched = walk(LESSONS_ROOT);
console.log(`Done: ${patched} lesson files patched`);
