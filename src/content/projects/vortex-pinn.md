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
# TODO(ferran): add the quantitative result: Reynolds number, and how far the
# prediction drifts from the OpenFOAM run (Strouhal number, or an L2 error on
# the velocity field). The page currently claims only that the shedding was
# reproduced, which is all that is verified.
---

A physics-informed neural network doesn't only fit data. It carries the
governing equations in its loss function, so the residual of Navier-Stokes
gets penalized alongside the mismatch against training samples. The appeal is
that the physics constrains the solution in the places where data is thin.

The test case is the Kármán vortex street: the alternating wake that forms
behind a bluff body above a critical Reynolds number. It's a demanding
benchmark precisely because it's unsteady and periodic. A network that has
only learned to smooth its training data fails in a way you can see: it
settles into a steady, symmetric wake and the shedding never appears. This
one reproduced the shedding.

Ground truth came from a high-fidelity **OpenFOAM** simulation of the same
case, which is also what any quantitative comparison gets measured against.
