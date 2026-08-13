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
distress. A deceleration that follows a contraction means something different
from one that doesn't. But interpretation is famously subjective, and
disagreement between readers is well documented.

We built this with **Hospital Sant Joan de Déu** in Barcelona, as a team of
nine. The traces are time series, the clinical context is tabular, the
ultrasound is imaging, and each needs its own encoder. The model predicted
whether the fetus was in distress and which delivery pathway was likely, and
reached around **0.78 AUC**.

The hard part wasn't the architecture. It was that the label sits a long way
from the signal. What gets measured is the fetus's pH after delivery, and
between the CTG trace and that number sits every decision the clinical team
made, including whether to go to cesarean. A birth that went well *because*
someone intervened early looks, in the label, much like a birth that was
never in trouble. Deciding what the model was being trained to predict took
longer than building it.

This was academic work on retrospective data, not a clinical tool. None of it
was validated for use on a ward.
