---
title: "Predicting fetal distress from cardiotocography"
summary: "A multimodal model combining cardiotocography traces, clinical context and ultrasound to predict fetal distress and the likely delivery pathway. Built with Hospital Sant Joan de Déu; around 0.78 AUC."
year: 2025
categories: ["Machine learning", "Healthcare"]
tier: "flagship"
figure: "assisted-birth"
figureAlt: "Schematic cardiotocography traces: a variable fetal heart rate line above a smoother uterine contraction curve, with two dips highlighted as decelerations."
team: "Team of nine"
stack: ["Python", "PyTorch"]
featured: true
order: 3
---

We were a team of nine, working with **Hospital Sant Joan de Déu** in
Barcelona. The model predicts whether the fetus is in distress and which
delivery pathway is likely, and reached around **0.78 AUC**.

Cardiotocography (CTG) records the fetal heart rate and uterine contractions
during labor. Clinicians read the two together: a deceleration that follows a
contraction means something different from one that doesn't. Interpretation
is subjective, and readers often disagree.

The model takes three kinds of input: CTG time series, tabular clinical
context, and ultrasound images, each with its own encoder.

The hardest part was the label. What gets measured is the fetus's pH after
delivery, and between the CTG trace and that number are all the decisions the
clinical team made, including whether to do a cesarean. A birth that went
well because someone intervened early can look, in the label, like a birth
that was never at risk. We spent longer deciding what to predict than
building the model.

This was academic work on retrospective data. It isn't a clinical tool and
wasn't validated for clinical use.
