import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Water} from '../components/fluid';
import {Arrow, Card, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kekentalan: madu vs air dituang berdampingan (madu lambat & melingkar), lapisan yang bergesekan (aliran Couette),
// pipa dengan profil kecepatan parabola (v = 0 di dinding, maks di tengah, tinta yang melengkung jadi parabola),
// Poiseuille Q = πr⁴Δp/(8ηL): jari-jari ½ → kecepatan rata-rata ¼ & luas ¼ → debit 1/16,
// lalu pipa panjang dengan tabung tekanan: tinggi kolom turun merata (Δp untuk menjaga aliran).
// Angka (AUDIT): madu η ≈ 2–10 Pa·s, air 1,0 mPa·s ("ribuan kali").

const HONEY = '#f0a733';
const HONEY_D = '#a8620f';

// ---------- penuangan ----------
const BK_W = 220;
const BK_YB = 800;
const BK_H = 250;
const HX = 420;
const WX = 820;
const LIP_Y = 300;

const TiltedJar: React.FC<{x: number; y: number; liquid: string; level?: number}> = ({x, y, liquid}) => (
  <g transform={`translate(${x} ${y}) rotate(28)`}>
    <rect x={-170} y={-56} width={170} height={112} rx={18} fill="#0d1838" fillOpacity={0.6} stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} />
    <rect x={-150} y={6} width={146} height={44} rx={10} fill={liquid} opacity={0.7} />
    <path d={`M-4,-56 L10,-62`} stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} strokeLinecap="round" />
    <line x1={-150} y1={-38} x2={-30} y2={-38} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
  </g>
);

const Beaker: React.FC<{cx: number; level: number; color: string; seed: number; children?: React.ReactNode}> = ({cx, level, color, seed, children}) => {
  const x = cx - BK_W / 2;
  return (
    <g>
      <ellipse cx={cx} cy={BK_YB + 10} rx={BK_W * 0.6} ry={12} fill="#000" opacity={0.35} />
      <Water x={x + 6} y={BK_YB - 6 - level} w={BK_W - 12} h={level} color={color} amp={color === HONEY ? 1 : 3} seed={seed} caustics={color !== HONEY} />
      {children}
      <path d={`M${x - 12},${BK_YB - BK_H} L${x},${BK_YB - BK_H + 12} L${x},${BK_YB} L${x + BK_W},${BK_YB} L${x + BK_W},${BK_YB - BK_H}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
      <line x1={x + 16} y1={BK_YB - BK_H + 26} x2={x + 16} y2={BK_YB - 22} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

// ---------- pipa berprofil parabola ----------
const PipeProfile: React.FC<{
  t: number;
  x0: number;
  x1: number;
  yc: number;
  R: number;
  vmax: number;
  lanes?: number;
  per?: number;
  seed?: number;
  opacity?: number;
}> = ({t, x0, x1, yc, R, vmax, lanes = 9, per = 6, seed = 0, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const span = x1 - x0;
  const id = `vp-${Math.round(yc)}-${Math.round(R)}`;
  const hatch: string[] = [];
  for (let x = x0 + 8; x < x1; x += 22) {
    hatch.push(`M${x},${yc - R - 4} l-14,-16`);
    hatch.push(`M${x},${yc + R + 4} l-14,16`);
  }
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.deep} stopOpacity={0.95} />
          <stop offset="50%" stopColor={C.water} stopOpacity={0.5} />
          <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <rect x={x0} y={yc - R} width={span} height={2 * R} fill={`url(#${id})`} />
      {Array.from({length: lanes}, (_, j) => {
        const f = -0.9 + (1.8 * j) / (lanes - 1);
        const v = Math.max(3, vmax * (1 - f * f));
        const y = yc + f * R;
        return Array.from({length: per}, (_, k) => {
          const x = x0 + ((((t * v + (k / per) * span + rand(j * 5.1 + seed) * span) % span) + span) % span);
          const fade = Math.min(1, (x - x0) / 40) * Math.min(1, (x1 - x) / 40);
          const len = Math.min(56, 3 + v * 0.16);
          return (
            <g key={`${j}-${k}`} opacity={fade}>
              <line x1={Math.max(x0, x - len)} y1={y} x2={x} y2={y} stroke="#eaf8ff" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
              <circle cx={x} cy={y} r={2.4} fill="#fff" />
            </g>
          );
        });
      })}
      <path d={hatch.join(' ')} stroke={C.faint} strokeWidth={2} />
      <line x1={x0} y1={yc - R} x2={x1} y2={yc - R} stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
      <line x1={x0} y1={yc + R} x2={x1} y2={yc + R} stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
    </g>
  );
};

/** Tabung ukur yang terisi dari ujung pipa. */
const Cylinder: React.FC<{x: number; yTop: number; yBot: number; level: number; seed: number}> = ({x, yTop, yBot, level, seed}) => (
  <g>
    <Water x={x + 5} y={yBot - 5 - level} w={110} h={Math.max(0.1, level)} amp={2} seed={seed} caustics={false} />
    <path d={`M${x},${yTop} L${x},${yBot} L${x + 120},${yBot} L${x + 120},${yTop}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} strokeLinejoin="round" />
    {Array.from({length: 6}, (_, i) => (
      <line key={i} x1={x + 120} y1={yBot - 5 - i * ((yBot - yTop - 10) / 6)} x2={x + 104} y2={yBot - 5 - i * ((yBot - yTop - 10) / 6)} stroke={C.muted} strokeWidth={2} />
    ))}
  </g>
);

export const Viscosity: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---------- fase A: madu vs air ----------
  const aIn = ramp(t, -0.2, 1.0);
  const aOut = 1 - ramp(t, cue(2) - 0.6, cue(2) + 0.2, EASE_IN_OUT);
  const etaCard = ramp(t, wordOf(0, 'eta') - 0.4, wordOf(0, 'eta') + 0.5);
  const layers = ramp(t, wordOf(0, 'gesekan') - 0.3, wordOf(0, 'gesekan') + 0.7);
  const vals = ramp(t, wordOf(1, 'ribuan') - 0.3, wordOf(1, 'ribuan') + 0.6);
  const slow = ramp(t, wordOf(1, 'lambat') - 0.3, wordOf(1, 'lambat') + 0.6);
  const wLevel = 40 + 170 * ramp(t, 0, cue(2), (q) => q);
  const hLevel = 40 + 22 * ramp(t, 0, cue(2), (q) => q);

  // ---------- fase B: profil parabola ----------
  const bIn = ramp(t, cue(2) - 0.3, cue(2) + 0.6);
  const bOut = 1 - ramp(t, cue(4) - 0.5, cue(4) + 0.3, EASE_IN_OUT);
  const PB = {x0: 140, x1: 1520, yc: 610, R: 150, vmax: 300};
  const wallLbl = ramp(t, wordOf(2, 'diam') - 0.3, wordOf(2, 'diam') + 0.5);
  const midLbl = ramp(t, wordOf(2, 'tengah') - 0.3, wordOf(2, 'tengah') + 0.5);
  const para = ramp(t, wordOf(2, 'parabola') - 0.5, wordOf(2, 'parabola') + 0.6);
  const prof = ramp(t, cue(2) + 0.6, cue(2) + 1.8);
  const rDim = ramp(t, wordOf(3, 'jari') - 0.3, wordOf(3, 'jari') + 0.5);
  const fml = ramp(t, cue(3) + 0.3, cue(3) + 1.2);
  const fmlOut = 1 - ramp(t, cue(5) - 0.5, cue(5) + 0.2, EASE_IN_OUT);
  const row2 = ramp(t, wordOf(4, 'setengah') - 0.2, wordOf(4, 'setengah') + 0.6);
  const sixteen = ramp(t, wordOf(4, 'enam') - 0.3, wordOf(4, 'enam') + 0.6);

  // ---------- fase C: dua pipa ----------
  const cIn = ramp(t, cue(4) - 0.4, cue(4) + 0.5);
  const cOut = 1 - ramp(t, cue(5) - 0.5, cue(5) + 0.3, EASE_IN_OUT);
  const fillT = Math.max(0, t - (cue(4) + 0.3));
  const lvlBig = Math.min(170, fillT * 30);
  const lvlSmall = Math.min(170, (fillT * 30) / 16);

  // ---------- fase D: penurunan tekanan ----------
  const dIn = ramp(t, cue(5) - 0.3, cue(5) + 0.6);
  const cols = ramp(t, cue(5) + 0.4, cue(5) + 2.2);
  const note5 = ramp(t, wordOf(5, 'menjaga') - 0.4, wordOf(5, 'menjaga') + 0.5);
  const TUBES = [450, 650, 850, 1050];
  const PD = {x0: 300, x1: 1230, yc: 700, R: 34};
  const tankLvl = 330;
  const headAt = (x: number) => tankLvl + 50 + (x - PD.x0) * 0.26;

  // dua garis tinta parabola
  const dye = (x0: number, ph0: number) => {
    const P = 4.6;
    const ph = (((t / P + ph0) % 1) + 1) % 1;
    const tau = ph * P;
    const pts = Array.from({length: 25}, (_, i) => {
      const f = -1 + (2 * i) / 24;
      return [x0 + PB.vmax * (1 - f * f) * tau * 0.95, PB.yc + f * (PB.R - 2)] as [number, number];
    });
    return <path d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={C.gold} strokeOpacity={0.8 * Math.min(1, cyc(ph) * 1.4)} strokeWidth={4} strokeLinecap="round" />;
  };

  return (
    <AbsoluteFill>
      {/* ===================== A: madu vs air ===================== */}
      <AbsoluteFill style={{opacity: aIn * aOut}}>
        <Stage>
          {/* madu */}
          <TiltedJar x={HX} y={LIP_Y} liquid={HONEY} />
          {(() => {
            const ys = BK_YB - 6 - hLevel;
            const pts: string[] = [];
            const n = 16;
            for (let i = 0; i <= n; i++) {
              const y = LIP_Y + ((ys - 34 - LIP_Y) * i) / n;
              const w = 11 - 6 * (i / n) ** 0.6;
              pts.push(`${i ? 'L' : 'M'}${(HX - w + 1.5 * Math.sin(t * 1.2 + i * 0.4)).toFixed(1)},${y.toFixed(1)}`);
            }
            for (let i = n; i >= 0; i--) {
              const y = LIP_Y + ((ys - 34 - LIP_Y) * i) / n;
              const w = 11 - 6 * (i / n) ** 0.6;
              pts.push(`L${(HX + w + 1.5 * Math.sin(t * 1.2 + i * 0.4)).toFixed(1)},${y.toFixed(1)}`);
            }
            // gulungan madu: heliks yang berputar pelan
            const coil: string[] = [];
            const turns = 4;
            for (let i = 0; i <= 80; i++) {
              const th = (i / 80) * turns * 2 * Math.PI;
              const k = i / 80;
              const rr = 30 * (1 - 0.35 * k);
              coil.push(`${i ? 'L' : 'M'}${(HX + rr * Math.cos(th + t * 2.2)).toFixed(1)},${(ys - 4 - k * 30 + 7 * Math.sin(th + t * 2.2)).toFixed(1)}`);
            }
            return (
              <g>
                <Beaker cx={HX} level={hLevel} color={HONEY} seed={2}>
                  <ellipse cx={HX} cy={ys} rx={52} ry={12} fill={HONEY} opacity={0.6} />
                </Beaker>
                <path d={coil.join(' ')} fill="none" stroke={HONEY_D} strokeWidth={13} strokeLinecap="round" />
                <path d={coil.join(' ')} fill="none" stroke={HONEY} strokeWidth={9} strokeLinecap="round" />
                <path d={coil.join(' ')} fill="none" stroke="#ffe2a0" strokeOpacity={0.5} strokeWidth={2.5} strokeLinecap="round" />
                <path d={pts.join(' ') + ' Z'} fill={HONEY} opacity={0.92} />
                <line x1={HX - 2} y1={LIP_Y} x2={HX - 2} y2={ys - 40} stroke="#fff3d0" strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="10 34" strokeDashoffset={-t * 38} />
                <Glow x={HX} y={ys - 20} r={110} color="kin" opacity={0.35} />
              </g>
            );
          })()}
          {/* air */}
          <TiltedJar x={WX} y={LIP_Y} liquid={C.water} />
          {(() => {
            const ys = BK_YB - 6 - wLevel;
            return (
              <g>
                <Beaker cx={WX} level={wLevel} color={C.water} seed={5} />
                <line x1={WX} y1={LIP_Y} x2={WX} y2={ys} stroke={C.water} strokeOpacity={0.7} strokeWidth={6} />
                <line x1={WX} y1={LIP_Y} x2={WX} y2={ys} stroke="#e6f6ff" strokeOpacity={0.8} strokeWidth={2} strokeDasharray="18 22" strokeDashoffset={-t * 700} />
                {Array.from({length: 6}, (_, k) => {
                  const ph = (((t * 2.2 + k / 6) % 1) + 1) % 1;
                  const dir = k % 2 ? 1 : -1;
                  return <circle key={k} cx={WX + dir * ph * (30 + 8 * k)} cy={ys - Math.sin(ph * Math.PI) * (22 + 4 * k)} r={2.6} fill="#cfeaff" opacity={0.8 * cyc(ph)} />;
                })}
                <ellipse cx={WX} cy={ys + 2} rx={26 + 8 * Math.sin(t * 9)} ry={5} fill="none" stroke="#dff3ff" strokeOpacity={0.6} strokeWidth={2} />
              </g>
            );
          })()}
          <Label x={HX + 40} y={232} size={30} color={HONEY} weight={600} anchor="start">
            madu
          </Label>
          <Label x={WX + 40} y={232} size={30} color={C.water} weight={600} anchor="start">
            air
          </Label>
          <g opacity={vals}>
            <Label x={HX} y={842} size={26} color={C.heat} weight={600}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">η</tspan> ≈ 2–10 Pa·s
            </Label>
            <Label x={WX} y={842} size={26} color={C.heat} weight={600}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">η</tspan> ≈ 0,001 Pa·s
            </Label>
          </g>
          <g opacity={slow}>
            <Label x={HX + 140} y={470} size={24} color={HONEY} anchor="start">
              mengalir
            </Label>
            <Label x={HX + 140} y={500} size={24} color={HONEY} anchor="start">
              sangat lambat
            </Label>
          </g>
          {/* lapisan bergesekan (aliran antara pelat diam & pelat bergerak) */}
          <g opacity={layers}>
            {(() => {
              const x0 = 1160;
              const x1 = 1720;
              const yT = 500;
              const n = 6;
              const lh = 44;
              const yB = yT + 22 + n * lh;
              const vTop = 150;
              const els: React.ReactNode[] = [];
              for (let i = 0; i < n; i++) {
                const yTop = yB - (i + 1) * lh;
                const v = (vTop * (i + 0.5)) / n;
                els.push(<rect key={`r${i}`} x={x0} y={yTop} width={x1 - x0} height={lh} fill={C.water} opacity={0.08 + 0.05 * (i % 2)} />);
                for (let k = 0; k < 9; k++) {
                  const span = x1 - x0;
                  const x = x0 + ((((t * v + (k * span) / 9) % span) + span) % span);
                  const fade = Math.min(1, (x - x0) / 30) * Math.min(1, (x1 - x) / 30);
                  els.push(<line key={`m${i}-${k}`} x1={x} y1={yTop + 10} x2={x} y2={yTop + lh - 10} stroke="#dff3ff" strokeOpacity={0.7 * fade} strokeWidth={3} strokeLinecap="round" />);
                }
                const ax = x1 + 26;
                els.push(<Arrow key={`a${i}`} x1={ax} y1={yTop + lh / 2} x2={ax + 14 + v * 0.55} y2={yTop + lh / 2} color="cyan" width={3} pulse={false} />);
                if (i > 0) {
                  for (let k = 0; k < 4; k++) {
                    const ph = (((t * 0.9 + k / 4 + i * 0.13) % 1) + 1) % 1;
                    const sx = x0 + 40 + rand(i * 9 + k + Math.floor(t * 0.9 + k / 4 + i * 0.13)) * (x1 - x0 - 80);
                    els.push(<circle key={`s${i}-${k}`} cx={sx} cy={yTop + lh} r={3.4} fill={C.heat} opacity={0.9 * cyc(ph)} />);
                  }
                }
              }
              const plate = (y: number, moving: boolean) => (
                <g>
                  <rect x={x0 - 10} y={y} width={x1 - x0 + 20} height={22} rx={6} fill={moving ? '#4a5a8c' : '#2a3660'} stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={2} />
                  {Array.from({length: 10}, (_, k) => {
                    const span = x1 - x0;
                    const x = x0 + (moving ? (((t * vTop + (k * span) / 10) % span) + span) % span : (k * span) / 10 + 20);
                    return <line key={k} x1={x} y1={y + 5} x2={x - 8} y2={y + 17} stroke="#dfe7ff" strokeOpacity={moving ? 0.6 * Math.min(1, (x - x0) / 30) * Math.min(1, (x1 - x) / 30) : 0.4} strokeWidth={2} />;
                  })}
                </g>
              );
              return (
                <g>
                  {els}
                  {plate(yT, true)}
                  {plate(yB, false)}
                  <Label x={x0} y={yT - 26} size={24} color={C.muted} anchor="start">
                    pelat bergerak
                  </Label>
                  <Label x={x0} y={yB + 46} size={24} color={C.muted} anchor="start">
                    pelat diam
                  </Label>
                  <Label x={x1 + 10} y={yB + 46} size={24} color={C.heat} anchor="end" weight={600}>
                    gesekan antarlapisan
                  </Label>
                </g>
              );
            })()}
          </g>
          <Motes x={620} y={540} rx={440} ry={300} n={16} color="kin" opacity={0.3} seed={4} />
        </Stage>
        <Card x={1440} y={300} opacity={Math.min(1, etaCard * 1.4)} scale={0.94 + 0.06 * etaCard} accent={C.heat} style={{padding: '16px 36px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
            <div style={{fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 92, lineHeight: 1, color: C.heat}}>η</div>
            <div style={{fontFamily: FONT.head, fontSize: 30, lineHeight: 1.3}}>
              kekentalan
              <div style={{fontSize: 24, color: C.muted}}>viskositas · satuan Pa·s</div>
            </div>
          </div>
        </Card>
      </AbsoluteFill>

      {/* ===================== B: profil parabola ===================== */}
      <AbsoluteFill style={{opacity: bIn * bOut}}>
        <Stage>
          <PipeProfile t={t} {...PB} lanes={11} per={6} seed={1} />
          <g opacity={0.9 * prof}>
            {dye(PB.x0 + 70, 0)}
            {dye(PB.x0 + 70, 0.5)}
          </g>
          {/* profil kecepatan */}
          <g opacity={prof}>
            {(() => {
              const xs = 1180;
              const sc = 0.8;
              const pts = Array.from({length: 31}, (_, i) => {
                const f = -1 + (2 * i) / 30;
                return [xs + PB.vmax * sc * (1 - f * f), PB.yc + f * PB.R] as [number, number];
              });
              return (
                <g>
                  <line x1={xs} y1={PB.yc - PB.R} x2={xs} y2={PB.yc + PB.R} stroke={C.cyan} strokeOpacity={0.6} strokeWidth={2} />
                  {Array.from({length: 9}, (_, i) => {
                    const f = -0.8 + (1.6 * i) / 8;
                    const L = PB.vmax * sc * (1 - f * f) * (0.96 + 0.04 * Math.sin(t * 3 + i));
                    return <Arrow key={i} x1={xs} y1={PB.yc + f * PB.R} x2={xs + L} y2={PB.yc + f * PB.R} color="cyan" width={3.5} pulse={false} />;
                  })}
                  <path d={pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={interpolateColors(para, [0, 1], [C.cyan, C.gold])} strokeWidth={3 + 2 * para} />
                  <Glow x={xs + PB.vmax * sc * 0.6} y={PB.yc} r={150} color="gold" opacity={para * 0.5} />
                </g>
              );
            })()}
          </g>
          <g opacity={wallLbl}>
            <Label x={760} y={PB.yc - PB.R - 50} size={26} color={C.muted} weight={600}>
              <tspan fontFamily={FONT.serif} fontStyle="italic" fill={C.cyan}>v</tspan> = 0 di dinding
            </Label>
            <Label x={760} y={PB.yc + PB.R + 50} size={26} color={C.muted} weight={600}>
              <tspan fontFamily={FONT.serif} fontStyle="italic" fill={C.cyan}>v</tspan> = 0 di dinding
            </Label>
          </g>
          <g opacity={midLbl}>
            <Label x={1180 + 252} y={PB.yc - 34} size={26} color={C.cyan} weight={700} anchor="start">
              maks
            </Label>
          </g>
          <g opacity={para}>
            <Label x={1180 + 130} y={PB.yc + PB.R + 50} size={30} color={C.gold} weight={700}>
              profil parabola
            </Label>
          </g>
          {/* jari-jari */}
          <g opacity={rDim}>
            <line x1={330} y1={PB.yc} x2={330} y2={PB.yc - PB.R + 6} stroke={C.gold} strokeWidth={4} markerEnd="url(#arrow-gold)" />
            <circle cx={330} cy={PB.yc} r={5} fill={C.gold} />
            <Label x={352} y={PB.yc - PB.R / 2} size={34} color={C.gold} font="serif" italic anchor="start" weight={600}>
              r
            </Label>
          </g>
          <Motes x={830} y={PB.yc} rx={700} ry={200} n={14} color="cyan" opacity={0.3} seed={7} />
        </Stage>
      </AbsoluteFill>

      {/* ===================== C: dua pipa, r ÷ 2 ===================== */}
      <AbsoluteFill style={{opacity: cIn * cOut}}>
        <Stage>
          {(() => {
            const big = {x0: 200, x1: 960, yc: 330, R: 84};
            const small = {x0: 200, x1: 960, yc: 650, R: 42};
            const vB = 220;
            return (
              <g>
                <PipeProfile t={t} {...big} vmax={vB} lanes={9} per={5} seed={2} />
                <PipeProfile t={t} {...small} vmax={vB / 4} lanes={5} per={5} seed={3} />
                {/* aliran keluar ke tabung */}
                {[big, small].map((p, i) => {
                  const w = i === 0 ? 14 : 3.5;
                  const yEnd = i === 0 ? 560 - lvlBig : 860 - lvlSmall;
                  return (
                    <g key={i}>
                      <path d={`M${p.x1},${p.yc} Q${p.x1 + 60},${p.yc} ${p.x1 + 90},${p.yc + 50} L${p.x1 + 100},${yEnd}`} fill="none" stroke={C.water} strokeOpacity={0.6} strokeWidth={w} strokeLinecap="round" />
                      <path
                        d={`M${p.x1},${p.yc} Q${p.x1 + 60},${p.yc} ${p.x1 + 90},${p.yc + 50} L${p.x1 + 100},${yEnd}`}
                        fill="none"
                        stroke="#e6f6ff"
                        strokeOpacity={0.7}
                        strokeWidth={Math.max(1.2, w * 0.3)}
                        strokeDasharray="14 20"
                        strokeDashoffset={-t * (i === 0 ? 300 : 75)}
                      />
                    </g>
                  );
                })}
                <Cylinder x={1000} yTop={400} yBot={560} level={lvlBig} seed={3} />
                <Cylinder x={1000} yTop={700} yBot={860} level={lvlSmall} seed={4} />
                <Label x={1140} y={480} size={32} color={C.water} weight={700} anchor="start">
                  <tspan fontFamily={FONT.serif} fontStyle="italic">Q</tspan>
                </Label>
                <g opacity={sixteen}>
                  <Label x={1140} y={800} size={32} color={C.water} weight={700} anchor="start">
                    <tspan fontFamily={FONT.serif} fontStyle="italic">Q</tspan> / 16
                  </Label>
                </g>
                {/* dimensi jari-jari */}
                {[big, small].map((p, i) => (
                  <g key={`d${i}`}>
                    <line x1={150} y1={p.yc} x2={150} y2={p.yc - p.R + 4} stroke={C.gold} strokeWidth={3.5} markerEnd="url(#arrow-gold)" />
                    <line x1={140} y1={p.yc} x2={200} y2={p.yc} stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 5" />
                    <Label x={128} y={p.yc - p.R / 2} size={30} color={C.gold} font="serif" italic anchor="end" weight={600}>
                      {i === 0 ? 'r' : 'r/2'}
                    </Label>
                  </g>
                ))}
                <Label x={580} y={big.yc - big.R - 36} size={24} color={C.press}>
                  beda tekanan Δp sama
                </Label>
                <Label x={580} y={small.yc - small.R - 36} size={24} color={C.press}>
                  beda tekanan Δp sama
                </Label>
                <Label x={580} y={small.yc + small.R + 40} size={24} color={C.muted}>
                  luas ¼ × kecepatan rata-rata ¼
                </Label>
                <Ripple x={1060} y={780} p={ramp(t, wordOf(4, 'enam') - 0.1, wordOf(4, 'enam') + 1.3, (q) => q)} r={140} color="water" />
              </g>
            );
          })()}
        </Stage>
      </AbsoluteFill>

      {/* ===================== D: tekanan turun sepanjang pipa ===================== */}
      <AbsoluteFill style={{opacity: dIn}}>
        <Stage>
          {/* tangki dengan permukaan tetap (diisi keran) */}
          <line x1={210} y1={190} x2={210} y2={tankLvl} stroke={C.water} strokeOpacity={0.6} strokeWidth={8} />
          <line x1={210} y1={190} x2={210} y2={tankLvl} stroke="#e6f6ff" strokeOpacity={0.7} strokeWidth={2.5} strokeDasharray="16 20" strokeDashoffset={-t * 420} />
          <path d="M140,190 L230,190 L230,206" fill="none" stroke="#9fb0d8" strokeWidth={14} strokeLinejoin="round" />
          <Water x={126} y={tankLvl} w={168} h={PD.yc + 60 - tankLvl} seed={9} bubbles={3} />
          <path d={`M120,${tankLvl - 40} L120,${PD.yc + 66} L300,${PD.yc + 66} L300,${PD.yc + PD.R}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M300,${PD.yc - PD.R} L300,${tankLvl - 40}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} />
          {/* gradien tekanan sepanjang pipa */}
          <defs>
            <linearGradient id="vs-pg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.press} stopOpacity={0.55} />
              <stop offset="100%" stopColor={C.press} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <PipeProfile t={t} x0={PD.x0} x1={PD.x1} yc={PD.yc} R={PD.R} vmax={170} lanes={5} per={7} seed={5} />
          <rect x={PD.x0} y={PD.yc - PD.R} width={PD.x1 - PD.x0} height={2 * PD.R} fill="url(#vs-pg)" opacity={cols} />
          {/* semburan keluar */}
          <path d={`M${PD.x1},${PD.yc} Q${PD.x1 + 60},${PD.yc + 4} ${PD.x1 + 90},${PD.yc + 120}`} fill="none" stroke={C.water} strokeOpacity={0.6} strokeWidth={14} strokeLinecap="round" />
          <path d={`M${PD.x1},${PD.yc} Q${PD.x1 + 60},${PD.yc + 4} ${PD.x1 + 90},${PD.yc + 120}`} fill="none" stroke="#e6f6ff" strokeOpacity={0.7} strokeWidth={3} strokeDasharray="14 20" strokeDashoffset={-t * 260} />
          {/* garis "tanpa kekentalan" */}
          <g opacity={cols}>
            <line x1={300} y1={tankLvl + 50} x2={1120} y2={tankLvl + 50} stroke={C.muted} strokeWidth={2} strokeDasharray="8 8" />
            <Label x={1130} y={tankLvl + 50} size={22} color={C.muted} anchor="start">
              tanpa kekentalan: sama tinggi
            </Label>
          </g>
          {TUBES.map((x, i) => {
            const top = headAt(x) + 3 * Math.sin(t * 2 + i);
            const h = (PD.yc - PD.R - top) * cols;
            return (
              <g key={i}>
                <Water x={x - 13} y={PD.yc - PD.R - h} w={26} h={Math.max(0.1, h)} amp={1.2} seed={i} caustics={false} />
                <rect x={x - 17} y={tankLvl - 10} width={34} height={PD.yc - PD.R - tankLvl + 10} fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} />
                <circle cx={x} cy={PD.yc - PD.R - h} r={6} fill={C.press} opacity={cols} />
              </g>
            );
          })}
          <g opacity={cols}>
            <line x1={TUBES[0] - 60} y1={headAt(TUBES[0] - 60)} x2={TUBES[3] + 60} y2={headAt(TUBES[3] + 60)} stroke={C.press} strokeWidth={3} strokeDasharray="10 7" />
            <Label x={TUBES[3] + 80} y={headAt(TUBES[3] + 60) + 4} size={26} color={C.press} anchor="start" weight={700}>
              <tspan fontFamily={FONT.serif} fontStyle="italic">p</tspan> turun merata
            </Label>
            <Arrow x1={TUBES[0]} y1={PD.yc + PD.R + 60} x2={TUBES[3]} y2={PD.yc + PD.R + 60} color="water" width={4} />
            <Label x={(TUBES[0] + TUBES[3]) / 2} y={PD.yc + PD.R + 96} size={24} color={C.water}>
              arah aliran
            </Label>
          </g>
          <Twinkles x={TUBES[3]} y={headAt(TUBES[3])} rx={80} ry={30} n={3} opacity={note5} seed={2} />
        </Stage>
        <Note x={1500} y={250} p={note5} color={C.press} size={28}>
          <div style={{textAlign: 'center'}}>
            Fluida kental: <Tint c={C.press}>Δp</Tint> diperlukan
            <div>hanya untuk menjaga aliran tetap berjalan</div>
          </div>
        </Note>
      </AbsoluteFill>

      {/* kartu Poiseuille (fase B–C) */}
      <Card x={1560} y={282} opacity={Math.min(1, fml * 1.4) * fmlOut} scale={0.94 + 0.06 * fml} accent={C.water} style={{padding: '18px 36px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 60, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap'}}>
          <Tint c={C.water}>
            <V>Q</V>
          </Tint>{' '}
          ={' '}
          <Frac
            n={
              <>
                π{' '}
                <span style={{color: C.gold, textShadow: `0 0 ${16 * rDim}px rgba(255,201,74,0.6)`}}>
                  <V>r</V>
                  <Sup>4</Sup>
                </span>{' '}
                <Tint c={C.press}>
                  Δ<V>p</V>
                </Tint>
              </>
            }
            d={
              <>
                8 <Tint c={C.heat}><V>η</V></Tint> <V>L</V>
              </>
            }
          />
        </div>
        <div style={{fontSize: 24, color: C.muted, textAlign: 'center', marginTop: 6, fontFamily: FONT.sans}}>hukum Poiseuille · aliran laminar</div>
        <div style={{opacity: row2, maxHeight: row2 < 0.999 ? row2 * 110 : undefined, overflow: 'hidden', marginTop: 10, fontFamily: FONT.serif, fontSize: 56, textAlign: 'center'}}>
          <V>r</V> → <Frac n="r" d="2" size={0.7} /> :{' '}
          <span style={{color: C.gold, fontWeight: 600, textShadow: `0 0 ${18 * sixteen}px rgba(255,201,74,0.5)`}}>
            <V>Q</V> → <Frac n={<V>Q</V>} d="16" size={0.7} />
          </span>
        </div>
      </Card>
      <AbsoluteFill style={{pointerEvents: 'none', opacity: cIn * cOut}}>
        <Stage>
          <Label x={1560} y={600} size={28} color={C.muted} opacity={sixteen}>
            (½)<tspan baselineShift="super" fontSize="0.65em">4</tspan> = 1/16
          </Label>
          <Twinkles x={1560} y={520} rx={200} ry={40} n={4} opacity={sixteen} seed={6} />
        </Stage>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
