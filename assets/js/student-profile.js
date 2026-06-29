/**
 * EVOlearn — student tutor profile (post-assessment agent assignment)
 *
 * localStorage keys:
 *   evoStudentProfile    — assigned agent + level after assessment save
 *   evoSuggestedTutor    — full diagnostic result (written by assessment)
 *   evoLessonQuizHistory — lesson quiz evidence for the learner profile
 *
 * Level gating (future lesson / chat content):
 *   const level = EvoStudentProfile.getStudentLevel(); // 1–9, or null when unassessed
 *   const key = EvoStudentProfile.getContentVariantKey("citizenship.module-1.lesson-1");
 *   // => "citizenship.module-1.lesson-1/level-5" when assessed at level 5
 *   // Load variants: assets/content/{key}/... or filter items by minLevel / maxLevel
 */
(function (global) {
  const STORAGE_KEYS = {
    studentProfile: "evoStudentProfile",
    suggestedTutor: "evoSuggestedTutor",
    lessonQuizHistory: "evoLessonQuizHistory",
  };

  const DEFAULT_AGENT_ID = "nova";

  const EMBLEM_CATALOG = {
    "lesson-1-recap": {
      id: "lesson-1-recap",
      title: "Lesson 1 recap",
      subtitle: "Who Are We?",
      icon: "🎧",
      image: "assets/images/emblems/lesson-1-recap.png",
      lessonId: "lesson-1",
    },
    "lesson-2-recap": {
      id: "lesson-2-recap",
      title: "Lesson 2 recap",
      subtitle: "Rights & Responsibilities",
      icon: "⚖️",
      image: "assets/images/emblems/lesson-2-recap.png",
      lessonId: "lesson-2",
    },
  };

  const TUTORS_CONFIG_URL = "assets/data/tutors.json";
  const TUTOR_IDS = ["nova", "milo", "ava", "kai", "zara", "theo", "nia", "elias", "athena"];

  const FALLBACK_TUTORS = [
    { id: "nova", name: "Nova", levelNumber: 1, level: "Access", support: "Gentle help when you want to take things one small step at a time.", image: "assets/tutors/nova.png" },
    { id: "milo", name: "Milo", levelNumber: 2, level: "Foundation", support: "Straightforward tasks that show you exactly what to do next.", image: "assets/tutors/milo.png" },
    { id: "ava", name: "Ava", levelNumber: 3, level: "Building Confidence", support: "Encouragement when you know some things but do not feel sure yet.", image: "assets/tutors/ava.png" },
    { id: "kai", name: "Kai", levelNumber: 4, level: "Developing", support: "Clear rules, simple steps, and calm practice.", image: "assets/tutors/kai.png" },
    { id: "zara", name: "Zara", levelNumber: 5, level: "Secure", support: "Stronger challenges with clear examples of what good work looks like.", image: "assets/tutors/zara.png" },
    { id: "theo", name: "Theo", levelNumber: 6, level: "Confident", support: "Lively questions that help you think deeper and explain your ideas.", image: "assets/tutors/theo.png" },
    { id: "nia", name: "Nia", levelNumber: 7, level: "Exam Ready", support: "Exam tips, mark scheme thinking, and ways to get more marks.", image: "assets/tutors/nia.png" },
    { id: "elias", name: "Elias", levelNumber: 8, level: "Advanced", support: "Big ideas, careful thinking, and more detailed discussion.", image: "assets/tutors/elias.png" },
    { id: "athena", name: "Athena", levelNumber: 9, level: "Mastery", support: "High-level coaching when you are ready to produce your best work.", image: "assets/tutors/athena.png" },
  ];

  let tutorsCache = null;

  function normalizeLevel(level) {
    const n = Number(level);
    if (!Number.isFinite(n)) return 1;
    return Math.min(9, Math.max(1, Math.round(n)));
  }

  function getScriptBase() {
    const script = global.document.currentScript;
    if (!script || !script.src) return "";
    return script.src.replace(/[^/]+$/, "");
  }

  function configUrl(basePath) {
    const prefix = basePath != null ? basePath : getScriptBase().replace(/assets\/js\/$/, "");
    return `${prefix}${TUTORS_CONFIG_URL}`;
  }

  function slugFromName(name) {
    return (name || DEFAULT_AGENT_ID).toLowerCase();
  }

  function findTutorById(tutors, id) {
    if (!id) return null;
    const slug = String(id).toLowerCase();
    return tutors.find((t) => t.id === slug)
      || tutors.find((t) => slugFromName(t.name) === slug)
      || null;
  }

  function findTutorByIndex(tutors, index) {
    if (typeof index !== "number" || index < 0 || index >= tutors.length) return null;
    return tutors[index];
  }

  function findTutorByLevel(tutors, level) {
    const n = Number(level);
    if (!Number.isFinite(n)) return null;
    return tutors.find((t) => t.levelNumber === n) || null;
  }

  function scoreToTutorIndex(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    return Math.min(8, Math.max(0, Math.floor(n)));
  }

  function getTutors() {
    return tutorsCache || FALLBACK_TUTORS;
  }

  function deriveTutorFromLevel(tutors, level) {
    const band = normalizeLevel(level);
    return findTutorByLevel(tutors, band) || tutors[0] || null;
  }

  function normaliseStudentProfile(rawProfile, options = {}) {
    const raw = rawProfile && typeof rawProfile === "object" ? rawProfile : null;
    if (!raw) return null;

    const tutors = getTutors();
    const levelGuess = raw.level ?? raw.placementLevel ?? (typeof raw.tutorIndex === "number" ? raw.tutorIndex + 1 : null);
    const level = normalizeLevel(levelGuess);
    const tutor = deriveTutorFromLevel(tutors, level);

    const status = raw.tutorStatus || null;
    const approved = status === "approved";
    const pending = status === "pending";

    const suggestedTutorId = raw.suggestedTutorId
      || (!approved ? raw.agentId : null)
      || tutor?.id
      || DEFAULT_AGENT_ID;

    const assignedTutorId = approved
      ? (raw.assignedTutorId || raw.agentId || tutor?.id || DEFAULT_AGENT_ID)
      : (raw.assignedTutorId || null);

    const activeTutorId = approved ? assignedTutorId : suggestedTutorId;
    const activeTutor = findTutorById(tutors, activeTutorId) || tutor || tutors[0];

    const next = {
      ...raw,
      level: normalizeLevel(activeTutor?.levelNumber || level),
      levelLabel: raw.levelLabel || activeTutor?.level || raw.levelName || "",
      tutorIndex: typeof raw.tutorIndex === "number" ? raw.tutorIndex : (normalizeLevel(activeTutor?.levelNumber || level) - 1),
      suggestedTutorId,
      assignedTutorId,
      tutorStatus: approved ? "approved" : (pending ? "pending" : (raw.tutorStatus || null)),
      agentId: activeTutor?.id || activeTutorId || DEFAULT_AGENT_ID,
      agentName: raw.agentName || activeTutor?.name || raw.agentName || "Nova",
    };

    if (options.persist && JSON.stringify(next) !== JSON.stringify(raw)) {
      saveStudentProfile(next);
    }

    return next;
  }

  async function loadTutorsConfig(basePath) {
    if (tutorsCache) return tutorsCache;
    try {
      const response = await fetch(configUrl(basePath));
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      tutorsCache = data.tutors || FALLBACK_TUTORS;
    } catch {
      tutorsCache = FALLBACK_TUTORS;
    }
    return tutorsCache;
  }

  function loadStudentProfileRaw() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEYS.studentProfile);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  }

  function loadStudentProfile() {
    try {
      const data = loadStudentProfileRaw();
      if (!data) return null;
      const normalised = normaliseStudentProfile(data, { persist: true });
      if (!normalised?.agentName || typeof normalised.level !== "number") return null;
      return normalised;
    } catch {
      return null;
    }
  }

  function hasCompletedAssessment() {
    return loadStudentProfile() != null;
  }

  function saveStudentProfile(profile) {
    global.localStorage.setItem(STORAGE_KEYS.studentProfile, JSON.stringify(profile));
    try {
      global.EvoStudentSync?.recordProfileUpdate?.(profile);
    } catch { /* sync optional */ }
  }

  function getTutorApprovalState() {
    const profile = loadStudentProfileRaw();
    if (!profile) {
      return { status: null, pending: false, approved: false, suggestedTutorId: null, assignedTutorId: null };
    }
    const status = profile.tutorStatus || null;
    return {
      status,
      pending: status === "pending",
      approved: status === "approved",
      suggestedTutorId: profile.suggestedTutorId || profile.agentId || null,
      assignedTutorId: profile.assignedTutorId || null,
    };
  }

  function normaliseEmblems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      if (typeof item === "string") return { id: item, earnedAt: null };
      if (item?.id) return { id: item.id, earnedAt: item.earnedAt || null };
      return null;
    }).filter(Boolean);
  }

  function getEmblems() {
    const profile = loadStudentProfileRaw();
    return normaliseEmblems(profile?.emblems);
  }

  function hasEmblem(emblemId) {
    if (!emblemId) return false;
    return getEmblems().some((entry) => entry.id === emblemId);
  }

  function getEmblemMeta(emblemId) {
    return EMBLEM_CATALOG[emblemId] || {
      id: emblemId,
      title: emblemId,
      subtitle: "Emblem earned",
      icon: "🏅",
    };
  }

  function awardEmblem(emblemId) {
    if (!emblemId || !EMBLEM_CATALOG[emblemId]) {
      return { awarded: false, reason: "unknown-emblem" };
    }
    if (hasEmblem(emblemId)) {
      return { awarded: false, alreadyHad: true, emblemId };
    }
    const existing = loadStudentProfileRaw() || {};
    const emblems = normaliseEmblems(existing.emblems);
    const entry = { id: emblemId, earnedAt: new Date().toISOString() };
    saveStudentProfile({ ...existing, emblems: [...emblems, entry] });
    return { awarded: true, emblem: entry, emblemId };
  }

  function getEmblemCatalog() {
    return { ...EMBLEM_CATALOG };
  }

  function getEarnedEmblemsWithMeta() {
    return getEmblems()
      .map((entry) => ({ ...getEmblemMeta(entry.id), ...entry }))
      .filter((entry) => entry.title);
  }

  const END_QUIZ_POINTS_TIER = [0, 3, 7, 10];

  function calculateEndQuizPoints(correctCount, maxPoints) {
    const n = Math.min(3, Math.max(0, Number(correctCount) || 0));
    const tier = END_QUIZ_POINTS_TIER[n];
    if (!maxPoints || maxPoints === 10) return tier;
    return Math.round((tier / 10) * maxPoints);
  }

  function sumLessonPoints(lessonPoints) {
    return Object.values(lessonPoints || {}).reduce((sum, pts) => sum + (Number(pts) || 0), 0);
  }

  function awardLessonEndQuizPoints(lessonId, correctCount, maxPoints) {
    const pointsEarned = calculateEndQuizPoints(correctCount, maxPoints);
    const existing = loadStudentProfileRaw() || {};
    const lessonPoints = { ...(existing.lessonPoints || {}) };
    const previousBest = Number(lessonPoints[lessonId]) || 0;
    lessonPoints[lessonId] = Math.max(previousBest, pointsEarned);
    const totalPoints = sumLessonPoints(lessonPoints);
    const nextProfile = {
      ...existing,
      points: totalPoints,
      lessonPoints,
      lastEndQuizAt: new Date().toISOString(),
    };
    saveStudentProfile(nextProfile);
    return {
      pointsEarned,
      totalPoints,
      lessonPoints,
      previousBest,
      isNewBest: pointsEarned > previousBest,
    };
  }

  function getTotalPoints() {
    const profile = loadStudentProfile();
    if (!profile) return 0;
    if (typeof profile.points === "number") return profile.points;
    return sumLessonPoints(profile.lessonPoints);
  }

  function getLessonPoints(lessonId) {
    const profile = loadStudentProfile();
    return Number(profile?.lessonPoints?.[lessonId]) || 0;
  }

  function formatPointsLine(profile) {
    const pts = profile?.points ?? sumLessonPoints(profile?.lessonPoints);
    if (!pts) return "";
    return `${pts} pts`;
  }

  function loadLessonQuizHistory() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEYS.lessonQuizHistory);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveLessonQuizHistory(history) {
    global.localStorage.setItem(STORAGE_KEYS.lessonQuizHistory, JSON.stringify(history.slice(-100)));
    global.EvoStudentSync?.notifyChange?.("lesson-quiz-history");
  }

  function assignFromAssessment(suggestion) {
    const tutors = getTutors();
    const tutor = findTutorByIndex(tutors, suggestion.tutorIndex)
      || findTutorById(tutors, slugFromName(suggestion.tutorName));
    const existing = loadStudentProfileRaw() || {};
    const placementLevel = normalizeLevel(tutor ? tutor.levelNumber : suggestion.tutorIndex + 1);
    const suggestedId = tutor?.id || slugFromName(suggestion.tutorName);
    const profile = {
      ...existing,
      placementLevel,
      placementLevelLabel: suggestion.level || tutor?.level || "",
      placementCombinedScore: suggestion.combinedScore,
      level: placementLevel,
      levelLabel: suggestion.level || tutor?.level || "",
      combinedScore: suggestion.combinedScore,
      learningScore: suggestion.combinedScore,
      agentId: suggestedId,
      agentName: suggestion.tutorName,
      tutorIndex: suggestion.tutorIndex,
      suggestedTutorId: suggestedId,
      assignedTutorId: existing.tutorStatus === "approved" ? (existing.assignedTutorId || suggestedId) : (existing.assignedTutorId || null),
      tutorStatus: existing.tutorStatus === "approved" ? "approved" : "pending",
      assessedAt: suggestion.completedAt || new Date().toISOString(),
      profileSource: "placement-assessment",
    };
    saveStudentProfile(normaliseStudentProfile(profile) || profile);
    try {
      global.EvoStudentSync?.recordAssessmentComplete?.(suggestion, profile);
    } catch { /* sync optional */ }
    return applyLessonQuizProfile();
  }

  function summarizeLessonQuizHistory(history) {
    const attempts = (history || []).filter((item) => Number(item.maxScore) > 0);
    const totalScore = attempts.reduce((sum, item) => sum + Number(item.score || 0), 0);
    const totalMax = attempts.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
    const averagePct = totalMax > 0 ? totalScore / totalMax : null;
    const averageScore = averagePct == null ? null : Math.round(averagePct * 100) / 10;
    const completedAttempts = attempts.filter((item) => item.status === "complete").length;
    const levelCaps = attempts
      .map((item) => Number(item.levelCap))
      .filter((value) => Number.isFinite(value) && value > 0);
    const latest = attempts[attempts.length - 1] || null;
    return {
      attempts: attempts.length,
      completedAttempts,
      totalScore,
      totalMax,
      averagePct,
      averageScore,
      levelCap: levelCaps.length ? Math.max(...levelCaps) : null,
      latest,
    };
  }

  function applyLessonQuizProfile(seedProfile) {
    const tutors = getTutors();
    const profile = normaliseStudentProfile(seedProfile || loadStudentProfileRaw() || loadStudentProfile(), { persist: true });
    const history = loadLessonQuizHistory();
    const summary = summarizeLessonQuizHistory(history);
    if (!summary.attempts) return profile;

    const hasLegacyPlacement = !profile?.profileSource && profile?.assessedAt && typeof profile?.combinedScore === "number";
    const placementScore = typeof profile?.placementCombinedScore === "number"
      ? profile.placementCombinedScore
      : (hasLegacyPlacement ? profile.combinedScore : null);
    const quizScore = summary.averageScore;
    const learningScore = placementScore == null
      ? quizScore
      : Math.round(((placementScore * 0.7) + (quizScore * 0.3)) * 10) / 10;
    const rawTutorIndex = scoreToTutorIndex(learningScore);
    const tutorIndex = placementScore == null && summary.levelCap
      ? Math.min(rawTutorIndex, Math.max(0, summary.levelCap - 1))
      : rawTutorIndex;
    const tutor = findTutorByIndex(tutors, tutorIndex) || tutors[0];

    const approval = {
      status: profile?.tutorStatus || null,
      approved: profile?.tutorStatus === "approved",
      pending: profile?.tutorStatus === "pending",
    };

    const suggestedTutorId = tutor?.id || slugFromName(tutor?.name) || DEFAULT_AGENT_ID;
    const assignedTutorId = approval.approved
      ? (profile?.assignedTutorId || profile?.agentId || suggestedTutorId)
      : null;

    const activeTutorId = approval.approved ? assignedTutorId : suggestedTutorId;
    const activeTutor = findTutorById(tutors, activeTutorId) || tutor || tutors[0];

    const nextProfile = {
      ...(profile || {}),
      level: normalizeLevel(activeTutor?.levelNumber || tutor?.levelNumber || tutorIndex + 1),
      levelLabel: activeTutor?.level || tutor?.level || "",
      combinedScore: learningScore,
      learningScore,
      lessonQuizAverage: quizScore,
      lessonQuizAttempts: summary.attempts,
      lessonQuizCompletedAttempts: summary.completedAttempts,
      lessonQuizLevelCap: summary.levelCap,
      latestLessonQuiz: summary.latest,
      suggestedTutorId,
      assignedTutorId,
      tutorStatus: approval.approved ? "approved" : (approval.pending ? "pending" : (profile?.tutorStatus || "pending")),
      agentId: activeTutor?.id || DEFAULT_AGENT_ID,
      agentName: activeTutor?.name || "Nova",
      tutorIndex: typeof activeTutor?.levelNumber === "number" ? (activeTutor.levelNumber - 1) : tutorIndex,
      profileSource: placementScore == null ? "lesson-quiz" : "placement-and-lesson-quizzes",
      profileUpdatedAt: new Date().toISOString(),
    };
    const finalProfile = normaliseStudentProfile(nextProfile) || nextProfile;
    saveStudentProfile(finalProfile);
    return finalProfile;
  }

  function recordLessonQuizAttempt(attempt) {
    if (!attempt || !attempt.lessonKey) return loadStudentProfile();
    const score = Number(attempt.score) || 0;
    const maxScore = Number(attempt.maxScore) || 0;
    const now = new Date().toISOString();
    const entry = {
      id: attempt.id || `${attempt.lessonKey}:${attempt.quizId || "quiz"}`,
      lessonKey: attempt.lessonKey,
      lessonId: attempt.lessonId || "",
      moduleId: attempt.moduleId || "",
      courseId: attempt.courseId || "citizenship",
      quizId: attempt.quizId || "lesson-quiz",
      quizTitle: attempt.quizTitle || "Lesson quiz",
      score,
      maxScore,
      pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      possibleQuestions: Number(attempt.possibleQuestions) || maxScore,
      answeredQuestions: Number(attempt.answeredQuestions) || maxScore,
      levelCap: Number(attempt.levelCap) || null,
      status: attempt.status || "in-progress",
      answers: attempt.answers || [],
      source: "lesson-quiz",
      updatedAt: now,
      completedAt: attempt.status === "complete" ? (attempt.completedAt || now) : attempt.completedAt || null,
    };
    const history = loadLessonQuizHistory();
    const index = history.findIndex((item) => item.id === entry.id);
    if (index >= 0) history[index] = { ...history[index], ...entry };
    else history.push(entry);
    saveLessonQuizHistory(history);
    return applyLessonQuizProfile();
  }

  function getLearningProfileSummary() {
    return {
      profile: loadStudentProfile(),
      lessonQuiz: summarizeLessonQuizHistory(loadLessonQuizHistory()),
      lessonQuizHistory: loadLessonQuizHistory(),
    };
  }

  function getStudentLevel() {
    const profile = loadStudentProfile();
    return profile ? profile.level : null;
  }

  function getContentVariantKey(lessonKey) {
    const level = getStudentLevel();
    if (!level) return lessonKey;
    return `${lessonKey}/level-${level}`;
  }

  function getAssignedAgent() {
    const profile = loadStudentProfile();
    const tutors = getTutors();
    if (profile) {
      const tutor = findTutorById(tutors, profile.agentId)
        || findTutorByIndex(tutors, profile.tutorIndex);
      return {
        id: profile.agentId,
        name: profile.agentName,
        level: profile.level,
        levelLabel: profile.levelLabel || profile.levelName,
        combinedScore: profile.combinedScore,
        support: tutor?.support || "",
        image: tutor?.image || null,
      };
    }
    const fallback = findTutorById(tutors, DEFAULT_AGENT_ID) || tutors[0];
    return {
      id: fallback.id,
      name: fallback.name,
      level: null,
      levelLabel: null,
      combinedScore: null,
      support: fallback.support || "",
      image: fallback.image || null,
    };
  }

  function resolveActiveTutor(tutors) {
    const list = tutors || getTutors();
    const profile = loadStudentProfile();
    if (profile) {
      const approval = getTutorApprovalState();
      const activeId = approval.approved && approval.assignedTutorId
        ? approval.assignedTutorId
        : (approval.suggestedTutorId || profile.agentId);
      return findTutorById(list, activeId)
        || findTutorByIndex(list, profile.tutorIndex)
        || findTutorById(list, DEFAULT_AGENT_ID)
        || list[0];
    }
    return findTutorById(list, DEFAULT_AGENT_ID) || list[0];
  }

  function ensureTutorApprovalBanner(root) {
    const doc = root || global.document;
    const approval = getTutorApprovalState();
    if (!approval.pending) {
      doc.querySelectorAll(".evo-tutor-approval-banner").forEach((el) => el.remove());
      return;
    }
    const hosts = [
      doc.querySelector(".dashboard-inner"),
      doc.querySelector("#citizenship-dashboard .dashboard-inner"),
      doc.querySelector(".assessment-shell"),
    ].filter(Boolean);
    hosts.forEach((host) => {
      if (host.querySelector(".evo-tutor-approval-banner")) return;
      const banner = doc.createElement("p");
      banner.className = "evo-tutor-approval-banner";
      banner.setAttribute("role", "status");
      banner.textContent = "Waiting for teacher approval — you can keep learning with your suggested tutor.";
      host.insertBefore(banner, host.firstChild);
    });
  }

  function getLevelLabel(profile) {
    return profile?.levelLabel || profile?.levelName || "";
  }

  function formatLevelLine(profile) {
    if (!profile) return "";
    const label = getLevelLabel(profile);
    return `Level ${profile.level} · ${label}`;
  }

  function getActiveAgentId() {
    const tutor = resolveActiveTutor();
    const profile = loadStudentProfile();
    if (profile?.level === 9) return "athena";
    if (!profile && (!tutor?.id || tutor.id === DEFAULT_AGENT_ID)) return DEFAULT_AGENT_ID;
    return tutor?.id || DEFAULT_AGENT_ID;
  }

  function applyTutorTheme(root) {
    const doc = root || global.document;
    const body = doc.body;
    if (!body) return;
    const activeId = getActiveAgentId();
    TUTOR_IDS.forEach((id) => {
      body.classList.toggle(`agent-${id}`, id === activeId);
    });
  }

  function ensureTutorStylesheet(root, basePath, tutorId) {
    const doc = root || global.document;
    const prefix = basePath || getScriptBase().replace(/assets\/js\/$/, "");
    const href = `${prefix}assets/css/tutor-${tutorId}.css`;
    if (doc.querySelector(`link[href="${href}"]`) || doc.querySelector(`link[href*="tutor-${tutorId}.css"]`)) return;
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    doc.head.appendChild(link);
  }

  function applyNovaTheme(root) {
    applyTutorTheme(root);
  }

  function applyEliasTheme(root) {
    applyTutorTheme(root);
  }

  function ensureAvatarOrb(frame) {
    if (!frame || frame.querySelector(".lesson-avatar-orb")) return;
    const orb = global.document.createElement("span");
    orb.className = "lesson-avatar-orb";
    orb.setAttribute("aria-hidden", "true");
    frame.appendChild(orb);
  }

  function applyAvatarImage(frame, imagePath, name) {
    if (!frame) return;
    let img = frame.querySelector("img");
    if (!imagePath) {
      if (img) img.remove();
      ensureAvatarOrb(frame);
      return;
    }
    if (!img) {
      const orb = frame.querySelector(".lesson-avatar-orb");
      if (orb) orb.remove();
      img = global.document.createElement("img");
      img.alt = "";
      frame.appendChild(img);
    }
    img.alt = `${name} tutor avatar`;
    img.onerror = () => {
      img.remove();
      ensureAvatarOrb(frame);
    };
    img.src = imagePath;
  }

  function applyLessonBranding(root, basePath) {
    const doc = root || global.document;
    const prefix = basePath || getScriptBase().replace(/assets\/js\/$/, "");
    const profile = loadStudentProfile();
    const tutor = resolveActiveTutor();
    const name = tutor.name;
    const imagePath = tutor.image ? `${prefix}${tutor.image}` : null;

    applyAvatarImage(doc.querySelector(".lesson-avatar-frame"), imagePath, name);

    const avatarLabel = doc.querySelector(".lesson-avatar-label");
    if (avatarLabel) {
      avatarLabel.textContent = profile ? formatLevelLine(profile) : tutor.name;
    }

    const chatHeading = doc.querySelector(".lesson-chat-head h2");
    if (chatHeading) chatHeading.textContent = `Ask ${name}`;

    const chatInput = doc.querySelector(".lesson-chat-input-shell input");
    if (chatInput) {
      chatInput.placeholder = profile ? `Ask ${name} a question` : "Chat coming soon";
    }

    ensureTutorStylesheet(doc, basePath, getActiveAgentId());
    applyTutorTheme(doc);
  }

  async function applyDashboardBranding() {
    const strip = global.document.getElementById("dashboard-agent-strip");
    const assessmentCard = global.document.querySelector('.dashboard-card[data-action="assessment"]');
    if (!strip) return;

    const profile = loadStudentProfile();
    if (!profile) {
      strip.hidden = true;
      if (assessmentCard) {
        const hint = assessmentCard.querySelector(".dashboard-card-hint");
        if (hint) hint.textContent = "Required before lessons · find your level and tutor";
      }
      applyTutorTheme();
      return;
    }

    strip.hidden = false;

    const levelEl = strip.querySelector("[data-agent-level]");
    if (levelEl) {
      const pts = formatPointsLine(profile);
      levelEl.textContent = pts
        ? `${formatLevelLine(profile)} · ${pts}`
        : formatLevelLine(profile);
    }

    if (assessmentCard) {
      const hint = assessmentCard.querySelector(".dashboard-card-hint");
      if (hint) hint.textContent = "Retake placement assessment";
    }

    applyTutorTheme();
    ensureTutorApprovalBanner();
  }

  function applyMapBranding() {
    const profile = loadStudentProfile();
    const agent = getAssignedAgent();
    const name = agent.name;

    const novaBtn = global.document.getElementById("nova-btn");
    const novaLabel = global.document.getElementById("nova-label")
      || global.document.querySelector(".nova-label");
    const novaPanelName = global.document.getElementById("nova-head-name")
      || global.document.querySelector(".nova-head strong");
    const novaPanelSub = global.document.getElementById("nova-head-level")
      || global.document.querySelector(".nova-head span");
    const novaMsg = global.document.getElementById("nova-msg")
      || global.document.querySelector(".nova-msg");

    if (novaBtn) novaBtn.setAttribute("aria-label", `Ask ${name}`);
    if (novaLabel) novaLabel.innerHTML = `Ask&nbsp;${name}`;
    if (novaPanelName) novaPanelName.textContent = name;
    if (novaPanelSub) {
      if (profile) {
        const pts = formatPointsLine(profile);
        novaPanelSub.textContent = pts
          ? `${formatLevelLine(profile)} · ${pts}`
          : formatLevelLine(profile);
      } else {
        novaPanelSub.textContent = "Your AI study guide";
      }
    }
    if (novaMsg) {
      if (profile) {
        novaMsg.innerHTML = `Pick a lesson on the map. <em>(Live tutor coming soon.)</em>`;
      } else {
        novaMsg.innerHTML = `Complete the placement assessment to get matched to your level and unlock lessons. <em>(Live tutor coming soon.)</em>`;
      }
    }
    applyTutorTheme();
    ensureTutorApprovalBanner();
    return Promise.resolve();
  }

  async function initLessonPage(basePath) {
    await loadTutorsConfig(basePath || "");
    applyLessonBranding(global.document, basePath || "");
  }

  async function initAppShell() {
    await loadTutorsConfig("");
    await applyDashboardBranding();
    await applyMapBranding();
  }

  function loadDatabaseScripts() {
    const base = getScriptBase();
    if (!base || global.EvoFirebaseConfig) return;
    if (global.document.querySelector("script[data-evolearn-db]")) return;
    ["firebase-config.js", "student-sync.js", "student-auth.js"].forEach((file) => {
      const script = global.document.createElement("script");
      script.src = `${base}${file}`;
      script.async = true;
      script.dataset.evolearnDb = "1";
      global.document.head.appendChild(script);
    });
  }

  loadDatabaseScripts();

  global.EvoStudentProfile = {
    STORAGE_KEYS,
    DEFAULT_AGENT_ID,
    EMBLEM_CATALOG,
    END_QUIZ_POINTS_TIER,
    normalizeLevel,
    getTutors,
    loadTutorsConfig,
    loadStudentProfile,
    loadStudentProfileRaw,
    hasCompletedAssessment,
    saveStudentProfile,
    normaliseEmblems,
    getEmblems,
    hasEmblem,
    getEmblemMeta,
    awardEmblem,
    getEmblemCatalog,
    getEarnedEmblemsWithMeta,
    loadLessonQuizHistory,
    recordLessonQuizAttempt,
    calculateEndQuizPoints,
    awardLessonEndQuizPoints,
    getTotalPoints,
    getLessonPoints,
    getLearningProfileSummary,
    assignFromAssessment,
    getStudentLevel,
    getContentVariantKey,
    getAssignedAgent,
    getTutorApprovalState,
    resolveActiveTutor,
    ensureTutorApprovalBanner,
    applyLessonBranding,
    applyDashboardBranding,
    applyMapBranding,
    applyTutorTheme,
    applyNovaTheme,
    applyEliasTheme,
    initLessonPage,
    initAppShell,
    findTutorById,
    findTutorByIndex,
    findTutorByLevel,
  };
})(window);
