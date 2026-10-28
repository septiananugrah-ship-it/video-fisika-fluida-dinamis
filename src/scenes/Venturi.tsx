import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {Pipe, radiusAt} from '../components/flow';
import {PressureArrow, wavePath} from '../components/fluid';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pipa Venturi: r 80 → 40 px (D 4 cm → 2 cm, luas ÷4 → v ×4). Partikel 90 px/s → 360 px/s (1 → 4 m/s).
// Tabung tegak (piezometer) di atas bagian lebar & leher. Skala tabung 400 px/m (penggaris berskala cm):
//   tanpa aliran kedua kolom sama tinggi; saat mengalir kolom leher turun 0,75 m = 300 px (Δp = 7500 Pa).
// Diameter pipa tidak berskala (diperbesar agar partikel terlihat); hanya tinggi kolom yang berskala.

type Knot = [number, number];
const X0 = 140;
const X1 = 1800;
const YC = 760;
const K: Knot[] = [
  [X0, 80],
  [520, 80],
  [740, 40],
  [1000, 40],
  [1220, 80],
  [X1, 80],
];
const V0 = 90;
const T1X = 360; // tabung di bagian lebar
const T2X = 870; // tabung di leher
const S = 400; // px per meter (tabung & penggaris)
const DH = 0.75 * S; // beda tinggi kolom = 300 px
const YS1 = 290; // permukaan kolom bagian lebar
const TUBE_TOP = 238;
const RULX = 615;

export const Venturi: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const pipeIn = ramp(t, -0.4, 1.0);
  const nVenturi = ramp(t, wordOf(0, 'Venturi') - 0.4, wordOf(0, 'Venturi') + 0.4, BACK);
  const throatGlow = win(t, cue(0) + 0.3, cue(1) + 0.5, 0.6, 0.8);
  const flowOn = ramp(t, wordOf(1, 'masuk') - 0.3, wordOf(1, 'masuk') + 1.8, EASE_IN_OUT);
  const tF = wordOf(1, 'masuk') + 1.8;
  const settle = 14 * Math.exp(-Math.max(0, t - tF) / 0.8) * Math.sin(Math.max(0, t - tF) * 5) * flowOn;
  const d1 = ramp(t, wordOf(1, 'empat') - 0.3, wordOf(1, 'empat') + 0.4);
  const v1 = ramp(t, wordOf(1, 'satu') - 0.3, wordOf(1, 'satu') + 0.4);
  const d2 = ramp(t, wordOf(2, 'dua') - 0.3, wordOf(2, 'dua') + 0.4);
  const v2 = ramp(t, wordOf(2, 'empat', 1) - 0.3, wordOf(2, 'empat', 1) + 0.4);
  const f2 = win(t, wordOf(2, 'luasnya') - 0.4, cue(3) - 0.3, 0.6, 0.5);
  const f2num = ramp(t, wordOf(2, 'empat', 1) - 0.3, wordOf(2, 'empat', 1) + 0.4);
  const axis = win(t, cue(3) + 0.1, cue(4) + 0.4, 0.6, 0.6);
  const f3 = win(t, wordOf(3, 'Beda') - 0.4, cue(5) - 0.3, 0.6, 0.5);
  const f3cap = ramp(t, cue(3) + 0.2, cue(3) + 0.9);
  const f4 = ramp(t, cue(4) - 0.1, cue(4) + 0.6);
  const f4num = ramp(t, wordOf(4, 'tujuh') - 0.3, wordOf(4, 'tujuh') + 0.4);
  const pArrows = ramp(t, wordOf(3, 'tekanannya') - 0.4, wordOf(3, 'tekanannya') + 0.5);
  const ruler = ramp(t, cue(5) - 0.1, cue(5) + 0.8);
  const br75 = ramp(t, wordOf(5, 'tujuh') - 0.3, wordOf(5, 'tujuh') + 0.5);
  const f5 = win(t, wordOf(5, 'beda') - 0.3, cue(6) + 0.4, 0.6, 0.5);
  const back = ramp(t, wordOf(6, 'balik') - 0.6, wordOf(6, 'balik') + 0.3);
  const nMeter = ramp(t, wordOf(6, 'venturimeter') - 0.4, wordOf(6, 'venturimeter') + 0.3, BACK);

  const ys2 = YS1 + DH * flowOn + settle; // permukaan kolom leher
  const ys1 = YS1 - 0.25 * settle;
  const wob = (k: number) => 1.5 * Math.sin(t * 2.1 + k);

  const tube = (x: number, ySurf: number, seed: number) => {
    const base = YC - radiusAt(K, x) + 2;
    return (
      <g>
        <rect x={x - 26} y={TUBE_TOP} width={52} height={base - TUBE_TOP} rx={6} fill="#0a1230" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={5} />
        <path d={`${wavePath(x - 21, x + 21, ySurf + wob(seed), t, 2, 0.15, seed)} L${x + 21},${base} L${x - 21},${base} Z`} fill={C.water} opacity={0.75} />
        <path d={wavePath(x - 21, x + 21, ySurf + wob(seed), t, 2, 0.15, seed)} fill="none" stroke="#cfeaff" strokeWidth={3} />
        <rect x={x - 18} y={TUBE_TOP + 10} width={6} height={base - TUBE_TOP - 20} rx={3} fill="#fff" opacity={0.1} />
        {[0, 1, 2].map((k) => {
          const ph = (((t * (0.22 + 0.05 * k) + k * 0.33 + seed) % 1) + 1) % 1;
          const yb = base - 6 - ph * Math.max(0, base - ySurf - 16);
          return <circle key={k} cx={x - 9 + 9 * k + 3 * Math.sin(t * 2 + k)} cy={yb} r={2.5} fill="#fff" opacity={0.45 * cyc(ph)} />;
        })}
      </g>
    );
  };

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={pipeIn}>
          <Glow x={T2X} y={YC} r={260} color="cyan" opacity={0.25 + 0.4 * throatGlow} />
          <Glow x={T1X} y={YC} r={220} color="press" opacity={0.15 + 0.2 * pArrows} />
          <ellipse cx={960} cy={YC + 100} rx={820} ry={12} fill="#000" opacity={0.3} />
          {tube(T1X, ys1, 0.2)}
          {tube(T2X, ys2, 0.7)}
          <Pipe x0={X0} x1={X1} yc={YC} knots={K} v0={V0} lanes={7} perLane={7} lines={0.15 + 0.15 * flowOn} particles={flowOn} />
          {/* tekanan mendorong kolom naik */}
          <g opacity={pArrows}>
            {[
              {x: T1X, L: 62, lab: 'p₁', dx: 56},
              {x: T2X, L: 26, lab: 'p₂', dx: -56},
            ].map((s) => {
              const base = YC - radiusAt(K, s.x);
              return (
                <g key={s.lab}>
                  <PressureArrow x={s.x} y={base + 4} nx={0} ny={1} L={s.L} width={5} />
                  <Label x={s.x + s.dx} y={base - 26} size={34} font="serif" italic color={C.press} weight={600}>
                    {s.lab}
                  </Label>
                </g>
              );
            })}
          </g>
          {/* garis tengah mendatar → ρgh sama */}
          <g opacity={axis}>
            <line x1={X0 + 20} y1={YC} x2={X1 - 20} y2={YC} stroke={C.pot} strokeWidth={2.5} strokeDasharray="12 9" strokeDashoffset={-t * 14} />
            <Label x={1560} y={YC - 106} size={24} color={C.pot} weight={600}>
              mendatar: ρgh sama
            </Label>
          </g>
          {/* diameter */}
          <g opacity={d1}>
            <line x1={260} y1={YC - 76} x2={260} y2={YC + 76} stroke="#fff" strokeWidth={2.5} />
            <line x1={248} y1={YC - 76} x2={272} y2={YC - 76} stroke="#fff" strokeWidth={2.5} />
            <line x1={248} y1={YC + 76} x2={272} y2={YC + 76} stroke="#fff" strokeWidth={2.5} />
            <Label x={280} y={YC} size={28} font="mono" color={C.ink} weight={600} anchor="start">
              D = 4 cm
            </Label>
          </g>
          <g opacity={d2}>
            <line x1={790} y1={YC - 37} x2={790} y2={YC + 37} stroke="#fff" strokeWidth={2.5} />
            <line x1={780} y1={YC - 37} x2={800} y2={YC - 37} stroke="#fff" strokeWidth={2.5} />
            <line x1={780} y1={YC + 37} x2={800} y2={YC + 37} stroke="#fff" strokeWidth={2.5} />
            <Label x={900} y={YC} size={26} font="mono" color={C.ink} weight={600} anchor="start">
              D = 2 cm
            </Label>
          </g>
          {/* kecepatan */}
          <g opacity={v1}>
            <Arrow x1={190} y1={YC - 118} x2={270} y2={YC - 118} color="cyan" width={5} />
            <Label x={232} y={YC - 156} size={32} font="mono" color={C.cyan} weight={600}>
              1 m/s
            </Label>
          </g>
          <g opacity={v2}>
            <Arrow x1={950} y1={YC - 78} x2={1190} y2={YC - 78} color="cyan" width={5} />
            <Label x={1070} y={YC - 116} size={32} font="mono" color={C.cyan} weight={600}>
              4 m/s
            </Label>
            <Ripple x={T2X} y={YC} p={ramp(t, wordOf(2, 'empat', 1) - 0.2, wordOf(2, 'empat', 1) + 1.0)} r={90} color="cyan" />
          </g>
          {/* penggaris berskala & beda tinggi */}
          {ruler > 0.001 ? (
            <g opacity={ruler}>
              <line x1={T1X + 26} y1={ys1} x2={RULX - 30} y2={ys1} stroke={C.gold} strokeWidth={2} strokeDasharray="7 6" />
              <line x1={RULX + 30} y1={ys2} x2={T2X - 26} y2={ys2} stroke={C.gold} strokeWidth={2} strokeDasharray="7 6" />
              <rect x={RULX - 26} y={YS1 - 40} width={52} height={380} rx={6} fill="#e9d9a6" opacity={0.92} />
              {Array.from({length: 19}, (_, i) => {
                const y = YS1 + 320 - i * 20; // 0 cm di 20 cm di bawah permukaan leher
                const cm = i * 5 - 5;
                return (
                  <g key={i}>
                    <line x1={RULX - 26} y1={y} x2={RULX - 26 + (cm % 10 === 0 ? 22 : 12)} y2={y} stroke="#3a2a10" strokeWidth={2} />
                    {cm % 20 === 0 && cm >= 0 ? (
                      <text x={RULX + 20} y={y + 5} textAnchor="end" fontFamily={FONT.mono} fontSize={14} fill="#3a2a10">
                        {cm}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              <Label x={RULX} y={YS1 - 62} size={18} color={C.muted}>
                cm
              </Label>
            </g>
          ) : null}
          <g opacity={br75}>
            <line x1={RULX + 60} y1={ys1} x2={RULX + 60} y2={ys2} stroke={C.gold} strokeWidth={4} />
            <line x1={RULX + 48} y1={ys1} x2={RULX + 72} y2={ys1} stroke={C.gold} strokeWidth={4} />
            <line x1={RULX + 48} y1={ys2} x2={RULX + 72} y2={ys2} stroke={C.gold} strokeWidth={4} />
            <Label x={RULX + 84} y={(ys1 + ys2) / 2 - 22} size={30} font="serif" italic color={C.gold} weight={600} anchor="start">
              Δh
            </Label>
            <Label x={RULX + 84} y={(ys1 + ys2) / 2 + 20} size={30} font="mono" color={C.gold} weight={600} anchor="start">
              75 cm
            </Label>
            <Spark x={RULX + 60} y={ys1} r={6} color="gold" />
            <Spark x={RULX + 60} y={ys2} r={6} color="gold" />
            <Twinkles x={RULX + 120} y={(ys1 + ys2) / 2} rx={70} ry={120} n={4} color="gold" />
          </g>
          {/* hitung balik: Δh → Δp → v */}
          <Stream
            pts={[
              [RULX + 140, (YS1 + ys2) / 2],
              [1000, 320],
              [1260, 300],
            ]}
            color="press"
            n={8}
            speed={0.7}
            r={5}
            opacity={back}
          />
          <Motes x={960} y={YC} rx={760} ry={120} n={18} color="cyan" opacity={0.3} seed={7} />
          <Motes x={T2X} y={420} rx={200} ry={200} n={10} color="water" opacity={0.3} seed={3} />
        </g>
      </Stage>

      {/* ---------- kartu HTML ---------- */}
      <Badge x={1420} y={250} text="pipa Venturi" color={C.cyan} opacity={nVenturi * (1 - ramp(t, wordOf(2, 'luasnya') - 0.6, wordOf(2, 'luasnya') - 0.1, EASE_IN_OUT))} scale={0.85 + 0.15 * nVenturi} size={34} />
      <Formula x={1420} y={300} p={f2} accent={C.cyan} size={56} caption="D ÷ 2 → luas ÷ 4 → kecepatan × 4">
        <V color={C.water}>A</V>
        <Sub>1</Sub>
        <V color={C.cyan}>v</V>
        <Sub>1</Sub> = <V color={C.water}>A</V>
        <Sub>2</Sub>
        <V color={C.cyan}>v</V>
        <Sub>2</Sub> → <V color={C.cyan}>v</V>
        <Sub>2</Sub> = <span style={{color: C.cyan, opacity: 0.3 + 0.7 * f2num}}>4 m/s</span>
      </Formula>
      <Formula x={1420} y={330} p={f3} accent={C.press} size={56} caption={<span style={{opacity: f3cap}}>pipa mendatar: suku ρgh saling meniadakan</span>}>
        Δ<V color={C.press}>p</V> = ½<V color={C.spr}>ρ</V>(<V color={C.cyan}>v</V>
        <Sub>2</Sub>
        <Sup>2</Sup> − <V color={C.cyan}>v</V>
        <Sub>1</Sub>
        <Sup>2</Sup>)
        <div style={{fontSize: 38, fontFamily: FONT.mono, opacity: f4, marginTop: 6}}>
          = ½ · 1000 · (16 − 1) = <span style={{color: C.press, opacity: 0.3 + 0.7 * f4num}}>7500 Pa</span>
        </div>
      </Formula>
      <Formula x={1420} y={330} p={f5} accent={C.gold} size={56} caption="kolom air setinggi Δh menahan beda tekanan itu">
        Δ<V>h</V> = <Frac n={<>Δ<V color={C.press}>p</V></>} d={<><V color={C.spr}>ρ</V><V>g</V></>} /> = <Frac n="7500" d="1000 · 10" /> = <span style={{color: C.gold}}>0,75 m</span>
      </Formula>
      <Note x={1420} y={300} p={back} color={C.press} size={34}>
        <span style={{color: C.gold}}>Δh</span> → <span style={{color: C.press}}>Δp</span> → <span style={{color: C.cyan}}>v</span>
      </Note>
      <Badge x={1420} y={410} text="venturimeter: pengukur kecepatan aliran" color={C.cyan} opacity={nMeter} scale={0.85 + 0.15 * nMeter} size={30} />
    </AbsoluteFill>
  );
};
