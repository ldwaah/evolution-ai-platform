/**
 * EVOlearn — end-of-lesson quiz (3 questions, one at a time → profile points)
 *
 * Mount: <div data-lesson-end-quiz></div>
 * Init:  EvoLessonEndQuiz.init({ lessonId, moduleId, basePath, onComplete, getChat })
 */
(function (global) {
  const STORAGE_KEY = "evoEndQuizAnswers";
  const POINTS_TIER = [0, 3, 7, 10];
  const STEP_ADVANCE_MS = 1100;

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
    global.EvoStudentSync?.notifyChange?.("end-quiz");
  }

  function getLessonAnswers(lessonId) {
    return loadAnswerStore()[lessonId] || null;
  }

  function saveLessonAnswers(lessonId, payload) {
    const store = loadAnswerStore();
    store[lessonId] = payload;
    saveAnswerStore(store);
  }

  function calculatePoints(correctCount) {
    const n = Math.min(3, Math.max(0, Number(correctCount) || 0));
    return POINTS_TIER[n];
  }

  function quizUrl(basePath, lessonId) {
    const prefix = basePath || "";
    return `${prefix}assets/data/lesson-quizzes/${lessonId}.json`;
  }

  function shuffleOptions(question, lessonNum) {
    const seed = (question.id || "q").charCodeAt(1) + lessonNum * 7;
    const indices = question.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = (seed + i * 13) % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const correctShuffled = indices.indexOf(question.correctIndex);
    return {
      options: indices.map((i) => question.options[i]),
      correctIndex: correctShuffled >= 0 ? correctShuffled : question.correctIndex,
    };
  }

  function firstUnansweredIndex(questions, saved) {
    const idx = questions.findIndex((q) => !saved?.answers?.[q.id]);
    return idx >= 0 ? idx : questions.length;
  }

  function renderQuestionCard(question, index, total, saved) {
    const card = global.document.createElement("article");
    card.className = "end-quiz-card";
    card.dataset.questionId = question.id;

    const progress = global.document.createElement("p");
    progress.className = "end-quiz-progress";
    progress.textContent = `Question ${index + 1} of ${total}`;
    card.appendChild(progress);

    const title = global.document.createElement("h3");
    title.textContent = question.text;
    card.appendChild(title);

    const options = global.document.createElement("div");
    options.className = "end-quiz-options";

    const answered = saved?.answers?.[question.id];

    question.options.forEach((label, optIndex) => {
      const btn = global.document.createElement("button");
      btn.type = "button";
      btn.className = "end-quiz-option";
      btn.dataset.optionIndex = String(optIndex);
      btn.textContent = label;

      if (answered) {
        btn.disabled = true;
        if (answered.selectedIndex === optIndex) {
          btn.classList.add(answered.correct ? "is-correct" : "is-wrong");
        }
        if (optIndex === question.correctIndex) {
          btn.classList.add("is-correct");
        }
      }

      options.appendChild(btn);
    });

    card.appendChild(options);

    const feedback = global.document.createElement("p");
    feedback.className = "end-quiz-feedback";
    if (answered) {
      feedback.textContent = answered.correct
        ? "Correct. Well done."
        : "Not quite. Check the highlighted answer.";
    }
    card.appendChild(feedback);

    return card;
  }

  function renderResults(container, result) {
    let panel = container.querySelector(".end-quiz-results");
    if (!panel) {
      panel = global.document.createElement("div");
      panel.className = "end-quiz-results";
      container.appendChild(panel);
    }
    panel.innerHTML = `
      <p class="end-quiz-score">Score: <strong>${result.correctCount} / 3</strong></p>
      <p class="end-quiz-points">Points earned: <strong>${result.pointsEarned}</strong> / ${result.maxPoints}</p>
      <p class="end-quiz-total">Profile total: <strong>${result.totalPoints}</strong> points</p>
      ${result.isNewBest && result.previousBest < result.pointsEarned
        ? `<p class="end-quiz-best">New best for this lesson!</p>`
        : result.previousBest >= result.pointsEarned && result.previousBest > 0
          ? `<p class="end-quiz-best">Best for this lesson: ${result.previousBest} pts</p>`
          : ""}
      <p class="end-quiz-hint">Mark the lesson complete when you are ready.</p>
    `;
  }

  async function loadQuizData(basePath, lessonId) {
    const response = await fetch(quizUrl(basePath, lessonId));
    if (!response.ok) throw new Error(`Quiz not found: ${lessonId}`);
    return response.json();
  }

  function prepareQuestions(raw) {
    const lessonNum = Number(String(raw.lessonId).replace("lesson-", "")) || 1;
    return (raw.questions || []).slice(0, 3).map((q) => {
      const shuffled = shuffleOptions(q, lessonNum);
      return { ...q, options: shuffled.options, correctIndex: shuffled.correctIndex };
    });
  }

  function countCorrect(answers, questions) {
    return questions.filter((q) => answers[q.id]?.correct).length;
  }

  function isQuizComplete(lessonId, questions, saved) {
    if (!saved?.answers) return false;
    return questions.every((q) => saved.answers[q.id]);
  }

  async function init(options) {
    const {
      lessonId,
      moduleId = "",
      basePath = "",
      container,
      onComplete,
      getChat,
      completeBtn,
    } = options;

    const mount = container
      || global.document.querySelector("[data-lesson-end-quiz]");
    if (!mount || !lessonId) return null;

    mount.classList.add("lesson-end-quiz");
    mount.innerHTML = `<p class="end-quiz-loading">Loading end-of-lesson quiz…</p>`;

    let quizData;
    try {
      quizData = await loadQuizData(basePath, lessonId);
    } catch {
      mount.innerHTML = `<p class="end-quiz-error">Quiz could not be loaded. Try refreshing the page.</p>`;
      return null;
    }

    const questions = prepareQuestions(quizData);
    const maxPoints = quizData.maxPoints || 10;
    let saved = getLessonAnswers(lessonId);
    const progressKey = moduleId
      ? `citizenship.${moduleId}.${lessonId}`
      : lessonId;

    let currentStep = firstUnansweredIndex(questions, saved);
    let advancing = false;
    let advanceTimer = null;

    mount.innerHTML = `
      <header class="end-quiz-header end-quiz-header--compact">
        <p class="end-quiz-kicker">End of lesson</p>
        <h2>${quizData.title || "Check your understanding"}</h2>
      </header>
      <div class="end-quiz-step-shell">
        <div class="end-quiz-questions" aria-live="polite"></div>
      </div>
    `;

    const questionsEl = mount.querySelector(".end-quiz-questions");

    function notifyQuizComplete(result) {
      global.dispatchEvent(new CustomEvent("evolearn:end-quiz-complete", {
        detail: { ...result, progressKey },
      }));
      if (typeof onComplete === "function") onComplete(result);
    }

    function publishResult(answers) {
      const correctCount = countCorrect(answers, questions);
      const pointsEarned = calculatePoints(correctCount);
      const profileApi = global.EvoStudentProfile;

      const award = profileApi?.awardLessonEndQuizPoints?.(lessonId, correctCount, maxPoints)
        || { pointsEarned, totalPoints: pointsEarned, previousBest: 0, isNewBest: true };

      profileApi?.recordLessonQuizAttempt?.({
        id: `${progressKey}:end-quiz`,
        lessonKey: progressKey,
        lessonId,
        moduleId,
        courseId: "citizenship",
        quizId: `${lessonId}-end-quiz`,
        quizTitle: quizData.title || `End quiz: ${lessonId}`,
        score: correctCount,
        maxScore: 3,
        possibleQuestions: 3,
        answeredQuestions: Object.keys(answers).length,
        status: Object.keys(answers).length >= 3 ? "complete" : "in-progress",
        answers: Object.values(answers),
        completedAt: Object.keys(answers).length >= 3 ? new Date().toISOString() : null,
      });

      profileApi?.applyLessonBranding?.(global.document, basePath);
      profileApi?.applyMapBranding?.();

      const result = {
        lessonId,
        correctCount,
        maxQuestions: 3,
        pointsEarned: award.pointsEarned,
        maxPoints,
        totalPoints: award.totalPoints,
        previousBest: award.previousBest,
        isNewBest: award.isNewBest,
        complete: correctCount >= 0 && Object.keys(answers).length >= 3,
      };

      const perQuestion = questions.map((q) => {
        const a = answers?.[q.id] || null;
        const selectedIndex = typeof a?.selectedIndex === "number" ? a.selectedIndex : null;
        const correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : null;
        const correct = selectedIndex != null && correctIndex != null ? selectedIndex === correctIndex : Boolean(a?.correct);
        return {
          questionId: q.id,
          correct,
          selectedIndex,
          correctIndex,
          topicId: q.topicId || q.topic || null,
        };
      });

      const wrongTopics = perQuestion
        .filter((q) => q && q.correct === false && q.topicId)
        .map((q) => q.topicId);

      if (result.complete) {
        const stepShell = mount.querySelector(".end-quiz-step-shell");
        if (stepShell) stepShell.hidden = true;
        renderResults(mount, result);
        try {
          global.EvoStudentSync?.recordQuizResult?.({
            ...result,
            moduleId,
            progressKey,
            quizId: `${lessonId}-end-quiz`,
            quizTitle: quizData.title || `End quiz: ${lessonId}`,
            completedAt: new Date().toISOString(),
            perQuestion,
            wrongTopics,
          });
        } catch { /* sync optional */ }
        notifyQuizComplete(result);
      }

      return result;
    }

    function renderStep() {
      if (advanceTimer) {
        global.clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      advancing = false;

      questionsEl.innerHTML = "";

      if (currentStep >= questions.length) {
        const answers = saved?.answers || {};
        if (Object.keys(answers).length >= 3) {
          publishResult(answers);
        }
        return;
      }

      const question = questions[currentStep];
      questionsEl.appendChild(
        renderQuestionCard(question, currentStep, questions.length, saved),
      );
    }

    function scheduleAdvance() {
      if (advancing) return;
      advancing = true;
      advanceTimer = global.setTimeout(() => {
        currentStep += 1;
        renderStep();
      }, STEP_ADVANCE_MS);
    }

    if (saved && isQuizComplete(lessonId, questions, saved)) {
      currentStep = questions.length;
      const stepShell = mount.querySelector(".end-quiz-step-shell");
      if (stepShell) stepShell.hidden = true;
      publishResult(saved.answers);
    } else {
      renderStep();
    }

    mount.addEventListener("click", async (event) => {
      const btn = event.target.closest(".end-quiz-option");
      if (!btn || btn.disabled || advancing) return;

      const card = btn.closest(".end-quiz-card");
      const questionId = card?.dataset.questionId;
      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      saved = getLessonAnswers(lessonId);
      if (saved?.answers?.[questionId]) return;

      card.classList.add("is-advancing");

      const selectedIndex = Number(btn.dataset.optionIndex);
      const correct = selectedIndex === question.correctIndex;
      const correctLabel = question.options[question.correctIndex];

      card.querySelectorAll(".end-quiz-option").forEach((option) => {
        option.disabled = true;
        const idx = Number(option.dataset.optionIndex);
        if (idx === selectedIndex) {
          option.classList.add(correct ? "is-correct" : "is-wrong");
        }
        if (idx === question.correctIndex) {
          option.classList.add("is-correct");
        }
      });

      const feedback = card.querySelector(".end-quiz-feedback");
      if (feedback) {
        feedback.textContent = correct
          ? "Correct. Well done."
          : "Not quite. Check the highlighted answer.";
      }

      const answers = { ...(saved?.answers || {}) };
      answers[questionId] = {
        questionId,
        question: question.text,
        selectedIndex,
        selectedAnswer: question.options[selectedIndex],
        correct,
        answeredAt: new Date().toISOString(),
      };

      saveLessonAnswers(lessonId, {
        lessonId,
        answers,
        updatedAt: new Date().toISOString(),
      });
      saved = getLessonAnswers(lessonId);

      publishResult(answers);

      if (!correct) {
        const chat = typeof getChat === "function" ? getChat() : null;
        if (chat?.handleQuizWrong) {
          chat.handleQuizWrong({
            wrongOption: question.options[selectedIndex],
            correctOption: correctLabel,
            questionHint: question.text,
          });
        }
      }

      if (Object.keys(answers).length < 3) {
        scheduleAdvance();
      } else {
        currentStep = questions.length;
        advanceTimer = global.setTimeout(() => renderStep(), STEP_ADVANCE_MS);
      }
    });

    return {
      lessonId,
      isComplete: () => {
        const s = getLessonAnswers(lessonId);
        return isQuizComplete(lessonId, questions, s);
      },
      getResult: () => {
        const s = getLessonAnswers(lessonId);
        if (!s?.answers) return null;
        return publishResult(s.answers);
      },
    };
  }

  function autoInitFromPage() {
    const body = global.document.body;
    const mount = global.document.querySelector("[data-lesson-end-quiz]");
    if (!mount || mount.dataset.quizInitialized === "true") return;

    const lessonId = body.dataset.lessonId || mount.dataset.lessonId;
    if (!lessonId) return;

    mount.dataset.quizInitialized = "true";
    const moduleId = body.dataset.moduleId || "";
    const script = global.document.currentScript;
    const basePath = script?.src
      ? script.src.replace(/assets\/js\/[^/]+$/, "")
      : "../../../";

    const completeBtn = global.document.getElementById("complete-btn");
    if (completeBtn && !completeBtn.classList.contains("is-done")) {
      completeBtn.disabled = true;
      completeBtn.textContent = "Complete the end quiz first";
    }

    global.addEventListener("load", () => {
      init({
        lessonId,
        moduleId,
        basePath,
        completeBtn,
        getChat: () => global.__evoLessonChat || null,
      });
    });
  }

  global.EvoLessonEndQuiz = {
    STORAGE_KEY,
    POINTS_TIER,
    calculatePoints,
    getLessonAnswers,
    isComplete: (lessonId) => {
      const saved = getLessonAnswers(lessonId);
      return Boolean(saved?.answers && Object.keys(saved.answers).length >= 3);
    },
    init,
    autoInitFromPage,
  };

  if (global.document.currentScript?.hasAttribute("data-auto-init")) {
    autoInitFromPage();
  }
})(window);
