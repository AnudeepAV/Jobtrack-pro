function txt(el) {
  return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
}

function stripQuery(url) {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url || "";
  }
}

function isViewUrl(url) {
  return /https:\/\/www\.linkedin\.com\/jobs\/view\/\d+\/?/i.test(url || "");
}

function buildViewUrl(id) {
  return id ? `https://www.linkedin.com/jobs/view/${id}/` : "";
}

function getActiveJobCard() {
  return (
    document.querySelector("li.jobs-search-results__list-item--active") ||
    document.querySelector('li.jobs-search-results__list-item[aria-current="true"]') ||
    document.querySelector('li[aria-selected="true"]') ||
    null
  );
}

function getJobUrlFromLeftPanel() {
  const card = getActiveJobCard();
  const a = card?.querySelector('a[href*="/jobs/view/"]') || null;
  const href = a?.href || "";
  if (isViewUrl(href)) return stripQuery(href);
  return "";
}

function getJobIdFromRightPane() {
  const els = Array.from(document.querySelectorAll('[data-entity-urn*="jobPosting:"]'));
  for (const el of els) {
    const urn = el.getAttribute("data-entity-urn") || "";
    const m = urn.match(/jobPosting:(\d+)/i);
    if (m) return m[1];
  }
  return "";
}

function getCanonicalJobUrl() {
  let url = getJobUrlFromLeftPanel();
  if (isViewUrl(url)) return url;

  const id = getJobIdFromRightPane();
  url = buildViewUrl(id);
  if (isViewUrl(url)) return url;

  const direct = stripQuery(window.location.href);
  if (isViewUrl(direct)) return direct;

  return "";
}

function getTitleCompanyFromRightPane() {
  const title =
    txt(document.querySelector("h1")) ||
    txt(document.querySelector(".jobs-unified-top-card__job-title")) ||
    txt(document.querySelector(".job-details-jobs-unified-top-card__job-title"));

  const company =
    txt(document.querySelector(".jobs-unified-top-card__company-name")) ||
    txt(document.querySelector(".job-details-jobs-unified-top-card__company-name")) ||
    txt(document.querySelector(".jobs-unified-top-card__company-name a"));

  return { title, company };
}

function getTitleCompanyFromLeftCard() {
  const card = getActiveJobCard();
  if (!card) return { title: "", company: "" };

  // These selectors match common LinkedIn job cards.
  const title =
    txt(card.querySelector("a.job-card-container__link")) ||
    txt(card.querySelector(".job-card-list__title")) ||
    txt(card.querySelector('[data-control-name*="job_card"]'));

  const company =
    txt(card.querySelector(".job-card-container__primary-description")) ||
    txt(card.querySelector(".artdeco-entity-lockup__subtitle")) ||
    txt(card.querySelector(".job-card-container__company-name"));

  return { title, company };
}

function getJobDataNow() {
  const job_url = getCanonicalJobUrl();

  const rp = getTitleCompanyFromRightPane();
  const lp = getTitleCompanyFromLeftCard();

  const job_title = rp.title || lp.title || "";
  const company_name = rp.company || lp.company || "";

  return { job_title, company_name, job_url };
}

async function getJobDataWithRetry() {
  const attempts = 30;
  const delayMs = 250;

  for (let i = 0; i < attempts; i++) {
    const data = getJobDataNow();

    // We must have a /jobs/view/ URL, and title+company must be non-empty for backend validation
    if (isViewUrl(data.job_url) && data.job_title && data.company_name) {
      return data;
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }

  return getJobDataNow();
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req?.type === "GET_JOB_DATA") {
    getJobDataWithRetry().then(sendResponse);
    return true;
  }
});
