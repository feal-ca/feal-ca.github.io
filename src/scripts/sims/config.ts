// What each simulation's plate says and which controls it gets. Read by
// SimPlate.astro at build time to render the caption and control bar; the
// runner then wires the same names to the simulation's set() and action().
//
// Captions must say what is simulated and that it isn't the project's code
// or results (CLAUDE.md, Honesty).

export type Control =
  | { type: "range"; name: string; label: string; min: number; max: number; step: number; value: number; unit?: string }
  | { type: "choice"; name: string; label: string; value: number; options: { value: number; label: string }[] }
  | { type: "toggle"; name: string; label: string; value: number }
  | { type: "button"; name: string; label: string; key?: string };

export interface SimConfig {
  caption: string;
  canvasLabel: string;
  /** What you can do with the pointer, shown above the controls. */
  hint?: string;
  controls: Control[];
  /** False to start paused even when motion is allowed. */
  autoplay?: boolean;
  /** A small color key: swatch token name and what it means. */
  legend?: { token: "accent" | "pencil" | "ink" | "muted"; label: string }[];
}

export const SIMS = {
  lbm: {
    caption:
      "A D2Q9 lattice Boltzmann solver running in your browser: flow past a cylinder, colored by vorticity, with tracer particles carried by the flow. It shows the method; it isn't the project's code or results.",
    canvasLabel: "Live lattice Boltzmann simulation of flow past a movable cylinder, colored by vorticity.",
    hint: "Drag the cylinder to move it through the flow.",
    controls: [
      { type: "range", name: "tau", label: "Relaxation time τ", min: 0.52, max: 0.8, step: 0.01, value: 0.54 },
      { type: "toggle", name: "tracers", label: "Tracers", value: 1 },
    ],
    legend: [
      { token: "accent", label: "Spins counter-clockwise" },
      { token: "pencil", label: "Spins clockwise" },
    ],
  },
  nbody: {
    caption:
      "Two rotating discs merging, simulated in your browser with direct summation or a Barnes-Hut quadtree. The readout counts the interactions each method evaluates per step. It shows the method; it isn't the project's code or results.",
    canvasLabel: "Live N-body simulation of colliding discs of particles.",
    hint: "Click to drop a new clump of mass.",
    controls: [
      {
        type: "choice", name: "mode", label: "Forces", value: 1,
        options: [{ value: 0, label: "Direct summation" }, { value: 1, label: "Barnes-Hut" }],
      },
      { type: "range", name: "theta", label: "Opening angle θ", min: 0.3, max: 1.2, step: 0.05, value: 0.7 },
      { type: "toggle", name: "trails", label: "Trails", value: 1 },
    ],
  },
  fermi: {
    caption:
      "Metropolis Monte Carlo over 24 fermions on 48 levels, running in your browser. Arcs on the ladder are accepted moves; the bars are the sampled occupancy, the red curve is Fermi-Dirac. It shows the method; it isn't the project's code or results.",
    canvasLabel: "Live Monte Carlo sampling of fermion occupancy against the Fermi-Dirac curve.",
    controls: [
      { type: "range", name: "T", label: "Temperature", min: 0.3, max: 8, step: 0.1, value: 2, unit: "level spacings" },
    ],
    legend: [
      { token: "accent", label: "Sampled occupancy" },
      { token: "pencil", label: "Fermi-Dirac" },
    ],
  },
  surrogate: {
    caption:
      "Surrogate-based optimization of a toy lift-to-drag curve over flap angle: a Gaussian process fitted to the runs so far, and expected improvement choosing the next one. Press play to let it spend the budget. It shows the method; the curve is made up and isn't the project's data.",
    canvasLabel: "Interactive Gaussian-process optimization of lift-to-drag against flap angle.",
    hint: "Click the plot to choose the next run yourself.",
    autoplay: false,
    controls: [
      { type: "button", name: "run", label: "Run CFD", key: "C" },
      { type: "range", name: "budget", label: "Budget", min: 5, max: 20, step: 1, value: 10, unit: "runs" },
    ],
    legend: [
      { token: "ink", label: "Surrogate mean" },
      { token: "accent", label: "Uncertainty (±2σ)" },
      { token: "pencil", label: "Expected improvement" },
    ],
  },
  fluid: {
    caption:
      "A 2D incompressible Navier-Stokes solver (stable fluids) running in your browser, with smoke lines in the oncoming flow. The project's solver was 3D and written in NumPy; this shows the method, not its code or results.",
    canvasLabel: "Interactive 2D fluid simulation of flow and smoke around a wing section.",
    hint: "Drag across the flow to paint smoke and push it.",
    controls: [
      { type: "range", name: "aoa", label: "Angle of attack", min: -5, max: 18, step: 1, value: 8, unit: "°" },
    ],
  },
  beads: {
    caption:
      "Beads under plane-wave illumination, with the single-scattering interference pattern they make and the near-neighbor couplings a graph network works on. The project's GNN predicted the full multiple-scattering coupling; this isn't its code or results.",
    canvasLabel: "Interactive scattering pattern of draggable beads joined as a graph.",
    hint: "Drag the beads.",
    controls: [
      { type: "range", name: "lambda", label: "Wavelength", min: 0.5, max: 2, step: 0.05, value: 1 },
    ],
    legend: [
      { token: "accent", label: "Bright fringe" },
      { token: "pencil", label: "Strong coupling" },
    ],
  },
} satisfies Record<string, SimConfig>;

export type SimKind = keyof typeof SIMS;
