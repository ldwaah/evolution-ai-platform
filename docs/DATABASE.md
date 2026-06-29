# EVOlearn database backend

EVOlearn uses **Cloud Firestore** and **Firebase Authentication** behind the static Netlify site. **localStorage remains the offline-first cache** on each device; when Firebase is configured and the browser is online, student progress syncs to the cloud. Teachers use the **teacher portal** to approve tutor placements and view class progress.

## URLs (local review)

```bash
python3 -m http.server 8080
```

| Page | URL |
|------|-----|
| Student sign in | http://localhost:8080/login.html |
| Student app | http://localhost:8080/index.html |
| **Teacher portal** | http://localhost:8080/teacher/index.html |
| Placement assessment | http://localhost:8080/assessment/citizenship.html |

## Client-side data (localStorage)

| Key | Module | Purpose |
|-----|--------|---------|
| `evoStudentProfile` | `student-profile.js` | Tutor, level, points, emblems, `tutorStatus`, assessment scores |
| `evoSuggestedTutor` | assessment | Full placement diagnostic result |
| `evoLessonQuizHistory` | `student-profile.js` | Lesson quiz attempt evidence |
| `evolearn-progress` | `lesson-completion.js` | Completed lesson keys |
| `evoEndQuizAnswers` | `lesson-end-quiz.js` | End-of-lesson quiz answers per lesson |
| `evoWorksheetAnswers` | `lesson-worksheet.js` | Mid-lesson worksheet responses |
| `evolearn-stats` | `app.js` | Day streak (`streak`, `lastActive`, `best`) |
| `evoTutorQuizHistory` | assessment | Placement assessment attempt audit trail |
| `evolearn-voice` | — | Narration voice preference |
| `evolearn-role` | `login.html` | `student` or `teacher` |
| `evoPendingPlacements` | assessment (legacy) | Staff placement review queue |
| `evoStudentId` | `student-sync.js` | Device / Firebase uid |
| `evoSchoolId` | `student-sync.js` | School partition (default `demo`) |
| `evoSyncQueue` | `student-sync.js` | Pending Firestore writes when offline |

### New profile fields (tutor approval)

| Field | Values | Meaning |
|-------|--------|---------|
| `tutorStatus` | `pending` \| `approved` \| `rejected` | Teacher workflow state |
| `suggestedTutorId` | e.g. `nova` | Tutor suggested after placement assessment |
| `assignedTutorId` | e.g. `zara` | Tutor confirmed by teacher (may differ from suggestion) |

After assessment, students learn with the **suggested tutor** while `tutorStatus` is `pending`. A banner shows: *Waiting for teacher approval*. Once approved, `assignedTutorId` is used on next sync/load.

## Firestore schema

```
users/{uid}
  role: "student" | "teacher"
  schoolId: "demo"
  displayName, email, createdAt

schools/{schoolId}
  (school metadata — optional)

schools/{schoolId}/teachers/{uid}
  displayName, email, schoolId, role: "teacher"

schools/{schoolId}/students/{uid}
  displayName, email, schoolId
  level, levelLabel, combinedScore, learningScore, points
  tutorStatus, suggestedTutorId, assignedTutorId
  agentId, agentName, tutorIndex
  emblems[], assessedAt, lastActiveAt
  createdAt, updatedAt

schools/{schoolId}/students/{uid}/progress/main
  version, updatedAt, lastSyncReason
  localStorage: { all persist keys as raw snapshot }
  profile, lessonProgress, endQuizAnswers, worksheetAnswers
  lessonQuizHistory, suggestedTutor, tutorQuizHistory
  stats, voicePreference, role, pendingPlacements
  legacyQuizAnswers, emblems[], points

schools/{schoolId}/students/{uid}/events/{eventId}
  type, lessonId, moduleId, payload, timestamp

schools/{schoolId}/students/{uid}/signals/{signalId}
  type: "assessment_complete" | "end_lesson_quiz_complete" | "tutor_chat"
  lessonId, moduleId, topicId, slideIndex
  createdAt
  payload: structured signal payload (see below)
```

**Event types:** `assessment_complete`, `lesson_complete`, `quiz_result`, `profile_update`, `sync_all`

**Defaults:** `schoolId = demo`, `studentId = Firebase Auth uid`.

## Learning signals (for AI snapshot)

Signals are stored separately from `progress/main` so server-side AI can fetch a compact “student snapshot” without pulling the entire localStorage mirror.

### `signals` document shapes

- **`assessment_complete`**
  - `payload.level`: number
  - `payload.scores`: `{ combined, stage1, stage2 }`
  - `payload.suggestedTutorId`: string
  - `payload.tutorStatus`: `pending | approved | rejected`
  - `payload.completedAt`: ISO string

- **`end_lesson_quiz_complete`**
  - `payload.lessonId`, `payload.moduleId`, `payload.quizId`, `payload.quizTitle`
  - `payload.score`: `{ correct, max }`
  - `payload.perQuestion`: `{ questionId, correct, selectedIndex, correctIndex, topicId }[]`
  - `payload.wrongTopics`: `string[]` (only present when quiz questions provide topic ids)
  - `payload.completedAt`: ISO string

- **`tutor_chat`** (lightweight, no raw chat by default)
  - `payload.lessonId`, `payload.moduleId`, `payload.topicId`, `payload.slideIndex`
  - `payload.intent`: `greeting | smalltalk | confusion | personal | thanks | goodbye | null`
  - `payload.questionCategory`: `academic | social | other`
  - `payload.misconceptionTags`: `string[]`
  - `payload.timestamp`: ISO string

## Security rules

Deploy `firestore.rules`:

- **Students** read/write their own `schools/{schoolId}/students/{uid}` and `progress/main` when `users/{uid}.role == "student"`.
- **Teachers** read all students in their `schoolId`; may **update tutor approval fields only** on student docs.
- **Users** read/write their own `users/{uid}` document.

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use YOUR_PROJECT_ID
npx -y firebase-tools@latest deploy --only firestore:rules
```

Enable **Email/Password** and optionally **Anonymous** in Firebase Console → Authentication.

**Production:** https://evolearn.evolveone.ai (Netlify site `evolution-ai-platform`; default subdomain https://evolution-ai-platform.netlify.app still works).

Add these under Firebase Console → Authentication → Settings → **Authorised domains**:

- `localhost`
- `evolearn.evolveone.ai`
- `evolution-ai-platform.netlify.app` (optional, for the default Netlify URL)

Keep `authDomain` in config as `student-portal-9de85.firebaseapp.com` (do not set it to the custom domain).

## Enable Firebase on the static site

Replace placeholders in `assets/js/firebase-config.js`, or inject before scripts:

```html
<script>
  window.EVO_FIREBASE_CONFIG = {
    apiKey: "...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "...",
    appId: "...",
  };
</script>
```

For local overrides, copy `assets/js/firebase-config.local.example.js` → `firebase-config.local.js` (gitignored).

If config is missing, the app and teacher portal degrade gracefully (guest mode / “not configured” message).

## Create the first teacher account

Teachers are **not** self-service in the app yet. Provision manually:

### 1. Firebase Console → Authentication → Add user

Create a user, e.g. `teacher@demo.school` with a secure password.

### 2. Firestore → add role documents

Use the new user’s **uid** from Authentication.

**`users/{teacherUid}`**

```json
{
  "role": "teacher",
  "schoolId": "demo",
  "displayName": "Demo Teacher",
  "email": "teacher@demo.school"
}
```

**`schools/demo/teachers/{teacherUid}`**

```json
{
  "role": "teacher",
  "schoolId": "demo",
  "displayName": "Demo Teacher",
  "email": "teacher@demo.school"
}
```

### 3. Sign in

Open http://localhost:8080/teacher/index.html and sign in with the teacher email and password.

### Demo credentials (documentation only)

For local demos, you may use placeholder values in internal runbooks — **do not commit real passwords**. Example labels only:

- Email: `teacher@demo.school`
- Password: *(set in Firebase Console; not stored in repo)*

## Student account flow

1. Student creates account at `login.html` (or continues as guest without cloud sync).
2. Completes placement assessment → `tutorStatus: pending`, `suggestedTutorId` set, profile synced.
3. Teacher approves on teacher portal → `tutorStatus: approved`, `assignedTutorId` set.
4. Student’s next load pulls cloud profile via `EvoStudentSync.loadProgressIntoLocal`.

**sessionStorage only (never synced):** `evolearn-entered`, `evolearn-unlocked`, `evolearn-toast`, `evolearn-skip-select`, `evolearn-preferred-tutor`, `evoTutorMemory` (tutor chat memory).

## Sync points

| Action | Cloud write | Where |
|--------|-------------|-------|
| Profile save | student doc + `progress/main` | `student-profile.js` |
| Placement assessment | student doc + event | `assignFromAssessment` |
| Lesson complete | `progress/main` + event | `lesson-completion.js` |
| End quiz | profile + progress + event | `lesson-end-quiz.js` |
| Worksheet submit | `progress/main` | `lesson-worksheet.js` |
| Stats / streak | `progress/main` | `app.js` → `saveStats` |
| Full reset | delete `progress/main` | `lesson-progress-reset.js` event |
| Guest → account | upload local `progress/main` | `student-auth.js` → `signUp` |
| Teacher approve tutor | student doc (approval fields) | `teacher-portal.js` |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Teacher portal shows “not configured” | Set `EVO_FIREBASE_CONFIG` (non-placeholder values) |
| “Not registered as a teacher” | Add `users/{uid}` and `schools/demo/teachers/{uid}` with `role: "teacher"` |
| `permission-denied` on student sync | Deploy rules; ensure student `users/{uid}.role == "student"` |
| Pending tutor never clears on student device | Student must be signed in; reload app to pull cloud profile |
| Debug sync | `window.EVO_SYNC_DEBUG = true` in browser console |

## Files

| File | Purpose |
|------|---------|
| `assets/js/firebase-config.js` | Config + `isConfigured()` |
| `assets/js/student-auth.js` | Student email sign-in / guest |
| `assets/js/student-sync.js` | Firestore read/write + offline queue |
| `assets/js/teacher-auth.js` | Teacher sign-in + role check |
| `assets/js/teacher-portal.js` | Dashboard, approve tutors, progress views |
| `teacher/index.html` | Teacher portal UI |
| `assets/css/teacher-portal.css` | Teacher portal styles |
| `firestore.rules` | Security rules |
