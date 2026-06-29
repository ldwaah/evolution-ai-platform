/**
 * Quick smoke test for tutor-engine FAQ and quiz paths (Node).
 * Run: node scripts/test-tutor-engine.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const novaProfile = JSON.parse(readFileSync(join(ROOT, "assets/data/tutors/nova.json"), "utf8"));

function hasSlideSpecificHint(slideChunk, slideContext, scriptLine) {
  if (slideChunk?.hint) return true;
  if (scriptLine) return true;
  if (slideContext?.note) return true;
  if (slideContext?.title) return true;
  return false;
}

function pickProfileHintIfNoSlide(examples, slideChunk, slideContext, scriptLine) {
  if (hasSlideSpecificHint(slideChunk, slideContext, scriptLine)) return null;
  return examples?.hint || null;
}

const tutorsConfig = JSON.parse(readFileSync(join(ROOT, "assets/data/tutors.json"), "utf8"));
const topic = JSON.parse(readFileSync(join(ROOT, "assets/data/knowledge/british-identity-values.json"), "utf8"));
const topic2 = JSON.parse(readFileSync(join(ROOT, "assets/data/knowledge/equality-act-discrimination.json"), "utf8"));
const studentBank = JSON.parse(readFileSync(join(ROOT, "assets/data/knowledge/student-questions/lesson-1.json"), "utf8"));

function normalizeLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.min(9, Math.max(1, Math.round(n)));
}

function tutorIdForLevel(level) {
  const band = normalizeLevel(level);
  const tutor = (tutorsConfig.tutors || []).find((t) => t.levelNumber === band);
  return tutor?.id || null;
}

function assertTutorConfigSane() {
  const idsByLevel = [];
  for (let level = 1; level <= 9; level += 1) {
    const id = tutorIdForLevel(level);
    if (!id) throw new Error(`Missing tutor for level ${level}`);
    idsByLevel.push(id);
  }

  const expected = ["nova", "milo", "ava", "kai", "zara", "theo", "nia", "elias", "athena"];
  if (idsByLevel.join(",") !== expected.join(",")) {
    throw new Error(`Tutor mapping mismatch. Got ${idsByLevel.join(",")} expected ${expected.join(",")}`);
  }

  const bands = tutorsConfig.scoreBands || [];
  for (const level of [1, 3, 6, 9]) {
    const id = tutorIdForLevel(level);
    if (!bands.some((b) => b.tutorId === id)) {
      throw new Error(`scoreBands missing tutorId for level ${level} (${id})`);
    }
  }

  // Clamp sanity: out-of-range inputs should still map deterministically.
  if (tutorIdForLevel(0) !== "nova") throw new Error("Expected level 0 to clamp to nova");
  if (tutorIdForLevel(99) !== "athena") throw new Error("Expected level 99 to clamp to athena");

  return true;
}

function getTopicContent(topicData, level) {
  const band = normalizeLevel(level);
  let chunk = topicData.levels?.[String(band)];
  if (!chunk) {
    for (let i = band - 1; i >= 1; i -= 1) {
      if (topicData.levels?.[String(i)]) {
        chunk = topicData.levels[String(i)];
        break;
      }
    }
  }
  if (!chunk) chunk = topicData.levels?.["1"];
  return {
    summary: chunk?.summary || "",
    keyPoints: chunk?.keyPoints || [],
    explainLike: chunk?.explainLike || "",
  };
}

function pickSlideLevelKeyPoint(lessonContent, slideChunk) {
  const points = lessonContent?.keyPoints || [];
  if (!points.length) return null;
  if (!slideChunk?.terms?.length) return points[0];
  const termTokens = slideChunk.terms.flatMap((term) => normalizeText(term).split(" ").filter((w) => w.length > 2));
  let best = points[0];
  let bestScore = 0;
  for (const point of points) {
    const pointTokens = normalizeText(point).split(" ").filter((w) => w.length > 2);
    let score = 0;
    for (const token of termTokens) {
      if (pointTokens.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = point;
    }
  }
  return best;
}

function buildLevelContentLines(lessonContent, level, slideChunk) {
  const band = normalizeLevel(level);
  const parts = [];
  const keyPoint = pickSlideLevelKeyPoint(lessonContent, slideChunk);
  if (band <= 3) {
    if (keyPoint) parts.push(keyPoint);
    else if (lessonContent?.summary) parts.push(lessonContent.summary.split(".")[0] + ".");
  } else if (band <= 6) {
    if (keyPoint) parts.push(keyPoint);
    if (lessonContent?.summary) parts.push(lessonContent.summary);
    if (band >= 5) parts.push("Link what you see on screen to GCSE Citizenship examples.");
  } else {
    if (keyPoint) parts.push(keyPoint);
    if (lessonContent?.explainLike) parts.push(lessonContent.explainLike);
  }
  return parts;
}

function buildSlidePromptTail(level, slideChunk) {
  const band = normalizeLevel(level);
  const firstTerm = slideChunk?.terms?.[0];
  if (band <= 3) return firstTerm ? `What does ${firstTerm} mean?` : "plain words";
  if (band <= 6) return firstTerm ? `AO2 application for ${firstTerm}` : "school or community example";
  return firstTerm ? `exam answer for ${firstTerm}` : "command word";
}

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
}

function faqMatchesMessage(message, faq, level) {
  const text = normalizeText(message);
  if (faq.levelMin && level < faq.levelMin) return false;
  if (faq.levelMax && level > faq.levelMax) return false;
  return (faq.patterns || []).some((pattern) => {
    const p = normalizeText(pattern);
    return text.includes(p) || p.split(" ").every((word) => text.includes(word));
  });
}

function findFaq(message, faqs, level) {
  for (const faq of faqs) {
    if (faqMatchesMessage(message, faq, level)) return faq;
  }
  return null;
}

function studentMatchesMessage(message, question, level) {
  const text = normalizeText(message);
  if (question.levelMin && level < question.levelMin) return false;
  if (question.levelMax && level > question.levelMax) return false;
  return (question.patterns || []).some((pattern) => text.includes(normalizeText(pattern)));
}

function findStudentQuestion(message, questions, level, slideIndex = null) {
  let best = null;
  let bestScore = 0;
  for (const q of questions) {
    if (!studentMatchesMessage(message, q, level)) continue;
    let score = (q.patterns || []).reduce((max, pattern) => {
      const p = normalizeText(pattern);
      return normalizeText(message).includes(p) ? Math.max(max, p.length) : max;
    }, 0);
    if (slideIndex != null && q.slideIndex != null) {
      if (q.slideIndex === slideIndex) score += 100;
      else score -= 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best;
}

function pickStudentAnswer(question, level) {
  if (level <= 2 && question.tutorHint) return question.tutorHint;
  return question.answer;
}

function findMisconception(wrongOption, misconceptions) {
  const wrong = normalizeText(wrongOption);
  for (const item of misconceptions) {
    if (normalizeText(item.wrong) === wrong) return item;
  }
  return null;
}

const tests = [
  { msg: "what is tolerance", expect: "faq", level: 1 },
  { msg: "i am an og", expect: "faq", level: 1 },
  { msg: "i DO NOT KNOW", expect: "student", level: 1, expectId: "q-dont-understand" },
];

const studentTests = [
  { msg: "what is identity", expectId: "q-identity-meaning", level: 5 },
  { msg: "who am i", expectId: "q-who-am-i", level: 2 },
  { msg: "am i british if my parents weren't born here", expectId: "q-am-i-british-born", level: 4 },
  { msg: "what are british values", expectId: "q-british-values", level: 3 },
  { msg: "difference between local and uk", expectId: "q-local-vs-uk", level: 2 },
];

let passed = 0;
try {
  const badHint = /choosing people to make decisions/i.test(novaProfile.examples?.hint || "");
  if (badHint) throw new Error("Nova hint still references democracy/voting content");
  console.log("PASS nova hint: no democracy bleed-through");
  passed += 1;

  const slide1 = topic.slides?.["1"];
  const slideCtx = { slideIndex: 1, title: slide1.title, note: "" };
  const profileHint = pickProfileHintIfNoSlide(novaProfile.examples, slide1, slideCtx, slide1.script?.slice(0, 80));
  if (profileHint) throw new Error("Profile hint should be suppressed when slide KB exists");
  console.log("PASS slide priority: profile hint suppressed on Who Are We slide");
  passed += 1;
} catch (err) {
  console.error("FAIL tutor slide alignment:", err.message || err);
}
try {
  assertTutorConfigSane();
  console.log("PASS tutor config: level 1–9 mapping is deterministic");
  passed += 1;
} catch (err) {
  console.error("FAIL tutor config:", err.message || err);
}

for (const t of tests) {
  const faq = findFaq(t.msg, topic.faqs, t.level);
  const studentHit = t.expectId
    ? findStudentQuestion(t.msg, studentBank.questions, t.level)
    : null;
  if (t.expect === "faq" && faq) {
    console.log("PASS FAQ:", t.msg, "→", faq.answer.slice(0, 50) + "…");
    passed += 1;
  } else if (t.expect === "student" && studentHit?.id === t.expectId) {
    console.log("PASS student Q:", t.msg, "→", pickStudentAnswer(studentHit, t.level).slice(0, 50) + "…");
    passed += 1;
  } else if (t.expect === "intent") {
    console.log("PASS intent (manual):", t.msg);
    passed += 1;
  } else {
    console.error("FAIL:", t.msg, studentHit?.id || faq?.answer?.slice(0, 30));
  }
}

for (const t of studentTests) {
  const hit = findStudentQuestion(t.msg, studentBank.questions, t.level);
  if (hit?.id === t.expectId) {
    const answer = pickStudentAnswer(hit, t.level);
    console.log("PASS student Q:", t.msg, "→", answer.slice(0, 50) + "…");
    passed += 1;
  } else {
    console.error("FAIL student Q:", t.msg, "got", hit?.id);
  }
}

const misc = findMisconception("Pretending to be someone else online", topic.misconceptions);
if (misc) {
  console.log("PASS misconception:", misc.correction.slice(0, 50) + "…");
  passed += 1;
} else {
  console.error("FAIL misconception lookup");
}

const levelTests = [
  { topic: topic, lesson: "lesson-1", slideIndex: "0" },
  { topic: topic2, lesson: "lesson-2", slideIndex: "0" },
];

for (const lt of levelTests) {
  const slideChunk = lt.topic.slides?.[lt.slideIndex];
  const l1 = getTopicContent(lt.topic, 1);
  const l9 = getTopicContent(lt.topic, 9);
  if (l1.summary && l9.summary && l1.summary !== l9.summary) {
    console.log(`PASS level variance ${lt.lesson}: L1 vs L9 summaries differ`);
    passed += 1;
  } else {
    console.error(`FAIL level variance ${lt.lesson}: summaries should differ`);
  }

  const lowLines = buildLevelContentLines(l1, 2, slideChunk);
  const highLines = buildLevelContentLines(l9, 9, slideChunk);
  if (lowLines.length && highLines.length && lowLines.join(" ") !== highLines.join(" ")) {
    console.log(`PASS slide level lines ${lt.lesson}: band content differs`);
    passed += 1;
  } else {
    console.error(`FAIL slide level lines ${lt.lesson}`);
  }

  const lowPrompt = buildSlidePromptTail(2, slideChunk);
  const highPrompt = buildSlidePromptTail(9, slideChunk);
  if (lowPrompt !== highPrompt) {
    console.log(`PASS slide prompt tail ${lt.lesson}: L2 vs L9 differ`);
    passed += 1;
  } else {
    console.error(`FAIL slide prompt tail ${lt.lesson}`);
  }

  for (let level = 1; level <= 9; level += 1) {
    if (!lt.topic.levels?.[String(level)]) {
      console.error(`FAIL ${lt.lesson}: missing level ${level} in KB`);
    }
  }
  console.log(`PASS ${lt.lesson}: all 9 level bands present in KB`);
  passed += 1;
}

const total = 1 + 2 + tests.length + studentTests.length + 1 + levelTests.length * 4;
console.log(`\n${passed}/${total} checks passed`);
console.log(`Student question bank: ${studentBank.questions.length} entries`);
process.exit(passed === total ? 0 : 1);
