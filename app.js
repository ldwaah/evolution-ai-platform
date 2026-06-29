/* ============================================================
   EVOlearn — interactive learning map
   ============================================================ */

const MODULE_WORLD = { width: 1200, height: 720 };

const COURSES = {
  citizenship: {
    title: "Citizenship",
    modules: [
      {
        id: "module-1",
        title: "Living Together in the UK",
        lessons: [
          { id: "lesson-1", title: "Who Are We? Identity and the Changing Face of the UK",
            desc: "Explore what shapes British identity today and how the UK's population has changed.",
            x: 180, y: 560 },
          { id: "lesson-2", title: "Rights and Responsibilities: The Rules of the Game",
            desc: "Your legal rights, the Equality Act 2010, the Rule of Law, and the responsibilities that come with being a citizen.",
            x: 400, y: 400 },
          { id: "lesson-3", title: "Our Freedoms: Where Do Our Human Rights Come From?",
            desc: "Trace the origins of the rights and freedoms we often take for granted.",
            x: 600, y: 520 },
          { id: "lesson-4", title: "Community Cohesion: Living Together and Tackling Prejudice",
            desc: "How a diverse UK lives together — mutual respect, shared values, and challenging prejudice and extremism in our communities.",
            x: 780, y: 320 },
          { id: "lesson-5", title: "My Local Patch: How Councils Work and Spend Your Money",
            desc: "Discover how local councils make decisions and where your council tax goes.",
            x: 950, y: 180 },
        ],
      },
      {
        id: "module-2",
        title: "Democracy at Work in the UK",
        lessons: [
          { id: "lesson-6", title: "Power to the People: How Elections and Voting Actually Work",
            desc: "How elections are run, who can vote, and why your ballot matters.",
            x: 1220, y: 560 },
          { id: "lesson-7", title: "Who Runs the Country? Political Parties and Forming a Government",
            desc: "Follow the path from election night to the Prime Minister in Downing Street.",
            x: 1440, y: 400 },
          { id: "lesson-8", title: "Inside Parliament: How an Idea Becomes a Law",
            desc: "See how bills are debated, amended, and passed into law.",
            x: 1640, y: 520 },
          { id: "lesson-9", title: "The Rules of the Game: The UK Constitution and the King",
            desc: "Understand the unwritten constitution and the monarch's role today.",
            x: 1820, y: 320 },
          { id: "lesson-10", title: "Sharing the Power: How Scotland, Wales, and NI Run Their Own Shows",
            desc: "Devolution and how power is shared across the UK nations.",
            x: 1990, y: 180 },
          { id: "lesson-11", title: "The Nation's Wallet: How the Government Collects Taxes and Spends Cash",
            desc: "Where tax money comes from and how the government decides what to fund.",
            x: 2160, y: 450 },
        ],
      },
      {
        id: "module-3",
        title: "Law and Justice",
        lessons: [
          { id: "lesson-12", title: "Why Do We Have Rules? The Purpose of Law and Your Legal Age Limits",
            desc: "Why societies need laws and what changes when you reach key ages.",
            x: 2260, y: 560 },
          { id: "lesson-13", title: "Fairness for All: The Rule of Law and Innocence Until Proven Guilty",
            desc: "Core principles that keep the justice system fair for everyone.",
            x: 2480, y: 400 },
          { id: "lesson-14", title: "Street Justice to Courtrooms: The Police, Magistrates, and Judges",
            desc: "Who enforces the law and how cases move through the courts.",
            x: 2680, y: 520 },
          { id: "lesson-15", title: "Battles and Bashes: The Big Difference Between Civil and Criminal Law",
            desc: "Two branches of law, and when each one applies.",
            x: 2860, y: 320 },
          { id: "lesson-16", title: "Made a Mistake? How the Youth Justice System Works",
            desc: "How young offenders are treated differently and why.",
            x: 3030, y: 180 },
          { id: "lesson-17", title: "Behind Bars and Giving Back: The Aims and Types of Punishment",
            desc: "Why we punish, what options exist, and what rehabilitation means.",
            x: 3200, y: 450 },
        ],
      },
      {
        id: "module-4",
        title: "Power and Influence",
        lessons: [
          { id: "lesson-18", title: "Making Your Voice Heard: Petitions, Boycotts, and Social Media Power",
            desc: "Everyday ways citizens push for change, online and on the ground.",
            x: 3340, y: 560 },
          { id: "lesson-19", title: "Power in Numbers: Joining Pressure Groups and Trade Unions",
            desc: "How organised groups amplify individual voices.",
            x: 3560, y: 400 },
          { id: "lesson-20", title: "The Fake News Test: The Free Press and the Power of the Media",
            desc: "Media freedom, bias, and how to spot misinformation.",
            x: 3760, y: 520 },
          { id: "lesson-21", title: "The Global Stage: The UN, NATO, and the Commonwealth",
            desc: "International organisations the UK belongs to and why they matter.",
            x: 3940, y: 320 },
          { id: "lesson-22", title: "The Council of Europe: Protecting Rights Separate from the EU",
            desc: "How the UK protects human rights through European cooperation.",
            x: 4110, y: 180 },
          { id: "lesson-23", title: "Global Conflict: How the UK Handles Wars, Sanctions, and Disasters",
            desc: "Foreign policy tools from diplomacy to humanitarian aid.",
            x: 4280, y: 450 },
        ],
      },
      {
        id: "module-5",
        title: "Taking Citizenship Action",
        lessons: [
          { id: "lesson-24", title: "Finding the Fight: Picking an Issue and Researching the Facts",
            desc: "Choose a cause you care about and build a solid evidence base.",
            x: 4380, y: 560 },
          { id: "lesson-25", title: "Building the Game Plan: Campaigning, Teamwork, and Setting Goals",
            desc: "Plan a campaign with clear aims, roles, and timelines.",
            x: 4600, y: 400 },
          { id: "lesson-26", title: "Making Noise: Running Your Social Action Project",
            desc: "Put your plan into action and reach the people who matter.",
            x: 4820, y: 520 },
          { id: "lesson-27", title: "Did it Work? Reviewing Your Impact and What You Learned",
            desc: "Measure success, reflect on challenges, and celebrate what changed.",
            x: 5040, y: 320 },
        ],
      },
    ],
  },
};

const ACTIVE_COURSE = "citizenship";
/** Lessons that have real, playable pages. Anything not listed shows as
 *  "coming soon". Listed lessons unlock sequentially: each one opens once the
 *  previous lesson in its module has been marked complete. */
const LESSONS_WITH_PAGES = new Set([
  "citizenship.module-1.lesson-1",
  "citizenship.module-1.lesson-2",
]);

// ============================================================
//  Progress (localStorage)
// ============================================================
const STORE_KEY = "evolearn-progress";

function loadProgress() {
  try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY)) || []); }
  catch { return new Set(); }
}
function lessonKey(courseId, moduleId, lessonId) {
  return `${courseId}.${moduleId}.${lessonId}`;
}

let completed = loadProgress();
let activeModuleIndex = 0;

function getModule(moduleIndex) {
  return COURSES[ACTIVE_COURSE].modules[moduleIndex];
}

function getModuleLessons(moduleIndex) {
  const mod = getModule(moduleIndex);
  return mod.lessons.map((lesson, i) => ({
    ...lesson,
    moduleId: mod.id,
    moduleTitle: mod.title,
    moduleIndex,
    lessonIndex: i,
    globalNumber: globalLessonNumber(moduleIndex, i),
  }));
}

function globalLessonNumber(moduleIndex, lessonIndex) {
  let n = 0;
  for (let m = 0; m < moduleIndex; m++) {
    n += COURSES[ACTIVE_COURSE].modules[m].lessons.length;
  }
  return n + lessonIndex + 1;
}

function normalizeModulePositions(lessons) {
  const xs = lessons.map((l) => l.x);
  const ys = lessons.map((l) => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = 140;
  const padY = 100;
  const w = MODULE_WORLD.width - padX * 2;
  const h = MODULE_WORLD.height - padY * 2;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  return lessons.map((lesson) => ({
    ...lesson,
    nx: padX + ((lesson.x - minX) / rangeX) * w,
    ny: padY + ((lesson.y - minY) / rangeY) * h,
  }));
}

function lessonHasPage(moduleId, lessonId) {
  return LESSONS_WITH_PAGES.has(lessonKey(ACTIVE_COURSE, moduleId, lessonId));
}

function hasCompletedAssessment() {
  try {
    return Boolean(window.EvoStudentProfile?.hasCompletedAssessment?.());
  } catch {
    return false;
  }
}

function isAssessmentLocked() {
  return !hasCompletedAssessment();
}

function isLessonComingSoon(moduleIndex, lessonIndex) {
  const mod = getModule(moduleIndex);
  const lesson = mod.lessons[lessonIndex];
  return !lessonHasPage(mod.id, lesson.id);
}

// A lesson is playable once it has a page AND the previous lesson in its
// module is complete. The first lesson of a module has no prerequisite.
function isLessonPlayable(moduleIndex, lessonIndex) {
  if (isLessonComingSoon(moduleIndex, lessonIndex)) return false;
  if (lessonIndex <= 0) return true;
  const mod = getModule(moduleIndex);
  const prev = mod.lessons[lessonIndex - 1];
  return completed.has(lessonKey(ACTIVE_COURSE, mod.id, prev.id));
}

function moduleProgress(moduleIndex) {
  const lessons = getModuleLessons(moduleIndex);
  const done = lessons.filter((l) =>
    completed.has(lessonKey(ACTIVE_COURSE, l.moduleId, l.id))
  ).length;
  return { done, total: lessons.length };
}

// ============================================================
//  Particles (depth + light trails)
// ============================================================
const pcanvas = document.getElementById("particles");
const pctx = pcanvas.getContext("2d");
let dots = [], trails = [];

function sizeCanvas() {
  pcanvas.width = innerWidth * devicePixelRatio;
  pcanvas.height = innerHeight * devicePixelRatio;
  pctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
function initParticles() {
  sizeCanvas();
  dots = Array.from({ length: 70 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    z: Math.random() * 0.8 + 0.2,
    r: Math.random() * 1.6 + 0.4,
    tw: Math.random() * Math.PI * 2,
  }));
  trails = Array.from({ length: 5 }, () => spawnTrail());
}
function spawnTrail() {
  return {
    x: Math.random() * innerWidth, y: innerHeight + 40,
    vx: (Math.random() - 0.5) * 0.3, vy: -(Math.random() * 0.5 + 0.25),
    life: 0, max: 200 + Math.random() * 200,
  };
}
function drawParticles() {
  pctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const d of dots) {
    d.y -= d.z * 0.25; d.tw += 0.02;
    if (d.y < -5) { d.y = innerHeight + 5; d.x = Math.random() * innerWidth; }
    const a = (0.25 + Math.sin(d.tw) * 0.2) * d.z;
    pctx.beginPath();
    pctx.arc(d.x, d.y, d.r * d.z + 0.4, 0, Math.PI * 2);
    pctx.fillStyle = `rgba(120,210,255,${a})`;
    pctx.fill();
  }
  for (let i = 0; i < trails.length; i++) {
    const t = trails[i]; t.x += t.vx; t.y += t.vy; t.life++;
    const p = t.life / t.max, fade = Math.sin(p * Math.PI);
    const grad = pctx.createLinearGradient(t.x, t.y, t.x - t.vx * 30, t.y - t.vy * 30);
    grad.addColorStop(0, `rgba(150,220,255,${0.5 * fade})`);
    grad.addColorStop(1, "rgba(150,220,255,0)");
    pctx.strokeStyle = grad; pctx.lineWidth = 1.4; pctx.lineCap = "round";
    pctx.beginPath(); pctx.moveTo(t.x, t.y);
    pctx.lineTo(t.x - t.vx * 30, t.y - t.vy * 30); pctx.stroke();
    if (t.life > t.max) trails[i] = spawnTrail();
  }
  requestAnimationFrame(drawParticles);
}
addEventListener("resize", sizeCanvas);

addEventListener("pointermove", (e) => {
  document.body.style.setProperty("--mx", (e.clientX / innerWidth) * 100 + "%");
  document.body.style.setProperty("--my", (e.clientY / innerHeight) * 100 + "%");
});

// ============================================================
//  Screen navigation
// ============================================================
const selectScreen = document.getElementById("select-screen");
const dashboardScreen = document.getElementById("citizenship-dashboard");
const modulePickerScreen = document.getElementById("module-picker");
const mapScreen = document.getElementById("map-screen");
const profileScreen = document.getElementById("profile-screen");
const profileFab = document.getElementById("profile-fab");

// ============================================================
//  Dashboard greeting (personalised)
// ============================================================
function normalizeGreetingName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  // Keep it conservative (British English UI), avoid odd control chars.
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} .'\-]/gu, "")
    .trim();
  // Prefer first name for a friendly greeting.
  return cleaned.split(" ")[0] || "";
}

function getStudentGreetingName() {
  try {
    // Prefer the auth display name/username for demo logins (e.g. Stacey).
    const auth = window.EvoStudentAuth;
    const isSignedIn = Boolean(auth?.isSignedIn?.());
    const displayName = auth?.getDisplayName?.();
    if (!isSignedIn) return "";
    const name = normalizeGreetingName(displayName);
    return name;
  } catch {
    return "";
  }
}

function refreshDashboardGreeting() {
  const el = document.getElementById("dashboard-greeting");
  if (!el) return;
  const name = getStudentGreetingName();
  el.textContent = name ? `Hi ${name}` : "Hi there";
}

function showScreen(screen) {
  selectScreen.hidden = screen !== selectScreen;
  dashboardScreen.hidden = screen !== dashboardScreen;
  modulePickerScreen.hidden = screen !== modulePickerScreen;
  mapScreen.hidden = screen !== mapScreen;
  profileScreen.hidden = screen !== profileScreen;
  // hide the bottom profile button while viewing the profile itself
  if (profileFab) profileFab.classList.toggle("is-hidden", screen === profileScreen);
}

function setMapHash(moduleIndex) {
  const mod = getModule(moduleIndex);
  history.replaceState(null, "", `#map/${mod.id}`);
}

function clearMapHash() {
  if (location.hash.startsWith("#map")) {
    history.replaceState(null, "", location.pathname + location.search);
  }
}

function parseMapHash() {
  const hash = location.hash.slice(1);
  if (hash === "map") return { type: "picker" };
  const match = hash.match(/^map\/(module-\d+)$/);
  if (!match) return null;
  const moduleIndex = COURSES[ACTIVE_COURSE].modules.findIndex((m) => m.id === match[1]);
  if (moduleIndex < 0) return null;
  return { type: "map", moduleIndex };
}

function goToDashboard({ scrollToRevision = false } = {}) {
  selectScreen.classList.add("leaving");
  setTimeout(() => {
    selectScreen.classList.remove("leaving");
    clearMapHash();
    completed = loadProgress();
    showScreen(dashboardScreen);
    refreshDashboardGreeting();
    buildDashboardRevisionSection();
    refreshAgentUI();
    if (scrollToRevision) {
      requestAnimationFrame(() => {
        document.getElementById("revision")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, 500);
}

function buildModulePicker() {
  const grid = document.getElementById("module-picker-grid");
  grid.innerHTML = "";
  COURSES[ACTIVE_COURSE].modules.forEach((mod, i) => {
    const { done, total } = moduleProgress(i);
    const btn = document.createElement("button");
    btn.className = "module-picker-card";
    btn.type = "button";
    btn.dataset.module = String(i);
    btn.innerHTML = `
      <span class="module-picker-eyebrow">Module ${i + 1}</span>
      <span class="module-picker-name">${mod.title}</span>
      <span class="module-picker-progress">${done} / ${total} complete</span>`;
    btn.addEventListener("click", () => goToModuleMap(i));
    grid.appendChild(btn);
  });
}

function goToModulePicker() {
  completed = loadProgress();
  clearMapHash();
  resetMapState();
  buildModulePicker();
  showScreen(modulePickerScreen);
}

function goToModuleMap(moduleIndex) {
  activeModuleIndex = moduleIndex;
  completed = loadProgress();
  showScreen(mapScreen);
  buildMap(moduleIndex);
  setMapHash(moduleIndex);
  refreshAgentUI();
  requestAnimationFrame(() => {
    const lessons = getModuleLessons(moduleIndex);
    const next = lessons.findIndex((_, i) => lessonState(moduleIndex, i) === "current");
    const idx = next === -1 ? 0 : next;
    selectLesson(moduleIndex, idx, true);  // show preview card first
    requestAnimationFrame(() => {           // then measure + fit around it
      fitWorld();
      panX = 0;
      panY = 0;
      applyWorld(true);
    });
  });
}

function resetMapState() {
  document.getElementById("preview").hidden = true;
  document.getElementById("nova-panel").hidden = true;
  document.getElementById("pan-hint").classList.remove("hide");
  selectedLessonIndex = null;
  panX = 0;
  panY = 0;
  if (typeof applyWorld === "function") applyWorld();
}

function goToHome() {
  selectScreen.classList.remove("leaving");
  resetMapState();
  clearMapHash();
  showScreen(selectScreen);
}

document.querySelectorAll(".home-logo").forEach((logo) => {
  const go = (e) => {
    e.preventDefault();
    goToHome();
  };
  logo.addEventListener("click", go);
  logo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToHome();
    }
  });
});

document.querySelectorAll(".course-card[data-course]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.course === "citizenship") goToDashboard();
  });
});

document.getElementById("dashboard-back").addEventListener("click", goToHome);
document.getElementById("module-picker-back").addEventListener("click", () => {
  clearMapHash();
  completed = loadProgress();
  showScreen(dashboardScreen);
  buildDashboardRevisionSection();
});
document.getElementById("map-back").addEventListener("click", goToModulePicker);

document.querySelectorAll(".dashboard-card[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    if (action === "tutors") {
      location.href = "tutors/citizenship.html";
    } else if (action === "assessment") {
      location.href = "assessment/citizenship.html";
    } else if (action === "lessons") {
      goToModulePicker();
    }
  });
});

// ============================================================
//  Build the map (per module)
// ============================================================
const nodesEl = document.getElementById("nodes");
const pathBase = document.getElementById("path-base");
const pathProgress = document.getElementById("path-progress");
const modulePillEl = document.getElementById("module-pill");
let selectedLessonIndex = null;

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function lessonState(moduleIndex, lessonIndex) {
  if (isAssessmentLocked()) return "locked";
  if (!isLessonPlayable(moduleIndex, lessonIndex)) return "locked";
  const mod = getModule(moduleIndex);
  const lesson = mod.lessons[lessonIndex];
  const key = lessonKey(ACTIVE_COURSE, mod.id, lesson.id);
  if (completed.has(key)) return "complete";
  return "current";
}

function getLessonBlockReason(moduleIndex, lessonIndex) {
  if (isAssessmentLocked()) return "assessment";
  if (isLessonComingSoon(moduleIndex, lessonIndex)) return "coming-soon";
  if (lessonState(moduleIndex, lessonIndex) === "locked") return "sequence";
  return null;
}

function shortLabel(title) {
  const colon = title.indexOf(":");
  return colon > 0 ? title.slice(0, colon) : title;
}

// When the student arrives from completing a lesson, pulse the node that was
// just unlocked (flag set by the lesson page before redirecting here).
function highlightJustUnlocked(moduleIndex) {
  let key = null;
  try { key = sessionStorage.getItem("evolearn-unlocked"); } catch {}
  if (!key) return;
  try { sessionStorage.removeItem("evolearn-unlocked"); } catch {}
  const lessons = getModuleLessons(moduleIndex);
  const idx = lessons.findIndex(
    (l) => lessonKey(ACTIVE_COURSE, l.moduleId, l.id) === key
  );
  const node = idx >= 0 ? nodesEl.children[idx] : null;
  if (!node) return;
  node.classList.add("just-unlocked");
  setTimeout(() => node.classList.remove("just-unlocked"), 2400);
}

function buildMap(moduleIndex) {
  const mod = getModule(moduleIndex);
  const lessons = normalizeModulePositions(getModuleLessons(moduleIndex));

  modulePillEl.textContent = `Module ${moduleIndex + 1} · ${mod.title}`;

  const pts = lessons.map((l) => ({ x: l.nx, y: l.ny }));
  const d = smoothPath(pts);
  pathBase.setAttribute("d", d);
  pathProgress.setAttribute("d", d);

  nodesEl.innerHTML = "";
  lessons.forEach((lesson, i) => {
    const state = lessonState(moduleIndex, i);
    const node = document.createElement("button");
    node.className = "node is-" + state;
    node.style.left = (lesson.nx / MODULE_WORLD.width) * 100 + "%";
    node.style.top = (lesson.ny / MODULE_WORLD.height) * 100 + "%";
    node.innerHTML = `
      <span class="node-ring"></span>
      <span class="node-num-badge">${lesson.globalNumber}</span>
      <span class="node-core">${lesson.globalNumber}</span>
      <span class="node-lock" aria-hidden="true"></span>
      <span class="node-tick" aria-hidden="true"></span>
      <span class="node-label">${shortLabel(lesson.title)}</span>`;
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      selectLesson(moduleIndex, i);
    });
    nodesEl.appendChild(node);
  });

  updateProgressUI(moduleIndex);
  highlightJustUnlocked(moduleIndex);
}

function getCompletedRevisionLessons(moduleIndex = null) {
  const result = [];
  const modules = COURSES[ACTIVE_COURSE].modules;
  const indices = moduleIndex != null
    ? [moduleIndex]
    : modules.map((_, i) => i);

  indices.forEach((mi) => {
    const lessons = getModuleLessons(mi);
    lessons.forEach((lesson, i) => {
      if (lessonState(mi, i) !== "complete") return;
      if (!lessonHasPage(lesson.moduleId, lesson.id)) return;
      result.push(lesson);
    });
  });
  return result;
}

function populateRevisionList(list, empty, completedLessons) {
  if (!list) return;
  list.innerHTML = "";
  if (empty) empty.hidden = completedLessons.length > 0;

  completedLessons.forEach((lesson) => {
    const item = document.createElement("li");
    item.className = "dashboard-revision-item";
    item.id = `dashboard-revision-item-${lesson.id}`;
    item.innerHTML = `
      <div class="dashboard-revision-item-copy">
        <span class="dashboard-revision-item-eyebrow">Lesson ${lesson.globalNumber}</span>
        <span class="dashboard-revision-item-title">${lesson.title}</span>
      </div>
      <a class="dashboard-revision-open" id="dashboard-revision-open-${lesson.id}" href="${lessonPageUrl(lesson, { revision: true })}">Open revision</a>`;
    list.appendChild(item);
  });
}

function buildDashboardRevisionSection() {
  const section = document.getElementById("revision");
  const list = document.getElementById("dashboard-revision-list");
  const empty = document.getElementById("dashboard-revision-empty");
  if (!section || !list) return;

  const completedLessons = getCompletedRevisionLessons();
  populateRevisionList(list, empty, completedLessons);
}

function updateProgressUI(moduleIndex) {
  const lessons = getModuleLessons(moduleIndex);
  const done = lessons.filter((_, i) => lessonState(moduleIndex, i) === "complete").length;
  const total = lessons.length;
  document.getElementById("progress-label").textContent = `${done} / ${total} complete`;
  document.getElementById("progress-fill").style.width = (done / total) * 100 + "%";
  const denom = Math.max(total - 1, 1);
  pathProgress.style.strokeDashoffset = 100 - (done / denom) * 100;
}

// ============================================================
//  Selection + preview card
// ============================================================
const preview = document.getElementById("preview");
const previewCta = document.getElementById("preview-cta");

function lessonPageUrl(lesson, { revision = false } = {}) {
  const base = `lessons/${ACTIVE_COURSE}/${lesson.moduleId}/${lesson.id}.html`;
  return revision ? `${base}?revision=1` : base;
}

function selectLesson(moduleIndex, lessonIndex, silent = false) {
  const lessons = getModuleLessons(moduleIndex);
  const lesson = lessons[lessonIndex];
  const state = lessonState(moduleIndex, lessonIndex);
  const blockReason = getLessonBlockReason(moduleIndex, lessonIndex);

  [...nodesEl.children].forEach((n, idx) => n.classList.toggle("is-selected", idx === lessonIndex));
  selectedLessonIndex = lessonIndex;

  if (!silent) {
    if (blockReason === "assessment") {
      showToast("Complete the placement assessment first to unlock lessons.");
    } else if (blockReason === "coming-soon") {
      showToast("This lesson is coming soon.");
    } else if (blockReason === "sequence") {
      showToast("Complete the previous lesson in this module to unlock this one.");
    }
  }

  preview.hidden = false;
  document.getElementById("preview-eyebrow").textContent =
    `Module ${moduleIndex + 1} · Lesson ${lesson.globalNumber}`;
  document.getElementById("preview-title").textContent = lesson.title;
  document.getElementById("preview-desc").textContent = lesson.desc;
  const statusEl = document.getElementById("preview-status");
  statusEl.textContent = "";
  previewCta.hidden = false;

  if (blockReason === "assessment") {
    statusEl.textContent = "Assessment";
    statusEl.className = "preview-status is-locked";
    previewCta.textContent = "Take assessment";
    previewCta.classList.add("locked");
    previewCta.onclick = () => {
      location.href = "assessment/citizenship.html?required=1";
    };
  } else if (blockReason === "coming-soon") {
    statusEl.textContent = "Soon";
    statusEl.className = "preview-status is-coming-soon";
    previewCta.textContent = "Coming soon";
    previewCta.classList.add("locked");
    previewCta.onclick = () => showToast("This lesson is coming soon.");
  } else if (blockReason === "sequence") {
    statusEl.className = "preview-status is-locked";
    previewCta.textContent = "Locked";
    previewCta.classList.add("locked");
    previewCta.onclick = () => showToast("Complete the previous lesson in this module to unlock this one.");
  } else if (state === "complete") {
    statusEl.className = "preview-status is-complete";
    previewCta.textContent = "Revisit lesson";
    previewCta.classList.remove("locked");
    previewCta.onclick = () => {
      location.href = lessonPageUrl(lesson);
    };
  } else {
    statusEl.className = "preview-status is-" + state;
    previewCta.textContent = "Begin lesson";
    previewCta.classList.remove("locked");
    previewCta.onclick = () => {
      location.href = lessonPageUrl(lesson);
    };
  }

  if (!mapScreen.hidden) {
    requestAnimationFrame(() => {
      fitWorld();
      applyWorld(true);
    });
  }
}

// ============================================================
//  Toast
// ============================================================
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 300);
  }, 2600);
}

// ============================================================
//  Pan the world (drag)
// ============================================================
const stage = document.getElementById("stage");
const world = document.getElementById("world");
const panHint = document.getElementById("pan-hint");
let panX = 0, panY = 0, dragging = false, sx = 0, sy = 0, fitOffsetY = 0;

// Scale the whole map to fit inside the stage so it never crops —
// the largest box of the world's aspect ratio that fits the space,
// reserving room for the floating preview card so it doesn't cover nodes.
const WORLD_ASPECT = MODULE_WORLD.width / MODULE_WORLD.height;

function mapNodeMetrics() {
  const compact = window.matchMedia("(max-width: 760px)").matches;
  const nodeSize = compact ? 68 : 84;
  const labelTop = compact ? 74 : 96;
  const labelFont = compact ? 11 : 13;
  const labelLines = compact ? 3 : 2;
  const belowCenter =
    (labelTop - nodeSize / 2) + labelFont * 1.35 * labelLines + 10;
  return { nodeSize, belowCenter };
}

function getWorldLabelReserve(worldH) {
  const lessons = getModuleLessons(activeModuleIndex);
  if (!lessons.length || !worldH) return worldH * 0.08;
  const { belowCenter } = mapNodeMetrics();
  let maxBottomNorm = 0;
  for (const lesson of lessons) {
    const centerNorm = lesson.y / MODULE_WORLD.height;
    maxBottomNorm = Math.max(
      maxBottomNorm,
      centerNorm + belowCenter / MODULE_WORLD.height
    );
  }
  const overflowNorm = Math.max(0, maxBottomNorm - 1);
  return overflowNorm * worldH + worldH * 0.06 + 16;
}

function fitWorld() {
  const padX = 28, padTop = 20, padBottom = 20;
  const sw = stage.clientWidth, sh = stage.clientHeight;
  if (!sw || !sh) return;

  // Bottom preview panel sits below the stage in normal flow — flex already shrinks
  // the stage. Reserve extra space so node labels are not clipped.
  let reserve = 0;
  const prev = document.getElementById("preview");
  const stageRect = stage.getBoundingClientRect();

  if (prev && !prev.hidden) {
    const prevRect = prev.getBoundingClientRect();
    // Fixed/stacked panels that overlap upward into the stage (e.g. small viewports)
    if (prevRect.top < stageRect.bottom) {
      reserve = Math.max(reserve, stageRect.bottom - prevRect.top + 12);
    }
  }

  const availH = sh - padTop - padBottom - reserve;
  const labelPad = Math.min(availH * 0.14, 80);
  const availHForWorld = Math.max(120, availH - labelPad);
  let w = Math.min(sw - padX * 2, availHForWorld * WORLD_ASPECT, 1200);
  w = Math.max(w, 220);
  const worldH = w / WORLD_ASPECT;
  const labelReserve = getWorldLabelReserve(worldH);

  world.style.width = w + "px";
  world.style.height = worldH + "px";
  // Nudge the map up so labels and bottom panels stay clear
  fitOffsetY = -(reserve + labelReserve) / 2;
}

function getPanLimits() {
  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  const worldW = world.offsetWidth;
  const worldH = world.offsetHeight;
  return {
    maxX: Math.max(0, (worldW - stageW) / 2),
    maxY: Math.max(0, (worldH - stageH) / 2),
  };
}

function clampPan() {
  const { maxX, maxY } = getPanLimits();
  panX = Math.max(-maxX, Math.min(maxX, panX));
  panY = Math.max(-maxY, Math.min(maxY, panY));
}

function applyWorld(animate = false) {
  world.style.transition = animate ? "transform .55s var(--ease)" : dragging ? "none" : "transform .4s var(--ease)";
  world.style.transform = `translate(-50%,-50%) translate(${panX}px, ${panY + fitOffsetY}px)`;
}

stage.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".node")) return;
  dragging = true;
  sx = e.clientX - panX;
  sy = e.clientY - panY;
  world.style.transition = "none";
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  panX = e.clientX - sx;
  panY = e.clientY - sy;
  clampPan();
  if (Math.abs(panX) + Math.abs(panY) > 4) panHint.classList.add("hide");
  applyWorld();
});
stage.addEventListener("pointerup", () => {
  dragging = false;
  applyWorld();
});

addEventListener("resize", () => {
  if (!mapScreen.hidden) {
    fitWorld();
    clampPan();
    applyWorld();
  }
});

function observeMapLayout() {
  if (typeof ResizeObserver === "undefined" || !stage) return;
  const refit = () => {
    if (mapScreen.hidden) return;
    fitWorld();
    clampPan();
    applyWorld();
  };
  const ro = new ResizeObserver(refit);
  ro.observe(stage);
  const prev = document.getElementById("preview");
  if (prev) ro.observe(prev);
}
observeMapLayout();

// ============================================================
//  Assigned tutor branding
// ============================================================
function refreshAgentUI() {
  if (!window.EvoStudentProfile) return;
  EvoStudentProfile.initAppShell().catch(() => {});
}

// ============================================================
//  Ask tutor
// ============================================================
const novaBtn = document.getElementById("nova-btn");
const novaPanel = document.getElementById("nova-panel");
novaBtn.addEventListener("click", () => {
  novaPanel.hidden = !novaPanel.hidden;
});
document.getElementById("nova-close").addEventListener("click", () => (novaPanel.hidden = true));

// ============================================================
//  Profile + learning stats
// ============================================================
const STATS_KEY = "evolearn-stats";

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch { return {}; }
}
function saveStats(s) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
    window.EvoStudentSync?.notifyChange?.("stats");
  } catch {}
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

// Update the day streak once per load.
function touchStreak() {
  const s = loadStats();
  const today = todayStr();
  if (s.lastActive !== today) {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.streak = s.lastActive === yesterday ? (s.streak || 0) + 1 : 1;
    s.lastActive = today;
    s.best = Math.max(s.best || 0, s.streak);
  }
  if (!s.streak) s.streak = 1;
  saveStats(s);
  return s;
}

function getProfileBits() {
  let agent = null, profile = null;
  try { agent = window.EvoStudentProfile?.getAssignedAgent?.(); } catch {}
  try { profile = window.EvoStudentProfile?.loadStudentProfile?.(); } catch {}
  return { agent, profile };
}

function refreshFabAvatar() {
  const img = document.getElementById("profile-fab-img");
  const { agent, profile } = getProfileBits();
  if (profile && agent?.image) { img.style.backgroundImage = `url(${agent.image})`; img.textContent = ""; }
  else { img.style.backgroundImage = ""; img.textContent = "👤"; }
}

let profileReturnScreen = selectScreen;

function scoreRow(label, val, max) {
  const v = Number(val) || 0, m = Number(max) || 1;
  const pct = Math.max(0, Math.min(100, (v / m) * 100));
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1));
  return `<div class="assess-row">
    <span class="assess-row-label">${label}</span>
    <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
    <span class="assess-row-val">${fmt(v)}/${fmt(m)}</span>
  </div>`;
}

function buildAssessmentCard(profile) {
  const tag = document.getElementById("assess-tag");
  const content = document.getElementById("assess-content");
  let s = null;
  let learning = null;
  try { s = JSON.parse(localStorage.getItem("evoSuggestedTutor") || "null"); } catch {}
  try { learning = window.EvoStudentProfile?.getLearningProfileSummary?.(); } catch {}

  if (!s && !profile) {
    tag.textContent = "Not taken";
    content.innerHTML = `<p class="assess-empty">You haven't taken the placement assessment yet. Take it to get matched with the right tutor and unlock level-tuned help.</p>`;
    return;
  }

  tag.textContent = profile ? `Level ${profile.level}` : "Placed";
  const rows = [];
  const quiz = learning?.lessonQuiz;
  const hasPlacement = !!s || typeof profile?.placementCombinedScore === "number"
    || (!profile?.profileSource && profile?.assessedAt && typeof profile?.combinedScore === "number");
  if (s && typeof s.stage1Score === "number") {
    rows.push(scoreRow("Knowledge", s.stage1Score, s.stage1Max));
    rows.push(scoreRow("Skills", s.stage2Score, s.stage2Max));
    rows.push(scoreRow("Placement", s.combinedScore, 10));
  } else if (profile && typeof profile.combinedScore === "number" && !quiz?.attempts) {
    rows.push(scoreRow("Combined", profile.combinedScore, 10));
  }
  if (quiz?.attempts) {
    rows.push(scoreRow("Lesson quiz", quiz.totalScore, quiz.totalMax));
    if (profile && typeof profile.learningScore === "number") {
      rows.push(scoreRow("Learning", profile.learningScore, 10));
    }
  }
  const placedName = s?.tutorName || profile?.agentName || "your tutor";
  const placedLevel = profile?.levelLabel ? " · " + profile.levelLabel : "";
  const placedLabel = hasPlacement ? "Placed with" : "Current tutor";
  const placed = `<p class="assess-placed">${placedLabel} <strong>${placedName}</strong>${placedLevel}.</p>`;
  const when = s?.completedAt || profile?.assessedAt;
  const dateLine = when ? `<p class="assess-date">Last taken ${new Date(when).toLocaleDateString()}</p>` : "";
  const fmt = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(1));
  const capText = profile?.lessonQuizLevelCap ? ` Lesson evidence cap: Level ${profile.lessonQuizLevelCap}.` : "";
  const quizLine = quiz?.attempts
    ? `<p class="assess-date">Lesson profile: ${quiz.completedAttempts}/${quiz.attempts} quiz record${quiz.attempts === 1 ? "" : "s"} complete, average ${fmt(quiz.averageScore)}/10.${capText}</p>`
    : "";
  content.innerHTML = rows.join("") + placed + dateLine + quizLine;
}

function buildEmblemsCard() {
  const tag = document.getElementById("emblems-tag");
  const container = document.getElementById("profile-emblems");
  const note = document.getElementById("emblems-note");
  if (!container) return;

  const earned = window.EvoStudentProfile?.getEarnedEmblemsWithMeta?.() || [];
  if (tag) tag.textContent = earned.length ? `${earned.length} earned` : "0 earned";

  if (!earned.length) {
    container.innerHTML = `<p class="profile-emblems-empty">No emblems yet. Open revision mode on a completed lesson and listen to the recap audio.</p>`;
    if (note) note.hidden = false;
    return;
  }

  container.innerHTML = earned.map((emblem) => {
    const iconMarkup = emblem.image
      ? `<img class="profile-emblem-img" src="${emblem.image}" alt="" width="40" height="40" loading="lazy" />`
      : `<span class="profile-emblem-icon" aria-hidden="true">${emblem.icon || "🏅"}</span>`;
    return `
    <div class="profile-emblem-badge" title="${emblem.subtitle || ""}">
      ${iconMarkup}
      <span class="profile-emblem-copy">
        <span class="profile-emblem-title">${emblem.title}</span>
        ${emblem.subtitle ? `<span class="profile-emblem-sub">${emblem.subtitle}</span>` : ""}
      </span>
    </div>
  `;
  }).join("");
  if (note) note.hidden = true;
}

function openProfile() {
  completed = loadProgress();
  const stats = loadStats();
  const { agent, profile } = getProfileBits();

  const current = [selectScreen, dashboardScreen, modulePickerScreen, mapScreen].find((sc) => !sc.hidden);
  if (current) profileReturnScreen = current;

  // avatar + header
  const avatar = document.getElementById("profile-avatar");
  if (profile && agent?.image) { avatar.style.backgroundImage = `url(${agent.image})`; avatar.textContent = ""; }
  else { avatar.style.backgroundImage = ""; avatar.textContent = "👤"; }

  const displayName = window.EvoStudentAuth?.getDisplayName?.();
  const profileNameEl = document.getElementById("profile-name");
  if (profileNameEl) {
    profileNameEl.textContent = displayName || "Your profile";
  }

  const signOutBtn = document.getElementById("profile-sign-out");
  if (signOutBtn) {
    const showSignOut = Boolean(window.EvoStudentAuth?.isSignedIn?.());
    signOutBtn.hidden = !showSignOut;
  }

  const profileSub = document.getElementById("profile-sub");
  if (profileSub) {
    if (profile) {
      profileSub.textContent = `${agent?.name || "Tutor"} · Level ${profile.level} · ${agent?.levelLabel || profile.levelName || ""}`;
    } else if (displayName && window.EvoStudentAuth?.isGuest?.()) {
      profileSub.textContent = "Guest session · take the assessment to find your level";
    } else if (displayName && window.EvoStudentAuth?.isSignedIn?.()) {
      profileSub.textContent = "Take the placement assessment to find your level";
    } else {
      profileSub.textContent = "Take the assessment to find your level";
    }
  }

  // course progress (overall + per module)
  const modules = COURSES[ACTIVE_COURSE].modules;
  let done = 0, total = 0;
  const moduleRows = modules.map((mod, i) => {
    const mp = moduleProgress(i);
    done += mp.done; total += mp.total;
    const pct = mp.total ? Math.round((mp.done / mp.total) * 100) : 0;
    return `<div class="module-row">
      <span class="module-row-name">M${i + 1} · ${getModule(i).title}</span>
      <span class="module-row-count">${mp.done}/${mp.total}</span>
      <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");

  document.getElementById("stat-streak").textContent = stats.streak || 1;
  document.getElementById("stat-lessons").textContent = done;

  const overallPct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-pct").textContent = overallPct + "%";
  document.getElementById("overall-fill").style.width = overallPct + "%";
  document.getElementById("progress-note").textContent = `${done} of ${total} lessons complete`;
  document.getElementById("module-progress").innerHTML = moduleRows;

  // assessment scores
  buildAssessmentCard(profile);
  buildEmblemsCard();

  showScreen(profileScreen);
}

function afterLessonProgressReset() {
  completed = new Set();
  refreshFabAvatar();
  refreshAgentUI();
  if (!mapScreen.hidden) {
    buildMap(activeModuleIndex);
    preview.hidden = true;
    if (selectedLessonIndex != null) {
      selectLesson(activeModuleIndex, selectedLessonIndex, true);
    }
  }
  if (!modulePickerScreen.hidden) buildModulePicker();
  if (!dashboardScreen.hidden) buildDashboardRevisionSection();
}

function resetLessonProgressData() {
  const reset = window.EvoLessonProgressReset;
  if (!reset?.confirmResetLessonProgress?.()) return;
  reset.resetLessonProgress({ keepAssessment: true });
  afterLessonProgressReset();
  if (!profileScreen.hidden) openProfile();
  showToast("Lesson progress reset. Assessment kept.");
}

function resetProfileData() {
  const reset = window.EvoLessonProgressReset;
  if (!reset?.confirmResetAllStudentData?.()) return;
  reset.resetAllStudentData();

  completed = new Set();
  touchStreak();        // re-seed a fresh day
  refreshFabAvatar();
  refreshAgentUI();
  if (!mapScreen.hidden) buildMap(activeModuleIndex);
  if (!modulePickerScreen.hidden) buildModulePicker();
  if (!dashboardScreen.hidden) buildDashboardRevisionSection();
  openProfile();        // re-render with the cleared state
  showToast("Everything reset. Take the placement assessment to begin.");
}

profileFab.addEventListener("click", openProfile);
document.getElementById("profile-back").addEventListener("click", () => showScreen(profileReturnScreen));
document.getElementById("profile-sign-out")?.addEventListener("click", async () => {
  if (!window.EvoStudentAuth?.signOut) return;
  await EvoStudentAuth.signOut();
  location.replace("login.html");
});
document.getElementById("profile-reset-lessons").addEventListener("click", resetLessonProgressData);
document.getElementById("profile-reset").addEventListener("click", resetProfileData);
document.getElementById("map-reset-progress").addEventListener("click", resetLessonProgressData);

// ============================================================
//  Boot
// ============================================================

function bootApp() {
// Full reset: visit ...index.html?reset (or #reset) to wipe all evolearn data.
if (/reset/i.test(location.search) || /reset/i.test(location.hash)) {
  if (window.EvoLessonProgressReset?.resetAllProgress) {
    EvoLessonProgressReset.resetAllProgress();
  } else {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem("evoStudentProfile");
  }
  location.replace(location.pathname);
}

initParticles();
drawParticles();

touchStreak();
refreshFabAvatar();
refreshDashboardGreeting();

window.addEventListener("evolearn:progress-restored", () => {
  completed = loadProgress();
  touchStreak();
  refreshFabAvatar();
  refreshDashboardGreeting();
  refreshAgentUI();
  if (!dashboardScreen.hidden) buildDashboardRevisionSection();
  if (!mapScreen.hidden) buildMap(activeModuleIndex);
  if (!modulePickerScreen.hidden) buildModulePicker();
  if (!profileScreen.hidden) openProfile();
});

const bootHash = location.hash.slice(1);
if (bootHash === "citizenship" || bootHash === "citizenship/revision") {
  goToDashboard({ scrollToRevision: bootHash === "citizenship/revision" });
} else if (!dashboardScreen.hidden) {
  buildDashboardRevisionSection();
} else {
  const mapRoute = parseMapHash();
  if (mapRoute?.type === "map") {
    goToModuleMap(mapRoute.moduleIndex);
  } else if (location.hash === "#map" || mapRoute?.type === "picker" || sessionStorage.getItem("evolearn-skip-select")) {
    sessionStorage.removeItem("evolearn-skip-select");
    goToModulePicker();
  }
}

if (window.EvoStudentProfile) {
  window.EvoStudentProfile.initAppShell();
}

const pendingToast = sessionStorage.getItem("evolearn-toast");
if (pendingToast) {
  sessionStorage.removeItem("evolearn-toast");
  showToast(pendingToast);
}
}

if (window.EvoStudentAuth?.waitForAuthGate) {
  EvoStudentAuth.waitForAuthGate().then(bootApp);
} else {
  bootApp();
}

// Keep greeting fresh after auth changes (login / logout).
try {
  window.EvoStudentAuth?.onAuthStateChanged?.(() => {
    refreshDashboardGreeting();
  });
} catch { /* ignore */ }
