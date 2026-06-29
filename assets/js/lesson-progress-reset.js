/**
 * EVOlearn — reset lesson progress (completion, quiz scores, answers, points)
 *
 * resetLessonProgress() — clears lesson data; keeps placement assessment by default.
 * resetAllProgress() / resetAllStudentData() — full wipe (assessment, streak, voice, all evo* keys).
 *
 * Cleared keys (lesson progress):
 *   evolearn-progress       — lesson completion marks (citizenship.module-N.lesson-N)
 *   evoEndQuizAnswers       — end-of-lesson quiz answers per lessonId
 *   evoLessonQuizHistory    — lesson quiz attempt history / scores
 *   evoTutorMemory          — in-lesson tutor chat memory
 *   evoStudentProfile       — lesson-only fields stripped; file removed if no assessment left
 *   *.{quiz-answers}        — legacy per-lesson keys (citizenship.module-N.lesson-N.quiz-answers)
 *
 * Kept by default (keepAssessment: true):
 *   evoStudentProfile       — placement level, tutor, assessedAt, placementCombinedScore, …
 *   evoSuggestedTutor       — diagnostic placement result
 *   evoTutorQuizHistory     — placement assessment quiz history
 *   evolearn-stats          — day streak
 *   evolearn-voice          — voice preference
 *   evoPendingPlacements    — staff demo queue (if present)
 *
 * Cleared only by resetAllProgress() / resetAllStudentData():
 *   All evolearn-* and evo* localStorage keys, legacy quiz-answer keys, session evolearn-* items
 */
(function (global) {
  const LESSON_STORAGE_KEYS = [
    "evolearn-progress",
    "evoLessonCheckpoints",
    "evoEndQuizAnswers",
    "evoLessonQuizHistory",
    "evoTutorMemory",
  ];

  const ALL_STUDENT_STORAGE_KEYS = [
    ...LESSON_STORAGE_KEYS,
    "evoStudentProfile",
    "evoSuggestedTutor",
    "evoTutorQuizHistory",
    "evolearn-stats",
    "evolearn-voice",
    "evoPendingPlacements",
  ];

  const EVO_STORAGE_PREFIXES = ["evolearn-", "evo"];

  const SESSION_KEYS_TO_CLEAR = [
    "evolearn-preferred-tutor",
    "evolearn-toast",
    "evolearn-skip-select",
  ];

  const LESSON_PROFILE_FIELDS = [
    "points",
    "lessonPoints",
    "lastEndQuizAt",
    "lessonQuizAverage",
    "lessonQuizAttempts",
    "lessonQuizCompletedAttempts",
    "lessonQuizLevelCap",
    "latestLessonQuiz",
    "profileUpdatedAt",
  ];

  const LEGACY_QUIZ_ANSWER_PATTERN = /\.quiz-answers$/;
  const CITIZENSHIP_LESSON_KEY_PATTERN = /^citizenship\.module-\d+\.lesson-\d+/;

  function loadJson(key) {
    try {
      const raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function removeStorageKey(key) {
    try {
      global.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function isEvolearnStorageKey(key) {
    if (!key) return false;
    if (EVO_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;
    if (LEGACY_QUIZ_ANSWER_PATTERN.test(key)) return true;
    if (CITIZENSHIP_LESSON_KEY_PATTERN.test(key)) return true;
    return false;
  }

  function findLegacyQuizAnswerKeys() {
    const keys = [];
    try {
      for (let i = 0; i < global.localStorage.length; i += 1) {
        const key = global.localStorage.key(i);
        if (key && LEGACY_QUIZ_ANSWER_PATTERN.test(key)) keys.push(key);
      }
    } catch {
      /* ignore */
    }
    return keys;
  }

  function findAllEvolearnStorageKeys() {
    const keys = new Set(ALL_STUDENT_STORAGE_KEYS);
    try {
      for (let i = 0; i < global.localStorage.length; i += 1) {
        const key = global.localStorage.key(i);
        if (isEvolearnStorageKey(key)) keys.add(key);
      }
    } catch {
      /* ignore */
    }
    return [...keys];
  }

  function hasPlacementData(profile) {
    if (!profile) return false;
    return profile.placementCombinedScore != null
      || profile.placementLevel != null
      || Boolean(profile.assessedAt)
      || profile.profileSource === "placement-assessment"
      || profile.profileSource === "placement-and-lesson-quizzes";
  }

  function stripLessonFieldsFromProfile(profile) {
    if (!profile) return null;
    const next = { ...profile };
    LESSON_PROFILE_FIELDS.forEach((field) => {
      delete next[field];
    });
    return next;
  }

  function restorePlacementProfile(profile) {
    const next = stripLessonFieldsFromProfile(profile);
    if (!next || !hasPlacementData(next)) return null;

    if (next.placementLevel != null) {
      next.level = next.placementLevel;
      next.levelLabel = next.placementLevelLabel || next.levelLabel || "";
    }
    if (next.placementCombinedScore != null) {
      next.combinedScore = next.placementCombinedScore;
      next.learningScore = next.placementCombinedScore;
    }
    next.profileSource = "placement-assessment";
    return next;
  }

  function reassignFromSuggestedTutor() {
    const suggestion = loadJson("evoSuggestedTutor");
    if (!suggestion || !global.EvoStudentProfile?.assignFromAssessment) return null;
    return global.EvoStudentProfile.assignFromAssessment(suggestion);
  }

  function updateStudentProfileAfterLessonReset() {
    const existing = loadJson("evoStudentProfile");
    const restored = restorePlacementProfile(existing);
    if (restored) {
      global.localStorage.setItem("evoStudentProfile", JSON.stringify(restored));
      return restored;
    }

    const fromSuggestion = reassignFromSuggestedTutor();
    if (fromSuggestion) return fromSuggestion;

    removeStorageKey("evoStudentProfile");
    return null;
  }

  function clearLessonStorageKeys() {
    const cleared = [];
    LESSON_STORAGE_KEYS.forEach((key) => {
      if (removeStorageKey(key)) cleared.push(key);
    });

    findLegacyQuizAnswerKeys().forEach((key) => {
      if (removeStorageKey(key)) cleared.push(key);
    });

    return cleared;
  }

  function clearSessionKeys() {
    SESSION_KEYS_TO_CLEAR.forEach((key) => {
      try {
        global.sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
  }

  /**
   * Reset lesson completion, quiz answers, scores, and points.
   * @param {{ keepAssessment?: boolean }} [options]
   * @returns {{ clearedKeys: string[], profileKept: boolean }}
   */
  function resetLessonProgress(options) {
    const keepAssessment = options?.keepAssessment !== false;
    const clearedKeys = clearLessonStorageKeys();
    let profileKept = false;

    if (keepAssessment) {
      const profile = updateStudentProfileAfterLessonReset();
      profileKept = profile != null;
      if (profileKept && !clearedKeys.includes("evoStudentProfile")) {
        clearedKeys.push("evoStudentProfile (lesson fields only)");
      }
    } else {
      if (removeStorageKey("evoStudentProfile")) clearedKeys.push("evoStudentProfile");
      removeStorageKey("evoSuggestedTutor");
      removeStorageKey("evoTutorQuizHistory");
      clearedKeys.push("evoSuggestedTutor", "evoTutorQuizHistory");
    }

    global.dispatchEvent(new CustomEvent("evolearn:lesson-progress-reset", {
      detail: { clearedKeys, profileKept, keepAssessment },
    }));

    return { clearedKeys, profileKept };
  }

  /** Full wipe — lesson progress, assessment, streak, voice prefs, all evo/evolearn keys. */
  function resetAllStudentData() {
    const clearedKeys = [];
    findAllEvolearnStorageKeys().forEach((key) => {
      if (removeStorageKey(key)) clearedKeys.push(key);
    });
    clearSessionKeys();

    global.dispatchEvent(new CustomEvent("evolearn:all-data-reset", {
      detail: { clearedKeys },
    }));

    return { clearedKeys };
  }

  /** Alias for resetAllStudentData — everything at zero. */
  function resetAllProgress() {
    return resetAllStudentData();
  }

  function confirmResetLessonProgress() {
    return global.confirm(
      "Reset lesson progress?\n\n"
      + "This clears completed lessons, quiz scores, quiz answers, and lesson points.\n\n"
      + "Your placement assessment (tutor and level) will be kept."
    );
  }

  function confirmResetAllStudentData() {
    return global.confirm(
      "Reset everything?\n\n"
      + "This clears lesson progress, quiz scores, assessment results, day streak, and tutor assignment. "
      + "You will need to take the placement assessment again.\n\n"
      + "This cannot be undone."
    );
  }

  global.EvoLessonProgressReset = {
    LESSON_STORAGE_KEYS,
    ALL_STUDENT_STORAGE_KEYS,
    LESSON_PROFILE_FIELDS,
    resetLessonProgress,
    resetAllStudentData,
    resetAllProgress,
    findAllEvolearnStorageKeys,
    stripLessonFieldsFromProfile,
    confirmResetLessonProgress,
    confirmResetAllStudentData,
  };
})(window);
