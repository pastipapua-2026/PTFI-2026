# PTFI-2026 — Patch V3: Dropdown & Perapian Halaman

**Repository:** https://github.com/pastipapua-2026/PTFI-2026  
**Basis yang diperiksa:** `main` commit `cd717b8` (9 Oktober 2026).  
**Jenis perubahan:** hanya tampilan/UX dan perilaku dropdown; **data pelaporan, kode autentikasi, dan perhitungan tidak diubah**.

## File yang perlu diunggah

Ekstrak ZIP, lalu unggah ke repository dengan **path persis berikut**:

| File | Aksi |
|---|---|
| `index.html` | **Replace** file di root repository |
| `assets/donor-filters.js` | **Replace** versi lama untuk memperbaiki status dropdown |
| `assets/donor-layout-v3.css` | **Add** file baru |
| `assets/donor-layout-v3.js` | **Add** file baru |

File lain **jangan dihapus atau diganti** (`dashboard.js`, `donor-upgrade.js`, `donor-activity.js`, `donor-fixes.css`, template, dan lainnya).

Urutan file pada `index.html` sudah disiapkan: dashboard utama → donor-upgrade → donor-filters V3 → donor-activity V2 → donor-layout V3. Query `?v=3` ditambahkan ke asset baru/yang diganti agar tidak menggunakan cache lama.

## Rincian perubahan

### Filter Global — Fixed

- Dropdown kategori, kabupaten, jenis kelamin, minggu, dan kampung tidak lagi muncul kembali saat berganti halaman.
- Setelah checkbox berubah, dropdown **tetap terbuka selama pengguna sedang memilih** agar multi-select nyaman. Tutup dengan klik label field, tombol **Selesai / Done**, atau klik di luar dropdown.
- Dropdown akan otomatis tertutup jika pindah halaman, tetapi seluruh pilihan filter tetap tersimpan. Pemilihan ganda, tanggal cutoff, filter kampung halaman 04–07, dan sticky toolbar tetap seperti sebelumnya.

### Slide 02 — Ringkasan

- Hapus panel **Capaian terhadap Target Tahunan** (`gauge`).
- Hapus panel **Sorotan Capaian** (`highlights`).
- Perlebar card **Tren Kumulatif Bulanan** dari dua menjadi tiga kolom dan tinggikan grafik untuk memanfaatkan ruang. Panel **Per Kabupaten** dan KPI lainnya tetap ada.

### Slide 05 — Kelompok Sasaran

- Hapus card **Sasaran Kunci Intervensi Stunting & 1.000 HPK** beserta empat subcard.
- Perluas area **Matriks Capaian per Kelompok Sasaran**; informasi kategori dan stakeholder tetap dipertahankan.

### Slide 08 — Tren Bulanan

- Hapus grafik kecil **Penerima Manfaat Baru per Bulan** beserta box analisis di bawahnya.
- Perluas **tabel asli** `Tabel Bulanan` menjadi satu card penuh, dengan judul **Penerima Manfaat Baru per Bulan / New Beneficiaries by Month**. Kolom bulan, kategori, baru, kumulatif, dan % target tetap menggunakan perhitungan sumber data lama.

## Pengujian setelah upload

1. Buka halaman 01; klik Kategori. Pilih `Anak`, lalu klik **Selesai**. Pindah ke 02/05/08; dropdown **harus tertutup**, namun filter `Anak` tetap dipakai.
2. Ulangi dengan dua kategori, lalu klik di luar dropdown dan pindah halaman. Pilihan tidak boleh hilang dan dropdown tidak boleh muncul lagi.
3. Pada slide 02, pastikan hanya grafik tren yang melebar, tanpa gauge maupun Sorotan Capaian.
4. Pada slide 05, pastikan panel ⭐ sudah hilang dan matriks target lebih luas.
5. Pada slide 08, pastikan grafik sudah diganti tabel lebar dan angka bulanan tidak berubah.
6. Uji mode **ID/EN**, **gelap/terang**, tampilan ponsel, serta **Print PDF** (halaman tunggal dan semua halaman).

**Cara refresh:** tunggu sampai GitHub Pages workflow berstatus `Success`, lalu *hard refresh* (`Ctrl/Cmd + Shift + R`) pada dashboard.

## Batasan

Patch ini tidak memperbaiki keterbatasan sumber data donor di luar perubahan layout, dan tidak menambah angka apa pun. Data contoh wajib diganti dan divalidasi sebelum laporan resmi. Uji sintaks JavaScript serta uji fungsi DOM sintetis dilakukan secara lokal; perilaku di situs GitHub Pages produksi dan kualitas cetak PDF perlu diperiksa setelah commit.
