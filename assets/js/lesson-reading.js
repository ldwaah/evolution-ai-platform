/**
 * EVOlearn — slide reading & comprehension page
 *
 * URL: lessons/citizenship/reading.html?lesson=citizenship/module-1/lesson-1&slide=2
 * slide param is 1-based (slide 2 = KB index 1).
 */
(function (global) {
  const STORAGE_KEY = "evoReadingAnswers";
  const READING_INDEX_URL = "assets/data/knowledge/reading-questions/index.json";
  const READING_BASE = "assets/data/knowledge/reading-questions/";
  const STUDENT_Q_INDEX_URL = "assets/data/knowledge/student-questions/index.json";
  const STUDENT_Q_BASE = "assets/data/knowledge/student-questions/";

  const indexCache = new Map();
  const bankCache = new Map();

  function parseLessonPath(lessonParam) {
    const raw = String(lessonParam || "").replace(/^\/+|\/+$/g, "");
    const match = raw.match(/module-(\d+)\/(lesson-\d+)$/i);
    if (!match) return null;
    return {
      lessonRelPath: raw,
      moduleId: `module-${match[1]}`,
      lessonId: match[2].toLowerCase(),
    };
  }

  function parseSlideParam(slideParam) {
    const n = Number(slideParam);
    if (!Number.isFinite(n) || n < 1) return 0;
    return Math.floor(n) - 1;
  }

  function loadStore() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
      return {};
    }
  }

  function saveStore(store) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      global.EvoStudentSync?.notifyChange?.("reading-answer");
    } catch { /* ignore */ }
  }

  function recordAttempt(lessonId, slideIndex, questionId, payload) {
    const store = loadStore();
    const lessonKey = lessonId;
    if (!store[lessonKey]) store[lessonKey] = {};
    const slideKey = String(slideIndex);
    if (!store[lessonKey][slideKey]) store[lessonKey][slideKey] = {};
    store[lessonKey][slideKey][questionId] = {
      ...payload,
      at: new Date().toISOString(),
    };
    saveStore(store);

    global.EvoStudentSync?.writeSignal?.("reading_question", {
      lessonId,
      slideIndex,
      questionId,
      correct: !!payload.correct,
    }).catch?.(() => {});
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch_failed");
    return res.json();
  }

  async function loadReadingBank(lessonId, basePath) {
    const prefix = basePath || "";
    const cacheKey = `${prefix}${lessonId}`;
    if (bankCache.has(cacheKey)) return bankCache.get(cacheKey);

    let bank = null;
    try {
      const index = await fetchJson(`${prefix}${READING_INDEX_URL}`);
      const entry = (index.banks || []).find((b) => b.lessonId === lessonId);
      if (entry?.file) {
        bank = await fetchJson(`${prefix}${READING_BASE}${entry.file}`);
      }
    } catch { /* optional bank */ }

    bankCache.set(cacheKey, bank);
    return bank;
  }

  async function loadStudentQuestions(lessonId, basePath) {
    const prefix = basePath || "";
    const cacheKey = `sq:${prefix}${lessonId}`;
    if (bankCache.has(cacheKey)) return bankCache.get(cacheKey);

    let bank = null;
    try {
      const index = await fetchJson(`${prefix}${STUDENT_Q_INDEX_URL}`);
      const entry = (index.banks || []).find((b) => b.lessonId === lessonId);
      if (entry?.file) {
        bank = await fetchJson(`${prefix}${STUDENT_Q_BASE}${entry.file}`);
      }
    } catch { /* optional */ }

    bankCache.set(cacheKey, bank);
    return bank;
  }

  function patternToQuestion(pattern) {
    const raw = String(pattern || "").trim();
    if (!raw) return "Check your understanding";
    const capped = raw.charAt(0).toUpperCase() + raw.slice(1);
    return capped.endsWith("?") ? capped : `${capped}?`;
  }

  function shortAnswer(text, acceptList) {
    const norm = String(text || "").toLowerCase().replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim();
    if (!norm || norm.length < 3) return false;
    const tokens = acceptList || [];
    return tokens.some((needle) => {
      const n = String(needle).toLowerCase();
      return norm.includes(n);
    });
  }

  function pickDistractors(correct, pool, count) {
    const seen = new Set([correct.toLowerCase()]);
    const out = [];
    for (const item of pool) {
      const snippet = String(item).split(/[.!?]/)[0].trim().slice(0, 120);
      if (!snippet || seen.has(snippet.toLowerCase())) continue;
      seen.add(snippet.toLowerCase());
      out.push(snippet);
      if (out.length >= count) break;
    }
    while (out.length < count) {
      out.push("This is not mentioned on this slide.");
    }
    return out;
  }

  function faqsToQuestions(faqs, limit) {
    const list = Array.isArray(faqs) ? faqs : [];
    const max = Math.min(limit || 3, list.length);
    const questions = [];

    for (let i = 0; i < max; i += 1) {
      const faq = list[i];
      const correct = String(faq.answer || "").split(/[.!?]/)[0].trim();
      if (!correct) continue;
      const wrongPool = list
        .filter((_, j) => j !== i)
        .map((f) => f.answer);
      const distractors = pickDistractors(correct, wrongPool, 2);
      const options = [correct, ...distractors];
      const seed = (faq.patterns?.[0] || "q").length + i * 3;
      for (let j = options.length - 1; j > 0; j -= 1) {
        const k = (seed + j * 7) % (j + 1);
        [options[j], options[k]] = [options[k], options[j]];
      }
      const correctIndex = options.indexOf(correct);
      questions.push({
        id: `faq-${i}`,
        type: "mcq",
        text: patternToQuestion(faq.patterns?.[0]),
        options,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        tutorHint: faq.answer,
      });
    }
    return questions;
  }

  function studentQuestionsForSlide(bank, slideIndex, limit) {
    if (!bank?.questions) return [];
    const matches = bank.questions.filter(
      (q) => q.slideIndex === slideIndex && q.question && q.answer
    );
    const max = Math.min(limit || 2, matches.length);
    return matches.slice(0, max).map((q, i) => ({
      id: q.id || `sq-${slideIndex}-${i}`,
      type: "short",
      text: q.question,
      accept: buildAcceptTokens(q.answer, q.patterns),
      tutorHint: q.tutorHint || q.answer,
    }));
  }

  function buildAcceptTokens(answer, patterns) {
    const tokens = new Set();
    const add = (s) => {
      String(s || "")
        .toLowerCase()
        .split(/[^a-z0-9']+/)
        .filter((w) => w.length > 3)
        .forEach((w) => tokens.add(w));
    };
    add(answer);
    (patterns || []).forEach(add);
    return [...tokens].slice(0, 12);
  }

  function lessonLevelQuestions(content, limit) {
    if (!content) return [];
    const points = content.keyPoints || [];
    const max = Math.min(limit || 2, points.length);
    return points.slice(0, max).map((point, i) => ({
      id: `kp-${i}`,
      type: "short",
      text: `Explain this key idea in your own words: "${point}"`,
      accept: buildAcceptTokens(point, []),
      tutorHint: point,
    }));
  }

  async function resolveQuestions(lessonId, slideIndex, slideChunk, topicContent, basePath) {
    const readingBank = await loadReadingBank(lessonId, basePath);
    const explicit = readingBank?.slides?.[String(slideIndex)];
    if (Array.isArray(explicit) && explicit.length) return explicit;

    const fromFaqs = faqsToQuestions(slideChunk?.faqs, 3);
    if (fromFaqs.length) return fromFaqs;

    const studentBank = await loadStudentQuestions(lessonId, basePath);
    const fromStudent = studentQuestionsForSlide(studentBank, slideIndex, 2);
    if (fromStudent.length) return fromStudent;

    if (slideChunk?.faqs?.length) return faqsToQuestions(slideChunk.faqs, 2);

    return lessonLevelQuestions(topicContent, 2);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTerms(terms) {
    if (!terms?.length) return "";
    const chips = terms.map((t) => `<span class="reading-term">${escapeHtml(t)}</span>`).join("");
    return `<section class="reading-terms" aria-label="Key terms"><h2>Key terms</h2><div class="reading-term-list">${chips}</div></section>`;
  }

  function renderScript(script, hint, fallback) {
    const body = script || hint || fallback || "Written text for this slide is being prepared.";
    return `<section class="reading-script" aria-label="Written narration">
      <h2>Written version</h2>
      <div class="reading-script-body">${escapeHtml(body).replace(/\n/g, "<br>")}</div>
    </section>`;
  }

  function renderQuestionCard(q, index, total, saved) {
    const answered = saved?.[q.id];
    if (q.type === "short") {
      const value = answered?.response || "";
      const feedback = answered
        ? (answered.correct
          ? "Well done — you picked up the main idea."
          : (q.tutorHint || "Not quite. Read the written version again and try different words."))
        : "";
      return `<article class="reading-question reading-question--short" data-qid="${escapeHtml(q.id)}">
        <p class="reading-question-progress">Question ${index + 1} of ${total}</p>
        <h3>${escapeHtml(q.text)}</h3>
        <textarea class="reading-short-input" rows="3" placeholder="Type your answer…" ${answered ? "disabled" : ""}>${escapeHtml(value)}</textarea>
        <button type="button" class="reading-check-btn" ${answered ? "disabled" : ""}>Check answer</button>
        <p class="reading-feedback ${answered ? (answered.correct ? "is-correct" : "is-wrong") : ""}" ${answered ? "" : "hidden"}>${escapeHtml(feedback)}</p>
      </article>`;
    }

    const optionsHtml = (q.options || []).map((label, optIndex) => {
      let cls = "reading-option";
      if (answered) {
        if (answered.selectedIndex === optIndex) cls += answered.correct ? " is-correct" : " is-wrong";
        if (optIndex === q.correctIndex) cls += " is-correct";
      }
      return `<button type="button" class="${cls}" data-opt="${optIndex}" ${answered ? "disabled" : ""}>${escapeHtml(label)}</button>`;
    }).join("");

    const mcqFeedback = answered
      ? (answered.correct
        ? "Correct. Well done."
        : (q.tutorHint || "Not quite. Check the highlighted answer and read the script again."))
      : "";

    return `<article class="reading-question reading-question--mcq" data-qid="${escapeHtml(q.id)}">
      <p class="reading-question-progress">Question ${index + 1} of ${total}</p>
      <h3>${escapeHtml(q.text)}</h3>
      <div class="reading-options">${optionsHtml}</div>
      <p class="reading-feedback ${answered ? (answered.correct ? "is-correct" : "is-wrong") : ""}" ${answered ? "" : "hidden"}>${escapeHtml(mcqFeedback)}</p>
    </article>`;
  }

  async function init(options = {}) {
    const root = options.root || global.document;
    const basePath = options.basePath ?? "../../";
    const params = new URLSearchParams(global.location.search);
    const lessonParam = params.get("lesson") || "";
    const slideIndex = parseSlideParam(params.get("slide"));

    const parsed = parseLessonPath(lessonParam);
    const shell = root.getElementById("reading-shell");
    if (!shell) return;

    if (!parsed) {
      shell.innerHTML = `<p class="reading-error">Missing or invalid lesson link. Open this page from a lesson slide using "Read &amp; practise".</p>`;
      return;
    }

    const { lessonId, moduleId, lessonRelPath } = parsed;
    const lessonNum = lessonId.replace("lesson-", "");
    const backHref = `${basePath}${lessonRelPath}.html`;

    const backLink = root.getElementById("reading-back");
    if (backLink) backLink.href = backHref;

    shell.innerHTML = `<p class="reading-loading">Loading…</p>`;

    const profile = global.EvoAgentKnowledge?.getStudentProfile?.() || null;
    const level = profile?.level || 1;

    const topics = await global.EvoAgentKnowledge?.getTopicsForLesson?.(lessonId, basePath) || [];
    const topicMeta = topics[0] || null;
    const topicContent = topicMeta
      ? await global.EvoAgentKnowledge?.getTopicContent?.(topicMeta.topicId, level, basePath)
      : null;

    let slideChunk = null;
    if (topicMeta?.topicId) {
      slideChunk = await global.EvoAgentKnowledge?.getSlideChunk?.(topicMeta.topicId, slideIndex, basePath);
    }

    const title = slideChunk?.title
      || (slideIndex === 0 ? topicContent?.topicTitle : `Slide ${slideIndex + 1}`);
    const script = slideChunk?.script || slideChunk?.hint || "";
    const terms = slideChunk?.terms || topicContent?.keywords?.slice(0, 8) || [];
    const fallbackText = !slideChunk && topicContent
      ? [topicContent.summary, ...(topicContent.keyPoints || [])].filter(Boolean).join(" ")
      : "";

    const questions = await resolveQuestions(
      lessonId,
      slideIndex,
      slideChunk,
      topicContent,
      basePath
    );

    const savedLesson = loadStore()[lessonId]?.[String(slideIndex)] || {};

    const eyebrow = root.getElementById("reading-eyebrow");
    if (eyebrow) {
      eyebrow.textContent = `Citizenship · ${moduleId.replace("-", " ")} · Lesson ${lessonNum} · Slide ${slideIndex + 1}`;
    }
    const titleEl = root.getElementById("reading-title");
    if (titleEl) titleEl.textContent = title || "Reading practice";

    shell.innerHTML = `
      ${renderScript(script, slideChunk?.hint, fallbackText)}
      ${renderTerms(terms)}
      <section class="reading-practise" aria-label="Comprehension questions">
        <h2>Practise</h2>
        ${questions.length
          ? `<div class="reading-questions">${questions.map((q, i) => renderQuestionCard(q, i, questions.length, savedLesson)).join("")}</div>`
          : `<p class="reading-empty">Comprehension questions for this slide are being prepared. Read the text above and ask your tutor if anything is unclear.</p>`}
      </section>
    `;

    shell.querySelectorAll(".reading-question--mcq").forEach((card) => {
      const qid = card.dataset.qid;
      const question = questions.find((q) => q.id === qid);
      if (!question) return;

      card.querySelectorAll(".reading-option").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (savedLesson[qid]) return;
          const selectedIndex = Number(btn.dataset.opt);
          const correct = selectedIndex === question.correctIndex;
          recordAttempt(lessonId, slideIndex, qid, { correct, selectedIndex, type: "mcq" });
          savedLesson[qid] = { correct, selectedIndex, type: "mcq" };

          card.querySelectorAll(".reading-option").forEach((opt) => {
            opt.disabled = true;
            const idx = Number(opt.dataset.opt);
            if (idx === selectedIndex) opt.classList.add(correct ? "is-correct" : "is-wrong");
            if (idx === question.correctIndex) opt.classList.add("is-correct");
          });

          const feedback = card.querySelector(".reading-feedback");
          if (feedback) {
            feedback.hidden = false;
            feedback.textContent = correct
              ? "Correct. Well done."
              : (question.tutorHint || "Not quite. Check the highlighted answer.");
            feedback.classList.add(correct ? "is-correct" : "is-wrong");
          }
        });
      });
    });

    shell.querySelectorAll(".reading-question--short").forEach((card) => {
      const qid = card.dataset.qid;
      const question = questions.find((q) => q.id === qid);
      if (!question) return;

      const input = card.querySelector(".reading-short-input");
      const checkBtn = card.querySelector(".reading-check-btn");
      if (!checkBtn || !input) return;

      checkBtn.addEventListener("click", () => {
        if (savedLesson[qid]) return;
        const response = input.value.trim();
        const correct = shortAnswer(response, question.accept);
        recordAttempt(lessonId, slideIndex, qid, { correct, response, type: "short" });
        savedLesson[qid] = { correct, response, type: "short" };

        input.disabled = true;
        checkBtn.disabled = true;

        const feedback = card.querySelector(".reading-feedback");
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = correct
            ? "Well done — you picked up the main idea."
            : (question.tutorHint || "Not quite. Try again after re-reading the text.");
          feedback.classList.add(correct ? "is-correct" : "is-wrong");
        }
      });
    });
  }

  global.EvoLessonReading = {
    init,
    parseLessonPath,
    parseSlideParam,
    STORAGE_KEY,
  };

  if (global.document?.currentScript?.dataset?.autoInit !== undefined) {
    global.addEventListener("DOMContentLoaded", () => {
      init({ basePath: "../../" });
    });
  }
})(window);
