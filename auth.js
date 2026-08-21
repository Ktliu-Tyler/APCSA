(() => {
  "use strict";

  const USERNAME = "APCSA2026";
  const CREDENTIAL_HASH = "39ba55bd65d99b307e6729a0772f448f4f0ac8b0111343c05bd29be9f712f478";
  const AUTH_KEY = "apcsa-auth-session-v1";
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const LOGIN_PAGE = "login.html";

  function pageName() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function currentTarget() {
    return `${pageName()}${location.search}${location.hash}`;
  }

  function loginUrl() {
    return `${LOGIN_PAGE}?next=${encodeURIComponent(currentTarget())}`;
  }

  function safeNextTarget() {
    const params = new URLSearchParams(location.search);
    const next = params.get("next") || "index.html";
    const base = new URL(".", location.href);
    const target = new URL(next, base);

    if (target.origin !== location.origin || !target.pathname.startsWith(base.pathname)) {
      return "index.html";
    }

    if ((target.pathname.split("/").pop() || "index.html").toLowerCase() === LOGIN_PAGE) {
      return "index.html";
    }

    return `${target.pathname.slice(base.pathname.length) || "index.html"}${target.search}${target.hash}`;
  }

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function isAuthenticated() {
    const session = readSession();
    return Boolean(session && session.user === USERNAME && session.expiresAt > Date.now());
  }

  function setAuthenticated() {
    sessionStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        user: USERNAME,
        expiresAt: Date.now() + SESSION_MS
      })
    );
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    location.replace(LOGIN_PAGE);
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function login(username, password) {
    const normalizedUser = username.trim();
    const hash = await sha256(`${normalizedUser}:${password}`);
    const ok = normalizedUser === USERNAME && hash === CREDENTIAL_HASH;

    if (ok) {
      setAuthenticated();
    }

    return ok;
  }

  function addLogoutButton() {
    const target = document.querySelector(".nav, .presentation-actions");

    if (!target || target.querySelector("[data-auth-logout]")) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "auth-logout";
    button.dataset.authLogout = "true";
    button.textContent = "登出";
    button.addEventListener("click", logout);
    target.appendChild(button);
  }

  function initLoginPage() {
    if (isAuthenticated() && !new URLSearchParams(location.search).has("loggedOut")) {
      location.replace(safeNextTarget());
      return;
    }

    document.addEventListener("DOMContentLoaded", () => {
      const form = document.querySelector("[data-login-form]");
      const message = document.querySelector("[data-login-message]");

      if (!form) {
        return;
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submit = form.querySelector("button[type='submit']");
        const formData = new FormData(form);
        const username = String(formData.get("username") || "");
        const password = String(formData.get("password") || "");

        if (submit) {
          submit.disabled = true;
          submit.textContent = "登入中";
        }

        try {
          const ok = await login(username, password);

          if (ok) {
            location.replace(safeNextTarget());
            return;
          }

          if (message) {
            message.textContent = "帳號或密碼不正確。";
            message.hidden = false;
          }
        } catch {
          if (message) {
            message.textContent = "目前無法完成登入，請使用 HTTPS 網址再試一次。";
            message.hidden = false;
          }
        } finally {
          if (submit) {
            submit.disabled = false;
            submit.textContent = "登入";
          }
        }
      });
    });
  }

  window.apcsaAuth = {
    isAuthenticated,
    login,
    logout
  };

  if (pageName().toLowerCase() === LOGIN_PAGE) {
    initLoginPage();
    return;
  }

  if (!isAuthenticated()) {
    location.replace(loginUrl());
    return;
  }

  document.addEventListener("DOMContentLoaded", addLogoutButton);
})();
