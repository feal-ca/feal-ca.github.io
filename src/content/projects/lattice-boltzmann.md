---
title: "Parallel lattice Boltzmann solver"
summary: "A D2Q9 lattice Boltzmann solver in about 200 lines of C++, parallelized with OpenMP and pushed to the memory-bandwidth ceiling on MareNostrum 5."
year: 2025
categories: ["HPC", "CFD"]
tier: "standard"
figure: "lattice-boltzmann"
figureAlt: "The D2Q9 stencil: a lattice node with eight arrows to its neighbors (four along the axes, four diagonal), repeated faintly across a regular grid."
stack: ["C++", "OpenMP", "MareNostrum 5"]
order: 6
---

Lattice Boltzmann comes at fluid flow from the opposite end to a
Navier-Stokes solver. Rather than discretizing the macroscopic equations, it
tracks particle distribution functions hopping between neighboring lattice
sites and colliding, and the familiar continuum behavior emerges from that.

This is a **D2Q9** implementation (two dimensions, nine discrete velocities
per node) with a BGK collision operator, bounce-back walls, a Zou-He inlet
and a zero-gradient outlet: flow past a cylinder on a 400×400 lattice, in
around 200 lines of C++. The relaxation time sets the viscosity and so the
Reynolds number, and you can watch the regime change by turning that one
knob. At τ = 0.75 the wake is steady and laminar (Re ≈ 96). Drop it to
τ = 0.55 (Re ≈ 480) and the vortex street appears.

The performance side turned out to be the interesting half. Streaming and
collision are local operations on a regular grid with no global pressure
solve to synchronize around, so the method looks embarrassingly parallel.
But it's memory-bound, and how you move the data dominates everything else.
Switching from push streaming (scatter) to pull streaming (gather) took the
single-threaded run from **113 s to 31.7 s**, a 3.6× win from nothing but the
access pattern. On a 112-core Xeon Platinum 8480+ node of MareNostrum 5 it
reached **24.6× at 32 threads** and then flattened out around 64, where
memory bandwidth saturates and more cores stop buying anything at all.

I wrote the whole thing up for Towards Data Science as *The Fluid Simulator
That Doesn't Solve the Fluid Equations*.
