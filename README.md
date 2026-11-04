# Arus yang Mengangkat — Fluida Dinamis (Fisika Umum)

Video edukasi **≈ 17 menit** (2K, 30 FPS) · **SCIENTIAN — Explore Science with Yayan** · disusun oleh **Septian Anugrah Dwi Putra**. Seri Fisika Umum #3 (sebelumnya: Usaha & Energi, Fluida Dinamis; berikutnya: Momentum). Dibuat dengan [Remotion](https://remotion.dev).

Gaya visual seri **"Lab"** bernuansa aliran: garis arus yang terus mengalir, partikel yang mempercepat di bagian sempit, dan kode warna tetap (tekanan merah muda · kecepatan toska · air/debit biru · ½ρv² jingga · ρgh biru · kekentalan merah). Tanpa intro terpisah: judul pembuka memuat logo S + "Explore Science with Yayan".

## Isi

| Bagian | Bab |
|---|---|
| Pembuka | Jempol di ujung selang, dua kertas merapat, pesawat 70 ton · judul · peta video |
| 1 · Konsep & cara berpikir | 01 Fluida ideal & garis arus · 02 Laminar atau turbulen · 03 Debit · 04 Kontinuitas · 05 Mengapa yang cepat bertekanan rendah · 06 Persamaan Bernoulli · 07 Venturimeter · 08 Torricelli · 09 Gaya angkat sayap · 10 Kekentalan & Poiseuille · 11 Cara berpikir soal fluida dinamis |
| 2 · Fluida mengalir di laboratorium kimia | 12 Pompa vakum air · 13 Pembakar Bunsen · 14 Nebulizer spektrometer · 15 Viskometer Ostwald |
| 3 · Penerapan | 16 Pembuluh darah yang menyempit · 17 Kapal yang berpapasan · 18 Atap yang terangkat badai |
| Penutup | 19 Rangkuman · rujukan |

Daftar bab bertimecode ada di `naskah/BAB_YOUTUBE.txt`, naskah teleprompter di `naskah/NASKAH_VOICEOVER.md` (cocok juga untuk merekam suara sendiri), audit angka di `naskah/AUDIT.md`.

## Render (tombol ditekan sendiri, tab **Actions**)

- **Belum ada suara?** Jalankan **Render Fluida Dinamis 2K 30FPS → Run workflow** dengan isian bawaan → versi musik + subtitle (`fluida-dinamis-tanpa-narasi-2k-30fps`).
- **Dengan narasi:** **Buat voice-over + render 2K → Run workflow**, pilih `mesin`:
  - `elevenlabs` — suara klon. Isi secret `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID` (Settings → Secrets and variables → Actions), atau isi voice ID di form. ±19 ribu karakter untuk seluruh naskah (muat dalam kuota Starter 30 ribu/bulan).
  - `edge` — gratis, tanpa kunci (suara Microsoft `id-ID-ArdiNeural` laki-laki / `id-ID-GadisNeural` perempuan).
  Workflow membuat suara per baris, menyesuaikan timeline/subtitle/musik dengan durasi suara asli, menyimpannya ke repo, lalu merender versi **dengan narasi** dan **tanpa narasi**.
- Setelah suara jadi, disarankan **Cek pengucapan narasi (Whisper)**.
- Unduh artefak di halaman run (iPad: tekan lama nama artefak → *Unduh Tautan Tertaut*).

Baris yang teksnya diubah: hapus `public/voiceover/<kode>.mp3` agar dibuat ulang (workflow hanya membuat baris yang belum ada). Rekaman suara sendiri: simpan per baris dengan kode di `naskah/NASKAH_VOICEOVER.md`, lalu `npm run voiceover -- --measure`.

## Menjalankan sendiri

```bash
npm ci
npm run dev                # Remotion Studio: "FluidaDinamis", "FluidaDinamis2K", atau folder "Adegan"
npm run timeline           # perbarui naskah VO, SRT, BAB_YOUTUBE, peta musik
npm run music              # sintesis ulang musik (python3 + numpy + ffmpeg)
npm run lint               # cek tipe TypeScript
```

## Struktur

```
src/script.ts           naskah per adegan (teks, kata kunci, jeda, ejaan TTS opsional)
src/tts.ts              teks ramah-TTS (ejaan huruf & simbol)
src/timeline.ts         waktu baris & kata (estimasi suku kata, atau durasi rekaman asli)
src/components/         latar cetak biru, subtitle, heading bab, primitif rumus, komponen fisika (batang energi, pegas, balok, grafik) + fluida (air bergelombang, tangki, panah tekanan, gelembung)
src/scenes/             23 adegan
scripts/                voice-over (ElevenLabs/Edge), musik orisinal (numpy), cek pengucapan, render potongan & gabung, QA still
```
