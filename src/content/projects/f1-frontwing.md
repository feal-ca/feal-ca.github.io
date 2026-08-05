---
title: "Aerodynamic optimisation of a Formula 1 front wing"
summary: "A surrogate model that searches front-wing geometries without paying for a CFD run at every step, on the MareNostrum V supercomputer."
year: 2026
categories: ["Machine learning", "HPC"]
tier: "flagship"
figure: "f1-frontwing"
figureAlt: "Schematic response surface: nested contour bands around a global optimum and a smaller secondary peak, overlaid with sampled design points that cluster near the best region."
stack: ["Python", "OpenFOAM", "SLURM", "MareNostrum V"]
featured: true
order: 1
---

Optimising a wing directly against a CFD solver is not practical: each
candidate geometry costs a full simulation, and the search needs thousands of
them. The way around it is to spend a fixed budget of real simulations on a
spread of designs, fit a surrogate model to those results, and let the
optimiser search the surrogate instead — going back to the solver only where
the model is uncertain or promising.

That is what this project does for a Formula 1 front wing. The simulation
campaign ran on **MareNostrum V**, which meant the work was as much about
job scheduling, queueing and parallel throughput as it was about
aerodynamics — getting a few hundred independent solver runs through a shared
cluster efficiently is its own problem.

I wrote about the supercomputing half of this in more detail for Towards
Data Science, in *What It Actually Takes to Run Code on a 200M€
Supercomputer*.
