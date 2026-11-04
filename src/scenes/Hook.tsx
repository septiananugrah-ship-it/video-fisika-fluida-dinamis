import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Jet, Pipe, Streamline} from '../components/flow';
import {PressureArrow, Water} from '../components/fluid';
import {Arrow, Glow, Label, Motes, Ripple, Spark, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: tiga kejadian (selang dipencet jempol, dua kertas yang merapat saat ditiup,
// pesawat 70 ton melayang) → dikecilkan menjadi tiga panel → dialirkan ke satu gagasan:
// "lebih cepat → tekanan turun" (pipa menyempit + kolom tekanan) → tangki diam yang mulai mengalir.

const fr = (v: number) => ((v % 1) + 1) % 1;
const CXV = 960; // pusat vinyet (untuk transformasi panel)
const CYV = 500;
const PANEL = [370, 960, 1550];
const PY = 470;
const MINI = 0.31;

/* ------------------------------------------------------------------ */
/* Vinyet 1: selang                                                     */
/* ------------------------------------------------------------------ */
const GROUND = 780;
const NOZ: [number, number] = [606, 484];
const bez = (u: number): [number, number] => {
  const p = [
    [160, 700],
    [330, 730],
    [400, 484],
    [520, 484],
  ];
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
};
const HOSE = Array.from({length: 25}, (_, i) => bez(i / 24));
const HOSE_D = HOSE.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const G_PX = 900; // px/s²
const T_AIR = Math.sqrt((2 * (GROUND - NOZ[1])) / G_PX);
const VX0 = 260;
const VX1 = 1300;

const HoseScene: React.FC<{t: number; thumb: number; lab: number; far: number}> = ({t, thumb, lab, far}) => {
  const vx = mix(VX0, VX1, thumb);
  const x0 = NOZ[0] + VX0 * T_AIR;
  const x1 = NOZ[0] + VX1 * T_AIR;
  const xl = NOZ[0] + vx * T_AIR;
  // jempol: dari istirahat di atas genggaman → menutup separuh atas lubang
  const thx = mix(548, 598, thumb);
  const thy = mix(446, 474, thumb);
  const thr = mix(-25, 70, thumb);
  return (
    <g>
      <Glow x={900} y={600} r={620} color="water" opacity={0.22} />
      {/* tanah & rumput */}
      <line x1={160} y1={GROUND} x2={1760} y2={GROUND} stroke={C.muted} strokeOpacity={0.6} strokeWidth={3} />
      {Array.from({length: 26}, (_, k) => {
        const x = 180 + k * 61 + 12 * rand(k);
        const sw = 5 * Math.sin(t * 1.6 + k * 0.7);
        return <path key={k} d={`M${x},${GROUND} q${3 + sw},-14 ${6 + sw},-22 M${x + 8},${GROUND} q${-2 + sw},-10 ${-1 + sw},-16`} fill="none" stroke={C.buoy} strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" />;
      })}
      {/* selang + air yang mengalir di dalamnya */}
      <path d={HOSE_D} fill="none" stroke="#1d5a3a" strokeWidth={30} strokeLinecap="round" />
      <path d={HOSE_D} fill="none" stroke="#3fae6a" strokeWidth={24} strokeLinecap="round" />
      <path d={HOSE_D} fill="none" stroke="#bff5d4" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" transform="translate(0 -6)" />
      <Streamline pts={HOSE} speed={150} n={7} color="#dff3ff" line={0} seed={2} />
      {/* nosel logam */}
      <rect x={515} y={468} width={88} height={32} rx={7} fill="#7d89ad" stroke="#c9d3ee" strokeWidth={2} />
      <rect x={520} y={472} width={80} height={6} rx={3} fill="#fff" opacity={0.3} />
      {/* semburan air */}
      <Jet x={NOZ[0]} y={NOZ[1]} vx={vx} g={G_PX} yFloor={GROUND} width={mix(15, 8, thumb)} drops={14} />
      {/* kabut halus di mulut nosel saat ditutup jempol */}
      {Array.from({length: 8}, (_, k) => {
        const ph = fr(t * 1.8 + k / 8);
        const ang = -0.35 + 0.7 * rand(k * 3.7);
        return <circle key={k} cx={NOZ[0] + 90 * ph * Math.cos(ang)} cy={NOZ[1] + 70 * ph * Math.sin(ang) + 30 * ph * ph} r={2} fill="#dff3ff" opacity={0.7 * cyc(ph) * thumb} />;
      })}
      {/* genggaman tangan + jempol */}
      <rect x={494} y={452} width={64} height={64} rx={24} fill="#d9a27a" stroke="#8a5a3a" strokeWidth={2} />
      {[0, 1, 2].map((k) => (
        <line key={k} x1={500 + k * 17} y1={500} x2={506 + k * 17} y2={514} stroke="#8a5a3a" strokeWidth={2} strokeLinecap="round" />
      ))}
      <g transform={`translate(${thx} ${thy}) rotate(${thr})`}>
        <ellipse cx={0} cy={0} rx={24} ry={11} fill="#e3b08a" stroke="#8a5a3a" strokeWidth={2} />
        <ellipse cx={12} cy={-2} rx={7} ry={5} fill="#f4d6c0" opacity={0.8} />
      </g>
      {/* kaca pembesar: tampak depan lubang nosel */}
      <g opacity={lab}>
        <line x1={466} y1={346} x2={548} y2={458} stroke={C.muted} strokeWidth={2} strokeDasharray="6 7" strokeDashoffset={-t * 14} />
        <circle cx={400} cy={300} r={88} fill="#0a1230" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} />
        <defs>
          <clipPath id="hk-lens">
            <circle cx={400} cy={300} r={84} />
          </clipPath>
        </defs>
        <g clipPath="url(#hk-lens)">
          <circle cx={400} cy={300} r={54} fill="#7d89ad" stroke="#c9d3ee" strokeWidth={2} />
          <circle cx={400} cy={300} r={42} fill={C.water} opacity={0.85} />
          {Array.from({length: 9}, (_, k) => {
            const ph = fr(t * 0.9 + k / 9);
            const a = k * 2.4;
            return <circle key={k} cx={400 + Math.cos(a) * 36 * ph} cy={300 + Math.sin(a) * 36 * ph} r={1.5 + 2.5 * ph} fill="#fff" opacity={0.8 * cyc(ph)} />;
          })}
          <g transform={`translate(${mix(540, 400, thumb)} ${mix(240, 274, thumb)}) rotate(${mix(-30, 0, thumb)})`}>
            <ellipse cx={0} cy={-30} rx={72} ry={52} fill="#e3b08a" stroke="#8a5a3a" strokeWidth={2.5} />
            <path d="M-30,-6 Q0,6 30,-6" fill="none" stroke="#8a5a3a" strokeOpacity={0.5} strokeWidth={2} />
          </g>
        </g>
        <Label x={400} y={414} size={26} color={C.cyan} opacity={ramp(thumb, 0.4, 1)}>
          lubang menyempit
        </Label>
      </g>
      {/* penanda jarak jatuh */}
      <g opacity={lab}>
        <line x1={x0} y1={GROUND - 4} x2={x0} y2={GROUND - 54} stroke={C.muted} strokeWidth={3} />
        <path d={`M${x0},${GROUND - 54} l26,9 l-26,9 Z`} fill={C.muted} />
        <Label x={x0} y={GROUND + 34} size={25} color={C.muted}>
          tanpa jempol
        </Label>
        <g opacity={far}>
          <line x1={x1} y1={GROUND - 4} x2={x1} y2={GROUND - 64} stroke={C.cyan} strokeWidth={3} />
          <path d={`M${x1},${GROUND - 64} l30,10 l-30,10 Z`} fill={C.cyan} />
          <Label x={x1} y={GROUND + 34} size={25} color={C.cyan}>
            dengan jempol
          </Label>
          <Arrow x1={x0 + 30} y1={GROUND + 72} x2={x1 - 30} y2={GROUND + 72} color="cyan" width={4} both />
          <Label x={(x0 + x1) / 2} y={GROUND + 40} size={30} weight={600} color={C.cyan}>
            jauh lebih jauh
          </Label>
        </g>
        <Ripple x={xl} y={GROUND} p={fr(t * 0.8)} r={50} color="water" rings={2} width={2} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Vinyet 2: dua kertas tergantung                                      */
/* ------------------------------------------------------------------ */
const PIV = [880, 1040];
const PTOP = 270;
const LEN = 430;
const DEPTH: [number, number] = [24, -13];

const sheetPts = (i: number, bend: number, t: number, flut: number): [number, number][] => {
  const dir = i === 0 ? 1 : -1;
  return Array.from({length: 17}, (_, k) => {
    const s = k / 16;
    const off = bend * s ** 1.7 + flut * s * Math.sin(t * 7 + s * 5 + i * 2);
    return [PIV[i] + dir * off, PTOP + LEN * s];
  });
};

const PaperScene: React.FC<{t: number; blow: number; bend: number; ghost: number; press: number; lab: number}> = ({t, blow, bend, ghost, press, lab}) => {
  const lanes = [-24, -12, 0, 12, 24];
  return (
    <g>
      <Glow x={960} y={480} r={460} color="cyan" opacity={0.18 + 0.2 * blow} />
      <Motes x={960} y={480} rx={520} ry={260} n={26} color="white" opacity={0.35} seed={4} />
      {/* tali gantungan */}
      {PIV.map((x, i) => (
        <g key={i}>
          <line x1={x} y1={170} x2={x} y2={PTOP} stroke="#cfd8f0" strokeOpacity={0.6} strokeWidth={2} />
          <rect x={x - 9} y={PTOP - 10} width={18} height={14} rx={3} fill={C.gold} opacity={0.85} />
        </g>
      ))}
      {/* dugaan keliru: kertas terdorong menjauh (garis putus-putus) */}
      {ghost > 0.001
        ? [0, 1].map((i) => {
            const pts = sheetPts(i, -60, t, 0);
            return (
              <g key={`g${i}`} opacity={ghost * 0.6}>
                <path d={pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x},${y}`).join(' ')} fill="none" stroke={C.muted} strokeWidth={3} strokeDasharray="8 8" />
              </g>
            );
          })
        : null}
      {/* aliran udara dari sedotan, naik di celah */}
      {lanes.map((dx, k) => (
        <Streamline
          key={k}
          pts={[
            [960 + dx * 0.4, 770],
            [960 + dx, 700],
            [960 + dx, 320],
            [960 + dx * 2, 250],
            [960 + dx * 4.5, 185],
          ]}
          gain={[0.9, 1.5, 1.6, 1.0, 0.6]}
          speed={380}
          n={6}
          color="cyan"
          line={0.22}
          seed={k * 3}
          opacity={blow}
        />
      ))}
      {/* kertas */}
      {[0, 1].map((i) => {
        const pts = sheetPts(i, 52 * bend, t, 3 * blow);
        const back = pts.map(([x, y]) => [x + DEPTH[0], y + DEPTH[1]] as [number, number]).reverse();
        const d = [...pts, ...back].map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
        return (
          <g key={i}>
            <path d={d} fill="#e9eef8" opacity={0.88} stroke="#a9b6d6" strokeWidth={2} strokeLinejoin="round" />
            <path d={pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke="#fff" strokeWidth={3} />
            {[0.3, 0.5, 0.7].map((s) => {
              const p = pts[Math.round(s * 16)];
              return <line key={s} x1={p[0] + 4} y1={p[1] - 2} x2={p[0] + DEPTH[0] - 3} y2={p[1] + DEPTH[1] + 2} stroke="#8fa0cc" strokeOpacity={0.5} strokeWidth={1.5} />;
            })}
          </g>
        );
      })}
      {/* panah tekanan: luar (udara diam) panjang, dalam (udara cepat) pendek */}
      {press > 0.001
        ? [0, 1].map((i) => {
            const pts = sheetPts(i, 52 * bend, t, 0);
            const dir = i === 0 ? -1 : 1;
            return [5, 9, 13].map((k) => {
              const [x, y] = pts[k];
              return (
                <g key={`${i}-${k}`}>
                  <PressureArrow x={x + dir * 3} y={y} nx={dir} ny={0} L={50 * press} width={4} opacity={press} />
                  <PressureArrow x={x - dir * 3} y={y} nx={-dir} ny={0} L={14 * press} width={3} opacity={press * 0.8} />
                </g>
              );
            });
          })
        : null}
      {/* sedotan */}
      <path d="M600,850 Q900,862 958,790 L960,774" fill="none" stroke="#e8edf7" strokeWidth={16} strokeLinecap="round" />
      <path d="M600,850 Q900,862 958,790 L960,774" fill="none" stroke={C.press} strokeOpacity={0.7} strokeWidth={16} strokeDasharray="10 14" strokeLinecap="butt" />
      {Array.from({length: 4}, (_, k) => {
        const ph = fr(t * 1.4 + k / 4);
        return <circle key={k} cx={960 + 14 * Math.sin(k * 2.1) * ph} cy={772 - 50 * ph} r={6 + 16 * ph} fill="none" stroke="#dff3ff" strokeWidth={1.5} opacity={0.6 * cyc(ph) * blow} />;
      })}
      <g opacity={lab}>
        <Label x={640} y={826} size={26} color={C.muted} anchor="end" opacity={blow}>
          tiup
        </Label>
        <Label x={700} y={420} size={26} color={C.muted} opacity={press}>
          udara diam
        </Label>
        <Label x={1240} y={420} size={26} color={C.muted} opacity={press}>
          udara diam
        </Label>
        <g opacity={press}>
          <line x1={990} y1={600} x2={1180} y2={640} stroke={C.cyan} strokeWidth={2} strokeDasharray="5 6" />
          <Label x={1192} y={642} size={28} weight={600} color={C.cyan} anchor="start">
            udara cepat
          </Label>
        </g>
        <g opacity={ghost}>
          <Label x={640} y={640} size={26} color={C.muted}>
            dugaan: menjauh
          </Label>
          <path d="M540,616 L740,664 M540,664 L740,616" stroke={C.heat} strokeWidth={5} strokeLinecap="round" opacity={ramp(ghost, 0.3, 1)} />
        </g>
        <Label x={960} y={190} size={30} weight={600} color={C.gold} opacity={press}>
          saling merapat
        </Label>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Vinyet 3: pesawat 70 ton + penampang sayap                           */
/* ------------------------------------------------------------------ */
// NACA 4412 sederhana (satuan tali busur)
const camber = (u: number) => {
  if (u <= 0 || u >= 1) return 0;
  const m = 0.04;
  const p = 0.4;
  return u < p ? (m / (p * p)) * (2 * p * u - u * u) : (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * u - u * u);
};
const thick = (u: number) => {
  if (u <= 0 || u >= 1) return 0;
  return 5 * 0.13 * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4);
};
const AF = {x: 1300, y: 560, c: 290, aoa: (5 * Math.PI) / 180};
const toScreen = (u: number, y: number): [number, number] => {
  // putar terhadap titik seperempat tali busur
  const du = u - 0.25;
  const ur = du * Math.cos(AF.aoa) + y * Math.sin(AF.aoa);
  const yr = -du * Math.sin(AF.aoa) + y * Math.cos(AF.aoa);
  return [AF.x + (ur + 0.25) * AF.c, AF.y - yr * AF.c];
};
const AIRFOIL_D = (() => {
  const up = Array.from({length: 41}, (_, i) => {
    const u = (1 - Math.cos((Math.PI * i) / 40)) / 2;
    return toScreen(u, camber(u) + thick(u));
  });
  const lo = Array.from({length: 41}, (_, i) => {
    const u = (1 - Math.cos((Math.PI * (40 - i)) / 40)) / 2;
    return toScreen(u, camber(u) - thick(u));
  });
  return [...up, ...lo].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
})();
const ss = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const AF_LANES = [0.05, 0.14, 0.27, 0.45].flatMap((d) => [d, -d]).map((d) => {
  const up = d > 0;
  const ad = Math.abs(d);
  const pts: [number, number][] = [];
  const gain: number[] = [];
  for (let i = 0; i <= 30; i++) {
    const u = -0.55 + (2.2 * i) / 30;
    const surf = up ? camber(u) + thick(u) : camber(u) - thick(u);
    const decay = Math.exp(-ad / 0.22);
    let y = surf * decay + d;
    y += 0.05 * Math.exp(-((u + 0.1) ** 2) / 0.08) * Math.exp(-ad / 0.5); // aliran naik di depan
    y -= 0.09 * ss(0.6, 1.6, u) * Math.exp(-ad / 0.7); // aliran turun di belakang
    pts.push(toScreen(u, y));
    const hump = u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 0.6 : 0;
    gain.push(up ? 1 + 0.9 * Math.exp(-ad / 0.3) * hump : 1 - 0.25 * Math.exp(-ad / 0.3) * hump);
  }
  return {pts, gain, up};
});

const Plane: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id="hk-fus" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f2f5ff" />
        <stop offset="60%" stopColor="#c6cee6" />
        <stop offset="100%" stopColor="#7d89ad" />
      </linearGradient>
    </defs>
    {/* sayap sisi jauh */}
    <path d="M40,-8 L-120,-70 L-150,-70 L-40,-8 Z" fill="#8f9bc0" opacity={0.8} />
    {/* sirip tegak & horizontal */}
    <path d="M-330,-30 L-385,-150 L-340,-150 L-262,-36 Z" fill="url(#hk-fus)" stroke="#7d89ad" strokeWidth={2} strokeLinejoin="round" />
    <path d="M-382,-148 L-342,-148 L-332,-128 L-374,-128 Z" fill={C.cyan} opacity={0.85} />
    {/* badan */}
    <path d="M-395,-8 Q-392,-38 -330,-42 L290,-42 Q372,-40 402,2 Q372,34 300,36 L-320,36 Q-380,30 -395,-8 Z" fill="url(#hk-fus)" stroke="#8f9bc0" strokeWidth={2} />
    <path d="M-380,6 L360,6" stroke={C.cyan} strokeWidth={5} opacity={0.75} />
    {Array.from({length: 24}, (_, k) => (
      <rect key={k} x={-280 + k * 22} y={-24} width={10} height={12} rx={4} fill="#1b2440" opacity={0.75} />
    ))}
    <path d="M348,-22 L380,-18 L388,-6 L352,-8 Z" fill="#1b2440" opacity={0.85} />
    <rect x={-120} y={-30} width={10} height={52} rx={3} fill="none" stroke="#8f9bc0" strokeWidth={1.5} />
    {/* stabilizer horizontal */}
    <path d="M-372,-12 L-292,-14 L-318,8 Z" fill="#a9b6d6" stroke="#7d89ad" strokeWidth={1.5} />
    {/* sayap sisi dekat + mesin */}
    <path d="M60,14 L-140,96 L-178,98 L-40,16 Z" fill="#c6cee6" stroke="#7d89ad" strokeWidth={2} strokeLinejoin="round" />
    <ellipse cx={-30} cy={52} rx={52} ry={19} fill="#a9b6d6" stroke="#7d89ad" strokeWidth={2} />
    <ellipse cx={20} cy={52} rx={8} ry={17} fill="#1b2440" />
    <circle cx={20} cy={52} r={4} fill="#c6cee6" opacity={0.4 + 0.4 * Math.abs(Math.sin(t * 20))} />
    {/* lampu kedip */}
    <circle cx={-360} cy={-150} r={5} fill={C.heat} opacity={Math.max(0, Math.sin(t * 4)) ** 4} />
  </g>
);

const CLOUDS = Array.from({length: 7}, (_, i) => ({y: 220 + rand(i * 3.1) * 520, s: 0.6 + rand(i * 5.7) * 0.8, v: 0.05 + rand(i * 1.9) * 0.06, o: rand(i * 8.3)}));

const PlaneScene: React.FC<{t: number; lab: number; ton: number; lift: number}> = ({t, lab, ton, lift}) => {
  const bob = 7 * Math.sin(t * 0.8);
  const pitch = 1.2 * Math.sin(t * 0.55);
  const P = {x: 720, y: 440 + bob};
  return (
    <g>
      <Glow x={960} y={480} r={720} color="cyan" opacity={0.16} />
      {/* awan bergeser ke kiri (pesawat melaju ke kanan) */}
      {CLOUDS.map((c, i) => {
        const ph = fr(t * c.v + c.o);
        const x = 1820 - ph * 1700;
        return (
          <g key={i} opacity={0.22 * cyc(ph) * 1.2} transform={`translate(${x} ${c.y}) scale(${c.s})`}>
            <ellipse cx={0} cy={0} rx={90} ry={26} fill="#cfd8f0" />
            <ellipse cx={-30} cy={-16} rx={44} ry={26} fill="#cfd8f0" />
            <ellipse cx={26} cy={-20} rx={52} ry={30} fill="#cfd8f0" />
          </g>
        );
      })}
      {/* garis gerak di belakang pesawat */}
      {Array.from({length: 6}, (_, k) => {
        const ph = fr(t * 1.3 + k / 6);
        const y = P.y - 30 + k * 14;
        return <line key={k} x1={P.x - 420 - 220 * ph} y1={y} x2={P.x - 420 - 220 * ph + 120} y2={y} stroke="#cfd8f0" strokeWidth={2} opacity={0.4 * cyc(ph)} strokeLinecap="round" />;
      })}
      <g transform={`translate(${P.x} ${P.y}) rotate(${pitch})`}>
        <Plane t={t} />
      </g>
      {/* gaya: berat ke bawah, gaya angkat (belum diketahui) ke atas */}
      <g opacity={lab}>
        <Arrow x1={P.x - 40} y1={P.y + 40} x2={P.x - 40} y2={P.y + 210} color="force" width={6} opacity={ton} />
        <Label x={P.x - 66} y={P.y + 200} size={34} weight={700} color={C.force} anchor="end" opacity={ton}>
          ≈ 70 ton
        </Label>
        <Arrow x1={P.x - 40} y1={P.y - 50} x2={P.x - 40} y2={P.y - 220} color="force" width={6} dash="12 10" opacity={lift * 0.85} />
        <Label x={P.x - 10} y={P.y - 222} size={46} weight={700} color={C.force} anchor="start" opacity={lift}>
          ?
        </Label>
        {/* penampang sayap */}
        <line x1={P.x + 20} y1={P.y + 40} x2={AF.x - 175} y2={AF.y - 40} stroke={C.muted} strokeWidth={2} strokeDasharray="6 7" strokeDashoffset={-t * 14} />
      </g>
      <g opacity={lab}>
        <circle cx={AF.x + 120} cy={AF.y} r={210} fill="#0a1230" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={3} />
        <defs>
          <clipPath id="hk-af">
            <circle cx={AF.x + 120} cy={AF.y} r={205} />
          </clipPath>
        </defs>
        <g clipPath="url(#hk-af)">
          {AF_LANES.map((l, k) => (
            <Streamline key={k} pts={l.pts} gain={l.gain} speed={230} n={5} color={l.up ? 'cyan' : '#dff3ff'} line={0.28} seed={k * 2.3} />
          ))}
          <path d={AIRFOIL_D} fill="#c6cee6" stroke="#f2f5ff" strokeWidth={2} />
        </g>
        <Label x={AF.x + 120} y={AF.y + 238} size={25} color={C.muted}>
          penampang sayap
        </Label>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Kolom tekanan (piezometer) di atas pipa                              */
/* ------------------------------------------------------------------ */
const KP = {x0: 200, x1: 1720, yc: 540};
const KNOTS: [number, number][] = [
  [200, 92],
  [700, 92],
  [960, 46],
  [1220, 92],
  [1720, 92],
];
const Piezo: React.FC<{x: number; r: number; top: number; t: number; hot: number}> = ({x, r, top, t, hot}) => {
  const base = KP.yc - r;
  const y = top + 3 * Math.sin(t * 2.2 + x * 0.01);
  return (
    <g>
      <rect x={x - 17} y={200} width={34} height={base - 200 + 2} fill="#0a1230" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={4} />
      <rect x={x - 13} y={y} width={26} height={base - y + 2} fill={C.water} opacity={0.75} />
      <ellipse cx={x} cy={y} rx={13} ry={3.5} fill="#e0f4ff" opacity={0.7} />
      <rect x={x - 13} y={y} width={26} height={base - y} fill={C.press} opacity={0.35 * hot} />
    </g>
  );
};

export const Hook: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---- babak ----
  const A = 1 - ramp(t, cue(1) - 0.7, cue(1) - 0.1, EASE_IN_OUT);
  const B = win(t, cue(1) - 0.5, cue(2) - 0.7, 0.6, 0.6);
  const Cin = ramp(t, cue(2) - 0.5, cue(2) + 0.2);
  const trip = ramp(t, cue(3) - 0.7, cue(3) + 0.6, EASE_IN_OUT);
  const tripOut = ramp(t, cue(5) - 0.7, cue(5) - 0.1, EASE_IN_OUT);
  const D = win(t, cue(5) - 0.4, cue(6) - 0.6, 0.6, 0.6);
  const E = ramp(t, cue(6) - 0.4, cue(6) + 0.3);

  // selang
  const tThumb = wordOf(0, 'jempol');
  const thumb = ramp(t, tThumb - 0.5, tThumb + 0.6, EASE_IN_OUT);
  const far = ramp(t, wordOf(0, 'menyembur') - 0.2, wordOf(0, 'menyembur') + 0.6);
  // kertas
  const blow = ramp(t, wordOf(1, 'tiup') - 0.2, wordOf(1, 'tiup') + 0.5);
  const bend = ramp(t, wordOf(1, 'tiup') + 0.3, wordOf(1, 'tiup') + 2.2, EASE_IN_OUT);
  const ghost = win(t, wordOf(1, 'tidak') - 0.2, wordOf(1, 'merapat') - 0.3, 0.5, 0.6);
  const press = ramp(t, wordOf(1, 'merapat') - 0.3, wordOf(1, 'merapat') + 0.5);
  // pesawat
  const ton = ramp(t, wordOf(2, 'tujuh') - 0.2, wordOf(2, 'tujuh') + 0.5, BACK);
  const lift = ramp(t, wordOf(2, 'ditopang') - 0.2, wordOf(2, 'ditopang') + 0.6);
  // panel
  const hoseMini = ramp(t, cue(3) - 0.1, cue(3) + 0.5) * (1 - tripOut);
  const paperMini = ramp(t, cue(3) + 0.1, cue(3) + 0.7) * (1 - tripOut);
  const frames = ramp(t, cue(3) - 0.3, cue(3) + 0.5) * (1 - tripOut);
  const unrelated = win(t, cue(3) + 0.6, cue(4) + 0.2, 0.5, 0.5);
  const conv = ramp(t, cue(4) + 0.6, wordOf(4, 'gagasan'), EASE_IN_OUT);
  const node = ramp(t, wordOf(4, 'gagasan') - 0.3, wordOf(4, 'gagasan') + 0.4, BACK);
  const drift = 18 * unrelated; // panel sedikit memisah saat "tak berhubungan"
  // gagasan kunci
  const fast = ramp(t, wordOf(5, 'cepat') - 0.2, wordOf(5, 'cepat') + 0.5);
  const drop = ramp(t, wordOf(5, 'turun') - 0.5, wordOf(5, 'turun') + 0.4, EASE_IN_OUT);
  // tangki
  const open = ramp(t, wordOf(6, 'sekarang') - 0.1, wordOf(6, 'sekarang') + 0.8, EASE_IN_OUT);
  const dyn = ramp(t, wordOf(6, 'bergerak') - 0.3, wordOf(6, 'bergerak') + 0.4);
  const level = 330 - 14 * ramp(t, wordOf(6, 'sekarang'), dur, (x) => x);
  const surfY = 794 - level;

  const plS = mix(1, MINI, trip);
  const plX = mix(CXV, PANEL[2] + drift, trip);
  const plY = mix(CYV, PY, trip);
  const mini = (x: number, s = MINI) => `translate(${x} ${PY}) scale(${s}) translate(${-CXV} ${-CYV})`;

  // garis arus di dalam tangki menuju lubang
  const OUT: [number, number] = [1000, 756];
  const tankLanes = [560, 660, 760, 860, 940].map((x0, k) => {
    const y0 = surfY + 40 + k * 18;
    const pts: [number, number][] = Array.from({length: 13}, (_, i) => {
      const u = i / 12;
      const cx = x0 + 40;
      const cy = 760;
      return [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * OUT[0], (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * OUT[1]];
    });
    const gain = pts.map((_, i) => 0.35 + 2.6 * (i / 12) ** 3);
    return {pts, gain};
  });

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Vinyet penuh ================= */}
        {A > 0.001 ? (
          <g opacity={A}>
            <HoseScene t={t} thumb={thumb} lab={1} far={far} />
          </g>
        ) : null}
        {B > 0.001 ? (
          <g opacity={B}>
            <PaperScene t={t} blow={blow} bend={bend} ghost={ghost} press={press} lab={1} />
          </g>
        ) : null}
        {Cin * (1 - tripOut) > 0.001 ? (
          <g opacity={Cin * (1 - tripOut)} transform={`translate(${plX} ${plY}) scale(${plS}) translate(${-CXV} ${-CYV})`}>
            <PlaneScene t={t} lab={1 - trip} ton={ton} lift={lift} />
          </g>
        ) : null}

        {/* ================= Tiga panel ================= */}
        {frames > 0.001 ? (
          <g>
            {PANEL.map((x, i) => {
              const xx = x + (i - 1) * drift;
              return (
                <g key={i} opacity={frames}>
                  <rect x={xx - 270} y={PY - 165} width={540} height={330} rx={22} fill="rgba(10,18,44,0.55)" stroke={[C.water, C.cyan, C.force][i]} strokeOpacity={0.55} strokeWidth={2.5} />
                  <Label x={xx} y={PY + 200} size={30} weight={600} color={[C.water, C.cyan, C.force][i]}>
                    {['selang', 'kertas', 'pesawat'][i]}
                  </Label>
                  <Label x={xx + 230} y={PY - 128} size={46} weight={700} color={C.muted} opacity={unrelated * (0.6 + 0.4 * Math.sin(t * 3 + i * 2))}>
                    ?
                  </Label>
                </g>
              );
            })}
          </g>
        ) : null}
        {hoseMini > 0.001 ? (
          <g opacity={hoseMini} transform={mini(PANEL[0] - drift)}>
            <HoseScene t={t} thumb={1} lab={0} far={0} />
          </g>
        ) : null}
        {paperMini > 0.001 ? (
          <g opacity={paperMini} transform={mini(PANEL[1])}>
            <PaperScene t={t} blow={1} bend={1} ghost={0} press={0} lab={0} />
          </g>
        ) : null}
        {/* aliran dari ketiga panel menuju satu gagasan */}
        {conv * (1 - tripOut) > 0.001 ? (
          <g opacity={1 - tripOut}>
            {PANEL.map((x, i) => {
              const pts: [number, number][] = [
                [x, PY + 232],
                [mix(x, 960, 0.5), PY + 290],
                [960, 790],
              ];
              return <Stream key={i} pts={pts} color={(['water', 'cyan', 'force'] as const)[i]} n={6} speed={0.7} r={5} opacity={conv} seed={i} />;
            })}
            <Glow x={960} y={790} r={150} color="gold" opacity={0.6 * node} />
            <Ripple x={960} y={790} p={(t - wordOf(4, 'gagasan')) / 1.4} r={140} color="gold" />
            <circle cx={960} cy={790} r={16 * node + 3 * Math.sin(t * 3) * node} fill={C.gold} opacity={node} />
            <circle cx={960} cy={790} r={6 * node} fill="#fff" opacity={node} />
            <Label x={1000} y={790} size={30} weight={600} color={C.gold} anchor="start" opacity={node}>
              satu gagasan
            </Label>
          </g>
        ) : null}

        {/* ================= Gagasan kunci ================= */}
        {D > 0.001 ? (
          <g opacity={D}>
            <Glow x={960} y={KP.yc} r={420} color="cyan" opacity={0.3 * fast} />
            <Glow x={960} y={330} r={240} color="press" opacity={0.35 * drop} />
            {[
              [480, 92, 250],
              [960, 46, mix(250, 400, drop)],
              [1440, 92, 250],
            ].map(([x, r, top], i) => (
              <Piezo key={i} x={x} r={r} top={top} t={t} hot={i === 1 ? drop : 0} />
            ))}
            <Pipe x0={KP.x0} x1={KP.x1} yc={KP.yc} knots={KNOTS} v0={110} lanes={7} perLane={6} />
            <Arrow x1={880} y1={KP.yc + 110} x2={1040} y2={KP.yc + 110} color="cyan" width={6} opacity={fast} />
            <Arrow x1={440} y1={KP.yc + 140} x2={500} y2={KP.yc + 140} color="cyan" width={5} opacity={fast * 0.8} />
            <Label x={960} y={KP.yc + 148} size={30} color={C.cyan} opacity={fast} font="serif" italic>
              v besar
            </Label>
            <Label x={470} y={KP.yc + 172} size={28} color={C.cyan} opacity={fast * 0.8} font="serif" italic>
              v kecil
            </Label>
            <Arrow x1={1030} y1={260} x2={1030} y2={380} color="press" width={6} opacity={drop} />
            <Label x={1056} y={300} size={34} weight={700} color={C.press} anchor="start" opacity={drop}>
              tekanan turun
            </Label>
            <Twinkles x={960} y={400} rx={60} ry={40} n={4} color="press" opacity={drop} seed={3} />
          </g>
        ) : null}

        {/* ================= Diam → bergerak ================= */}
        {E > 0.001 ? (
          <g opacity={E}>
            <Glow x={760} y={620} r={460} color="water" opacity={0.3} />
            <ellipse cx={760} cy={812} rx={300} ry={16} fill="#000" opacity={0.35} />
            <Water x={526} y={surfY} w={468} h={level} bubbles={4} seed={2} amp={mix(2, 4, open)} />
            {/* panah tekanan: kenangan video sebelumnya */}
            {[560, 640, 720].map((y, k) => (
              <PressureArrow key={k} x={530} y={y} nx={1} ny={0} L={(18 + 0.12 * (y - surfY)) * (1 - 0.6 * dyn)} width={4} opacity={0.8 * (1 - 0.5 * dyn)} />
            ))}
            {tankLanes.map((l, k) => (
              <Streamline key={k} pts={l.pts} gain={l.gain} speed={70} n={5} color="#dff3ff" line={0.18} seed={k} opacity={open} />
            ))}
            <path d="M520,380 L520,800 L1000,800 L1000,380" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
            <line x1={534} y1={394} x2={534} y2={780} stroke="#fff" strokeOpacity={0.15} strokeWidth={5} />
            {/* katup lubang */}
            <rect x={998} y={742} width={30} height={28} rx={5} fill="#7d89ad" stroke="#c9d3ee" strokeWidth={2} />
            <rect x={1004} y={mix(744, 712, open)} width={18} height={26} rx={3} fill={C.press} opacity={0.85} />
            <Jet x={1028} y={756} vx={mix(1, 380, open)} g={G_PX} yFloor={846} width={9} opacity={open} drops={8} />
            {/* aliran di lantai menuju kanan */}
            <rect x={1160} y={840} width={660} height={10} rx={5} fill={C.water} opacity={0.5 * open} />
            <Streamline
              pts={[
                [1170, 844],
                [1820, 844],
              ]}
              speed={260}
              n={8}
              color="#dff3ff"
              line={0}
              opacity={open}
            />
            <line x1={1000} y1={852} x2={1840} y2={852} stroke={C.muted} strokeOpacity={0.5} strokeWidth={3} />
            <Motes x={1300} y={600} rx={420} ry={200} n={22} color="cyan" opacity={0.4 * dyn} seed={9} />
            <Spark x={1028 + 40 * open} y={756 + 6 * open} r={6} color="cyan" opacity={0.7 * open * (0.6 + 0.4 * Math.sin(t * 4))} />
          </g>
        ) : null}
      </Stage>

      {/* kalimat kunci */}
      {D > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 770,
            textAlign: 'center',
            fontFamily: FONT.head,
            fontSize: 50,
            fontWeight: 700,
            color: C.ink,
            opacity: D * ramp(t, wordOf(5, 'cepat'), wordOf(5, 'cepat') + 0.6),
          }}
        >
          <span style={{color: C.cyan}}>lebih cepat</span>
          <span style={{color: C.muted, margin: '0 26px'}}>→</span>
          <span style={{color: C.press, opacity: ramp(t, wordOf(5, 'turun') - 0.3, wordOf(5, 'turun') + 0.4)}}>tekanan turun</span>
        </div>
      ) : null}
      {E > 0.001 ? (
        <div style={{position: 'absolute', left: 1090, top: 410, width: 720, fontFamily: FONT.head, opacity: E}}>
          <div style={{opacity: 1 - 0.55 * dyn}}>
            <div style={{fontFamily: FONT.mono, fontSize: 24, letterSpacing: 4, color: C.muted}}>VIDEO SEBELUMNYA</div>
            <div style={{fontSize: 60, fontWeight: 700, color: C.ink}}>
              fluida <span style={{color: C.press}}>diam</span>
            </div>
          </div>
          <div style={{marginTop: 34, opacity: dyn, translate: `${(1 - dyn) * 24}px 0px`}}>
            <div style={{fontFamily: FONT.mono, fontSize: 24, letterSpacing: 4, color: C.cyan}}>SEKARANG</div>
            <div style={{fontSize: 72, fontWeight: 700, color: C.ink}}>
              fluida <span style={{color: C.cyan}}>bergerak</span>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
