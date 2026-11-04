import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND} from './brand';
import {C, FONT} from './theme';

/** Gambar mini 2K untuk YouTube/LMS. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 30% 40%, #20305e 0%, ${C.bg} 70%)`, fontFamily: FONT.head}}>
    <div style={{position: 'absolute', left: 140, top: 180, color: C.gold, fontSize: 54, letterSpacing: 10, fontWeight: 600}}>{BRAND.series.toUpperCase()}</div>
    <div style={{position: 'absolute', left: 130, top: 270, color: C.ink, fontSize: 200, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6}}>
      Arus yang
      <br />
      <span style={{color: C.water}}>Mengangkat</span>
    </div>
    <div style={{position: 'absolute', left: 140, top: 760, color: C.muted, fontSize: 70, fontWeight: 500}}>{BRAND.subtitle}</div>
    <div style={{position: 'absolute', left: 140, bottom: 140, color: C.ink, fontSize: 44, letterSpacing: 8, fontWeight: 600}}>
      {BRAND.channel} <span style={{color: C.muted, letterSpacing: 2, fontWeight: 400}}>· {BRAND.tagline}</span>
    </div>
    <svg width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
      <path d="M1560,420 L1860,420 C1960,420 1980,560 2080,560 L2200,560 C2300,560 2320,420 2420,420" fill="none" stroke={C.ink} strokeWidth={10} />
      <path d="M1560,1020 L1860,1020 C1960,1020 1980,880 2080,880 L2200,880 C2300,880 2320,1020 2420,1020" fill="none" stroke={C.ink} strokeWidth={10} />
      {[0.15, 0.32, 0.5, 0.68, 0.85].map((f) => {
        const yw = 420 + f * 600;
        const yn = 560 + f * 320;
        return <path key={f} d={`M1580,${yw} L1860,${yw} C1960,${yw} 1980,${yn} 2080,${yn} L2200,${yn} C2300,${yn} 2320,${yw} 2400,${yw}`} fill="none" stroke={C.water} strokeWidth={5} opacity={0.75} />;
      })}
      {[[1640, 1760], [2050, 2240]].map(([a, b], i) => (
        <g key={i}>
          <line x1={a} y1={720} x2={b} y2={720} stroke={C.cyan} strokeWidth={12} strokeLinecap="round" />
          <path d={`M${b - 30},${700} L${b + 8},${720} L${b - 30},${740} Z`} fill={C.cyan} />
        </g>
      ))}
      <text x={1700} y={1110} textAnchor="middle" fontFamily={FONT.mono} fontSize={44} fill={C.muted}>v kecil</text>
      <text x={2140} y={1110} textAnchor="middle" fontFamily={FONT.mono} fontSize={44} fill={C.cyan}>v besar</text>
    </svg>
  </AbsoluteFill>
);
