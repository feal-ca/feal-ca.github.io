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

The target is the Kármán vortex street, the alternating wake behind a bluff
body above a critical Reynolds number. It's a hard case for a neural network
because the wake is unsteady and periodic. A model fit only to data tends to
settle into a symmetric steady wake, and the shedding never starts.

A physics-informed neural network (PINN) includes the governing equations in
its loss: the Navier-Stokes residual is penalized along with the error
against training samples, which constrains the solution where the data is
sparse. This one reproduced the shedding.

The ground truth was a high-fidelity **OpenFOAM** simulation of the same
case.
