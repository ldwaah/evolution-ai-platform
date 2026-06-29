#!/usr/bin/env node
/**
 * Simulates Joshua completing lesson 1 and writes to Firestore via REST.
 * Run: node scripts/simulate-joshua-lesson-complete.mjs
 */
const API_KEY = "AIzaSyAC3LIUhOmW7t1X9wHw62FVN4VX0i8aThA";
const PROJECT = "student-portal-9de85";
const JOSHUA_UID = "hgoNTMP5wEbHyTy436fcqvOECMV2";
const PROGRESS_KEY = "citizenship.module-1.lesson-1";

async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "joshua@evolearn.demo",
        password: "Joshua123",
        returnSecureToken: true,
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data.idToken;
}

function firestoreValue(val) {
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => firestoreValue(item)) } };
  }
  if (val && typeof val === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, firestoreValue(v)]),
        ),
      },
    };
  }
  if (typeof val === "number") return { integerValue: String(val) };
  if (typeof val === "boolean") return { booleanValue: val };
  return { stringValue: String(val) };
}

async function patchProgress(idToken) {
  const now = new Date().toISOString();
  const payload = {
    version: 1,
    updatedAt: now,
    lastSyncReason: "simulate-joshua-lesson-1",
    lessonProgress: [PROGRESS_KEY],
    lessonCheckpoints: {},
    localStorage: {
      "evolearn-progress": [PROGRESS_KEY],
      evoLessonCheckpoints: {},
    },
  };

  const fields = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [k, firestoreValue(v)]),
  );

  const path = `schools/demo/students/${JOSHUA_UID}/progress/main`;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}?updateMask.fieldPaths=version&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=lastSyncReason&updateMask.fieldPaths=lessonProgress&updateMask.fieldPaths=lessonCheckpoints&updateMask.fieldPaths=localStorage`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function readProgress(idToken) {
  const path = `schools/demo/students/${JOSHUA_UID}/progress/main`;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  const lessons = data.fields?.lessonProgress?.arrayValue?.values?.map((v) => v.stringValue) || [];
  return lessons;
}

async function main() {
  console.log("Signing in as Joshua...");
  const token = await signIn();
  console.log("Before:", await readProgress(token));
  console.log("Patching lesson 1 complete...");
  await patchProgress(token);
  const after = await readProgress(token);
  console.log("After:", after);
  if (!after.includes(PROGRESS_KEY)) {
    console.error("FAILED: lesson not in Firestore");
    process.exit(1);
  }
  console.log("OK: Joshua lesson 1 progress saved to Firestore");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
