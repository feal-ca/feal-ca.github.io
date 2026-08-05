---
title: "Parallel lattice Boltzmann solver"
summary: "A D2Q9 lattice Boltzmann solver built and benchmarked from scratch in C++ with OpenMP."
year: 2025
categories: ["HPC", "CFD"]
tier: "standard"
figure: "lattice-boltzmann"
figureAlt: "The D2Q9 stencil: a lattice node with eight arrows to its neighbours — four along the axes, four diagonal — repeated faintly across a regular grid."
stack: ["C++", "OpenMP"]
order: 6
---

Lattice Boltzmann approaches fluid flow from the opposite end to a
Navier-Stokes solver. Rather than discretising the macroscopic equations, it
tracks particle distribution functions hopping between neighbouring lattice
sites and colliding, and the familiar continuum behaviour emerges from that.

The practical consequence is that it parallelises beautifully. Streaming and
collision are local operations on a regular grid, with no global pressure
solve to synchronise around — which makes it a natural fit for shared-memory
parallelism.

This is a **D2Q9** implementation: two dimensions, nine discrete velocities
per node, written in C++ and parallelised with OpenMP, then benchmarked to
see how close to the memory-bandwidth ceiling it actually gets.
