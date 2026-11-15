export type Role = 'talent' | 'company'
export const FIELDS = ['Design', 'Engineering', 'Product', 'Data', 'Marketing'] as const
export type Field = (typeof FIELDS)[number]
export const LANGUAGES = ['English', 'German', 'French', 'Spanish', 'Dutch', 'Italian']
export const AVAILABILITY = ['Immediately', 'Within 1 month', 'Within 3 months', 'Not looking']
export const PERMITS = ['EU citizen', 'Valid work permit', 'Needs sponsorship']
export const SKILLS: Record<Field, string[]> = {
  Design: ['Figma', 'Prototyping', 'Design systems', 'User research', 'Motion', 'Branding'],
  Engineering: ['React', 'TypeScript', 'Node.js', 'Python', 'Cloud / DevOps', 'Mobile'],
  Product: ['Roadmapping', 'Analytics', 'Discovery', 'Stakeholder mgmt', 'Experimentation', 'Pricing'],
  Data: ['SQL', 'Python', 'Machine learning', 'Visualisation', 'Statistics', 'Data engineering'],
  Marketing: ['SEO', 'Content', 'Paid media', 'CRM', 'Brand strategy', 'Analytics'],
}
export const ALL_SKILLS = Array.from(new Set(Object.values(SKILLS).flat()))

export type Culture = { remote: number; pace: number; structure: number; collab: number }
export const VALUES = [
  'Learning & growth',
  'Impact & purpose',
  'Work-life balance',
  'Compensation',
  'Autonomy',
  'Team spirit',
  'Innovation',
  'Stability',
]

export type Answers = Record<string, number | string[]>
export type TalentProfile = {
  name: string
  field: Field | ''
  languages: string[]
  years: number
  availability: string
  permit: string
  skills: string[]
}
export type CompanyProfile = {
  name: string
  field: Field | ''
  languages: string[]
  skills: string[]
}

export type MockCompany = {
  id: string
  name: string
  tagline: string
  field: Field
  languages: string[]
  skills: string[]
  culture: Culture
  values: string[]
  sponsors: boolean
  minYears: number
  hue: number
  size: string
  city: string
}
export type MockTalent = {
  id: string
  name: string
  headline: string
  field: Field
  languages: string[]
  years: number
  skills: string[]
  culture: Culture
  values: string[]
  availability: string
  permit: string
}
export type EventItem = {
  id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  blurb: string
  companyIds: string[]
  talentIds: string[]
  going: number
}

const c = (remote: number, pace: number, structure: number, collab: number): Culture => ({
  remote,
  pace,
  structure,
  collab,
})

export const COMPANIES: MockCompany[] = [
  {
    id: 'c1',
    name: 'Northwind Labs',
    tagline: 'Climate analytics for cities',
    field: 'Data',
    languages: ['English', 'German'],
    skills: ['SQL', 'Python', 'Machine learning', 'Visualisation'],
    culture: c(70, 60, 40, 70),
    values: ['Impact & purpose', 'Learning & growth', 'Innovation'],
    sponsors: true,
    minYears: 2,
    hue: 160,
    size: '120 people',
    city: 'Berlin',
  },
  {
    id: 'c2',
    name: 'Paperplane',
    tagline: 'Payments for creators',
    field: 'Engineering',
    languages: ['English'],
    skills: ['React', 'TypeScript', 'Node.js', 'Cloud / DevOps'],
    culture: c(90, 85, 30, 55),
    values: ['Autonomy', 'Compensation', 'Innovation'],
    sponsors: true,
    minYears: 3,
    hue: 18,
    size: '60 people',
    city: 'Remote',
  },
  {
    id: 'c3',
    name: 'Atelier Vert',
    tagline: 'Brand & product studio',
    field: 'Design',
    languages: ['English', 'French'],
    skills: ['Figma', 'Branding', 'Motion', 'Prototyping'],
    culture: c(40, 55, 35, 90),
    values: ['Team spirit', 'Innovation', 'Work-life balance'],
    sponsors: false,
    minYears: 1,
    hue: 140,
    size: '25 people',
    city: 'Paris',
  },
  {
    id: 'c4',
    name: 'Helix Health',
    tagline: 'Digital care pathways',
    field: 'Product',
    languages: ['English', 'German', 'Dutch'],
    skills: ['Discovery', 'Analytics', 'Stakeholder mgmt', 'Roadmapping'],
    culture: c(50, 45, 75, 65),
    values: ['Impact & purpose', 'Stability', 'Work-life balance'],
    sponsors: true,
    minYears: 4,
    hue: 200,
    size: '400 people',
    city: 'Amsterdam',
  },
  {
    id: 'c5',
    name: 'Loop & Co',
    tagline: 'Growth agency for D2C brands',
    field: 'Marketing',
    languages: ['English', 'Spanish'],
    skills: ['SEO', 'Paid media', 'Content', 'CRM'],
    culture: c(60, 90, 25, 70),
    values: ['Compensation', 'Team spirit', 'Learning & growth'],
    sponsors: false,
    minYears: 2,
    hue: 45,
    size: '45 people',
    city: 'Barcelona',
  },
  {
    id: 'c6',
    name: 'Tessera',
    tagline: 'Design systems at scale',
    field: 'Design',
    languages: ['English', 'German'],
    skills: ['Design systems', 'Figma', 'User research', 'Prototyping'],
    culture: c(75, 40, 80, 60),
    values: ['Stability', 'Autonomy', 'Learning & growth'],
    sponsors: true,
    minYears: 3,
    hue: 280,
    size: '800 people',
    city: 'Munich',
  },
  {
    id: 'c7',
    name: 'Quanta Robotics',
    tagline: 'Warehouse automation',
    field: 'Engineering',
    languages: ['English', 'German'],
    skills: ['Python', 'Cloud / DevOps', 'Mobile', 'Node.js'],
    culture: c(25, 65, 70, 60),
    values: ['Innovation', 'Impact & purpose', 'Stability'],
    sponsors: true,
    minYears: 2,
    hue: 330,
    size: '210 people',
    city: 'Zurich',
  },
]

export const TALENTS: MockTalent[] = [
  {
    id: 't1',
    name: 'Amara Okafor',
    headline: 'Product designer',
    field: 'Design',
    languages: ['English', 'French'],
    years: 4,
    skills: ['Figma', 'Design systems', 'Prototyping', 'User research'],
    culture: c(60, 50, 60, 80),
    values: ['Team spirit', 'Learning & growth', 'Innovation'],
    availability: 'Within 1 month',
    permit: 'Valid work permit',
  },
  {
    id: 't2',
    name: 'Jonas Weber',
    headline: 'Full-stack engineer',
    field: 'Engineering',
    languages: ['English', 'German'],
    years: 5,
    skills: ['React', 'TypeScript', 'Node.js', 'Cloud / DevOps'],
    culture: c(85, 80, 35, 55),
    values: ['Autonomy', 'Compensation', 'Innovation'],
    availability: 'Immediately',
    permit: 'EU citizen',
  },
  {
    id: 't3',
    name: 'Priya Raman',
    headline: 'Data scientist',
    field: 'Data',
    languages: ['English', 'German'],
    years: 3,
    skills: ['Python', 'Machine learning', 'SQL', 'Statistics'],
    culture: c(65, 55, 45, 65),
    values: ['Impact & purpose', 'Learning & growth'],
    availability: 'Within 3 months',
    permit: 'Needs sponsorship',
  },
  {
    id: 't4',
    name: 'Mateo Alvarez',
    headline: 'Growth marketer',
    field: 'Marketing',
    languages: ['English', 'Spanish'],
    years: 3,
    skills: ['SEO', 'Paid media', 'CRM', 'Content'],
    culture: c(55, 90, 30, 75),
    values: ['Compensation', 'Team spirit'],
    availability: 'Immediately',
    permit: 'EU citizen',
  },
  {
    id: 't5',
    name: 'Lena Hoffmann',
    headline: 'Product manager',
    field: 'Product',
    languages: ['English', 'German', 'Dutch'],
    years: 6,
    skills: ['Roadmapping', 'Discovery', 'Analytics', 'Stakeholder mgmt'],
    culture: c(50, 45, 70, 65),
    values: ['Impact & purpose', 'Stability', 'Work-life balance'],
    availability: 'Within 3 months',
    permit: 'EU citizen',
  },
  {
    id: 't6',
    name: 'Kenji Mori',
    headline: 'Frontend engineer',
    field: 'Engineering',
    languages: ['English'],
    years: 2,
    skills: ['React', 'TypeScript', 'Mobile'],
    culture: c(70, 60, 50, 60),
    values: ['Learning & growth', 'Innovation'],
    availability: 'Within 1 month',
    permit: 'Needs sponsorship',
  },
  {
    id: 't7',
    name: 'Sofia Rossi',
    headline: 'Brand designer',
    field: 'Design',
    languages: ['English', 'Italian', 'French'],
    years: 2,
    skills: ['Branding', 'Motion', 'Figma'],
    culture: c(40, 55, 30, 90),
    values: ['Team spirit', 'Work-life balance'],
    availability: 'Immediately',
    permit: 'EU citizen',
  },
  {
    id: 't8',
    name: 'David Chen',
    headline: 'Data engineer',
    field: 'Data',
    languages: ['English'],
    years: 7,
    skills: ['SQL', 'Data engineering', 'Python', 'Cloud / DevOps'],
    culture: c(80, 50, 65, 50),
    values: ['Stability', 'Compensation', 'Autonomy'],
    availability: 'Within 1 month',
    permit: 'Valid work permit',
  },
  {
    id: 't9',
    name: 'Nora Lindqvist',
    headline: 'UX researcher',
    field: 'Design',
    languages: ['English', 'German'],
    years: 5,
    skills: ['User research', 'Prototyping', 'Design systems'],
    culture: c(70, 40, 75, 60),
    values: ['Autonomy', 'Learning & growth', 'Stability'],
    availability: 'Within 3 months',
    permit: 'EU citizen',
  },
  {
    id: 't10',
    name: 'Tom Becker',
    headline: 'Backend engineer',
    field: 'Engineering',
    languages: ['English', 'German'],
    years: 4,
    skills: ['Python', 'Node.js', 'Cloud / DevOps'],
    culture: c(30, 65, 70, 55),
    values: ['Innovation', 'Stability', 'Impact & purpose'],
    availability: 'Within 1 month',
    permit: 'EU citizen',
  },
]

export const EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Spring Tech & Design Fair',
    category: 'Career fair',
    date: 'Sat 14 Jun',
    time: '10:00 - 17:00',
    location: 'Berlin, Station Hall',
    blurb: 'The biggest cross-discipline fair of the season. Book 15-minute intros with teams hiring now.',
    companyIds: ['c1', 'c2', 'c3', 'c6', 'c7'],
    talentIds: ['t1', 't2', 't3', 't6', 't7', 't9', 't10'],
    going: 482,
  },
  {
    id: 'e2',
    title: 'Data for Good Meetup',
    category: 'Networking',
    date: 'Wed 18 Jun',
    time: '18:30 - 21:00',
    location: 'Online',
    blurb: 'Lightning talks from mission-driven data teams, followed by open networking rooms.',
    companyIds: ['c1', 'c4'],
    talentIds: ['t3', 't5', 't8'],
    going: 214,
  },
  {
    id: 'e3',
    title: 'Design Systems Workshop',
    category: 'Workshop',
    date: 'Fri 20 Jun',
    time: '14:00 - 17:00',
    location: 'Munich, Tessera HQ',
    blurb: 'Hands-on session on building tokens and components, with the hiring team in the room.',
    companyIds: ['c6', 'c3'],
    talentIds: ['t1', 't7', 't9'],
    going: 64,
  },
  {
    id: 'e4',
    title: 'Growth & Brand Panel',
    category: 'Panel',
    date: 'Tue 24 Jun',
    time: '17:00 - 19:00',
    location: 'Barcelona, La Nau',
    blurb: 'Four marketing leads discuss what they look for in their next hire.',
    companyIds: ['c5', 'c3'],
    talentIds: ['t4', 't7'],
    going: 148,
  },
  {
    id: 'e5',
    title: 'Ship It: 24h Hackathon',
    category: 'Hackathon',
    date: 'Sat 28 Jun',
    time: '09:00 - 09:00',
    location: 'Zurich, Technopark',
    blurb: 'Build with real company challenges. Top teams get fast-track interviews.',
    companyIds: ['c2', 'c7', 'c1'],
    talentIds: ['t2', 't6', 't8', 't10', 't3'],
    going: 305,
  },
  {
    id: 'e6',
    title: 'Product Leaders Roundtable',
    category: 'Networking',
    date: 'Thu 3 Jul',
    time: '18:00 - 20:30',
    location: 'Amsterdam, De Hallen',
    blurb: 'Small-group conversations between PMs and the companies building tomorrow\u2019s products.',
    companyIds: ['c4', 'c2', 'c5'],
    talentIds: ['t5', 't4', 't2'],
    going: 92,
  },
]

export type Question =
  | { id: string; type: 'checkbox'; prompt: string; hint?: string; options: string[]; max?: number }
  | { id: string; type: 'slider'; prompt: string; hint?: string; left: string; right: string }
  | { id: string; type: 'skills'; prompt: string; hint?: string }
export type Step = { title: string; intro: string; questions: Question[] }

const cultureQs: Question[] = [
  {
    id: 'remote',
    type: 'slider',
    prompt: 'Where do you do your best work?',
    left: 'In the office',
    right: 'Fully remote',
  },
  { id: 'pace', type: 'slider', prompt: 'What pace suits you?', left: 'Steady & deliberate', right: 'Fast & scrappy' },
  {
    id: 'structure',
    type: 'slider',
    prompt: 'How much structure do you like?',
    left: 'Open-ended',
    right: 'Clear process',
  },
  {
    id: 'collab',
    type: 'slider',
    prompt: 'How do you like to work?',
    left: 'Independently',
    right: 'Closely with others',
  },
]
const companyCulture: Question[] = [
  { id: 'remote', type: 'slider', prompt: 'How does your team work?', left: 'In the office', right: 'Fully remote' },
  {
    id: 'pace',
    type: 'slider',
    prompt: 'What is your team\u2019s pace?',
    left: 'Steady & deliberate',
    right: 'Fast & scrappy',
  },
  {
    id: 'structure',
    type: 'slider',
    prompt: 'How structured are your processes?',
    left: 'Open-ended',
    right: 'Clear process',
  },
  {
    id: 'collab',
    type: 'slider',
    prompt: 'How do people collaborate?',
    left: 'Independently',
    right: 'Closely together',
  },
]

export const questionnaire = (role: Role): Step[] =>
  role === 'talent'
    ? [
        {
          title: 'What drives you',
          intro: 'Pick what matters most in your next role.',
          questions: [
            { id: 'values', type: 'checkbox', prompt: 'Choose up to 4 things you value', options: VALUES, max: 4 },
          ],
        },
        {
          title: 'Your strengths',
          intro: 'Skills are the heaviest part of your fit score.',
          questions: [
            { id: 'skills', type: 'skills', prompt: 'Which skills do you bring?', hint: 'Select all that apply' },
          ],
        },
        { title: 'Work style', intro: 'There are no right answers. Drag to where you sit.', questions: cultureQs },
        {
          title: 'Day to day',
          intro: 'A few things about how you like to grow.',
          questions: [
            {
              id: 'growth',
              type: 'checkbox',
              prompt: 'How do you like to learn?',
              options: ['Mentorship', 'Courses & budget', 'Hands-on projects', 'Conferences', 'Peer reviews'],
            },
            {
              id: 'ambition',
              type: 'slider',
              prompt: 'Where do you want to be in 3 years?',
              left: 'Deep specialist',
              right: 'Team lead',
            },
          ],
        },
      ]
    : [
        {
          title: 'What you stand for',
          intro: 'Candidates are matched on shared values.',
          questions: [
            {
              id: 'values',
              type: 'checkbox',
              prompt: 'Choose up to 4 values your company lives by',
              options: VALUES,
              max: 4,
            },
          ],
        },
        {
          title: 'Must-have skills',
          intro: 'These are the heaviest part of every candidate\u2019s fit score.',
          questions: [
            { id: 'skills', type: 'skills', prompt: 'Which skills are you hiring for?', hint: 'Select all that apply' },
          ],
        },
        { title: 'Team culture', intro: 'Describe how your team really works.', questions: companyCulture },
        {
          title: 'The role',
          intro: 'Help us calibrate seniority and urgency.',
          questions: [
            { id: 'seniority', type: 'slider', prompt: 'Target seniority', left: 'Junior', right: 'Principal' },
            {
              id: 'urgency',
              type: 'slider',
              prompt: 'How urgently are you hiring?',
              left: 'Exploring',
              right: 'Start this month',
            },
            {
              id: 'teamSize',
              type: 'slider',
              prompt: 'Size of the team they\u2019d join',
              left: '1 to 3',
              right: '20+',
            },
          ],
        },
        {
          title: 'What you offer',
          intro: 'Highlight what makes the role attractive.',
          questions: [
            {
              id: 'benefits',
              type: 'checkbox',
              prompt: 'Benefits on offer',
              options: [
                'Equity',
                'Learning budget',
                'Visa sponsorship',
                'Relocation',
                'Flexible hours',
                'Wellness',
                'Parental leave',
                '4-day week',
              ],
            },
            {
              id: 'budget',
              type: 'slider',
              prompt: 'Salary position vs. market',
              left: 'Below',
              right: 'Top of market',
            },
          ],
        },
        {
          title: 'Hiring process',
          intro: 'Tell candidates what to expect.',
          questions: [
            {
              id: 'process',
              type: 'checkbox',
              prompt: 'Your interview steps',
              options: [
                'Intro call',
                'Portfolio / code review',
                'Take-home task',
                'Panel interview',
                'Culture chat',
                'Reference check',
              ],
            },
            { id: 'speed', type: 'slider', prompt: 'Typical time to offer', left: '1 week', right: '6+ weeks' },
          ],
        },
      ]
