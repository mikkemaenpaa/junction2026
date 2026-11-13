// Cookie notice and Google Tag Manager loader: the site's only client-side script. Astro
// bundles and minifies it and, as it is small, inlines it into every page as a module script
// (src/components/CookieNotice.astro), so it runs after parsing and never blocks rendering.
//
// The notice asks about two purposes separately: analytics and advertising. Nothing is
// requested from Google until the visitor grants analytics. The answer is kept in localStorage
// (CONSENT_STORAGE_KEY in src/data/privacy.ts) with its time and asked again after
// CONSENT_MONTHS. The notice and the loader only talk through the `junction2026:consent`
// window event, whose detail is the current answer (a Choice, or null for none), so either
// side can change without the other.
//
// Everything waits until the page is actually shown: pages prerendered by the speculation
// rules (src/layouts/BaseLayout.astro) run this script in the background, and a page that is
// never shown must not be counted.
import { CONSENT_MONTHS, CONSENT_STORAGE_KEY, GTM_CONTAINER_ID } from "../data/privacy";

type Choice = { analytics: boolean; advertising: boolean };

declare global {
  interface Document {
    readonly prerendering?: boolean;
  }
  interface Window {
    dataLayer?: unknown[];
  }
}

const EVENT = "junction2026:consent";
const MAX_AGE_MS = CONSENT_MONTHS * 30.5 * 864e5;

// --- The remembered answer: {"analytics":bool,"advertising":bool,"at":<ms>}. Anything else,
// including the old single-purpose {"choice":...} format, counts as no answer. Without storage
// (blocked, private mode) there is no answer, so the notice asks again on every page and
// nothing loads; reading never throws.

const read = (): Choice | null => {
  try {
    const { analytics, advertising, at } = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null");
    return typeof analytics === "boolean" && typeof advertising === "boolean" && Date.now() - at < MAX_AGE_MS
      ? { analytics, advertising }
      : null;
  } catch {
    return null;
  }
};

const remember = (choice: Choice) => {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...choice, at: Date.now() }));
  } catch {
    // Not remembered: the choice still applies to this page.
  }
};

const announce = (choice: Choice | null) => dispatchEvent(new CustomEvent(EVENT, { detail: choice }));

// --- Loader: Google Tag Manager in Consent Mode v2. The defaults (all denied) come first, then
// one update with the visitor's answer. The container is loaded only when analytics is
// granted: once loaded, Google Analytics sends cookieless pings even with analytics denied,
// and nothing may go to Google for a purpose the visitor has not accepted. Its only tag is
// Google Analytics, so advertising alone has nothing to act on.

let loaded = false;

// Tag Manager reads consent commands only in gtag's form: the arguments object itself.
function gtag(..._: unknown[]) {
  (window.dataLayer ||= []).push(arguments);
}

// Google sets its cookies on the widest domain it may, so they are cleared host-only (i = 0)
// and at every domain level of the host.
const deleteCookies = (pattern: RegExp) => {
  const labels = location.hostname.split(".");
  for (const [, name] of document.cookie.matchAll(pattern)) {
    for (let i = 0; i < labels.length; i++) {
      document.cookie = `${name}=;path=/;max-age=0${i ? `;domain=${labels.slice(i - 1).join(".")}` : ""}`;
    }
  }
};

addEventListener(EVENT, (event) => {
  const choice = (event as CustomEvent<Choice | null>).detail;
  const analytics = !!choice?.analytics;
  const ads = choice?.advertising ? "granted" : "denied";
  const update = { ad_storage: ads, ad_user_data: ads, ad_personalization: ads, analytics_storage: analytics ? "granted" : "denied" };
  if (analytics && !loaded) {
    loaded = true;
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
    gtag("consent", "update", update);
    window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    document.head.append(script);
  } else if (loaded) {
    gtag("consent", "update", update);
  }
  // Analytics: _ga, _ga_<ID>. Advertising: Google's first-party ad cookies, _gcl_* and _gac_*.
  if (!analytics) deleteCookies(/(?:^|; )(_ga(?:_[^=]*)?)=/g);
  if (ads === "denied") deleteCookies(/(?:^|; )(_g(?:cl|ac)_[^=]*)=/g);
});

// --- Notice: shown while there is no answer; "Cookie settings" in the footer reopens it.
// BaseLayout renders both on every page. "Accept all" and "Reject all" tick or untick both
// boxes and every answer is read from the boxes, so when the notice is reopened they show the
// answer in force (sync ticks them from storage on load and on changes from another tab).

const notice = document.getElementById("cookie-notice")!;
const [analyticsBox, advertisingBox] = notice.querySelectorAll("input");
const details = notice.querySelector("details")!;
let opener: HTMLElement | null = null;

const tick = (choice: Choice | null) => {
  analyticsBox!.checked = !!choice?.analytics;
  advertisingBox!.checked = !!choice?.advertising;
};

notice.addEventListener("click", (event) => {
  const value = (event.target as Element).closest("button")?.value;
  if (!value) return;
  if (value !== "save") analyticsBox!.checked = advertisingBox!.checked = value === "all";
  const choice = { analytics: analyticsBox!.checked, advertising: advertisingBox!.checked };
  remember(choice);
  notice.hidden = true;
  opener?.focus();
  opener = null;
  announce(choice);
});

const settings = document.querySelector<HTMLElement>("[data-cookie-settings]");
settings?.addEventListener("click", () => {
  opener = settings;
  details.open = true;
  notice.hidden = false;
  notice.focus();
});

// --- Start once the page is shown, and again when it comes back from the back/forward cache
// or the answer changes in another tab.

const sync = () => {
  const choice = read();
  tick(choice);
  notice.hidden = choice !== null;
  announce(choice);
};

if (document.prerendering) document.addEventListener("prerenderingchange", sync, { once: true });
else sync();
addEventListener("pageshow", (event) => event.persisted && sync());
addEventListener("storage", (event) => event.key === CONSENT_STORAGE_KEY && sync());
