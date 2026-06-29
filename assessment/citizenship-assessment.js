/* EVOlearn — GCSE Citizenship diagnostic placement assessment
   Extracted from for information/student.html (assessment framework + quiz logic) */

const TUTORS = [
  { name: "Nova", level: "Access", support: "Gentle help when you want to take things one small step at a time." },
  { name: "Milo", level: "Foundation", support: "Straightforward tasks that show you exactly what to do next." },
  { name: "Ava", level: "Building Confidence", support: "Encouragement when you know some things but do not feel sure yet." },
  { name: "Kai", level: "Developing", support: "Clear rules, simple steps, and calm practice." },
  { name: "Zara", level: "Secure", support: "Stronger challenges with clear examples of what good work looks like." },
  { name: "Theo", level: "Confident", support: "Lively questions that help you think deeper and explain your ideas." },
  { name: "Nia", level: "Exam Ready", support: "Exam tips, mark scheme thinking, and ways to get more marks." },
  { name: "Elias", level: "Advanced", support: "Big ideas, careful thinking, and more detailed discussion." },
  { name: "Athena", level: "Mastery", support: "High-level coaching when you are ready to produce your best work." },
];

const assessmentFramework = {
  tutorBands: [
    { tutorIndex: 0, tutorName: "Nova", level: "Access", combinedRange: "0.0-0.9" },
    { tutorIndex: 1, tutorName: "Milo", level: "Foundation", combinedRange: "1.0-1.9" },
    { tutorIndex: 2, tutorName: "Ava", level: "Building Confidence", combinedRange: "2.0-2.9" },
    { tutorIndex: 3, tutorName: "Kai", level: "Developing", combinedRange: "3.0-3.9" },
    { tutorIndex: 4, tutorName: "Zara", level: "Secure", combinedRange: "4.0-4.9" },
    { tutorIndex: 5, tutorName: "Theo", level: "Confident", combinedRange: "5.0-5.9" },
    { tutorIndex: 6, tutorName: "Nia", level: "Exam Ready", combinedRange: "6.0-6.9" },
    { tutorIndex: 7, tutorName: "Elias", level: "Advanced", combinedRange: "7.0-7.9" },
    { tutorIndex: 8, tutorName: "Athena", level: "Mastery", combinedRange: "8.0-10.0" },
  ],
  placementPolicy: {
    diagnosticStage1Weight: 0.6,
    diagnosticStage2Weight: 0.4,
    notClaimed: "This is not an official exam grade, certification, or DfE or Ofsted approval.",
  },
};

const STORAGE_KEYS = {
  suggestedTutor: "evoSuggestedTutor",
  studentProfile: "evoStudentProfile",
  quizHistory: "evoTutorQuizHistory",
  pendingPlacements: "evoPendingPlacements",
};

const COMMAND_WORD_TIERS = {
  identify: 1, name: 1, state: 1, give: 1, define: 1,
  describe: 2, outline: 2, summarise: 2,
  explain: 3,
  apply: 4, suggest: 4,
  analyse: 5, examine: 5,
  discuss: 6, debate: 6, compare: 6, consider: 6, contrast: 6,
  evaluate: 7, assess: 7, justify: 7, argue: 7,
  conclude: 8,
};

const TIER_SCORE_WEIGHTS = { 1: 1, 2: 1.5, 3: 2, 4: 2.5, 5: 3, 6: 3.5, 7: 4, 8: 4 };

const RESPONSE_HINTS = {
  mc: "Select the best answer.",
  short: "Write a short phrase or one word only.",
  paragraph: "Write in full sentences. Use citizenship vocabulary where you can.",
  list: "Enter each point on a new line. Aim for the number of points requested.",
  discuss: "Present both sides briefly, then give your view with a reason.",
  evaluate: "Make a judgement using evidence or examples from the scenario.",
  conclude: "Write one concluding statement that follows from your reasoning.",
};

const stage1ScreeningQuestions = [
  {
    id: "s1-identify-right",
    commandWord: "identify",
    topic: "Rights & Responsibilities",
    ao: "AO1",
    responseType: "mc",
    question: "Identify which of the following is a right protected in UK citizenship law.",
    options: [
      "Freedom of expression within legal limits",
      "Choosing which laws apply to you personally",
      "Avoiding all school rules you disagree with",
      "Voting before the legal minimum age",
    ],
    correct: 0,
  },
  {
    id: "s1-name-responsibility",
    commandWord: "name",
    topic: "Rights & Responsibilities",
    ao: "AO1",
    responseType: "mc",
    question: "Name the best example of a responsibility at school.",
    options: [
      "Treating others with respect and following reasonable rules",
      "Deciding which lessons are optional for you",
      "Choosing national tax rates",
      "Appointing the headteacher",
    ],
    correct: 0,
  },
  {
    id: "s1-state-democracy",
    commandWord: "state",
    topic: "Democracy & Participation",
    ao: "AO1",
    responseType: "mc",
    question: "State the minimum age to vote in a UK general election.",
    options: ["18", "16", "21", "14"],
    correct: 0,
  },
  {
    id: "s1-identify-law",
    commandWord: "identify",
    topic: "Law & Justice",
    ao: "AO1",
    responseType: "mc",
    question: "Identify which institution is mainly responsible for making new laws in the UK.",
    options: ["Parliament", "The police", "Magistrates courts only", "Local supermarkets"],
    correct: 0,
  },
  {
    id: "s1-define-democracy",
    commandWord: "define",
    topic: "Democracy & Participation",
    ao: "AO1",
    responseType: "mc",
    question: "Define the term democracy.",
    options: [
      "A system where people have a say in how they are governed, often through voting",
      "A system where one ruler makes every decision without consultation",
      "A system with no elections or representation",
      "A system where only judges run the country",
    ],
    correct: 0,
  },
  {
    id: "s1-name-law",
    commandWord: "name",
    topic: "Law & Justice",
    ao: "AO1",
    responseType: "mc",
    question: "Name one aim of punishment in the youth justice system.",
    options: [
      "To prevent reoffending and protect the public",
      "To remove all rights from young people permanently",
      "To stop courts from hearing youth cases",
      "To replace education with fines only",
    ],
    correct: 0,
  },
  {
    id: "s1-identify-active",
    commandWord: "identify",
    topic: "Active Citizenship",
    ao: "AO1",
    responseType: "mc",
    question: "Identify the best example of active citizenship.",
    options: [
      "Running a campaign to improve litter problems near school",
      "Ignoring community issues because they seem small",
      "Breaking rules to get attention online",
      "Waiting for others to solve every local problem",
    ],
    correct: 0,
  },
];

const stage2TaskBank = [
  {
    id: "s2-describe-parliament",
    type: "short_answer",
    commandWord: "describe",
    responseType: "paragraph",
    topic: "Democracy & Participation",
    ao: "AO1",
    minScreeningScore: 0,
    question: "Describe two features of the UK Parliament.",
    minChars: 45,
    keywords: ["house", "commons", "lords", "law", "debate", "elect", "mp", "government", "legislation"],
    minKeywords: 2,
  },
  {
    id: "s2-explain-rights",
    type: "short_answer",
    commandWord: "explain",
    responseType: "paragraph",
    topic: "Rights & Responsibilities",
    ao: "AO2",
    minScreeningScore: 0,
    question: "Explain one reason why rights and responsibilities are linked in a democracy.",
    minChars: 50,
    keywords: ["because", "balance", "community", "respect", "law", "vote", "duty", "fair", "society"],
    minKeywords: 2,
    requiresLinkWord: true,
  },
  {
    id: "s2-list-responsibilities",
    type: "short_answer",
    commandWord: "list",
    responseType: "list",
    topic: "Rights & Responsibilities",
    ao: "AO1",
    minScreeningScore: 0,
    question: "List three responsibilities of a UK citizen.",
    minItems: 3,
    minChars: 30,
    keywords: ["vote", "law", "jury", "tax", "respect", "community", "school", "environment", "obey"],
    minKeywords: 2,
  },
  {
    id: "s2-apply-law",
    type: "scenario",
    commandWord: "apply",
    responseType: "paragraph",
    topic: "Law & Justice",
    ao: "AO2",
    minScreeningScore: 3,
    scenario: "A student posts hurtful comments about a new classmate in a group chat. The comments are not violent but they are repeated and upsetting.",
    question: "Apply the idea of rights and responsibilities to explain the most responsible first step.",
    minChars: 55,
    keywords: ["report", "safeguard", "adult", "respect", "right", "responsibility", "harm", "online", "school"],
    minKeywords: 2,
  },
  {
    id: "s2-discuss-voting",
    type: "short_answer",
    commandWord: "discuss",
    responseType: "discuss",
    topic: "Democracy & Participation",
    ao: "AO3",
    minScreeningScore: 5,
    question: "Discuss one advantage and one disadvantage of lowering the voting age to 16.",
    minChars: 70,
    keywords: ["advantage", "disadvantage", "vote", "16", "participation", "however", "mature", "interest", "view"],
    minKeywords: 3,
    requiresBothSides: true,
  },
];

const TUTOR_SCORE_BANDS = assessmentFramework.tutorBands.map((band) => {
  const parts = band.combinedRange.split("-").map(Number);
  return { min: parts[0], max: parts[1], tutorIndex: band.tutorIndex };
});

const WRITTEN_LINK_WORD_PATTERN = /\bbecause\b|\btherefore\b|\bso that\b|\bthis means\b/i;
const WRITTEN_BOTH_SIDES_CONTRAST = /\bhowever\b|\bon the other hand\b|\bdisadvantage\b|\bdrawback\b|\bwhereas\b|\bbut\b/i;
const WRITTEN_BOTH_SIDES_POSITIVE = /\badvantage\b|\bbenefit\b|\bstrength\b/i;
const WRITTEN_MIN_WORDS = { describe: 8, explain: 10, apply: 10, discuss: 12, list: 6 };

let quizState = {
  screen: "start",
  stage: 1,
  questionIndex: 0,
  stage1Answers: [],
  stage2Tasks: [],
  stage2Answers: [],
  pendingResult: null,
  failedValidations: [],
  submitted: false,
};

const bodyEl = document.getElementById("assessment-body");
const progressLabel = document.getElementById("assessment-progress-label");
const progressFill = document.getElementById("assessment-progress-fill");
const backButton = document.getElementById("assessment-back");
const nextButton = document.getElementById("assessment-next");

function getCommandWordTier(commandWord) {
  return COMMAND_WORD_TIERS[commandWord] || 1;
}

function getItemMarkWeight(item) {
  return TIER_SCORE_WEIGHTS[getCommandWordTier(item.commandWord)] || 1;
}

function capitalizeCommandWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function renderQuestionMeta(item) {
  return `
    <div class="assessment-meta">
      <span class="assessment-command">${capitalizeCommandWord(item.commandWord)}</span>
      <span class="assessment-topic">${item.topic} · ${item.ao}</span>
    </div>
  `;
}

function getResponseHint(item) {
  if (item.responseHint) return item.responseHint;
  if (item.responseType === "list") return RESPONSE_HINTS.list;
  if (item.commandWord === "discuss") return RESPONSE_HINTS.discuss;
  if (item.commandWord === "evaluate" || item.commandWord === "assess") return RESPONSE_HINTS.evaluate;
  if (item.commandWord === "conclude") return RESPONSE_HINTS.conclude;
  if (item.responseType === "short") return RESPONSE_HINTS.short;
  if (item.responseType === "paragraph" || item.type === "short_answer") return RESPONSE_HINTS.paragraph;
  return RESPONSE_HINTS.mc;
}

function getStage1MaxScore() {
  return stage1ScreeningQuestions.reduce((total, question) => total + getItemMarkWeight(question), 0);
}

function getStage2MaxScore(tasks) {
  return tasks.reduce((total, task) => total + getItemMarkWeight(task), 0);
}

function selectStage2Tasks(stage1Score) {
  return stage2TaskBank.filter((task) => stage1Score >= task.minScreeningScore);
}

function getTotalQuizSteps() {
  return stage1ScreeningQuestions.length + quizState.stage2Tasks.length;
}

function scoreMultipleChoice(answerIndex, item) {
  const maxScore = getItemMarkWeight(item);
  return answerIndex === item.correct ? maxScore : 0;
}

function countKeywordHits(text, keywords) {
  const lower = (text || "").toLowerCase();
  return keywords.filter((word) => lower.includes(word.toLowerCase())).length;
}

function tokenizeAnswerWords(text) {
  return (text || "").toLowerCase().match(/\b[a-z']{2,}\b/g) || [];
}

function isGibberishWord(word) {
  if (word.length >= 5 && !/[aeiouy]/i.test(word)) return true;
  if (/(.)\1{3,}/.test(word)) return true;
  if (word.length >= 8 && /[^aeiouy]{4,}/i.test(word)) return true;
  if (word.length > 12) {
    const uniqueChars = new Set(word.split("")).size;
    if (uniqueChars / word.length < 0.55) return true;
  }
  return false;
}

function hasGibberishContent(text) {
  const words = tokenizeAnswerWords(text);
  if (!words.length) return true;
  const gibberishCount = words.filter(isGibberishWord).length;
  if (gibberishCount >= 2 || (words.length >= 4 && gibberishCount / words.length >= 0.35)) return true;
  const unique = new Set(words);
  if (words.length >= 6 && unique.size / words.length < 0.45) return true;
  const counts = {};
  words.forEach((word) => { counts[word] = (counts[word] || 0) + 1; });
  const maxRepeat = Math.max(...Object.values(counts));
  if (maxRepeat >= 3 && maxRepeat / words.length >= 0.5) return true;
  return false;
}

function countMeaningfulWords(text) {
  return tokenizeAnswerWords(text).filter((word) => !isGibberishWord(word)).length;
}

function parseListAnswerLines(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.replace(/^[\-\*•]\s*/, "").trim())
    .filter(Boolean);
}

function meetsWrittenLengthGate(task, trimmed) {
  if (task.responseType === "list") {
    const lines = parseListAnswerLines(trimmed);
    return lines.length >= (task.minItems || 2) && trimmed.length >= (task.minChars || 20);
  }
  return trimmed.length >= (task.minChars || 20);
}

function getWrittenQualityError(text, task) {
  const trimmed = (text || "").trim();
  if (!meetsWrittenLengthGate(task, trimmed)) return null;
  const defaultMessage = "Please write a real answer in full sentences before continuing.";
  if (task.responseType === "list") {
    const lines = parseListAnswerLines(trimmed);
    const normalizedLines = lines.map((line) => line.toLowerCase());
    if (new Set(normalizedLines).size < lines.length) {
      return "Each point should be different. Add separate lines for each responsibility.";
    }
    const weakLines = lines.filter((line) => countMeaningfulWords(line) < 2 || hasGibberishContent(line));
    if (weakLines.length) {
      return "Each point needs a short real phrase, not random letters. Put one responsibility on each line.";
    }
    if (countMeaningfulWords(trimmed) < (WRITTEN_MIN_WORDS.list || 6)) return defaultMessage;
    return null;
  }
  const minWords = WRITTEN_MIN_WORDS[task.commandWord] || 6;
  if (countMeaningfulWords(trimmed) < minWords) return defaultMessage;
  if (hasGibberishContent(trimmed)) return defaultMessage;
  if (task.requiresLinkWord && !WRITTEN_LINK_WORD_PATTERN.test(trimmed)) {
    return "Explain your reasoning using because, therefore, or a similar linking word.";
  }
  if (task.requiresBothSides) {
    const hasContrast = WRITTEN_BOTH_SIDES_CONTRAST.test(trimmed);
    const hasBothSides = WRITTEN_BOTH_SIDES_POSITIVE.test(trimmed) && hasContrast;
    if (!hasBothSides) return "Discuss both an advantage and a disadvantage before continuing.";
  }
  return null;
}

function isWrittenTask(task) {
  if (task.responseType === "mc" || task.type === "multiple_choice") return false;
  if (task.responseType === "short") return false;
  return task.type === "short_answer" || task.type === "scenario" || task.responseType === "paragraph"
    || task.responseType === "list" || task.responseType === "discuss";
}

function scoreWrittenAnswer(text, task) {
  const trimmed = (text || "").trim();
  const maxScore = getItemMarkWeight(task);
  if (!trimmed) return 0;
  if (task.responseType === "list") {
    const lines = trimmed.split("\n").map((line) => line.replace(/^[\-\*•]\s*/, "").trim()).filter(Boolean);
    if (lines.length < (task.minItems || 2)) return 0;
    const hits = countKeywordHits(trimmed, task.keywords || []);
    if (hits >= (task.minKeywords || 2)) return maxScore;
    if (hits >= 1 || lines.length >= (task.minItems || 2)) return Math.max(maxScore * 0.5, 0.5);
    return 0;
  }
  if (trimmed.length < (task.minChars || 20)) return 0;
  const hits = countKeywordHits(trimmed, task.keywords || []);
  let score = 0;
  if (hits >= (task.minKeywords || 2)) score = maxScore;
  else if (hits >= 1) score = Math.max(maxScore * 0.5, 0.5);
  if (task.requiresLinkWord && !WRITTEN_LINK_WORD_PATTERN.test(trimmed)) {
    score = Math.min(score, maxScore * 0.5);
  }
  if (task.requiresBothSides) {
    const hasContrast = WRITTEN_BOTH_SIDES_CONTRAST.test(trimmed);
    const hasBothSides = WRITTEN_BOTH_SIDES_POSITIVE.test(trimmed) && hasContrast;
    if (!hasBothSides && score > 0) score = Math.min(score, maxScore * 0.6);
  }
  return score;
}

function scoreAssessmentItem(item, answer) {
  const maxScore = getItemMarkWeight(item);
  let score = 0;
  if (item.responseType === "mc" || item.type === "multiple_choice") {
    score = scoreMultipleChoice(answer, item);
  } else if (item.type === "scenario" || item.type === "short_answer") {
    score = scoreWrittenAnswer(answer, item);
  }
  return {
    id: item.id,
    stage: item.stage,
    commandWord: item.commandWord,
    commandTier: getCommandWordTier(item.commandWord),
    ao: item.ao,
    topic: item.topic,
    score,
    maxScore,
    pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
  };
}

function buildItemResults(stage1Answers, stage2Tasks, stage2Answers) {
  const stage1Results = stage1ScreeningQuestions.map((question, index) =>
    scoreAssessmentItem({ ...question, stage: 1 }, stage1Answers[index]));
  const stage2Results = stage2Tasks.map((task, index) =>
    scoreAssessmentItem({ ...task, stage: 2 }, stage2Answers[index]));
  return stage1Results.concat(stage2Results);
}

function buildCommandWordBreakdown(itemResults) {
  const byCommand = {};
  itemResults.forEach((item) => {
    if (!byCommand[item.commandWord]) byCommand[item.commandWord] = { earned: 0, max: 0 };
    byCommand[item.commandWord].earned += item.score;
    byCommand[item.commandWord].max += item.maxScore;
  });
  const strong = [];
  const developing = [];
  Object.keys(byCommand).sort((a, b) => getCommandWordTier(b) - getCommandWordTier(a)).forEach((word) => {
    const bucket = byCommand[word];
    const pct = bucket.max > 0 ? bucket.earned / bucket.max : 0;
    if (pct >= 0.7) strong.push(word);
    else developing.push(word);
  });
  return { strong, developing, byCommand };
}

function buildAoBreakdown(itemResults) {
  const aos = { AO1: { earned: 0, max: 0 }, AO2: { earned: 0, max: 0 }, AO3: { earned: 0, max: 0 } };
  itemResults.forEach((item) => {
    if (!aos[item.ao]) return;
    aos[item.ao].earned += item.score;
    aos[item.ao].max += item.maxScore;
  });
  return aos;
}

function calculateStage1Score(answers) {
  return stage1ScreeningQuestions.reduce((total, question, index) =>
    total + scoreMultipleChoice(answers[index], question), 0);
}

function calculateStage2Score(tasks, answers) {
  return tasks.reduce((total, task, index) => {
    if (task.responseType === "mc" || task.type === "multiple_choice") {
      return total + scoreMultipleChoice(answers[index], task);
    }
    return total + scoreWrittenAnswer(answers[index], task);
  }, 0);
}

function calculateCombinedScore(stage1Score, stage2Score, stage2Tasks) {
  const stage1Max = getStage1MaxScore();
  const stage2Max = getStage2MaxScore(stage2Tasks);
  const w1 = assessmentFramework.placementPolicy.diagnosticStage1Weight;
  const w2 = assessmentFramework.placementPolicy.diagnosticStage2Weight;
  const normalized = (stage1Score / stage1Max) * w1 + (stage2Max > 0 ? (stage2Score / stage2Max) * w2 : 0);
  return Math.round(normalized * 100) / 10;
}

function getTutorIndexForCombinedScore(combinedScore) {
  const band = TUTOR_SCORE_BANDS.find((item) => combinedScore >= item.min && combinedScore <= item.max);
  return band ? band.tutorIndex : 0;
}

function buildSuggestionFromScores(stage1Score, stage2Score, stage2Tasks, itemResults) {
  const combinedScore = calculateCombinedScore(stage1Score, stage2Score, stage2Tasks);
  const tutorIndex = getTutorIndexForCombinedScore(combinedScore);
  const tutor = TUTORS[tutorIndex];
  return {
    id: `placement-${Date.now()}`,
    tutorIndex,
    tutorName: tutor.name,
    level: tutor.level,
    support: tutor.support,
    stage1Score,
    stage1Max: getStage1MaxScore(),
    stage2Score,
    stage2Max: getStage2MaxScore(stage2Tasks),
    combinedScore,
    commandWordBreakdown: buildCommandWordBreakdown(itemResults),
    aoBreakdown: buildAoBreakdown(itemResults),
    itemResults,
    status: "pending",
    assessmentStage: "diagnostic",
    completedAt: new Date().toISOString(),
    source: "placement-assessment",
  };
}

function saveStudentProfileFromSuggestion(suggestion) {
  if (window.EvoStudentProfile) {
    window.EvoStudentProfile.assignFromAssessment(suggestion);
  } else {
    const tutor = TUTORS[suggestion.tutorIndex] || TUTORS[0];
    localStorage.setItem(STORAGE_KEYS.studentProfile, JSON.stringify({
      level: suggestion.tutorIndex + 1,
      levelLabel: tutor.level,
      agentName: tutor.name,
      agentId: tutor.name.toLowerCase(),
      tutorIndex: suggestion.tutorIndex,
      combinedScore: suggestion.combinedScore,
      assessedAt: suggestion.completedAt || new Date().toISOString(),
    }));
  }
}

function saveSuggestedTutor(suggestion) {
  localStorage.setItem(STORAGE_KEYS.suggestedTutor, JSON.stringify(suggestion));
  saveStudentProfileFromSuggestion(suggestion);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.quizHistory);
    const history = raw ? JSON.parse(raw) : [];
    history.push({
      tutorIndex: suggestion.tutorIndex,
      tutorName: suggestion.tutorName,
      stage1Score: suggestion.stage1Score,
      stage2Score: suggestion.stage2Score,
      combinedScore: suggestion.combinedScore,
      status: suggestion.status || "pending",
      completedAt: suggestion.completedAt,
      items: suggestion.itemResults || [],
    });
    localStorage.setItem(STORAGE_KEYS.quizHistory, JSON.stringify(history.slice(-20)));
  } catch { /* optional */ }
  try {
    window.EvoStudentSync?.notifyChange?.("assessment-complete");
  } catch { /* sync optional */ }
}

function setQuizProgress(currentStep, totalSteps, labelText) {
  const percent = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  progressLabel.textContent = labelText;
  progressFill.style.width = `${percent}%`;
}

function resetQuizState() {
  quizState = {
    screen: "start",
    stage: 1,
    questionIndex: 0,
    stage1Answers: new Array(stage1ScreeningQuestions.length).fill(null),
    stage2Tasks: [],
    stage2Answers: [],
    pendingResult: null,
    failedValidations: [],
    submitted: false,
  };
}


function renderQuizStart(isRetake) {
  const totalSteps = stage1ScreeningQuestions.length + 3;
  setQuizProgress(0, totalSteps, "Ready to begin");
  bodyEl.innerHTML = `
    <div class="assessment-step assessment-start">
      <span class="assessment-topic">Citizenship placement assessment</span>
      <h2 class="assessment-question">${isRetake ? "Retake placement assessment" : "GCSE Citizenship placement assessment"}</h2>
      <p>This is a two-stage GCSE Citizenship placement assessment using exam-style command words (identify, describe, explain, apply, discuss, and others). Stage 1 screens knowledge across core themes. Stage 2 adds written tasks matched to your Stage 1 performance.</p>
      <p>${assessmentFramework.placementPolicy.notClaimed} Your teacher may confirm or adjust your suggested tutor band after reviewing your responses.</p>
    </div>
  `;
  backButton.disabled = true;
  backButton.hidden = true;
  nextButton.disabled = false;
  nextButton.textContent = "Start Stage 1";
}

function renderStage1Question() {
  const question = stage1ScreeningQuestions[quizState.questionIndex];
  const selected = quizState.stage1Answers[quizState.questionIndex];
  const step = quizState.questionIndex + 1;
  const totalSteps = getTotalQuizSteps() || stage1ScreeningQuestions.length + 3;
  setQuizProgress(step, totalSteps, `Stage 1 · Screening · ${step} of ${stage1ScreeningQuestions.length}`);
  bodyEl.innerHTML = `
    <div class="assessment-step">
      <span class="assessment-stage">Stage 1 · AO1 screening</span>
      ${renderQuestionMeta(question)}
      <p class="assessment-hint">${getResponseHint(question)}</p>
      <h2 class="assessment-question">${question.question}</h2>
      <div class="assessment-options" role="listbox" aria-label="Answer options">
        ${question.options.map((option, index) => `
          <button
            class="assessment-option${selected === index ? " is-selected" : ""}"
            type="button"
            data-option-index="${index}"
            role="option"
            aria-selected="${selected === index}"
          >
            <span class="assessment-option-marker">${String.fromCharCode(65 + index)}</span>
            <span class="assessment-option-label">${option}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
  backButton.hidden = false;
  backButton.disabled = quizState.questionIndex === 0;
  nextButton.disabled = selected === null;
  nextButton.textContent = quizState.questionIndex === stage1ScreeningQuestions.length - 1 ? "Continue to Stage 2" : "Next";
  bodyEl.querySelectorAll(".assessment-option").forEach((button) => {
    button.addEventListener("click", () => {
      quizState.stage1Answers[quizState.questionIndex] = Number(button.dataset.optionIndex);
      renderStage1Question();
    });
  });
}

function isStage2AnswerValid(task, answer) {
  if (task.responseType === "mc" || task.type === "multiple_choice") {
    return answer !== null && answer !== undefined;
  }
  if (task.responseType === "short") return Boolean((answer || "").trim());
  const trimmed = (answer || "").trim();
  if (!meetsWrittenLengthGate(task, trimmed)) return false;
  return getWrittenQualityError(trimmed, task) === null;
}

function showStage2FieldError(message) {
  const errorEl = bodyEl.querySelector(".assessment-field-error");
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }
}

function renderStage2Task() {
  const task = quizState.stage2Tasks[quizState.questionIndex];
  const answer = quizState.stage2Answers[quizState.questionIndex];
  const step = stage1ScreeningQuestions.length + quizState.questionIndex + 1;
  const totalSteps = getTotalQuizSteps();
  setQuizProgress(step, totalSteps, `Stage 2 · Written tasks · ${quizState.questionIndex + 1} of ${quizState.stage2Tasks.length}`);
  let bodyHtml = `
    <div class="assessment-step">
      <span class="assessment-stage">Stage 2 · Command-word tasks</span>
      ${renderQuestionMeta(task)}
  `;
  if (task.scenario) bodyHtml += `<div class="assessment-scenario">${task.scenario}</div>`;
  bodyHtml += `
      <p class="assessment-hint">${getResponseHint(task)}</p>
      <h2 class="assessment-question">${task.question}</h2>
  `;
  if (task.responseType === "mc" || task.type === "multiple_choice") {
    bodyHtml += `
      <div class="assessment-options" role="listbox" aria-label="Answer options">
        ${task.options.map((option, index) => `
          <button
            class="assessment-option${answer === index ? " is-selected" : ""}"
            type="button"
            data-option-index="${index}"
            role="option"
            aria-selected="${answer === index}"
          >
            <span class="assessment-option-marker">${String.fromCharCode(65 + index)}</span>
            <span class="assessment-option-label">${option}</span>
          </button>
        `).join("")}
      </div>
    `;
  } else if (task.responseType === "short") {
    bodyHtml += `
      <input class="assessment-answer assessment-short-input" id="assessment-answer-field" type="text" value="${answer || ""}" placeholder="Type your answer here" aria-label="Your answer" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <p class="assessment-char-hint">Short phrase or one word only</p>
    `;
  } else {
    const charCount = (answer || "").trim().length;
    const isValid = isStage2AnswerValid(task, answer);
    const listPlaceholder = task.responseType === "list" ? "Point 1\nPoint 2\nPoint 3" : "Write your answer in full sentences...";
    bodyHtml += `
      <textarea class="assessment-answer assessment-textarea" id="assessment-answer-field" placeholder="${listPlaceholder}" aria-label="Your answer" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="true">${answer || ""}</textarea>
      <p class="assessment-char-hint${isValid ? " is-valid" : ""}">${charCount} / ${task.minChars} characters minimum${task.responseType === "list" ? ` · ${(answer || "").split("\n").filter((line) => line.trim()).length} / ${task.minItems || 3} points` : ""}</p>
      <p class="assessment-field-error" hidden role="alert"></p>
    `;
  }
  bodyHtml += `</div>`;
  bodyEl.innerHTML = bodyHtml;
  if (window.EvoAssessmentGuard) EvoAssessmentGuard.init(bodyEl);
  backButton.hidden = false;
  backButton.disabled = false;
  const isMc = task.responseType === "mc" || task.type === "multiple_choice";
  if (isMc) {
    nextButton.disabled = answer === null || answer === undefined;
    bodyEl.querySelectorAll(".assessment-option").forEach((button) => {
      button.addEventListener("click", () => {
        quizState.stage2Answers[quizState.questionIndex] = Number(button.dataset.optionIndex);
        renderStage2Task();
      });
    });
  } else {
    const field = bodyEl.querySelector("#assessment-answer-field");
    const updateAnswer = () => {
      quizState.stage2Answers[quizState.questionIndex] = field.value;
      const trimmed = field.value.trim();
      const lengthReady = meetsWrittenLengthGate(task, trimmed);
      const qualityError = lengthReady ? getWrittenQualityError(trimmed, task) : null;
      const valid = isStage2AnswerValid(task, field.value);
      nextButton.disabled = !valid;
      const hint = bodyEl.querySelector(".assessment-char-hint");
      if (task.responseType === "list") {
        const lineCount = field.value.split("\n").filter((line) => line.trim()).length;
        hint.textContent = `${field.value.trim().length} / ${task.minChars} characters minimum · ${lineCount} / ${task.minItems || 3} points`;
      } else if (task.responseType !== "short") {
        hint.textContent = `${field.value.trim().length} / ${task.minChars} characters minimum`;
      }
      hint.classList.toggle("is-valid", valid);
      if (valid || !lengthReady) showStage2FieldError(null);
      else if (qualityError) showStage2FieldError(qualityError);
    };
    field.addEventListener("input", updateAnswer);
    nextButton.disabled = !isStage2AnswerValid(task, answer);
    if (isWrittenTask(task) && answer) {
      const trimmed = (answer || "").trim();
      const qualityError = meetsWrittenLengthGate(task, trimmed) ? getWrittenQualityError(trimmed, task) : null;
      if (qualityError) showStage2FieldError(qualityError);
    }
  }
  nextButton.textContent = quizState.questionIndex === quizState.stage2Tasks.length - 1 ? "View placement result" : "Next";
}

function renderQuizResult() {
  const stage1Score = calculateStage1Score(quizState.stage1Answers);
  const stage2Score = calculateStage2Score(quizState.stage2Tasks, quizState.stage2Answers);
  const itemResults = buildItemResults(quizState.stage1Answers, quizState.stage2Tasks, quizState.stage2Answers);
  const suggestion = buildSuggestionFromScores(stage1Score, stage2Score, quizState.stage2Tasks, itemResults);
  quizState.pendingResult = suggestion;
  setQuizProgress(getTotalQuizSteps(), getTotalQuizSteps(), "Assessment complete");
  const assignedLevel = suggestion.tutorIndex + 1;
  bodyEl.innerHTML = `
    <div class="assessment-result">
      <h2 class="assessment-result-heading">Level ${assignedLevel} · ${suggestion.level}</h2>
    </div>
  `;
  backButton.hidden = true;
  nextButton.disabled = false;
  nextButton.textContent = "Continue";
}

function renderQuizScreen(mode) {
  quizState.screen = mode === "retake" ? "start" : mode;
  if (quizState.screen === "start") { renderQuizStart(mode === "retake"); return; }
  if (quizState.screen === "stage1") { renderStage1Question(); return; }
  if (quizState.screen === "stage2") { renderStage2Task(); return; }
  if (quizState.screen === "result") { renderQuizResult(); }
}

function handleQuizNext() {
  if (quizState.screen === "start") {
    quizState.screen = "stage1";
    quizState.stage = 1;
    renderStage1Question();
    return;
  }
  if (quizState.screen === "stage1") {
    if (quizState.questionIndex < stage1ScreeningQuestions.length - 1) {
      quizState.questionIndex += 1;
      renderStage1Question();
      return;
    }
    const stage1Score = calculateStage1Score(quizState.stage1Answers);
    quizState.stage2Tasks = selectStage2Tasks(stage1Score);
    quizState.stage2Answers = new Array(quizState.stage2Tasks.length).fill(null);
    quizState.stage = 2;
    quizState.screen = "stage2";
    quizState.questionIndex = 0;
    renderStage2Task();
    return;
  }
  if (quizState.screen === "stage2") {
    const task = quizState.stage2Tasks[quizState.questionIndex];
    const answer = quizState.stage2Answers[quizState.questionIndex];
    if (isWrittenTask(task)) {
      const trimmed = (answer || "").trim();
      const qualityError = meetsWrittenLengthGate(task, trimmed)
        ? getWrittenQualityError(trimmed, task)
        : "Please write a real answer in full sentences before continuing.";
      if (!isStage2AnswerValid(task, answer)) {
        if (qualityError) showStage2FieldError(qualityError);
        return;
      }
    }
    if (quizState.questionIndex < quizState.stage2Tasks.length - 1) {
      quizState.questionIndex += 1;
      renderStage2Task();
      return;
    }
    quizState.screen = "result";
    renderQuizResult();
    return;
  }
  if (quizState.screen === "result") {
    if (quizState.pendingResult && !quizState.submitted) {
      saveSuggestedTutor(quizState.pendingResult);
      quizState.submitted = true;
    }
    location.href = "../index.html#citizenship";
  }
}

function handleQuizBack() {
  if (quizState.screen === "result") return;
  if (quizState.screen === "stage2") {
    if (quizState.questionIndex > 0) {
      quizState.questionIndex -= 1;
      renderStage2Task();
      return;
    }
    quizState.screen = "stage1";
    quizState.stage = 1;
    quizState.questionIndex = stage1ScreeningQuestions.length - 1;
    renderStage1Question();
    return;
  }
  if (quizState.screen === "stage1" && quizState.questionIndex > 0) {
    quizState.questionIndex -= 1;
    renderStage1Question();
    return;
  }
  if (quizState.screen === "stage1" && quizState.questionIndex === 0) {
    quizState.screen = "start";
    renderQuizStart(false);
  }
}

function initAssessment() {
  resetQuizState();
  if (window.EvoAssessmentGuard) EvoAssessmentGuard.init(bodyEl);
  const params = new URLSearchParams(location.search);
  if (params.get("required") === "1" && !localStorage.getItem(STORAGE_KEYS.studentProfile)) {
    const intro = document.querySelector(".assessment-intro");
    if (intro) {
      intro.textContent = "Complete this assessment to unlock lessons and get matched with your tutor.";
      intro.classList.add("assessment-intro--required");
    }
  }
  renderQuizScreen(params.get("retake") === "1" ? "retake" : "start");
  nextButton.addEventListener("click", handleQuizNext);
  backButton.addEventListener("click", handleQuizBack);
}

initAssessment();
