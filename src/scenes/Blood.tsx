import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, rand} from '../anim';
import {PressureArrow} from '../components/fluid';
import {Arrow, Badge, Formula, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuluh darah yang menyempit karena plak:
//  F1 (baris 0–2): arteri + plak tumbuh; sel darah merah mempercepat di penyempitan (kontinuitas),
//     kolom tekanan lebih rendah di sana (Bernoulli); dinding lemah tertekan dari luar → menutup sesaat → bergetar.
//  F2 (baris 3–4): Poiseuille — aliran laminar berprofil parabola; jari-jari × 0,8 → debit × 0,8⁴ ≈ 0,41.
//  F3 (baris 5): jantung memompa lebih keras, jarum tekanan darah naik.

const RBC = '#e0414f';
const RBC_D = '#9e1f33';
const PLAQUE = '#e9c46a';
const TISSUE = '#7a2a3e';
const TISSUE_E = '#d9788c';
const WALL = 24;

type RFn = (x: number) => number;

/** Penyempitan halus (kosinus) di xc dengan setengah lebar w. */
const stenosis = (R0: number, xc: number, w: number, rmin: number): RFn => (x) => {
  const u = (x - xc) / w;
  if (Math.abs(u) >= 1) return R0;
  return R0 - (R0 - rmin) * (0.5 + 0.5 * Math.cos(Math.PI * u));
};

/** "Waktu tempuh" aliran sumbat (v ∝ 1/r²) dalam satuan px: τ = ∫ (r/R0)² dx. */
const travel = (x0: number, x1: number, R0: number, r: RFn, n = 120) => {
  const xs: number[] = [x0];
  const ts: number[] = [0];
  let acc = 0;
  const dx = (x1 - x0) / n;
  for (let i = 1; i <= n; i++) {
    const xm = x0 + (i - 0.5) * dx;
    acc += dx * (r(xm) / R0) ** 2;
    xs.push(x0 + i * dx);
    ts.push(acc);
  }
  const xAt = (tau: number) => {
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ts[mid] < tau) lo = mid;
      else hi = mid;
    }
    const u = (tau - ts[lo]) / Math.max(1e-9, ts[hi] - ts[lo]);
    return xs[lo] + (xs[hi] - xs[lo]) * u;
  };
  return {T: acc, xAt};
};

/** Integral numerik ∫ f dt dari a ke b (langkah tetap) — fase partikel tetap mulus saat bentuk/aliran berubah. */
const integrate = (f: (tt: number) => number, a: number, b: number, dt = 1 / 15) => {
  if (b <= a) return 0;
  let acc = 0;
  let tt = a;
  while (tt < b) {
    const h = Math.min(dt, b - tt);
    acc += f(tt + h / 2) * h;
    tt += h;
  }
  return acc;
};

/** Sel darah merah (cakram bikonkaf) dengan jejak gerak yang memanjang saat cepat. */
const Cell: React.FC<{x: number; y: number; v: number; tilt: number; op: number; s?: number}> = ({x, y, v, tilt, op, s = 1}) => {
  if (op <= 0.01) return null;
  const streak = Math.min(60, v * 0.06);
  return (
    <g opacity={op}>
      {streak > 6 ? <line x1={x - streak} y1={y} x2={x - 8} y2={y} stroke={RBC} strokeOpacity={0.4} strokeWidth={7 * s} strokeLinecap="round" /> : null}
      <ellipse cx={x} cy={y} rx={10 * s} ry={(4 + 3 * Math.abs(Math.cos(tilt))) * s} fill={RBC} stroke="#ff8a96" strokeWidth={1} />
      <ellipse cx={x} cy={y} rx={4.5 * s} ry={(1.5 + 1.2 * Math.abs(Math.cos(tilt))) * s} fill={RBC_D} />
    </g>
  );
};

/** Arteri mendatar (aliran sumbat, kontinuitas) dengan plak dan sel darah merah. */
const Artery: React.FC<{x0: number; x1: number; yc: number; R0: number; r: RFn; A: number; t: number; op?: number; lanes?: number; per?: number; v0: number; seed?: number}> = ({
  x0,
  x1,
  yc,
  R0,
  r,
  A,
  t,
  op = 1,
  lanes = 7,
  per = 7,
  v0,
  seed = 0,
}) => {
  if (op <= 0.001) return null;
  const tab = travel(x0, x1, R0, r);
  const N = 90;
  const xs = Array.from({length: N + 1}, (_, i) => x0 + ((x1 - x0) * i) / N);
  const P = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const topIn = xs.map((x) => [x, yc - r(x)] as [number, number]);
  const botIn = xs.map((x) => [x, yc + r(x)] as [number, number]);
  const topWall = xs.map((x) => [x, yc - R0] as [number, number]);
  const botWall = xs.map((x) => [x, yc + R0] as [number, number]);
  const lumen = `${P(topIn)} ${P([...botIn].reverse()).replace(/^M/, 'L')} Z`;
  const plaqueTop = `${P(topWall)} ${P([...topIn].reverse()).replace(/^M/, 'L')} Z`;
  const plaqueBot = `${P(botWall)} ${P([...botIn].reverse()).replace(/^M/, 'L')} Z`;
  const id = `art-${Math.round(x0)}-${Math.round(yc)}`;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a0c1a" />
          <stop offset="50%" stopColor="#6e1a2c" />
          <stop offset="100%" stopColor="#3a0c1a" />
        </linearGradient>
      </defs>
      {/* jaringan dinding */}
      <rect x={x0} y={yc - R0 - WALL} width={x1 - x0} height={WALL} fill={TISSUE} />
      <rect x={x0} y={yc + R0} width={x1 - x0} height={WALL} fill={TISSUE} />
      <line x1={x0} y1={yc - R0 - WALL} x2={x1} y2={yc - R0 - WALL} stroke={TISSUE_E} strokeWidth={3} />
      <line x1={x0} y1={yc + R0 + WALL} x2={x1} y2={yc + R0 + WALL} stroke={TISSUE_E} strokeWidth={3} />
      {Array.from({length: 18}, (_, k) => {
        const x = x0 + ((k + 0.5) / 18) * (x1 - x0);
        return (
          <g key={k} opacity={0.35}>
            <path d={`M${x - 20},${yc - R0 - WALL * 0.5} q20,${-6 + 3 * Math.sin(t + k)} 40,0`} fill="none" stroke={TISSUE_E} strokeWidth={1.5} />
            <path d={`M${x - 20},${yc + R0 + WALL * 0.5} q20,${6 + 3 * Math.sin(t + k)} 40,0`} fill="none" stroke={TISSUE_E} strokeWidth={1.5} />
          </g>
        );
      })}
      <path d={lumen} fill={`url(#${id})`} />
      {/* plak */}
      <path d={plaqueTop} fill={PLAQUE} opacity={0.92} />
      <path d={plaqueBot} fill={PLAQUE} opacity={0.92} />
      <path d={P(topIn)} fill="none" stroke="#fff1c4" strokeOpacity={0.55} strokeWidth={2} />
      <path d={P(botIn)} fill="none" stroke="#fff1c4" strokeOpacity={0.55} strokeWidth={2} />
      {/* sel darah merah */}
      {Array.from({length: lanes}, (_, j) => {
        const f = -0.78 + (1.56 * j) / (lanes - 1);
        return Array.from({length: per}, (_, k) => {
          const ph = (((A + k / per + rand(j * 7.3 + seed) * 0.9) % 1) + 1) % 1;
          const x = tab.xAt(ph * tab.T);
          const rr = r(x);
          const v = v0 * (R0 / rr) ** 2;
          const y = yc + f * rr + 3 * Math.sin(t * 2 + j + k);
          const fade = Math.min(1, ph * 14) * Math.min(1, (1 - ph) * 14);
          return <Cell key={`${j}-${k}`} x={x} y={y} v={v} tilt={t * 1.5 + j * 1.1 + k * 2.3} op={fade} s={1.15 * (0.7 + 0.3 * (rr / R0)) + 0.15} />;
        });
      })}
    </g>
  );
};

/** Kolom tekanan (piezometer) di atas arteri. */
const Piezo: React.FC<{x: number; yBase: number; h: number; t: number; op: number}> = ({x, yBase, h, t, op}) => {
  if (op <= 0.001) return null;
  const top = 300;
  const lv = yBase - h + 2 * Math.sin(t * 3 + x * 0.01);
  return (
    <g opacity={op}>
      <rect x={x - 12} y={top} width={24} height={yBase - top} fill="#160a1c" />
      <rect x={x - 9} y={lv} width={18} height={yBase - lv} fill={C.press} opacity={0.75} />
      <path d={`M${x - 9},${lv + 2} Q${x},${lv - 5} ${x + 9},${lv + 2}`} fill={C.press} />
      <path d={`M${x - 13},${top} L${x - 13},${yBase} M${x + 13},${top} L${x + 13},${yBase}`} stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} />
      <line x1={x - 7} y1={top + 8} x2={x - 7} y2={yBase - 6} stroke="#fff" strokeOpacity={0.15} strokeWidth={3} />
    </g>
  );
};

/** Pembuluh laminar (Poiseuille): profil kecepatan parabola, kecepatan maks ∝ R². */
const Laminar: React.FC<{x0: number; x1: number; yc: number; R: number; I: number; t: number; op: number; vmax: number; seed: number}> = ({x0, x1, yc, R, I, t, op, vmax, seed}) => {
  if (op <= 0.001) return null;
  const L = x1 - x0;
  const lanes = 9;
  const id = `lam-${seed}`;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a0c1a" />
          <stop offset="50%" stopColor="#6e1a2c" />
          <stop offset="100%" stopColor="#3a0c1a" />
        </linearGradient>
      </defs>
      <rect x={x0} y={yc - R - WALL} width={L} height={WALL} fill={TISSUE} />
      <rect x={x0} y={yc + R} width={L} height={WALL} fill={TISSUE} />
      <line x1={x0} y1={yc - R - WALL} x2={x1} y2={yc - R - WALL} stroke={TISSUE_E} strokeWidth={3} />
      <line x1={x0} y1={yc + R + WALL} x2={x1} y2={yc + R + WALL} stroke={TISSUE_E} strokeWidth={3} />
      <rect x={x0} y={yc - R} width={L} height={2 * R} fill={`url(#${id})`} />
      {Array.from({length: lanes}, (_, j) => {
        const f = -0.84 + (1.68 * j) / (lanes - 1);
        const g = 1 - f * f;
        return Array.from({length: 5}, (_, k) => {
          const ph = ((((I * g * 260) / L + k / 5 + rand(j * 3.7 + seed) * 0.8) % 1) + 1) % 1;
          const x = x0 + ph * L;
          const fade = Math.min(1, ph * 14) * Math.min(1, (1 - ph) * 14);
          return <Cell key={`${j}-${k}`} x={x} y={yc + f * R} v={260 * g * vmax} tilt={t * 1.3 + j + k * 2} op={fade} s={1.05} />;
        });
      })}
      {/* profil parabola di depan */}
      <path
        d={Array.from({length: 21}, (_, i) => {
          const f = -1 + i / 10;
          return `${i ? 'L' : 'M'}${(x0 + 40 + (1 - f * f) * 120 * vmax).toFixed(1)},${(yc + f * R).toFixed(1)}`;
        }).join(' ')}
        fill="none"
        stroke={C.cyan}
        strokeWidth={3}
      />
      {[-0.75, -0.4, 0, 0.4, 0.75].map((f) => (
        <line key={f} x1={x0 + 40} y1={yc + f * R} x2={x0 + 32 + (1 - f * f) * 120 * vmax} y2={yc + f * R} stroke={C.cyan} strokeWidth={3} markerEnd="url(#arrow-cyan)" opacity={0.9} />
      ))}
      <line x1={x0 + 40} y1={yc - R} x2={x0 + 40} y2={yc + R} stroke={C.cyan} strokeOpacity={0.4} strokeWidth={1.5} />
    </g>
  );
};

const heartPath = (s: number) => `M0,${0.9 * s} C${-1.5 * s},${-0.1 * s} ${-0.7 * s},${-1.15 * s} 0,${-0.35 * s} C${0.7 * s},${-1.15 * s} ${1.5 * s},${-0.1 * s} 0,${0.9 * s} Z`;

export const Blood: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  /* ---------- fase ---------- */
  const appear = ramp(t, -0.4, 1.0);
  const p1 = appear * (1 - ramp(t, cue(3) - 0.5, cue(3) + 0.4, EASE_IN_OUT));
  const p2 = ramp(t, cue(3) - 0.2, cue(3) + 0.7) * (1 - ramp(t, cue(5) - 0.5, cue(5) + 0.3, EASE_IN_OUT));
  const p3 = ramp(t, cue(5) - 0.2, cue(5) + 0.7);

  /* ---------- F1: plak & getaran ---------- */
  const R0 = 82;
  const RMIN = 34;
  const tPl = wordOf(0, 'plak');
  const grow = (tt: number) => ramp(tt, wordOf(0, 'menyempit') - 0.3, tPl + 0.6, EASE_IN_OUT);
  const flut = (tt: number) => ramp(tt, wordOf(2, 'menekan') - 0.4, wordOf(2, 'menekan') + 0.4) * (1 - ramp(tt, cue(3) - 0.2, cue(3) + 0.4, EASE_IN_OUT));
  const close = (tt: number) => flut(tt) * (0.5 - 0.5 * Math.cos((2 * Math.PI * tt) / 1.5)) ** 4;
  const rmin1 = (tt: number) => mix(R0, RMIN, grow(tt)) - 24 * close(tt);
  const q1 = (tt: number) => Math.min(1, (rmin1(tt) / RMIN) * 1.15);
  const X0 = 100;
  const X1 = 1820;
  const YC = 610;
  const XC = 960;
  const r1 = stenosis(R0, XC, 250, rmin1(t));
  const V0 = 110;
  const A1 = integrate((tt) => (V0 * q1(tt)) / travel(X0, X1, R0, stenosis(R0, XC, 250, rmin1(tt)), 40).T, -1, t);
  const yBase = YC - R0 - WALL;
  const pz = ramp(t, cue(1) - 0.2, cue(1) + 0.8);
  const tFast = wordOf(1, 'cepat');
  const tLow = wordOf(1, 'tekanannya');
  const lowP = ramp(t, tLow - 0.3, tLow + 0.8, EASE_IN_OUT);
  const hNarrow = mix(150, 60, lowP) - 22 * close(t);
  const vOp = ramp(t, tFast - 0.4, tFast + 0.4) * (1 - ramp(t, cue(2) - 0.2, cue(2) + 0.5, EASE_IN_OUT));
  const fl = flut(t);
  const shake = 3 * fl * Math.sin(t * 40) * close(t);

  /* ---------- F2: Poiseuille ---------- */
  const shr = (tt: number) => ramp(tt, wordOf(3, 'menyempit') - 0.2, wordOf(3, 'persen') + 0.4, EASE_IN_OUT);
  const R2 = (tt: number) => mix(70, 56, shr(tt));
  const Itop = integrate(() => 1, cue(3) - 1, t);
  const Ibot = integrate((tt) => (R2(tt) / 70) ** 2, cue(3) - 1, t);
  const Rb = R2(t);
  const vb = (Rb / 70) ** 2;
  const qb = (Rb / 70) ** 4;
  const fQ = ramp(t, wordOf(3, 'Poiseuille') - 0.2, wordOf(3, 'Poiseuille') + 0.6) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.1, EASE_IN_OUT));
  const fQ2 = ramp(t, cue(4) - 0.1, cue(4) + 0.6);
  const tEmp = wordOf(4, 'empat');
  const pct = ramp(t, tEmp - 0.3, tEmp + 0.6);
  const bars = ramp(t, cue(3) + 0.8, cue(3) + 1.6);
  const qShow = mix(1, qb, ramp(t, wordOf(3, 'persen') - 0.2, tEmp + 0.3, EASE_IN_OUT));

  /* ---------- F3: jantung ---------- */
  const harder = ramp(t, wordOf(5, 'memompa') - 0.3, wordOf(5, 'keras') + 0.5, EASE_IN_OUT);
  const bpUp = ramp(t, wordOf(5, 'tekanan') - 0.3, wordOf(5, 'naik') + 0.8, EASE_IN_OUT);
  const hr = (tt: number) => 1.1 + 0.45 * ramp(tt, wordOf(5, 'memompa') - 0.3, wordOf(5, 'keras') + 0.5, EASE_IN_OUT);
  const beatPh = integrate(hr, cue(5) - 1.5, t);
  const beat = Math.max(0, Math.sin(beatPh * 2 * Math.PI)) ** 4;
  const X3 = 520;
  const XC3 = 1150;
  const r3 = stenosis(70, XC3, 200, 34);
  const T3 = travel(X3, X1, 70, r3, 40).T;
  const A3 = integrate((tt) => {
    const b = Math.max(0, Math.sin(integrate(hr, cue(5) - 1.5, tt, 1 / 5) * 2 * Math.PI)) ** 4;
    return (90 * (0.7 + 0.5 * b) * (1 + 0.5 * ramp(tt, wordOf(5, 'memompa') - 0.3, wordOf(5, 'keras') + 0.5))) / T3;
  }, cue(5) - 1.2, t, 1 / 10);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======= F1 ======= */}
        {p1 > 0.001 ? (
          <g opacity={p1}>
            <Glow x={XC} y={YC} r={520} color="heat" opacity={0.3} />
            <Motes x={960} y={YC} rx={860} ry={260} n={26} color="heat" opacity={0.3} seed={3} />
            <g transform={`translate(0 ${shake.toFixed(2)})`}>
              <Artery x0={X0} x1={X1} yc={YC} R0={R0} r={r1} A={A1} t={t} v0={V0 * q1(t)} />
            </g>
            {/* label plak */}
            <g opacity={ramp(t, tPl - 0.3, tPl + 0.5) * (1 - pz)}>
              <line x1={XC} y1={YC - RMIN - 30} x2={XC + 150} y2={390} stroke={PLAQUE} strokeWidth={2} />
              <circle cx={XC} cy={YC - RMIN - 30} r={6} fill={PLAQUE} />
              <Label x={XC + 160} y={380} anchor="start" size={30} color={PLAQUE} weight={600}>
                plak (timbunan lemak)
              </Label>
            </g>
            <Ripple x={XC} y={YC} p={(t - tPl) / 1.4} r={200} color="force" rings={2} />
            {/* kolom tekanan */}
            <Piezo x={470} yBase={yBase} h={150} t={t} op={pz} />
            <Piezo x={XC} yBase={yBase} h={hNarrow} t={t} op={pz} />
            <Piezo x={1450} yBase={yBase} h={150} t={t} op={pz} />
            <Label x={470} y={262} size={26} color={C.press} opacity={pz}>
              p tinggi
            </Label>
            <Label x={1450} y={262} size={26} color={C.press} opacity={pz}>
              p tinggi
            </Label>
            <Label x={XC} y={262} size={26} color={C.press} weight={600} opacity={pz * lowP}>
              p rendah
            </Label>
            <Glow x={XC} y={yBase - hNarrow} r={90} color="press" opacity={0.5 * lowP * pz} />
            {/* panah kecepatan di bawah arteri */}
            <g opacity={vOp}>
              <Arrow x1={430} y1={770} x2={510} y2={770} color="cyan" width={5} />
              <Arrow x1={XC - 120} y1={770} x2={XC + 140} y2={770} color="cyan" width={6} />
              <Arrow x1={1410} y1={770} x2={1490} y2={770} color="cyan" width={5} />
              <Label x={470} y={812} size={26} color={C.cyan}>
                v kecil
              </Label>
              <Label x={XC} y={812} size={28} color={C.cyan} weight={600}>
                v besar
              </Label>
              <Label x={1450} y={812} size={26} color={C.cyan}>
                v kecil
              </Label>
            </g>
            {/* tekanan luar menekan dinding lemah */}
            <g opacity={fl}>
              {[-120, -60, 60, 120].map((dx) => (
                <g key={dx}>
                  <PressureArrow x={XC + dx} y={YC - R0 - WALL - 4 + 30 * close(t)} nx={0} ny={-1} L={56 + 14 * close(t)} width={5} />
                  <PressureArrow x={XC + dx} y={YC + R0 + WALL + 4 - 30 * close(t)} nx={0} ny={1} L={56 + 14 * close(t)} width={5} />
                </g>
              ))}
              {[0, 1, 2].map((k) => (
                <path
                  key={k}
                  d={`M${XC - 200 - k * 26},${YC - 60} q-14,60 0,120 M${XC + 200 + k * 26},${YC - 60} q14,60 0,120`}
                  fill="none"
                  stroke={C.press}
                  strokeWidth={2.5}
                  opacity={close(t) * (0.7 - k * 0.2)}
                />
              ))}
              <Ripple x={XC} y={YC} p={((((t / 1.5) % 1) + 1) % 1) * 1.1} r={150} color="press" rings={1} width={2} />
            </g>
          </g>
        ) : null}

        {/* ======= F2: Poiseuille ======= */}
        {p2 > 0.001 ? (
          <g opacity={p2}>
            <Motes x={640} y={500} rx={560} ry={300} n={24} color="heat" opacity={0.3} seed={8} />
            <Laminar x0={130} x1={960} yc={350} R={70} I={Itop} t={t} op={1} vmax={1} seed={1} />
            <Laminar x0={130} x1={960} yc={660} R={Rb} I={Ibot} t={t} op={1} vmax={vb} seed={2} />
            {/* ukuran jari-jari */}
            <Arrow x1={990} y1={350} x2={990} y2={280} color="ink" width={3} pulse={false} />
            <Label x={1012} y={315} anchor="start" size={30} color={C.ink} font="serif" italic>
              r
            </Label>
            <Arrow x1={990} y1={660} x2={990} y2={660 - Rb} color="heat" width={3} pulse={false} />
            <Label x={1012} y={660 - Rb / 2} anchor="start" size={30} color={C.heat} font="serif" italic opacity={ramp(shr(t), 0.3, 1)}>
              0,8 r
            </Label>
            <Label x={1012} y={660 - Rb / 2} anchor="start" size={30} color={C.ink} font="serif" italic opacity={1 - ramp(shr(t), 0.3, 1)}>
              r
            </Label>
            {/* batang debit */}
            <g opacity={bars}>
              {[
                {y: 350, q: 1, c: C.water},
                {y: 660, q: qShow, c: C.water},
              ].map((b, i) => (
                <g key={i}>
                  <rect x={1110} y={b.y - 70} width={56} height={140} rx={10} fill={b.c} opacity={0.1} stroke={b.c} strokeOpacity={0.5} strokeWidth={2} />
                  <rect x={1114} y={b.y + 66 - 132 * b.q} width={48} height={132 * b.q} rx={7} fill={b.c} opacity={0.85} />
                  <path d={`M1114,${b.y + 66 - 132 * b.q} q12,${-4 * Math.sin(t * 3 + i)} 24,0 t24,0`} fill="none" stroke="#dff3ff" strokeWidth={2} />
                  <Label x={1138} y={b.y - 92} size={24} color={C.water} font="serif" italic>
                    Q
                  </Label>
                </g>
              ))}
              <Label x={1186} y={350} anchor="start" size={28} color={C.ink} weight={600}>
                100 %
              </Label>
              <Label x={1186} y={660} anchor="start" size={28} color={C.ink} weight={600} opacity={1 - pct}>
                {`${Math.round(qShow * 100)} %`}
              </Label>
              <Label x={1186} y={660} anchor="start" size={30} color={C.heat} weight={700} opacity={pct}>
                ≈ 41 %
              </Label>
            </g>
            <Ripple x={1138} y={660} p={(t - tEmp) / 1.3} r={140} color="heat" rings={2} />
            <Twinkles x={1230} y={660} rx={90} ry={40} n={4} color="gold" opacity={pct} seed={4} />
          </g>
        ) : null}

        {/* ======= F3: jantung memompa lebih keras ======= */}
        {p3 > 0.001 ? (
          <g opacity={p3}>
            <Motes x={900} y={560} rx={760} ry={260} n={24} color="heat" opacity={0.35} seed={11} />
            <Glow x={330} y={600} r={260 + 60 * beat} color="heat" opacity={0.45 + 0.3 * beat * (0.5 + harder)} />
            {/* pembuluh dari jantung ke arteri */}
            <path d={`M380,600 C440,600 470,650 ${X3},650`} fill="none" stroke={TISSUE} strokeWidth={2 * 70 + 2 * WALL} />
            <path d={`M380,600 C440,600 470,650 ${X3},650`} fill="none" stroke="#5a1424" strokeWidth={140} />
            <Artery x0={X3} x1={X1} yc={650} R0={70} r={r3} A={A3} t={t} v0={90} lanes={6} per={6} seed={5} />
            <g transform={`translate(330 600) scale(${(1 + (0.09 + 0.08 * harder) * beat).toFixed(3)})`}>
              <path d={heartPath(110)} fill={C.heat} stroke="#ffb0bb" strokeWidth={3} />
              <path d={heartPath(80)} fill="#ff7a8a" opacity={0.35} transform="translate(-14 -10)" />
              <path d="M-30,-60 C-30,-110 10,-120 20,-150" fill="none" stroke="#ff9aa8" strokeWidth={14} strokeLinecap="round" />
              <path d="M24,-56 C30,-100 60,-110 70,-140" fill="none" stroke="#6aa0ff" strokeWidth={12} strokeLinecap="round" opacity={0.8} />
            </g>
            <Ripple x={330} y={600} p={(((beatPh % 1) + 1) % 1) * 1.2} r={220} color="heat" rings={1} width={2} />
            <Stream
              pts={[
                [330, 600],
                [430, 600],
                [X3 + 40, 650],
              ]}
              color="heat"
              n={6}
              speed={0.8 + 0.6 * harder}
              r={5}
              jitter={10}
            />
            {/* pengukur tekanan darah */}
            {(() => {
              const gx = 1440;
              const gy = 290;
              const R = 120;
              const a0 = -210;
              const a1 = 30;
              const val = 0.35 + 0.33 * bpUp + 0.04 * beat;
              const ang = ((a0 + (a1 - a0) * val) * Math.PI) / 180;
              const arc = (u0: number, u1: number) => {
                const A = ((a0 + (a1 - a0) * u0) * Math.PI) / 180;
                const B = ((a0 + (a1 - a0) * u1) * Math.PI) / 180;
                return `M${gx + Math.cos(A) * R * 0.86},${gy + Math.sin(A) * R * 0.86} A${R * 0.86},${R * 0.86} 0 ${u1 - u0 > 0.75 ? 1 : 0} 1 ${gx + Math.cos(B) * R * 0.86},${gy + Math.sin(B) * R * 0.86}`;
              };
              return (
                <g opacity={ramp(t, cue(5) + 0.2, cue(5) + 1.0)}>
                  <circle cx={gx} cy={gy} r={R * 1.6} fill="url(#soft-press)" opacity={0.3 + 0.4 * bpUp} />
                  <circle cx={gx} cy={gy} r={R} fill="#121a3a" stroke="#c9d2ee" strokeWidth={5} />
                  <path d={arc(0, 0.5)} fill="none" stroke={C.work} strokeWidth={10} opacity={0.7} />
                  <path d={arc(0.5, 0.75)} fill="none" stroke={C.force} strokeWidth={10} opacity={0.7} />
                  <path d={arc(0.75, 1)} fill="none" stroke={C.heat} strokeWidth={10} opacity={0.8} />
                  {Array.from({length: 13}, (_, k) => {
                    const A = ((a0 + ((a1 - a0) * k) / 12) * Math.PI) / 180;
                    return <line key={k} x1={gx + Math.cos(A) * R * 0.62} y1={gy + Math.sin(A) * R * 0.62} x2={gx + Math.cos(A) * R * 0.74} y2={gy + Math.sin(A) * R * 0.74} stroke={C.muted} strokeWidth={k % 3 === 0 ? 3 : 1.5} />;
                  })}
                  <line x1={gx} y1={gy} x2={gx + Math.cos(ang) * R * 0.8} y2={gy + Math.sin(ang) * R * 0.8} stroke={C.press} strokeWidth={6} strokeLinecap="round" />
                  <circle cx={gx} cy={gy} r={10} fill={C.press} />
                  <text x={gx} y={gy + 58} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.muted}>
                    mmHg
                  </text>
                  <Label x={gx} y={gy + R + 40} size={28} color={C.press} weight={600}>
                    tekanan darah
                  </Label>
                  <g opacity={bpUp}>
                    <Arrow x1={gx + R + 50} y1={gy + 50} x2={gx + R + 50} y2={gy - 60} color="press" width={6} />
                  </g>
                </g>
              );
            })()}
          </g>
        ) : null}
      </Stage>

      {/* F1: catatan getaran */}
      <Note x={1450} y={834} p={fl * ramp(t, wordOf(2, 'tertutup') - 0.3, wordOf(2, 'tertutup') + 0.4)} color={C.press} size={28}>
        tertutup sesaat ↔ terbuka lagi
      </Note>
      <Note x={470} y={834} p={fl * ramp(t, wordOf(2, 'luar') - 0.3, wordOf(2, 'luar') + 0.4)} color={C.press} size={28}>
        <span style={{color: C.press}}>p</span> luar &gt; <span style={{color: C.press}}>p</span> dalam
      </Note>

      {/* F2: rumus Poiseuille */}
      <Formula x={1600} y={300} p={fQ * p2} accent={C.heat} size={72} caption="Poiseuille · beda tekanan tetap">
        <V color={C.water}>Q</V> ∝ <V>r</V>
        <Sup>4</Sup>
      </Formula>
      <Formula x={1600} y={300} p={fQ2 * p2} accent={C.heat} size={64} caption="r × 0,8 · Δp tetap">
        (0,8)<Sup>4</Sup> ≈ <b style={{color: C.heat}}>0,41</b>
      </Formula>
      <Badge x={1600} y={520} text="≈ 40 %" color={C.heat} size={44} opacity={pct * p2} scale={0.9 + 0.1 * BACK(Math.min(1, pct))} />

      {/* F3 */}
      <Note x={760} y={300} p={p3 * harder} color={C.heat} size={30}>
        jantung memompa lebih keras
      </Note>
    </AbsoluteFill>
  );
};
