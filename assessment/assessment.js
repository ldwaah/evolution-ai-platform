/* EVOlearn — assessment clipboard guard (paste/copy/cut deterrent) */

const EvoAssessmentGuard = (function () {
  const ANSWER_SELECTOR =
    ".assessment-answer, .assessment-short-input, .assessment-textarea, #assessment-answer-field";
  const STEM_SELECTOR =
    ".assessment-question, .assessment-scenario, .assessment-hint, .assessment-stage, .assessment-meta";

  function isAnswerField(el) {
    return Boolean(el && el.closest && el.closest(ANSWER_SELECTOR));
  }

  function isStemContent(el) {
    return Boolean(el && el.closest && el.closest(STEM_SELECTOR) && !isAnswerField(el));
  }

  function prepareAnswerField(el) {
    if (!el || el.dataset.clipboardGuard === "1") return;
    el.dataset.clipboardGuard = "1";
    el.classList.add("assessment-answer");
    el.setAttribute("autocomplete", "off");
    if (!el.hasAttribute("spellcheck") && (el.tagName === "TEXTAREA" || el.type === "text")) {
      el.setAttribute("spellcheck", el.tagName === "TEXTAREA" ? "true" : "false");
    }
  }

  function bindContainer(container) {
    if (!container || container.dataset.assessmentGuardBound === "1") return;
    container.dataset.assessmentGuardBound = "1";

    container.addEventListener(
      "paste",
      (event) => {
        if (isAnswerField(event.target)) event.preventDefault();
      },
      true
    );

    container.addEventListener(
      "copy",
      (event) => {
        if (isAnswerField(event.target) || isStemContent(event.target)) {
          event.preventDefault();
        }
      },
      true
    );

    container.addEventListener(
      "cut",
      (event) => {
        if (isAnswerField(event.target) || isStemContent(event.target)) {
          event.preventDefault();
        }
      },
      true
    );

    container.addEventListener(
      "drop",
      (event) => {
        if (isAnswerField(event.target)) event.preventDefault();
      },
      true
    );
  }

  function init(root) {
    const container = root || document.getElementById("assessment-body") || document;
    bindContainer(container);
    container.querySelectorAll(ANSWER_SELECTOR).forEach(prepareAnswerField);
  }

  return { init };
})();
