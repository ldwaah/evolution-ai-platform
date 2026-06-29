# Local review (no Netlify deploy)

Review changes on localhost only. Do not run `netlify deploy` for this work until the user asks.

## Quick start

From the project root:

```bash
python3 -m http.server 8080
```

Open:

- App: http://localhost:8080/index.html
- Lesson 1 revision (after completing the lesson): http://localhost:8080/lessons/citizenship/module-1/lesson-1.html?revision=1

## Revision mode checklist

1. Complete Lesson 1 normally (slides, end quiz, mark complete).
2. On the module map, scroll to the **Revision** section and choose **Open revision** for Lesson 1.
3. Skim slides with free navigation and optional 1.5× slide narration.
4. Scroll to the **Lesson recap** card and play the recap MP3.
5. After 90%+ listened (or the track ends), confirm the emblem unlocked message.
6. Open **Your profile** and check the **Emblems** section for **Lesson 1 recap**.

## Recap audio

Add your file at:

`assets/audio/citizenship/lesson-1/lesson-one-recap.mp3`

See `assets/audio/citizenship/lesson-1/README.md` for alternate filenames.

## Emblem id

`lesson-1-recap`

Stored on `evoStudentProfile` as:

```json
"emblems": [{ "id": "lesson-1-recap", "earnedAt": "2026-06-28T12:00:00.000Z" }]
```
