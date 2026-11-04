import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Pipe, Streamline, radiusAt} from '../components/flow';
import {PressureArrow} from '../components/fluid';
import {Crate} from '../components/physics';
import {Arrow, Badge, DrawPath, Formula, Glow, Label, Motes, Note, Ripple, Stage, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Fase A (baris 0–3): pipa r 110 → 55 (v ×4). Potongan air (kotak) ikut aliran: belakang & depannya bergerak dengan
//   kecepatan lokal (memanjang di bagian sempit). Panah tekanan ∝ p(x) = p₁ − ½ρ(v² − v₁²) (skala bebas):
//   di bagian menyempit tekanan belakang > depan → gaya total (kuning) ke depan → dipercepat.
//   Grafik p(x) (merah muda) & v(x) (toska) di atas pipa: p turun tepat di tempat v naik.
// Fase B (baris 4–5): dua lembar kertas tergantung, udara ditiup di antaranya (garis arus cepat); udara luar diam
//   (molekul bergerak acak) mendorong kertas ke dalam — panah tekanan dari luar, BUKAN tarikan dari dalam.

type Knot = [number, number];

const makeTravel = (knots: Knot[], x0: number, x1: number, v0: number, n = 400) => {
  const r0 = radiusAt(knots, x0);
  const xs: number[] = [x0];
  const ts: number[] = [0];
  const dx = (x1 - x0) / n;
  for (let i = 1; i <= n; i++) {
    const xm = x0 + (i - 0.5) * dx;
    xs.push(x0 + i * dx);
    ts.push(ts[i - 1] + dx / (v0 * (r0 / radiusAt(knots, xm)) ** 2));
  }
  const total = ts[n];
  const xAt = (tau: number) => {
    if (tau <= 0) return x0 + tau * v0;
    if (tau >= total) return x1;
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ts[mid] < tau) lo = mid;
      else hi = mid;
    }
    return xs[lo] + (xs[hi] - xs[lo]) * ((tau - ts[lo]) / (ts[hi] - ts[lo]));
  };
  const tauAt = (x: number) => {
    const u = Math.max(0, Math.min(n, (x - x0) / dx));
    const i = Math.min(n - 1, Math.floor(u));
    return ts[i] + (ts[i + 1] - ts[i]) * (u - i);
  };
  return {total, xAt, tauAt};
};

const X0 = 120;
const X1 = 1800;
const YC = 640;
const K: Knot[] = [
  [X0, 110],
  [720, 110],
  [980, 55],
  [X1, 55],
];
const V0 = 80;
const TR = makeTravel(K, X0, X1, V0);
const vRel = (x: number) => (110 / radiusAt(K, x)) ** 2; // v / v₁ (1..4)
const pRel = (x: number) => (16 - vRel(x) ** 2) / 15; // 1 (lebar) .. 0 (sempit)
const arrowL = (x: number) => 22 + 50 * pRel(x);

// potongan air yang dipantau
const PX_A = 430;
const PX_B = 1560;
const P_W = 64;
const TAU_A = TR.tauAt(PX_A);
const P_RUN = TR.tauAt(PX_B) - TAU_A;
const P_GAP = 0.9;
const P_PER = P_RUN + P_GAP;

const parcelPath = (xa: number, xb: number) => {
  const n = 10;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = xa + ((xb - xa) * i) / n;
    const r = radiusAt(K, x) * 0.84;
    top.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${(YC - r).toFixed(1)}`);
    bot.unshift(`L${x.toFixed(1)},${(YC + r).toFixed(1)}`);
  }
  return `${top.join(' ')} ${bot.join(' ')} Z`;
};

// grafik p(x), v(x)
const GY = 440;
const GH = 190;
const gx = Array.from({length: 61}, (_, i) => X0 + 90 + ((X1 - X0 - 130) * i) / 60);
const P_CURVE = gx.map((x) => [x, GY - 20 - (GH - 30) * pRel(x)] as [number, number]);
const V_CURVE = gx.map((x) => [x, GY - 20 - (GH - 30) * ((vRel(x) - 1) / 3)] as [number, number]);
const pathOf = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// kertas
const SX = 960;
const S_TOP = 250;
const S_LEN = 470;
const S_HALF = 82;

const tri = (x: number) => {
  const f = ((x % 2) + 2) % 2;
  return f < 1 ? f : 2 - f;
};

export const PressureSpeed: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const phA = 1 - ramp(t, cue(4) - 0.7, cue(4) - 0.1, EASE_IN_OUT);
  const phB = ramp(t, cue(4) - 0.2, cue(4) + 0.6);

  // ---------- fase A ----------
  const pipeIn = ramp(t, -0.4, 1.0);
  const speedLab = win(t, cue(0) + 0.3, cue(1) + 0.2, 0.6, 0.6);
  const quest = win(t, wordOf(0, 'apa') - 0.4, cue(1) + 0.8, 0.6, 0.6);
  const crate = win(t, cue(1) - 0.1, cue(2) - 0.3, 0.6, 0.6);
  const fNewton = win(t, wordOf(1, 'gaya') - 0.4, wordOf(1, 'beda') - 0.5, 0.6, 0.4);
  const fDp = win(t, wordOf(1, 'beda') - 0.3, cue(2) + 0.6, 0.6, 0.5);
  const parcelOn = win(t, wordOf(1, 'sepotong') - 0.4, cue(4) - 1.0, 0.6, 0.6);
  const tP0 = wordOf(2, 'dipercepat') - (TR.tauAt(720) - TAU_A) - 0.4; // siklus pertama masuk penyempitan saat "dipercepat"
  const netOn = ramp(t, cue(2) + 0.4, cue(2) + 1.2);
  const nBack = win(t, wordOf(2, 'belakangnya') - 0.4, cue(3) + 0.2, 0.6, 0.5);
  const graph = ramp(t, cue(3) - 0.2, cue(3) + 1.6, EASE_IN_OUT);
  const pTint = ramp(t, wordOf(3, 'tekanannya') - 0.5, wordOf(3, 'tekanannya') + 0.6);
  const lowLab = ramp(t, wordOf(3, 'rendah') - 0.3, wordOf(3, 'rendah') + 0.4);

  // potongan air: siklus berulang, ikut aliran
  const sP = t - tP0;
  const kP = Math.floor(sP / P_PER);
  const uP = sP - kP * P_PER; // 0 .. P_PER
  const tauB = TAU_A + uP;
  const xBack = TR.xAt(tauB);
  const xFront = TR.xAt(TR.tauAt(PX_A + P_W) - TAU_A + tauB);
  const pFade = Math.min(1, uP / 0.35) * Math.min(1, Math.max(0, (P_RUN - uP) / 0.35));
  const LB = arrowL(xBack);
  const LF = arrowL(xFront);
  const net = Math.max(0, LB - LF);
  const xMid = (xBack + xFront) / 2;
  const hB = radiusAt(K, xBack) * 0.84;
  const hF = radiusAt(K, xFront) * 0.84;

  // ---------- fase B ----------
  const sheetsIn = ramp(t, cue(4) + 0.0, cue(4) + 0.9);
  const blow = ramp(t, wordOf(4, 'merapat') - 1.0, wordOf(4, 'merapat') + 0.4, EASE_IN_OUT);
  const bend = 46 * blow + 3 * Math.sin(t * 6.3) * blow + 1.5 * Math.sin(t * 9.7 + 1) * blow;
  const nFast = ramp(t, wordOf(4, 'cepat') - 0.3, wordOf(4, 'cepat') + 0.4);
  const nStill = ramp(t, wordOf(4, 'diam') - 0.3, wordOf(4, 'diam') + 0.4);
  const pullX = win(t, cue(5) + 0.1, wordOf(5, 'Udara') - 0.1, 0.4, 0.5);
  const cross = ramp(t, wordOf(5, 'menarik') - 0.1, wordOf(5, 'menarik') + 0.4, BACK);
  const push = ramp(t, wordOf(5, 'Udara') - 0.2, wordOf(5, 'mendorongnya') + 0.2);
  const pushBig = 1 + 0.35 * ramp(t, wordOf(5, 'mendorongnya') - 0.3, wordOf(5, 'mendorongnya') + 0.4, BACK);

  const sheetX = (side: -1 | 1, s: number) => SX + side * (S_HALF - bend * Math.pow(s, 1.6) * (0.4 + 0.6 * s));
  const sheetPts = (side: -1 | 1) => Array.from({length: 25}, (_, i) => [sheetX(side, i / 24), S_TOP + (S_LEN * i) / 24] as [number, number]);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======================= FASE A ======================= */}
        {phA > 0.001 ? (
          <g opacity={phA * pipeIn}>
            <Glow x={850} y={YC} r={300} color="press" opacity={0.18 + 0.25 * netOn} />
            <ellipse cx={960} cy={YC + 175} rx={820} ry={14} fill="#000" opacity={0.3} />
            <Pipe x0={X0} x1={X1} yc={YC} knots={K} v0={V0} lanes={7} perLane={7} lines={0.3} particles={1 - 0.35 * parcelOn} />
            {/* rona tekanan: merah muda pekat = tekanan tinggi */}
            {pTint > 0.001 ? (
              <g opacity={pTint * 0.55}>
                <defs>
                  <linearGradient id="ps-tint" x1={X0} y1="0" x2={X1} y2="0" gradientUnits="userSpaceOnUse">
                    {Array.from({length: 13}, (_, i) => {
                      const x = X0 + ((X1 - X0) * i) / 12;
                      return <stop key={i} offset={`${(i / 12) * 100}%`} stopColor={C.press} stopOpacity={0.08 + 0.6 * pRel(x)} />;
                    })}
                  </linearGradient>
                </defs>
                <path d={parcelPath(X0 + 4, X1 - 4).replace(/0\.84/g, '1')} fill="url(#ps-tint)" />
              </g>
            ) : null}
            {/* label lambat / cepat */}
            <g opacity={speedLab}>
              <Label x={420} y={YC - 150} size={30} color={C.cyan} weight={600}>
                lambat
              </Label>
              <Arrow x1={380} y1={YC - 118} x2={460} y2={YC - 118} color="cyan" width={5} />
              <Label x={1400} y={YC - 95} size={30} color={C.cyan} weight={600}>
                cepat
              </Label>
              <Arrow x1={1260} y1={YC - 125} x2={1540} y2={YC - 125} color="cyan" width={5} />
            </g>
            <g opacity={quest}>
              <Glow x={850} y={YC - 290} r={120} color="gold" />
              <Label x={850} y={YC - 290 + 8 * Math.sin(t * 2)} size={130} color={C.gold} weight={700}>
                ?
              </Label>
              <Label x={850} y={YC - 185} size={26} color={C.gold}>
                apa yang mempercepat?
              </Label>
            </g>

            {/* potongan air yang dipantau */}
            {parcelOn > 0.001 ? (
              <g opacity={parcelOn * pFade}>
                <path d={parcelPath(xBack, xFront)} fill={C.gold} fillOpacity={0.22} stroke={C.gold} strokeWidth={3} />
                {[-0.6, 0, 0.6].map((f) => (
                  <g key={f}>
                    <PressureArrow x={xBack - 3} y={YC + f * hB} nx={-1} ny={0} L={LB} width={4} />
                    <PressureArrow x={xFront + 3} y={YC + f * hF} nx={1} ny={0} L={LF} width={4} />
                  </g>
                ))}
                {/* gaya total = beda tekanan × luas */}
                <g opacity={netOn}>
                  <Arrow x1={xMid - 10} y1={YC} x2={xMid - 10 + net * 3.2 + 1} y2={YC} color="force" width={7} pulse={false} />
                  <Label x={xMid} y={YC - Math.max(hB, hF) - 34} size={24} color={C.force} weight={600} opacity={Math.min(1, net / 6)}>
                    gaya total
                  </Label>
                </g>
                <Label x={xBack - LB - 26} y={YC - hB - 6} size={30} font="serif" italic color={C.press} weight={600} opacity={nBack}>
                  p<tspan baselineShift="sub" fontSize="0.6em">blkg</tspan>
                </Label>
                <Label x={xFront + LF + 30} y={YC - hF - 6} size={30} font="serif" italic color={C.press} weight={600} opacity={nBack}>
                  p<tspan baselineShift="sub" fontSize="0.6em">dpn</tspan>
                </Label>
              </g>
            ) : null}

            {/* grafik p(x) & v(x) */}
            {graph > 0.001 ? (
              <g>
                <rect x={X0 + 10} y={GY - GH - 10} width={X1 - X0 - 20} height={GH + 30} rx={16} fill="rgba(10,16,36,0.6)" stroke={C.line} strokeWidth={2} opacity={Math.min(1, graph * 2)} />
                <line x1={X0 + 30} y1={GY} x2={X1 - 30} y2={GY} stroke={C.muted} strokeWidth={2} opacity={Math.min(1, graph * 2)} />
                <DrawPath d={pathOf(P_CURVE)} p={graph} stroke={C.press} width={5} halo />
                <DrawPath d={pathOf(V_CURVE)} p={graph} stroke={C.cyan} width={5} halo />
                <g opacity={ramp(graph, 0.7, 1)}>
                  <Label x={X0 + 52} y={P_CURVE[0][1]} size={34} font="serif" italic color={C.press} weight={600}>
                    p
                  </Label>
                  <Label x={X0 + 52} y={V_CURVE[0][1]} size={34} font="serif" italic color={C.cyan} weight={600}>
                    v
                  </Label>
                  {/* penanda berjalan mengikuti potongan air */}
                  {(() => {
                    const x = Math.max(gx[0], Math.min(gx[60], xMid));
                    return (
                      <g opacity={pFade * parcelOn}>
                        <line x1={x} y1={GY - GH} x2={x} y2={GY} stroke={C.gold} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
                        <circle cx={x} cy={GY - 20 - (GH - 30) * pRel(x)} r={7} fill={C.press} stroke="#fff" strokeWidth={2} />
                        <circle cx={x} cy={GY - 20 - (GH - 30) * ((vRel(x) - 1) / 3)} r={7} fill={C.cyan} stroke="#fff" strokeWidth={2} />
                      </g>
                    );
                  })()}
                </g>
                <g opacity={lowLab}>
                  <Label x={1500} y={GY - GH + 22} size={26} color={C.cyan} weight={600}>
                    cepat
                  </Label>
                  <Label x={1500} y={GY - 44} size={26} color={C.press} weight={600}>
                    tekanan rendah
                  </Label>
                  <Ripple x={1500} y={GY - 20} p={ramp(t, wordOf(3, 'rendah') - 0.2, wordOf(3, 'rendah') + 1.2)} r={70} color="press" />
                </g>
              </g>
            ) : null}

            {/* contoh benda: kotak didorong gaya total → makin cepat */}
            {crate > 0.001 ? (
              <g opacity={crate}>
                <rect x={1130} y={190} width={640} height={250} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
                <line x1={1160} y1={400} x2={1740} y2={400} stroke={C.muted} strokeWidth={3} />
                {(() => {
                  const per = 2.6;
                  const ph = ((((t - cue(1)) / per) % 1) + 1) % 1;
                  const s = ph * per;
                  const x = 1200 + 0.5 * 110 * s * s;
                  return (
                    <g opacity={Math.min(1, ph * 10) * Math.min(1, (1 - ph) * 8)}>
                      {[1, 2, 3].map((i) => (
                        <line key={i} x1={x - 60 - i * 6} y1={330 + i * 14} x2={x - 60 - i * 6 - 12 * s} y2={330 + i * 14} stroke={C.cyan} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
                      ))}
                      <Crate x={x} y={400} w={90} h={80} color={C.force} />
                      <Arrow x1={x - 150} y1={358} x2={x - 52} y2={358} color="force" width={6} pulse={false} />
                      <Arrow x1={x - 30} y1={290} x2={x + 20 + 22 * s} y2={290} color="cyan" width={4} pulse={false} />
                    </g>
                  );
                })()}
                <Label x={1450} y={222} size={24} color={C.muted}>
                  gaya total → percepatan
                </Label>
              </g>
            ) : null}
            <Motes x={960} y={YC} rx={760} ry={180} n={20} color="press" opacity={0.3} seed={4} />
          </g>
        ) : null}

        {/* ======================= FASE B: dua lembar kertas ======================= */}
        {phB > 0.001 ? (
          <g opacity={phB * sheetsIn}>
            <Glow x={SX} y={500} r={260} color="cyan" opacity={0.25 + 0.25 * blow} />
            {/* udara diam di luar: molekul bergerak acak, lambat */}
            {[-1, 1].map((side) =>
              Array.from({length: 22}, (_, i) => {
                const xL = side < 0 ? 560 : 1100;
                const x = xL + 260 * tri(t * (0.05 + (i % 5) * 0.012) + i * 0.37);
                const y = 270 + 470 * tri(t * (0.04 + (i % 3) * 0.013) + i * 0.61);
                return <circle key={`${side}-${i}`} cx={x} cy={y} r={4} fill="#c9d6f5" opacity={0.55} />;
              }),
            )}
            {/* tiupan: sedotan dari atas */}
            <path d={`M1260,150 Q${SX + 20},150 ${SX},200 L${SX},212`} fill="none" stroke="#6b7bb0" strokeWidth={22} strokeLinecap="round" />
            <path d={`M1260,150 Q${SX + 20},150 ${SX},200 L${SX},212`} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={8} strokeLinecap="round" />
            {[-26, -9, 9, 26].map((dx, i) => (
              <Streamline
                key={dx}
                pts={[
                  [SX + dx * 0.3, 214],
                  [SX + dx * 0.55, 300],
                  [SX + dx * (0.9 - 0.4 * blow), 520],
                  [SX + dx * (0.9 - 0.3 * blow), S_TOP + S_LEN],
                  [SX + dx * 3, S_TOP + S_LEN + 120],
                ]}
                speed={560}
                n={5}
                color="cyan"
                line={0.35}
                seed={i * 2.3}
                opacity={blow}
              />
            ))}
            {/* batang penjepit */}
            <rect x={SX - 170} y={S_TOP - 22} width={340} height={14} rx={7} fill="#3b466e" stroke={C.muted} strokeWidth={2} />
            {[-1, 1].map((side) => (
              <rect key={side} x={SX + side * S_HALF - 9} y={S_TOP - 28} width={18} height={30} rx={4} fill={C.gold} opacity={0.9} />
            ))}
            {/* kertas */}
            {([-1, 1] as const).map((side) => {
              const pts = sheetPts(side);
              const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
              return (
                <g key={side}>
                  <path d={d} fill="none" stroke="#f4f1e6" strokeWidth={9} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={2} transform={`translate(${-side * 2} 0)`} />
                </g>
              );
            })}
            {/* panah tekanan: luar besar (p_atm), dalam kecil (aliran cepat) */}
            {([-1, 1] as const).map((side) =>
              [0.25, 0.45, 0.65, 0.85].map((s) => {
                const x = sheetX(side, s);
                const y = S_TOP + S_LEN * s;
                return (
                  <g key={`${side}-${s}`}>
                    <PressureArrow x={x + side * 6} y={y} nx={side} ny={0} L={58 * pushBig} width={4.5} opacity={nStill} />
                    <PressureArrow x={x - side * 6} y={y} nx={-side} ny={0} L={mix(58, 18, blow) * 0.4} width={3} color="#ffc2dc" opacity={nFast * 0.9} />
                  </g>
                );
              }),
            )}
            {/* "ditarik?" — salah: dicoret */}
            <g opacity={pullX}>
              {([-1, 1] as const).map((side) => (
                <Arrow key={side} x1={SX + side * 46} y1={430} x2={SX + side * 4} y2={430} color="muted" width={4} dash="7 6" pulse={false} />
              ))}
              <Label x={SX} y={352} size={26} color={C.ink} weight={600}>
                ditarik?
              </Label>
              <g opacity={cross} stroke={C.heat} strokeWidth={7} strokeLinecap="round">
                <line x1={SX - 36} y1={392} x2={SX + 36} y2={468} />
                <line x1={SX + 36} y1={392} x2={SX - 36} y2={468} />
              </g>
            </g>
            <g opacity={nStill}>
              <Label x={460} y={300} size={28} color={C.ink} weight={600}>
                udara diam
              </Label>
              <Label x={460} y={340} size={26} color={C.press} weight={600}>
                tekanan lebih tinggi
              </Label>
              <Label x={1460} y={300} size={28} color={C.ink} weight={600}>
                udara diam
              </Label>
              <Label x={1460} y={340} size={26} color={C.press} weight={600}>
                tekanan lebih tinggi
              </Label>
            </g>
            <g opacity={nFast}>
              <Label x={SX} y={S_TOP + S_LEN + 70} size={28} color={C.cyan} weight={600}>
                udara cepat → tekanan rendah
              </Label>
            </g>
            <Ripple x={SX} y={S_TOP + S_LEN * 0.75} p={ramp(t, wordOf(4, 'merapat') - 0.1, wordOf(4, 'merapat') + 1.1)} r={110} color="cyan" />
            <Twinkles x={SX} y={560} rx={260} ry={200} n={5} color="press" opacity={push} />
            <Motes x={SX} y={500} rx={420} ry={260} n={16} color="cyan" opacity={0.3} seed={9} />
          </g>
        ) : null}
      </Stage>

      {/* ---------- kartu HTML ---------- */}
      <Formula x={560} y={300} p={fNewton * phA} accent={C.force} size={60} caption="tanpa gaya total, tak ada percepatan">
        <V color={C.force}>F</V>
        <Sub>total</Sub> = <V>m</V> · <V>a</V>
      </Formula>
      <Formula x={560} y={300} p={fDp * phA} accent={C.press} size={58} caption="sepotong fluida didorong oleh beda tekanan">
        <V color={C.force}>F</V>
        <Sub>total</Sub> = (<V color={C.press}>p</V>
        <Sub>blkg</Sub> − <V color={C.press}>p</V>
        <Sub>dpn</Sub>) · <V color={C.water}>A</V>
      </Formula>
      <Note x={960} y={290} p={nBack * phA * (1 - graph)} color={C.press} size={32}>
        dipercepat ⇒ <V color={C.press}>p</V> di belakang &gt; <V color={C.press}>p</V> di depan
      </Note>
      <Badge x={SX} y={852} text="didorong dari luar, bukan ditarik" color={C.press} opacity={push * phB} scale={0.9 + 0.1 * push} size={28} />
    </AbsoluteFill>
  );
};
