// content.js (LinkedIn job scraper - very robust)

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}
function textOf(el) {
  return clean(el?.textContent);
}
function attrOf(el, attr) {
  return clean(el?.getAttribute?.(attr) || "");
}

function firstTextFromSelectors(selectors, root = document) {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    const t = textOf(el);
    if (t) return t;
  }
  return "";
}

function getMeta(nameOrProp) {
  const byName = document.querySelector(`meta[name="${nameOrProp}"]`);
  const byProp = document.querySelector(`meta[property="${nameOrProp}"]`);
  return clean(byName?.getAttribute("content") || byProp?.getAttribute("content") || "");
}

function getJobUrl() {
  return window.location.href.split("?")[0];
}

function getJobTitle() {
  // Primary LinkedIn selectors
  const title = firstTextFromSelectors([
    // Unified job details top card
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    // Other variants
    ".jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title",
    // Sometimes this exists
    "h1.t-24.t-bold.inline",
    "h1",
    // Data-test
    "[data-test-job-title]"
  ]);

  if (title) return title;

  // Fallbacks
  const ogTitle = getMeta("og:title");
  if (ogTitle) return ogTitle.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();

  const dt = clean(document.title).replace(/\s*\|\s*LinkedIn\s*$/i, "");
  return dt;
}

function getCompanyName() {
  const company = firstTextFromSelectors([
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
    "a[href*='/company/'] span",
    "a[href*='/company/']",
    "[data-test-job-company-name]"
  ]);

  if (company) return company;

  // Fallback: try aria-label on company link
  const companyLink = document.querySelector("a[href*='/company/']");
  const aria = attrOf(companyLink, "aria-label");
  if (aria) return aria;

  // Fallback: parse og:description pattern: "Company · Location · ..."
  const ogDesc = getMeta("og:description");
  if (ogDesc && ogDesc.includes("·")) {
    const firstPart = clean(ogDesc.split("·")[0]);
    if (firstPart && firstPart.length <= 80) return firstPart;
  }

  return "";
}

/**
 * Sometimes LinkedIn doesn't render job title/company in DOM immediately.
 * We also try to read it from JSON-LD if present.
 */
function tryJsonLd() {
  try {
    const scripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
    for (const s of scripts) {
      const raw = s.textContent;
      if (!raw) continue;
      const obj = JSON.parse(raw);

      // LinkedIn may have arrays
      const list = Array.isArray(obj) ? obj : [obj];

      for (const item of list) {
        const title = clean(item?.title || item?.name);
        const company = clean(item?.hiringOrganization?.name);
        if (title || company) {
          return { title, company };
        }
      }
    }
  } catch (_) {}
  return { title: "", company: "" };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_JOB_DATA") {
    let job_title = getJobTitle();
    let company_name = getCompanyName();

    // JSON-LD fallback
    if (!job_title || !company_name) {
      const ld = tryJsonLd();
      if (!job_title) job_title = ld.title || job_title;
      if (!company_name) company_name = ld.company || company_name;
    }

    const data = {
      job_url: getJobUrl(),
      job_title,
      company_name
    };

    sendResponse(data);
  }
});