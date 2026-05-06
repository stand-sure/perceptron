# Cover Note · MIT Sloan Management Review

*Draft for Chris Anderson's review. Operationalization-first posture
rather than synthesis-first: McNeilly named the problem, Barnard-Bahn
extended it, the docs operationalize it. SHITS as unstated spine, with
the Anderson/Parker/Tan critique surfacing the conventional version of
this beat already on SMR's pages and the discipline that has to follow.
The OOP/Planck contrarian thesis lands as memorable hook without
becoming the whole pitch.*

---

Dear [Editor],

A problem in AI deployment has been named clearly in the past three
months. The discipline that follows from naming it has not been
written, and I think it belongs on your pages.

Mark McNeilly named "HITL Theater" as a systemic failure mode in
March. Amii Barnard-Bahn extended the diagnosis with three operational
conditions for genuine oversight last week — literacy, standing,
consequence. Nelu Radpour's recent preprint reframes single-channel
agentic benchmarking as a category error against decades of safety-
engineering practice. Each names the problem from a different angle.
Each stops short of the operational engineering discipline that
follows from naming it.

The conventional version of that next step is already on your pages.
Anderson, Parker, and Tan's *Hidden Costs of Coding With Generative
AI* landed the brownfield-versus-greenfield distinction and surfaced
the technical-debt risk well. But its prescriptive answer — that
experienced engineers will be better stewards of AI tooling — is the
version of the argument that has historically failed at every major
paradigm shift in software.[^1] Object-oriented adoption, functional
programming adoption, cloud-native adoption: each generationally
bounded, each requiring natives-of-the-paradigm to become senior
rather than the prior seniors to learn the new one. Planck's *"a new
scientific truth does not triumph by convincing its opponents, but
because its opponents eventually die"* is unkind but predictively
useful. The discipline your readers need is not "trust the seniors";
it is decision-flow classification, capability-matched human review,
compositional risk discipline, and explicit operating-envelope
monitoring — practices that hold regardless of practitioner seniority.

[^1]: The operational claim — that senior engineers presently produce
better outcomes with AI tooling than juniors — is likely true and
detectable in interviews. The directional inference from that snapshot
is what fails. Effectiveness right now reflects the union of domain
mastery and tool mastery, dominated at this moment by the former
because the tool is new; senior engineers' advantage is real but is
borrowed from a foundation the agentic paradigm partly dissolves.

I've drafted a four-document field manual that operationalizes the
McNeilly and Barnard-Bahn diagnoses into engineering practice, paired
with two working interactive teaching artifacts (a single-layer
perceptron classifier and a 2-2-1 backpropagation visualization with
live training). The artifacts have been run through the seventeen-year
engineering development program at the company where I serve as CTO.
The manual is operationalizable as currently written and could be the
seed for a more rigorous SMR treatment if the framing reads as worth
it to you.

I'd value your editorial judgment more than I'd value the byline.
Materials are attached, with a "How this was made" note acknowledging
Claude's role in the implementation.

Best,

Chris Anderson
CTO, Innago

---

## Notes for editing before sending

**The Planck quote.** Use sparingly. It lands harder the first time
than each subsequent use. Keep it in the cover note; do not repeat it
in the manual itself.

**The Anderson/Parker/Tan critique.** Naming an SMR piece in a pitch
to SMR is bold. The critique is precise — about the prescription, not
the diagnosis — but if it reads as too direct on your re-read, the
softer version is "is the version of the argument that has not held
across prior paradigm shifts" instead of "has historically failed."
Same content, less pointed.

**Possible follow-on essay.** The OOP / cloud-native / funeral-at-a-
time argument is a complete contrarian thesis on its own and worth its
own treatment if SMR bites on the main pitch. The argument compresses
to: every prior paradigm shift in software was generationally bounded,
not learned by the seniors of the prior paradigm; the conventional
wisdom about who-stewards-AI is therefore historically the wrong
prediction. Fits SMR's editorial style if developed properly. Worth
mentioning in a follow-up reply if the editor responds with interest.

The follow-on essay would also have room for the inertia argument that
doesn't fit in the pitch: senior engineers don't merely fail to
acquire tool mastery at the same rate as juniors; they have
structurally rational reasons not to. Their professional identity,
career capital, and org-chart position all derive from mastery of the
prior paradigm. An agentic coworker that compresses their leverage is
a threat to the foundation of their value. The "yet another tool"
framing is the tell — senior engineers have seen many tools come and
go, and correctly classifying which tool is paradigm-shifting versus
incremental is itself a tool-mastery skill that domain mastery does
not provide. This is not a moral failing; it is a predictable
organizational dynamic, and naming it cleanly is the move that lets
engineering leaders design around it rather than be surprised by it.

**Editor identification.** SMR's most likely fit for this material is
probably Elizabeth Heichler (editor in chief) or one of the senior
editors handling the AI/leadership beat. Worth a quick LinkedIn check
to identify who's editing the Renieris/Kiron pieces and the Anderson/
Parker/Tan piece — that's the editor whose taste this matches and the
one who will recognize the topicality argument fastest.

**Things you may want to tune.**

- *"More than I'd value the byline"* — calibrated to the editorial-
  judgment ask, but if you want the byline, soften this. Saying it
  explicitly is a strong move only if you mean it.
- *Innago naming.* Optional. The seventeen-year program detail
  without the company name reads as more about the practice than the
  platform; with the name it reads as a case study. Both work;
  different signals.
- *The Claude acknowledgment.* I've kept it light — one line at the
  end. PROMPT.md handles the substantive version. If you want to
  lead with it instead, the cover note becomes a different document.

**HBR variant.** HBR readers are more C-suite generalist than SMR
readers. The McNeilly and Barnard-Bahn citations stay (HBR readers
will recognize both). The Radpour preprint comes out — too academic
for HBR's register. The Anderson/Parker/Tan critique becomes more
central or comes out entirely depending on how HBR feels about cross-
publication beef; my instinct is to remove it for HBR since the
critique only lands if the reader has read the original. Send to SMR
first; the pitch travels in the right direction that way.
