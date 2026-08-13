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

Is it better to throw more cores at a brute-force algorithm, or to use a
smarter one? The N-body problem is where that question usually gets asked, so
I wrote both and measured.

Direct summation computes every pairwise interaction. It's O(n²), it's
embarrassingly parallel, and it behaves the way you'd hope: at N = 10,000 it
ran about **33× faster on 112 threads than on one**. Barnes-Hut builds a
quadtree over the particles and approximates distant clusters by their center
of mass, dropping the cost to O(n log n). It never got past roughly **7×**,
however many threads it was given, and had largely stopped improving by 32.

That gap cuts against the instinct that the better algorithm is the better
answer. The tree code wins on asymptotics and loses on hardware. Its
traversal is irregular, its memory access is scattered, and there is far less
independent work to hand out. Which solver you want depends on how many
particles you have and how many cores you can point at them, and the
crossover is not where the complexity classes suggest it should be.

Both were benchmarked on the same node, over N from 100 to 100,000, on two
initial conditions: a pair of colliding blobs and a rotating galaxy.
