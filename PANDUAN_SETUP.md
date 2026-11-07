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

Unggah **isi** folder `PTFI-2026` ke root repository, branch `main`. Jangan unggah file ZIP-nya.

Lewat **Add file → Upload files**, folder tersembunyi `.github` sering tidak ikut terpilih. Periksa setelah commit bahwa file `.github/workflows/weekly-update.yml` ada. Kalau belum ada, buat lewat **Add file → Create new file**, beri nama `.github/workflows/weekly-update.yml`, lalu tempel isinya.

## 3. Aktifkan GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

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

## Cara kerja

Data hanya mengalir satu arah, dari sheet ke laporan:

- **Weekly Update**, tab Mimika, Nabire, dan Asmat: kegiatan, tanggal, status, hasil, dan apakah link foto serta daftar hadir sudah terisi.
- **BTT Rekap**, tab Dashboard: angka agregat partisipan. Tab Database (data per orang) tidak dibaca.
- **MTT_Y26**, tab MTT_Y26_Long: target dan capaian YTD per indikator per bulan.

Yang **tidak pernah** dipublikasikan: kolom PIC, tujuan, kendala/tindak lanjut, link Drive, dan data per orang.

Data yang terpublikasi disimpan terenkripsi (AES-256-GCM) di `data/weekly-update.enc.json`. Isinya hanya bisa dibuka dengan kode akses.

Kalau sinkron gagal (sheet tidak bisa dibaca atau struktur kolom berubah), laporan tetap memakai data terakhir dan workflow ditandai merah di tab Actions. Pesan errornya menyebut tab dan kolom yang bermasalah.

## Catatan untuk tim pengisi Weekly Update

- **Tanggal Mulai wajib diisi.** Kegiatan tanpa tanggal tidak masuk minggu mana pun.
- **Status dipilih dari daftar:** Rencana, Sedang Diimplementasikan, Selesai, Pending, atau Batal.
- **Kolom Hasil Kegiatan tampil di laporan PTFI.** Tulis ringkas, tanpa nama penerima manfaat atau anak.
- **Nama kolom header jangan diubah.** Kolom dikenali dari namanya, jadi menambah kolom baru tidak apa-apa.

## Mengganti kode akses

Ubah secret `DASHBOARD_ACCESS_CODE`, lalu jalankan workflow secara manual. Data dienkripsi ulang dengan kode baru. Setelah itu, kirim kode baru ke PTFI lewat jalur terpisah dari link laporan.
