// Component settings exactly as configured for this page. Do not "tidy" these numbers: they are
// the approved material, lighting and motion values for each ReactDrops component.

/** The overlap palette (same tokens as apps/app and src/styles/global.css). */
export const PALETTE = {
  paper: '#f5f1ea',
  card: '#fffdf9',
  ink: '#11201c',
  mute: '#6b7a74',
  line: '#e3ddd1',
  forest: '#0e3b33',
  lime: '#d9f26b',
  coral: '#ff7a59',
  limeRgb: 'rgb(217 242 107)',
} as const

/** Chromatic Button. */
export const CHROMATIC = {
  color: '#b126ff',
  colorMode: 'spectrum',
  speed: 0.7,
  phase: 0,
  feather: 100,
  projectionScale: 174.7,
  intensity: 1.4,
  grain: 0.105,
  seed: 7,
  borderRadius: 50,
  hoverEffect: 'brighten',
  entrance: 'blur-up',
  entranceSpeed: 1,
  entranceBlur: 10,
  entranceDistance: 20,
  entranceScale: 0.65,
} as const

/** Bubble UI: the Light glass material with the configured lighting and reflections. */
export const GLASS = {
  iridescence: 0.5,
  oilCoverage: 0.73,
  oilEdgeFade: 2.33,
  clearCenter: 0.57,
  windowLength: 1.3,
  windowMargin: 0.85,
  windowBend: 0.75,
  windowSize: 0.75,
  windowWidth: 0.8,
  windowGradient: 0.96,
  windowHead: 0.7,
  windowTail: 0.6,
  glintSize: 1.65,
  glintIntensity: 0,
  glintDistance: -0.45,
  glintHeight: 0.65,
  windowIntensity: 0.85,
  windowTwin: false,
  bottomShadeColor: '#ffffff',
} as const

/** Liquid Glass Orb. */
export const ORB = {
  baseColor: '#ffffff',
  colorA: '#000000',
  colorB: '#4d4d4d',
  colorC: '#a9a9a9',
  seed: 145,
  startTime: 18,
  speed: 1.5,
  distortion: 0.8,
  clusterCount: 7.2,
  clusterIntensity: 3,
  clusterSize: 22.5,
  scale: 0.23,
  spotSize: 1.15,
  rotation: 0,
  softness: 0.31,
  relief: 2.94,
  refraction: 0.65,
  roughness: 0,
  reflection: 1.3,
  caustics: 0,
  dispersion: 1,
  colorDistribution: 0,
  grain: 0.3,
  grainSize: 1,
  animateDistortion: true,
  grainMode: 'fine',
  flowType: 'drift',
  thinkingAnimation: 'ripples',
  searchingAnimation: 'lens',
  preserveWhites: true,
  animateEntrance: true,
  size: 250,
  audioLevel: 0.55,
} as const

/** Depth Field. The image corners are rounded in hero.css (radius + squircle), not here. */
export const FIELD = {
  textAlign: 'center',
  speed: 5,
  entryBurst: 70,
  entryDuration: 2.8,
  entryDelay: 0,
  scrollBoost: 50,
  rotationSpeed: 11,
  rotationDirection: 'counterclockwise',
  spread: 12,
  depth: 96,
  count: 36,
  imageSize: 3.8,
  imageRadius: 0,
  imageOrigin: 'center',
} as const
