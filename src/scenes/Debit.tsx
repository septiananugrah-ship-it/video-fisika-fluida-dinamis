import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Pipe} from '../components/flow';
import {wavePath} from '../components/fluid';
import {Badge, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Debit:
//  A. keran mengalir; "berapa banyak tiap detik?" → debit Q = V/t
//  B. ember 20 L didorong ke bawah keran, stopwatch berjalan (dipercepat) sampai 40 s → Q = 0,5 L/s = 5×10⁻⁴ m³/s
//  C. pipa: "silinder" air sepanjang v didorong melewati penampang A selama 1 s → Q = A v.

const fr = (v: number) => ((v % 1) + 1) % 1;
const fmt1 = (v: number) => v.toFixed(1).replace('.', ',');

/* ---------------- keran & ember ---------------- */
const TAP = {x: 400, y: 336}; // mulut keran
const BK = {x: 400, bot: 832, h: 320, rb: 112, rt: 150}; // ember (jari-jari dalam bawah/atas)
const FULL_H = 0.92; // 20 L = 92 % tinggi ember
// volume frustum (dinormalisasi) → tinggi: tabel balik
const hOfFrac = (() => {
  const n = 200;
  const vs: number[] = [0];
  for (let i = 1; i <= n; i++) {
    const h = i / n;
    const r = BK.rb + (BK.rt - BK.rb) * (h - 0.5 / n);
    vs.push(vs[i - 1] + r * r);
  }
  const iFull = Math.round(FULL_H * n);
  const vFull = vs[iFull];
  return (f: number) => {
    const target = Math.max(0, Math.min(1, f)) * vFull;
    let i = 1;
    while (i < iFull && vs[i] < target) i++;
    const u = (target - vs[i - 1]) / Math.max(1e-9, vs[i] - vs[i - 1]);
    return ((i - 1 + u) / n) * BK.h;
  };
})();
const rAt = (h: number) => BK.rb + (BK.rt - BK.rb) * (h / BK.h);
const G_S = 1500; // px/s² untuk aliran keran
const V_S = 120; // px/s di mulut keran

/* ---------------- pipa bagian C ---------------- */
const PX0 = 160;
const PX1 = 1760;
const PYC = 440;
const PR = 120;
const XA = 860; // posisi penampang A
const VPX = 380; // v dalam px/s → panjang silinder dalam 1 s
const CYC = 3.4;

export const Debit: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---- babak ----
  const A = 1 - ramp(t, cue(4) - 0.7, cue(4) - 0.1, EASE_IN_OUT);
  const B = ramp(t, cue(4) - 0.4, cue(4) + 0.4);

  // keran
  const open = ramp(t, -0.2, 0.8, EASE_IN_OUT);
  const ask = win(t, cue(0) + 0.3, cue(1) - 0.4, 0.6, 0.5);
  const debitTag = win(t, wordOf(0, 'debit') - 0.3, cue(1) - 0.4, 0.5, 0.5);
  const defn = win(t, cue(1) - 0.3, cue(2) - 0.4, 0.7, 0.5);
  const unitP = ramp(t, wordOf(1, 'meter') - 0.3, wordOf(1, 'meter') + 0.4);
  // ember
  const bIn = ramp(t, cue(2) - 0.4, cue(2) + 0.6, EASE_IN_OUT);
  const tFill0 = cue(2) + 0.8;
  const tFull = Math.max(tFill0 + 2.4, wordOf(2, 'debitnya') - 0.1);
  const fill = ramp(t, tFill0, tFull, (x) => x);
  const close = ramp(t, tFull, tFull + 0.6, EASE_IN_OUT);
  const flowOn = open * (1 - close);
  const tsec = 40 * fill;
  const vol = 20 * fill;
  const watch = ramp(t, cue(2) - 0.2, cue(2) + 0.5) * (1 - ramp(t, cue(4) - 1.0, cue(4) - 0.4));
  const res = ramp(t, wordOf(2, 'setengah') - 0.3, wordOf(2, 'setengah') + 0.5);
  const conv = ramp(t, cue(3) - 0.1, cue(3) + 0.7);
  const fullFlash = (t - tFull) / 1.3;

  const bx = mix(820, BK.x, bIn);
  const hW = hOfFrac(fill);
  const surfY = BK.bot - hW;
  const streamEnd = mix(818, surfY - 2, bIn);

  // aliran keran: kolom yang menipis karena dipercepat gravitasi
  const streamPath = (() => {
    const y0 = TAP.y;
    const y1 = streamEnd;
    const n = 14;
    const L: [number, number][] = [];
    const R: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const y = y0 + ((y1 - y0) * i) / n;
      const v = Math.sqrt(V_S * V_S + 2 * G_S * (y - y0));
      const w = 11 * Math.sqrt(V_S / v) * flowOn + 1.5 * Math.sin(t * 9 + i) * flowOn * (i / n);
      L.push([TAP.x - w, y]);
      R.push([TAP.x + w, y]);
    }
    return [...L, ...R.reverse()].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
  })();
  const fallT = (Math.sqrt(V_S * V_S + 2 * G_S * (streamEnd - TAP.y)) - V_S) / G_S;

  // silinder di pipa
  const t0 = cue(4) + 0.6;
  const cyc0 = Math.max(0, t - t0);
  const tau = cyc0 % CYC;
  const slugOp = ramp(t, t0, t0 + 0.4) * Math.min(1, tau / 0.3) * (1 - ramp(tau, 2.6, 3.3, EASE_IN_OUT));
  const front = XA - 0.6 * VPX + VPX * tau;
  const back = front - VPX;
  const clock = Math.max(0, Math.min(1, tau - 0.6));
  const brk = ramp(tau, 1.5, 1.85) * (1 - ramp(tau, 2.6, 3.3, EASE_IN_OUT)) * ramp(t, wordOf(4, 'sepanjang') - 1.0, wordOf(4, 'sepanjang'));
  const aTag = ramp(t, wordOf(4, 'penampang') - 0.3, wordOf(4, 'penampang') + 0.4);
  const aShow = ramp(t, cue(4) + 0.2, cue(4) + 1.0);
  const qav = ramp(t, cue(5) - 0.2, cue(5) + 0.7);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Keran & ember ================= */}
        {A > 0.001 ? (
          <g opacity={A}>
            <Glow x={420} y={600} r={460} color="water" opacity={0.3} />
            {/* dinding & pipa keran */}
            <rect x={110} y={180} width={46} height={260} rx={6} fill="#2a3658" stroke="#5b6585" strokeWidth={2} />
            {Array.from({length: 6}, (_, k) => (
              <line key={k} x1={110} y1={200 + k * 42} x2={156} y2={200 + k * 42} stroke="#000" strokeOpacity={0.2} strokeWidth={2} />
            ))}
            <rect x={156} y={226} width={210} height={30} fill="#7d89ad" stroke="#c9d3ee" strokeWidth={2} />
            <rect x={160} y={230} width={200} height={6} fill="#fff" opacity={0.3} />
            <path d={`M356,222 Q${TAP.x + 18},222 ${TAP.x + 18},270 L${TAP.x + 18},${TAP.y} L${TAP.x - 18},${TAP.y} L${TAP.x - 18},268 Q${TAP.x - 18},258 356,258 Z`} fill="#8f9bc0" stroke="#c9d3ee" strokeWidth={2.5} strokeLinejoin="round" />
            {/* pegangan keran (berputar saat dibuka/ditutup) */}
            <g transform={`translate(${TAP.x - 40} 214) rotate(${-70 * flowOn})`}>
              <rect x={-6} y={-30} width={12} height={30} rx={4} fill="#a9b6d6" />
              <rect x={-34} y={-38} width={68} height={14} rx={7} fill={C.press} opacity={0.9} />
            </g>
            {/* saluran pembuangan (sebelum ember datang) */}
            <ellipse cx={TAP.x} cy={826} rx={70} ry={12} fill="#0a1230" stroke="#5b6585" strokeWidth={2} opacity={1 - bIn} />
            {[-40, -20, 0, 20, 40].map((dx) => (
              <line key={dx} x1={TAP.x + dx} y1={818} x2={TAP.x + dx} y2={834} stroke="#5b6585" strokeWidth={2} opacity={1 - bIn} />
            ))}
            {/* aliran air */}
            <path d={streamPath} fill={C.water} opacity={0.75} />
            <path d={streamPath} fill="none" stroke="#dff3ff" strokeOpacity={0.35 * flowOn} strokeWidth={1.5} />
            {Array.from({length: 7}, (_, k) => {
              const ph = fr(t / Math.max(0.05, fallT) / 2 + k / 7);
              const s = ph * fallT;
              const y = TAP.y + V_S * s + 0.5 * G_S * s * s;
              return <ellipse key={k} cx={TAP.x + 3 * Math.sin(k * 2.1)} cy={y} rx={2.5} ry={5} fill="#fff" opacity={0.8 * cyc(ph) * flowOn} />;
            })}
            {/* percikan di titik jatuh */}
            {Array.from({length: 6}, (_, k) => {
              const ph = fr(t * 1.8 + k / 6);
              const dir = k % 2 ? 1 : -1;
              return <circle key={k} cx={TAP.x + dir * (8 + 30 * ph)} cy={streamEnd - 4 - 26 * Math.sin(Math.PI * ph)} r={2.2} fill="#cfeaff" opacity={0.75 * cyc(ph) * flowOn} />;
            })}
            {/* ember */}
            <g transform={`translate(${bx - BK.x} 0)`} opacity={ramp(bIn, 0, 0.5)}>
              <ellipse cx={BK.x} cy={BK.bot + 14} rx={170} ry={14} fill="#000" opacity={0.35} />
              {hW > 0.5 ? (
                <g>
                  <path
                    d={`${wavePath(BK.x - rAt(hW), BK.x + rAt(hW), surfY, t, 2.5 * flowOn + 0.6, 0.08, 1)} L${BK.x + BK.rb},${BK.bot} L${BK.x - BK.rb},${BK.bot} Z`}
                    fill={C.water}
                    opacity={0.6}
                  />
                  <path d={wavePath(BK.x - rAt(hW), BK.x + rAt(hW), surfY, t, 2.5 * flowOn + 0.6, 0.08, 1)} fill="none" stroke="#dff3ff" strokeOpacity={0.7} strokeWidth={2} />
                  {Array.from({length: 5}, (_, k) => {
                    const ph = fr(t * 0.5 + k / 5);
                    return <circle key={k} cx={BK.x - 60 + k * 30 + 6 * Math.sin(t * 2 + k)} cy={BK.bot - 10 - ph * hW * 0.9} r={2 + 2 * rand(k)} fill="none" stroke="#dff3ff" strokeWidth={1.4} opacity={0.6 * cyc(ph) * Math.min(1, hW / 40)} />;
                  })}
                </g>
              ) : null}
              <path
                d={`M${BK.x - BK.rt - 8},${BK.bot - BK.h} L${BK.x - BK.rb - 6},${BK.bot} L${BK.x + BK.rb + 6},${BK.bot} L${BK.x + BK.rt + 8},${BK.bot - BK.h}`}
                fill="none"
                stroke="#d7deef"
                strokeOpacity={0.85}
                strokeWidth={7}
                strokeLinejoin="round"
              />
              <ellipse cx={BK.x} cy={BK.bot - BK.h} rx={BK.rt + 8} ry={12} fill="none" stroke="#d7deef" strokeOpacity={0.6} strokeWidth={4} />
              <path d={`M${BK.x - BK.rt - 6},${BK.bot - BK.h - 4} Q${BK.x},${BK.bot - BK.h - 150} ${BK.x + BK.rt + 6},${BK.bot - BK.h - 4}`} fill="none" stroke="#a9b6d6" strokeOpacity={0.5} strokeWidth={3} />
              {/* skala liter (posisi sesuai volume frustum) */}
              {[5, 10, 15, 20].map((L) => {
                const y = BK.bot - hOfFrac(L / 20);
                const xr = BK.x + rAt(BK.bot - y) + 6;
                return (
                  <g key={L}>
                    <line x1={xr - 22} y1={y} x2={xr} y2={y} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2.5} />
                    <text x={xr + 12} y={y} dominantBaseline="central" fontFamily={FONT.mono} fontSize={22} fill={C.muted}>
                      {L} L
                    </text>
                  </g>
                );
              })}
              <Ripple x={BK.x} y={BK.bot - BK.h * FULL_H} p={fullFlash} r={180} color="water" rings={2} />
            </g>
            {/* stopwatch */}
            <g opacity={watch}>
              <circle cx={1000} cy={360} r={108} fill="#0a1230" stroke="#cfd8f0" strokeWidth={5} />
              <rect x={988} y={236} width={24} height={20} rx={4} fill="#cfd8f0" />
              <path d={`M1000,360 L1000,268 A92,92 0 ${tsec > 30 ? 1 : 0} 1 ${1000 + 92 * Math.sin((tsec / 60) * 2 * Math.PI)},${360 - 92 * Math.cos((tsec / 60) * 2 * Math.PI)} Z`} fill={C.water} opacity={0.25} />
              {Array.from({length: 12}, (_, k) => {
                const a = (k / 12) * 2 * Math.PI;
                return <line key={k} x1={1000 + 92 * Math.sin(a)} y1={360 - 92 * Math.cos(a)} x2={1000 + (k % 3 ? 84 : 76) * Math.sin(a)} y2={360 - (k % 3 ? 84 : 76) * Math.cos(a)} stroke="#cfd8f0" strokeWidth={k % 3 ? 2 : 3} />;
              })}
              <line x1={1000} y1={360} x2={1000 + 80 * Math.sin((tsec / 60) * 2 * Math.PI)} y2={360 - 80 * Math.cos((tsec / 60) * 2 * Math.PI)} stroke={C.kin} strokeWidth={5} strokeLinecap="round" />
              <circle cx={1000} cy={360} r={9} fill={C.kin} />
              <Label x={1000} y={498} size={22} color={C.muted}>
                (dipercepat)
              </Label>
              <Label x={1150} y={318} size={44} weight={600} color={C.ink} anchor="start" font="mono">
                t = {Math.floor(tsec)} s
              </Label>
              <Label x={1150} y={398} size={44} weight={600} color={C.water} anchor="start" font="mono">
                V = {fmt1(vol)} L
              </Label>
              <Twinkles x={1260} y={360} rx={160} ry={60} n={4} color="water" opacity={ramp(t, tFull, tFull + 0.4)} seed={4} />
            </g>
            <Motes x={420} y={560} rx={260} ry={260} n={18} color="water" opacity={0.35} seed={6} />
          </g>
        ) : null}

        {/* ================= Pipa & silinder air ================= */}
        {B > 0.001 ? (
          <g opacity={B}>
            <Glow x={960} y={PYC} r={680} color="water" opacity={0.25} />
            <Pipe
              x0={PX0}
              x1={PX1}
              yc={PYC}
              knots={[
                [PX0, PR],
                [PX1, PR],
              ]}
              v0={VPX}
              lanes={7}
              perLane={5}
              lines={0.3}
            />
            {/* ujung pipa (kesan 3D) */}
            <ellipse cx={PX0} cy={PYC} rx={34} ry={PR} fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={4} />
            <ellipse cx={PX1} cy={PYC} rx={34} ry={PR} fill={C.deep} fillOpacity={0.5} stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={4} />
            <defs>
              <clipPath id="db-in">
                <rect x={PX0} y={PYC - PR} width={PX1 - PX0} height={2 * PR} />
              </clipPath>
              <clipPath id="db-pass">
                <rect x={XA} y={PYC - PR - 4} width={PX1 - XA} height={2 * PR + 8} />
              </clipPath>
            </defs>
            {/* silinder air yang terdorong maju */}
            {slugOp > 0.001 ? (
              <g opacity={slugOp} clipPath="url(#db-in)">
                <rect x={back} y={PYC - PR + 3} width={VPX} height={2 * PR - 6} fill={C.water} opacity={0.32} />
                <g clipPath="url(#db-pass)">
                  <rect x={back} y={PYC - PR + 3} width={VPX} height={2 * PR - 6} fill={C.cyan} opacity={0.32} />
                </g>
                <ellipse cx={back} cy={PYC} rx={34} ry={PR - 3} fill={C.water} fillOpacity={0.25} stroke="#dff3ff" strokeWidth={2.5} strokeDasharray="7 6" />
                <ellipse cx={front} cy={PYC} rx={34} ry={PR - 3} fill={C.cyan} fillOpacity={0.3} stroke="#ffffff" strokeWidth={3} />
                <line x1={back} y1={PYC - PR + 3} x2={front} y2={PYC - PR + 3} stroke="#dff3ff" strokeWidth={2.5} />
                <line x1={back} y1={PYC + PR - 3} x2={front} y2={PYC + PR - 3} stroke="#dff3ff" strokeWidth={2.5} />
                <Label x={front - VPX / 2} y={PYC} size={40} weight={600} color={C.ink} font="serif" italic opacity={ramp(Math.abs(front - VPX / 2 - XA), 90, 170)}>
                  V = A · v
                </Label>
              </g>
            ) : null}
            {/* penampang A */}
            <g opacity={aShow}>
              <ellipse cx={XA} cy={PYC} rx={36} ry={PR} fill={C.gold} fillOpacity={0.12 + 0.1 * aTag} stroke={C.gold} strokeWidth={3 + 2 * aTag} />
              <Label x={XA} y={PYC - PR - 44} size={44} weight={700} color={C.gold} font="serif" italic>
                A
              </Label>
              <Label x={XA + 34} y={PYC - PR - 44} size={24} color={C.muted} anchor="start" opacity={aTag}>
                luas penampang
              </Label>
              <Ripple x={XA} y={PYC} p={(t - wordOf(4, 'penampang')) / 1.4} r={150} color="gold" rings={2} />
            </g>
            {/* stopwatch kecil: 0 → 1 s */}
            <g opacity={slugOp * ramp(t, t0, t0 + 0.6)}>
              <circle cx={1560} cy={240} r={44} fill="#0a1230" stroke="#cfd8f0" strokeWidth={3} />
              <path d={`M1560,240 L1560,202 A38,38 0 ${clock > 0.5 ? 1 : 0} 1 ${1560 + 38 * Math.sin(clock * 2 * Math.PI)},${240 - 38 * Math.cos(clock * 2 * Math.PI)} Z`} fill={C.cyan} opacity={0.4} />
              <line x1={1560} y1={240} x2={1560 + 34 * Math.sin(clock * 2 * Math.PI)} y2={240 - 34 * Math.cos(clock * 2 * Math.PI)} stroke={C.kin} strokeWidth={4} strokeLinecap="round" />
              <Label x={1624} y={240} size={34} weight={600} color={C.ink} anchor="start" font="mono">
                {clock.toFixed(2).replace('.', ',')} s
              </Label>
            </g>
            {/* kurung panjang v */}
            <g opacity={brk}>
              <line x1={XA} y1={PYC + PR + 40} x2={XA + VPX} y2={PYC + PR + 40} stroke={C.cyan} strokeWidth={4} />
              <line x1={XA} y1={PYC + PR + 26} x2={XA} y2={PYC + PR + 54} stroke={C.cyan} strokeWidth={4} />
              <line x1={XA + VPX} y1={PYC + PR + 26} x2={XA + VPX} y2={PYC + PR + 54} stroke={C.cyan} strokeWidth={4} />
              <Label x={XA + VPX / 2} y={PYC + PR + 82} size={34} color={C.cyan} font="serif" italic>
                panjang = v × 1 s
              </Label>
            </g>
            <Motes x={960} y={PYC} rx={820} ry={200} n={22} color="cyan" opacity={0.3} seed={7} />
          </g>
        ) : null}
      </Stage>

      {/* ================= HTML ================= */}
      <Note x={1260} y={330} p={A * ask} color={C.water} size={36}>
        berapa banyak air keluar <span style={{color: C.water}}>tiap detik</span>?
      </Note>
      <Badge x={1260} y={440} text="debit  Q" color={C.water} size={36} opacity={A * debitTag} scale={0.9 + 0.1 * Math.min(1, debitTag)} />
      <Formula x={1260} y={400} p={A * defn} accent={C.water} size={70} caption={<span style={{opacity: unitP}}>satuan: m³/s</span>}>
        <V color={C.water}>Q</V> ={' '}
        <Frac
          n={
            <>
              <V color={C.water}>V</V>
            </>
          }
          d={<V>t</V>}
        />
        <span style={{fontSize: '0.42em', color: C.muted, fontFamily: FONT.sans, fontStyle: 'normal', marginLeft: 18}}>volume / waktu</span>
      </Formula>
      <Formula x={1290} y={650} p={A * res * (1 - conv)} accent={C.water} size={60}>
        <V color={C.water}>Q</V> = <Frac n={<Tint c="water">20 L</Tint>} d={<span>40 s</span>} /> = <span style={{color: C.water}}>0,5 L/s</span>
      </Formula>
      <Formula
        x={1290}
        y={650}
        p={A * conv}
        accent={C.water}
        size={60}
        caption={
          <>
            1 L = 10<Sup>−3</Sup> m³ → 0,5 L/s = 0,5 × 10<Sup>−3</Sup> m³/s
          </>
        }
      >
        <V color={C.water}>Q</V> = <span style={{color: C.water}}>5 × 10</span>
        <Sup color={C.water}>−4</Sup> <span style={{color: C.water}}>m³/s</span>
      </Formula>
      <Note x={960} y={790} p={B * ramp(t, wordOf(4, 'detik') - 0.2, wordOf(4, 'detik') + 0.6) * (1 - qav)} color={C.cyan} size={34}>
        volume yang lewat dalam 1 s = <V color={C.gold}>A</V> × <V color={C.cyan}>v</V>
      </Note>
      <Formula x={960} y={790} p={B * qav * (1 - ramp(t, dur - 1.0, dur - 0.3))} accent={C.water} size={72} caption="debit = luas penampang × kecepatan  ·  m² × m/s = m³/s">
        <V color={C.water}>Q</V> = <V color={C.gold}>A</V> <V color={C.cyan}>v</V>
      </Formula>
    </AbsoluteFill>
  );
};
