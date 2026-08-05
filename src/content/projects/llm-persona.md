---
title: "How do you actually give a language model a persona?"
summary: "A methodological comparison of instruction-tuning, fine-tuning and RL-based approaches to adapting an LLM's persona."
year: 2026
categories: ["Machine learning", "LLMs"]
tier: "standard"
figure: "llm-persona"
figureAlt: "Three routes leaving a single base model on the left: a short one with few update steps, a medium one, and a long one with many small steps, each ending in its own adapted model."
stack: ["Python", "PyTorch", "Transformers"]
order: 7
---

"Give the model a persona" covers at least three quite different
interventions, and they are rarely compared on equal terms. You can put the
persona in the prompt or the instruction data; you can fine-tune the weights
on in-character text; or you can shape it with a reward signal.

They differ in how much they cost, how deep the change goes, and how well
the persona survives contact with an adversarial user. A prompt is free and
reversible, and also the easiest thing in the world to talk a model out of. A
fine-tune is stickier and more expensive. RL sits somewhere else again.

This project compares the three methodologically rather than picking a
winner, since which one is right depends entirely on what the persona is for.

The lighter, more entertaining version of this is the Towards Data Science
piece *What's the Best Way to Brainwash an LLM?*
