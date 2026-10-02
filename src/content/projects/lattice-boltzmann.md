---
title: "Parallel lattice Boltzmann solver"
summary: "A D2Q9 lattice Boltzmann solver in about 200 lines of C++, parallelized with OpenMP and benchmarked on MareNostrum 5 until memory bandwidth ran out."
year: 2025
categories: ["HPC", "CFD"]
tier: "standard"
figure: "lattice-boltzmann"
sim: "lbm"
figureAlt: "The D2Q9 stencil: a lattice node with eight arrows to its neighbors (four along the axes, four diagonal), repeated faintly across a regular grid."
team: "Pair project"
stack: ["C++", "OpenMP", "MareNostrum 5"]
order: 6
---

A project I built with a classmate at UPC.

Lattice Boltzmann simulates fluid flow without solving the Navier-Stokes
equations directly. It tracks particle distribution functions that stream
between neighboring lattice sites and collide, and the continuum flow emerges
from that.

Ours is a **D2Q9** solver (two dimensions, nine discrete velocities per node)
with a BGK collision operator, bounce-back walls, a Zou-He inlet and a
zero-gradient outlet. It simulates flow past a cylinder on a 400×400 lattice
in about 200 lines of C++. The relaxation time sets the viscosity, and with
it the Reynolds number. At τ = 0.75 the wake is steady, Re ≈ 96. At
τ = 0.55, Re ≈ 480, a vortex street forms.

Streaming and collision are local operations with no global pressure solve,
so the method should parallelize well. In practice it's memory-bound.
Switching from push streaming (scatter) to pull streaming (gather) cut the
single-threaded run from **113 s to 31.7 s**, 3.6× faster from the memory
access pattern alone. On a 112-core Xeon Platinum 8480+ node of MareNostrum 5
it reached 24.6× at 32 threads and stopped improving around 64, where memory
bandwidth saturates.

I wrote it up for Towards Data Science as *The Fluid Simulator That Doesn't
Solve the Fluid Equations*.
