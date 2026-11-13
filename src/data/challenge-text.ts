// Full challenge wording imported from the partner pages. These files contain only the
// challenge content, never the participant dashboard, account details or countdown.
export type ChallengeTextSection = {
  title: string;
  eyebrow?: string;
  html: string;
  sidebar: boolean;
};

export type ChallengeText = {
  title: string;
  org: string;
  task: string;
  prizes: string;
  sections: ChallengeTextSection[];
};

const sources = import.meta.glob<ChallengeText>("./challenge-text/*.json", {
  eager: true,
  import: "default",
});

export const challengeText = Object.fromEntries(
  Object.entries(sources).map(([file, content]) => [file.split("/").at(-1)!.replace(/\.json$/, ""), content]),
);
