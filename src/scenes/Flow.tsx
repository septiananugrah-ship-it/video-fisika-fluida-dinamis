import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Jet, Smoke} from '../components/flow';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Laminar atau turbulen:
//  A. asap dupa: garis halus (laminar) lalu pecah menjadi pusaran (turbulen); panel kanan memperlihatkan lapisan vs pusaran
//  B. bilangan Reynolds Re = ρvD/η (simbol berwarna muncul sesuai kata) — "dorongan" vs "rem kekentalan"
//  C. pipa laminar (profil parabola) vs pipa turbulen (profil rata, bergolak), ambang ≈ 2000
//  D. air keran: D = 2 cm, v = 1 m/s → Re = 20 000 (penghitung naik di garis bilangan) → turbulen
//  E. aliran bergolak yang "dirapikan" menjadi model ideal: pendekatan pertama.

const fr = (v: number) => ((v % 1) + 1) % 1;

/* ---------------- dupa ---------------- */
const INC = {x: 520, y: 820};
const TIP = INC.y - 200;
const Incense: React.FC<{t: number}> = ({t}) => {
  const tipY = TIP;
  return (
    <g>
      <ellipse cx={INC.x} cy={INC.y + 46} rx={150} ry={14} fill="#000" opacity={0.35} />
      {/* mangkuk abu */}
      <path d={`M${INC.x - 110},${INC.y} Q${INC.x - 100},${INC.y + 50} ${INC.x},${INC.y + 50} Q${INC.x + 100},${INC.y + 50} ${INC.x + 110},${INC.y} Z`} fill="#5b4a3a" stroke="#c9a77a" strokeWidth={2.5} />
      <ellipse cx={INC.x} cy={INC.y} rx={110} ry={16} fill="#8a7a6a" stroke="#c9a77a" strokeWidth={2.5} />
      {/* batang dupa */}
      <line x1={INC.x} y1={INC.y - 4} x2={INC.x} y2={tipY} stroke="#9a5a3a" strokeWidth={6} strokeLinecap="round" />
      <line x1={INC.x} y1={INC.y - 4} x2={INC.x} y2={INC.y - 90} stroke="#c9a77a" strokeWidth={4} strokeLinecap="round" />
      <circle cx={INC.x} cy={tipY} r={6} fill={C.kin} />
      <circle cx={INC.x} cy={tipY} r={16 + 3 * Math.sin(t * 5)} fill="url(#soft-kin)" />
      {Array.from({length: 4}, (_, k) => {
        const ph = fr(t * 0.9 + k / 4);
        return <circle key={k} cx={INC.x + 10 * Math.sin(k * 2.3 + t)} cy={tipY + 4 + 40 * ph} r={1.6} fill="#9aa6c8" opacity={0.6 * cyc(ph)} />;
      })}
    </g>
  );
};

/* ---------------- pipa laminar / turbulen ---------------- */
const PX0 = 180;
const PX1 = 1240;
const PR = 78;
const LamPipe: React.FC<{t: number; yc: number; op: number; prof: number}> = ({t, yc, op, prof}) => {
  if (op <= 0.001) return null;
  const lanes = 9;
  const vmax = 260;
  return (
    <g opacity={op}>
      <rect x={PX0} y={yc - PR} width={PX1 - PX0} height={2 * PR} fill={C.water} opacity={0.18} />
      {Array.from({length: lanes}, (_, j) => {
        const f = -0.88 + (1.76 * j) / (lanes - 1);
        const v = vmax * (1 - f * f);
        const y = yc + f * PR;
        return (
          <g key={j}>
            <line x1={PX0} y1={y} x2={PX1} y2={y} stroke="#dff3ff" strokeOpacity={0.14} strokeWidth={1.2} />
            {Array.from({length: 6}, (_, k) => {
              const ph = fr((t * v) / (PX1 - PX0) + k / 6 + rand(j * 3.7) * 0.3);
              const x = PX0 + ph * (PX1 - PX0);
              const len = 6 + v * 0.1;
              return (
                <g key={k} opacity={Math.min(1, ph * 14) * Math.min(1, (1 - ph) * 14)}>
                  <line x1={Math.max(PX0, x - len)} y1={y} x2={x} y2={y} stroke="#eaf8ff" strokeOpacity={0.55} strokeWidth={2.2} strokeLinecap="round" />
                  <circle cx={x} cy={y} r={2.6} fill="#fff" />
                </g>
              );
            })}
          </g>
        );
      })}
      {/* profil kecepatan parabola */}
      <g opacity={prof}>
        <line x1={PX1 - 200} y1={yc - PR} x2={PX1 - 200} y2={yc + PR} stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} />
        {Array.from({length: 7}, (_, j) => {
          const f = -0.84 + (1.68 * j) / 6;
          const L = 150 * (1 - f * f);
          return <Arrow key={j} x1={PX1 - 200} y1={yc + f * PR} x2={PX1 - 200 + L * prof} y2={yc + f * PR} color="cyan" width={3} pulse={false} />;
        })}
        <path
          d={Array.from({length: 21}, (_, i) => {
            const f = -1 + i / 10;
            return `${i ? 'L' : 'M'}${(PX1 - 200 + 150 * (1 - f * f) * prof).toFixed(1)},${(yc + f * PR).toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={C.cyan}
          strokeWidth={2.5}
          strokeDasharray="5 5"
        />
      </g>
      <line x1={PX0} y1={yc - PR} x2={PX1} y2={yc - PR} stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
      <line x1={PX0} y1={yc + PR} x2={PX1} y2={yc + PR} stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
    </g>
  );
};

/** Partikel bergolak: maju rata-rata U, ditambah pusaran acak (deterministik). calm 0..1 meredam golakan. */
const turbPos = (j: number, k: number, tt: number, x0: number, x1: number, yc: number, R: number, U: number, calm = 0): [number, number] => {
  const ph = fr((tt * U) / (x1 - x0) + k / 7 + rand(j * 5.1 + k) * 0.5);
  const x = x0 + ph * (x1 - x0);
  const base = -0.82 + (1.64 * j) / 7;
  const a = 1 - calm;
  const om = 2.5 + 2 * rand(j * 3 + k * 7);
  const p0 = rand(j * 11 + k * 2) * 6.28;
  const dy = a * (0.32 * Math.sin(om * tt + p0) + 0.18 * Math.sin(x * 0.02 + tt * 2.3 + j));
  const dx = a * 22 * Math.cos(om * tt + p0);
  const f = Math.max(-0.9, Math.min(0.9, base + dy));
  return [x + dx, yc + f * R];
};
const TurbPipe: React.FC<{t: number; yc: number; op: number; prof: number; x0?: number; x1?: number; R?: number; calm?: number; walls?: boolean}> = ({
  t,
  yc,
  op,
  prof,
  x0 = PX0,
  x1 = PX1,
  R = PR,
  calm = 0,
  walls = true,
}) => {
  if (op <= 0.001) return null;
  const U = 230;
  const id = `fl-tp-${Math.round(yc)}-${Math.round(x0)}`;
  return (
    <g opacity={op}>
      <rect x={x0} y={yc - R} width={x1 - x0} height={2 * R} fill={C.water} opacity={0.18} />
      <defs>
        <clipPath id={id}>
          <rect x={x0} y={yc - R} width={x1 - x0} height={2 * R} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {Array.from({length: 8}, (_, j) =>
          Array.from({length: 7}, (_, k) => {
            const [x, y] = turbPos(j, k, t, x0, x1, yc, R, U, calm);
            const tr = [1, 2, 3, 4].map((m) => turbPos(j, k, t - m * 0.04, x0, x1, yc, R, U, calm)).filter(([tx]) => tx <= x + 4);
            const d = [[x, y], ...tr].map(([tx, ty], m) => `${m ? 'L' : 'M'}${tx.toFixed(1)},${ty.toFixed(1)}`).join(' ');
            const edge = Math.min(1, (x - x0) / 40) * Math.min(1, (x1 - x) / 40);
            return (
              <g key={`${j}-${k}`} opacity={edge}>
                <path d={d} fill="none" stroke="#eaf8ff" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
                <circle cx={x} cy={y} r={2.6} fill="#fff" />
              </g>
            );
          }),
        )}
        {Array.from({length: 6}, (_, k) => {
          const ph = fr(t * 0.2 + k / 6);
          const ex = x0 + ph * (x1 - x0);
          const ey = yc + (rand(k * 3.3) - 0.5) * R;
          const r = 16 + 14 * rand(k);
          return (
            <g key={k} opacity={0.6 * cyc(ph) * (1 - calm)} transform={`translate(${ex} ${ey}) rotate(${t * (k % 2 ? 200 : -180)})`}>
              <path d={`M${r},0 A${r},${r} 0 1 1 ${-r * 0.6},${r * 0.75}`} fill="none" stroke={C.heat} strokeOpacity={0.75} strokeWidth={2.5} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
      {/* profil kecepatan rata (rata-rata waktu) */}
      <g opacity={prof}>
        <line x1={x1 - 200} y1={yc - R} x2={x1 - 200} y2={yc + R} stroke={C.heat} strokeOpacity={0.5} strokeWidth={2} />
        {Array.from({length: 7}, (_, j) => {
          const f = -0.84 + (1.68 * j) / 6;
          const L = 110 * (1 - Math.abs(f) ** 7) + 6 * Math.sin(t * 7 + j * 2);
          return <Arrow key={j} x1={x1 - 200} y1={yc + f * R} x2={x1 - 200 + L * prof} y2={yc + f * R} color="heat" width={3} pulse={false} />;
        })}
      </g>
      {walls ? (
        <>
          <line x1={x0} y1={yc - R} x2={x1} y2={yc - R} stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
          <line x1={x0} y1={yc + R} x2={x1} y2={yc + R} stroke="#bfe3ff" strokeOpacity={0.85} strokeWidth={5} />
        </>
      ) : null}
    </g>
  );
};

/* ---------------- garis bilangan Re ---------------- */
const SX0 = 760;
const SX1 = 1760;
const SY = 790;
const SMAX = 25000;
const sx = (re: number) => SX0 + (Math.min(SMAX, re) / SMAX) * (SX1 - SX0);

export const Flow: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---- babak ----
  const A = 1 - ramp(t, cue(3) - 0.8, cue(3) - 0.1, EASE_IN_OUT);
  const B = win(t, cue(3) - 0.5, cue(4) - 0.5, 0.6, 0.6);
  const Cp = win(t, cue(4) - 0.4, cue(5) - 0.5, 0.6, 0.6);
  const Dp = win(t, cue(5) - 0.4, cue(6) - 0.6, 0.6, 0.6);
  const E = ramp(t, cue(6) - 0.4, cue(6) + 0.4);

  // asap
  const smokeIn = ramp(t, -0.4, 1.4);
  const tLam = wordOf(1, 'laminar');
  const tBreak = wordOf(2, 'tiba-tiba');
  const turbP = ramp(t, tBreak - 0.4, tBreak + 1.6, EASE_IN_OUT);
  const hLam = mix(410, 150, turbP);
  const lamTag = ramp(t, tLam - 0.3, tLam + 0.5, BACK);
  const turbTag = ramp(t, wordOf(2, 'turbulen') - 0.3, wordOf(2, 'turbulen') + 0.5, BACK);
  const calmAir = ramp(t, cue(0) + 0.6, cue(0) + 1.8);

  // Reynolds
  const sym = [wordOf(3, 'massa'), wordOf(3, 'kecepatan'), wordOf(3, 'diameter'), wordOf(3, 'kekentalan')].map((w) => ramp(t, w - 0.25, w + 0.4));
  const reIn = ramp(t, wordOf(3, 'reynolds') - 0.5, wordOf(3, 'reynolds') + 0.3);

  // pipa
  const lamIn = ramp(t, cue(4) + 0.2, cue(4) + 1.0);
  const lamProf = ramp(t, wordOf(4, 'laminar') - 0.2, wordOf(4, 'laminar') + 0.8, EASE_IN_OUT);
  const thr = ramp(t, wordOf(4, 'ribu') - 0.6, wordOf(4, 'ribu') + 0.3);
  const turbIn = ramp(t, wordOf(4, 'turbulen') - 0.4, wordOf(4, 'turbulen') + 0.4);
  const turbProf = ramp(t, wordOf(4, 'atasnya') - 0.4, wordOf(4, 'atasnya') + 0.6, EASE_IN_OUT);

  // keran
  const tapIn = ramp(t, cue(5) - 0.2, cue(5) + 0.6);
  const given = ramp(t, wordOf(5, 'sentimeter') - 0.3, wordOf(5, 'sentimeter') + 0.4);
  const given2 = ramp(t, wordOf(5, 'detik') - 0.3, wordOf(5, 'detik') + 0.4);
  const tCount0 = wordOf(5, 'bernilai') - 0.2;
  const tCount1 = wordOf(5, 'ribu') + 0.1;
  const count = ramp(t, tCount0, tCount1, EASE_IN_OUT);
  const reNow = 20000 * count;
  const turbBadge = ramp(t, wordOf(5, 'turbulen') - 0.3, wordOf(5, 'turbulen') + 0.4, BACK);
  const calc = ramp(t, wordOf(5, 'bernilai') - 0.6, wordOf(5, 'bernilai') + 0.2);

  // penutup
  const calm = ramp(t, cue(6) + 0.8, wordOf(6, 'ideal') + 0.6, EASE_IN_OUT);
  const chips = [0, 1, 2].map((k) => ramp(t, cue(6) + 0.3 + k * 0.35, cue(6) + 0.9 + k * 0.35));
  const firstApprox = ramp(t, wordOf(6, 'pendekatan') - 0.3, wordOf(6, 'pendekatan') + 0.5);

  const reStr = Math.round(reNow / 100) * 100;
  const reTxt = reStr >= 1000 ? `${Math.floor(reStr / 1000)} ${String(reStr % 1000).padStart(3, '0')}` : String(reStr);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= A: asap dupa ================= */}
        {A > 0.001 ? (
          <g opacity={A}>
            <Glow x={INC.x} y={420} r={460} color="white" opacity={0.12} />
            <Glow x={INC.x} y={TIP} r={120} color="kin" opacity={0.5} />
            <Smoke x={INC.x} y={TIP - 4} hLam={hLam} height={430} turb={turbP} strands={3} opacity={smokeIn} />
            <Smoke x={INC.x + 2} y={TIP - 4} hLam={hLam + 20} height={400} turb={turbP * 0.8} strands={2} opacity={smokeIn * 0.6} />
            <Incense t={t} />
            <Motes x={INC.x} y={500} rx={260} ry={260} n={16} color="white" opacity={0.25 * calmAir} seed={2} />
            {/* label laminar & turbulen */}
            <g opacity={lamTag}>
              <line x1={INC.x + 16} y1={TIP - 110} x2={INC.x + 110} y2={TIP - 110} stroke={C.cyan} strokeWidth={2} strokeDasharray="5 6" />
              <Label x={INC.x + 124} y={TIP - 110} size={34} weight={700} color={C.cyan} anchor="start">
                laminar
              </Label>
            </g>
            <g opacity={turbTag}>
              <line x1={INC.x + 80} y1={300} x2={INC.x + 150} y2={262} stroke={C.heat} strokeWidth={2} strokeDasharray="5 6" />
              <Label x={INC.x + 164} y={250} size={34} weight={700} color={C.heat} anchor="start">
                turbulen
              </Label>
            </g>
            {/* panel kanan: lapisan sejajar vs pusaran */}
            <g opacity={lamTag}>
              <rect x={1060} y={230} width={700} height={250} rx={20} fill="rgba(10,16,36,0.75)" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} />
            </g>
            <g opacity={turbTag}>
              <rect x={1060} y={520} width={700} height={250} rx={20} fill="rgba(10,16,36,0.75)" stroke={C.heat} strokeOpacity={0.5} strokeWidth={2} />
            </g>
          </g>
        ) : null}
      </Stage>
      {/* panel kecil memakai skala sendiri */}
      {A > 0.001 ? (
        <Stage>
          <g opacity={A}>
            <g opacity={lamTag} transform="translate(1100 340) scale(0.588 0.75) translate(-180 -340)">
              <LamPipe t={t} yc={340} op={1} prof={0} />
            </g>
            <g opacity={turbTag} transform="translate(1100 630) scale(0.588 0.75) translate(-180 -630)">
              <TurbPipe t={t} yc={630} op={1} prof={0} />
            </g>
            <Label x={1410} y={448} size={26} color={C.cyan} opacity={lamTag}>
              lapisan meluncur rapi, tak bercampur
            </Label>
            <Label x={1410} y={738} size={26} color={C.heat} opacity={turbTag}>
              berpusar, bercampur acak
            </Label>
          </g>
        </Stage>
      ) : null}

      <Stage>
        {/* ================= B: Reynolds ================= */}
        {B > 0.001 ? (
          <g opacity={B}>
            <Glow x={960} y={360} r={520} color="cyan" opacity={0.25 * reIn} />
            {/* timbangan: dorongan (ρvD) melawan rem kekentalan (η) */}
            {(() => {
              const push = (sym[0] + sym[1] + sym[2]) / 3;
              const tilt = 9 * push - 6 * sym[3] + 1.5 * Math.sin(t * 1.6);
              const bx = 960;
              const by = 640;
              return (
                <g opacity={ramp(t, wordOf(3, 'massa') - 0.4, wordOf(3, 'massa') + 0.4)}>
                  <path d={`M${bx - 40},${by + 150} L${bx + 40},${by + 150} L${bx},${by + 10} Z`} fill="#3b4a72" stroke="#a9b6d6" strokeWidth={2} />
                  <g transform={`rotate(${-tilt} ${bx} ${by})`}>
                    <line x1={bx - 320} y1={by} x2={bx + 320} y2={by} stroke="#cfd8f0" strokeWidth={6} strokeLinecap="round" />
                    <circle cx={bx} cy={by} r={9} fill={C.gold} />
                    {/* kiri: inersia (ρ v D) */}
                    <g transform={`translate(${bx - 300} ${by}) rotate(${tilt})`}>
                      <line x1={0} y1={0} x2={0} y2={40} stroke="#cfd8f0" strokeWidth={2} />
                      <rect x={-110} y={40} width={220} height={60} rx={14} fill="rgba(10,16,36,0.9)" stroke={C.cyan} strokeWidth={2} />
                      <text x={0} y={72} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={26} fill={C.ink}>
                        dorongan aliran
                      </text>
                    </g>
                    <g transform={`translate(${bx + 300} ${by}) rotate(${tilt})`}>
                      <line x1={0} y1={0} x2={0} y2={40} stroke="#cfd8f0" strokeWidth={2} />
                      <rect x={-110} y={40} width={220} height={60} rx={14} fill="rgba(10,16,36,0.9)" stroke={C.heat} strokeWidth={2} />
                      <text x={0} y={72} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={26} fill={C.ink}>
                        rem kekentalan
                      </text>
                    </g>
                  </g>
                </g>
              );
            })()}
            {/* keterangan simbol */}
            {[
              {s: 'ρ', w: 'massa jenis', c: C.spr},
              {s: 'v', w: 'kecepatan', c: C.cyan},
              {s: 'D', w: 'diameter', c: C.gold},
              {s: 'η', w: 'kekentalan', c: C.heat},
            ].map((o, k) => (
              <g key={o.s} opacity={sym[k]} transform={`translate(${390 + k * 380} ${490 - 10 * (1 - sym[k])})`}>
                <circle r={34} fill="rgba(10,16,36,0.9)" stroke={o.c} strokeWidth={2.5} />
                <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={40} fill={o.c}>
                  {o.s}
                </text>
                <text x={48} y={2} dominantBaseline="central" fontFamily={FONT.head} fontSize={28} fill={C.ink}>
                  {o.w}
                </text>
              </g>
            ))}
          </g>
        ) : null}

        {/* ================= C: pipa laminar vs turbulen ================= */}
        {Cp > 0.001 ? (
          <g opacity={Cp}>
            <Glow x={700} y={320} r={420} color="cyan" opacity={0.2 * lamIn} />
            <Glow x={700} y={640} r={420} color="heat" opacity={0.2 * turbIn} />
            <LamPipe t={t} yc={320} op={lamIn} prof={lamProf} />
            <TurbPipe t={t} yc={640} op={turbIn} prof={turbProf} />
          </g>
        ) : null}

        {/* ================= D: air keran → Re = 20 000 ================= */}
        {Dp > 0.001 ? (
          <g opacity={Dp * tapIn}>
            <Glow x={400} y={420} r={360} color="water" opacity={0.25} />
            {/* dinding + pipa keran */}
            <rect x={110} y={190} width={36} height={500} fill="#2a3658" stroke="#5b6585" strokeWidth={2} />
            <TurbPipe t={t} yc={300} op={1} prof={0} x0={146} x1={520} R={40} walls={false} />
            <line x1={146} y1={260} x2={520} y2={260} stroke="#c9d3ee" strokeWidth={6} />
            <line x1={146} y1={340} x2={540} y2={340} stroke="#c9d3ee" strokeWidth={6} />
            <path d="M520,256 Q600,256 600,330 L600,380 L560,380 L560,340 Q560,300 520,300" fill="#7d89ad" stroke="#c9d3ee" strokeWidth={3} />
            <rect x={494} y={214} width={22} height={46} rx={4} fill="#7d89ad" stroke="#c9d3ee" strokeWidth={2} />
            <rect x={470} y={206} width={70} height={14} rx={6} fill={C.press} opacity={0.85} />
            {/* aliran turun dari mulut keran */}
            <Jet x={580} y={384} vx={10} g={1400} yFloor={700} width={22} drops={9} />
            <path d="M440,700 L720,700 L700,760 L460,760 Z" fill="#3b4a72" stroke="#a9b6d6" strokeWidth={2} />
            <Ripple x={582} y={700} p={fr(t * 0.9)} r={60} color="water" rings={2} width={2} />
            {/* besaran yang diketahui */}
            <g opacity={given}>
              <line x1={300} y1={256} x2={300} y2={344} stroke={C.gold} strokeWidth={3} />
              <line x1={290} y1={256} x2={310} y2={256} stroke={C.gold} strokeWidth={3} />
              <line x1={290} y1={344} x2={310} y2={344} stroke={C.gold} strokeWidth={3} />
              <Label x={300} y={392} size={32} color={C.gold} font="serif" italic>
                D = 2 cm
              </Label>
            </g>
            <g opacity={given2}>
              <Arrow x1={200} y1={444} x2={330} y2={444} color="cyan" width={5} />
              <Label x={265} y={488} size={32} color={C.cyan} font="serif" italic>
                v = 1 m/s
              </Label>
            </g>
            {/* garis bilangan Re */}
            <g opacity={calc}>
              <rect x={SX0} y={SY - 10} width={sx(2000) - SX0} height={20} fill={C.cyan} opacity={0.7} />
              <rect x={sx(2000)} y={SY - 10} width={sx(4000) - sx(2000)} height={20} fill={C.gold} opacity={0.6} />
              <rect x={sx(4000)} y={SY - 10} width={SX1 - sx(4000)} height={20} fill={C.heat} opacity={0.45} />
              {[0, 5000, 10000, 15000, 20000, 25000].map((v) => (
                <g key={v}>
                  <line x1={sx(v)} y1={SY + 12} x2={sx(v)} y2={SY + 24} stroke={C.muted} strokeWidth={2} />
                  <text x={sx(v)} y={SY + 44} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={C.muted}>
                    {v === 0 ? '0' : `${v / 1000} 000`}
                  </text>
                </g>
              ))}
              <Label x={(SX0 + sx(2000)) / 2 + 8} y={SY - 34} size={22} color={C.cyan}>
                laminar
              </Label>
              <Label x={sx(2000)} y={SY - 64} size={20} color={C.cyan} font="mono">
                ≈ 2000
              </Label>
              <Label x={1500} y={SY - 34} size={24} weight={600} color={C.heat}>
                turbulen
              </Label>
              {/* penanda nilai sekarang */}
              <g transform={`translate(${sx(reNow)} ${SY})`}>
                <path d="M0,-14 L-12,-36 L12,-36 Z" fill={C.ink} />
                <circle r={12} fill={C.ink} opacity={0.9} />
                <circle r={26 + 4 * Math.sin(t * 4)} fill="url(#soft-heat)" opacity={count} />
              </g>
              <Ripple x={sx(20000)} y={SY} p={(t - tCount1) / 1.3} r={90} color="heat" />
            </g>
          </g>
        ) : null}

        {/* ================= E: dirapikan menjadi model ideal ================= */}
        {E > 0.001 ? (
          <g opacity={E}>
            <Glow x={960} y={460} r={620} color="water" opacity={0.25} />
            <TurbPipe t={t} yc={470} op={1} prof={0} x0={160} x1={1760} R={130} calm={calm} />
            <Glow x={960} y={470} r={300} color="cyan" opacity={0.35 * calm} />
            {['Q = A v', 'A₁v₁ = A₂v₂', 'p + ½ρv² + ρgh = konstan'].map((s, k) => (
              <g key={s} opacity={chips[k]} transform={`translate(${[420, 960, 1500][k]} ${250 + 8 * Math.sin(t * 1.1 + k * 2)})`}>
                <rect x={k === 2 ? -230 : -130} y={-32} width={k === 2 ? 460 : 260} height={64} rx={14} fill="rgba(10,16,36,0.9)" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={2} />
                <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={32} fill={C.ink}>
                  {s}
                </text>
              </g>
            ))}
            <Twinkles x={960} y={470} rx={600} ry={80} n={6} color="cyan" opacity={firstApprox} seed={8} />
            <Motes x={960} y={470} rx={800} ry={200} n={24} color="cyan" opacity={0.35} seed={5} />
          </g>
        ) : null}
      </Stage>

      {/* ================= HTML ================= */}
      <Formula x={960} y={300} p={B * reIn} accent={C.cyan} size={66} caption="bilangan Reynolds (tanpa satuan)">
        <V>Re</V> ={' '}
        <Frac
          n={
            <>
              <span style={{opacity: 0.3 + 0.7 * sym[0]}}>
                <V color={C.spr}>ρ</V>
              </span>{' '}
              <span style={{opacity: 0.3 + 0.7 * sym[1]}}>
                <V color={C.cyan}>v</V>
              </span>{' '}
              <span style={{opacity: 0.3 + 0.7 * sym[2]}}>
                <V color={C.gold}>D</V>
              </span>
            </>
          }
          d={
            <span style={{opacity: 0.3 + 0.7 * sym[3]}}>
              <V color={C.heat}>η</V>
            </span>
          }
        />
      </Formula>
      {/* kartu label pipa */}
      <Note x={1320} y={320} p={Cp * lamProf} color={C.cyan} anchor="left" size={30}>
        laminar · <V>Re</V> &lt; ≈ 2000
      </Note>
      <Note x={1320} y={640} p={Cp * turbProf} color={C.heat} anchor="left" size={30}>
        turbulen · <V>Re</V> ≫ 2000
        <div style={{fontSize: 22, color: C.muted, marginTop: 2}}>(umumnya di atas ≈ 4000)</div>
      </Note>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 470,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontSize: 26,
          color: C.gold,
          opacity: Cp * thr,
        }}
      >
        ambang ≈ 2000
      </div>
      <Formula x={1260} y={430} p={Dp * calc} accent={C.water} size={56}>
        <V>Re</V> ={' '}
        <Frac
          n={
            <>
              <Tint c="spr">1000</Tint> · <Tint c="cyan">1</Tint> · <Tint c="gold">0,02</Tint>
            </>
          }
          d={<Tint c="heat">0,001</Tint>}
        />{' '}
        ≈ <span style={{color: C.kin, fontWeight: 600, fontStyle: 'normal', display: 'inline-block', minWidth: '5.2ch', textAlign: 'left'}}>{reTxt}</span>
      </Formula>
      <div style={{position: 'absolute', left: 900, top: 568, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: Dp * calc}}>
        ρ air = 1000 kg/m³ · η air ≈ 0,001 Pa·s
      </div>
      <div
        style={{
          position: 'absolute',
          left: sx(20000),
          top: 680,
          transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * turbBadge})`,
          opacity: Dp * Math.min(1, turbBadge),
          padding: '8px 22px',
          borderRadius: 999,
          background: 'rgba(10,16,36,0.9)',
          border: `2px solid ${C.heat}`,
          color: C.heat,
          fontFamily: FONT.head,
          fontWeight: 700,
          fontSize: 30,
          boxShadow: `0 0 26px ${C.heat}55`,
        }}
      >
        turbulen!
      </div>
      <Note x={960} y={790} p={E * firstApprox * (1 - ramp(t, dur - 1.0, dur - 0.3))} color={C.cyan} size={32}>
        model ideal yang tenang &amp; rapi = <span style={{color: C.cyan}}>pendekatan pertama</span> yang sangat berguna
      </Note>
    </AbsoluteFill>
  );
};
