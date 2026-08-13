---
title: "Aerodynamic optimization of a Formula 1 front wing"
summary: "A surrogate model that searched front-wing geometries without paying for a CFD run at every step, on the MareNostrum V supercomputer. The final design came out about 15% better on lift-to-drag."
year: 2026
categories: ["Machine learning", "HPC"]
tier: "flagship"
figure: "f1-frontwing"
figureAlt: "Schematic response surface: nested contour bands around a global optimum and a smaller secondary peak, overlaid with sampled design points that cluster near the best region."
stack: ["Python", "OpenFOAM", "SLURM", "MareNostrum V"]
featured: true
order: 1
---

The wing we ended up with was roughly **15% better on lift-to-drag** than the
baseline we started from. Getting there on a budget was the harder problem.

Optimizing a wing directly against a CFD solver isn't practical, because
every candidate geometry costs a full simulation and a real search wants
thousands of them. So we fixed the budget up front, at something on the order
of tens to low hundreds of solver runs, and spent it carefully. Fit a
surrogate to the results. Search the surrogate for promising geometries.
Spend real runs on whatever it points at, refit, repeat. The expensive solver
only gets called where the cheap model is uncertain or optimistic.

The campaign ran on **MareNostrum V**, which made the project as much about
scheduling and throughput as about aerodynamics. Pushing a few hundred
independent solver runs through a shared cluster efficiently is its own
problem, and knowing about wings does not help you solve it.

I wrote up the supercomputing half for Towards Data Science, in *What It
Actually Takes to Run Code on a 200M€ Supercomputer*.
