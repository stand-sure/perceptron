# Reproducing These Artifacts

These artifacts exist because someone wrote a spec for an end state, and a
language model executed against it. If you want to reproduce them — or
build variants for your own teaching program — what you need is the spec,
not the code.

This file is an abridged, slightly idealized version of the prompts that
produced Parts I and II. They are abridged because the actual sessions
involved iteration: a first response, a discussion, a refinement, another
discussion, the final artifact. The prompts below collapse that
back-and-forth into something a reader can paste into a fresh session and
get reasonable output from.

The interesting work is the iteration that follows the first response, not
the prompt itself. Read these as starting points.

---

## What a useful prompt for this kind of work contains

Before the prompts themselves, the structure that made them work:

1. **Audience and intent.** Not "explain X" but "build a thing that, when a
   member of audience Y interacts with it, produces effect Z in their
   thinking." The artifacts are for engineers about to inherit AI tools
   they cannot directly inspect; the intent is de-mystification.

2. **A pedagogical arc, not a topic.** "Perceptron" is a topic. "Show
   that a perceptron is just numbers, then show that those numbers form a
   visible template, then let the reader try to fool it" is an arc. The
   arc is what the artifact is *for*. The topic is incidental.

3. **The single moment the artifact has to land.** Every good explainer
   has one image, one interaction, one realization that does the actual
   work. For Part I it is the per-pixel contribution heatmap. For Part II
   it is the hidden-space warp during training. Identify yours and protect
   it. Everything else is scaffolding for that moment.

4. **Constraints on form.** Browser-runnable, no external dependencies, no
   server. These are not aesthetic preferences — they determine what
   becomes possible to build (and ship, and share, and maintain).

5. **A list of what to *not* do.** "Don't use generic AI design language."
   "Don't use floating quotation marks for emphasis." "Don't pretend the
   model understands shape — it only knows pixel statistics." Negative
   constraints often shape output more than positive ones.

If you write a prompt that contains those five things, the language model
becomes a competent implementer of your design. If you write a prompt that
contains only the topic, you get a topic-shaped blob.

---

## Part I — Anatomy of a Perceptron

> I'm rolling out Claude Code Enterprise to my engineering org soon, and I
> want a teaching artifact that develops a level of understanding so they
> are less likely to blindly trust the tools. Build me an interactive
> single-layer perceptron in JavaScript (React artifact) that:
>
> - Generates synthetic 20×20 handwritten 1s and 8s procedurally (no
>   external data dependency)
> - Trains live in the browser with visible loss curve, weight image, and
>   accuracy
> - Lets the user inspect any test sample, with a per-pixel contribution
>   visualization showing which pixels voted which way (3Blue1Brown
>   idiom)
> - Includes a draw-your-own canvas so engineers can try to fool it
> - Shows the actual training step code unframed, with the math equations
>   visible elsewhere on the page
>
> Aesthetic: dark technical / scientific journal, monospace headers paired
> with a serif body, warm/cool diverging palette for weight visualization.
> Avoid the generic AI-explainer look. The artifact is meant to feel like
> a working dissection, not a marketing site.
>
> The takeaway I want to land: the model is just numbers, confidence is
> not correctness, off-distribution inputs get classified anyway, and a
> linear classifier has linear failures. End with a "things to make your
> engineers notice" panel that names these explicitly.

**Iteration that mattered.** First pass had the contribution map but
buried it; we agreed it should be the centerpiece of §3 and got promoted.
Color-coding for misclassification took a couple of tries to feel right
without being too loud.

---

## Part II — The Wall and the Warp

> Following on from the perceptron artifact: I want a Part II that teaches
> three things in sequence — why a single layer cannot do XOR, the
> historical blockage between Rosenblatt and Rumelhart, and why
> continuously-differentiable activations are the unlock that simplifies
> backprop.
>
> Build it with the same aesthetic as Part I, using these sections:
>
> 1. Interactive 2D XOR plot with a draggable separator line. Let the user
>    switch between AND, OR, and XOR — they'll succeed at the first two
>    and feel the wall on the third.
> 2. Visual timeline of the seventeen-year detour: McCulloch-Pitts 1943,
>    Rosenblatt 1958, Minsky & Papert 1969, Linnainmaa 1970, Werbos 1974,
>    Rumelhart/Hinton/Williams 1986. The dead zone between 1969 and 1986
>    visually highlighted.
> 3. **The centerpiece.** A 2-2-1 sigmoid net trained live on XOR with
>    backprop, side-by-side visualization of input space (curved decision
>    boundary) and hidden space (warped grid showing how the hidden layer
>    bends space until XOR becomes linearly separable). This is the load-
>    bearing image of the entire artifact.
> 4. Activation plots showing the step function with derivative zero
>    almost everywhere, paired with text explaining why that kills
>    multilayer training.
> 5. Same activation plot pattern for sigmoid, with an interactive chain-
>    rule walkthrough showing how σ(z)·(1-σ(z)) cancels with the BCE
>    derivative to leave the famous (ŷ - y)·x update rule.
> 6. The literal backprop function for a 2-2-1 net, naked, no
>    abstractions — match the §5 style of Part I.
> 7. ReLU plot plus the meta-lesson: the very precondition we just
>    celebrated is broken at zero by the activation modern networks
>    actually use, and practitioners shipped anyway. Train your engineers
>    to notice the load-bearing assumptions, because paradigm shifts are
>    downstream of someone questioning one.

**Iteration that mattered.** The §3 warp visualization took the most
work — the first pass colored the heat-map regions too saturated and the
warped grid lines disappeared. Tuning the heat-map intensity down let the
grid carry the visual weight. The XOR initialization sensitivity is a
real failure mode and got documented in the README rather than papered
over with a fixed seed.

---

## Things worth knowing

**The model will overproduce.** Both first responses were longer and more
elaborate than the final artifacts. The valuable iteration was usually
*subtractive* — removing decoration that distracted from the load-bearing
moment.

**The model will under-test.** It generates plausible code that compiles.
You have to actually run it, find the visual edge cases, and feed those
back. The XOR convergence behavior, the contribution heatmap saturation,
the slider step sizes — all needed a second pass.

**The model will not catch your pedagogy mistakes.** It will faithfully
implement an arc that doesn't quite work, and the result will look polished
enough that you might not notice the arc is wrong. The thing the model
genuinely cannot replace is the test of whether the artifact actually
produces the intended effect in the intended audience. That test happens
in the room, with real engineers.

**Iterate in small, shippable increments.** Each session above ran
roughly: rough plan → first artifact → critique → adjustment → final.
Don't try to spec the whole thing in one shot. The spec gets sharper
*after* you see what the implementer made of the first version.

This is, again, the lesson the artifacts are trying to teach. The spec is
the hard part. The implementer is downstream.
