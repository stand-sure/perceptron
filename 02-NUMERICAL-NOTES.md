# Numerical Notes · A Post-Hoc Audit

This document exists because of a question asked after the artifacts were
already built: *did we defend against the wonkiness of floating-point
representation in JavaScript?*

The question is more interesting than the answer. The spec for these
artifacts said nothing about numerical stability. The implementer (Claude)
wrote code that mostly handled it, partly didn't, and produced output that
looked clean enough that nobody would have noticed had the question gone
unasked. This is the gap that AI-assisted engineering creates and that a
disciplined org has to close on purpose.

The audit pattern is the deliverable. The floating-point content is the
example.

---

## How to read this document

Three columns of judgment, applied to every numerically interesting site
in the code:

1. **What could go wrong** under IEEE 754 — overflow, underflow, loss of
   precision, division by zero, log of zero, NaN propagation.
2. **What the code actually does** about it.
3. **Whether the gap matters for this artifact's audience and use.**

Column three is where engineering judgment lives. A teaching artifact run
in a browser by a few hundred engineers tolerates risks that a
high-frequency trading system does not. Column three is where most
"production-readiness" arguments actually take place, and it should be
written down.

---

## What is defended

### Sigmoid

The sigmoid is implemented in two branches by sign of `z`:

```js
function sigmoid(z) {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}
```

This is the standard numerically-stable form. The naive
`1 / (1 + Math.exp(-z))` actually behaves acceptably in JavaScript because
IEEE 754 handles `1 / Infinity = 0` cleanly, but the two-branch form
avoids ever materializing `Math.exp(very_large_positive)` as `Infinity`
in an intermediate computation, which is the principled fix.

### Binary cross-entropy loss

```js
const eps = 1e-7;
const loss = -(y * Math.log(yHat + eps) + (1 - y) * Math.log(1 - yHat + eps));
```

A perfectly-confident wrong prediction (`yHat = 1.0` against `y = 0`)
would otherwise produce `Math.log(0) = -Infinity`. The epsilon shifts
that into a finite-but-large value, which is the right behavior for both
loss display and any downstream arithmetic.

### Box-Muller Gaussian

```js
function gaussian() {
  const u = Math.random() || 1e-9;
  const v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```

`Math.random()` returning exactly zero is vanishingly rare per spec, but
`Math.log(0)` is `-Infinity` and worth guarding. The `|| 1e-9` falls
through to a small positive value if the draw is exactly zero.

### Canvas normalization

Both the weight visualization and the per-pixel contribution heatmap
normalize against the maximum absolute value found:

```js
let maxAbs = 1e-9;
for (let i = 0; i < N; i++) {
  const a = Math.abs(weights[i]);
  if (a > maxAbs) maxAbs = a;
}
```

The `1e-9` floor prevents division by zero on the first render, when
weights are still microscopic from initialization. The visual result is a
nearly-uniform mid-gray, which is the correct rendering of "no
information yet."

### Geometric divisions

In Part II, the hidden-space decision-boundary calculation and the
draggable-line extension both contain explicit guards:

```js
if (Math.abs(b) > 1e-6) { /* compute h2 from h1 */ }
if (dx*dx + dy*dy < 1e-9) { /* coincident endpoints — bail */ }
```

These prevent the visualizations from rendering garbage when the user
drags both handles to the same point or the network's output-layer
weights happen to align with an axis.

### Step-function derivative at zero

```js
function stepPrime(z) { return z === 0 ? NaN : 0; }
```

The mathematically correct answer at the discontinuity is "undefined,"
which we return as `NaN`. The plotting code uses `Number.isFinite` to lift
the pen and skip the point rather than draw spurious geometry.

---

## What is not defended (and why)

### No Kahan summation in the 400-element dot product

The forward pass accumulates 400 multiply-adds for the perceptron and 800
for the 2-2-1 net. With weights of order 10 and inputs in `[0, 1]`,
intermediate magnitudes stay well within double precision's ~15–17
significant digits.

A real neural network library at MNIST scale or beyond cares about this.
This artifact does not. The visible behavior is identical to the
Kahan-summed version to roughly the seventh decimal of the loss display,
which is far below the resolution of any rendered visualization.

### No `Number.isFinite` guards around displayed values

If weights ever went `NaN`, the stat panels would print `"NaN"` and the
canvases would render junk pixels. Sigmoid + binary cross-entropy is
self-limiting — saturated activation produces zero gradient produces no
further movement — so this shouldn't happen at any reasonable learning
rate, but it isn't strictly impossible at extreme settings.

This is the one defense I'd add for production. See "Recommended changes"
below.

### No gradient clipping

Same reasoning as above: sigmoid + BCE self-limits. The argument does not
hold for ReLU networks (where activations can grow unboundedly) and does
not hold for deeper networks (where gradients can compound). For this
artifact's two-layer sigmoid topology, gradient clipping is not load-
bearing.

### No deterministic seeding

`Math.random()` is not seedable in standard JavaScript, so the XOR
initialization is non-reproducible. This is partly why Part II §3 has the
documented initialization-sensitivity issue: different page loads produce
different convergence paths, and some converge to local minima.

For a teaching artifact, the non-reproducibility is *part of the lesson* —
real networks have this problem too. For reproducible benchmarks, you
would replace `Math.random()` with a seeded PRNG (e.g., a small mulberry32
implementation, ~6 lines).

---

## Recommended changes for production deployment

If these artifacts were taking real public traffic from people who'd be
confused rather than amused by a `NaN` appearing in the wild, the changes
worth making are:

1. **A `Number.isFinite` pass around every displayed numeric value and
   every canvas normalization,** with a graceful fallback to a known-good
   default (zero, mid-gray, "—"). About one hour of work.
2. **A seeded PRNG** (e.g., `mulberry32`) replacing `Math.random()`
   throughout, with the seed exposed as a URL parameter. About one hour
   of work, makes the artifacts reproducible across machines, and lets
   readers share specific interesting initializations as links.
3. **A "training has stalled" detector** in Part II that watches for
   plateaued loss and surfaces a non-intrusive nudge to hit RESET.
   Roughly two hours including the UX, makes the documented init-
   sensitivity issue self-explanatory.

None of these are required for the artifacts to function. All three would
sharpen the experience for a public audience.

---

## The meta-lesson

The audit you just read could have been performed before the artifacts
were built — as part of the spec — or during, as part of the
implementation. It wasn't. It happened after, because someone asked.

This is the gap that AI-assisted engineering creates. The implementer
produces code that compiles, runs, and looks polished. The questions that
would surface its weaknesses do not arise from the code itself. They have
to come from a human reader applying domain judgment.

The 4FF point is that this audit step is not optional. It is the load-
bearing engineering work in a workflow where the implementer is fast and
plausible. The questions that get asked — about numerical stability,
about boundary conditions, about what happens at scale, about what fails
silently — are where the engineering value lives.

If you take one habit from this document into your team's Claude Code
workflow, take this one: **after the implementer produces code, write
down what could go wrong, what the code does about it, and whether the
gap matters for your audience.** Three columns. Apply them to every
non-trivial output. The columns are cheap to write and the discipline is
expensive not to have.
