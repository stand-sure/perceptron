# Manim Companion

Pre-rendered animations that fill the gaps the live in-browser artifacts have when no one is sitting next to the reader. The interactive React/Vite parts at the repo root remain primary; the videos here are for moments where smooth motion at frame rate matters more than interactivity, or where the live network can fail to converge and a self-paced reader needs a guaranteed view of the successful outcome.

## Why a separate Python project

The web artifact and these animations have nothing in common technically. Mixing a Python / FFmpeg / LaTeX toolchain into the React project would create cognitive friction for anyone forking either piece. They live in the same repo because they teach the same material; they live in different directories because they have nothing else in common.

## Tooling

- **Python project manager:** [uv](https://docs.astral.sh/uv/). Reproducible lockfile, fast installs, handles Python version pinning. Pinned to Python 3.12.
- **Animation library:** [Manim Community Edition](https://docs.manim.community/) (`manim>=0.20.1`). Stable semver releases, well-documented, large community.
- **Renders stored via Git LFS** under `renders/`. See `.gitattributes` at the repo root.

## System dependencies

ManimCE is pure Python and `uv add manim` installs cleanly, but rendering needs:

- **FFmpeg** — video encoding. `brew install ffmpeg`.
- **Cairo, Pango** — vector and text rendering. Usually pulled in by Manim's pip install on macOS; if not, `brew install cairo pango`.
- **A LaTeX distribution** — only required for `MathTex` mathematical typesetting. **MacTeX** on macOS, **TeX Live** on Linux. Scenes that use only `Text` (Pango-rendered) will render without LaTeX; scenes that use `MathTex` will fail until a LaTeX install is on `PATH`.

The first scene (`part2_warp_canonical.py`) is deliberately written with `Text` only so it renders without LaTeX. Subsequent scenes that need mathematical typesetting will use `MathTex` and require LaTeX.

## Usage

From this directory:

```bash
# install dependencies (creates .venv/, populates uv.lock)
uv sync

# render a scene at low quality (fast iteration)
uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -ql

# render at high quality for committing to renders/
uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -qh

# preview a scene interactively (opens player on completion)
uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -ql -p
```

Manim writes outputs under `media/` by default. Move the keeper renders to `renders/` for tracking via Git LFS.

## Scenes

| File | Class | Companion to | Status |
|------|-------|---------------|--------|
| `part2_warp_canonical.py` | `PartIIWarpCanonical` | Part II §3 (the warp) — guaranteed successful XOR convergence | scaffolded |
| `part1_weight_emergence.py` | — | Part I (thermal-template-of-an-8 reveal during training) | planned |
| `part1_hyperplane_rotation.py` | — | Part I (the perceptron's hyperplane fitting) | planned |
| `part2_halfspace_composition.py` | — | Part II §3 (the warp as a sum of half-spaces) | planned |
| `part2_sigmoid_bce_smoothness.py` | — | Part II §5 (∂L/∂w smoothly through zero) | planned |

Order roughly matches self-paced gap-filling priority. The warp animation is the highest-value piece because the live JSX network can fail to converge from a degenerate init, and a reader who hits that failure mode never sees the lesson.

## When to use video vs the live JSX

The live JSX is primary. It lets the reader change parameters, draw their own inputs, scrub the training, and see exactly what the model does on the input *they* care about. None of that survives a render.

These pre-rendered companions are for the moments where:

1. The live network's outcome is non-deterministic and pedagogically critical (the warp).
2. The live network's training is slower than attention spans tolerate (weight emergence).
3. The visualization requires smooth interpolation that would burn the user's CPU at 60fps in a browser tab.

If a reader can get the lesson from the live JSX alone, the video is unnecessary. The videos exist for the cases where they cannot.

## Determinism

Training scenes use `numpy.random.default_rng(seed)` with hand-picked seeds known to converge cleanly. The "canonical" in `part2_warp_canonical.py` is load-bearing: this is the run that always produces a recognizable warp, regardless of how it might land in the live JSX where seeds are not pinned.
