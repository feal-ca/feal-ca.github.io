---
title: "Predicting fetal distress from cardiotocography"
summary: "A multimodal model combining cardiotocography traces, clinical context and ultrasound to predict fetal distress and the likely delivery pathway. Built with Hospital Sant Joan de Déu; around 0.78 AUC."
year: 2025
categories: ["Machine learning", "Healthcare"]
tier: "flagship"
figure: "assisted-birth"
figureAlt: "Schematic cardiotocography traces: a variable fetal heart rate line above a smoother uterine contraction curve, with two dips highlighted as decelerations."
stack: ["Python", "PyTorch"]
featured: true
order: 3
---

Cardiotocography records two signals at once during labor: the fetal heart
rate and uterine contractions. Reading them together is how clinicians spot
distress — a deceleration that follows a contraction means something
different from one that doesn't — but interpretation is famously subjective,
and disagreement between readers is well documented.

We built this with **Hospital Sant Joan de Déu** in Barcelona, as a team of
nine. It's a genuinely multimodal problem: the heart-rate and contraction
traces are time series, the clinical context is tabular, and the ultrasound
is imaging, so each needs its own encoder. The model predicted whether the
fetus was in distress and which delivery pathway was likely, and reached
around **0.78 AUC**.

The hard part wasn't the architecture. It was that the label sits a long way
from the signal. What gets measured is the fetus's pH after delivery — but
between the CTG trace and that number sits every decision the clinical team
made, including whether to go to cesarean. A birth that went well *because*
someone intervened early looks, in the label, much like a birth that was
never in trouble at all. Working out what the model was actually being
trained to predict was most of the work.

Worth saying plainly: this was academic work on retrospective data, not a
clinical tool, and none of it was validated for use on a ward.
