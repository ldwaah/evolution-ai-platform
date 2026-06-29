# Citizenship knowledge base

Topic content lives in `assets/data/knowledge/*.json` (indexed by `index.json`). The tutor engine loads level-specific summaries, slide hints, topic FAQs, and misconceptions from those files.

## Student question bank

Pre-empted student questions live in `assets/data/knowledge/student-questions/`. The tutor checks this bank **after** the current slide’s FAQs and **before** topic FAQs, so lesson-specific phrasing is answered first.

### Add questions for a lesson

1. Create or edit `student-questions/lesson-N.json` using this shape:

```json
{
  "lessonId": "lesson-1",
  "topicId": "british-identity-values",
  "questions": [
    {
      "id": "q-unique-id",
      "patterns": ["what is identity", "what does identity mean"],
      "slideIndex": 1,
      "levelMin": 1,
      "levelMax": 9,
      "question": "What is identity?",
      "answer": "Full GCSE-appropriate answer for levels 3+.",
      "tutorHint": "Short plain-English line for levels 1–2 (Nova-friendly)."
    }
  ]
}
```

2. Register the bank in `student-questions/index.json`:

```json
{
  "banks": [
    {
      "lessonId": "lesson-1",
      "topicId": "british-identity-values",
      "file": "lesson-1.json",
      "questionCount": 23
    }
  ]
}
```

3. Run validation and smoke tests:

```bash
node scripts/validate-kb.mjs
node scripts/test-tutor-engine.mjs
```

## In-lesson worksheets

Mid-lesson pop-up quick checks live in `assets/data/lesson-worksheets/`. See [lesson-worksheets/README.md](../lesson-worksheets/README.md) for schema, lesson wiring, and validation (`node scripts/validate-worksheets.mjs`).

### Field notes

| Field | Purpose |
|-------|---------|
| `patterns` | Lowercase phrases matched against the student message (substring match). Add common misspellings and short forms. |
| `slideIndex` | Optional. When set, matches on that slide score higher. Use `null` for lesson-wide questions. |
| `levelMin` / `levelMax` | Optional band filter. Omit for all levels. |
| `answer` | Main stored reply. |
| `tutorHint` | Used at levels 1–2 when present; keeps replies short for Nova/Milo bands. |

Topic-level FAQs in `british-identity-values.json` (and other topic files) still apply for terms not covered in the student bank. Slide scripts and `slides[N].faqs` in topic files remain the most specific layer for the active slide.

## Topic files

Each topic JSON includes `levels` (1–9), `faqs`, `slides`, `misconceptions`, and `commandWords`. Regenerate stubs with:

```bash
node scripts/generate-citizenship-kb.mjs
```

Hand-edit `british-identity-values.json` (or others) for slide scripts, openers, and enrichment — the generator preserves existing slide content where documented in `generate-citizenship-kb.mjs`.

## In-lesson worksheets

Mid-lesson pop-up quick checks live in `assets/data/lesson-worksheets/`. See [`lesson-worksheets/README.md`](../lesson-worksheets/README.md) for schema, types (`word-bank-pick`, `binary-sort`), slide triggers, and how to wire `lesson-worksheet.js` into a lesson page.

```bash
node scripts/validate-worksheets.mjs
```
