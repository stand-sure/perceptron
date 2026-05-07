"""
Part II §3 — The Warp (Canonical)

A 2-2-1 sigmoid network learning XOR. Hand-picked seed for reliable
convergence. The animation shows the four XOR points morphing in the
hidden-layer representation space until they become linearly separable.

This is the canonical "successful warp" render — a self-paced reader
who hits a degenerate init in the live JSX still gets to see what they
were trying to see.

Render:
    uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -ql

For higher quality:
    uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -qh
"""

from __future__ import annotations

import numpy as np
from manim import (
    DOWN,
    LEFT,
    RIGHT,
    UP,
    Axes,
    Create,
    Dot,
    FadeIn,
    FadeOut,
    Line,
    Scene,
    Text,
    Transform,
    VGroup,
    Write,
)

# ---------------------------------------------------------------------
#  Palette — matches the JSX artifact aesthetic
# ---------------------------------------------------------------------
BG = "#0b0b0d"
SURFACE = "#15151a"
TEXT = "#f0e9d9"
TEXT_DIM = "#8a8478"
ACCENT = "#f5b041"
POS = "#f87171"  # XOR output 1 -> blue in JSX, but red reads better in Manim
NEG = "#60a5fa"  # XOR output 0
DECISION = "#ffffff"

# ---------------------------------------------------------------------
#  Network math (mirrors src/WallAndWarp.jsx)
# ---------------------------------------------------------------------


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))


def forward(x, W1, b1, W2, b2):
    z1 = W1 @ x + b1
    h = sigmoid(z1)
    z2 = W2 @ h + b2
    y = sigmoid(z2)
    return h, y


def train_xor(seed: int = 7, epochs: int = 8000, lr: float = 0.5):
    """Train a 2-2-1 sigmoid net on XOR with a fixed seed.

    Returns a list of snapshots — at log-spaced epochs so the early
    rapid learning is shown densely and the late refinement sparsely.
    """
    rng = np.random.default_rng(seed)
    scale = 1.5
    W1 = (rng.random((2, 2)) - 0.5) * 2 * scale
    b1 = (rng.random(2) - 0.5) * 2 * scale
    W2 = (rng.random(2) - 0.5) * 2 * scale
    b2 = float((rng.random() - 0.5) * 2 * scale)

    X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
    Y = np.array([0.0, 1.0, 1.0, 0.0])

    snapshot_epochs = sorted(
        set(
            list(range(0, 200, 5))
            + list(range(200, 1000, 25))
            + list(range(1000, epochs, 200))
            + [epochs - 1]
        )
    )

    snapshots = []
    for epoch in range(epochs):
        if epoch in snapshot_epochs:
            hidden_points = np.array(
                [forward(x, W1, b1, W2, b2)[0] for x in X]
            )
            snapshots.append(
                {
                    "epoch": epoch,
                    "hidden": hidden_points,
                    "W2": W2.copy(),
                    "b2": b2,
                }
            )

        gW1 = np.zeros_like(W1)
        gb1 = np.zeros_like(b1)
        gW2 = np.zeros_like(W2)
        gb2 = 0.0
        for x, y in zip(X, Y):
            h, yhat = forward(x, W1, b1, W2, b2)
            d_y = yhat - y
            gW2 += d_y * h
            gb2 += d_y
            d_h = d_y * W2 * h * (1 - h)
            gW1 += np.outer(d_h, x)
            gb1 += d_h
        W1 -= lr * gW1 / len(X)
        b1 -= lr * gb1 / len(X)
        W2 -= lr * gW2 / len(X)
        b2 -= lr * gb2 / len(X)

    return snapshots


# ---------------------------------------------------------------------
#  Visualization helpers
# ---------------------------------------------------------------------


def hidden_decision_endpoints(W2, b2, h_min=-0.1, h_max=1.1):
    """Find two endpoints of the line W2 . h + b2 = 0 inside the
    hidden-space viewport. Returns None if the line does not cross
    the viewport (shouldn't happen post-training).
    """
    w0, w1 = float(W2[0]), float(W2[1])
    pts = []
    if abs(w1) > 1e-9:
        for h0 in (h_min, h_max):
            h1 = -(w0 * h0 + b2) / w1
            if h_min - 0.5 <= h1 <= h_max + 0.5:
                pts.append((h0, h1))
    if abs(w0) > 1e-9:
        for h1 in (h_min, h_max):
            h0 = -(w1 * h1 + b2) / w0
            if h_min - 0.5 <= h0 <= h_max + 0.5:
                pts.append((h0, h1))
    if len(pts) < 2:
        return None
    return pts[0], pts[1]


# ---------------------------------------------------------------------
#  Scene
# ---------------------------------------------------------------------


class PartIIWarpCanonical(Scene):
    """The canonical successful warp: four XOR points migrating in
    hidden space until linearly separable."""

    def construct(self):
        self.camera.background_color = BG

        # --- Title --------------------------------------------------
        title = Text("The Warp", font="JetBrains Mono", color=TEXT, font_size=44)
        subtitle = Text(
            "A 2-2-1 sigmoid network learning XOR",
            font="Lora",
            color=TEXT_DIM,
            font_size=22,
            slant="ITALIC",
        ).next_to(title, DOWN, buff=0.3)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(1.5)
        self.play(FadeOut(title), FadeOut(subtitle))

        # --- Two coordinate planes ----------------------------------
        input_axes = Axes(
            x_range=[-0.2, 1.2, 1],
            y_range=[-0.2, 1.2, 1],
            x_length=4.5,
            y_length=4.5,
            tips=False,
            axis_config={"color": TEXT_DIM, "stroke_width": 1.5},
        ).to_edge(LEFT, buff=0.8)

        hidden_axes = Axes(
            x_range=[-0.2, 1.2, 1],
            y_range=[-0.2, 1.2, 1],
            x_length=4.5,
            y_length=4.5,
            tips=False,
            axis_config={"color": TEXT_DIM, "stroke_width": 1.5},
        ).to_edge(RIGHT, buff=0.8)

        input_label = Text(
            "input space", font="JetBrains Mono", color=ACCENT, font_size=18
        ).next_to(input_axes, UP, buff=0.2)
        hidden_label = Text(
            "hidden space", font="JetBrains Mono", color=ACCENT, font_size=18
        ).next_to(hidden_axes, UP, buff=0.2)

        self.play(
            Create(input_axes),
            Create(hidden_axes),
            Write(input_label),
            Write(hidden_label),
        )

        # --- XOR points in input space ------------------------------
        xor_inputs = [
            (np.array([0.0, 0.0]), NEG),
            (np.array([0.0, 1.0]), POS),
            (np.array([1.0, 0.0]), POS),
            (np.array([1.0, 1.0]), NEG),
        ]
        input_dots = VGroup(
            *[
                Dot(input_axes.c2p(x[0], x[1]), color=color, radius=0.1)
                for x, color in xor_inputs
            ]
        )
        self.play(*[FadeIn(d, scale=0.5) for d in input_dots])
        self.wait(0.5)

        # --- Train and animate the hidden-space migration -----------
        snapshots = train_xor()

        # Initial hidden-space dots
        initial_h = snapshots[0]["hidden"]
        hidden_dots = VGroup(
            *[
                Dot(hidden_axes.c2p(h[0], h[1]), color=color, radius=0.1)
                for h, (_, color) in zip(initial_h, xor_inputs)
            ]
        )
        self.play(
            *[FadeIn(d, scale=0.5) for d in hidden_dots],
            run_time=0.8,
        )

        # Initial decision line in hidden space
        endpoints = hidden_decision_endpoints(
            snapshots[0]["W2"], snapshots[0]["b2"]
        )
        if endpoints is not None:
            (a, b) = endpoints
            decision_line = Line(
                hidden_axes.c2p(a[0], a[1]),
                hidden_axes.c2p(b[0], b[1]),
                color=DECISION,
                stroke_width=2,
            )
            self.play(Create(decision_line), run_time=0.6)
        else:
            decision_line = Line(
                hidden_axes.c2p(-0.2, 0.5),
                hidden_axes.c2p(1.2, 0.5),
                color=DECISION,
                stroke_width=2,
            )
            self.add(decision_line)

        # Epoch counter
        epoch_text = Text(
            f"epoch {snapshots[0]['epoch']:>5}",
            font="JetBrains Mono",
            color=TEXT_DIM,
            font_size=16,
        ).to_edge(DOWN, buff=0.4)
        self.play(FadeIn(epoch_text), run_time=0.4)

        # --- Animate snapshot-by-snapshot ---------------------------
        # Group snapshots into batches so the animation has a sensible
        # tempo without being snapshot-per-second tedious.
        for i in range(1, len(snapshots), 2):
            snap = snapshots[i]
            new_dots = VGroup(
                *[
                    Dot(
                        hidden_axes.c2p(h[0], h[1]),
                        color=color,
                        radius=0.1,
                    )
                    for h, (_, color) in zip(snap["hidden"], xor_inputs)
                ]
            )
            new_endpoints = hidden_decision_endpoints(snap["W2"], snap["b2"])
            if new_endpoints is not None:
                (a, b) = new_endpoints
                new_line = Line(
                    hidden_axes.c2p(a[0], a[1]),
                    hidden_axes.c2p(b[0], b[1]),
                    color=DECISION,
                    stroke_width=2,
                )
            else:
                new_line = decision_line.copy()

            new_epoch_text = Text(
                f"epoch {snap['epoch']:>5}",
                font="JetBrains Mono",
                color=TEXT_DIM,
                font_size=16,
            ).to_edge(DOWN, buff=0.4)

            self.play(
                Transform(hidden_dots, new_dots),
                Transform(decision_line, new_line),
                Transform(epoch_text, new_epoch_text),
                run_time=0.15,
            )

        # --- Hold final frame ---------------------------------------
        final_caption = Text(
            "linearly separable in hidden space",
            font="Lora",
            color=ACCENT,
            font_size=22,
            slant="ITALIC",
        ).next_to(hidden_axes, DOWN, buff=0.6)
        self.play(FadeIn(final_caption, shift=UP * 0.2), run_time=0.8)
        self.wait(3)
