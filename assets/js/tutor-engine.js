/**
 * EVOlearn local-first tutor engine
 *
 * Student-facing strings in this file use British English (UK spelling and grammar).
 * Run `node scripts/check-uk-english.mjs` before shipping new copy.
 *
 * Priority order
 * 1. Conversational intents (greetings, confusion, thanks)
 * 2. Quiz wrong-answer / misconception lookup
 * 3. FAQ match (student question bank, slide FAQs, topic FAQs)
 * 4. Stored knowledge lookup (keywords, aliases, token overlap)
 * 5. Slide chunk context
 * 6. Tutor persona wrapper
 * 7. Soft fallback (never a dead end)
 */
(function (global) {
  const TUTOR_PROFILE_BASE = "assets/data/tutors/";
  const MEMORY_KEY = "evoTutorMemory";
  const AI_MEMORY_KEY = "evoTutorAiMemory";
  const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "what", "who", "why", "how", "when", "where", "which", "do", "does", "did",
    "can", "could", "would", "should", "will", "shall", "may", "might",
    "i", "me", "my", "you", "your", "we", "our", "they", "their", "it", "its",
    "this", "that", "these", "those", "about", "tell", "explain", "mean", "means",
    "please", "just", "also", "and", "or", "but", "if", "in", "on", "at", "to", "for",
    "of", "with", "from", "by", "as", "so", "not", "no", "yes", "ok", "okay",
  ]);

  const CONFUSION_PATTERNS = [
    /\b(don'?t understand|dont understand|do not understand|not understand)\b/,
    /\b(don'?t know|dont know|do not know|no clue|haven'?t a clue|havent a clue)\b/,
    /\b(confused|confusing|lost|stuck|no idea|unclear|not sure)\b/,
    /\bwhat do you mean\b/,
    /\bwhat does that mean\b/,
    /\bcan you explain (that|this|again|more|it)\b/,
    /\bhelp me understand\b/,
    /\b(explain again|say that again)\b/,
    /\b(i am lost|im lost|makes no sense|doesn'?t make sense|doesnt make sense)\b/,
    /\b(what is this|what's this|whats this|what am i looking at)\b/,
  ];

  const GREETING_PATTERNS = [
    /^(hi+|hello+|hey+|hiya|howdy|yo|sup)(\s|$)/,
    /\b(hi mate|hello mate|hey mate|hi there|hello there|hey there|good day)\b/,
    /\b(good morning|good afternoon|good evening|g day|g morning|g afternoon|g evening)\b/,
  ];

  const THANKS_PATTERNS = [
    /^(thanks|thank you|thank u|thx|cheers|ta|much appreciated|appreciate it)(\s|$)/,
    /\b(thank you|thanks mate|thanks a lot|cheers mate)\b/,
  ];

  const GOODBYE_PATTERNS = [
    /^(bye|goodbye|good bye|see you|see ya|see u|later|laters|cya|finished|done|i'?m done|im done)(\s|$)/,
    /\b(see you later|catch you later|got to go|gotta go)\b/,
  ];

  const SMALLTALK_PATTERNS = [
    /^how are you(\s|$)/,
    /\b(how r u|how are u|hows it going|how's it going|how is it going)\b/,
    /\b(you ok|you alright|are you ok|are you alright)\b/,
    /^(ok|okay|cool|nice|alright|k)(\s|$)/,
  ];

  const PERSONAL_SHARE_PATTERNS = [
    /^(i am|i'm|im)\s+.+/,
    /^(my name is|call me|people call me)\s+.+/,
    /\b(i feel like|i see myself as|i'm a|im a)\s+.+/,
  ];

  const FOLLOWUP_PATTERNS = [
    /^(yes|yeah|yep|yup|ok|okay|sure|please|go on|continue|more|explain more|tell me more|that one|explain that|explain it)$/,
  ];

  const COMMAND_WORD_PATTERNS = [
    { word: "evaluate", pattern: /\bevaluate\b/ },
    { word: "assess", pattern: /\bassess\b/ },
    { word: "explain", pattern: /\bexplain\b/ },
    { word: "define", pattern: /\bdefine\b/ },
    { word: "describe", pattern: /\bdescribe\b/ },
    { word: "analyse", pattern: /\banalys[ei]\b/ },
    { word: "compare", pattern: /\bcompare\b/ },
  ];

  const tutorProfileCache = new Map();
  let synonymsData = null;

  function namespacedKey(baseKey) {
    try {
      const uid = global.EvoStudentAuth?.getCurrentUser?.()?.uid || "";
      return uid ? `${baseKey}:${uid}` : baseKey;
    } catch {
      return baseKey;
    }
  }

  function normalizeText(text) {
    return String(text || "").toLowerCase().replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
  }

  async function ensureSynonyms(basePath) {
    if (synonymsData) return synonymsData;
    const knowledge = global.EvoAgentKnowledge;
    if (knowledge?.loadSynonyms) {
      synonymsData = await knowledge.loadSynonyms(basePath);
    } else {
      synonymsData = { terms: {} };
    }
    return synonymsData;
  }

  function expandSynonyms(text, synonymMap) {
    const normalized = normalizeText(text);
    const extras = [];
    for (const [key, values] of Object.entries(synonymMap?.terms || {})) {
      const keyNorm = normalizeText(key);
      if (normalized.includes(keyNorm)) {
        extras.push(keyNorm, ...values.map(normalizeText));
      }
      for (const value of values) {
        const valueNorm = normalizeText(value);
        if (normalized.includes(valueNorm)) {
          extras.push(keyNorm, valueNorm);
        }
      }
    }
    return extras;
  }

  function tokenize(text, synonymMap) {
    const base = normalizeText(text)
      .split(" ")
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
    const extras = expandSynonyms(text, synonymMap).flatMap((phrase) => phrase.split(" "))
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
    return [...new Set([...base, ...extras])];
  }

  function looksLikeAcademicQuestion(message) {
    const text = normalizeText(message);
    if (!text) return false;
    if (text.includes("?")) return true;
    return /\b(what is|what are|who is|who are|why is|why are|why do|how does|how do|define|describe|tell me about|explain the|explain what)\b/.test(text);
  }

  function detectIntent(message) {
    const raw = String(message || "").trim();
    if (/^\?+$/.test(raw)) return "confusion";

    const text = normalizeText(message);
    if (!text) return null;

    if (THANKS_PATTERNS.some((pattern) => pattern.test(text))) return "thanks";
    if (GOODBYE_PATTERNS.some((pattern) => pattern.test(text))) return "goodbye";
    if (GREETING_PATTERNS.some((pattern) => pattern.test(text))) return "greeting";
    if (SMALLTALK_PATTERNS.some((pattern) => pattern.test(text))) return "smalltalk";

    if (!looksLikeAcademicQuestion(message)) {
      if (CONFUSION_PATTERNS.some((pattern) => pattern.test(text))) return "confusion";
      if (/^(what|huh|eh|um+|uh+|idk|dunno|i don'?t know|i dont know|i do not know)$/.test(text)) {
        return "confusion";
      }
    }

    if (PERSONAL_SHARE_PATTERNS.some((pattern) => pattern.test(text))) return "personal";

    return null;
  }

  function isFollowUp(message) {
    return FOLLOWUP_PATTERNS.some((pattern) => pattern.test(normalizeText(message)));
  }

  function echoUserMessage(message) {
    const text = String(message || "").trim();
    if (!text || text.length > 100) return null;

    const identityMatch = text.match(/^(?:I am|I'm|Im)\s+(.+)/i);
    if (identityMatch) return `you said you are ${identityMatch[1].trim()}`;

    const nameMatch = text.match(/^(?:my name is|call me|people call me)\s+(.+)/i);
    if (nameMatch) return `you said your name is ${nameMatch[1].trim()}`;

    if (text.length <= 60) return `you said "${text}"`;
    return null;
  }

  function detectPersonalStatement(message) {
    const text = normalizeText(message);
    return /^(i am|i'm|im|my name is|i feel like|i'm a|im a)\b/.test(text);
  }

  function loadMemory() {
    try {
      const raw = global.sessionStorage?.getItem(namespacedKey(MEMORY_KEY));
      return raw ? JSON.parse(raw) : { exchanges: [] };
    } catch {
      return { exchanges: [] };
    }
  }

  function saveMemory(update) {
    try {
      const memory = loadMemory();
      const next = { ...memory, ...update };
      if (next.exchanges?.length > 3) {
        next.exchanges = next.exchanges.slice(-3);
      }
      global.sessionStorage?.setItem(namespacedKey(MEMORY_KEY), JSON.stringify(next));
    } catch {
      /* sessionStorage unavailable */
    }
  }

  function loadAiMemory() {
    try {
      const raw = global.sessionStorage?.getItem(namespacedKey(AI_MEMORY_KEY));
      const data = raw ? JSON.parse(raw) : { turns: [] };
      if (!data || typeof data !== "object") return { turns: [] };
      if (!Array.isArray(data.turns)) return { turns: [] };
      return { turns: data.turns };
    } catch {
      return { turns: [] };
    }
  }

  function saveAiMemory(turns) {
    try {
      const trimmed = Array.isArray(turns) ? turns.slice(-6) : [];
      global.sessionStorage?.setItem(namespacedKey(AI_MEMORY_KEY), JSON.stringify({ turns: trimmed }));
    } catch {
      /* sessionStorage unavailable */
    }
  }

  function recordAiTurn(role, text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    const memory = loadAiMemory();
    const turns = [...(memory.turns || []), { role, text: clean }];
    saveAiMemory(turns);
  }

  function chatModeFromDom(root) {
    const mode = root?.body?.dataset?.chatMode || root?.documentElement?.dataset?.chatMode;
    const cleaned = String(mode || "").trim().toLowerCase();
    return cleaned || "live";
  }

  async function getFirebaseIdToken() {
    try {
      const user = global.EvoStudentAuth?.getCurrentUser?.();
      if (!user?.uid) return null;
      if (typeof user.getIdToken === "function") return await user.getIdToken();
      return null;
    } catch {
      return null;
    }
  }

  function recordExchange(message, result, slideContext) {
    if (result?.text) result.text = sanitizeChatDashes(result.text);
    const memory = loadMemory();
    const exchanges = [...(memory.exchanges || []), {
      message,
      source: result.source,
      slideIndex: slideContext?.slideIndex ?? null,
      topicId: result.topicId || memory.lastTopicId || null,
    }];
    saveMemory({
      exchanges,
      lastIntent: result.source?.startsWith("intent:") ? result.source.replace("intent:", "") : memory.lastIntent,
      lastSlide: slideContext?.slideIndex ?? memory.lastSlide,
      lastTopicId: result.topicId || memory.lastTopicId,
      lastSource: result.source,
      lastText: result.text,
    });
  }

  async function loadTutorProfile(agentId, basePath) {
    if (!agentId) return null;
    const slug = String(agentId).toLowerCase();
    const cacheKey = `${basePath || ""}${slug}`;
    if (tutorProfileCache.has(cacheKey)) return tutorProfileCache.get(cacheKey);

    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${TUTOR_PROFILE_BASE}${slug}.json`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      tutorProfileCache.set(cacheKey, data);
      return data;
    } catch {
      tutorProfileCache.set(cacheKey, null);
      return null;
    }
  }

  function tutorDisplayName(agent, tutorProfile) {
    return tutorProfile?.name || agent?.name || "Your tutor";
  }

  function pickCatchphrase(agent, tutorProfile) {
    return tutorProfile?.catchphrase || agent?.catchphrase || "";
  }

  function exampleText(value) {
    if (!value) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || null;
    }
    if (typeof value === "object") {
      for (const key of ["text", "example", "message"]) {
        if (typeof value[key] === "string") {
          const trimmed = value[key].trim();
          if (trimmed) return trimmed;
        }
      }
    }
    return null;
  }

  function pickFromExampleList(values) {
    if (!Array.isArray(values) || !values.length) return null;
    const item = values[Math.floor(Math.random() * values.length)];
    return exampleText(item);
  }

  function pickExampleField(examples, keys) {
    if (!examples) return null;
    for (const key of keys) {
      const value = examples[key];
      const direct = exampleText(value);
      if (direct) return direct;
      const fromList = pickFromExampleList(value);
      if (fromList) return fromList;
    }
    return null;
  }

  function pickGreetingExample(examples) {
    return pickExampleField(examples, ["greeting", "greetings"]);
  }

  function revisionMemoryHook(lessonContent, style) {
    const keyPoint = lessonContent?.keyPoints?.[0];
    if (!keyPoint) return null;
    switch (style) {
      case "marks":
        return `Exam hook: ${keyPoint}`;
      case "precise":
        return `Pin this: ${keyPoint}`;
      case "stretch":
        return `Stretch it: ${keyPoint}`;
      case "steps":
        return `Step recall: ${keyPoint}`;
      case "lively":
        return `Hot fact: ${keyPoint}`;
      case "context":
        return `Big picture: ${keyPoint}`;
      default:
        return `Remember: ${keyPoint}`;
    }
  }

  function defaultRevisionGreeting(name, topicTitle, style) {
    switch (style) {
      case "gentle":
        return `${name} here in revision mode. Quick recap of ${topicTitle}. Ask for key facts or a memory jog.`;
      case "steps":
        return `${name} in revision coach mode. ${topicTitle}: ask for a fact check or exam hook.`;
      case "warm":
        return `${name} for revision. You know ${topicTitle} already. Ask for a quick recap or exam reminder.`;
      case "calm":
        return `${name} in revision mode. ${topicTitle}. Name a topic and I will give you the key facts.`;
      case "stretch":
        return `${name} revision coach. ${topicTitle}. Ask for stretch points or exam hooks.`;
      case "lively":
        return `${name} in revision mode. ${topicTitle}. Fire a quick question or ask for a hot fact.`;
      case "marks":
        return `${name} revision coach. ${topicTitle}. Command words and mark hooks. What do you need?`;
      case "context":
        return `${name} in revision mode. ${topicTitle}. Ask for connections or key facts to remember.`;
      case "precise":
        return `${name} revision coach. ${topicTitle}. Ask for precise facts or exam lines.`;
      default:
        return `${name} in revision mode for ${topicTitle}. Ask for key facts or a quick recap.`;
    }
  }

  function pickRevisionGreeting(agent, tutorProfile, slideContext, lessonContent) {
    const custom = pickRevisionGreetingExample(tutorProfile?.examples);
    if (custom) return sanitizeChatDashes(applyExampleTokens(custom, slideContext, lessonContent));
    const name = tutorDisplayName(agent, tutorProfile);
    const topicTitle = lessonContent?.topicTitle || "this lesson";
    const label = slideLabel(slideContext);
    const style = tutorVoiceStyle(agent, tutorProfile);
    return sanitizeChatDashes(`${defaultRevisionGreeting(name, topicTitle, style)} You are on ${label}.`);
  }

  function pickFeedbackExample(examples) {
    return pickExampleField(examples, ["feedback"]);
  }

  function pickEncouragementExample(examples) {
    return pickExampleField(examples, ["encouragement", "encouragements"]);
  }

  function pickHintExample(examples) {
    return pickExampleField(examples, ["hint", "hints"]);
  }

  function pickEndOfLessonExample(examples) {
    return pickExampleField(examples, ["endOfLesson", "completionMessage"]);
  }

  function resolveRevisionMode(options, slideContext) {
    if (options?.revisionMode) return true;
    if (slideContext?.revisionMode) return true;
    if (global.EvoLessonPptViewer?.detectRevisionMode?.()) return true;
    if (global.document?.body?.dataset?.lessonMode === "revision") return true;
    return false;
  }

  function pickRevisionGreetingExample(examples) {
    const direct = pickExampleField(examples, ["revisionGreeting", "revisionGreetings"]);
    if (direct) return direct;
    if (examples?.revision) {
      return pickExampleField(examples.revision, ["greeting", "greetings"]);
    }
    return null;
  }

  function revisionChatPlaceholder(tutorName) {
    return `Ask ${tutorName} for key facts…`;
  }

  function getSlideChatPlaceholder(level, tutorName, slideChunk, revisionMode) {
    if (revisionMode) return revisionChatPlaceholder(tutorName);
    const name = tutorName || "your tutor";
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    const term = slideChunk?.terms?.[0];
    if (band <= 3) {
      return term
        ? `Ask ${name} what "${term}" means…`
        : `Ask ${name} about a word on this slide…`;
    }
    if (band <= 6) {
      return term
        ? `Ask ${name} how "${term}" fits this slide…`
        : `Ask ${name} to explain this slide…`;
    }
    return term
      ? `Ask ${name} how to write "${term}" in an exam answer…`
      : `Ask ${name} about command words on this slide…`;
  }

  function applyExampleTokens(text, slideContext, lessonContent) {
    const label = slideLabel(slideContext);
    const topicTitle = lessonContent?.topicTitle || "this lesson";
    return String(text || "")
      .replace(/\{slide\}/g, label)
      .replace(/\{topic\}/g, topicTitle);
  }

  function pickGreeting(agent, tutorProfile, slideContext, lessonContent, revisionMode) {
    if (revisionMode) {
      return pickRevisionGreeting(agent, tutorProfile, slideContext, lessonContent);
    }
    const greeting = pickGreetingExample(tutorProfile?.examples);
    if (greeting) return sanitizeChatDashes(applyExampleTokens(greeting, slideContext, lessonContent));
    return sanitizeChatDashes(`Hello. I am ${tutorDisplayName(agent, tutorProfile)}, your tutor for this lesson. Ask me about what is on screen or anything from this topic.`);
  }

  function getSlideChunkFromTopic(lessonContent, slideIndex) {
    if (slideIndex == null || !lessonContent?.slides) return null;
    return lessonContent.slides[String(slideIndex)] || null;
  }

  function slideLabel(slideContext, slideChunk) {
    const title = slideChunk?.title || slideContext?.title;
    if (!slideContext && !slideChunk) return "this slide";
    if (title) return `"${title}"`;
    return "this slide";
  }

  function slideScriptSnippet(slideChunk, level) {
    if (!slideChunk?.script) return null;
    const script = String(slideChunk.script).trim();
    if (!script) return null;
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    if (band <= 3) return sentences.slice(0, 2).join(" ").trim();
    if (band <= 5) return sentences.slice(0, 3).join(" ").trim();
    return script.length > 420 ? `${script.slice(0, 417).trim()}…` : script;
  }

  function levelBand(level) {
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    if (band <= 3) return "foundation";
    if (band <= 6) return "developing";
    return "exam";
  }

  function clipSentences(text, maxSentences) {
    if (!text) return null;
    const script = String(text).trim();
    if (!script) return null;
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    return sentences.slice(0, maxSentences).join(" ").trim();
  }

  function pickSlideLevelKeyPoint(lessonContent, slideChunk, message, synonymMap) {
    const points = lessonContent?.keyPoints || [];
    if (!points.length) return null;
    if (message) {
      const picked = pickRelevantKeyPoint(message, lessonContent, synonymMap);
      if (picked) return picked;
    }
    if (!slideChunk?.terms?.length) return points[0];
    const termTokens = slideChunk.terms.flatMap((term) => tokenize(term, synonymMap));
    let best = points[0];
    let bestScore = 0;
    for (const point of points) {
      const score = phraseOverlapScore(termTokens, point);
      if (score > bestScore) {
        bestScore = score;
        best = point;
      }
    }
    return best;
  }

  function buildLevelContentLines(lessonContent, level, slideChunk, synonymMap, message) {
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    const parts = [];
    const keyPoint = pickSlideLevelKeyPoint(lessonContent, slideChunk, message, synonymMap);

    if (band <= 3) {
      if (keyPoint) parts.push(keyPoint);
      else if (lessonContent?.summary) parts.push(clipSentences(lessonContent.summary, 1));
    } else if (band <= 6) {
      if (keyPoint) parts.push(keyPoint);
      const summary = lessonContent?.summary;
      if (summary && (!keyPoint || normalizeText(summary) !== normalizeText(keyPoint))) {
        parts.push(summary);
      }
      if (band >= 5) parts.push("Link what you see on screen to GCSE Citizenship examples.");
    } else {
      if (keyPoint) parts.push(keyPoint);
      if (lessonContent?.explainLike) parts.push(lessonContent.explainLike);
      if (band >= 8) {
        parts.push("Aim for a substantiated judgement, not just a list of facts.");
      }
    }
    return parts;
  }

  function buildSlidePromptTail(level, slideChunk, topicTitle) {
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    const terms = slideChunk?.terms || [];
    const firstTerm = terms[0];

    if (band <= 3) {
      if (terms.length >= 2) {
        return `Try asking: "What does ${terms[0]} mean?" or pick a word from: ${terms.slice(0, 3).join(", ")}.`;
      }
      return "Pick one word from the slide and I will explain it in plain words.";
    }
    if (band <= 6) {
      if (firstTerm) {
        return `Try asking how "${firstTerm}" links to ${topicTitle || "this topic"} for AO2 application.`;
      }
      return "Ask how an idea on this slide would work in a school or community example.";
    }
    if (firstTerm) {
      return `Try: "How would I explain ${firstTerm} in an exam answer?" or name a command word you are unsure about.`;
    }
    return "Name a command word or mark you are chasing on this slide.";
  }

  function slideHint(slideContext, lessonContent, slideChunk) {
    const chunk = slideChunk || getSlideChunkFromTopic(lessonContent, slideContext?.slideIndex);
    if (chunk?.hint) return chunk.hint;
    const scriptLine = slideScriptSnippet(chunk, lessonContent?.level || 1);
    if (scriptLine) return scriptLine;
    if (chunk?.title) return `we are on ${chunk.title.toLowerCase()}`;
    if (slideContext?.note) return slideContext.note;
    if (slideContext?.title) return `we are looking at ${slideContext.title.toLowerCase()}`;
    if (lessonContent?.summary) return lessonContent.summary;
    return "we are working through this lesson together";
  }

  function tutorVoiceStyle(agent, tutorProfile) {
    if (tutorProfile?.voiceStyle) return tutorProfile.voiceStyle;
    const id = (agent?.id || tutorProfile?.id || "nova").toLowerCase();
    const styles = {
      nova: "gentle",
      milo: "steps",
      ava: "warm",
      kai: "calm",
      zara: "stretch",
      theo: "lively",
      nia: "marks",
      elias: "context",
      athena: "precise",
    };
    return styles[id] || "clear";
  }

  function styleConfusionExtra(style, lessonContent) {
    const keyPoint = lessonContent?.keyPoints?.[0];
    switch (style) {
      case "gentle":
        return keyPoint ? ` One idea: ${keyPoint}` : "";
      case "steps":
        return " Here is what to do first: read the question, then pick one word from the slide.";
      case "warm":
        return " You already know more than you think. We will build from one small piece.";
      case "calm":
        return " Step 1 only: name one word or idea on this slide. We will add the next step after.";
      case "stretch":
        return keyPoint ? ` Stretch one sentence: ${keyPoint}` : " Stretch one sentence using a because link.";
      case "lively":
        return " Tell me why you feel stuck. What part of the slide is unclear?";
      case "marks":
        return " Name one mark you can secure from what is on screen, then we build from there.";
      case "context":
        return keyPoint ? ` Connect it to the wider picture: ${keyPoint}` : " Connect what you see to one citizenship idea on screen.";
      case "precise":
        return " Sharpen one line: pick the most precise word on screen and ask about that.";
      default:
        return keyPoint ? ` One idea: ${keyPoint}` : "";
    }
  }

  function buildPersonalReply(echo, encouragement, tutorProfile, topicTitle, label, hintLower, style) {
    const lead = echo
      ? `${echo.charAt(0).toUpperCase() + echo.slice(1)}.`
      : `${(encouragement || "That is a good start.").split(".")[0]}.`;
    const profileHint = pickHintExample(tutorProfile?.examples);
    const topicLink = profileHint || `On ${label}, ${hintLower}.`;

    switch (style) {
      case "steps":
        return `${lead} ${topicLink} Step 1: pick one word from ${topicTitle} that fits what you shared.`;
      case "lively":
        return `${lead} Tell me why that matters to you. Then we will link it to ${topicTitle} on ${label}.`;
      case "marks":
        return `${lead} ${topicLink} Which part of ${topicTitle} would you connect that to for a mark?`;
      case "precise":
        return `${lead} ${topicLink} Refine one line that links your view to ${topicTitle}.`;
      case "context":
        return `${lead} ${topicLink} How does that connect to the bigger picture in ${topicTitle}?`;
      default:
        return `${lead} ${topicLink} What word or idea from ${topicTitle} would you connect that to?`;
    }
  }

  function buildRevisionSmalltalkReply(name, label, style) {
    switch (style) {
      case "marks":
        return `Ready for revision. On ${label}, which fact or command word should we drill first?`;
      case "lively":
        return `Revision mode on. ${name} here. On ${label}, what do you want to lock in?`;
      case "precise":
        return `Good to recap. On ${label}, name the fact or term you want sharpened.`;
      default:
        return `Revision coach mode. On ${label}, ask for a key fact or memory hook.`;
    }
  }

  function buildSmalltalkReply(name, label, style) {
    switch (style) {
      case "gentle":
        return `I am here and ready to help. You are on ${label}. What would you like help with first?`;
      case "steps":
        return `Ready when you are. On ${label}, tell me one word or idea and we will take step one together.`;
      case "warm":
        return `Doing well. You are on ${label}. What feels unclear right now? We can build from there.`;
      case "calm":
        return `Everything is set. On ${label}, name one step you want to work on and we will go through it.`;
      case "stretch":
        return `Good to see you. On ${label}, which idea should we stretch first?`;
      case "lively":
        return `All good here, ${name}. You are on ${label}. What are you thinking about on this slide?`;
      case "marks":
        return `Ready when you are. You are on ${label}. Which command word or idea should we tackle first?`;
      case "context":
        return `Good to continue. On ${label}, what connection or bigger idea are you wondering about?`;
      case "precise":
        return `Good to continue. You are on ${label}. What line of argument or idea shall we refine?`;
      default:
        return `All good here. You are on ${label}. What would you like help with on this slide?`;
    }
  }

  function pickWordBank(slideChunk, content, level) {
    const terms = slideChunk?.terms || [];
    if (terms.length >= 2 && level <= 3) {
      return `Try one of these words: ${terms.slice(0, 4).join(", ")}.`;
    }
    const points = content?.keyPoints || [];
    if (points.length && level <= 4) {
      const words = points[0].split(/\s+/).filter((w) => w.length > 4).slice(0, 3);
      if (words.length) return `Try asking about: ${words.join(", ")}.`;
    }
    return "Pick one word from the slide and I will explain it.";
  }

  function faqMatchesMessage(message, faq, level) {
    const text = normalizeText(message);
    if (!text) return false;
    if (faq.levelMin && level < faq.levelMin) return false;
    if (faq.levelMax && level > faq.levelMax) return false;
    return (faq.patterns || []).some((pattern) => {
      const p = normalizeText(pattern);
      return text.includes(p) || p.split(" ").every((word) => text.includes(word));
    });
  }

  function findFaqMatch(message, faqs, level) {
    if (!faqs?.length) return null;
    for (const faq of faqs) {
      if (faqMatchesMessage(message, faq, level)) return faq;
    }
    return null;
  }

  function studentQuestionMatchesMessage(message, question, level) {
    const text = normalizeText(message);
    if (!text) return false;
    if (question.levelMin && level < question.levelMin) return false;
    if (question.levelMax && level > question.levelMax) return false;
    return (question.patterns || []).some((pattern) => text.includes(normalizeText(pattern)));
  }

  function scoreStudentQuestion(question, slideIndex, message) {
    const text = normalizeText(message);
    let score = 0;
    for (const pattern of question.patterns || []) {
      const p = normalizeText(pattern);
      if (!text.includes(p)) continue;
      score = Math.max(score, p.length);
    }
    if (!score) return 0;
    if (slideIndex != null && question.slideIndex != null) {
      if (question.slideIndex === slideIndex) score += 100;
      else score -= 1;
    }
    return score;
  }

  function pickStudentQuestionAnswer(question, level) {
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    if (band <= 2 && question.tutorHint) return question.tutorHint;
    return question.answer;
  }

  async function findStudentQuestionMatch(message, lessonId, level, basePath, slideContext) {
    const knowledge = global.EvoAgentKnowledge;
    if (!knowledge?.loadStudentQuestionsForLesson || !lessonId) return null;

    const bank = await knowledge.loadStudentQuestionsForLesson(lessonId, basePath);
    if (!bank?.questions?.length) return null;

    const slideIndex = slideContext?.slideIndex ?? null;
    let best = null;
    let bestScore = 0;

    for (const question of bank.questions) {
      if (!studentQuestionMatchesMessage(message, question, level)) continue;
      const score = scoreStudentQuestion(question, slideIndex, message);
      if (score > bestScore) {
        bestScore = score;
        best = question;
      }
    }

    if (!best) return null;
    return { question: best, bank };
  }

  async function findFaqAcrossLesson(message, lessonId, level, basePath, slideContext) {
    const knowledge = global.EvoAgentKnowledge;
    if (!knowledge?.getAllLessonContent) return null;

    const all = await knowledge.getAllLessonContent(lessonId, level, basePath);
    for (const { content } of all) {
      const faq = findFaqMatch(message, content.faqs, level);
      if (faq) return { faq, content };

      if (slideContext?.slideIndex != null && content.slides) {
        const chunk = content.slides[String(slideContext.slideIndex)];
        if (chunk?.faqs) {
          const slideFaq = findFaqMatch(message, chunk.faqs, level);
          if (slideFaq) return { faq: slideFaq, content, slideChunk: chunk };
        }
      }
    }
    return null;
  }

  function findMisconception(quizContext, content) {
    if (!quizContext?.wrongOption || !content?.misconceptions?.length) return null;
    const wrong = normalizeText(quizContext.wrongOption);
    for (const item of content.misconceptions) {
      if (normalizeText(item.wrong) === wrong) return item;
      if (item.patterns?.some((p) => wrong.includes(normalizeText(p)))) return item;
    }
    return null;
  }

  function buildQuizReply(quizContext, content, agent, tutorProfile, level, personaOpts) {
    const misconception = findMisconception(quizContext, content);
    const parts = personaOpts?.revisionMode
      ? ["Not quite."]
      : [pickFeedbackExample(tutorProfile?.examples) || "You tried, and that matters."];

    if (misconception?.correction) {
      parts.push(misconception.correction);
    } else if (content?.keyPoints?.[0]) {
      parts.push(content.keyPoints[0]);
    }

    if (quizContext.correctOption) {
      parts.push(personaOpts?.revisionMode
        ? `Correct: ${quizContext.correctOption}.`
        : `The stronger answer is: ${quizContext.correctOption}.`);
    }

    return wrapInPersona(parts, agent, tutorProfile, level, personaOpts);
  }

  function buildIntentReply(intent, agent, tutorProfile, lessonContent, slideContext, message, level, slideChunk, revisionMode) {
    const name = tutorDisplayName(agent, tutorProfile);
    const catchphrase = pickCatchphrase(agent, tutorProfile);
    const topicTitle = lessonContent?.topicTitle || "this lesson";
    const label = slideLabel(slideContext, slideChunk);
    const hint = slideHint(slideContext, lessonContent, slideChunk);
    const hintSentence = hint.charAt(0).toUpperCase() + hint.slice(1).replace(/\.$/, "") + ".";
    const hintLower = hint.charAt(0).toLowerCase() + hint.slice(1).replace(/\.$/, "");
    const scriptLine = slideScriptSnippet(slideChunk, level);
    const style = tutorVoiceStyle(agent, tutorProfile);
    const examples = tutorProfile?.examples;
    const encouragement = pickEncouragementExample(examples);
    const wordBank = pickWordBank(slideChunk, lessonContent, level);

    switch (intent) {
      case "greeting": {
        if (revisionMode) {
          return pickRevisionGreeting(agent, tutorProfile, slideContext, lessonContent);
        }
        const greeting = pickGreetingExample(examples);
        if (greeting) return applyExampleTokens(greeting, slideContext, lessonContent);
        return `Hello. I am ${name}, your tutor. You are on ${label} in ${topicTitle}. ${hintSentence} Ask me anything about what you see, or tell me if something feels confusing.`;
      }
      case "thanks": {
        if (revisionMode) {
          return style === "marks"
            ? "Good. Keep testing yourself before the exam."
            : "Good. Ask if you want another quick recap.";
        }
        const feedback = pickFeedbackExample(examples);
        if (feedback) return `${feedback.split(".")[0]}. You are welcome.`;
        if (style === "gentle" && catchphrase) {
          return `You are welcome. Keep going at your own pace. ${catchphrase}`;
        }
        return catchphrase
          ? `You are welcome. ${catchphrase}`
          : `You are welcome. Ask if you want another part of ${label} explained.`;
      }
      case "confusion": {
        if (revisionMode) {
          const hook = revisionMemoryHook(lessonContent, style);
          if (hook) return `${hook} Which bit do you want to test?`;
          const recap = scriptLine || hintLower;
          return `Quick recap on ${label}: ${recap}. Ask for a key term if you need one.`;
        }
        const lead = encouragement || "That is okay. We can slow down.";
        const tutorHint = pickHintExample(examples);
        const extra = styleConfusionExtra(style, lessonContent);
        const slideContextLine = scriptLine
          ? `On ${label}: ${scriptLine}`
          : `On ${label}, ${hintLower}.`;
        if (tutorHint) {
          return `${lead} ${tutorHint}${extra} ${wordBank}`;
        }
        return `${lead} ${slideContextLine}${extra} ${wordBank}`;
      }
      case "goodbye": {
        if (revisionMode) {
          return style === "marks"
            ? "Solid revision. Test yourself again before the exam."
            : "Good revision session. See you before the exam.";
        }
        const closing = pickEndOfLessonExample(examples);
        if (closing) return closing;
        return catchphrase
          ? `Good work today. ${catchphrase}`
          : `Good work today. Come back to ${topicTitle} whenever you want to review.`;
      }
      case "smalltalk":
        return revisionMode
          ? buildRevisionSmalltalkReply(name, label, style)
          : buildSmalltalkReply(name, label, style);
      case "personal": {
        const echo = echoUserMessage(message);
        return buildPersonalReply(echo, encouragement, tutorProfile, topicTitle, label, hintLower, style);
      }
      default:
        return null;
    }
  }

  function phraseOverlapScore(messageTokens, phrase) {
    const phraseTokens = normalizeText(phrase).split(" ").filter((word) => word.length > 2 && !STOP_WORDS.has(word));
    if (!phraseTokens.length || !messageTokens.length) return 0;
    let score = 0;
    for (const token of messageTokens) {
      if (phraseTokens.includes(token)) score += 1;
    }
    return score;
  }

  function scoreTopicMatch(message, topicMeta, content, synonymMap) {
    const messageTokens = tokenize(message, synonymMap);
    if (!messageTokens.length) return 0;

    let score = 0;
    score += phraseOverlapScore(messageTokens, topicMeta.topicTitle) * 3;
    for (const theme of topicMeta.themes || content.themes || []) {
      score += phraseOverlapScore(messageTokens, theme) * 2;
    }
    for (const keyword of content.keywords || []) {
      score += phraseOverlapScore(messageTokens, keyword) * 3;
    }
    for (const alias of content.aliases || []) {
      if (normalizeText(message).includes(normalizeText(alias))) score += 4;
      score += phraseOverlapScore(messageTokens, alias) * 2;
    }
    score += phraseOverlapScore(messageTokens, content.summary) * 2;
    for (const point of content.keyPoints || []) {
      score += phraseOverlapScore(messageTokens, point);
    }
    score += phraseOverlapScore(messageTokens, content.explainLike);

    const normalizedMessage = normalizeText(message);
    const topicSlug = (topicMeta.topicId || "").replace(/-/g, " ");
    if (topicSlug && normalizedMessage.includes(topicSlug)) score += 4;

    return score;
  }

  function scoreSlideMatch(message, slideContext, synonymMap, slideChunk) {
    if (!slideContext && !slideChunk) return 0;
    const messageTokens = tokenize(message, synonymMap);
    let score = 0;
    const title = slideContext?.title || slideChunk?.title;
    if (title) score += phraseOverlapScore(messageTokens, title) * 2;
    if (slideContext?.note) score += phraseOverlapScore(messageTokens, slideContext.note);
    if (slideChunk?.hint) score += phraseOverlapScore(messageTokens, slideChunk.hint);
    for (const term of slideChunk?.terms || []) {
      score += phraseOverlapScore(messageTokens, term);
    }
    if (/\b(slide|screen|here|this|on screen)\b/.test(normalizeText(message))) score += 2;
    return score;
  }

  async function findBestTopicMatch(message, lessonId, level, basePath, synonymMap) {
    const knowledge = global.EvoAgentKnowledge;
    if (!knowledge?.getAllLessonContent) return null;

    const all = await knowledge.getAllLessonContent(lessonId, level, basePath);
    if (!all.length) return null;

    let best = null;
    let bestScore = 0;

    for (const { topicMeta, content } of all) {
      const score = scoreTopicMatch(message, topicMeta, content, synonymMap);
      if (score > bestScore) {
        bestScore = score;
        best = { topicMeta, content, score };
      }
    }

    if (best && bestScore >= 2) return best;
    return bestScore > 0 ? best : null;
  }

  function pickRelevantKeyPoint(message, content, synonymMap) {
    const points = content.keyPoints || [];
    if (!points.length) return null;
    const messageTokens = tokenize(message, synonymMap);
    let best = points[0];
    let bestScore = 0;
    for (const point of points) {
      const score = phraseOverlapScore(messageTokens, point);
      if (score > bestScore) {
        bestScore = score;
        best = point;
      }
    }
    return best;
  }

  function detectCommandWord(message, commandWords, level) {
    const text = normalizeText(message);
    for (const { word, pattern } of COMMAND_WORD_PATTERNS) {
      if (!pattern.test(text)) continue;
      const entry = commandWords?.[word];
      if (!entry) continue;
      if (entry.levelMin && level < entry.levelMin) continue;
      return { word, template: entry.template };
    }
    return null;
  }

  function stripDuplicateSentences(parts) {
    const seen = new Set();
    const output = [];
    for (const part of parts) {
      const trimmed = String(part || "").trim();
      if (!trimmed) continue;
      const key = normalizeText(trimmed);
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(trimmed);
    }
    return output;
  }

  function sanitizeChatDashes(text) {
    return sanitizeStudentText(String(text).replace(/\s*[—–]\s*/g, ". "));
  }

  /** Light UK English normalisation for student-visible tutor chat (not CSS/code). */
  function sanitizeStudentText(text) {
    return String(text || "")
      .replace(/\btoward\b/gi, "towards")
      .replace(/\borganiz(e|es|ed|ing)\b/gi, (_, tail) => `organis${tail}`)
      .replace(/\bbehavior(s)?\b/gi, (_, tail) => `behaviour${tail || ""}`)
      .replace(/\brecogniz(e|es|ed|ing)\b/gi, (_, tail) => `recognis${tail}`)
      .replace(/\banalyz(e|es|ed|ing)\b/gi, (_, tail) => `analys${tail}`)
      .replace(/\bfavorites?\b/gi, (m) => m.replace(/favorite/i, "favourite"))
      .replace(/\bdefense\b/gi, "defence")
      .replace(/\bcenters?\b/gi, (m) => m.replace(/center/i, "centre"))
      .replace(/\bcolors?\b/gi, (m) => m.replace(/color/i, "colour"))
      .replace(/\bcustomiz(e|es|ed|ing)\b/gi, (_, tail) => `customis${tail}`)
      .replace(/\bneighbor(s|hood|hoods)?\b/gi, (_, tail) => `neighbour${tail || ""}`)
      .replace(/\bhonor(s|ed|ing)?\b/gi, (_, tail) => `honour${tail || ""}`)
      .replace(/\blabor(s)?\b/gi, (_, tail) => `labour${tail || ""}`)
      .replace(/\btraveling\b/gi, "travelling")
      .replace(/\bmodeled\b/gi, "modelled")
      .replace(/\bgotten\b/gi, "got")
      .replace(/\bsummariz(e|es|ed|ing)\b/gi, (_, tail) => `summaris${tail}`)
      .replace(/\bjudgment\b/gi, "judgement");
  }

  function wrapInPersona(bodyParts, agent, tutorProfile, level, personaOpts = {}) {
    const { revisionMode = false, lessonContent = null } = personaOpts;
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    const catchphrase = pickCatchphrase(agent, tutorProfile);
    const cleaned = stripDuplicateSentences(bodyParts);

    if (revisionMode) {
      const style = tutorVoiceStyle(agent, tutorProfile);
      let parts = cleaned.slice(0, 2).map((part) => String(part || "").trim()).filter(Boolean);
      parts = parts.map((part) => part
        .replace(/Pick one word or idea from the slide.*?\.?/gi, "")
        .replace(/Pick one word from the slide.*?\.?/gi, "")
        .replace(/Ask about any of them\.?/gi, "")
        .replace(/There is no rush\.?/gi, "")
        .replace(/We will build from there\.?/gi, "")
        .replace(/Tell me when you are ready.*?\.?/gi, "")
        .replace(/\s+/g, " ")
        .trim())
        .filter(Boolean);

      let result = parts.join(" ");
      const hook = revisionMemoryHook(lessonContent, style);
      if (hook && parts.length === 1 && !normalizeText(result).includes(normalizeText(hook))) {
        result = `${result} ${hook}`.trim();
      }
      return sanitizeChatDashes(result);
    }

    const useCatchphrase = catchphrase && band <= 5 && Math.random() < 0.35;

    let result;
    if (band <= 2) {
      const shortParts = cleaned.slice(0, 2);
      if (useCatchphrase) shortParts.unshift(catchphrase);
      result = shortParts.join(" ");
    } else if (band <= 5) {
      const parts = useCatchphrase ? [catchphrase, ...cleaned] : cleaned;
      result = parts.slice(0, 3).join(" ");
    } else {
      const parts = cleaned.slice(0, 4);
      if (useCatchphrase) parts.unshift(catchphrase);
      result = parts.join(" ");
    }

    return sanitizeChatDashes(result);
  }

  function personaOptsFromCtx(ctx) {
    return {
      revisionMode: !!ctx.revisionMode,
      lessonContent: ctx.lessonContent,
    };
  }

  function buildKnowledgeReply(message, content, agent, tutorProfile, level, synonymMap, slideChunk, personaOpts) {
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;
    const keyPoint = slideChunk
      ? pickSlideLevelKeyPoint(content, slideChunk, message, synonymMap)
      : pickRelevantKeyPoint(message, content, synonymMap);
    const parts = [];
    const revisionMode = personaOpts?.revisionMode;

    if (revisionMode) {
      if (keyPoint) parts.push(keyPoint);
      else if (content.summary) parts.push(content.summary);
      const cmd = detectCommandWord(message, content.commandWords, band);
      if (cmd && band >= 5) parts.push(`Exam tip (${cmd.word}): ${cmd.template}`);
    } else if (band <= 2) {
      if (keyPoint) parts.push(keyPoint);
      else if (content.summary) parts.push(content.summary);
      const terms = slideChunk?.terms || [];
      if (terms.length) {
        parts.push(`Words on this slide: ${terms.slice(0, 4).join(", ")}. Pick one and I will explain it.`);
      }
    } else if (band <= 5) {
      if (content.summary) parts.push(content.summary);
      if (keyPoint && normalizeText(keyPoint) !== normalizeText(content.summary)) {
        parts.push(keyPoint);
      }
    } else {
      if (content.summary) parts.push(content.summary);
      if (keyPoint && normalizeText(keyPoint) !== normalizeText(content.summary)) {
        parts.push(keyPoint);
      }
      if (content.explainLike) parts.push(content.explainLike);
    }

    if (!revisionMode) {
      const cmd = detectCommandWord(message, content.commandWords, band);
      if (cmd && band >= 7) parts.push(cmd.template);
    }

    return wrapInPersona(parts, agent, tutorProfile, level, { ...personaOpts, lessonContent: content });
  }

  function buildSlideChunkReply(message, slideContext, slideChunk, lessonContent, agent, tutorProfile, level, personaOpts, synonymMap) {
    const label = slideLabel(slideContext, slideChunk);
    const hint = slideChunk.hint || slideHint(slideContext, lessonContent, slideChunk);
    const hintBody = hint.charAt(0).toLowerCase() + hint.slice(1).replace(/\.$/, "");
    const scriptLine = slideScriptSnippet(slideChunk, level);
    const topicTitle = lessonContent?.topicTitle || "this lesson";
    const levelLines = buildLevelContentLines(lessonContent, level, slideChunk, synonymMap, message);
    const parts = [];
    const revisionMode = personaOpts?.revisionMode;
    const band = global.EvoAgentKnowledge?.normalizeLevel(level) || 1;

    if (revisionMode) {
      if (scriptLine) parts.push(scriptLine);
      else parts.push(`${label}: ${hintBody}.`);
      if (levelLines[0]) parts.push(levelLines[0]);
      if (slideChunk.terms?.length) {
        parts.push(`Key terms: ${slideChunk.terms.slice(0, 4).join(", ")}.`);
      }
      return wrapInPersona(parts, agent, tutorProfile, level, { ...personaOpts, lessonContent });
    }

    if (!looksLikeAcademicQuestion(message)) {
      const echo = echoUserMessage(message);
      if (echo) parts.push(`${echo.charAt(0).toUpperCase() + echo.slice(1)}.`);
    }

    if (scriptLine && looksLikeAcademicQuestion(message)) {
      parts.push(scriptLine);
    } else {
      parts.push(`On ${label}, ${hintBody}.`);
      if (scriptLine && band <= 4) {
        parts.push(scriptLine);
      }
    }

    for (const line of levelLines) {
      if (!parts.some((part) => normalizeText(part) === normalizeText(line))) {
        parts.push(line);
      }
    }

    parts.push(buildSlidePromptTail(level, slideChunk, topicTitle));

    return wrapInPersona(parts, agent, tutorProfile, level, { ...personaOpts, lessonContent });
  }

  function buildContextualSlideReply(message, slideContext, lessonContent, agent, tutorProfile, level, slideChunk, personaOpts, synonymMap) {
    const chunk = slideChunk || getSlideChunkFromTopic(lessonContent, slideContext?.slideIndex);
    if (chunk) {
      return buildSlideChunkReply(message, slideContext, chunk, lessonContent, agent, tutorProfile, level, personaOpts, synonymMap);
    }
    const label = slideLabel(slideContext, chunk);
    const hint = slideHint(slideContext, lessonContent, chunk);
    const hintBody = hint.charAt(0).toLowerCase() + hint.slice(1).replace(/\.$/, "");
    const parts = [];
    const revisionMode = personaOpts?.revisionMode;

    if (!revisionMode && !looksLikeAcademicQuestion(message)) {
      const echo = echoUserMessage(message);
      if (echo) parts.push(`${echo.charAt(0).toUpperCase() + echo.slice(1)}.`);
    }

    parts.push(revisionMode
      ? `${label}: ${hintBody}.`
      : `On ${label}, ${hintBody}.`);

    if (!revisionMode) {
      const levelLines = buildLevelContentLines(lessonContent, level, chunk, synonymMap, message);
      if (levelLines[0]) parts.push(levelLines[0]);
      parts.push(buildSlidePromptTail(level, chunk, lessonContent?.topicTitle));
    }

    return wrapInPersona(parts, agent, tutorProfile, level, { ...personaOpts, lessonContent });
  }

  function buildSoftFallback(content, agent, tutorProfile, slideContext, level, message, slideChunk, personaOpts, synonymMap) {
    const name = tutorDisplayName(agent, tutorProfile);
    const hint = slideHint(slideContext, content, slideChunk);
    const echo = echoUserMessage(message);
    const parts = [];
    const revisionMode = personaOpts?.revisionMode;

    if (echo && !revisionMode) {
      parts.push(`${echo.charAt(0).toUpperCase() + echo.slice(1)}.`);
    }

    if (slideContext?.title || slideContext?.note || slideChunk?.hint) {
      parts.push(revisionMode
        ? `${slideLabel(slideContext, slideChunk)}: ${hint.charAt(0).toLowerCase() + hint.slice(1).replace(/\.$/, "")}.`
        : `On this slide ${hint.charAt(0).toLowerCase() + hint.slice(1).replace(/\.$/, "")}.`);
    } else if (content?.summary) {
      parts.push(revisionMode ? content.summary : `From this lesson: ${content.summary}`);
    } else {
      parts.push(revisionMode
        ? `${name} in revision mode. Ask for a key fact from this lesson.`
        : `${name} is here to help with what is on screen.`);
    }

    if (!revisionMode) {
      const levelLines = buildLevelContentLines(content, level, slideChunk, synonymMap, message);
      if (levelLines[0]) parts.push(levelLines[0]);
      parts.push(buildSlidePromptTail(level, slideChunk, content?.topicTitle));
    }

    return wrapInPersona(parts, agent, tutorProfile, level, { ...personaOpts, lessonContent: content });
  }

  function buildFollowUpReply(memory, lessonContent, agent, tutorProfile, level, slideChunk, personaOpts) {
    const parts = [];
    const revisionMode = personaOpts?.revisionMode;

    if (memory.lastText) {
      parts.push(revisionMode ? "Another key point:" : "Happy to go deeper.");
      if (lessonContent?.keyPoints?.[1]) {
        parts.push(lessonContent.keyPoints[1]);
      } else if (lessonContent?.keyPoints?.[0]) {
        parts.push(lessonContent.keyPoints[0]);
      }
    } else if (slideChunk?.hint) {
      parts.push(slideChunk.hint);
    } else {
      parts.push(revisionMode
        ? "Name a term and I will give you a quick recap."
        : "Tell me which word or idea you want me to explain next.");
    }
    return wrapInPersona(parts, agent, tutorProfile, level, { ...personaOpts, lessonContent });
  }

  async function resolveContext(options) {
    const basePath = options.basePath || "";
    const knowledge = global.EvoAgentKnowledge;
    const profile = options.profile || knowledge?.getStudentProfile?.() || null;
    const level = knowledge?.normalizeLevel?.(options.level ?? profile?.level) || 1;
    const lessonId = options.lessonId
      || global.document?.body?.dataset?.lessonId
      || null;

    let agent = options.agent || null;

    const agentId = options.agentId
      || profile?.agentId
      || agent?.id
      || slugFromName(profile?.agentName);

    if (!agent && agentId && knowledge?.loadAgentsConfig) {
      const config = await knowledge.loadAgentsConfig(basePath);
      agent = (config.agents || []).find((a) => a.id === String(agentId).toLowerCase()) || null;
    }
    if (!agent && knowledge?.getAgentForLevel) {
      agent = await knowledge.getAgentForLevel(level, basePath);
    }

    const tutorProfile = await loadTutorProfile(agentId, basePath);

    let lessonContent = null;
    let allTopics = [];
    if (lessonId && knowledge?.getLessonKnowledge) {
      const payload = await knowledge.getLessonKnowledge(lessonId, level, basePath);
      lessonContent = payload?.content || null;
      allTopics = payload?.allTopics || [];
      if (!agent && payload?.agent) agent = payload.agent;
    }

    return {
      basePath,
      profile,
      level,
      lessonId,
      agent,
      tutorProfile,
      lessonContent,
      allTopics,
    };
  }

  function slugFromName(name) {
    return String(name || "nova").toLowerCase().replace(/\s+/g, "");
  }

  async function getSlideChunkForContext(lessonId, slideContext, basePath, lessonContent) {
    if (slideContext?.slideIndex == null) return null;

    const fromTopic = getSlideChunkFromTopic(lessonContent, slideContext.slideIndex);
    if (fromTopic) return fromTopic;

    if (!lessonId) return null;
    const knowledge = global.EvoAgentKnowledge;
    if (!knowledge?.getTopicsForLesson || !knowledge?.getSlideChunk) return null;

    const topics = await knowledge.getTopicsForLesson(lessonId, basePath);
    for (const topicMeta of topics) {
      const chunk = await knowledge.getSlideChunk(topicMeta.topicId, slideContext.slideIndex, basePath);
      if (chunk) return chunk;
    }
    return null;
  }

  /**
   * Generate a tutor reply from local knowledge only.
   * @returns {Promise<{ text: string, source: string, topicId?: string }>}
   */
  async function respond(options) {
    const message = String(options?.message || "").trim();
    const slideContext = options?.slideContext || null;
    const quizContext = options?.quizContext || null;
    const ctx = await resolveContext(options);
    ctx.revisionMode = resolveRevisionMode(options, slideContext);
    const personaOpts = personaOptsFromCtx(ctx);
    const synonymMap = await ensureSynonyms(ctx.basePath);
    const slideChunk = await getSlideChunkForContext(
      ctx.lessonId,
      slideContext,
      ctx.basePath,
      ctx.lessonContent,
    );
    const memory = loadMemory();

    if (!message && !quizContext?.wrongOption) {
      return {
        text: pickGreeting(ctx.agent, ctx.tutorProfile, slideContext, ctx.lessonContent, ctx.revisionMode),
        source: ctx.revisionMode ? "greeting:revision" : "greeting",
      };
    }

    if (quizContext?.wrongOption && ctx.lessonContent) {
      const result = {
        text: buildQuizReply(quizContext, ctx.lessonContent, ctx.agent, ctx.tutorProfile, ctx.level, personaOpts),
        source: "quiz:misconception",
        topicId: ctx.lessonContent.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    if (isFollowUp(message) && (memory.lastSource || memory.lastText)) {
      const result = {
        text: buildFollowUpReply(memory, ctx.lessonContent, ctx.agent, ctx.tutorProfile, ctx.level, slideChunk, personaOpts),
        source: "followup",
        topicId: memory.lastTopicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    if (ctx.lessonId) {
      const studentHit = await findStudentQuestionMatch(
        message,
        ctx.lessonId,
        ctx.level,
        ctx.basePath,
        slideContext,
      );
      if (studentHit) {
        const answer = pickStudentQuestionAnswer(studentHit.question, ctx.level);
        const result = {
          text: wrapInPersona([answer], ctx.agent, ctx.tutorProfile, ctx.level, personaOpts),
          source: "faq:student",
          topicId: studentHit.bank.topicId || ctx.lessonContent?.topicId,
        };
        recordExchange(message, result, slideContext);
        return result;
      }
    }

    if (slideChunk?.faqs?.length) {
      const slideFaq = findFaqMatch(message, slideChunk.faqs, ctx.level);
      if (slideFaq) {
        const result = {
          text: wrapInPersona([slideFaq.answer], ctx.agent, ctx.tutorProfile, ctx.level, personaOpts),
          source: "faq:slide",
          topicId: ctx.lessonContent?.topicId,
        };
        recordExchange(message, result, slideContext);
        return result;
      }
    }

    const intent = detectIntent(message);
    const preFaqIntents = new Set(["greeting", "thanks", "goodbye", "smalltalk", "confusion"]);
    if (intent && preFaqIntents.has(intent)) {
      const result = {
        text: buildIntentReply(intent, ctx.agent, ctx.tutorProfile, ctx.lessonContent, slideContext, message, ctx.level, slideChunk, ctx.revisionMode),
        source: ctx.revisionMode ? `intent:${intent}:revision` : `intent:${intent}`,
        topicId: ctx.lessonContent?.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    if (ctx.lessonId) {
      const faqHit = await findFaqAcrossLesson(message, ctx.lessonId, ctx.level, ctx.basePath, slideContext);
      if (faqHit) {
        const result = {
          text: wrapInPersona([faqHit.faq.answer], ctx.agent, ctx.tutorProfile, ctx.level, personaOpts),
          source: faqHit.slideChunk ? "faq:slide" : "faq:topic",
          topicId: faqHit.content.topicId,
        };
        recordExchange(message, result, slideContext);
        return result;
      }
    }

    if (intent === "personal") {
      const result = {
        text: buildIntentReply(intent, ctx.agent, ctx.tutorProfile, ctx.lessonContent, slideContext, message, ctx.level, slideChunk, ctx.revisionMode),
        source: `intent:${intent}`,
        topicId: ctx.lessonContent?.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    let match = null;
    if (ctx.lessonId) {
      match = await findBestTopicMatch(message, ctx.lessonId, ctx.level, ctx.basePath, synonymMap);
    }

    const slideScore = scoreSlideMatch(message, slideContext, synonymMap, slideChunk);

    if (match?.content && match.score >= 2) {
      const memoryRepeat = memory.lastSource === "knowledge"
        && memory.lastTopicId === match.content.topicId
        && normalizeText(memory.lastText || "") === normalizeText(match.content.summary || "");
      const result = {
        text: memoryRepeat
          ? buildKnowledgeReply(message, match.content, ctx.agent, ctx.tutorProfile, ctx.level, synonymMap, slideChunk, personaOpts)
          : buildKnowledgeReply(message, match.content, ctx.agent, ctx.tutorProfile, ctx.level, synonymMap, slideChunk, personaOpts),
        source: "knowledge",
        topicId: match.content.topicId,
      };
      if (memoryRepeat && match.content.keyPoints?.[1]) {
        result.text = wrapInPersona([match.content.keyPoints[1]], ctx.agent, ctx.tutorProfile, ctx.level, personaOpts);
        result.source = "knowledge:alternate";
      }
      recordExchange(message, result, slideContext);
      return result;
    }

    if (match?.content && (match.score > 0 || looksLikeAcademicQuestion(message))) {
      const result = {
        text: buildKnowledgeReply(message, match.content, ctx.agent, ctx.tutorProfile, ctx.level, synonymMap, slideChunk, personaOpts),
        source: match.score >= 2 ? "knowledge" : "knowledge:partial",
        topicId: match.content.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    if (slideChunk && !looksLikeAcademicQuestion(message)) {
      const result = {
        text: buildSlideChunkReply(message, slideContext, slideChunk, ctx.lessonContent, ctx.agent, ctx.tutorProfile, ctx.level, personaOpts, synonymMap),
        source: "slide:chunk",
        topicId: ctx.lessonContent?.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    if (slideContext && (slideContext.title || slideContext.note) && slideScore >= 2 && !looksLikeAcademicQuestion(message)) {
      const result = {
        text: buildContextualSlideReply(message, slideContext, ctx.lessonContent, ctx.agent, ctx.tutorProfile, ctx.level, slideChunk, personaOpts, synonymMap),
        source: "slide:referenced",
        topicId: ctx.lessonContent?.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    if (ctx.lessonContent) {
      const result = {
        text: buildSoftFallback(ctx.lessonContent, ctx.agent, ctx.tutorProfile, slideContext, ctx.level, message, slideChunk, personaOpts, synonymMap),
        source: "fallback:lesson-summary",
        topicId: ctx.lessonContent.topicId,
      };
      recordExchange(message, result, slideContext);
      return result;
    }

    const result = {
      text: wrapInPersona(
        ["Complete the placement assessment first so I can match explanations to your level and tutor."],
        ctx.agent,
        ctx.tutorProfile,
        ctx.level,
        personaOpts,
      ),
      source: "fallback:no-profile",
    };
    recordExchange(message, result, slideContext);
    return result;
  }

  async function getWelcomeMessage(options) {
    const ctx = await resolveContext(options);
    const slideContext = options?.slideContext || null;
    const revisionMode = resolveRevisionMode(options, slideContext);
    return pickGreeting(ctx.agent, ctx.tutorProfile, slideContext, ctx.lessonContent, revisionMode);
  }

  async function getSlideOpener(options) {
    const slideContext = options?.slideContext;
    if (resolveRevisionMode(options, slideContext)) return null;
    if (slideContext?.slideIndex == null) return null;

    const ctx = await resolveContext(options);
    const chunk = await getSlideChunkForContext(ctx.lessonId, slideContext, ctx.basePath, ctx.lessonContent);
    const personaOpts = personaOptsFromCtx(ctx);
    const band = global.EvoAgentKnowledge?.normalizeLevel(ctx.level) || 1;
    const label = slideLabel(slideContext, chunk);
    const parts = [];

    if (chunk?.opener) {
      parts.push(chunk.opener);
    } else {
      const dialogue = ctx.tutorProfile?.examples?.lessonDialogue;
      if (dialogue?.length) {
        const line = dialogue.find((entry) => entry.role !== "student");
        if (line?.text) parts.push(line.text);
      }
    }

    if (!parts.length) return null;

    const keyPoint = pickSlideLevelKeyPoint(ctx.lessonContent, chunk, null, null);
    if (band <= 3 && keyPoint) {
      parts.push(`At your level, one idea to hold on to: ${keyPoint}`);
    } else if (band <= 6 && keyPoint) {
      parts.push(`GCSE link for ${label}: ${keyPoint}`);
    } else if (band >= 7) {
      if (ctx.lessonContent?.explainLike) {
        parts.push(ctx.lessonContent.explainLike);
      } else if (keyPoint) {
        parts.push(`Exam focus: ${keyPoint}`);
      }
    }

    return sanitizeChatDashes(wrapInPersona(parts, ctx.agent, ctx.tutorProfile, ctx.level, personaOpts));
  }

  function appendChatMessage(chatBody, text, who, source) {
    if (!chatBody) return;
    const msg = global.document.createElement("div");
    msg.className = `chat-msg chat-msg--${who}`;
    msg.textContent = text;
    if (source && chatBody.dataset.showSource === "true") {
      const tag = global.document.createElement("span");
      tag.className = "chat-msg-source";
      tag.textContent = ` [${source}]`;
      tag.style.fontSize = "0.75em";
      tag.style.opacity = "0.6";
      msg.appendChild(tag);
    }
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  /**
   * Wire the standard lesson chat shell to the local-first engine.
   * @returns {{ seedGreeting: Function, send: Function, pushAgentMessage: Function } | null}
   */
  function applyRevisionChatUi(root, revisionMode, tutorName) {
    if (!revisionMode) return;
    const chatInput = root.getElementById?.("chat-input")
      || root.querySelector?.(".lesson-chat-input-shell input");
    const chatBadge = root.querySelector?.(".lesson-chat-badge");
    const chatShell = root.querySelector?.(".lesson-chat-shell");

    if (chatInput) {
      chatInput.placeholder = revisionChatPlaceholder(tutorName);
    }
    if (chatBadge) {
      chatBadge.textContent = global.EvoLessonPptViewer?.LABEL_REVISION || "Revision";
      chatBadge.classList.add("is-revision");
      chatBadge.classList.remove("is-live");
    }
    if (chatShell) chatShell.classList.add("is-revision-mode");
  }

  function initLessonChat(options) {
    const root = options?.root || global.document;
    const chatBody = root.getElementById?.("chat-body") || root.querySelector?.(".lesson-chat-body");
    const chatInput = root.getElementById?.("chat-input")
      || root.querySelector?.(".lesson-chat-input-shell input");
    const chatSend = root.getElementById?.("chat-send")
      || root.querySelector?.(".lesson-chat-input-shell button");

    if (!chatBody || !chatInput) return null;

    if (options.showSource) chatBody.dataset.showSource = "true";

    const basePath = options.basePath || "";
    const lessonId = options.lessonId
      || root.body?.dataset?.lessonId
      || null;
    const moduleId = options.moduleId
      || root.body?.dataset?.moduleId
      || null;
    const chatMode = String(options.chatMode || chatModeFromDom(root)).toLowerCase();
    const getSlide = typeof options.getSlide === "function" ? options.getSlide : () => null;
    const revisionMode = options.revisionMode ?? resolveRevisionMode(options, getSlide());
    const updateContext = typeof options.updateContext === "function" ? options.updateContext : () => {};
    const onSlideChange = typeof options.onSlideChange === "function" ? options.onSlideChange : null;
    let tutorName = options.tutorName || "your tutor";

    if (options.tutorName) {
      applyRevisionChatUi(root, revisionMode, tutorName);
    } else {
      resolveContext({ basePath, lessonId }).then(async (ctx) => {
        tutorName = ctx?.agent?.name || tutorName;
        applyRevisionChatUi(root, revisionMode, tutorName);
        if (chatInput && !revisionMode) {
          const slideCtx = getSlide();
          const chunk = await getSlideChunkForContext(lessonId, slideCtx, basePath, ctx.lessonContent);
          chatInput.placeholder = getSlideChatPlaceholder(ctx.level, tutorName, chunk, revisionMode);
        }
      });
    }

    async function pushAgentMessage(text, source) {
      appendChatMessage(chatBody, text, "agent", source);
    }

    async function recordChatSignal(message, result, slideContext, ctx) {
      try {
        const intent = detectIntent(message);
        const questionCategory = looksLikeAcademicQuestion(message)
          ? "academic"
          : (intent ? "social" : "other");
        const misconceptionTags = [];
        if (String(result?.source || "").startsWith("quiz:")) misconceptionTags.push("quiz_flow");
        if (String(result?.source || "") === "quiz:misconception") misconceptionTags.push("misconception_hint");

        await global.EvoStudentSync?.recordTutorChatSignal?.({
          lessonId,
          moduleId,
          topicId: ctx?.lessonContent?.topicId || null,
          slideIndex: slideContext?.slideIndex ?? null,
          intent: intent || null,
          questionCategory,
          misconceptionTags,
        });
      } catch {
        /* optional */
      }
    }

    async function sendUserMessage(question, extraOptions) {
      appendChatMessage(chatBody, question, "user");
      const message = String(question || "").trim();

      if (chatMode === "ai") {
        try {
          const slideContext = getSlide();
          const ctx = await resolveContext({ basePath, lessonId, revisionMode });
          ctx.revisionMode = revisionMode;
          const synonymMap = await ensureSynonyms(basePath);
          const slideChunk = await getSlideChunkForContext(lessonId, slideContext, basePath, ctx.lessonContent);
          const tutorName = tutorDisplayName(ctx.agent, ctx.tutorProfile);
          const style = tutorVoiceStyle(ctx.agent, ctx.tutorProfile);

          const idToken = await getFirebaseIdToken();
          const history = (loadAiMemory().turns || []).slice(-6);

          const payload = {
            message: message.slice(0, 700),
            history,
            context: {
              tutorPersona: `${tutorName} (${style} style)`,
              studentLevelBand: levelBand(ctx.level),
              lessonId,
              topicTitle: ctx.lessonContent?.topicTitle || null,
              slideIndex: slideContext?.slideIndex ?? null,
              slideTitle: slideChunk?.title || slideContext?.title || "",
              slideHint: slideHint(slideContext, ctx.lessonContent, slideChunk),
              slideScript: slideScriptSnippet(slideChunk, ctx.level),
              lessonSummary: ctx.lessonContent?.summary || "",
              keyPoints: Array.isArray(ctx.lessonContent?.keyPoints) ? ctx.lessonContent.keyPoints.slice(0, 4) : [],
            },
          };

          recordAiTurn("user", payload.message);

          const response = await fetch(`${basePath}api/chat`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error("ai_failed");
          const data = await response.json();
          if (!data?.ok || !data?.text) throw new Error("ai_bad_response");

          const text = sanitizeChatDashes(String(data.text));
          recordAiTurn("assistant", text);

          const result = { text, source: "ai:gemini" };
          recordExchange(message, result, slideContext);
          recordChatSignal(message, result, slideContext, ctx);
          appendChatMessage(chatBody, result.text, "agent", result.source);
          updateContext();
          return result;
        } catch {
          // Any failure falls back to the offline/local-first tutor engine.
        }
      }

      const slideContext = getSlide();
      const ctx = await resolveContext({ basePath, lessonId, revisionMode });
      const result = await respond({
        message,
        lessonId,
        basePath,
        slideContext,
        revisionMode,
        ...extraOptions,
      });
      recordChatSignal(message, result, slideContext, ctx);
      appendChatMessage(chatBody, result.text, "agent", result.source);
      updateContext();
      return result;
    }

    async function handleQuizWrong(quizContext) {
      const result = await respond({
        message: "",
        lessonId,
        basePath,
        slideContext: getSlide(),
        quizContext,
        revisionMode,
      });
      appendChatMessage(chatBody, result.text, "agent", result.source);
      updateContext();
      return result;
    }

    async function send() {
      const question = chatInput.value.trim();
      if (!question) return;

      chatInput.value = "";
      chatInput.disabled = true;
      if (chatSend) chatSend.disabled = true;

      await sendUserMessage(question);

      chatInput.disabled = false;
      if (chatSend) chatSend.disabled = false;
      chatInput.focus();
    }

    if (chatSend) chatSend.addEventListener("click", send);
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        send();
      }
    });

    return {
      async seedGreeting() {
        const welcome = await getWelcomeMessage({
          lessonId,
          basePath,
          slideContext: getSlide(),
          revisionMode,
        });
        appendChatMessage(chatBody, welcome, "agent", revisionMode ? "greeting:revision" : "greeting");
      },
      async onSlideChanged() {
        const slideCtx = getSlide();
        if (onSlideChange) {
          const opener = await getSlideOpener({
            lessonId,
            basePath,
            slideContext: slideCtx,
            revisionMode,
          });
          if (opener) appendChatMessage(chatBody, opener, "agent", "slide:opener");
        }

        const ctx = await resolveContext({ basePath, lessonId, revisionMode });
        const chunk = await getSlideChunkForContext(lessonId, slideCtx, basePath, ctx.lessonContent);
        if (chatInput) {
          chatInput.placeholder = getSlideChatPlaceholder(ctx.level, tutorName, chunk, revisionMode);
        }
        updateContext();
      },
      send,
      sendUserMessage,
      pushAgentMessage,
      handleQuizWrong,
    };
  }

  const isRevisionMode = resolveRevisionMode;

  global.EvoTutorEngine = {
    respond,
    detectIntent,
    detectPersonalStatement,
    isRevisionMode,
    resolveRevisionMode,
    revisionChatPlaceholder,
    getWelcomeMessage,
    getSlideOpener,
    getSlideChatPlaceholder,
    levelBand,
    pickSlideLevelKeyPoint,
    buildLevelContentLines,
    buildSlidePromptTail,
    getSlideChunkFromTopic,
    slideHint,
    slideScriptSnippet,
    loadTutorProfile,
    resolveLessonContext: resolveContext,
    initLessonChat,
  };
})(window);
