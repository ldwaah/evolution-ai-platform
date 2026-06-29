# In-lesson worksheets

Pop-up quick checks appear **mid-lesson** after specific slides finish narrating. Students must submit before advancing. Answers are stored in `localStorage` under `evoWorksheetAnswers`.

Lesson 1 is the reference implementation (`lesson-1.json` + `assets/js/lesson-worksheet.js` + wiring in `lessons/citizenship/module-1/lesson-1.html`).

## Narration gate (local testing)

`assets/js/lesson-ppt-viewer.js` defines `NARRATION_GATE_ENABLED` at the top of the file. While it is `false`, students can click Next without waiting for slide audio (Play is optional). **Set it to `true` before Netlify deploy** to restore production narration locking.

## Worksheet gate (local testing)

`assets/js/lesson-worksheet.js` defines `WORKSHEET_GATE_ENABLED` at the top of the file. While it is `false`, worksheets are skipped and Next is never blocked by them. **Set it to `true` before Netlify deploy** to restore production worksheet locking.

## Add worksheets for another lesson

### 1. Create the data file

Add `assets/data/lesson-worksheets/lesson-N.json`:

```json
{
  "lessonId": "lesson-2",
  "worksheets": [
    {
      "id": "ws-unique-id",
      "triggerAfterSlideIndex": 7,
      "title": "Quick check: topic",
      "type": "word-bank-pick",
      "instruction": "Default instruction for all levels.",
      "options": ["Option A", "Option B", "Option C"],
      "pickCount": 2,
      "levels": {
        "1": { "instruction": "Simpler wording for access/foundation." },
        "6": { "instruction": "Richer wording for confident bands." }
      },
      "submitMessage": "Optional tutor chat line after submit."
    }
  ]
}
```

**Slide index:** `triggerAfterSlideIndex` is **0-based**, matching PNG/audio slide order. A value of `8` means the worksheet appears after slide 9 (scene 9) narration ends, before slide 10.

### 2. Worksheet types

| `type` | Use for | Required fields |
|--------|---------|-----------------|
| `word-bank-pick` | Tap N options from a list | `options`, `pickCount` |
| `binary-sort` | Tap one of two categories per item | `categories` (`id`, `label`), `items` (`id`, `text`, `correctCategory`) |

`binary-sort` shows **one item at a time**; students tap a category button for each.

### 3. Wire the lesson HTML

In the lesson page inline script:

```javascript
let worksheetCtrl = null;

const narration = EvoLessonPptViewer.createNarrationController({
  // ...
  onGateChange: () => {
    if (narration?.canAdvanceForward?.()) {
      worksheetCtrl?.checkAfterNarration?.(currentSlide);
    }
    updateNav();
  },
});

// In updateNav — block next while narration OR worksheet is locked
const worksheetLocked = worksheetCtrl ? !worksheetCtrl.canAdvanceForward() : false;
nextButton.disabled = !lessonStarted || narrationLocked || worksheetLocked;

// In renderSlide
worksheetCtrl?.onSlideShown?.(currentSlide);

// In changeSlide (forward) — pending worksheet before overlay lock check
if (offset > 0 && worksheetCtrl?.hasPendingWorksheet?.(currentSlide)) {
  worksheetCtrl.checkAfterNarration(currentSlide);
  return;
}
if (offset > 0 && worksheetCtrl && !worksheetCtrl.canAdvanceForward()) return;

// On load
worksheetCtrl = EvoLessonWorksheet.createController({
  lessonId: "lesson-N",
  basePath: "../../../",
  mountEl: document.getElementById("lesson-stage"),
  getSlideIndex: () => currentSlide,
  isEnabled: () => lessonStarted && !quizActive,
  getChat: () => lessonChat,
  onGateChange: () => updateNav(),
});
await worksheetCtrl.init();
```

Load the script **before** the inline lesson script:

```html
<script src="../../../assets/js/lesson-worksheet.js?v=worksheet-1"></script>
```

### 4. Validate

```bash
node scripts/validate-worksheets.mjs
```

### 5. Level-aware copy

Instructions resolve from `levels` using `EvoStudentProfile.getStudentLevel()`. Closest level at or below the student wins; otherwise `instruction` is used.

### 6. Storage shape

```json
{
  "lesson-1": {
    "ws-identity-roles": {
      "worksheetId": "ws-identity-roles",
      "answers": { "type": "word-bank-pick", "picked": ["Student", "Sibling", "Gamer"] },
      "completedAt": "2026-06-28T12:00:00.000Z"
    }
  }
}
```

Completed worksheets are not shown again for that lesson in the same browser.
