// content.js (robust LinkedIn job scraper)

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function textOf(el) {
  return clean(el?.textContent);
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
  return clean(
    byName?.getAttribute("content") || byProp?.getAttribute("content") || ""
  );
}

function getJobUrl() {
  return window.location.href.split("?")[0];
}

function getTitleFallback() {
  const t = clean(document.title);
  if (!t) return "";
  return t.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
}

function getJobTitle() {
  const title = firstTextFromSelectors([
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title",
    "main h1",
    "h1",
    "[data-test-job-title]"
  ]);

  if (title) return title;

  const ogTitle = getMeta("og:title");
  if (ogTitle) return ogTitle;

  return getTitleFallback();
}

function getCompanyFromCompanyLinkNearTitle() {
  const main = document.querySelector("main") || document;

  const companyLink =
    main.querySelector('.job-details-jobs-unified-top-card__company-name a[href*="/company/"]') ||
    main.querySelector('.jobs-unified-top-card__company-name a[href*="/company/"]') ||
    main.querySelector('a[href*="/company/"][data-control-name]') ||
    main.querySelector('a[href*="/company/"]');

  return textOf(companyLink);
}

function getCompanyName() {
  const company = firstTextFromSelectors([
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
    "[data-test-job-company-name]"
  ]);

  if (company) return company;

  const company2 = getCompanyFromCompanyLinkNearTitle();
  if (company2) return company2;

  const ogDesc = getMeta("og:description");
  if (ogDesc && ogDesc.includes("·")) {
    const firstPart = clean(ogDesc.split("·")[0]);
    if (firstPart && firstPart.length <= 60) return firstPart;
  }

  return "";
}

function waitFor(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_JOB_DATA") {
    (async () => {
      // LinkedIn loads DOM late — retry a few times
      for (let i = 0; i < 3; i++) {
        const data = {
          job_url: getJobUrl(),
          job_title: getJobTitle(),
          company_name: getCompanyName()
        };

        if (data.job_title && data.company_name) {
          sendResponse(data);
          return;
        }

        await waitFor(500);
      }

      // last attempt response
      sendResponse({
        job_url: getJobUrl(),
        job_title: getJobTitle(),
        company_name: getCompanyName()
      });
    })();

    return true; // ✅ IMPORTANT (keeps channel open for async)
  }
});