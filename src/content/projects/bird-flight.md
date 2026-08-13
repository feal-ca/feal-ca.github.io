---
title: "Fixed-wing bird flight simulation"
summary: "A 3D Navier-Stokes solver written from scratch in Python, run on a wing modeled from a reference in Blender and checked against OpenFOAM's icoFoam."
year: 2025
categories: ["CFD", "Python"]
tier: "standard"
figure: "bird-flight"
figureAlt: "Streamlines passing over and under a cambered airfoil section at a small angle of attack, compressing above the wing and spreading below it."
stack: ["Python", "NumPy", "OpenFOAM", "Blender"]
featured: true
order: 5
# TODO(ferran): add the quantitative agreement with icoFoam (which fields,
# which norm, how close) and the mesh resolution.
---

Writing a Navier-Stokes solver yourself is the fastest way to stop treating
CFD as a black box. Discretization, the pressure-velocity coupling, boundary
conditions, the stability limit on the timestep: none of it hides behind a
solver flag once you've implemented all of it in NumPy.

The geometry is a bird's wing. I modeled it from a reference in Blender
instead of flattening it into a textbook airfoil, which makes for a harder
and more honest test than a cylinder. Real camber, real taper, and no
analytic answer waiting at the end to check yourself against. So I ran the
same case through **icoFoam**, OpenFOAM's incompressible laminar solver, and
compared.

That implementation is the subject of my first Towards Data Science article,
*Building a Navier-Stokes Solver in Python from Scratch*.
