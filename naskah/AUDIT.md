# Audit angka & konvensi — Arus yang Mengangkat (Fluida Dinamis)

Konvensi: g = 10 m/s², ρ air = 1000 kg/m³, ρ udara ≈ 1,2 kg/m³, p_atm = 100 000 Pa (kecuali disebut lain). Mengubah angka = rekam ulang baris.

| Adegan | Angka di narasi | Cek |
|---|---|---|
| hook | pesawat penumpang ≈ 70 ton | A320 umum 60–78 t ✓ |
| ideal | fluida ideal: tak termampatkan, tak kental, tunak, tak berpusar; udara ≈ tak termampatkan bila v ≪ kecepatan suara (umum: Mach < 0,3) | ✓ |
| flow | Re = ρvD/η; pipa: laminar < ≈ 2000, turbulen jauh di atasnya (> ≈ 4000); air 1 m/s, D = 2 cm, η = 1,0 mPa·s → Re = 1000·1·0,02/0,001 = 20 000 | ✓ |
| debit | 20 L / 40 s = 0,5 L/s = 5×10⁻⁴ m³/s; Q = Av | ✓ |
| continuity | A = 2 cm² = 2×10⁻⁴ m² → v = 5×10⁻⁴/2×10⁻⁴ = 2,5 m/s; A = 0,5 cm² → 10 m/s (debit dianggap tetap) | ✓ |
| pressurespeed | percepatan butuh gaya total = beda tekanan; aliran cepat ↔ tekanan rendah | kualitatif ✓ |
| bernoulli | Daniel Bernoulli, *Hydrodynamica* 1738; p + ½ρv² + ρgh = konstan sepanjang garis arus (energi per volume) | ✓ |
| venturi | D 4 cm → 2 cm (luas ÷4), v 1 → 4 m/s; Δp = ½·1000·(16 − 1) = 7500 Pa; Δh = 7500/(1000·10) = 0,75 m kolom air | ✓ |
| torricelli | h = 1,25 m → v = √(2·10·1,25) = 5 m/s; lubang 0,80 m di atas lantai → t = √(2·0,8/10) = 0,4 s → x = 2,0 m | ✓ |
| lift | 70 000 kg · 10 / 120 m² ≈ 5833 Pa ("≈ 5800 Pa"), 5,8 % dari 100 kPa ("kurang dari 6 %"); A320 luas sayap ≈ 122,6 m²; mitos waktu tempuh sama keliru (NASA Glenn) | ✓ |
| viscosity | madu η ≈ 2–10 Pa·s vs air 1,0 mPa·s ("ribuan kali"); Poiseuille Q = πr⁴Δp/(8ηL): r ÷ 2 → Q ÷ 16 | ✓ |
| strategy | v₁ = 2 m/s, p₁ = 150 kPa; A₂ = A₁/2 → v₂ = 4 m/s; h = 5 m: p₂ = 150 000 − ½·1000·(16 − 4) − 1000·10·5 = 150 000 − 6000 − 50 000 = 94 000 Pa | ✓ |
| aspirator | batas ≈ tekanan uap air: 2,34 kPa pada 20 °C ("≈ 2,3 kPa"); air dingin → tekanan uap lebih rendah → vakum lebih baik | CRC ✓ |
| bunsen | efek Venturi menghisap udara primer; cincin terbuka → nyala biru (pembakaran sempurna), tertutup → kuning berjelaga, lebih dingin | ✓ |
| nebulizer | nebulizer pneumatik AAS: gas cepat di ujung kapiler → hisap sampel (aspirasi) + pengabutan; prinsip sama di semprotan parfum & nebulizer jet asma | ✓ |
| viscometer | Ostwald: η ∝ ρt; η_X = 1,0 mPa·s · (800·90)/(1000·60) = 1,2 mPa·s; etanol ≈ 1,2 mPa·s (20 °C) | CRC ✓ |
| blood | stenosis: v naik, p turun (dapat menyebabkan getaran/flutter); r × 0,8 → Q × 0,8⁴ = 0,41 ("≈ 40 %") pada Δp tetap | ✓ |
| ships | RMS Olympic & HMS Hawke, 20 Sept 1911 — Hawke tertarik (efek hisap/interaksi hidrodinamik) ke lambung Olympic; Olympic kapal kembar Titanic | ✓ |
| roof | v = 30 m/s = 108 km/jam; ½·1,2·30² = 540 Pa; × 100 m² = 54 000 N ≈ berat 5,4 ton (g = 10) | ✓ |

## Konvensi
- Bernoulli dipakai pada satu garis arus fluida ideal; Torricelli: permukaan tangki turun lambat (v₁ ≈ 0) dan kedua titik terbuka ke udara.
- Pipa digambar 2D, tetapi kecepatan mengikuti luas pipa bulat (∝ r²) — lihat `flow.tsx`.
