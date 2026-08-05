---
title: "A physics-informed network for vortex shedding"
summary: "A PINN trained to reproduce Kármán vortex shedding, with the Navier-Stokes residual in the loss and a high-fidelity OpenFOAM run as ground truth."
year: 2026
categories: ["Machine learning", "Physics"]
tier: "flagship"
figure: "vortex-pinn"
figureAlt: "Streamlines flowing past a solid circular obstacle and breaking into the alternating meanders of a Kármán vortex street downstream."
stack: ["Python", "PyTorch", "OpenFOAM"]
featured: true
order: 2
---

A physics-informed neural network does not just fit data — it carries the
governing equations in its loss function, so the residual of Navier-Stokes is
penalised alongside the mismatch against training samples. The appeal is that
the physics constrains the solution where data is sparse.

The test case here is the Kármán vortex street: the alternating wake that
forms behind a bluff body above a critical Reynolds number. It is a good
benchmark precisely because it is unsteady and periodic, so a network that
has only learned to smooth its training data fails visibly.

Ground truth came from a high-fidelity **OpenFOAM** simulation, which also
gave a reference for how far the network's prediction drifts from the
solver's.

The write-up *The Fluid Simulator That Doesn't Solve the Fluid Equations*
covers the idea behind this.
