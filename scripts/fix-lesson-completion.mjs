#!/usr/bin/env node
/**
 * Fix broken lesson HTML after patch-lesson-completion.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");
const LESSONS_ROOT = join(ROOT, "lessons/citizenship");

const SCROLL_SCRIPT_BLOCK = (progressKey, lessonId, mapUrl) => `  <script src="../../../assets/js/lesson-completion.js?v=quiz-gate-1"></script>
  <script>
    const PROGRESS_KEY = "${progressKey}";
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
    }

    window.addEventListener("load", () => {`;

function fixScrollLesson(html, lessonId, progressKey, mapUrl) {
  const loadStart = html.indexOf('window.addEventListener("load", () => {');
  if (loadStart < 0) return html;

  const scriptOpen = html.lastIndexOf("<script>", loadStart);
  if (scriptOpen < 0) return html;

  const scriptClose = html.indexOf("</script>", loadStart);
  const loadBlock = html.slice(loadStart, scriptClose);

  const newHead = SCROLL_SCRIPT_BLOCK(progressKey, lessonId, mapUrl);
  return html.slice(0, scriptOpen) + newHead + loadBlock.slice('window.addEventListener("load", () => {'.length) + html.slice(scriptClose);
}

function fixLesson4(html) {
  html = html.replace(
    /function getDone\(\) \{[\s\S]*?\n\s*\}\n\n\s*const completion/,
    "const completion",
  );
  html = html.replace(
    /function refreshComplete\(\) \{\s*completion\?\.refresh\(\);\s*\}\s*\}/,
    `function refreshComplete() {
      completion?.refresh();
    }`,
  );
  html = html.replace(/\n\s*const STORE = "evolearn-progress";\n/, "\n");
  if (!html.includes('<script src="../../../assets/js/lesson-guard.js"></script>\n  <script src="../../../assets/js/lesson-completion.js')) {
    html = html.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/assets\/js\/lesson-guard\.js"><\/script>)/,
      `$1\n  <script src="../../../assets/js/lesson-completion.js?v=quiz-gate-1"></script>`,
    );
  }
  html = html.replace(/\n\s*<script src="\.\.\/\.\.\/\.\.\/assets\/js\/lesson-completion\.js[^"]*"><\/script>\n\s*<script>/, "\n  <script>");
  return html;
}

function extractLessonId(html) {
  return html.match(/data-lesson-id="(lesson-\d+)"/)?.[1] || null;
}

function extractProgressKey(html) {
  return html.match(/const PROGRESS_KEY = "([^"]+)"/)?.[1] || null;
}

function extractMapUrl(html) {
  return html.match(/href="(\.\.\/\.\.\/\.\.\/index\.html#map\/module-\d+)"/)?.[1] || "../../../index.html";
}

function fixLesson(html, filename) {
  if (filename === "lesson-1.html") return html;

  const lessonId = extractLessonId(html);
  const progressKey = extractProgressKey(html);
  const mapUrl = extractMapUrl(html);
  if (!lessonId || !progressKey) return html;

  if (filename === "lesson-4.html") return fixLesson4(html);

  if (html.includes("else if (window.EvoLessonEndQuiz") || html.includes("const LESSON_ID")) {
    return fixScrollLesson(html, lessonId, progressKey, mapUrl);
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
    const next = fixLesson(html, name);
    if (next !== html) {
      writeFileSync(path, next);
      console.log("Fixed", path);
      count += 1;
    }
  }
  return count;
}

console.log(`Fixed ${walk(LESSONS_ROOT)} lesson files`);
