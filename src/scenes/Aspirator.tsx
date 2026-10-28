import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Streamline} from '../components/flow';
import {PressureArrow, Water} from '../components/fluid';
import {Card, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sub, Tint, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pompa vakum air (aspirator) di meja lab: keran → nosel sempit (pancaran cepat, p rendah) → udara dari
// lengan samping terseret air → selang → labu penyaring + corong Büchner. Tekanan labu turun (manometer),
// udara luar mendorong cairan menembus kertas saring (tetesan makin cepat). Batas ≈ tekanan uap air
// 2,3 kPa pada 20 °C (AUDIT); air lebih dingin → tekanan uap lebih rendah → vakum lebih baik (kualitatif).

const AX = 330; // sumbu aspirator
const ARM_Y = 450;
const FX = 1060; // sumbu labu
const FLASK_BASE = 856;
const STEM_TIP = 650;

const bez = (p0: number[], p1: number[], p2: number[], p3: number[], n: number) =>
  Array.from({length: n + 1}, (_, i) => {
    const u = i / n;
    const a = (1 - u) ** 3;
    const b = 3 * (1 - u) ** 2 * u;
    const c = 3 * (1 - u) * u * u;
    const d = u ** 3;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as [number, number];
  });
const HOSE: [number, number][] = [...bez([440, ARM_Y], [600, ARM_Y], [600, 700], [740, 700], 20), ...bez([740, 700], [860, 700], [880, 596], [946, 596], 16).slice(1)];
const HOSE_D = HOSE.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const HOSE_REV = [...HOSE].reverse();

// jalur air di dalam aspirator (lajur menyempit di nosel, lalu jatuh ke bak cuci)
const jetLane = (f: number): [number, number][] => [
  [AX + f * 13, 214],
  [AX + f * 13, 330],
  [AX + f * 3.5, 420],
  [AX + f * 5, 480],
  [AX + f * 10, 650],
  [AX + f * 12, 780],
];
const JET_GAIN = [1, 1, 3.6, 3.0, 2.0, 2.6];
const BUB_PATH: [number, number][] = [
  [442, ARM_Y],
  [372, ARM_Y],
  [346, ARM_Y + 14],
  [336, 520],
  [333, 650],
  [334, 780],
];

const pFlask = (t: number, ts: number) => (t < ts ? 100 : 2.3 + 97.7 * Math.exp(-(t - ts) / 3));
const fmtK = (p: number) => (p >= 9.95 ? `${Math.round(p)}` : p.toFixed(1).replace('.', ','));

export const Aspirator: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const sIn = ramp(t, -0.2, 1.0);
  const lblB = ramp(t, wordOf(0, 'Büchner') - 0.3, wordOf(0, 'Büchner') + 0.5);
  const lblA = ramp(t, wordOf(1, 'pompa') - 0.3, wordOf(1, 'pompa') + 0.5);
  const lblOut = 1 - ramp(t, cue(2) - 0.6, cue(2), EASE_IN_OUT);
  const zIn = ramp(t, cue(2) - 0.4, cue(2) + 1.0, EASE_IN_OUT);
  const tLabu = wordOf(3, 'labu');
  const zOut = ramp(t, tLabu - 0.3, tLabu + 1.1, EASE_IN_OUT);
  const z = zIn * (1 - zOut);
  const nozzleLbl = ramp(t, wordOf(2, 'nosel') - 0.2, wordOf(2, 'nosel') + 0.5);
  const fastLbl = ramp(t, wordOf(2, 'cepat') - 0.3, wordOf(2, 'cepat') + 0.5);
  const lowLbl = ramp(t, wordOf(3, 'rendah') - 0.3, wordOf(3, 'rendah') + 0.5);
  const ts = wordOf(3, 'tersedot') - 0.3;
  const suck = ramp(t, ts, ts + 0.8);
  const p = pFlask(t, ts);
  const pushA = ramp(t, wordOf(4, 'udara') - 0.3, wordOf(4, 'udara') + 0.6);
  const lim = ramp(t, wordOf(5, 'tekanan') - 0.3, wordOf(5, 'tekanan') + 0.6);
  const boil = ramp(t, cue(5) + 1.0, cue(5) + 2.5);
  const cold = ramp(t, wordOf(6, 'dingin') - 0.6, wordOf(6, 'dingin') + 1.4, EASE_IN_OUT);
  const plotIn = ramp(t, cue(6) - 0.2, cue(6) + 0.7);
  const tankLit = ramp(t, cue(4) + 0.4, cue(4) + 1.4);

  // tetesan: fase ∝ ∫ laju, laju naik saat tekanan labu turun
  const tau = Math.max(0, t - ts);
  const dripPhase = 0.45 * t + 2.6 * 0.977 * (tau - 3 * (1 - Math.exp(-tau / 3)));
  const filtrate = Math.min(120, 14 + dripPhase * 2.2);
  const slurry = Math.max(16, 74 - dripPhase * 1.0);

  // zum
  const s = 1 + 1.0 * z;
  const cx = AX;
  const cy = ARM_Y + 20;
  const tgx = cx + z * (1150 - cx);
  const tgy = cy + z * (480 - cy);
  const Tx = tgx - s * cx;
  const Ty = tgy - s * cy;
  const Z = (x: number, y: number): [number, number] => [Tx + s * x, Ty + s * y];

  const SLURRY_TOP = 488 - slurry;

  const bench = (
    <g>
      {/* dinding & meja */}
      <rect x={60} y={840} width={1240} height={22} rx={6} fill="#24325e" />
      <line x1={60} y1={840} x2={1300} y2={840} stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
      {/* bak cuci */}
      <path d="M200,770 L480,770 L455,840 L225,840 Z" fill="#16224a" stroke="#9fb0d8" strokeWidth={4} strokeLinejoin="round" />
      <Water x={232} y={806} w={216} h={28} amp={3} seed={3} caustics={false} />
      {Array.from({length: 7}, (_, k) => {
        const ph = (((t * 2.4 + k / 7) % 1) + 1) % 1;
        const dir = k % 2 ? 1 : -1;
        return <circle key={k} cx={AX + dir * ph * (26 + 7 * k)} cy={800 - Math.sin(ph * Math.PI) * (20 + 4 * k)} r={2.6} fill="#cfeaff" opacity={0.8 * cyc(ph)} />;
      })}
      {/* keran */}
      <rect x={60} y={194} width={290} height={24} rx={8} fill="#9fb0d8" />
      <rect x={AX - 18} y={190} width={36} height={40} rx={8} fill="#b9c6e8" />
      <rect x={AX - 50} y={166} width={100} height={14} rx={7} fill="#c9d4f0" />
      <rect x={AX - 6} y={176} width={12} height={18} fill="#c9d4f0" />
      {/* badan aspirator */}
      <path
        d={`M${AX - 24},228 L${AX - 24},330 L${AX - 40},350 L${AX - 40},500 L${AX - 22},520 L${AX - 22},660 L${AX + 22},660 L${AX + 22},520 L${AX + 40},500 L${AX + 40},${ARM_Y + 16} L${AX + 112},${ARM_Y + 16} L${AX + 112},${ARM_Y - 16} L${AX + 40},${ARM_Y - 16} L${AX + 40},350 L${AX + 24},330 L${AX + 24},228 Z`}
        fill="#2a3a6e"
        fillOpacity={0.55}
        stroke="#cfe3ff"
        strokeOpacity={0.85}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* saluran dalam: masuk → nosel menyempit → ruang hisap → ekor */}
      <path
        d={`M${AX - 15},228 L${AX - 15},330 L${AX - 4},420 L${AX - 28},420 L${AX - 28},490 L${AX - 9},500 L${AX - 13},660 L${AX + 13},660 L${AX + 9},500 L${AX + 28},490 L${AX + 28},${ARM_Y + 8} L${AX + 112},${ARM_Y + 8} L${AX + 112},${ARM_Y - 8} L${AX + 28},${ARM_Y - 8} L${AX + 28},420 L${AX + 4},420 L${AX + 15},330 L${AX + 15},228 Z`}
        fill="#0b1636"
        stroke="#9fc2ee"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      <path d={`M${AX - 15},228 L${AX - 15},330 L${AX - 4},420 L${AX + 4},420 L${AX + 15},330 L${AX + 15},228 Z`} fill={C.water} opacity={0.55} />
      <path d={`M${AX - 5},420 L${AX - 9},500 L${AX - 13},660 L${AX + 13},660 L${AX + 9},500 L${AX + 5},420 Z`} fill={C.water} opacity={0.45} />
      {/* pancaran bertekanan rendah: pendar merah muda samar di ruang hisap */}
      <ellipse cx={AX} cy={460} rx={34} ry={44} fill="url(#soft-press)" opacity={0.25 + 0.35 * lowLbl} />
      {/* air keluar ke bak */}
      <path d={`M${AX - 10},660 L${AX - 12},790 L${AX + 12},790 L${AX + 10},660 Z`} fill={C.water} opacity={0.5} />
      {[-0.6, 0, 0.6].map((f, i) => (
        <Streamline key={i} pts={jetLane(f)} gain={JET_GAIN} speed={150} n={8} seed={i * 2.7} line={0.1} color="#eaf8ff" />
      ))}
      {/* gelembung udara yang tersedot & terbawa */}
      <g opacity={suck}>
        {Array.from({length: 12}, (_, k) => {
          const ph = (((t * 0.55 + k / 12) % 1) + 1) % 1;
          const u = ph < 0.3 ? ph * 0.9 : 0.27 + (ph - 0.3) * (0.73 / 0.7);
          const [bx, by] = pointAlong(BUB_PATH, u);
          const wob = ph > 0.3 ? 4 * Math.sin(t * 9 + k) : 0;
          const r = 3.2 + 1.6 * rand(k * 3.1);
          return <circle key={k} cx={bx + wob} cy={by} r={r} fill="#ffffff" fillOpacity={0.25} stroke="#ffffff" strokeOpacity={0.9} strokeWidth={1.4} opacity={cyc(ph) * 1.1} />;
        })}
      </g>
      {/* gelembung uap saat mendekati batas (air "mendidih" pada tekanan rendah) */}
      <g opacity={boil}>
        {Array.from({length: 6}, (_, k) => {
          const ph = (((t * 1.4 + k / 6) % 1) + 1) % 1;
          return <circle key={k} cx={AX - 18 + rand(k * 7.7) * 36} cy={430 + ph * 60} r={1.6 + ph * 2} fill="none" stroke="#e6f6ff" strokeWidth={1.2} opacity={0.8 * cyc(ph)} />;
        })}
      </g>
      {/* selang */}
      <path d={HOSE_D} fill="none" stroke="#5b3d33" strokeWidth={24} strokeLinecap="round" />
      <path d={HOSE_D} fill="none" stroke="#9a6a55" strokeWidth={18} strokeLinecap="round" />
      <path d={HOSE_D} fill="none" stroke="#f0c7a8" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" transform="translate(0 -5)" />
      <Stream pts={HOSE_REV} color="white" n={12} speed={0.5} r={3.5} opacity={suck * 0.9} jitter={2} />
      {/* labu penyaring */}
      <path
        d={`M${FX - 30},540 L${FX - 30},610 L${FX - 150},${FLASK_BASE - 30} Q${FX - 160},${FLASK_BASE} ${FX - 130},${FLASK_BASE} L${FX + 130},${FLASK_BASE} Q${FX + 160},${FLASK_BASE} ${FX + 150},${FLASK_BASE - 30} L${FX + 30},610 L${FX + 30},540`}
        fill="#2a3a6e"
        fillOpacity={0.35}
        stroke="#cfe3ff"
        strokeOpacity={0.85}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={`M${FX - 30},596 L946,590`} stroke="#cfe3ff" strokeOpacity={0.85} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${FX - 30},596 L946,590`} stroke="#0b1636" strokeWidth={7} strokeLinecap="round" />
      {/* filtrat di dasar labu */}
      {(() => {
        const yTop = FLASK_BASE - 4 - filtrate;
        const half = (y: number) => 30 + ((y - 610) / (FLASK_BASE - 30 - 610)) * 120;
        const hw = Math.min(150, half(yTop));
        return (
          <g>
            <path d={`M${FX - hw},${yTop} L${FX + hw},${yTop} L${FX + 148},${FLASK_BASE - 30} Q${FX + 156},${FLASK_BASE - 4} ${FX + 128},${FLASK_BASE - 4} L${FX - 128},${FLASK_BASE - 4} Q${FX - 156},${FLASK_BASE - 4} ${FX - 148},${FLASK_BASE - 30} Z`} fill="#f2d36b" opacity={0.42} />
            <line x1={FX - hw} y1={yTop} x2={FX + hw} y2={yTop} stroke="#ffeaa8" strokeOpacity={0.7} strokeWidth={2} />
            <ellipse cx={FX} cy={yTop} rx={20 * cyc(((dripPhase % 1) + 1) % 1)} ry={4} fill="none" stroke="#fff3c8" strokeOpacity={0.6} strokeWidth={1.5} />
          </g>
        );
      })()}
      {/* tekanan rendah di dalam labu */}
      <ellipse cx={FX} cy={720} rx={160} ry={110} fill="url(#soft-press)" opacity={0.5 * (p / 100) * tankLit} />
      {/* sumbat + tabung manometer */}
      <path d={`M${FX - 40},520 L${FX + 40},520 L${FX + 32},556 L${FX - 32},556 Z`} fill="#3d2b2b" stroke="#8a6060" strokeWidth={2} />
      <path d={`M${FX + 20},520 L${FX + 20},300 L1440,262`} fill="none" stroke="#9fb0d8" strokeOpacity={0.8} strokeWidth={6} strokeLinejoin="round" />
      {/* corong Büchner */}
      <rect x={FX - 7} y={530} width={14} height={STEM_TIP - 530} fill="#e9e4dc" />
      <path d={`M${FX - 130},500 L${FX + 130},500 L${FX + 14},540 L${FX - 14},540 Z`} fill="#e9e4dc" stroke="#bfb6a8" strokeWidth={2} />
      <rect x={FX - 130} y={380} width={260} height={124} rx={6} fill="#efeae2" fillOpacity={0.2} stroke="#efeae2" strokeWidth={6} />
      <Water x={FX - 124} y={SLURRY_TOP} w={248} h={488 - SLURRY_TOP} color="#d9b84a" amp={2} seed={8} caustics={false} />
      {Array.from({length: 9}, (_, k) => (
        <circle key={k} cx={FX - 110 + k * 27} cy={482 - 4 * rand(k + 1)} r={4} fill="#b38e3a" opacity={0.9} />
      ))}
      <line x1={FX - 124} y1={490} x2={FX + 124} y2={490} stroke="#ffffff" strokeWidth={4} />
      {/* tetesan dari batang corong */}
      {[0, 0.5].map((o, k) => {
        const ph = (((dripPhase + o) % 1) + 1) % 1;
        const fall = Math.max(0, (ph - 0.45) / 0.55);
        const yTop = FLASK_BASE - 4 - filtrate;
        const y = STEM_TIP + 6 + fall * fall * (yTop - STEM_TIP - 6);
        const r = ph < 0.45 ? 2 + 3.5 * (ph / 0.45) : 5;
        return <ellipse key={k} cx={FX} cy={y} rx={r * 0.85} ry={r} fill="#ffe38a" opacity={0.9 * Math.min(1, (1 - ph) * 10)} />;
      })}
      {/* udara luar mendorong */}
      <g opacity={pushA}>
        {[-90, -30, 30, 90].map((dx, i) => (
          <PressureArrow key={i} x={FX + dx} y={SLURRY_TOP - 4} nx={0} ny={-1} L={78} width={5} />
        ))}
      </g>
    </g>
  );

  // manometer
  const ang = (-120 + (p / 100) * 240) * (Math.PI / 180) + 0.01 * Math.sin(t * 9);
  const GX = 1540;
  const GY = 262;

  return (
    <AbsoluteFill style={{opacity: sIn}}>
      <Stage>
        <g transform={`translate(${Tx.toFixed(2)} ${Ty.toFixed(2)}) scale(${s.toFixed(4)})`}>{bench}</g>
        {/* manometer (di luar zum) */}
        <g opacity={1 - z}>
          <Glow x={GX} y={GY} r={150} color="press" opacity={0.35 + 0.3 * lim} />
          <circle cx={GX} cy={GY} r={92} fill="#0f1838" stroke="#dfe7ff" strokeWidth={5} />
          {Array.from({length: 11}, (_, i) => {
            const a = ((-120 + i * 24) * Math.PI) / 180;
            return <line key={i} x1={GX + 74 * Math.sin(a)} y1={GY - 74 * Math.cos(a)} x2={GX + 86 * Math.sin(a)} y2={GY - 86 * Math.cos(a)} stroke={C.muted} strokeWidth={i % 5 === 0 ? 3.5 : 2} />;
          })}
          <Label x={GX - 70} y={GY + 66} size={18} color={C.muted}>
            0
          </Label>
          <Label x={GX + 70} y={GY + 66} size={18} color={C.muted}>
            100
          </Label>
          <line x1={GX} y1={GY} x2={GX + 72 * Math.sin(ang)} y2={GY - 72 * Math.cos(ang)} stroke={C.press} strokeWidth={5} strokeLinecap="round" />
          <circle cx={GX} cy={GY} r={9} fill={C.press} />
          <Label x={GX} y={GY + 130} size={34} color={C.press} weight={700} font="mono">
            {`${fmtK(p)} kPa`}
          </Label>
          <Label x={GX} y={GY + 172} size={24} color={C.muted}>
            tekanan di labu
          </Label>
          <Ripple x={GX} y={GY} p={ramp(t, wordOf(5, 'dua') - 0.2, wordOf(5, 'dua') + 1.2, (q) => q)} r={160} color="press" />
        </g>
        {/* label awal */}
        <g opacity={lblB * lblOut * (1 - z)}>
          <line x1={FX - 140} y1={420} x2={860} y2={380} stroke={C.gold} strokeWidth={2} />
          <Label x={850} y={372} size={28} color={C.gold} anchor="end" weight={600}>
            corong Büchner
          </Label>
          <Label x={FX + 170} y={800} size={24} color={C.muted} anchor="start">
            labu penyaring
          </Label>
        </g>
        <g opacity={lblA * lblOut * (1 - z)}>
          <line x1={AX + 46} y1={380} x2={520} y2={300} stroke={C.cyan} strokeWidth={2} />
          <Label x={530} y={290} size={28} color={C.cyan} anchor="start" weight={600}>
            pompa vakum air
          </Label>
        </g>
        <g opacity={(1 - lblOut) * (1 - z) * (1 - ramp(t, cue(5) - 0.5, cue(5), EASE_IN_OUT))}>
          <Label x={700} y={760} size={24} color="#dfe7ff" anchor="middle" opacity={suck}>
            udara dari labu → terbawa air
          </Label>
        </g>
        <g opacity={pushA * (1 - z)}>
          <Label x={FX} y={SLURRY_TOP - 110} size={26} color={C.press} weight={700}>
            udara luar mendorong
          </Label>
        </g>
        {/* label saat zum */}
        <g opacity={z}>
          {(() => {
            const [nx, ny] = Z(AX - 10, 400);
            const [jx, jy] = Z(AX - 12, 470);
            const [ax, ay] = Z(410, ARM_Y);
            return (
              <g>
                <g opacity={nozzleLbl}>
                  <line x1={nx} y1={ny} x2={nx - 220} y2={ny - 60} stroke={C.cyan} strokeWidth={2} />
                  <Label x={nx - 230} y={ny - 60} size={30} color={C.cyan} anchor="end" weight={600}>
                    nosel sempit
                  </Label>
                </g>
                <g opacity={fastLbl}>
                  <line x1={jx} y1={jy} x2={jx - 220} y2={jy + 70} stroke={C.cyan} strokeWidth={2} />
                  <Label x={jx - 230} y={jy + 70} size={30} color={C.cyan} anchor="end" weight={600}>
                    pancaran sangat cepat
                  </Label>
                </g>
                <g opacity={lowLbl}>
                  <Label x={jx - 230} y={jy + 112} size={30} color={C.press} anchor="end" weight={700}>
                    → tekanan rendah
                  </Label>
                </g>
                <g opacity={suck}>
                  <line x1={ax} y1={ay - 30} x2={ax + 60} y2={ay - 120} stroke="#dfe7ff" strokeWidth={2} />
                  <Label x={ax + 66} y={ay - 134} size={28} color="#dfe7ff" anchor="start" weight={600}>
                    udara tersedot masuk
                  </Label>
                </g>
              </g>
            );
          })()}
        </g>
        {/* kurva tekanan uap */}
        <g opacity={plotIn}>
          {(() => {
            const x0 = 1420;
            const y0 = 836;
            const w = 380;
            const h = 170;
            const T = (c: number) => x0 + (c / 40) * w;
            const P = (k: number) => y0 - (k / 8) * h;
            const pv = (c: number) => 0.6112 * Math.exp((17.62 * c) / (243.12 + c));
            const pts = Array.from({length: 41}, (_, i) => [T(i), P(pv(i))] as [number, number]);
            const tc = 20 - 10 * cold;
            const [mx, my] = [T(tc), P(pv(tc))];
            return (
              <g>
                <line x1={x0} y1={y0} x2={x0 + w + 10} y2={y0} stroke={C.muted} strokeWidth={2} markerEnd="url(#arrow-muted)" />
                <line x1={x0} y1={y0} x2={x0} y2={y0 - h - 20} stroke={C.muted} strokeWidth={2} markerEnd="url(#arrow-muted)" />
                <Label x={x0 + w + 4} y={y0 + 24} size={22} color={C.muted} anchor="end">
                  suhu air
                </Label>
                <Label x={x0 + 10} y={y0 - h - 26} size={22} color={C.muted} anchor="start">
                  tekanan uap air
                </Label>
                <path d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={C.press} strokeWidth={4} />
                <line x1={T(20)} y1={y0} x2={T(20)} y2={P(pv(20))} stroke={C.gold} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="5 5" />
                <Label x={T(20)} y={y0 + 24} size={22} color={C.gold}>
                  20 °C
                </Label>
                <Label x={T(20) + 14} y={P(pv(20)) - 26} size={22} color={C.gold} anchor="end">
                  2,3 kPa
                </Label>
                <circle cx={mx} cy={my} r={9} fill={C.cyan} />
                <Glow x={mx} y={my} r={40} color="cyan" />
                <g opacity={cold}>
                  <Label x={T(1)} y={P(pv(6)) - 96} size={22} color={C.cyan} anchor="start">
                    lebih dingin → lebih rendah
                  </Label>
                </g>
                {/* termometer */}
                {(() => {
                  const tx = x0 - 70;
                  const top = y0 - 190;
                  const bot = y0 - 20;
                  const lvl = top + 40 + (1 - (tc - 5) / 30) * (bot - top - 60);
                  return (
                    <g>
                      <rect x={tx - 10} y={top} width={20} height={bot - top} rx={10} fill="#0f1838" stroke="#dfe7ff" strokeWidth={2.5} />
                      <circle cx={tx} cy={bot + 6} r={16} fill={C.heat} stroke="#dfe7ff" strokeWidth={2.5} />
                      <rect x={tx - 5} y={lvl} width={10} height={bot - lvl + 4} fill={C.heat} />
                    </g>
                  );
                })()}
              </g>
            );
          })()}
        </g>
        <Twinkles x={GX} y={GY + 130} rx={130} ry={24} n={4} opacity={lim * (1 - z)} seed={3} />
        <Motes x={760} y={560} rx={560} ry={300} n={16} color="cyan" opacity={0.3} seed={6} />
      </Stage>
      {/* Bernoulli saat zum (kiri, mengisi ruang kosong) */}
      <Card x={480} y={760} opacity={Math.min(1, z * ramp(t, wordOf(3, 'rendah') - 0.5, wordOf(3, 'rendah') + 0.3) * 1.4)} accent={C.press} style={{padding: '16px 36px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap'}}>
          <Tint c={C.cyan}>
            <V>v</V> besar
          </Tint>{' '}
          →{' '}
          <Tint c={C.press}>
            <V>p</V> kecil
          </Tint>
        </div>
      </Card>
      <Note x={1610} y={520} p={lim} color={C.press} size={27}>
        <div style={{textAlign: 'center'}}>
          Batas ≈ <Tint c={C.press}>tekanan uap air</Tint>
          <div style={{fontSize: 24, color: C.muted}}>
            <V color={C.press}>p</V>
            <Sub>uap</Sub> ≈ 2,3 kPa pada 20 °C
          </div>
        </div>
      </Note>
    </AbsoluteFill>
  );
};
