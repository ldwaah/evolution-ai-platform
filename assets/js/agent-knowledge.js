/**
 * EVOlearn — level-specific agent knowledge database
 *
 * Static knowledge files live under assets/data/knowledge/.
 * Each topic has differentiated content for tutor bands 1–9.
 */
(function (global) {
  const AGENTS_URL = "assets/data/agents.json";
  const KNOWLEDGE_INDEX_URL = "assets/data/knowledge/index.json";
  const KNOWLEDGE_BASE = "assets/data/knowledge/";
  const STUDENT_QUESTIONS_INDEX_URL = "assets/data/knowledge/student-questions/index.json";
  const STUDENT_QUESTIONS_BASE = "assets/data/knowledge/student-questions/";
  const SYNONYMS_URL = "assets/data/knowledge/synonyms.json";

  let agentsCache = null;
  let indexCache = null;
  let studentQuestionsIndexCache = null;
  let synonymsCache = null;
  const topicCache = new Map();
  const studentQuestionsCache = new Map();

  function normalizeLevel(level) {
    const n = Number(level);
    if (!Number.isFinite(n)) return 1;
    return Math.min(9, Math.max(1, Math.round(n)));
  }

  function levelKey(level) {
    return String(normalizeLevel(level));
  }

  function getStudentProfile() {
    if (global.EvoStudentProfile?.loadStudentProfile) {
      return global.EvoStudentProfile.loadStudentProfile();
    }
    try {
      const raw = global.localStorage.getItem("evoStudentProfile");
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.agentName || typeof data.level !== "number") return null;
      return data;
    } catch {
      return null;
    }
  }

  async function loadAgentsConfig(basePath) {
    if (agentsCache && !basePath) return agentsCache;
    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${AGENTS_URL}`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      agentsCache = data;
      return data;
    } catch {
      return agentsCache || { agents: [], defaultAgentId: "nova" };
    }
  }

  async function loadKnowledgeIndex(basePath) {
    if (indexCache && !basePath) return indexCache;
    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${KNOWLEDGE_INDEX_URL}`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      indexCache = data;
      return data;
    } catch {
      return indexCache || { topics: [] };
    }
  }

  async function loadStudentQuestionsIndex(basePath) {
    if (studentQuestionsIndexCache && !basePath) return studentQuestionsIndexCache;
    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${STUDENT_QUESTIONS_INDEX_URL}`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      studentQuestionsIndexCache = data;
      return data;
    } catch {
      return studentQuestionsIndexCache || { banks: [] };
    }
  }

  async function loadStudentQuestionsBank(lessonId, basePath) {
    if (!lessonId) return null;
    const cacheKey = `${basePath || ""}${lessonId}`;
    if (studentQuestionsCache.has(cacheKey)) return studentQuestionsCache.get(cacheKey);

    const index = await loadStudentQuestionsIndex(basePath);
    const entry = (index.banks || []).find((bank) => bank.lessonId === lessonId);
    if (!entry?.file) {
      studentQuestionsCache.set(cacheKey, null);
      return null;
    }

    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${STUDENT_QUESTIONS_BASE}${entry.file}`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      studentQuestionsCache.set(cacheKey, data);
      return data;
    } catch {
      studentQuestionsCache.set(cacheKey, null);
      return null;
    }
  }

  async function getStudentQuestionsForLesson(lessonId, basePath) {
    const bank = await loadStudentQuestionsBank(lessonId, basePath);
    return bank?.questions || [];
  }

  async function loadSynonyms(basePath) {
    if (synonymsCache && !basePath) return synonymsCache;
    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${SYNONYMS_URL}`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      synonymsCache = data;
      return data;
    } catch {
      return synonymsCache || { terms: {} };
    }
  }

  async function loadTopicFile(fileName, basePath) {
    const cacheKey = `${basePath || ""}${fileName}`;
    if (topicCache.has(cacheKey)) return topicCache.get(cacheKey);
    const prefix = basePath || "";
    try {
      const response = await fetch(`${prefix}${KNOWLEDGE_BASE}${fileName}`);
      if (!response.ok) throw new Error("fetch failed");
      const data = await response.json();
      topicCache.set(cacheKey, data);
      return data;
    } catch {
      return null;
    }
  }

  async function getTopicEntry(topicId, basePath) {
    const index = await loadKnowledgeIndex(basePath);
    const entry = (index.topics || []).find((t) => t.topicId === topicId);
    if (!entry) return null;
    const topic = await loadTopicFile(entry.file, basePath);
    if (!topic) return null;
    return { entry, topic };
  }

  async function getAgentForLevel(level, basePath) {
    const config = await loadAgentsConfig(basePath);
    const band = normalizeLevel(level);
    const agent = (config.agents || []).find((a) => a.level === band)
      || (config.agents || []).find((a) => a.id === config.defaultAgentId)
      || (config.agents || [])[0]
      || null;
    return agent;
  }

  async function getTopicContent(topicId, level, basePath) {
    const payload = await getTopicEntry(topicId, basePath);
    if (!payload) return null;

    const { entry, topic } = payload;
    const band = normalizeLevel(level);
    let chunk = topic.levels[levelKey(band)];
    if (!chunk) {
      for (let i = band - 1; i >= 1; i -= 1) {
        if (topic.levels[levelKey(i)]) {
          chunk = topic.levels[levelKey(i)];
          break;
        }
      }
    }
    if (!chunk) chunk = topic.levels["1"];
    if (!chunk) return null;

    return {
      topicId: topic.topicId,
      topicTitle: topic.topicTitle,
      moduleId: topic.moduleId,
      lessonIds: topic.lessonIds,
      level: band,
      summary: chunk.summary,
      keyPoints: chunk.keyPoints || [],
      explainLike: chunk.explainLike || "",
      keywords: topic.keywords || [],
      aliases: topic.aliases || [],
      faqs: topic.faqs || [],
      slides: topic.slides || {},
      misconceptions: topic.misconceptions || [],
      commandWords: topic.commandWords || {},
      themes: entry.themes || [],
    };
  }

  async function getTopicFull(topicId, basePath) {
    const payload = await getTopicEntry(topicId, basePath);
    if (!payload) return null;
    return { entry: payload.entry, topic: payload.topic };
  }

  async function getSlideChunk(topicId, slideIndex, basePath) {
    const payload = await getTopicFull(topicId, basePath);
    if (!payload?.topic?.slides) return null;
    const key = String(slideIndex);
    return payload.topic.slides[key] || null;
  }

  async function getSlideChunkFromTopic(topicId, slideIndex, basePath) {
    return getSlideChunk(topicId, slideIndex, basePath);
  }

  async function getTopicsForLesson(lessonId, basePath) {
    const index = await loadKnowledgeIndex(basePath);
    return (index.topics || []).filter((t) => (t.lessonIds || []).includes(lessonId));
  }

  async function getAllLessonContent(lessonId, level, basePath) {
    const topics = await getTopicsForLesson(lessonId, basePath);
    const results = [];
    for (const topicMeta of topics) {
      const content = await getTopicContent(topicMeta.topicId, level, basePath);
      if (content) results.push({ topicMeta, content });
    }
    return results;
  }

  async function getLessonTopicsContent(lessonId, level, basePath) {
    return getAllLessonContent(lessonId, level, basePath);
  }

  async function getLessonKnowledge(lessonId, level, basePath) {
    const all = await getAllLessonContent(lessonId, level, basePath);
    if (!all.length) return null;
    const primary = all[0];
    const agent = await getAgentForLevel(level, basePath);
    return {
      topic: primary.topicMeta,
      content: primary.content,
      allTopics: all,
      agent,
    };
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildPreviewHtml(payload) {
    const { content, agent } = payload;
    const name = agent?.name || "Your tutor";
    const keyPoint = content.keyPoints?.[0] || content.summary;
    const voiceLine = content.explainLike || content.summary;

    return `
      <article class="lesson-tutor-preview" aria-label="${escapeHtml(name)} explains this topic">
        <header class="lesson-tutor-preview-head">
          <span class="lesson-tutor-preview-eyebrow">Your tutor explains</span>
          <span class="lesson-tutor-preview-topic">${escapeHtml(content.topicTitle)}</span>
        </header>
        <p class="lesson-tutor-preview-point">${escapeHtml(keyPoint)}</p>
        <p class="lesson-tutor-preview-voice">${escapeHtml(voiceLine)}</p>
        <p class="lesson-tutor-preview-foot">This preview matches your Level ${content.level} placement. Live chat uses the same stored knowledge.</p>
      </article>
    `;
  }

  async function renderLessonPreview(options) {
    const root = options?.root || global.document;
    const basePath = options?.basePath || "";
    const lessonId = options?.lessonId
      || root.body?.dataset?.lessonId
      || root.querySelector("[data-lesson-id]")?.dataset?.lessonId;

    const chatBody = root.querySelector(".lesson-chat-body");
    if (!chatBody || !lessonId) return;

    const profile = getStudentProfile();
    if (!profile) {
      chatBody.innerHTML = `
        <p class="lesson-tutor-preview-empty">Complete the placement assessment to see explanations matched to your level.</p>
      `;
      return;
    }

    const payload = await getLessonKnowledge(lessonId, profile.level, basePath);
    if (!payload) {
      chatBody.innerHTML = `
        <p class="lesson-tutor-preview-empty">Knowledge for this lesson is being prepared. Your tutor will explain it at Level ${profile.level} when chat launches.</p>
      `;
      return;
    }

    chatBody.innerHTML = buildPreviewHtml(payload);
  }

  async function getAgentVoiceForProfile(basePath) {
    const profile = getStudentProfile();
    if (!profile) return null;
    const agent = await getAgentForLevel(profile.level, basePath);
    return agent?.voice || agent?.description || null;
  }

  global.EvoAgentKnowledge = {
    getStudentProfile,
    getAgentForLevel,
    getTopicContent,
    getTopicFull,
    getSlideChunk,
    getSlideChunkFromTopic,
    getTopicsForLesson,
    getAllLessonContent,
    getLessonTopicsContent,
    getLessonKnowledge,
    getAgentVoiceForProfile,
    renderLessonPreview,
    loadAgentsConfig,
    loadKnowledgeIndex,
    loadStudentQuestionsIndex,
    loadStudentQuestionsBank,
    loadStudentQuestionsForLesson: loadStudentQuestionsBank,
    getStudentQuestionsForLesson,
    loadSynonyms,
    normalizeLevel,
  };
})(window);
