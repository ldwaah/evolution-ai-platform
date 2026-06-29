/**
 * Shared PPT presentation helpers.
 * Student mode (data-ppt-student="true") hides deck length, thumbnails, and slide-number badges.
 *
 * Narration gate: NARRATION_GATE_ENABLED (below). When false, Next is never blocked by audio
 * (manual Play only). Set true before Netlify deploy for production behaviour.
 */
(function (global) {
  // Re-enable before Netlify deploy: set to true to gate Next until narration finishes.
  const NARRATION_GATE_ENABLED = true;

  const LABEL_LESSON = "Lesson";
  const LABEL_QUIZ = "End quiz";
  const LABEL_REVISION = "Revision";
  const LABEL_READING = "Read & practise";
  const READING_PAGE = "lessons/citizenship/reading.html";
  const DEFAULT_MISSING_AUDIO_MS = 400;
  const DEFAULT_REVISION_PLAYBACK_RATE = 1.5;
  const PROGRESS_STORE = "evolearn-progress";
  const PROGRESS_BAR_CLASS = "lesson-slide-progress";
  const PROGRESS_FILL_CLASS = "lesson-slide-progress__fill";

  /**
   * Subtle slide progress bar (fill only, no labels).
   * Mount inside the lesson stage; updates via updateSlideProgressBar().
   */
  function createSlideProgressBar(options = {}) {
    const {
      mountEl = null,
      position = "bottom",
    } = options;

    const host = mountEl || document.getElementById("lesson-stage");
    if (!host) return null;

    const existing = host.querySelector(`.${PROGRESS_BAR_CLASS}`);
    if (existing) return existing;

    const bar = document.createElement("div");
    bar.className = `${PROGRESS_BAR_CLASS} is-${position}`;
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", "0");
    bar.setAttribute("aria-label", "Lesson progress");
    bar.innerHTML = `<span class="${PROGRESS_FILL_CLASS}"></span>`;
    host.appendChild(bar);
    return bar;
  }

  function updateSlideProgressBar(bar, currentIndex, totalSlides) {
    if (!bar || totalSlides < 1) return;
    const fill = bar.querySelector(`.${PROGRESS_FILL_CLASS}`);
    if (!fill) return;

    const safeIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1));
    const percent = Math.round(((safeIndex + 1) / totalSlides) * 100);
    fill.style.width = `${percent}%`;
    bar.setAttribute("aria-valuenow", String(percent));
    bar.hidden = false;
  }

  function hideSlideProgressBar(bar) {
    if (bar) bar.hidden = true;
  }

  function detectRevisionMode(root) {
    const el = root || document.body;
    if (el?.dataset?.lessonMode === "revision") return true;
    try {
      const params = new URLSearchParams(global.location?.search || "");
      if (params.get("revision") === "1") return true;
      if (params.get("mode") === "revision") return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function isProgressComplete(progressKey) {
    if (!progressKey) return false;
    if (global.EvoLessonCompletion?.getDone) {
      return global.EvoLessonCompletion.getDone().has(progressKey);
    }
    try {
      const done = new Set(JSON.parse(global.localStorage.getItem(PROGRESS_STORE)) || []);
      return done.has(progressKey);
    } catch {
      return false;
    }
  }

  function isStudentMode(el) {
    const root = el || document.body;
    return root?.dataset?.pptStudent === "true";
  }

  function studentContextLabel({ quizActive, revisionMode } = {}) {
    if (revisionMode) return LABEL_REVISION;
    return quizActive ? LABEL_QUIZ : LABEL_LESSON;
  }

  function updateStudentChatBadge(badgeEl, quizActive) {
    if (!badgeEl) return false;
    const opts = typeof quizActive === "object"
      ? quizActive
      : { quizActive: !!quizActive };
    if (!opts.revisionMode) opts.revisionMode = detectRevisionMode();
    if (!isStudentMode()) return false;
    badgeEl.textContent = studentContextLabel(opts);
    return true;
  }

  function shouldBuildThumbnails() {
    return !isStudentMode();
  }

  function incompleteLessonLabel() {
    return "Keep going through the lesson";
  }

  function inProgressCompleteHint({
    lessonStarted,
    quizActive,
    endQuizDone,
    alreadyDone,
  } = {}) {
    if (alreadyDone) {
      return { text: "Lesson complete ✓", disabled: true, done: true };
    }
    if (!lessonStarted) {
      return { text: "Start lesson to complete", disabled: true, done: false };
    }
    if (!quizActive) {
      return { text: incompleteLessonLabel(), disabled: true, done: false };
    }
    if (!endQuizDone) {
      return { text: "Complete the end quiz first", disabled: true, done: false };
    }
    return { text: "Mark lesson complete ✓", disabled: false, done: false };
  }

  /**
   * Build ordered MP3 filename candidates for a slide (0-based index).
   * Prefers scene-XX-*.mp3 from sceneFiles, then slide-XX.mp3, then N.mp3.
   */
  function audioCandidatesForSlide(index, { sceneFiles } = {}) {
    const list = [];
    if (sceneFiles?.[index]) list.push(sceneFiles[index]);
    const padded = String(index + 1).padStart(2, "0");
    list.push(`slide-${padded}.mp3`);
    list.push(`${index + 1}.mp3`);
    return [...new Set(list)];
  }

  function withCacheBust(url, cacheBust) {
    if (!cacheBust) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${encodeURIComponent(cacheBust)}`;
  }

  async function resolveAudioUrl(index, { audioBase, cacheBust, sceneFiles } = {}) {
    if (!audioBase) return null;
    const base = audioBase.replace(/\/$/, "");
    const files = audioCandidatesForSlide(index, { sceneFiles });
    for (const file of files) {
      const url = withCacheBust(`${base}/${file}`, cacheBust);
      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (res.ok) return url;
      } catch {
        /* try next candidate */
      }
    }
    return null;
  }

  /**
   * Gate forward navigation until the current slide's narration finishes.
   * Prev navigation is not gated; audio pauses when leaving a slide.
   */
  function createNarrationController(options = {}) {
    const {
      audioBase,
      cacheBust = "",
      sceneFiles = null,
      narrateBtn = null,
      getSlideIndex = () => 0,
      isEnabled = () => true,
      onGateChange = () => {},
      missingAudioDelayMs = DEFAULT_MISSING_AUDIO_MS,
      progressKey = null,
      revisionMode = false,
      playbackRate = DEFAULT_REVISION_PLAYBACK_RATE,
    } = options;

    const isRevision = () => revisionMode || detectRevisionMode();
    const isReplay = () => isProgressComplete(progressKey);
    const isSkimMode = () => isRevision() || isReplay();

    let currentAudio = null;
    let advanceUnlocked = true;
    let activeSlideToken = 0;
    let currentSrc = null;

    function setNarrateState(playing) {
      if (!narrateBtn) return;
      narrateBtn.classList.toggle("is-playing", playing);
      const icon = narrateBtn.querySelector(".narrate-icon");
      if (icon) icon.textContent = playing ? "⏸" : "▶";
      const text = narrateBtn.querySelector(".narrate-text");
      if (text) text.textContent = playing ? "Pause narration" : "Play narration";
    }

    function notifyGateChange() {
      try {
        onGateChange();
      } catch {
        /* ignore listener errors */
      }
    }

    function setAdvanceUnlocked(unlocked) {
      if (advanceUnlocked === unlocked) return;
      advanceUnlocked = unlocked;
      notifyGateChange();
    }

    function detachAudio() {
      if (!currentAudio) return;
      currentAudio.pause();
      currentAudio.removeAttribute("src");
      currentAudio.load();
      currentAudio = null;
    }

    function stopPlayback() {
      detachAudio();
      setNarrateState(false);
    }

    function applyPlaybackRate(audio) {
      if (!audio || !isRevision()) return;
      audio.playbackRate = playbackRate;
    }

    function canAdvanceForward() {
      if (!isEnabled()) return true;
      if (isSkimMode() || !NARRATION_GATE_ENABLED) return true;
      return advanceUnlocked;
    }

    function bindAudioEvents(audio, slideToken) {
      audio.addEventListener("ended", () => {
        if (slideToken !== activeSlideToken) return;
        stopPlayback();
        setAdvanceUnlocked(true);
      });
      audio.addEventListener("error", () => {
        if (slideToken !== activeSlideToken) return;
        stopPlayback();
        setAdvanceUnlocked(true);
      });
    }

    function playUrl(url, slideToken) {
      stopPlayback();
      currentSrc = url;
      currentAudio = new Audio(url);
      applyPlaybackRate(currentAudio);
      bindAudioEvents(currentAudio, slideToken);
      setNarrateState(true);
      const playPromise = currentAudio.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          if (slideToken !== activeSlideToken) return;
          setNarrateState(false);
        });
      }
    }

    async function onSlideShown() {
      const slideToken = ++activeSlideToken;
      stopPlayback();
      currentSrc = null;

      if (!isEnabled()) {
        setAdvanceUnlocked(true);
        if (narrateBtn) narrateBtn.hidden = true;
        return;
      }

      const index = getSlideIndex();
      const url = await resolveAudioUrl(index, { audioBase, cacheBust, sceneFiles });
      if (slideToken !== activeSlideToken) return;

      if (isSkimMode() || !NARRATION_GATE_ENABLED) {
        setAdvanceUnlocked(true);
        if (narrateBtn) {
          if (url) {
            currentSrc = url;
            narrateBtn.hidden = false;
            if (isRevision()) {
              const text = narrateBtn.querySelector(".narrate-text");
              if (text) text.textContent = `Play narration (${playbackRate}×)`;
            }
          } else {
            narrateBtn.hidden = true;
          }
        }
        return;
      }

      setAdvanceUnlocked(false);

      if (!url) {
        if (narrateBtn) narrateBtn.hidden = true;
        window.setTimeout(() => {
          if (slideToken !== activeSlideToken) return;
          setAdvanceUnlocked(true);
        }, missingAudioDelayMs);
        return;
      }

      if (narrateBtn) narrateBtn.hidden = false;
      playUrl(url, slideToken);
    }

    function pauseForNavigation() {
      activeSlideToken += 1;
      stopPlayback();
      currentSrc = null;
    }

    function toggleNarration() {
      if (!isEnabled()) return;

      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        setNarrateState(false);
        return;
      }

      if (currentAudio && currentAudio.paused && currentSrc) {
        applyPlaybackRate(currentAudio);
        setNarrateState(true);
        currentAudio.play().catch(() => setNarrateState(false));
        return;
      }

      if (currentSrc && !currentAudio) {
        playUrl(currentSrc, activeSlideToken);
        return;
      }

      onSlideShown();
    }

    if (narrateBtn) {
      narrateBtn.addEventListener("click", toggleNarration);
    }

    return {
      audioCandidatesForSlide: (index) => audioCandidatesForSlide(index, { sceneFiles }),
      canAdvanceForward,
      onSlideShown,
      pauseForNavigation,
      stopPlayback,
      toggleNarration,
    };
  }

  /**
   * Build URL for the slide reading page (opens in a new tab).
   * @param {object} options
   * @param {string} options.lessonRelPath - e.g. citizenship/module-1/lesson-1
   * @param {number} options.slideIndex - 0-based slide index
   * @param {string} [options.basePath] - relative prefix from lesson HTML
   */
  function buildReadingPageUrl({ lessonRelPath, slideIndex = 0, basePath = "" } = {}) {
    const prefix = String(basePath || "").replace(/\/?$/, "/");
    const lesson = String(lessonRelPath || "").replace(/^\/+/, "");
    const slide = Math.max(1, (Number(slideIndex) || 0) + 1);
    const params = new URLSearchParams({
      lesson,
      slide: String(slide),
    });
    return `${prefix}${READING_PAGE}?${params.toString()}`;
  }

  /**
   * Mount or update a "Read & practise" link on the slide frame (top-right).
   * Call update() whenever the slide changes.
   */
  function mountReadingButton(options = {}) {
    const {
      containerEl = null,
      lessonRelPath = "",
      basePath = "",
      getSlideIndex = () => 0,
      label = LABEL_READING,
      hidden = false,
    } = options;

    const host = containerEl || document.getElementById("slide-frame");
    if (!host || !lessonRelPath) return null;

    let link = host.querySelector(".slide-reading-btn");
    if (!link) {
      link = document.createElement("a");
      link.className = "slide-reading-btn";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      host.appendChild(link);
    }

    function update() {
      const index = typeof getSlideIndex === "function" ? getSlideIndex() : 0;
      link.href = buildReadingPageUrl({ lessonRelPath, slideIndex: index, basePath });
      link.textContent = label;
      link.setAttribute("aria-label", `${label} — opens written version in a new tab`);
      link.hidden = !!hidden;
    }

    update();
    return { el: link, update };
  }

  const api = {
    buildReadingPageUrl,
    mountReadingButton,
    LABEL_READING,
    READING_PAGE,
    isStudentMode,
    studentContextLabel,
    updateStudentChatBadge,
    shouldBuildThumbnails,
    incompleteLessonLabel,
    inProgressCompleteHint,
    isProgressComplete,
    detectRevisionMode,
    audioCandidatesForSlide,
    resolveAudioUrl,
    createNarrationController,
    LABEL_LESSON,
    LABEL_QUIZ,
    LABEL_REVISION,
    DEFAULT_MISSING_AUDIO_MS,
    DEFAULT_REVISION_PLAYBACK_RATE,
    PROGRESS_STORE,
    PROGRESS_BAR_CLASS,
    PROGRESS_FILL_CLASS,
    createSlideProgressBar,
    updateSlideProgressBar,
    hideSlideProgressBar,
  };

  global.EvoLessonPptViewer = api;
  global.EvoPptViewer = api;
})(window);
