#!/usr/bin/env node
/**
 * Scaffold lesson HTML files from index.json topic metadata.
 * Run: node scripts/generate-lessons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INDEX = JSON.parse(readFileSync(join(ROOT, "assets/data/knowledge/index.json"), "utf8"));

function lessonNumber(lessonId) {
  return Number(String(lessonId).replace("lesson-", ""));
}

function moduleForLesson(num) {
  if (num <= 5) return "module-1";
  if (num <= 11) return "module-2";
  if (num <= 17) return "module-3";
  if (num <= 23) return "module-4";
  return "module-5";
}

function depthPrefix(moduleId) {
  return "../../../";
}

function buildLessonHtml(topic, moduleId, lessonId) {
  const num = lessonNumber(lessonId);
  const prefix = depthPrefix(moduleId);
  const progressKey = `citizenship.${moduleId}.${lessonId}`;
  const mapHash = `#map/${moduleId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EVOlearn: Lesson ${num}</title>
  <link rel="stylesheet" href="${prefix}style.css" />
  <script src="${prefix}assets/js/lesson-guard.js?v=assessment-lock-1"></script>
  <script src="${prefix}assets/js/lesson-completion.js?v=quiz-gate-1"></script>
  <script src="${prefix}assets/js/lesson-progress.js?v=checkpoint-1"></script>
</head>
<body class="lesson-body" data-lesson-id="${lessonId}" data-module-id="${moduleId}" data-chat-mode="ai">
  <main class="lesson-page">
    <section class="lesson-main" aria-label="Lesson content">
      <header class="lesson-top">
        <a class="lesson-back" href="${prefix}index.html${mapHash}">← Back to map</a>
        <span class="lesson-slide-count" id="chat-context">Lesson ${num}</span>
      </header>

      <div class="lesson-stage">
        <article class="lesson-slide-body lesson-slide-body--scroll">
          <div class="lesson-content">
            <p class="lesson-content-eyebrow">Citizenship · ${moduleId.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())} · Lesson ${num}</p>
            <h1>${topic.topicTitle}</h1>
            <p class="lesson-content-lede">${topic.themes?.slice(0, 2).join(" · ") || "GCSE Citizenship lesson"}</p>

            <div class="lesson-content-card">
              <h2>What you'll explore</h2>
              <ul>
                <li>${topic.themes?.[0] || topic.topicTitle}</li>
                <li>Key ideas matched to your tutor level</li>
                <li>Ask your tutor about any word or idea on this page</li>
              </ul>
            </div>

            <div class="lesson-content-card">
              <h2>Lesson content</h2>
              <p>Teaching slides and activities for this lesson are being prepared. Your tutor uses stored knowledge from this topic — ask about anything that feels unclear.</p>
            </div>

            <div class="lesson-content-card lesson-content-card--quiz">
              <div data-lesson-end-quiz aria-label="End of lesson quiz"></div>
            </div>
          </div>
        </article>

        <footer class="lesson-slide-footer">
          <div class="lesson-complete-bar">
            <button class="lesson-complete-btn" type="button" id="complete-btn">Mark lesson complete ✓</button>
            <a class="lesson-complete-ghost" href="${prefix}index.html${mapHash}">Return to map without completing</a>
          </div>
        </footer>
      </div>
    </section>

    <aside class="lesson-sidebar" aria-label="Tutor panel">
      <div class="lesson-avatar-shell">
        <div class="lesson-avatar-frame" aria-label="Tutor avatar area">
          <img src="${prefix}assets/tutors/nova.png" alt="" />
        </div>
        <p class="lesson-avatar-label">Your tutor</p>
      </div>

      <section class="lesson-chat-shell" aria-label="Chat area">
        <header class="lesson-chat-head">
          <h2>Ask Nova</h2>
          <span class="lesson-chat-badge">Live</span>
        </header>
        <div class="lesson-chat-body" id="chat-body" aria-label="Chat messages will appear here"></div>
        <div class="lesson-chat-input-shell">
          <input type="text" id="chat-input" placeholder="Ask about this lesson…" aria-label="Chat message" />
          <button type="button" id="chat-send">Send</button>
        </div>
      </section>
    </aside>
  </main>

  <script>
    const PROGRESS_KEY = "${progressKey}";
    const LESSON_ID = "${lessonId}";
    const btn = document.getElementById("complete-btn");

    const completion = window.EvoLessonCompletion?.bind({
      progressKey: PROGRESS_KEY,
      lessonId: LESSON_ID,
      btn,
      mapUrl: "${prefix}index.html${mapHash}",
    });

    function refresh() {
      completion?.refresh();
    }

    window.addEventListener("load", () => {
      if (window.EvoLessonLiveChat) {
        window.EvoLessonLiveChat.init({
          lessonId: "${lessonId}",
          basePath: "${prefix}",
          getSlideContext: () => window.EvoLessonLiveChat.scrollSlideContext(),
          showSource: new URLSearchParams(location.search).has("debug"),
        }).then((chat) => { window.__evoLessonChat = chat; });
      }
      refresh();
    });
  </script>
  <script src="${prefix}assets/js/student-profile.js?v=kb-expand-1"></script>
  <script src="${prefix}assets/js/agent-knowledge.js?v=kb-expand-1"></script>
  <script src="${prefix}assets/js/tutor-engine.js?v=kb-expand-1"></script>
  <script src="${prefix}assets/js/lesson-live-chat.js?v=kb-expand-1"></script>
  <script src="${prefix}assets/js/lesson-end-quiz.js?v=quiz-gate-1" data-auto-init></script>
  <script src="${prefix}assets/js/lesson-tutor.js"></script>
</body>
</html>
`;
}

const SKIP_LESSONS = new Set(["lesson-1", "lesson-2", "lesson-3", "lesson-4", "lesson-5"]);
let written = 0;
let skipped = 0;

for (const topic of INDEX.topics || []) {
  const lessonId = topic.lessonIds?.[0];
  if (!lessonId) continue;

  const num = lessonNumber(lessonId);
  if (num < 6) {
    skipped += 1;
    continue;
  }

  const moduleId = topic.moduleId || moduleForLesson(num);
  const moduleDir = join(ROOT, "lessons/citizenship", moduleId);
  if (!existsSync(moduleDir)) mkdirSync(moduleDir, { recursive: true });

  const outPath = join(moduleDir, `${lessonId}.html`);
  if (existsSync(outPath)) {
    console.log("Skip existing", outPath);
    skipped += 1;
    continue;
  }

  writeFileSync(outPath, buildLessonHtml(topic, moduleId, lessonId));
  console.log("Wrote", outPath);
  written += 1;
}

console.log(`Done: ${written} written, ${skipped} skipped`);
