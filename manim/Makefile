.PHONY: help sync fix-pycairo render render-hd preview clean

help:
	@echo "Available targets:"
	@echo "  sync         uv sync + fix-pycairo (use this instead of bare 'uv sync')"
	@echo "  fix-pycairo  overlay brew's py3cairo arm64 build into the venv (macOS arm64 only)"
	@echo "  render       render every scene at low quality (480p15)"
	@echo "  render-hd    render every scene at high quality (1080p60)"
	@echo "  preview      render and play the canonical warp scene"
	@echo "  clean        remove media/ working directory (keeps renders/)"

sync:
	uv sync
	./scripts/fix-pycairo.sh

fix-pycairo:
	./scripts/fix-pycairo.sh

render:
	uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -ql

render-hd:
	uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -qh

preview:
	uv run manim render scenes/part2_warp_canonical.py PartIIWarpCanonical -ql -p

clean:
	rm -rf media/
