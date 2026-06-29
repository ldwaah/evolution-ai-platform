/**
 * EVOlearn — lesson access guard
 * 1. Redirect to placement assessment if profile incomplete
 * 2. Only lessons in PLAYABLE match app.js LESSONS_WITH_PAGES; others redirect to map
 */
(function () {
  const PLAYABLE = new Set([
    "citizenship.module-1.lesson-1",
    "citizenship.module-1.lesson-2",
  ]);

  const body = document.body;
  if (!body?.classList.contains("lesson-body")) return;

  const moduleId = body.dataset.moduleId;
  const lessonId = body.dataset.lessonId;
  if (!moduleId || !lessonId) return;

  const key = `citizenship.${moduleId}.${lessonId}`;

  function hasCompletedAssessment() {
    try {
      return Boolean(window.EvoStudentProfile?.hasCompletedAssessment?.());
    } catch {
      return false;
    }
  }

  if (!hasCompletedAssessment()) {
    location.replace("../../../assessment/citizenship.html?required=1");
    return;
  }

  if (PLAYABLE.has(key)) return;

  sessionStorage.setItem("evolearn-toast", "This lesson is coming soon.");
  location.replace(`../../../index.html#map/${moduleId}`);
})();
