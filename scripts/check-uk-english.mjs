/**
 * Scan student-facing content for common US English spellings.
 * Run: node scripts/check-uk-english.mjs
 *
 * Exit 0 when clean; exit 1 and print matches when US spellings are found.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

/** US → UK hint pairs. Regex uses word boundaries; some patterns are contextual. */
const US_PATTERNS = [
  { us: "organize", uk: "organise", re: /\borganiz(e|es|ed|ing|ation|ations)\b/gi },
  { us: "behavior", uk: "behaviour", re: /\bbehavior(s)?\b/gi },
  { us: "recognize", uk: "recognise", re: /\brecogniz(e|es|ed|ing)\b/gi },
  { us: "analyze", uk: "analyse", re: /\banalyz(e|es|ed|ing)\b/gi },
  { us: "favorite", uk: "favourite", re: /\bfavorites?\b/gi },
  { us: "defense", uk: "defence", re: /\bdefense\b/gi },
  { us: "license (noun)", uk: "licence", re: /\blicen[cs]e\b/gi, skip: /\blicense[d]?\b/gi },
  { us: "programme", uk: "programme", re: /\bprograms?\b/gi, skip: /\bprogram(ming|mer|med)\b/gi },
  { us: "center", uk: "centre", re: /\bcenters?\b/gi },
  { us: "color", uk: "colour", re: /\bcolors?\b/gi },
  { us: "toward", uk: "towards", re: /\btoward\b/gi },
  { us: "customize", uk: "customise", re: /\bcustomiz(e|es|ed|ing)\b/gi },
  { us: "neighbor", uk: "neighbour", re: /\bneighbor(s|hood|hoods)?\b/gi },
  { us: "honor", uk: "honour", re: /\bhonor(s|ed|ing)?\b/gi },
  { us: "labor", uk: "labour", re: /\blabor(s)?\b/gi },
  { us: "traveling", uk: "travelling", re: /\btraveling\b/gi },
  { us: "modeled", uk: "modelled", re: /\bmodeled\b/gi },
  { us: "gotten", uk: "got", re: /\bgotten\b/gi },
  { us: "summarize", uk: "summarise", re: /\bsummariz(e|es|ed|ing)\b/gi },
  { us: "judgment", uk: "judgement", re: /\bjudgment\b/gi },
  { us: "math (subject)", uk: "maths", re: /\bmath\b/gi, skip: /\bMath\./ },
];

const SCAN_ROOTS = [
  "assets/data/lesson-worksheets",
  "assets/data/lesson-quizzes",
  "assets/data/knowledge",
  "assets/data/tutors",
  "assets/js/lesson-end-quiz.js",
  "assets/js/lesson-worksheet.js",
  "assessment",
  "index.html",
  "app.js",
  "narration-scripts",
  "lessons",
];

const SKIP_DIRS = new Set(["node_modules", ".git", ".netlify"]);
const TEXT_EXTENSIONS = new Set([".json", ".js", ".html", ".md", ".txt", ".mjs"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if ([...TEXT_EXTENSIONS].some((ext) => name.endsWith(ext))) files.push(full);
  }
  return files;
}

function collectFiles() {
  const files = [];
  for (const rel of SCAN_ROOTS) {
    const full = join(ROOT, rel);
    try {
      const st = statSync(full);
      if (st.isDirectory()) walk(full, files);
      else files.push(full);
    } catch {
      /* missing path */
    }
  }
  return [...new Set(files)].sort();
}

const ALLOWLIST = [
  { file: "assets/data/knowledge/synonyms.json", contains: "North Atlantic Treaty Organization" },
];

function isAllowlisted(file, line) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  return ALLOWLIST.some((entry) => entry.file === rel && line.includes(entry.contains));
}

function isCssOrCodeLine(line) {
  const t = line.trim();
  if (/\.(css|scss)\b/.test(t)) return true;
  if (/^\s*[\.\#\[@<]/.test(t)) return true;
  if (/\bstop-color\b/.test(t)) return true;
  if (/\b(color|background|border-color|text-align|place-items|align-items|justify-content)\s*:/.test(t)) {
    return true;
  }
  if (/\.replace\(/.test(t)) return true;
  if (/function sanitizeStudentText/.test(t)) return true;
  return false;
}

function lineMatches(file, text, pattern) {
  const lines = text.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (pattern.skip && pattern.skip.test(line)) continue;
    if (isAllowlisted(file, line)) continue;
    if (isCssOrCodeLine(line) && (pattern.us === "color" || pattern.us === "center")) continue;
    const re = new RegExp(pattern.re.source, pattern.re.flags);
    if (re.test(line)) {
      // UK licence is correct; only flag US "license" when not already "licence"
      if (pattern.us.startsWith("license") && /\blicence\b/i.test(line)) continue;
      hits.push({ line: i + 1, text: line.trim().slice(0, 120) });
    }
  }
  return hits;
}

const files = collectFiles();
const findings = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  for (const pattern of US_PATTERNS) {
    const hits = lineMatches(file, text, pattern);
    for (const hit of hits) {
      findings.push({ file: rel, ...pattern, ...hit });
    }
  }
}

if (!findings.length) {
  console.log(`UK English check passed (${files.length} files scanned).`);
  process.exit(0);
}

console.log(`Found ${findings.length} possible US spelling(s) in ${files.length} files:\n`);
for (const f of findings) {
  console.log(`${f.file}:${f.line}  [${f.us} → ${f.uk}]`);
  console.log(`  ${f.text}\n`);
}
process.exit(1);
