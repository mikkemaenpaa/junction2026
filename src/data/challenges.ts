// Challenge tracks, tech challenges, partners and the event timeline.
// Copied verbatim from the original src/lib/challenges.ts; edit content here.

export type Link = { label: string; url: string };

export type Challenge = {
  org: string;
  title: string;
  task: string;
  brief?: string[];
  must?: string[];
  optional?: string[];
  judging?: string;
  prizes: string;
  links?: Link[];
};

export type Track = {
  slug: string;
  name: string;
  by?: string;
  challenges: Challenge[];
};

export const tracks: Track[] = [
  {
    slug: "agentic",
    name: "Agentic AI Track",
    challenges: [
      {
        org: "Hostinger",
        title: "Decode the Noise",
        task: "Build an AI-powered tool that detects propaganda, bots and bad actors online, and deploy it live on Hostinger's infrastructure.",
        brief: [
          "Analyse text, social content or web-traffic patterns to detect coordinated propaganda, bot-driven amplification or bad-actor behaviour. Can be an API, a dashboard, a classifier with an explainable verdict, or a monitoring service for site owners.",
        ],
        must: ["Must be deployed and running live on Hostinger's infrastructure by the end of the hackathon, with a public URL the judges can open."],
        judging: "Strength and honesty of the detection logic, including how false positives are handled, matters more than a polished front end.",
        prizes: "1st €2,000 · 2nd €1,000 · all three winning teams get one year of Hostinger hosting and a domain, swag and a spotlight on Hostinger's social media",
        links: [{ label: "hostinger.com", url: "https://www.hostinger.com/" }],
      },
      {
        org: "Tieto",
        title: "Earned Trust in AI Code",
        task: "Design an AI code review concept and show it works. How does AI code review keep pace with AI-written code while humans stay accountable for every change?",
        brief: [
          "Agent tokens passed human tokens in February 2026 and reached 7.3 trillion by August. Reviewing every change by hand does not scale.",
          "Define the concept, principles, reference implementation and technology considerations across frontend, backend and security. Challenge the traditional model: is line-by-line review still right? Balance risk, hallucination, transparency, confidence and quality.",
        ],
        must: [
          "Define the concept the \"PR review\" factory should follow and its key principles.",
          "Illustrate it on one sample agent-written change with its requirement ID.",
          "Show what the AI found, what it refused to decide, and why.",
          "Show how the evidence lets a named human accept the change without a full read.",
          "Name the failure modes seen and keep a short log of decisions.",
          "Use synthetic or cleared sample data only.",
        ],
        judging: "Deliverables: a concept card (recommendation, principles, trade-offs, limits), a live walkthrough showing where the trust comes from, a lessons log and a demo video or presentation. Out of scope: a finished product, model training, vendor selection.",
        prizes: "1st €2,000 · 2nd €1,000 · 3rd €500",
        links: [{ label: "tieto.com", url: "https://www.tieto.com/" }],
      },
      {
        org: "Bahn Express",
        title: "Spread",
        task: "Build the system that runs a simulated car transport company for one week in Finland.",
        brief: [
          "Bahn moves cars for car dealers; freelance drivers drive each car. A dealer asks you and a competitor for a price. Quote too high and you lose the car. If you win, you post the drive as a gig in the drivers' app and choose the fee. Pay too little and no driver takes it in time and the car arrives late.",
        ],
        must: [
          "Scoring: gross margin (what dealers pay minus what you pay drivers). At least 90% of cars must arrive by their deadline.",
          "Create a team at spread.bahnexpress.com/join with event code spread-kmu9z6. Handbook, rules, API reference, TypeScript and Python kits and the leaderboard are on the site. Give your agent spread.bahnexpress.com/llms.txt.",
        ],
        judging: "Ranking rounds open Friday 19:30; every team plays the same secret weeks and Bahn's own best system plays every round. Final on Sunday 08:00 (registration closes 07:30): each team plays its own copy of one secret week, about 34 minutes. The top 10 teams by margin present to the jury in 5–10 slides or a short video. The jury judges how elegant, clear, creative and robust the system is; after reaching the top 10, margin no longer counts.",
        prizes: "1st €2,000 · 2nd €1,000 · 3rd €500",
        links: [
          { label: "Join & handbook", url: "https://spread.bahnexpress.com/join" },
          { label: "llms.txt", url: "https://spread.bahnexpress.com/llms.txt" },
        ],
      },
      {
        org: "AfterQuery",
        title: "Break the Agent",
        task: "Build a reinforcement learning environment that challenges today's best AI agents, demonstrate real failure modes, and show that its rewards reflect real progress.",
        brief: [
          "Choose any setting (game, scientific simulation, software task, real-world process). The environment needs a clear goal, actions the agent can take and a checkable reward. Run a frontier agent in it and compare with a stronger reference run your team can demonstrate and reproduce. AfterQuery provides the agent harness and model credits. Judges will try to find reward hacks.",
          "Optional stretch: train a smaller model using experience from the environment and show whether it improves.",
        ],
        must: [
          "The gap (30 p): the frontier agent consistently scores below your reference run, reproducibly.",
          "Meaningful difficulty (30 p): agent mistakes come from real decisions in the task, not withheld info, trick wording, impossible timing or broken tools.",
          "Reward integrity (25 p): the reward holds up against exploits; doing nothing or stopping early earns little; completing the task well is the best way to score.",
          "Craft (15 p): rules make sense; judges can run the evaluation from the README with one command and reproduce results.",
        ],
        judging: "10-minute demo. Judges rerun your reference run, three agent runs, a do-nothing baseline and a stop-early baseline, and spend 15 minutes looking for exploits. Tiebreaker: a smaller model improving after training.",
        prizes: "1st €3,000 + work trial at AfterQuery + merch · 2nd €1,500 + merch · 3rd €500",
        links: [{ label: "afterquery.com", url: "https://afterquery.com/" }],
      },
      {
        org: "Valio Aimo",
        title: "Trusted Trade Agents",
        task: "Prototype the interface and operating model that lets an external AI purchasing agent interact with Valio Aimo's systems — find products, compare offers, place orders, get the right approval — without exposing real systems, confidential data or the marketplace roadmap. Built on open, verifiable standards, not a single platform's black box.",
        brief: [
          "Valio Aimo serves 20,000+ professional kitchens with 25,000 products from 700 suppliers. For Junction they mock today's webshop and backend, not the future marketplace.",
          "Example request: \"I need 1,000 litres of lactose-free milk by Monday. Find an option that meets our requirements based on price and availability.\" A hotel chain's agent sends this; the solution returns products, prices and availability in structured form; the agent orders within its authority or sends it to a human for approval.",
          "Not about replacing the e-commerce UI with a chatbot, but defining how a wholesaler can be safely and openly readable by autonomous agents.",
        ],
        must: [
          "Product, price and availability lookup: a structured way for an external agent to search and retrieve what is available and at what price.",
          "Requesting price and availability, then placing an order: a defined interaction from inquiry to commitment, based on fixed prices (not negotiated quotes).",
          "Permission and human-approval management: what the agent may decide alone and what must go to a human for sign-off.",
        ],
        optional: [
          "Delivery time and sustainability comparison (delivery reliability, certificates and sustainability labels; category-level carbon-footprint ranges as a stretch).",
          "Substitution and other exception handling.",
          "Traceability and explainability: a human-readable record of what the agent did and why.",
        ],
        prizes: "1st €4,000 · 2nd €2,000 · 3rd €1,000",
        links: [
          { label: "valioaimo.fi", url: "https://www.valioaimo.fi/" },
          { label: "Resource portal", url: "https://junction26.valioaimo.fi/" },
        ],
      },
      {
        org: "Exa",
        title: "The Internet Butler / Your Personal Assistant",
        task: "Build a personal agent that takes tedious tasks off people's hands. It finds what matters across the web, works out what needs to happen and gets the task as close to done as possible, leaving final approval to the user if needed. Demo on a real case.",
        brief: [
          "Example areas: planning special occasions, daily errands, checking if a rent increase is legal, missed benefits, business information, travel disruption.",
          "Exa is a search engine built for AI that finds, reads and compares web information and returns structured data.",
        ],
        judging: "How well Exa is used to get information not available from a model's training data; usefulness to a specific group of real people; how clearly sources are shown; originality; whether the demo works on live queries, including ones judges try themselves.",
        prizes: "1st $2,500 cash + $5,000 Exa credits + Exa hoodie per person + Exa TRMNL dashboard · 2nd $1,500 + $3,000 credits + hoodie per person + Exa macropad · 3rd $500 + $1,000 credits + hoodie per person",
        links: [{ label: "exa.ai", url: "https://exa.ai/" }],
      },
    ],
  },
  {
    slug: "hardware",
    name: "Hardware Track",
    by: "Arduino",
    challenges: [
      {
        org: "Arduino",
        title: "The Green European Renaissance",
        task: "Make Europe greener through Edge AI using the Arduino UNO Q. Create local solutions to local (mainly environmental) problems that do not depend on governments or big tech companies.",
        prizes: "1st Ventuno Q unit per team member · 2nd UNO Q 4G + Plug and Make Kit per member · 3rd Plug and Make Kit per member",
        links: [{ label: "arduino.cc", url: "https://www.arduino.cc/" }],
      },
      {
        org: "Meta",
        title: "AI Glasses for Everyone, Everyday",
        task: "Build the best everyday use case for Meta AI glasses, showing how a first-person field of view enables new or better interactions in everyday scenarios.",
        must: [
          "Clearly state the problem and audience; deliver a functional prototype and a deck.",
          "Display and audio-first experiences count equally, as do web apps and Device Access Toolkit mobile integrations.",
          "The prototype should handle permissions, errors, performance trade-offs, connectivity and device state changes, with consent and safe data practices.",
        ],
        judging: "Creativity, technical execution, real-world impact, inclusive interaction design for people with all abilities, clear wearable benefit, and a plausible path to adoption or pilot.",
        prizes: "Each member of the winning team gets a pair of Ray-Ban Meta glasses",
        links: [{ label: "meta.com", url: "https://www.meta.com/" }],
      },
      {
        org: "Ignite Next x Intel",
        title: "Stop Simulating, Start Moving",
        task: "Build an autonomous inspection cell with a real robot arm in one weekend (Intel Physical AI Challenge).",
        brief: [
          "Setup per team: SO-101 robot arm, leader arm for teleoperation, top-view camera, inspection camera, box of Duplo bricks (some marked defective by you).",
          "Teleoperate the arm to record demonstrations; fine-tune a vision-language-action (VLA) policy in Physical AI Studio on cloud GPUs; train an Anomalib model to tell good from defective bricks; combine so the arm picks each brick, shows it to the inspection camera and drops it into the \"good\" or \"defective\" bowl fully autonomously, with models optimized with OpenVINO running on an Intel Core Ultra Series 3 laptop CPU/GPU/NPU.",
          "Stretch: faster cycles, messier piles, new defect types.",
        ],
        prizes: "1st €5,000 · 2nd €3,000 · 3rd €2,000",
        links: [
          { label: "intel.com", url: "https://www.intel.com/" },
          { label: "ignitenext.com", url: "https://www.ignitenext.com/" },
        ],
      },
      {
        org: "Rokoko",
        title: "The Robot Teleoperation Challenge",
        task: "Use Rokoko professional motion capture suits and gloves to control robotic hands, arms or humanoid robots, physically or in simulation. Build something useful, unexpected or unbelievable.",
        brief: ["Can be combined with other hardware and challenges at the event."],
        prizes: "1st Smartgloves II + SDK license + blog feature and extended support (~€4,990) · 2nd Smartsuit Pro II (~€2,295) · 3rd Smartgloves I + merch (~€1,095)",
        links: [{ label: "rokoko.com", url: "https://www.rokoko.com/" }],
      },
      {
        org: "Aalto University",
        title: "Aaltonomous Humanoid",
        task: "Give Aalto's Unitree G1 humanoid (\"Vaiski\") a brain so it sorts objects into boxes autonomously.",
        brief: [
          "Setup: robot behind a counter, legs and waist stiff, two 7-DoF arms and two three-fingered Dex3 hands. 3–5 printed objects (cubes, cylinders, triangular prisms, about 4.5 cm, red/yellow/blue) at random positions. Three identical unmarked orange boxes (21 cm wide) at fixed left/centre/right positions, 5 cm apart, 40 cm from the torso. Every object must go into the right box within 2 minutes.",
        ],
        must: [
          "Modes: fixed sorting (red left, yellow centre, blue right); sort by text instruction with unseen phrasings. Stretch: put each object through the matching hole in a lid.",
          "Inputs: head camera (colour + depth), both wrist cameras, joint states and instruction. Outputs: target positions for all arm and finger joints 30 times per second.",
          "Build and test in a ready-made Isaac Sim simulation with Verda GPUs; real-robot datasets published on Hugging Face during the event (links on Discord); submit a Docker image running a policy server.",
        ],
        judging: "Evaluation in simulation on an unseen scene version; the top ~5 teams run live on the real G1 on Sunday; the best real-robot score wins.",
        prizes: "Winner €2,000 + visit to the Aalto robotics lab · top ~5 teams run on the real robot",
        links: [
          { label: "aalto.fi", url: "https://www.aalto.fi/" },
          { label: "verda.com", url: "https://verda.com/" },
        ],
      },
    ],
  },
  {
    slug: "fintech",
    name: "FinTech Track",
    challenges: [
      {
        org: "Cala",
        title: "Make Unicorns Real",
        task: "Build a product on top of Cala's data that solves a real need for founders, investors, or both.",
        brief: [
          "Can be a focused tool for a specific user (e.g. a first-time founder raising their first round, a small fund deciding which industries to bet on) or a broader ecosystem tool (e.g. an agent that connects the right founders and investors). One need solved well beats ten solved halfway. Aim for a complete product founders and investors could use the day after the hackathon, when Slush starts.",
          "Cala is the public data layer for AI agents: an agent-first knowledge graph where every data point is sourced and connected (companies, people, funding rounds, investors and the connections between them), queryable through an API or MCP. The product must rely on this.",
        ],
        judging: "25% each: real need (clear user with a problem worth solving); execution (works smoothly end to end); originality (fresh angle, even on a familiar problem); use of Cala (core to the product, not an add-on).",
        prizes: "Winner: each member becomes a \"Cala Comet\" (~€5,000 for a team of four) — for three months, one hackathon per month anywhere with travel and accommodation covered, plus €1,000 in Cala credits and merch. Runner-up: €500 in Cala credits + merch.",
        links: [{ label: "cala.ai", url: "https://cala.ai/" }],
      },
      {
        org: "S-Pankki",
        title: "Personal Economic Trainer",
        task: "Build an AI experience that lets people chat with their own money, turning personal banking data into a trusted financial coach.",
        brief: [
          "Data: a large synthetic transaction dataset modelled on real S-Bank data. Example questions: \"How much did I spend on taxis last month?\", \"What kind of spender am I?\", \"What is safe for me to spend this week?\", \"How much could I save if I reduced dining out by 20%?\"",
          "Valued: a pedagogical angle based on three spending baskets — mandatory and regular (e.g. rent), mandatory and irregular (e.g. a broken washing machine), and everyday spending that slips through your fingers (e.g. coffees). MyData spirit: let users explore their own data freely instead of fixed bank-picked charts. Can add open data (e.g. Statistics Finland) for benchmarks. Financial literacy, especially for young adults.",
          "Recommended output: a mobile app, or a web app that can be embedded in a mobile app. Context: S-Bank has 3.5 million customers; S-mobiili is used weekly by one in three Finnish adults. No Finnish bank yet lets customers chat with their own financial data.",
        ],
        prizes: "1st €2,000 Airbnb gift card · 2nd €1,000 · 3rd €500",
        links: [{ label: "s-pankki.fi", url: "https://s-pankki.fi/" }],
      },
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare Track",
    challenges: [
      {
        org: "AstraZeneca",
        title: "Equal Care Across Finland",
        task: "Build an AI-powered system that supports equal and effective cancer care across Finland. Key insights are given at the AstraZeneca stand on Friday 20:00.",
        brief: [
          "Possible formats: an AI analyst explaining indicator trends and proposing actions; a monitoring dashboard with recommendations; an early-warning system for emerging delays; a simulation of an intervention's impact.",
        ],
        must: [
          "Identify the gap: detect differences in access to cancer care or treatment outcomes.",
          "Locate the gap in the care pathway: detection, referral from primary to specialist care, diagnosis, or treatment initiation.",
          "Recommend what to do (most important): concrete, evidence-based improvement proposals implementable nationally or at account level.",
          "Use reliable evidence (public data and/or AstraZeneca mentor insights) and show sources for every claim.",
          "Cover at least one indicator connected to Goal 3 of the national cancer strategy.",
          "Submit a working demo — slides alone are not enough.",
        ],
        prizes: "1st €1,000 · 2nd €750 · 3rd €250",
        links: [{ label: "astrazeneca.com", url: "https://www.astrazeneca.com/" }],
      },
      {
        org: "Aalto University",
        title: "Beyond the Clinic",
        task: "Build a product that helps people stay well at home after depression treatment (TMS), using anything from natural stimuli to a phone, music, games, light or AI.",
        brief: [
          "TMS treats severe depression in clinics but depression can return, so home \"maintenance\" treatment is needed. At home there are no blood tests, brain scans or psychiatrists, but brain activity and mental condition can be measured in other ways.",
          "Ideal: a closed loop — sense how someone is doing, respond with something that helps, and learn what works best for that person.",
        ],
        prizes: "To be announced",
        links: [{ label: "aalto.fi", url: "https://www.aalto.fi/" }],
      },
    ],
  },
  {
    slug: "ai-infra",
    name: "AI Infrastructure Track",
    by: "Verda",
    challenges: [
      {
        org: "Stoa",
        title: "Make Blueprints Talk",
        task: "Build a program that answers natural-language questions about construction drawings and building information models accurately and verifiably.",
        brief: [
          "Data: a dataset of real technical drawings in many formats and languages, with example questions.",
          "A great answer is correct and shows where in the drawing it came from, so a human can verify it in seconds.",
          "Preferred: approaches next year's frontier models will not make obsolete, e.g. hybrids combining frontier models, computer vision, 3D, geometry or small fine-tuned models.",
        ],
        prizes: "1st €1,000 + work trial at Stoa · 2nd €750 · 3rd €250",
        links: [
          { label: "stoa.fi", url: "https://www.stoa.fi/" },
          { label: "verda.com", url: "https://verda.com/" },
        ],
      },
    ],
  },
  {
    slug: "data",
    name: "Data Track",
    challenges: [
      {
        org: "Context.dev",
        title: "The Web Is Your Real-Time Database",
        task: "Build a product that reacts to the live web and turns live web data into decisions, actions or experiences that were not possible before.",
        brief: [
          "Context.dev turns any website, company, person or news story into clean structured data with one API call.",
          "Inspiration: GPU rental price comparison across clouds; a leaderboard ranking founders and startups by activity on X; monitoring newly disclosed security vulnerabilities; personalized onboarding with company data and brand assets.",
        ],
        prizes: "1st €2,000 + swag · 2nd €500 + swag · 3rd swag",
        links: [{ label: "context.dev", url: "https://context.dev/" }],
      },
      {
        org: "City of Espoo",
        title: "Rethinking Recruitment",
        task: "How can recruitment and matchmaking events organized by the City of Espoo help companies and talent find and connect with each other relevantly, now that AI-generated job search materials and AI-assisted recruitment are common?",
        prizes: "1st €1,500 · 2nd €1,000 · 3rd €500",
        links: [{ label: "espoo.fi", url: "https://www.espoo.fi/" }],
      },
      {
        org: "MariaDB",
        title: "Wikipedia Through Time",
        task: "Build a tool for Wikipedia that does not exist yet or is badly underused, with MariaDB at the core.",
        must: [
          "RAG track (recommended): use MariaDB native vector search for question answering over Wikipedia with grounded, source-cited answers (e.g. a research assistant for the history of Finland).",
          "SVT track (advanced): use MariaDB system-versioned tables to query how knowledge changes over time — what an article said on a given date, edit wars, how a historical event's story was rewritten.",
          "Both (very advanced): e.g. \"what did Wikipedia say about this in 2015, and what has changed since?\"",
        ],
        judging: "Effective and creative use of MariaDB RAG and/or system-versioned tables; technical execution and scalability across the provided datasets; real-world usefulness for Wikipedia readers or editors; design and demo quality. Extra recognition for SVT or combined.",
        prizes: "1st €1,000 + €1,000 UpCloud credits + MariaDB certification voucher per member · 2nd €500 · 3rd €250 · winners credited on the mariadb.org blog",
        links: [{ label: "mariadb.com", url: "https://mariadb.com/" }],
      },
    ],
  },
];

export type TechChallenge = {
  org: string;
  title: string;
  task: string;
  prizes: string;
  links?: Link[];
};

export const techChallenges: TechChallenge[] = [
  {
    org: "Verda",
    title: "Verda Compute Track",
    task: "Use Verda compute to build something you could not build on a laptop, for any challenge — train G1 policies, VLA policies, RL rollouts for AfterQuery, embed full Wikipedia for MariaDB, run open-weight models in Europe for banking or recruitment. Products: inference API, GPU instances and instant clusters, CPU instances, auto-scaling containers, batch jobs. Document the process and post a summary link in Verda's Discord channel. No crypto mining.",
    prizes: "1st $10,000 cloud credits + hoodies · 2nd and 3rd $2,500 credits",
    links: [{ label: "verda.com", url: "https://verda.com/" }],
  },
  {
    org: "MLH",
    title: "Best Use of MongoDB Atlas",
    task: "Build with MongoDB Atlas.",
    prizes: "M5Stack IoT Kit per member",
    links: [{ label: "mongodb.com", url: "https://www.mongodb.com/cloud/atlas" }],
  },
  {
    org: "MLH",
    title: "Best Use of Vultr",
    task: "Use Vultr cloud compute and GPUs.",
    prizes: "M5Stack mini programmable monitor",
    links: [{ label: "vultr.com", url: "https://www.vultr.com/" }],
  },
  {
    org: "MLH",
    title: "Best Use of Tiger Data",
    task: "Use Tiger Data, PostgreSQL for real-time and time-series data.",
    prizes: "Stream Deck Mini",
    links: [{ label: "tigerdata.com", url: "https://tigerdata.com/" }],
  },
  {
    org: "MLH",
    title: "Best Use of Solana",
    task: "Build on Solana.",
    prizes: "Unruggable hardware wallets per member",
    links: [{ label: "solana.com", url: "https://solana.com/" }],
  },
  {
    org: "MLH",
    title: "Best Use of Entire",
    task: "Use Entire, the Git forge for agent-human collaboration: Sessions, Graph, Brain, Trails. Show token efficiency.",
    prizes: "Mini portable projector",
    links: [{ label: "entire.com", url: "https://entire.com/" }],
  },
  {
    org: "MLH",
    title: "Best Use of ElevenLabs",
    task: "Use ElevenLabs realistic AI voices and audio.",
    prizes: "Wireless earbuds",
    links: [{ label: "elevenlabs.io", url: "https://elevenlabs.io/" }],
  },
  {
    org: "OpenAI",
    title: "Best Use of Codex",
    task: "Use Codex meaningfully in building your project, alongside any other challenge.",
    prizes: "1st $10,000 API credits · 2nd $5,000 · 3rd $2,500",
    links: [{ label: "openai.com/codex", url: "https://openai.com/codex" }],
  },
  {
    org: "Google DeepMind",
    title: "Best Use of Gemini API",
    task: "Open innovation: a meaningful, innovative, technically impressive use of Gemini. Show why Gemini matters to the solution.",
    prizes: "1st €4,000 + $1,000 Google Cloud credits per member · 2nd €2,000 · 3rd €1,000",
    links: [{ label: "ai.google.dev", url: "https://ai.google.dev/gemini-api/docs" }],
  },
  {
    org: "Google DeepMind",
    title: "Best Use of Gemma",
    task: "Most innovative and impactful use of Google's Gemma open models.",
    prizes: "€1,000 each for the top 3 teams (no ranking)",
    links: [{ label: "ai.google.dev", url: "https://ai.google.dev/gemma" }],
  },
  {
    org: "NVIDIA",
    title: "Best Use of Nemotron",
    task: "Build a project where NVIDIA Nemotron 3.5 Super VL plays a meaningful role in doing real work (reasoning, tool use, workflows) for a clear audience. It reads text, images, documents and video. Use it in the working solution, show its contribution in the demo, and submit a short text explaining the model, what it does, why it matters and how outputs were improved. Access: NVIDIA Build free API (OpenAI-compatible, base URL https://integrate.api.nvidia.com/v1, about 40 requests/min per key), OpenRouter, Hugging Face.",
    prizes: "Two best teams each get 1x NVIDIA RTX 5080",
    links: [{ label: "build.nvidia.com", url: "https://build.nvidia.com/" }],
  },
  {
    org: "Arduino",
    title: "Best Use of Arduino UNO Q",
    task: "Use the UNO Q and Modulino sensors in any project; run AI on the device and make things sense, move, light up or react.",
    prizes: "Arduino UNO Q + Plug and Make Kit per member",
    links: [{ label: "arduino.cc", url: "https://www.arduino.cc/" }],
  },
  {
    org: "Context.dev",
    title: "Best Use of Context.dev",
    task: "Fully structured web: use at least one Context.dev API endpoint in the core flow; its data must visibly drive something in the demo. Submit a GitHub repo, a demo and a short note on the endpoints used and why.",
    prizes: "1st €750 + swag · 2nd €250 + swag · 3rd swag",
    links: [{ label: "context.dev", url: "https://context.dev/" }],
  },
  {
    org: "Aiven",
    title: "Best Use of Aiven",
    task: "Use at least one Aiven service meaningfully: Runtime, PostgreSQL, Valkey, Kafka, ClickHouse, OpenSearch.",
    prizes: "1st €1,000 · 2nd €750 · 3rd €500",
    links: [{ label: "aiven.io", url: "https://aiven.io/" }],
  },
  {
    org: "CRACI",
    title: "Best Use of CRACI",
    task: "Run your project's CI/CD on CRACI (GitHub Actions runs-on: craci), which records build contents, exposes data via API and can auto-fix vulnerabilities. Build software that defends itself.",
    prizes: "1st LEGO set per member · 2nd 24-pack of Red Bull per member · 3rd invite to the CRACI x OpenAI lunch during Slush",
    links: [{ label: "craci.com", url: "https://craci.com/" }],
  },
  {
    org: "Cloudinary",
    title: "Best Use of Cloudinary",
    task: "Use one of the tools listed at cld.media/hackathons to solve a real problem with images and video. Submit via cld.media/hackathon-survey.",
    prizes: "$500 Amazon gift cards per member",
    links: [{ label: "cloudinary.com", url: "https://cloudinary.com/" }],
  },
  {
    org: "Modal",
    title: "Best Use of Modal",
    task: "Use Modal to power your main project: serve open models on GPU, run agent code in Sandboxes, fine-tune, or run batch jobs in plain Python.",
    prizes: "1st $2,000 cash + $3,000 Modal credits",
    links: [{ label: "modal.com", url: "https://modal.com/" }],
  },
  {
    org: "Oxylabs",
    title: "Best Agentic Use Case of Oxylabs Web API",
    task: "Use the Oxylabs Web API (search and scrape) at runtime so your agent acts on what is true on the web right now and shows source URLs. At least one live /search or /scrape call at runtime — pre-downloaded data does not count. Submit the same repo and demo as your main challenge plus a note on endpoints used. Ideas: cross-country price comparison, a fact-checker reading full pages, comparing what AI assistants say vs. the web, watchers for regulations, tenders, grants and competitors.",
    prizes: "€1,000 Apple gift voucher + $500 Oxylabs credits per member",
    links: [{ label: "oxylabs.io", url: "https://oxylabs.io/" }],
  },
  {
    org: "Atech",
    title: "Atech Real World Challenge",
    task: "Build a physical device that solves a real problem for a real person, using Atech snap-together ESP32 modules as the body and AI as the brain (firmware generated and flashed from the browser). Atech modules must be used in the live demo; post a summary in Discord; submit a public GitHub repo or exported Atech project and an about 2-minute video or live demo.",
    prizes: "Winner: Pro Atech kit · runners-up: Atech kits and swag · top teams featured on Atech channels and invited to Copenhagen",
    links: [{ label: "atech.dev", url: "https://atech.dev/" }],
  },
];

export const partners: [string, string][] = [
  ["Hostinger", "https://www.hostinger.com/"], ["Valio Aimo", "https://www.valioaimo.fi/"], ["S-Pankki", "https://s-pankki.fi/"],
  ["Aalto University", "https://www.aalto.fi/"], ["Cala", "https://cala.ai/"], ["City of Espoo", "https://www.espoo.fi/"],
  ["AstraZeneca", "https://www.astrazeneca.com/"], ["Exa", "https://exa.ai/"], ["MariaDB", "https://mariadb.com/"],
  ["Intel", "https://www.intel.com/"], ["Meta", "https://www.meta.com/"], ["NVIDIA", "https://www.nvidia.com/"],
  ["OpenAI Codex", "https://openai.com/codex"], ["Modal", "https://modal.com/"], ["Aiven", "https://aiven.io/"],
  ["Cloudinary", "https://cloudinary.com/"], ["Rokoko", "https://www.rokoko.com/"], ["Featherless", "https://featherless.ai/"],
  ["Tieto", "https://www.tieto.com/"], ["AfterQuery", "https://afterquery.com/"], ["Bahn Express", "https://spread.bahnexpress.com/join"],
  ["Verda", "https://verda.com/"], ["Stoa", "https://www.stoa.fi/"], ["Context.dev", "https://context.dev/"],
  ["Oxylabs", "https://oxylabs.io/"], ["CRACI", "https://craci.com/"], ["Atech", "https://atech.dev/"], ["MLH", "https://mlh.io/"],
];

export const timeline: [string, string][] = [
  ["Fri 13 Nov 18:00", "Opening ceremony & keynotes"],
  ["Fri 13 Nov 19:30", "Hacking starts · Bahn Express ranking rounds open"],
  ["Fri 13 Nov 23:55", "Preliminary submission"],
  ["Sat 14 Nov 12:00", "Submissions start"],
  ["Sun 15 Nov 08:00", "Bahn Express final (registration closes 07:30)"],
  ["Sun 15 Nov 10:00", "Final submissions"],
  ["Sun 15 Nov 14:00", "Review time · final ceremony & top 5 pitches"],
  ["Sun 15 Nov 17:00", "Event ends"],
];

export const challengeCount =
  tracks.reduce((n, t) => n + t.challenges.length, 0) + techChallenges.length;
