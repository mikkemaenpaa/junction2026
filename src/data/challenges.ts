// Challenge tracks and partners. Used by the home page chips and the /challenges page.

export interface Track {
  /** Anchor id on /challenges (the home page chips link to /challenges#<slug>). */
  slug: string;
  name: string;
  by: string;
}

/** [name, url] */
export type Partner = readonly [name: string, url: string];

export const tracks: readonly Track[] = [
  { slug: "hardware", name: "Hardware Track", by: "Arduino" },
  { slug: "ai-infra", name: "AI Infrastructure Track", by: "Verda" },
  { slug: "healthcare", name: "Healthcare Track", by: "AstraZeneca" },
  { slug: "fintech", name: "FinTech Track", by: "S-Pankki" },
  { slug: "agentic", name: "Agentic AI Track", by: "TBA" },
  { slug: "data", name: "Data Track", by: "Cala" },
];

export const partners: readonly Partner[] = [
  ["Hostinger", "https://www.hostinger.com/"], ["Valio Aimo", "https://www.valioaimo.fi/"], ["S-Pankki", "https://s-pankki.fi/"],
  ["Aalto University", "https://www.aalto.fi/"], ["Cala", "https://cala.ai/"], ["City of Espoo", "https://www.espoo.fi/"],
  ["AstraZeneca", "https://www.astrazeneca.com/"], ["Exa", "https://exa.ai/"], ["MariaDB", "https://mariadb.com/"],
  ["Intel", "https://www.intel.com/"], ["Meta", "https://www.meta.com/"], ["NVIDIA", "https://www.nvidia.com/"],
  ["OpenAI Codex", "https://openai.com/codex"], ["Modal", "https://modal.com/"], ["Aiven", "https://aiven.io/"],
  ["Cloudinary", "https://cloudinary.com/"], ["Rokoko", "https://www.rokoko.com/"], ["Featherless", "https://featherless.ai/"],
];
