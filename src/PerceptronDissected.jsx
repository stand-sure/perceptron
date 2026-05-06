import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";

// =====================================================================
//  Anatomy of a Perceptron
//  A single-neuron classifier for 20x20 procedural digits ("1" vs "8").
//  Built for engineers learning to not blindly trust ML systems.
// =====================================================================

const GRID = 20;
const N = GRID * GRID;

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
};

// -----------------------------------------------------------------
//  Synthetic digit generation
// -----------------------------------------------------------------
function gaussian() {
  const u = Math.random() || 1e-9;
  const v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-9) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / L2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function drawSeg(g, x1, y1, x2, y2, thick) {
  const t2 = thick * thick;
  for (let py = 0; py < GRID; py++) {
    for (let px = 0; px < GRID; px++) {
      const d = distSeg(px, py, x1, y1, x2, y2);
      const v = Math.exp(-(d * d) / t2);
      const i = py * GRID + px;
      if (v > g[i]) g[i] = v;
    }
  }
}

function drawRing(g, cx, cy, rx, ry, thick) {
  const t2 = thick * thick;
  const minR = Math.min(rx, ry);
  for (let py = 0; py < GRID; py++) {
    for (let px = 0; px < GRID; px++) {
      const ndx = (px - cx) / rx;
      const ndy = (py - cy) / ry;
      const r = Math.sqrt(ndx * ndx + ndy * ndy);
      const d = Math.abs(r - 1) * minR;
      const v = Math.exp(-(d * d) / t2);
      const i = py * GRID + px;
      if (v > g[i]) g[i] = v;
    }
  }
}

function rot(x, y, cx, cy, th) {
  const dx = x - cx;
  const dy = y - cy;
  const c = Math.cos(th);
  const s = Math.sin(th);
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}

function genOne(noise) {
  const g = new Float32Array(N);
  const cx = 10 + (Math.random() - 0.5) * 3;
  const th = (Math.random() - 0.5) * 0.4;
  const [tx, ty] = rot(cx, 3, cx, 10, th);
  const [bx, by] = rot(cx, 17, cx, 10, th);
  drawSeg(g, tx, ty, bx, by, 1.3);
  if (Math.random() > 0.3) {
    const [sx, sy] = rot(cx - 2.5, 5, cx, 10, th);
    drawSeg(g, tx, ty, sx, sy, 1.1);
  }
  if (Math.random() > 0.5) {
    const [ax, ay] = rot(cx - 2.5, 17, cx, 10, th);
    const [bbx, bby] = rot(cx + 2.5, 17, cx, 10, th);
    drawSeg(g, ax, ay, bbx, bby, 1.1);
  }
  if (noise > 0) {
    for (let i = 0; i < N; i++) {
      const v = g[i] + gaussian() * noise;
      g[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return g;
}

function genEight(noise) {
  const g = new Float32Array(N);
  const cx = 10 + (Math.random() - 0.5) * 1.5;
  const cy = 10 + (Math.random() - 0.5) * 1.5;
  const th = (Math.random() - 0.5) * 0.25;
  const tR = 2.6 + Math.random() * 0.6;
  const bR = 3.4 + Math.random() * 0.6;
  const [tcx, tcy] = rot(cx, cy - (tR + 0.4), cx, cy, th);
  const [bcx, bcy] = rot(cx, cy + (bR + 0.4), cx, cy, th);
  drawRing(g, tcx, tcy, tR, tR, 1.2);
  drawRing(g, bcx, bcy, bR, bR, 1.2);
  if (noise > 0) {
    for (let i = 0; i < N; i++) {
      const v = g[i] + gaussian() * noise;
      g[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return g;
}

function makeSample(noise) {
  const y = Math.random() < 0.5 ? 0 : 1; // 0 = "1", 1 = "8"
  const x = y === 0 ? genOne(noise) : genEight(noise);
  return { x, y };
}

// -----------------------------------------------------------------
//  The perceptron itself  (the entire model lives here)
// -----------------------------------------------------------------
function sigmoid(z) {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

function forward(x, w, b) {
  let z = b;
  for (let i = 0; i < N; i++) z += x[i] * w[i];
  return [z, sigmoid(z)];
}

function trainStep(x, y, w, b, lr) {
  let z = b;
  for (let i = 0; i < N; i++) z += x[i] * w[i];
  const yHat = sigmoid(z);
  const grad = yHat - y; // ∂L/∂z for sigmoid + BCE
  for (let i = 0; i < N; i++) w[i] -= lr * grad * x[i];
  const eps = 1e-7;
  const loss = -(y * Math.log(yHat + eps) + (1 - y) * Math.log(1 - yHat + eps));
  return { b: b - lr * grad, yHat, loss };
}

function initWeights() {
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = (Math.random() - 0.5) * 0.02;
  return w;
}

// -----------------------------------------------------------------
//  Visualization primitives
// -----------------------------------------------------------------
function DigitCanvas({ pixels, size = 140 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, size, size);
    const cell = size / GRID;
    for (let i = 0; i < N; i++) {
      const v = Math.max(0, Math.min(1, pixels[i] || 0));
      const r = (i / GRID) | 0;
      const c2 = i % GRID;
      const sh = Math.round(v * 255);
      ctx.fillStyle = `rgb(${sh},${Math.round(sh * 0.95)},${Math.round(sh * 0.85)})`;
      ctx.fillRect(c2 * cell, r * cell, cell, cell);
    }
  }, [pixels, size]);
  return <canvas ref={ref} className="block" />;
}

function WeightCanvas({ weights, size = 240 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let mA = 1e-9;
    for (let i = 0; i < N; i++) {
      const a = Math.abs(weights[i]);
      if (a > mA) mA = a;
    }
    const cell = size / GRID;
    ctx.fillStyle = C.surface;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < N; i++) {
      const t = weights[i] / mA;
      const r2 = (i / GRID) | 0;
      const cc = i % GRID;
      let R, G, B;
      if (t >= 0) {
        const k = t;
        R = Math.round(20 + k * 235);
        G = Math.round(20 + k * 90);
        B = Math.round(30 + k * 70);
      } else {
        const k = -t;
        R = Math.round(20 + k * 60);
        G = Math.round(20 + k * 130);
        B = Math.round(30 + k * 225);
      }
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(cc * cell, r2 * cell, cell, cell);
    }
  }, [weights, size]);
  return <canvas ref={ref} className="block" />;
}

function ContribCanvas({ pixels, weights, size = 140 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let mA = 1e-9;
    for (let i = 0; i < N; i++) {
      const v = (pixels[i] || 0) * weights[i];
      const a = Math.abs(v);
      if (a > mA) mA = a;
    }
    const cell = size / GRID;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < N; i++) {
      const v = (pixels[i] || 0) * weights[i];
      const t = v / mA;
      const r2 = (i / GRID) | 0;
      const cc = i % GRID;
      let R, G, B;
      if (t >= 0) {
        const k = t;
        R = Math.round(15 + k * 240);
        G = Math.round(15 + k * 100);
        B = Math.round(20 + k * 80);
      } else {
        const k = -t;
        R = Math.round(15 + k * 70);
        G = Math.round(15 + k * 140);
        B = Math.round(20 + k * 230);
      }
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(cc * cell, r2 * cell, cell, cell);
    }
  }, [pixels, weights, size]);
  return <canvas ref={ref} className="block" />;
}

function ConfBar({ p }) {
  const pOne = (1 - p) * 100;
  const pEight = p * 100;
  return (
    <div className="w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div
        className="flex justify-between text-xs mb-1.5 tracking-wide"
        style={{ color: C.textDim }}
      >
        <span>「1」 {pOne.toFixed(1)}%</span>
        <span>{pEight.toFixed(1)}% 「8」</span>
      </div>
      <div
        className="relative w-full h-6 overflow-hidden"
        style={{
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{ width: `${pOne}%`, background: C.neg, opacity: 0.85 }}
        />
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ width: `${pEight}%`, background: C.pos, opacity: 0.85 }}
        />
        <div
          className="absolute top-0 bottom-0"
          style={{ left: "50%", width: 1, background: C.text, opacity: 0.4 }}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
//  Draw-your-own canvas
// -----------------------------------------------------------------
function DrawPad({ pixels, setPixels, size = 280 }) {
  const ref = useRef(null);
  const drawing = useRef(false);

  const redraw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, size, size);
    const cell = size / GRID;
    for (let i = 0; i < N; i++) {
      const v = Math.max(0, Math.min(1, pixels[i] || 0));
      const r = (i / GRID) | 0;
      const c2 = i % GRID;
      const sh = Math.round(v * 255);
      ctx.fillStyle = `rgb(${sh},${Math.round(sh * 0.95)},${Math.round(sh * 0.85)})`;
      ctx.fillRect(c2 * cell, r * cell, cell, cell);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(size, i * cell);
      ctx.stroke();
    }
  }, [pixels, size]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const paintAt = (cx, cy) => {
    const next = new Float32Array(pixels);
    const radius = 1.4;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= GRID || py >= GRID) continue;
        const d = Math.hypot(dx, dy);
        const v = Math.exp(-(d * d) / (radius * radius));
        const i = py * GRID + px;
        next[i] = Math.min(1, next[i] + v * 0.55);
      }
    }
    setPixels(next);
  };

  const handle = (e) => {
    const c = ref.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const cell = size / GRID;
    const cx = Math.floor((clientX - rect.left) / cell);
    const cy = Math.floor((clientY - rect.top) / cell);
    if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return;
    paintAt(cx, cy);
  };

  return (
    <canvas
      ref={ref}
      onMouseDown={(e) => {
        drawing.current = true;
        handle(e);
      }}
      onMouseMove={(e) => {
        if (drawing.current) handle(e);
      }}
      onMouseUp={() => {
        drawing.current = false;
      }}
      onMouseLeave={() => {
        drawing.current = false;
      }}
      onTouchStart={(e) => {
        drawing.current = true;
        handle(e);
        e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (drawing.current) handle(e);
        e.preventDefault();
      }}
      onTouchEnd={() => {
        drawing.current = false;
      }}
      className="block cursor-crosshair touch-none"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}
    />
  );
}

// -----------------------------------------------------------------
//  Section / panel chrome
// -----------------------------------------------------------------
function SectionLabel({ num, children }) {
  return (
    <div className="flex items-baseline gap-3 mb-6">
      <span
        className="text-xs tracking-[0.25em] uppercase"
        style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}
      >
        §{num}
      </span>
      <h2
        className="text-2xl tracking-tight"
        style={{
          color: C.text,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
      }}
    >
      {title && (
        <div
          className="text-[11px] tracking-[0.2em] uppercase mb-4"
          style={{ color: C.textDim, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function StatBlock({ label, value, mono = true }) {
  return (
    <div>
      <div
        className="text-[10px] tracking-[0.2em] uppercase mb-1"
        style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>
      <div
        className="text-lg"
        style={{
          color: C.text,
          fontFamily: mono ? "'JetBrains Mono', monospace" : "'Lora', serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
//  The page
// -----------------------------------------------------------------
export default function App() {
  const weightsRef = useRef(initWeights());
  const biasRef = useRef({ v: 0 });
  const stepRef = useRef(0);
  const correctRef = useRef(0);
  const seenRef = useRef(0);
  const accLossRef = useRef(0);
  const accSamplesRef = useRef(0);

  const [, setTick] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [lr, setLr] = useState(0.1);
  const [noise, setNoise] = useState(0.06);
  const [stepsPerFrame, setStepsPerFrame] = useState(20);
  const [lossHistory, setLossHistory] = useState([]);
  const [accuracy, setAccuracy] = useState(0);

  const [testSample, setTestSample] = useState(() => makeSample(0.06));
  const [drawPixels, setDrawPixels] = useState(() => new Float32Array(N));

  // training loop
  useEffect(() => {
    if (!isTraining) return;
    let raf = null;
    let stopped = false;
    const loop = () => {
      if (stopped) return;
      const w = weightsRef.current;
      let b = biasRef.current.v;
      for (let s = 0; s < stepsPerFrame; s++) {
        const { x, y } = makeSample(noise);
        const r = trainStep(x, y, w, b, lr);
        b = r.b;
        accLossRef.current += r.loss;
        accSamplesRef.current += 1;
        if ((r.yHat > 0.5 ? 1 : 0) === y) correctRef.current += 1;
        seenRef.current += 1;
        stepRef.current += 1;
      }
      biasRef.current.v = b;

      if (stepRef.current % 60 === 0 || stepRef.current < 200) {
        const avg = accLossRef.current / Math.max(1, accSamplesRef.current);
        setLossHistory((prev) => {
          const next = [...prev, { step: stepRef.current, loss: avg }];
          return next.length > 220 ? next.slice(-220) : next;
        });
        accLossRef.current = 0;
        accSamplesRef.current = 0;
        const recentWindow = Math.min(seenRef.current, 1000);
        setAccuracy(correctRef.current / Math.max(1, seenRef.current));
        if (seenRef.current > 2000) {
          // decay running accuracy so it reflects recent performance
          correctRef.current *= 0.95;
          seenRef.current *= 0.95;
        }
        setTick((t) => t + 1);
        void recentWindow;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isTraining, lr, noise, stepsPerFrame]);

  const reset = () => {
    setIsTraining(false);
    weightsRef.current = initWeights();
    biasRef.current.v = 0;
    stepRef.current = 0;
    correctRef.current = 0;
    seenRef.current = 0;
    accLossRef.current = 0;
    accSamplesRef.current = 0;
    setLossHistory([]);
    setAccuracy(0);
    setTick((t) => t + 1);
  };

  const newTest = () => setTestSample(makeSample(noise));
  const findError = () => {
    for (let i = 0; i < 400; i++) {
      const s = makeSample(noise);
      const [, p] = forward(s.x, weightsRef.current, biasRef.current.v);
      const pred = p > 0.5 ? 1 : 0;
      if (pred !== s.y) {
        setTestSample(s);
        return;
      }
    }
    setTestSample(makeSample(noise));
  };

  const w = weightsRef.current;
  const b = biasRef.current.v;
  const [tz, testProb] = forward(testSample.x, w, b);
  const testPred = testProb > 0.5 ? 1 : 0;
  const testLabel = testSample.y;
  const testCorrect = testPred === testLabel;
  const [, drawProb] = forward(drawPixels, w, b);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: "'Lora', Georgia, serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .grain::before {
          content: "";
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 3px 3px;
          pointer-events: none;
        }
      `}</style>

      {/* ============== Hero ============== */}
      <div
        className="relative overflow-hidden grain"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 relative">
          <div
            className="text-[11px] tracking-[0.3em] uppercase mb-6"
            style={{
              color: C.accent,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            4FF · A Field Manual
          </div>
          <h1
            className="text-4xl md:text-6xl leading-[1.05] mb-6"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            Anatomy of a
            <br />
            <span style={{ color: C.accent }}>Perceptron.</span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl leading-relaxed"
            style={{ color: C.textDim, fontStyle: "italic" }}
          >
            One neuron. One decision. No magic. A working dissection of the
            simplest possible neural network — trained from scratch in your
            browser, classifying handwritten <span style={{ color: C.neg }}>1</span>s
            from <span style={{ color: C.pos }}>8</span>s — built so you can see
            exactly what &ldquo;AI&rdquo; is doing when it isn&apos;t doing very
            much at all.
          </p>
          <div
            className="mt-10 text-sm max-w-2xl leading-relaxed"
            style={{ color: C.textDim }}
          >
            Before you give an agent the keys to your repo, you should be able
            to draw the math of its great-grandparent on a napkin. This page is
            that napkin.
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 space-y-20">
        {/* ============== §1 The math ============== */}
        <section>
          <SectionLabel num="01">The entire model.</SectionLabel>
          <p
            className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}
          >
            A perceptron is a weighted sum, squashed through a sigmoid. That is
            the whole apparatus. Four hundred numbers (one per pixel), plus one
            scalar bias, plus a curve that bends the output into a probability.
            Everything you will see below — the training, the &ldquo;learning,&rdquo;
            the seemingly emergent visual templates — is just gradient descent
            on the four equations on the right.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Schematic">
              <div className="flex items-center justify-center py-6">
                <svg viewBox="0 0 380 180" className="w-full max-w-md">
                  {/* input pixels */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <g key={i}>
                      <circle
                        cx={40}
                        cy={20 + i * 32}
                        r={8}
                        fill={C.surfaceAlt}
                        stroke={C.border}
                      />
                      <text
                        x={20}
                        y={24 + i * 32}
                        fill={C.textDim}
                        fontSize={11}
                        fontFamily="'JetBrains Mono',monospace"
                      >
                        x{i === 4 ? "ₙ" : i + 1}
                      </text>
                      <line
                        x1={48}
                        y1={20 + i * 32}
                        x2={200}
                        y2={90}
                        stroke={C.border}
                        strokeWidth={0.6}
                      />
                      <text
                        x={120}
                        y={15 + i * 28}
                        fill={C.textFaint}
                        fontSize={9}
                        fontFamily="'JetBrains Mono',monospace"
                      >
                        w{i === 4 ? "ₙ" : i + 1}
                      </text>
                    </g>
                  ))}
                  {/* neuron */}
                  <circle
                    cx={210}
                    cy={90}
                    r={26}
                    fill={C.surfaceAlt}
                    stroke={C.accent}
                    strokeWidth={1.2}
                  />
                  <text
                    x={210}
                    y={87}
                    fill={C.text}
                    fontSize={11}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    Σ
                  </text>
                  <text
                    x={210}
                    y={102}
                    fill={C.accent}
                    fontSize={10}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    σ
                  </text>
                  {/* bias */}
                  <text
                    x={210}
                    y={140}
                    fill={C.textDim}
                    fontSize={10}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    + b
                  </text>
                  {/* output */}
                  <line
                    x1={236}
                    y1={90}
                    x2={320}
                    y2={90}
                    stroke={C.border}
                    strokeWidth={0.8}
                  />
                  <text
                    x={336}
                    y={94}
                    fill={C.text}
                    fontSize={12}
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    ŷ
                  </text>
                  <text
                    x={278}
                    y={82}
                    fill={C.textFaint}
                    fontSize={9}
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    P(class=8)
                  </text>
                </svg>
              </div>
              <p
                className="text-xs mt-2 text-center"
                style={{ color: C.textFaint, fontStyle: "italic" }}
              >
                400 input pixels → one weighted sum → one squashed scalar.
              </p>
            </Panel>

            <Panel title="The four equations">
              <pre
                className="text-[13px] md:text-sm leading-7 overflow-x-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: C.text,
                }}
              >
                <span style={{ color: C.textFaint }}>{"// forward pass\n"}</span>
                <span style={{ color: C.accent }}>{"  z   "}</span>
                <span>{"=  w·x + b\n"}</span>
                <span style={{ color: C.accent }}>{"  ŷ   "}</span>
                <span>{"=  σ(z)  =  1 / (1 + e⁻ᶻ)\n\n"}</span>
                <span style={{ color: C.textFaint }}>{"// loss  (binary cross-entropy)\n"}</span>
                <span style={{ color: C.accent }}>{"  L   "}</span>
                <span>{"= −[y·log ŷ + (1−y)·log(1−ŷ)]\n\n"}</span>
                <span style={{ color: C.textFaint }}>{"// gradient  (sigmoid+BCE → clean)\n"}</span>
                <span style={{ color: C.accent }}>{"  ∂L/∂wᵢ "}</span>
                <span>{"= (ŷ − y)·xᵢ\n"}</span>
                <span style={{ color: C.accent }}>{"  ∂L/∂b  "}</span>
                <span>{"= (ŷ − y)\n\n"}</span>
                <span style={{ color: C.textFaint }}>{"// SGD update,  η = learning rate\n"}</span>
                <span style={{ color: C.accent }}>{"  wᵢ "}</span>
                <span>{"←  wᵢ − η(ŷ − y)·xᵢ\n"}</span>
                <span style={{ color: C.accent }}>{"  b  "}</span>
                <span>{"←  b  − η(ŷ − y)"}</span>
              </pre>
            </Panel>
          </div>
        </section>

        {/* ============== §2 Training ============== */}
        <section>
          <SectionLabel num="02">Training, in real time.</SectionLabel>
          <p
            className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}
          >
            Hit <em>Train</em>. The neuron sees a fresh, procedurally-generated
            digit at every step, computes ŷ, measures how wrong it was, and
            nudges every weight down the gradient. Watch the right-hand panel:
            the weight grid is the model&apos;s entire <em>understanding</em> of
            what an 8 looks like, and you can see it crystallize.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* controls */}
            <Panel title="Controls" className="lg:col-span-1">
              <div className="space-y-5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTraining((v) => !v)}
                    className="flex-1 py-2.5 text-sm tracking-wide transition-colors"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: isTraining ? C.accent : C.surfaceAlt,
                      color: isTraining ? C.bg : C.text,
                      border: `1px solid ${isTraining ? C.accent : C.border}`,
                    }}
                  >
                    {isTraining ? "▮▮  PAUSE" : "▶  TRAIN"}
                  </button>
                  <button
                    onClick={reset}
                    className="px-4 py-2.5 text-sm tracking-wide"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: "transparent",
                      color: C.textDim,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    RESET
                  </button>
                </div>

                <div>
                  <div
                    className="flex justify-between text-[11px] tracking-[0.18em] uppercase mb-2"
                    style={{
                      color: C.textDim,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span>learning rate η</span>
                    <span style={{ color: C.text }}>{lr.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.5"
                    step="0.001"
                    value={lr}
                    onChange={(e) => setLr(parseFloat(e.target.value))}
                    className="w-full"
                    style={{ accentColor: C.accent }}
                  />
                </div>

                <div>
                  <div
                    className="flex justify-between text-[11px] tracking-[0.18em] uppercase mb-2"
                    style={{
                      color: C.textDim,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span>noise σ</span>
                    <span style={{ color: C.text }}>{noise.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.01"
                    value={noise}
                    onChange={(e) => setNoise(parseFloat(e.target.value))}
                    className="w-full"
                    style={{ accentColor: C.accent }}
                  />
                </div>

                <div>
                  <div
                    className="flex justify-between text-[11px] tracking-[0.18em] uppercase mb-2"
                    style={{
                      color: C.textDim,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span>steps / frame</span>
                    <span style={{ color: C.text }}>{stepsPerFrame}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="80"
                    step="1"
                    value={stepsPerFrame}
                    onChange={(e) =>
                      setStepsPerFrame(parseInt(e.target.value, 10))
                    }
                    className="w-full"
                    style={{ accentColor: C.accent }}
                  />
                </div>

                <div
                  className="grid grid-cols-2 gap-4 pt-4"
                  style={{ borderTop: `1px solid ${C.border}` }}
                >
                  <StatBlock
                    label="step"
                    value={stepRef.current.toLocaleString()}
                  />
                  <StatBlock
                    label="rolling acc"
                    value={`${(accuracy * 100).toFixed(1)}%`}
                  />
                  <StatBlock
                    label="bias b"
                    value={b.toFixed(3)}
                  />
                  <StatBlock
                    label="‖w‖"
                    value={Math.sqrt(
                      Array.from(w).reduce((a, x) => a + x * x, 0)
                    ).toFixed(3)}
                  />
                </div>
              </div>
            </Panel>

            {/* loss */}
            <Panel title="Loss (BCE, running mean)" className="lg:col-span-2">
              <div style={{ height: 220 }}>
                {lossHistory.length < 2 ? (
                  <div
                    className="h-full flex items-center justify-center text-sm italic"
                    style={{ color: C.textFaint }}
                  >
                    Press <span className="mx-1.5">▶ TRAIN</span> to begin.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lossHistory}
                      margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke={C.border}
                        strokeDasharray="2 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="step"
                        tick={{
                          fill: C.textFaint,
                          fontSize: 10,
                          fontFamily: "JetBrains Mono",
                        }}
                        stroke={C.border}
                      />
                      <YAxis
                        tick={{
                          fill: C.textFaint,
                          fontSize: 10,
                          fontFamily: "JetBrains Mono",
                        }}
                        stroke={C.border}
                        domain={[0, "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          fontFamily: "JetBrains Mono",
                          fontSize: 11,
                          color: C.text,
                        }}
                        labelStyle={{ color: C.textDim }}
                      />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        stroke={C.accent}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
          </div>

          {/* weights + sample gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Panel title="Learned weights w  (the model's mind)" className="lg:col-span-2">
              <div className="flex flex-col md:flex-row items-center gap-8 py-2">
                <div
                  style={{
                    border: `1px solid ${C.border}`,
                    padding: 6,
                    background: C.bg,
                  }}
                >
                  <WeightCanvas weights={w} size={260} />
                </div>
                <div className="flex-1 text-sm leading-relaxed" style={{ color: C.textDim }}>
                  <p className="mb-4">
                    <span style={{ color: C.pos }}>Warm pixels</span> are weights
                    that <em>pull the output toward 8</em>. <span style={{ color: C.neg }}>Cool pixels</span>{" "}
                    pull toward 1.
                  </p>
                  <p className="mb-4">
                    After enough steps you should see two faint stacked rings
                    in red — the &ldquo;canonical 8&rdquo; — surrounded by a
                    blue vertical strip where 1s typically live. The neuron has
                    no idea what shapes <em>are</em>. It only knows which pixels
                    statistically vote which way.
                  </p>
                  <p
                    className="text-xs italic"
                    style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    range auto-normalised to ±max|wᵢ|
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Sample inputs">
              <div className="grid grid-cols-3 gap-2">
                {[0, 0, 0, 1, 1, 1].map((y, i) => {
                  const x = y === 0 ? genOne(noise) : genEight(noise);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        style={{
                          border: `1px solid ${C.border}`,
                          background: C.bg,
                        }}
                      >
                        <DigitCanvas pixels={x} size={64} />
                      </div>
                      <div
                        className="text-[10px]"
                        style={{
                          color: y === 0 ? C.neg : C.pos,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        y = {y === 0 ? "「1」" : "「8」"}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p
                className="text-xs mt-3 italic"
                style={{ color: C.textFaint }}
              >
                Generated procedurally with σ = {noise.toFixed(2)} additive noise.
              </p>
            </Panel>
          </div>
        </section>

        {/* ============== §3 Inference ============== */}
        <section>
          <SectionLabel num="03">What the neuron sees.</SectionLabel>
          <p
            className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}
          >
            Here is the trick that makes the perceptron stop being mysterious.
            Pick any input. For each pixel, multiply its intensity by its weight.
            That number is the <em>actual contribution</em> of that pixel to the
            decision. Plot all four hundred contributions side by side. You are
            now looking at exactly what your model &ldquo;attended to.&rdquo;
            Nothing more is happening. There is no ghost.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Panel title="Input x">
              <div className="flex justify-center">
                <div style={{ border: `1px solid ${C.border}`, background: C.bg }}>
                  <DigitCanvas pixels={testSample.x} size={160} />
                </div>
              </div>
              <div
                className="mt-4 text-center text-sm"
                style={{ color: C.textDim, fontFamily: "'JetBrains Mono', monospace" }}
              >
                truth: <span style={{ color: testSample.y === 0 ? C.neg : C.pos }}>
                  {testSample.y === 0 ? "「1」" : "「8」"}
                </span>
              </div>
            </Panel>

            <Panel title="Per-pixel contribution wᵢ·xᵢ">
              <div className="flex justify-center">
                <div style={{ border: `1px solid ${C.border}`, background: C.bg }}>
                  <ContribCanvas pixels={testSample.x} weights={w} size={160} />
                </div>
              </div>
              <div
                className="mt-4 text-center text-xs"
                style={{ color: C.textFaint, fontStyle: "italic" }}
              >
                red votes &ldquo;8&rdquo;, blue votes &ldquo;1&rdquo;.
                <br />
                their sum + bias = z.
              </div>
            </Panel>

            <Panel title="Decision">
              <div className="space-y-5">
                <div>
                  <div
                    className="text-[10px] tracking-[0.2em] uppercase mb-1"
                    style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    pre-activation z
                  </div>
                  <div
                    className="text-2xl"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: C.text }}
                  >
                    {tz.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] tracking-[0.2em] uppercase mb-1"
                    style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    σ(z) = ŷ
                  </div>
                  <ConfBar p={testProb} />
                </div>
                <div
                  className="pt-3 text-center"
                  style={{ borderTop: `1px solid ${C.border}` }}
                >
                  <div
                    className="text-[10px] tracking-[0.2em] uppercase mb-1"
                    style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    verdict
                  </div>
                  <div
                    className="text-lg"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: testCorrect ? C.ok : C.err,
                    }}
                  >
                    {testCorrect ? "✓ correct" : "✗ wrong"}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={newTest}
                    className="flex-1 py-2 text-xs tracking-wide"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: C.surfaceAlt,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    NEXT
                  </button>
                  <button
                    onClick={findError}
                    className="flex-1 py-2 text-xs tracking-wide"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: "transparent",
                      color: C.err,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    FIND ERROR
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        </section>

        {/* ============== §4 Adversarial ============== */}
        <section>
          <SectionLabel num="04">Try to fool it.</SectionLabel>
          <p
            className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}
          >
            Draw your own digit. Train the model first, then come back here and
            try drawing a 1 that the perceptron classifies as an 8 — or
            something that isn&apos;t a digit at all. Notice that the model has
            no concept of &ldquo;digit&rdquo;. It will confidently classify a
            blob of pixels in the lower-left as a confident 8 if those pixels
            happen to land on its red regions. This is exactly the failure
            mode of every model your engineers will ever ship.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Panel title="Your input">
              <div className="flex flex-col items-center gap-3">
                <DrawPad pixels={drawPixels} setPixels={setDrawPixels} size={260} />
                <button
                  onClick={() => setDrawPixels(new Float32Array(N))}
                  className="px-4 py-1.5 text-xs tracking-wide"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "transparent",
                    color: C.textDim,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  CLEAR
                </button>
              </div>
            </Panel>

            <Panel title="What the neuron sees">
              <div className="flex justify-center">
                <div style={{ border: `1px solid ${C.border}`, background: C.bg }}>
                  <ContribCanvas pixels={drawPixels} weights={w} size={260} />
                </div>
              </div>
              <p
                className="mt-3 text-xs text-center italic"
                style={{ color: C.textFaint }}
              >
                contribution map of your drawing
              </p>
            </Panel>

            <Panel title="Live decision">
              <div className="flex flex-col h-full justify-center gap-5">
                <div>
                  <div
                    className="text-[10px] tracking-[0.2em] uppercase mb-1.5"
                    style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    σ(z) = ŷ
                  </div>
                  <ConfBar p={drawProb} />
                </div>
                <div
                  className="text-center text-2xl py-4"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: drawProb > 0.5 ? C.pos : C.neg,
                  }}
                >
                  {drawPixels.some((p) => p > 0.05)
                    ? drawProb > 0.5
                      ? "predicts 8"
                      : "predicts 1"
                    : "—"}
                </div>
                <p
                  className="text-xs italic leading-relaxed"
                  style={{ color: C.textFaint }}
                >
                  Every model is a lookup table dressed up. The trick is finding
                  inputs that exploit the table&apos;s blind spots.
                </p>
              </div>
            </Panel>
          </div>
        </section>

        {/* ============== §5 Code ============== */}
        <section>
          <SectionLabel num="05">The training step, in full.</SectionLabel>
          <p
            className="text-base leading-relaxed mb-8 max-w-3xl"
            style={{ color: C.textDim }}
          >
            This is the literal function being called several thousand times
            per second above. No framework. No abstraction. If you cannot read
            this and feel the gradient flow in your bones, read it again.
          </p>

          <Panel>
            <pre
              className="text-[12.5px] leading-6 overflow-x-auto"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: C.text,
              }}
            >
{`function trainStep(x, y, w, b, lr) {
  // ---- forward pass: z = w·x + b,  ŷ = σ(z)
  let z = b;
  for (let i = 0; i < N; i++) z += x[i] * w[i];
  const yHat = sigmoid(z);

  // ---- gradient of BCE w.r.t. z is just (ŷ − y)
  const grad = yHat - y;

  // ---- SGD update on every weight, then on bias
  for (let i = 0; i < N; i++) w[i] -= lr * grad * x[i];
  b -= lr * grad;

  // ---- BCE loss for monitoring (not used in update)
  const eps = 1e-7;
  const loss = -(y * Math.log(yHat + eps)
               + (1 - y) * Math.log(1 - yHat + eps));

  return { b, yHat, loss };
}`}
            </pre>
          </Panel>
        </section>

        {/* ============== §6 Things to notice ============== */}
        <section>
          <SectionLabel num="06">Things to make your engineers notice.</SectionLabel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                t: "The model is just numbers.",
                d: "401 floats. There is nothing else. When a system gives you a confident answer, it gave you a function-of-floats.",
              },
              {
                t: "Confidence ≠ correctness.",
                d: "Crank up the noise to 0.25, train, then hit FIND ERROR. The neuron will be 99% confident and totally wrong. Never read confidence as truth.",
              },
              {
                t: "The weight image is the prior.",
                d: "What the neuron 'expects' to see is literally drawn out for you. With LLMs the same is true; you just can't render it as a 20×20 image.",
              },
              {
                t: "Off-distribution is invisible to the model.",
                d: "Draw a square in the corner. The neuron will classify it. It does not know that it does not know. Train your engineers to detect this from the outside.",
              },
              {
                t: "Learning rate is a load-bearing decision.",
                d: "Push η to 0.5. Watch the loss explode and the weight image become noise. Push it to 0.001 — convergence in geological time. Every hyperparameter has this shape.",
              },
              {
                t: "A linear classifier has linear failures.",
                d: "This perceptron cannot learn XOR-shaped problems. Stack two of these (with a non-linearity between) and you can. That is the entire history of deep learning in one sentence.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `2px solid ${C.accent}`,
                }}
              >
                <div
                  className="text-sm mb-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: C.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.t}
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: C.textDim }}
                >
                  {item.d}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============== Footer ============== */}
        <div
          className="pt-10 text-xs flex items-center justify-between"
          style={{
            borderTop: `1px solid ${C.border}`,
            color: C.textFaint,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>perceptron.dissected · 4FF</span>
          <span>
            σ(z) = 1 / (1 + e⁻ᶻ) ·  Rosenblatt, 1958 ·  rendered live
          </span>
        </div>
      </div>
    </div>
  );
}
