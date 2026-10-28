import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT} from '../theme';

// Viskometer Ostwald: tabung U kaca (bola atas + tanda A/B, pipa kapiler, bola reservoir).
// Cairan dihisap ke atas tanda A, dilepas, meniskus turun A → B sambil stopwatch berjalan.
// Fase 1 (baris 0–3): satu viskometer besar (air, 60 s) + panel encer/kental + gaya berat ρg + rumus η ∝ ρt.
// Fase 2 (baris 4–5): air 60 s vs cairan X (ρ = 800) 90 s berdampingan → η_X = 1,2 mPa·s ≈ etanol.

const LIQ_X = '#c7a4ff';
const HONEY = '#e8a53a';
const GLASS = '#bfe3ff';

// geometri lokal (asal = dasar tabung U, satuan px pada skala 1)
const XR = 55; // lengan kanan (bola + kapiler)
const XL = -55; // lengan kiri (reservoir)
const Y_A = -515;
const Y_B = -375;
const BULB = {cy: -445, rx: 32, ry: 62};
const RES = {cy: -110, rx: 52, ry: 66};
const YM_REST = -178;
const YM_FULL = -560;
const YR_REST = -150;
const YR_FULL = -62;
const S_A = (YM_REST - Y_A) / (YM_REST - YM_FULL);
const S_B = (YM_REST - Y_B) / (YM_REST - YM_FULL);

const fmt1 = (v: number) => v.toFixed(1).replace('.', ',');

/** Mendekati nol secara halus (tanpa patahan) saat cairan hampir habis mengalir. */
const soft = (s: number) => (s >= 0.15 ? s : 0.15 * Math.exp((s - 0.15) / 0.15));

type Run = {s0: number; s1: number; rel: number; rate: number};

/** Keadaan pengisian s (0 = diam di bawah, 1 = terhisap di atas tanda A) dari daftar hisapan berurutan. */
const sAt = (t: number, runs: Run[]): number => {
  let idx = -1;
  for (let i = 0; i < runs.length; i++) if (runs[i].s0 <= t) idx = i;
  if (idx < 0) return 0;
  const r = runs[idx];
  const prev = sAt(r.s0 - 1e-4, runs.slice(0, idx));
  if (t < r.s1) return mix(prev, 1, ramp(t, r.s0, r.s1, EASE_IN_OUT));
  if (t < r.rel) return 1;
  return soft(1 - (t - r.rel) * r.rate);
};
/** Waktu meniskus melewati tanda A dan B untuk sebuah hisapan. */
const passAB = (r: Run) => ({tA: r.rel + (1 - S_A) / r.rate, tB: r.rel + (1 - S_B) / r.rate});

/** Setengah lebar lengan kanan pada ketinggian y (untuk meniskus). */
const halfR = (y: number) => {
  if (y < -505) return 8;
  if (y < -383) {
    const u = (y - BULB.cy) / BULB.ry;
    return Math.max(8, BULB.rx * Math.sqrt(Math.max(0, 1 - u * u)));
  }
  if (y < -365) return 8;
  return 3.5;
};
const halfL = (y: number) => {
  if (y < -176) return 11;
  const u = (y - RES.cy) / RES.ry;
  return Math.max(11, RES.rx * Math.sqrt(Math.max(0, 1 - u * u)));
};

/** Bentuk dalam kaca (dipakai untuk garis tepi, isi kaca, dan klip cairan). */
const Interior: React.FC<{fill: string; stroke?: string; sw?: number}> = ({fill, stroke, sw = 0}) => {
  const common = {fill, stroke, strokeWidth: sw};
  return (
    <>
      <rect x={XR - 8} y={-640} width={16} height={145} {...common} />
      <ellipse cx={XR} cy={BULB.cy} rx={BULB.rx} ry={BULB.ry} {...common} />
      <rect x={XR - 8} y={-392} width={16} height={30} {...common} />
      <rect x={XR - 3.5} y={-370} width={7} height={330} {...common} />
      <rect x={XL - 6} y={-48} width={XR - XL + 9.5} height={18} rx={9} {...common} />
      <ellipse cx={XL} cy={RES.cy} rx={RES.rx} ry={RES.ry} {...common} />
      <rect x={XL - 11} y={-640} width={22} height={480} {...common} />
    </>
  );
};

/** Viskometer Ostwald lengkap dengan statif, cairan, meniskus, dan partikel di kapiler. */
const Ostwald: React.FC<{
  id: string;
  x: number;
  y: number;
  s: number;
  fill: number;
  color: string;
  t: number;
  flowing: number;
  reveal?: number;
  op?: number;
  marks?: number;
  rho?: number;
  bulbOp?: number;
}> = ({id, x, y, s, fill, color, t, flowing, reveal = 1, op = 1, marks = 1, rho = 0, bulbOp = 0}) => {
  if (op <= 0.001) return null;
  const ym = mix(YM_REST, YM_FULL, fill);
  const yr = mix(YR_REST, YR_FULL, fill);
  const hw = halfR(ym);
  const hl = halfL(yr);
  const wob = 1.2 * Math.sin(t * 2.6 + x * 0.01);
  const revH = 760 * reveal;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})`} opacity={op}>
      <defs>
        <clipPath id={`${id}-in`}>
          <Interior fill="#fff" />
        </clipPath>
        <clipPath id={`${id}-rev`}>
          <rect x={-260} y={-700} width={420} height={revH} />
        </clipPath>
        <linearGradient id={`${id}-liq`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <stop offset="45%" stopColor={color} stopOpacity={0.95} />
          <stop offset="100%" stopColor={color} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      {/* statif */}
      <g opacity={0.85}>
        <rect x={-250} y={6} width={190} height={16} rx={6} fill="#26315c" stroke="#6f7fb8" strokeWidth={2} />
        <rect x={-176} y={-700} width={12} height={710} rx={4} fill="#3a4677" stroke="#7d8cc4" strokeWidth={1.5} />
        {[-560, -300].map((cy) => (
          <g key={cy}>
            <rect x={-170} y={cy - 6} width={112} height={12} rx={4} fill="#3a4677" stroke="#7d8cc4" strokeWidth={1.5} />
            <rect x={XL - 20} y={cy - 14} width={40} height={28} rx={8} fill="#4a3a2a" stroke="#c49a6c" strokeWidth={2} />
          </g>
        ))}
      </g>
      <ellipse cx={0} cy={26} rx={150} ry={10} fill="#000" opacity={0.3} />
      <g clipPath={`url(#${id}-rev)`}>
        {/* tepi kaca (garis luar gabungan) lalu isi kaca menutup sambungan dalam */}
        <Interior fill="none" stroke={GLASS} sw={7} />
        <Interior fill="#0d1838" />
        {/* cairan */}
        <g clipPath={`url(#${id}-in)`}>
          <rect x={10} y={ym + wob * 0.3} width={120} height={-ym + 10} fill={`url(#${id}-liq)`} />
          <rect x={-140} y={yr - wob * 0.5} width={150.5} height={-yr + 10} fill={`url(#${id}-liq)`} />
          {/* partikel cairan mengalir turun di kapiler lalu ke reservoir */}
          {Array.from({length: 9}, (_, k) => {
            const ph = (((t * 0.55 + k / 9) % 1) + 1) % 1;
            const path: [number, number][] = [
              [XR, Math.max(ym + 6, -366)],
              [XR, -40],
              [XL, -40],
              [XL, yr + 10],
            ];
            const L1 = path[1][1] - path[0][1];
            const L2 = path[1][0] - path[2][0];
            const L3 = Math.max(0, path[2][1] - path[3][1]);
            const tot = Math.max(1, L1 + L2 + L3);
            const d = ph * tot;
            let px: number;
            let py: number;
            if (d < L1) {
              px = XR;
              py = path[0][1] + d;
            } else if (d < L1 + L2) {
              px = XR - (d - L1);
              py = -40;
            } else {
              px = XL + 6 * Math.sin(k);
              py = -40 - (d - L1 - L2);
            }
            return <circle key={k} cx={px} cy={py} r={2.4} fill="#fff" opacity={flowing * cyc(ph) * 0.9} />;
          })}
        </g>
        {/* meniskus cekung + permukaan reservoir */}
        <path d={`M${XR - hw},${ym - 3} Q${XR},${ym + 5} ${XR + hw},${ym - 3}`} fill="none" stroke="#eaf6ff" strokeWidth={2.4} opacity={0.9} />
        <path d={`M${XL - hl},${yr - 3 - wob * 0.5} Q${XL},${yr + 4 - wob * 0.5} ${XL + hl},${yr - 3 - wob * 0.5}`} fill="none" stroke="#eaf6ff" strokeWidth={2} opacity={0.7} />
        {/* kilau kaca */}
        <line x1={XL - 6} y1={-630} x2={XL - 6} y2={-190} stroke="#fff" strokeOpacity={0.16} strokeWidth={3} />
        <path d={`M${XR - 20},${BULB.cy - 40} Q${XR - 27},${BULB.cy} ${XR - 20},${BULB.cy + 40}`} fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={3} />
        <path d={`M${XL - 38},${RES.cy - 40} Q${XL - 46},${RES.cy} ${XL - 38},${RES.cy + 40}`} fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={3} />
        {/* tanda A dan B */}
        <g opacity={marks}>
          {[Y_A, Y_B].map((yy) => (
            <line key={yy} x1={XR - 16} y1={yy} x2={XR + 16} y2={yy} stroke={C.gold} strokeWidth={3} />
          ))}
          <text x={XR + 24} y={Y_A} dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill={C.gold}>
            A
          </text>
          <text x={XR + 24} y={Y_B} dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill={C.gold}>
            B
          </text>
        </g>
      </g>
      {/* pompa karet di ujung lengan kanan (saat menghisap) */}
      {bulbOp > 0.001 ? (
        <g opacity={bulbOp}>
          <rect x={XR - 10} y={-676} width={20} height={40} rx={5} fill="#5a2a3a" stroke="#ff9db8" strokeWidth={2} />
          <ellipse cx={XR} cy={-706} rx={26 * (1 - 0.25 * Math.max(0, Math.sin(t * 7)))} ry={30} fill="#7a3550" stroke="#ff9db8" strokeWidth={2} />
        </g>
      ) : null}
      {/* berat kolom cairan: ρg mendorong turun */}
      {rho > 0.001 ? (
        <g opacity={rho}>
          <line x1={XR + 62} y1={Math.min(ym, Y_B) + 10} x2={XR + 62} y2={-120} stroke={C.force} strokeWidth={5} markerEnd="url(#arrow-force)" />
          <text x={XR + 78} y={-260} dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={36} fill={C.spr}>
            ρ<tspan fill={C.force}>g</tspan>
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** Stopwatch: jarum (60 s per putaran), tombol, dan angka digital. */
const Stopwatch: React.FC<{x: number; y: number; r: number; sec: number; t: number; op?: number; color?: string; digOp?: number; side?: boolean; caption?: string; capOp?: number}> = ({
  x,
  y,
  r,
  sec,
  t,
  op = 1,
  color = C.cyan,
  digOp = 1,
  side,
  caption,
  capOp = 1,
}) => {
  if (op <= 0.001) return null;
  const a = (sec / 60) * Math.PI * 2;
  return (
    <g opacity={op}>
      <circle cx={x} cy={y} r={r * 1.7} fill={`url(#soft-cyan)`} opacity={0.35 + 0.1 * Math.sin(t * 2)} />
      <rect x={x - r * 0.14} y={y - r * 1.32} width={r * 0.28} height={r * 0.26} rx={3} fill="#8fa0d0" />
      <rect x={x - r * 0.3} y={y - r * 1.44} width={r * 0.6} height={r * 0.14} rx={4} fill="#c9d2ee" />
      <circle cx={x} cy={y} r={r * 1.08} fill="#1a2550" stroke="#c9d2ee" strokeWidth={4} />
      <circle cx={x} cy={y} r={r * 0.94} fill="#0c1430" stroke={color} strokeOpacity={0.4} strokeWidth={2} />
      {Array.from({length: 12}, (_, k) => {
        const aa = (k / 12) * Math.PI * 2;
        const r1 = r * (k % 3 === 0 ? 0.72 : 0.8);
        return <line key={k} x1={x + Math.sin(aa) * r1} y1={y - Math.cos(aa) * r1} x2={x + Math.sin(aa) * r * 0.88} y2={y - Math.cos(aa) * r * 0.88} stroke={C.muted} strokeWidth={k % 3 === 0 ? 3 : 1.5} />;
      })}
      <path d={`M${x},${y} L${x + Math.sin(0) * r * 0.86},${y - r * 0.86} A${r * 0.86},${r * 0.86} 0 ${a > Math.PI ? 1 : 0} 1 ${x + Math.sin(a) * r * 0.86},${y - Math.cos(a) * r * 0.86} Z`} fill={color} opacity={0.16} />
      <line x1={x} y1={y} x2={x + Math.sin(a) * r * 0.82} y2={y - Math.cos(a) * r * 0.82} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={5} fill={color} />
      <text
        x={side ? x + r * 1.3 : x}
        y={side ? y : y + r * 1.5}
        textAnchor={side ? 'start' : 'middle'}
        dominantBaseline="central"
        fontFamily={FONT.mono}
        fontWeight={600}
        fontSize={Math.max(24, r * 0.46)}
        fill={C.ink}
        opacity={digOp}
        style={{paintOrder: 'stroke', stroke: 'rgba(7,11,24,0.9)', strokeWidth: 5}}
      >
        {fmt1(sec)} s
      </text>
      {caption && capOp > 0.001 ? (
        <text x={x} y={y + r * 1.5 + 40} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={24} fill={C.gold} opacity={capOp}>
          {caption}
        </text>
      ) : null}
    </g>
  );
};

/** Pipa kapiler mini untuk perbandingan encer vs kental: meniskus turun berulang dengan periode berbeda. */
const MiniTube: React.FC<{x: number; y: number; h: number; period: number; color: string; t: number; off: number}> = ({x, y, h, period, color, t, off}) => {
  const ph = (((t + off) / period) % 1 + 1) % 1;
  const fall = ramp(ph, 0.08, 0.92, (u) => u);
  const refill = ramp(ph, 0.92, 1, EASE_IN_OUT);
  const lvl = y + h * 0.12 + h * 0.7 * fall * (1 - refill);
  return (
    <g>
      <rect x={x - 18} y={y} width={36} height={h} rx={10} fill="#0d1838" stroke={GLASS} strokeOpacity={0.75} strokeWidth={3} />
      <rect x={x - 14} y={lvl} width={28} height={y + h - 4 - lvl} rx={6} fill={color} opacity={0.8} />
      <path d={`M${x - 14},${lvl - 2} Q${x},${lvl + 5} ${x + 14},${lvl - 2}`} fill="none" stroke="#fff" strokeWidth={2} opacity={0.7} />
      {Array.from({length: 5}, (_, k) => {
        const q = (((t / period) * 3 + k / 5) % 1 + 1) % 1;
        const yy = lvl + 8 + q * (y + h - 16 - lvl);
        return <circle key={k} cx={x + (k % 2 ? 5 : -5)} cy={yy} r={2.2} fill="#fff" opacity={cyc(q) * 0.8} />;
      })}
      <line x1={x - 24} y1={y + h * 0.12} x2={x + 24} y2={y + h * 0.12} stroke={C.gold} strokeWidth={2} opacity={0.8} />
      <line x1={x - 24} y1={y + h * 0.82} x2={x + 24} y2={y + h * 0.82} stroke={C.gold} strokeWidth={2} opacity={0.8} />
    </g>
  );
};

/** Lensa pembesar pipa kapiler: profil kecepatan parabola (lapisan cairan bergesekan). */
const CapInset: React.FC<{x: number; y: number; r: number; ax: number; ay: number; t: number; flow: number; op: number}> = ({x, y, r, ax, ay, t, flow, op}) => {
  if (op <= 0.001) return null;
  const hw = r * 0.55;
  const lanes = 9;
  return (
    <g opacity={op}>
      <defs>
        <clipPath id="vm-inset">
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <line x1={ax} y1={ay} x2={x - r * 0.97} y2={y - r * 0.25} stroke={C.cyan} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 7" />
      <line x1={ax} y1={ay} x2={x - r * 0.75} y2={y + r * 0.66} stroke={C.cyan} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 7" />
      <circle cx={ax} cy={ay} r={16} fill="none" stroke={C.cyan} strokeOpacity={0.6} strokeWidth={2} />
      <circle cx={x} cy={y} r={r * 1.25} fill="url(#soft-water)" opacity={0.5} />
      <g clipPath="url(#vm-inset)">
        <rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill="#0d1838" />
        <rect x={x - hw} y={y - r} width={2 * hw} height={2 * r} fill={C.water} opacity={0.55} />
        <rect x={x - hw - 24} y={y - r} width={24} height={2 * r} fill={GLASS} opacity={0.25} />
        <rect x={x + hw} y={y - r} width={24} height={2 * r} fill={GLASS} opacity={0.25} />
        {Array.from({length: lanes}, (_, j) => {
          const f = -0.88 + (1.76 * j) / (lanes - 1);
          const g = 1 - f * f;
          return Array.from({length: 4}, (_, k) => {
            const ph = (((t * 0.32 * g * (0.25 + 0.75 * flow) + k / 4 + j * 0.13) % 1) + 1) % 1;
            const yy = y - r + ph * 2 * r;
            const len = 6 + 34 * g * flow;
            return (
              <g key={`${j}-${k}`}>
                <line x1={x + f * hw} y1={yy - len} x2={x + f * hw} y2={yy} stroke="#eaf8ff" strokeOpacity={0.5} strokeWidth={2.4} strokeLinecap="round" />
                <circle cx={x + f * hw} cy={yy} r={3} fill="#fff" />
              </g>
            );
          });
        })}
        {/* profil kecepatan parabola */}
        <path
          d={Array.from({length: 21}, (_, i) => {
            const f = -1 + i / 10;
            return `${i ? 'L' : 'M'}${(x + f * hw).toFixed(1)},${(y - r * 0.55 + (1 - f * f) * r * 0.5 * (0.4 + 0.6 * flow)).toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={C.cyan}
          strokeWidth={3}
        />
        {[-0.7, -0.35, 0, 0.35, 0.7].map((f) => (
          <line key={f} x1={x + f * hw} y1={y - r * 0.55} x2={x + f * hw} y2={y - r * 0.55 + (1 - f * f) * r * 0.5 * (0.4 + 0.6 * flow) - 8} stroke={C.cyan} strokeWidth={3} markerEnd="url(#arrow-cyan)" opacity={0.85} />
        ))}
        {/* gesekan di dinding */}
        {[-1, 1].map((sd) =>
          Array.from({length: 6}, (_, k) => {
            const ph = (((t * 0.4 + k / 6) % 1) + 1) % 1;
            return <path key={`${sd}-${k}`} d={`M${x + sd * (hw - 4)},${y - r + ph * 2 * r} l${-sd * 10},6`} stroke={C.heat} strokeWidth={2.5} opacity={cyc(ph) * 0.8} />;
          }),
        )}
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={C.cyan} strokeWidth={4} opacity={0.85} />
      <text x={x} y={y + r + 36} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={24} fill={C.muted}>
        di dalam kapiler: lapisan bergesekan (<tspan fill={C.heat} fontFamily={FONT.serif} fontStyle="italic">η</tspan>)
      </text>
    </g>
  );
};

/** Batang waktu alir air vs X (tumbuh bersama stopwatch). */
const TimeBars: React.FC<{x: number; y: number; tw: number; tx: number; op: number}> = ({x, y, tw, tx, op}) => {
  if (op <= 0.001) return null;
  const k = 520 / 90;
  const row = (yy: number, v: number, c: string, name: string) => (
    <g>
      <text x={x} y={yy} dominantBaseline="central" fontFamily={FONT.head} fontSize={26} fill={c}>
        {name}
      </text>
      <rect x={x + 110} y={yy - 16} width={520} height={32} rx={16} fill={c} opacity={0.1} />
      <rect x={x + 110} y={yy - 16} width={Math.max(0, v * k)} height={32} rx={16} fill={c} opacity={0.85} />
      <text x={x + 120 + v * k} y={yy} dominantBaseline="central" fontFamily={FONT.mono} fontSize={24} fontWeight={600} fill={C.ink} style={{paintOrder: 'stroke', stroke: 'rgba(7,11,24,0.9)', strokeWidth: 5}}>
        {fmt1(v)} s
      </text>
    </g>
  );
  return (
    <g opacity={op}>
      {row(y, tw, C.water, 't air')}
      {row(y + 64, tx, LIQ_X, 't X')}
      <line x1={x + 110 + 60 * k} y1={y - 30} x2={x + 110 + 60 * k} y2={y + 94} stroke={C.muted} strokeDasharray="5 6" strokeWidth={1.5} opacity={0.6} />
    </g>
  );
};

/** Molekul etanol C₂H₅OH (bola-batang sederhana). */
const Ethanol: React.FC<{x: number; y: number; t: number; op: number}> = ({x, y, t, op}) => {
  if (op <= 0.001) return null;
  const atoms: {e: 'C' | 'O' | 'H'; p: [number, number]}[] = [
    {e: 'C', p: [-60, 0]},
    {e: 'C', p: [10, -24]},
    {e: 'O', p: [78, 6]},
    {e: 'H', p: [126, -18]},
    {e: 'H', p: [-98, -32]},
    {e: 'H', p: [-92, 36]},
    {e: 'H', p: [-56, 50]},
    {e: 'H', p: [6, -76]},
    {e: 'H', p: [26, 26]},
  ];
  const bonds: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [1, 7],
    [1, 8],
  ];
  const rot = 8 * Math.sin(t * 0.7);
  const vib = (i: number) => 1.5 * Math.sin(t * 6 + i * 1.7);
  const P = atoms.map((a, i) => [a.p[0] * 0.8 + vib(i), a.p[1] * 0.8 + vib(i + 3)] as [number, number]);
  return (
    <g opacity={op} transform={`translate(${x} ${y + 4 * Math.sin(t * 1.1)}) rotate(${rot.toFixed(2)})`}>
      <circle r={120} fill="url(#soft-spr)" opacity={0.5} />
      {bonds.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} stroke="#cfd8f0" strokeWidth={5} />
      ))}
      {atoms.map((a, i) => (
        <g key={i}>
          <circle cx={P[i][0]} cy={P[i][1]} r={ATOM[a.e].r * 0.5} fill={ATOM[a.e].fill} stroke="#ffffff55" strokeWidth={1.2} />
          <circle cx={P[i][0] - ATOM[a.e].r * 0.15} cy={P[i][1] - ATOM[a.e].r * 0.17} r={ATOM[a.e].r * 0.13} fill="#fff" opacity={0.55} />
        </g>
      ))}
    </g>
  );
};

export const Viscometer: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  /* ---------- waktu hisapan (fase 1) ---------- */
  const rel1 = cue(1) + 1.6;
  const tB1 = Math.max(rel1 + 3.2, cueEnd(1) + 0.2);
  const rate = (1 - S_B) / (tB1 - rel1);
  const mk = (s0: number): Run => ({s0, s1: s0 + 1.2, rel: s0 + 1.5, rate});
  const run1: Run = {s0: cue(1) + 0.1, s1: cue(1) + 1.3, rel: rel1, rate};
  const run2 = mk(cue(2) + 0.2);
  const run3 = mk(cue(3) + 0.3);

  /* ---------- fase 2: air vs X ---------- */
  const trans = ramp(t, cue(4) - 0.7, cue(4) + 0.6, EASE_IN_OUT);
  const relB = cue(4) + 0.7;
  const tAB = relB + 0.5;
  const tBx = Math.max(tAB + 3.6, wordOf(4, 'sembilan') + 0.5);
  const durW = (tBx - tAB) / 1.5;
  const rateB = (S_A - S_B) / durW;
  const runW: Run = {s0: cue(4) - 0.7, s1: cue(4) + 0.4, rel: tAB - (1 - S_A) / rateB, rate: rateB};
  const runX: Run = {s0: cue(4) - 0.7, s1: cue(4) + 0.4, rel: tAB - (1 - S_A) / (rateB / 1.5), rate: rateB / 1.5};

  const runsMain = [run1, run2, run3, runW];
  const sMain = sAt(t, runsMain);
  const sX = sAt(t, [runX]);
  const flowingMain = Math.min(1, sMain * 6) * ramp(t, run1.rel - 0.3, run1.rel + 0.3);
  const flowingX = Math.min(1, sX * 6) * ramp(t, runX.rel - 0.3, runX.rel + 0.3);

  // stopwatch utama: hisapan terakhir yang sudah dimulai
  const curRun = runsMain.filter((r) => r.s0 <= t).pop() ?? run1;
  const ab = passAB(curRun);
  const secMain = ramp(t, ab.tA, ab.tB, (u) => u) * 60;
  const resetDip = Math.max(...[run2, run3, runW].map((r) => win(t, r.s0 - 0.25, r.s0 + 0.15, 0.2, 0.35)));
  const abX = passAB(runX);
  const secX = ramp(t, abX.tA, abX.tB, (u) => u) * 90;

  /* ---------- tata letak & opasitas ---------- */
  const appear = ramp(t, -0.4, 1.4, EASE_IN_OUT);
  const slide = ramp(t, cue(1) - 0.7, cue(1) + 0.5, EASE_IN_OUT);
  const gx = mix(mix(900, 600, slide), 340, trans);
  const gy = mix(852, 818, trans);
  const gs = mix(1, 0.78, trans);
  const swX = mix(mix(1230, 930, slide), 500, trans);
  const swY = mix(330, 420, trans);
  const swR = mix(72, 50, trans);
  const swOp = ramp(t, cue(1) - 0.2, cue(1) + 0.6);
  const xOp = ramp(t, cue(4) - 0.5, cue(4) + 0.6);
  const lab = (w: number) => ramp(t, w - 0.2, w + 0.5) * (1 - trans);
  const tV = wordOf(0, 'viskometer');
  const bulbOp = win(t, run1.s0 - 0.5, run1.rel - 0.1, 0.4, 0.4);
  const bulbOp2 = Math.max(win(t, run2.s0 - 0.4, run2.rel - 0.1, 0.3, 0.4), win(t, run3.s0 - 0.4, run3.rel - 0.1, 0.3, 0.4));
  const bulbOpB = win(t, runW.s0 - 0.2, runW.rel - 0.1, 0.3, 0.4);

  // baris 2: encer vs kental, lalu ρg
  const pK = ramp(t, wordOf(2, 'kental') - 0.3, wordOf(2, 'kental') + 0.5) * (1 - ramp(t, cue(3) - 0.3, cue(3) + 0.4, EASE_IN_OUT));
  const tRho = wordOf(2, 'massa');
  const pRho = ramp(t, tRho - 0.2, tRho + 0.6) * (1 - ramp(t, cue(3) + 0.2, cue(3) + 0.9, EASE_IN_OUT));
  // baris 3: rumus
  const tCmp = wordOf(3, 'dibandingkan');
  const f1 = ramp(t, cue(3) + 0.1, cue(3) + 0.8) * (1 - ramp(t, tCmp - 0.4, tCmp + 0.1, EASE_IN_OUT));
  const f2 = ramp(t, tCmp - 0.1, tCmp + 0.6) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.2, EASE_IN_OUT));
  const f2y = mix(380, 300, trans);
  // baris 5: hasil
  const f3 = ramp(t, cue(5) - 0.1, cue(5) + 0.7);
  const tEt = wordOf(5, 'etanol');
  const pEt = ramp(t, tEt - 0.5, tEt + 0.5);
  const dimEta = ramp(t, wordOf(5, 'koma') - 0.2, wordOf(5, 'koma') + 0.5);

  return (
    <AbsoluteFill>
      <Stage>
        <Glow x={gx + 20} y={gy - 380 * gs} r={420} color="water" opacity={0.35 * appear} />
        <Motes x={gx} y={gy - 340 * gs} rx={260} ry={300} n={22} color="cyan" opacity={0.35 * appear} seed={4} />
        {/* ===== viskometer utama (air) ===== */}
        <Ostwald
          id="vm-w"
          x={gx}
          y={gy}
          s={gs}
          fill={sMain}
          color={C.water}
          t={t}
          flowing={flowingMain}
          reveal={appear}
          marks={ramp(t, tV - 0.2, tV + 0.6)}
          rho={pRho}
          bulbOp={Math.max(bulbOp, bulbOp2, bulbOpB)}
        />
        {/* ===== viskometer cairan X ===== */}
        <Glow x={820} y={818 - 300} r={300} color="spr" opacity={0.3 * xOp} />
        <Ostwald id="vm-x" x={820} y={818} s={0.78} fill={sX} color={LIQ_X} t={t} flowing={flowingX} op={xOp} bulbOp={bulbOpB} />

        {/* label bagian alat (fase 1) */}
        <g>
          <Label x={gx + 120} y={gy + BULB.cy} anchor="start" size={24} color={C.muted} opacity={lab(tV + 0.5)}>
            bola ukur
          </Label>
          <Label x={gx + 82} y={gy - 230} anchor="start" size={24} color={C.muted} opacity={lab(tV + 0.9) * (1 - pRho)}>
            pipa kapiler
          </Label>
          <Label x={gx - 200} y={gy - 110} anchor="end" size={24} color={C.muted} opacity={lab(tV + 1.3)}>
            reservoir
          </Label>
        </g>
        {/* aliran ditandai riak ketika meniskus tiba di B */}
        <Ripple x={gx + XR * gs} y={gy + Y_B * gs} p={(t - passAB(run1).tB) / 1.2} r={80} color="cyan" rings={2} />
        <Ripple x={820 + XR * 0.78} y={818 + Y_B * 0.78} p={(t - abX.tB) / 1.2} r={70} color="spr" rings={2} />
        <Ripple x={gx + XR * gs} y={gy + Y_B * gs} p={(t - passAB(runW).tB) / 1.2} r={70} color="cyan" rings={2} />

        {/* stopwatch */}
        <Stopwatch x={swX} y={swY} r={swR} sec={secMain} t={t} op={swOp} digOp={1 - 0.85 * resetDip} caption="waktu alir A → B" capOp={1 - trans} />
        <Stopwatch x={990} y={420} r={50} sec={secX} t={t} op={xOp} color={LIQ_X} />
        <Label x={gx} y={866} size={24} color={C.water} weight={600} opacity={trans}>
          air · ρ = 1000 kg/m³
        </Label>
        <Label x={820} y={866} size={24} color={LIQ_X} weight={600} opacity={xOp}>
          cairan X · ρ = 800 kg/m³
        </Label>
        <Twinkles x={990} y={500} rx={90} ry={30} n={3} color="spr" opacity={ramp(t, abX.tB - 0.2, abX.tB + 0.4) * (1 - ramp(t, cue(5) + 1, cue(5) + 2))} seed={3} />

        <CapInset x={1450} y={590} r={200} ax={gx + XR * gs} ay={gy - 250 * gs} t={t} flow={flowingMain} op={ramp(t, wordOf(1, 'kapiler') - 0.4, wordOf(1, 'kapiler') + 0.5) * (1 - ramp(t, wordOf(2, 'kental') - 0.6, wordOf(2, 'kental') + 0.1, EASE_IN_OUT))} />
        <TimeBars x={1150} y={600} tw={secMain * trans} tx={secX} op={xOp * ramp(t, cue(4) + 0.4, cue(4) + 1.2)} />
        {/* ===== baris 2: encer vs kental ===== */}
        <g opacity={pK}>
          <rect x={1170} y={230} width={600} height={400} rx={22} fill={C.card} fillOpacity={0.6} stroke={C.heat} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} />
          <MiniTube x={1330} y={290} h={250} period={2.6} color={C.water} t={t} off={0} />
          <MiniTube x={1610} y={290} h={250} period={6.5} color={HONEY} t={t} off={1.2} />
          <Label x={1330} y={578} size={26} color={C.water} weight={600}>
            encer → cepat
          </Label>
          <Label x={1610} y={578} size={26} color={HONEY} weight={600}>
            kental → lama
          </Label>
          <Label x={1470} y={262} size={24} color={C.heat}>
            <tspan fontFamily={FONT.serif} fontStyle="italic">
              η
            </tspan>{' '}
            makin besar
          </Label>
        </g>
        <Glow x={gx + 120} y={gy - 300} r={200} color="force" opacity={0.4 * pRho} />
      </Stage>

      {/* catatan ρ */}
      <Note x={1470} y={738} p={pRho} color={C.spr} size={30}>
        <span style={{color: C.spr}}>ρ</span> besar → dorongan gravitasi lebih kuat
      </Note>

      {/* rumus η ∝ ρ t */}
      <Formula x={1470} y={380} p={f1} accent={C.heat} size={72} caption="kekentalan ∝ massa jenis × waktu alir">
        <V color={C.heat}>η</V> ∝ <V color={C.spr}>ρ</V> · <V color={C.cyan}>t</V>
      </Formula>
      <Formula x={1470} y={f2y} p={f2} accent={C.heat} size={60} caption="dibandingkan dengan air (alat yang sama)">
        <Frac
          n={
            <span>
              <V color={C.heat}>η</V>
              <Sub>X</Sub>
            </span>
          }
          d={
            <span>
              <V color={C.heat}>η</V>
              <Sub>air</Sub>
            </span>
          }
        />{' '}
        ={' '}
        <Frac
          n={
            <span>
              <V color={C.spr}>ρ</V>
              <Sub>X</Sub> <V color={C.cyan}>t</V>
              <Sub>X</Sub>
            </span>
          }
          d={
            <span>
              <V color={C.spr}>ρ</V>
              <Sub>air</Sub> <V color={C.cyan}>t</V>
              <Sub>air</Sub>
            </span>
          }
        />
      </Formula>

      {/* hasil */}
      <Formula x={1470} y={370} p={f3} accent={C.heat} size={58} caption={<span>η air = 1,0 mPa·s (20 °C)</span>}>
        <V color={C.heat}>η</V>
        <Sub>X</Sub> = 1,0 ·{' '}
        <Frac
          n={
            <span>
              <span style={{color: C.spr}}>800</span> · <span style={{color: C.cyan}}>90</span>
            </span>
          }
          d={
            <span>
              <span style={{color: C.spr}}>1000</span> · <span style={{color: C.cyan}}>60</span>
            </span>
          }
        />
        <br />
        <span style={{opacity: 0.35 + 0.65 * dimEta}}>
          = <b style={{color: C.heat}}>1,2</b> mPa·s
        </span>
      </Formula>
      <Stage>
        <Ethanol x={1330} y={800} t={t} op={pEt} />
        <Twinkles x={1470} y={460} rx={260} ry={50} n={5} color="gold" opacity={dimEta * f3} seed={9} />
        <Ripple x={1470} y={470} p={(t - wordOf(5, 'koma') - 0.1) / 1.4} r={300} color="heat" rings={2} />
      </Stage>
      <Note x={1600} y={800} p={pEt} color={C.spr} size={30} anchor="left">
        ≈ etanol
        <div style={{fontSize: 22, color: C.muted, marginTop: 2}}>η ≈ 1,2 mPa·s (20 °C)</div>
      </Note>
      <Badge2 x={1470} y={560} p={ramp(t, cue(3) + 0.9, cue(3) + 1.6) * (1 - ramp(t, tCmp - 0.4, tCmp + 0.1, EASE_IN_OUT))} />
    </AbsoluteFill>
  );
};

/** Pil kecil di bawah rumus η ∝ ρt. */
const Badge2: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) =>
  p <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * BACK(Math.min(1, p))})`,
        opacity: p,
        padding: '8px 22px',
        borderRadius: 999,
        background: 'rgba(10,16,36,0.88)',
        border: `2px solid ${C.cyan}`,
        color: C.cyan,
        fontFamily: FONT.head,
        fontWeight: 600,
        fontSize: 26,
        whiteSpace: 'nowrap',
      }}
    >
      lebih kental → lebih lama · lebih berat → lebih cepat
    </div>
  );
