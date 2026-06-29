/**
 * EVOlearn — offline-first student progress sync (localStorage ↔ Firestore)
 *
 * Primary document:
 *   schools/{schoolId}/students/{uid}/progress/main
 *
 * Optional audit trail:
 *   schools/{schoolId}/students/{uid}/events/{eventId}
 *
 * localStorage is always written first; cloud sync is debounced when signed in.
 */
(function (global) {
  const FIREBASE_VERSION = "10.14.1";
  const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const DOC_VERSION = 1;
  const DEBOUNCE_MS = 800;
  const STUDENT_ID_KEY = "evoStudentId";
  const SCHOOL_ID_KEY = "evoSchoolId";
  const SYNC_QUEUE_KEY = "evoSyncQueue";
  const ACTIVE_UID_KEY = "evolearn-active-uid";
  const LEGACY_QUIZ_ANSWER_PATTERN = /\.quiz-answers$/;

  const PERSIST_KEYS = [
    "evoStudentProfile",
    "evoSuggestedTutor",
    "evoLessonQuizHistory",
    "evoTutorQuizHistory",
    "evoEndQuizAnswers",
    "evoWorksheetAnswers",
    "evolearn-progress",
    "evoLessonCheckpoints",
    "evolearn-stats",
    "evolearn-voice",
    "evolearn-role",
    "evoPendingPlacements",
    "evoSchoolId",
  ];

  const SESSION_ONLY_KEYS = [
    "evolearn-entered",
    "evolearn-unlocked",
    "evolearn-preferred-tutor",
    "evolearn-toast",
    "evolearn-skip-select",
    "evoTutorMemory",
    "evolearn-auth-guest",
  ];

  let firestore = null;
  let authMod = null;
  let firestoreMod = null;
  let initPromise = null;
  let saveTimer = null;
  let saveInFlight = false;
  let pendingReason = "change";

  function getActiveUid() {
    try { return global.localStorage.getItem(ACTIVE_UID_KEY) || ""; } catch { return ""; }
  }

  function setActiveUid(uid) {
    try {
      if (!uid) global.localStorage.removeItem(ACTIVE_UID_KEY);
      else global.localStorage.setItem(ACTIVE_UID_KEY, String(uid));
    } catch { /* ignore */ }
  }

  function getSyncQueueStorageKey() {
    const uid = global.EvoStudentAuth?.getCurrentUser?.()?.uid || "";
    return uid ? `${SYNC_QUEUE_KEY}:${uid}` : `${SYNC_QUEUE_KEY}:anon`;
  }

  function removeAnyQueueKeys() {
    try {
      const toRemove = [];
      for (let i = 0; i < global.localStorage.length; i += 1) {
        const key = global.localStorage.key(i);
        if (!key) continue;
        if (key === SYNC_QUEUE_KEY || key.startsWith(`${SYNC_QUEUE_KEY}:`)) toRemove.push(key);
      }
      toRemove.forEach((key) => {
        try { global.localStorage.removeItem(key); } catch { /* ignore */ }
      });
    } catch { /* ignore */ }
  }

  function clearLocalStudentState(options) {
    const keepSchoolId = options?.keepSchoolId !== false;
    const cleared = [];

    // Clear known app keys.
    PERSIST_KEYS.forEach((key) => {
      if (keepSchoolId && key === SCHOOL_ID_KEY) return;
      try { global.localStorage.removeItem(key); cleared.push(key); } catch { /* ignore */ }
    });
    try { global.localStorage.removeItem(STUDENT_ID_KEY); cleared.push(STUDENT_ID_KEY); } catch { /* ignore */ }

    // Clear legacy quiz answers (per-lesson keys).
    findLegacyQuizAnswerKeys().forEach((key) => {
      try { global.localStorage.removeItem(key); cleared.push(key); } catch { /* ignore */ }
    });

    // Clear sync queue (all namespaces).
    removeAnyQueueKeys();
    cleared.push(`${SYNC_QUEUE_KEY}*`);

    // Clear session-only keys in BOTH sessionStorage and localStorage to be safe.
    SESSION_ONLY_KEYS.forEach((key) => {
      try { global.sessionStorage?.removeItem?.(key); } catch { /* ignore */ }
      try { global.localStorage.removeItem(key); } catch { /* ignore */ }
    });

    // Tutor engine AI memory is sessionStorage; clear all variants.
    try {
      const toRemove = [];
      for (let i = 0; i < (global.sessionStorage?.length || 0); i += 1) {
        const key = global.sessionStorage.key(i);
        if (!key) continue;
        if (key === "evoTutorAiMemory" || key.startsWith("evoTutorAiMemory:")) toRemove.push(key);
        if (key === "evoTutorMemory" || key.startsWith("evoTutorMemory:")) toRemove.push(key);
      }
      toRemove.forEach((key) => {
        try { global.sessionStorage.removeItem(key); } catch { /* ignore */ }
      });
    } catch { /* ignore */ }

    return cleared;
  }

  function handleAuthUserChanged(nextUser) {
    const nextUid = nextUser?.uid || global.EvoStudentAuth?.getCurrentUser?.()?.uid || "";
    const prevUid = getActiveUid();

    // On sign-out, wipe local state so a new student cannot inherit it.
    if (!nextUid && prevUid) {
      const clearedKeys = clearLocalStudentState({ keepSchoolId: true });
      setActiveUid("");
      return { switched: true, prevUid, nextUid: "", clearedKeys };
    }

    // First-time sign-in: pin active uid + student id.
    if (nextUid && !prevUid) {
      setActiveUid(nextUid);
      try { global.localStorage.setItem(STUDENT_ID_KEY, nextUid); } catch { /* ignore */ }
      return { switched: false, prevUid: "", nextUid, clearedKeys: [] };
    }

    // User switch: wipe local progress + queue before any cloud restore.
    if (nextUid && prevUid && nextUid !== prevUid) {
      const clearedKeys = clearLocalStudentState({ keepSchoolId: true });
      setActiveUid(nextUid);
      try { global.localStorage.setItem(STUDENT_ID_KEY, nextUid); } catch { /* ignore */ }
      return { switched: true, prevUid, nextUid, clearedKeys };
    }

    // No change.
    if (nextUid && prevUid === nextUid) {
      try { global.localStorage.setItem(STUDENT_ID_KEY, nextUid); } catch { /* ignore */ }
    }
    return { switched: false, prevUid, nextUid, clearedKeys: [] };
  }

  function log(...args) {
    if (global.EVO_SYNC_DEBUG) global.console?.log?.("[EvoStudentSync]", ...args);
  }

  function warn(...args) {
    global.console?.warn?.("[EvoStudentSync]", ...args);
  }

  function isOnline() {
    return global.navigator?.onLine !== false;
  }

  function isConfigured() {
    return Boolean(global.EvoFirebaseConfig?.isConfigured?.());
  }

  function isSignedIn() {
    return Boolean(global.EvoStudentAuth?.isSignedIn?.());
  }

  function canSync() {
    return isConfigured() && isSignedIn() && isOnline();
  }

  function isReady() {
    return isConfigured() && isOnline();
  }

  function getSchoolId() {
    try {
      return global.localStorage.getItem(SCHOOL_ID_KEY)
        || global.EvoFirebaseConfig?.getSchoolId?.()
        || "demo";
    } catch {
      return "demo";
    }
  }

  function setSchoolId(schoolId) {
    if (!schoolId) return;
    try {
      global.localStorage.setItem(SCHOOL_ID_KEY, String(schoolId));
      notifyChange("school-id");
    } catch { /* storage blocked */ }
  }

  function getStudentId() {
    try {
      const signedUid = global.EvoStudentAuth?.getCurrentUser?.()?.uid;
      if (signedUid) return signedUid;

      let id = global.localStorage.getItem(STUDENT_ID_KEY);
      if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `evo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        global.localStorage.setItem(STUDENT_ID_KEY, id);
      }
      return id;
    } catch {
      return `evo-anon-${Date.now()}`;
    }
  }

  function setJson(key, value) {
    if (value == null) {
      global.localStorage.removeItem(key);
      return;
    }
    global.localStorage.setItem(key, JSON.stringify(value));
  }

  function findLegacyQuizAnswerKeys() {
    const keys = [];
    try {
      for (let i = 0; i < global.localStorage.length; i += 1) {
        const key = global.localStorage.key(i);
        if (key && LEGACY_QUIZ_ANSWER_PATTERN.test(key)) keys.push(key);
      }
    } catch { /* ignore */ }
    return keys;
  }

  function readLegacyQuizAnswers() {
    const legacy = {};
    findLegacyQuizAnswerKeys().forEach((key) => {
      try {
        const raw = global.localStorage.getItem(key);
        if (raw) legacy[key] = JSON.parse(raw);
      } catch {
        legacy[key] = global.localStorage.getItem(key);
      }
    });
    return legacy;
  }

  function applyLegacyQuizAnswers(legacy) {
    if (!legacy || typeof legacy !== "object") return;
    Object.entries(legacy).forEach(([key, value]) => {
      setJson(key, value);
    });
  }

  function collectLocalProgress() {
    const localStorageSnapshot = {};
    PERSIST_KEYS.forEach((key) => {
      try {
        const raw = global.localStorage.getItem(key);
        if (raw != null) {
          try {
            localStorageSnapshot[key] = JSON.parse(raw);
          } catch {
            localStorageSnapshot[key] = raw;
          }
        }
      } catch { /* ignore */ }
    });

    const legacyQuizAnswers = readLegacyQuizAnswers();
    const profile = localStorageSnapshot.evoStudentProfile || null;

    return {
      version: DOC_VERSION,
      updatedAt: new Date().toISOString(),
      localStorage: localStorageSnapshot,
      profile,
      lessonProgress: localStorageSnapshot["evolearn-progress"] || [],
      lessonCheckpoints: localStorageSnapshot.evoLessonCheckpoints || {},
      endQuizAnswers: localStorageSnapshot.evoEndQuizAnswers || {},
      worksheetAnswers: localStorageSnapshot.evoWorksheetAnswers || {},
      lessonQuizHistory: localStorageSnapshot.evoLessonQuizHistory || [],
      suggestedTutor: localStorageSnapshot.evoSuggestedTutor || null,
      tutorQuizHistory: localStorageSnapshot.evoTutorQuizHistory || [],
      stats: localStorageSnapshot["evolearn-stats"] || {},
      voicePreference: localStorageSnapshot["evolearn-voice"] || null,
      role: localStorageSnapshot["evolearn-role"] || null,
      pendingPlacements: localStorageSnapshot.evoPendingPlacements || [],
      legacyQuizAnswers,
      emblems: profile?.emblems || [],
      points: profile?.points ?? null,
    };
  }

  function applySnapshotToLocal(snapshot, options) {
    const cloudWins = options?.cloudWins !== false;
    if (!snapshot || !cloudWins) return false;

    const bag = snapshot.localStorage && typeof snapshot.localStorage === "object"
      ? { ...snapshot.localStorage }
      : {};

    const keyMap = {
      profile: "evoStudentProfile",
      lessonProgress: "evolearn-progress",
      lessonCheckpoints: "evoLessonCheckpoints",
      endQuizAnswers: "evoEndQuizAnswers",
      worksheetAnswers: "evoWorksheetAnswers",
      lessonQuizHistory: "evoLessonQuizHistory",
      suggestedTutor: "evoSuggestedTutor",
      tutorQuizHistory: "evoTutorQuizHistory",
      stats: "evolearn-stats",
      voicePreference: "evolearn-voice",
      role: "evolearn-role",
      pendingPlacements: "evoPendingPlacements",
    };

    Object.entries(keyMap).forEach(([field, storageKey]) => {
      if (snapshot[field] != null) bag[storageKey] = snapshot[field];
    });

    PERSIST_KEYS.forEach((key) => {
      if (bag[key] != null) setJson(key, bag[key]);
    });

    if (snapshot.legacyQuizAnswers) applyLegacyQuizAnswers(snapshot.legacyQuizAnswers);
    else if (bag.legacyQuizAnswers) applyLegacyQuizAnswers(bag.legacyQuizAnswers);

    global.dispatchEvent(new CustomEvent("evolearn:progress-restored", {
      detail: { cloudWins, updatedAt: snapshot.updatedAt || null },
    }));
    return true;
  }

  async function loadModules() {
    if (firestoreMod && authMod) return { firestoreMod, authMod };
    const [appMod, authImport, fsImport] = await Promise.all([
      import(`${FIREBASE_CDN}/firebase-app.js`),
      import(`${FIREBASE_CDN}/firebase-auth.js`),
      import(`${FIREBASE_CDN}/firebase-firestore.js`),
    ]);
    authMod = authImport;
    firestoreMod = fsImport;
    const config = global.EvoFirebaseConfig.getConfig();
    const existing = appMod.getApps?.() || [];
    const app = existing.length ? existing[0] : appMod.initializeApp(config);
    firestore = fsImport.getFirestore(app);
    return { firestoreMod: fsImport, authMod: authImport };
  }

  async function ensureFirebase() {
    if (!isConfigured()) return null;
    if (firestore) return firestore;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        await loadModules();
        return firestore;
      } catch (err) {
        warn("Firebase init failed", err);
        firestore = null;
        initPromise = null;
        return null;
      }
    })();
    return initPromise;
  }

  async function getFirestoreContext() {
    if (!isSignedIn()) return null;
    const db = await ensureFirebase();
    const uid = global.EvoStudentAuth?.getCurrentUser?.()?.uid;
    if (!db || !uid || !firestoreMod) return null;

    const schoolId = getSchoolId();
    const docRef = firestoreMod.doc(
      db,
      "schools",
      schoolId,
      "students",
      uid,
      "progress",
      "main",
    );
    const studentRef = firestoreMod.doc(db, "schools", schoolId, "students", uid);
    return { db, uid, schoolId, docRef, studentRef };
  }

  function buildStudentSummary(payload) {
    const profile = payload?.profile || payload?.localStorage?.evoStudentProfile || null;
    const user = global.EvoStudentAuth?.getCurrentUser?.();
    if (!profile && !user) return null;
    const suggestedId = profile?.suggestedTutorId || profile?.agentId || null;
    return {
      displayName: profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Student",
      email: user?.email || null,
      schoolId: getSchoolId(),
      level: typeof profile?.level === "number" ? profile.level : null,
      levelLabel: profile?.levelLabel || profile?.levelName || null,
      combinedScore: typeof profile?.combinedScore === "number" ? profile.combinedScore : null,
      learningScore: typeof profile?.learningScore === "number" ? profile.learningScore : null,
      points: typeof profile?.points === "number" ? profile.points : null,
      tutorStatus: profile?.tutorStatus || null,
      suggestedTutorId: suggestedId,
      assignedTutorId: profile?.assignedTutorId || null,
      agentId: profile?.agentId || suggestedId,
      agentName: profile?.agentName || null,
      tutorIndex: typeof profile?.tutorIndex === "number" ? profile.tutorIndex : null,
      emblems: Array.isArray(profile?.emblems) ? profile.emblems : [],
      assessedAt: profile?.assessedAt || null,
      lastActiveAt: new Date().toISOString(),
      updatedAt: firestoreMod?.serverTimestamp?.() || new Date().toISOString(),
    };
  }

  async function syncStudentSummary(payload) {
    const ctx = await getFirestoreContext();
    if (!ctx) return { ok: false };
    const summary = buildStudentSummary(payload);
    if (!summary) return { ok: false };
    try {
      await firestoreMod.setDoc(ctx.studentRef, summary, { merge: true });
      return { ok: true };
    } catch (err) {
      warn("student summary sync failed", err);
      return { ok: false, error: err };
    }
  }

  function mergeTutorApprovalFromStudentDoc(studentData) {
    if (!studentData) return;
    const existing = global.EvoStudentProfile?.loadStudentProfileRaw?.() || {};
    const merged = { ...existing };
    const fields = [
      "tutorStatus", "assignedTutorId", "suggestedTutorId",
      "level", "levelLabel", "agentId", "agentName", "tutorIndex",
      "combinedScore", "learningScore", "points", "assessedAt", "emblems", "displayName",
    ];
    fields.forEach((key) => {
      if (studentData[key] !== undefined && studentData[key] !== null) merged[key] = studentData[key];
    });
    if (studentData.tutorStatus === "approved" && studentData.assignedTutorId) {
      merged.agentId = studentData.assignedTutorId;
      const tutors = global.EvoStudentProfile?.getTutors?.() || [];
      const tutor = global.EvoStudentProfile?.findTutorById?.(tutors, studentData.assignedTutorId);
      if (tutor) {
        merged.agentName = tutor.name;
        merged.tutorIndex = tutor.levelNumber - 1;
        merged.level = tutor.levelNumber;
        merged.levelLabel = tutor.level;
      }
    }
    setJson("evoStudentProfile", merged);
    if (global.EvoStudentProfile?.applyLessonQuizProfile) {
      global.EvoStudentProfile.applyLessonQuizProfile(merged);
    }
  }

  function loadQueue() {
    try {
      const key = getSyncQueueStorageKey();
      const raw = global.localStorage.getItem(key) || global.localStorage.getItem(SYNC_QUEUE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      // Migrate legacy queue key into a uid-scoped queue (prevents cross-user replay).
      if (raw && global.localStorage.getItem(SYNC_QUEUE_KEY) && key !== SYNC_QUEUE_KEY) {
        try {
          global.localStorage.setItem(key, raw);
          global.localStorage.removeItem(SYNC_QUEUE_KEY);
        } catch { /* ignore */ }
      }
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveQueue(queue) {
    try {
      global.localStorage.setItem(getSyncQueueStorageKey(), JSON.stringify(queue.slice(-50)));
    } catch { /* optional */ }
  }

  function enqueue(item) {
    saveQueue([...loadQueue(), { ...item, queuedAt: new Date().toISOString() }]);
  }

  async function saveAllProgress(options) {
    if (!isSignedIn()) {
      enqueue({ kind: "progress", reason: options?.reason || "unsigned" });
      return { ok: false, reason: "not-signed-in" };
    }

    const ctx = await getFirestoreContext();
    if (!ctx) {
      enqueue({ kind: "progress", reason: options?.reason || "no-firestore" });
      return { ok: false, reason: "no-firestore" };
    }

    const payload = options?.payload || collectLocalProgress();
    payload.updatedAt = new Date().toISOString();
    payload.lastSyncReason = options?.reason || "manual";

    try {
      await firestoreMod.setDoc(ctx.docRef, payload, { merge: true });
      await syncStudentSummary(payload);
      const remaining = loadQueue().filter((item) => item.kind !== "progress");
      saveQueue(remaining);
      global.dispatchEvent(new CustomEvent("evolearn:progress-saved", {
        detail: { reason: payload.lastSyncReason, updatedAt: payload.updatedAt },
      }));
      log("progress saved", ctx.uid);
      return { ok: true, updatedAt: payload.updatedAt };
    } catch (err) {
      warn("progress save failed", err);
      enqueue({ kind: "progress", reason: payload.lastSyncReason });
      return { ok: false, reason: "save-failed", error: err };
    }
  }

  async function loadProgressIntoLocal(options) {
    if (!isSignedIn()) return { ok: false, reason: "not-signed-in" };

    const ctx = await getFirestoreContext();
    if (!ctx) return { ok: false, reason: "no-firestore" };

    try {
      const [progressSnap, studentSnap] = await Promise.all([
        firestoreMod.getDoc(ctx.docRef),
        firestoreMod.getDoc(ctx.studentRef),
      ]);
      if (studentSnap.exists()) {
        mergeTutorApprovalFromStudentDoc(studentSnap.data());
      }
      if (!progressSnap.exists()) {
        if (options?.uploadLocalIfEmpty) {
          return saveAllProgress({ reason: "first-cloud-seed" });
        }
        return { ok: true, empty: true };
      }
      applySnapshotToLocal(progressSnap.data(), { cloudWins: options?.cloudWins !== false });
      return { ok: true, updatedAt: progressSnap.data()?.updatedAt || null };
    } catch (err) {
      warn("progress load failed", err);
      return { ok: false, reason: "load-failed", error: err };
    }
  }

  async function clearCloudProgress() {
    if (!isSignedIn()) return { ok: false, reason: "not-signed-in" };
    const ctx = await getFirestoreContext();
    if (!ctx) return { ok: false, reason: "no-firestore" };
    try {
      await firestoreMod.deleteDoc(ctx.docRef);
      saveQueue(loadQueue().filter((item) => item.kind !== "progress"));
      return { ok: true };
    } catch (err) {
      warn("cloud clear failed", err);
      return { ok: false, reason: "clear-failed", error: err };
    }
  }

  async function writeEvent(type, payload) {
    if (!isSignedIn()) {
      enqueue({ kind: "event", type, payload });
      return { ok: false, reason: "not-signed-in" };
    }
    if (!isOnline()) {
      enqueue({ kind: "event", type, payload });
      return { ok: false, reason: "offline" };
    }

    const db = await ensureFirebase();
    const uid = global.EvoStudentAuth?.getCurrentUser?.()?.uid;
    if (!db || !uid) {
      enqueue({ kind: "event", type, payload });
      return { ok: false, reason: "firebase-unavailable" };
    }

    const eventId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const eventRef = firestoreMod.doc(
      db,
      "schools",
      getSchoolId(),
      "students",
      uid,
      "events",
      eventId,
    );

    try {
      await firestoreMod.setDoc(eventRef, {
        type,
        lessonId: payload?.lessonId || null,
        moduleId: payload?.moduleId || null,
        payload: payload || {},
        timestamp: firestoreMod.serverTimestamp?.() || new Date().toISOString(),
      });
      return { ok: true, eventId };
    } catch (err) {
      warn("event write failed", type, err);
      enqueue({ kind: "event", type, payload });
      return { ok: false, reason: "write-failed", error: err };
    }
  }

  async function writeSignal(type, payload) {
    if (!isSignedIn()) {
      enqueue({ kind: "signal", type, payload });
      return { ok: false, reason: "not-signed-in" };
    }
    if (!isOnline()) {
      enqueue({ kind: "signal", type, payload });
      return { ok: false, reason: "offline" };
    }

    const db = await ensureFirebase();
    const uid = global.EvoStudentAuth?.getCurrentUser?.()?.uid;
    if (!db || !uid) {
      enqueue({ kind: "signal", type, payload });
      return { ok: false, reason: "firebase-unavailable" };
    }

    const signalId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const signalRef = firestoreMod.doc(
      db,
      "schools",
      getSchoolId(),
      "students",
      uid,
      "signals",
      signalId,
    );

    const createdAt = firestoreMod.serverTimestamp?.() || new Date().toISOString();
    const cleanPayload = payload && typeof payload === "object" ? payload : {};

    try {
      await firestoreMod.setDoc(signalRef, {
        type,
        lessonId: cleanPayload?.lessonId || null,
        moduleId: cleanPayload?.moduleId || null,
        topicId: cleanPayload?.topicId || null,
        slideIndex: typeof cleanPayload?.slideIndex === "number" ? cleanPayload.slideIndex : null,
        createdAt,
        payload: cleanPayload,
      });
      return { ok: true, signalId };
    } catch (err) {
      warn("signal write failed", type, err);
      enqueue({ kind: "signal", type, payload: cleanPayload });
      return { ok: false, reason: "write-failed", error: err };
    }
  }

  function notifyChange(reason) {
    pendingReason = reason || pendingReason || "change";
    if (saveTimer) global.clearTimeout(saveTimer);
    saveTimer = global.setTimeout(() => {
      saveTimer = null;
      flushSave(pendingReason);
    }, DEBOUNCE_MS);
  }

  async function flushSave(reason) {
    if (!canSync()) {
      if (reason) enqueue({ kind: "progress", reason });
      return;
    }
    if (saveInFlight) {
      notifyChange(reason);
      return;
    }
    saveInFlight = true;
    try {
      await saveAllProgress({ reason: reason || "debounced" });
    } finally {
      saveInFlight = false;
    }
  }

  async function flushQueue() {
    if (!isSignedIn() || !isOnline()) return { flushed: 0 };
    const queue = loadQueue();
    if (!queue.length) return { flushed: 0 };

    let flushed = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        let ok = false;
        if (item.kind === "progress") {
          ok = (await saveAllProgress({ reason: item.reason || "queue-flush" })).ok;
        } else if (item.kind === "event") {
          ok = (await writeEvent(item.type, item.payload)).ok;
        } else if (item.kind === "signal") {
          ok = (await writeSignal(item.type, item.payload)).ok;
        }
        if (ok) flushed += 1;
        else remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }

    saveQueue(remaining);
    return { flushed, remaining: remaining.length };
  }

  async function recordProfileUpdate(profile) {
    notifyChange("profile");
    return writeEvent("profile_update", {
      level: profile?.level,
      tutorId: profile?.agentId,
      points: profile?.points,
    });
  }

  async function recordAssessmentComplete(suggestion, profile) {
    notifyChange("assessment-complete");
    const breakdown = {
      tutorIndex: suggestion?.tutorIndex,
      tutorName: suggestion?.tutorName,
      combinedScore: suggestion?.combinedScore,
      stage1Score: suggestion?.stage1Score,
      stage2Score: suggestion?.stage2Score,
      completedAt: suggestion?.completedAt,
      itemResults: suggestion?.itemResults || [],
      level: profile?.level,
      tutorStatus: profile?.tutorStatus || "pending",
      suggestedTutorId: profile?.suggestedTutorId,
    };

    // Audit trail (existing).
    await writeEvent("assessment_complete", breakdown);

    // Structured learning signal (new).
    await writeSignal("assessment_complete", {
      level: profile?.level ?? null,
      scores: {
        combined: suggestion?.combinedScore ?? null,
        stage1: suggestion?.stage1Score ?? null,
        stage2: suggestion?.stage2Score ?? null,
      },
      suggestedTutorId: profile?.suggestedTutorId || null,
      tutorStatus: profile?.tutorStatus || "pending",
      completedAt: suggestion?.completedAt || null,
    });

    return { ok: true };
  }

  async function recordQuizResult(result) {
    notifyChange("quiz-result");
    const payload = {
      lessonId: result?.lessonId,
      moduleId: result?.moduleId,
      progressKey: result?.progressKey,
      correctCount: result?.correctCount,
      maxQuestions: result?.maxQuestions,
      pointsEarned: result?.pointsEarned,
      maxPoints: result?.maxPoints,
      totalPoints: result?.totalPoints,
      complete: result?.complete,
      perQuestion: Array.isArray(result?.perQuestion) ? result.perQuestion : [],
      wrongTopics: Array.isArray(result?.wrongTopics) ? result.wrongTopics.slice(0, 12) : [],
      quizId: result?.quizId || null,
      quizTitle: result?.quizTitle || null,
      completedAt: result?.completedAt || (result?.complete ? new Date().toISOString() : null),
    };

    // Audit trail (existing).
    await writeEvent("quiz_result", payload);

    // Structured learning signal (new).
    if (result?.complete) {
      await writeSignal("end_lesson_quiz_complete", {
        lessonId: payload.lessonId,
        moduleId: payload.moduleId,
        progressKey: payload.progressKey,
        quizId: payload.quizId,
        quizTitle: payload.quizTitle,
        score: {
          correct: payload.correctCount ?? null,
          max: payload.maxQuestions ?? null,
        },
        perQuestion: payload.perQuestion,
        wrongTopics: payload.wrongTopics,
        completedAt: payload.completedAt,
      });
    }

    return { ok: true };
  }

  async function recordTutorChatSignal(signal) {
    const payload = signal && typeof signal === "object" ? signal : {};
    return writeSignal("tutor_chat", {
      lessonId: payload.lessonId || null,
      moduleId: payload.moduleId || null,
      topicId: payload.topicId || null,
      slideIndex: typeof payload.slideIndex === "number" ? payload.slideIndex : null,
      intent: payload.intent || null,
      questionCategory: payload.questionCategory || null,
      misconceptionTags: Array.isArray(payload.misconceptionTags) ? payload.misconceptionTags.slice(0, 12) : [],
      timestamp: new Date().toISOString(),
    });
  }

  async function recordLessonComplete(progressKey, lessonId, moduleId) {
    notifyChange("lesson-complete");
    return writeEvent("lesson_complete", { progressKey, lessonId, moduleId });
  }

  async function logEvent(type, payload) {
    return writeEvent(type, payload);
  }

  async function pushProfile(profile) {
    notifyChange("profile-push");
    return saveAllProgress({ reason: "profile-push", payload: profile ? collectLocalProgress() : undefined });
  }

  async function pullProfile() {
    return loadProgressIntoLocal({ cloudWins: true });
  }

  function schedulePush() {
    notifyChange("schedule-push");
  }

  function wireAutoSaveHooks() {
    global.addEventListener("evolearn:lesson-progress-reset", () => {
      notifyChange("lesson-reset");
    });
    global.addEventListener("evolearn:all-data-reset", () => {
      clearCloudProgress().catch(() => {});
    });
    global.addEventListener("online", () => {
      flushQueue().catch(() => {});
    });
    global.addEventListener("evolearn:auth-ready", (event) => {
      if (event.detail?.signedIn) flushQueue().catch(() => {});
    });
    global.addEventListener("storage", (event) => {
      if (!event.key || !PERSIST_KEYS.includes(event.key)) return;
      if (!isSignedIn()) return;
      notifyChange("cross-tab");
    });
  }

  async function init() {
    wireAutoSaveHooks();
    if (!isConfigured()) return { ok: false, reason: "not-configured" };
    await ensureFirebase();
    if (isSignedIn()) await flushQueue();
    return { ok: true };
  }

  global.EvoStudentSync = {
    DOC_VERSION,
    PERSIST_KEYS,
    SESSION_ONLY_KEYS,
    STUDENT_ID_KEY,
    SCHOOL_ID_KEY,
    getSchoolId,
    setSchoolId,
    getStudentId,
    isConfigured,
    isReady,
    ensureFirebase,
    collectLocalProgress,
    applySnapshotToLocal,
    saveAllProgress,
    loadProgressIntoLocal,
    clearCloudProgress,
    notifyChange,
    flushSave,
    flushQueue,
    handleAuthUserChanged,
    writeEvent,
    writeSignal,
    recordProfileUpdate,
    recordAssessmentComplete,
    recordQuizResult,
    recordLessonComplete,
    recordTutorChatSignal,
    logEvent,
    pushProfile,
    pullProfile,
    schedulePush,
    init,
  };

  if (global.document?.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", () => { init().catch(() => {}); });
  } else {
    init().catch(() => {});
  }
})(typeof window !== "undefined" ? window : globalThis);
