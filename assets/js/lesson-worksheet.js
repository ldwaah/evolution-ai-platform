/**
 * EVOlearn — in-lesson pop-up worksheets (mid-slide flow)
 *
 * Init: EvoLessonWorksheet.createController({ lessonId, basePath, mountEl, ... })
 * Storage: localStorage key evoWorksheetAnswers
 *
 * Worksheet gate: WORKSHEET_GATE_ENABLED (below). When false, Next is never blocked by
 * worksheets (overlays are skipped). Set true before Netlify deploy for production.
 */
(function (global) {
  // Re-enable before Netlify deploy: set to true to require worksheet submit before Next.
  const WORKSHEET_GATE_ENABLED = false;

  const STORAGE_KEY = "evoWorksheetAnswers";
  const PROGRESS_STORE = "evolearn-progress";
  const ANSWER_SELECTOR = ".lesson-worksheet-input, .lesson-worksheet-textarea";

  function isLessonComplete(progressKey) {
    if (!progressKey) return false;
    if (global.EvoLessonCompletion?.getDone) {
      return global.EvoLessonCompletion.getDone().has(progressKey);
    }
    if (global.EvoLessonPptViewer?.isProgressComplete) {
      return global.EvoLessonPptViewer.isProgressComplete(progressKey);
    }
    try {
      const done = new Set(JSON.parse(global.localStorage.getItem(PROGRESS_STORE)) || []);
      return done.has(progressKey);
    } catch {
      return false;
    }
  }

  function loadAnswerStore() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
      return {};
    }
  }

  function saveAnswerStore(store) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    global.EvoStudentSync?.notifyChange?.("worksheet");
  }

  function getLessonAnswers(lessonId) {
    return loadAnswerStore()[lessonId] || {};
  }

  function saveWorksheetAnswer(lessonId, worksheetId, payload) {
    const store = loadAnswerStore();
    const lesson = { ...(store[lessonId] || {}) };
    lesson[worksheetId] = payload;
    store[lessonId] = lesson;
    saveAnswerStore(store);
  }

  function isWorksheetComplete(lessonId, worksheetId) {
    const entry = getLessonAnswers(lessonId)[worksheetId];
    return Boolean(entry?.completedAt);
  }

  function worksheetUrl(basePath, lessonId) {
    const prefix = basePath || "";
    return `${prefix}assets/data/lesson-worksheets/${lessonId}.json`;
  }

  function sanitizeDashes(text) {
    return String(text || "").replace(/\s*[—–]\s*/g, ". ");
  }

  function displayText(text) {
    return sanitizeDashes(text);
  }

  function getStudentLevel() {
    const level = global.EvoStudentProfile?.getStudentLevel?.();
    return typeof level === "number" && level >= 1 ? level : null;
  }

  function resolveLevelCopy(worksheet, field) {
    const level = getStudentLevel();
    const levels = worksheet.levels || {};
    if (level != null) {
      const exact = levels[String(level)];
      if (exact?.[field]) return exact[field];
      const keys = Object.keys(levels)
        .map((k) => Number(k))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);
      let fallback = null;
      for (const key of keys) {
        if (key <= level && levels[String(key)]?.[field]) fallback = levels[String(key)][field];
      }
      if (fallback) return fallback;
    }
    return worksheet[field] || "";
  }

  function bindClipboardGuard(root) {
    if (!root || root.dataset.worksheetGuardBound === "1") return;
    root.dataset.worksheetGuardBound = "1";

    const blockIfAnswer = (event) => {
      if (event.target?.closest?.(ANSWER_SELECTOR)) event.preventDefault();
    };

    root.addEventListener("paste", blockIfAnswer, true);
    root.addEventListener("copy", blockIfAnswer, true);
    root.addEventListener("cut", blockIfAnswer, true);
    root.addEventListener("drop", blockIfAnswer, true);
  }

  function prepareTextInput(el) {
    if (!el) return;
    el.classList.add("lesson-worksheet-input");
    el.setAttribute("autocomplete", "off");
    el.setAttribute("spellcheck", el.tagName === "TEXTAREA" ? "true" : "false");
  }

  async function loadWorksheetData(basePath, lessonId) {
    const response = await fetch(worksheetUrl(basePath, lessonId));
    if (!response.ok) throw new Error(`Worksheets not found: ${lessonId}`);
    return response.json();
  }

  function findWorksheetForSlide(worksheets, slideIndex) {
    return (worksheets || []).find((ws) => ws.triggerAfterSlideIndex === slideIndex) || null;
  }

  function createController(options = {}) {
    const {
      lessonId,
      basePath = "",
      mountEl = null,
      getSlideIndex = () => 0,
      isEnabled = () => true,
      onGateChange = () => {},
      getChat = () => null,
      progressKey = null,
      revisionMode = false,
    } = options;

    const isRevision = () => revisionMode || global.EvoLessonPptViewer?.detectRevisionMode?.();
    const isReplay = () => isLessonComplete(progressKey);
    const isSkimMode = () => isRevision() || isReplay();

    let worksheets = [];
    let loaded = false;
    let loadError = null;
    let overlay = null;
    let activeWorksheet = null;
    let advanceBlocked = false;
    let draft = null;
    let stepIndex = 0;

    function notifyGateChange() {
      try {
        onGateChange();
      } catch {
        /* ignore */
      }
    }

    function setAdvanceBlocked(blocked) {
      if (advanceBlocked === blocked) return;
      advanceBlocked = blocked;
      notifyGateChange();
    }

    function canAdvanceForward() {
      if (!isEnabled()) return true;
      if (isSkimMode() || !WORKSHEET_GATE_ENABLED) return true;
      return !advanceBlocked;
    }

    function ensureOverlay() {
      if (overlay) return overlay;
      const host = mountEl || global.document.getElementById("lesson-stage");
      if (!host) return null;

      overlay = global.document.createElement("div");
      overlay.className = "lesson-worksheet-overlay";
      overlay.hidden = true;
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.innerHTML = `
        <div class="lesson-worksheet-card" tabindex="-1">
          <header class="lesson-worksheet-header">
            <p class="lesson-worksheet-kicker">Quick check</p>
            <h2 class="lesson-worksheet-title"></h2>
          </header>
          <div class="lesson-worksheet-body" aria-live="polite"></div>
          <footer class="lesson-worksheet-footer">
            <button type="button" class="lesson-worksheet-submit" disabled>Submit</button>
          </footer>
        </div>
      `;
      host.appendChild(overlay);
      bindClipboardGuard(overlay);
      return overlay;
    }

    function hideOverlay() {
      if (!overlay) return;
      overlay.hidden = true;
      overlay.classList.remove("is-visible");
      activeWorksheet = null;
      draft = null;
      stepIndex = 0;
      setAdvanceBlocked(false);
    }

    function getSubmitButton() {
      return overlay?.querySelector(".lesson-worksheet-submit");
    }

    function updateSubmitState() {
      const btn = getSubmitButton();
      if (!btn || !activeWorksheet) return;

      if (activeWorksheet.type === "word-bank-pick") {
        const picked = draft?.picked || [];
        btn.disabled = picked.length !== (activeWorksheet.pickCount || 3);
        return;
      }

      if (activeWorksheet.type === "binary-sort") {
        const items = activeWorksheet.items || [];
        const answers = draft?.sortAnswers || {};
        btn.disabled = items.some((item) => !answers[item.id]);
      }
    }

    function renderWordBankPick(ws) {
      const body = overlay.querySelector(".lesson-worksheet-body");
      const instruction = displayText(resolveLevelCopy(ws, "instruction"));
      const picked = new Set(draft?.picked || []);
      const pickCount = ws.pickCount || 3;

      body.innerHTML = `
        <p class="lesson-worksheet-instruction">${instruction}</p>
        <p class="lesson-worksheet-counter">Pick ${pickCount} · ${picked.size} selected</p>
        <div class="lesson-worksheet-options" role="group" aria-label="Word bank"></div>
      `;

      const optionsEl = body.querySelector(".lesson-worksheet-options");
      (ws.options || []).forEach((label) => {
        const btn = global.document.createElement("button");
        btn.type = "button";
        btn.className = "lesson-worksheet-option";
        btn.textContent = displayText(label);
        btn.dataset.value = label;
        if (picked.has(label)) btn.classList.add("is-selected");
        btn.addEventListener("click", () => {
          const next = new Set(draft?.picked || []);
          if (next.has(label)) {
            next.delete(label);
          } else if (next.size < pickCount) {
            next.add(label);
          }
          draft = { ...(draft || {}), picked: [...next] };
          body.querySelector(".lesson-worksheet-counter").textContent =
            `Pick ${pickCount} · ${next.size} selected`;
          optionsEl.querySelectorAll(".lesson-worksheet-option").forEach((option) => {
            option.classList.toggle("is-selected", next.has(option.dataset.value));
            option.disabled = !next.has(option.dataset.value) && next.size >= pickCount;
          });
          updateSubmitState();
        });
        optionsEl.appendChild(btn);
      });

      optionsEl.querySelectorAll(".lesson-worksheet-option").forEach((option) => {
        option.disabled = !picked.has(option.dataset.value) && picked.size >= pickCount;
      });
    }

    function renderBinarySortStep(ws) {
      const body = overlay.querySelector(".lesson-worksheet-body");
      const items = ws.items || [];
      const answers = draft?.sortAnswers || {};
      const instruction = displayText(resolveLevelCopy(ws, "instruction"));
      const total = items.length;
      const currentItem = items[stepIndex];
      const doneCount = items.filter((item) => answers[item.id]).length;

      if (!currentItem) {
        body.innerHTML = `<p class="lesson-worksheet-instruction">${instruction}</p>`;
        updateSubmitState();
        return;
      }

      body.innerHTML = `
        <p class="lesson-worksheet-instruction">${instruction}</p>
        <p class="lesson-worksheet-sort-progress">Item ${stepIndex + 1} of ${total} · ${doneCount} sorted</p>
        <div class="lesson-worksheet-sort-row">
          <p class="lesson-worksheet-sort-label">${displayText(currentItem.text)}</p>
          <div class="lesson-worksheet-sort-actions"></div>
        </div>
      `;

      const actions = body.querySelector(".lesson-worksheet-sort-actions");
      (ws.categories || []).forEach((category) => {
        const btn = global.document.createElement("button");
        btn.type = "button";
        btn.className = "lesson-worksheet-sort-btn";
        btn.textContent = displayText(category.label);
        btn.dataset.categoryId = category.id;
        if (answers[currentItem.id] === category.id) btn.classList.add("is-selected");
        btn.addEventListener("click", () => {
          const nextAnswers = { ...(draft?.sortAnswers || {}), [currentItem.id]: category.id };
          draft = { ...(draft || {}), sortAnswers: nextAnswers };
          actions.querySelectorAll(".lesson-worksheet-sort-btn").forEach((el) => {
            el.classList.toggle("is-selected", el.dataset.categoryId === category.id);
          });
          if (stepIndex < items.length - 1) {
            stepIndex += 1;
            global.setTimeout(() => renderBinarySortStep(ws), 280);
          }
          updateSubmitState();
        });
        actions.appendChild(btn);
      });
    }

    function renderActiveWorksheet() {
      if (!overlay || !activeWorksheet) return;

      overlay.querySelector(".lesson-worksheet-title").textContent =
        displayText(activeWorksheet.title || "Quick check");

      if (activeWorksheet.type === "word-bank-pick") {
        renderWordBankPick(activeWorksheet);
      } else if (activeWorksheet.type === "binary-sort") {
        renderBinarySortStep(activeWorksheet);
      }

      updateSubmitState();
      overlay.querySelector(".lesson-worksheet-card")?.focus?.();
    }

    function buildAnswerPayload(ws) {
      if (ws.type === "word-bank-pick") {
        return {
          type: ws.type,
          picked: [...(draft?.picked || [])],
        };
      }
      if (ws.type === "binary-sort") {
        const answers = draft?.sortAnswers || {};
        const scored = (ws.items || []).map((item) => ({
          itemId: item.id,
          text: item.text,
          selectedCategory: answers[item.id] || null,
          correctCategory: item.correctCategory,
          correct: answers[item.id] === item.correctCategory,
        }));
        return {
          type: ws.type,
          items: scored,
          correctCount: scored.filter((row) => row.correct).length,
        };
      }
      return { type: ws.type, raw: draft };
    }

    function maybeTutorMessage(ws, payload) {
      const chat = typeof getChat === "function" ? getChat() : null;
      if (!chat?.pushAgentMessage) return;

      const message = ws.submitMessage
        || "Thanks for completing that quick check. Carry on with the lesson.";
      chat.pushAgentMessage(displayText(message), `worksheet:${ws.id}`);
    }

    function submitActiveWorksheet() {
      if (!activeWorksheet || !lessonId) return;

      const payload = {
        worksheetId: activeWorksheet.id,
        triggerAfterSlideIndex: activeWorksheet.triggerAfterSlideIndex,
        title: activeWorksheet.title,
        answers: buildAnswerPayload(activeWorksheet),
        completedAt: new Date().toISOString(),
      };

      saveWorksheetAnswer(lessonId, activeWorksheet.id, payload);
      maybeTutorMessage(activeWorksheet, payload);

      global.dispatchEvent(new CustomEvent("evolearn:worksheet-complete", {
        detail: { lessonId, worksheetId: activeWorksheet.id, payload },
      }));

      hideOverlay();
      notifyGateChange();
    }

    function showWorksheet(ws) {
      if (!ws || !isEnabled() || isSkimMode() || !WORKSHEET_GATE_ENABLED) return;
      if (isWorksheetComplete(lessonId, ws.id)) return;

      ensureOverlay();
      if (!overlay) return;

      activeWorksheet = ws;
      draft = {};
      stepIndex = 0;
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add("is-visible"));
      setAdvanceBlocked(true);
      renderActiveWorksheet();

      const submitBtn = getSubmitButton();
      if (submitBtn && !submitBtn.dataset.bound) {
        submitBtn.dataset.bound = "true";
        submitBtn.addEventListener("click", submitActiveWorksheet);
      }
    }

    function checkAfterNarration(slideIndex) {
      if (!loaded || loadError || !isEnabled() || isSkimMode() || !WORKSHEET_GATE_ENABLED) return;
      const ws = findWorksheetForSlide(worksheets, slideIndex);
      if (!ws || isWorksheetComplete(lessonId, ws.id)) return;
      showWorksheet(ws);
    }

    function hasPendingWorksheet(slideIndex) {
      if (!loaded || !isEnabled() || isSkimMode() || !WORKSHEET_GATE_ENABLED) return false;
      const ws = findWorksheetForSlide(worksheets, slideIndex);
      return Boolean(ws && !isWorksheetComplete(lessonId, ws.id));
    }

    function onSlideShown(slideIndex, { narrationUnlocked = false } = {}) {
      if (!isEnabled() || isSkimMode() || !WORKSHEET_GATE_ENABLED) {
        hideOverlay();
        return;
      }

      const ws = findWorksheetForSlide(worksheets, slideIndex);
      const pending = Boolean(ws && !isWorksheetComplete(lessonId, ws.id));

      if (pending && narrationUnlocked) {
        showWorksheet(ws);
        return;
      }

      if (!pending) {
        if (activeWorksheet) hideOverlay();
        else setAdvanceBlocked(false);
      }
      // Pending but narration still locked: narration gate holds Next; checkAfterNarration
      // or changeSlide opens the worksheet once audio unlocks.
    }

    async function init() {
      if (!lessonId) return false;
      try {
        const data = await loadWorksheetData(basePath, lessonId);
        worksheets = data.worksheets || [];
        loaded = true;
        loadError = null;
      } catch (err) {
        worksheets = [];
        loaded = true;
        loadError = err;
      }
      return !loadError;
    }

    return {
      init,
      canAdvanceForward,
      checkAfterNarration,
      hasPendingWorksheet,
      onSlideShown,
      isWorksheetComplete: (worksheetId) => isWorksheetComplete(lessonId, worksheetId),
      showWorksheet,
      hideOverlay,
      getWorksheets: () => worksheets.slice(),
    };
  }

  global.EvoLessonWorksheet = {
    STORAGE_KEY,
    WORKSHEET_GATE_ENABLED,
    sanitizeDashes,
    displayText,
    getLessonAnswers,
    isWorksheetComplete,
    loadWorksheetData,
    createController,
  };
})(window);
