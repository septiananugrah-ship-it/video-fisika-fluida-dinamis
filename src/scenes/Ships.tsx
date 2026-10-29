import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN, EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Streamline} from '../components/flow';
import {PressureArrow} from '../components/fluid';
import {Person} from '../components/physics';
import {Arrow, Glow, Label, Motes, Note, Ripple, Spark, Stage, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kapal berpapasan (tampak atas, kerangka kapal: air mengalir mundur):
//  F1 (baris 0–2): garis arus merapat & lebih cepat di celah → tekanan rendah; air luar mendorong kedua kapal mendekat.
//  F2 (baris 3): Olympic & HMS Hawke, 20 Sept 1911 — Hawke tertarik lalu menabrak lambung kanan-belakang Olympic (skematis).
//  F3 (baris 4): peron kereta — udara cepat di dekat kereta bertekanan rendah → berdiri di belakang garis kuning.

const SEA = '#0a2a52';

/** Lambung kapal tampak atas; (x, y) = pusat, haluan ke kanan. */
const Ship: React.FC<{
  x: number;
  y: number;
  L: number;
  B: number;
  rot?: number;
  funnels?: number;
  hull?: string;
  deck?: string;
  funnel?: string;
  t: number;
  op?: number;
  ram?: boolean;
  seed?: number;
  wake?: number;
}> = ({x, y, L, B, rot = 0, funnels = 2, hull = '#2a3358', deck = '#c8b48a', funnel = '#e0a54a', t, op = 1, ram, seed = 0, wake = 1}) => {
  if (op <= 0.001) return null;
  const h = L / 2;
  const b = B / 2;
  const hullD = ram
    ? `M${-h},${-b * 0.8} Q${-h},${-b} ${-h + b},${-b} L${h * 0.55},${-b} Q${h * 0.92},${-b * 0.7} ${h},0 Q${h * 0.92},${b * 0.7} ${h * 0.55},${b} L${-h + b},${b} Q${-h},${b} ${-h},${b * 0.8} Z`
    : `M${-h + 10},${-b * 0.9} Q${-h},${-b * 0.5} ${-h},0 Q${-h},${b * 0.5} ${-h + 10},${b * 0.9} Q${-h + 30},${b} ${-h + 60},${b} L${h * 0.5},${b} Q${h * 0.88},${b * 0.85} ${h},0 Q${h * 0.88},${-b * 0.85} ${h * 0.5},${-b} L${-h + 60},${-b} Q${-h + 30},${-b} ${-h + 10},${-b * 0.9} Z`;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})`} opacity={op}>
      {/* buritan: buih jejak */}
      <g opacity={wake}>
        {Array.from({length: 14}, (_, k) => {
          const ph = (((t * 0.7 + k / 14 + seed) % 1) + 1) % 1;
          const xx = -h - ph * 420;
          const spread = 10 + ph * 70;
          return (
            <g key={k} opacity={cyc(ph) * 0.7}>
              <circle cx={xx} cy={spread * Math.sin(k * 2.1)} r={4 + 8 * ph} fill="none" stroke="#dff3ff" strokeWidth={1.5} />
              <circle cx={xx - 20} cy={-spread * 0.6 * Math.cos(k * 1.3)} r={2 + 4 * ph} fill="#dff3ff" opacity={0.5} />
            </g>
          );
        })}
        {/* gelombang haluan (V) */}
        {[0, 1, 2].map((k) => {
          const ph = (((t * 0.9 + k / 3 + seed) % 1) + 1) % 1;
          const d = 30 + ph * 260;
          return (
            <path
              key={k}
              d={`M${h - d},${-b - d * 0.38} Q${h - d * 0.4},${-b * 0.6} ${h + 4},0 Q${h - d * 0.4},${b * 0.6} ${h - d},${b + d * 0.38}`}
              fill="none"
              stroke="#dff3ff"
              strokeWidth={2.2}
              opacity={cyc(ph) * 0.55}
            />
          );
        })}
      </g>
      <ellipse cx={0} cy={6} rx={h * 1.02} ry={b * 1.2} fill="#000" opacity={0.25} />
      <path d={hullD} fill={hull} stroke="#9fb0e0" strokeWidth={3} />
      <path d={hullD} fill={deck} opacity={0.88} transform={`scale(0.9 0.74)`} />
      {/* bangunan atas */}
      <rect x={-h * 0.55} y={-b * 0.45} width={h * 1.05} height={b * 0.9} rx={8} fill="#eef0f6" opacity={0.9} />
      {Array.from({length: funnels}, (_, k) => {
        const fx = -h * 0.42 + ((k + 0.5) / funnels) * h * 0.85;
        return (
          <g key={k}>
            <ellipse cx={fx} cy={0} rx={B * 0.17} ry={B * 0.2} fill={funnel} stroke="#1a1a22" strokeWidth={3} />
            <ellipse cx={fx} cy={0} rx={B * 0.09} ry={B * 0.11} fill="#1a1a22" />
            {/* asap mengalir ke belakang */}
            {[0, 1, 2].map((j) => {
              const ph = (((t * 0.5 + j / 3 + k * 0.21 + seed) % 1) + 1) % 1;
              return <circle key={j} cx={fx - ph * 160} cy={-ph * 30 + 6 * Math.sin(t * 2 + j)} r={B * 0.08 + ph * B * 0.22} fill="#c9d2ee" opacity={cyc(ph) * 0.35} />;
            })}
          </g>
        );
      })}
      <line x1={-h * 0.5} y1={0} x2={h * 0.45} y2={0} stroke="#000" strokeOpacity={0.15} strokeWidth={2} />
    </g>
  );
};

/** Riak permukaan laut yang hanyut ke kiri (kapal bergerak ke kanan). */
const Sea: React.FC<{t: number; op: number; speed?: number}> = ({t, op, speed = 110}) => {
  if (op <= 0.001) return null;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id="sh-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SEA} stopOpacity={0} />
          <stop offset="12%" stopColor={SEA} stopOpacity={0.6} />
          <stop offset="88%" stopColor={SEA} stopOpacity={0.6} />
          <stop offset="100%" stopColor={SEA} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={150} width={1920} height={770} fill="url(#sh-sea)" />
      {Array.from({length: 46}, (_, k) => {
        const span = 2100;
        const x = ((((rand(k * 3.3) * span - t * speed * (0.7 + 0.5 * rand(k))) % span) + span) % span) - 90;
        const y = 180 + rand(k * 7.1) * 700;
        const ph = (((t * 0.25 + rand(k * 1.9)) % 1) + 1) % 1;
        return <path key={k} d={`M${x},${y} q14,-7 28,0 t28,0`} fill="none" stroke="#9fd0ff" strokeWidth={1.8} opacity={0.12 + 0.18 * cyc(ph)} />;
      })}
    </g>
  );
};

/** Garis arus di sekitar dua lambung (kerangka kapal): air mengalir dari kanan ke kiri. */
const flowLine = (yUp: number, yIn: number, x0: number, x1: number, n = 40): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const x = 1900 - (1860 * i) / n;
    const s = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x < (x0 + x1) / 2 ? (x - x0 + 140) / 140 : (x1 + 140 - x) / 140)));
    return [x, mix(yUp, yIn, s)];
  });
const gainLine = (pts: [number, number][], x0: number, x1: number, g: number) =>
  pts.map(([x]) => {
    const s = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x < (x0 + x1) / 2 ? (x - x0 + 140) / 140 : (x1 + 140 - x) / 140)));
    return 1 + (g - 1) * s;
  });

/** Kereta cepat tampak samping; xNose = ujung depan (bergerak ke kiri). */
const Train: React.FC<{xNose: number; y: number; t: number; cars?: number}> = ({xNose, y, t, cars = 5}) => {
  const CAR = 560;
  const H = 150;
  const total = CAR * cars;
  if (xNose > 2000 || xNose + total < -100) return null;
  return (
    <g>
      <ellipse cx={xNose + total / 2} cy={y + H + 18} rx={total / 2} ry={10} fill="#000" opacity={0.35} />
      {Array.from({length: cars}, (_, k) => {
        const cx = xNose + k * CAR;
        if (cx > 2000 || cx + CAR < -100) return null;
        const first = k === 0;
        const body = first
          ? `M${cx + CAR},${y} L${cx + 220},${y} Q${cx + 40},${y + 10} ${cx},${y + H * 0.82} Q${cx + 4},${y + H} ${cx + 30},${y + H} L${cx + CAR},${y + H} Z`
          : `M${cx + 6},${y} L${cx + CAR - 6},${y} L${cx + CAR - 6},${y + H} L${cx + 6},${y + H} Z`;
        return (
          <g key={k}>
            <path d={body} fill="#e8ecf5" stroke="#9fb0e0" strokeWidth={2.5} />
            <rect x={cx + (first ? 90 : 6)} y={y + H * 0.62} width={CAR - (first ? 90 : 12)} height={14} fill={C.cyan} opacity={0.85} />
            {first ? <path d={`M${cx + 70},${y + 40} Q${cx + 120},${y + 14} ${cx + 210},${y + 14} L${cx + 210},${y + 56} L${cx + 56},${y + 56} Z`} fill="#1a2550" /> : null}
            {Array.from({length: 6}, (_, w) => {
              const wx = cx + (first ? 250 : 40) + w * 82;
              return wx + 56 < cx + CAR ? <rect key={w} x={wx} y={y + 30} width={56} height={34} rx={6} fill="#1a2550" /> : null;
            })}
            {[0.18, 0.82].map((f) => (
              <g key={f}>
                <rect x={cx + CAR * f - 50} y={y + H} width={100} height={16} rx={6} fill="#3a4677" />
                {[-28, 28].map((d) => (
                  <circle key={d} cx={cx + CAR * f + d} cy={y + H + 20} r={12} fill="#2a3358" stroke="#8fa0d0" strokeWidth={2} strokeDasharray="6 5" strokeDashoffset={t * 200} />
                ))}
              </g>
            ))}
          </g>
        );
      })}
      {/* garis gerak */}
      {Array.from({length: 8}, (_, k) => {
        const yy = y + 12 + k * 18;
        const ph = (((t * 2.2 + rand(k) ) % 1) + 1) % 1;
        const xx = xNose + total + 40 + ph * 260;
        return <line key={k} x1={xx} y1={yy} x2={xx + 120} y2={yy} stroke="#dff3ff" strokeWidth={2} opacity={cyc(ph) * 0.4} />;
      })}
    </g>
  );
};

export const Ships: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.4, 1.0);
  const p1 = appear * (1 - ramp(t, cue(3) - 0.5, cue(3) + 0.4, EASE_IN_OUT));
  const p2 = ramp(t, cue(3) - 0.2, cue(3) + 0.7) * (1 - ramp(t, cue(4) - 0.5, cue(4) + 0.3, EASE_IN_OUT));
  const p3 = ramp(t, cue(4) - 0.2, cue(4) + 0.6);

  /* ---------- F1 ---------- */
  const drift = 26 * ramp(t, wordOf(0, 'tertarik') - 0.5, cue(3), EASE_IN_OUT);
  const yA = 400 + drift + 3 * Math.sin(t * 1.1);
  const yB = 680 - drift + 3 * Math.sin(t * 1.1 + 1.7);
  const HX0 = 490;
  const HX1 = 1310;
  const sl = ramp(t, cue(1) - 0.3, cue(1) + 0.8);
  const tFast = wordOf(1, 'cepat');
  const fast = ramp(t, tFast - 0.5, tFast + 0.6, EASE_IN_OUT);
  const tLow = wordOf(1, 'tekanannya');
  const low = ramp(t, tLow - 0.3, tLow + 0.6);
  const push = ramp(t, cue(2) - 0.1, cue(2) + 0.8);
  const tDor = wordOf(2, 'mendorong');
  const net = ramp(t, tDor - 0.3, tDor + 0.5);
  const gapC = (yA + yB) / 2;
  const gapLines = [-2, -1, 0, 1, 2].map((k) => flowLine(gapC + k * 38, gapC + k * 17, HX0, HX1));
  const outerA = [yA - 110, yA - 165, yA - 220].map((y, i) => flowLine(y, y - 14 + i * 4, HX0, HX1));
  const outerB = [yB + 110, yB + 160].map((y, i) => flowLine(y, y + 14 - i * 4, HX0, HX1));

  /* ---------- F2: Olympic & Hawke ---------- */
  const tHit = wordOf(3, 'menabrak') + 0.15;
  const pull = ramp(t, cue(3) + 0.6, tHit, EASE_IN);
  const hx = mix(360, 393, pull);
  const hy = mix(780, 565, pull);
  const hrot = mix(0, -18, ramp(t, cue(3) + 0.6, tHit, EASE_IN_OUT));
  const after = Math.max(0, t - tHit);
  const recoil = after > 0 ? 6 * Math.exp(-3 * after) * Math.sin(after * 14) : 0;
  const hitOp = ramp(t, tHit - 0.05, tHit + 0.1);

  /* ---------- F3: kereta ---------- */
  const tNose = cue(4) + 0.4;
  const xNose = 2000 - (t - tNose) * 820;
  const trainOn = ramp(-xNose, -1980, -1700) * ramp(xNose + 7 * 560, 0, 300);
  const tLine = wordOf(4, 'kuning');
  const lineHi = ramp(t, tLine - 0.4, tLine + 0.4);

  return (
    <AbsoluteFill>
      <Stage>
        <Sea t={t} op={Math.max(p1, p2) * 0.9} />

        {/* ======= F1 ======= */}
        {p1 > 0.001 ? (
          <g opacity={p1}>
            {/* zona tekanan rendah di celah */}
            <rect x={HX0} y={yA + 62} width={HX1 - HX0} height={yB - yA - 124} rx={30} fill={C.press} opacity={0.1 * low + 0.06 * low * Math.sin(t * 2.4)} />
            <g opacity={sl}>
              {outerA.map((pts, i) => (
                <Streamline key={`a${i}`} pts={pts} speed={130} n={7} color="#cfeaff" line={0.18} seed={i * 3} />
              ))}
              {outerB.map((pts, i) => (
                <Streamline key={`b${i}`} pts={pts} speed={130} n={7} color="#cfeaff" line={0.18} seed={10 + i * 3} />
              ))}
              {gapLines.map((pts, i) => (
                <Streamline key={`g${i}`} pts={pts} gain={gainLine(pts, HX0, HX1, mix(1, 2.2, fast))} speed={130} n={9} color={C.cyan} line={0.3} seed={20 + i * 2.3} width={1.8} />
              ))}
            </g>
            <Ship x={900} y={yA} L={820} B={120} funnels={3} t={t} hull="#26305a" deck="#b9a57e" seed={0.1} />
            <Ship x={900} y={yB} L={820} B={120} funnels={2} t={t} hull="#2f2a4a" deck="#a9b7c9" funnel="#d85a5a" seed={0.5} />
            {/* label kecepatan & tekanan */}
            <Label x={1560} y={gapC} size={28} color={C.cyan} weight={600} opacity={fast * sl}>
              v besar
            </Label>
            <Label x={1560} y={yA - 165} size={26} color="#cfeaff" opacity={fast * sl}>
              v kecil
            </Label>
            <Label x={1560} y={yB + 135} size={26} color="#cfeaff" opacity={fast * sl}>
              v kecil
            </Label>
            <Label x={1010} y={gapC} size={30} color={C.press} weight={700} opacity={low}>
              p rendah
            </Label>
            <Label x={300} y={yA - 150} size={26} color={C.press} opacity={push}>
              p tinggi
            </Label>
            <Label x={300} y={yB + 140} size={26} color={C.press} opacity={push}>
              p tinggi
            </Label>
            {/* panah tekanan: luar besar, dalam kecil */}
            <g opacity={push}>
              {[620, 760, 900, 1040, 1180].map((x) => (
                <g key={x}>
                  <PressureArrow x={x} y={yA - 62} nx={0} ny={-1} L={64} width={5} />
                  <PressureArrow x={x} y={yB + 62} nx={0} ny={1} L={64} width={5} />
                  <PressureArrow x={x + 70} y={yA + 62} nx={0} ny={1} L={22} width={3} />
                  <PressureArrow x={x + 70} y={yB - 62} nx={0} ny={-1} L={22} width={3} />
                </g>
              ))}
            </g>
            <g opacity={net}>
              <Arrow x1={650} y1={yA - 20} x2={650} y2={yA + 70} color="force" width={7} />
              <Arrow x1={650} y1={yB + 20} x2={650} y2={yB - 70} color="force" width={7} />
              <Label x={610} y={yA + 30} anchor="end" size={30} color={C.force} font="serif" italic>
                F
              </Label>
              <Label x={610} y={yB - 30} anchor="end" size={30} color={C.force} font="serif" italic>
                F
              </Label>
              <Glow x={650} y={gapC} r={200} color="force" opacity={0.35} />
            </g>
            <Ripple x={900} y={gapC} p={(t - tLow) / 1.4} r={260} color="press" rings={2} />
          </g>
        ) : null}

        {/* ======= F2: Olympic & Hawke ======= */}
        {p2 > 0.001 ? (
          <g opacity={p2}>
            <Motes x={800} y={540} rx={700} ry={280} n={22} color="cyan" opacity={0.3} seed={7} />
            {/* air terhisap ke celah */}
            <g opacity={0.6 - hitOp * 0.4}>
              {[0, 1, 2].map((k) => (
                <Streamline
                  key={k}
                  pts={flowLine(mix(560, 520, k / 2) + (hy - 565) * 0.5, mix(520, 505, k / 2) + (hy - 565) * 0.3, 380, 1100)}
                  gain={gainLine(flowLine(560, 520, 380, 1100), 380, 1100, 2)}
                  speed={130}
                  n={8}
                  color={C.cyan}
                  line={0.25}
                  seed={k * 4}
                />
              ))}
            </g>
            <Ship x={900} y={430} L={1000} B={110} funnels={4} t={t} hull="#1c1c28" deck="#c8b48a" funnel="#e0a54a" seed={0.2} />
            <Ship x={hx + recoil * 0.3} y={hy + recoil} rot={hrot} L={520} B={70} funnels={2} t={t} hull="#4a5068" deck="#8a93a8" funnel="#6a7088" ram seed={0.7} />
            {/* tumbukan */}
            <g opacity={hitOp}>
              <Ripple x={640} y={488} p={(t - tHit) / 1.3} r={200} color="force" rings={3} />
              <path d="M612,486 l10,-14 l8,10 l10,-16 l8,14 l10,-8 l6,14" fill="none" stroke={C.heat} strokeWidth={4} strokeLinejoin="round" />
              {Array.from({length: 7}, (_, k) => {
                const q = Math.min(1, after * 1.6 + 0.05);
                const a = -Math.PI * (0.15 + (0.7 * k) / 6);
                return <Spark key={k} x={640 + Math.cos(a) * 90 * q} y={488 + Math.sin(a) * 90 * q * 0.8} r={4} color="force" opacity={(1 - q) * 0.9} />;
              })}
            </g>
            <Label x={1000} y={318} size={28} color="#e0a54a" weight={600}>
              RMS Olympic
            </Label>
            <Label x={1000} y={350} size={22} color={C.muted}>
              kapal kembar Titanic
            </Label>
            <Label x={hx} y={Math.min(860, hy + 80)} size={26} color="#b8c0d8" weight={600}>
              HMS Hawke
            </Label>
            <g opacity={ramp(t, cue(3) + 1, cue(3) + 2) * (1 - hitOp)}>
              <Arrow x1={hx + 120} y1={hy + 10} x2={hx + 160} y2={hy - 60} color="force" width={5} pulse={false} />
            </g>
            <Label x={1660} y={830} size={20} color={C.faint}>
              skematis, bukan skala
            </Label>
          </g>
        ) : null}

        {/* ======= F3: peron kereta ======= */}
        {p3 > 0.001 ? (
          <g opacity={p3}>
            {/* atap peron & tiang */}
            <rect x={0} y={196} width={1920} height={26} fill="#26315c" stroke="#6f7fb8" strokeWidth={2} />
            {Array.from({length: 12}, (_, k) => (
              <rect key={k} x={60 + k * 160} y={222} width={60} height={10} fill={C.gold} opacity={0.25 + 0.15 * Math.sin(t * 2 + k)} />
            ))}
            <rect x={640} y={250} width={190} height={56} rx={8} fill="#1a2550" stroke="#8fa0d0" strokeWidth={2} />
            <text x={735} y={279} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={28} fill={C.ink}>
              PERON 2
            </text>
            <line x1={690} y1={222} x2={690} y2={250} stroke="#8fa0d0" strokeWidth={3} />
            <line x1={780} y1={222} x2={780} y2={250} stroke="#8fa0d0" strokeWidth={3} />
            {/* rel */}
            <rect x={0} y={566} width={1920} height={36} fill="#141a33" />
            <line x1={0} y1={578} x2={1920} y2={578} stroke="#8fa0d0" strokeWidth={4} />
            <line x1={0} y1={594} x2={1920} y2={594} stroke="#8fa0d0" strokeWidth={3} opacity={0.6} />
            {Array.from({length: 28}, (_, k) => (
              <rect key={k} x={k * 70} y={582} width={30} height={9} fill="#3a4677" />
            ))}
            {/* peron (perspektif): tepi → zona bahaya → garis kuning → zona aman */}
            <path d="M0,604 L1920,604 L1920,880 L0,880 Z" fill="#1d2650" />
            <path d="M0,604 L1920,604 L1920,620 L0,620 Z" fill="#3a4677" />
            <rect x={0} y={620} width={1920} height={44} fill={C.heat} opacity={0.06 + 0.06 * lineHi} />
            {Array.from({length: 24}, (_, k) => (
              <line key={k} x1={k * 90} y1={620} x2={k * 90 - 60} y2={880} stroke="#2a3566" strokeWidth={2} />
            ))}
            <rect x={0} y={664} width={1920} height={14} fill={C.force} opacity={0.75 + 0.25 * lineHi * (0.5 + 0.5 * Math.sin(t * 6))} />
            <Glow x={420} y={672} r={300} color="force" opacity={0.4 * lineHi} still />
            <Train xNose={xNose} y={404} t={t} cars={7} />
            {[300, 1960].map((x) => (
              <g key={x}>
                <rect x={x - 16} y={222} width={32} height={658} fill="#2a3566" stroke="#6f7fb8" strokeWidth={2} />
                <rect x={x - 10} y={222} width={6} height={658} fill="#fff" opacity={0.08} />
              </g>
            ))}
            {/* aliran udara cepat di sela kereta-peron */}
            <g opacity={trainOn}>
              {[548, 566, 610, 632].map((y, i) => (
                <Streamline
                  key={i}
                  pts={[
                    [1900, y + 6],
                    [1400, y],
                    [900, y],
                    [400, y],
                    [20, y + 6],
                  ]}
                  speed={760 - i * 90}
                  n={8}
                  color={C.cyan}
                  line={0.15}
                  seed={i * 3}
                />
              ))}
            </g>
            {/* orang aman di belakang garis kuning */}
            <Person x={1500} y={820} scale={0.9} color={C.ink} />
            <Person x={1620} y={846} scale={0.95} color={C.ink} phase={0.4} />
            <Person x={1390} y={790} scale={0.85} color={C.ink} phase={-0.3} />
            {/* orang terlalu dekat: terdorong ke arah kereta saat kereta lewat */}
            {(() => {
              const lean = trainOn * (0.5 + 0.5 * Math.sin(t * 7));
              return (
                <g>
                  <g transform={`rotate(${(-6 * lean).toFixed(2)} 780 652)`}>
                    <Person x={780} y={652} scale={0.8} color={C.heat} arm={-40} />
                  </g>
                  <g opacity={trainOn}>
                    <Arrow x1={850} y1={760} x2={850} y2={640} color="press" width={6} />
                    <Label x={880} y={724} anchor="start" size={24} color={C.press}>
                      tekanan di belakang lebih besar
                    </Label>
                  </g>
                </g>
              );
            })()}
            <Label x={520} y={706} size={24} color={C.force} weight={600} opacity={lineHi}>
              garis kuning
            </Label>
            <Label x={1760} y={642} size={22} color={C.heat} opacity={0.8}>
              zona bahaya
            </Label>
            <Twinkles x={1510} y={760} rx={180} ry={70} n={4} color="force" opacity={lineHi} seed={3} />
          </g>
        ) : null}
      </Stage>

      <Note x={960} y={215} p={p2 * ramp(t, cue(3) + 0.1, cue(3) + 0.8)} color={C.force} size={30}>
        RMS Olympic &amp; HMS Hawke · 20 September 1911
      </Note>
      <Note x={1420} y={300} p={p3 * lineHi} color={C.force} size={30}>
        berdiri di <span style={{color: C.force}}>belakang garis kuning</span>
      </Note>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 200,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 40,
          fontWeight: 700,
          color: C.ink,
          opacity: p1 * ramp(t, wordOf(0, 'tertarik') - 0.3, wordOf(0, 'tertarik') + 0.5) * (1 - ramp(t, cue(1) - 0.2, cue(1) + 0.4, EASE_IN_OUT)),
        }}
      >
        terlalu dekat → <span style={{color: C.force}}>saling tertarik</span>
      </div>
    </AbsoluteFill>
  );
};
