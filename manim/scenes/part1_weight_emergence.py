"""
Part I — Weight Emergence

Compresses minutes of live training into ~12 seconds: a single-neuron
perceptron classifying procedurally-generated 1s and 8s, with the
20×20 weight image visible from the start. The animation shows the
"thermal template" of an 8 emerging from near-zero noise as training
proceeds — warm cells where 8-typical pixels live, cool cells where
1-typical pixels live.

This is the moment a self-paced reader can easily miss in the live
JSX: live training takes minutes and the reader may not know to wait
for the template to emerge. The Manim render compresses the slow
training and points at the moment.

Math mirrors src/PerceptronDissected.jsx — same procedural digit
generators, same sigmoid + BCE training step, same warm/cool diverging
colormap as WeightCanvas.

Render:
    uv run manim render scenes/part1_weight_emergence.py PartIWeightEmergence -ql
"""

from __future__ import annotations

import numpy as np
from manim import (
    DOWN,
    UP,
    FadeIn,
    FadeOut,
    Scene,
    Square,
    Text,
    Transform,
    VGroup,
    Write,
)

# ---------------------------------------------------------------------
#  Aesthetic constants
# ---------------------------------------------------------------------
GRID = 20
N = GRID * GRID

BG = "#0b0b0d"
SURFACE = "#15151a"
TEXT_C = "#f0e9d9"
TEXT_DIM = "#8a8478"
ACCENT = "#f5b041"


# ---------------------------------------------------------------------
#  Procedural digit generation (mirrors JSX genOne / genEight)
# ---------------------------------------------------------------------
def _dist_seg(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    L2 = dx * dx + dy * dy
    if L2 < 1e-9:
        return float(np.hypot(px - x1, py - y1))
    t = ((px - x1) * dx + (py - y1) * dy) / L2
    t = max(0.0, min(1.0, t))
    return float(np.hypot(px - (x1 + t * dx), py - (y1 + t * dy)))


def _draw_seg(g, x1, y1, x2, y2, thick):
    t2 = thick * thick
    for py in range(GRID):
        for px in range(GRID):
            d = _dist_seg(px, py, x1, y1, x2, y2)
            v = np.exp(-(d * d) / t2)
            i = py * GRID + px
            if v > g[i]:
                g[i] = v


def _draw_ring(g, cx, cy, rx, ry, thick):
    t2 = thick * thick
    minR = min(rx, ry)
    for py in range(GRID):
        for px in range(GRID):
            ndx = (px - cx) / rx
            ndy = (py - cy) / ry
            r = np.sqrt(ndx * ndx + ndy * ndy)
            d = abs(r - 1) * minR
            v = np.exp(-(d * d) / t2)
            i = py * GRID + px
            if v > g[i]:
                g[i] = v


def _rot(x, y, cx, cy, th):
    dx, dy = x - cx, y - cy
    c, s = np.cos(th), np.sin(th)
    return cx + dx * c - dy * s, cy + dx * s + dy * c


def gen_one(rng, noise=0.0):
    g = np.zeros(N, dtype=np.float32)
    cx = 10 + (rng.random() - 0.5) * 3
    th = (rng.random() - 0.5) * 0.4
    tx, ty = _rot(cx, 3, cx, 10, th)
    bx, by = _rot(cx, 17, cx, 10, th)
    _draw_seg(g, tx, ty, bx, by, 1.3)
    if rng.random() > 0.3:
        sx, sy = _rot(cx - 2.5, 5, cx, 10, th)
        _draw_seg(g, tx, ty, sx, sy, 1.1)
    if rng.random() > 0.5:
        ax, ay = _rot(cx - 2.5, 17, cx, 10, th)
        bbx, bby = _rot(cx + 2.5, 17, cx, 10, th)
        _draw_seg(g, ax, ay, bbx, bby, 1.1)
    if noise > 0:
        g += rng.standard_normal(N).astype(np.float32) * noise
        np.clip(g, 0.0, 1.0, out=g)
    return g


def gen_eight(rng, noise=0.0):
    g = np.zeros(N, dtype=np.float32)
    cx = 10 + (rng.random() - 0.5) * 1.5
    cy = 10 + (rng.random() - 0.5) * 1.5
    th = (rng.random() - 0.5) * 0.25
    tR = 2.6 + rng.random() * 0.6
    bR = 3.4 + rng.random() * 0.6
    tcx, tcy = _rot(cx, cy - (tR + 0.4), cx, cy, th)
    bcx, bcy = _rot(cx, cy + (bR + 0.4), cx, cy, th)
    _draw_ring(g, tcx, tcy, tR, tR, 1.2)
    _draw_ring(g, bcx, bcy, bR, bR, 1.2)
    if noise > 0:
        g += rng.standard_normal(N).astype(np.float32) * noise
        np.clip(g, 0.0, 1.0, out=g)
    return g


# ---------------------------------------------------------------------
#  Perceptron training
# ---------------------------------------------------------------------
def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))


def train_perceptron(seed: int = 42, n_steps: int = 4000, lr: float = 0.05,
                     noise: float = 0.05):
    """Train a single-neuron perceptron on procedural 1-vs-8.

    Returns a list of snapshots — log-spaced so early rapid learning is
    shown densely and the late refinement sparsely.
    """
    rng = np.random.default_rng(seed)
    w = (rng.random(N).astype(np.float32) - 0.5) * 0.02
    b = 0.0

    # Snapshot epochs roughly log-spaced
    snapshot_steps = sorted(
        set(
            list(range(0, 100, 5))
            + list(range(100, 500, 25))
            + list(range(500, 2000, 100))
            + list(range(2000, n_steps, 400))
            + [n_steps - 1]
        )
    )

    snapshots = []
    for step in range(n_steps):
        if step in snapshot_steps:
            snapshots.append({"step": step, "w": w.copy(), "b": float(b)})

        # One sample per step (mini-batch of 1)
        y = 0 if rng.random() < 0.5 else 1
        x = gen_one(rng, noise) if y == 0 else gen_eight(rng, noise)

        z = float(b + np.dot(w, x))
        yhat = sigmoid(z)
        grad = yhat - y  # ∂L/∂z for sigmoid + BCE
        w -= lr * grad * x
        b -= lr * grad

    return snapshots


# ---------------------------------------------------------------------
#  Visualization — warm/cool diverging colormap from JSX WeightCanvas
# ---------------------------------------------------------------------
def weight_color(w_value: float, max_abs: float) -> str:
    """Map a weight value to a hex color. Mirrors WeightCanvas in JSX."""
    if max_abs < 1e-9:
        return "#1e1e1f"
    t = w_value / max_abs
    if t >= 0:
        # Warm — looks-like-8 region
        k = t
        R = round(20 + k * 235)
        G = round(20 + k * 90)
        B = round(30 + k * 70)
    else:
        # Cool — looks-like-1 region
        k = -t
        R = round(20 + k * 60)
        G = round(20 + k * 130)
        B = round(30 + k * 225)
    return f"#{R:02x}{G:02x}{B:02x}"


def make_weight_grid(snapshot, cell_size: float = 0.27) -> VGroup:
    w = snapshot["w"]
    max_abs = float(np.max(np.abs(w)) + 1e-9)
    cells = []
    for r in range(GRID):
        for c in range(GRID):
            i = r * GRID + c
            color = weight_color(float(w[i]), max_abs)
            sq = Square(side_length=cell_size, stroke_width=0)
            sq.set_fill(color, opacity=1.0)
            # Position: row 0 at top. Manim's y increases upward.
            sq.move_to(
                np.array(
                    [
                        (c - (GRID - 1) / 2) * cell_size,
                        ((GRID - 1) / 2 - r) * cell_size,
                        0.0,
                    ]
                )
            )
            cells.append(sq)
    return VGroup(*cells)


# ---------------------------------------------------------------------
#  Scene
# ---------------------------------------------------------------------
class PartIWeightEmergence(Scene):
    """Watch the thermal template emerge."""

    def construct(self):
        self.camera.background_color = BG

        snapshots = train_perceptron()

        # ===== Title =====
        title = Text("Weight Emergence", color=TEXT_C, font_size=44)
        subtitle = Text(
            "What does a single neuron learn to look for?",
            color=TEXT_DIM,
            font_size=22,
            slant="ITALIC",
        ).next_to(title, DOWN, buff=0.3)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(1.5)
        self.play(FadeOut(title), FadeOut(subtitle))

        # ===== Weight image =====
        grid = make_weight_grid(snapshots[0])
        step_label = Text(
            f"step {snapshots[0]['step']:>5}",
            color=TEXT_DIM,
            font_size=18,
        ).to_edge(DOWN, buff=0.6)

        self.play(FadeIn(grid, scale=0.95), Write(step_label), run_time=1.0)
        self.wait(0.4)

        # Animate the emergence — every other snapshot for tempo
        for snap in snapshots[1::2]:
            new_grid = make_weight_grid(snap)
            new_label = Text(
                f"step {snap['step']:>5}",
                color=TEXT_DIM,
                font_size=18,
            ).to_edge(DOWN, buff=0.6)
            self.play(
                Transform(grid, new_grid),
                Transform(step_label, new_label),
                run_time=0.16,
            )

        # Hold on the converged thermal template
        self.wait(0.8)

        caption = Text(
            "the thermal template",
            color=ACCENT,
            font_size=24,
            slant="ITALIC",
        ).to_edge(UP, buff=0.6)
        self.play(FadeIn(caption, shift=DOWN * 0.2), run_time=0.8)
        self.wait(2.5)
