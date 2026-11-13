// Analytics and privacy settings, shared by the cookie notice script (src/scripts/consent.ts,
// bundled into the page at build time) and the privacy page (src/pages/privacy.astro).

/** The Google Tag Manager container loaded after a visitor accepts the cookie notice. */
export const GTM_CONTAINER_ID = "GTM-P55PJ28X";

/** localStorage key holding the visitor's answer: `{"choice":"granted"|"denied","at":<ms>}`. */
export const CONSENT_STORAGE_KEY = "junction2026-consent";

/** How long an answer is remembered before the notice asks again. */
export const CONSENT_MONTHS = 6;

/**
 * Who operates the site, shown on /privacy. While `name` is empty the paragraph is left out
 * entirely. `contact` is an email address (rendered as a mailto link) or a postal address.
 */
export const SITE_OPERATOR = { name: "", contact: "" };
