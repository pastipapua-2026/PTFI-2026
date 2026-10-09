# PTFI-2026 · Patch V2 (9 Oktober 2026)

Repository: https://github.com/pastipapua-2026/PTFI-2026  
Dasar: commit `a4bb691` pada branch `main`.

## Perubahan

1. Dropdown checkbox pada global filter diperpadat: tidak ada jarak vertikal berlebih, tinggi daftar dibatasi, dan popup kampung otomatis menyesuaikan ruang desktop/ponsel. Tombol reset tetap berada pada toolbar.
2. Halaman **07 Kegiatan**: menghapus diagram **Per output / Pilar Output Program** dan panel detail berbasis indikator. Area utama diganti tabel lebar: **Kegiatan**, **Tanggal**, **Lokasi**, **Total Peserta**, **Anak L/P**, **Dewasa L/P**. Ada 10 baris per halaman tabel agar nyaman di layar dan tersedia navigasi sebelumnya/berikutnya.
3. Konten baru mendukung ID/EN, tema Light/Dark, filter yang sudah ada, dan cetak satu halaman/semua halaman. Untuk cetak, tabel menunjukkan **halaman tabel yang sedang terbuka**, bukan otomatis semua baris data.
4. Tidak menyusun angka peserta dari `jumlah_kegiatan` atau tabel `penerima_manfaat`. **Angka yang tidak tersedia ditampilkan sebagai `—` (N/A)**; nol hanya digunakan ketika sumber benar-benar berisi 0.

## Upload file — hanya tambahan V2

Ekstrak ZIP. Unggah berikut ini ke path yang sama persis dalam repository:

```text
index.html                                  # REPLACE file lama di root
assets/donor-fixes.css                      # NEW
assets/donor-activity.js                    # NEW
data-templates/kegiatan_detail_template.csv # NEW, opsional untuk panduan input
UPLOAD_GUIDE_V2.md                          # NEW, dokumentasi
```

Jangan menghapus atau mengganti `assets/dashboard.js`, `assets/dashboard.css`, `assets/donor-upgrade.js`, `assets/donor-upgrade.css`, `assets/donor-filters.js`, atau `assets/donor-filters.css`. `index.html` baru menambah referensi dua aset V2 **setelah** semua aset yang sudah ada.

Setelah commit ke `main`, periksa **Actions** sampai GitHub Pages berstatus **Success**, buka halaman publik, kemudian hard refresh atau gunakan private/incognito window untuk menghindari cache.

## Sumber data kegiatan (kolom baru, opsional namun dibutuhkan untuk tabel lengkap)

Tambahkan kolom berikut pada *sheet* / CSV `kegiatan`, **dengan nilai yang benar-benar tercatat**:

| Kolom | Makna |
| --- | --- |
| `periode` | Bulan pelaporan, contoh format `2026-09` |
| `tanggal` | Tanggal pelaksanaan dalam format `YYYY-MM-DD` |
| `minggu` | Minggu pelaksanaan dalam bulan, 1–5 |
| `kabupaten` | Kabupaten tempat kegiatan |
| `kampung` | Nama kampung/desa untuk filter tingkat kampung |
| `output` | Kode output kegiatan |
| `jenis_kegiatan` | Nama jenis kegiatan |
| `jumlah_kegiatan` | Jumlah sesi kegiatan (BUKAN jumlah peserta) |
| `total_peserta` | Jumlah peserta pada baris kegiatan tersebut |
| `anak_laki_laki` | Peserta anak laki-laki, usia <18 tahun |
| `anak_perempuan` | Peserta anak perempuan, usia <18 tahun |
| `dewasa_laki_laki` | Peserta dewasa laki-laki, usia ≥18 tahun |
| `dewasa_perempuan` | Peserta dewasa perempuan, usia ≥18 tahun |

Jika `total_peserta` kosong, total **hanya dihitung** ketika keempat angka segregasi tersedia. Jika total dan empat angka tersedia tetapi tidak cocok, tabel menampilkan pesan perlunya validasi.

**Perhatian:** satu baris kegiatan dengan `jumlah_kegiatan > 1` dapat merepresentasikan beberapa sesi. Kolom `tanggal` dan peserta harus sesuai granularity yang disepakati tim MEAL. Idealnya satu baris per pelaksanaan/sesi; jangan mengisi satu tanggal fiktif untuk seluruh bulan.

`data-templates/kegiatan_detail_template.csv` sengaja hanya memuat header, tanpa angka contoh atau data fiktif.

## Checklist verifikasi setelah upload

- Buka filter **Kampung** di halaman 04, 05, 06, 07; jarak checkbox rapat, dropdown tidak keluar layar, tetap bisa scroll.
- Buka halaman 07; grafik Per output hilang, tabel rincian lebar tersedia, dan judul/kolom berubah saat tombol ID/EN dipilih.
- Pilih filter kabupaten, bulan, minggu, dan kampung; cek baris sesuai sumber data kegiatan.
- Uji dataset dengan `total_peserta` terisi dan dataset tanpa kolom peserta: nilai kosong harus `—`, bukan `0`.
- Uji Light/Dark dan cetak satu/semua halaman, terutama halaman 07 pada A3 landscape.
- Validasi data peserta, jumlah kegiatan, dan perbedaan target tingkat kabupaten/kampung sebelum presentasi donor.

## Batas pengujian

Syntax JavaScript, alur perhitungan peserta kosong/nol/lengkap, dan pembangkitan header ID/EN telah diuji secara lokal dengan mock. Karena lingkungan pengujian tidak mengizinkan pembukaan halaman melalui browser otomatis, **hasil visual produksi / print final perlu diperiksa setelah commit**.
