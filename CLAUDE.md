# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Two interactive browser-based teaching artifacts ("4FF Field Manual · Perceptrons & Backprop") plus the long-form companion essays at the root (`01-PROMPT.md`, `02-NUMERICAL-NOTES.md`, `03-CORRECTNESS-IS-NOT-COMPOSITIONAL.md`, `04-HUMAN-IN-THE-LOOP-IS-NOT-A-CHECKBOX.md`). Built for the 4FF engineering development program at Innago, open-sourced on Chris Anderson's personal GitHub.

The artifacts are the *subject* of the lesson, not just an illustration of it — they exist to de-mystify ML by being entirely inspectable. **Preserve that property when editing.**

## Layout

Flat Vite + React app at the repo root:

```
.
├── index.html
├── package.json / package-lock.json
├── vite.config.js                 # base: '/perceptron/' for GH Pages
├── tailwind.config.js / postcss.config.js
├── src/
│   ├── main.jsx                   # HashRouter wiring 3 routes
│   ├── IndexPage.jsx              # / — landing page with two cards
│   ├── PerceptronDissected.jsx    # /part-1 — single-neuron 1-vs-8 (~51KB, monolithic)
│   ├── WallAndWarp.jsx            # /part-2 — XOR + 2-2-1 sigmoid net (~55KB, monolithic)
│   └── index.css                  # tailwind directives only
└── .github/workflows/deploy.yml   # GH Pages deploy on push to main
```

The repo previously nested the app under `wall-and-warp/` because that's how the Claude desktop artifact export packaged it; that subdirectory is gone. If you see references to it in older docs or commits, they're historical.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173/#/
npm run build     # outputs to dist/
npm run preview   # serve the built dist/
```

There are **no tests, no linter, no typechecker**. Don't fabricate one — verifying changes means running `npm run dev` and exercising the UI.

## Architecture choices that look wrong but aren't

- **Each Part is one giant file with no shared modules.** `PerceptronDissected.jsx` and `WallAndWarp.jsx` each redeclare their own color palette, math helpers, and sub-components. This is deliberate: the artifacts are meant to be readable end-to-end as a single artifact. Do not factor out "duplicated" code across the two files. Within a file, modest extraction is fine.
- **No abstractions over the math.** Forward/backward passes, weight init, and digit generation are written as plain functions with explicit indices. Resist the urge to introduce a tensor library or a "Layer" class — the visibility of the arithmetic is the pedagogy.
- **`HashRouter`, not `BrowserRouter`.** Required because the site is hosted on GitHub Pages (no server-side rewrites). URLs look like `/#/part-1`. Don't switch this.
- **Vite `base: '/perceptron/'`.** Must match the GitHub repo path for Pages to find assets. Local `npm run dev` is unaffected (Vite serves at root in dev). If the repo is renamed or moved to a custom domain, update `vite.config.js` and the README's deployment instructions in the same change.
- **XOR network instability is a feature.** The 2-2-1 sigmoid net in Part II sometimes diverges or stalls from a bad init — the README's "Known issues" section makes this explicit. Don't "fix" it by switching to Xavier/He init or Adam; the failure mode is part of the lesson. (Mentioning ReLU's asterisk in the closing copy is also load-bearing.)

## Editing the prose docs at the root

The numbered markdown files are first-class deliverables, not notes. They have a deliberate voice (terse, opinionated, no AI-tells like floating quotation marks for emphasis or generic hedging). When asked to edit them, match the existing register — don't soften or add scaffolding/transitions. `01-PROMPT.md` lays out the prompt-writing framework (audience+intent, arc, the one moment, form constraints, negative constraints) that the rest of the artifacts are built against; useful context when the user asks for a new variant.

## Attribution

The repo is openly attributed to Claude (Anthropic, Opus 4.7) for code, with the human owning the spec and pedagogy. Both `README.md` and `IndexPage.jsx` say so; the work was forged for Innago's 4FF program and is being released on the author's personal account. Preserve this framing in any new user-facing copy.
