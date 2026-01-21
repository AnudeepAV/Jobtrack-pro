const API_URL = "http://127.0.0.1:8000/api/extension/jobs/";

// ✅ Change this if your refresh endpoint is different:
const REFRESH_URL = "http://127.0.0.1:8000/api/auth/refresh/";
// If needed: "http://127.0.0.1:8000/api/token/refresh/"

const tokenInput = document.getElementById("token");
const refreshInput = document.getElementById("refresh");
const statusSelect = document.getElementById("status");
const saveBtn = document.getElementById("save");
const msg = document.getElementById("msg");

// Load saved token + refresh + status
chrome.storage.local.get(
  ["jobtrack_token", "jobtrack_refresh", "jobtrack_status"],
  (res) => {
    if (res.jobtrack_token) tokenInput.value = res.jobtrack_token;
    if (res.jobtrack_refresh) refreshInput.value = res.jobtrack_refresh;
    if (res.jobtrack_status) statusSelect.value = res.jobtrack_status;
  }
);

// Persist access token
tokenInput.addEventListener("input", () => {
  chrome.storage.local.set({ jobtrack_token: tokenInput.value.trim() });
});

// Persist refresh token
refreshInput.addEventListener("input", () => {
  chrome.storage.local.set({ jobtrack_refresh: refreshInput.value.trim() });
});

// Persist status
statusSelect.addEventListener("change", () => {
  chrome.storage.local.set({ jobtrack_status: statusSelect.value });
});

function setMsg(text, cls) {
  msg.textContent = text;
  msg.className = "muted " + (cls || "");
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

async function refreshAccessToken() {
  const refresh = refreshInput.value.trim();
  if (!refresh) {
    throw new Error("No refresh token set. Paste refresh token once.");
  }

  const res = await fetch(REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const { text, json } = await safeReadJson(res);

  if (!res.ok || !json?.access) {
    const err =
      json?.detail ||
      json?.message ||
      `Refresh failed (${res.status}). ${text.slice(0, 160)}`;
    throw new Error(err);
  }

  tokenInput.value = json.access;
  chrome.storage.local.set({ jobtrack_token: json.access });
  return json.access;
}

async function saveJobWithToken(token, job) {
  const payload = {
    job_url: job.job_url,
    job_title: job.job_title, // required (non-blank)
    company_name: job.company_name, // required (non-blank)
    job_key: jobIdFromUrl(job.job_url) || job.job_url, // optional (backend may ignore)
    location_type: "remote",
    status: statusSelect.value,
    referral: false,
    notes: "Saved via Chrome extension",
  };

  const res = await fetch(API_URL, {
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

saveBtn.addEventListener("click", async () => {
  setMsg("");
  saveBtn.disabled = true;

  try {
    let token = tokenInput.value.trim();
    if (!token) {
      setMsg("Paste your access token first.", "err");
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Ensure content script is injected (helps on SPA pages)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch (_) {}

    const job = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" });

    // ✅ Must have a real /jobs/view/<id>/ URL (unique key)
    if (!job?.job_url || !job.job_url.includes("/jobs/view/")) {
      setMsg(
        "Could not detect the job URL. Click a job in the list, wait 1–2 seconds, then try again.",
        "err"
      );
      return;
    }

    // ✅ Backend requires these to be non-blank
    if (!job?.job_title || !job?.company_name) {
      setMsg(
        "Job title/company still loading. Wait 1–2 seconds and click Save again.",
        "err"
      );
      return;
    }

    setMsg("Saving…", "");

    // 1st attempt
    let { res, text, json } = await saveJobWithToken(token, job);

    // If unauthorized, refresh once and retry
    if (res.status === 401) {
      setMsg("Access token expired. Refreshing token…", "");
      token = await refreshAccessToken();
      ({ res, text, json } = await saveJobWithToken(token, job));
    }

    if (!res.ok) {
      const errorMsg =
        json?.detail ||
        json?.message ||
        `Request failed (${res.status}). ${text.slice(0, 160)}`;
      setMsg(errorMsg, "err");
      return;
    }

    const createdFlag = typeof json?.created === "boolean" ? json.created : null;

    if (createdFlag === true) {
      setMsg("Saved ✅", "ok");
    } else if (createdFlag === false) {
      setMsg("Updated ⚠️ Already existed", "err");
    } else {
      setMsg("Saved ✅", "ok");
    }
  } catch (e) {
    setMsg(e?.message || "Error saving job.", "err");
  } finally {
    saveBtn.disabled = false;
  }
});
