---
title: "Parallel N-body simulation"
summary: "A direct O(n²) N-body solver and a Barnes-Hut O(n log n) tree code, both written in C++ with OpenMP and benchmarked against each other out to 112 threads."
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

Direct summation computes every pairwise interaction. It's O(n²), it's
embarrassingly parallel, and it behaves exactly as you'd hope: at
N = 10,000 it ran about **33× faster on 112 threads than on one**.
Barnes-Hut instead builds a quadtree over the particles and approximates
distant clusters by their center of mass, which brings the cost down to
O(n log n). But it never got past roughly **7×**, however many threads it was
given, and had largely stopped improving by 32.

That gap is the actual result, and it cuts against the instinct that the
better algorithm is the better answer. The tree code wins on asymptotics and
loses on hardware: the traversal is irregular, the memory access pattern is
scattered, and there is far less independent work to hand out. Which one you
want depends on how many particles you have and how many cores you can throw
at them, and the crossover is not where the complexity classes suggest.

Both solvers were benchmarked on the same node, over N from 100 to 100,000,
on two initial conditions: a pair of colliding blobs and a rotating galaxy.
