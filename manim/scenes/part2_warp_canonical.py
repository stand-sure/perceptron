"""
Part II §3 — The Warp (Canonical)

Two views of the same 2-2-1 sigmoid network learning XOR. The math is
computed once; both visualizations animate off the same training
trajectory so what you see in one is consistent with what you see in
the other.

  1. Warped grid (top-down, 2D)
       The input plane (uniform grid) deforming as it gets mapped to
       the hidden layer via h = sigmoid(W1·x + b1). For our N=2 hidden
       layer this IS the N-dimensional hidden representation, directly
       visualizable because N happens to equal 2. Larger N would need
       a 2D projection (PCA, t-SNE, or a 2D bottleneck) to view this.

  2. Bent sheet (3D)
       The output decision surface y(x1, x2) above the input plane.
       Starts as a near-flat sigmoidal ramp; deforms into a saddle
       that picks out XOR. A π/2 camera rotation at the end confirms
       the curvature from the side — the moment the lecture's "bent
       sheet" framing is supposed to land.

Render:
    uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -ql
For higher quality:
    uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -qh
"""

from __future__ import annotations

import numpy as np
from manim import (
    DEGREES,
    DOWN,
    LEFT,
    UP,
    Create,
    Dot3D,
    FadeIn,
    FadeOut,
    ParametricFunction,
    Surface,
    ThreeDAxes,
    ThreeDScene,
    Text,
    Transform,
    VGroup,
    Write,
)

# ---------------------------------------------------------------------
#  Aesthetic constants (matching the JSX artifact)
# ---------------------------------------------------------------------
BG = "#0b0b0d"
TEXT_C = "#f0e9d9"
TEXT_DIM = "#8a8478"
ACCENT = "#f5b041"
POS = "#f87171"
NEG = "#60a5fa"
GRID_C = "#5a564f"
SHEET_LO = "#1e3a5f"
SHEET_HI = "#7a2a2a"


# ---------------------------------------------------------------------
#  Network math — mirrors src/WallAndWarp.jsx
# ---------------------------------------------------------------------
def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))


def forward(x, W1, b1, W2, b2):
    z1 = W1 @ x + b1
    h = sigmoid(z1)
    z2 = W2 @ h + b2
    y = sigmoid(z2)
    return h, y


def network_output(x1, x2, W1, b1, W2, b2):
    """Scalar y(x1, x2) — used for the bent-sheet surface."""
    z1 = W1 @ np.array([x1, x2]) + b1
    h = sigmoid(z1)
    z2 = W2 @ h + b2
    return float(sigmoid(z2))


def hidden_map(x1, x2, W1, b1):
    """Return (h1, h2) — the 2D hidden representation. Used for the grid."""
    z = W1 @ np.array([x1, x2]) + b1
    return sigmoid(z)


def train_xor(seed: int = 7, epochs: int = 8000, lr: float = 0.5):
    rng = np.random.default_rng(seed)
    scale = 1.5
    W1 = (rng.random((2, 2)) - 0.5) * 2 * scale
    b1 = (rng.random(2) - 0.5) * 2 * scale
    W2 = (rng.random(2) - 0.5) * 2 * scale
    b2 = float((rng.random() - 0.5) * 2 * scale)

    X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
    Y = np.array([0.0, 1.0, 1.0, 0.0])

    # Sparser snapshot schedule than the prior version — enough to convey
    # trajectory, not so many that each transition is sub-frame.
    snapshot_epochs = sorted(
        set(
            list(range(0, 100, 10))
            + list(range(100, 500, 50))
            + list(range(500, 2000, 200))
            + list(range(2000, epochs, 1000))
            + [epochs - 1]
        )
    )

    snapshots = []
    for epoch in range(epochs):
        if epoch in snapshot_epochs:
            snapshots.append(
                {
                    "epoch": epoch,
                    "W1": W1.copy(),
                    "b1": b1.copy(),
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
def make_warped_grid(snapshot, axes, n_lines: int = 11, n_samples: int = 25):
    """Uniform input grid mapped through the hidden layer to its warped
    configuration. Returns a VGroup of ParametricFunctions on the z=0 plane."""
    W1, b1 = snapshot["W1"], snapshot["b1"]
    step = 1.0 / (n_samples - 1)
    lines = []

    # Horizontal lines (constant x2, x1 sweeps 0..1)
    for i in range(n_lines):
        x2 = i / (n_lines - 1)

        def make_h(x2_=x2):
            def f(t):
                h = hidden_map(t, x2_, W1, b1)
                return axes.c2p(h[0], h[1], 0.0)
            return f

        lines.append(
            ParametricFunction(
                make_h(),
                t_range=[0.0, 1.0, step],
                stroke_width=1.5,
                color=GRID_C,
            )
        )

    # Vertical lines (constant x1, x2 sweeps 0..1)
    for i in range(n_lines):
        x1 = i / (n_lines - 1)

        def make_v(x1_=x1):
            def f(t):
                h = hidden_map(x1_, t, W1, b1)
                return axes.c2p(h[0], h[1], 0.0)
            return f

        lines.append(
            ParametricFunction(
                make_v(),
                t_range=[0.0, 1.0, step],
                stroke_width=1.5,
                color=GRID_C,
            )
        )

    return VGroup(*lines)


def make_xor_dots_in_hidden(snapshot, axes):
    """Four XOR points placed at their hidden-space coordinates."""
    W1, b1 = snapshot["W1"], snapshot["b1"]
    pts = [
        (np.array([0.0, 0.0]), NEG),
        (np.array([0.0, 1.0]), POS),
        (np.array([1.0, 0.0]), POS),
        (np.array([1.0, 1.0]), NEG),
    ]
    dots = []
    for x, color in pts:
        h = hidden_map(x[0], x[1], W1, b1)
        dots.append(
            Dot3D(point=axes.c2p(h[0], h[1], 0.0), color=color, radius=0.08)
        )
    return VGroup(*dots)


def make_output_surface(snapshot, axes, resolution=(28, 28)):
    """y = network(x1, x2) over the unit square — the bent sheet."""
    W1, b1, W2, b2 = (
        snapshot["W1"],
        snapshot["b1"],
        snapshot["W2"],
        snapshot["b2"],
    )

    def y_fn(u, v):
        return network_output(u, v, W1, b1, W2, b2)

    return Surface(
        lambda u, v: axes.c2p(u, v, y_fn(u, v)),
        u_range=[0.0, 1.0],
        v_range=[0.0, 1.0],
        resolution=resolution,
        stroke_width=0.5,
        fill_opacity=0.65,
        checkerboard_colors=[SHEET_LO, SHEET_HI],
    )


# ---------------------------------------------------------------------
#  Scene
# ---------------------------------------------------------------------
class PartIIWarpCanonical(ThreeDScene):
    def construct(self):
        self.camera.background_color = BG

        # One training run drives both phases
        snapshots = train_xor()
        first, last = snapshots[0], snapshots[-1]

        # ==========================================================
        #  Title
        # ==========================================================
        title = Text("The Warp", color=TEXT_C, font_size=44)
        subtitle = Text(
            "A 2-2-1 sigmoid network learning XOR",
            color=TEXT_DIM,
            font_size=22,
            slant="ITALIC",
        ).next_to(title, DOWN, buff=0.3)
        self.add_fixed_in_frame_mobjects(title, subtitle)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(1.5)
        self.play(FadeOut(title), FadeOut(subtitle))

        # ==========================================================
        #  Phase 1 — Warped grid (top-down 2D)
        # ==========================================================
        # Camera looking straight down at the xy plane
        self.set_camera_orientation(phi=0 * DEGREES, theta=-90 * DEGREES)

        axes_top = ThreeDAxes(
            x_range=[-0.05, 1.05, 0.5],
            y_range=[-0.05, 1.05, 0.5],
            z_range=[0, 1.05, 0.5],
            x_length=5.5,
            y_length=5.5,
            z_length=3.0,
        )

        phase1_label = Text(
            "hidden representation  h ∈ R^2",
            color=ACCENT,
            font_size=22,
        ).to_edge(UP, buff=0.5)
        self.add_fixed_in_frame_mobjects(phase1_label)
        self.play(Write(phase1_label), run_time=0.6)

        grid = make_warped_grid(first, axes_top)
        dots = make_xor_dots_in_hidden(first, axes_top)
        self.play(Create(grid, lag_ratio=0.04), run_time=1.5)
        self.play(*[FadeIn(d, scale=0.5) for d in dots], run_time=0.8)

        # Animate the warp — every other snapshot for tempo
        for snap in snapshots[1::2]:
            new_grid = make_warped_grid(snap, axes_top)
            new_dots = make_xor_dots_in_hidden(snap, axes_top)
            self.play(
                Transform(grid, new_grid),
                Transform(dots, new_dots),
                run_time=0.18,
            )

        # Hold on the warped end-state briefly
        self.wait(1.0)
        self.play(
            FadeOut(grid),
            FadeOut(dots),
            FadeOut(phase1_label),
            run_time=0.8,
        )

        # ==========================================================
        #  Phase 2 — Bent sheet (3D)
        # ==========================================================
        phase2_label = Text(
            "output decision surface  y(x_1, x_2)",
            color=ACCENT,
            font_size=22,
        ).to_edge(UP, buff=0.5)
        self.add_fixed_in_frame_mobjects(phase2_label)
        self.play(Write(phase2_label), run_time=0.6)

        # Tilt camera into 3D
        self.move_camera(
            phi=65 * DEGREES,
            theta=-60 * DEGREES,
            run_time=1.4,
        )

        axes_3d = ThreeDAxes(
            x_range=[-0.05, 1.05, 0.5],
            y_range=[-0.05, 1.05, 0.5],
            z_range=[0, 1.05, 0.5],
            x_length=4.5,
            y_length=4.5,
            z_length=3.0,
        )
        self.play(Create(axes_3d), run_time=1.0)

        # XOR points on the floor (input plane)
        floor_pts = [
            (np.array([0.0, 0.0]), NEG),
            (np.array([0.0, 1.0]), POS),
            (np.array([1.0, 0.0]), POS),
            (np.array([1.0, 1.0]), NEG),
        ]
        floor_dots = VGroup(
            *[
                Dot3D(point=axes_3d.c2p(pt[0], pt[1], 0.0), color=color, radius=0.08)
                for pt, color in floor_pts
            ]
        )
        self.play(*[FadeIn(d, scale=0.5) for d in floor_dots], run_time=0.6)

        # Initial sheet
        sheet = make_output_surface(first, axes_3d)
        self.play(Create(sheet), run_time=1.5)

        # Animate the deformation — every third snapshot, surfaces are heavier
        for snap in snapshots[1::3]:
            new_sheet = make_output_surface(snap, axes_3d)
            self.play(Transform(sheet, new_sheet), run_time=0.22)

        self.wait(0.6)

        # The π/2 rotation — reveal the curvature from the side
        self.move_camera(
            phi=90 * DEGREES,
            theta=-90 * DEGREES,
            run_time=2.5,
        )
        self.wait(1.5)

        # Final caption
        caption = Text(
            "the bent sheet",
            color=ACCENT,
            font_size=24,
            slant="ITALIC",
        ).to_edge(DOWN, buff=0.6)
        self.add_fixed_in_frame_mobjects(caption)
        self.play(FadeIn(caption, shift=UP * 0.2), run_time=0.8)
        self.wait(2.5)
