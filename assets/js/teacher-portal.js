/**
 * EVOlearn — teacher portal dashboard (students, tutor approval, progress)
 */
(function (global) {
  const TUTOR_STATUS_LABELS = {
    pending: "Pending approval",
    approved: "Approved",
    rejected: "Rejected",
  };

  let tutors = [];
  let students = [];
  let selectedUid = null;
  let session = null;

  function $(id) {
    return global.document.getElementById(id);
  }

  function esc(text) {
    const el = global.document.createElement("span");
    el.textContent = text == null ? "" : String(text);
    return el.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "—";
    }
  }

  function tutorName(id) {
    if (!id) return "—";
    const t = tutors.find((item) => item.id === id);
    return t ? t.name : id;
  }

  async function loadTutors() {
    if (global.EvoStudentProfile?.loadTutorsConfig) {
      tutors = await global.EvoStudentProfile.loadTutorsConfig("../");
    } else {
      try {
        const res = await fetch("../assets/data/tutors.json");
        const data = await res.json();
        tutors = data.tutors || [];
      } catch {
        tutors = [];
      }
    }
  }

  async function fetchStudents(schoolId) {
    const db = global.EvoTeacherAuth.getDb();
    const { collection, getDocs, doc, getDoc } = global.__evoTeacherMods;
    const studentsCol = collection(db, "schools", schoolId, "students");
    const snap = await getDocs(studentsCol);
    const rows = [];

    await Promise.all(snap.docs.map(async (studentDoc) => {
      const data = studentDoc.data();
      let progress = null;
      try {
        const progressSnap = await getDoc(doc(db, "schools", schoolId, "students", studentDoc.id, "progress", "main"));
        progress = progressSnap.exists() ? progressSnap.data() : null;
      } catch { /* ignore */ }
      rows.push({
        uid: studentDoc.id,
        ...data,
        progress,
      });
    }));

    rows.sort((a, b) => {
      const aPending = a.tutorStatus === "pending" ? 0 : 1;
      const bPending = b.tutorStatus === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      const aTime = a.lastActiveAt || a.updatedAt || "";
      const bTime = b.lastActiveAt || b.updatedAt || "";
      return bTime.localeCompare(aTime);
    });

    return rows;
  }

  function countLessons(progress, student) {
    const fromProgress = progress?.completedLessons || progress?.lessonProgress;
    if (Array.isArray(fromProgress)) return fromProgress.length;
    return 0;
  }

  function quizSummary(progress, student) {
    const history = progress?.quizHistory || progress?.lessonQuizHistory;
    if (!Array.isArray(history) || !history.length) return "No quizzes yet";
    const complete = history.filter((item) => item.status === "complete");
    const totalScore = complete.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
    const totalMax = complete.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0);
    if (!totalMax) return `${complete.length} quiz record${complete.length === 1 ? "" : "s"}`;
    const avg = Math.round((totalScore / totalMax) * 100);
    return `${complete.length} quizzes · ${avg}% average`;
  }

  function renderPendingBadge(count) {
    const el = $("tp-pending-count");
    if (!el) return;
    if (count > 0) {
      el.hidden = false;
      el.textContent = `${count} pending`;
    } else {
      el.hidden = true;
    }
  }

  function renderStudentTable() {
    const tbody = $("tp-students-body");
    const empty = $("tp-students-empty");
    if (!tbody) return;

    const pendingCount = students.filter((s) => s.tutorStatus === "pending").length;
    renderPendingBadge(pendingCount);

    if (!students.length) {
      tbody.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    tbody.innerHTML = students.map((student) => {
      const status = student.tutorStatus || "—";
      const statusClass = status === "pending" ? "tp-status tp-status--pending"
        : status === "approved" ? "tp-status tp-status--approved"
          : status === "rejected" ? "tp-status tp-status--rejected" : "tp-status";
      const tutorId = student.assignedTutorId || student.suggestedTutorId || student.agentId;
      const actions = status === "pending"
        ? `<button type="button" class="tp-btn tp-btn--primary" data-action="approve" data-uid="${esc(student.uid)}">Approve</button>
           <button type="button" class="tp-btn tp-btn--ghost" data-action="change" data-uid="${esc(student.uid)}">Change tutor</button>`
        : `<button type="button" class="tp-btn tp-btn--ghost" data-action="view" data-uid="${esc(student.uid)}">View</button>
           <button type="button" class="tp-btn tp-btn--ghost" data-action="change" data-uid="${esc(student.uid)}">Change tutor</button>`;

      return `<tr data-uid="${esc(student.uid)}">
        <td><button type="button" class="tp-link" data-action="view" data-uid="${esc(student.uid)}">${esc(student.displayName || student.email || "Student")}</button></td>
        <td>${student.level ? `Level ${student.level}` : "—"}</td>
        <td>${esc(tutorName(tutorId))}</td>
        <td><span class="${statusClass}">${esc(TUTOR_STATUS_LABELS[status] || status)}</span></td>
        <td>${countLessons(student.progress, student)}</td>
        <td>${esc(quizSummary(student.progress, student))}</td>
        <td>${formatDate(student.lastActiveAt)}</td>
        <td class="tp-actions">${actions}</td>
      </tr>`;
    }).join("");
  }

  function renderStudentDetail(uid) {
    const panel = $("tp-detail");
    const listView = $("tp-list-view");
    if (!panel || !listView) return;

    const student = students.find((s) => s.uid === uid);
    if (!student) return;

    selectedUid = uid;
    listView.hidden = true;
    panel.hidden = false;

    const progress = student.progress || {};
    const lessons = Array.isArray(progress.completedLessons) ? progress.completedLessons
      : Array.isArray(progress.lessonProgress) ? progress.lessonProgress : [];
    const emblems = Array.isArray(student.emblems) ? student.emblems
      : Array.isArray(progress.emblems) ? progress.emblems
        : Array.isArray(progress.profile?.emblems) ? progress.profile.emblems : [];
    const quizHistory = Array.isArray(progress.quizHistory) ? progress.quizHistory
      : Array.isArray(progress.lessonQuizHistory) ? progress.lessonQuizHistory : [];

    $("tp-detail-name").textContent = student.displayName || student.email || "Student";
    $("tp-detail-meta").textContent = [
      student.email,
      student.level ? `Level ${student.level} · ${student.levelLabel || ""}` : null,
      student.combinedScore != null ? `Placement score ${student.combinedScore}/10` : null,
    ].filter(Boolean).join(" · ");

    const tutorId = student.assignedTutorId || student.suggestedTutorId || student.agentId;
    $("tp-detail-tutor").innerHTML = `
      <p><strong>Tutor:</strong> ${esc(tutorName(tutorId))}</p>
      <p><strong>Status:</strong> ${esc(TUTOR_STATUS_LABELS[student.tutorStatus] || student.tutorStatus || "Not set")}</p>
      ${student.tutorStatus === "pending" ? `<p class="tp-note">Suggested tutor after assessment. Approve or choose a different tutor.</p>` : ""}
    `;

    $("tp-detail-lessons").innerHTML = lessons.length
      ? `<ul class="tp-bullet-list">${lessons.map((key) => `<li>${esc(key)}</li>`).join("")}</ul>`
      : `<p class="tp-muted">No completed lessons yet.</p>`;

    $("tp-detail-quizzes").innerHTML = quizHistory.length
      ? `<ul class="tp-bullet-list">${quizHistory.slice().reverse().map((q) => `
          <li>${esc(q.quizTitle || q.lessonKey || "Quiz")} — ${q.score ?? "?"}/${q.maxScore ?? "?"} ${q.status === "complete" ? "✓" : "(in progress)"}</li>
        `).join("")}</ul>`
      : `<p class="tp-muted">No quiz results yet.</p>`;

    $("tp-detail-emblems").innerHTML = emblems.length
      ? `<ul class="tp-emblem-list">${emblems.map((e) => {
        const id = typeof e === "string" ? e : e.id;
        const meta = global.EvoStudentProfile?.getEmblemMeta?.(id) || { title: id, icon: "🏅" };
        return `<li><span class="tp-emblem-icon">${meta.icon || "🏅"}</span> ${esc(meta.title || id)}</li>`;
      }).join("")}</ul>`
      : `<p class="tp-muted">No emblems earned yet.</p>`;

    const approveBtn = $("tp-detail-approve");
    const changeSelect = $("tp-detail-tutor-select");
    if (approveBtn) approveBtn.hidden = student.tutorStatus !== "pending";
    if (changeSelect) {
      changeSelect.innerHTML = tutors.map((t) =>
        `<option value="${esc(t.id)}" ${t.id === (student.assignedTutorId || student.suggestedTutorId) ? "selected" : ""}>${esc(t.name)} — ${esc(t.level)}</option>`
      ).join("");
    }
  }

  function showListView() {
    selectedUid = null;
    const panel = $("tp-detail");
    const listView = $("tp-list-view");
    if (panel) panel.hidden = true;
    if (listView) listView.hidden = false;
  }

  async function updateTutorApproval(uid, tutorId, status) {
    const db = global.EvoTeacherAuth.getDb();
    const { doc, updateDoc, serverTimestamp } = global.__evoTeacherMods;
    const schoolId = session.schoolId;
    const tutor = tutors.find((t) => t.id === tutorId);

    await updateDoc(doc(db, "schools", schoolId, "students", uid), {
      tutorStatus: status,
      assignedTutorId: tutorId,
      suggestedTutorId: tutorId,
      agentId: tutorId,
      agentName: tutor?.name || tutorId,
      tutorId: tutorId,
      tutorName: tutor?.name || tutorId,
      tutorIndex: tutor ? tutor.levelNumber - 1 : null,
      level: tutor?.levelNumber || null,
      levelLabel: tutor?.level || null,
      tutorApprovedAt: serverTimestamp(),
      tutorApprovedBy: session.uid,
      updatedAt: serverTimestamp(),
    });
  }

  async function handleApprove(uid, tutorId) {
    const student = students.find((s) => s.uid === uid);
    const id = tutorId || student?.suggestedTutorId || student?.agentId || "nova";
    setStatus("Saving approval…");
    try {
      await updateTutorApproval(uid, id, "approved");
      students = await fetchStudents(session.schoolId);
      renderStudentTable();
      if (selectedUid === uid) renderStudentDetail(uid);
      setStatus("Tutor approved.", "ok");
    } catch (err) {
      setStatus(err.message || "Could not save approval.", "error");
    }
  }

  async function handleChangeTutor(uid, tutorId) {
    if (!tutorId) return;
    setStatus("Updating tutor…");
    try {
      await updateTutorApproval(uid, tutorId, "approved");
      students = await fetchStudents(session.schoolId);
      renderStudentTable();
      if (selectedUid === uid) renderStudentDetail(uid);
      setStatus("Tutor updated.", "ok");
    } catch (err) {
      setStatus(err.message || "Could not update tutor.", "error");
    }
  }

  function setStatus(message, type) {
    const el = $("tp-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = "tp-status-bar" + (type ? ` tp-status-bar--${type}` : "");
  }

  function bindEvents() {
    const table = $("tp-students-table");
    if (table) {
      table.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        const uid = btn.dataset.uid;
        if (action === "view") renderStudentDetail(uid);
        if (action === "approve") handleApprove(uid);
        if (action === "change") {
          renderStudentDetail(uid);
          const select = $("tp-detail-tutor-select");
          if (select) select.focus();
        }
      });
    }

    $("tp-detail-back")?.addEventListener("click", showListView);
    $("tp-detail-approve")?.addEventListener("click", () => {
      if (selectedUid) handleApprove(selectedUid);
    });
    $("tp-detail-save-tutor")?.addEventListener("click", () => {
      const select = $("tp-detail-tutor-select");
      if (selectedUid && select?.value) handleChangeTutor(selectedUid, select.value);
    });
    $("tp-refresh")?.addEventListener("click", () => refreshDashboard());
    $("tp-sign-out")?.addEventListener("click", () => global.EvoTeacherAuth.signOut());
  }

  async function refreshDashboard() {
    if (!session) return;
    setStatus("Refreshing…");
    try {
      students = await fetchStudents(session.schoolId);
      renderStudentTable();
      if (selectedUid) renderStudentDetail(selectedUid);
      setStatus("", "ok");
    } catch (err) {
      setStatus(err.message || "Could not load students.", "error");
    }
  }

  function showDashboard(teacherSession) {
    session = teacherSession;
    $("tp-login")?.setAttribute("hidden", "");
    $("tp-dashboard")?.removeAttribute("hidden");
    $("tp-teacher-name").textContent = teacherSession.displayName;
    $("tp-school-id").textContent = teacherSession.schoolId;
    refreshDashboard();
  }

  function showLogin(message) {
    $("tp-dashboard")?.setAttribute("hidden", "");
    $("tp-login")?.removeAttribute("hidden");
    if (message) setStatus(message, "error");
  }

  function showUnconfigured() {
    $("tp-login")?.setAttribute("hidden", "");
    $("tp-dashboard")?.setAttribute("hidden", "");
    $("tp-unconfigured")?.removeAttribute("hidden");
  }

  async function initLoginForm() {
    const form = $("tp-login-form");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = $("tp-username")?.value?.trim();
      const password = $("tp-password")?.value;
      if (!username || !password) {
        setStatus("Enter your username and password.", "error");
        return;
      }
      setStatus("Signing in…");
      try {
        const teacherSession = await global.EvoTeacherAuth.signInWithUsername(username, password);
        showDashboard(teacherSession);
        setStatus("");
      } catch (err) {
        setStatus(err.message || "Sign in failed.", "error");
      }
    });
  }

  async function boot() {
    await loadTutors();
    bindEvents();
    await initLoginForm();

    if (!global.EvoTeacherAuth.isReady()) {
      showUnconfigured();
      return;
    }

    await global.EvoTeacherAuth.init();
    global.EvoTeacherAuth.onSessionChange((teacherSession) => {
      if (teacherSession) showDashboard(teacherSession);
      else showLogin();
    });
  }

  global.EvoTeacherPortal = { boot, refreshDashboard, fetchStudents };
})(typeof window !== "undefined" ? window : globalThis);
