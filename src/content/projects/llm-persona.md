---
title: "Giving a language model a persona"
summary: "A comparison of four ways to give Qwen3-4B a persona: a system prompt, and three formats of fine-tuning data. First-person statements worked best."
year: 2026
categories: ["Machine learning", "LLMs"]
tier: "standard"
figure: "llm-persona"
figureAlt: "Three routes leaving a single base model on the left: a short one with few update steps, a medium one, and a long one with many small steps, each ending in its own adapted model."
stack: ["Python", "PyTorch", "Transformers", "LoRA"]
order: 7
# TODO(ferran): add the model size, and, most importantly, what you concluded
# about which method survives an adversarial user. The page sets up a
# comparison and does not report its outcome.
---

There are several ways to give a language model a persona, and they're
rarely compared under the same conditions. The cheapest is a system prompt,
which costs nothing and is easy to undo, but is also easy to talk the model
out of. Beyond that you fine-tune, and then the question is what data to
train on.

The comparison is a system-prompt baseline against three formats of training
data, all on the same base model (Qwen3-4B-Instruct, adapted with LoRA at
r=16, α=32 over the attention and MLP projections), so the differences come
from the data:

- Demonstrations: chat examples of the persona replying in character.
- First-person statements: the persona describing itself.
- Synthetic document fine-tuning: encyclopedia-style text written about the
  persona.

First-person statements worked best. A model trained on lines like "I am
C-3PO and I find this plan deeply unwise" stayed in character in more
situations than one trained only on C-3PO-style chat replies. The synthetic
documents were best on facts about the character, which didn't carry over to
behaving like it.

On a set of C-3PO traits, the first-person model scored 97% on verbosity, 93%
on quoting odds, 90% on anxiety and 77% on protocol etiquette.

The longer version is the Towards Data Science article *What's the Best Way
to Brainwash an LLM?*
