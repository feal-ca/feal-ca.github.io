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

The Fermi-Dirac distribution is usually derived analytically from the grand
canonical ensemble. Here it comes out of a simulation instead: a system of
fermions, a Markov chain that moves through its microstates while respecting
the exclusion principle, and a measurement of the resulting occupancy.

It was a small free-choice project on quantum statistics. As the temperature
drops, the sampled occupancy sharpens toward a step at the Fermi level, and
as it rises the step smooths out. The sampled curves matched the analytic
ones across the temperature range.
