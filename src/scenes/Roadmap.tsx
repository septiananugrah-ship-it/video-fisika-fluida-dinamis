import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, smoothPath, win} from '../anim';
import {Pipe, Streamline} from '../components/flow';
import {wavePath} from '../components/fluid';
import {DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak
// (pipa Venturi dengan partikel + kolom tekanan, pembakar Bunsen yang menghisap udara,
// dua kapal berpapasan dengan air yang mengalir deras di antaranya),
// dihubungkan oleh lintasan aliran tempat sebutir cahaya merambat.
const PARTS = [
  {
    n: '1',
    title: 'Konsep & cara berpikir',
    color: C.cyan,
    hue: 'cyan' as Hue,
    items: ['Fluida ideal', 'Garis arus', 'Debit', 'Kontinuitas', 'Bernoulli', 'Torricelli', 'Gaya angkat', 'Kekentalan'],
  },
  {n: '2', title: 'Fluida di lab kimia', color: C.spr, hue: 'spr' as Hue, items: ['Pompa vakum air', 'Pembakar Bunsen', 'Nebulizer', 'Viskometer']},
  {n: '3', title: 'Penerapan', color: C.work, hue: 'work' as Hue, items: ['Pembuluh darah', 'Kapal berpapasan', 'Atap terangkat badai']},
];
const KEYS = [
  ['ideal', 'garis', 'debit', 'kontinuitas', 'bernoulli', 'torricelli', 'angkat', 'kekentalan'],
  ['pompa', 'bunsen', 'nebulizer', 'viskometer'],
  ['darah', 'kapal', 'atap'],
];
const CX = [380, 960, 1540];
const TOP = 196;
const CW = 500;
const CH = 600;
const PY = TOP + CH + 40;
const ICON_Y = TOP + 200;

const X0P = CX[0] - 200;
const X1P = CX[2] + 200;
const PTS: [number, number][] = Array.from({length: 61}, (_, i) => {
  const u = i / 60;
  const x = X0P + (X1P - X0P) * u;
  const y = PY + 9 * (1 - Math.cos(((x - CX[0]) / (CX[1] - CX[0])) * Math.PI * 2)) * (x > CX[0] && x < CX[2] ? 1 : 0.3);
  return [x, y];
});
const PTS_D = smoothPath(PTS);
const UX = CX.map((x) => (x - X0P) / (X1P - X0P));

const fr = (v: number) => ((v % 1) + 1) % 1;

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // pipa Venturi: partikel melaju di bagian sempit, kolom tekanan lebih rendah di sana
    const yc = y + 40;
    const knots: [number, number][] = [
      [x - 190, 40],
      [x - 70, 40],
      [x, 18],
      [x + 70, 40],
      [x + 190, 40],
    ];
    const cols = [
      {px: x - 120, r: 40, h: 88},
      {px: x, r: 18, h: 44},
      {px: x + 120, r: 40, h: 88},
    ];
    return (
      <g>
        <Glow x={x} y={y} r={160} color="cyan" opacity={0.25 + 0.3 * act} />
        {cols.map((c, k) => {
          const base = yc - c.r;
          const top = base - c.h - 4 * Math.sin(t * 2 + k);
          return (
            <g key={k}>
              <rect x={c.px - 11} y={yc - 150} width={22} height={150 - c.r + 2} fill="#0a1230" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} />
              <rect x={c.px - 8} y={top} width={16} height={base - top + 2} fill={k === 1 ? C.press : C.water} opacity={0.75} />
              <ellipse cx={c.px} cy={top} rx={8} ry={2.5} fill="#e0f4ff" opacity={0.7} />
            </g>
          );
        })}
        <Pipe x0={x - 190} x1={x + 190} yc={yc} knots={knots} v0={70} lanes={5} perLane={4} lines={0.3} seed={3} />
      </g>
    );
  }
  if (i === 1) {
    // pembakar Bunsen: gas naik, udara terhisap lewat lubang cincin, nyala biru berkedip
    const bx = x + 10;
    const top = y - 4;
    const fl = 1 + 0.07 * Math.sin(t * 13) + 0.05 * Math.sin(t * 7.3 + 1);
    return (
      <g>
        <Glow x={x} y={y - 40} r={160} color="spr" opacity={0.25 + 0.3 * act} />
        <Glow x={bx} y={top - 50} r={90} color="cyan" opacity={0.5} />
        {/* nyala: kerucut luar & kerucut dalam biru */}
        <path d={`M${bx - 16},${top} Q${bx - 22},${top - 48 * fl} ${bx + 2 * Math.sin(t * 9)},${top - 95 * fl} Q${bx + 22},${top - 48 * fl} ${bx + 16},${top} Z`} fill="#6fb6ff" opacity={0.45} />
        <path d={`M${bx - 11},${top} Q${bx - 12},${top - 34} ${bx},${top - 58 * fl} Q${bx + 12},${top - 34} ${bx + 11},${top} Z`} fill="#4a7bff" opacity={0.9} />
        <path d={`M${bx - 5},${top} Q${bx - 5},${top - 16} ${bx},${top - 28 * fl} Q${bx + 5},${top - 16} ${bx + 5},${top} Z`} fill="#bfe6ff" opacity={0.85} />
        {/* tabung */}
        <rect x={bx - 15} y={top} width={30} height={100} rx={3} fill="#7d89ad" stroke="#c9d3ee" strokeWidth={2} />
        <rect x={bx - 11} y={top + 4} width={6} height={92} rx={3} fill="#fff" opacity={0.25} />
        {/* cincin udara */}
        <rect x={bx - 20} y={top + 50} width={40} height={24} rx={4} fill="#5b6585" stroke="#c9d3ee" strokeWidth={2} />
        <rect x={bx - 6} y={top + 56} width={12} height={12} rx={2} fill="#0a1230" />
        {/* alas & selang gas */}
        <rect x={bx - 56} y={top + 100} width={112} height={18} rx={6} fill="#5b6585" stroke="#c9d3ee" strokeWidth={2} />
        <path d={`M${bx - 15},${top + 90} Q${bx - 90},${top + 90} ${bx - 125},${top + 112}`} fill="none" stroke="#c9584f" strokeWidth={9} strokeLinecap="round" />
        {/* udara terhisap ke lubang cincin */}
        {[-1, 1].map((s) => (
          <Stream
            key={s}
            pts={[
              [bx + s * 120, top + 40],
              [bx + s * 60, top + 56],
              [bx + s * 10, top + 62],
            ]}
            color="cyan"
            n={4}
            speed={0.9}
            r={3.5}
            jitter={2}
            seed={s + 2}
          />
        ))}
        {/* campuran gas naik di dalam tabung */}
        {Array.from({length: 5}, (_, k) => {
          const ph = fr(t * 1.4 + k / 5);
          return <circle key={k} cx={bx + 4 * Math.sin(k * 2 + t * 3)} cy={top + 80 - ph * 80} r={2.5} fill="#fff" opacity={0.75 * cyc(ph)} />;
        })}
      </g>
    );
  }
  // dua kapal berpapasan (tampak atas): air di celah melaju lebih cepat
  const gapY = y + 4;
  const lean = 1.5 * Math.sin(t * 0.9);
  const lanes = [-90, -58, -12, 0, 12, 58, 90];
  return (
    <g>
      <Glow x={x} y={y} r={160} color="work" opacity={0.25 + 0.3 * act} />
      <rect x={x - 200} y={y - 105} width={400} height={210} rx={18} fill={C.water} opacity={0.14} />
      <path d={wavePath(x - 200, x + 200, y - 103, t, 2, 0.06, 1)} fill="none" stroke="#cfeaff" strokeOpacity={0.4} strokeWidth={2} />
      {lanes.map((dy, k) => {
        const inner = Math.abs(dy) < 20;
        return (
          <Streamline
            key={k}
            pts={[
              [x - 200, gapY + dy * (inner ? 1.8 : 1)],
              [x - 80, gapY + dy],
              [x + 80, gapY + dy],
              [x + 200, gapY + dy * (inner ? 1.8 : 1)],
            ]}
            gain={inner ? [1, 2.2, 2.2, 1] : [1, 0.9, 0.9, 1]}
            speed={70}
            n={4}
            color={inner ? 'cyan' : '#dff3ff'}
            line={0.2}
            seed={k * 2}
          />
        );
      })}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${x + 6 * Math.sin(t * 0.6 + s)} ${gapY + s * 36}) rotate(${-s * lean})`}>
          <path d="M-120,-15 L80,-15 Q125,-12 140,0 Q125,12 80,15 L-120,15 Q-128,0 -120,-15 Z" fill="#3b4a72" stroke="#a9b6d6" strokeWidth={2} />
          <rect x={-70} y={-9} width={70} height={18} rx={4} fill="#d7deef" opacity={0.85} />
          {[-110, -100].map((wx) => (
            <path key={wx} d={`M${wx},${-14 * s} q-20,${-8 * s} -40,${-4 * s}`} fill="none" stroke="#cfeaff" strokeWidth={1.5} opacity={0.4} />
          ))}
        </g>
      ))}
      {/* tarikan ke arah celah */}
      {[-1, 1].map((s) => (
        <path key={`a${s}`} d={`M${x - 20},${gapY + s * 86} L${x - 20},${gapY + s * 62} M${x - 27},${gapY + s * 70} L${x - 20},${gapY + s * 62} L${x - 13},${gapY + s * 70}`} fill="none" stroke={C.press} strokeWidth={3} strokeLinecap="round" opacity={0.5 + 0.4 * Math.sin(t * 3)} />
      ))}
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, dur, wordOf} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  const act = [win(t, cue(1) - 0.2, cue(2) - 0.3, 0.6, 0.8), win(t, cue(2) - 0.2, cue(3) - 0.3, 0.6, 0.8), win(t, cue(3) - 0.2, dur, 0.6, 0.8)];
  const pathP =
    UX[0] * ramp(t, 0.6, cue(1), EASE_IN_OUT) +
    (UX[1] - UX[0]) * ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT) +
    (UX[2] - UX[1]) * ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT) +
    (1 - UX[2]) * ramp(t, cue(3) + 0.6, cue(3) + 2.2, EASE_IN_OUT);
  const [lx, ly] = pointAlong(PTS, pathP);
  const lead: [number, number][] = [1, 2, 3, 4, 5].map((k) => pointAlong(PTS, Math.max(0, pathP - k * 0.008)));
  const loop = ramp(t, cue(3) + 1.6, cue(3) + 2.6);
  const ghost = win(t, 0.4, cue(3) + 0.6, 0.8, 0.8);
  const itemAt = (i: number, k: number) => wordOf(i + 1, KEYS[i][k]) - 0.15;
  const dyn = ramp(t, wordOf(0, 'dinamis') - 0.2, wordOf(0, 'dinamis') + 0.6);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.cyan, opacity: 0.5 + 0.5 * dyn}}>fluida yang mengalir</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="cyan" opacity={0.4} seed={11} />
        {/* garis arus samar di latar yang terus mengalir */}
        {[250, 520, 790].map((y, k) => (
          <Streamline
            key={k}
            pts={Array.from({length: 25}, (_, i) => [-40 + i * 84, y + 26 * Math.sin(i * 0.5 + k * 1.7)] as [number, number])}
            speed={90}
            n={8}
            color="#9fd8ff"
            line={0.08}
            seed={k * 3}
            opacity={0.45 * head}
          />
        ))}
        {PARTS.map((p, i) => (
          <rect
            key={`gh${i}`}
            x={CX[i] - CW / 2}
            y={TOP}
            width={CW}
            height={CH}
            rx={24}
            fill="none"
            stroke={p.color}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={ghost * (1 - Math.min(1, ps[i]))}
          />
        ))}
        {PARTS.map((p, i) => (
          <Glow key={`gl${i}`} x={CX[i]} y={TOP + CH / 2} r={420} color={p.hue} opacity={0.35 * act[i]} />
        ))}
        <path d={PTS_D} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" opacity={head} />
        <DrawPath d={PTS_D} p={pathP} stroke="cyan" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="cyan" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="cyan" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
        {PARTS.map((p, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Ripple x={CX[i]} y={PY} p={ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 1.4, (x) => x)} r={90} color={p.hue} />
            <circle cx={CX[i]} cy={PY} r={20 + 4 * Math.sin(t * 2.4 + i)} fill={`url(#soft-${p.hue})`} />
            <circle cx={CX[i]} cy={PY} r={11} fill={p.color} />
            <circle cx={CX[i]} cy={PY} r={4.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
      </Stage>
      {PARTS.map((p, i) => {
        const q0 = Math.min(1, ps[i]);
        return (
          <div
            key={p.n}
            style={{
              position: 'absolute',
              left: CX[i] - CW / 2,
              top: TOP,
              width: CW,
              height: CH,
              borderRadius: 24,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
              border: `1.5px solid ${p.color}55`,
              borderTop: `8px solid ${p.color}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + 40 * act[i]}px ${p.color}${Math.round(0x22 + 0x30 * act[i]).toString(16).padStart(2, '0')}`,
              opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * q0),
              translate: `0px ${(1 - q0) * 40 - 6 * act[i]}px`,
              scale: String(0.9 + 0.1 * ps[i]),
              fontFamily: FONT.head,
              color: C.ink,
              padding: '22px 34px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(105deg, transparent ${-40 + 150 * q0 - 16}%, rgba(220,240,255,0.12) ${-40 + 150 * q0}%, transparent ${-40 + 150 * q0 + 16}%)`,
              }}
            />
            <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
            <div style={{fontSize: 36, fontWeight: 700, marginTop: 4, letterSpacing: -0.5}}>{p.title}</div>
            <div style={{height: 206}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: i === 0 ? 24 : 27, color: C.muted, lineHeight: i === 0 ? 1.34 : 1.62, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
                    <span style={{color: p.color, marginRight: 8}}>—</span>
                    {it}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <g transform={`translate(${CX[i]} ${ICON_Y}) scale(0.84) translate(${-CX[i]} ${-ICON_Y})`}>
              <Icon i={i} x={CX[i]} y={ICON_Y} t={t} act={act[i]} />
            </g>
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
