// ======== CONFIG ========
const API_BASE = "https://jobtrack-pro-api.onrender.com/api";
const LOGIN_URL = `${API_BASE}/auth/login/`;
const REFRESH_URL = `${API_BASE}/auth/refresh/`;
const EXT_SAVE_URL = `${API_BASE}/extension/jobs/`;

// ======== UI ========
const loginBox = document.getElementById("loginBox");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");

const statusSelect = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");
const msg = document.getElementById("msg");

function setMsg(text, cls = "muted") {
  msg.className = `msg ${cls}`;
  msg.textContent = text || "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeReadJson(res) {
  const text = await res.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

function jobIdFromUrl(jobUrl) {
  const m = (jobUrl || "").match(/\/jobs\/view\/(\d+)/i);
  return m ? m[1] : "";
}

// ======== STORAGE ========
function getStoredAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["jobtrack_access", "jobtrack_refresh", "jobtrack_status"],
      resolve
    );
  });
}

function setStoredAuth(access, refresh) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { jobtrack_access: access, jobtrack_refresh: refresh },
      resolve
    );
  });
}

function clearStoredAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(["jobtrack_access", "jobtrack_refresh"], resolve);
  });
}

// ======== AUTH ========
async function login(username, password) {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const { text, json } = await safeReadJson(res);

  if (!res.ok || !json?.access || !json?.refresh) {
    const err =
      json?.detail ||
      json?.message ||
      `Login failed (${res.status}). ${text.slice(0, 160)}`;
    throw new Error(err);
  }

  await setStoredAuth(json.access, json.refresh);
  return json.access;
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch(REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const { text, json } = await safeReadJson(res);

  if (!res.ok || !json?.access) {
    const err =
      json?.detail ||
      json?.message ||
      `Refresh failed (${res.status}). ${text.slice(0, 160)}`;
    throw new Error(err);
  }

  await chrome.storage.local.set({ jobtrack_access: json.access });
  return json.access;
}

// ======== LINKEDIN DATA ========
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (_) {
    // ignore (it might already be injected)
  }
}

async function requestJobData(tabId) {
  return chrome.tabs.sendMessage(tabId, { type: "GET_JOB_DATA" });
}

// retry because LinkedIn page loads slowly
async function getJobDataWithRetry(tabId, tries = 10) {
  for (let i = 0; i < tries; i++) {
    let job = null;
    try {
      job = await requestJobData(tabId);
    } catch (_) {
      job = null;
    }

    const ok =
      job?.job_url &&
      job?.job_url.includes("linkedin.com/jobs") &&
      job?.job_title &&
      job?.company_name;

    if (ok) return job;

    await sleep(650);
  }
  return null;
}

// ======== SAVE JOB ========
async function saveJob(token, job) {
  const payload = {
    job_url: job.job_url,
    job_title: job.job_title,
    company_name: job.company_name,
    job_key: jobIdFromUrl(job.job_url) || job.job_url,
    location_type: "remote",
    status: statusSelect.value,
    referral: false,
    notes: "Saved via Chrome extension",
  };

  const res = await fetch(EXT_SAVE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const { text, json } = await safeReadJson(res);
  return { res, text, json };
}

// ======== INIT ========
(async function init() {
  const stored = await getStoredAuth();

  // load saved status
  if (stored.jobtrack_status) statusSelect.value = stored.jobtrack_status;
  statusSelect.addEventListener("change", () => {
    chrome.storage.local.set({ jobtrack_status: statusSelect.value });
  });

  if (!stored.jobtrack_refresh) {
    loginBox.style.display = "block";
    setMsg("Please sign in once to enable saving.", "muted");
  } else {
    loginBox.style.display = "none";
    setMsg("Ready. Open a LinkedIn job and click Save.", "muted");
  }
})();

// ======== EVENTS ========
loginBtn.addEventListener("click", async () => {
  setMsg("", "muted");
  loginBtn.disabled = true;

  try {
    const u = usernameInput.value.trim();
    const p = passwordInput.value;
    if (!u || !p) {
      setMsg("Enter username + password.", "err");
      return;
    }

    setMsg("Signing in…", "muted");
    await login(u, p);

    usernameInput.value = "";
    passwordInput.value = "";
    loginBox.style.display = "none";
    setMsg("Signed in ✅ You can save jobs now.", "ok");
  } catch (e) {
    setMsg(e?.message || "Login failed.", "err");
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await clearStoredAuth();
  loginBox.style.display = "block";
  setMsg("Logged out. Sign in again to save jobs.", "muted");
});

saveBtn.addEventListener("click", async () => {
  setMsg("", "muted");
  saveBtn.disabled = true;

  try {
    const stored = await getStoredAuth();
    let access = stored.jobtrack_access;
    const refresh = stored.jobtrack_refresh;

    if (!refresh) {
      loginBox.style.display = "block";
      setMsg("Please sign in first.", "err");
      return;
    }

    const tab = await getActiveTab();
    if (!tab?.id) {
      setMsg("No active tab found.", "err");
      return;
    }

    // must be on LinkedIn jobs page
    if (!tab.url || !tab.url.includes("linkedin.com/jobs")) {
      setMsg("Open a LinkedIn Jobs page first.", "err");
      return;
    }

    await ensureContentScript(tab.id);

    setMsg("Reading job details…", "muted");
    const job = await getJobDataWithRetry(tab.id);

    if (!job) {
      setMsg(
        "Could not read job title/company. Click inside the job details area, scroll slightly, wait 2 seconds, and try again.",
        "err"
      );
      return;
    }

    if (!job.job_url.includes("/jobs/view/")) {
      setMsg("Open an actual job page (URL must contain /jobs/view/123…).", "err");
      return;
    }

    setMsg(`Saving: ${job.company_name} — ${job.job_title}`, "muted");

    // attempt 1
    let result = await saveJob(access, job);

    // if unauthorized, refresh and retry once
    if (result.res.status === 401) {
      setMsg("Refreshing session…", "muted");
      access = await refreshAccessToken(refresh);
      result = await saveJob(access, job);
    }

    if (!result.res.ok) {
      const errorMsg =
        result.json?.detail ||
        result.json?.message ||
        `Request failed (${result.res.status}). ${result.text.slice(0, 160)}`;
      setMsg(errorMsg, "err");
      return;
    }

    setMsg("Saved ✅", "ok");
  } catch (e) {
    setMsg(e?.message || "Error saving job.", "err");
  } finally {
    saveBtn.disabled = false;
  }
});