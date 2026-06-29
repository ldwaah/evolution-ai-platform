#!/usr/bin/env node
/**
 * Wire lesson-completion.js into lesson HTML files (2–27 + lesson-4).
 * Run: node scripts/patch-lesson-completion.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");
const LESSONS_ROOT = join(ROOT, "lessons/citizenship");

const COMPLETION_SCRIPT = `  <script src="../../../assets/js/lesson-completion.js?v=quiz-gate-1"></script>`;
const QUIZ_SCRIPT_V = `lesson-end-quiz.js?v=end-quiz-step-3`;

function extractLessonId(html) {
  const m = html.match(/data-lesson-id="(lesson-\d+)"/);
  return m?.[1] || null;
}

function extractProgressKey(html) {
  const m = html.match(/const PROGRESS_KEY = "([^"]+)"/);
  return m?.[1] || null;
}

function extractMapUrl(html) {
  const m = html.match(/href="(\.\.\/\.\.\/\.\.\/index\.html#map\/module-\d+)"/);
  return m?.[1] || "../../../index.html";
}

function scrollLessonSnippet(progressKey, lessonId, mapUrl) {
  return `    const PROGRESS_KEY = "${progressKey}";
    const LESSON_ID = "${lessonId}";
    const btn = document.getElementById("complete-btn");

    const completion = window.EvoLessonCompletion?.bind({
      progressKey: PROGRESS_KEY,
      lessonId: LESSON_ID,
      btn,
      mapUrl: "${mapUrl}",
    });

    function refresh() {
      completion?.refresh();
    }`;
}

function patchScrollLesson(html, lessonId, progressKey, mapUrl) {
  const snippet = scrollLessonSnippet(progressKey, lessonId, mapUrl);

  html = html.replace(
    /const PROGRESS_KEY = "[^"]+";\s*\n\s*const STORE = "evolearn-progress";\s*\n\s*const btn = document\.getElementById\("complete-btn"\);[\s\S]*?function refresh\(\) \{[\s\S]*?\n\s*\}/,
    snippet,
  );

  html = html.replace(
    /btn\.addEventListener\("click", \(\) => \{[\s\S]*?\}\);/,
    "",
  );

  if (!html.includes("lesson-completion.js")) {
    html = html.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/assets\/js\/lesson-guard\.js"><\/script>)/,
      `$1\n${COMPLETION_SCRIPT}`,
    );
  }

  html = html.replace(/lesson-end-quiz\.js\?v=[^"]+/, QUIZ_SCRIPT_V);

  if (!html.includes("evolearn:end-quiz-complete")) {
    html = html.replace(
      /(window\.addEventListener\("load", \(\) => \{)/,
      `globalThis.addEventListener("evolearn:end-quiz-complete", (e) => {
      if (e.detail?.lessonId === LESSON_ID) refresh();
    });

    $1`,
    );
  }

  return html;
}

function patchLesson4(html) {
  const lessonId = "lesson-4";
  const progressKey = "citizenship.module-1.lesson-4";
  const mapUrl = "../../../index.html#map/module-1";

  html = html.replace(
    /function refreshComplete\(\) \{[\s\S]*?\n\s*\}/,
    `const completion = window.EvoLessonCompletion?.bind({
      progressKey: "${progressKey}",
      lessonId: "${lessonId}",
      btn: completeBtn,
      mapUrl: "${mapUrl}",
    });

    function refreshComplete() {
      completion?.refresh();
    }`,
  );

  html = html.replace(
    /completeBtn\.addEventListener\("click", \(\) => \{[\s\S]*?\}\);/,
    "",
  );

  if (!html.includes("lesson-completion.js")) {
    html = html.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/assets\/js\/lesson-guard\.js"><\/script>)/,
      `$1\n${COMPLETION_SCRIPT}`,
    );
    html = html.replace(
      /(<script>\s*\n\s*const PROGRESS_KEY)/,
      `${COMPLETION_SCRIPT}\n  <script>\n    const PROGRESS_KEY`,
    );
    // avoid duplicate if both matched - clean up
    html = html.replace(
      new RegExp(`${COMPLETION_SCRIPT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n${COMPLETION_SCRIPT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      COMPLETION_SCRIPT,
    );
  }

  html = html.replace(/lesson-end-quiz\.js\?v=[^"]+/, QUIZ_SCRIPT_V);
  return html;
}

function patchLesson(html, filename) {
  if (filename === "lesson-1.html") return html;

  const lessonId = extractLessonId(html);
  const progressKey = extractProgressKey(html);
  const mapUrl = extractMapUrl(html);
  if (!lessonId || !progressKey) return html;

  if (filename === "lesson-4.html") {
    return patchLesson4(html);
  }

  if (html.includes("lesson-slide-body--scroll") || html.includes("EvoLessonLiveChat")) {
    return patchScrollLesson(html, lessonId, progressKey, mapUrl);
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

    const html = readFileSync(path, "utf8");
    const next = patchLesson(html, name);
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
