---
title: "Fixed-wing bird flight simulation"
summary: "A 3D Navier-Stokes solver written from scratch in Python, run on a wing modeled from a reference in Blender and checked against OpenFOAM's icoFoam."
year: 2025
categories: ["CFD", "Python"]
tier: "standard"
figure: "bird-flight"
sim: "fluid"
figureAlt: "Streamlines passing over and under a cambered airfoil section at a small angle of attack, compressing above the wing and spreading below it."
stack: ["Python", "NumPy", "OpenFOAM", "Blender"]
featured: true
order: 5
# TODO(ferran): add the quantitative agreement with icoFoam (which fields,
# which norm, how close) and the mesh resolution.
---

A 3D Navier-Stokes solver, written from scratch in NumPy. It handles
discretization, pressure-velocity coupling, boundary conditions and the
stability limit on the timestep.

The geometry is a bird's wing, which I modeled in Blender from a reference
instead of using a standard airfoil. It has real camber and taper. There's
no analytic solution to check against, so I ran the same case in **icoFoam**,
OpenFOAM's incompressible laminar solver, and compared the two.

The solver is the subject of my first Towards Data Science article, *Building
a Navier-Stokes Solver in Python from Scratch*.
