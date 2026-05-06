# Correctness Is Not Compositional

A third addendum, prompted by a reader's objection to a frame I was about
to use. The previous notes (`NUMERICAL-NOTES.md`) made the case that
engineers reaching for formal methods often have a single-dimension model
of correctness, and the dimension their tool speaks to may not be the one
they actually need. That argument is sound but incomplete. The harder
truth, and the one this document is for, is that *even when every
dimension is soundly addressed, the ensemble can still be wrong, and the
failure is not reducible to an oversight at any individual layer.*

This is the load-bearing lesson for engineers about to deploy AI agents
into production systems. Read it twice.

---

## The convenient lie

The convenient lie goes like this. Correctness comes in layers — the
algorithm, the implementation, the runtime, the deployment, the
operational envelope. Verify each layer with the appropriate tool.
Algorithm: Dafny, TLA+, Coq. Implementation: type system, unit tests,
property-based tests. Runtime: integration tests, fuzz testing, chaos
engineering. Deployment: SRE practices, canaries, rollback drills.
Operational envelope: load testing, runbook review, postmortem
discipline.

Stack the verified layers. Inherit the sum.

This story is appealing because each individual move in it is correct.
Each tool *is* the right tool for its layer. Each verification *does*
establish what it claims. The lie is in the word "inherit." Soundness at
each layer does not compose into soundness of the ensemble. It never has.

## What the chemical process engineers learned in the 1990s

Minimax control was the principled approach: for each control loop, find
the input that minimizes the worst-case deviation from setpoint over the
admissible disturbance set. Each loop was provably optimal against its
local objective. The math was clean. The papers were rigorous. The
ensembles oscillated.

What they discovered, expensively, is that locally-optimal controllers
in coupled systems generate disturbances *for each other*. Loop A
suppresses its own worst case by injecting a control action that becomes
part of Loop B's disturbance spectrum, which Loop B then suppresses with
an action that re-enters Loop A's input. Each loop is correct. The
ensemble is unstable.

The discipline that emerged was *coordinated control*, *model-predictive
control with explicit coupling terms*, and a deep cultural humility
about the limits of local optimization. The lesson was not "minimax was
wrong." Minimax was correct. The lesson was that the framework within
which minimax was correct did not include the framework within which the
plant actually ran.

## What 2008 was, structurally

The 2008 financial crisis is the same shape at planetary scale.

Each Gaussian copula model of CDO default correlation was internally
sound — the math followed from its premises, the calibrations matched
historical data, the rating agencies' methodology was peer-reviewed and
publicly defensible. Each tranche rating was locally correct under the
model that produced it. Each counterparty's value-at-risk calculation
was sound under the assumptions VAR makes. Each Federal Reserve stress
test exercised the scenarios its designers thought relevant.

The system collapsed because *correlation between defaults under
liquidity stress* was an emergent property no model captured. When
housing prices declined nationally — an event the historical data did
not contain because it had never happened — every supposedly-independent
mortgage tranche failed at the same time. Counterparties whose risk
models assumed independence discovered they were holding correlated
exposure. The dealers' liquidity assumptions, sound in normal markets,
were unsound in the regime where everyone needed liquidity at once.

No layer was wrong. The composition was.

This is not a financial-engineering point. It is a generic systems
point. Coupled stochastic systems exhibit emergent behaviors that local
analysis cannot predict, and the regime under which the local analysis
is sound may itself be a function of the system's recent history.

## The temptation, and why it fails

The temptation, when you encounter compositional failure, is to absorb
it back into the layered model: "we just missed a layer." Call it the
*interaction layer*, the *system layer*, the *operational envelope*. Add
it to the stack. Verify it next time.

This move is unconvincing, for two reasons.

First, it is unfalsifiable in the bad way. Any compositional failure can
be retroactively reframed as "you forgot to verify the layer where this
failure lives." Frameworks that absorb every counterexample are not
frameworks; they are vocabularies.

Second, and more substantively, the hard cases are *not* ones where the
missing layer was discoverable in advance. The 2008 correlation regime
did not exist in any prior dataset. The chemical-process oscillation
modes were stable until the plant operated in a configuration the
designers had not anticipated. Calling these "layers we missed" is a
category error: they are not layers, they are *properties of the
composition*, emergent in the technical sense — not present in any
component, only in the system.

A useful framework has to admit this honestly. Layered correctness is
necessary. It is not sufficient. The gap between "necessary" and
"sufficient" is not closable by adding more layers.

## What this means for engineers shipping AI agents

The reason this matters now, urgently, for engineering organizations
about to deploy AI agents into production:

- The agent itself is a stack of verifiable layers (model weights,
  inference engine, sandbox, tool permissions, audit log).
- Each layer can be soundly addressed (eval suites, deterministic
  sandboxing, signed tool registries, immutable logs).
- The agent's deployment context — repos, build systems, deploy
  pipelines, on-call rotations, incident response — is itself a coupled
  stochastic system.
- Correlated failures across that system are not in the training data.
  By definition, they cannot be — most of them have not happened yet.

The engineer who ships an agent with verified components into an
unverified composition is making the same mistake that the 1980s
chemical-process engineers made and the 2007 mortgage desks made. Each
component is correct. The ensemble is the question, and the ensemble's
behavior is not the sum of its components' behaviors.

This is not an argument against shipping. It is an argument for *what
kind of skepticism* to bring to the shipping. The skepticism that
matters is not "did we verify each piece" — it is "what regime are we
operating in, what regime have we tested in, and what is the gap?"

## Practical discipline

Three habits, from the chemical-process and finance literatures, that
port to AI deployment.

**Stress the composition, not the components.** Each component has been
verified by someone (the model maker, the sandbox author, the tool
provider). Your job is the integration. The interesting failures will
not be in any single component. Run scenarios that exercise the
*interactions* — what happens when the agent's tool calls fail
intermittently, when its rate limits engage unevenly, when its
deployment target enters a state none of its examples covered, when two
agents act on the same repository with stale views.

**Define and watch the operating envelope explicitly.** Your system is
sound for the regime in which you tested it. Document that regime.
Write down what production volumes, what input distributions, what
upstream and downstream dependencies, what kinds of failure modes you
actually exercised. When production drifts outside the envelope —
because all production eventually does — treat that drift as the
load-bearing risk event, not as a normal operating condition.

**Keep humans in the loop at the points of compositional risk.** Not at
every step (you'd lose the leverage of automation), but at the joints
where coupled subsystems exchange. The mortgage desks failed because
liquidity assumptions were treated as components rather than as
junctions where the financial system's coupling lived. The chemical
plants succeeded once operators were given visibility into the *coupled*
state, not just the per-loop state. The same will be true of agentic
systems. The interesting alarms are at the joints.

## The real lesson

Layered correctness is a useful tool and a dangerous frame. The tool is
useful because each layer's verification *does* eliminate a class of
bug — the local class. The frame is dangerous because it suggests the
elimination composes, and it does not.

The discipline worth teaching, in 4FF and elsewhere, is something more
like this: *Every verification you perform is conducted within a model.
The model is always strictly smaller than the system. The gap between
model and system is where the load-bearing failures live, and that gap
cannot be closed by stacking more verified layers — it can only be
managed by treating it as the engineering work itself, rather than as
the residual after the engineering work is done.*

That sentence is uncomfortable because it does not give you a checklist.
That is the point. Engineering judgment under compositional uncertainty
is not a checklist activity, and the engineers who think it is are the
ones who ship the next 2008.

---

*Prompted by a reader's objection that "layered correctness" was the
wrong frame. The objection was correct. This document exists because of
it, which is itself an instance of the kind of compositional check this
document recommends.*
