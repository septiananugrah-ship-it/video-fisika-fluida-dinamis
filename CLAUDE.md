# Konteks repo (untuk asisten AI)

- Video **"Arus yang Mengangkat" — Fluida Dinamis** (Fisika Umum, S1 Kimia UNESA) milik **Yayan** (Septian Anugrah Dwi Putra), seri Fisika Umum #3. Seri #1 = `video-fisika-energi`, #2 = `video-fisika-fluida-statis` (mesin, komponen, dan alur kerja disalin dari #2). Aturan umum & pelajaran teknis: repo `septiananugrah-ship-it/science-intro` → `CLAUDE.md`.
- Seri berikutnya (repo terpisah): **Momentum**. Angka yang dipakai dicek di `naskah/AUDIT.md`.
- Branding: **tanpa intro SCIENTIAN terpisah** (pengguna: cukup di judul pembuka) — judul menampilkan kapsul logo S + "Explore Science with Yayan"; outro SCIENTIAN + "Disusun oleh Septian Anugrah Dwi Putra" + "Berikutnya: Momentum".
- Gaya seri **"Lab"** (malam biru tinta + kisi cetak biru, Space Grotesk/Inter/JetBrains Mono/Source Serif 4) dengan nuansa **aliran**: garis arus yang terus mengalir, partikel yang mempercepat di bagian sempit, rumus fluida dinamis melayang di latar.
- **Kode warna**: air / debit Q = `C.water`, tekanan p = merah muda `C.press`, kecepatan v = toska `C.cyan`, kekentalan η = merah `C.heat`, massa jenis ρ = ungu `C.spr`, gaya/berat = kuning `C.force`. Suku Bernoulli: p merah muda, ½ρv² jingga (`C.kin`), ρgh biru (`C.pot`) — sama dengan kode energi seri #1.
- Komponen: `src/components/flow.tsx` (**Pipe** berpenampang berubah dengan partikel sesuai kontinuitas, **Streamline** bebas dengan kecepatan per titik, **Jet** semburan parabola, **Smoke** laminar→turbulen), `fluid.tsx` (Water, Tank, Bubbles, PressureArrow, WaterMolecule, DepthRuler), `physics.tsx`, `primitives.tsx`.
- **Semua adegan harus terus bergerak** — panduan lengkap `naskah/POLISH.md`. Fluida yang mengalir harus tampak mengalir (partikel/garis arus), bukan panah statis.
- **Claude tidak menjalankan workflow GitHub Actions.** Setelah merge ke `main`, berhenti dan minta pengguna menekan *Run workflow* sendiri; beri link & isian.
- Narasi: menyusul (ElevenLabs suara klon, atau Edge TTS gratis lewat input `mesin`). Selalu sediakan versi tanpa narasi.

## Aturan konten & tata letak

- Rumus utama ≥ 56 px (`Formula`), satu kartu per momen; zona subtitle (bawah 180 px) selalu bebas; margin ≥ 80 px. Komponen HTML di luar `<Stage>`.
- g = 10 m/s², ρ air = 1000 kg/m³, ρ udara ≈ 1,2 kg/m³, p_atm = 100 kPa (kecuali disebut lain). "≈" untuk perkiraan. Koma desimal.
- Gaya angkat: jangan pakai mitos "waktu tempuh sama" (narasi menyebutnya keliru); udara atas tiba lebih dulu.
- Teks TTS terpisah dari subtitle (`src/tts.ts`; huruf tunggal & nama tokoh dieja otomatis).
- Kemulusan: `EASE` lembut, fade keluar `EASE_IN_OUT`; tanpa ganti berdasarkan ambang (silang-pudar); tanpa CSS blur; tanpa filter pada garis lurus.

## QA

- `CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/qa-moments.mjs out/x adegan:baris:offset ...` lalu `python3 scripts/contact.py out/x out/x-sheets 6` (offset positif = detik setelah baris mulai).
- `scripts/qa-lines.mjs` = still di akhir setiap baris narasi (audit menyeluruh).
- Uji kemulusan: `node scripts/qa-film.mjs out/a.mp4 <frameAwal> <frameAkhir> 0.25` lalu `python3 scripts/qa-glitch.py out/a.mp4 <frameAwal>`.
