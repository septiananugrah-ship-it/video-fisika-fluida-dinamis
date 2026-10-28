import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Jet} from '../components/flow';
import {PressureArrow, Tank} from '../components/fluid';
import {Ground, fmt} from '../components/physics';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Sqrt, Stage, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Skala tunggal 300 px/m untuk tinggi DAN jarak (parabola benar secara fisika), g = 10 m/s² = 3000 px/s².
// Lantai y = 860; lubang 0,80 m di atas lantai (y = 620); permukaan 1,25 m di atas lubang (y = 245).
// v = √(2·10·1,25) = 5 m/s = 1500 px/s; waktu terbang √(2·0,8/10) = 0,4 s; jangkauan 5·0,4 = 2 m = 600 px.
// Batu dijatuhkan dari ketinggian permukaan, jatuh 1,25 m (0,5 s) → 5 m/s.
// Akhir: lubang di kedalaman 0,2 m, 0,6 m, 1,25 m → v ≈ 2; 3,5; 5 m/s, jangkauan 2√(d·y) ≈ 1,2; 1,9; 2 m.

const S = 300;
const G = 10 * S;
const FLOOR = 860;
const YH = FLOOR - 0.8 * S; // 620
const YS = YH - 1.25 * S; // 245
const TX = 400;
const TW = 306;
const HX = TX + TW + 2; // mulut lubang
const VX = 5 * S;
const STX = 235; // batu

const HOLES = [
  {d: 0.2, k: 0},
  {d: 0.6, k: 1},
];

export const Torricelli: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const tankIn = ramp(t, -0.4, 1.0);
  const tPop = wordOf(0, 'lubang') + 0.2;
  const pop = ramp(t, tPop, tPop + 0.5, (x) => x);
  const jetOn = ramp(t, tPop, tPop + 0.35);
  const depth = ramp(t, wordOf(0, 'satu') - 0.3, wordOf(0, 'satu') + 0.5);
  const drop = 5 * ramp(t, tPop, 60, (x) => x); // permukaan turun sangat lambat (px)
  const ys = YS + drop;

  const pAtm = win(t, wordOf(1, 'terbuka') - 0.4, cue(2) + 0.2, 0.6, 0.6);
  const slow = win(t, wordOf(1, 'Permukaan', 1) - 0.3, cue(2) + 0.6, 0.6, 0.6);
  const f2 = win(t, cue(2) + 0.1, cue(3) - 0.3, 0.6, 0.5);
  const f2b = ramp(t, wordOf(2, 'akar') - 0.4, wordOf(2, 'akar') + 0.3);
  const f3 = win(t, cue(3) - 0.1, cue(5) - 0.3, 0.6, 0.5);
  const f3num = ramp(t, wordOf(3, 'lima', 1) - 0.4, wordOf(3, 'lima', 1) + 0.3);
  const vArrow = win(t, wordOf(3, 'lima', 1) - 0.3, cue(5) + 0.2, 0.5, 0.6);
  const stone = win(t, cue(4) - 0.2, cue(5) + 0.2, 0.6, 0.6);
  const badge = ramp(t, wordOf(4, 'Torricelli') - 0.4, wordOf(4, 'Torricelli') + 0.3, BACK) * (1 - ramp(t, cue(5) - 0.5, cue(5) - 0.1, EASE_IN_OUT));
  const hFloor = win(t, wordOf(5, 'delapan') - 0.4, cue(7) - 0.2, 0.6, 0.6);
  const f5 = win(t, wordOf(5, 'melayang') - 0.5, cue(6) - 0.2, 0.6, 0.5);
  const f5num = ramp(t, wordOf(5, 'nol') - 0.3, wordOf(5, 'nol') + 0.3);
  const slowA = wordOf(5, 'melayang') - 0.4;
  const slowS = 0.4 * ramp(t, slowA, slowA + 2.0, (x) => x); // tetes gerak lambat (×1/5)
  const slowVis = win(t, slowA - 0.3, cue(7) - 0.3, 0.4, 0.6);
  const clockDone = ramp(t, slowA + 2.0, slowA + 2.4);
  const rangeBr = win(t, cue(6) - 0.1, cue(7) + 0.3, 0.6, 0.6);
  const f6 = win(t, cue(6) - 0.1, cue(7) - 0.2, 0.6, 0.5);
  const f6num = ramp(t, wordOf(6, 'dua') - 0.3, wordOf(6, 'dua') + 0.3);
  const multi = ramp(t, cue(7) - 0.2, cue(7) + 1.2);
  const nDeep = ramp(t, wordOf(7, 'kencang') - 0.4, wordOf(7, 'kencang') + 0.3, BACK);
  const pDeep = ramp(t, wordOf(7, 'tekanan') - 0.4, wordOf(7, 'tekanan') + 0.5);

  // batu: jatuh 1,25 m dalam 0,5 s, tahan di bawah, lalu muncul lagi di atas (berulang)
  const per = 2.4;
  const sp = Math.max(0, t - cue(4) - 0.3);
  const ph = (sp % per) / per;
  const tau = Math.min(0.5, ph * per);
  const stY = YS - 22 + 0.5 * G * tau * tau;
  const stV = 10 * tau;
  const stOp = Math.min(1, ph * 10) * Math.min(1, (1 - ph) * 8);

  // neraca energi: titik 1 (permukaan) → titik 2 (lubang), berulang tiap 3 s
  const ledger = win(t, cue(2) + 0.3, cue(5) - 0.4, 0.6, 0.5);
  const lph = ((((t - cue(2)) / 3) % 1) + 1) % 1;
  const ease = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, lph / 0.8));
  const LP: [number, number][] = [
    [520, ys + 26],
    [520, 470],
    [610, YH],
    [HX - 10, YH],
  ];
  const bz = (a: number, b: number, c: number, d: number, u: number) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;
  const lx = bz(LP[0][0], LP[1][0], LP[2][0], LP[3][0], ease);
  const ly = bz(LP[0][1], LP[1][1], LP[2][1], LP[3][1], ease);
  const lOp = Math.min(1, lph * 10) * Math.min(1, (1 - lph) * 8);
  // tekanan terukur (di atas p_atm): turun di dalam tangki ρgh → p (air hampir diam), di mulut lubang p → ½ρv²
  const eG = 1 - Math.min(1, ease / 0.7);
  const eK = Math.max(0, (ease - 0.7) / 0.3) ** 1.5;
  const eP = Math.max(0, 1 - eG - eK);

  // tetes gerak lambat
  const dropX = HX + VX * slowS;
  const dropY = YH + 0.5 * G * slowS * slowS;

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={tankIn}>
          <Glow x={TX + TW / 2} y={500} r={360} color="water" opacity={0.3} />
          <Glow x={HX + 300} y={740} r={260} color="cyan" opacity={0.25} />
          <Ground x1={100} x2={1840} y={FLOOR} />
          {/* titik-titik skala lantai tiap 0,5 m */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={HX + i * 0.5 * S} y1={FLOOR - 10} x2={HX + i * 0.5 * S} y2={FLOOR} stroke={C.muted} strokeWidth={2} opacity={0.8} />
          ))}
          {/* tangki */}
          <Tank x={TX} y={FLOOR} w={TW} h={FLOOR - 196} level={FLOOR - 6 - ys} bubbles={6} seed={2} />
          {/* lubang */}
          <ellipse cx={HX - 3} cy={YH} rx={5} ry={9} fill="#050912" stroke="#bfe3ff" strokeWidth={2} />
          {/* gabus yang terlepas */}
          {pop < 1 ? (
            <g opacity={1 - pop} transform={`translate(${HX + 4 + 260 * pop} ${YH - 200 * pop + 420 * pop * pop}) rotate(${360 * pop})`}>
              <rect x={-12} y={-10} width={24} height={20} rx={4} fill="#b88a55" stroke="#e8c595" strokeWidth={2} />
            </g>
          ) : null}
          {/* semburan utama */}
          <Jet x={HX} y={YH} vx={VX * mix(0.55, 1, jetOn)} g={G} yFloor={FLOOR} opacity={jetOn} width={8} drops={12} />
          {/* genangan */}
          <ellipse cx={HX + VX * 0.4} cy={FLOOR + 3} rx={46 + 5 * Math.sin(t * 2.3)} ry={7} fill={C.water} opacity={0.45 * jetOn} />
          {[0, 1, 2].map((k) => {
            const q = (((t * 0.8 + k / 3) % 1) + 1) % 1;
            return <ellipse key={k} cx={HX + VX * 0.4} cy={FLOOR + 3} rx={16 + 60 * q} ry={3 + 8 * q} fill="none" stroke="#cfeaff" strokeWidth={2} opacity={0.55 * cyc(q) * jetOn} />;
          })}

          {/* kedalaman lubang h = 1,25 m */}
          <g opacity={depth * (1 - multi)}>
            <line x1={HX - 40} y1={ys + 6} x2={HX - 40} y2={YH - 6} stroke={C.pot} strokeWidth={4} />
            <line x1={HX - 52} y1={ys + 6} x2={HX - 28} y2={ys + 6} stroke={C.pot} strokeWidth={4} />
            <line x1={HX - 52} y1={YH - 6} x2={HX - 28} y2={YH - 6} stroke={C.pot} strokeWidth={4} />
            <Label x={HX - 62} y={(ys + YH) / 2 - 22} size={32} font="serif" italic color={C.pot} weight={600} anchor="end">
              h
            </Label>
            <Label x={HX - 62} y={(ys + YH) / 2 + 20} size={28} font="mono" color={C.ink} weight={600} anchor="end">
              1,25 m
            </Label>
          </g>
          <Ripple x={HX} y={YH} p={ramp(t, tPop, tPop + 1.2)} r={80} color="cyan" />

          {/* tekanan atmosfer sama di permukaan & lubang */}
          <g opacity={pAtm}>
            {[460, 553, 646].map((x) => (
              <PressureArrow key={x} x={x} y={ys - 4} nx={0} ny={-1} L={46} width={4} />
            ))}
            <Label x={553} y={ys - 84} size={28} font="serif" italic color={C.press} weight={600}>
              p<tspan baselineShift="sub" fontSize="0.6em">atm</tspan>
            </Label>
            <PressureArrow x={HX + 26} y={YH - 30} nx={0.6} ny={-0.8} L={46} width={4} />
            <Label x={HX + 92} y={YH - 104} size={28} font="serif" italic color={C.press} weight={600}>
              p<tspan baselineShift="sub" fontSize="0.6em">atm</tspan>
            </Label>
          </g>
          <g opacity={slow}>
            <Label x={250} y={ys + 10} size={24} color={C.water} weight={600}>
              turun sangat lambat
            </Label>
            <Label x={250} y={ys + 46} size={24} font="serif" italic color={C.cyan}>
              v₁ ≈ 0
            </Label>
            <Arrow x1={470} y1={ys + 20} x2={470} y2={ys + 20 + 26 + 4 * Math.sin(t * 2)} color="cyan" width={4} pulse={false} />
          </g>

          {/* kecepatan semburan */}
          <g opacity={vArrow * (1 - multi)}>
            <Arrow x1={HX + 8} y1={YH - 50} x2={HX + 150} y2={YH - 50} color="cyan" width={6} />
            <Label x={HX + 236} y={YH - 50} size={32} font="mono" color={C.cyan} weight={600}>
              5 m/s
            </Label>
          </g>

          {/* batu jatuh bebas dari ketinggian yang sama */}
          {stone > 0.001 ? (
            <g opacity={stone}>
              <rect x={STX - 60} y={YS - 4} width={120} height={10} rx={4} fill="#3b466e" stroke={C.muted} strokeWidth={2} />
              <line x1={STX + 60} y1={YS} x2={TX - 6} y2={YS} stroke={C.gold} strokeWidth={2} strokeDasharray="7 7" strokeDashoffset={-t * 12} opacity={0.7} />
              <line x1={STX - 60} y1={YH} x2={TX - 6} y2={YH} stroke={C.gold} strokeWidth={2} strokeDasharray="7 7" strokeDashoffset={-t * 12} opacity={0.7} />
              <line x1={STX - 90} y1={YS + 6} x2={STX - 90} y2={YH} stroke={C.pot} strokeWidth={3} opacity={0.8} />
              <g opacity={stOp}>
                {[1, 2, 3, 4].map((i) => {
                  const ta = Math.max(0, tau - i * 0.03);
                  return <circle key={i} cx={STX} cy={YS - 22 + 0.5 * G * ta * ta} r={14 - i * 2} fill="#9aa3bf" opacity={0.25 * (1 - i / 5) * Math.min(1, tau * 8)} />;
                })}
                <path d={`M${STX - 18},${stY + 4} L${STX - 12},${stY - 14} L${STX + 6},${stY - 18} L${STX + 19},${stY - 4} L${STX + 14},${stY + 14} L${STX - 6},${stY + 17} Z`} fill="#6f7894" stroke="#c4cbe0" strokeWidth={2} />
              </g>
              <rect x={STX - 92} y={YH + 30} width={184} height={70} rx={14} fill="rgba(10,16,36,0.8)" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} />
              <Label x={STX} y={YH + 50} size={18} color={C.muted}>
                kecepatan batu
              </Label>
              <Label x={STX} y={YH + 78} size={30} font="mono" color={C.cyan} weight={600}>
                {`${fmt(stV, 1)} m/s`}
              </Label>
              <Ripple x={STX} y={YH} p={ramp(ph * per, 0.5, 1.4)} r={60} color="cyan" />
            </g>
          ) : null}

          {/* tinggi lubang di atas lantai & tetes gerak lambat */}
          <g opacity={hFloor * (1 - multi)}>
            <line x1={HX + 20} y1={YH} x2={1420} y2={YH} stroke={C.gold} strokeWidth={2} strokeDasharray="7 7" strokeDashoffset={-t * 12} opacity={0.6} />
            <line x1={1400} y1={YH + 4} x2={1400} y2={FLOOR - 4} stroke={C.gold} strokeWidth={4} />
            <line x1={1388} y1={YH + 4} x2={1412} y2={YH + 4} stroke={C.gold} strokeWidth={4} />
            <line x1={1388} y1={FLOOR - 4} x2={1412} y2={FLOOR - 4} stroke={C.gold} strokeWidth={4} />
            <Label x={1424} y={(YH + FLOOR) / 2} size={30} font="mono" color={C.gold} weight={600} anchor="start">
              0,80 m
            </Label>
          </g>
          <g opacity={slowVis * (1 - multi)}>
            <Spark
              x={dropX}
              y={dropY}
              r={8}
              color="gold"
              trail={[1, 2, 3, 4, 5].map((i) => {
                const s2 = Math.max(0, slowS - i * 0.012);
                return [HX + VX * s2, YH + 0.5 * G * s2 * s2] as [number, number];
              })}
            />
            <rect x={1460} y={470} width={290} height={86} rx={14} fill="rgba(10,16,36,0.82)" stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} />
            <circle cx={1500} cy={513} r={22} fill="none" stroke={C.gold} strokeWidth={3} />
            <line x1={1500} y1={513} x2={1500 + 18 * Math.sin((slowS / 0.4) * 2 * Math.PI)} y2={513 - 18 * Math.cos((slowS / 0.4) * 2 * Math.PI)} stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
            <Label x={1536} y={513} size={30} font="mono" color={C.gold} weight={600} anchor="start" opacity={1 - clockDone}>
              {`t = ${fmt(slowS, 2)} s`}
            </Label>
            <Label x={1536} y={513} size={30} font="mono" color={C.gold} weight={600} anchor="start" opacity={clockDone}>
              t = 0,4 s
            </Label>
            <Label x={1605} y={578} size={18} color={C.muted}>
              gerak lambat
            </Label>
          </g>
          <g opacity={rangeBr * (1 - multi)}>
            <line x1={HX} y1={FLOOR - 26} x2={HX + VX * 0.4} y2={FLOOR - 26} stroke={C.cyan} strokeWidth={4} />
            <line x1={HX} y1={FLOOR - 38} x2={HX} y2={FLOOR - 14} stroke={C.cyan} strokeWidth={4} />
            <line x1={HX + VX * 0.4} y1={FLOOR - 38} x2={HX + VX * 0.4} y2={FLOOR - 14} stroke={C.cyan} strokeWidth={4} />
            <Label x={HX + VX * 0.2} y={FLOOR - 58} size={32} font="mono" color={C.cyan} weight={600}>
              x = 2 m
            </Label>
            <Ripple x={HX + VX * 0.4} y={FLOOR} p={ramp(t, wordOf(6, 'mendarat') - 0.2, wordOf(6, 'mendarat') + 1.2)} r={90} color="cyan" />
            <Twinkles x={HX + VX * 0.2} y={FLOOR - 60} rx={120} ry={30} n={4} color="cyan" opacity={f6num} />
          </g>

          {/* akhir: lubang di beberapa kedalaman */}
          {multi > 0.001 ? (
            <g opacity={multi}>
              {HOLES.map((h) => {
                const y = ys + h.d * S;
                const v = Math.sqrt(20 * h.d) * S;
                return (
                  <g key={h.k}>
                    <ellipse cx={HX - 3} cy={y} rx={5} ry={9} fill="#050912" stroke="#bfe3ff" strokeWidth={2} />
                    <Jet x={HX} y={y} vx={v} g={G} yFloor={FLOOR} width={7} drops={8} opacity={ramp(t, cue(7) + 0.2 + h.k * 0.5, cue(7) + 0.7 + h.k * 0.5)} />
                  </g>
                );
              })}
              {[...HOLES, {d: 1.25, k: 2}].map((h) => {
                const y = h.k === 2 ? YH : ys + h.d * S;
                const v = Math.sqrt(20 * h.d);
                return (
                  <g key={`a${h.k}`}>
                    <PressureArrow x={HX - 12} y={y} nx={-1} ny={0} L={20 + 120 * h.d} width={4} opacity={pDeep} />
                    <Arrow x1={HX + 10} y1={y - 26} x2={HX + 10 + v * 30} y2={y - 26} color="cyan" width={5} pulse={false} opacity={nDeep} />
                  </g>
                );
              })}
              <Label x={TX + 70} y={YH + 60} size={24} font="serif" italic color={C.press} weight={600} opacity={pDeep}>
                ρgh besar
              </Label>
              <Label x={TX + 70} y={ys + 0.2 * S + 50} size={24} font="serif" italic color={C.press} weight={600} opacity={pDeep}>
                ρgh kecil
              </Label>
            </g>
          ) : null}
          {/* neraca energi per m³: ρgh di permukaan → ½ρv² di lubang */}
          {ledger > 0.001 ? (
            <g opacity={ledger}>
              <path d={`M${LP[0][0]},${LP[0][1]} C${LP[1][0]},${LP[1][1]} ${LP[2][0]},${LP[2][1]} ${LP[3][0]},${LP[3][1]}`} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="5 7" strokeDashoffset={-t * 20} opacity={0.5} />
              <Spark x={lx} y={ly} r={7} color="gold" opacity={lOp} />
              <Label x={LP[0][0] - 26} y={LP[0][1] + 2} size={26} font="mono" color={C.gold} weight={600}>
                1
              </Label>
              <Label x={HX - 26} y={YH + 30} size={26} font="mono" color={C.gold} weight={600}>
                2
              </Label>
              <rect x={1450} y={430} width={340} height={380} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
              <Label x={1620} y={460} size={20} color={C.muted} weight={600} spacing={2}>
                ENERGI PER m³
              </Label>
              <line x1={1480} y1={750} x2={1760} y2={750} stroke={C.muted} strokeWidth={2} />
              <line x1={1480} y1={500} x2={1760} y2={500} stroke={C.ink} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-t * 16} opacity={0.5} />
              {[
                {x: 1474, v: eP, c: C.press, lab: 'p'},
                {x: 1582, v: eK, c: C.kin, lab: '½ρv²'},
                {x: 1690, v: eG, c: C.pot, lab: 'ρgh'},
              ].map((bb) => (
                <g key={bb.lab}>
                  <rect x={bb.x} y={500} width={76} height={250} rx={8} fill={bb.c} opacity={0.08} />
                  <rect x={bb.x} y={750 - 250 * bb.v} width={76} height={250 * bb.v} rx={8} fill={bb.c} opacity={0.88} />
                  <rect x={bb.x + 8} y={750 - 250 * bb.v + 6} width={7} height={Math.max(0, 250 * bb.v - 12)} rx={3.5} fill="#fff" opacity={0.18} />
                  <Label x={bb.x + 38} y={780} size={26} font="serif" italic color={bb.c} weight={600}>
                    {bb.lab}
                  </Label>
                </g>
              ))}
            </g>
          ) : null}
          <Motes x={TX + TW / 2} y={500} rx={220} ry={280} n={14} color="water" opacity={0.35} seed={4} />
        </g>
      </Stage>

      {/* ---------- kartu HTML ---------- */}
      <Note x={1290} y={270} p={pAtm * (1 - f2)} color={C.press} size={32}>
        <V color={C.press}>p</V>
        <Sub>1</Sub> = <V color={C.press}>p</V>
        <Sub>2</Sub> = <V color={C.press}>p</V>
        <Sub>atm</Sub>
        <span style={{display: 'inline-block', width: 34}} />
        <V color={C.cyan}>v</V>
        <Sub>1</Sub> ≈ 0
      </Note>
      <Formula x={1290} y={280} p={f2} accent={C.cyan} size={58} caption="Bernoulli: suku p saling meniadakan, v₁ ≈ 0">
        <V color={C.pot}>ρgh</V> = ½<V color={C.kin}>ρv</V>
        <Sup color={C.kin}>2</Sup>
        <span style={{opacity: f2b}}>
          {'  '}→{'  '}
          <V color={C.cyan}>v</V> ={' '}
          <Sqrt>
            2<V>gh</V>
          </Sqrt>
        </span>
      </Formula>
      <Formula x={1290} y={280} p={f3} accent={C.cyan} size={58}>
        <V color={C.cyan}>v</V> ={' '}
        <Sqrt>2 · 10 · 1,25</Sqrt> = <span style={{color: C.cyan, opacity: 0.3 + 0.7 * f3num}}>5 m/s</span>
      </Formula>
      <Badge x={1290} y={400} text="teorema Torricelli: sama dengan jatuh bebas setinggi h" color={C.gold} opacity={badge} scale={0.85 + 0.15 * badge} size={28} />
      <Formula x={1290} y={280} p={f5} accent={C.gold} size={58}>
        <V>t</V> ={' '}
        <Sqrt>
          <Frac n="2 · 0,8" d="10" />
        </Sqrt>{' '}
        = <span style={{color: C.gold, opacity: 0.3 + 0.7 * f5num}}>0,4 s</span>
      </Formula>
      <Formula x={1290} y={280} p={f6} accent={C.cyan} size={58}>
        <V>x</V> = <V color={C.cyan}>v</V> · <V>t</V> = 5 · 0,4 = <span style={{color: C.cyan, opacity: 0.3 + 0.7 * f6num}}>2 m</span>
      </Formula>
      <Badge x={1290} y={232} text="makin dalam → tekanan makin besar → makin kencang" color={C.cyan} opacity={nDeep} scale={0.85 + 0.15 * nDeep} size={30} />
    </AbsoluteFill>
  );
};
