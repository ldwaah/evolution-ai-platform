document.addEventListener("DOMContentLoaded", async () => {
  const depth = location.pathname.includes("/lessons/") ? "../../../" : "";
  const chatMode = document.body?.dataset?.chatMode;

  if (window.EvoStudentProfile) {
    await window.EvoStudentProfile.initLessonPage(depth);
  }

  if (chatMode === "live") {
    return;
  }

  if (window.EvoAgentKnowledge) {
    await window.EvoAgentKnowledge.renderLessonPreview({
      basePath: depth,
    });
  }
});
