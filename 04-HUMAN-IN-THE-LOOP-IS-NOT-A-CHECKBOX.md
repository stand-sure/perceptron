# Human-in-the-Loop Is Not a Checkbox

A fourth and likely final addendum, prompted by the observation that the
standard answer to AI deployment risk — *put a human in the loop* — is
both incomplete and weirdly disrespectful to the humans involved. The
previous addenda dealt with what gets verified
(`NUMERICAL-NOTES.md`) and why per-layer verification fails to
compose (`CORRECTNESS-IS-NOT-COMPOSITIONAL.md`). This one deals with
the human review that's supposed to catch failures the verification
missed, and what it actually takes for that review to be load-bearing
rather than ceremonial.

The position this document defends, briefly: HITL is essential at some
boundaries and unnecessary at others; the boundaries can be
characterized; the people staffed at those boundaries are not
interchangeable; and HITL implemented as a uniform checkbox produces
false confidence that is *worse* than admitting the human isn't there.

---

## Honoring the concern before refining it

The genuine concern — the version worth taking seriously, not the
strawman — runs like this. AI systems fail in ways their builders did
not predict and their operators cannot easily detect. The failures
accumulate silently. The humans who once exercised the judgment those
systems now automate lose the skill to override the system when override
is what's required. The labor displaced is real. The accountability for
the failures, when they come, is diffuse. *Therefore put a human in the
loop.*

Each clause in that argument is correct. The AI failure modes are real.
The silent accumulation is real. The skill atrophy is real. The labor
and accountability concerns are real. The conclusion — *therefore HITL*
— is also right, in a direction.

What the conclusion does not specify, and what makes it operationally
useless as stated, is *which loop, which human, doing what, to what
standard*. Without those four refinements, "human in the loop" becomes a
governance ritual that lets organizations claim oversight without
purchasing it.

The refinement is not a retreat from the concern. It is what taking the
concern seriously actually requires.

---

## A taxonomy of decision flows

Most engineering decisions, examined closely, fall into one of four
categories. Each has a different correct relationship to automation and
a different correct relationship to human review.

**Procedural / mechanical.** File renames, format conversions, scaffold
generation, dependency updates that pass tests. Determinism is high.
Reversibility is high. The decision is shaped by syntax, not judgment.
HITL adds latency and nothing else. Automate. The luddite who insists on
human review here is asking humans to perform mechanical work they hate
and that they will perform worse than the machine.

**Boolean-decidable / enumerable.** Validation, routing, dispatch, config
checks, eligibility rules. The decision *looks* like judgment but, on
inspection, reduces to a finite truth table — the developer who wrote
it was performing tacit Boolean algebra without realizing it. Once the
table is enumerated and reviewed *once*, automation is sound. HITL on
each subsequent invocation adds nothing. The intellectually honest move
here is to do the enumeration explicitly, audit the table, and ship the
automation. Many engineering organizations skip the enumeration step,
keep the developer in the loop on every invocation, and call this
caution. It is not caution. It is failure to do the analysis.

**Stochastic / judgment-bound.** Code review, design choices, prioritization,
content decisions, customer escalations. The decision genuinely requires
weighing factors that resist enumeration. Outputs are not unique;
multiple defensible answers exist. *This is the category where HITL
adds load-bearing value*, and it is also the category where the
capability horizon (next section) governs whether the value is realized
or only nominally claimed.

**Compositional / systemic.** Production deploys, financial transactions,
medical decisions, legal commitments, anything where the consequence is
irreversible or the failure is correlated across the system. Per-decision
HITL is necessary but not sufficient — see
`CORRECTNESS-IS-NOT-COMPOSITIONAL.md` for why. These boundaries require
HITL *and* explicit envelope discipline: documented operating regimes,
correlated-failure scenario testing, joints staffed with humans who can
see the coupling.

The first two categories should be aggressively automated. The third
should be staffed thoughtfully. The fourth should be staffed *and*
instrumented. An organization that treats all four identically — either
"automate everything" or "review everything" — is performing a category
error and will pay for it asymmetrically depending on which direction
they got wrong.

---

## The capability horizon

This is the part of the argument that's uncomfortable and has to be
made carefully.

A human in the loop adds value when, and only when, the human can *catch
what the loop is supposed to catch*. This is not a property of having a
human present. It is a property of the match between the human's
capabilities and the failure modes the loop is designed to surface.

The capability has four components, and all four have to hold:

1. **Domain knowledge** sufficient to recognize the failure when it
   appears. A reviewer who cannot read the code cannot meaningfully
   review the code. A reviewer who does not understand the regulatory
   regime cannot meaningfully approve the disclosure. This is obvious
   when stated and routinely violated in practice.
2. **Attention** adequate to the cognitive load of the review.
   Content moderators reviewing 50 items per minute are not reviewing.
   Compliance officers approving 200 documents per hour are not
   approving. The HITL is nominal; the L is not actually being executed
   in any operationally meaningful sense.
3. **Mandate** to act on what they see. A reviewer who lacks the
   authority to block, who lacks the political cover to escalate, who
   knows that override carries career risk while rubber-stamping does
   not — that reviewer's review is not load-bearing. The signal might
   be perceived; it cannot be transmitted.
4. **Time** within which the review is meaningful. A review on a release
   that ships in twenty minutes regardless of what the reviewer says is
   not a review. It is a checkbox.

When any of these four fail, the HITL is *theater* — the appearance of
oversight without the substance. And the failure is asymmetric in a way
that makes the theater worse than honest absence: theater generates
false confidence. Engineers downstream assume the review caught what
review is supposed to catch and behave accordingly. Compliance teams
report HITL coverage to auditors who treat the coverage as risk
mitigation. The system as a whole carries the weight of an oversight
that is not, in fact, occurring.

This is the honest version of the concern that "AI must always be
supervised." Supervision is not a uniform good. Supervision that fails
any of the four conditions is not supervision; it is performance of
supervision. And in some domains, the marginal human available for
supervision cannot meet the four conditions, for reasons that have
nothing to do with the human's worth or intelligence and everything to
do with the structure of the work — the volume, the complexity, the
specialization, the time pressure, the institutional context.

This is not an argument for replacing humans with AI. It is an argument
that *placing the right humans at the right boundaries under the right
conditions* is itself load-bearing engineering work, and that doing it
badly is worse than not doing it at all.

---

## What this means in practice

Five operational habits, in order of how often they're skipped:

**Map your decision flow before staffing it.** Walk through every
non-trivial decision your AI-assisted workflow makes and classify it
into one of the four categories. Most organizations have not done this
and would be surprised by the distribution. A common finding is that
60–80% of supposed "judgment" decisions are actually Boolean-decidable
with two days of analysis, and the human review currently spent on them
is being purchased at the expense of the review that genuinely needs
those humans.

**Be honest about which category you're in.** The temptation is to
upgrade everything to "stochastic" because it sounds defensible. Resist
it. A misclassified procedural workflow gets reviewed forever by humans
who hate it. A misclassified compositional workflow gets per-decision
HITL when it needs envelope discipline.

**Match the human to the boundary.** When you do place a human at a
stochastic or compositional boundary, name them. Document what
capability they bring that makes the review meaningful. If you cannot
name a person who has the four properties for that boundary, you do not
have HITL at that boundary — you have a job posting that may or may not
be filled adequately.

**Audit your HITL for theater.** Periodically, with discipline. The
specific question is: at this boundary, does the human reviewing have
the domain knowledge, the attention, the mandate, and the time to
catch the class of failure this loop exists to catch? If any answer is
no, fix the conditions or relocate the boundary. Do not paper over
theater with more theater.

**Recognize the trade with skill atrophy.** This is the legitimate
concern that survives the refinement. When you automate a Boolean-
decidable workflow, the humans who used to perform it lose practice.
When the system encounters a case outside its truth table — and it
will — those humans will be slower to recognize the anomaly and slower
to override. The honest mitigation is not "don't automate"; it is
"automate, and protect the practice that maintains the override
capability." This is genuinely hard. Aviation has spent decades on it.
Most software organizations have not started.

---

## Adjacent arguments — and where the prescription differs

The argument above shares vocabulary with several recent pieces, and an
honest accounting of what is original here requires being clear about
what isn't.

Mark McNeilly's *Human-in-the-Loop: Safety Mechanism or Safety Theater?*
(March 2026) names HITL Theater as a systemic failure mode, articulates
the spectrum-not-binary frame, and surfaces the "meaningfully and
capably engaged" criterion. Amii Barnard-Bahn's *The Accountability
Gap* (April 2026) extends the diagnosis with three operational
conditions for genuine oversight — literacy, standing, and consequence
— that map onto three of the four conditions named in the previous
section. The diagnostic vocabulary in this document owes substantial
credit to both. Readers who have not encountered HITL Theater elsewhere
should read McNeilly first; readers who want the executive-coaching
operationalization of accountability should read Barnard-Bahn.

What this document does differently is structural. McNeilly's
prescription anchors on human-presence as the default with caveats:
*start with HITL as the default when stakes are high, outcomes are
irreversible, and uncertainty is substantial; recognize that HITL can
produce worse outcomes than AI-only approaches in specific conditions.*
The human is the center of the framework; the conditions modulate
whether the human's involvement is real or theatrical.

The framework here inverts that center. The decision is the unit of
analysis, not the human. The four-category taxonomy — procedural,
Boolean-decidable, stochastic, compositional — classifies the work
first, and only then asks whether and where a human belongs. Most
decisions in an engineering organization fall into the first two
categories and warrant no human-in-the-loop at all once the analysis
is complete. The third category warrants HITL conditional on the four
capabilities. The fourth requires HITL plus envelope discipline that
per-decision review cannot provide. The default-HITL move runs in the
opposite direction from this — it places the human first and asks when
to remove them. The decision-flow move places the decision first and
asks where the human should be added.

This is not a contradiction with McNeilly; it is a different framing
of the same problem space, with different operational implications.
McNeilly's framing is more useful for executives reasoning about
high-stakes decision boundaries one at a time. The decision-flow
framing here is more useful for engineering organizations designing
the workflows themselves at scale, where a default-HITL stance creates
the very theater both arguments warn against — by staffing reviewers
into thousands of low-stakes decisions where the four capabilities
cannot all hold. Both framings can be correct simultaneously; they
operate at different levels of the system.

The asymmetric-failure claim — that HITL theater is *worse* than
honest absence — is named by McNeilly and stated more sharply here.
The mechanism is the same in both: false confidence propagates
downstream as if the review caught what review is supposed to catch.
This document spends more time on the load-bearing implication: that
designing the absence of human review explicitly, and naming it as a
deliberate engineering choice rather than an oversight, is itself a
form of discipline that most organizations do not currently practice.

## The horizon, named directly

Chris's framing of the original question gestured at this and it's
worth saying plainly. There is a horizon at which a capable human review
adds genuine value to AI-assisted work. The horizon exists. It is not
universal — some boundaries lie below it, and at those boundaries the
human is ceremonial. It is also not arbitrary — at the boundaries above
it, the human review is the difference between a system that fails
detectably and one that fails silently.

The honest engineering question is not whether to have humans in the
loop. It is *where the horizon is for this specific workflow*, *who is
above it*, and *what the conditions are under which their review is
load-bearing rather than performative*.

Engineering leaders who think clearly about this question protect
themselves and their organizations from two failures simultaneously: the
failure of automating away judgment that genuinely required humans, and
the failure of staffing humans into reviews where the humans cannot
meaningfully contribute. Both failures are common. Both are worse than
the alternative. The discipline is in distinguishing them.

---

## How the four documents fit together

This is the last addendum, and the four together form a curriculum arc
worth naming.

`PROMPT.md` is about specifying work clearly enough that a competent
implementer can execute against it.

`NUMERICAL-NOTES.md` is about auditing what the implementer produced for
the assumptions it carries silently.

`CORRECTNESS-IS-NOT-COMPOSITIONAL.md` is about why audits at the
component level do not compose into system-level correctness, and what
discipline replaces the convenient lie of layered guarantees.

`HUMAN-IN-THE-LOOP-IS-NOT-A-CHECKBOX.md` is about where humans belong
in the picture above — not everywhere, not nowhere, but at boundaries
chosen deliberately and staffed by people capable of providing the
value the boundary requires.

Together they describe a working stance toward AI-assisted engineering:
specify well, audit honestly, refuse the comfort of false composition,
and place capable humans at the joints where capability matters. None
of these are checklists. All of them are practices. The engineers who
make this distinction will ship better systems than the engineers who
treat any of the four as an artifact rather than as ongoing work.

---

*Prompted by a reader's observation that HITL is essential at some
boundaries and unnecessary at others, and that the capability of the
human matters as much as the presence. The observation was correct. The
document exists because the standard pro/anti-AI debate generally fails
to make either point clearly.*
