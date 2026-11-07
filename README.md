# PASTI-Papua · Weekly Update PTFI

Laporan mingguan PASTI-Papua untuk PT Freeport Indonesia. Isinya kegiatan minggu ini, highlight otomatis per wilayah program dan per kabupaten, partisipan (BTT), dan capaian indikator output (MTT) di Mimika, Nabire, dan Asmat.

Setup pertama kali: lihat **[PANDUAN_SETUP.md](PANDUAN_SETUP.md)**.

## Isi laporan

| Bagian | Sumber |
|---|---|
| Sampul | minggu laporan (Senin–Minggu) |
| 1 · Ringkasan | KPI minggu ini, highlight (ringkasan semua kegiatan, per jenis kegiatan, hasil menonjol), tabel hasil kegiatan dengan Total/L/P, highlight per kabupaten |
| 2 · Kegiatan | Weekly Update, tab Mimika, Nabire, Asmat: progres, peserta per kabupaten, daftar kegiatan dan hasil per kabupaten, agenda minggu berikutnya |
| 3 · Dokumentasi | Folder Google Drive mingguan (tab Dokumentasi di Weekly Update), tampil dan bisa digeser di dalam laporan |
| 4 · Partisipan | BTT Rekap, tab Database (agregat, filter periode/wilayah/jenis kelamin/usia) dan tab Dashboard |
| 5 · Capaian indikator | MTT_PASTI_Papua_Y26, tab MTT_Y26_Long (YTD) |
| Penutup | |

Highlight disusun dari angka dengan aturan tetap, tanpa teks manual. Saat data baru masuk ke sheet, highlight ikut berubah pada sinkron berikutnya.

## Alur data

```
Google Sheets ──(GitHub Actions, ±30 menit)──► scripts/sync_weekly.py ──► data/weekly-update.enc.json ──► GitHub Pages
                                                  agregat + enkripsi                 dibuka di browser dengan kode akses
```

ID file sheet dan kode akses disimpan sebagai GitHub Secrets. Kolom PIC, tujuan, kendala, link Drive, dan data per orang tidak pernah dipublikasikan.

## Struktur berkas

- `index.html` adalah kerangka halaman dan formulir kode akses.
- `assets/dashboard.css` adalah PASTI-Papua Dashboard Design System, disalin utuh. `assets/weekly.css` berisi komponen tambahan.
- `assets/logic.js` memuat perhitungan minggu, status, agregasi, highlight, dan dekripsi. Tidak bergantung pada DOM, jadi bisa diuji.
- `assets/app.js` membangun tampilan, grafik SVG, mode presentasi, dan cetak.
- `assets/logo-wvi.png` (diunggah terpisah) adalah logo Wahana Visi Indonesia.
- `scripts/sync_weekly.py` membaca sheet dan menulis data terenkripsi.
- `.github/workflows/weekly-update.yml` menjalankan sinkron, uji, dan publikasi.
- `tests/` berisi uji Python (pembacaan sheet, filter privasi, enkripsi) dan uji Node (logika dan dekripsi).

## Perintah

```sh
npm run dev      # pratinjau lokal di http://127.0.0.1:3000
npm test         # uji logika dan dekripsi
npm run build    # salin situs ke dist/
python -m unittest discover -s tests -p 'test_sync_weekly.py'
```

Halaman harus dibuka lewat server (GitHub Pages atau `npm run dev`). Kalau `index.html` dibuka langsung dari file, data tidak bisa dimuat.

## Batasan

- Kode akses melindungi isi data, tetapi kode HTML dan JavaScript tetap publik.
- Angka BTT mengikuti filter yang sedang aktif di tab Dashboard BTT Rekap (ditampilkan sebagai "Cakupan").
- MTT tidak memuat capaian per kabupaten, jadi capaian indikator ditampilkan untuk tingkat proyek.
