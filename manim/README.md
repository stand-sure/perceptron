# Manim Companion

Pre-rendered animations that fill the gaps the live in-browser artifacts have when no one is sitting next to the reader. The interactive React/Vite parts at the repo root remain primary; the videos here are for moments where smooth motion at frame rate matters more than interactivity, or where the live network can fail to converge and a self-paced reader needs a guaranteed view of the successful outcome.

## Why a separate Python project

The web artifact and these animations have nothing in common technically. Mixing a Python / FFmpeg / LaTeX toolchain into the React project would create cognitive friction for anyone forking either piece. They live in the same repo because they teach the same material; they live in different directories because they have nothing else in common.

## Tooling

- **Python project manager:** [uv](https://docs.astral.sh/uv/). Reproducible lockfile, fast installs, handles Python version pinning. Pinned to Python 3.12.
- **Animation library:** [Manim Community Edition](https://docs.manim.community/) (`manim>=0.20.1`). Stable semver releases, well-documented, large community.
- **Renders stored via Git LFS** under `renders/`. See `.gitattributes` at the repo root.

## System dependencies

ManimCE is pure Python, but rendering needs:

- **FFmpeg** — video encoding. `brew install ffmpeg`.
- **Cairo, Pango** — vector and text rendering. `brew install cairo pango pkg-config`.
- **`py3cairo`** — `brew install py3cairo`. **Required on macOS arm64** to work around a broken pycairo wheel; see "Known issues" below.
- **A LaTeX distribution** — only required for `MathTex` mathematical typesetting. **MacTeX** on macOS, **TeX Live** on Linux. Scenes that use only `Text` (Pango-rendered) render without LaTeX; scenes that use `MathTex` will fail until a LaTeX install is on `PATH`.

The first scene (`part2_warp_canonical.py`) is deliberately written with `Text` only so it renders without LaTeX. Subsequent scenes that need mathematical typesetting will use `MathTex` and require LaTeX.

## Usage

From this directory:

```bash
# install dependencies + apply the macOS arm64 pycairo workaround
make sync

# render a scene at low quality (fast iteration)
make render            # equivalent: uv run manim render scenes/...py ClassName -ql

# render at high quality for committing to renders/
make render-hd         # equivalent: uv run manim render scenes/...py ClassName -qh

# preview a scene interactively (opens player on completion)
make preview
```

Manim writes outputs under `media/` by default. Move the keeper renders to `renders/` for tracking via Git LFS.

> **Use `make sync`, not bare `uv sync`.** The `Makefile` chains the pycairo fix-up after the install. Running `uv sync` directly will leave you with the broken pycairo and a confusing `incompatible architecture` error at first import.

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

## Known issues

### pycairo wheel broken on macOS arm64 (PyPI 1.29.0)

The published `pycairo` 1.29.0 macOS arm64 wheel is mislabeled — it carries the arm64 platform tag but ships an x86_64 `_cairo.cpython-*-darwin.so`, which fails to load on Apple Silicon with an `incompatible architecture` `ImportError`. Source-building from the upstream sdist with uv also produces a non-functional binary on this platform: the resulting `.so` is x86_64 *and* not linked against `libcairo` (only against `libSystem`). Neither `--no-binary :all:` nor explicit `ARCHFLAGS="-arch arm64"` change this; multiple Python versions (uv-managed and Homebrew, 3.12 / 3.13 / 3.14) reproduce the same failure mode.

The reliable workaround is to install `py3cairo` via Homebrew — `brew install py3cairo` — and then overlay its working arm64 build into the venv after each `uv sync`. `scripts/fix-pycairo.sh` does this; the `make sync` target chains it automatically. Linux and Intel-Mac forkers can ignore this and use plain `uv sync`; the script is a no-op on non-arm64-macOS hosts.

This is upstream's bug to fix; the workaround should be removable once a corrected wheel ships.
