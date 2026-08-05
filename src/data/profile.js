// Everything about Ferran that appears in more than one place.
// Update `now` whenever the current situation changes — it is the single
// field that makes the site look maintained or abandoned.

export const profile = {
  name: "Ferran Alía Castillejos",
  shortName: "Ferran Alía",
  role: "Data science & physical engineering",

  // One sentence, present tense, on the homepage and in the meta description.
  tagline:
    "I build simulations of physical systems, and the machine learning and " +
    "high-performance computing that make them tractable.",

  // The "what I'm doing right now" line. Keep it current.
  now: {
    text: "Research internship at TU Dresden through the summer, then back to Barcelona for my fourth year at UPC.",
    since: "2026-08",
  },

  location: "Barcelona, Catalonia",

  links: {
    email: "ferran.alia@estudiantat.upc.edu",
    github: "https://github.com/Feal-ca",
    linkedin: "https://www.linkedin.com/in/ferran-alca/",
    tds: "https://towardsdatascience.com/author/ferran-alia/",
    cv: "/Ferran_Alia_CV.pdf",
  },

  // Reverse chronological. `end: null` means ongoing.
  timeline: [
    {
      start: "2026",
      end: null,
      title: "Contributor, Towards Data Science",
      detail: "Long-form writing on simulation, HPC and machine learning.",
    },
    {
      start: "2026",
      end: "2026",
      title: "Research intern, TU Dresden",
      detail: "Summer research internship.",
      // TODO(ferran): add the group and a one-line description of the work.
    },
    {
      start: "2025",
      end: "2025",
      title: "Machine learning intern, MLCode",
      detail:
        "Built an automated framework for evaluating and benchmarking " +
        "retrieval-augmented generation systems.",
    },
    {
      start: "2023",
      end: null,
      title: "BSc Data Science & Engineering + BSc Physical Engineering, UPC",
      detail:
        "Both degrees in parallel on the CFIS grant. 8.62/10 average.",
    },
    {
      start: "2022",
      end: null,
      title: "Volunteer mentor",
      detail:
        "Computer science and robotics workshops — Linux, 3D printing and " +
        "programming.",
    },
    {
      start: "2022",
      end: "2023",
      title: "Robotics teacher, Punt Multimèdia",
      detail:
        "Taught Arduino, micro:bit, and 3D printing and modelling.",
    },
  ],

  skills: [
    { group: "Languages", items: ["Python", "C++", "R", "Haskell", "MATLAB"] },
    { group: "Scientific", items: ["OpenFOAM", "OpenMP", "NumPy", "PyTorch", "Blender", "CAD"] },
    { group: "Methods", items: ["CFD", "HPC & SLURM", "Physics-informed ML", "Monte Carlo", "Surrogate modelling"] },
    { group: "Spoken", items: ["Catalan (native)", "Spanish (native)", "English (professional)"] },
  ],

  awards: [
    { when: "2026", what: "Datathon FME participant (2024 and 2025)" },
    { when: "2025", what: "Physics summer school, University of Ljubljana" },
    { when: "2023", what: "CFIS grant, to read two degrees simultaneously" },
    { when: "2023", what: "Selected for the Barcelona “Mostra de Recerca Jove”" },
  ],
};

export default profile;
