/**
 * EVOlearn — in-lesson checkpoint auto-save (slide position, quiz view, time spent)
 *
 * localStorage key: evoLessonCheckpoints — { [progressKey]: checkpoint }
 *
 * EvoLessonProgress.bind({
 *   progressKey, lessonId,
 *   getState: () => ({ slideIndex, lessonStarted, quizActive, ... }),
 * })
 */
(function (global) {
  const STORAGE_KEY = "evoLessonCheckpoints";
  const DEBOUNCE_MS = 800;

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
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    global.EvoStudentSync?.notifyChange?.("lesson-checkpoint");
  }

  function isLessonComplete(progressKey) {
    if (!progressKey) return false;
    return Boolean(global.EvoLessonCompletion?.getDone?.().has(progressKey));
  }

  function shouldSkipCheckpoint(options) {
    if (!options?.progressKey) return true;
    if (options.skipIfComplete !== false && isLessonComplete(options.progressKey)) return true;
    if (options.skipRevision !== false && global.EvoLessonPptViewer?.detectRevisionMode?.()) return true;
    return false;
  }

  function normaliseCheckpoint(raw, progressKey, lessonId) {
    if (!raw || typeof raw !== "object") return null;
    const slideIndex = Number.isFinite(Number(raw.slideIndex))
      ? Math.max(0, Math.floor(Number(raw.slideIndex)))
      : 0;
    const highestUnlockedSlide = Number.isFinite(Number(raw.highestUnlockedSlide))
      ? Math.max(0, Math.floor(Number(raw.highestUnlockedSlide)))
      : slideIndex;
    const visitedSlides = Array.isArray(raw.visitedSlides)
      ? [...new Set(raw.visitedSlides.map((n) => Math.max(0, Math.floor(Number(n)))).filter(Number.isFinite))]
      : [];
    return {
      progressKey: raw.progressKey || progressKey,
      lessonId: raw.lessonId || lessonId || "",
      slideIndex,
      lessonStarted: Boolean(raw.lessonStarted),
      quizActive: Boolean(raw.quizActive),
      highestUnlockedSlide: Math.max(highestUnlockedSlide, slideIndex),
      visitedSlides,
      timeSpentMs: Math.max(0, Number(raw.timeSpentMs) || 0),
      updatedAt: raw.updatedAt || null,
    };
  }

  function loadCheckpoint(progressKey) {
    if (!progressKey) return null;
    const entry = loadStore()[progressKey];
    return normaliseCheckpoint(entry, progressKey, entry?.lessonId);
  }

  function saveCheckpoint(progressKey, payload) {
    if (!progressKey || !payload) return null;
    const store = loadStore();
    const next = normaliseCheckpoint(
      { ...payload, progressKey, updatedAt: new Date().toISOString() },
      progressKey,
      payload.lessonId,
    );
    store[progressKey] = next;
    saveStore(store);
    return next;
  }

  function clearCheckpoint(progressKey) {
    if (!progressKey) return;
    const store = loadStore();
    if (!store[progressKey]) return;
    delete store[progressKey];
    saveStore(store);
  }

  function applyCheckpoint(progressKey, options = {}) {
    if (shouldSkipCheckpoint({ progressKey, ...options })) return null;
    const checkpoint = loadCheckpoint(progressKey);
    if (!checkpoint) return null;
    if (typeof options.onRestore === "function") {
      try {
        options.onRestore(checkpoint);
      } catch {
        /* ignore listener errors */
      }
    }
    return checkpoint;
  }

  function bind(options = {}) {
    const {
      progressKey,
      lessonId = "",
      getState,
      debounceMs = DEBOUNCE_MS,
      skipIfComplete = true,
      skipRevision = true,
      root = global.document,
    } = options;

    if (!progressKey) return null;

    let sessionStartedAt = Date.now();
    let baseTimeSpentMs = loadCheckpoint(progressKey)?.timeSpentMs || 0;
    let timer = null;

    function skipOptions() {
      return { progressKey, skipIfComplete, skipRevision };
    }

    function buildPayload() {
      const state = typeof getState === "function" ? getState() : {};
      const slideIndex = Number.isFinite(Number(state.slideIndex))
        ? Math.max(0, Math.floor(Number(state.slideIndex)))
        : (Number.isFinite(Number(state.currentSlide))
          ? Math.max(0, Math.floor(Number(state.currentSlide)))
          : 0);
      const highestUnlockedSlide = Number.isFinite(Number(state.highestUnlockedSlide))
        ? Math.max(0, Math.floor(Number(state.highestUnlockedSlide)))
        : slideIndex;
      let visitedSlides = [];
      if (Array.isArray(state.visitedSlides)) {
        visitedSlides = [...state.visitedSlides];
      } else if (state.visitedSlides?.forEach) {
        state.visitedSlides.forEach((value) => visitedSlides.push(value));
      }

      return {
        progressKey,
        lessonId,
        slideIndex,
        lessonStarted: Boolean(state.lessonStarted),
        quizActive: Boolean(state.quizActive),
        highestUnlockedSlide: Math.max(highestUnlockedSlide, slideIndex),
        visitedSlides,
        timeSpentMs: baseTimeSpentMs + Math.max(0, Date.now() - sessionStartedAt),
      };
    }

    function saveNow() {
      if (shouldSkipCheckpoint(skipOptions())) return null;
      const payload = buildPayload();
      if (!payload.lessonStarted && !payload.quizActive) return null;
      const saved = saveCheckpoint(progressKey, buildPayload());
      if (saved) {
        baseTimeSpentMs = saved.timeSpentMs;
        sessionStartedAt = Date.now();
      }
      return saved;
    }

    function schedule() {
      if (shouldSkipCheckpoint(skipOptions())) return;
      if (timer) global.clearTimeout(timer);
      timer = global.setTimeout(() => {
        timer = null;
        saveNow();
      }, debounceMs);
    }

    function flush() {
      if (timer) {
        global.clearTimeout(timer);
        timer = null;
      }
      saveNow();
      try {
        global.EvoStudentSync?.flushSave?.("lesson-checkpoint");
      } catch {
        /* sync optional */
      }
    }

    function onPageHide() {
      flush();
    }

    global.addEventListener("pagehide", onPageHide);
    global.addEventListener("beforeunload", onPageHide);

    const navRoot = root || global.document;
    navRoot.querySelectorAll("a.lesson-back, a.lesson-complete-ghost").forEach((link) => {
      link.addEventListener("click", () => flush());
    });

    return {
      progressKey,
      schedule,
      flush,
      saveNow,
      destroy() {
        if (timer) global.clearTimeout(timer);
        global.removeEventListener("pagehide", onPageHide);
        global.removeEventListener("beforeunload", onPageHide);
      },
    };
  }

  global.EvoLessonProgress = {
    STORAGE_KEY,
    loadCheckpoint,
    saveCheckpoint,
    clearCheckpoint,
    applyCheckpoint,
    bind,
  };
})(window);
