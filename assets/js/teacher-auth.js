/**
 * EVOlearn — teacher Firebase Authentication and role checks
 */
(function (global) {
  const DEMO_EMAIL_DOMAIN = "evolearn.demo";
  const DEMO_SCHOOL_ID = "demo";
  const DEMO_TEACHER_USERNAME = "Teacher123";
  const DEMO_TEACHER_PASSWORD = "Teacher123";

  let app = null;
  let auth = null;
  let db = null;
  let initPromise = null;
  let teacherSession = null;
  const listeners = new Set();

  function normalizeUsername(value) {
    return String(value || "").trim();
  }

  function usernameToEmail(username) {
    const u = normalizeUsername(username);
    if (!u) return "";
    return `${u.toLowerCase()}@${DEMO_EMAIL_DOMAIN}`;
  }

  function isDemoTeacher(username) {
    return normalizeUsername(username) === DEMO_TEACHER_USERNAME;
  }

  async function ensureTeacherDocs(mods, user) {
    const { doc, setDoc, serverTimestamp } = mods;
    await setDoc(doc(db, "users", user.uid), {
      role: "teacher",
      schoolId: DEMO_SCHOOL_ID,
      email: user.email || "",
      displayName: DEMO_TEACHER_USERNAME,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, "schools", DEMO_SCHOOL_ID, "teachers", user.uid), {
      role: "teacher",
      schoolId: DEMO_SCHOOL_ID,
      email: user.email || "",
      displayName: DEMO_TEACHER_USERNAME,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  function isReady() {
    return global.EvoFirebaseConfig?.isConfigured?.() === true;
  }

  function notify() {
    listeners.forEach((fn) => {
      try { fn(teacherSession); } catch { /* ignore */ }
    });
  }

  async function importModules() {
    const [appMod, authMod, fsMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
    ]);
    return { ...appMod, ...authMod, ...fsMod };
  }

  async function init() {
    if (!isReady()) return null;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const mods = await importModules();
      const config = global.EvoFirebaseConfig.getConfig();
      const existing = mods.getApps?.() || [];
      app = existing.length ? existing[0] : mods.initializeApp(config);
      auth = mods.getAuth(app);
      db = mods.getFirestore(app);
      global.__evoTeacherMods = mods;
      global.EvoTeacherFirebaseAuth = {
        signInWithEmailAndPassword: mods.signInWithEmailAndPassword,
        signOut: mods.signOut,
      };

      mods.onAuthStateChanged(auth, async (user) => {
        if (!user) {
          teacherSession = null;
          notify();
          return;
        }
        teacherSession = await resolveTeacherSession(user).catch(() => null);
        notify();
      });
      return auth;
    })();
    return initPromise;
  }

  async function resolveTeacherSession(user) {
    const { doc, getDoc } = global.__evoTeacherMods;
    const schoolId = global.EvoFirebaseConfig.getSchoolId?.() || DEMO_SCHOOL_ID;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userSnap.exists() ? userSnap.data() : null;
    const teacherSnap = await getDoc(doc(db, "schools", schoolId, "teachers", user.uid));
    const teacherData = teacherSnap.exists() ? teacherSnap.data() : null;

    const role = userData?.role || teacherData?.role;
    const resolvedSchool = userData?.schoolId || teacherData?.schoolId || schoolId;

    if (role !== "teacher" && !teacherData) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: userData?.displayName || teacherData?.displayName || user.email?.split("@")[0] || "Teacher",
      schoolId: resolvedSchool,
      role: "teacher",
    };
  }

  async function signIn(email, password) {
    await init();
    const cred = await global.EvoTeacherFirebaseAuth.signInWithEmailAndPassword(auth, String(email || "").trim(), String(password || ""));
    const session = await resolveTeacherSession(cred.user);
    if (!session) {
      await global.EvoTeacherFirebaseAuth.signOut(auth);
      throw new Error("This account is not registered as a teacher.");
    }
    teacherSession = session;
    notify();
    return session;
  }

  async function signInWithUsername(username, password) {
    const u = normalizeUsername(username);
    if (!u) throw new Error("Enter your username.");
    const pwd = String(password || "");
    const email = usernameToEmail(u);

    await init();

    try {
      const cred = await global.EvoTeacherFirebaseAuth.signInWithEmailAndPassword(auth, email, pwd);
      const session = await resolveTeacherSession(cred.user);
      if (!session) {
        await global.EvoTeacherFirebaseAuth.signOut(auth);
        throw new Error("This account is not registered as a teacher.");
      }
      teacherSession = session;
      notify();
      return session;
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        if (!isDemoTeacher(u)) throw new Error("Unknown teacher username.");
        if (pwd !== DEMO_TEACHER_PASSWORD) throw new Error("Incorrect password for the demo teacher.");
        const mods = global.__evoTeacherMods;
        const created = await mods.createUserWithEmailAndPassword(auth, email, DEMO_TEACHER_PASSWORD);
        await mods.updateProfile(created.user, { displayName: DEMO_TEACHER_USERNAME });
        await ensureTeacherDocs(mods, created.user);
        const session = await resolveTeacherSession(created.user);
        if (!session) throw new Error("Could not create teacher session.");
        teacherSession = session;
        notify();
        return session;
      }
      throw err;
    }
  }

  async function signOut() {
    if (!auth) return;
    await global.EvoTeacherFirebaseAuth.signOut(auth);
    teacherSession = null;
    notify();
  }

  function getSession() {
    return teacherSession;
  }

  function onSessionChange(fn) {
    listeners.add(fn);
    if (teacherSession) fn(teacherSession);
    return () => listeners.delete(fn);
  }

  function getDb() {
    return db;
  }

  global.EvoTeacherAuth = {
    isReady,
    init,
    signIn,
    signInWithUsername,
    signOut,
    getSession,
    onSessionChange,
    getDb,
    getApp: () => app,
  };
})(typeof window !== "undefined" ? window : globalThis);
