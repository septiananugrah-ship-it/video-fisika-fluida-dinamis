import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Streamline} from '../components/flow';
import {PressureArrow} from '../components/fluid';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Part, Ripple, Stage, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Atap terangkat badai (penampang rumah):
//  baris 0: angin cepat di atas atap (garis arus merapat & cepat), udara di dalam hampir diam (lilin tegak).
//  baris 1: tekanan di dalam > di atas atap → gaya total ke atas.
//  baris 2–3: v = 30 m/s ≈ 108 km/jam → Δp = ½ρv² = ½ · 1,2 · 30² = 540 Pa.
//  baris 4: × 100 m² = 54 000 N ≈ berat 5,4 ton (truk bayangan); atap bergetar terangkat.
//  baris 5: atap diikat ke dinding (tali baja & baut mengencang), getaran berhenti.

const WALL_L = 300;
const WALL_R = 940;
const TOP = 560;
const FLOOR = 840;
const APEX: [number, number] = [620, 378];
const EAVE_L: [number, number] = [236, 570];
const EAVE_R: [number, number] = [1004, 570];
const NL: [number, number] = [-0.437, -0.899]; // normal luar lereng kiri
const NR: [number, number] = [0.437, -0.899]; // normal luar lereng kanan

/** Titik pada lereng atap (u 0..1 dari tepi ke puncak). */
const onSlope = (left: boolean, u: number): [number, number] => {
  const e = left ? EAVE_L : EAVE_R;
  return [mix(e[0], APEX[0], u), mix(e[1], APEX[1], u)];
};

const bump = (x: number) => {
  if (x <= 160 || x >= 1100) return 0;
  return x < APEX[0] ? 0.5 - 0.5 * Math.cos((Math.PI * (x - 160)) / (APEX[0] - 160)) : 0.5 - 0.5 * Math.cos((Math.PI * (1100 - x)) / (1100 - APEX[0]));
};

/** Garis arus ke-k di atas atap: makin dekat atap makin dibelokkan & makin cepat. */
const windLine = (k: number): {pts: [number, number][]; gain: number[]} => {
  const y0 = 520 - 52 * k;
  const yTop = APEX[1] - 34 - 42 * k;
  const A = y0 - yTop;
  const pts: [number, number][] = [];
  const gain: number[] = [];
  for (let i = 0; i <= 44; i++) {
    const x = 60 + (1180 * i) / 44;
    const b = bump(x);
    pts.push([x, y0 - A * b]);
    gain.push(1 + (0.9 - 0.15 * k) * b);
  }
  return {pts, gain};
};

/** Anemometer mangkuk berputar cepat. */
const Anemometer: React.FC<{x: number; y: number; t: number; op: number; spin: number}> = ({x, y, t, op, spin}) => {
  if (op <= 0.001) return null;
  const a = t * spin;
  return (
    <g opacity={op}>
      <line x1={x} y1={FLOOR} x2={x} y2={y} stroke="#8fa0d0" strokeWidth={6} />
      <circle cx={x} cy={y} r={7} fill="#c9d2ee" />
      {[0, 1, 2].map((k) => {
        const ang = a + (k * 2 * Math.PI) / 3;
        const cx = x + Math.cos(ang) * 46;
        const cy = y + Math.sin(ang) * 12;
        const front = Math.sin(ang) > 0;
        return (
          <g key={k}>
            <line x1={x} y1={y} x2={cx} y2={cy} stroke="#c9d2ee" strokeWidth={3} />
            <ellipse cx={cx} cy={cy} rx={12} ry={9} fill={front ? '#e8ecf5' : '#8fa0d0'} stroke="#fff" strokeWidth={1} />
          </g>
        );
      })}
      <path d={`M${x - 70},${y - 30} a70,26 0 0 1 140,0`} fill="none" stroke={C.cyan} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-t * 60} opacity={0.6} />
    </g>
  );
};

/** Truk bayangan bermuatan (garis putus-putus) untuk pembanding berat. */
const GhostTruck: React.FC<{x: number; y: number; op: number; t: number}> = ({x, y, op, t}) => {
  if (op <= 0.001) return null;
  const st = {fill: C.force, fillOpacity: 0.08, stroke: C.force, strokeWidth: 3, strokeDasharray: '10 7', strokeDashoffset: -t * 20};
  return (
    <g opacity={op}>
      <rect x={x - 170} y={y - 110} width={220} height={110} rx={8} {...st} />
      <path d={`M${x + 60},${y} L${x + 60},${y - 80} L${x + 130},${y - 80} L${x + 170},${y - 40} L${x + 170},${y} Z`} {...st} />
      {[x - 120, x - 10, x + 120].map((cx) => (
        <circle key={cx} cx={cx} cy={y + 12} r={22} {...st} />
      ))}
      <text x={x - 60} y={y - 56} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={38} fill={C.force}>
        5,4 t
      </text>
    </g>
  );
};

export const Roof: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.4, 1.2, EASE_IN_OUT);
  const storm = ramp(t, 0.2, 2.6, EASE_IN_OUT);

  /* ---------- waktu ---------- */
  const tDiam = wordOf(0, 'diam');
  const pr = ramp(t, cue(1) - 0.1, cue(1) + 0.8);
  const tLow = wordOf(1, 'rendah');
  const net = ramp(t, tLow - 0.3, tLow + 0.6);
  const tV = wordOf(2, 'tiga');
  const vOp = ramp(t, tV - 0.3, tV + 0.5);
  const kmOp = ramp(t, wordOf(2, 'seratus') - 0.3, wordOf(2, 'seratus') + 0.5);
  const tHalf = wordOf(2, 'setengah');
  const f1 = ramp(t, tHalf - 0.2, tHalf + 0.6) * (1 - ramp(t, cue(3) - 0.4, cue(3) + 0.1, EASE_IN_OUT));
  const f2 = ramp(t, cue(3) - 0.1, cue(3) + 0.6) * (1 - ramp(t, wordOf(4, 'Kalikan') - 0.4, wordOf(4, 'Kalikan') + 0.1, EASE_IN_OUT));
  const res2 = ramp(t, wordOf(3, 'lima') - 0.2, wordOf(3, 'lima') + 0.5);
  const tK = wordOf(4, 'Kalikan');
  const area = ramp(t, wordOf(4, 'seratus') - 0.4, wordOf(4, 'seratus') + 0.4) * (1 - ramp(t, cue(5) - 0.3, cue(5) + 0.5, EASE_IN_OUT));
  const f3 = ramp(t, tK - 0.1, tK + 0.6);
  const res3 = ramp(t, wordOf(4, 'newton') - 0.6, wordOf(4, 'newton') + 0.3);
  const tSet = wordOf(4, 'setara');
  const ghost = ramp(t, tSet - 0.3, tSet + 0.6);
  const tie = ramp(t, wordOf(5, 'diikat') - 0.3, wordOf(5, 'diikat') + 1.0, EASE_IN_OUT);
  const lift = ramp(t, cue(4), wordOf(4, 'atas') + 0.3, EASE_IN_OUT) * (1 - tie);
  const rattle = lift * (4 + 3 * Math.sin(t * 2.3)) * (0.5 + 0.5 * Math.sin(t * 17));
  const roofDy = -rattle - 4 * lift;
  const roofRot = 0.6 * lift * Math.sin(t * 11);
  const card3Y = 400;

  const roofD = `M${EAVE_L[0]},${EAVE_L[1]} L${APEX[0]},${APEX[1]} L${EAVE_R[0]},${EAVE_R[1]}`;
  const lines = [0, 1, 2, 3].map(windLine);
  const tree = 6 * storm + 3 * storm * Math.sin(t * 2.6) + 1.5 * Math.sin(t * 7.1) * storm;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="rf-rain" clipRule="evenodd">
            <path clipRule="evenodd" d={`M60,150 L1240,150 L1240,${FLOOR} L60,${FLOOR} Z M${WALL_L},${FLOOR} L${WALL_L},${TOP} L${APEX[0]},${APEX[1] + 12} L${WALL_R},${TOP} L${WALL_R},${FLOOR} Z`} />
          </clipPath>
          <linearGradient id="rf-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2550" stopOpacity={0.0} />
            <stop offset="100%" stopColor="#1a2550" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <g opacity={appear}>
          {/* awan badai */}
          {Array.from({length: 6}, (_, k) => {
            const x = ((((k * 260 + t * 40 * (0.6 + 0.3 * rand(k))) % 1500) + 1500) % 1500) - 150;
            return <ellipse key={k} cx={x} cy={190 + 20 * rand(k * 3)} rx={150 + 40 * rand(k)} ry={34} fill="#2a3358" opacity={0.35 * storm} />;
          })}
          {/* tanah */}
          <rect x={60} y={FLOOR} width={1180} height={40} fill="url(#ground)" />
          <line x1={60} y1={FLOOR} x2={1240} y2={FLOOR} stroke="#3a4a7a" strokeWidth={3} />
          {Array.from({length: 16}, (_, k) => {
            const x = 80 + k * 72;
            if (x > WALL_L - 10 && x < WALL_R + 10) return null;
            const b = 8 * storm + 3 * Math.sin(t * 5 + k);
            return <path key={k} d={`M${x},${FLOOR} q${b * 0.4},-10 ${b},-20 M${x + 8},${FLOOR} q${b * 0.4},-8 ${b + 6},-15`} fill="none" stroke="#4fae7a" strokeWidth={2.5} opacity={0.6} />;
          })}
          {/* pohon membungkuk */}
          <g transform={`rotate(${tree.toFixed(2)} 150 ${FLOOR})`}>
            <path d={`M144,${FLOOR} L150,640 L158,${FLOOR} Z`} fill="#5a3f2e" />
            {[
              [150, 600, 62],
              [110, 640, 44],
              [194, 632, 46],
              [150, 548, 46],
            ].map(([x, y, r], i) => (
              <circle key={i} cx={x + 4 * Math.sin(t * 6 + i) * storm} cy={y} r={r} fill="#2f6a52" stroke="#4fae7a" strokeWidth={2} opacity={0.9} />
            ))}
          </g>
          {/* daun beterbangan */}
          {Array.from({length: 8}, (_, k) => {
            const ph = (((t * 0.35 + k / 8) % 1) + 1) % 1;
            const x = 160 + ph * 1050;
            const y = 560 - 160 * Math.sin(ph * Math.PI) * (0.6 + 0.4 * rand(k)) + 20 * Math.sin(t * 4 + k);
            return <ellipse key={k} cx={x} cy={y} rx={7} ry={3.5} fill="#5fbf8a" opacity={cyc(ph) * storm * 0.8} transform={`rotate(${(t * 300 + k * 50) % 360} ${x} ${y})`} />;
          })}

          {/* ======= rumah ======= */}
          <rect x={WALL_L} y={TOP} width={WALL_R - WALL_L} height={FLOOR - TOP} fill="#141c3c" />
          <path d={`M${WALL_L},${TOP} L${APEX[0]},${APEX[1] + 22} L${WALL_R},${TOP} Z`} fill="#121a38" />
          {/* jendela belakang dengan hujan di luar */}
          <rect x={720} y={620} width={140} height={110} rx={6} fill="#0b1430" stroke="#6f7fb8" strokeWidth={3} />
          {Array.from({length: 6}, (_, k) => {
            const ph = (((t * 1.6 + k / 6) % 1) + 1) % 1;
            return <line key={k} x1={730 + k * 22 + ph * 10} y1={624 + ph * 96} x2={736 + k * 22 + ph * 10} y2={638 + ph * 96} stroke="#9fd0ff" strokeWidth={1.5} opacity={cyc(ph) * 0.7} />;
          })}
          <line x1={790} y1={620} x2={790} y2={730} stroke="#6f7fb8" strokeWidth={2} />
          {/* meja & lilin (nyala tegak = udara diam) */}
          <rect x={420} y={772} width={220} height={12} rx={3} fill="#6a4a36" />
          <line x1={440} y1={784} x2={440} y2={FLOOR} stroke="#6a4a36" strokeWidth={8} />
          <line x1={620} y1={784} x2={620} y2={FLOOR} stroke="#6a4a36" strokeWidth={8} />
          <rect x={520} y={736} width={18} height={36} rx={3} fill="#efe6d0" />
          <Glow x={529} y={722} r={70} color="gold" opacity={0.7} />
          <path d={`M529,${706 + 0.8 * Math.sin(t * 9)} Q537,722 529,734 Q521,722 529,${706 + 0.8 * Math.sin(t * 9)} Z`} fill="#ffd27a" />
          <path d="M529,716 Q532,726 529,732 Q526,726 529,716 Z" fill="#fff6d8" />
          {/* lampu gantung diam */}
          <line x1={APEX[0]} y1={APEX[1] + 24} x2={APEX[0] + 2 * Math.sin(t * 0.8)} y2={500} stroke="#8fa0d0" strokeWidth={2} />
          <path d={`M${APEX[0] - 26 + 2 * Math.sin(t * 0.8)},516 L${APEX[0] + 26 + 2 * Math.sin(t * 0.8)},516 L${APEX[0] + 12 + 2 * Math.sin(t * 0.8)},500 L${APEX[0] - 12 + 2 * Math.sin(t * 0.8)},500 Z`} fill="#c9d2ee" />
          <Glow x={APEX[0]} y={526} r={60} color="gold" opacity={0.4} />
          {/* udara diam di dalam: debu bergerak sangat lambat */}
          {Array.from({length: 16}, (_, k) => (
            <circle key={k} cx={330 + rand(k * 3.1) * 580 + 6 * Math.sin(t * 0.3 + k)} cy={600 + rand(k * 5.7) * 220 + 5 * Math.cos(t * 0.25 + k)} r={1.5 + rand(k) * 1.5} fill="#cfd8f0" opacity={0.35 + 0.2 * Math.sin(t + k)} />
          ))}
          {/* dinding */}
          <rect x={WALL_L - 18} y={TOP} width={18} height={FLOOR - TOP} fill="#3a4677" stroke="#8fa0d0" strokeWidth={2} />
          <rect x={WALL_R} y={TOP} width={18} height={FLOOR - TOP} fill="#3a4677" stroke="#8fa0d0" strokeWidth={2} />
          <line x1={WALL_L - 18} y1={FLOOR} x2={WALL_R + 18} y2={FLOOR} stroke="#8fa0d0" strokeWidth={4} />

          {/* ======= atap (bergetar saat terangkat) ======= */}
          <g transform={`translate(0 ${roofDy.toFixed(2)}) rotate(${roofRot.toFixed(3)} ${APEX[0]} ${APEX[1]})`}>
            <path d={roofD} fill="none" stroke="#5a3428" strokeWidth={30} strokeLinejoin="round" strokeLinecap="round" />
            <path d={roofD} fill="none" stroke="#a3583f" strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" />
            <path d={roofD} fill="none" stroke="#5a3428" strokeWidth={22} strokeDasharray="3 26" strokeLinejoin="round" />
            <path d={roofD} fill="none" stroke={C.force} strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" opacity={0.25 * area + 0.15 * area * Math.sin(t * 4)} />
          </g>
          {/* celah atap–dinding saat terangkat */}
          <g opacity={lift}>
            {[WALL_L - 9, WALL_R + 9].map((x) => (
              <line key={x} x1={x - 14} y1={TOP - 3} x2={x + 14} y2={TOP - 3} stroke="#cfeaff" strokeWidth={2} opacity={0.4 + 0.4 * Math.sin(t * 17)} />
            ))}
          </g>
          {/* tali baja & baut */}
          {[WALL_L - 9, WALL_R + 9].map((x, i) => {
            const p = ramp(t, wordOf(5, 'diikat') - 0.2 + i * 0.25, wordOf(5, 'diikat') + 0.7 + i * 0.25, BACK);
            const turn = 360 * ramp(t, wordOf(5, 'diikat') + 0.2, wordOf(5, 'kuat') + 0.8, EASE_IN_OUT);
            return (
              <g key={x} opacity={Math.min(1, p)}>
                <rect x={x - 9} y={TOP - 40} width={18} height={96 * Math.min(1, p)} rx={3} fill="#9aa8c8" stroke="#e8ecf5" strokeWidth={1.5} />
                {[TOP - 26, TOP + 36].map((by) => (
                  <g key={by} transform={`rotate(${(turn + by).toFixed(1)} ${x} ${by})`}>
                    <circle cx={x} cy={by} r={7} fill="#e8ecf5" stroke="#3a4677" strokeWidth={1.5} />
                    <line x1={x - 5} y1={by} x2={x + 5} y2={by} stroke="#3a4677" strokeWidth={2} />
                  </g>
                ))}
                <Ripple x={x} y={TOP} p={(t - wordOf(5, 'kuat') - i * 0.25) / 1.2} r={70} color="work" rings={2} />
              </g>
            );
          })}
          {/* tali tambahan ke rangka dalam */}
          <g opacity={tie}>
            {[0.35, 0.7].map((u) =>
              [true, false].map((left) => {
                const [sx, sy] = onSlope(left, u);
                return <line key={`${u}-${left}`} x1={sx} y1={sy + 18} x2={left ? WALL_L + 40 : WALL_R - 40} y2={TOP + 30} stroke="#9aa8c8" strokeWidth={4} strokeDasharray="10 6" strokeDashoffset={(1 - tie) * 60} />;
              }),
            )}
          </g>

          {/* hujan (tidak masuk ke dalam rumah) */}
          <g clipPath="url(#rf-rain)" opacity={storm}>
            {Array.from({length: 48}, (_, k) => {
              const W = 1300;
              const Hh = 720;
              const x = ((((rand(k * 2.1) * W + t * 260) % W) + W) % W) + 20;
              const y = ((((rand(k * 4.7) * Hh + t * 820) % Hh) + Hh) % Hh) + 140;
              return <line key={k} x1={x} y1={y} x2={x + 10} y2={y + 30} stroke="#9fd0ff" strokeWidth={1.6} opacity={0.35} />;
            })}
          </g>
          {/* angin cepat di atas atap */}
          {lines.map((l, k) => (
            <Streamline key={k} pts={l.pts} gain={l.gain} speed={mix(120, 260, storm)} n={8} color={C.cyan} line={0.22} width={1.6} seed={k * 2.7} opacity={storm} />
          ))}
          <Label x={210} y={300} size={28} color={C.cyan} weight={600} opacity={ramp(t, 1.2, 2.2)}>
            angin kencang →
          </Label>
          <Label x={APEX[0]} y={600} size={26} color="#cfd8f0" opacity={ramp(t, tDiam - 0.4, tDiam + 0.4) * (1 - pr)}>
            udara di dalam hampir diam
          </Label>
          <Motes x={APEX[0]} y={420} rx={520} ry={200} n={22} color="cyan" opacity={0.3 * storm} seed={6} />

          {/* ======= tekanan ======= */}
          <g opacity={pr} transform={`translate(0 ${roofDy.toFixed(2)})`}>
            {[0.25, 0.55, 0.85].map((u) =>
              [true, false].map((left) => {
                const [sx, sy] = onSlope(left, u);
                const n = left ? NL : NR;
                return (
                  <g key={`${u}-${left}`}>
                    <PressureArrow x={sx + n[0] * 16} y={sy + n[1] * 16} nx={n[0]} ny={n[1]} L={30} width={4} />
                    <PressureArrow x={sx - n[0] * 16} y={sy - n[1] * 16} nx={-n[0]} ny={-n[1]} L={74} width={6} />
                  </g>
                );
              }),
            )}
          </g>
          <Label x={560} y={650} size={28} color={C.press} weight={600} opacity={pr}>
            p dalam (besar)
          </Label>
          <Label x={APEX[0] + 210} y={APEX[1] - 40} anchor="start" size={26} color={C.press} opacity={pr * ramp(t, tLow - 0.3, tLow + 0.4)}>
            p luar lebih rendah
          </Label>
          <g opacity={net}>
            <Glow x={APEX[0]} y={APEX[1] - 60} r={160} color="force" opacity={0.5} />
            <Arrow x1={APEX[0]} y1={APEX[1] - 20 + roofDy} x2={APEX[0]} y2={APEX[1] - 140 - 30 * res3 + roofDy} color="force" width={9} />
            <Label x={APEX[0] - 26} y={APEX[1] - 110} anchor="end" size={34} color={C.force} font="serif" italic>
              F
            </Label>
          </g>

          <Anemometer x={1085} y={430} t={t} op={vOp} spin={mix(6, 22, storm)} />
          <Label x={1085} y={866} size={22} color={C.muted} opacity={vOp}>
            anemometer
          </Label>
          <Label x={APEX[0] + 200} y={APEX[1] + 70} anchor="start" size={26} color={C.force} weight={600} opacity={area}>
            A = 100 m²
          </Label>
          <GhostTruck x={1490} y={760} op={ghost * (1 - 0.5 * tie)} t={t} />
          <g opacity={ghost * (1 - 0.5 * tie)}>
            <Arrow x1={1430} y1={790} x2={1430} y2={860} color="force" width={6} pulse={false} />
          </g>
          <Twinkles x={1490} y={card3Y + 40} rx={260} ry={60} n={5} color="gold" opacity={res3} seed={8} />
          <Ripple x={1490} y={card3Y} p={(t - wordOf(4, 'newton')) / 1.4} r={320} color="force" rings={2} />
          <Ripple x={1490} y={420} p={(t - wordOf(3, 'lima')) / 1.4} r={300} color="press" rings={2} />
        </g>
      </Stage>

      <Note x={1490} y={235} p={vOp * (1 - ramp(t, cue(5) - 0.3, cue(5) + 0.4, EASE_IN_OUT))} color={C.cyan} size={34}>
        <span style={{color: C.cyan}}>v = 30 m/s</span>
        <Part p={kmOp}>
          <span style={{color: C.muted}}> ≈ 108 km/jam</span>
        </Part>
      </Note>
      <Formula x={1490} y={420} p={f1} accent={C.press} size={68} caption="beda tekanan dalam–luar">
        Δ<V color={C.press}>p</V> ={' '}
        <span style={{color: C.kin}}>
          <Frac n="1" d="2" />
          <V>ρv</V>
          <Sup>2</Sup>
        </span>
      </Formula>
      <Formula x={1500} y={440} p={f2} accent={C.press} size={60} caption="ρ udara ≈ 1,2 kg/m³">
        Δ<V color={C.press}>p</V> = <Frac n="1" d="2" /> · 1,2 · 30<Sup>2</Sup>
        <br />
        <Part p={res2}>
          = <b style={{color: C.press}}>540 Pa</b>
        </Part>
      </Formula>
      <Formula x={1490} y={card3Y} p={f3} accent={C.force} size={58} caption="gaya total ke atas pada atap">
        <V color={C.force}>F</V> = Δ<V color={C.press}>p</V> · <V>A</V> = 540 · 100
        <br />
        <Part p={res3}>
          = <b style={{color: C.force}}>54 000 N</b>
        </Part>
      </Formula>
      <Note x={1490} y={600} p={ghost * (1 - ramp(t, cue(5) - 0.3, cue(5) + 0.4, EASE_IN_OUT))} color={C.force} size={30}>
        ≈ berat <span style={{color: C.force}}>5,4 ton</span>
      </Note>
      <Note x={1490} y={235} p={tie} color={C.work} size={32}>
        <span style={{color: C.work}}>✓</span> atap <span style={{color: C.work}}>diikat kuat</span> ke dinding
      </Note>
    </AbsoluteFill>
  );
};
