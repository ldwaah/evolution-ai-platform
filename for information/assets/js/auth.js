/**
 * Client-side test authentication for Evolution AI Platform demo access.
 * Production deployments must replace this with server-side auth (OAuth, SSO, etc.).
 */
(function () {
  const AUTH = {
    staff: {
      storageKey: "evoStaffAuth",
      loginPage: "login-staff.html",
      dashboardPage: "dashboard.html",
      username: "staff",
      password: "EvoStaff2026"
    },
    student: {
      storageKey: "evoStudentAuth",
      loginPage: "login-student.html",
      dashboardPage: "student.html",
      username: "student",
      password: "EvoStudent2026"
    }
  };

  function getRoleConfig(role) {
    const config = AUTH[role];
    if (!config) {
      throw new Error("Unknown auth role: " + role);
    }
    return config;
  }

  function isAuthenticated(role) {
    const config = getRoleConfig(role);
    try {
      const raw = sessionStorage.getItem(config.storageKey);
      if (!raw) return false;
      const session = JSON.parse(raw);
      return session && session.authenticated === true && session.role === role;
    } catch {
      return false;
    }
  }

  function setSession(role, username) {
    const config = getRoleConfig(role);
    sessionStorage.setItem(
      config.storageKey,
      JSON.stringify({
        authenticated: true,
        role,
        username,
        loginAt: new Date().toISOString()
      })
    );
  }

  function clearSession(role) {
    const config = getRoleConfig(role);
    sessionStorage.removeItem(config.storageKey);
  }

  function requireAuth(role) {
    if (isAuthenticated(role)) return true;
    const config = getRoleConfig(role);
    const returnTo = encodeURIComponent(window.location.pathname.split("/").pop() || config.dashboardPage);
    window.location.replace(config.loginPage + "?return=" + returnTo);
    return false;
  }

  function redirectIfAuthenticated(role) {
    if (!isAuthenticated(role)) return false;
    const config = getRoleConfig(role);
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("return");
    const safeReturn = returnTo && !returnTo.includes("://") && returnTo.endsWith(".html")
      ? returnTo
      : config.dashboardPage;
    window.location.replace(safeReturn);
    return true;
  }

  function attemptLogin(role, username, password) {
    const config = getRoleConfig(role);
    const trimmedUser = (username || "").trim();
    const trimmedPass = (password || "").trim();

    if (trimmedUser === config.username && trimmedPass === config.password) {
      setSession(role, trimmedUser);
      return { ok: true };
    }

    return { ok: false, message: "Incorrect username or password. Please try again." };
  }

  function logout(role) {
    const config = getRoleConfig(role);
    clearSession(role);
    window.location.href = config.loginPage;
  }

  window.EvoAuth = {
    isAuthenticated,
    requireAuth,
    redirectIfAuthenticated,
    attemptLogin,
    logout,
    roles: AUTH
  };
})();
