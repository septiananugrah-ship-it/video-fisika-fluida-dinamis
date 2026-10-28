import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Pipe} from '../components/flow';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Enam kartu rangkuman, masing-masing dengan animasi mini yang terus berulang:
// debit · kontinuitas · Bernoulli · cepat → tekanan rendah · penerapan · kekentalan; lalu pertanyaan kunci.
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;
const GLASS = '#bfe3ff';

/** 01 · Debit: irisan air (volume) bergerak sepanjang pipa, Q = volume per waktu. */
const MiniDebit: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 2.4);
  const x = 50 + p * 190;
  return (
    <g>
      <rect x={10} y={14} width={290} height={38} fill={C.water} opacity={0.3} />
      <line x1={10} y1={14} x2={300} y2={14} stroke={GLASS} strokeWidth={2} opacity={0.75} />
      <line x1={10} y1={52} x2={300} y2={52} stroke={GLASS} strokeWidth={2} opacity={0.75} />
      <rect x={x} y={15} width={56} height={36} fill={C.water} opacity={0.55 * cyc(p) * 1.2} />
      <ellipse cx={x} cy={33} rx={7} ry={18} fill="none" stroke={C.water} strokeWidth={2} opacity={cyc(p) * 1.2} />
      <ellipse cx={x + 56} cy={33} rx={7} ry={18} fill="#9fd0ff" opacity={0.6 * cyc(p) * 1.2} />
      {Array.from({length: 7}, (_, k) => {
        const q = ph(t, 2.4, k * 0.34);
        return <circle key={k} cx={12 + q * 286} cy={22 + (k % 3) * 11} r={2.2} fill="#fff" opacity={cyc(q)} />;
      })}
      <line x1={x + 4} y1={6} x2={x + 52} y2={6} stroke={C.cyan} strokeWidth={2.5} markerEnd="url(#arrow-cyan)" opacity={cyc(p) * 1.2} />
      <text x={318} y={22} {...MONO} dominantBaseline="central">
        volume
      </text>
      <text x={318} y={44} {...MONO} dominantBaseline="central">
        per detik
      </text>
    </g>
  );
};

/** 02 · Kontinuitas: pipa menyempit, partikel mempercepat. */
const MiniCont: React.FC<{t: number}> = () => (
  <g>
    <Pipe
      x0={10}
      x1={310}
      yc={32}
      knots={[
        [10, 24],
        [110, 24],
        [170, 11],
        [230, 11],
        [300, 24],
        [310, 24],
      ]}
      v0={45}
      lanes={3}
      perLane={5}
      lines={0.4}
      wall="#bfe3ff"
      seed={2}
    />
    <text x={326} y={22} {...MONO} dominantBaseline="central" fill={C.cyan}>
      sempit →
    </text>
    <text x={326} y={44} {...MONO} dominantBaseline="central" fill={C.cyan}>
      cepat
    </text>
  </g>
);

/** 03 · Bernoulli: tiga batang energi per volume bertukar, jumlahnya tetap. */
const MiniBern: React.FC<{t: number}> = ({t}) => {
  const s = Math.sin(t * 1.3);
  const vals = [0.48 - 0.2 * s, 0.3 + 0.2 * s, 0.22];
  const cols = [C.press, C.kin, C.pot];
  let acc = 0;
  return (
    <g>
      {/* batang bertumpuk: total selalu sama */}
      {vals.map((v, i) => {
        const h = v * 56;
        const y = 60 - acc - h;
        acc += h;
        return <rect key={i} x={20} y={y} width={60} height={h} fill={cols[i]} opacity={0.85} />;
      })}
      <line x1={12} y1={4} x2={92} y2={4} stroke={C.ink} strokeDasharray="4 4" strokeWidth={1.5} />
      {vals.map((v, i) => (
        <rect key={`s${i}`} x={130 + i * 46} y={60 - v * 56} width={30} height={v * 56} rx={3} fill={cols[i]} opacity={0.85} />
      ))}
      <text x={276} y={14} {...MONO} dominantBaseline="central">
        jumlah tetap
      </text>
      <text x={276} y={36} {...MONO} dominantBaseline="central" fill={C.press}>
        p <tspan fill={C.kin}>½ρv²</tspan> <tspan fill={C.pot}>ρgh</tspan>
      </text>
    </g>
  );
};

/** 04 · Cepat → tekanan rendah: venturi dengan dua kolom tekanan. */
const MiniLowP: React.FC<{t: number}> = ({t}) => {
  const w = 1 + 0.04 * Math.sin(t * 3);
  return (
    <g>
      <Pipe
        x0={10}
        x1={300}
        yc={46}
        knots={[
          [10, 14],
          [100, 14],
          [150, 6],
          [200, 6],
          [270, 14],
          [300, 14],
        ]}
        v0={40}
        lanes={3}
        perLane={4}
        lines={0.3}
        seed={4}
      />
      {[
        {x: 60, h: 34 * w},
        {x: 175, h: 12 * w},
      ].map((c) => (
        <g key={c.x}>
          <rect x={c.x - 5} y={-2} width={10} height={(c.x === 60 ? 32 : 40) + 0} fill="#0d1838" stroke={GLASS} strokeOpacity={0.7} strokeWidth={1.5} />
          <rect x={c.x - 3} y={(c.x === 60 ? 30 : 38) - c.h} width={6} height={c.h} fill={C.press} opacity={0.85} />
        </g>
      ))}
      <text x={318} y={14} {...MONO} dominantBaseline="central" fill={C.cyan}>
        v besar →
      </text>
      <text x={318} y={38} {...MONO} dominantBaseline="central" fill={C.press}>
        p kecil
      </text>
    </g>
  );
};

/** 05 · Penerapan: sayap dengan garis arus atas lebih cepat + gaya angkat, dan semburan tangki. */
const MiniApps: React.FC<{t: number}> = ({t}) => {
  const wing = 'M20,44 C40,22 110,18 170,40 C120,44 60,48 20,44 Z';
  return (
    <g>
      {[0, 1].map((row) =>
        Array.from({length: 4}, (_, k) => {
          const q = ph(t, row === 0 ? 1.3 : 2.0, k / 4);
          const x = 4 + q * 190;
          const y = row === 0 ? 16 + 12 * Math.exp(-(((x - 90) / 60) ** 2)) * -0.6 : 56;
          return <circle key={`${row}-${k}`} cx={x} cy={y} r={2.4} fill={row === 0 ? C.cyan : '#cfeaff'} opacity={cyc(q)} />;
        }),
      )}
      <path d={wing} fill="#8fa0d0" stroke="#e8ecf5" strokeWidth={1.5} />
      <line x1={96} y1={30} x2={96} y2={4} stroke={C.force} strokeWidth={3} markerEnd="url(#arrow-force)" opacity={0.7 + 0.3 * Math.sin(t * 3)} />
      {/* tangki Torricelli */}
      <rect x={232} y={4} width={40} height={50} fill="none" stroke={GLASS} strokeWidth={1.5} opacity={0.7} />
      <rect x={233} y={14 + 2 * Math.sin(t)} width={38} height={39 - 2 * Math.sin(t)} fill={C.water} opacity={0.5} />
      {Array.from({length: 5}, (_, k) => {
        const q = ph(t, 0.9, k / 5);
        const s = q * 0.5;
        return <circle key={k} cx={272 + 70 * s * 2} cy={46 + 60 * s * s * 2} r={2.2} fill="#cfeaff" opacity={cyc(q)} />;
      })}
      <text x={340} y={14} {...MONO} dominantBaseline="central">
        sayap
      </text>
      <text x={340} y={36} {...MONO} dominantBaseline="central">
        Torricelli
      </text>
    </g>
  );
};

/** 06 · Kekentalan: jari-jari berdenyut, debit (batang) ∝ r⁴, profil parabola. */
const MiniVisc: React.FC<{t: number}> = ({t}) => {
  const u = 0.5 + 0.5 * Math.sin(t * 0.9);
  const r = 12 + 12 * u;
  const q = (r / 24) ** 4;
  return (
    <g>
      <rect x={10} y={32 - r} width={230} height={2 * r} fill={C.heat} opacity={0.15} />
      <line x1={10} y1={32 - r} x2={240} y2={32 - r} stroke={GLASS} strokeWidth={2} opacity={0.75} />
      <line x1={10} y1={32 + r} x2={240} y2={32 + r} stroke={GLASS} strokeWidth={2} opacity={0.75} />
      {[-0.66, 0, 0.66].map((f, j) =>
        Array.from({length: 3}, (_, k) => {
          const g = 1 - f * f;
          const qq = ph(t * (0.3 + 0.7 * g) * (r / 24) ** 2, 1.2, k / 3 + j * 0.2);
          return <circle key={`${j}-${k}`} cx={12 + qq * 226} cy={32 + f * r} r={2.2} fill="#fff" opacity={cyc(qq)} />;
        }),
      )}
      <path d={Array.from({length: 11}, (_, i) => {
        const f = -1 + i / 5;
        return `${i ? 'L' : 'M'}${(30 + (1 - f * f) * 30 * (r / 24) ** 2).toFixed(1)},${(32 + f * r).toFixed(1)}`;
      }).join(' ')} fill="none" stroke={C.cyan} strokeWidth={2} />
      <rect x={262} y={4} width={22} height={56} rx={4} fill={C.water} opacity={0.12} stroke={C.water} strokeOpacity={0.5} />
      <rect x={264} y={58 - 52 * q} width={18} height={52 * q} rx={3} fill={C.water} opacity={0.85} />
      <text x={300} y={20} {...MONO} dominantBaseline="central">
        r ÷ 2 →
      </text>
      <text x={300} y={42} {...MONO} dominantBaseline="central" fill={C.water}>
        Q ÷ 16
      </text>
    </g>
  );
};

type HueK = 'water' | 'cyan' | 'kin' | 'press' | 'force' | 'heat';
const ITEMS: {title: string; color: string; hue: HueK; body: React.ReactNode; size?: number; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Debit',
    color: C.water,
    hue: 'water',
    body: (
      <span>
        <V color={C.water}>Q</V> = <V>A</V> <V color={C.cyan}>v</V>
      </span>
    ),
    Mini: MiniDebit,
  },
  {
    title: 'Kontinuitas',
    color: C.cyan,
    hue: 'cyan',
    body: (
      <span>
        <V>A</V>
        <Sub>1</Sub>
        <V color={C.cyan}>v</V>
        <Sub>1</Sub> = <V>A</V>
        <Sub>2</Sub>
        <V color={C.cyan}>v</V>
        <Sub>2</Sub>
      </span>
    ),
    Mini: MiniCont,
  },
  {
    title: 'Bernoulli',
    color: C.kin,
    hue: 'kin',
    size: 31,
    body: (
      <span>
        <V color={C.press}>p</V> +{' '}
        <span style={{color: C.kin}}>
          <Frac n="1" d="2" />
          <V>ρv</V>
          <Sup>2</Sup>
        </span>{' '}
        + <V color={C.pot}>ρgh</V> = tetap
      </span>
    ),
    Mini: MiniBern,
  },
  {
    title: 'Cepat → tekanan rendah',
    color: C.press,
    hue: 'press',
    body: (
      <span>
        <V color={C.cyan}>v</V> ↑ &nbsp;⇒&nbsp; <V color={C.press}>p</V> ↓
      </span>
    ),
    Mini: MiniLowP,
  },
  {
    title: 'Penerapan',
    color: C.force,
    hue: 'force',
    size: 27,
    body: <span style={{fontFamily: FONT.head}}>Torricelli · venturimeter · sayap</span>,
    Mini: MiniApps,
  },
  {
    title: 'Kekentalan',
    color: C.heat,
    hue: 'heat',
    body: (
      <span>
        <V color={C.water}>Q</V> ∝ <V>r</V>
        <Sup>4</Sup>
        <span style={{fontFamily: FONT.sans, fontSize: 22, color: C.muted}}> &nbsp;(Poiseuille)</span>
      </span>
    ),
    Mini: MiniVisc,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const starts = [
    cue(1),
    Math.max(cue(1) + 1.6, wordOf(1, 'termampatkan') - 0.3),
    cue(2),
    cue(3),
    Math.max(cue(3) + 1.6, wordOf(3, 'Torricelli') - 0.3),
    cue(4),
  ];
  const nextOf = (i: number) => (i < 5 ? starts[i + 1] : cue(5));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(5) + 0.2, cue(5) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(5), cue(5) + 1.0, EASE_IN_OUT);
  const hlCepat = ramp(t, wordOf(5, 'cepat') - 0.2, wordOf(5, 'cepat') + 0.4);
  const hlDorong = ramp(t, wordOf(5, 'mendorong') - 0.3, wordOf(5, 'mendorong') + 0.4);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={40} color="cyan" opacity={0.35} seed={5} />
        {/* garis arus latar yang mengalir pelan */}
        {Array.from({length: 7}, (_, k) => {
          const y = 200 + k * 105;
          return (
            <g key={k} opacity={0.12}>
              <path d={Array.from({length: 25}, (_, i) => `${i ? 'L' : 'M'}${(i * 80).toFixed(0)},${(y + 14 * Math.sin(i * 0.5 + k + t * 0.3)).toFixed(1)}`).join(' ')} fill="none" stroke={C.cyan} strokeWidth={1.4} />
            </g>
          );
        })}
        {Array.from({length: 16}, (_, k) => {
          const p = ph(t, 7 + 4 * rand(k), rand(k * 3.1) * 9);
          const y = 200 + (k % 7) * 105;
          const x = p * 1920;
          return <circle key={k} cx={x} cy={y + 14 * Math.sin((x / 80) * 0.5 + (k % 7) + t * 0.3)} r={2.5} fill="#dff3ff" opacity={cyc(p) * 0.35} />;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const o = ramp(t, 0.2 + i * 0.12, 0.9 + i * 0.12) * (1 - ramp(t, starts[i] - 0.2, starts[i] + 0.4));
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.9);
          return o > 0.01 ? (
            <rect key={it.title} x={x - 250} y={y - CH / 2} width={500} height={CH} rx={20} fill={it.color} fillOpacity={0.03 + 0.03 * pulse} stroke={it.color} strokeOpacity={0.25 + 0.25 * pulse} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} opacity={o} />
          ) : null;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const act = win(t, starts[i], nextOf(i), 0.5, 0.6) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - starts[i] - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        <g opacity={q}>
          <Stream
            pts={[
              [90, 800],
              [140, 800],
              [190, 800],
            ]}
            color="cyan"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1830, 800],
              [1780, 800],
              [1730, 800],
            ]}
            color="press"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const act = win(t, starts[i], nextOf(i), 0.5, 0.6);
        const mini = ramp(t, starts[i] + 0.4, starts[i] + 1.2);
        const bob = 3 * Math.sin(t * 1.1 + i * 1.3);
        const Mini = it.Mini;
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - CH / 2,
              width: 500,
              height: CH,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}${hex2(0x55 + 0x44 * act)}`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 ${30 + 30 * act}px ${it.color}${hex2(0x22 + 0x22 * act)}`,
              padding: '18px 28px 0',
              opacity: Math.min(1, p) * dim,
              scale: String(0.9 + 0.1 * p + 0.02 * act),
              translate: `0px ${bob - 6 * act}px`,
              color: C.ink,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${-40 + p * 150 - 16}%, rgba(255,245,220,0.12) ${-40 + p * 150}%, transparent ${-40 + p * 150 + 16}%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: it.size ?? 38, marginTop: 10, whiteSpace: 'nowrap', textAlign: 'center', height: 82, lineHeight: '82px'}}>{it.body}</div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{display: 'block', marginTop: 2, opacity: mini, overflow: 'visible'}}>
              <Mini t={t + rand(i) * 3} />
            </svg>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 770,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 48,
          fontWeight: 700,
          color: C.ink,
          opacity: q,
          translate: `0px ${(1 - q) * 20}px`,
          whiteSpace: 'nowrap',
        }}
      >
        Di mana alirannya{' '}
        <span style={{color: C.cyan, textShadow: `0 0 ${24 * hlCepat}px ${C.cyan}88`}}>cepat</span>, dan ke mana{' '}
        <span style={{color: C.press, textShadow: `0 0 ${24 * hlDorong}px ${C.press}88`}}>tekanan mendorongnya</span>?
      </div>
    </AbsoluteFill>
  );
};
