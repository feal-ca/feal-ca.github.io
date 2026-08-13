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

The target is the Kármán vortex street, the alternating wake that forms
behind a bluff body above a critical Reynolds number. It makes a hard test
for a neural network. The wake is unsteady and periodic, so a model that has
only learned to smooth its training data gives itself away at a glance: it
settles into a symmetric steady wake, and the shedding never starts.

A physics-informed network has some defense against that. The governing
equations sit inside its loss function, so the residual of Navier-Stokes is
penalized alongside the mismatch against training samples, and the physics
holds the solution in place where the data runs thin. This one reproduced the
shedding.

Ground truth came from a high-fidelity **OpenFOAM** simulation of the same
case. Any quantitative comparison gets measured against that run.
