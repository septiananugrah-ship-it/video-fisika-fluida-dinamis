import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {Streamline} from '../components/flow';
import {PressureArrow} from '../components/fluid';
import {Arrow, Card, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Gaya angkat: profil sayap (NACA 4412-an) dengan sudut serang kecil, garis arus lebih cepat & rapat di atas,
// aliran dibelokkan ke bawah di belakang sayap (downwash). Panah tekanan kecil di atas, besar di bawah.
// Mitos "waktu tempuh sama": dua paket udara berangkat bersama, yang atas tiba di ujung belakang LEBIH DULU.
// Angka (AUDIT): 70 000 kg · 10 / 120 m² ≈ 5800 Pa, < 6 % dari 100 kPa; 5800 Pa × 120 m² ≈ 700 000 N.

// ---------- geometri sayap ----------
const AF = {lex: 430, ley: 468, c: 760, a: (7 * Math.PI) / 180};
const NS = 48;
const nacaPt = (u: number, upper: boolean): [number, number] => {
  const m = 0.045;
  const p = 0.4;
  const tt = 0.13;
  const yc = u < p ? (m / (p * p)) * (2 * p * u - u * u) : (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * u - u * u);
  const yt = 5 * tt * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
  const w = upper ? yc + yt : yc - yt;
  const ca = Math.cos(AF.a);
  const sa = Math.sin(AF.a);
  return [AF.lex + AF.c * (u * ca + w * sa), AF.ley + AF.c * (u * sa - w * ca)];
};
const US = Array.from({length: NS + 1}, (_, i) => (1 - Math.cos((Math.PI * i) / NS)) / 2);
const UPPER = US.map((u) => nacaPt(u, true));
const LOWER = US.map((u) => nacaPt(u, false));
const AIRFOIL = [...[...UPPER].reverse(), ...LOWER.slice(1)].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
const XMIN = Math.min(...UPPER.map((p) => p[0]), ...LOWER.map((p) => p[0]));
const XTE = UPPER[NS][0];
const YTE = UPPER[NS][1];
const interpX = (arr: [number, number][], x: number) => {
  const s = [...arr].sort((a, b) => a[0] - b[0]);
  if (x <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) {
    if (x <= s[i][0]) {
      const u = (x - s[i - 1][0]) / Math.max(1e-6, s[i][0] - s[i - 1][0]);
      return s[i - 1][1] + (s[i][1] - s[i - 1][1]) * u;
    }
  }
  return s[s.length - 1][1];
};
const topAt = (x: number) => interpX(UPPER, x);
const botAt = (x: number) => interpX(LOWER, x);

// grid x untuk garis arus
const GX = Array.from({length: 111}, (_, i) => 80 + i * 16);
const inWing = (x: number) => x >= XMIN && x <= XTE;
const HT = GX.map((x) => (inWing(x) ? (botAt(x) - topAt(x)) / 2 : 0));
const HB = GX.map((_, i) => {
  let s = 0;
  let w = 0;
  for (let k = -6; k <= 6; k++) {
    const j = i + k;
    if (j < 0 || j >= GX.length) continue;
    const g = Math.exp(-(k * k) / (2 * 2.2 * 2.2));
    s += HT[j] * g;
    w += g;
  }
  return Math.max(HT[i], s / w);
});
const Y0 = 510;
const smooth = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const MID_LE = (topAt(XMIN) + botAt(XMIN)) / 2;
const K0 = (YTE - (topAt(XTE - 40) + botAt(XTE - 40)) / 2) / 40;
const DEF = GX.map((x) => {
  if (x < XMIN) return (MID_LE - Y0) * smooth(XMIN - 380, XMIN, x);
  if (x <= XTE) return (topAt(x) + botAt(x)) / 2 - Y0;
  const s = x - XTE;
  const k1 = 0.085;
  const L = 180;
  return YTE + k1 * s + (K0 - k1) * L * (1 - Math.exp(-s / L)) - Y0;
});
const CW = XTE - XMIN;
const BW = GX.map((x) => smooth(XMIN - 140, XMIN + 40, x) * (1 - smooth(XTE - 60, XTE + 220, x)));
const BT = GX.map((x) => Math.exp(-(((x - (XMIN + 0.3 * CW)) / (0.42 * CW)) ** 2)));

type Lane = {pts: [number, number][]; gain: number[]; up: boolean; d: number};
const lane = (d: number, up: boolean): Lane => {
  const pts: [number, number][] = GX.map((x, i) => {
    const e = Math.exp(-d / 240);
    const y = up
      ? Y0 + DEF[i] * Math.exp(-d / 700) - HB[i] * e - 16 - d * (1 - 0.22 * BW[i] * Math.exp(-d / 420))
      : Y0 + DEF[i] * Math.exp(-d / 700) + HB[i] * e + 16 + d * (1 + 0.18 * BW[i] * Math.exp(-d / 420));
    return [x, y];
  });
  const gain = GX.map((x, i) => {
    const e = Math.exp(-d / 250);
    let g = up ? 1 + 0.85 * BT[i] * e : 1 - 0.32 * BW[i] * e;
    g *= 1 - 0.55 * Math.exp(-(((x - XMIN + 8) / 45) ** 2)) * Math.exp(-d / 60);
    return g;
  });
  return {pts, gain, up, d};
};
const UP_D = [0, 42, 92, 150, 216, 290];
const DN_D = [0, 50, 106, 168, 234];
const LANES: Lane[] = [...UP_D.map((d) => lane(d, true)), ...DN_D.map((d) => lane(d, false))];
const SPEED = 230;

/** waktu tempuh kumulatif sepanjang lajur (sama dengan Streamline). */
const travel = (L: Lane, speed: number) => {
  const ts = [0];
  for (let i = 1; i < L.pts.length; i++) {
    const d = Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]);
    ts.push(ts[i - 1] + d / (speed * Math.max(0.05, (L.gain[i - 1] + L.gain[i]) / 2)));
  }
  const at = (tau: number): [number, number] => {
    const tt = Math.max(0, Math.min(ts[ts.length - 1], tau));
    let i = 1;
    while (i < ts.length - 1 && ts[i] < tt) i++;
    const u = (tt - ts[i - 1]) / Math.max(1e-9, ts[i] - ts[i - 1]);
    return [L.pts[i - 1][0] + (L.pts[i][0] - L.pts[i - 1][0]) * u, L.pts[i - 1][1] + (L.pts[i][1] - L.pts[i - 1][1]) * u];
  };
  const tauAtX = (x: number) => {
    const i = Math.max(1, Math.min(GX.length - 1, Math.ceil((x - GX[0]) / 16)));
    const u = (x - GX[i - 1]) / 16;
    return ts[i - 1] + (ts[i] - ts[i - 1]) * Math.max(0, Math.min(1, u));
  };
  return {ts, at, tauAtX, total: ts[ts.length - 1]};
};
const RACE_U = travel(LANES[0], SPEED);
const RACE_L = travel(LANES[UP_D.length], SPEED);
const RACE_X0 = 250;

// ---------- pesawat tampak atas ----------
const PX = 480;
const wingPt = (s: number, q: number, side: 1 | -1): [number, number] => {
  const le: [number, number] = [PX + side * (32 + 360 * s), 432 + 168 * s];
  const te: [number, number] = [PX + side * (32 + 360 * s), 566 + 72 * s];
  return [le[0] + (te[0] - le[0]) * q, le[1] + (te[1] - le[1]) * q];
};
const wingPath = (side: 1 | -1) => {
  const a = wingPt(0, 0, side);
  const b = wingPt(1, 0, side);
  const c = wingPt(1, 1, side);
  const d = wingPt(0, 1, side);
  return `M${a[0]},${a[1]} L${b[0]},${b[1]} Q${b[0] + side * 12},${(b[1] + c[1]) / 2} ${c[0]},${c[1]} L${d[0]},${d[1]} Z`;
};
const FUSE = `M${PX},188 C${PX + 26},196 ${PX + 34},236 ${PX + 34},290 L${PX + 34},742 C${PX + 34},800 ${PX + 14},838 ${PX},848 C${PX - 14},838 ${PX - 34},800 ${PX - 34},742 L${PX - 34},290 C${PX - 34},236 ${PX - 26},196 ${PX},188 Z`;
const stab = (side: 1 | -1) => `M${PX + side * 28},748 L${PX + side * 170},800 L${PX + side * 170},818 L${PX + side * 28},806 Z`;
const CELLS = (() => {
  const out: {x: number; y: number; k: number}[] = [];
  const ns = 8;
  const nq = 3;
  ([-1, 1] as const).forEach((side) => {
    for (let i = 0; i < ns; i++)
      for (let j = 0; j < nq; j++) {
        const [x, y] = wingPt((i + 0.5) / ns, (j + 0.5) / nq, side);
        out.push({x, y, k: i + j * 0.35});
      }
  });
  return out;
})();
const gridLines = (side: 1 | -1) => {
  const d: string[] = [];
  for (let i = 1; i < 8; i++) {
    const a = wingPt(i / 8, 0, side);
    const b = wingPt(i / 8, 1, side);
    d.push(`M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`);
  }
  for (let j = 1; j < 3; j++) {
    const a = wingPt(0, j / 3, side);
    const b = wingPt(1, j / 3, side);
    d.push(`M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`);
  }
  return d.join(' ');
};

/** Baris kartu yang tumbuh. */
const Grow: React.FC<{p: number; h: number; children: React.ReactNode}> = ({p, h, children}) => (
  <div style={{opacity: p, maxHeight: p < 0.999 ? p * h : undefined, overflow: p < 0.999 ? 'hidden' : undefined}}>{children}</div>
);

export const Lift: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- fase sayap ----------
  const wingIn = ramp(t, -0.2, 1.2);
  const wingOut = 1 - ramp(t, cue(4) - 0.7, cue(4) + 0.2, EASE_IN_OUT);
  const tilt = ramp(t, wordOf(0, 'dimiring') - 0.2, wordOf(0, 'dimiring') + 0.8);
  const tiltOut = 1 - ramp(t, cue(1) + 0.5, cue(1) + 1.3, EASE_IN_OUT);
  const down = ramp(t, wordOf(0, 'bawah') - 0.5, wordOf(0, 'bawah') + 0.5);
  const fast = ramp(t, wordOf(1, 'cepat') - 0.3, wordOf(1, 'cepat') + 0.6);
  const press = ramp(t, wordOf(1, 'rendah') - 0.3, wordOf(1, 'rendah') + 0.7);
  const liftA = ramp(t, cueEnd(1) - 0.6, cueEnd(1) + 0.4);
  const mythDim = 1 - ramp(t, cue(2) - 0.2, cue(2) + 0.6, EASE_IN_OUT) * (1 - ramp(t, cueEnd(3) + 0.2, cueEnd(3) + 1.0));
  const press2 = press * mythDim;

  // mitos
  const mythCard = win(t, cue(2) + 0.2, cue(4) - 1.0, 0.6, 0.6);
  const cross = ramp(t, wordOf(2, 'keliru') - 0.1, wordOf(2, 'keliru') + 0.6);
  const tArrU = wordOf(3, 'tiba') + 0.15;
  const tauU0 = RACE_U.tauAtX(RACE_X0);
  const tauL0 = RACE_L.tauAtX(RACE_X0);
  const tauUTE = RACE_U.tauAtX(XTE);
  const tauLTE = RACE_L.tauAtX(XTE);
  const rs = (tauLTE - tauL0) / 5.0; // perlambat: paket bawah butuh 5 dtk
  const tS = tArrU - (tauUTE - tauU0) / rs;
  const tArrL = tS + (tauLTE - tauL0) / rs;
  const raceOn = win(t, cue(2) + 1.0, cue(4) - 1.2, 0.6, 0.7);
  const run = Math.max(0, t - tS) * rs;
  const tauU = tauU0 + run;
  const tauL = tauL0 + run;
  const pU = RACE_U.at(tauU);
  const pL = RACE_L.at(tauL);
  const trailOf = (R: ReturnType<typeof travel>, a: number, b: number) => {
    const n = 40;
    return Array.from({length: n + 1}, (_, i) => R.at(a + ((b - a) * i) / n));
  };
  const trU = trailOf(RACE_U, tauU0, tauU);
  const trL = trailOf(RACE_L, tauL0, tauL);
  const arrU = ramp(t, tArrU - 0.1, tArrU + 0.5);
  const arrL = ramp(t, tArrL - 0.1, tArrL + 0.5);
  const firstLbl = ramp(t, tArrU + 0.1, tArrU + 0.8);
  const bob = (k: number) => (t < tS ? 4 * Math.sin(t * 3 + k) : 4 * Math.sin(tS * 3 + k) * (1 - ramp(t, tS, tS + 0.5)));

  // ---------- fase pesawat ----------
  const planeIn = ramp(t, cue(4) - 0.4, cue(4) + 0.8);
  const mLbl = ramp(t, wordOf(4, 'tujuh') - 0.2, wordOf(4, 'tujuh') + 0.6);
  const aLbl = ramp(t, wordOf(4, 'seratus') - 0.2, wordOf(4, 'seratus') + 0.6);
  const f1 = ramp(t, cueEnd(4) - 0.8, cueEnd(4) + 0.2);
  const f2 = ramp(t, wordOf(5, 'lima') - 0.2, wordOf(5, 'lima') + 0.6);
  const bars = ramp(t, wordOf(5, 'kurang') - 0.4, wordOf(5, 'kurang') + 0.8);
  const pct = ramp(t, wordOf(5, 'persen') - 0.2, wordOf(5, 'persen') + 0.6);
  const cells = ramp(t, cue(6) - 0.2, cue(6) + 2.4, (q) => q);
  const note6 = ramp(t, wordOf(6, 'luas') - 0.3, wordOf(6, 'luas') + 0.6);
  const lift6 = ramp(t, wordOf(6, 'mengangkat') - 0.4, wordOf(6, 'mengangkat') + 0.6);
  const planeY = 6 * Math.sin(t * 0.9) - 26 * lift6 + 4 * Math.sin(t * 2.1) * lift6;
  const planeR = 1.2 * Math.sin(t * 0.6);

  const upColor = interpolateColors(fast, [0, 1], ['#dff3ff', C.cyan]);
  const centroidX = XMIN + 0.3 * CW;
  const centroidY = (topAt(centroidX) + botAt(centroidX)) / 2;

  // panah tekanan pada permukaan
  const pArrows = (pts: [number, number][], up: boolean) =>
    [6, 10, 15, 20, 26, 32, 38, 43].map((i, k) => {
      const [x, y] = pts[i];
      const [xa, ya] = pts[i - 1];
      const [xb, yb] = pts[i + 1];
      const tx = xb - xa;
      const ty = yb - ya;
      const l = Math.hypot(tx, ty) || 1;
      // normal ke luar sayap
      const nx = up ? ty / l : -ty / l;
      const ny = up ? -tx / l : tx / l;
      const L = (up ? 24 - 8 * Math.exp(-(((i - 18) / 12) ** 2)) : 52) * (0.92 + 0.08 * Math.sin(t * 3 + k));
      return <PressureArrow key={`${up}-${i}`} x={x + nx * 3} y={y + ny * 3} nx={nx} ny={ny} L={L} width={up ? 3 : 4.5} opacity={press2} />;
    });

  return (
    <AbsoluteFill>
      {/* ===================== sayap ===================== */}
      <AbsoluteFill style={{opacity: wingIn * wingOut}}>
        <Stage>
          <defs>
            <linearGradient id="lf-wing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9d6f5" />
              <stop offset="55%" stopColor="#6a7aa8" />
              <stop offset="100%" stopColor="#2b3660" />
            </linearGradient>
            <radialGradient id="lf-lo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={C.cyan} stopOpacity={0.22} />
              <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* daerah tekanan: tinggi di bawah (merah muda kuat), rendah di atas */}
          <ellipse cx={XMIN + 0.45 * CW} cy={centroidY + 120} rx={420} ry={150} fill="url(#soft-press)" opacity={0.9 * press} />
          <ellipse cx={XMIN + 0.4 * CW} cy={centroidY - 120} rx={420} ry={140} fill="url(#lf-lo)" opacity={press} />
          {/* garis arus */}
          {LANES.map((L, i) => (
            <Streamline
              key={i}
              pts={L.pts}
              gain={L.gain}
              speed={SPEED}
              n={9}
              seed={i * 3.1}
              color={L.up ? upColor : '#dff3ff'}
              line={L.up ? 0.22 + 0.2 * fast : 0.22}
              opacity={(L.up ? 0.85 + 0.15 * fast : 0.85 - 0.25 * fast) * (0.55 + 0.45 * mythDim)}
            />
          ))}
          {/* sayap */}
          <path d={AIRFOIL} fill="url(#lf-wing)" stroke="#e6eeff" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={UPPER.slice(4, 30).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${(y + 6).toFixed(1)}`).join(' ')} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
          {pArrows(UPPER, true)}
          {pArrows(LOWER, false)}
          {/* sudut serang */}
          <g opacity={tilt * tiltOut}>
            <line x1={XMIN - 120} y1={MID_LE} x2={XMIN + 330} y2={MID_LE} stroke={C.muted} strokeWidth={2} strokeDasharray="8 7" />
            <line x1={XMIN - 120} y1={MID_LE - 120 * Math.tan(AF.a)} x2={XTE + 60} y2={YTE + 60 * Math.tan(AF.a)} stroke={C.gold} strokeOpacity={0.8} strokeWidth={2} strokeDasharray="8 7" />
            <path d={`M${XMIN + 300},${MID_LE} A300,300 0 0 1 ${XMIN + 300 * Math.cos(AF.a)},${MID_LE + 300 * Math.sin(AF.a)}`} fill="none" stroke={C.gold} strokeWidth={3} />
            <Label x={XMIN + 330} y={MID_LE + 22} size={30} color={C.gold} font="serif" italic anchor="start">
              α
            </Label>
            <Label x={XMIN - 40} y={MID_LE - 44} size={24} color={C.gold} anchor="start">
              sudut serang kecil
            </Label>
          </g>
          {/* downwash */}
          <g opacity={down * mythDim}>
            <path
              d={`M${XTE + 90},${YTE + 70} Q${XTE + 260},${YTE + 110} ${XTE + 380},${YTE + 200}`}
              fill="none"
              stroke={C.cyan}
              strokeOpacity={0.25}
              strokeWidth={18}
              strokeLinecap="round"
            />
            <path d={`M${XTE + 90},${YTE + 70} Q${XTE + 260},${YTE + 110} ${XTE + 380},${YTE + 200}`} fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" markerEnd="url(#arrow-cyan)" />
            <Label x={XTE + 420} y={YTE + 250} size={26} color={C.cyan} anchor="middle">
              udara dibelokkan ke bawah
            </Label>
          </g>
          {/* label kecepatan & tekanan */}
          <g opacity={fast * mythDim}>
            <Label x={XMIN + 0.42 * CW} y={topAt(XMIN + 0.42 * CW) - 150} size={30} color={C.cyan} weight={700} anchor="start">
              <tspan fontFamily={FONT.serif} fontStyle="italic">v</tspan> besar
            </Label>
            <Label x={XMIN + 0.36 * CW} y={botAt(XMIN + 0.36 * CW) + 140} size={30} color="#bcd2ee" weight={600} anchor="start">
              <tspan fontFamily={FONT.serif} fontStyle="italic">v</tspan> lebih kecil
            </Label>
          </g>
          <g opacity={press2}>
            <Label x={XMIN + 0.42 * CW + 150} y={topAt(XMIN + 0.42 * CW) - 150} size={30} color={C.press} weight={700} anchor="start">
              · <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan> rendah
            </Label>
            <Label x={XMIN + 0.36 * CW + 200} y={botAt(XMIN + 0.36 * CW) + 140} size={30} color={C.press} weight={700} anchor="start">
              · <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan> tinggi
            </Label>
          </g>
          {/* gaya angkat */}
          <g opacity={liftA * mythDim}>
            <Glow x={centroidX} y={centroidY - 120} r={140} color="force" opacity={0.5} />
            <Arrow x1={centroidX} y1={centroidY} x2={centroidX} y2={centroidY - 250 - 6 * Math.sin(t * 2)} color="force" width={8} />
            <Label x={centroidX + 24} y={centroidY - 240} size={30} color={C.force} anchor="start" weight={700}>
              gaya angkat
            </Label>
          </g>
          <Ripple x={centroidX} y={centroidY - 120} p={ramp(t, cueEnd(1) - 0.4, cueEnd(1) + 1.2, (q) => q)} r={180} color="force" />

          {/* ----- balapan mitos ----- */}
          <g opacity={raceOn}>
            <line x1={RACE_X0} y1={RACE_U.at(tauU0)[1] - 40} x2={RACE_X0} y2={RACE_L.at(tauL0)[1] + 40} stroke={C.muted} strokeWidth={2} strokeDasharray="6 6" />
            <Label x={RACE_X0} y={RACE_U.at(tauU0)[1] - 64} size={24} color={C.muted}>
              berangkat bersama
            </Label>
            <line x1={XTE} y1={topAt(XTE - 30) - 70} x2={XTE} y2={botAt(XTE - 30) + 70} stroke={C.gold} strokeOpacity={0.7} strokeWidth={2.5} strokeDasharray="6 6" />
            <Label x={XTE + 10} y={botAt(XTE - 30) + 96} size={24} color={C.gold} anchor="middle">
              ujung belakang
            </Label>
            <path d={trU.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${(y + bob(0)).toFixed(1)}`).join(' ')} fill="none" stroke={C.gold} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
            <path d={trL.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${(y + bob(1)).toFixed(1)}`).join(' ')} fill="none" stroke={C.spr} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
            <Spark x={pU[0]} y={pU[1] + bob(0)} r={11} color="gold" />
            <Spark x={pL[0]} y={pL[1] + bob(1)} r={11} color="spr" />
            <Ripple x={XTE} y={topAt(XTE - 30) - 16} p={ramp(t, tArrU - 0.1, tArrU + 1.3, (q) => q)} r={130} color="gold" />
            <Ripple x={XTE} y={botAt(XTE - 30) + 16} p={ramp(t, tArrL - 0.1, tArrL + 1.3, (q) => q)} r={90} color="spr" rings={2} />
            <g opacity={firstLbl}>
              <Label x={XTE + 40} y={topAt(XTE - 30) - 92} size={30} color={C.gold} anchor="start" weight={700}>
                atas tiba lebih dulu!
              </Label>
            </g>
            <g opacity={arrL * (1 - ramp(t, tArrL + 2, tArrL + 3))}>
              <Label x={pL[0] + 30} y={pL[1] + 46} size={24} color={C.spr} anchor="start">
                bawah menyusul
              </Label>
            </g>
            <Twinkles x={XTE + 60} y={topAt(XTE - 30) - 60} rx={110} ry={40} n={4} opacity={arrU * (1 - arrL * 0.5)} seed={4} />
          </g>
          <Motes x={960} y={480} rx={820} ry={320} n={22} color="cyan" opacity={0.3} seed={11} />
        </Stage>
        {/* kartu mitos */}
        <Card x={1440} y={238} opacity={mythCard} accent={C.heat} style={{padding: '16px 30px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, fontFamily: FONT.head, fontSize: 30, fontWeight: 500}}>
            <div style={{position: 'relative', width: 54, height: 54, flexShrink: 0}}>
              <svg width={54} height={54} viewBox="0 0 54 54" style={{position: 'absolute', inset: 0}}>
                <circle cx={27} cy={27} r={24} fill="none" stroke={C.heat} strokeWidth={3} opacity={0.4 + 0.6 * cross} />
                <path d="M16,16 L38,38" stroke={C.heat} strokeWidth={6} strokeLinecap="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - ramp(cross, 0, 0.5))} />
                <path d="M38,16 L16,38" stroke={C.heat} strokeWidth={6} strokeLinecap="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - ramp(cross, 0.5, 1))} />
              </svg>
            </div>
            <div>
              <div style={{fontSize: 22, letterSpacing: 4, color: C.heat, fontWeight: 600}}>MITOS</div>
              <div style={{opacity: 1 - 0.35 * cross}}>
                “udara atas & bawah harus tiba bersamaan”
              </div>
            </div>
          </div>
        </Card>
      </AbsoluteFill>

      {/* ===================== pesawat 70 ton ===================== */}
      <AbsoluteFill style={{opacity: planeIn}}>
        <Stage>
          <defs>
            <linearGradient id="lf-body" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8796c4" />
              <stop offset="45%" stopColor="#e9efff" />
              <stop offset="100%" stopColor="#7d8bb8" />
            </linearGradient>
            <linearGradient id="lf-wingtop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c7d3f2" />
              <stop offset="100%" stopColor="#6d7ba6" />
            </linearGradient>
          </defs>
          {/* angin relatif + awan */}
          {Array.from({length: 7}, (_, i) => {
            const x = 130 + i * 116 + (i > 2 ? 60 : 0);
            return (
              <Streamline
                key={i}
                pts={[
                  [x, 170],
                  [x + 4 * Math.sin(i), 880],
                ]}
                speed={420}
                n={4}
                seed={i * 1.9}
                line={0.08}
                opacity={0.45}
              />
            );
          })}
          {Array.from({length: 4}, (_, i) => {
            const ph = (((t * 0.07 + i / 4) % 1) + 1) % 1;
            return <ellipse key={i} cx={140 + ((i * 263) % 720)} cy={160 + ph * 760} rx={90 + 30 * (i % 2)} ry={36} fill="#cfdcff" opacity={0.07 * cyc(ph) * 2} />;
          })}
          <g transform={`translate(0 ${planeY}) rotate(${planeR} ${PX} 520)`}>
            <ellipse cx={PX + 26} cy={560} rx={330} ry={250} fill="#000" opacity={0.18} />
            <Glow x={PX} y={540} r={430} color="cyan" opacity={0.25 + 0.35 * aLbl} />
            {([-1, 1] as const).map((s) => (
              <g key={`e${s}`}>
                <rect x={s > 0 ? PX + 150 : PX - 186} y={448} width={36} height={86} rx={16} fill="#5d6a96" stroke="#dfe7ff" strokeWidth={2} />
                <rect x={s > 0 ? PX + 270 : PX - 302} y={500} width={32} height={74} rx={14} fill="#5d6a96" stroke="#dfe7ff" strokeWidth={2} />
              </g>
            ))}
            {([-1, 1] as const).map((s) => (
              <g key={s}>
                <path d={wingPath(s)} fill="url(#lf-wingtop)" stroke="#e8efff" strokeWidth={2.5} strokeLinejoin="round" />
                <path d={wingPath(s)} fill={C.cyan} opacity={0.32 * aLbl + 0.06 * aLbl * Math.sin(t * 2.4)} />
                <path d={gridLines(s)} stroke={C.cyan} strokeOpacity={0.55 * cells} strokeWidth={1.4} fill="none" />
                <path d={stab(s)} fill="url(#lf-wingtop)" stroke="#e8efff" strokeWidth={2} />
              </g>
            ))}
            <path d={FUSE} fill="url(#lf-body)" stroke="#f2f6ff" strokeWidth={2.5} />
            <path d={`M${PX - 14},232 Q${PX},218 ${PX + 14},232`} fill="none" stroke="#2b3660" strokeWidth={6} strokeLinecap="round" />
            <line x1={PX} y1={700} x2={PX} y2={836} stroke="#4c5a88" strokeWidth={6} strokeLinecap="round" />
            {/* sel 1 m² dengan dorongan ke atas (⊙ = panah ke arah penonton) */}
            {CELLS.map((c, i) => {
              const o = ramp(cells * 10, c.k * 1.05, c.k * 1.05 + 1.2);
              const pul = 1 + 0.12 * Math.sin(t * 4 + i * 0.7);
              return (
                <g key={i} opacity={o}>
                  <circle cx={c.x} cy={c.y} r={9 * pul} fill="none" stroke={C.press} strokeWidth={2.4} />
                  <circle cx={c.x} cy={c.y} r={2.8} fill={C.press} />
                </g>
              );
            })}
            {/* label massa & luas */}
            <g opacity={mLbl}>
              <Label x={PX} y={330} size={30} color={C.force} weight={700}>
                ≈ 70 t
              </Label>
            </g>
          </g>
          <g opacity={aLbl}>
            <line x1={wingPt(0.75, 0.5, 1)[0]} y1={wingPt(0.75, 0.5, 1)[1] + planeY} x2={800} y2={760} stroke={C.cyan} strokeWidth={2} />
            <Label x={800} y={790} size={30} color={C.cyan} weight={700}>
              A ≈ 120 m²
            </Label>
          </g>
          <g opacity={cells * (1 - 0.0 * note6)}>
            <Label x={480} y={890 - 20} size={24} color={C.press} opacity={ramp(t, cue(6) + 1.2, cue(6) + 2)}>
              tiap 1 m² didorong ≈ 5800 N
            </Label>
          </g>
          {/* batang perbandingan */}
          <g opacity={bars}>
            {(() => {
              const x0 = 1030;
              const W = 740;
              const y1 = 590;
              const y2 = 690;
              const wAtm = W * ramp(t, wordOf(5, 'kurang') - 0.4, wordOf(5, 'kurang') + 1.2);
              const wDp = W * 0.058 * ramp(t, wordOf(5, 'kurang'), wordOf(5, 'kurang') + 1.2);
              return (
                <g>
                  <Label x={x0} y={y1 - 38} size={24} color={C.muted} anchor="start">
                    tekanan atmosfer
                  </Label>
                  <rect x={x0} y={y1 - 18} width={W} height={36} rx={10} fill="none" stroke={C.line} strokeWidth={2} />
                  <rect x={x0} y={y1 - 18} width={wAtm} height={36} rx={10} fill={C.press} opacity={0.3} />
                  <Label x={x0 + W - 12} y={y1} size={24} color={C.ink} anchor="end" weight={600}>
                    100 kPa
                  </Label>
                  <Label x={x0} y={y2 - 38} size={24} color={C.press} anchor="start">
                    beda tekanan atas–bawah sayap
                  </Label>
                  <rect x={x0} y={y2 - 18} width={W} height={36} rx={10} fill="none" stroke={C.line} strokeWidth={2} />
                  <rect x={x0} y={y2 - 18} width={Math.max(0.1, wDp)} height={36} rx={8} fill={C.press} />
                  <Glow x={x0 + wDp} y={y2} r={50} color="press" opacity={bars * 0.7} />
                  <Label x={x0 + wDp + 18} y={y2} size={26} color={C.press} anchor="start" weight={700}>
                    5,8 kPa
                  </Label>
                  <g opacity={pct}>
                    <Label x={x0 + W - 12} y={y2} size={28} color={C.gold} anchor="end" weight={700}>
                      &lt; 6 %
                    </Label>
                  </g>
                  <Twinkles x={x0 + W - 60} y={y2} rx={70} ry={30} n={3} opacity={pct} seed={8} />
                </g>
              );
            })()}
          </g>
          <Ripple x={480} y={520} p={ramp(t, wordOf(6, 'mengangkat') - 0.2, wordOf(6, 'mengangkat') + 1.4, (q) => q)} r={380} color="press" />
          <Motes x={1400} y={500} rx={420} ry={300} n={14} color="press" opacity={0.3} seed={5} />
        </Stage>
        <Card x={1400} y={340} opacity={Math.min(1, f1 * 1.4)} scale={0.94 + 0.06 * f1} accent={C.press} style={{padding: '18px 40px'}}>
          <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.35, textAlign: 'center', whiteSpace: 'nowrap'}}>
            <div>
              <Tint c={C.press}>
                Δ<V>p</V>
              </Tint>{' '}
              = <Frac n={<Tint c={C.force}>F</Tint>} d={<V>A</V>} /> = <Frac n={<><V>m</V><V>g</V></>} d={<V>A</V>} />
            </div>
            <Grow p={f2} h={130}>
              ={' '}
              <Frac n={<>70 000 · 10</>} d={<>120</>} />{' '}
              <span style={{color: C.press, fontWeight: 600}}>≈ 5800 Pa</span>
            </Grow>
          </div>
        </Card>
        <Note x={1400} y={812} p={note6} color={C.press} size={28}>
          <div style={{textAlign: 'center'}}>
            Beda tekanan <Tint c={C.press}>kecil</Tint> × luas <Tint c={C.cyan}>besar</Tint>
            <div style={{fontSize: 24, color: C.muted, marginTop: 4}}>
              5800 Pa × 120 m² ≈ 700 000 N ≈ berat 70 t
            </div>
          </div>
        </Note>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
