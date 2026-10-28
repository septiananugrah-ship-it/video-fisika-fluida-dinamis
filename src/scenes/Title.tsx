import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Bubbles, PressureArrow, Water, WaterMolecule} from '../components/fluid';
import {Glow, Ripple, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa air: berkas cahaya dari permukaan, gelembung naik, cincin panah tekanan
// yang menyempit dan "mendorong" judul dari segala arah, permukaan air bergelombang di bawah.
const CX = 960;
const CY = 470;
const NA = 20;

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const ring = ramp(t, 0.4, 2.2);
  // denyut "dorongan": cincin panah menyempit sedikit lalu kembali
  const squeeze = ramp(t, 3.6, 4.4, EASE_IN_OUT) - ramp(t, 4.6, 5.8, EASE_IN_OUT);
  const title = BRAND.title;
  const split = title.indexOf('Mengangkat');

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="ti-ray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfe6ff" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#bfe6ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Glow x={CX} y={CY} r={700} color="water" opacity={0.45 * a} />
          <Glow x={CX} y={CY} r={340} color="press" opacity={0.25 * squeeze + 0.12 * ring} />
          {/* berkas cahaya dari atas, bergoyang pelan */}
          {Array.from({length: 6}, (_, i) => {
            const x = 260 + i * 290 + 40 * Math.sin(t * 0.5 + i * 1.3);
            const w = 70 + 40 * rand(i * 2.7);
            const sk = 120 + 60 * Math.sin(t * 0.3 + i);
            return <path key={i} d={`M${x},0 L${x + w},0 L${x + w + sk},900 L${x + sk - w * 0.6},900 Z`} fill="url(#ti-ray)" opacity={a * (0.55 + 0.45 * Math.sin(t * 0.9 + i * 2))} />;
          })}
          {/* molekul air melayang di tepi */}
          {[
            [230, 300, 0.9],
            [1700, 260, 0.8],
            [300, 690, 0.7],
            [1640, 680, 0.95],
          ].map(([x, y, s], i) => (
            <WaterMolecule key={i} x={x + 20 * Math.sin(t * 0.6 + i)} y={y + 14 * Math.cos(t * 0.7 + i * 2)} s={s} rot={t * (i % 2 ? 22 : -18) + i * 60} opacity={0.55 * ramp(t, 0.6 + i * 0.2, 1.6 + i * 0.2)} />
          ))}
          <Bubbles x={100} y={160} w={1720} h={700} n={20} seed={3} speed={1.4} />
          {/* cincin panah tekanan: tegak lurus elips, menunjuk ke dalam */}
          {Array.from({length: NA}, (_, i) => {
            const ang = (i / NA) * Math.PI * 2;
            const rx = 800 - 70 * squeeze;
            const ry = 330 - 40 * squeeze;
            const x = CX + rx * Math.cos(ang);
            const y = CY + ry * Math.sin(ang);
            // normal elips ke luar
            const nx0 = Math.cos(ang) / rx;
            const ny0 = Math.sin(ang) / ry;
            const nl = Math.hypot(nx0, ny0);
            const q = ramp(ring, (i % 5) * 0.08, (i % 5) * 0.08 + 0.6);
            // lebih dalam (bawah layar) → lebih panjang, seperti tekanan hidrostatik
            const L = (46 + 0.08 * (y - 140)) * q * (1 + 0.35 * squeeze);
            return <PressureArrow key={i} x={x} y={y} nx={nx0 / nl} ny={ny0 / nl} L={L} width={4} opacity={0.75 * q} />;
          })}
          <Ripple x={CX} y={CY} p={(t - 4.0) / 1.8} r={520} color="press" rings={3} width={3} />
          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="water" rings={2} width={2} />
          {/* permukaan air di bawah */}
          <Water x={0} y={808} w={1920} h={140} amp={6} seed={2} opacity={ramp(t, -0.4, 1.0)} />
          {Array.from({length: 7}, (_, i) => {
            const ph = (((t * 0.35 + i / 7) % 1) + 1) % 1;
            const x = 160 + ((i * 263) % 1600);
            return <ellipse key={i} cx={x} cy={810} rx={10 + 70 * ph} ry={2 + 6 * ph} fill="none" stroke="#e0f4ff" strokeWidth={2} opacity={0.45 * cyc(ph)} />;
          })}
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="cyan" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.cyan, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const bob = 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const hot = i >= split;
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT.head,
                    fontWeight: 700,
                    fontSize: 142,
                    letterSpacing: -4,
                    whiteSpace: 'pre',
                    display: 'inline-block',
                    color: hot ? C.water : C.ink,
                    opacity: Math.min(1, p),
                    translate: `0px ${(1 - p) * 60 + bob}px`,
                    textShadow: hot ? `0 0 ${40 + 14 * Math.sin(t * 2 + i * 0.4)}px rgba(58,168,255,0.6)` : '0 0 40px rgba(120,160,255,0.25)',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{fontFamily: FONT.head, fontSize: 50, color: C.ink, fontWeight: 500, marginTop: 8, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>{BRAND.subtitle}</div>
          <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 14, opacity: ramp(t, 2.1, 3.1)}}>{BRAND.course}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 34,
              padding: '10px 26px 10px 14px',
              borderRadius: 999,
              border: '1.5px solid rgba(120,190,255,0.35)',
              background: 'rgba(10,24,56,0.55)',
              opacity: brand,
              translate: `0px ${(1 - brand) * 14}px`,
              boxShadow: `0 0 ${24 + 10 * Math.sin(t * 1.8)}px rgba(58,168,255,0.25)`,
            }}
          >
            <Img src={staticFile('scientian-logo.png')} style={{width: 46, height: 46, rotate: `${4 * Math.sin(t * 0.9)}deg`}} />
            <div style={{fontFamily: FONT.head, fontSize: 30, color: C.ink, fontWeight: 500, letterSpacing: 2}}>
              Explore <span style={{color: C.gold, fontWeight: 600}}>Science</span> with Yayan
            </div>
          </div>
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.press, marginTop: 40, opacity: ramp(t, 4.2, 5.2), letterSpacing: 3 + 2 * (1 - ramp(t, 4.2, 5.6))}}>mendorong dari segala arah</div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
