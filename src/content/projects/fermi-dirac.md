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

It was a free-choice project on quantum statistics, and a small one, but the
payoff is that the answer is instantly recognizable. As temperature drops the
sampled occupancy sharpens toward a step at the Fermi level; raise it and the
step smears out. The sampled curves matched the analytic ones across the
temperature range — no surprises, which is the correct outcome when you're
reproducing a known result by a different route.

Seeing that shape emerge from sampling rather than from algebra makes the
statistical mechanics feel considerably less like bookkeeping.
