import type { CSSProperties } from "react";

/**
 * Abstract sun + roof + panels composition. Pure SVG, no remote images.
 * Geometry is computed from a single roof parallelogram so the panel grid
 * always sits in perspective on the roof plane.
 *
 * It also tells the page's story in motion (styles live in Hero.module.css):
 * panels are installed one by one, sunlight flows onto them, each panel
 * "charges", energy runs down to the meter and the house lights up.
 * Layers carry a depth (--d) so they shift with the pointer and scroll.
 */

type Pt = readonly [number, number];

// Roof plane: A → B (ridge direction) and A → D (slope direction). A + C = B + D.
const A: Pt = [96, 336];
const B: Pt = [314, 262];
const D: Pt = [322, 378];
const C: Pt = [B[0] + D[0] - A[0], B[1] + D[1] - A[1]];
const WALL = 92;
const SUN: Pt = [430, 168];

const COLS = 5;
const ROWS = 3;
const MARGIN = 0.07;
const GAP = 0.018;

function onRoof(s: number, t: number): Pt {
  return [A[0] + (B[0] - A[0]) * s + (D[0] - A[0]) * t, A[1] + (B[1] - A[1]) * s + (D[1] - A[1]) * t];
}

const pts = (list: Pt[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const depth = (d: number, extra?: Record<string, string | number>) => ({ "--d": d, ...extra }) as CSSProperties;

const panels = (() => {
  const span = 1 - MARGIN * 2;
  const w = (span - GAP * (COLS - 1)) / COLS;
  const h = (span - GAP * (ROWS - 1)) / ROWS;
  const out: { key: string; row: number; col: number; points: string; cells: string[] }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const s0 = MARGIN + c * (w + GAP);
      const t0 = MARGIN + r * (h + GAP);
      // Cell lines inside each panel (2 across, 3 down).
      const cells = [
        pts([onRoof(s0 + w / 2, t0), onRoof(s0 + w / 2, t0 + h)]),
        pts([onRoof(s0, t0 + h / 3), onRoof(s0 + w, t0 + h / 3)]),
        pts([onRoof(s0, t0 + (2 * h) / 3), onRoof(s0 + w, t0 + (2 * h) / 3)]),
      ];
      out.push({
        key: `${r}-${c}`,
        row: r,
        col: c,
        points: pts([onRoof(s0, t0), onRoof(s0 + w, t0), onRoof(s0 + w, t0 + h), onRoof(s0, t0 + h)]),
        cells,
      });
    }
  }
  return out;
})();

// Sunbeams: from the edge of the sun to points spread across the array.
const rays = [
  [0.2, 0.3],
  [0.5, 0.2],
  [0.8, 0.35],
  [0.35, 0.7],
  [0.7, 0.75],
].map(([s, t], i) => {
  const end = onRoof(s, t);
  const dx = end[0] - SUN[0];
  const dy = end[1] - SUN[1];
  const len = Math.hypot(dx, dy);
  const start: Pt = [SUN[0] + (dx / len) * 96, SUN[1] + (dy / len) * 96];
  return { key: i, d: `M${start[0].toFixed(1)} ${start[1].toFixed(1)} L${end[0].toFixed(1)} ${end[1].toFixed(1)}` };
});

// Energy path: off the eave, down the front wall, into the meter.
const eave = onRoof(0.02, 0.86);
const FLOW = `M${eave[0].toFixed(1)} ${eave[1].toFixed(1)} L${eave[0].toFixed(1)} 392 L298 392 L298 402`;

const sparks = [
  { s: 0.25, t: 0.25, delay: 0 },
  { s: 0.6, t: 0.45, delay: 1.1 },
  { s: 0.85, t: 0.2, delay: 2.3 },
  { s: 0.45, t: 0.8, delay: 3.2 },
  { s: 0.1, t: 0.6, delay: 1.7 },
];

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 560"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f3b2e" />
          <stop offset="0.62" stopColor="#1f5c47" />
          <stop offset="1" stopColor="#2c6b50" />
        </linearGradient>
        <radialGradient id="ha-sun" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="0.45" stopColor="#f6b44b" />
          <stop offset="1" stopColor="#ef6a43" />
        </radialGradient>
        <radialGradient id="ha-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6b44b" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f6b44b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ha-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d4f5c" />
          <stop offset="1" stopColor="#0b2a2a" />
        </linearGradient>
        <linearGradient id="ha-beam" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6b44b" stopOpacity="0.32" />
          <stop offset="1" stopColor="#d9ec7a" stopOpacity="0" />
        </linearGradient>
        <clipPath id="ha-frame">
          <rect width="600" height="560" rx="32" />
        </clipPath>
        <clipPath id="ha-roof">
          <polygon points={pts([A, B, C, D])} />
        </clipPath>
      </defs>

      <g clipPath="url(#ha-frame)">
        <rect width="600" height="560" fill="url(#ha-sky)" />

        {/* Sun, halo and orbit rings — the farthest layer */}
        <g className="ha-layer ha-sunlayer" style={depth(6)}>
          <g className="ha-sun">
            <circle cx={SUN[0]} cy={SUN[1]} r="190" fill="url(#ha-glow)" />
            <circle
              className="ha-orbit"
              cx={SUN[0]}
              cy={SUN[1]}
              r="132"
              fill="none"
              stroke="#d9ec7a"
              strokeOpacity="0.22"
              strokeDasharray="2 8"
            />
            <circle cx={SUN[0]} cy={SUN[1]} r="176" fill="none" stroke="#d9ec7a" strokeOpacity="0.14" />
            <circle
              className="ha-orbit ha-orbit-rev"
              cx={SUN[0]}
              cy={SUN[1]}
              r="228"
              fill="none"
              stroke="#d9ec7a"
              strokeOpacity="0.1"
              strokeDasharray="1 10"
            />
            <circle cx={SUN[0]} cy={SUN[1]} r="86" fill="url(#ha-sun)" />
          </g>
        </g>

        {/* Desert ridgelines (overscanned so they never show an edge while moving) */}
        <g className="ha-layer" style={depth(10)}>
          <path
            d="M-60 370 L0 356 L70 318 L128 334 L196 286 L262 322 L330 300 L402 330 L470 292 L540 318 L600 300 L660 312 L660 600 L-60 600 Z"
            fill="#174a3a"
          />
        </g>
        <g className="ha-layer" style={depth(16)}>
          <path
            d="M-60 404 L0 398 L90 372 L170 390 L250 366 L350 388 L440 360 L520 382 L600 368 L660 376 L660 600 L-60 600 Z"
            fill="#0f3b2e"
          />
          <rect x="-60" y="452" width="720" height="148" fill="#0a2a20" />
        </g>

        {/* Light falling on the roof */}
        <polygon className="ha-beam" points="380,210 470,230 330,380 170,330" fill="url(#ha-beam)" />

        {/* The house */}
        <g className="ha-layer" style={depth(24)}>
          {/* Walls */}
          <polygon points={pts([A, D, [D[0], D[1] + WALL], [A[0], A[1] + WALL]])} fill="#f3ecdf" />
          <polygon points={pts([D, C, [C[0], C[1] + WALL], [D[0], D[1] + WALL]])} fill="#d8ccb4" />
          {/* Door and windows — the windows light up once power flows */}
          <polygon points={pts([[240, 378], [274, 385], [274, 455], [240, 448]])} fill="#0f3b2e" />
          <polygon className="ha-window" points={pts([[140, 368], [196, 379], [196, 408], [140, 397]])} fill="#1f5c47" />
          <polygon
            className="ha-window ha-window-side"
            points={pts([[372, 396], [452, 368], [452, 400], [372, 428]])}
            fill="#bfb198"
          />

          {/* Meter on the front wall */}
          <polygon points={pts([[286, 402], [310, 406], [310, 430], [286, 426]])} fill="#0f3b2e" />
          <circle className="ha-meter" cx="298" cy="416" r="4" fill="#d9ec7a" />

          {/* Roof deck */}
          <polygon points={pts([A, B, C, D])} fill="#e9dfcc" />
          <polygon points={pts([A, D, [D[0], D[1] + 8], [A[0], A[1] + 8]])} fill="#c9bb9f" />
          <polygon points={pts([D, C, [C[0], C[1] + 8], [D[0], D[1] + 8]])} fill="#b3a488" />

          {/* Panels — installed one by one, then charging in a wave */}
          <g>
            {panels.map((p) => (
              <g key={p.key} className="ha-panel" style={{ "--i": p.row + p.col * 2 } as CSSProperties}>
                <polygon points={p.points} fill="url(#ha-panel)" stroke="#d9ec7a" strokeOpacity="0.55" strokeWidth="1" />
                {p.cells.map((line, i) => (
                  <polyline key={i} points={line} fill="none" stroke="#d9ec7a" strokeOpacity="0.22" strokeWidth="0.8" />
                ))}
                <polygon
                  className="ha-charge"
                  points={p.points}
                  fill="#d9ec7a"
                  opacity="0"
                  style={{ "--w": p.col + p.row * 0.5 } as CSSProperties}
                />
              </g>
            ))}
          </g>

          {/* Glint sweeping across the array */}
          <g clipPath="url(#ha-roof)">
            <polygon
              className="ha-glint"
              points={pts([onRoof(0.18, 0), onRoof(0.3, 0), onRoof(0.08, 1), onRoof(-0.04, 1)])}
              fill="#ffffff"
              opacity="0.12"
            />
          </g>

          {/* Energy running down to the meter */}
          <path d={FLOW} fill="none" stroke="#0f3b2e" strokeOpacity="0.25" strokeWidth="3" strokeLinejoin="round" />
          <path
            className="ha-flow"
            d={FLOW}
            fill="none"
            stroke="#d9ec7a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 10"
          />

          {/* Sparks rising off the panels */}
          {sparks.map((s, i) => {
            const [x, y] = onRoof(s.s, s.t);
            return (
              <circle
                key={i}
                className="ha-spark"
                cx={x}
                cy={y}
                r="2.4"
                fill="#ffe3a3"
                style={{ animationDelay: `${2.4 + s.delay}s` }}
              />
            );
          })}
        </g>

        {/* Sunbeams onto the array */}
        <g className="ha-layer" style={depth(18)}>
          {rays.map((r) => (
            <path
              key={r.key}
              className="ha-ray"
              d={r.d}
              fill="none"
              stroke="#ffe3a3"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="3 16"
              style={{ "--i": r.key } as CSSProperties}
            />
          ))}
        </g>

        {/* Low desert shrubs — the nearest layer */}
        <g className="ha-layer" style={depth(34)}>
          <ellipse cx="72" cy="456" rx="34" ry="16" fill="#2c6b50" />
          <ellipse cx="560" cy="440" rx="46" ry="20" fill="#2c6b50" />
          <ellipse cx="520" cy="452" rx="28" ry="12" fill="#1f5c47" />
        </g>
      </g>
    </svg>
  );
}
