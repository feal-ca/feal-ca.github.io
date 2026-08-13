---
title: "Fermi-Dirac statistics by Monte Carlo"
summary: "Deriving the Fermi-Dirac distribution numerically with a Markov chain Monte Carlo simulation, rather than analytically."
year: 2024
categories: ["Physics", "Monte Carlo"]
tier: "standard"
figure: "fermi-dirac"
figureAlt: "Fermi-Dirac occupancy curves at four temperatures, sharpening towards a step function as temperature falls, with Monte Carlo samples scattered around the warmest curve."
stack: ["Python", "NumPy"]
order: 8
---

The Fermi-Dirac distribution is normally derived on paper, from the grand
canonical ensemble. This gets to it the other way around: set up a system of
fermions, let a Markov chain wander through its microstates subject to the
exclusion principle, and measure the occupancy that comes out.

A free-choice project on quantum statistics, and a small one. What makes it
worth doing is that the answer is recognizable on sight. As temperature drops
the sampled occupancy sharpens toward a step at the Fermi level; raise it and
the step smears out. The sampled curves matched the analytic ones across the
temperature range. Watching that shape emerge from sampling rather than from
algebra makes the statistical mechanics feel less like bookkeeping.
