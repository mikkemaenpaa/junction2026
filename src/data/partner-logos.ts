// Partner logos shown on the challenge cards and detail pages, keyed by challenge `org`.
// Ported from the original src/lib/partner-logos.ts (same keys, order and `dark` flags), but
// self-hosted: the files live in src/assets/partner-logos/ and are emitted as fingerprinted
// files under /_astro/. They are optimized copies of the originals: SVGO for the SVGs, WebP
// for cala, atech and stoa (stoa.svg was a raster wrapped in SVG), oxylabs (a WebP file that
// was named .png) only renamed. See README.md for adding a logo.
// `dark: true` puts the logo on a dark surface instead of a light one.
import mlh from "../assets/partner-logos/mlh.svg";
import bahn from "../assets/partner-logos/bahn.svg";
import arduino from "../assets/partner-logos/arduino.svg";
import context from "../assets/partner-logos/context.svg";
import aalto from "../assets/partner-logos/aalto.svg";
import google from "../assets/partner-logos/google.svg";
import craci from "../assets/partner-logos/craci.svg";
import hostinger from "../assets/partner-logos/hostinger.svg";
import cala from "../assets/partner-logos/cala.webp";
import exa from "../assets/partner-logos/exa.svg";
import ignite from "../assets/partner-logos/ignite.svg";
import mariadb from "../assets/partner-logos/mariadb.svg";
import meta from "../assets/partner-logos/meta.svg";
import oxylabs from "../assets/partner-logos/oxylabs.webp";
import modal from "../assets/partner-logos/modal.svg";
import atech from "../assets/partner-logos/atech.webp";
import intel from "../assets/partner-logos/intel.svg";
import nvidia from "../assets/partner-logos/nvidia.svg";
import cloudinary from "../assets/partner-logos/cloudinary.svg";
import espoo from "../assets/partner-logos/espoo.svg";
import tieto from "../assets/partner-logos/tieto.svg";
import openai from "../assets/partner-logos/openai.svg";
import spankki from "../assets/partner-logos/spankki.svg";
import aiven from "../assets/partner-logos/aiven.svg";
import afterquery from "../assets/partner-logos/afterquery.svg";
import stoa from "../assets/partner-logos/stoa.webp";
import verda from "../assets/partner-logos/verda.svg";
import rokoko from "../assets/partner-logos/rokoko.svg";
import valio from "../assets/partner-logos/valio.svg";

export const partnerLogos: Record<string, { url: string; dark: boolean }[]> = {
  "Hostinger": [{ url: hostinger.src, dark: false }],
  "Tieto": [{ url: tieto.src, dark: true }],
  "Bahn Express": [{ url: bahn.src, dark: false }],
  "AfterQuery": [{ url: afterquery.src, dark: true }],
  "Valio Aimo": [{ url: valio.src, dark: false }],
  "Exa": [{ url: exa.src, dark: false }],
  "Arduino": [{ url: arduino.src, dark: false }],
  "Meta": [{ url: meta.src, dark: false }],
  "Rokoko": [{ url: rokoko.src, dark: false }],
  "Aalto University": [{ url: aalto.src, dark: false }],
  "Cala": [{ url: cala.src, dark: false }],
  "S-Pankki": [{ url: spankki.src, dark: false }],
  "Stoa": [{ url: stoa.src, dark: false }],
  "Context.dev": [{ url: context.src, dark: false }],
  "City of Espoo": [{ url: espoo.src, dark: false }],
  "MariaDB": [{ url: mariadb.src, dark: false }],
  "Verda": [{ url: verda.src, dark: false }],
  "MLH": [{ url: mlh.src, dark: false }],
  "Major League Hacking": [{ url: mlh.src, dark: false }],
  "OpenAI": [{ url: openai.src, dark: false }],
  "Google DeepMind": [{ url: google.src, dark: false }],
  "NVIDIA": [{ url: nvidia.src, dark: false }],
  "Aiven": [{ url: aiven.src, dark: true }],
  "CRACI": [{ url: craci.src, dark: false }],
  "Cloudinary": [{ url: cloudinary.src, dark: false }],
  "Modal": [{ url: modal.src, dark: false }],
  "Oxylabs": [{ url: oxylabs.src, dark: false }],
  "Atech": [{ url: atech.src, dark: false }],
  "Ignite Next x Intel": [{ url: ignite.src, dark: true }, { url: intel.src, dark: false }],
};
