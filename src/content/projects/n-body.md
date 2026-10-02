---
title: "Parallel N-body simulation"
summary: "A direct O(n²) N-body solver and a Barnes-Hut O(n log n) tree code, both written in C++ with OpenMP and benchmarked against each other up to 112 threads."
year: 2025
categories: ["HPC", "C++"]
tier: "standard"
figure: "n-body"
sim: "nbody"
figureAlt: "A particle cloud with three dense clusters, overlaid with an adaptive quadtree that subdivides finely where particles are concentrated and stays coarse in the empty regions."
team: "Pair project"
stack: ["C++", "OpenMP"]
featured: true
order: 4
---

A project I built with a classmate at UPC. The point was to compare two
algorithms: brute force on many cores against a cheaper algorithm. We
parallelized both.

Direct summation computes every pairwise interaction. It's O(n²) and
parallelizes easily: at N = 10,000 it ran about **33× faster on 112 threads
than on one**. Barnes-Hut builds a quadtree over the particles and
approximates distant clusters by their center of mass, which brings the cost
down to O(n log n). It never got past about **7×**, however many threads it
had, and had mostly stopped improving by 32.

The tree code does less work but scales worse. Its traversal is irregular,
its memory access is scattered, and there's less independent work to split
between threads. Which one is faster depends on the number of particles and
cores.

Both were benchmarked on the same node, for N from 100 to 100,000, with two
initial conditions: two colliding blobs and a rotating galaxy.
