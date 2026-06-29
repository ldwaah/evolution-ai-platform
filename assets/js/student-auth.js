/**
 * EVOlearn — Firebase Authentication for students
 *
 * No-ops when Firebase is not configured (demo / local mode).
 * On sign-in, pulls cloud progress before the dashboard is shown.
 */
(function (global) {
  const FIREBASE_VERSION = "10.14.1";
  const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const GUEST_KEY = "evolearn-auth-guest";
  const DEMO_EMAIL_DOMAIN = "evolearn.demo";
  const DEMO_SCHOOL_ID = "demo";
  const DEMO_STUDENTS = new Set(["Stacey", "Joshua", "Jayden", "Jovan"]);

  let firebaseApp = null;
  let auth = null;
  let db = null;
  let initPromise = null;
  let currentUser = null;
  let authReady = false;
  const authListeners = new Set();
  const RELOAD_GUARD_KEY = "evolearn-reloaded-for-user-switch";

  function isConfigured() {
    return Boolean(global.EvoFirebaseConfig?.isConfigured?.());
  }

  function notifyAuthListeners(user) {
    currentUser = user || null;
    authListeners.forEach((fn) => {
      try { fn(currentUser); } catch { /* ignore */ }
    });
  }

  async function loadFirebaseModules() {
    const [appMod, authMod, firestoreMod] = await Promise.all([
      import(`${FIREBASE_CDN}/firebase-app.js`),
      import(`${FIREBASE_CDN}/firebase-auth.js`),
      import(`${FIREBASE_CDN}/firebase-firestore.js`),
    ]);
    return { appMod, authMod, firestoreMod };
  }

  async function ensureFirebase() {
    if (!isConfigured()) return null;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const config = global.EvoFirebaseConfig.getConfig();
      const { appMod, authMod, firestoreMod } = await loadFirebaseModules();
      const existing = appMod.getApps?.() || [];
      firebaseApp = existing.length ? existing[0] : appMod.initializeApp(config);
      auth = authMod.getAuth(firebaseApp);
      db = firestoreMod.getFirestore(firebaseApp);

      authMod.onAuthStateChanged(auth, (user) => {
        authReady = true;
        try {
          // Ensure per-uid local caches are cleared/updated BEFORE any UI loads progress.
          global.EvoStudentSync?.handleAuthUserChanged?.(user);
        } catch { /* ignore */ }
        notifyAuthListeners(user);
      });

      return { auth, db, authMod, firestoreMod };
    })().catch((err) => {
      initPromise = null;
      console.warn("[EVOlearn] Firebase initialisation failed:", err);
      return null;
    });

    return initPromise;
  }

  function getAuth() {
    return auth;
  }

  function getDb() {
    return db;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isGuest() {
    try { return global.localStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
  }

  function isSignedIn() {
    return Boolean(currentUser?.uid);
  }

  function hasAppAccess() {
    return isSignedIn() || isGuest();
  }

  function continueAsGuest() {
    try {
      global.localStorage.setItem(GUEST_KEY, "1");
      global.localStorage.setItem("evolearn-role", "student");
      global.sessionStorage.setItem("evolearn-entered", "1");
    } catch { /* storage blocked */ }
  }

  function markSessionEntered() {
    try {
      global.localStorage.removeItem(GUEST_KEY);
      global.localStorage.setItem("evolearn-role", "student");
      global.sessionStorage.setItem("evolearn-entered", "1");
    } catch { /* storage blocked */ }
  }

  function ensureIntroGatePassed() {
    try { global.sessionStorage.setItem("evolearn-entered", "1"); } catch { /* storage blocked */ }
  }

  function getDisplayName() {
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email.split("@")[0];
    if (isGuest()) return "Guest";
    return null;
  }

  function normalizeUsername(value) {
    return String(value || "").trim();
  }

  function usernameToEmail(username) {
    const u = normalizeUsername(username);
    if (!u) return "";
    return `${u.toLowerCase()}@${DEMO_EMAIL_DOMAIN}`;
  }

  function isAllowedDemoUsername(username) {
    const u = normalizeUsername(username);
    return DEMO_STUDENTS.has(u);
  }

  function expectedDemoPasswordFor(username) {
    const u = normalizeUsername(username);
    if (!u) return "";
    return `${u}123`;
  }

  async function ensureStudentAccountDoc(ctx, user, displayName, options) {
    const schoolId = options?.schoolId
      || global.EvoFirebaseConfig?.getSchoolId?.()
      || DEMO_SCHOOL_ID;
    const { doc, setDoc } = ctx.firestoreMod;
    const name = String(displayName || user.displayName || "").trim();

    await setDoc(doc(db, "users", user.uid), {
      role: "student",
      schoolId,
      email: user.email || "",
      displayName: name || user.email?.split("@")[0] || "Student",
      updatedAt: ctx.firestoreMod.serverTimestamp(),
      createdAt: ctx.firestoreMod.serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, "schools", schoolId, "students", user.uid), {
      displayName: name || user.email?.split("@")[0] || "Student",
      email: user.email || "",
      schoolId,
      tutorStatus: null,
      createdAt: ctx.firestoreMod.serverTimestamp(),
      updatedAt: ctx.firestoreMod.serverTimestamp(),
    }, { merge: true });
  }

  function onAuthStateChanged(callback) {
    authListeners.add(callback);
    if (authReady) callback(currentUser);
    return () => authListeners.delete(callback);
  }

  async function waitForAuthReady() {
    if (!isConfigured()) return null;
    await ensureFirebase();
    if (authReady) return currentUser;
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged((user) => {
        unsub();
        resolve(user);
      });
    });
  }

  async function signIn(email, password) {
    if (!isConfigured()) {
      return { ok: false, message: "Firebase is not configured. Use demo mode." };
    }
    const ctx = await ensureFirebase();
    if (!ctx) return { ok: false, message: "Could not connect to Firebase." };

    try {
      const credential = await ctx.authMod.signInWithEmailAndPassword(
        auth,
        String(email || "").trim(),
        String(password || ""),
      );
      let switched = false;
      try {
        switched = !!global.EvoStudentSync?.handleAuthUserChanged?.(credential.user)?.switched;
      } catch { /* ignore */ }
      notifyAuthListeners(credential.user);
      await ensureStudentAccountDoc(ctx, credential.user);
      if (global.EvoStudentSync?.loadProgressIntoLocal) {
        await global.EvoStudentSync.loadProgressIntoLocal({ cloudWins: true });
      }
      markSessionEntered();
      if (switched) maybeReloadAfterUserSwitch();
      return { ok: true, user: credential.user };
    } catch (err) {
      return { ok: false, message: friendlyAuthError(err) };
    }
  }

  async function signInWithUsername(username, password) {
    const u = normalizeUsername(username);
    if (!u) return { ok: false, message: "Please enter your username." };
    const email = usernameToEmail(u);
    const pwd = String(password || "");

    if (!isConfigured()) {
      return { ok: false, message: "Firebase is not configured. Use demo mode." };
    }

    const ctx = await ensureFirebase();
    if (!ctx) return { ok: false, message: "Could not connect to Firebase." };

    try {
      const credential = await ctx.authMod.signInWithEmailAndPassword(auth, email, pwd);
      let switched = false;
      try {
        switched = !!global.EvoStudentSync?.handleAuthUserChanged?.(credential.user)?.switched;
      } catch { /* ignore */ }
      notifyAuthListeners(credential.user);
      try { global.localStorage.setItem("evoSchoolId", DEMO_SCHOOL_ID); } catch { /* ignore */ }
      await ensureStudentAccountDoc(ctx, credential.user, u, { schoolId: DEMO_SCHOOL_ID });
      if (global.EvoStudentSync?.loadProgressIntoLocal) {
        await global.EvoStudentSync.loadProgressIntoLocal({ cloudWins: true });
      }
      markSessionEntered();
      if (switched) maybeReloadAfterUserSwitch();
      return { ok: true, user: credential.user };
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        if (!isAllowedDemoUsername(u)) {
          return { ok: false, message: "Unknown username. Use one of the demo accounts." };
        }
        const expected = expectedDemoPasswordFor(u);
        if (pwd !== expected) {
          return { ok: false, message: "Incorrect password for this demo user." };
        }
        try {
          const credential = await ctx.authMod.createUserWithEmailAndPassword(auth, email, expected);
          const user = credential.user;
          let switched = false;
          try {
            switched = !!global.EvoStudentSync?.handleAuthUserChanged?.(user)?.switched;
          } catch { /* ignore */ }
          notifyAuthListeners(user);
          try { global.localStorage.setItem("evoSchoolId", DEMO_SCHOOL_ID); } catch { /* ignore */ }
          await ctx.authMod.updateProfile(user, { displayName: u });
          await ensureStudentAccountDoc(ctx, user, u, { schoolId: DEMO_SCHOOL_ID });
          if (global.EvoStudentSync?.loadProgressIntoLocal) {
            await global.EvoStudentSync.loadProgressIntoLocal({ cloudWins: true });
          }
          markSessionEntered();
          if (switched) maybeReloadAfterUserSwitch();
          return { ok: true, user };
        } catch (createErr) {
          return { ok: false, message: friendlyAuthError(createErr) };
        }
      }
      return { ok: false, message: friendlyAuthError(err) };
    }
  }

  async function signUp(email, password, displayName) {
    if (!isConfigured()) {
      return { ok: false, message: "Firebase is not configured. Use demo mode." };
    }
    const ctx = await ensureFirebase();
    if (!ctx) return { ok: false, message: "Could not connect to Firebase." };

    const guestProgress = global.EvoStudentSync?.collectLocalProgress?.() || null;

    try {
      const credential = await ctx.authMod.createUserWithEmailAndPassword(
        auth,
        String(email || "").trim(),
        String(password || ""),
      );
      const user = credential.user;
      notifyAuthListeners(user);
      const name = String(displayName || "").trim();
      if (name) {
        await ctx.authMod.updateProfile(user, { displayName: name });
      }

      await ensureStudentAccountDoc(ctx, user, name);

      if (guestProgress && global.EvoStudentSync?.saveAllProgress) {
        await global.EvoStudentSync.saveAllProgress({
          reason: "guest-to-account",
          payload: guestProgress,
        });
      } else if (global.EvoStudentSync?.saveAllProgress) {
        await global.EvoStudentSync.saveAllProgress({ reason: "sign-up" });
      }

      markSessionEntered();
      return { ok: true, user };
    } catch (err) {
      return { ok: false, message: friendlyAuthError(err) };
    }
  }

  async function signOut() {
    try { global.localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
    if (!auth) {
      currentUser = null;
      return { ok: true };
    }
    const ctx = await ensureFirebase();
    if (!ctx) return { ok: true };
    try {
      await ctx.authMod.signOut(auth);
      try { global.sessionStorage.removeItem("evolearn-entered"); } catch { /* ignore */ }
      try { global.sessionStorage.removeItem(RELOAD_GUARD_KEY); } catch { /* ignore */ }
      return { ok: true };
    } catch (err) {
      console.warn("[EVOlearn] Sign out failed:", err);
      return { ok: false, message: friendlyAuthError(err) };
    }
  }

  function maybeReloadAfterUserSwitch() {
    try {
      if (global.sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;
      global.sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
    } catch { /* ignore */ }
    try {
      global.location.reload();
    } catch { /* ignore */ }
  }

  async function waitForAuthGate() {
    if (!isConfigured()) {
      return { mode: isGuest() ? "guest" : "offline" };
    }
    if (isGuest()) {
      ensureIntroGatePassed();
      return { mode: "guest" };
    }

    const user = await waitForAuthReady();
    if (!user) {
      global.location.replace("login.html");
      return { mode: "redirect" };
    }

    ensureIntroGatePassed();

    if (global.EvoStudentSync?.loadProgressIntoLocal) {
      try {
        await global.EvoStudentSync.loadProgressIntoLocal({ cloudWins: true });
      } catch (err) {
        console.warn("[EVOlearn] Progress restore on gate failed:", err);
      }
    }

    return { mode: "auth", user };
  }

  function friendlyAuthError(err) {
    const code = err?.code || "";
    const map = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "No account found with that email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "Network error. Check your connection and try again.",
    };
    return map[code] || err?.message || "Sign-in failed. Please try again.";
  }

  async function init() {
    if (!isConfigured()) return { configured: false };
    await ensureFirebase();
    if (isSignedIn() && global.EvoStudentSync?.loadProgressIntoLocal) {
      try {
        await global.EvoStudentSync.loadProgressIntoLocal({ cloudWins: true });
      } catch (err) {
        console.warn("[EVOlearn] Progress restore on init failed:", err);
      }
    }
    global.dispatchEvent(new CustomEvent("evolearn:auth-ready", {
      detail: { signedIn: isSignedIn(), uid: currentUser?.uid || null },
    }));
    return { configured: true, signedIn: isSignedIn() };
  }

  global.EvoStudentAuth = {
    FIREBASE_VERSION,
    GUEST_KEY,
    isConfigured,
    ensureFirebase,
    getAuth,
    getDb,
    getCurrentUser,
    getDisplayName,
    isGuest,
    isSignedIn,
    hasAppAccess,
    continueAsGuest,
    markSessionEntered,
    ensureIntroGatePassed,
    onAuthStateChanged,
    waitForAuthReady,
    waitForAuthGate,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    init,
  };

  if (global.document?.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", () => { init(); });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
