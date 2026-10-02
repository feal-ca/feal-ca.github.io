// Everything about Ferran that appears in more than one place.
// Update `now` whenever the current situation changes, since it is the single
// field that makes the site look maintained or abandoned.

export const profile = {
  name: "Ferran Alía Castillejos",
  shortName: "Ferran Alía",
  role: "Data science & physical engineering",

  // One sentence, present tense, on the homepage and in the meta description.
  tagline:
    "On paper, physics only solves the easy cases. I write the code for the " +
    "rest, and the machine learning and parallel computing that make it " +
    "fast enough to be useful.",

  // The "what I'm doing right now" line. Keep it current.
  now: {
    text: "In my fourth year at UPC in Barcelona, back from a summer simulating microscope optics with the Physics of Life group at TU Dresden.",
    since: "2026-09",
  },

  location: "Barcelona, Catalonia",

  links: {
    email: "ferran.alia@estudiantat.upc.edu",
    github: "https://github.com/Feal-ca",
    linkedin: "https://www.linkedin.com/in/ferran-alca/",
    tds: "https://towardsdatascience.com/author/ferran-alia/",
    cv: "/Ferran_Alia_CV.pdf",
    cvDark: "/Ferran_Alia_CV_dark.pdf",
  },

  // Reverse chronological. `end: null` means ongoing. Dates are "YYYY" or
  // "YYYY-MM"; about.astro formats them.
  timeline: [
    {
      start: "2026",
      end: null,
      title: "Contributor, Towards Data Science",
      detail: "Long-form writing on simulation, HPC and machine learning.",
    },
    {
      start: "2026-06",
      end: "2026-08",
      title: "Research intern, Physics of Life, TU Dresden",
      detail:
        "Simulating electromagnetic propagation through specimen and " +
        "objective, as virtual instrumentation for learned brightfield " +
        "imaging. On the side, a GNN surrogate for multiple scattering.",
    },
    {
      start: "2025-06",
      end: "2025-08",
      title: "Machine learning intern, MLCode",
      detail:
        "Built an automated framework for evaluating and benchmarking " +
        "retrieval-augmented generation systems.",
    },
    {
      start: "2023",
      end: "2028",
      title: "BSc Data Science & Engineering + BSc Physical Engineering, UPC",
      detail:
        "Both degrees in parallel on the CFIS program, now in the fourth " +
        "year. 8.75/10 average.",
    },
    {
      start: "2022",
      end: null,
      title: "Volunteer mentor",
      detail:
        "Computer science and robotics workshops: Linux, 3D printing and " +
        "programming.",
    },
    {
      start: "2022",
      end: "2023",
      title: "Robotics teacher, Punt Multimèdia",
      detail:
        "Taught Arduino, micro:bit, and 3D printing and modeling.",
    },
  ],

  skills: [
    { group: "Languages", items: ["Python", "C++", "R", "Haskell", "MATLAB"] },
    { group: "Scientific", items: ["OpenFOAM", "OpenMP", "NumPy", "PyTorch", "Blender", "CAD"] },
    { group: "Tools", items: ["Linux", "Git"] },
    { group: "Methods", items: ["CFD", "HPC & SLURM", "Physics-informed ML", "Monte Carlo", "Surrogate modeling"] },
    { group: "Spoken", items: ["Catalan (native)", "Spanish (native)", "English (professional)", "Arabic (beginner)"] },
  ],

  // Reverse chronological; `when` is shown as written.
  awards: [
    { when: "Nov 2024, 2025", what: "Datathon FME participant" },
    { when: "Jun 2025", what: "Physics in Ljubljana, summer school at the University of Ljubljana" },
    { when: "Since 2023", what: "Cum Laude in several subjects at UPC" },
    { when: "2023", what: "Admitted to CFIS, to take two degrees simultaneously" },
    { when: "2023", what: "High-school research project selected for the Barcelona “Mostra de Recerca Jove”" },
    { when: "2022–2023", what: "Graduated from high school with honors" },
    { when: "2019–2021", what: "Algorithms and Programming summer courses at UPC" },
  ],
};

export default profile;
