# Evolution AI Platform: Citizenship Assessment Framework

Brief overview for schools using the GCSE Citizenship placement and assessment scaffold.

## Assessment stages

| Stage | Purpose | Status |
| --- | --- | --- |
| **Diagnostic** | Two-stage placement quiz to suggest a tutor band | Live (student quiz + staff review) |
| **Baseline** | Confirmed tutor band after teacher review | Live (staff confirm on dashboard) |
| **Unit checkpoint** | Short quizzes after syllabus units | Roadmap |
| **Summative** | End-of-unit or mock exam style checks | Roadmap |

## Diagnostic placement (live)

Command-word assessment aligned with GCSE Citizenship Studies. Each item shows its command word (identify, describe, explain, apply, discuss, and others) and maps performance to AO1, AO2, and AO3 before suggesting a tutor band.

### Stage 1: AO1 screening (7 questions)

Exam-style multiple choice using lower-tier command words (identify, name, state, define) across rights, responsibilities, democracy, law, and active citizenship. Weight: **60%** of combined placement score. Marks are weighted by command-word tier (harder words score more when used in Stage 2).

### Stage 2: Written command-word tasks (3 to 5 tasks)

Selected based on Stage 1 performance. Task types match the command word:

- **Describe / explain** (paragraph response, AO1 or AO2)
- **List** (bullet-style textarea, multiple points)
- **Apply** (scenario plus written application, AO2)
- **Discuss** (short answer with both sides, AO3)

Weight: **40%** of combined placement score. Higher-tier command words (discuss, evaluate) carry greater mark weight than identify or describe.

## Tutor bands and AOs

Nine tutor bands (Nova through Athena) map to a combined score from 0 to 10. Each band notes primary AO focus:

- **AO1**: Knowledge and understanding of citizenship concepts, terms, and issues
- **AO2**: Applying knowledge to citizenship issues and contexts
- **AO3**: Analysing, evaluating, and reflecting on citizenship issues and actions

Lower bands emphasise AO1 with scaffolding. Higher bands expect more AO2 and AO3 in responses.

## Teacher role

1. Student completes the diagnostic placement quiz on `student.html`.
2. Result is saved as a **suggested tutor** (pending teacher confirmation).
3. Teacher reviews pending placements on the **Students** tab in `dashboard.html`.
4. Teacher **confirms** the suggestion or **adjusts** the tutor band, then confirms.
5. Confirmed band is saved as the student's assigned tutor.

Students see **"Suggested tutor"** until confirmation, then **"Confirmed tutor"** after staff action.

## What this is NOT

- Not full lesson content (lessons remain separate).
- Not an official exam, grade, or certification.
- Not DfE or Ofsted approval or endorsement.
- Not a replacement for professional teacher judgement.

## Roadmap

- Unit checkpoint quizzes tied to syllabus units in the Citizenship framework
- Summative assessments aligned to mock exam structure
- Backend sync so staff see placements across devices (currently localStorage demo)

## localStorage keys (demo)

| Key | Role |
| --- | --- |
| `evoSuggestedTutor` | Pending placement from student quiz |
| `evoAssignedTutor` | Teacher-confirmed tutor band |
| `evoPendingPlacements` | Staff queue (includes demo seed data) |
| `evoTutorQuizHistory` | Audit trail of assessment attempts (includes `commandWord` per item) |

## Files

- `student.html`: placement quiz and tutor tab
- `dashboard.html`: Students tab for teacher confirm/override
- Keep `assessmentFramework` in sync between both files (see sync comments in code)
