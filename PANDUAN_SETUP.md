# Panduan setup · Weekly Update PTFI

Lakukan sekali. Setelah itu laporan memperbarui diri sendiri sekitar tiap 30 menit dari Google Sheets.

## 1. Hapus file versi lama di repository

Versi ini menggantikan dashboard 8 slide. Hapus file dan folder lama berikut di repository `PTFI-2026`. Versi lama tetap tersimpan di riwayat commit.

**Wajib dihapus** (kalau tertinggal, workflow lama ikut berjalan dan bentrok saat publikasi):

- `.github/workflows/deploy.yml`
- `.github/workflows/sync-sheets.yml`

**Sebaiknya dihapus** (tidak dipakai lagi):

- `assets/dashboard.js`, `assets/donor-*.js`, `assets/donor-*.css`
- `data/*.csv`, folder `data-templates/`
- `scripts/sync_sheets.py`, `tests/test_sync_sheets.py`
- `GOOGLE_SHEETS_SETUP.md`, `UPLOAD_GUIDE*.md`, `VALIDATION.md`, `package-lock.json`

Di GitHub web, buka file, lalu ikon titik tiga → **Delete file**. Untuk folder, buka foldernya lalu titik tiga → **Delete directory**.

## 2. Unggah isi ZIP

1. Ekstrak ZIP, lalu buka folder `PTFI-2026` di File Explorer.
2. Di GitHub buka **Add file → Upload files**.
3. **Seret (drag) folder dan file sekaligus** dari File Explorer ke halaman upload: folder `assets`, `data`, `scripts`, `tests`, `.github`, dan semua file di luar folder.
4. Jangan pakai tombol **"choose your files"**. Tombol itu hanya bisa memilih file, sehingga isi folder tidak ikut ter-upload.
5. Commit ke branch `main`.

Setelah commit, cek di halaman repository:

| Folder | Harus berisi |
|---|---|
| `assets/` | `app.js`, `logic.js`, `weekly.css`, `dashboard.css`, `favicon.svg` |
| `data/` | `weekly-update.enc.json` |
| `.github/workflows/` | `weekly-update.yml` saja (dua workflow lama sudah dihapus) |

Kalau folder `assets` belum lengkap, halaman kode akses akan menampilkan pesan merah yang menyebut berkas yang hilang.

Kalau folder `.github` tidak ikut, buat filenya lewat **Add file → Create new file**. Beri nama `.github/workflows/weekly-update.yml`, lalu tempel isi file yang sama dari ZIP.

## 3. Aktifkan GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

Kalau Source masih **Deploy from a branch**, ganti ke **GitHub Actions**. Kalau tidak, langkah publikasi di workflow baru akan gagal.

## 4. Isi secrets

Buka **Settings → Secrets and variables → Actions → New repository secret**, lalu buat empat secret berikut:

| Nama secret | Isi |
|---|---|
| `SHEET_WEEKLY_ID` | ID file Weekly_Update_PASTI-Papua |
| `SHEET_BTT_ID` | ID file BTT_Rekap_PASTI_Papua |
| `SHEET_MTT_ID` | ID file MTT_PASTI_Papua_Y26 |
| `DASHBOARD_ACCESS_CODE` | Kode akses baru untuk PTFI, minimal 10 karakter |

ID file adalah bagian link di antara `/d/` dan `/edit`. Jangan tulis ID file atau kode akses di file mana pun di repository, karena repository ini bisa dilihat publik.

Secret opsional `GOOGLE_SHEETS_SERVICE_ACCOUNT` berisi kunci JSON service account. Kalau secret ini diisi, file sheet boleh dibatasi ke akun tim dan cukup dibagikan ke email service account sebagai **Viewer**. Kalau tidak diisi, ketiga file harus dibagikan **"Siapa saja yang memiliki link · Viewer"**.

## 5. Jalankan pertama kali

Buka **Actions → Weekly Update · sinkron dan publikasi → Run workflow**.

- Langkah **Ambil data Google Sheets** harus menampilkan `Data diperbarui: … kegiatan, … partisipan unik BTT, …`.
- Langkah **deploy** menampilkan link situs.

Buka situs, lalu masuk dengan kode akses baru. Sebelum langkah ini selesai, situs menampilkan snapshot 7 Nov 2026 yang masih memakai kode lama.

## 6. Siapkan Google Sheet Weekly Update (sekali)

**Cara laporan membaca Weekly Update.** File diunduh sebagai .xlsx (ekspor Google Sheets), jadi tanggal yang diketik sebagai teks seperti "14/11/2026" tetap terbaca. Pastikan pengaturan berbagi file **tidak** mematikan "Viewer dapat mengunduh".

**Jumlah peserta disaring dari Hasil Kegiatan.** Tim cukup menulis seperti biasa, misalnya "29 peserta hadir (L:1, P:28)", "Baduta :13 orang L:10 P:3", "Pria : 58 orang Wanita: 22 orang", atau daftar "Bayi laki-laki: 14 … Total hadir: 81 orang". Ibu hamil, ibu nifas, dan ibu menyusui dihitung perempuan. Bila total tidak sama dengan laki-laki + perempuan, laporan memberi tanda "cek angka".

**a. Kolom jumlah peserta.** Di akhir tab **Mimika**, **Nabire**, dan **Asmat** (setelah kolom terakhir yang ada), tambahkan tiga kolom dengan judul di baris header yang sama dengan "Nama Kegiatan":

| Peserta Laki-laki | Peserta Perempuan | Total Peserta |
|---|---|---|

- Isi angka untuk setiap kegiatan yang sudah dilaksanakan. Total boleh dikosongkan; laporan menjumlahkan laki-laki + perempuan.
- Kolom ditambahkan di akhir supaya rumus dan IMPORTRANGE yang sudah ada tidak bergeser.
- Bila kolom ini kosong, laporan mencoba membaca angka yang ditulis jelas di **Hasil Kegiatan** (misalnya "Laki-laki: 4, Perempuan: 2"). Angka seperti ini diberi tanda **"dari teks"**. Angka resmi tetap sebaiknya diisi di kolom.

**b. Tab Dokumentasi.** Buat tab baru bernama persis **Dokumentasi** dengan header di baris 1:

| Minggu (Senin) | Link folder Drive | Keterangan |
|---|---|---|
| 02/11/2026 | https://drive.google.com/drive/folders/… | Week 1 November |

- Tambahkan **satu baris setiap minggu** (jangan menimpa baris lama), supaya minggu-minggu sebelumnya tetap punya folder masing-masing.
- Tanggal boleh tanggal mana saja di minggu itu; laporan menyesuaikan ke hari Senin.
- Tempel link sebagai **teks biasa**, bukan chip/kartu Drive.
- Folder perlu dibagikan **"Siapa saja yang memiliki link · Viewer"** agar isinya tampil untuk PTFI. Pastikan foto di folder sudah sesuai persetujuan dokumentasi dan kebijakan perlindungan anak.

## 7. BTT Rekap: filter bulan, wilayah, jenis kelamin, dan usia

Filter di bagian Partisipan dihitung dari tab **Database** BTT Rekap (tata letak template: judul kolom di baris 14, zona Nabire/Mimika/Asmat). Yang dipublikasikan hanya jumlah per periode × wilayah × jenis kelamin × kelompok usia; ID partisipan tidak disimpan.

- Jangan mengubah urutan atau judul kolom di baris 14 tab Database.
- Bila tab Database belum terbaca, laporan tetap jalan memakai tab Dashboard; filter jenis kelamin dan usia dinonaktifkan dan alasannya tampil di Catatan data BTT.
- Hasil hitung "Tahun 2026" dicocokkan otomatis dengan kartu Partisipan unik di tab Dashboard. Bila berbeda, Catatan data BTT menyebutkannya.

## 8. Logo Wahana Visi Indonesia

Unggah file logo resmi ke folder `assets` dengan nama persis **`logo-wvi.png`** (PNG latar transparan, tinggi minimal 120 px). Logo tampil di halaman kode akses, header, sampul, dan penutup. Selama file belum ada, posisi logo menampilkan tulisan "Wahana Visi Indonesia".

## Cara kerja

Data hanya mengalir satu arah, dari sheet ke laporan:

- **Weekly Update**, tab Mimika, Nabire, dan Asmat: kegiatan, tanggal, status, hasil kegiatan, dan jumlah peserta (laki-laki, perempuan, total). Tab Dokumentasi: link folder Drive per minggu.
- **BTT Rekap**, tab Dashboard: angka agregat partisipan. Tab Database (data per orang) tidak dibaca.
- **MTT_Y26**, tab MTT_Y26_Long: target dan capaian YTD per indikator per bulan.

Yang **tidak pernah** dipublikasikan: kolom PIC, tujuan, kendala/tindak lanjut, link Drive per kegiatan, dan data per orang. Link folder dokumentasi mingguan hanya disimpan di dalam data terenkripsi.

Data yang terpublikasi disimpan terenkripsi (AES-256-GCM) di `data/weekly-update.enc.json`. Isinya hanya bisa dibuka dengan kode akses.

Kalau sinkron gagal (sheet tidak bisa dibaca atau struktur kolom berubah), laporan tetap memakai data terakhir dan workflow ditandai merah di tab Actions. Pesan errornya menyebut tab dan kolom yang bermasalah.

## Catatan untuk tim pengisi Weekly Update

- **Tanggal Mulai wajib diisi.** Kegiatan tanpa tanggal tidak masuk minggu mana pun.
- **Status dipilih dari daftar:** Rencana, Sedang Diimplementasikan, Selesai, Pending, atau Batal.
- **Kolom Hasil Kegiatan tampil di laporan PTFI** dan kalimat pertamanya dipakai untuk highlight. Awali dengan hasil terpenting, tulis ringkas, tanpa nama penerima manfaat atau anak.
- **Isi jumlah peserta** (laki-laki dan perempuan) untuk setiap kegiatan yang selesai.
- **Nama kolom header jangan diubah.** Kolom dikenali dari namanya, jadi menambah kolom baru tidak apa-apa.

## Mengganti kode akses

Ubah secret `DASHBOARD_ACCESS_CODE`, lalu jalankan workflow secara manual. Data dienkripsi ulang dengan kode baru. Setelah itu, kirim kode baru ke PTFI lewat jalur terpisah dari link laporan.
