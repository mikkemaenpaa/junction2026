// Cookie notice and Google Tag Manager loader: the site's only client-side script. Astro
// bundles and minifies it and, as it is small, inlines it into every page as a module script
// (src/components/CookieNotice.astro), so it runs after parsing and never blocks rendering.
//
// Nothing is requested from Google until the visitor accepts. The answer is kept in
// localStorage (CONSENT_STORAGE_KEY in src/data/privacy.ts) with its time and asked again
// after CONSENT_MONTHS. The notice and the loader only talk through the
// `junction2026:consent` window event, whose detail is the current answer ("granted",
// "denied" or null for none), so either side can change without the other.
//
// Everything waits until the page is actually shown: pages prerendered by the speculation
// rules (src/layouts/BaseLayout.astro) run this script in the background, and a page that is
// never shown must not be counted.
import { CONSENT_MONTHS, CONSENT_STORAGE_KEY, GTM_CONTAINER_ID } from "../data/privacy";

type Choice = "granted" | "denied";

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

// --- The remembered answer. Without storage (blocked, private mode) there is no answer, so
// the notice asks again on every page and nothing loads; reading never throws.

const read = (): Choice | null => {
  try {
    const { choice, at } = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null");
    return (choice === "granted" || choice === "denied") && Date.now() - at < MAX_AGE_MS ? choice : null;
  } catch {
    return null;
  }
};

const remember = (choice: Choice) => {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    // Not remembered: the choice still applies to this page.
  }
};

const announce = (choice: Choice | null) => dispatchEvent(new CustomEvent(EVENT, { detail: choice }));

// --- Loader: Google Tag Manager in Consent Mode v2, only after consent. The advertising
// signals stay denied; the notice only asks about analytics.

let loaded = false;

// Tag Manager reads consent commands only in gtag's form: the arguments object itself.
function gtag(..._: unknown[]) {
  (window.dataLayer ||= []).push(arguments);
}

// Google Analytics sets _ga and _ga_<ID> on the widest domain it may, so they are cleared
// host-only (i = 0) and at every domain level of the host.
const deleteAnalyticsCookies = () => {
  const labels = location.hostname.split(".");
  for (const [, name] of document.cookie.matchAll(/(?:^|; )(_ga(?:_[^=]*)?)=/g)) {
    for (let i = 0; i < labels.length; i++) {
      document.cookie = `${name}=;path=/;max-age=0${i ? `;domain=${labels.slice(i - 1).join(".")}` : ""}`;
    }
  }
};

addEventListener(EVENT, (event) => {
  const granted = (event as CustomEvent<Choice | null>).detail === "granted";
  if (granted && !loaded) {
    loaded = true;
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
    gtag("consent", "update", { analytics_storage: "granted" });
    window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    document.head.append(script);
  } else if (loaded) {
    gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
  }
  if (!granted) deleteAnalyticsCookies();
});

// --- Notice: shown while there is no answer; "Cookie settings" in the footer reopens it.
// BaseLayout renders both on every page.

const notice = document.getElementById("cookie-notice")!;
let opener: HTMLElement | null = null;

notice.addEventListener("click", (event) => {
  const choice = (event.target as Element).closest("button")?.value;
  if (choice !== "granted" && choice !== "denied") return;
  remember(choice);
  notice.hidden = true;
  opener?.focus();
  opener = null;
  announce(choice);
});

const settings = document.querySelector<HTMLElement>("[data-cookie-settings]");
settings?.addEventListener("click", () => {
  opener = settings;
  notice.hidden = false;
  notice.focus();
});

// --- Start once the page is shown, and again when it comes back from the back/forward cache
// or the answer changes in another tab.

const sync = () => {
  const choice = read();
  notice.hidden = choice !== null;
  announce(choice);
};

if (document.prerendering) document.addEventListener("prerenderingchange", sync, { once: true });
else sync();
addEventListener("pageshow", (event) => event.persisted && sync());
addEventListener("storage", (event) => event.key === CONSENT_STORAGE_KEY && sync());
