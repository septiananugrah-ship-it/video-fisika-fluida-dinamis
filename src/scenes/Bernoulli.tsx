import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Streamline, radiusAt} from '../components/flow';
import {PressureArrow} from '../components/fluid';
import {EnergyBars} from '../components/physics';
import {Arrow, Badge, Formula, Glow, Label, Motes, Note, Part, Ripple, Spark, Stage, Stream, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase 1 (baris 0): potret bergaya Daniel Bernoulli + buku Hydrodynamica 1738.
// Fase 2 (baris 1): kilas balik video #1: bola di lintasan U, batang K (jingga) & U (biru), total tetap.
// Fase 3 (baris 2–6): pipa yang menyempit (r 62 → 44, luas ÷2 → v ×2) lalu naik 280 px.
//   Energi per m³ (satuan bebas, total 100): ½ρv² = 10·(62/r)⁴, ρgh = (860 − y)/9 (acuan h = 0 di y = 860),
//   p = 100 − keduanya → total selalu tetap. Potongan air (emas) menyusuri garis arus; batang mengikuti posisinya.

type Knot = [number, number];

// ---------- geometri pipa berbelok ----------
const PX0 = 120;
const PX1 = 1290;
const YLOW = 780;
const YTOP = 500;
const RISE_A = 760;
const RISE_B = 1060;
const H0 = 860; // acuan h = 0
const RK: Knot[] = [
  [PX0, 62],
  [380, 62],
  [500, 44],
  [1060, 44],
  [1160, 62],
  [PX1, 62],
];
const yAt = (x: number) => {
  if (x <= RISE_A) return YLOW;
  if (x >= RISE_B) return YTOP;
  const u = (x - RISE_A) / (RISE_B - RISE_A);
  return YLOW - (YLOW - YTOP) * (0.5 - 0.5 * Math.cos(Math.PI * u));
};
const NS = 320;
const SAMP = (() => {
  const out: {x: number; y: number; nx: number; ny: number; tx: number; ty: number; r: number; s: number; tau: number}[] = [];
  let s = 0;
  let tau = 0;
  for (let i = 0; i <= NS; i++) {
    const x = PX0 + ((PX1 - PX0) * i) / NS;
    const y = yAt(x);
    const dy = (yAt(x + 0.5) - yAt(x - 0.5)) / 1;
    const L = Math.hypot(1, dy);
    const tx = 1 / L;
    const ty = dy / L;
    const r = radiusAt(RK, x);
    if (i > 0) {
      const p = out[i - 1];
      const ds = Math.hypot(x - p.x, y - p.y);
      s += ds;
      const v = 90 * (62 / ((r + p.r) / 2)) ** 2;
      tau += ds / v;
    }
    out.push({x, y, nx: -ty, ny: tx, tx, ty, r, s, tau});
  }
  return out;
})();
const TAU_TOT = SAMP[NS].tau;
/** Titik pada garis tengah untuk waktu tempuh τ. */
const atTau = (tau: number) => {
  const tt = Math.max(0, Math.min(TAU_TOT, tau));
  let lo = 0;
  let hi = NS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (SAMP[mid].tau < tt) lo = mid;
    else hi = mid;
  }
  const a = SAMP[lo];
  const b = SAMP[hi];
  const u = (tt - a.tau) / Math.max(1e-9, b.tau - a.tau);
  return {x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), nx: mix(a.nx, b.nx, u), ny: mix(a.ny, b.ny, u), tx: mix(a.tx, b.tx, u), ty: mix(a.ty, b.ty, u), r: mix(a.r, b.r, u)};
};
const tauAtX = (x: number) => {
  const i = Math.max(0, Math.min(NS - 1, Math.floor(((x - PX0) / (PX1 - PX0)) * NS)));
  return SAMP[i].tau;
};
const wall = (sign: number) => SAMP.map((p, i) => `${i ? 'L' : 'M'}${(p.x + sign * p.nx * p.r).toFixed(1)},${(p.y + sign * p.ny * p.r).toFixed(1)}`).join(' ');
const WALL_T = wall(-1);
const WALL_B = wall(1);
const BODY = `${WALL_T} ${SAMP.slice()
  .reverse()
  .map((p) => `L${(p.x + p.nx * p.r).toFixed(1)},${(p.y + p.ny * p.r).toFixed(1)}`)
  .join(' ')} Z`;
const LANE = (f: number) => SAMP.filter((_, i) => i % 4 === 0).map((p, i) => `${i ? 'L' : 'M'}${(p.x + f * p.nx * p.r).toFixed(1)},${(p.y + f * p.ny * p.r).toFixed(1)}`).join(' ');
const LANES = [-0.7, -0.35, 0, 0.35, 0.7].map(LANE);

/** Energi per m³ (satuan bebas) di posisi garis tengah. */
const terms = (x: number, y: number) => {
  const k = 10 * (62 / radiusAt(RK, x)) ** 4;
  const g = (H0 - y) / 9;
  return {p: 100 - k - g, k, g};
};

// ---------- batang energi ----------
const BX = 1390;
const BW = 74;
const BG = 30;
const BY = 800;
const BS = 3.9; // px per satuan

const LiquidTop: React.FC<{x: number; y: number; w: number; h: number; color: string; t: number; seed: number}> = ({x, y, w, h, color, t, seed}) => {
  if (h <= 0.5) return null;
  const top = y - h;
  const amp = Math.min(3, h * 0.2);
  const d = `M${x},${top + amp * Math.sin(t * 3 + seed)} Q${x + w * 0.25},${top - amp * Math.sin(t * 2.6 + seed)} ${x + w / 2},${top + amp * 0.5 * Math.sin(t * 3.4 + seed)} T${x + w},${top + amp * Math.sin(t * 2.9 + seed + 1)} L${x + w},${y} L${x},${y} Z`;
  return (
    <g>
      <path d={d} fill={color} opacity={0.88} />
      <rect x={x + 6} y={top + 6} width={8} height={Math.max(0, h - 12)} rx={4} fill="#fff" opacity={0.18} />
      {[0, 1, 2].map((k) => {
        const ph = (((t * 0.5 + k / 3 + seed * 0.1) % 1) + 1) % 1;
        return h > 30 ? <circle key={k} cx={x + 18 + ((k * 23 + seed * 7) % (w - 30))} cy={y - 6 - ph * (h - 14)} r={2.4} fill="#fff" opacity={0.5 * cyc(ph)} /> : null;
      })}
    </g>
  );
};

// ---------- kilas balik video #1 ----------
const TRK = (x: number) => 720 - 380 * ((x - 640) / 360) ** 2;

export const Bernoulli: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const ph1 = 1 - ramp(t, cue(1) - 0.5, cue(1) + 0.1, EASE_IN_OUT);
  const ph2 = ramp(t, cue(1) - 0.1, cue(1) + 0.6) * (1 - ramp(t, cue(2) - 0.6, cue(2) + 0.0, EASE_IN_OUT));
  const ph3 = ramp(t, cue(2) - 0.1, cue(2) + 0.8);

  // ---------- fase 1 ----------
  const portrait = ramp(t, -0.3, 1.2);
  const nameIn = ramp(t, wordOf(0, 'Bernoulli') - 0.5, wordOf(0, 'Bernoulli') + 0.3);
  const book = ramp(t, wordOf(0, 'persamaan') - 0.5, wordOf(0, 'persamaan') + 0.6, BACK);
  const year = ramp(t, wordOf(0, 'tahun') - 0.2, wordOf(0, 'delapan') + 0.2);

  // ---------- fase 2 ----------
  const ballX = 640 + 320 * Math.sin((t - cue(1)) * 1.4);
  const ballY = TRK(ballX) - 26;
  const Uv = (100 * (720 - TRK(ballX))) / 380;
  const vid1 = ramp(t, wordOf(1, 'video') - 0.4, wordOf(1, 'video') + 0.4);

  // ---------- fase 3 ----------
  const pipeIn = ramp(t, cue(2) - 0.1, cue(2) + 1.0);
  const rP = ramp(t, wordOf(2, 'tekanan') - 0.4, wordOf(2, 'tekanan') + 0.5);
  const rK = ramp(t, wordOf(3, 'kinetik') - 0.4, wordOf(3, 'kinetik') + 0.5);
  const rG = ramp(t, wordOf(3, 'potensial') - 0.4, wordOf(3, 'potensial') + 0.5);
  const rTot = ramp(t, cue(4) + 0.1, cue(4) + 0.9);
  const fConst = ramp(t, wordOf(4, 'tetap') - 0.5, wordOf(4, 'tetap') + 0.3);
  const fBig = ramp(t, cue(6) - 0.1, cue(6) + 0.6);
  const badge = ramp(t, wordOf(6, 'kekekalan') - 0.3, wordOf(6, 'kekekalan') + 0.4, BACK);
  const capFlow = ramp(t, wordOf(6, 'mengalir') - 0.6, wordOf(6, 'mengalir') + 0.2);
  const nPay = win(t, wordOf(5, 'membayarnya') - 0.4, cue(6) + 0.3, 0.6, 0.5);
  const hLab = ramp(t, wordOf(3, 'potensial') - 0.2, wordOf(3, 'potensial') + 0.6);

  // perjalanan potongan air (τ = waktu tempuh alami, diputar dengan laju berbeda per baris)
  const tau0 = tauAtX(230);
  const T1 = cue(4);
  const T2 = cue(5) - 0.35;
  const T3 = cue(5) + 0.15;
  const tauThroat = tauAtX(700);
  const seg1 = tau0 + 0.12 * Math.max(0, t - cue(2));
  const tauT1 = tau0 + 0.12 * Math.max(0, T1 - cue(2));
  const rate2 = (TAU_TOT - 0.05 - tauT1) / Math.max(1, T2 - T1 - 0.4);
  const seg2 = Math.min(TAU_TOT - 0.05, tauT1 + (t - T1) * rate2);
  const hold = wordOf(5, 'tekanan') + 0.6;
  const seg3 = t < hold ? Math.min(tauThroat, tau0 + (t - T3)) : Math.min(TAU_TOT - 0.05, Math.min(tauThroat, tau0 + (hold - T3)) + 0.08 * (t - hold) + Math.max(0, t - cue(6) - 0.4) * 0.92);
  // pergantian ke perjalanan baru terjadi saat potongan tak terlihat (opasitas 0 antara T2 dan T3)
  const tauP = t < T1 ? seg1 : t < (T2 + T3) / 2 ? seg2 : seg3;
  const pOp = ph3 * ramp(t, cue(2) + 0.6, cue(2) + 1.4) * (1 - ramp(t, T2 - 0.3, T2, EASE_IN_OUT) + ramp(t, T3, T3 + 0.4));
  const P = atTau(tauP);
  const fadeEnd = 1 - ramp(tauP, TAU_TOT - 0.5, TAU_TOT - 0.06);
  // nilai batang: saat potongan "dilahirkan ulang", batang bergeser mulus (kombinasi linear → total tetap 100)
  const vNow = terms(P.x, P.y);
  const vEnd = terms(atTau(TAU_TOT - 0.05).x, atTau(TAU_TOT - 0.05).y);
  const vStart = terms(atTau(tau0).x, atTau(tau0).y);
  const gapMix = ramp(t, T2 - 0.35, T3 + 0.35, EASE_IN_OUT);
  const inGap = win(t, T2 - 0.35, T3 + 0.25, 0.05, 0.1);
  const vGap = {p: mix(vEnd.p, vStart.p, gapMix), k: mix(vEnd.k, vStart.k, gapMix), g: mix(vEnd.g, vStart.g, gapMix)};
  const vals = {p: mix(vNow.p, vGap.p, inGap), k: mix(vNow.k, vGap.k, inGap), g: mix(vNow.g, vGap.g, inGap)};
  const vSpeed = 90 * (62 / P.r) ** 2;

  const bars = [
    {key: 'p', val: vals.p, rev: rP, color: C.press, lab: 'p', name: 'tekanan'},
    {key: 'k', val: vals.k, rev: rK, color: C.kin, lab: '½ρv²', name: 'kinetik'},
    {key: 'g', val: vals.g, rev: rG, color: C.pot, lab: 'ρgh', name: 'potensial'},
  ];
  const totX = BX + 3 * (BW + BG) + 16;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======================= FASE 1: Daniel Bernoulli ======================= */}
        {ph1 > 0.001 ? (
          <g opacity={ph1}>
            {/* garis arus hiasan di latar */}
            {[0, 1, 2, 3, 4].map((k) => (
              <Streamline
                key={k}
                pts={Array.from({length: 24}, (_, i) => [100 + i * 75, 300 + k * 110 + 26 * Math.sin(i * 0.5 + k)] as [number, number])}
                speed={120}
                n={4}
                color="water"
                line={0.12}
                opacity={0.5}
                seed={k * 3}
              />
            ))}
            <g opacity={portrait} transform={`translate(0 ${mix(30, 0, portrait)})`}>
              <Glow x={600} y={480} r={330} color="gold" opacity={0.35} />
              <ellipse cx={600} cy={480} rx={190} ry={240} fill="#0d1634" stroke={C.gold} strokeWidth={6} />
              <ellipse cx={600} cy={480} rx={172} ry={222} fill="none" stroke={C.gold} strokeOpacity={0.4} strokeWidth={2} />
              <defs>
                <clipPath id="bern-oval">
                  <ellipse cx={600} cy={480} rx={170} ry={220} />
                </clipPath>
              </defs>
              <g clipPath="url(#bern-oval)">
                <rect x={410} y={250} width={380} height={460} fill="#14204a" />
                {/* mantel */}
                <path d="M420,720 Q440,600 520,575 L600,610 L680,575 Q760,600 780,720 Z" fill="#1f2d63" stroke="#4c5fa8" strokeWidth={3} />
                <path d="M560,585 L600,660 L640,585 L620,575 L600,600 L580,575 Z" fill="#eef1fb" />
                <path d="M585,600 Q600,640 615,600" fill="none" stroke="#c8cfe6" strokeWidth={2} />
                {/* leher & wajah */}
                <rect x={578} y={520} width={44} height={62} rx={14} fill="#d9a988" />
                <ellipse cx={600} cy={470 + 1.5 * Math.sin(t * 1.1)} rx={66} ry={82} fill="#e3b796" />
                <path d="M600,465 Q592,492 602,500" fill="none" stroke="#b07f60" strokeWidth={2.5} strokeLinecap="round" />
                <path d="M584,520 Q600,528 616,520" fill="none" stroke="#a5654e" strokeWidth={2.5} strokeLinecap="round" />
                <ellipse cx={576} cy={456} rx={6} ry={4} fill="#3a2a20" />
                <ellipse cx={624} cy={456} rx={6} ry={4} fill="#3a2a20" />
                {/* wig berbedak */}
                {[
                  [540, 400, 34],
                  [575, 382, 34],
                  [615, 380, 34],
                  [652, 396, 34],
                  [672, 430, 26],
                  [530, 432, 26],
                  [522, 470, 22],
                  [680, 468, 22],
                  [518, 505, 22],
                  [684, 505, 22],
                  [524, 540, 20],
                  [678, 540, 20],
                ].map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill="#e8eaf2" stroke="#b8bdd0" strokeWidth={2} />
                ))}
              </g>
              <g opacity={nameIn}>
                <Label x={600} y={770} size={46} color={C.ink} weight={600}>
                  Daniel Bernoulli
                </Label>
                <Label x={600} y={822} size={26} color={C.muted}>
                  matematikawan & fisikawan
                </Label>
              </g>
              <Motes x={600} y={480} rx={260} ry={300} n={18} color="gold" opacity={0.5} seed={2} />
            </g>
            {/* buku Hydrodynamica */}
            <g opacity={Math.min(1, book)} transform={`translate(1310 ${500 + 6 * Math.sin(t * 1.2)}) rotate(${-6 + 2 * Math.sin(t * 0.8)}) scale(${0.85 + 0.15 * book})`}>
              <Glow x={0} y={0} r={300} color="water" opacity={0.4} />
              <rect x={-200} y={-250} width={400} height={500} rx={14} fill="#3a2414" stroke="#c99a4e" strokeWidth={5} />
              <rect x={-180} y={-230} width={360} height={460} rx={8} fill="none" stroke="#c99a4e" strokeOpacity={0.6} strokeWidth={2} />
              <rect x={190} y={-244} width={18} height={488} rx={4} fill="#efe4c8" opacity={0.9} />
              <text x={0} y={-150} textAnchor="middle" fontFamily={FONT.serif} fontSize={40} fontWeight={600} fill="#f3d58f" letterSpacing={3}>
                HYDRODYNAMICA
              </text>
              <line x1={-130} y1={-118} x2={130} y2={-118} stroke="#c99a4e" strokeWidth={2} />
              {/* sketsa tangki & semburan di sampul */}
              <rect x={-120} y={-80} width={110} height={170} fill="none" stroke="#f3d58f" strokeOpacity={0.8} strokeWidth={3} />
              <rect x={-117} y={-40} width={104} height={127} fill={C.water} opacity={0.35} />
              <path d={`M-10,60 Q60,60 110,${150}`} fill="none" stroke={C.water} strokeWidth={5} strokeLinecap="round" />
              {[0, 1, 2].map((k) => {
                const ph = (((t * 0.9 + k / 3) % 1) + 1) % 1;
                const s = ph;
                return <circle key={k} cx={-10 + 120 * s} cy={60 + 90 * s * s} r={4} fill="#fff" opacity={cyc(ph)} />;
              })}
              <g opacity={year}>
                <text x={0} y={190} textAnchor="middle" fontFamily={FONT.head} fontSize={72} fontWeight={700} fill={C.gold}>
                  1738
                </text>
              </g>
            </g>
            <Twinkles x={1310} y={690} rx={140} ry={40} n={5} color="gold" opacity={year} />
            <Ripple x={1310} y={690} p={ramp(t, wordOf(0, 'delapan') - 0.2, wordOf(0, 'delapan') + 1.2)} r={140} color="gold" />
          </g>
        ) : null}

        {/* ======================= FASE 2: kilas balik energi ======================= */}
        {ph2 > 0.001 ? (
          <g opacity={ph2}>
            <Glow x={640} y={560} r={360} color="kin" opacity={0.25} />
            <path d={Array.from({length: 41}, (_, i) => {
              const x = 280 + i * 18;
              return `${i ? 'L' : 'M'}${x},${TRK(x).toFixed(1)}`;
            }).join(' ')} fill="none" stroke="#bfe3ff" strokeOpacity={0.8} strokeWidth={6} strokeLinecap="round" />
            {Array.from({length: 9}, (_, i) => {
              const x = 320 + i * 80;
              return <line key={i} x1={x} y1={TRK(x) + 4} x2={x} y2={760} stroke={C.faint} strokeWidth={3} />;
            })}
            <line x1={260} y1={760} x2={1020} y2={760} stroke={C.muted} strokeWidth={3} />
            <Spark x={ballX} y={ballY} r={6} color="kin" trail={[1, 2, 3, 4].map((i) => {
              const x = 640 + 320 * Math.sin((t - cue(1) - i * 0.05) * 1.4);
              return [x, TRK(x) - 26] as [number, number];
            })} />
            <circle cx={ballX} cy={ballY} r={24} fill="url(#ball)" stroke={C.kin} strokeWidth={3} />
            <EnergyBars
              x={1270}
              y={760}
              bars={[
                {key: 'K', label: 'K', value: 100 - Uv, color: 'kin'},
                {key: 'U', label: 'U', value: Uv, color: 'pot'},
              ]}
              max={110}
              height={380}
              barW={90}
              gap={40}
              unit=""
              showValues={false}
              title="ENERGI TOTAL TETAP"
            />
          </g>
        ) : null}

        {/* ======================= FASE 3: pipa Bernoulli + batang energi ======================= */}
        {ph3 > 0.001 ? (
          <g opacity={ph3 * pipeIn}>
            <Glow x={620} y={YLOW} r={280} color="kin" opacity={0.18} />
            <Glow x={960} y={260} r={460} color="gold" opacity={0.45 * fBig} />
            <Twinkles x={960} y={250} rx={420} ry={70} n={6} color="gold" opacity={fBig} />
            <Glow x={1600} y={600} r={320} color="press" opacity={0.15} />
            {/* acuan h = 0 */}
            <g opacity={hLab}>
              <line x1={PX0} y1={H0} x2={PX1} y2={H0} stroke={C.pot} strokeWidth={2} strokeDasharray="10 8" strokeDashoffset={-t * 10} opacity={0.6} />
              <Label x={1110} y={H0 - 20} size={20} color={C.pot} anchor="start">
                acuan h = 0
              </Label>
            </g>
            {/* pipa */}
            <defs>
              <linearGradient id="bern-pipe" x1="0" y1={YTOP - 60} x2="0" y2={YLOW + 60} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={C.water} stopOpacity={0.5} />
                <stop offset="100%" stopColor={C.deep} stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <path d={BODY} fill="url(#bern-pipe)" />
            {LANES.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#dff3ff" strokeOpacity={0.16} strokeWidth={1.2} />
            ))}
            {/* partikel garis arus: kecepatan ∝ 1/r² */}
            {[-0.7, -0.35, 0, 0.35, 0.7].map((f, j) =>
              Array.from({length: 7}, (_, k) => {
                const ph = (((t / TAU_TOT + k / 7 + j * 0.137) % 1) + 1) % 1;
                const a = atTau(ph * TAU_TOT);
                const b = atTau(ph * TAU_TOT - 0.09);
                const fade = Math.min(1, ph * 12) * Math.min(1, (1 - ph) * 12);
                return (
                  <g key={`${j}-${k}`} opacity={fade}>
                    <line x1={b.x + f * b.nx * b.r} y1={b.y + f * b.ny * b.r} x2={a.x + f * a.nx * a.r} y2={a.y + f * a.ny * a.r} stroke="#eaf8ff" strokeOpacity={0.5} strokeWidth={2.2} strokeLinecap="round" />
                    <circle cx={a.x + f * a.nx * a.r} cy={a.y + f * a.ny * a.r} r={2.6} fill="#fff" />
                  </g>
                );
              }),
            )}
            <path d={WALL_T} fill="none" stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
            <path d={WALL_B} fill="none" stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
            {/* potongan air */}
            <g opacity={pOp * fadeEnd}>
              <line x1={P.x} y1={P.y} x2={P.x} y2={H0} stroke={C.pot} strokeWidth={3} strokeDasharray="6 6" opacity={0.75 * rG} />
              <Label x={P.x + 26} y={(P.y + H0) / 2 + 20} size={30} font="serif" italic color={C.pot} weight={600} opacity={rG}>
                h
              </Label>
              {/* tekanan fluida sekitar mendorong potongan dari belakang & depan (panjang ∝ p) */}
              <g opacity={rP}>
                {[-0.45, 0.45].map((f) => (
                  <g key={f}>
                    <PressureArrow x={P.x - P.tx * 20 + f * P.nx * P.r} y={P.y - P.ty * 20 + f * P.ny * P.r} nx={-P.tx} ny={-P.ty} L={10 + 0.45 * vals.p} width={3.5} />
                    <PressureArrow x={P.x + P.tx * 20 + f * P.nx * P.r} y={P.y + P.ty * 20 + f * P.ny * P.r} nx={P.tx} ny={P.ty} L={10 + 0.45 * vals.p} width={3.5} />
                  </g>
                ))}
              </g>
              <g transform={`translate(${P.x} ${P.y}) rotate(${(Math.atan2(P.ty, P.tx) * 180) / Math.PI})`}>
                <circle r={P.r * 1.3} fill="url(#soft-gold)" />
                <rect x={-17} y={-P.r * 0.8} width={34} height={P.r * 1.6} rx={6} fill={C.gold} fillOpacity={0.3} stroke={C.gold} strokeWidth={3} />
              </g>
              <Arrow x1={P.x + P.tx * 26} y1={P.y + P.ty * 26 - P.r - 26} x2={P.x + P.tx * (26 + vSpeed * 0.42)} y2={P.y + P.ty * (26 + vSpeed * 0.42) - P.r - 26} color="cyan" width={5} pulse={false} opacity={rK} />
            </g>
            {/* batang energi per m³ */}
            <g>
              <rect x={BX - 30} y={BY - 100 * BS - 70} width={totX + BW - BX + 60} height={100 * BS + 70 + 92} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} opacity={rP} />
              <Label x={(BX + totX + BW) / 2} y={BY - 100 * BS - 40} size={22} color={C.muted} weight={600} spacing={2} opacity={rP}>
                ENERGI PER m³
              </Label>
              <line x1={BX - 14} y1={BY} x2={totX + BW + 14} y2={BY} stroke={C.muted} strokeWidth={2} opacity={rP} />
              {bars.map((b, i) => {
                const x = BX + i * (BW + BG);
                return (
                  <g key={b.key} opacity={b.rev}>
                    <rect x={x} y={BY - 100 * BS} width={BW} height={100 * BS} rx={8} fill={b.color} opacity={0.07} />
                    <LiquidTop x={x} y={BY} w={BW} h={b.val * BS * b.rev} color={b.color} t={t} seed={i * 2.1} />
                    <Label x={x + BW / 2} y={BY + 30} size={28} font="serif" italic color={b.color} weight={600}>
                      {b.lab}
                    </Label>
                    <Label x={x + BW / 2} y={BY + 62} size={18} color={C.muted}>
                      {b.name}
                    </Label>
                  </g>
                );
              })}
              {/* total bertumpuk + garis total tetap */}
              <g opacity={rTot}>
                {(() => {
                  let acc = 0;
                  return bars.map((b) => {
                    const h = b.val * BS;
                    const el = <rect key={b.key} x={totX + 6} y={BY - acc - h} width={BW - 12} height={Math.max(0, h)} fill={b.color} opacity={0.85} />;
                    acc += h;
                    return el;
                  });
                })()}
                <rect x={totX} y={BY - 100 * BS} width={BW} height={100 * BS} rx={8} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 7" strokeDashoffset={-t * 22} />
                <line x1={BX - 14} y1={BY - 100 * BS} x2={totX + BW + 14} y2={BY - 100 * BS} stroke={C.ink} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-t * 16} opacity={0.6} />
                <Label x={totX + BW / 2} y={BY + 30} size={24} color={C.ink} weight={600}>
                  total
                </Label>
                <Label x={totX + BW / 2} y={BY + 62} size={18} color={C.muted}>
                  tetap
                </Label>
                <Ripple x={totX + BW / 2} y={BY - 100 * BS} p={ramp(t, wordOf(4, 'tetap') - 0.2, wordOf(4, 'tetap') + 1.1)} r={90} color="gold" />
              </g>
              {/* tekanan membayar energi kinetik */}
              <Stream
                pts={[
                  [BX + BW / 2, BY - vals.p * BS - 10],
                  [BX + BW / 2 + 40, BY - Math.max(vals.p, vals.k) * BS - 60],
                  [BX + BW + BG + BW / 2, BY - vals.k * BS - 10],
                ]}
                color="press"
                n={8}
                speed={0.9}
                r={5}
                jitter={3}
                opacity={nPay}
              />
            </g>
            <Motes x={700} y={640} rx={560} ry={200} n={18} color="water" opacity={0.3} seed={6} />
          </g>
        ) : null}
      </Stage>

      {/* ---------- kartu HTML ---------- */}
      <Badge x={1440} y={250} text="video #1 · Usaha & Energi" color={C.kin} opacity={vid1 * ph2} scale={0.9 + 0.1 * vid1} size={30} />
      <Note x={640} y={250} p={ph2 * ramp(t, cue(1) + 0.3, cue(1) + 1.0)} color={C.kin} size={30}>
        energi berubah bentuk, jumlahnya tetap
      </Note>
      <Formula
        x={960}
        y={250}
        p={rP * ph3}
        accent={C.gold}
        size={62}
        caption={
          <>
            <span style={{opacity: 1 - capFlow}}>energi per meter kubik, sepanjang satu garis arus</span>
            <span style={{position: 'absolute', left: 0, right: 0, opacity: capFlow}}>kekekalan energi untuk fluida yang mengalir</span>
          </>
        }
      >
        <V color={C.press}>p</V>
        <Part p={rK}>
          {' '}
          + <span style={{color: C.kin}}>½</span>
          <V color={C.kin}>ρv</V>
          <Sup color={C.kin}>2</Sup>
        </Part>
        <Part p={rG}>
          {' '}
          + <V color={C.pot}>ρgh</V>
        </Part>
        <Part p={fConst}> = konstan</Part>
      </Formula>
      <Badge x={960} y={372} text="hukum kekekalan energi" color={C.gold} opacity={badge * ph3} scale={0.85 + 0.15 * badge} size={30} />
      <Note x={440} y={430} p={nPay * ph3} color={C.press} size={30}>
        <span style={{color: C.kin}}>½ρv²</span> naik ⇐ dibayar oleh <span style={{color: C.press}}>p</span>
      </Note>
    </AbsoluteFill>
  );
};
