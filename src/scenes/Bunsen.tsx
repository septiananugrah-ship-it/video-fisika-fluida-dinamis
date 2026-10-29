import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Streamline} from '../components/flow';
import {PressureArrow} from '../components/fluid';
import {Glow, Label, Motes, Note, Ripple, Stage, Stream, Tint, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembakar Bunsen (penampang): gas menyembur cepat dari nosel kecil di dasar cerobong (p turun),
// udara luar terdorong masuk lewat lubang cincin pengatur, bercampur, lalu terbakar.
// Cincin terbuka → nyala biru berkerucut dalam (panas, bersih); tertutup → nyala kuning berjelaga (lebih dingin).
// Kaca pembesar menunjukkan daerah nosel & lubang udara. "Tanpa kipas, tanpa listrik".

const BX = 600;
const TOP = 430; // mulut cerobong
const NOZ = 772; // ujung nosel
const HOLE0 = 700;
const HOLE1 = 742;
const GAS = '#ffbe7a';

const gasLane = (f: number): [number, number][] => [
  [BX + f * 4, NOZ + 4],
  [BX + f * 10, 720],
  [BX + f * 34, 620],
  [BX + f * 40, 460],
  [BX + f * 30, TOP - 30],
];
const GAS_GAIN = [3.4, 2.4, 1.3, 1, 1];
const airLane = (side: 1 | -1, k: number): [number, number][] => [
  [BX + side * (300 + k * 30), 660 - k * 40],
  [BX + side * 120, 712 + k * 8],
  [BX + side * 46, 721 + k * 4],
  [BX + side * (14 + k * 6), 690],
  [BX + side * (20 + k * 6), 600],
  [BX + side * (22 + k * 4), 460],
  [BX + side * (18 + k * 4), TOP - 30],
];
const AIR_GAIN = [0.55, 0.9, 1.7, 1.3, 1, 1, 1];

export const Bunsen: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const sIn = ramp(t, -0.2, 1.0);
  const tOpen = wordOf(3, 'dibuka');
  const tClose = wordOf(4, 'ditutup');
  const open = Math.max(0, Math.min(1, 0.82 + 0.18 * ramp(t, tOpen - 0.5, tOpen + 0.8, EASE_IN_OUT) - ramp(t, tClose - 0.5, tClose + 0.9, EASE_IN_OUT) + ramp(t, cue(5) + 0.6, cue(5) + 2.0, EASE_IN_OUT)));
  // putaran cincin (tekstur bergeser sebanding perubahan bukaan)
  const rot = open * 140 + 6 * Math.sin(t * 0.7);
  const gasOn = ramp(t, -0.2, 0.8);
  const jetLbl = ramp(t, wordOf(1, 'kecepatan') - 0.3, wordOf(1, 'kecepatan') + 0.5);
  const lowLbl = ramp(t, wordOf(1, 'turun') - 0.3, wordOf(1, 'turun') + 0.5);
  const airIn = ramp(t, wordOf(2, 'udara') - 0.4, wordOf(2, 'udara') + 0.6);
  const mixLbl = ramp(t, wordOf(2, 'bercampur') - 0.3, wordOf(2, 'bercampur') + 0.5);
  const air = Math.max(0.25, airIn) * open;
  const lens = win(t, cue(1) - 0.2, cue(3) - 0.4, 0.7, 0.6);
  const noteB = win(t, cue(3) - 0.1, cue(4) - 0.3, 0.5, 0.5);
  const noteY = win(t, cue(4) - 0.1, cue(5) - 0.3, 0.5, 0.5);
  const meter = ramp(t, cue(3) - 0.2, cue(3) + 0.6);
  const icons = ramp(t, cue(5) - 0.1, cue(5) + 0.7);
  const xFan = ramp(t, wordOf(5, 'kipas') - 0.1, wordOf(5, 'kipas') + 0.5);
  const xPlug = ramp(t, wordOf(5, 'listrik') - 0.1, wordOf(5, 'listrik') + 0.5);
  const self = ramp(t, wordOf(5, 'sendiri') - 0.3, wordOf(5, 'sendiri') + 0.6);
  const intro = win(t, cue(0) + 0.2, cue(1) - 0.2, 0.5, 0.5);

  const internals = (inLens: boolean) => (
    <g>
      {/* aliran gas di dalam selang & alas */}
      {/* cerobong */}
      <rect x={BX - 34} y={TOP} width={68} height={NOZ + 20 - TOP} fill="#1a2550" opacity={0.6} />
      <rect x={BX - 26} y={TOP} width={52} height={NOZ + 20 - TOP} fill="#0a1230" />
      <rect x={BX - 34} y={TOP} width={8} height={HOLE0 - TOP} fill="#a9b5d6" />
      <rect x={BX + 26} y={TOP} width={8} height={HOLE0 - TOP} fill="#a9b5d6" />
      <rect x={BX - 34} y={HOLE1} width={8} height={NOZ + 20 - HOLE1} fill="#a9b5d6" />
      <rect x={BX + 26} y={HOLE1} width={8} height={NOZ + 20 - HOLE1} fill="#a9b5d6" />
      <rect x={BX - 36} y={TOP - 6} width={72} height={10} rx={3} fill="#c9d4f0" />
      {/* daerah tekanan rendah di sekitar pancaran */}
      <ellipse cx={BX} cy={735} rx={30} ry={46} fill="url(#soft-press)" opacity={0.25 + 0.5 * lowLbl} />
      {/* nosel */}
      <path d={`M${BX - 14},${NOZ + 26} L${BX - 4},${NOZ} L${BX + 4},${NOZ} L${BX + 14},${NOZ + 26} Z`} fill="#d7b98a" stroke="#fff0d0" strokeWidth={1.5} />
      {/* pancaran gas */}
      {[-0.6, -0.2, 0.2, 0.6].map((f, i) => (
        <Streamline key={`g${i}`} pts={gasLane(f)} gain={GAS_GAIN} speed={170} n={inLens ? 6 : 8} seed={i * 1.9} color={GAS} line={0.12} opacity={gasOn} />
      ))}
      {/* udara masuk lewat lubang */}
      {([-1, 1] as const).map((sd) =>
        [0, 1].map((k) => <Streamline key={`a${sd}${k}`} pts={airLane(sd, k)} gain={AIR_GAIN} speed={130} n={inLens ? 5 : 7} seed={sd * 3 + k * 1.3} color="#cfeaff" line={0.1} opacity={air} />),
      )}
      {/* cincin pengatur (berputar: lubang menyempit/melebar) */}
      {([-1, 1] as const).map((sd) => {
        const x = sd < 0 ? BX - 46 : BX + 34;
        const gap = (HOLE1 - HOLE0) * open;
        const gy0 = (HOLE0 + HOLE1) / 2 - gap / 2;
        return (
          <g key={`c${sd}`}>
            <rect x={x} y={HOLE0 - 12} width={12} height={gy0 - (HOLE0 - 12)} fill="#7d8cc0" stroke="#dfe7ff" strokeWidth={1.2} />
            <rect x={x} y={gy0 + gap} width={12} height={HOLE1 + 12 - (gy0 + gap)} fill="#7d8cc0" stroke="#dfe7ff" strokeWidth={1.2} />
          </g>
        );
      })}
    </g>
  );

  // nyala
  const fl = (k: number, a: number) => Math.sin(t * (7 + k) + a) * 0.6 + Math.sin(t * (11.3 + k) + 2 * a) * 0.4;
  const blueTipX = BX + 5 * fl(0, 0);
  const blueTipY = TOP - 200 - 12 * fl(1, 1);
  const innerTip = TOP - 92 - 4 * fl(2, 2);
  const blue = open;
  const yellow = 1 - open;

  const flameYellow = (sc: number, col: string, op: number, ph: number) => {
    const h = 270 * sc + 16 * fl(3, ph);
    const w = 52 * sc;
    const tx = BX + 14 * fl(4, ph);
    return (
      <path
        d={`M${BX - 30},${TOP} C${BX - w - 20},${TOP - h * 0.35} ${tx - w * 0.6 + 10 * fl(5, ph)},${TOP - h * 0.7} ${tx},${TOP - h} C${tx + w * 0.5 + 10 * fl(6, ph)},${TOP - h * 0.7} ${BX + w + 20},${TOP - h * 0.35} ${BX + 30},${TOP} Z`}
        fill={col}
        opacity={op}
      />
    );
  };

  // kaca pembesar
  const LX = 1420;
  const LY = 480;
  const LR = 230;
  const LS = 2.6;
  const lensFocus = [BX, 724];

  return (
    <AbsoluteFill style={{opacity: sIn}}>
      <Stage>
        <defs>
          <clipPath id="bn-lens">
            <circle cx={LX} cy={LY} r={LR} />
          </clipPath>
          <linearGradient id="bn-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8f9cc6" />
            <stop offset="100%" stopColor="#3b4677" />
          </linearGradient>
        </defs>
        {/* meja */}
        <rect x={120} y={852} width={1000} height={18} rx={6} fill="#24325e" />
        {/* keran gas + selang */}
        <rect x={130} y={760} width={40} height={92} rx={8} fill="#5d6a96" />
        <rect x={116} y={770} width={68} height={16} rx={8} fill={C.force} opacity={0.85} />
        <path d={`M170,800 C260,800 300,826 ${BX - 110},826`} fill="none" stroke="#c46a3a" strokeWidth={18} strokeLinecap="round" />
        <path d={`M170,800 C260,800 300,826 ${BX - 110},826`} fill="none" stroke="#ffb27a" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" transform="translate(0 -4)" />
        <Stream pts={[[175, 800], [300, 815], [BX - 110, 826], [BX - 20, 826], [BX, NOZ + 20]]} color="kin" n={8} speed={0.6} r={3.5} opacity={gasOn * 0.9} jitter={1.5} />
        <Label x={150} y={730} size={24} color={GAS}>
          gas
        </Label>
        {/* alas */}
        <path d={`M${BX - 150},852 L${BX - 120},800 L${BX + 120},800 L${BX + 150},852 Z`} fill="url(#bn-base)" stroke="#dfe7ff" strokeWidth={2} />
        <rect x={BX - 40} y={780} width={80} height={24} rx={6} fill="#6c79a8" />
        <ellipse cx={BX} cy={862} rx={190} ry={10} fill="#000" opacity={0.35} />
        {internals(false)}
        {/* cincin tampak luar: pita bergaris yang bergeser saat diputar */}
        <g>
          {Array.from({length: 5}, (_, k) => {
            const x = BX - 46 + ((((k * 22 + rot) % 110) + 110) % 110) * (92 / 110);
            return <line key={k} x1={x} y1={HOLE0 - 12} x2={x} y2={HOLE0 - 4} stroke="#dfe7ff" strokeOpacity={0.6} strokeWidth={2} />;
          })}
        </g>
        {/* nyala */}
        <Glow x={BX} y={TOP - 120} r={260} color="cyan" opacity={0.45 * blue} />
        <Glow x={BX} y={TOP - 150} r={300} color="kin" opacity={0.55 * yellow} />
        <g opacity={blue}>
          <path d={`M${BX - 30},${TOP} C${BX - 46},${TOP - 80} ${blueTipX - 16},${blueTipY + 50} ${blueTipX},${blueTipY} C${blueTipX + 16},${blueTipY + 50} ${BX + 46},${TOP - 80} ${BX + 30},${TOP} Z`} fill="#6f7dff" opacity={0.32} stroke="#a7b3ff" strokeOpacity={0.7} strokeWidth={2} />
          <path d={`M${BX - 24},${TOP} Q${BX - 20},${TOP - 50} ${BX},${innerTip} Q${BX + 20},${TOP - 50} ${BX + 24},${TOP} Z`} fill="#5fe0ff" opacity={0.85} />
          <path d={`M${BX - 12},${TOP} Q${BX - 9},${TOP - 30} ${BX},${innerTip + 30} Q${BX + 9},${TOP - 30} ${BX + 12},${TOP} Z`} fill="#e9fbff" opacity={0.7} />
        </g>
        <g opacity={yellow}>
          {flameYellow(1, '#ff7a1f', 0.75, 0)}
          {flameYellow(0.78, '#ffb52e', 0.85, 1.7)}
          {flameYellow(0.5, '#fff1a6', 0.9, 3.1)}
          <path d={`M${BX - 22},${TOP} Q${BX},${TOP - 40} ${BX + 22},${TOP} Z`} fill="#6f7dff" opacity={0.5} />
          {/* jelaga */}
          {Array.from({length: 16}, (_, k) => {
            const ph = (((t * 0.45 + k / 16) % 1) + 1) % 1;
            const y = TOP - 230 - ph * 80;
            const x = BX + (rand(k * 3.3) - 0.5) * 50 + 22 * Math.sin(t * 1.3 + k) * ph;
            return <circle key={k} cx={x} cy={y} r={2.5 + 3 * rand(k)} fill="#2a2a33" opacity={0.85 * cyc(ph)} />;
          })}
          {[0, 1].map((k) => (
            <path
              key={`sm${k}`}
              d={Array.from({length: 14}, (_, i) => {
                const y = TOP - 250 - i * 6;
                return `${i ? 'L' : 'M'}${(BX + 14 * Math.sin(i * 0.6 - t * 2 + k * 2) * (i / 14) + (k - 0.5) * 14).toFixed(1)},${y.toFixed(1)}`;
              }).join(' ')}
              fill="none"
              stroke="#6a6a7a"
              strokeOpacity={0.35}
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
        </g>
        {/* label penampang */}
        <g opacity={jetLbl}>
          <line x1={BX + 10} y1={760} x2={BX + 200} y2={790} stroke={GAS} strokeWidth={2} />
          <Label x={BX + 210} y={790} size={26} color={GAS} anchor="start" weight={600}>
            gas sangat cepat
          </Label>
        </g>
        <g opacity={lowLbl}>
          <Label x={BX + 210} y={826} size={26} color={C.press} anchor="start" weight={700}>
            → tekanan turun
          </Label>
        </g>
        <g opacity={airIn * open}>
          {([-1, 1] as const).map((sd) => (
            <PressureArrow key={sd} x={BX + sd * 50} y={721} nx={sd} ny={0} L={60} width={4} />
          ))}
          <Label x={BX - 250} y={600} size={26} color="#cfeaff" weight={600}>
            udara luar
          </Label>
          <Label x={BX - 250} y={632} size={22} color={C.press}>
            (tekanan atmosfer)
          </Label>
        </g>
        <g opacity={mixLbl}>
          <line x1={BX + 40} y1={560} x2={BX + 150} y2={540} stroke={C.muted} strokeWidth={2} />
          <Label x={BX + 160} y={540} size={26} color={C.ink} anchor="start" weight={600}>
            gas + udara bercampur
          </Label>
        </g>
        <g opacity={win(t, tOpen, tClose - 0.4, 0.6, 0.5)}>
          <line x1={BX + 14} y1={TOP - 70} x2={BX + 150} y2={TOP - 110} stroke="#5fe0ff" strokeWidth={2} />
          <Label x={BX + 160} y={TOP - 110} size={26} color="#5fe0ff" anchor="start" weight={600}>
            kerucut dalam
          </Label>
        </g>
        <g opacity={win(t, tClose + 0.3, cue(5) + 0.8, 0.6, 0.6)}>
          <line x1={BX + 26} y1={TOP - 260} x2={BX + 150} y2={TOP - 250} stroke={C.muted} strokeWidth={2} />
          <Label x={BX + 160} y={TOP - 250} size={26} color="#c9c9d6" anchor="start" weight={600}>
            jelaga
          </Label>
        </g>
        <Ripple x={BX} y={720} p={ramp(t, tOpen - 0.3, tOpen + 1.1, (q) => q)} r={110} color="cyan" rings={2} />
        <Ripple x={BX} y={720} p={ramp(t, tClose - 0.3, tClose + 1.1, (q) => q)} r={110} color="kin" rings={2} />
        <g opacity={intro}>
          <Label x={BX + 160} y={TOP - 150} size={26} color={C.muted} anchor="start">
            pembakar Bunsen (penampang)
          </Label>
        </g>

        {/* kaca pembesar daerah nosel */}
        <g opacity={lens}>
          <line x1={BX + 60} y1={724} x2={LX - LR * 0.92} y2={LY + LR * 0.38} stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" />
          <circle cx={BX} cy={724} r={58} fill="none" stroke={C.muted} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="6 6" />
          <circle cx={LX} cy={LY} r={LR + 6} fill="#081026" />
          <g clipPath="url(#bn-lens)">
            <g transform={`translate(${LX - LS * lensFocus[0]} ${LY - LS * lensFocus[1]}) scale(${LS})`}>{internals(true)}</g>
          </g>
          <circle cx={LX} cy={LY} r={LR + 4} fill="none" stroke="#dfe7ff" strokeWidth={6} />
          <path d={`M${LX - LR * 0.6},${LY - LR * 0.75} A${LR * 0.95},${LR * 0.95} 0 0 1 ${LX + LR * 0.2},${LY - LR * 0.93}`} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
          <g opacity={lowLbl}>
            <Label x={LX} y={LY - 110} size={28} color={C.press} weight={700}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan> rendah
            </Label>
          </g>
          <g opacity={airIn}>
            <Label x={LX - 160} y={LY - 40} size={24} color="#cfeaff" weight={600}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan>
              <tspan baselineShift="sub" fontSize="0.65em">atm</tspan>
            </Label>
            <Label x={LX + 160} y={LY - 40} size={24} color="#cfeaff" weight={600}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan>
              <tspan baselineShift="sub" fontSize="0.65em">atm</tspan>
            </Label>
          </g>
          <Label x={LX} y={LY + LR + 34} size={24} color={C.muted}>
            dasar cerobong diperbesar
          </Label>
        </g>

        {/* meter udara primer */}
        <g opacity={meter}>
          {(() => {
            const x0 = 1180;
            const W = 500;
            const y = 520;
            return (
              <g>
                <Label x={x0} y={y - 36} size={24} color={C.muted} anchor="start">
                  udara (oksigen) yang ikut masuk
                </Label>
                <rect x={x0} y={y - 16} width={W} height={32} rx={10} fill="none" stroke={C.line} strokeWidth={2} />
                <rect x={x0} y={y - 16} width={Math.max(4, W * open)} height={32} rx={10} fill="#5fe0ff" opacity={open} />
                <rect x={x0} y={y - 16} width={Math.max(4, W * open)} height={32} rx={10} fill="#ffb52e" opacity={1 - open} />
                <Label x={x0 + W + 16} y={y} size={24} color={C.ink} anchor="start" weight={600} font="mono">
                  {`${Math.round(open * 100)} %`}
                </Label>
              </g>
            );
          })()}
        </g>
        {/* ikon: tanpa kipas, tanpa listrik */}
        <g opacity={icons}>
          {(() => {
            const fx = 1300;
            const px = 1560;
            const y = 690;
            const blade = (a: number) => (
              <path
                key={a}
                d={`M${fx},${y} C${fx + 30 * Math.cos(a - 0.5)},${y + 30 * Math.sin(a - 0.5)} ${fx + 54 * Math.cos(a)},${y + 54 * Math.sin(a)} ${fx + 50 * Math.cos(a + 0.35)},${y + 50 * Math.sin(a + 0.35)} Z`}
                fill="#9fb0d8"
              />
            );
            const ang = t * 0.4 * (1 - xFan);
            const cross = (x: number, p: number) => (
              <g>
                <circle cx={x} cy={y} r={78} fill="none" stroke={C.heat} strokeWidth={5} opacity={0.4 + 0.6 * p} />
                <line x1={x - 55} y1={y + 55} x2={x - 55 + 110 * p} y2={y + 55 - 110 * p} stroke={C.heat} strokeWidth={7} strokeLinecap="round" />
              </g>
            );
            return (
              <g>
                {[0, 1, 2].map((k) => blade(ang + (k * 2 * Math.PI) / 3))}
                <circle cx={fx} cy={y} r={10} fill="#dfe7ff" />
                {cross(fx, xFan)}
                <rect x={px - 26} y={y - 26} width={52} height={50} rx={10} fill="#9fb0d8" />
                <rect x={px - 16} y={y - 50} width={8} height={26} rx={3} fill="#dfe7ff" />
                <rect x={px + 8} y={y - 50} width={8} height={26} rx={3} fill="#dfe7ff" />
                <path d={`M${px},${y + 24} Q${px},${y + 50} ${px + 30},${y + 56}`} fill="none" stroke="#9fb0d8" strokeWidth={8} strokeLinecap="round" />
                {cross(px, xPlug)}
                <Label x={fx} y={y + 106} size={24} color={C.muted}>
                  tanpa kipas
                </Label>
                <Label x={px} y={y + 106} size={24} color={C.muted}>
                  tanpa listrik
                </Label>
              </g>
            );
          })()}
        </g>
        <Twinkles x={BX} y={TOP - 120} rx={120} ry={80} n={4} opacity={self * blue} seed={4} />
        <Motes x={BX} y={TOP - 80} rx={260} ry={200} n={16} color="kin" opacity={0.35} seed={2} />
      </Stage>
      <Note x={1430} y={300} p={noteB} color="#5fe0ff" size={28}>
        <div style={{textAlign: 'center'}}>
          Cincin dibuka · O₂ cukup
          <div>
            → <Tint c="#5fe0ff">nyala biru</Tint>, panas & bersih
          </div>
        </div>
      </Note>
      <Note x={1430} y={300} p={noteY} color="#ffb52e" size={28}>
        <div style={{textAlign: 'center'}}>
          Cincin ditutup · O₂ kurang
          <div>
            → <Tint c="#ffb52e">nyala kuning</Tint> berjelaga, lebih dingin
          </div>
        </div>
      </Note>
      <Note x={1430} y={300} p={ramp(t, wordOf(5, 'aliran') - 0.3, wordOf(5, 'aliran') + 0.5)} color={C.gold} size={28}>
        <div style={{textAlign: 'center'}}>
          Aliran gas itu sendiri
          <div>yang menghisap udara</div>
        </div>
      </Note>
    </AbsoluteFill>
  );
};
