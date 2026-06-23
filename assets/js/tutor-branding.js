(function (global) {
  const STORAGE_KEYS = {
    suggestedTutor: "evoSuggestedTutor",
    assignedTutor: "evoAssignedTutor"
  };

  const DEFAULT_TUTOR_ID = "nova";
  const TUTORS_CONFIG_URL = "assets/data/tutors.json";

  function slugFromName(name) {
    return (name || DEFAULT_TUTOR_ID).toLowerCase();
  }

  function findTutorById(tutors, id) {
    if (!id) return null;
    const slug = String(id).toLowerCase();
    return tutors.find((tutor) => tutor.id === slug)
      || tutors.find((tutor) => slugFromName(tutor.name) === slug)
      || null;
  }

  function findTutorByIndex(tutors, index) {
    if (typeof index !== "number" || index < 0 || index >= tutors.length) return null;
    return tutors[index];
  }

  function loadAssignedPlacement() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEYS.assignedTutor);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (typeof data.tutorIndex !== "number" || !data.tutorName) return null;
      return data;
    } catch {
      return null;
    }
  }

  function loadSuggestedPlacement() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEYS.suggestedTutor);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.status !== "pending") return null;
      if (typeof data.tutorIndex !== "number") return null;
      return data;
    } catch {
      return null;
    }
  }

  function resolveActiveTutor(tutors, searchParams) {
    const params = searchParams || new URLSearchParams(global.location.search);
    const urlTutor = params.get("tutor");
    if (urlTutor) {
      const fromUrl = findTutorById(tutors, urlTutor);
      if (fromUrl) return fromUrl;
    }

    const assigned = loadAssignedPlacement();
    if (assigned) {
      const fromAssigned = findTutorByIndex(tutors, assigned.tutorIndex);
      if (fromAssigned) return fromAssigned;
    }

    const suggested = loadSuggestedPlacement();
    if (suggested) {
      const fromSuggested = findTutorByIndex(tutors, suggested.tutorIndex);
      if (fromSuggested) return fromSuggested;
    }

    return findTutorById(tutors, DEFAULT_TUTOR_ID) || tutors[0];
  }

  function getActiveTutorSlug(tutors) {
    return resolveActiveTutor(tutors).id;
  }

  function applyLessonBranding(tutor, root) {
    const doc = root || global.document;
    const name = tutor.name;
    const level = tutor.level;

    const avatarImg = doc.querySelector("#tutor-avatar");
    if (avatarImg) {
      avatarImg.src = tutor.image;
      avatarImg.alt = `${name} tutor avatar`;
    }

    const avatarCard = doc.querySelector("#avatar-card");
    if (avatarCard) avatarCard.setAttribute("aria-label", `${name} avatar`);

    const chatCard = doc.querySelector("#chat-card");
    if (chatCard) chatCard.setAttribute("aria-label", `Ask ${name} chat`);

    const chatHeading = doc.querySelector("#chat-heading");
    if (chatHeading) chatHeading.textContent = `Ask ${name}`;

    const chatSubheading = doc.querySelector("#chat-subheading");
    if (chatSubheading) chatSubheading.textContent = `${name} explains this lesson at ${level} level.`;

    const chatInput = doc.querySelector("#chat-input");
    if (chatInput) chatInput.placeholder = `Ask ${name} a question`;

    const startCopy = doc.querySelector("#lesson-start-copy");
    if (startCopy) startCopy.textContent = `Press start to begin. ${name} will guide you through each slide.`;

    doc.title = `Lesson Template · ${name}`;
  }

  async function loadTutorsConfig() {
    const response = await fetch(TUTORS_CONFIG_URL);
    if (!response.ok) {
      throw new Error("Failed to load tutors");
    }
    const data = await response.json();
    return data.tutors || [];
  }

  global.EvoTutorBranding = {
    STORAGE_KEYS,
    DEFAULT_TUTOR_ID,
    TUTORS_CONFIG_URL,
    loadTutorsConfig,
    resolveActiveTutor,
    getActiveTutorSlug,
    applyLessonBranding,
    loadAssignedPlacement,
    loadSuggestedPlacement,
    findTutorById,
    findTutorByIndex
  };
})(window);
