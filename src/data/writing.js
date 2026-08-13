// Articles published on Towards Data Science. Newest first.
// Adding one is a single entry — nothing else needs to change.

export const articles = [
  {
    title: "The Fluid Simulator That Doesn't Solve the Fluid Equations",
    date: "2026-07-25",
    url: "https://towardsdatascience.com/the-fluid-simulator-that-doesnt-solve-the-fluid-equations/",
    blurb:
      "Generating a Kármán vortex street without solving a single fluid equation.",
    topics: ["Simulation", "CFD", "HPC"],
    // Ties the article to a project slug in src/content/projects, if any.
    project: "lattice-boltzmann",
  },
  {
    title: "Analog AI Is Back, But Can It Survive Its Own Noise?",
    date: "2026-07-17",
    url: "https://towardsdatascience.com/analog-ai-is-back-can-it-survive-its-own-noise/",
    blurb:
      "AI's energy problem is reviving an old idea: computing with physics instead of digital logic.",
    topics: ["Hardware", "Physics"],
  },
  {
    title: "The Polynomial That Fixed 30 Years of Cloth Simulation",
    date: "2026-06-08",
    url: "https://towardsdatascience.com/the-polynomial-that-fixed-30-years-of-cloth-simulation/",
    blurb:
      "A clipping bug that has lived in every 3D simulation pipeline for three decades.",
    topics: ["Simulation", "Geometry"],
  },
  {
    title: "What's the Best Way to Brainwash an LLM?",
    date: "2026-05-13",
    url: "https://towardsdatascience.com/whats-the-best-way-to-brainwash-an-llm/",
    blurb:
      "A weekend spent trying to convince a language model it was C-3PO.",
    topics: ["Machine learning", "LLMs"],
    project: "llm-persona",
  },
  {
    title: "What It Actually Takes to Run Code on a 200M€ Supercomputer",
    date: "2026-04-16",
    url: "https://towardsdatascience.com/what-it-actually-takes-to-run-code-on-200me-supercomputer/",
    blurb:
      "SLURM schedulers, fat-tree topologies, and scaling across 8,000 nodes on MareNostrum V.",
    topics: ["HPC"],
    project: "f1-frontwing",
  },
  {
    title: "Building a Navier-Stokes Solver in Python from Scratch",
    date: "2026-03-22",
    url: "https://towardsdatascience.com/building-a-navier-stokes-solver-in-python-from-scratch-simulating-airflow/",
    blurb:
      "Implementing CFD with NumPy, from discretization to airflow around a bird's wing.",
    topics: ["CFD", "Python"],
    project: "bird-flight",
  },
];

export default articles;
