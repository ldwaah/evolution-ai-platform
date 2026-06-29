/**
 * EVOlearn — Firebase web config (static hosting / Netlify)
 *
 * The app no-ops database sync when placeholders remain.
 *
 * Enable Firebase (pick one):
 *  1. Netlify — inject before other scripts:
 *       <script>window.EVO_FIREBASE_CONFIG = { apiKey:"...", projectId:"...", ... };</script>
 *  2. Local override — optional gitignored firebase-config.local.js setting window.EVO_FIREBASE_CONFIG
 *  3. Replace placeholders below (avoid committing real keys)
 */
(function (global) {
  const PLACEHOLDER_PROJECT = "your-project-id";
  const PLACEHOLDER_API_KEY = "YOUR_API_KEY";
  const DEFAULT_SCHOOL_ID = "demo";

  const DEFAULT_CONFIG = {
    apiKey: PLACEHOLDER_API_KEY,
    authDomain: "your-project-id.firebaseapp.com",
    projectId: PLACEHOLDER_PROJECT,
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000",
  };

  if (!global.EVO_FIREBASE_CONFIG) {
    global.EVO_FIREBASE_CONFIG = { ...DEFAULT_CONFIG };
  }

  function getConfig() {
    return { ...DEFAULT_CONFIG, ...global.EVO_FIREBASE_CONFIG };
  }

  function isConfigured() {
    const config = getConfig();
    if (!config.projectId || config.projectId === PLACEHOLDER_PROJECT) return false;
    if (!config.apiKey || config.apiKey === PLACEHOLDER_API_KEY) return false;
    if (String(config.projectId).includes("YOUR_")) return false;
    return true;
  }

  function useAnonymousAuth() {
    return global.EVO_FIREBASE_ANONYMOUS_AUTH !== false;
  }

  function getSchoolId() {
    try {
      return global.localStorage.getItem("evoSchoolId")
        || global.EVO_SCHOOL_ID
        || DEFAULT_SCHOOL_ID;
    } catch {
      return DEFAULT_SCHOOL_ID;
    }
  }

  global.EvoFirebaseConfig = {
    DEFAULT_SCHOOL_ID,
    PLACEHOLDER_PROJECT,
    getConfig,
    isConfigured,
    useAnonymousAuth,
    getSchoolId,
  };
})(typeof window !== "undefined" ? window : globalThis);
