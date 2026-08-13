---
title: "How do you actually give a language model a persona?"
summary: "A controlled comparison of four ways to give Qwen3-4B a persona — a system prompt, and three different formats of fine-tuning data. What you train on matters more than how much."
year: 2026
categories: ["Machine learning", "LLMs"]
tier: "standard"
figure: "llm-persona"
figureAlt: "Three routes leaving a single base model on the left: a short one with few update steps, a medium one, and a long one with many small steps, each ending in its own adapted model."
stack: ["Python", "PyTorch", "Transformers", "LoRA"]
order: 7
---

"Give the model a persona" covers several quite different interventions, and
they're rarely compared on equal terms. The cheapest is a system prompt —
free, reversible, and the easiest thing in the world to talk a model out of.
Past that you're fine-tuning, and the interesting question stops being *how
much* you train and becomes *what you train on*.

This compares a system-prompt baseline against three formats of training
data, all on the same base model — **Qwen3-4B-Instruct**, adapted with LoRA
(r=16, α=32) over the attention and MLP projections — so the differences are
attributable to the data rather than the setup:

- **Demonstrations** — chat examples of the persona replying in character.
- **First-person statements** — the persona describing itself from the inside.
- **Synthetic document fine-tuning** — encyclopedia-style third-person text
  written *about* the persona.

First-person statements encoded the persona most deeply. A model that has
read "I am C-3PO and I find this plan deeply unwise" sounds like C-3PO in
more situations than one that has only seen C-3PO-style chat replies —
demonstrations teach the shapes they show, while first-person text seems to
generalize past them. The synthetic documents were the strongest on *facts
about* the character, which turns out to be a different capability from being
it.

Measured on a set of C-3PO traits, the first-person model reached 97% on
verbosity, 93% on quoting odds, 90% on anxiety and 77% on protocol etiquette.

The full version — considerably more entertaining, and with the whole
business of convincing a language model that it's a protocol droid — is the
Towards Data Science piece *What's the Best Way to Brainwash an LLM?*
