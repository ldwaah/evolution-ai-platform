/**
 * Revision recap audio + emblem awards.
 * Listens for >= 90% playback or the ended event, then awards once per student.
 */
(function (global) {
  const DEFAULT_COMPLETION_RATIO = 0.9;
  const WAVE_BARS = 40;

  const RECAP_AUDIO_BY_LESSON = {
    "lesson-1": {
      base: "assets/audio/citizenship/lesson-1",
      files: ["lesson-one-recap.mp3", "lesson-one.mp3"],
      emblemId: "lesson-1-recap",
    },
    "lesson-2": {
      base: "assets/audio/citizenship/lesson-2",
      files: ["lesson-two-recap.mp3", "lesson-2-recap.mp3", "lesson-two.mp3", "recap.mp3"],
      emblemId: "lesson-2-recap",
    },
  };

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function resolveEmblemImage(basePath, emblemId) {
    const meta = global.EvoStudentProfile?.getEmblemMeta?.(emblemId);
    if (!meta?.image) return null;
    const prefix = (basePath || "").replace(/\/?$/, "/");
    return `${prefix}${meta.image}`.replace(/\/+/g, "/");
  }

  async function resolveRecapAudioUrl(basePath, lessonId) {
    const config = RECAP_AUDIO_BY_LESSON[lessonId];
    if (!config) return null;
    const prefix = (basePath || "").replace(/\/?$/, "/");
    const audioBase = `${prefix}${config.base}`.replace(/\/+/g, "/").replace(/^(?!\/)/, "");
    for (const file of config.files) {
      const url = `${audioBase}/${file}`;
      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (res.ok) return url;
      } catch {
        /* try next candidate */
      }
    }
    return `${audioBase}/${config.files[0]}`;
  }

  function getEmblemIdForLesson(lessonId) {
    return RECAP_AUDIO_BY_LESSON[lessonId]?.emblemId || null;
  }

  function buildWaveform(container) {
    if (!container) return;
    container.innerHTML = "";
    const fragment = global.document.createDocumentFragment();
    for (let i = 0; i < WAVE_BARS; i += 1) {
      const bar = global.document.createElement("span");
      const height = 28 + Math.round(Math.sin(i * 0.55) * 14 + Math.cos(i * 0.31) * 10);
      bar.style.setProperty("--bar-h", `${Math.max(22, Math.min(88, height))}%`);
      bar.style.setProperty("--bar-delay", `${(i % 10) * 55}ms`);
      fragment.appendChild(bar);
    }
    container.appendChild(fragment);
  }

  function createRecapController(options = {}) {
    const {
      lessonId,
      basePath = "",
      audioEl = null,
      hintEl = null,
      unlockedEl = null,
      emblemFrameEl = null,
      emblemImgEl = null,
      emblemGhostEl = null,
      emblemLockEl = null,
      playBtnEl = null,
      scrubberEl = null,
      timeEl = null,
      waveformEl = null,
      completionRatio = DEFAULT_COMPLETION_RATIO,
      onAwarded = () => {},
    } = options;

    const cardEl = emblemFrameEl?.closest(".lesson-revision-recap-card") || null;
    const emblemId = getEmblemIdForLesson(lessonId);
    let awardedThisSession = false;
    let maxProgress = 0;
    let wired = false;
    let scrubbing = false;

    function alreadyEarned() {
      if (!emblemId) return false;
      return global.EvoStudentProfile?.hasEmblem?.(emblemId) ?? false;
    }

    function setPlayingState(isPlaying) {
      if (playBtnEl) {
        playBtnEl.classList.toggle("is-playing", isPlaying);
        playBtnEl.setAttribute("aria-label", isPlaying ? "Pause lesson recap" : "Play lesson recap");
      }
      if (cardEl) cardEl.classList.toggle("is-playing", isPlaying);
      if (waveformEl) waveformEl.classList.toggle("is-playing", isPlaying);
    }

    function updateProgressUi() {
      if (!audioEl) return;
      const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      const current = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
      const ratio = duration > 0 ? current / duration : 0;
      if (scrubberEl && !scrubbing) scrubberEl.value = String(ratio * 100);
      if (timeEl) {
        timeEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      }
    }

    function refreshUi(earned) {
      const hasEmblem = earned || alreadyEarned();
      if (hintEl) {
        hintEl.textContent = hasEmblem
          ? "Emblem earned — nice work!"
          : "Listen to 90% to unlock your emblem";
        hintEl.classList.toggle("is-earned", hasEmblem);
      }
      if (unlockedEl) {
        unlockedEl.hidden = !hasEmblem;
        if (hasEmblem && !unlockedEl.querySelector(".recap-unlocked-spark")) {
          unlockedEl.innerHTML = `<span class="recap-unlocked-spark" aria-hidden="true">✦</span> ${
            awardedThisSession ? "Emblem unlocked! Check your profile." : "Emblem earned. See it on your profile."
          }`;
        }
      }
      if (emblemFrameEl) {
        emblemFrameEl.classList.toggle("is-earned", hasEmblem);
        emblemFrameEl.classList.toggle("is-locked", !hasEmblem);
      }
      if (emblemImgEl) {
        emblemImgEl.hidden = !emblemImgEl.src;
        emblemImgEl.classList.toggle("is-earned", hasEmblem);
      }
      if (emblemGhostEl) emblemGhostEl.hidden = hasEmblem || Boolean(emblemImgEl?.src);
      if (emblemLockEl) emblemLockEl.hidden = hasEmblem;
      if (cardEl) {
        cardEl.classList.toggle("is-earned", hasEmblem);
        cardEl.classList.toggle("is-locked", !hasEmblem);
      }
      if (audioEl) audioEl.dataset.emblemEarned = hasEmblem ? "true" : "false";
    }

    function tryAward() {
      if (!emblemId || awardedThisSession || alreadyEarned()) {
        refreshUi(alreadyEarned());
        return false;
      }
      const result = global.EvoStudentProfile?.awardEmblem?.(emblemId);
      if (result?.awarded) {
        awardedThisSession = true;
        refreshUi(true);
        if (cardEl) {
          cardEl.classList.add("is-celebrating");
          global.setTimeout(() => cardEl.classList.remove("is-celebrating"), 2000);
        }
        try { onAwarded(result); } catch { /* ignore */ }
        return true;
      }
      refreshUi(alreadyEarned());
      return false;
    }

    function onTimeUpdate() {
      updateProgressUi();
      if (!audioEl || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
      maxProgress = Math.max(maxProgress, audioEl.currentTime / audioEl.duration);
      if (maxProgress >= completionRatio) tryAward();
    }

    function onEnded() {
      setPlayingState(false);
      updateProgressUi();
      tryAward();
    }

    function togglePlayback() {
      if (!audioEl) return;
      if (audioEl.paused) {
        audioEl.play().then(() => setPlayingState(true)).catch(() => setPlayingState(false));
      } else {
        audioEl.pause();
        setPlayingState(false);
      }
    }

    function seekFromRatio(ratio) {
      if (!audioEl || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
      audioEl.currentTime = Math.min(audioEl.duration, Math.max(0, ratio * audioEl.duration));
      updateProgressUi();
    }

    function wireAudioEvents() {
      if (!audioEl || wired) return;
      wired = true;
      audioEl.addEventListener("timeupdate", onTimeUpdate);
      audioEl.addEventListener("ended", onEnded);
      audioEl.addEventListener("loadedmetadata", updateProgressUi);
      audioEl.addEventListener("pause", () => setPlayingState(false));
      audioEl.addEventListener("play", () => setPlayingState(true));

      if (playBtnEl) playBtnEl.addEventListener("click", togglePlayback);

      if (scrubberEl) {
        scrubberEl.addEventListener("input", () => {
          scrubbing = true;
          seekFromRatio(Number(scrubberEl.value) / 100);
        });
        scrubberEl.addEventListener("change", () => { scrubbing = false; });
      }
    }

    async function init() {
      if (!audioEl || !lessonId) return { ok: false, reason: "missing-config" };

      if (waveformEl) buildWaveform(waveformEl);

      if (emblemImgEl && emblemId) {
        const emblemSrc = resolveEmblemImage(basePath, emblemId);
        if (emblemSrc) {
          emblemImgEl.src = emblemSrc;
          emblemImgEl.alt = global.EvoStudentProfile?.getEmblemMeta?.(emblemId)?.title || "Lesson emblem";
          emblemImgEl.addEventListener("load", () => refreshUi(alreadyEarned()), { once: true });
        }
      }

      const url = await resolveRecapAudioUrl(basePath, lessonId);
      if (!url) return { ok: false, reason: "no-audio-config" };
      audioEl.src = url;
      wireAudioEvents();
      refreshUi(alreadyEarned());
      updateProgressUi();
      return { ok: true, url, emblemId };
    }

    return {
      init,
      tryAward,
      refreshUi,
      getEmblemId: () => emblemId,
      alreadyEarned,
    };
  }

  global.EvoLessonRevisionRecap = {
    RECAP_AUDIO_BY_LESSON,
    DEFAULT_COMPLETION_RATIO,
    resolveRecapAudioUrl,
    resolveEmblemImage,
    getEmblemIdForLesson,
    createRecapController,
  };
})(window);
