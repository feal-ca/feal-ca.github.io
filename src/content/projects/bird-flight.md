---
title: "Fixed-wing bird flight simulation"
summary: "A 3D Navier-Stokes solver written from scratch in Python, validated against OpenFOAM's icoFoam on a custom-modelled wing geometry."
year: 2025
categories: ["CFD", "Python"]
tier: "standard"
figure: "bird-flight"
figureAlt: "Streamlines passing over and under a cambered aerofoil section at a small angle of attack, compressing above the wing and spreading below it."
stack: ["Python", "NumPy", "OpenFOAM", "Blender"]
featured: true
order: 5
---

Writing a Navier-Stokes solver yourself is the fastest way to stop treating
CFD as a black box. Discretisation, the pressure-velocity coupling, boundary
conditions, the stability limits on the timestep — none of it is hidden
behind a solver flag when you have implemented all of it in NumPy.

The geometry is a bird's wing, modelled rather than idealised, which makes it
a more honest test than a textbook cylinder. To check the result meant
something, I ran the same case through **icoFoam**, OpenFOAM's incompressible
laminar solver, and compared the two.

The whole implementation is the subject of my first Towards Data Science
article, *Building a Navier-Stokes Solver in Python from Scratch*, which
walks through it step by step.
