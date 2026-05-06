import { Link } from 'react-router-dom';

const C = {
  bg: '#0b0b0d',
  surface: '#15151a',
  border: '#2a2a32',
  text: '#f0e9d9',
  textDim: '#8a8478',
  textFaint: '#5a564f',
  accent: '#f5b041',
};
const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Lora', Georgia, serif";

function PartCard({ to, num, title, sub, body }) {
  return (
    <Link
      to={to}
      className="block p-6 transition-colors group"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        textDecoration: 'none',
      }}
    >
      <div
        className="text-[11px] tracking-[0.25em] uppercase mb-3"
        style={{ color: C.accent, fontFamily: MONO }}
      >
        Part {num}
      </div>
      <div
        className="text-2xl mb-2 transition-colors"
        style={{ color: C.text, fontFamily: MONO, fontWeight: 500 }}
      >
        {title}
      </div>
      <div
        className="text-sm mb-4 italic"
        style={{ color: C.textDim }}
      >
        {sub}
      </div>
      <div className="text-sm leading-relaxed" style={{ color: C.textDim }}>
        {body}
      </div>
      <div
        className="mt-5 text-xs tracking-[0.2em] uppercase"
        style={{ color: C.accent, fontFamily: MONO }}
      >
        open →
      </div>
    </Link>
  );
}

export default function IndexPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: C.bg, color: C.text, fontFamily: SERIF }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
      `}</style>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <div
          className="text-[11px] tracking-[0.3em] uppercase mb-6"
          style={{ color: C.accent, fontFamily: MONO }}
        >
          4FF · A Field Manual
        </div>
        <h1
          className="text-4xl md:text-6xl leading-[1.05] mb-6"
          style={{
            fontFamily: MONO,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          Perceptrons &amp;<br />
          <span style={{ color: C.accent }}>Backpropagation.</span>
        </h1>
        <p
          className="text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
          style={{ color: C.textDim, fontStyle: 'italic' }}
        >
          Two interactive teaching artifacts for engineers who don't blindly
          trust ML systems. Trained from scratch in your browser. Visible at
          every layer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <PartCard
            to="/part-1"
            num="01"
            title="Anatomy of a Perceptron."
            sub="One neuron. One decision. No magic."
            body="A single-layer perceptron classifying procedurally-generated 1s from 8s, with live training, weight visualization, per-pixel contribution heatmap, and a draw-your-own canvas."
          />
          <PartCard
            to="/part-2"
            num="02"
            title="The Wall and the Warp."
            sub="Why XOR breaks the perceptron, and how backprop fixes it."
            body="Interactive XOR geometry, the seventeen-year detour from Minsky to Rumelhart, a 2-2-1 sigmoid net trained live, and a visualization of the hidden layer bending input space until XOR becomes linearly separable."
          />
        </div>

        <div
          className="p-5 text-sm leading-relaxed"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderLeft: `2px solid ${C.accent}`,
            color: C.textDim,
          }}
        >
          <div
            className="text-[10px] tracking-[0.25em] uppercase mb-2"
            style={{ color: C.textFaint, fontFamily: MONO }}
          >
            How this was made
          </div>
          End-state description and pedagogical arc by Chris Anderson. Code
          attributable to Claude (Anthropic, Opus 4.7), generated across
          several sessions in May 2026. Part of the 4FF engineering
          development program. Reproduction prompts available in the repo's
          PROMPT.md.
        </div>

        <div
          className="mt-14 pt-6 text-xs flex items-center justify-between"
          style={{
            borderTop: `1px solid ${C.border}`,
            color: C.textFaint,
            fontFamily: MONO,
          }}
        >
          <span>4ff · field manual</span>
          <span>MIT licensed · source on GitHub</span>
        </div>
      </div>
    </div>
  );
}
