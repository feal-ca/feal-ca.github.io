---
title: "A PINN for blood flow through a narrowed artery"
summary: "A physics-informed network that reconstructs the flow, the pressure and the wall shear stress in a stenosed artery from 40 noisy velocity readings, and recovers the fluid's unknown viscosity."
year: 2026
tier: "flagship"
figure: "pinn-stenosis"
figureAlt: "A channel whose lower wall has a smooth bump closing half the opening. Streamlines squeeze over the bump and spread out behind it, where two closed loops mark a region of reversed flow. Forty small hollow circles, the sensors, sit in four groups along the channel."
stack: ["Python", "PyTorch"]
links:
  - label: "Code"
    url: "https://github.com/feal-ca/PINN"
featured: true
order: 2
---

From 40 velocity readings with 7% noise, the network reconstructs the
velocity and pressure fields in a 2D artery with a 50% stenosis, including
the region of reversed flow behind the narrowing. Its wall shear stress
follows the CFD reference. The viscosity was treated as unknown and learned
along with the weights: runs with 40 or more sensors ended between 1% and 8%
off. With 20 sensors it settled on the wrong value every time, a quarter to a
half off, while the loss curves looked fine.

Wall shear stress is tied to where plaque builds up and is hard to measure
directly. A clinic can get velocities at a few points, with Doppler
ultrasound for example. That is the setting the sensors stand in for.

The PINN is written in plain PyTorch, with no PINN library. The reference
data comes from my own Navier-Stokes solver, a projection method on a
staggered grid, at a Reynolds number of 200. The flow is steady and 2D, the
walls are rigid, and it's one geometry.
