import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Jet, Pipe, radiusAt} from '../components/flow';
import {Ground, fmt} from '../components/physics';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Sub, Sup, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Fase A (baris 0–2): pipa lebar r = 110 → sempit r = 55 (luas ÷4 → v ×4). "Potongan" air = volume yang lewat
//   dalam 1 detik (dipewarnai berselang): pendek-lebar di bagian lebar, panjang-ramping di bagian sempit.
//   Gerbang masuk/keluar menghitung potongan → sama banyak. Partikel 100 px/s → 400 px/s.
// Fase B (baris 3–5): selang + nosel. Skala semburan 205 px/m (tinggi nosel 1 m di atas lantai), g = 10 m/s²:
//   2,5 m/s → jangkauan ≈ 1,1 m; jempol (A = 0,5 cm²) → 10 m/s → ≈ 4,5 m. Debit tetap → partikel di selang
//   tetap secepat semula, hanya semburan di ujung yang makin cepat.
// Fase C (baris 6): kerumunan (tampak atas) melewati pintu selebar ¼ lorong → orang di pintu 4× lebih cepat.

type P = [number, number];
type Knot = [number, number];

/** Tabel waktu tempuh lokal τ(x) untuk benda yang ikut aliran (v ∝ 1/r^pow). */
const makeTravel = (knots: Knot[], x0: number, x1: number, v0: number, pow = 2, n = 400) => {
  const r0 = radiusAt(knots, x0);
  const xs: number[] = [x0];
  const ts: number[] = [0];
  const dx = (x1 - x0) / n;
  for (let i = 1; i <= n; i++) {
    const xm = x0 + (i - 0.5) * dx;
    const v = v0 * (r0 / radiusAt(knots, xm)) ** pow;
    xs.push(x0 + i * dx);
    ts.push(ts[i - 1] + dx / v);
  }
  const total = ts[n];
  const tauAt = (x: number) => {
    const u = Math.max(0, Math.min(n, (x - x0) / dx));
    const i = Math.min(n - 1, Math.floor(u));
    return ts[i] + (ts[i + 1] - ts[i]) * (u - i);
  };
  const xAt = (tau: number) => {
    if (tau <= 0) return x0;
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
  const vAt = (x: number) => v0 * (r0 / radiusAt(knots, x)) ** pow;
  return {total, tauAt, xAt, vAt};
};

// ---------- fase A ----------
const AX0 = 140;
const AX1 = 1780;
const AYC = 590;
const AK: Knot[] = [
  [AX0, 110],
  [700, 110],
  [960, 55],
  [AX1, 55],
];
const AV0 = 100;
const TA = makeTravel(AK, AX0, AX1, AV0);
const TC = 1; // satu potongan = volume yang lewat dalam 1 detik
const GIN = 380;
const GOUT = 1450;

const chunkPath = (xa: number, xb: number) => {
  const n = 14;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = xa + ((xb - xa) * i) / n;
    const r = radiusAt(AK, x) - 3;
    top.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${(AYC - r).toFixed(1)}`);
    bot.unshift(`L${x.toFixed(1)},${(AYC + r).toFixed(1)}`);
  }
  return `${top.join(' ')} ${bot.join(' ')} Z`;
};

// ---------- fase B ----------
const HX0 = 170;
const HX1 = 866;
const HYC = 560;
const HK: Knot[] = [
  [HX0, 30],
  [740, 30],
  [HX1, 18],
];
const SC = 205; // px per meter (semburan)
const FLOOR = HYC + SC; // nosel 1 m di atas lantai
const GPX = 10 * SC;

// ---------- fase C ----------
const CX0 = 120;
const CX1 = 1800;
const CYC = 540;
const CK: Knot[] = [
  [CX0, 250],
  [660, 250],
  [880, 62.5],
  [1040, 62.5],
  [1260, 250],
  [CX1, 250],
];
const CV0 = 42;
const TCR = makeTravel(CK, CX0, CX1, CV0, 1); // 2D: kecepatan ∝ 1/lebar

const wallPath = (sign: 1 | -1, off: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 84; i++) {
    const x = CX0 + ((CX1 - CX0) * i) / 84;
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)},${(CYC + sign * (radiusAt(CK, x) + off)).toFixed(1)}`);
  }
  return pts.join(' ');
};

export const Continuity: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const phA = 1 - ramp(t, cue(3) - 0.8, cue(3) - 0.1, EASE_IN_OUT);
  const phB = ramp(t, cue(3) - 0.3, cue(3) + 0.5) * (1 - ramp(t, cue(6) - 0.6, cue(6) + 0.1, EASE_IN_OUT));
  const phC = ramp(t, cue(6) - 0.1, cue(6) + 0.7);

  // ---------- fase A ----------
  const pipeIn = ramp(t, -0.4, 1.0);
  const bIncomp = win(t, wordOf(0, 'dimampatkan') - 0.3, cue(1) + 0.4, 0.5, 0.6);
  const bLeak = win(t, wordOf(0, 'hilang') - 0.3, cue(1) + 0.6, 0.5, 0.6);
  const chunks = win(t, cue(1) - 0.2, cue(3) - 0.6, 0.8, 0.5);
  const gates = win(t, wordOf(1, 'masuk') - 0.4, cue(3) - 0.9, 0.6, 0.5);
  const gOut = ramp(t, wordOf(1, 'keluar') - 0.4, wordOf(1, 'keluar') + 0.3);
  const nChunk = win(t, cue(1) + 0.2, wordOf(1, 'sama') - 0.4, 0.6, 0.4);
  const nSame = win(t, wordOf(1, 'sama') - 0.2, cue(2) + 0.2, 0.6, 0.5);
  const areas = win(t, cue(2) - 0.1, cue(3) - 0.4, 0.6, 0.5);
  const fQ = win(t, wordOf(2, 'Debit') - 0.3, cue(3) - 0.5, 0.6, 0.5);
  const fCont = ramp(t, wordOf(2, 'kontinuitas') - 0.5, wordOf(2, 'kontinuitas') + 0.3);
  const tauIn = TA.tauAt(GIN);
  const tauOut = TA.tauAt(GOUT);
  const k0 = 2 * Math.ceil((wordOf(1, 'masuk') - tauIn - TC) / (2 * TC)); // potongan berwarna pertama yang dihitung

  // ---------- fase B ----------
  const hoseIn = ramp(t, cue(3) - 0.2, cue(3) + 0.8);
  const fNoz = win(t, wordOf(3, 'dua') - 0.4, cue(4) - 0.2, 0.6, 0.5);
  const fNozNum = ramp(t, wordOf(3, 'koma') - 0.6, wordOf(3, 'koma') + 0.3);
  const thumbIn = ramp(t, wordOf(4, 'jempol') - 0.8, wordOf(4, 'jempol') + 0.2);
  const cover = ramp(t, wordOf(4, 'jempol') - 0.1, wordOf(4, 'setengah') + 0.5, EASE_IN_OUT);
  const A = mix(2, 0.5, cover); // cm²
  const vReal = 5 / A; // m/s (Q = 5×10⁻⁴ m³/s)
  const vDone = ramp(t, wordOf(4, 'setengah') + 0.5, wordOf(4, 'setengah') + 0.9);
  const f4 = win(t, wordOf(4, 'empat') - 0.4, cue(6) - 0.6, 0.6, 0.5);
  const f5 = ramp(t, cue(5) + 0.1, cue(5) + 0.7);
  const f5num = ramp(t, wordOf(5, 'sepuluh') - 0.5, wordOf(5, 'sepuluh') + 0.3);
  const jetY = mix(HYC, HYC + 13, cover);
  const vx = vReal * SC;
  const land = HX1 + vx * Math.sqrt((2 * (FLOOR - jetY)) / GPX);
  const inset = ramp(t, wordOf(3, 'Ujung') - 0.3, wordOf(3, 'Ujung') + 0.6);

  // ---------- fase C ----------
  const crowdIn = ramp(t, cue(6) + 0.1, cue(6) + 1.0);
  const door = ramp(t, wordOf(6, 'pintu') - 0.3, wordOf(6, 'pintu') + 0.5);
  const nCrowd = ramp(t, wordOf(6, 'agar') - 0.3, wordOf(6, 'agar') + 0.5);
  const fast = ramp(t, wordOf(6, 'lebih') - 0.4, wordOf(6, 'lebih') + 0.4);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======================= FASE A: pipa menyempit ======================= */}
        {phA > 0.001 ? (
          <g opacity={phA * pipeIn}>
            <Glow x={1400} y={AYC} r={360} color="cyan" opacity={0.35} />
            <Glow x={420} y={AYC} r={320} color="water" opacity={0.3} />
            <ellipse cx={960} cy={AYC + 180} rx={820} ry={16} fill="#000" opacity={0.3} />
            <Pipe x0={AX0} x1={AX1} yc={AYC} knots={AK} v0={AV0} lanes={7} perLane={7} lines={0.3} particles={1 - 0.55 * chunks} />
            {/* potongan volume-per-detik (berselang) */}
            {chunks > 0.001 ? (
              <g opacity={chunks}>
                {Array.from({length: 8}, (_, j) => {
                  const k = Math.floor(t / TC / 2) * 2 - 2 * j;
                  const xb = TA.xAt(t - k * TC);
                  const xa = TA.xAt(t - (k + 1) * TC);
                  if (xb - xa < 1) return null;
                  const fade = Math.min(1, (AX1 - xb) / 60 + 0.2) * Math.min(1, (xa - AX0) / 30 + 0.3);
                  return (
                    <g key={k} opacity={Math.max(0, Math.min(1, fade))}>
                      <path d={chunkPath(xa, xb)} fill={C.cyan} fillOpacity={0.5} stroke="#e6f8ff" strokeOpacity={0.9} strokeWidth={2.5} />
                    </g>
                  );
                })}
              </g>
            ) : null}
            {/* gerbang masuk / keluar dengan penghitung */}
            {gates > 0.001 ? (
              <g opacity={gates}>
                {[
                  {x: GIN, tau: tauIn, lab: 'masuk', op: 1},
                  {x: GOUT, tau: tauOut, lab: 'keluar', op: gOut},
                ].map((g) => {
                  const r = radiusAt(AK, g.x);
                  return (
                    <g key={g.lab} opacity={g.op}>
                      <line x1={g.x} y1={AYC - r - 26} x2={g.x} y2={AYC + r + 26} stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 16} />
                      <Label x={g.x} y={AYC - r - 92} size={28} color={C.gold} weight={600}>
                        {g.lab}
                      </Label>
                      {Array.from({length: 4}, (_, j) => {
                        const k = k0 + 2 * j;
                        const tPass = (k + 1) * TC + g.tau;
                        const p = ramp(t, tPass, tPass + 0.35, BACK);
                        return (
                          <g key={j}>
                            <circle cx={g.x - 45 + j * 30} cy={AYC - r - 52} r={10} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeWidth={2} />
                            <circle cx={g.x - 45 + j * 30} cy={AYC - r - 52} r={9 * p} fill={C.cyan} opacity={p} />
                            <Ripple x={g.x - 45 + j * 30} y={AYC - r - 52} p={ramp(t, tPass, tPass + 0.8)} r={30} color="cyan" rings={2} />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            ) : null}
            {/* luas penampang & kecepatan */}
            {areas > 0.001 ? (
              <g opacity={areas}>
                {[
                  {x: 420, lab: '1', vlen: 70},
                  {x: 1380, lab: '2', vlen: 280},
                ].map((s, i) => {
                  const r = radiusAt(AK, s.x);
                  const pop = ramp(t, cue(2) + 0.2 + i * 0.8, cue(2) + 0.9 + i * 0.8, BACK);
                  return (
                    <g key={s.lab} opacity={Math.min(1, pop)}>
                      <ellipse cx={s.x} cy={AYC} rx={r * 0.28 * pop} ry={r - 2} fill={C.water} fillOpacity={0.35} stroke="#e6f8ff" strokeWidth={2.5} />
                      <line x1={s.x} y1={AYC + r - 4} x2={s.x} y2={AYC + r + 22} stroke={C.water} strokeWidth={2} />
                      <Label x={s.x} y={AYC + r + 44} size={38} font="serif" italic color={C.water} weight={600}>
                        A<TSub>{s.lab}</TSub>
                      </Label>
                      <Arrow x1={s.x - s.vlen / 2} y1={AYC + r + 100} x2={s.x + s.vlen / 2} y2={AYC + r + 100} color="cyan" width={6} />
                      <Label x={s.x - s.vlen / 2 - 34} y={AYC + r + 100} size={36} font="serif" italic color={C.cyan} weight={600}>
                        v<TSub>{s.lab}</TSub>
                      </Label>
                    </g>
                  );
                })}
              </g>
            ) : null}
            <Motes x={960} y={AYC} rx={760} ry={200} n={22} color="water" opacity={0.35} seed={3} />
          </g>
        ) : null}

        {/* ======================= FASE B: selang & jempol ======================= */}
        {phB > 0.001 ? (
          <g opacity={phB * hoseIn}>
            <Glow x={HX1} y={HYC} r={200} color="cyan" opacity={0.4} />
            <Ground x1={100} x2={1840} y={FLOOR} />
            {/* genangan di titik jatuh */}
            <ellipse cx={land} cy={FLOOR + 4} rx={50 + 6 * Math.sin(t * 2.4)} ry={8} fill={C.water} opacity={0.45} />
            {[0, 1, 2].map((k) => {
              const ph = (((t * 0.8 + k / 3) % 1) + 1) % 1;
              return <ellipse key={k} cx={land} cy={FLOOR + 4} rx={20 + 70 * ph} ry={4 + 9 * ph} fill="none" stroke="#cfeaff" strokeWidth={2} opacity={0.6 * cyc(ph)} />;
            })}
            {/* keran di dinding */}
            <rect x={90} y={470} width={16} height={180} rx={4} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            <rect x={104} y={534} width={70} height={52} rx={10} fill="#2b3766" stroke="#c9d3f0" strokeWidth={2.5} />
            <g transform={`rotate(${40 * Math.sin(Math.min(1, hoseIn) * Math.PI * 0.5)} 138 520)`}>
              <rect x={134} y={500} width={8} height={36} fill="#c9d3f0" />
              <rect x={112} y={494} width={52} height={12} rx={6} fill={C.heat} opacity={0.85} />
            </g>
            <Pipe x0={HX0} x1={HX1} yc={HYC} knots={HK} v0={512 * (18 / 30) ** 2} lanes={3} perLane={9} wall={C.buoy} lines={0.2} seed={4} />
            {/* nosel kuningan */}
            <path d={`M736,${HYC - 36} L746,${HYC - 36} Q800,${HYC - 34} ${HX1},${HYC - 22} L${HX1},${HYC - 18}`} fill="none" stroke={C.gold} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M736,${HYC + 36} L746,${HYC + 36} Q800,${HYC + 34} ${HX1},${HYC + 22} L${HX1},${HYC + 18}`} fill="none" stroke={C.gold} strokeWidth={6} strokeLinejoin="round" />
            <rect x={728} y={HYC - 42} width={16} height={84} rx={4} fill="#5a4a20" stroke={C.gold} strokeWidth={2.5} />
            {/* semburan: kecepatan dari kontinuitas, jatuh dengan g = 10 m/s² (skala 205 px/m) */}
            <Jet x={HX1 + 2} y={jetY} vx={vx} g={GPX} yFloor={FLOOR} width={mix(10, 6, cover)} drops={12} />
            {/* garis gerak di ujung yang cepat */}
            {Array.from({length: 4}, (_, k) => {
              const ph = (((t * (1.4 + cover * 2) + k / 4) % 1) + 1) % 1;
              const x = HX1 + 20 + ph * (60 + 120 * cover);
              return <line key={k} x1={x} y1={jetY - 26 - k * 5} x2={x + 26 + 30 * cover} y2={jetY - 26 - k * 5} stroke={C.cyan} strokeWidth={2} strokeLinecap="round" opacity={0.6 * cyc(ph)} />;
            })}
            {/* jempol: ujung jari menutup bagian atas lubang, air keluar lewat celah bawah */}
            {thumbIn > 0.001 ? (
              <g opacity={thumbIn} transform={`translate(${mix(60, 0, thumbIn) + mix(30, 0, cover)} ${mix(-90, 0, thumbIn) + mix(-50, 0, cover) + 1.2 * Math.sin(t * 2.2) * cover})`}>
                <g transform={`translate(${HX1 + 22} ${HYC - 14}) rotate(28)`}>
                  <rect x={-58} y={-330} width={150} height={150} rx={60} fill="#c98d68" stroke="#ffd9bd" strokeOpacity={0.6} strokeWidth={2} />
                  <path d="M-26,0 Q-26,26 0,26 Q26,26 26,0 L30,-200 L-30,-200 Z" fill="#e8b48e" stroke="#ffd9bd" strokeWidth={2} />
                  <path d="M6,-6 Q22,-6 22,-24 L22,-60 Q14,-66 6,-60 Z" fill="#f8dccb" opacity={0.95} />
                  <path d="M-24,-118 Q-6,-112 14,-120" fill="none" stroke="#a86f4f" strokeWidth={2.5} strokeLinecap="round" />
                </g>
                <Label x={HX1 + 170} y={380} size={26} color="#ffd9bd" weight={600}>
                  jempol
                </Label>
              </g>
            ) : null}
            {/* pembacaan kecepatan semburan */}
            <g>
              <rect x={1080} y={HYC - 118} width={300} height={90} rx={16} fill="rgba(10,16,36,0.8)" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} />
              <Label x={1102} y={HYC - 94} size={20} color={C.muted} anchor="start">
                kecepatan semburan
              </Label>
              <Label x={1102} y={HYC - 54} size={38} font="mono" color={C.cyan} weight={600} anchor="start" opacity={1 - vDone}>
                {`v = ${fmt(vReal, 1)} m/s`}
              </Label>
              <Label x={1102} y={HYC - 54} size={38} font="mono" color={C.cyan} weight={600} anchor="start" opacity={vDone}>
                v = 10 m/s
              </Label>
              <Twinkles x={1230} y={HYC - 74} rx={170} ry={60} n={5} color="cyan" opacity={f5num} />
            </g>
            <Ripple x={land} y={FLOOR} p={ramp(t, wordOf(5, 'sepuluh') - 0.2, wordOf(5, 'sepuluh') + 1.2)} r={90} color="cyan" />
            {/* penampang ujung nosel */}
            {inset > 0.001 ? (
              <g opacity={inset}>
                <rect x={110} y={220} width={340} height={230} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.line} strokeWidth={2} />
                <Label x={280} y={250} size={22} color={C.muted}>
                  penampang ujung selang
                </Label>
                <circle cx={200} cy={340} r={62} fill="#e8b48e" opacity={cover} />
                <circle cx={200} cy={340} r={62} fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray="8 6" />
                <circle cx={200} cy={340} r={62 * Math.sqrt(A / 2)} fill={C.water} opacity={0.75} />
                <circle cx={200} cy={340} r={62 * Math.sqrt(A / 2)} fill="none" stroke="#e6f8ff" strokeWidth={2} />
                {[0, 1, 2, 3].map((k) => {
                  const ph = (((t * 0.6 + k / 4) % 1) + 1) % 1;
                  return <circle key={k} cx={200} cy={340} r={8 + ph * 50 * Math.sqrt(A / 2)} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.5 * cyc(ph)} />;
                })}
                <Label x={300} y={318} size={22} color={C.muted} anchor="start">
                  A =
                </Label>
                <Label x={300} y={358} size={34} font="mono" color={C.water} weight={600} anchor="start" opacity={1 - cover}>
                  2 cm²
                </Label>
                <Label x={300} y={358} size={34} font="mono" color={C.water} weight={600} anchor="start" opacity={cover}>
                  0,5 cm²
                </Label>
                <Label x={280} y={420} size={22} color={C.gold} opacity={ramp(t, wordOf(4, 'empat') - 0.3, wordOf(4, 'empat') + 0.4)}>
                  luas ÷ 4
                </Label>
              </g>
            ) : null}
            <Motes x={HX1 + 200} y={HYC + 60} rx={500} ry={160} n={16} color="cyan" opacity={0.35} seed={8} />
          </g>
        ) : null}

        {/* ======================= FASE C: kerumunan & pintu sempit ======================= */}
        {phC > 0.001 ? (
          <g opacity={phC * crowdIn}>
            <Glow x={960} y={CYC} r={260} color="gold" opacity={0.25 + 0.35 * door} />
            {/* lantai lorong */}
            <path d={`${wallPath(-1, 0)} ${wallPath(1, 0).replace(/^M/, 'L').split(' ').reverse().join(' ')}`} fill="#0e1838" opacity={0.6} />
            {/* dinding */}
            <path d={wallPath(-1, 10)} fill="none" stroke="#3a4a7e" strokeWidth={20} strokeLinejoin="round" />
            <path d={wallPath(1, 10)} fill="none" stroke="#3a4a7e" strokeWidth={20} strokeLinejoin="round" />
            <path d={wallPath(-1, 0)} fill="none" stroke="#9fb2e6" strokeWidth={2.5} />
            <path d={wallPath(1, 0)} fill="none" stroke="#9fb2e6" strokeWidth={2.5} />
            {/* kusen pintu */}
            <g opacity={door}>
              <rect x={950} y={CYC - 62.5 - 30} width={20} height={30} fill={C.gold} opacity={0.9} />
              <rect x={950} y={CYC + 62.5} width={20} height={30} fill={C.gold} opacity={0.9} />
              <Label x={960} y={CYC - 140} size={30} color={C.gold} weight={600}>
                pintu sempit
              </Label>
            </g>
            {/* orang (tampak atas): kecepatan ∝ 1/lebar lorong → jumlah orang per detik sama */}
            {Array.from({length: 9}, (_, j) => {
              const f = -0.84 + (1.68 * j) / 8;
              return Array.from({length: 8}, (_, k) => {
                const ph = (((t / TCR.total + k / 8 + rand(j * 3.7 + 1) * 0.9) % 1) + 1) % 1;
                const x = TCR.xAt(ph * TCR.total);
                const r = radiusAt(CK, x);
                const y = CYC + f * (r - 14);
                const v = TCR.vAt(x);
                const fade = Math.min(1, ph * 14) * Math.min(1, (1 - ph) * 14);
                const step = Math.sin(t * (4 + v * 0.03) + j * 1.3 + k * 2.1);
                const hot = Math.max(0, Math.min(1, (v - CV0 * 1.4) / (CV0 * 2)));
                const col = [C.water, C.cyan, C.ink, C.buoy][(j + k) % 4];
                return (
                  <g key={`${j}-${k}`} opacity={fade}>
                    {hot > 0.02 ? <line x1={x - 18 - 30 * hot} y1={y} x2={x - 16} y2={y} stroke={C.cyan} strokeWidth={3} strokeLinecap="round" opacity={0.7 * hot * fast} /> : null}
                    <ellipse cx={x} cy={y} rx={9} ry={15} fill={col} opacity={0.55} transform={`rotate(${3 * step} ${x} ${y})`} />
                    <circle cx={x + 2} cy={y} r={7.5} fill={col} />
                  </g>
                );
              });
            })}
            {/* satu orang disorot */}
            {(() => {
              const ph = (((t / TCR.total) * 1 + 0.07) % 1 + 1) % 1;
              const x = TCR.xAt(ph * TCR.total);
              const v = TCR.vAt(x);
              const fade = Math.min(1, ph * 14) * Math.min(1, (1 - ph) * 14);
              return (
                <g opacity={fade * nCrowd}>
                  <Spark x={x} y={CYC} r={8} color="gold" trail={[1, 2, 3, 4].map((i) => [TCR.xAt(ph * TCR.total - i * 0.12), CYC] as P)} />
                  <Arrow x1={x + 18} y1={CYC - 34} x2={x + 18 + v * 0.9} y2={CYC - 34} color="cyan" width={5} pulse={false} />
                </g>
              );
            })()}
            {/* penghitung orang/detik di kiri & kanan */}
            <g opacity={nCrowd}>
              <Label x={390} y={CYC + 300} size={26} color={C.muted}>
                lambat, lorong lebar
              </Label>
              <Label x={960} y={CYC + 300} size={26} color={C.cyan} weight={600}>
                cepat di pintu
              </Label>
              <Label x={1530} y={CYC + 300} size={26} color={C.muted}>
                lambat lagi
              </Label>
            </g>
            <Motes x={960} y={CYC} rx={300} ry={160} n={14} color="gold" opacity={0.4} seed={11} />
          </g>
        ) : null}
      </Stage>

      {/* ---------- kartu HTML ---------- */}
      <Badge x={700} y={250} text="tak termampatkan" color={C.water} opacity={bIncomp * phA} scale={0.9 + 0.1 * bIncomp} size={30} />
      <Badge x={1220} y={250} text="tidak bocor, tidak hilang" color={C.cyan} opacity={bLeak * phA} scale={0.9 + 0.1 * bLeak} size={30} />
      <Note x={960} y={250} p={nChunk * phA} color={C.cyan} size={32}>
        tiap potongan = volume yang lewat dalam 1 detik
      </Note>
      <Note x={960} y={250} p={nSame * phA * (1 - fQ)} color={C.gold} size={32}>
        volume masuk per detik = volume keluar per detik
      </Note>
      <Formula x={960} y={250} p={fQ * phA} accent={C.water} size={62} caption={<span style={{opacity: fCont}}>persamaan kontinuitas: debit di mana pun sama</span>}>
        <V color={C.water}>Q</V> = <V color={C.water}>A</V>
        <Sub>1</Sub>
        <V color={C.cyan}>v</V>
        <Sub>1</Sub> = <V color={C.water}>A</V>
        <Sub>2</Sub>
        <V color={C.cyan}>v</V>
        <Sub>2</Sub>
      </Formula>
      <Formula x={1270} y={290} p={fNoz * phB} accent={C.cyan} size={56} caption="Q = 0,5 L/s = 5 × 10⁻⁴ m³/s">
        <V color={C.cyan}>v</V> = <Frac n={<V color={C.water}>Q</V>} d={<V color={C.water}>A</V>} /> ={' '}
        <Frac
          n={
            <>
              5 × 10<Sup>−4</Sup>
            </>
          }
          d={
            <>
              2 × 10<Sup>−4</Sup>
            </>
          }
        />{' '}
        = <span style={{color: C.cyan, opacity: fNozNum}}>2,5 m/s</span>
      </Formula>
      <Formula x={1270} y={290} p={f4 * phB} accent={C.gold} size={58} caption="debit tetap: air yang sama harus keluar tiap detik">
        <V color={C.water}>A</V> ÷ 4 <span style={{opacity: f5}}>→ </span>
        <span style={{opacity: f5}}>
          <V color={C.cyan}>v</V> × 4 = <span style={{color: C.cyan, opacity: 0.3 + 0.7 * f5num}}>10 m/s</span>
        </span>
      </Formula>
      <Note x={960} y={226} p={nCrowd * phC} color={C.gold} size={30}>
        orang per detik tetap → di pintu sempit, tiap orang harus lebih cepat
      </Note>
    </AbsoluteFill>
  );
};
