# Lesson 1 Narration Scripts – Who Are We?

One file per scene, ready for Claude to turn into TTS audio.

**Folder:** `narration-scripts/citizenship/module-1/lesson-1/`

## How to use with Claude

1. **Attach this entire folder** to your Claude chat (or drag the folder into the project/files panel).
2. **Work one scene at a time** — open a single `scene-XX-*.txt` file and ask Claude to generate audio from it.
3. **Or batch** — attach `lesson-1-full-script.md` and ask Claude to process scenes in order, one MP3 per scene.

Each `.txt` file contains:
- Scene title and lesson context (for Claude, not read aloud)
- The narration text only (what Claude should speak)
- Output filename, duration target, and voice notes (metadata, not read aloud)

## Suggested prompt (one scene)

Copy this into Claude with one scene file attached:

```
Read the attached narration script file. Generate spoken audio (MP3) for the narration text only.

Rules:
- Do NOT read the scene title, lesson line, or the metadata after the --- divider aloud.
- Speak only the main narration paragraph(s).
- Voice: calm UK teacher, GCSE Citizenship, clear pace, natural classroom tone.
- Match the duration target in the file if possible.
- Save the file using the exact Output filename from the script.

After generating, confirm the filename so I can place it in:
assets/audio/citizenship/lesson-1/
```

## Suggested prompt (batch)

```
I have attached lesson-1-full-script.md with 27 scenes for EVOlearn GCSE Citizenship Lesson 1.

For each scene (1–27), generate one MP3 using the narration text only (not headings or metadata).

Voice: calm UK teacher, GCSE Citizenship, clear pace.

Name each file:
scene-01-welcome.mp3
scene-02-who-are-we.mp3
…through scene-27-gcse-challenge.mp3

Process scenes in order. Confirm each filename as you go.
```

## Output MP3 naming

Save generated files here:

```
assets/audio/citizenship/lesson-1/scene-01-welcome.mp3
assets/audio/citizenship/lesson-1/scene-02-who-are-we.mp3
…
assets/audio/citizenship/lesson-1/scene-27-gcse-challenge.mp3
```

| Scene | Script file | Output MP3 |
|------:|-------------|------------|
| 1 | `scene-01-welcome.txt` | `scene-01-welcome.mp3` |
| 2 | `scene-02-who-are-we.txt` | `scene-02-who-are-we.mp3` |
| 3 | `scene-03-individual-identity.txt` | `scene-03-individual-identity.mp3` |
| 4 | `scene-04-a-big-question.txt` | `scene-04-a-big-question.mp3` |
| 5 | `scene-05-the-teachers-layers.txt` | `scene-05-the-teachers-layers.mp3` |
| 6 | `scene-06-your-family-roles.txt` | `scene-06-your-family-roles.mp3` |
| 7 | `scene-07-the-parent-role.txt` | `scene-07-the-parent-role.mp3` |
| 8 | `scene-08-the-student-role.txt` | `scene-08-the-student-role.mp3` |
| 9 | `scene-09-many-roles-one-person.txt` | `scene-09-many-roles-one-person.mp3` |
| 10 | `scene-10-your-smartphone-identity.txt` | `scene-10-your-smartphone-identity.mp3` |
| 11 | `scene-11-your-digital-identity.txt` | `scene-11-your-digital-identity.mp3` |
| 12 | `scene-12-part-two-story-of-the-uk.txt` | `scene-12-part-two-story-of-the-uk.mp3` |
| 13 | `scene-13-what-is-migration.txt` | `scene-13-what-is-migration.mp3` |
| 14 | `scene-14-push-and-pull-factors.txt` | `scene-14-push-and-pull-factors.mp3` |
| 15 | `scene-15-britain-after-ww2.txt` | `scene-15-britain-after-ww2.mp3` |
| 16 | `scene-16-the-windrush-generation.txt` | `scene-16-the-windrush-generation.mp3` |
| 17 | `scene-17-new-communities.txt` | `scene-17-new-communities.mp3` |
| 18 | `scene-18-modern-britain.txt` | `scene-18-modern-britain.mp3` |
| 19 | `scene-19-music-and-culture.txt` | `scene-19-music-and-culture.mp3` |
| 20 | `scene-20-grime-and-drill.txt` | `scene-20-grime-and-drill.mp3` |
| 21 | `scene-21-food.txt` | `scene-21-food.mp3` |
| 22 | `scene-22-language.txt` | `scene-22-language.mp3` |
| 23 | `scene-23-part-three-where-we-belong.txt` | `scene-23-part-three-where-we-belong.mp3` |
| 24 | `scene-24-our-local-community.txt` | `scene-24-our-local-community.mp3` |
| 25 | `scene-25-the-wider-united-kingdom.txt` | `scene-25-the-wider-united-kingdom.mp3` |
| 26 | `scene-26-reflection.txt` | `scene-26-reflection.mp3` |
| 27 | `scene-27-gcse-challenge.txt` | `scene-27-gcse-challenge.mp3` |

## Scene ↔ slide mapping

- Scenes **1–26** map to lesson slides **1–26** (PNG `1.png`–`26.png`).
- Scene **27** is the GCSE challenge / quiz intro (plays after slide 26).

## Re-recording a single slide

If one slide needs a new take, attach only that scene file (e.g. `scene-14-push-and-pull-factors.txt`) and use the single-scene prompt above. You do not need to regenerate all 27 files.

## Source

Script text from the master narration scripts and `assets/data/knowledge/british-identity-values.json` (Lesson 1, Module 1).
