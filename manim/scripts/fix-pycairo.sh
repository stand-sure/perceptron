#!/usr/bin/env bash
#
# Workaround for the broken pycairo wheel on macOS arm64 (PyPI pycairo 1.29.0).
#
# The published wheel carries the arm64 platform tag but ships an x86_64
# `_cairo.cpython-*-darwin.so`, and source-building from the upstream sdist
# also produces a non-functional binary on Apple Silicon (the resulting `.so`
# is x86_64 and is not even linked against libcairo). This script overlays
# Homebrew's working `py3cairo` build into the venv.
#
# Prerequisites:
#   brew install py3cairo
#
# Usage:
#   ./scripts/fix-pycairo.sh        # run from the manim/ directory
#   make sync                       # combined uv sync + fix
#
# Re-run after every `uv sync` — uv will reinstall the broken wheel.

set -euo pipefail

if [[ "$(uname)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "fix-pycairo.sh: not on macOS arm64; nothing to do."
  exit 0
fi

if [[ ! -d .venv ]]; then
  echo "fix-pycairo.sh: .venv not found. Run \`uv sync\` first." >&2
  exit 1
fi

PY_VERSION="$(.venv/bin/python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
PY_TAG="${PY_VERSION//./}"

BREW_SO="/opt/homebrew/lib/python${PY_VERSION}/site-packages/cairo/_cairo.cpython-${PY_TAG}-darwin.so"
VENV_SO=".venv/lib/python${PY_VERSION}/site-packages/cairo/_cairo.cpython-${PY_TAG}-darwin.so"

if [[ ! -f "$BREW_SO" ]]; then
  echo "fix-pycairo.sh: brew py3cairo not found at $BREW_SO" >&2
  echo "Install it with: brew install py3cairo" >&2
  exit 1
fi

if [[ ! -f "$VENV_SO" ]]; then
  echo "fix-pycairo.sh: venv pycairo not found at $VENV_SO" >&2
  echo "Run \`uv sync\` first to install pycairo, then re-run this." >&2
  exit 1
fi

CURRENT_ARCH="$(lipo -archs "$VENV_SO" 2>/dev/null || echo unknown)"
if [[ "$CURRENT_ARCH" == "arm64" ]]; then
  echo "fix-pycairo.sh: venv pycairo is already arm64; nothing to do."
  exit 0
fi

cp "$BREW_SO" "$VENV_SO"
NEW_ARCH="$(lipo -archs "$VENV_SO")"
echo "fix-pycairo.sh: replaced venv pycairo with brew's build (arch: $NEW_ARCH)."
