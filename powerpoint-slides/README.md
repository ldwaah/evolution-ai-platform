# PowerPoint slides

Drop your `.pptx` files into the lesson folders below. Each slot has a pre-created placeholder filename — replace the placeholder with your real deck slide.

## How to add slides

1. Open the lesson folder (e.g. `citizenship/module-1/lesson-1/`).
2. Save or copy your PowerPoint slide using the **exact target filename** (without `.placeholder`).
3. Delete the `.placeholder` file once your `.pptx` is in place.

Example: replace `01-title-who-are-we.pptx.placeholder` with `01-title-who-are-we.pptx`.

## Video slots (not PowerPoint)

Some slots are **video only** — do not drop a `.pptx` there. Look for a `*-NOTE.txt` file instead; it documents the MP4 path used in the lesson.

## Exporting slides for the web

Lesson HTML shows exported PNGs from the lesson’s `lesson-one/` subfolder (or `exports/` if you used the LibreOffice script). Drop split slides as `1.png`, `2.png`, … in:

`powerpoint-slides/citizenship/module-1/lesson-1/lesson-one/`

Legacy automated exports still land in `exports/` as zero-padded `01.png`, `02.png`, … — use that folder only when running the script below.

### Recommended: export from PowerPoint (best fidelity)

If you have Microsoft PowerPoint on Mac or Windows:

1. Open the deck in PowerPoint.
2. **File → Export → PNG** (or **Save as Pictures** on Mac).
3. Choose **1920 × 1080** (or “All Slides”).
4. Copy the files into `lesson-one/` as `1.png`, `2.png`, etc. (or into `exports/` as `01.png`, `02.png` if using the script).
5. Bump `PPT_EXPORT_VERSION` in the lesson HTML (e.g. `lesson-1.html`) so browsers fetch the new images.

This avoids layout bugs with Google Slides decks that use multi-colour titles.

### Automated export (LibreOffice — good for bulk, not perfect)

From the repo root:

```bash
./scripts/export-ppt-slides.sh \
  powerpoint-slides/citizenship/module-1/lesson-1/citizenship-lesson-1.pptx \
  powerpoint-slides/citizenship/module-1/lesson-1/exports
```

The script runs `fix-pptx-autofit.mjs` and `fix-slide1-title.mjs` before converting. **LibreOffice can still mis-render some Google Slides layouts** — if a slide looks wrong, re-export that slide manually from PowerPoint.

Requirements: LibreOffice (`soffice`) and poppler (`pdftoppm`).

### After exporting

- Update `PPT_EXPORT_VERSION` in the lesson HTML to bust browser cache.
- Deploy the site so `lesson-one/*.png` (or `exports/*.png`) and the HTML update go live together.

## Tutor knowledge and student questions

Slide scripts and tutor hints live in `assets/data/knowledge/` (see `assets/data/knowledge/README.md`). Pre-empted student Q&A for live chat is stored in `assets/data/knowledge/student-questions/` — add patterns there when students ask the same thing in class.

## Tutor Q&A for this lesson

Student questions the AI tutor can answer are stored separately from slide PNGs:

- **Question bank:** `assets/data/knowledge/student-questions/lesson-1.json`
- **How to add more:** see `assets/data/knowledge/README.md`

When you add new slide scripts or topics, add matching `patterns` and answers there, then run `node scripts/validate-kb.mjs`.

## Folder naming

Paths use `powerpoint-slides/` (hyphens) for URLs and file paths. On disk you may also refer to this as “powerpoint slides” in conversation — they are the same folder.
