import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Pipe, Streamline, radiusAt} from '../components/flow';
import {Arrow, Badge, DrawPath, Glow, Label, Motes, Note, Ripple, Spark, Stage, TSub, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Fluida ideal & garis arus:
//  A. aliran nyata yang berpusar & bergolak di kanal → tenang menjadi aliran ideal (lintasan sejajar)
//  B. empat kartu anggapan (tak termampatkan, tak kental, tunak, tidak berpusar), masing-masing dengan ikon bergerak
//  C. pipa menyempit: satu partikel melukis garis arusnya; garis tak berpotongan; merapat = lebih cepat (v₂/v₁ = (r₁/r₂)²)
//  D. udara: pengukur kecepatan jauh di bawah kecepatan suara → paket udara tak berubah ukuran.

const fr = (v: number) => ((v % 1) + 1) % 1;
const X0 = 110;
const X1 = 1810;

/* ---------------- pipa bagian C ---------------- */
const PYC = 470;
const PX0 = 140;
const PX1 = 1780;
const KN: [number, number][] = [
  [PX0, 150],
  [640, 150],
  [960, 70],
  [1280, 150],
  [PX1, 150],
];
const V0 = 190;
const LANE_F = -0.8 + 1.6 / 6; // jalur ke-2 dari atas (sama dengan Pipe, 7 jalur)
// tabel waktu tempuh τ(x) untuk partikel yang disorot (kecepatan ∝ 1/r²)
const TRAV = (() => {
  const n = 300;
  const xs: number[] = [];
  const ts: number[] = [];
  let acc = 0;
  const r0 = radiusAt(KN, PX0);
  for (let i = 0; i <= n; i++) {
    const x = PX0 + ((PX1 - PX0) * i) / n;
    if (i > 0) acc += (PX1 - PX0) / n / (V0 * (r0 / radiusAt(KN, x - (PX1 - PX0) / n / 2)) ** 2);
    xs.push(x);
    ts.push(acc);
  }
  return {xs, ts, total: acc};
})();
const xAtTau = (tau: number) => {
  const {xs, ts} = TRAV;
  if (tau <= 0) return xs[0];
  if (tau >= TRAV.total) return xs[xs.length - 1];
  let i = 1;
  while (ts[i] < tau) i++;
  const u = (tau - ts[i - 1]) / (ts[i] - ts[i - 1]);
  return xs[i - 1] + (xs[i] - xs[i - 1]) * u;
};
const laneY = (x: number, f: number) => PYC + f * radiusAt(KN, x);
const LANE_PTS: [number, number][] = Array.from({length: 81}, (_, i) => {
  const x = PX0 + ((PX1 - PX0) * i) / 80;
  return [x, laneY(x, LANE_F)];
});
const LANE_D = LANE_PTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/* ---------------- kartu anggapan ---------------- */
const CARDS = [
  {title: 'Tak termampatkan', sub: 'massa jenis tetap', color: C.spr, hue: 'spr' as Hue},
  {title: 'Tak kental', sub: 'tanpa gesekan', color: C.heat, hue: 'heat' as Hue},
  {title: 'Tunak', sub: 'v di tiap titik tetap', color: C.cyan, hue: 'cyan' as Hue},
  {title: 'Tidak berpusar', sub: 'tanpa pusaran', color: C.gold, hue: 'gold' as Hue},
];
const CXS = [290, 730, 1170, 1610];
const CW = 400;
const CTOP = 612;
const CH = 250;
const IY = 690;

const CardIcon: React.FC<{i: number; x: number; t: number}> = ({i, x, t}) => {
  if (i === 0) {
    // kotak air ditekan dari dua sisi: volumenya tak berubah
    const push = Math.sin(t * 3);
    return (
      <g>
        <rect x={x - 70} y={IY - 40} width={140} height={80} rx={6} fill={C.water} opacity={0.35} stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={2} />
        {Array.from({length: 15}, (_, k) => (
          <circle key={k} cx={x - 52 + (k % 5) * 26 + 1.5 * Math.sin(t * 9 + k)} cy={IY - 22 + Math.floor(k / 5) * 22 + 1.5 * Math.cos(t * 8 + k)} r={6} fill="#dff3ff" opacity={0.75} />
        ))}
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={x + s * 76 - 4 - s * 1.5 * Math.max(0, push)} y={IY - 46} width={8} height={92} rx={3} fill="#a9b6d6" />
            <Arrow x1={x + s * (150 + 8 * push)} y1={IY} x2={x + s * 90} y2={IY} color="force" width={4} pulse={false} />
          </g>
        ))}
      </g>
    );
  }
  if (i === 1) {
    // tiga lapisan bergerak sama cepat: tak ada gesekan antar-lapisan
    return (
      <g>
        {[0, 1, 2].map((k) => {
          const y = IY - 36 + k * 36;
          return (
            <g key={k}>
              <rect x={x - 110} y={y - 14} width={220} height={28} rx={6} fill={C.water} opacity={0.22 + 0.06 * k} />
              {Array.from({length: 4}, (_, m) => {
                const ph = fr(t * 0.45 + m / 4);
                return <circle key={m} cx={x - 100 + ph * 200} cy={y} r={4} fill="#fff" opacity={0.85 * cyc(ph) * 1.2} />;
              })}
              <Arrow x1={x - 170} y1={y} x2={x - 122} y2={y} color="cyan" width={3} pulse={false} />
            </g>
          );
        })}
        <Label x={x + 150} y={IY} size={24} color={C.heat} font="serif" italic>
          η = 0
        </Label>
      </g>
    );
  }
  if (i === 2) {
    // titik tetap: panah kecepatan di titik itu tidak berubah, walau partikel terus lewat
    const clockA = t * 2;
    return (
      <g>
        {[-26, 0, 26].map((dy, k) => (
          <Streamline
            key={k}
            pts={[
              [x - 150, IY + dy + 10],
              [x - 40, IY + dy],
              [x + 60, IY + dy - 8],
              [x + 150, IY + dy - 14],
            ]}
            speed={90}
            n={4}
            color="#dff3ff"
            line={0.2}
            seed={k * 3 + 1}
          />
        ))}
        <circle cx={x - 20} cy={IY} r={10} fill="none" stroke={C.cyan} strokeWidth={2.5} />
        <line x1={x - 36} y1={IY} x2={x - 4} y2={IY} stroke={C.cyan} strokeWidth={1.5} />
        <line x1={x - 20} y1={IY - 16} x2={x - 20} y2={IY + 16} stroke={C.cyan} strokeWidth={1.5} />
        <Arrow x1={x - 20} y1={IY} x2={x + 46} y2={IY - 5} color="cyan" width={4} pulse={false} />
        <g transform={`translate(${x + 128} ${IY - 36})`}>
          <circle r={20} fill="#0a1230" stroke="#cfd8f0" strokeWidth={2} />
          <line x1={0} y1={0} x2={14 * Math.sin(clockA)} y2={-14 * Math.cos(clockA)} stroke="#cfd8f0" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={0} y1={0} x2={8 * Math.sin(clockA / 12)} y2={-8 * Math.cos(clockA / 12)} stroke="#cfd8f0" strokeWidth={3} strokeLinecap="round" />
        </g>
      </g>
    );
  }
  // kincir kecil hanyut tanpa berputar
  const ph = fr(t * 0.22);
  const kx = x - 130 + ph * 260;
  return (
    <g>
      {[-30, 0, 30].map((dy, k) => (
        <line key={k} x1={x - 160} y1={IY + dy} x2={x + 160} y2={IY + dy} stroke="#dff3ff" strokeOpacity={0.18} strokeWidth={1.5} />
      ))}
      {Array.from({length: 6}, (_, m) => {
        const q = fr(t * 0.22 + m / 6 + 0.08);
        return <circle key={m} cx={x - 150 + q * 300} cy={IY + [-30, 0, 30][m % 3]} r={3} fill="#fff" opacity={0.7 * cyc(q)} />;
      })}
      <g opacity={Math.min(1, cyc(ph) * 1.4)} transform={`translate(${kx} ${IY})`}>
        <circle r={7} fill={C.gold} />
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={-3} y={-30} width={6} height={24} rx={2} fill={C.gold} opacity={0.85} transform={`rotate(${k * 90})`} />
        ))}
      </g>
      <g transform={`translate(${x + 150} ${IY - 36})`}>
        <path d="M-14,6 A16,16 0 1 1 10,12" fill="none" stroke={C.muted} strokeWidth={3} />
        <path d="M10,12 l-2,-10 l9,5 Z" fill={C.muted} />
        <path d="M-20,-20 L20,20 M-20,20 L20,-20" stroke={C.heat} strokeWidth={3.5} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------- udara & pengukur ---------------- */
const GX = 1460;
const GY = 590;
const GR = 210;
const gPt = (m: number, r = GR): [number, number] => [GX + r * Math.cos(Math.PI * (1 - m)), GY - r * Math.sin(Math.PI * (1 - m))];
const arcD = (m0: number, m1: number, r = GR) => {
  const [a, b] = gPt(m0, r);
  const [c, d] = gPt(m1, r);
  return `M${a.toFixed(1)},${b.toFixed(1)} A${r},${r} 0 0 1 ${c.toFixed(1)},${d.toFixed(1)}`;
};

export const Ideal: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();

  // ---- babak ----
  const turb = 1 - ramp(t, cue(1) + 0.6, cue(1) + 3.6, EASE_IN_OUT);
  const tEmpat = wordOf(1, 'empat');
  const shrink = ramp(t, tEmpat - 1.0, tEmpat + 0.3, EASE_IN_OUT);
  const toPipe = ramp(t, cue(4) - 0.7, cue(4) + 0.3, EASE_IN_OUT);
  const pipeOn = ramp(t, cue(4) - 0.2, cue(4) + 0.6);
  const chanOp = 1 - pipeOn;
  const cardsOut = ramp(t, cue(4) - 0.9, cue(4) - 0.3, EASE_IN_OUT);
  const pipeOut = ramp(t, cue(6) - 0.6, cue(6) + 0.1, EASE_IN_OUT);
  const air = ramp(t, cue(6) - 0.3, cue(6) + 0.5);

  const chTop = mix(mix(250, 200, shrink), 320, toPipe);
  const chBot = mix(mix(790, 560, shrink), 620, toPipe);

  const wordsA = [wordOf(0, 'berputar'), wordOf(0, 'bergolak'), wordOf(0, 'bergesekan')];
  const tagA = wordsA.map((w) => ramp(t, w - 0.2, w + 0.4, BACK) * (1 - ramp(t, cue(1) + 1.5, cue(1) + 2.5)));
  const idealTag = win(t, wordOf(1, 'ideal') - 0.2, tEmpat - 1.0, 0.5, 0.6);
  const slots = ramp(t, tEmpat - 0.2, tEmpat + 0.6) * (1 - cardsOut);
  const cardT = [wordOf(2, 'termampatkan'), wordOf(2, 'kental'), wordOf(3, 'tunak'), wordOf(3, 'berpusar')];
  const cardP = cardT.map((w) => ramp(t, w - 0.3, w + 0.5, BACK) * (1 - cardsOut));
  const cardAct = cardT.map((w, k) => win(t, w - 0.3, (cardT[k + 1] ?? cue(4) - 1.2) - 0.3, 0.4, 0.6));

  // ---- partikel kanal (berpusar → sejajar) ----
  const lanesN = 9;
  const perLane = 8;
  const U = 0.055; // putaran per detik sepanjang kanal
  const pos = (j: number, k: number, tt: number): [number, number] => {
    const f = (j + 0.5) / lanesN;
    const u = tt * U * (0.9 + 0.2 * rand(j * 3.1)) + k / perLane + rand(j * 7.7 + k) * 0.08;
    const x = X0 + fr(u) * (X1 - X0);
    const om = 2.2 + 1.6 * rand(j * 11 + k * 3);
    const A = 34 * turb * (0.6 + 0.6 * rand(j + k * 5));
    const ph = rand(j * 5 + k * 13) * 6.28;
    const y = chTop + f * (chBot - chTop) + A * Math.sin(om * tt + ph) + turb * 26 * Math.sin(x * 0.012 + tt * 1.3 + j);
    return [x + A * Math.cos(om * tt + ph), y];
  };

  // ---- partikel yang disorot di pipa ----
  const tTrace = wordOf(4, 'lintasan') - 0.2;
  const tau = Math.max(0, t - tTrace);
  const firstP = Math.min(1, tau / TRAV.total);
  const loopPh = fr(tau / TRAV.total);
  const hx = xAtTau(loopPh * TRAV.total);
  const hop = Math.min(1, loopPh * 14) * Math.min(1, (1 - loopPh) * 14) * ramp(t, tTrace - 0.2, tTrace + 0.2);
  const htrail: [number, number][] = [1, 2, 3, 4, 5].map((m) => {
    const xx = xAtTau(Math.max(0, loopPh * TRAV.total - m * 0.035));
    return [xx, laneY(xx, LANE_F)];
  });
  const tagLane = ramp(t, wordOf(4, 'garis') - 0.2, wordOf(4, 'garis') + 0.5);
  const noCross = win(t, wordOf(5, 'berpotongan') - 0.4, cue(6) - 0.8, 0.5, 0.6);
  const bunch = ramp(t, wordOf(5, 'merapat') - 0.3, wordOf(5, 'merapat') + 0.5);
  const faster = ramp(t, wordOf(5, 'cepat') - 0.3, wordOf(5, 'cepat') + 0.5);
  const v1 = 60;
  const v2 = v1 * (150 / 70) ** 2;

  // ---- udara ----
  const gaugeIn = ramp(t, wordOf(6, 'kecepatannya') - 0.4, wordOf(6, 'kecepatannya') + 0.6);
  const sound = ramp(t, wordOf(6, 'suara') - 0.4, wordOf(6, 'suara') + 0.4);
  const needle = gaugeIn * (0.1 + 0.04 * Math.sin(t * 0.9) + 0.015 * Math.sin(t * 3.1));

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Kanal: nyata → ideal ================= */}
        {chanOp * (1 - pipeOut) > 0.001 ? (
          <g opacity={chanOp}>
            <Glow x={960} y={(chTop + chBot) / 2} r={640} color="water" opacity={0.25} />
            <Glow x={960} y={(chTop + chBot) / 2} r={360} color="heat" opacity={0.25 * turb} />
            <rect x={X0} y={chTop} width={X1 - X0} height={chBot - chTop} fill={C.water} opacity={0.12} />
            <defs>
              <clipPath id="id-ch">
                <rect x={X0} y={chTop} width={X1 - X0} height={chBot - chTop} />
              </clipPath>
            </defs>
            <g clipPath="url(#id-ch)">
              {Array.from({length: lanesN}, (_, j) =>
                Array.from({length: perLane}, (_, k) => {
                  const [x, y] = pos(j, k, t);
                  const trail = [0, 1, 2, 3, 4, 5].map((m) => pos(j, k, t - m * 0.05));
                  if (trail.some(([tx]) => tx > x + 5)) trail.length = 1; // tepat saat melingkar kembali ke kiri
                  const edge = Math.min(1, (x - X0) / 60) * Math.min(1, (X1 - x) / 60);
                  const d = trail.map(([tx, ty], m) => `${m ? 'L' : 'M'}${tx.toFixed(1)},${ty.toFixed(1)}`).join(' ');
                  return (
                    <g key={`${j}-${k}`} opacity={edge}>
                      <path d={d} fill="none" stroke="#dff3ff" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
                      <circle cx={x} cy={y} r={2.8} fill="#fff" />
                    </g>
                  );
                }),
              )}
              {/* pusaran */}
              {Array.from({length: 7}, (_, k) => {
                const ph = fr(t * 0.06 + k / 7);
                const ex = X0 + ph * (X1 - X0);
                const ey = chTop + (0.2 + 0.6 * rand(k * 4.3)) * (chBot - chTop);
                const rot = t * (k % 2 ? 160 : -140);
                const r = 30 + 20 * rand(k);
                return (
                  <g key={k} opacity={0.55 * turb * cyc(ph) * 1.3} transform={`translate(${ex} ${ey}) rotate(${rot})`}>
                    <path d={`M${r},0 A${r},${r} 0 1 1 ${-r * 0.7},${r * 0.7} M${r * 0.55},0 A${r * 0.55},${r * 0.55} 0 1 1 ${-r * 0.3},${r * 0.45}`} fill="none" stroke={C.heat} strokeOpacity={0.7} strokeWidth={2.5} strokeLinecap="round" />
                  </g>
                );
              })}
              {/* gesekan di dinding */}
              {Array.from({length: 14}, (_, k) => {
                const ph = fr(t * 1.7 + rand(k) * 3);
                const x = X0 + 60 + rand(k * 9.1) * (X1 - X0 - 120);
                const top = k % 2 === 0;
                const y = top ? chTop + 6 : chBot - 6;
                return <line key={k} x1={x} y1={y} x2={x - 14} y2={y + (top ? 6 : -6)} stroke={C.heat} strokeWidth={2.5} strokeLinecap="round" opacity={0.8 * turb * tagA[2] * Math.sin(Math.PI * ph)} />;
              })}
            </g>
            {/* dinding kanal + arsir */}
            {[chTop, chBot].map((y, k) => (
              <g key={k}>
                <line x1={X0} y1={y} x2={X1} y2={y} stroke="#bfe3ff" strokeOpacity={0.8} strokeWidth={4} />
                {Array.from({length: 34}, (_, m) => {
                  const x = X0 + 10 + m * 50;
                  return <line key={m} x1={x} y1={y + (k ? 4 : -4)} x2={x - 14} y2={y + (k ? 18 : -18)} stroke="#bfe3ff" strokeOpacity={0.3} strokeWidth={2} />;
                })}
              </g>
            ))}
            {['berputar', 'bergolak', 'bergesekan'].map((w, k) => (
              <Label key={w} x={[560, 960, 1360][k]} y={chTop - 50} size={34} weight={600} color={k === 2 ? C.heat : C.gold} opacity={tagA[k]}>
                {w}
              </Label>
            ))}
            <Motes x={960} y={(chTop + chBot) / 2} rx={820} ry={200} n={24} color="cyan" opacity={0.3} seed={3} />
          </g>
        ) : null}

        {/* slot kartu (sebelum diisi) */}
        {CXS.map((x, i) => (
          <rect
            key={i}
            x={x - CW / 2}
            y={CTOP}
            width={CW}
            height={CH}
            rx={20}
            fill="none"
            stroke={CARDS[i].color}
            strokeOpacity={0.4}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={slots * (1 - Math.min(1, cardP[i]))}
          />
        ))}
        {CXS.map((x, i) => (
          <Glow key={`g${i}`} x={x} y={CTOP + CH / 2} r={260} color={CARDS[i].hue} opacity={0.4 * cardAct[i] * (1 - cardsOut)} />
        ))}

        {/* ================= Pipa & garis arus ================= */}
        {pipeOn * (1 - pipeOut) > 0.001 ? (
          <g opacity={pipeOn * (1 - pipeOut)}>
            <Glow x={960} y={PYC} r={520} color="cyan" opacity={0.2 + 0.3 * faster} />
            <Pipe x0={PX0} x1={PX1} yc={PYC} knots={KN} v0={V0} lanes={7} perLane={5} lines={0.45} />
            <DrawPath d={LANE_D} p={firstP} stroke="cyan" width={3} halo opacity={ramp(t, tTrace, tTrace + 0.3)} />
            <Spark x={hx} y={laneY(hx, LANE_F)} r={7} color="cyan" trail={htrail} opacity={hop} />
            <g opacity={tagLane}>
              <line x1={330} y1={292} x2={380} y2={laneY(380, LANE_F) - 6} stroke={C.cyan} strokeWidth={2} strokeDasharray="5 6" />
              <Label x={330} y={262} size={34} weight={700} color={C.cyan}>
                garis arus
              </Label>
            </g>
            {/* jarak antar-garis: renggang vs rapat */}
            {[
              [440, 0],
              [960, 1],
            ].map(([x, k]) => {
              const ya = laneY(x, 0);
              const yb = laneY(x, 0.8 / 3);
              return (
                <g key={x} opacity={bunch}>
                  <line x1={x + 14} y1={ya} x2={x + 14} y2={yb} stroke={C.gold} strokeWidth={3} />
                  <line x1={x + 6} y1={ya} x2={x + 22} y2={ya} stroke={C.gold} strokeWidth={3} />
                  <line x1={x + 6} y1={yb} x2={x + 22} y2={yb} stroke={C.gold} strokeWidth={3} />
                  <Label x={x + (k ? 40 : 34)} y={(ya + yb) / 2} size={24} color={C.gold} anchor="start">
                    {k ? 'rapat' : 'renggang'}
                  </Label>
                </g>
              );
            })}
            <Label x={960} y={288} size={30} weight={600} color={C.gold} opacity={bunch}>
              merapat → lebih cepat
            </Label>
            {/* panah kecepatan sebanding (r₁/r₂)² */}
            <g opacity={faster}>
              <Arrow x1={440 - v1 / 2} y1={680} x2={440 + v1 / 2} y2={680} color="cyan" width={6} />
              <Label x={440} y={726} size={34} color={C.cyan} font="serif" italic>
                v<TSub>1</TSub>
              </Label>
              <Arrow x1={960 - v2 / 2} y1={680} x2={960 + v2 / 2} y2={680} color="cyan" width={6} />
              <Label x={960} y={726} size={34} color={C.cyan} font="serif" italic>
                v<TSub>2</TSub>
              </Label>
              <Twinkles x={960} y={680} rx={150} ry={20} n={4} color="cyan" seed={5} />
            </g>
            {/* sisipan: dua garis arus yang berpotongan → mustahil */}
            <g opacity={noCross}>
              <rect x={1330} y={650} width={400} height={180} rx={18} fill="rgba(10,16,36,0.9)" stroke={C.heat} strokeOpacity={0.6} strokeWidth={2} />
              <path d="M1370,690 C1460,700 1500,760 1580,790" fill="none" stroke="#dff3ff" strokeWidth={3} />
              <path d="M1370,790 C1460,780 1500,720 1580,690" fill="none" stroke="#dff3ff" strokeWidth={3} />
              <circle cx={1475} cy={740} r={7} fill="#fff" />
              <Arrow x1={1475} y1={740} x2={1520} y2={714} color="cyan" width={3} pulse={false} />
              <Arrow x1={1475} y1={740} x2={1520} y2={766} color="cyan" width={3} pulse={false} />
              <path d="M1440,705 L1510,775 M1440,775 L1510,705" stroke={C.heat} strokeWidth={6} strokeLinecap="round" opacity={ramp(noCross, 0.4, 1)} />
              <Label x={1655} y={722} size={24} color={C.ink}>
                satu titik,
              </Label>
              <Label x={1655} y={756} size={24} color={C.ink}>
                dua arah?
              </Label>
              <Ripple x={1475} y={740} p={fr(t * 0.6)} r={46} color="heat" rings={2} width={2} />
            </g>
          </g>
        ) : null}

        {/* ================= Udara & kecepatan suara ================= */}
        {air > 0.001 ? (
          <g opacity={air}>
            <Glow x={620} y={470} r={520} color="cyan" opacity={0.18} />
            {[280, 380, 480, 580, 680].map((y0, k) => {
              const pts: [number, number][] = Array.from({length: 21}, (_, i) => [100 + i * 52, y0 + 22 * Math.sin(i * 0.42 + k * 0.9)]);
              return <Streamline key={k} pts={pts} speed={150} n={6} color="#dff3ff" line={0.22} seed={k * 2} />;
            })}
            {/* paket udara: ukurannya tetap (ρ tetap) */}
            {Array.from({length: 4}, (_, k) => {
              const ph = fr(t * 0.13 + k / 4);
              const i = ph * 20;
              const y0 = [380, 480, 580, 480][k];
              const x = 100 + i * 52;
              const y = y0 + 22 * Math.sin(i * 0.42 + [1, 2, 3, 2][k] * 0.9);
              return <rect key={k} x={x - 22} y={y - 22} width={44} height={44} rx={6} fill={C.spr} fillOpacity={0.15} stroke={C.spr} strokeWidth={2.5} opacity={cyc(ph) * 1.2} />;
            })}
            <Label x={620} y={226} size={28} color={C.spr} opacity={ramp(t, cue(6) + 0.6, cue(6) + 1.4)}>
              paket udara tak menyusut → ρ ≈ tetap
            </Label>
            {/* pengukur */}
            <g opacity={gaugeIn}>
              <path d={arcD(0, 1)} fill="none" stroke="#2a3a6a" strokeWidth={26} />
              <path d={arcD(0, 0.3)} fill="none" stroke={C.work} strokeOpacity={0.8} strokeWidth={26} />
              <path d={arcD(0.3, 1)} fill="none" stroke={C.heat} strokeOpacity={0.25 + 0.35 * sound} strokeWidth={26} />
              {Array.from({length: 11}, (_, k) => {
                const [xa, ya] = gPt(k / 10, GR - 20);
                const [xb, yb] = gPt(k / 10, GR - (k % 5 === 0 ? 46 : 34));
                return <line key={k} x1={xa} y1={ya} x2={xb} y2={yb} stroke="#cfd8f0" strokeWidth={k % 5 === 0 ? 3 : 2} />;
              })}
              <Label x={gPt(0, GR + 4)[0] - 4} y={GY + 34} size={24} color={C.muted}>
                0
              </Label>
              <Label x={gPt(0.3, GR + 40)[0]} y={gPt(0.3, GR + 40)[1]} size={24} color={C.work}>
                0,3
              </Label>
              <Label x={gPt(1, GR)[0]} y={GY + 34} size={26} weight={600} color={C.heat} opacity={0.5 + 0.5 * sound}>
                kecepatan suara
              </Label>
              <Label x={GX} y={GY - 60} size={24} color={C.muted}>
                Mach
              </Label>
              {/* jarum */}
              {(() => {
                const [nx, ny] = gPt(needle, GR - 30);
                return (
                  <g>
                    <line x1={GX} y1={GY} x2={nx} y2={ny} stroke={C.cyan} strokeWidth={6} strokeLinecap="round" />
                    <circle cx={GX} cy={GY} r={14} fill={C.cyan} />
                    <circle cx={GX} cy={GY} r={5} fill="#fff" />
                    <Spark x={nx} y={ny} r={5} color="cyan" />
                  </g>
                );
              })()}
              <Label x={GX - 70} y={GY + 90} size={28} weight={600} color={C.work} opacity={sound}>
                v ≪ kecepatan suara
              </Label>
            </g>
          </g>
        ) : null}
      </Stage>

      {/* ================= HTML ================= */}
      <Badge x={960} y={(chTop + chBot) / 2} text="model: fluida ideal" color={C.cyan} size={34} opacity={idealTag * chanOp} scale={0.9 + 0.1 * idealTag} />
      {CARDS.map((c, i) => {
        const q = Math.min(1, cardP[i]);
        if (cardP[i] <= 0.001) return null;
        return (
          <div
            key={c.title}
            style={{
              position: 'absolute',
              left: CXS[i] - CW / 2,
              top: CTOP,
              width: CW,
              height: CH,
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
              border: `1.5px solid ${c.color}55`,
              borderTop: `7px solid ${c.color}`,
              boxShadow: `0 18px 50px rgba(0,0,0,0.45), 0 0 ${30 + 30 * cardAct[i]}px ${c.color}${Math.round(0x22 + 0x30 * cardAct[i]).toString(16).padStart(2, '0')}`,
              opacity: Math.min(1, cardP[i] * 1.3),
              translate: `0px ${(1 - q) * 30 - 6 * cardAct[i]}px`,
              scale: String(0.92 + 0.08 * cardP[i]),
              boxSizing: 'border-box',
              padding: '0 24px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              fontFamily: FONT.head,
              overflow: 'hidden',
            }}
          >
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${-40 + 150 * q - 16}%, rgba(220,240,255,0.12) ${-40 + 150 * q}%, transparent ${-40 + 150 * q + 16}%)`}} />
            <div style={{fontSize: 32, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap'}}>{c.title}</div>
            <div style={{fontSize: 22, color: C.muted, marginTop: 4, whiteSpace: 'nowrap'}}>{c.sub}</div>
          </div>
        );
      })}
      <Stage>
        {CXS.map((x, i) =>
          cardP[i] > 0.001 ? (
            <g key={i} opacity={Math.min(1, cardP[i])}>
              <CardIcon i={i} x={x} t={t} />
            </g>
          ) : null,
        )}
      </Stage>
      <Note x={960} y={820} p={ramp(t, wordOf(6, 'jauh') - 0.3, wordOf(6, 'jauh') + 0.5) * (1 - ramp(t, dur - 1.0, dur - 0.3))} color={C.work} size={30}>
        udara ≈ tak termampatkan bila <span style={{color: C.cyan}}>v</span> jauh di bawah kecepatan suara <span style={{color: C.muted}}>(umumnya Mach &lt; 0,3)</span>
      </Note>
    </AbsoluteFill>
  );
};
