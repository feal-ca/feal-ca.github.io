---
title: "Aerodynamic optimization of a Formula 1 front wing"
summary: "A surrogate model that searched front-wing geometries without running CFD at every step, on the MareNostrum V supercomputer. The final design was about 15% better on lift-to-drag."
year: 2026
categories: ["Machine learning", "HPC"]
tier: "flagship"
figure: "f1-frontwing"
sim: "surrogate"
figureAlt: "Schematic response surface: nested contour bands around a global optimum and a smaller secondary peak, overlaid with sampled design points that cluster near the best region."
team: "Group project"
stack: ["Python", "OpenFOAM", "SLURM", "MareNostrum V"]
featured: true
order: 1
---

A group project with classmates at UPC. The final wing was about **15%
better on lift-to-drag** than the baseline.

Running CFD on every candidate geometry would have been too expensive, so we
fixed a budget of solver runs up front, on the order of tens to low hundreds.
We fit a surrogate model to the results, searched the surrogate for promising
geometries, ran CFD on those, refit, and repeated. The solver only ran where
the surrogate was uncertain or optimistic.

The runs were on **MareNostrum V**, so a large part of the work was
scheduling: getting a few hundred independent solver jobs through a shared
cluster efficiently.

I wrote about the supercomputing side for Towards Data Science, in *What It
Actually Takes to Run Code on a 200M€ Supercomputer*.
