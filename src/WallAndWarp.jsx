import { useState, useEffect, useRef, useCallback } from "react";

// =====================================================================
//  THE WALL AND THE WARP
//  Part II of a field manual for engineers who don't blindly trust.
//  Why a single neuron cannot learn XOR, the 17-year detour that
//  followed, and why one continuously-differentiable function broke
//  modern AI free.
// =====================================================================

const C = {
  bg: "#0b0b0d",
  surface: "#15151a",
  surfaceAlt: "#1c1c22",
  border: "#2a2a32",
  text: "#f0e9d9",
  textDim: "#8a8478",
  textFaint: "#5a564f",
  accent: "#f5b041",
  pos: "#f87171",
  neg: "#60a5fa",
  ok: "#84cc16",
  err: "#ef4444",
  posSoft: "rgba(248,113,113,0.15)",
  negSoft: "rgba(96,165,250,0.15)",
};

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Lora', Georgia, serif";

// ---------------------------------------------------------------------
//  Math
// ---------------------------------------------------------------------
function sigmoid(z) {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}
function sigmoidPrime(z) {
  const s = sigmoid(z);
  return s * (1 - s);
}
function step(z) { return z >= 0 ? 1 : 0; }
function stepPrime(z) { return z === 0 ? NaN : 0; }
function relu(z) { return z > 0 ? z : 0; }
function reluPrime(z) { return z > 0 ? 1 : 0; }

function clip(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// ---------------------------------------------------------------------
//  Tiny 2-2-1 sigmoid network for XOR  (plain JS, no abstractions)
// ---------------------------------------------------------------------
function initNet(scale = 1.5) {
  return {
    W1: [
      [(Math.random() - 0.5) * 2 * scale, (Math.random() - 0.5) * 2 * scale],
      [(Math.random() - 0.5) * 2 * scale, (Math.random() - 0.5) * 2 * scale],
    ],
    b1: [(Math.random() - 0.5) * 2 * scale, (Math.random() - 0.5) * 2 * scale],
    W2: [(Math.random() - 0.5) * 2 * scale, (Math.random() - 0.5) * 2 * scale],
    b2: (Math.random() - 0.5) * 2 * scale,
  };
}

function netForward(x, n) {
  const z1 = [
    n.W1[0][0] * x[0] + n.W1[0][1] * x[1] + n.b1[0],
    n.W1[1][0] * x[0] + n.W1[1][1] * x[1] + n.b1[1],
  ];
  const h = [sigmoid(z1[0]), sigmoid(z1[1])];
  const z2 = n.W2[0] * h[0] + n.W2[1] * h[1] + n.b2;
  const yHat = sigmoid(z2);
  return { z1, h, z2, yHat };
}

function netTrainStep(x, y, n, lr) {
  const { h, yHat } = netForward(x, n);
  const dz2 = yHat - y;
  const dW2 = [dz2 * h[0], dz2 * h[1]];
  const db2 = dz2;
  const dh = [dz2 * n.W2[0], dz2 * n.W2[1]];
  const dz1 = [dh[0] * h[0] * (1 - h[0]), dh[1] * h[1] * (1 - h[1])];
  const dW1 = [
    [dz1[0] * x[0], dz1[0] * x[1]],
    [dz1[1] * x[0], dz1[1] * x[1]],
  ];
  const db1 = [dz1[0], dz1[1]];
  n.W1[0][0] -= lr * dW1[0][0]; n.W1[0][1] -= lr * dW1[0][1];
  n.W1[1][0] -= lr * dW1[1][0]; n.W1[1][1] -= lr * dW1[1][1];
  n.b1[0] -= lr * db1[0]; n.b1[1] -= lr * db1[1];
  n.W2[0] -= lr * dW2[0]; n.W2[1] -= lr * dW2[1];
  n.b2 -= lr * db2;
  const eps = 1e-7;
  const loss = -(y * Math.log(yHat + eps) + (1 - y) * Math.log(1 - yHat + eps));
  return loss;
}

const XOR_DATA = [
  { x: [0, 0], y: 0 },
  { x: [0, 1], y: 1 },
  { x: [1, 0], y: 1 },
  { x: [1, 1], y: 0 },
];

// ---------------------------------------------------------------------
//  Atomic UI
// ---------------------------------------------------------------------
function SectionLabel({ num, children }) {
  return (
    <div className="flex items-baseline gap-3 mb-6">
      <span className="text-xs tracking-[0.25em] uppercase"
        style={{ color: C.accent, fontFamily: MONO }}>
        §{num}
      </span>
      <h2 className="text-2xl tracking-tight"
        style={{ color: C.text, fontFamily: MONO, fontWeight: 500 }}>
        {children}
      </h2>
    </div>
  );
}

function Panel({ title, children, className = "", noPad = false }) {
  return (
    <div className={`${noPad ? "" : "p-5"} ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {title && (
        <div className={`text-[11px] tracking-[0.2em] uppercase mb-4 ${noPad ? "p-5 pb-0" : ""}`}
          style={{ color: C.textDim, fontFamily: MONO }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Btn({ children, onClick, primary = false, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm tracking-wide ${className}`}
      style={{
        fontFamily: MONO,
        background: primary ? C.accent : "transparent",
        color: primary ? C.bg : C.text,
        border: `1px solid ${primary ? C.accent : C.border}`,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, color = C.text }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] uppercase mb-1"
        style={{ color: C.textFaint, fontFamily: MONO }}>{label}</div>
      <div className="text-base" style={{ color, fontFamily: MONO }}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  ActivationPlot (used in §4, §5, §7)
// ---------------------------------------------------------------------
function ActivationPlot({ fn, deriv, label, derivLabel, xRange = [-5, 5], yRange = [-0.3, 1.3] }) {
  const W = 240, H = 150, M = 22;
  const innerW = W - 2 * M, innerH = H - 2 * M;
  const xToS = (x) => M + ((x - xRange[0]) / (xRange[1] - xRange[0])) * innerW;
  const yToS = (y) => H - M - ((y - yRange[0]) / (yRange[1] - yRange[0])) * innerH;

  const samples = 200;
  const fnPath = [];
  const derivPath = [];
  for (let i = 0; i <= samples; i++) {
    const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
    const yf = fn(x);
    fnPath.push(`${i === 0 ? "M" : "L"} ${xToS(x).toFixed(2)} ${yToS(yf).toFixed(2)}`);
    const yd = deriv(x);
    if (Number.isFinite(yd)) {
      derivPath.push(`${derivPath.length === 0 ? "M" : "L"} ${xToS(x).toFixed(2)} ${yToS(yd).toFixed(2)}`);
    } else {
      derivPath.push(`M ${xToS(x).toFixed(2)} ${yToS(0).toFixed(2)}`);
    }
  }
  const x0 = xToS(0), y0 = yToS(0);
  const y1 = yToS(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 320 }}>
      {/* axes */}
      <line x1={M} y1={y0} x2={W - M} y2={y0} stroke={C.border} strokeWidth={0.6} />
      <line x1={x0} y1={M - 4} x2={x0} y2={H - M + 4} stroke={C.border} strokeWidth={0.6} />
      {/* y=1 reference */}
      <line x1={M} y1={y1} x2={W - M} y2={y1} stroke={C.border} strokeWidth={0.4} strokeDasharray="2 3" />
      <text x={M - 4} y={y1 + 3} fontSize={9} textAnchor="end"
        fill={C.textFaint} fontFamily={MONO}>1</text>
      <text x={M - 4} y={y0 + 3} fontSize={9} textAnchor="end"
        fill={C.textFaint} fontFamily={MONO}>0</text>
      {/* derivative (drawn first, behind) */}
      <path d={derivPath.join(" ")} fill="none" stroke={C.accent} strokeWidth={1.3}
        strokeDasharray="3 3" opacity={0.85} />
      {/* function */}
      <path d={fnPath.join(" ")} fill="none" stroke={C.text} strokeWidth={1.6} />
      {/* labels */}
      <g fontFamily={MONO} fontSize={10}>
        <rect x={W - M - 96} y={M - 4} width={96} height={32} fill={C.surface}
          stroke={C.border} strokeWidth={0.5} />
        <line x1={W - M - 88} y1={M + 4} x2={W - M - 72} y2={M + 4}
          stroke={C.text} strokeWidth={1.6} />
        <text x={W - M - 66} y={M + 7} fill={C.text}>{label}</text>
        <line x1={W - M - 88} y1={M + 18} x2={W - M - 72} y2={M + 18}
          stroke={C.accent} strokeWidth={1.3} strokeDasharray="3 3" />
        <text x={W - M - 66} y={M + 21} fill={C.accent}>{derivLabel}</text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------
//  §1  XOR Demo — interactive draggable line over 2D plot
// ---------------------------------------------------------------------
const LOGIC = {
  and: { label: "AND", points: { "00": 0, "01": 0, "10": 0, "11": 1 } },
  or:  { label: "OR",  points: { "00": 0, "01": 1, "10": 1, "11": 1 } },
  xor: { label: "XOR", points: { "00": 0, "01": 1, "10": 1, "11": 0 } },
};

function XORDemo() {
  const [logic, setLogic] = useState("xor");
  const [p1, setP1] = useState({ x: 0.0, y: 0.85 });
  const [p2, setP2] = useState({ x: 1.0, y: 0.15 });
  const dragging = useRef(null);
  const svgRef = useRef(null);

  const W = 360, H = 360, M = 38;
  const innerW = W - 2 * M, innerH = H - 2 * M;
  const PAD = 0.18; // world coords: extend below 0 / above 1 for breathing room
  const xToS = (x) => M + ((x + PAD) / (1 + 2 * PAD)) * innerW;
  const yToS = (y) => H - M - ((y + PAD) / (1 + 2 * PAD)) * innerH;
  const sToWorld = (sx, sy) => ({
    x: ((sx - M) / innerW) * (1 + 2 * PAD) - PAD,
    y: ((H - M - sy) / innerH) * (1 + 2 * PAD) - PAD,
  });

  const points = [
    { key: "00", x: 0, y: 0 },
    { key: "10", x: 1, y: 0 },
    { key: "01", x: 0, y: 1 },
    { key: "11", x: 1, y: 1 },
  ].map((p) => ({ ...p, label: LOGIC[logic].points[p.key] }));

  // which side of line: sign of cross product of (p2-p1) and (p-p1)
  const sideOf = (p) => {
    const cross = (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x);
    return cross > 0 ? 1 : 0;
  };
  const isCorrect = (p) => sideOf(p) === p.label;
  const errors = points.filter((p) => !isCorrect(p)).length;

  // Extend line to cross the full plot extents so it looks like an infinite separator
  const extendLine = () => {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6)
      return [{ x: -PAD, y: 0.5 }, { x: 1 + PAD, y: 0.5 }];
    const tMin = -10, tMax = 10;
    return [
      { x: p1.x + dx * tMin, y: p1.y + dy * tMin },
      { x: p1.x + dx * tMax, y: p1.y + dy * tMax },
    ];
  };
  const [eA, eB] = extendLine();

  const onPointerDown = (which) => (e) => {
    dragging.current = which;
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    const w = sToWorld(sx, sy);
    const cw = { x: clip(w.x, -PAD, 1 + PAD), y: clip(w.y, -PAD, 1 + PAD) };
    if (dragging.current === "p1") setP1(cw);
    else if (dragging.current === "p2") setP2(cw);
  };
  const onPointerUp = () => { dragging.current = null; };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Panel title="Pick a function" className="lg:col-span-1">
        <div className="space-y-2.5">
          {Object.entries(LOGIC).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setLogic(k)}
              className="w-full text-left py-2.5 px-3 text-sm transition-colors"
              style={{
                fontFamily: MONO,
                background: logic === k ? C.surfaceAlt : "transparent",
                color: logic === k ? C.text : C.textDim,
                border: `1px solid ${logic === k ? C.accent : C.border}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span>{v.label}</span>
                <span className="text-xs" style={{ color: C.textFaint }}>
                  {k === "xor" ? "the wall" : "linearly separable"}
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-sm mt-5 leading-relaxed" style={{ color: C.textDim }}>
          A perceptron can only draw a <em>straight line</em> between classes.
          Drag the white handles to try. AND and OR will give in. XOR will not.
        </p>
        <div className="mt-5 pt-4 grid grid-cols-2 gap-4"
          style={{ borderTop: `1px solid ${C.border}` }}>
          <Stat label="errors" value={`${errors} / 4`}
            color={errors === 0 ? C.ok : C.err} />
          <Stat label="line"
            value={`${(p2.y - p1.y).toFixed(2)},${(p1.x - p2.x).toFixed(2)}`} />
        </div>
      </Panel>

      <Panel title={`${LOGIC[logic].label}  ·  drag the handles`}
        className="lg:col-span-2">
        <div className="flex justify-center">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full select-none touch-none"
            style={{ maxWidth: 480 }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {/* plot area */}
            <rect x={M} y={M} width={innerW} height={innerH}
              fill={C.bg} stroke={C.border} strokeWidth={0.6} />

            {/* unit grid */}
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line x1={xToS(t)} y1={M} x2={xToS(t)} y2={H - M}
                  stroke={C.border} strokeWidth={0.4} strokeDasharray="2 4" />
                <line x1={M} y1={yToS(t)} x2={W - M} y2={yToS(t)}
                  stroke={C.border} strokeWidth={0.4} strokeDasharray="2 4" />
              </g>
            ))}

            {/* axis labels */}
            <text x={xToS(0) - 6} y={yToS(0) + 14} fontSize={10}
              textAnchor="end" fill={C.textFaint} fontFamily={MONO}>0</text>
            <text x={xToS(1) + 6} y={yToS(0) + 14} fontSize={10}
              fill={C.textFaint} fontFamily={MONO}>1</text>
            <text x={xToS(0) - 8} y={yToS(1) + 4} fontSize={10}
              textAnchor="end" fill={C.textFaint} fontFamily={MONO}>1</text>
            <text x={xToS(0.5)} y={H - 8} fontSize={10}
              textAnchor="middle" fill={C.textFaint} fontFamily={MONO}>x₁</text>
            <text x={14} y={yToS(0.5)} fontSize={10}
              fill={C.textFaint} fontFamily={MONO}>x₂</text>

            {/* the line */}
            <line x1={xToS(eA.x)} y1={yToS(eA.y)} x2={xToS(eB.x)} y2={yToS(eB.y)}
              stroke={C.accent} strokeWidth={1.4} opacity={0.9} />

            {/* data points */}
            {points.map((p) => {
              const correct = isCorrect(p);
              const truthColor = p.label === 1 ? C.pos : C.neg;
              return (
                <g key={p.key}>
                  <circle cx={xToS(p.x)} cy={yToS(p.y)} r={11}
                    fill={truthColor}
                    stroke={correct ? truthColor : C.err}
                    strokeWidth={correct ? 0 : 3} />
                  <text x={xToS(p.x)} y={yToS(p.y) + 3.5} fontSize={11}
                    textAnchor="middle" fill={C.bg}
                    fontFamily={MONO} fontWeight={600}>
                    {p.label}
                  </text>
                </g>
              );
            })}

            {/* drag handles */}
            {[{ p: p1, key: "p1" }, { p: p2, key: "p2" }].map(({ p, key }) => (
              <g key={key}>
                <circle cx={xToS(p.x)} cy={yToS(p.y)} r={9}
                  fill={C.surfaceAlt} stroke={C.text} strokeWidth={1.3}
                  style={{ cursor: "grab" }}
                  onPointerDown={onPointerDown(key)} />
                <circle cx={xToS(p.x)} cy={yToS(p.y)} r={2.5}
                  fill={C.text} pointerEvents="none" />
              </g>
            ))}
          </svg>
        </div>
        <p className="text-xs mt-3 italic text-center"
          style={{ color: C.textFaint }}>
          Solid color = ground truth. Red ring = misclassified by the line.
        </p>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------
//  §2  Timeline
// ---------------------------------------------------------------------
function Timeline() {
  const events = [
    { y: 1943, t: "McCulloch & Pitts",
      d: "First mathematical model of an artificial neuron — a thresholded weighted sum. The whole idea begins here.",
      kind: "build" },
    { y: 1958, t: "Rosenblatt's Perceptron",
      d: "A single-layer trainable classifier, demonstrated on a 400-pixel image grid. Triggers the first wave of AI optimism.",
      kind: "build" },
    { y: 1969, t: "Minsky & Papert · Perceptrons",
      d: "Mathematically demolish the single-layer perceptron using the XOR argument. Funding evaporates. The first AI winter sets in.",
      kind: "wall" },
    { y: 1970, t: "Linnainmaa's master's thesis",
      d: "Reverse-mode automatic differentiation, in Helsinki, in Finnish. Backprop is sitting on a shelf. Nobody connects the dots.",
      kind: "ghost" },
    { y: 1974, t: "Werbos · PhD thesis",
      d: "Applies the same idea to neural networks. Largely ignored. The math is there. The compute and the audience are not.",
      kind: "ghost" },
    { y: 1986, t: "Rumelhart, Hinton & Williams · Nature",
      d: "Backpropagation is rediscovered, named, and finally lands. Multilayer networks become trainable. The wall comes down.",
      kind: "key" },
  ];

  const yMin = 1940, yMax = 1990;
  const W = 800, H = 200;
  const M = { l: 60, r: 30, t: 30, b: 50 };
  const innerW = W - M.l - M.r;
  const xToS = (y) => M.l + ((y - yMin) / (yMax - yMin)) * innerW;

  const colorFor = (kind) =>
    kind === "wall" ? C.err :
    kind === "key" ? C.ok :
    kind === "ghost" ? C.textFaint :
    C.accent;

  return (
    <div>
      <Panel>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* axis */}
          <line x1={M.l} y1={H - M.b} x2={W - M.r} y2={H - M.b}
            stroke={C.border} strokeWidth={0.8} />
          {/* decade ticks */}
          {[1940, 1950, 1960, 1970, 1980, 1990].map((d) => (
            <g key={d}>
              <line x1={xToS(d)} y1={H - M.b} x2={xToS(d)} y2={H - M.b + 5}
                stroke={C.border} />
              <text x={xToS(d)} y={H - M.b + 18} fontSize={10}
                textAnchor="middle" fill={C.textFaint} fontFamily={MONO}>
                {d}
              </text>
            </g>
          ))}
          {/* dead zone shading */}
          <rect x={xToS(1969)} y={M.t} width={xToS(1986) - xToS(1969)}
            height={H - M.t - M.b} fill={C.err} opacity={0.06} />
          <text x={(xToS(1969) + xToS(1986)) / 2} y={M.t + 12}
            fontSize={9} textAnchor="middle" fill={C.err}
            fontFamily={MONO} opacity={0.7}>
            17-YEAR DETOUR
          </text>

          {/* events */}
          {events.map((e, i) => {
            const x = xToS(e.y);
            const yLane = M.t + 28 + (i % 2) * 18;
            const cl = colorFor(e.kind);
            return (
              <g key={i}>
                <line x1={x} y1={H - M.b} x2={x} y2={yLane + 6}
                  stroke={cl} strokeWidth={0.8} opacity={0.6} />
                <circle cx={x} cy={H - M.b} r={4} fill={cl}
                  stroke={C.bg} strokeWidth={1.5} />
                <text x={x} y={yLane} fontSize={10}
                  textAnchor="middle" fill={cl} fontFamily={MONO}>
                  {e.y}
                </text>
              </g>
            );
          })}
        </svg>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        {events.map((e, i) => {
          const cl = colorFor(e.kind);
          return (
            <div key={i} className="p-4"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `2px solid ${cl}`,
              }}>
              <div className="flex items-baseline gap-3 mb-1.5">
                <span style={{ color: cl, fontFamily: MONO, fontSize: 13 }}>
                  {e.y}
                </span>
                <span style={{ color: C.text, fontFamily: MONO, fontSize: 13 }}>
                  {e.t}
                </span>
              </div>
              <div className="text-sm leading-relaxed" style={{ color: C.textDim }}>
                {e.d}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-5 leading-relaxed text-sm"
        style={{
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          color: C.textDim,
          fontStyle: "italic",
        }}>
        <span style={{ color: C.text, fontStyle: "normal", fontFamily: MONO }}>
          Lesson.{" "}
        </span>
        The math of backpropagation existed in publishable form by 1970. It did
        not change the world for sixteen more years. Most of what we now call AI
        progress is not new mathematics — it is compute, data, and engineering
        finally arriving at math that was always there. When an engineer asks
        you whether <em>this</em> AI thing is real, the honest answer is that
        the question is almost always misframed. The question is not whether
        the math works. The math has been working for a long time.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  §3  The Warp — 2-2-1 sigmoid net trained on XOR live
// ---------------------------------------------------------------------
function WarpDemo() {
  const netRef = useRef(initNet());
  const [, setTick] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [lr, setLr] = useState(1.0);
  const [stepsPerFrame, setStepsPerFrame] = useState(40);
  const epochRef = useRef(0);
  const lossRef = useRef(0);
  const lossHistRef = useRef([]);
  const dataIdxRef = useRef(0);

  useEffect(() => {
    if (!isTraining) return;
    let raf = null, stopped = false;
    const loop = () => {
      if (stopped) return;
      let lossSum = 0, count = 0;
      for (let s = 0; s < stepsPerFrame; s++) {
        const sample = XOR_DATA[dataIdxRef.current];
        const l = netTrainStep(sample.x, sample.y, netRef.current, lr);
        lossSum += l; count++;
        dataIdxRef.current = (dataIdxRef.current + 1) % 4;
        if (dataIdxRef.current === 0) epochRef.current += 1;
      }
      lossRef.current = lossSum / count;
      if (epochRef.current % 8 === 0) {
        lossHistRef.current.push({ e: epochRef.current, l: lossRef.current });
        if (lossHistRef.current.length > 240) lossHistRef.current.shift();
      }
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [isTraining, lr, stepsPerFrame]);

  const reset = () => {
    setIsTraining(false);
    netRef.current = initNet();
    epochRef.current = 0;
    lossRef.current = 0;
    lossHistRef.current = [];
    dataIdxRef.current = 0;
    setTick((t) => t + 1);
  };

  const n = netRef.current;

  // Predictions on the four XOR examples
  const preds = XOR_DATA.map((d) => {
    const { yHat } = netForward(d.x, n);
    return { ...d, yHat };
  });
  const xorAcc = preds.filter((p) => (p.yHat > 0.5 ? 1 : 0) === p.y).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Train the 2-2-1 net" className="lg:col-span-1">
          <div className="space-y-5">
            <div className="flex gap-2">
              <Btn primary onClick={() => setIsTraining((v) => !v)}
                className="flex-1">
                {isTraining ? "▮▮  PAUSE" : "▶  TRAIN"}
              </Btn>
              <Btn onClick={reset}>RESET</Btn>
            </div>

            <div>
              <div className="flex justify-between text-[11px] tracking-[0.18em] uppercase mb-2"
                style={{ color: C.textDim, fontFamily: MONO }}>
                <span>learning rate η</span>
                <span style={{ color: C.text }}>{lr.toFixed(2)}</span>
              </div>
              <input type="range" min="0.05" max="3" step="0.05"
                value={lr} onChange={(e) => setLr(parseFloat(e.target.value))}
                className="w-full" style={{ accentColor: C.accent }} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] tracking-[0.18em] uppercase mb-2"
                style={{ color: C.textDim, fontFamily: MONO }}>
                <span>updates / frame</span>
                <span style={{ color: C.text }}>{stepsPerFrame}</span>
              </div>
              <input type="range" min="1" max="200" step="1"
                value={stepsPerFrame}
                onChange={(e) => setStepsPerFrame(parseInt(e.target.value, 10))}
                className="w-full" style={{ accentColor: C.accent }} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4"
              style={{ borderTop: `1px solid ${C.border}` }}>
              <Stat label="epoch" value={epochRef.current.toLocaleString()} />
              <Stat label="loss"
                value={lossRef.current.toFixed(4)} />
              <Stat label="XOR correct"
                value={`${xorAcc} / 4`}
                color={xorAcc === 4 ? C.ok : C.text} />
              <Stat label="‖W₁‖"
                value={Math.sqrt(
                  n.W1[0][0] ** 2 + n.W1[0][1] ** 2 +
                  n.W1[1][0] ** 2 + n.W1[1][1] ** 2
                ).toFixed(2)} />
            </div>

            <div className="pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: C.textFaint, fontFamily: MONO }}>
                XOR table predictions
              </div>
              <div className="space-y-1 text-xs" style={{ fontFamily: MONO }}>
                {preds.map((p, i) => {
                  const correct = (p.yHat > 0.5 ? 1 : 0) === p.y;
                  return (
                    <div key={i} className="flex justify-between"
                      style={{ color: correct ? C.text : C.err }}>
                      <span>({p.x[0]},{p.x[1]}) → {p.y}</span>
                      <span>ŷ = {p.yHat.toFixed(3)} {correct ? "✓" : "✗"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Loss" className="lg:col-span-2">
          <LossSpark hist={lossHistRef.current} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Input space  x  ·  curved boundary">
          <div className="flex justify-center">
            <WarpCanvas net={n} mode="input" size={300} />
          </div>
          <p className="text-xs mt-3 italic text-center"
            style={{ color: C.textFaint }}>
            The four XOR points sit at the corners. The network's decision
            boundary is non-linear here.
          </p>
        </Panel>
        <Panel title="Hidden space  h = σ(W₁x + b₁)  ·  the warp">
          <div className="flex justify-center">
            <WarpCanvas net={n} mode="hidden" size={300} />
          </div>
          <p className="text-xs mt-3 italic text-center"
            style={{ color: C.textFaint }}>
            Same four points, after the hidden layer bends space. They become
            linearly separable. The output layer's straight line does the rest.
          </p>
        </Panel>
      </div>

      <div className="p-5 text-sm leading-relaxed"
        style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`,
          color: C.textDim, fontStyle: "italic" }}>
        <span style={{ color: C.text, fontStyle: "normal", fontFamily: MONO }}>
          What just happened.{" "}
        </span>
        The hidden layer is a learned change-of-coordinates. It bends input
        space until the categories you care about line up on opposite sides of
        a flat plane. Every deep-learning architecture you have ever heard of
        is, at its core, a much fancier version of this same trick: stack
        differentiable warps until your data becomes linearly separable, then
        finish with a linear classifier. Convolutions warp. Attention warps.
        Residuals warp. The warp is the whole game.
      </div>
    </div>
  );
}

function LossSpark({ hist }) {
  const W = 600, H = 200, M = { l: 36, r: 14, t: 14, b: 24 };
  const innerW = W - M.l - M.r, innerH = H - M.t - M.b;
  if (hist.length < 2) {
    return (
      <div style={{ height: H }}
        className="flex items-center justify-center text-sm italic"
        title="empty">
        <span style={{ color: C.textFaint }}>Press ▶ TRAIN to begin.</span>
      </div>
    );
  }
  const xs = hist.map((p) => p.e);
  const ys = hist.map((p) => p.l);
  const xMin = xs[0], xMax = xs[xs.length - 1];
  const yMax = Math.max(...ys, 0.01);
  const xToS = (x) => M.l + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const yToS = (y) => H - M.b - (y / yMax) * innerH;
  const path = hist.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${xToS(p.e).toFixed(1)} ${yToS(p.l).toFixed(1)}`
  ).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={M.l} y1={H - M.b} x2={W - M.r} y2={H - M.b} stroke={C.border} strokeWidth={0.6} />
      <line x1={M.l} y1={M.t} x2={M.l} y2={H - M.b} stroke={C.border} strokeWidth={0.6} />
      {[0, 0.5, 1].map((t) => {
        const yv = yMax * (1 - t);
        return (
          <g key={t}>
            <line x1={M.l} y1={yToS(yv)} x2={W - M.r} y2={yToS(yv)}
              stroke={C.border} strokeWidth={0.4} strokeDasharray="2 4" />
            <text x={M.l - 6} y={yToS(yv) + 3} fontSize={9}
              textAnchor="end" fill={C.textFaint} fontFamily={MONO}>
              {yv.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text x={M.l} y={H - 6} fontSize={9}
        fill={C.textFaint} fontFamily={MONO}>epoch {xMin}</text>
      <text x={W - M.r} y={H - 6} fontSize={9}
        textAnchor="end" fill={C.textFaint} fontFamily={MONO}>
        {xMax}
      </text>
      <path d={path} stroke={C.accent} strokeWidth={1.5} fill="none" />
    </svg>
  );
}

function WarpCanvas({ net, mode, size = 300 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr; c.height = size * dpr;
    c.style.width = `${size}px`; c.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const M = 26;
    const inner = size - 2 * M;
    const xMin = mode === "hidden" ? 0 : -0.15;
    const xMax = mode === "hidden" ? 1 : 1.15;
    const xToS = (x) => M + ((x - xMin) / (xMax - xMin)) * inner;
    const yToS = (y) => size - M - ((y - xMin) / (xMax - xMin)) * inner;

    // background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, size, size);

    // heat map of decision in each space
    const H = 60;
    const cell = inner / H;
    for (let i = 0; i < H; i++) {
      for (let j = 0; j < H; j++) {
        const u = xMin + ((i + 0.5) / H) * (xMax - xMin);
        const v = xMin + ((j + 0.5) / H) * (xMax - xMin);
        let yHat;
        if (mode === "input") {
          ({ yHat } = netForward([u, v], net));
        } else {
          // u, v are h1, h2
          const z2 = net.W2[0] * u + net.W2[1] * v + net.b2;
          yHat = sigmoid(z2);
        }
        const t = yHat * 2 - 1; // -1..1
        const k = Math.abs(t);
        const r = t > 0
          ? Math.round(15 + k * 90)
          : Math.round(15 + k * 30);
        const g = t > 0
          ? Math.round(15 + k * 35)
          : Math.round(15 + k * 50);
        const b = t > 0
          ? Math.round(20 + k * 35)
          : Math.round(20 + k * 90);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(M + i * cell, size - M - (j + 1) * cell, cell + 0.6, cell + 0.6);
      }
    }

    // plot border
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(M + 0.5, M + 0.5, inner, inner);

    // 0/0.5/1 tick lines
    ctx.strokeStyle = "rgba(240,233,217,0.10)";
    ctx.setLineDash([2, 4]);
    for (const t of [0, 0.5, 1]) {
      ctx.beginPath();
      ctx.moveTo(xToS(t), M); ctx.lineTo(xToS(t), size - M); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(M, yToS(t)); ctx.lineTo(size - M, yToS(t)); ctx.stroke();
    }
    ctx.setLineDash([]);

    // grid (input grid → warped if hidden mode)
    const G = 9;
    const xs = [], ys = [];
    for (let i = 0; i <= G; i++) {
      const t = i / G;
      xs.push(t); ys.push(t);
    }
    ctx.lineWidth = 0.7;
    // warm grid color
    ctx.strokeStyle = "rgba(245,176,65,0.45)";
    if (mode === "input") {
      // straight grid in input space
      for (const t of xs) {
        ctx.beginPath();
        ctx.moveTo(xToS(t), yToS(0)); ctx.lineTo(xToS(t), yToS(1));
        ctx.stroke();
      }
      for (const t of ys) {
        ctx.beginPath();
        ctx.moveTo(xToS(0), yToS(t)); ctx.lineTo(xToS(1), yToS(t));
        ctx.stroke();
      }
    } else {
      // warped: for each row of input grid, draw polyline of (h1,h2) values
      const FINE = 30;
      const transform = (u, v) => {
        const z1 = [
          net.W1[0][0] * u + net.W1[0][1] * v + net.b1[0],
          net.W1[1][0] * u + net.W1[1][1] * v + net.b1[1],
        ];
        return [sigmoid(z1[0]), sigmoid(z1[1])];
      };
      for (const yT of ys) {
        ctx.beginPath();
        for (let i = 0; i <= FINE; i++) {
          const u = i / FINE;
          const [h1, h2] = transform(u, yT);
          if (i === 0) ctx.moveTo(xToS(h1), yToS(h2));
          else ctx.lineTo(xToS(h1), yToS(h2));
        }
        ctx.stroke();
      }
      for (const xT of xs) {
        ctx.beginPath();
        for (let i = 0; i <= FINE; i++) {
          const v = i / FINE;
          const [h1, h2] = transform(xT, v);
          if (i === 0) ctx.moveTo(xToS(h1), yToS(h2));
          else ctx.lineTo(xToS(h1), yToS(h2));
        }
        ctx.stroke();
      }
    }

    // decision line (hidden mode only): W2·h + b2 = 0
    if (mode === "hidden") {
      const a = net.W2[0], b = net.W2[1], c = net.b2;
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      // find two points where line crosses [0,1]^2 box
      const pts = [];
      const tryEdge = (h1, h2) => {
        if (h1 >= -0.001 && h1 <= 1.001 && h2 >= -0.001 && h2 <= 1.001) {
          pts.push([h1, h2]);
        }
      };
      // edges h1=0, h1=1, h2=0, h2=1
      if (Math.abs(b) > 1e-6) {
        tryEdge(0, -c / b);
        tryEdge(1, (-c - a) / b);
      }
      if (Math.abs(a) > 1e-6) {
        tryEdge(-c / a, 0);
        tryEdge((-c - b) / a, 1);
      }
      if (pts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(xToS(pts[0][0]), yToS(pts[0][1]));
        ctx.lineTo(xToS(pts[1][0]), yToS(pts[1][1]));
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // four XOR points
    const drawDot = (px, py, label) => {
      const fill = label === 1 ? C.pos : C.neg;
      ctx.beginPath();
      ctx.arc(xToS(px), yToS(py), 9, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.bg;
      ctx.stroke();
      ctx.fillStyle = C.bg;
      ctx.font = `600 11px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label.toString(), xToS(px), yToS(py) + 0.5);
    };
    XOR_DATA.forEach((d) => {
      let px, py;
      if (mode === "input") { px = d.x[0]; py = d.x[1]; }
      else {
        const z1 = [
          net.W1[0][0] * d.x[0] + net.W1[0][1] * d.x[1] + net.b1[0],
          net.W1[1][0] * d.x[0] + net.W1[1][1] * d.x[1] + net.b1[1],
        ];
        px = sigmoid(z1[0]); py = sigmoid(z1[1]);
      }
      drawDot(px, py, d.y);
    });

    // axis labels
    ctx.fillStyle = C.textFaint;
    ctx.font = `10px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(mode === "input" ? "x₁" : "h₁", size / 2, size - 6);
    ctx.save();
    ctx.translate(10, size / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(mode === "input" ? "x₂" : "h₂", 0, 0);
    ctx.restore();
  }, [net.W1, net.b1, net.W2, net.b2, mode, size]);
  return <canvas ref={ref} className="block" />;
}

// ---------------------------------------------------------------------
//  §4  Why the step kills it
// ---------------------------------------------------------------------
function StepSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Panel title="Step  ·  Rosenblatt's original">
        <div className="flex justify-center">
          <ActivationPlot fn={step} deriv={stepPrime}
            label="step(z)" derivLabel="step'(z)" />
        </div>
        <p className="text-sm mt-4 leading-relaxed" style={{ color: C.textDim }}>
          The original perceptron output a hard 0 or 1. A clean engineering
          choice — until you try to teach a network with more than one layer.
        </p>
      </Panel>
      <Panel title="The blockage">
        <div className="text-sm leading-relaxed space-y-3"
          style={{ color: C.textDim }}>
          <p>
            The chain rule says <span style={{ fontFamily: MONO, color: C.text }}>
              ∂L/∂w = ∂L/∂y · ∂y/∂z · ∂z/∂w
            </span>.
            Every link in that chain has to carry signal.
          </p>
          <p>
            For the step function, <span style={{ fontFamily: MONO, color: C.text }}>
              ∂y/∂z = 0
            </span> almost everywhere, and <em>undefined</em> exactly at the
            threshold.
          </p>
          <p>
            Multiply zero by anything and you get zero. The gradient at every
            weight is zero. There is nothing for gradient descent to descend.
            The network freezes.
          </p>
          <p>
            This is the technical wall behind <em>Perceptrons</em> (1969). Not
            just &ldquo;XOR is hard&rdquo; — but &ldquo;and we have no
            mechanism to train anything that could solve it.&rdquo;
          </p>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------
//  §5  Why sigmoid saves it  (interactive chain rule)
// ---------------------------------------------------------------------
function SigmoidSection() {
  const [x, setX] = useState(0.8);
  const [w, setW] = useState(1.5);
  const [b, setB] = useState(-0.3);
  const [y, setY] = useState(1);

  const z = w * x + b;
  const yHat = sigmoid(z);
  const dyHat_dz = yHat * (1 - yHat);
  const eps = 1e-7;
  const dL_dyHat = -y / (yHat + eps) + (1 - y) / (1 - yHat + eps);
  const dL_dz_clean = yHat - y;
  const dz_dw = x;
  const dL_dw = dL_dz_clean * dz_dw;
  const loss = -(y * Math.log(yHat + eps) + (1 - y) * Math.log(1 - yHat + eps));

  const Slider = ({ label, value, set, min, max, step }) => (
    <div>
      <div className="flex justify-between text-[11px] tracking-[0.18em] uppercase mb-1.5"
        style={{ color: C.textDim, fontFamily: MONO }}>
        <span>{label}</span>
        <span style={{ color: C.text }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(parseFloat(e.target.value))}
        className="w-full" style={{ accentColor: C.accent }} />
    </div>
  );

  const eq = (lhs, rhs, val, color = C.text) => (
    <div className="flex items-baseline justify-between py-1.5 border-b"
      style={{ borderColor: C.border, fontFamily: MONO }}>
      <span className="text-sm" style={{ color: C.textDim }}>
        <span style={{ color }}>{lhs}</span> = {rhs}
      </span>
      <span className="text-sm" style={{ color }}>{val}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Sigmoid  ·  smooth, monotonic, differentiable">
          <div className="flex justify-center">
            <ActivationPlot fn={sigmoid} deriv={sigmoidPrime}
              label="σ(z)" derivLabel="σ'(z) = σ(1−σ)" />
          </div>
          <p className="text-sm mt-4 leading-relaxed" style={{ color: C.textDim }}>
            The derivative is non-zero everywhere. Gradient signal can flow
            through. Pair it with binary cross-entropy and the math collapses
            into something so clean you'll suspect a trick.
          </p>
        </Panel>

        <Panel title="One neuron  ·  follow the gradient">
          <div className="space-y-4">
            <Slider label="x" value={x} set={setX} min={-2} max={2} step={0.05} />
            <Slider label="w" value={w} set={setW} min={-3} max={3} step={0.05} />
            <Slider label="b" value={b} set={setB} min={-3} max={3} step={0.05} />
            <div className="flex gap-2">
              <Btn onClick={() => setY(0)}
                primary={y === 0}
                className="flex-1">y = 0</Btn>
              <Btn onClick={() => setY(1)}
                primary={y === 1}
                className="flex-1">y = 1</Btn>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="The chain, evaluated">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {eq("z", "w·x + b", z.toFixed(3))}
          {eq("ŷ", "σ(z)", yHat.toFixed(4))}
          {eq("L", "BCE(ŷ, y)", loss.toFixed(4), C.accent)}
          {eq("∂ŷ/∂z", "ŷ(1 − ŷ)", dyHat_dz.toFixed(4))}
          {eq("∂L/∂ŷ", "−y/ŷ + (1−y)/(1−ŷ)", dL_dyHat.toFixed(4))}
          {eq("∂z/∂w", "x", dz_dw.toFixed(3))}
        </div>

        <div className="mt-6 p-4"
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`,
            fontFamily: MONO }}>
          <div className="text-xs tracking-[0.2em] uppercase mb-3"
            style={{ color: C.textFaint }}>
            the cancellation
          </div>
          <div className="text-sm space-y-1.5" style={{ color: C.textDim }}>
            <div>
              <span style={{ color: C.text }}>∂L/∂z</span> ={" "}
              <span style={{ color: C.text }}>∂L/∂ŷ</span> · {" "}
              <span style={{ color: C.text }}>∂ŷ/∂z</span> ={" "}
              <span style={{ color: C.accent }}>(ŷ − y)</span>
              <span className="ml-3" style={{ color: C.textFaint }}>
                ← the ŷ(1−ŷ) cancels
              </span>
            </div>
            <div>
              <span style={{ color: C.text }}>∂L/∂w</span> ={" "}
              <span style={{ color: C.text }}>∂L/∂z</span> · {" "}
              <span style={{ color: C.text }}>∂z/∂w</span> ={" "}
              <span style={{ color: C.accent }}>(ŷ − y)·x</span>
              <span className="ml-3" style={{ color: C.text }}>
                = {dL_dw.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm mt-5 leading-relaxed" style={{ color: C.textDim }}>
          That cancellation is the entire reason backprop is computationally
          tractable. The choice of <em>continuously differentiable</em>
          activation is what makes every link in the chain rule carry signal.
          The choice of <em>sigmoid plus binary cross-entropy</em> in
          particular makes the algebra collapse so far that a freshman can
          implement it correctly. Backprop is not magic. Backprop is
          bookkeeping over a chain of well-chosen derivatives.
        </p>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------
//  §6  Backprop in code
// ---------------------------------------------------------------------
function CodeSection() {
  return (
    <Panel>
      <pre className="text-[12.5px] leading-6 overflow-x-auto"
        style={{ fontFamily: MONO, color: C.text }}>
{`function trainStepXOR(x, y, n, lr) {
  // ──────── forward ────────
  const z1 = [
    n.W1[0][0]*x[0] + n.W1[0][1]*x[1] + n.b1[0],
    n.W1[1][0]*x[0] + n.W1[1][1]*x[1] + n.b1[1],
  ];
  const h    = [sigmoid(z1[0]), sigmoid(z1[1])];
  const z2   = n.W2[0]*h[0] + n.W2[1]*h[1] + n.b2;
  const yHat = sigmoid(z2);

  // ──────── backward ──────── (sigmoid + BCE → ∂L/∂z2 = ŷ − y)
  const dz2 = yHat - y;
  const dW2 = [dz2*h[0], dz2*h[1]];
  const db2 = dz2;

  // propagate through hidden activation
  const dh  = [dz2*n.W2[0], dz2*n.W2[1]];
  const dz1 = [dh[0]*h[0]*(1 - h[0]),       // σ'(z) = h(1−h)
               dh[1]*h[1]*(1 - h[1])];

  const dW1 = [[dz1[0]*x[0], dz1[0]*x[1]],
               [dz1[1]*x[0], dz1[1]*x[1]]];
  const db1 = [dz1[0], dz1[1]];

  // ──────── update ────────
  n.W1[0][0] -= lr*dW1[0][0]; n.W1[0][1] -= lr*dW1[0][1];
  n.W1[1][0] -= lr*dW1[1][0]; n.W1[1][1] -= lr*dW1[1][1];
  n.b1[0]    -= lr*db1[0];    n.b1[1]    -= lr*db1[1];
  n.W2[0]    -= lr*dW2[0];    n.W2[1]    -= lr*dW2[1];
  n.b2       -= lr*db2;
}`}
      </pre>
      <p className="mt-5 text-sm leading-relaxed" style={{ color: C.textDim }}>
        The entire algorithm. No tensor library, no autograd, no abstraction.
        Backprop is the second half of this function: each variable named{" "}
        <span style={{ fontFamily: MONO, color: C.text }}>d&lt;something&gt;</span>{" "}
        is a partial derivative of the loss with respect to that thing,
        computed by mechanically applying the chain rule from the output back
        to the input. Run it 10,000 times on the four XOR examples. You have a
        working multilayer perceptron. You have, in some non-trivial sense,
        the entire foundation of modern deep learning sitting in twenty lines.
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------------
//  §7  ReLU asterisk
// ---------------------------------------------------------------------
function ReLUSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Panel title="ReLU  ·  the engineer's activation">
        <div className="flex justify-center">
          <ActivationPlot fn={relu} deriv={reluPrime}
            label="ReLU(z)" derivLabel="ReLU'(z)"
            yRange={[-0.5, 3]} />
        </div>
      </Panel>
      <Panel title="Where the theory and the practice part ways">
        <div className="text-sm leading-relaxed space-y-3"
          style={{ color: C.textDim }}>
          <p>
            ReLU is not differentiable at zero. The strict precondition we
            spent §5 celebrating — <em>continuously differentiable</em> — is
            violated at exactly one point.
          </p>
          <p>
            Almost no one cares. The set of points where{" "}
            <span style={{ fontFamily: MONO, color: C.text }}>z = 0</span>
            {" "}exactly is measure zero. We define{" "}
            <span style={{ fontFamily: MONO, color: C.text }}>ReLU'(0)</span> = 0
            (or 1, or anywhere in between — pick one), and the world continues
            to turn. ReLU trains faster than sigmoid, doesn't saturate at
            large activations, and is now the default in essentially every
            deep network you've ever used.
          </p>
          <p style={{ color: C.text, fontStyle: "italic" }}>
            The lesson for engineers leading AI rollouts.
          </p>
          <p>
            A precondition the theoreticians treated as load-bearing turned
            out to be approximately load-bearing. The practitioners broke it
            and shipped. This is, recursively, the same lesson as the
            seventeen-year detour: paradigm shifts arrive when someone with
            enough nerve questions the load-bearing assumption nobody else
            thought to question. Train your engineers to notice the
            assumptions in the first place.
          </p>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Main
// ---------------------------------------------------------------------
export default function App() {
  return (
    <div className="min-h-screen w-full"
      style={{ background: C.bg, color: C.text, fontFamily: SERIF }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        .grain::before {
          content: ""; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 3px 3px; pointer-events: none;
        }
      `}</style>

      {/* Hero */}
      <div className="relative overflow-hidden grain"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 relative">
          <div className="text-[11px] tracking-[0.3em] uppercase mb-6"
            style={{ color: C.accent, fontFamily: MONO }}>
            4FF · A Field Manual · Part II
          </div>
          <h1 className="text-4xl md:text-6xl leading-[1.05] mb-6"
            style={{ fontFamily: MONO, fontWeight: 500,
              letterSpacing: "-0.02em" }}>
            The Wall &amp;<br />
            <span style={{ color: C.accent }}>The Warp.</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl leading-relaxed"
            style={{ color: C.textDim, fontStyle: "italic" }}>
            Why a single neuron cannot learn XOR, the seventeen-year detour
            that followed, and why one continuously-differentiable function
            broke modern AI free.
          </p>
          <div className="mt-10 text-sm max-w-2xl leading-relaxed"
            style={{ color: C.textDim }}>
            Your engineers are about to inherit tools whose intelligence
            they cannot directly inspect. Before you trust those tools,
            you should be able to feel — viscerally — where their
            ancestors hit a wall, and what gymnastics it took to get
            past it. The math is older than most of your codebase.
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 space-y-20">

        {/* §1 */}
        <section>
          <SectionLabel num="01">The wall.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            A perceptron is a linear classifier. Geometrically it draws one
            straight line through input space and calls everything on one
            side &ldquo;A&rdquo; and everything on the other side &ldquo;B.&rdquo;
            For some logical functions this is fine. For{" "}
            <span style={{ fontStyle: "italic" }}>exclusive-or</span>, no such
            line exists. Try.
          </p>
          <XORDemo />
        </section>

        {/* §2 */}
        <section>
          <SectionLabel num="02">The seventeen-year detour.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            The XOR argument was not just a curiosity. Marvin Minsky and
            Seymour Papert published it in 1969 with sufficient rigor and
            authority to pull the rug from under the entire connectionist
            research program. The funding stopped. The math, however, kept
            quietly accumulating.
          </p>
          <Timeline />
        </section>

        {/* §3 */}
        <section>
          <SectionLabel num="03">The warp.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            Stack two perceptrons. Train them with backprop. Watch what
            happens to the four XOR points as the hidden layer learns its
            transformation. Input space stays where it is. Hidden space —
            the world the output neuron actually sees — bends. This is the
            single most important picture in deep learning, and you can have
            it running in your browser in fifty lines of plain JavaScript.
          </p>
          <WarpDemo />
        </section>

        {/* §4 */}
        <section>
          <SectionLabel num="04">Why the step function killed it.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            Rosenblatt's perceptron used a hard threshold: output 0 if the
            weighted sum is negative, output 1 otherwise. This is engineeringly
            elegant and computationally cheap. It is also the reason
            multilayer networks could not be trained for an entire generation.
          </p>
          <StepSection />
        </section>

        {/* §5 */}
        <section>
          <SectionLabel num="05">Why sigmoid set it free.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            Replace the step function with anything smooth, monotonic, and
            differentiable, and the chain rule has something to chew on at
            every layer. The choice of sigmoid in particular, paired with
            binary cross-entropy as the loss, makes the algebra collapse into
            something almost embarrassingly clean. Slide the inputs and watch.
          </p>
          <SigmoidSection />
        </section>

        {/* §6 */}
        <section>
          <SectionLabel num="06">Backprop, naked.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            This is the entire training step that drove the warp visualization
            you played with above. No abstractions. The function that
            Rumelhart, Hinton, and Williams &ldquo;rediscovered&rdquo; in 1986
            and that earned its share of a Nobel Prize in 2024.
          </p>
          <CodeSection />
        </section>

        {/* §7 */}
        <section>
          <SectionLabel num="07">The ReLU asterisk.</SectionLabel>
          <p className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}>
            One last thing, which is the meta-lesson for any engineer about
            to lead an AI rollout. The very precondition we just celebrated —
            continuous differentiability — is broken by the activation
            function modern deep networks actually use.
          </p>
          <ReLUSection />
        </section>

        {/* Footer */}
        <div className="pt-10 text-xs flex items-center justify-between"
          style={{ borderTop: `1px solid ${C.border}`, color: C.textFaint,
            fontFamily: MONO }}>
          <span>wall.and.warp · 4FF · part ii</span>
          <span>
            Rosenblatt 1958 · Minsky &amp; Papert 1969 · Werbos 1974 ·
            Rumelhart, Hinton &amp; Williams 1986
          </span>
        </div>
      </div>
    </div>
  );
}
