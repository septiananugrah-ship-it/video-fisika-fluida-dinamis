import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Streamline} from '../components/flow';
import {PressureArrow, Water} from '../components/fluid';
import {Card, Frac, Glow, Label, Motes, Note, Ripple, Stage, Stream, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Nebulizer pneumatik pada spektrometer serapan atom (SSA/AAS):
// 1) skema SSA: lampu → berkas cahaya → nyala di atas pembakar celah → monokromator → detektor; di bawahnya
//    ruang semprot dengan nebulizer, kapiler ke gelas sampel.
// 2) diperbesar: pancaran gas sangat cepat melewati ujung kapiler → p rendah → larutan naik tanpa pompa →
//    dipecah menjadi butiran sangat kecil (kabut).
// 3) prinsip yang sama: botol semprot parfum & nebulizer jet untuk asma.

const BEAM_Y = 300;
const FL_X = 900;

// ---------- tampilan dekat ----------
const JET_Y = 430;
const NOZ_X = 640;
const CAP_X = 690;
const CAP_TOP = JET_Y + 16;
const SURF = 742;

const jetLane = (f: number): [number, number][] => [
  [130, JET_Y + f * 24],
  [540, JET_Y + f * 24],
  [NOZ_X, JET_Y + f * 7],
  [800, JET_Y + f * 12],
  [1100, JET_Y + f * 40],
  [1320, JET_Y + f * 64],
];
const JET_GAIN = [1, 1, 3.4, 3.0, 2.0, 1.4];

export const Nebulizer: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  const ovIn = ramp(t, -0.2, 1.0);
  const ovOut = ramp(t, cue(1) - 0.3, cue(1) + 0.7, EASE_IN_OUT);
  const clIn = ramp(t, cue(1) - 0.1, cue(1) + 0.9, EASE_IN_OUT);
  const clOut = ramp(t, cue(5) - 0.6, cue(5) + 0.2, EASE_IN_OUT);
  const icIn = ramp(t, cue(5) - 0.2, cue(5) + 0.7);
  const mistLbl = ramp(t, wordOf(0, 'kabut') - 0.3, wordOf(0, 'kabut') + 0.5);
  const flameLbl = ramp(t, wordOf(0, 'nyala') - 0.3, wordOf(0, 'nyala') + 0.5);
  const nebLbl = ramp(t, wordOf(1, 'nebulizer') - 0.4, wordOf(1, 'nebulizer') + 0.4);
  const gasOn = Math.max(0.35, ramp(t, cue(2) - 0.4, cue(2) + 0.6));
  const fastLbl = ramp(t, wordOf(2, 'cepat') - 0.3, wordOf(2, 'cepat') + 0.5);
  const capLbl = ramp(t, wordOf(2, 'kapiler') - 0.3, wordOf(2, 'kapiler') + 0.5);
  const lowLbl = ramp(t, wordOf(3, 'turun') - 0.3, wordOf(3, 'turun') + 0.5);
  const rise = ramp(t, wordOf(3, 'terhisap') - 0.4, cueEnd(3) + 0.2, EASE_IN_OUT);
  const pumpLbl = ramp(t, wordOf(3, 'pompa') - 0.3, wordOf(3, 'pompa') + 0.5);
  const drops = ramp(t, cue(4) - 0.2, cue(4) + 0.8);
  const fineLbl = ramp(t, wordOf(4, 'butiran') - 0.3, wordOf(4, 'butiran') + 0.6);
  const fml = ramp(t, wordOf(3, 'tekanan') - 0.3, wordOf(3, 'tekanan') + 0.6);
  const front = mix(SURF, CAP_TOP, rise);
  const flowing = ramp(t, cue(4) - 0.4, cue(4) + 0.4);
  const parfum = ramp(t, wordOf(5, 'parfum') - 0.4, wordOf(5, 'parfum') + 0.5);
  const asma = ramp(t, wordOf(5, 'asma') - 0.6, wordOf(5, 'asma') + 0.4);

  const ovS = 1 + 1.4 * ovOut;
  const clS = (0.7 + 0.3 * clIn) * 1.15;

  return (
    <AbsoluteFill>
      {/* ===================== skema SSA ===================== */}
      <AbsoluteFill style={{opacity: ovIn * (1 - ovOut)}}>
        <Stage>
          <g transform={`translate(${560 * (1 - ovS)} ${585 * (1 - ovS)}) scale(${ovS})`}>
            {/* lampu katoda berongga */}
            <rect x={130} y={262} width={170} height={76} rx={30} fill="#26346a" stroke="#dfe7ff" strokeWidth={3} />
            <rect x={270} y={276} width={34} height={48} rx={8} fill="#9fd8ff" opacity={0.5} />
            <circle cx={250} cy={BEAM_Y} r={14} fill={C.gold} />
            <Glow x={250} y={BEAM_Y} r={60} color="gold" />
            <Label x={215} y={370} size={22} color={C.muted}>
              lampu katoda berongga
            </Label>
            {/* berkas cahaya: terang sebelum nyala, lebih redup sesudahnya (diserap atom) */}
            <line x1={300} y1={BEAM_Y} x2={FL_X} y2={BEAM_Y} stroke={C.gold} strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" />
            <line x1={FL_X} y1={BEAM_Y} x2={1560} y2={BEAM_Y} stroke={C.gold} strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
            <Stream pts={[[310, BEAM_Y], [FL_X, BEAM_Y]]} color="gold" n={9} speed={0.7} r={4} jitter={0} />
            <Stream pts={[[FL_X, BEAM_Y], [1560, BEAM_Y]]} color="gold" n={6} speed={0.55} r={3} jitter={0} opacity={0.6} />
            {/* pembakar celah + nyala */}
            <rect x={790} y={334} width={220} height={18} rx={5} fill="#9fb0d8" />
            {Array.from({length: 3}, (_, k) => {
              const d = Array.from({length: 23}, (_, i) => {
                const x = 796 + i * 9.5;
                const h = 70 + 30 * Math.sin(i * 0.5 + t * (5 + k) + k) * Math.sin((i / 22) * Math.PI) + 20 * Math.sin((i / 22) * Math.PI);
                return `${i ? 'L' : 'M'}${x.toFixed(1)},${(334 - h * (1 - k * 0.25)).toFixed(1)}`;
              }).join(' ');
              return <path key={k} d={`${d} L1005,334 L796,334 Z`} fill={k === 2 ? '#bff4ff' : '#6f7dff'} opacity={[0.3, 0.4, 0.5][k]} />;
            })}
            <Glow x={FL_X} y={290} r={160} color="cyan" opacity={0.5} />
            {/* monokromator & detektor */}
            <rect x={1290} y={252} width={170} height={96} rx={12} fill="#1c2852" stroke="#dfe7ff" strokeWidth={2.5} />
            <path d={`M1340,325 L1375,270 L1410,325 Z`} fill="none" stroke="#9fd8ff" strokeWidth={2.5} />
            <Label x={1375} y={372} size={22} color={C.muted}>
              monokromator
            </Label>
            <rect x={1560} y={262} width={110} height={76} rx={10} fill="#1c2852" stroke="#dfe7ff" strokeWidth={2.5} />
            {Array.from({length: 5}, (_, i) => (
              <rect key={i} x={1578 + i * 16} y={322 - (14 + 22 * (0.5 + 0.5 * Math.sin(t * 2 + i))) } width={10} height={14 + 22 * (0.5 + 0.5 * Math.sin(t * 2 + i))} fill={C.gold} opacity={0.8} />
            ))}
            <Label x={1615} y={372} size={22} color={C.muted}>
              detektor
            </Label>
            {/* leher & ruang semprot */}
            <path d={`M870,352 L870,520 M930,352 L930,520`} stroke="#cfe3ff" strokeOpacity={0.8} strokeWidth={4} />
            <rect x={560} y={520} width={520} height={130} rx={60} fill="#1a2550" fillOpacity={0.5} stroke="#cfe3ff" strokeOpacity={0.8} strokeWidth={4} />
            <rect x={872} y={516} width={56} height={10} fill="#1a2550" />
            <Stream pts={[[600, 585], [820, 590], [890, 560], [900, 470], [900, 360]]} color="white" n={22} speed={0.35} r={3} jitter={10} />
            <path d="M1010,650 L1010,720" stroke="#cfe3ff" strokeOpacity={0.8} strokeWidth={8} />
            {[0, 0.5].map((o, k) => {
              const ph = (((t * 0.8 + o) % 1) + 1) % 1;
              return <circle key={k} cx={1010} cy={724 + ph * 60} r={4} fill={C.water} opacity={cyc(ph)} />;
            })}
            <Label x={1060} y={750} size={22} color={C.muted} anchor="start">
              pembuangan
            </Label>
            {/* nebulizer, gas, kapiler, sampel */}
            <rect x={240} y={572} width={300} height={18} rx={6} fill="#9fb0d8" />
            <Stream pts={[[250, 581], [560, 583]]} color="cyan" n={8} speed={1.2} r={3} jitter={0} />
            <path d="M530,560 L578,575 L578,595 L530,606 Z" fill="#c9d4f0" />
            <path d="M574,598 C540,640 430,640 420,700 L420,830" fill="none" stroke="#cfe3ff" strokeWidth={6} />
            <path d="M574,598 C540,640 430,640 420,700 L420,830" fill="none" stroke={C.water} strokeWidth={2.5} strokeDasharray="6 10" strokeDashoffset={t * 40} />
            <Water x={346} y={770} w={148} h={80} seed={3} amp={2} caustics={false} />
            <path d="M340,730 L340,856 L500,856 L500,730" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} strokeLinejoin="round" />
            <Label x={250} y={540} size={22} color={C.cyan} anchor="start">
              gas (udara bertekanan)
            </Label>
            <Label x={300} y={800} size={22} color={C.muted} anchor="end">
              larutan sampel
            </Label>
          </g>
          <g opacity={mistLbl}>
            <Label x={820} y={680} size={26} color="#e6f6ff" weight={600}>
              kabut halus
            </Label>
          </g>
          <g opacity={flameLbl}>
            <Label x={FL_X} y={180} size={26} color="#a7b3ff" weight={600}>
              nyala
            </Label>
          </g>
          <g opacity={nebLbl}>
            <Ripple x={560} y={585} p={ramp(t, wordOf(1, 'nebulizer') - 0.3, wordOf(1, 'nebulizer') + 1.0, (q) => q)} r={90} color="gold" />
            <Label x={560} y={490} size={28} color={C.gold} weight={700}>
              nebulizer
            </Label>
          </g>
          <Motes x={900} y={500} rx={760} ry={300} n={16} color="gold" opacity={0.3} seed={4} />
        </Stage>
      </AbsoluteFill>

      {/* ===================== tampilan dekat ===================== */}
      <AbsoluteFill style={{opacity: clIn * (1 - clOut)}}>
        <Stage>
          <g transform={`translate(${820 - 700 * clS} ${520 - 560 * clS}) scale(${clS})`}>
            {/* pipa gas & nosel */}
            <path d={`M120,${JET_Y - 34} L540,${JET_Y - 34} L${NOZ_X},${JET_Y - 14} L${NOZ_X},${JET_Y + 14} L540,${JET_Y + 34} L120,${JET_Y + 34} Z`} fill="#16224a" stroke="#cfe3ff" strokeOpacity={0.85} strokeWidth={4} strokeLinejoin="round" />
            <path d={`M120,${JET_Y - 24} L540,${JET_Y - 24} L${NOZ_X},${JET_Y - 7} L${NOZ_X},${JET_Y + 7} L540,${JET_Y + 24} L120,${JET_Y + 24} Z`} fill={C.cyan} opacity={0.12} />
            {[-0.8, -0.3, 0.3, 0.8].map((f, i) => (
              <Streamline key={i} pts={jetLane(f)} gain={JET_GAIN} speed={150} n={9} seed={i * 1.7} color={C.cyan} line={0.12} opacity={gasOn} />
            ))}
            {/* daerah tekanan rendah di ujung kapiler */}
            <ellipse cx={CAP_X} cy={JET_Y + 6} rx={70} ry={40} fill="url(#soft-press)" opacity={0.2 + 0.7 * lowLbl} />
            {/* gelas sampel */}
            <ellipse cx={690} cy={872} rx={160} ry={10} fill="#000" opacity={0.3} />
            <Water x={566} y={SURF} w={248} h={858 - SURF} seed={6} amp={2.5} bubbles={3} />
            <path d="M560,690 L560,864 L820,864 L820,690" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
            {/* kapiler + kolom larutan */}
            <rect x={CAP_X - 6} y={front} width={12} height={Math.max(0, SURF + 20 - front)} fill={C.water} opacity={0.85} />
            <path d={`M${CAP_X - 6},${front + 4} Q${CAP_X},${front - 4} ${CAP_X + 6},${front + 4}`} fill="none" stroke="#e6f6ff" strokeWidth={2} opacity={0.4 + 0.6 * Math.sin(Math.PI * rise)} />
            {Array.from({length: 7}, (_, k) => {
              const ph = (((t * 0.9 + k / 7) % 1) + 1) % 1;
              const y = mix(SURF + 30, CAP_TOP, ph);
              return <circle key={k} cx={CAP_X} cy={y} r={2.2} fill="#fff" opacity={flowing * cyc(ph)} />;
            })}
            <rect x={CAP_X - 11} y={CAP_TOP} width={5} height={SURF + 60 - CAP_TOP} fill="#cfe3ff" fillOpacity={0.5} />
            <rect x={CAP_X + 6} y={CAP_TOP} width={5} height={SURF + 60 - CAP_TOP} fill="#cfe3ff" fillOpacity={0.5} />
            {/* udara luar menekan permukaan sampel */}
            <g opacity={pumpLbl}>
              {[600, 640, 750, 790].map((x, i) => (
                <PressureArrow key={i} x={x} y={SURF - 4} nx={0} ny={-1} L={56} width={4} />
              ))}
            </g>
            {/* pecahan cairan → butiran */}
            <g opacity={drops}>
              <path d={`M${CAP_X - 6},${CAP_TOP + 2} Q${CAP_X + 10},${JET_Y + 4 + 3 * Math.sin(t * 13)} ${CAP_X + 40},${JET_Y + 6 + 4 * Math.sin(t * 9)}`} fill="none" stroke={C.water} strokeWidth={6} strokeLinecap="round" />
              {Array.from({length: 46}, (_, k) => {
                const ph = (((t * 0.75 + k / 46) % 1) + 1) % 1;
                const x = CAP_X + 40 + ph * 640 + 30 * ph * Math.sin(k * 1.3);
                const y = JET_Y + 6 + (rand(k * 2.3) - 0.5) * (14 + ph * 170) + 6 * Math.sin(t * 3 + k);
                const r = 1.2 + 6 * Math.pow(1 - ph, 2.2);
                return <circle key={k} cx={x} cy={y} r={r} fill="#dff3ff" opacity={0.9 * cyc(ph)} />;
              })}
              <ellipse cx={1180} cy={JET_Y + 10} rx={170} ry={90} fill="url(#soft-white)" opacity={0.35} />
            </g>
          <Ripple x={CAP_X} y={CAP_TOP} p={ramp(t, cueEnd(3) - 0.1, cueEnd(3) + 1.2, (q) => q)} r={110} color="water" />
          <Twinkles x={1140} y={JET_Y + 20} rx={160} ry={70} n={5} opacity={fineLbl} seed={6} />
          {/* label */}
          <g opacity={clIn}>
            <Label x={200} y={JET_Y - 70} size={26} color={C.cyan} anchor="start" weight={600}>
              gas (udara bertekanan)
            </Label>
          </g>
          <g opacity={fastLbl}>
            <Label x={880} y={JET_Y - 92} size={30} color={C.cyan} weight={700}>
              pancaran gas sangat cepat
            </Label>
          </g>
          <g opacity={capLbl}>
            <line x1={CAP_X + 14} y1={660} x2={880} y2={660} stroke={C.muted} strokeWidth={2} />
            <Label x={890} y={660} size={26} color={C.ink} anchor="start">
              pipa kapiler
            </Label>
            <Label x={830} y={810} size={24} color={C.muted} anchor="start">
              larutan sampel
            </Label>
          </g>
          <g opacity={lowLbl}>
            <Label x={CAP_X - 20} y={JET_Y + 70} size={28} color={C.press} anchor="end" weight={700}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan> rendah
            </Label>
          </g>
          <g opacity={pumpLbl}>
            <Label x={480} y={SURF - 50} size={26} color={C.press} anchor="end" weight={700}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan>
              <tspan baselineShift="sub" fontSize="0.65em">atm</tspan> mendorong naik
            </Label>
            <Label x={480} y={SURF - 14} size={24} color={C.muted} anchor="end">
              tanpa pompa
            </Label>
          </g>
          <g opacity={fineLbl}>
            <Label x={1180} y={JET_Y + 130} size={28} color="#e6f6ff" weight={700}>
              butiran sangat kecil
            </Label>
          </g>
          </g>
          <Motes x={800} y={560} rx={620} ry={280} n={14} color="cyan" opacity={0.3} seed={8} />
        </Stage>
        <Card x={1560} y={720} opacity={Math.min(1, fml * 1.4)} scale={0.94 + 0.06 * fml} accent={C.press} style={{padding: '18px 36px'}}>
          <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap'}}>
            <Tint c={C.press}>
              <V>p</V>
            </Tint>{' '}
            +{' '}
            <Tint c={C.kin}>
              <Frac n="1" d="2" size={0.6} />
              <V>ρv</V>²
            </Tint>{' '}
            = konstan
          </div>
          <div style={{fontSize: 24, color: C.muted, textAlign: 'center', marginTop: 6, fontFamily: FONT.sans}}>
            <Tint c={C.cyan}>v besar</Tint> di ujung kapiler → <Tint c={C.press}>p kecil</Tint>
          </div>
        </Card>
      </AbsoluteFill>

      {/* ===================== parfum & asma ===================== */}
      <AbsoluteFill style={{opacity: icIn}}>
        <Stage>
          {/* botol parfum */}
          <g opacity={Math.max(0.35, parfum)} transform="translate(500 650) scale(1.2) translate(-460 -650)">
            {(() => {
              const sq = 0.5 + 0.5 * Math.sin(t * 3.2);
              const puff = Math.max(0, Math.sin(t * 3.2));
              return (
                <g>
                  <ellipse cx={460} cy={842} rx={140} ry={10} fill="#000" opacity={0.3} />
                  <rect x={370} y={560} width={180} height={276} rx={34} fill="#c99be8" fillOpacity={0.18} stroke="#e6d2ff" strokeWidth={4} />
                  <Water x={378} y={650} w={164} h={178} color={C.spr} seed={2} amp={2} caustics={false} />
                  <rect x={446} y={520} width={28} height={44} rx={4} fill="#d9c7f0" />
                  <line x1={460} y1={530} x2={460} y2={820} stroke="#e6d2ff" strokeOpacity={0.7} strokeWidth={4} />
                  <rect x={430} y={500} width={60} height={26} rx={6} fill="#efe6ff" />
                  {/* bola pemompa */}
                  <path d={`M430,510 C380,510 340,505 300,500`} fill="none" stroke="#9fb0d8" strokeWidth={8} />
                  <ellipse cx={260} cy={500} rx={46 - 10 * sq} ry={40 + 4 * sq} fill="#e0607e" stroke="#ffb0c0" strokeWidth={2} />
                  <Stream pts={[[300, 500], [430, 510], [496, 512]]} color="cyan" n={6} speed={1.2} r={3} jitter={0} opacity={0.4 + 0.6 * puff} />
                  {Array.from({length: 26}, (_, k) => {
                    const ph = (((t * 0.9 + k / 26) % 1) + 1) % 1;
                    const x = 500 + ph * 300;
                    const y = 512 + (rand(k * 1.9) - 0.5) * ph * 160 - ph * 20;
                    return <circle key={k} cx={x} cy={y} r={1 + 4 * (1 - ph) ** 2} fill="#f0e2ff" opacity={0.85 * cyc(ph) * (0.5 + 0.5 * puff)} />;
                  })}
                  <Label x={460} y={460} size={28} color="#e6d2ff" weight={600}>
                    botol semprot parfum
                  </Label>
                </g>
              );
            })()}
          </g>
          {/* nebulizer jet untuk asma */}
          <g opacity={Math.max(0.35, asma)} transform="translate(1380 650) scale(1.2) translate(-1220 -650)">
            <ellipse cx={1240} cy={842} rx={260} ry={10} fill="#000" opacity={0.3} />
            <rect x={1000} y={720} width={190} height={116} rx={18} fill="#2a3a6e" stroke="#dfe7ff" strokeWidth={3} />
            {Array.from({length: 4}, (_, i) => (
              <line key={i} x1={1030 + i * 20} y1={746} x2={1030 + i * 20} y2={806} stroke="#9fb0d8" strokeWidth={4} strokeLinecap="round" />
            ))}
            <circle cx={1150} cy={776} r={16} fill="none" stroke={C.cyan} strokeWidth={3} />
            <path d="M1190,760 C1260,760 1290,760 1320,730" fill="none" stroke="#cfe3ff" strokeWidth={8} />
            <Stream pts={[[1192, 760], [1280, 758], [1320, 730], [1334, 700]]} color="cyan" n={6} speed={1.1} r={3} jitter={0} />
            <path d="M1300,640 L1370,640 L1360,730 L1310,730 Z" fill="#cfe3ff" fillOpacity={0.15} stroke="#dfe7ff" strokeWidth={3} />
            <Water x={1314} y={700} w={42} h={26} seed={4} amp={1.5} caustics={false} />
            <rect x={1325} y={560} width={20} height={82} fill="#cfe3ff" fillOpacity={0.2} stroke="#dfe7ff" strokeWidth={2} />
            <path d="M1300,560 C1290,500 1370,470 1420,500 L1440,560 Z" fill="#9fd8c8" fillOpacity={0.25} stroke="#dfe7ff" strokeWidth={3} />
            {Array.from({length: 18}, (_, k) => {
              const ph = (((t * 0.6 + k / 18) % 1) + 1) % 1;
              return <circle key={k} cx={1335 + (rand(k) - 0.5) * 20 + ph * 30 + 6 * Math.sin(t * 2 + k)} cy={690 - ph * 170} r={1.4 + 3 * (1 - ph)} fill="#e6f6ff" opacity={0.8 * cyc(ph)} />;
            })}
            <Label x={1240} y={460} size={28} color="#9fd8c8" weight={600}>
              nebulizer jet (asma)
            </Label>
          </g>
          <Twinkles x={960} y={600} rx={500} ry={200} n={5} opacity={asma} seed={3} />
          <Motes x={960} y={620} rx={700} ry={260} n={14} color="spr" opacity={0.3} seed={5} />
        </Stage>
        <Note x={960} y={270} p={ramp(t, cue(5) + 0.2, cue(5) + 1.0)} color={C.gold} size={28}>
          <div style={{textAlign: 'center'}}>
            Prinsip yang sama: <Tint c={C.cyan}>gas cepat</Tint> → <Tint c={C.press}>p rendah</Tint> → cairan terhisap & dikabutkan
          </div>
        </Note>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
