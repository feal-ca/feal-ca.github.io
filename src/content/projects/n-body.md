---
title: "Parallel N-body simulation"
summary: "A direct O(n²) N-body solver in C++ parallelised with OpenMP, benchmarked against a serial Barnes-Hut O(n log n) implementation."
year: 2025
categories: ["HPC", "C++"]
tier: "standard"
figure: "n-body"
figureAlt: "A particle cloud with three dense clusters, overlaid with an adaptive quadtree that subdivides finely where particles are concentrated and stays coarse in the empty regions."
stack: ["C++", "OpenMP"]
featured: true
order: 4
---

The N-body problem is the standard setting for a question that comes up
constantly in scientific computing: is it better to throw more cores at a
brute-force algorithm, or to use a smarter one?

The direct solve computes every pairwise interaction — O(n²), trivially
parallel, and it scales almost linearly with core count. Barnes-Hut instead
builds a quadtree over the particles and approximates distant clusters by
their centre of mass, which brings the cost down to O(n log n) but is far
harder to parallelise well and introduces an accuracy parameter.

I implemented both and benchmarked the parallel direct solver against the
serial tree code, which makes the crossover explicit: below some particle
count the parallel brute force wins outright, and above it no reasonable
number of cores rescues the asymptotics.
