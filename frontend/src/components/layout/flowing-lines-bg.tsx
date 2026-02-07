"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * Organic flowing lines background for light mode.
 * Large irregular curves that wander, tumble, and flip across the viewport.
 */

// Layered sine noise — smooth, non-repeating
function noise(t: number, seed: number): number {
  return (
    Math.sin(t * 0.67 + seed * 3.17) * 0.5 +
    Math.sin(t * 1.13 + seed * 1.37) * 0.3 +
    Math.cos(t * 0.41 + seed * 5.71) * 0.2 +
    Math.sin(t * 1.79 + seed * 0.53) * 0.15 +
    Math.cos(t * 0.29 + seed * 2.91) * 0.1
  );
}

// Mulberry32 seeded PRNG
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CtrlPt {
  sx: number; // noise seed X
  sy: number; // noise seed Y
  spd: number; // speed multiplier
}

interface Ribbon {
  pts: CtrlPt[];
  rgb: [number, number, number];
  alpha: number;    // base stroke alpha
  width: number;    // base stroke width
  tOff: number;     // time offset
  flipSeed: number; // seed for tumbling width pulse
}

function makeRibbons(): Ribbon[] {
  const rng = mulberry32(77);
  const colors: [number, number, number][] = [
    [16, 185, 129],  // emerald
    [5, 150, 105],
    [52, 211, 153],
    [234, 179, 8],   // gold
    [217, 119, 6],
    [251, 191, 36],
  ];
  const out: Ribbon[] = [];

  for (let i = 0; i < 8; i++) {
    const n = 4 + Math.floor(rng() * 3);
    const pts: CtrlPt[] = [];
    for (let j = 0; j < n; j++) {
      pts.push({ sx: rng() * 100, sy: rng() * 100, spd: 0.6 + rng() * 0.5 });
    }
    out.push({
      pts,
      rgb: colors[Math.floor(rng() * colors.length)],
      alpha: i < 3 ? 0.35 + rng() * 0.15 : 0.18 + rng() * 0.12,
      width: i < 3 ? 2.5 + rng() * 2 : 1 + rng() * 1.5,
      tOff: rng() * 300,
      flipSeed: rng() * 100,
    });
  }
  return out;
}

// Catmull-Rom point interpolation
function cmPoint(pts: [number, number][], frac: number): [number, number] {
  const n = pts.length - 1;
  const f = Math.max(0, Math.min(frac * n, n - 0.001));
  const i = Math.floor(f);
  const t = f - i;
  const t2 = t * t;
  const t3 = t2 * t;

  const p0 = pts[Math.max(i - 1, 0)];
  const p1 = pts[i];
  const p2 = pts[Math.min(i + 1, n)];
  const p3 = pts[Math.min(i + 2, n)];

  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

function draw(
  ctx: CanvasRenderingContext2D,
  rb: Ribbon,
  w: number,
  h: number,
  t: number,
) {
  // Resolve control point positions from noise
  const coords: [number, number][] = rb.pts.map((p) => {
    const tt = (t + rb.tOff) * p.spd;
    const nx = noise(tt, p.sx);
    const ny = noise(tt, p.sy);
    // Spread across the full viewport with overshoot
    return [(nx * 0.55 + 0.5) * w, (ny * 0.55 + 0.5) * h];
  });

  // Tumble factor — width & alpha pulse to simulate ribbon flip
  const flip = 0.35 + 0.65 * Math.abs(noise(t * 0.2, rb.flipSeed));

  const [r, g, b] = rb.rgb;
  const steps = rb.pts.length * 16;

  ctx.lineCap = "round";

  for (let i = 0; i < steps; i++) {
    const f0 = i / steps;
    const f1 = (i + 1) / steps;
    const [x0, y0] = cmPoint(coords, f0);
    const [x1, y1] = cmPoint(coords, f1);

    // Edge fade (smooth at both ends)
    const edge = Math.sin(f0 * Math.PI);
    // Width wave along the curve — large period for "翻轉" look
    const wave = 0.3 + 0.7 * Math.abs(Math.sin(f0 * Math.PI * 1.5 + t * 0.4 + rb.flipSeed));

    const a = rb.alpha * edge * flip * wave;
    const lw = rb.width * wave * flip;

    if (a < 0.01 || lw < 0.2) continue;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = `rgba(${r},${g},${b},${a.toFixed(2)})`;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

export function FlowingLinesBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const ribbonsRef = useRef<Ribbon[]>(makeRibbons());
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);
  themeRef.current = resolvedTheme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    function resize() {
      const el = canvas!.parentElement;
      if (!el) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement!);

    function loop(ts: number) {
      ctx!.clearRect(0, 0, w, h);
      // Only draw in light mode
      if (themeRef.current !== "dark") {
        const t = ts / 1000;
        for (const rb of ribbonsRef.current) {
          draw(ctx!, rb, w, h, t);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
