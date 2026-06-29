/**
 * EVOlearn — lesson completion gating (end quiz must finish first)
 *
 * EvoLessonCompletion.bind({
 *   progressKey, lessonId, btn, mapUrl,
 *   requireQuizView: true,  // PPT lessons: quiz screen must be active
 *   getState: () => ({ lessonStarted, quizActive }),
 * })
 */
(function (global) {
  const STORE = "evolearn-progress";

  function getDone() {
    try {
      return new Set(JSON.parse(global.localStorage.getItem(STORE)) || []);
    } catch {
      return new Set();
    }
  }

  function markComplete(progressKey) {
    const done = getDone();
    if (done.has(progressKey)) return false;
    done.add(progressKey);
    global.localStorage.setItem(STORE, JSON.stringify([...done]));
    try {
      global.EvoLessonProgress?.clearCheckpoint?.(progressKey);
    } catch { /* checkpoint optional */ }
    global.EvoStudentSync?.notifyChange?.("lesson-complete");
    return true;
  }

  function isEndQuizDone(lessonId) {
    return Boolean(global.EvoLessonEndQuiz?.isComplete?.(lessonId));
  }

  function getButtonHint({
    progressKey,
    lessonId,
    lessonStarted = true,
    quizActive = false,
    requireQuizView = false,
  } = {}) {
    if (getDone().has(progressKey)) {
      return { text: "Lesson complete ✓", disabled: true, done: true };
    }
    if (lessonStarted === false) {
      return { text: "Start lesson to complete", disabled: true, done: false };
    }
    if (requireQuizView && !quizActive) {
      const label = global.EvoLessonPptViewer?.incompleteLessonLabel?.()
        || "Keep going through the lesson";
      return { text: label, disabled: true, done: false };
    }
    if (!isEndQuizDone(lessonId)) {
      return { text: "Complete the end quiz first", disabled: true, done: false };
    }
    return { text: "Mark lesson complete ✓", disabled: false, done: false };
  }

  function canComplete({
    progressKey,
    lessonId,
    lessonStarted = true,
    quizActive = false,
    requireQuizView = false,
  } = {}) {
    if (getDone().has(progressKey)) return false;
    if (lessonStarted === false) return false;
    if (requireQuizView && !quizActive) return false;
    return isEndQuizDone(lessonId);
  }

  function bind(options) {
    const {
      progressKey,
      lessonId,
      btn,
      mapUrl,
      getState,
      requireQuizView = false,
      redirectOnComplete = true,
    } = options;

    if (!btn || !progressKey || !lessonId) return null;

    function state() {
      const extra = typeof getState === "function" ? getState() : {};
      return {
        lessonStarted: extra.lessonStarted !== false,
        quizActive: Boolean(extra.quizActive),
      };
    }

    function refresh() {
      const s = state();
      const hint = getButtonHint({
        progressKey,
        lessonId,
        lessonStarted: s.lessonStarted,
        quizActive: s.quizActive,
        requireQuizView,
      });
      btn.textContent = hint.text;
      btn.disabled = hint.disabled;
      btn.classList.toggle("is-done", hint.done);
    }

    btn.addEventListener("click", () => {
      const s = state();
      if (!canComplete({
        progressKey,
        lessonId,
        lessonStarted: s.lessonStarted,
        quizActive: s.quizActive,
        requireQuizView,
      })) return;
      markComplete(progressKey);
      try {
        const parts = String(progressKey || "").split(".");
        global.EvoStudentSync?.recordLessonComplete?.(
          progressKey,
          parts[2] || "",
          parts[1] || "",
        );
      } catch { /* sync optional */ }
      refresh();
      if (redirectOnComplete && mapUrl) {
        global.setTimeout(() => { global.location.href = mapUrl; }, 450);
      }
    });

    global.addEventListener("evolearn:end-quiz-complete", (event) => {
      if (event.detail?.lessonId === lessonId) refresh();
    });

    const checkpoint = global.EvoLessonProgress?.bind?.({
      progressKey,
      lessonId,
      getState,
    });

    refresh();
    return {
      refresh,
      markComplete: () => { markComplete(progressKey); refresh(); },
      checkpoint,
      scheduleSave: () => checkpoint?.schedule?.(),
      flushSave: () => checkpoint?.flush?.(),
    };
  }

  global.EvoLessonCompletion = {
    STORE,
    getDone,
    markComplete,
    isEndQuizDone,
    getButtonHint,
    canComplete,
    bind,
  };
})(window);
