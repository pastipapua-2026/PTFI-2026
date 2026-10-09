# PASTI-Papua · Dashboard PTFI

Dashboard capaian program PASTI-Papua untuk PT Freeport Indonesia dan Wahana Visi Indonesia, meliputi Mimika, Nabire, dan Asmat.

Navigasi memuat delapan slide: 01, 02, 04, 05, 06, 07, 08, dan 09. Slide 03 Capaian indikator sudah dihapus. Slide 09 bernama **Dokumentasi**. Nomor slide asli dipertahankan agar referensi tetap konsisten.

Kode akses: **PTFI2026**. Setelah masuk, dashboard membuka **Ringkasan**. Cover proyek tersedia melalui menu sidebar.

## Unggah ke GitHub

1. Buat atau buka repositori tujuan.
2. Unggah **isi folder ini** ke root repositori, termasuk `assets/`, `scripts/`, `tests/`, dan `.github/workflows/deploy.yml`. Jangan unggah ZIP sebagai satu file.
3. Gunakan branch `main`. Bila branch berbeda, ubah `branches: [main]` pada workflow.
4. Buka **Settings → Pages → Source → GitHub Actions**.
5. Workflow **Deploy dashboard to GitHub Pages** akan melakukan pemeriksaan, build, dan publikasi. Jalankan manual melalui **Actions → Run workflow** jika konfigurasi Pages baru diaktifkan setelah commit.
6. Buka URL deployment yang ditampilkan di hasil workflow.

Untuk unggah melalui antarmuka GitHub, file tersembunyi seperti `.github/` bisa tidak ikut terpilih. Alternatif tanpa workflow: unggah `index.html`, seluruh folder `assets/`, dan `.nojekyll`, lalu pilih **Deploy from a branch → main → / (root)** di Settings → Pages. Semua path aset relatif sehingga bekerja pada URL repositori GitHub Pages.

## Preview lokal

Gunakan Node.js 20 atau lebih baru, lalu jalankan dari folder proyek:

```sh
npm ci
npm run dev
```

Buka `http://127.0.0.1:3000`. Tidak ada dependency npm tambahan. Alternatif dengan Python: `python3 -m http.server 3000`.

```sh
npm run check
npm test
npm run build
npm run preview
```

Build menghasilkan `dist/` berisi berkas situs yang dapat diunggah ke static hosting. Untuk penggunaan langsung, root proyek juga sudah bisa disajikan tanpa build. Gunakan localhost atau HTTPS agar Web Crypto tersedia untuk kode akses.

## Struktur berkas

- `index.html`: shell aplikasi, formulir akses, sidebar, dan cover.
- `assets/dashboard.css`: desain, grid responsif, tema gelap, dan tata letak cetak.
- `assets/dashboard.js`: data, filter, delapan slide, grafik SVG, peta, serta impor CSV/Excel.
- `data-templates/`: lima contoh CSV berisi header dan beberapa baris dummy. Ganti baris contoh sebelum dipakai untuk laporan.
- `scripts/`: preview lokal dan build tanpa framework.
- `tests/dashboard.test.mjs`: pemeriksaan kode akses, konsistensi total, filter, dan parsing halaman.
- `.github/workflows/deploy.yml`: publikasi ke GitHub Pages.
- `CHANGELOG.md`: ringkasan perbaikan.

## Menghubungkan data

Integrasi khusus Sheet PASTI Papua kini disiapkan: data VERIFIED disalin ke GitHub sekitar setiap 30 menit dan dibaca otomatis oleh dashboard. Aktifkan akses baca sekali mengikuti [panduan singkat](GOOGLE_SHEETS_SETUP.md). Nama petugas, bukti internal dan URL foto Drive tidak diekspor. Teks dokumentasi hanya dipublikasikan jika VERIFIED dan izin YA.

Sinkronisasi belum aktif sebelum akses Google dikonfigurasi dan perubahan integrasi digabungkan ke main.

Klik **⚙ Sumber data** di header. Tersedia:

1. **Excel** dengan lima sheet: `penerima_manfaat`, `target`, `kegiatan`, `indikator`, `info`.
2. **Lima URL CSV** yang dapat diakses browser, masing-masing sesuai nama di atas. Pastikan sumber mengizinkan akses lintas origin (CORS).
3. **CSV tunggal** hanya untuk `penerima_manfaat`. Untuk target, kegiatan, dan indikator lengkap, gunakan workbook Excel atau lima URL CSV.

`data-templates/` menyediakan skema kolom. Untuk Google Sheets, publikasi CSV harus mengikuti kebijakan berbagi data organisasi. Jangan mempublikasikan data pribadi penerima manfaat. Dashboard ini menggunakan angka agregat.

Setelah koneksi berhasil, tombol **Salin link dashboard** menyimpan URL CSV dalam parameter `pm`, `tg`, `kg`, `id`, `in`. Saat link dibuka kembali dan kode akses dimasukkan, dashboard memuat URL tersebut. Jika koneksi gagal, dashboard menampilkan pesan dan tetap memberi label **DATA CONTOH** pada data fallback. Upload workbook lokal perlu diulang setelah halaman dimuat ulang.

## Membaca dashboard

- Angka besar = capaian; angka setelah `/` = target tahunan.
- Persentase di pojok card anak/perempuan/laki-laki = proporsi terhadap total terjangkau.
- Progress bar dan teks di bawahnya = capaian terhadap target kelompok tersebut.
- Periode **s.d.** menunjukkan kumulatif sejak awal tahun hingga bulan pilihan.
- Filter minggu mengambil satu minggu dalam bulan pilihan, bukan nomor minggu dari semua bulan.
- Angka kegiatan dipengaruhi filter kabupaten, periode, dan minggu. Kategori dan jenis kelamin hanya berlaku pada penerima manfaat serta target, karena tabel kegiatan tidak memiliki kedua dimensi tersebut.
- Pada ponsel, geser tabel ke samping untuk melihat semua kolom.
- Tombol cetak memuat semua halaman untuk ekspor PDF; layout menggunakan A3 landscape dan konten panjang dapat berlanjut ke lembar berikutnya.

Data awal, dokumentasi kegiatan, dan ilustrasi galeri adalah **contoh**, bukan laporan aktual yang telah diverifikasi. Koordinat dan peta ilustratif dari proyek asal tetap perlu diverifikasi oleh tim lapangan sebelum digunakan untuk keputusan geografis.

## Kode akses dan dependency

Hash `PTFI2026` tetap SHA-256 dan tersimpan dalam `ACCESS_HASH` di `assets/dashboard.js`. Kode dinormalisasi dengan trim dan huruf besar. Tiga percobaan salah memicu jeda 30 detik selama sesi halaman berjalan.

Kode akses ini adalah pembatas tampilan pada browser, bukan autentikasi server. Berkas situs statis dan data yang dipublikasikan tetap dapat diakses langsung. Untuk data internal sensitif, gunakan hosting dengan autentikasi organisasi dan sumber data privat.

Grafik SVG dan peta desain tidak membutuhkan library grafik eksternal. Google Fonts, SheetJS (impor Excel), dan MapLibre (peta GIS) dimuat dari CDN sehingga fitur tersebut membutuhkan internet. Tidak ada API key, secret, atau layanan AI yang diperlukan.
