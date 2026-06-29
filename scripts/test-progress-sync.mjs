#!/usr/bin/env node
/**
 * Unit checks for progress sync merge helpers + optional live Firestore read.
 * Run: node scripts/test-progress-sync.mjs
 * Live read: node scripts/test-progress-sync.mjs --live
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const syncSrc = readFileSync(join(root, "assets/js/student-sync.js"), "utf8");

function lessonCountFromPayload(data) {
  if (!data) return 0;
  const lp = data.lessonProgress ?? data.localStorage?.["evolearn-progress"];
  return Array.isArray(lp) ? lp.length : 0;
}

function checkpointCountFromPayload(data) {
  if (!data) return 0;
  const cp = data.lessonCheckpoints ?? data.localStorage?.evoLessonCheckpoints;
  return cp && typeof cp === "object" && !Array.isArray(cp) ? Object.keys(cp).length : 0;
}

function hasMeaningfulProgress(data) {
  if (!data) return false;
  return lessonCountFromPayload(data) > 0 || checkpointCountFromPayload(data) > 0;
}

function isCloudEmptierThanLocal(cloudData, localData) {
  if (!localData || !hasMeaningfulProgress(localData)) return false;
  if (!cloudData || !hasMeaningfulProgress(cloudData)) return true;
  if (lessonCountFromPayload(localData) > lessonCountFromPayload(cloudData)) return true;
  if (checkpointCountFromPayload(localData) > checkpointCountFromPayload(cloudData)) return true;
  return false;
}

const joshuaLocal = {
  lessonProgress: ["citizenship.module-1.lesson-1"],
  lessonCheckpoints: {},
  localStorage: { "evolearn-progress": ["citizenship.module-1.lesson-1"] },
};

const emptyCloud = {
  lessonProgress: [],
  lessonCheckpoints: {},
  localStorage: { "evolearn-progress": [] },
};

const checks = [
  ["flushSave exported", /flushSave,/s.test(syncSrc)],
  ["recordLessonComplete awaits flushSave", /recordLessonComplete[\s\S]*?await flushSave\("lesson-complete"\)/.test(syncSrc)],
  ["lesson-completion awaits flushSave", /await global\.EvoStudentSync\?\.flushSave\?\.\("lesson-complete"\)/.test(
    readFileSync(join(root, "assets/js/lesson-completion.js"), "utf8"),
  )],
  ["auth uses getApps guard", /existing\.length \? existing\[0\] : appMod\.initializeApp/.test(
    readFileSync(join(root, "assets/js/student-auth.js"), "utf8"),
  )],
  ["local richer than empty cloud", isCloudEmptierThanLocal(emptyCloud, joshuaLocal)],
  ["empty cloud not richer than local", !isCloudEmptierThanLocal(joshuaLocal, emptyCloud)],
  ["PERSIST_KEYS includes evolearn-progress", /"evolearn-progress"/.test(syncSrc) && /"evoLessonCheckpoints"/.test(syncSrc)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) failed += 1;
}

if (process.argv.includes("--live")) {
  const FIREBASE_VERSION = "10.14.1";
  const config = {
    apiKey: "AIzaSyAC3LIUhOmW7t1X9wHw62FVN4VX0i8aThA",
    authDomain: "student-portal-9de85.firebaseapp.com",
    projectId: "student-portal-9de85",
  };
  const JOSHUA_UID = "hgoNTMP5wEbHyTy436fcqvOECMV2";
  const { initializeApp, getApps } = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
  const { getAuth, signInWithEmailAndPassword } = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`);
  const { getFirestore, doc, getDoc } = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    await signInWithEmailAndPassword(auth, "joshua@evolearn.demo", "Joshua123");
    const snap = await getDoc(doc(db, "schools", "demo", "students", JOSHUA_UID, "progress", "main"));
    const data = snap.exists() ? snap.data() : null;
    const lessons = data?.lessonProgress || [];
    console.log(`\nLive Joshua lessonProgress (${lessons.length}):`, lessons);
  } catch (err) {
    console.warn("\nLive Firestore read skipped:", err.message || err);
  }
}

process.exit(failed ? 1 : 0);
