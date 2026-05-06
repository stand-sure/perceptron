# 4FF Field Manual · Perceptrons & Backprop

Two interactive teaching artifacts for engineers who don't blindly trust ML
systems. Built for the 4FF engineering development program at Innago.

**Part I · Anatomy of a Perceptron** — One neuron, one decision, no magic.
A single-layer perceptron classifying 20×20 procedurally-generated
handwritten 1s from 8s. Live training, weight visualization, per-pixel
contribution heatmap, and a draw-your-own canvas. Built so you can see
exactly what "AI" is doing when it isn't doing very much at all.

**Part II · The Wall and the Warp** — Why a single neuron cannot learn XOR,
the seventeen-year detour that followed, and why one
continuously-differentiable function broke modern AI free. Interactive XOR
geometry, a 2-2-1 sigmoid network trained live with backpropagation, and a
visualization of the hidden layer bending input space until the four XOR
points become linearly separable.

---

## How this was made

The end-state description — what these artifacts should achieve, the
pedagogical arc, the choice of XOR as the pivot point between Parts I and
II, the decision to close on the ReLU asterisk as a meta-lesson about
practitioners breaking "load-bearing" preconditions — is mine. The code is
attributable to Claude (Anthropic, Opus 4.7), generated across several
sessions in May 2026.

This is itself the lesson the artifacts are trying to teach. A clear spec
plus a competent implementer produces working software. The spec is the
hard part. The implementer — whether human, AI, or some combination — is
downstream of someone holding the pedagogy.

If you want to reproduce these artifacts (or build your own variants for
your own teaching program), an abridged version of the prompts that
generated them is in **[PROMPT.md](./PROMPT.md)**. Use it as a starting
point, not a recipe. The interesting work is in the iteration that
follows.

## Known issues

**Part II §3 — XOR initialization sensitivity.** The 2-2-1 sigmoid network
is notoriously sensitive to its random initialization. Sometimes it
converges in a few hundred epochs; sometimes it gets stuck in a local
minimum where one hidden unit dies and the loss plateaus. **This is not a
bug — it's part of the lesson.** Hit `RESET` to re-randomize and try
again. When it works, you'll see the hidden-space grid bend until the
four XOR points cleanly split across the white decision line.

If you're using this in a teaching context, the failure mode is itself
worth pausing on: real networks have this problem too. Modern initializers
(Xavier, He) help, modern optimizers (Adam) help more, but the basic
point that gradient descent on non-convex losses is an empirical art
rather than a guarantee — that's a lesson worth sitting with.

For a post-hoc audit of numerical stability across both artifacts (and a
worked example of the audit pattern itself), see
**[NUMERICAL-NOTES.md](./NUMERICAL-NOTES.md)**.

For the deeper systems-level lesson — that per-layer correctness does
not compose into ensemble correctness, with examples from chemical
process control and the 2008 financial crisis, and what this means for
shipping AI agents — see
**[CORRECTNESS-IS-NOT-COMPOSITIONAL.md](./CORRECTNESS-IS-NOT-COMPOSITIONAL.md)**.

For where humans belong in AI-assisted workflows — a taxonomy of
decision flows, the four conditions a human review actually requires,
and why HITL implemented as a uniform checkbox produces false confidence
worse than honest absence — see
**[HUMAN-IN-THE-LOOP-IS-NOT-A-CHECKBOX.md](./HUMAN-IN-THE-LOOP-IS-NOT-A-CHECKBOX.md)**.

## Running locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/`.

The dev server serves at the root path; only the deployed build uses the
GitHub Pages sub-path, so you do not need to touch `vite.config.js` to
run locally.

## Building for deployment

```bash
npm run build
```

The build output goes to `dist/`. The included GitHub Actions workflow
(`.github/workflows/deploy.yml`) deploys to GitHub Pages on every push
to `main`. To use it in a fork:

1. In your repo settings, under **Pages**, set the source to **GitHub Actions**.
2. Update the `base` path in `vite.config.js` to match your repo name —
   currently `/perceptron/` (for `stand-sure/perceptron`). Use `/` if
   you're serving from a custom domain or a user/org site.
3. Push to `main`.

## Curriculum context

These artifacts are designed to be worked through in sequence as part of
a two-session 4FF block on neural network fundamentals. The pedagogical
goal is *de-mystification* — engineers about to inherit AI tools whose
internals they cannot directly inspect should be able to see, viscerally,
what an AI system is at the simplest possible scale.

Suggested companion reading:

- Rosenblatt, F. (1958). *The perceptron: A probabilistic model for
  information storage and organization in the brain.* Psychological
  Review.
- Minsky, M. & Papert, S. (1969). *Perceptrons: An introduction to
  computational geometry.* MIT Press.
- Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). *Learning
  representations by back-propagating errors.* Nature.
- 3Blue1Brown's *Neural Networks* video series (the visual idiom these
  artifacts borrow from).

## License

[MIT](./LICENSE). Use, fork, adapt for your own teaching programs.
Attribution appreciated but not required.
