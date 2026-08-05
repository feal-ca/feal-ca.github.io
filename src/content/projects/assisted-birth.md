---
title: "Predicting fetal distress from cardiotocography"
summary: "A model combining cardiotocography traces, clinical context and ultrasound imaging to predict fetal distress and the likely delivery pathway."
year: 2025
categories: ["Machine learning", "Healthcare"]
tier: "flagship"
figure: "assisted-birth"
figureAlt: "Schematic cardiotocography traces: a variable fetal heart rate line above a smoother uterine contraction curve, with two dips highlighted as decelerations."
stack: ["Python", "PyTorch"]
featured: true
order: 3
---

Cardiotocography records two signals at once during labour: the fetal heart
rate and uterine contractions. Reading them together is how clinicians spot
distress — a deceleration that follows a contraction means something
different from one that does not — but interpretation is famously subjective,
and disagreement between readers is well documented.

This project treats it as a multimodal problem. The heart-rate and
contraction traces are time series; the clinical context is tabular; the
ultrasound is imaging. Each needs a different encoder, and the useful signal
often lies in how they line up rather than in any one of them alone.

Two things were predicted: whether the fetus is in distress, and which
delivery pathway is likely.

A caveat worth stating plainly: this was academic work on retrospective data,
not a clinical tool, and nothing here was validated for use on a real ward.
