import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Water} from '../components/fluid';
import {Glow, Motes, Spark, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

const REFS = [
  'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers (bab Mekanika Fluida)',
  'F. J. Bueche, Schaum’s Outline of College Physics',
  'A. G. Sarojo, Seri Fisika Dasar: Mekanika',
  'NASA Glenn Research Center, Beginner’s Guide to Aeronautics (teori gaya angkat yang keliru)',
  'CRC Handbook of Chemistry and Physics (viskositas, tekanan uap air)',
  'Modul Fisika Umum: Fluida Dinamis',
];

// butir yang mengorbit logo (warna = kode warna fluida)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'water', ph: 0},
  {hue: 'press', ph: 1.05},
  {hue: 'buoy', ph: 2.09},
  {hue: 'force', ph: 3.14},
  {hue: 'spr', ph: 4.19},
  {hue: 'cyan', ph: 5.24},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14, sp: 0.5};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

/** Motif tangki kecil: air bergelombang, balok terapung bergoyang (gaya apung vs berat), gelembung. */
const TankMotif: React.FC<{x: number; y: number; t: number; seed: number; opacity: number}> = ({x, y, t, seed, opacity}) => {
  const w = 210;
  const h = 170;
  const lvl = 110;
  const bob = 4 * Math.sin(t * 1.3 + seed);
  const bx = x + w / 2 + 20 * Math.sin(t * 0.35 + seed);
  const top = y - lvl - 30 + bob;
  return (
    <g opacity={opacity}>
      <Water x={x + 5} y={y - lvl} w={w - 10} h={lvl - 5} amp={3} bubbles={5} seed={seed} />
      <rect x={bx - 32} y={top} width={64} height={46} rx={6} fill="url(#crate)" stroke={C.buoy} strokeWidth={2} transform={`rotate(${3 * Math.sin(t * 0.9 + seed)} ${bx} ${top + 23})`} />
      <line x1={bx} y1={top + 10} x2={bx} y2={top - 34} stroke={C.buoy} strokeWidth={4} markerEnd="url(#arrow-buoy)" />
      <path d={`M${x},${y - h} L${x},${y} L${x + w},${y} L${x + w},${y - h}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={4} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((k) => {
        const yy = y - 20 - k * 22;
        return <line key={k} x1={x + w - 4} y1={yy} x2={x + w - 4 - (8 + k * 0)} y2={yy} stroke={C.muted} strokeWidth={2} opacity={0.6} />;
      })}
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan seri berikutnya. */
export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const logo = ramp(t, 0.2, 1.6);
  const name = ramp(t, 1.4, 2.4);
  const by = ramp(t, 2.4, 3.4);
  const next = ramp(t, 6, 7);
  const motif = ramp(t, 1.0, 3.0);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  const orbitOn = ramp(t, 0.8, 2.2);
  const pts = ORBIT.map((o) => {
    const a = o.ph + t * OC.sp;
    const trail = [1, 2, 3, 4, 5].map((k) => orbitPt(a - k * 0.07));
    return {o, a, p: orbitPt(a), trail, front: Math.sin(a) > 0};
  });
  const ring = (front: boolean) =>
    pts
      .filter((q) => q.front === front)
      .map((q) => <Spark key={q.o.hue} x={q.p[0]} y={q.p[1]} r={5.25 + 1.25 * Math.sin(q.a)} color={q.o.hue} trail={q.trail} opacity={orbitOn * (0.8 + 0.2 * Math.sin(q.a))} />);
  const ellipseD = (() => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const [x, y] = orbitPt((i / 48) * Math.PI * 2);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  })();
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={240} r={440} color="cyan" opacity={0.35 * logo} />
        <Glow x={960} y={188} r={200} color="water" opacity={0.3 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="cyan" opacity={0.45 * logo} seed={13} />
        {/* gelembung naik di seluruh layar */}
        {Array.from({length: 22}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 12) / (8 + 5 * rand(k))) % 1) + 1) % 1;
          const r = 3 + 7 * rand(k * 1.7);
          const x = 100 + rand(k * 5.3) * 1720 + 12 * Math.sin(t * 1.2 + k);
          const y = 1020 - p * 900;
          return (
            <g key={k} opacity={cyc(p) * 0.35 * logo}>
              <circle cx={x} cy={y} r={r} fill="none" stroke="#cfeaff" strokeWidth={1.4} />
              <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#fff" opacity={0.7} />
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.cyan} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <TankMotif x={130} y={870} t={t} seed={0.4} opacity={0.45 * motif} />
        <TankMotif x={1580} y={870} t={t} seed={2.3} opacity={0.45 * motif} />
        <Twinkles x={960} y={530} rx={360} ry={30} n={4} color="gold" opacity={by * 0.7} seed={17} />
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img
          src={staticFile('scientian-logo.png')}
          style={{
            width: 230,
            height: 230,
            opacity: logo,
            scale: String((0.85 + 0.15 * logo) * (1 + 0.015 * Math.sin(t * 1.3))),
            rotate: `${(1 - logo) * -20}deg`,
          }}
        />
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16 + 6 * (1 - name), color: C.ink, marginTop: 4, opacity: name, textShadow: `0 0 ${18 + 8 * Math.sin(t * 1.6)}px ${C.cyan}55`}}>{BRAND.channel}</div>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.muted, letterSpacing: 3, marginTop: 4, opacity: name}}>
          Explore <span style={{color: C.gold}}>Science</span> with Yayan
        </div>
        <div style={{marginTop: 34, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: by, letterSpacing: 2}}>DISUSUN OLEH</div>
        <div style={{fontFamily: FONT.head, fontSize: 46, fontWeight: 600, color: C.ink, opacity: by, marginTop: 2, translate: `0px ${(1 - by) * 12}px`}}>{BRAND.author}</div>
        <div style={{marginTop: 34, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 10, opacity: ramp(t, 3.4, 4.2)}}>RUJUKAN</div>
          {REFS.map((r, i) => {
            const o = ramp(t, 3.7 + i * 0.22, 4.6 + i * 0.22);
            return (
              <div key={r} style={{fontFamily: FONT.sans, fontSize: 21, color: C.muted, lineHeight: 1.55, opacity: o, translate: `0px ${(1 - o) * 10}px`}}>
                {r}
              </div>
            );
          })}
          <div style={{marginTop: 12, fontFamily: FONT.sans, fontSize: 18, color: C.faint, opacity: ramp(t, 5.2, 6.0)}}>
            Ilustrasi skematis · g = 10 m/s², ρ air = 1000 kg/m³, ρ udara ≈ 1,2 kg/m³ · model fluida ideal kecuali pada bagian kekentalan
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            fontFamily: FONT.head,
            fontSize: 30,
            color: C.ink,
            opacity: next,
            padding: '10px 28px',
            borderRadius: 999,
            border: `2px solid ${C.water}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.water}66`,
            translate: `0px ${(1 - next) * 14}px`,
          }}
        >
          <span style={{color: C.water}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
        {ring(true)}
      </svg>
    </AbsoluteFill>
  );
};
