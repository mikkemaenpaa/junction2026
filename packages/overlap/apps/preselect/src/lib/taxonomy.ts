// The eight expertise areas of the Deep Tech Talent Forum registration form, with the tools
// and keywords that count as evidence for each. The tool lists are a starting point compiled
// from general knowledge of the fields, not a usage statistic.
import type { FieldId } from './types.ts'

export interface FieldDef {
  id: FieldId
  name: string
  short: string
  /** Sub-areas named on the registration form. */
  description: string
  /** Words that mark a work item, role or degree as belonging to the field. */
  keywords: string[]
  /** Fields of study that count as relevant education. */
  degreeFields: string[]
  /** Portfolio platforms most used in the field. */
  platforms: string[]
}

/** The event the applicants apply to. */
export const EVENT_NAME = 'Deep Tech Talent Forum'

export const FIELDS: FieldDef[] = [
  {
    id: 'semiconductors',
    name: 'Semiconductors and Microelectronics',
    short: 'Semiconductors',
    description:
      'Semiconductor materials, manufacturing, process technologies, chip design, ASICs, integrated circuits, electronics and microelectronics.',
    keywords: [
      'semiconductor',
      'microelectronic',
      'chip design',
      'asic',
      'vlsi',
      'integrated circuit',
      'ic design',
      'rtl',
      'wafer',
      'cmos',
      'transistor',
      'tapeout',
      'tape-out',
      'eda',
      'foundry',
      'system-on-chip',
      'analog design',
      'digital design',
      'physical design',
      'risc-v',
    ],
    degreeFields: [
      'electrical',
      'electronic',
      'microelectronic',
      'nanotechnolog',
      'materials',
      'physics',
      'semiconductor',
      'computer engineering',
    ],
    platforms: ['GitHub', 'Tiny Tapeout', 'ChipFoundry', 'OpenCores', 'LinkedIn'],
  },
  {
    id: 'photonics',
    name: 'Photonics, Optics and Imaging',
    short: 'Photonics',
    description:
      'Optics, lasers, photonics, imaging systems, machine vision, optical sensors, AR/VR technologies and optoelectronics.',
    keywords: [
      'photonic',
      'optic',
      'laser',
      'imaging',
      'machine vision',
      'lens',
      'optoelectronic',
      'augmented reality',
      'virtual reality',
      'ar/vr',
      'spectroscop',
      'microscop',
      'lidar',
      'waveguide',
      'hologra',
      'photodetector',
      'fiber optic',
      'optical fiber',
    ],
    degreeFields: ['photonic', 'optic', 'physics', 'electrical', 'electronic', 'imaging', 'optoelectronic'],
    platforms: ['ResearchGate', 'Google Scholar', 'GitHub', 'Behance'],
  },
  {
    id: 'quantum',
    name: 'Quantum Technologies',
    short: 'Quantum',
    description:
      'Quantum computing, quantum hardware, cryogenics, quantum software, quantum communications and related research.',
    keywords: [
      'quantum',
      'qubit',
      'cryogenic',
      'superconduct',
      'entanglement',
      'qkd',
      'error correction',
      'ion trap',
      'josephson',
      'dilution refrigerator',
    ],
    degreeFields: ['physics', 'quantum', 'mathematics', 'computer science', 'electrical', 'nanotechnolog'],
    platforms: ['GitHub', 'Qiskit ecosystem', 'PennyLane demos', 'arXiv', 'ORCID'],
  },
  {
    id: 'embedded',
    name: 'Electronics, Embedded Systems and Advanced Hardware',
    short: 'Embedded & hardware',
    description:
      'Embedded software, FPGA, PCB design, robotics, IoT, hardware development and hardware-software integration.',
    keywords: [
      'embedded',
      'firmware',
      'fpga',
      'pcb',
      'microcontroller',
      'robot',
      'iot',
      'internet of things',
      'hardware',
      'rtos',
      'device driver',
      'bootloader',
      'circuit design',
      'circuit board',
      'schematic',
      'soldering',
      'sensor node',
      'motor control',
      'power electronics',
    ],
    degreeFields: [
      'electrical',
      'electronic',
      'embedded',
      'computer engineering',
      'computer science',
      'automation',
      'robotic',
      'mechatronic',
    ],
    platforms: ['GitHub', 'Hackaday.io', 'Hackster.io', 'OSHWLab', 'Arduino Project Hub'],
  },
  {
    id: 'space',
    name: 'Space, Sensing and Scientific Instrumentation',
    short: 'Space & sensing',
    description:
      'Space technologies, satellites, sensing solutions, measurement systems, test equipment and scientific instruments.',
    keywords: [
      'satellite',
      'spacecraft',
      'aerospace',
      'space technolog',
      'space mission',
      'space system',
      'cubesat',
      'remote sensing',
      'earth observation',
      'sensor',
      'sensing',
      'instrumentation',
      'measurement',
      'telemetry',
      'gnss',
      'radar',
      'orbit',
      'test equipment',
      'metrology',
      'spectrometer',
      'telescope',
    ],
    degreeFields: [
      'aerospace',
      'space',
      'physics',
      'electrical',
      'electronic',
      'mechanical',
      'geodesy',
      'astronom',
      'measurement',
    ],
    platforms: ['GitHub', 'Hackaday.io', 'ResearchGate', 'Zenodo'],
  },
  {
    id: 'ai',
    name: 'AI, Data and High-Performance Computing',
    short: 'AI, data & HPC',
    description:
      'Artificial intelligence, machine learning, data analytics, simulations, modelling, digital twins and scientific computing.',
    keywords: [
      'machine learning',
      'deep learning',
      'neural network',
      'artificial intelligence',
      'data science',
      'data analy',
      'llm',
      'language model',
      'nlp',
      'computer vision',
      'simulation',
      'digital twin',
      'high-performance computing',
      'hpc',
      'scientific computing',
      'gpu',
      'reinforcement learning',
      'transformer',
      'data engineering',
    ],
    degreeFields: [
      'computer science',
      'data science',
      'machine learning',
      'artificial intelligence',
      'mathematics',
      'statistics',
      'physics',
      'computational',
    ],
    platforms: ['GitHub', 'Kaggle', 'Hugging Face', 'Streamlit', 'Weights & Biases'],
  },
  {
    id: 'research',
    name: 'Research and Innovation (R&D)',
    short: 'R&D',
    description:
      'Research, product development, laboratory work, applied science, technology commercialization and innovation projects.',
    keywords: [
      'research',
      'publication',
      'patent',
      'phd',
      'postdoc',
      'doctoral',
      'laborator',
      'r&d',
      'innovation',
      'experiment',
      'thesis',
      'journal',
      'conference paper',
      'preprint',
      'product development',
      'applied science',
    ],
    degreeFields: [
      'physics',
      'chemistry',
      'materials',
      'engineering',
      'biolog',
      'mathematics',
      'computer science',
      'nanotechnolog',
    ],
    platforms: ['ORCID', 'ResearchGate', 'Google Scholar', 'Zenodo', 'OSF'],
  },
  {
    id: 'business',
    name: 'Business and Support Functions in Deep Tech',
    short: 'Business & support',
    description:
      'Technical sales, business development, product management, project management, operations, marketing, HR and customer success.',
    keywords: [
      'sales',
      'business development',
      'product manage',
      'product team',
      'product strategy',
      'roadmap',
      'project manage',
      'marketing',
      'operations manage',
      'human resources',
      'recruit',
      'customer',
      'go-to-market',
      'business strategy',
      'partnership',
      'account manage',
      'revenue',
      'founder',
      'leadership',
      'stakeholder',
      'saas',
      'b2b',
      'pricing',
      'startup',
      'entrepreneur',
      'negotiat',
      'commerciali',
    ],
    degreeFields: [
      'business',
      'economics',
      'finance',
      'accounting',
      'marketing',
      'management',
      'industrial engineering',
      'commerce',
      'communication',
    ],
    platforms: ['LinkedIn', 'Notion', 'Behance', 'Medium', 'Personal website'],
  },
]

export const FIELD_BY_ID = Object.fromEntries(FIELDS.map((f) => [f.id, f])) as Record<FieldId, FieldDef>

export interface ToolDef {
  name: string
  fields: FieldId[]
  /** Other spellings, lower case. The name itself always matches. */
  aliases?: string[]
  /**
   * A method or subject area rather than a named tool. Its spellings are word stems
   * ("robot" also finds "robotics"), because research work is described by subject, not
   * by software.
   */
  topic?: boolean
}

export const TOOLS: ToolDef[] = [
  // Programming languages
  { name: 'Python', fields: ['photonics', 'quantum', 'embedded', 'space', 'ai', 'research'] },
  { name: 'C', fields: ['embedded', 'space'] },
  { name: 'C++', fields: ['embedded', 'space', 'ai'], aliases: ['cpp'] },
  { name: 'Rust', fields: ['embedded'] },
  { name: 'MATLAB', fields: ['photonics', 'space', 'research'] },
  { name: 'Simulink', fields: ['space', 'embedded'] },
  { name: 'Julia', fields: ['quantum', 'ai'] },
  { name: 'R', fields: ['research'] },
  { name: 'Fortran', fields: ['ai'] },
  { name: 'SQL', fields: ['ai'], aliases: ['postgresql', 'mysql'] },

  // Semiconductors and microelectronics
  { name: 'Verilog', fields: ['semiconductors', 'embedded'] },
  { name: 'SystemVerilog', fields: ['semiconductors', 'embedded'], aliases: ['system verilog'] },
  { name: 'VHDL', fields: ['semiconductors', 'embedded'] },
  { name: 'UVM', fields: ['semiconductors'], aliases: ['universal verification methodology'] },
  { name: 'RISC-V', fields: ['semiconductors', 'embedded'], aliases: ['riscv'] },
  { name: 'Cadence Virtuoso', fields: ['semiconductors'], aliases: ['virtuoso', 'cadence'] },
  { name: 'Cadence Innovus', fields: ['semiconductors'], aliases: ['innovus'] },
  { name: 'Synopsys Design Compiler', fields: ['semiconductors'], aliases: ['design compiler', 'synopsys'] },
  { name: 'Synopsys VCS', fields: ['semiconductors'], aliases: ['vcs'] },
  { name: 'PrimeTime', fields: ['semiconductors'] },
  { name: 'Siemens Calibre', fields: ['semiconductors'], aliases: ['calibre'] },
  { name: 'SPICE', fields: ['semiconductors', 'embedded'], aliases: ['ngspice', 'ltspice', 'hspice', 'spectre'] },
  { name: 'TCAD', fields: ['semiconductors'], aliases: ['sentaurus', 'silvaco'] },
  { name: 'OpenROAD', fields: ['semiconductors'], aliases: ['openlane'] },
  { name: 'Yosys', fields: ['semiconductors'] },
  { name: 'KLayout', fields: ['semiconductors'] },
  {
    name: 'Photolithography',
    fields: ['semiconductors'],
    aliases: [
      'optical lithography',
      'euv lithography',
      'nanoimprint lithography',
      'lithography process',
      'lithographic patterning',
    ],
  },
  { name: 'Etching', fields: ['semiconductors'], aliases: ['dry etch', 'reactive ion etching'] },
  {
    name: 'Thin-film deposition',
    fields: ['semiconductors'],
    aliases: ['atomic layer deposition', 'chemical vapor deposition', 'sputtering', 'ald', 'cvd', 'pvd'],
  },
  { name: 'Cleanroom', fields: ['semiconductors', 'quantum'], aliases: ['clean room'] },
  { name: 'SEM', fields: ['semiconductors', 'research'], aliases: ['scanning electron microscop'] },
  { name: 'AFM', fields: ['semiconductors', 'research'], aliases: ['atomic force microscop'] },

  // Photonics, optics and imaging
  { name: 'Zemax OpticStudio', fields: ['photonics'], aliases: ['zemax', 'opticstudio'] },
  { name: 'CODE V', fields: ['photonics'], aliases: ['codev'] },
  { name: 'LightTools', fields: ['photonics'] },
  { name: 'Ansys Lumerical', fields: ['photonics'], aliases: ['lumerical'] },
  { name: 'Meep', fields: ['photonics'] },
  { name: 'COMSOL', fields: ['photonics', 'space', 'ai', 'research'] },
  { name: 'OpenCV', fields: ['photonics', 'ai'] },
  { name: 'HALCON', fields: ['photonics'] },
  { name: 'LabVIEW', fields: ['photonics', 'space'] },
  { name: 'Lasers', fields: ['photonics'], aliases: ['laser'] },
  { name: 'Spectroscopy', fields: ['photonics', 'research'], aliases: ['spectroscop'] },

  // Quantum technologies
  { name: 'Qiskit', fields: ['quantum'] },
  { name: 'Cirq', fields: ['quantum'] },
  { name: 'PennyLane', fields: ['quantum'] },
  { name: 'Q#', fields: ['quantum'], aliases: ['qsharp'] },
  { name: 'QuTiP', fields: ['quantum'] },
  { name: 'Cryogenics', fields: ['quantum'], aliases: ['cryogenic', 'dilution refrigerator', 'cryostat'] },
  { name: 'Microwave measurement', fields: ['quantum', 'space'], aliases: ['microwave', 'vector network analyzer'] },
  {
    name: 'Nanofabrication',
    fields: ['quantum', 'semiconductors'],
    aliases: ['electron beam lithography', 'e-beam lithography'],
  },

  // Electronics, embedded systems and hardware
  { name: 'FPGA', fields: ['embedded', 'semiconductors', 'quantum'] },
  { name: 'FreeRTOS', fields: ['embedded'] },
  { name: 'Zephyr', fields: ['embedded'] },
  { name: 'Embedded Linux', fields: ['embedded'], aliases: ['yocto', 'buildroot'] },
  { name: 'Vivado', fields: ['embedded', 'semiconductors'], aliases: ['xilinx'] },
  { name: 'Quartus', fields: ['embedded', 'semiconductors'], aliases: ['altera'] },
  { name: 'Altium Designer', fields: ['embedded'], aliases: ['altium'] },
  { name: 'KiCad', fields: ['embedded'] },
  { name: 'OrCAD', fields: ['embedded'], aliases: ['cadence allegro'] },
  { name: 'ROS 2', fields: ['embedded'], aliases: ['ros2', 'robot operating system', 'ros'] },
  { name: 'STM32', fields: ['embedded'] },
  { name: 'ARM Cortex-M', fields: ['embedded'], aliases: ['cortex-m', 'arm cortex'] },
  { name: 'nRF', fields: ['embedded'], aliases: ['nrf52', 'nrf53', 'nrf connect', 'nordic semiconductor'] },
  { name: 'ESP32', fields: ['embedded'], aliases: ['esp-idf', 'esp8266'] },
  { name: 'Arduino', fields: ['embedded'] },
  { name: 'CAN bus', fields: ['embedded'], aliases: ['canbus', 'canopen'] },
  { name: 'I2C / SPI', fields: ['embedded'], aliases: ['i2c', 'spi'] },
  { name: 'Bluetooth LE', fields: ['embedded'], aliases: ['bluetooth low energy', 'ble'] },

  // Space, sensing and instrumentation
  { name: 'STK', fields: ['space'], aliases: ['systems tool kit'] },
  { name: 'GMAT', fields: ['space'] },
  { name: 'RF design', fields: ['space', 'embedded'], aliases: ['rf engineering', 'antenna design', 'rf circuit'] },
  { name: 'ECSS', fields: ['space'] },
  { name: 'CubeSat', fields: ['space'] },
  { name: 'Sensor calibration', fields: ['space'], aliases: ['calibration'] },
  { name: 'Data acquisition', fields: ['space'], aliases: ['daq'] },
  { name: 'Environmental testing', fields: ['space'], aliases: ['thermal vacuum', 'vibration test'] },
  { name: 'Ansys', fields: ['space', 'ai'] },

  // AI, data and HPC
  { name: 'PyTorch', fields: ['ai'], aliases: ['torch'] },
  { name: 'TensorFlow', fields: ['ai'], aliases: ['keras'] },
  { name: 'JAX', fields: ['ai'] },
  { name: 'scikit-learn', fields: ['ai'], aliases: ['sklearn'] },
  { name: 'Hugging Face Transformers', fields: ['ai'], aliases: ['transformers', 'hugging face'] },
  { name: 'pandas', fields: ['ai'], aliases: ['numpy'] },
  { name: 'Jupyter Notebook', fields: ['ai', 'research'], aliases: ['jupyter'] },
  { name: 'Apache Spark', fields: ['ai'], aliases: ['pyspark', 'spark'] },
  { name: 'CUDA', fields: ['ai'] },
  { name: 'MPI', fields: ['ai'], aliases: ['openmpi', 'mpich'] },
  { name: 'OpenMP', fields: ['ai'] },
  { name: 'Slurm', fields: ['ai'] },
  { name: 'Docker', fields: ['ai'] },
  { name: 'Kubernetes', fields: ['ai'], aliases: ['k8s'] },
  { name: 'OpenFOAM', fields: ['ai'] },

  // Research and innovation
  { name: 'Experimental design', fields: ['research'], aliases: ['design of experiments'] },
  { name: 'Laboratory methods', fields: ['research'], aliases: ['laboratory', 'lab work'] },
  { name: 'Statistical analysis', fields: ['research'], aliases: ['statistics'] },
  {
    name: 'Technology transfer',
    fields: ['research', 'business'],
    aliases: ['commercialization', 'commercialisation'],
  },

  // Business and support functions
  { name: 'Technical sales', fields: ['business'], aliases: ['sales engineer', 'pre-sales', 'b2b sales'] },
  { name: 'Business development', fields: ['business'] },
  { name: 'Product ownership', fields: ['business'], aliases: ['product owner'] },
  { name: 'Project management', fields: ['business'], aliases: ['project manager', 'scrum', 'pmp', 'prince2'] },
  { name: 'Salesforce', fields: ['business'] },
  { name: 'HubSpot', fields: ['business'] },
  { name: 'Jira', fields: ['business'] },
  { name: 'Marketing', fields: ['business'] },
  { name: 'Recruiting', fields: ['business'], aliases: ['talent acquisition', 'human resources'] },
  { name: 'Customer success', fields: ['business'], aliases: ['account management'] },

  // Methods and subject areas. Publications, patents and project write-ups name these
  // rather than software, so they are what gives a research profile its depth and breadth.
  {
    name: 'ASIC design',
    topic: true,
    fields: ['semiconductors', 'research'],
    aliases: ['asic', 'vlsi', 'chip design', 'tapeout', 'tape-out', 'system-on-chip'],
  },
  {
    name: 'Digital IC design',
    topic: true,
    fields: ['semiconductors', 'research'],
    aliases: ['rtl design', 'digital design', 'logic synthesis', 'digital circuit', 'hdl'],
  },
  {
    name: 'Analog IC design',
    topic: true,
    fields: ['semiconductors', 'research'],
    aliases: ['analog design', 'analog circuit', 'mixed-signal', 'analog ic', 'phase-locked loop', 'data converter'],
  },
  {
    name: 'Semiconductor fabrication',
    topic: true,
    fields: ['semiconductors', 'research'],
    aliases: [
      'semiconductor process',
      'semiconductor manufactur',
      'wafer',
      'cmos process',
      'thin film',
      'microfabrication',
      'process integration',
    ],
  },
  {
    name: 'Semiconductor devices',
    topic: true,
    fields: ['semiconductors', 'research'],
    aliases: ['semiconductor device', 'transistor', 'mosfet', 'finfet', 'cmos'],
  },
  {
    name: 'IC packaging',
    topic: true,
    fields: ['semiconductors', 'research'],
    aliases: [
      'chip packaging',
      'electronic packaging',
      'microelectronics packaging',
      'wire bond',
      'flip chip',
      'solder joint',
      'advanced packaging',
    ],
  },
  {
    name: 'Hardware verification',
    topic: true,
    fields: ['semiconductors'],
    aliases: ['testbench', 'formal verification', 'design verification', 'functional verification'],
  },

  {
    name: 'Photonic integrated circuits',
    topic: true,
    fields: ['photonics', 'research'],
    aliases: [
      'photonic integrated',
      'silicon photonic',
      'integrated photonic',
      'waveguide',
      'photonic circuit',
      'photonic crystal',
    ],
  },
  {
    name: 'Optical design',
    topic: true,
    fields: ['photonics', 'research'],
    aliases: ['lens design', 'optical system', 'ray tracing', 'ray-tracing'],
  },
  {
    name: 'Imaging systems',
    topic: true,
    fields: ['photonics', 'research'],
    aliases: [
      'imaging system',
      'microscop',
      'image sensor',
      'hyperspectral',
      'optical imaging',
      'computational imaging',
    ],
  },
  {
    name: 'Machine vision',
    topic: true,
    fields: ['photonics', 'ai'],
    aliases: ['computer vision', 'image processing', 'object detection'],
  },
  { name: 'LiDAR', topic: true, fields: ['photonics', 'space'] },
  {
    name: 'Optoelectronics',
    topic: true,
    fields: ['photonics', 'research'],
    aliases: ['optoelectronic', 'photodetector', 'photodiode', 'vcsel', 'light-emitting', 'semiconductor laser'],
  },
  {
    name: 'Fiber optics',
    topic: true,
    fields: ['photonics', 'research'],
    aliases: ['fiber optic', 'optical fiber', 'fibre optic', 'optical fibre', 'fiber laser'],
  },
  {
    name: 'AR/VR',
    topic: true,
    fields: ['photonics'],
    aliases: ['augmented reality', 'virtual reality', 'mixed reality'],
  },

  {
    name: 'Quantum computing',
    topic: true,
    fields: ['quantum', 'research'],
    aliases: [
      'quantum comput',
      'quantum algorithm',
      'quantum circuit',
      'qubit',
      'quantum software',
      'quantum simulat',
      'quantum processor',
    ],
  },
  {
    name: 'Quantum error correction',
    topic: true,
    fields: ['quantum', 'research'],
    aliases: ['error correction', 'surface code', 'fault-tolerant', 'fault tolerant'],
  },
  {
    name: 'Superconducting qubits',
    topic: true,
    fields: ['quantum', 'research'],
    aliases: ['superconducting qubit', 'transmon', 'josephson', 'superconducting circuit', 'superconducting quantum'],
  },
  {
    name: 'Quantum communication',
    topic: true,
    fields: ['quantum', 'research'],
    aliases: ['quantum key distribution', 'qkd', 'quantum network', 'quantum cryptograph'],
  },
  {
    name: 'Quantum sensing',
    topic: true,
    fields: ['quantum', 'research'],
    aliases: ['quantum sens', 'quantum metrolog', 'nv center', 'magnetometr'],
  },
  {
    name: 'Quantum hardware',
    topic: true,
    fields: ['quantum', 'research'],
    aliases: ['ion trap', 'trapped ion', 'quantum dot', 'quantum device'],
  },

  { name: 'Embedded systems', topic: true, fields: ['embedded'], aliases: ['embedded'] },
  { name: 'Firmware', topic: true, fields: ['embedded'], aliases: ['bare-metal', 'bare metal', 'bootloader'] },
  { name: 'PCB design', topic: true, fields: ['embedded'], aliases: ['pcb', 'printed circuit board', 'schematic'] },
  { name: 'Microcontrollers', topic: true, fields: ['embedded'], aliases: ['microcontroller', 'mcu'] },
  { name: 'Robotics', topic: true, fields: ['embedded', 'research'], aliases: ['robot'] },
  { name: 'IoT', topic: true, fields: ['embedded'], aliases: ['internet of things'] },
  {
    name: 'Device drivers',
    topic: true,
    fields: ['embedded'],
    aliases: ['device driver', 'kernel module', 'linux kernel', 'driver development'],
  },
  {
    name: 'Power electronics',
    topic: true,
    fields: ['embedded', 'research'],
    aliases: ['power electronic', 'motor control', 'power supply design', 'dc-dc'],
  },

  {
    name: 'Satellite systems',
    topic: true,
    fields: ['space', 'research'],
    aliases: ['satellite', 'spacecraft', 'nanosatellite', 'space mission'],
  },
  {
    name: 'Remote sensing',
    topic: true,
    fields: ['space', 'research'],
    aliases: ['earth observation', 'satellite imag'],
  },
  { name: 'GNSS', topic: true, fields: ['space'], aliases: ['gps receiver', 'satellite navigation'] },
  { name: 'Radar', topic: true, fields: ['space', 'research'], aliases: ['synthetic aperture'] },
  { name: 'Spectrometry', topic: true, fields: ['space', 'research'], aliases: ['spectromet'] },
  {
    name: 'Instrumentation',
    topic: true,
    fields: ['space', 'research'],
    aliases: ['scientific instrument', 'measurement system', 'test equipment', 'metrolog'],
  },
  { name: 'Sensors', topic: true, fields: ['space', 'embedded'], aliases: ['sensor'] },
  { name: 'Orbital mechanics', topic: true, fields: ['space'], aliases: ['orbit', 'astrodynamic', 'attitude control'] },

  { name: 'Machine learning', topic: true, fields: ['ai', 'research'], aliases: ['ml model', 'supervised learning'] },
  {
    name: 'Deep learning',
    topic: true,
    fields: ['ai', 'research'],
    aliases: ['neural network', 'convolutional', 'transformer model', 'diffusion model'],
  },
  {
    name: 'NLP and language models',
    topic: true,
    fields: ['ai'],
    aliases: ['natural language', 'language model', 'llm', 'nlp', 'text generation'],
  },
  { name: 'Reinforcement learning', topic: true, fields: ['ai', 'research'] },
  {
    name: 'Data analysis',
    topic: true,
    fields: ['ai'],
    aliases: ['data analy', 'data science', 'data visuali', 'exploratory data'],
  },
  { name: 'Data engineering', topic: true, fields: ['ai'], aliases: ['data pipeline', 'etl pipeline'] },
  {
    name: 'Scientific computing',
    topic: true,
    fields: ['ai', 'research'],
    aliases: [
      'numerical simulation',
      'high-performance computing',
      'hpc',
      'parallel computing',
      'finite element',
      'computational fluid',
    ],
  },
  { name: 'Digital twins', topic: true, fields: ['ai'], aliases: ['digital twin'] },

  {
    name: 'Materials science',
    topic: true,
    fields: ['research', 'semiconductors'],
    aliases: ['nanomaterial', 'material characteri', 'nanotechnolog', 'nanostructure'],
  },
  {
    name: 'Product development',
    topic: true,
    fields: ['research', 'business'],
    aliases: ['prototyping', 'proof of concept'],
  },
  { name: 'Patents', topic: true, fields: ['research'], aliases: ['patent'] },

  {
    name: 'Product strategy',
    topic: true,
    fields: ['business'],
    aliases: [
      'roadmap',
      'product discovery',
      'user research',
      'product-market fit',
      'product management',
      'product manager',
    ],
  },
  {
    name: 'Sales',
    topic: true,
    fields: ['business'],
    aliases: ['b2b', 'lead generation', 'negotiation', 'account executive'],
  },
  {
    name: 'Go-to-market',
    topic: true,
    fields: ['business'],
    aliases: ['growth strategy', 'customer acquisition', 'pricing strategy', 'market entry'],
  },
  {
    name: 'Startups',
    topic: true,
    fields: ['business'],
    aliases: ['startup', 'fundrais', 'venture capital', 'entrepreneur'],
  },
]

export const TOOL_BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t])) as Record<string, ToolDef>

export function toolsOfField(field: FieldId): ToolDef[] {
  return TOOLS.filter((t) => t.fields.includes(field))
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// One spelling of a tool and the pattern that finds it in running text. A tool's spelling
// matches only as a whole word; a topic's spelling is a stem and may continue.
interface Spelling {
  tool: ToolDef
  text: string
  pattern: RegExp
}

const STEMS = new Set(['spectroscop', 'scanning electron microscop', 'atomic force microscop', 'cryogenic'])

const SPELLINGS: Spelling[] = TOOLS.flatMap((tool) =>
  [tool.name.toLowerCase(), ...(tool.aliases ?? [])].map((text) => ({
    tool,
    text,
    pattern: new RegExp(
      `(?<![a-z0-9+#])${escapeRe(text)}${tool.topic || STEMS.has(text) ? '' : '(?![a-z0-9+#])'}`,
      'i',
    ),
  })),
)

// Spellings too short or too common as ordinary words to trust in prose ("C", "R", "spark").
// They still match when a page lists them as a tool or a repository language.
const NAME_ONLY = new Set([
  'c',
  'r',
  'spark',
  'ros',
  'ble',
  'spi',
  'ald',
  'cvd',
  'pvd',
  'vcs',
  'sem',
  'afm',
  'torch',
  'laser',
  'calibration',
  'transformers',
  'statistics',
  'laboratory',
  'marketing',
  'daq',
  'stk',
  'mpi',
  'ansys',
])

/** The tool a short tool or language name refers to, e.g. "Jupyter Notebook" or "cpp". */
export function toolFromName(name: string): ToolDef | null {
  const n = name.trim().toLowerCase()
  if (!n) return null
  const exact = SPELLINGS.find((s) => s.text === n)
  if (exact) return exact.tool
  // "PyTorch Lightning", "Python 3": the name contains a known spelling as a whole word.
  const inside = SPELLINGS.filter((s) => s.text.length >= 4 && !NAME_ONLY.has(s.text) && s.pattern.test(n))
  if (!inside.length) return null
  return inside.reduce((best, s) => (s.text.length > best.text.length ? s : best)).tool
}

/** Tools mentioned in running text such as a description, a README or a CV. */
export function toolsInText(text: string): ToolDef[] {
  const found = new Set<ToolDef>()
  for (const s of SPELLINGS) {
    if (NAME_ONLY.has(s.text)) continue
    if (s.pattern.test(text)) found.add(s.tool)
  }
  return [...found]
}

// A keyword must start a word. Short ones ("eda", "gpu") must also end it; longer ones are
// stems, so "photonic" also finds "photonics".
const KEYWORD_PATTERNS = FIELDS.map((f) => ({
  id: f.id,
  patterns: f.keywords.map((k) => new RegExp(`(?<![a-z0-9])${escapeRe(k)}${k.length <= 4 ? '(?![a-z0-9])' : ''}`, 'i')),
}))

/** Fields whose keywords appear in the text. */
export function fieldsInText(text: string): FieldId[] {
  return KEYWORD_PATTERNS.filter((f) => f.patterns.some((p) => p.test(text))).map((f) => f.id)
}
