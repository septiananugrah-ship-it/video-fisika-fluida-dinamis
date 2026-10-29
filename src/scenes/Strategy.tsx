import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Streamline} from '../components/flow';
import {Card, Frac, Glow, Label, Motes, Ripple, Spark, Stage, Sub, Sup, Tint, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Cara berpikir: 4 langkah (daftar centang) + gedung mini yang menyala per langkah;
// lalu contoh: pipa lantai dasar v₁ = 2 m/s, p₁ = 150 kPa, naik 5 m ke lantai 2, luas ½ → v₂ = 4 m/s;
// p₂ = 150 000 − ½·1000·(16 − 4) − 1000·10·5 = 150 000 − 6000 − 50 000 = 94 000 Pa (AUDIT).

const STEPS: React.ReactNode[] = [
  <>
    Pilih 2 titik pada garis arus yang sama + acuan <i>h</i> = 0
  </>,
  <>
    Kecepatan → kontinuitas <i>A</i>₁<i>v</i>₁ = <i>A</i>₂<i>v</i>₂
  </>,
  <>Tekanan → Bernoulli</>,
  <>
    Periksa satuan: cm² → m², L/s → m³/s
  </>,
];
const ROW0 = 290;
const LIST_X = 150;
const RAIL_X = 118;

// ---------- gedung & pipa (koordinat ukuran penuh) ----------
const Y1 = 760; // sumbu pipa lantai dasar (acuan h = 0)
const Y2 = 340; // sumbu pipa lantai 2 (5 m di atasnya → 84 px/m)
const XR = 560; // pipa naik
const XRED = 640; // pengecil
const R1 = 30;
const R2 = 21; // luas ½ → r/√2
const P1X = 300;
const P2X = 780;

const lanePts = (o: number): [number, number][] => [
  [120, Y1 + o],
  [XR + o, Y1 + o],
  [XR + o, Y2 + o],
  [XRED - 20, Y2 + o],
  [XRED + 20, Y2 + o * (R2 / R1)],
  [890, Y2 + o * (R2 / R1)],
];
const LANE_GAIN = [1, 1, 1, 1, 2, 2];

const Gauge: React.FC<{x: number; y: number; px: number; py: number; val: number; t: number; label: React.ReactNode; read: string; op?: number}> = ({x, y, px, py, val, t, label, read, op = 1}) => {
  if (op <= 0.001) return null;
  const ang = (-120 + (val / 200) * 240 + 0.6 * Math.sin(t * 7 + x)) * (Math.PI / 180);
  return (
    <g opacity={op}>
      <line x1={px} y1={py} x2={x} y2={y + 46} stroke="#9fb0d8" strokeWidth={8} />
      <circle cx={x} cy={y} r={48} fill="#0f1838" stroke="#dfe7ff" strokeWidth={4} />
      {Array.from({length: 9}, (_, i) => {
        const a = ((-120 + i * 30) * Math.PI) / 180;
        return <line key={i} x1={x + 34 * Math.sin(a)} y1={y - 34 * Math.cos(a)} x2={x + 42 * Math.sin(a)} y2={y - 42 * Math.cos(a)} stroke={C.muted} strokeWidth={2} />;
      })}
      <path d={`M${x + 40 * Math.sin((60 * Math.PI) / 180)},${y - 40 * Math.cos((60 * Math.PI) / 180)} A40,40 0 0 1 ${x + 40 * Math.sin((120 * Math.PI) / 180)},${y - 40 * Math.cos((120 * Math.PI) / 180)}`} fill="none" stroke={C.press} strokeWidth={4} />
      <line x1={x} y1={y} x2={x + 36 * Math.sin(ang)} y2={y - 36 * Math.cos(ang)} stroke={C.press} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={6} fill={C.press} />
      <Label x={x + 62} y={y - 16} size={30} color={C.press} anchor="start" weight={700}>
        {read}
      </Label>
      <Label x={x + 62} y={y + 20} size={24} color={C.muted} anchor="start">
        {label}
      </Label>
    </g>
  );
};

const Grow: React.FC<{p: number; h: number; children: React.ReactNode}> = ({p, h, children}) => (
  <div style={{opacity: p, maxHeight: p < 0.999 ? p * h : undefined, overflow: p < 0.999 ? 'hidden' : undefined}}>{children}</div>
);

export const Strategy: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- daftar langkah ----------
  const s3 = wordOf(2, 'ketiga');
  const starts = [cue(1), cue(2), s3, cue(3)];
  const ends = [cueEnd(1), s3 - 0.3, cueEnd(2), cueEnd(3)];
  const listOut = 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.2, EASE_IN_OUT);
  const head = ramp(t, cue(0) + 0.2, cue(0) + 1.0);
  const rows = STEPS.map((_, i) => ({
    p: ramp(t, starts[i] - 0.1, starts[i] + 0.6),
    tick: ramp(t, ends[i] - 0.4, ends[i] + 0.3),
    act: win(t, starts[i] - 0.1, ends[i] + 0.3, 0.4, 0.6),
    y: ROW0 + i * 112 + 40,
  }));
  const railPos = [1, 2, 3].reduce((s, i) => s + ramp(t, starts[i] - 0.3, starts[i] + 0.5, EASE_IN_OUT), 0);
  const railPrev = [1, 2, 3].reduce((s, i) => s + ramp(t - 0.05, starts[i] - 0.3, starts[i] + 0.5, EASE_IN_OUT), 0);
  const railVel = Math.min(1, (railPos - railPrev) / 0.05 / 1.5);
  const railY = ROW0 + 40 + railPos * 112;

  // ---------- gedung: mini → penuh ----------
  const big = ramp(t, cue(4) - 0.6, cue(4) + 0.9, EASE_IN_OUT);
  const sc = mix(0.6, 1, big);
  const tx = mix(1250, 0, big);
  const ty = mix(190, 0, big);
  const bIn = ramp(t, cue(0) + 0.4, cue(0) + 1.4);
  const pts12 = Math.max(rows[0].p, big);
  const vArr = Math.max(rows[1].p, ramp(t, cue(5) + 0.4, cue(5) + 1.2));
  const gauges = Math.max(rows[2].p, ramp(t, cue(4) + 0.6, cue(4) + 1.4));
  const units = win(t, cue(3), cue(4) - 0.6, 0.5, 0.5);

  // ---------- soal ----------
  const given = ramp(t, cue(4) + 0.6, cue(4) + 1.4);
  const given2 = ramp(t, wordOf(5, 'lima') - 0.2, wordOf(5, 'lima') + 0.6);
  const hDim = ramp(t, wordOf(5, 'lima') - 0.3, wordOf(5, 'lima') + 0.5);
  const r0 = ramp(t, wordOf(5, 'empat') - 0.5, wordOf(5, 'empat') + 0.4);
  const r1 = ramp(t, cue(6) - 0.2, cue(6) + 0.6);
  const tA = wordOf(6, 'seratus');
  const tB = wordOf(6, 'enam');
  const tC = wordOf(6, 'lima', 1);
  const r2 = ramp(t, tA - 0.2, tA + 0.5);
  const pB = ramp(t, tB - 0.2, tB + 0.5);
  const pC = ramp(t, tC - 0.2, tC + 0.5);
  const r3 = ramp(t, cue(7) - 0.2, cue(7) + 0.6);
  const hiK = win(t, tB - 0.2, tC - 0.2, 0.4, 0.4) + win(t, wordOf(7, 'dipercepat') - 0.2, wordOf(7, 'diangkat') - 0.2, 0.3, 0.3);
  const hiU = win(t, tC - 0.2, cue(7) - 0.2, 0.4, 0.4) + win(t, wordOf(7, 'diangkat') - 0.2, cueEnd(7) + 0.4, 0.3, 0.5);
  const p2val = 150 - 6 * pB - 50 * pC;
  const read2 = r1 > 0.01 ? `${Math.round(p2val)} kPa` : '? kPa';
  const done = ramp(t, wordOf(7, 'sembilan') - 0.2, wordOf(7, 'sembilan') + 0.8);
  const barIn = ramp(t, cue(6) + 0.2, cue(6) + 1.0);

  const lanes = [-0.6, 0, 0.6];
  const speed = 95;

  const building = (
    <g>
      {/* gedung */}
      <rect x={100} y={196} width={820} height={624} rx={6} fill="#0d1636" fillOpacity={0.55} stroke={C.line} strokeWidth={3} />
      {[800, 590, 380].map((y, i) => (
        <g key={y}>
          <rect x={100} y={y} width={820} height={16} fill="#24325e" />
          <Label x={120} y={y - 24} size={24} color={C.muted} anchor="start">
            {['lantai dasar', 'lantai 1', 'lantai 2'][i]}
          </Label>
        </g>
      ))}
      {/* acuan h = 0 */}
      <g opacity={pts12}>
        <line x1={80} y1={Y1} x2={940} y2={Y1} stroke={C.gold} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="10 8" />
        <Label x={940} y={Y1 + 28} size={26} color={C.gold} anchor="end" font="serif" italic>
          h = 0
        </Label>
      </g>
      {/* pipa: dinding lalu isi */}
      <path d={`M110,${Y1} L${XR},${Y1} L${XR},${Y2} L${XRED},${Y2}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={2 * R1 + 10} strokeLinejoin="round" />
      <path d={`M${XRED - 20},${Y2 - R1 - 5} L${XRED + 20},${Y2 - R2 - 5} L${XRED + 20},${Y2 + R2 + 5} L${XRED - 20},${Y2 + R1 + 5} Z`} fill="#bfe3ff" fillOpacity={0.85} />
      <path d={`M${XRED},${Y2} L900,${Y2}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={2 * R2 + 10} />
      <path d={`M110,${Y1} L${XR},${Y1} L${XR},${Y2} L${XRED},${Y2}`} fill="none" stroke="#123a7a" strokeWidth={2 * R1} strokeLinejoin="round" />
      <path d={`M${XRED - 21},${Y2 - R1} L${XRED + 21},${Y2 - R2} L${XRED + 21},${Y2 + R2} L${XRED - 21},${Y2 + R1} Z`} fill="#123a7a" />
      <path d={`M${XRED},${Y2} L900,${Y2}`} fill="none" stroke="#123a7a" strokeWidth={2 * R2} />
      <path d={`M110,${Y1} L${XR},${Y1} L${XR},${Y2} L${XRED},${Y2}`} fill="none" stroke={C.water} strokeOpacity={0.35} strokeWidth={R1} strokeLinejoin="round" />
      <path d={`M${XRED},${Y2} L900,${Y2}`} fill="none" stroke={C.water} strokeOpacity={0.35} strokeWidth={R2} />
      {lanes.map((f, i) => (
        <Streamline key={i} pts={lanePts(f * R1)} gain={LANE_GAIN} speed={speed} n={9} seed={i * 2.3} line={0.12} color="#eaf8ff" />
      ))}
      <rect x={898} y={Y2 - R2 - 12} width={14} height={2 * R2 + 24} rx={4} fill="#9fb0d8" />
      <rect x={100} y={Y1 - R1 - 12} width={14} height={2 * R1 + 24} rx={4} fill="#9fb0d8" />
      {/* titik 1 & 2 */}
      <g opacity={pts12}>
        {[
          [P1X, Y1, '1'],
          [P2X, Y2, '2'],
        ].map(([x, y, n]) => (
          <g key={n as string}>
            <circle cx={x as number} cy={y as number} r={14 + 2 * Math.sin(t * 3)} fill="none" stroke={C.gold} strokeWidth={3.5} />
            <circle cx={x as number} cy={y as number} r={5} fill={C.gold} />
            <Label x={(x as number) - 34} y={(y as number) + 48} size={34} color={C.gold} weight={700} font="mono">
              {n}
            </Label>
          </g>
        ))}
      </g>
      {/* panah kecepatan */}
      <g opacity={vArr}>
        <line x1={P1X - 120} y1={Y1 + 64} x2={P1X - 20} y2={Y1 + 64} stroke={C.cyan} strokeWidth={5} markerEnd="url(#arrow-cyan)" />
        <Label x={P1X + 10} y={Y1 + 64} size={28} color={C.cyan} anchor="start" font="serif" italic>
          v<TSub>1</TSub> = 2 m/s
        </Label>
        <line x1={P2X - 180} y1={Y2 + 56} x2={P2X - 20} y2={Y2 + 56} stroke={C.cyan} strokeWidth={5} markerEnd="url(#arrow-cyan)" />
        <g opacity={r0}>
          <Label x={P2X} y={Y2 + 56} size={28} color={C.cyan} anchor="start" font="serif" italic>
            v<TSub>2</TSub> = 4 m/s
          </Label>
        </g>
      </g>
      {/* tinggi 5 m */}
      <g opacity={hDim}>
        <line x1={XR + 90} y1={Y1 - 6} x2={XR + 90} y2={Y2 + R2 + 40} stroke={C.pot} strokeWidth={3.5} markerEnd="url(#arrow-pot)" markerStart="url(#arrow-pot)" />
        <Label x={XR + 110} y={(Y1 + Y2) / 2 + 30} size={32} color={C.pot} anchor="start" font="serif" italic weight={600}>
          h = 5 m
        </Label>
        <Label x={XRED + 30} y={Y2 - R2 - 34} size={24} color={C.water} anchor="start">
          luas ½
        </Label>
      </g>
      {/* pengukur tekanan */}
      <Gauge x={P1X} y={Y1 - 150} px={P1X} py={Y1 - R1} val={150} t={t} label="p₁" read="150 kPa" op={gauges} />
      <Gauge x={P2X - 40} y={Y2 - 128} px={P2X - 40} py={Y2 - R2} val={r1 > 0 ? p2val : 150} t={t} label="p₂" read={read2} op={gauges} />
      {/* sorotan suku */}
      <Glow x={XRED + 60} y={Y2} r={150} color="kin" opacity={0.8 * Math.min(1, hiK)} />
      <Glow x={XR} y={(Y1 + Y2) / 2} r={200} color="pot" opacity={0.7 * Math.min(1, hiU)} />
      <g opacity={Math.min(1, hiK)}>
        <Label x={XRED + 150} y={Y2 + 150} size={26} color={C.kin} anchor="start" weight={700}>
          dipercepat
        </Label>
      </g>
      <g opacity={Math.min(1, hiU)}>
        <Label x={XR - 30} y={(Y1 + Y2) / 2 - 40} size={26} color={C.pot} anchor="end" weight={700}>
          diangkat
        </Label>
      </g>
      <Ripple x={P2X - 40} y={Y2 - 128} p={ramp(t, wordOf(7, 'sembilan') - 0.1, wordOf(7, 'sembilan') + 1.4, (q) => q)} r={130} color="press" />
    </g>
  );

  return (
    <AbsoluteFill>
      {/* ===== gedung (mini di fase daftar, penuh di fase soal) ===== */}
      <AbsoluteFill style={{opacity: bIn}}>
        <Stage>
          <g transform={`translate(${tx} ${ty}) scale(${sc})`}>{building}</g>
          <g opacity={units}>
            <Label x={1540} y={790} size={28} color={C.gold} weight={600} font="mono">
              2 cm² = 2×10⁻⁴ m²
            </Label>
            <Label x={1540} y={836} size={28} color={C.gold} weight={600} font="mono">
              0,5 L/s = 5×10⁻⁴ m³/s
            </Label>
          </g>
          <Motes x={1500} y={500} rx={340} ry={300} n={14} color="cyan" opacity={0.3 * (1 - big)} seed={3} />
        </Stage>
      </AbsoluteFill>

      {/* ===== daftar langkah ===== */}
      <AbsoluteFill style={{opacity: listOut}}>
        <Stage>
          <g opacity={rows[0].p}>
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={ROW0 + 40 + 3 * 112} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={railY} stroke={C.cyan} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
            {rows.map((r, i) => (
              <g key={i} opacity={Math.max(0.3, r.p)}>
                <circle cx={RAIL_X} cy={r.y} r={11} fill={C.bg} stroke={C.cyan} strokeWidth={3} />
                <circle cx={RAIL_X} cy={r.y} r={6 * r.tick} fill={C.cyan} />
                <Ripple x={LIST_X + 60} y={r.y} p={ramp(t, ends[i] - 0.1, ends[i] + 1.1, (q) => q)} r={70} color="cyan" rings={2} />
              </g>
            ))}
            <Spark x={RAIL_X} y={railY} r={7} color="cyan" trail={[1, 2, 3, 4, 5].map((k) => [RAIL_X, railY - k * 9 * railVel] as [number, number])} />
          </g>
        </Stage>
        <div style={{position: 'absolute', left: LIST_X + 24, top: 200, opacity: head, fontFamily: FONT.head, fontSize: 26, letterSpacing: 6, color: C.cyan, fontWeight: 600}}>
          URUTAN BERPIKIR · SOAL FLUIDA DINAMIS
        </div>
        {STEPS.map((s, i) => {
          const {p, tick, act} = rows[i];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: LIST_X,
                top: ROW0 + i * 112,
                width: 960,
                height: 80,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                opacity: p,
                translate: `${(1 - p) * 30}px 0px`,
                scale: String(1 + 0.015 * act),
                fontFamily: FONT.head,
                fontSize: 32,
                fontWeight: 500,
                color: C.ink,
                padding: '0 24px',
                borderRadius: 16,
                background: `linear-gradient(90deg, rgba(20,34,72,${0.85 + 0.1 * act}), rgba(14,22,50,0.85))`,
                border: `1.5px solid ${interpolateColors(act, [0, 1], [C.line, C.cyan])}`,
                boxShadow: `0 0 ${28 * act}px rgba(79,214,255,${0.28 * act})`,
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: `2.5px solid ${C.cyan}`,
                  background: `rgba(79,214,255,${0.15 * tick})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 24,
                  color: C.cyan,
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <span style={{opacity: 1 - tick}}>{i + 1}</span>
                <svg width={48} height={48} viewBox="0 0 48 48" style={{position: 'absolute', left: -2.5, top: -2.5}}>
                  <path d="M12,25 L21,34 L37,15" fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - tick)} />
                </svg>
              </div>
              <span>{s}</span>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* ===== soal: kartu & neraca tekanan ===== */}
      <AbsoluteFill>
        <Card x={1400} y={232} opacity={given} accent={C.cyan} style={{padding: '12px 28px'}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, lineHeight: 1.45, textAlign: 'center'}}>
            <V color={C.cyan}>v</V>
            <Sub>1</Sub> = 2 m/s · <V color={C.press}>p</V>
            <Sub>1</Sub> = 150 kPa
            <Grow p={given2} h={50}>
              <V color={C.pot}>h</V> = 5 m · <V>A</V>
              <Sub>2</Sub> = ½ <V>A</V>
              <Sub>1</Sub> · <Tint c={C.gold}><V>p</V><Sub>2</Sub> = ?</Tint>
            </Grow>
          </div>
        </Card>
        <Card x={1400} y={540} opacity={Math.min(1, r0 * 1.4)} accent={C.press} style={{padding: '18px 40px'}}>
          <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.36, textAlign: 'center', whiteSpace: 'nowrap'}}>
            <div style={{fontSize: 46}}>
              <Tint c={C.cyan}>
                <V>v</V>
                <Sub>2</Sub> = <V>v</V>
                <Sub>1</Sub>
              </Tint>{' '}
              <Frac n={<><V>A</V><Sub>1</Sub></>} d={<><V>A</V><Sub>2</Sub></>} /> = 2 · 2 = <Tint c={C.cyan}>4 m/s</Tint>
            </div>
            <Grow p={r1} h={86}>
              <Tint c={C.press}>
                <V>p</V>
                <Sub>2</Sub>
              </Tint>{' '}
              ={' '}
              <Tint c={C.press}>
                <V>p</V>
                <Sub>1</Sub>
              </Tint>{' '}
              −{' '}
              <span style={{color: C.kin, textShadow: `0 0 ${16 * Math.min(1, hiK)}px rgba(255,138,61,0.7)`}}>
                ½<V>ρ</V>(<V>v</V>
                <Sub>2</Sub>
                <Sup>2</Sup> − <V>v</V>
                <Sub>1</Sub>
                <Sup>2</Sup>)
              </span>{' '}
              − <span style={{color: C.pot, textShadow: `0 0 ${16 * Math.min(1, hiU)}px rgba(77,168,255,0.7)`}}><V>ρgh</V></span>
            </Grow>
            <Grow p={r2} h={86}>
              = <Tint c={C.press}>150 000</Tint> <span style={{opacity: pB, color: C.kin}}>− 6000</span> <span style={{opacity: pC, color: C.pot}}>− 50 000</span>
            </Grow>
            <Grow p={pB} h={40}>
              <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, lineHeight: 1.5}}>
                <span style={{color: C.kin}}>½·1000·(4² − 2²) = 6000</span> <span style={{opacity: pC}}>· <span style={{color: C.pot}}>1000·10·5 = 50 000</span></span>
              </div>
            </Grow>
            <Grow p={r3} h={86}>
              <span style={{color: C.gold, fontWeight: 600, textShadow: `0 0 ${18 * done}px rgba(255,201,74,0.5)`}}>= 94 000 Pa = 94 kPa</span>
            </Grow>
          </div>
        </Card>
        <Stage>
          {/* neraca tekanan: 150 kPa terbagi */}
          <g opacity={barIn}>
            {(() => {
              const x0 = 990;
              const W = 820;
              const y = 840;
              const k = W / 150;
              const wP = (150 - 6 * pB - 50 * pC) * k;
              const wK = 6 * pB * k;
              const wU = 50 * pC * k;
              return (
                <g>
                  <rect x={x0} y={y - 18} width={wP} height={36} rx={8} fill={C.press} opacity={0.85} />
                  <rect x={x0 + wP} y={y - 18} width={Math.max(0.1, wK)} height={36} fill={C.kin} />
                  <rect x={x0 + wP + wK} y={y - 18} width={Math.max(0.1, wU)} height={36} rx={8} fill={C.pot} opacity={0.9} />
                  <rect x={x0} y={y - 18} width={W} height={36} rx={8} fill="none" stroke={C.line} strokeWidth={2} />
                  <Label x={x0} y={y - 42} size={22} color={C.muted} anchor="start">
                    {`p₁ = 150 kPa dibagi:`}
                  </Label>
                  <Label x={x0 + wP / 2} y={y} size={22} color="#1a0b18" weight={700}>
                    {`p₂ ${Math.round(150 - 6 * pB - 50 * pC)}`}
                  </Label>
                  <g opacity={pB}>
                    <Label x={x0 + wP + wK / 2} y={y - 42} size={22} color={C.kin} weight={700}>
                      6
                    </Label>
                  </g>
                  <g opacity={pC}>
                    <Label x={x0 + wP + wK + wU / 2} y={y} size={22} color="#06142a" weight={700}>
                      50
                    </Label>
                  </g>
                  <Twinkles x={x0 + wP / 2} y={y} rx={120} ry={24} n={4} opacity={done} seed={5} />
                </g>
              );
            })()}
          </g>
          <Ripple x={1400} y={700} p={ramp(t, wordOf(7, 'sembilan') - 0.1, wordOf(7, 'sembilan') + 1.4, (q) => q)} r={240} color="gold" />
          <Motes x={1400} y={540} rx={420} ry={300} n={14} color="press" opacity={0.3 * big} seed={8} />
        </Stage>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
