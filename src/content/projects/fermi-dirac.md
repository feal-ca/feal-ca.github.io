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
canonical ensemble. This project gets to it the other way round: set up a
system of fermions, let a Markov chain wander through its microstates
subject to the exclusion principle, and measure the occupancy that comes out.

It is a small project with a good payoff, because the shape of the answer is
so recognisable. As temperature drops the sampled occupancy sharpens towards
a step at the Fermi level; raise it and the step smears out. Seeing that
emerge from sampling — rather than from an algebraic derivation — makes the
statistical mechanics feel considerably less like bookkeeping.
