/**
 * Shared live-chat bootstrap for scroll and PPT lessons.
 * PPT lessons: use EvoLessonPptViewer.updateStudentChatBadge for the chat badge
 * (generic "Lesson" / "End quiz") — never expose slide numbers to students.
 */
(function (global) {
  async function init(options) {
    const {
      lessonId,
      basePath = "../../../",
      getSlideContext,
      updateChatBadge,
      showSource = false,
      revisionMode: revisionModeOption,
    } = options;

    const chatInput = document.getElementById("chat-input")
      || document.querySelector(".lesson-chat-input-shell input");
    const chatSend = document.getElementById("chat-send")
      || document.querySelector(".lesson-chat-input-shell button");
    const chatBody = document.getElementById("chat-body")
      || document.querySelector(".lesson-chat-body");
    const chatBadge = document.querySelector(".lesson-chat-badge");

    if (!window.EvoTutorEngine || !chatBody || !chatInput) return null;

    const revisionMode = revisionModeOption
      ?? window.EvoTutorEngine.resolveRevisionMode?.({}, getSlideContext?.())
      ?? global.EvoLessonPptViewer?.detectRevisionMode?.()
      ?? false;

    const ctx = await window.EvoTutorEngine.resolveLessonContext({ basePath, lessonId });
    const tutorName = ctx?.agent?.name || "your tutor";

    chatInput.disabled = false;
    chatInput.removeAttribute("aria-disabled");
    chatInput.placeholder = revisionMode
      ? (window.EvoTutorEngine.revisionChatPlaceholder?.(tutorName) || `Ask ${tutorName} for key facts…`)
      : `Ask ${tutorName} about this lesson…`;
    if (chatSend) {
      chatSend.disabled = false;
      chatSend.removeAttribute("aria-disabled");
    }
    if (chatBadge) {
      if (revisionMode) {
        chatBadge.textContent = global.EvoLessonPptViewer?.LABEL_REVISION || "Revision";
        chatBadge.classList.add("is-revision");
        chatBadge.classList.remove("is-live");
      } else if (global.EvoLessonPptViewer?.isStudentMode?.()) {
        chatBadge.textContent = global.EvoLessonPptViewer.LABEL_LESSON;
      } else {
        chatBadge.textContent = "Live";
        chatBadge.classList.add("is-live");
      }
    }
    if (typeof updateChatBadge === "function") updateChatBadge();

    chatBody.innerHTML = "";

    const chat = window.EvoTutorEngine.initLessonChat({
      basePath,
      lessonId,
      getSlide: getSlideContext || (() => null),
      updateContext: updateChatBadge || (() => {}),
      showSource,
      revisionMode,
      tutorName,
      chatMode: document.body?.dataset?.chatMode || "live",
    });

    if (chat) await chat.seedGreeting();
    return chat;
  }

  function scrollSlideContext() {
    const h1 = document.querySelector(".lesson-content h1");
    const card = document.querySelector(".lesson-content-card h2");
    return {
      slideIndex: 0,
      title: h1?.textContent?.trim() || "",
      note: card?.textContent?.trim() || "",
    };
  }

  global.EvoLessonLiveChat = {
    init,
    scrollSlideContext,
  };
})(window);
