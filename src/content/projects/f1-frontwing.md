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

Optimizing a wing directly against a CFD solver isn't practical. Every
candidate geometry costs a full simulation, and a real search wants thousands
of them.

So we spent a fixed budget instead, on the order of tens to low hundreds of
solver runs in total. Fit a surrogate model to the results, search the
surrogate for promising geometries, spend real runs on whatever it points at,
refit, repeat. The expensive solver only gets called where the cheap model is
either uncertain or optimistic. The final geometry came out roughly **15%
better on lift-to-drag** than the baseline we started from.

The campaign ran on **MareNostrum V**, which made the project as much about
scheduling and throughput as about aerodynamics. Getting a few hundred
independent solver runs through a shared cluster efficiently is its own
problem, and not one that knowing anything about wings helps you solve.

I wrote about the supercomputing half of this in more detail for Towards
Data Science, in *What It Actually Takes to Run Code on a 200M€
Supercomputer*.
