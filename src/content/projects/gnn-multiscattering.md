---
title: "A graph network for multiple scattering in microscopy"
summary: "A GNN surrogate that computes the bead-bead coupling in Köhler-illuminated microscope images in real time. A side project at TU Dresden, on top of the main internship work."
year: 2026
categories: ["Machine learning", "Optics"]
tier: "standard"
figure: "gnn-multiscattering"
figureAlt: "Beads scattered across a field of view under parallel illumination lines from above, each bead joined to its nearest neighbors by lines whose weight falls off with distance."
# TODO(ferran): stack is empty because the CV doesn't name the tools. Add them.
stack: []
order: 3.5
---

<!-- TODO(ferran): add a result (accuracy against the full solver, speedup,
     bead counts) once you're happy to publish one. -->

I built this at TU Dresden in the summer of 2026, alongside the main
internship work with the Physics of Life group on simulating microscope
optics.

With several beads in the field of a Köhler-illuminated microscope, light
scattered by one bead reaches its neighbors and scatters again. So each
bead's image depends on where the others sit. The model is a graph neural
network. Beads are nodes, their couplings are edges, and it predicts that
bead-bead coupling fast enough to run in real time.
