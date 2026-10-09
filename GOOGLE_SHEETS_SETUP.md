# Google Sheet → GitHub

## Cara mengisi

1. **kegiatan**: tanggal, jenis kegiatan, kampung, jumlah sesi, peserta, bukti.
2. **penerima_manfaat**: tanggal, kampung, kategori, kelompok, umur, jenis kelamin, capaian, bukti.
3. **dokumentasi**: tanggal, lokasi, judul, deskripsi, caption dan izin.

Periode, minggu, kabupaten dan output dihitung otomatis pada baris 6–305.
Kolom tambahan dan referensi disembunyikan; dapat dibuka lagi lewat menu Sheet.
Jumlah peserta kegiatan tidak otomatis menjadi penerima manfaat unik.
MEAL memilih VERIFIED setelah memeriksa bukti. Jangan mengisi angka contoh.
Tab target, indikator dan info dikelola MEAL. Baris pertama data tetap baris 6.

## Aktifkan sekali oleh admin

1. Gabungkan perubahan integrasi ini ke branch **main**.
2. Di [Google Cloud Console](https://console.cloud.google.com/), pilih proyek organisasi, aktifkan **Google Sheets API**, buat **service account**, dan buat kunci JSON.
3. Bagikan [Sheet PASTI Papua](https://docs.google.com/spreadsheets/d/15XkCUaZngioZcL_RsgI6_V_Oj_6f7gII8nzqMDWvz2k/edit) ke email service account sebagai **Viewer**. Sheet tidak perlu dipublikasikan.
4. Di GitHub → Settings → Secrets and variables → Actions → New repository secret, gunakan nama **GOOGLE_SHEETS_SERVICE_ACCOUNT**, lalu tempel isi JSON. Jangan unggah JSON ke repository atau chat.
5. Buka Actions → **Sinkronisasi Google Sheet** → Run workflow. Pastikan sukses dan folder data terisi. Jika branch main dilindungi, admin perlu mengizinkan bot sinkronisasi menulis sesuai aturan organisasi.
6. Untuk dashboard online, pilih Settings → Pages → Source → **GitHub Actions**. Workflow publikasi berjalan setelah sinkronisasi sukses, termasuk commit dari bot.

Setelah aktif, GitHub mengecek sekitar setiap 30 menit; jadwal bisa terlambat mengikuti antrean GitHub Actions. Ini sinkronisasi satu arah, bukan setiap ketikan secara langsung. Buka ulang dashboard untuk mengambil versi terbaru.
Jadwal hanya berjalan di default branch. GitHub dapat menonaktifkan jadwal repository publik yang lama tidak aktif; periksa Actions jika pembaruan berhenti.

## Data yang dikirim

Hanya baris VERIFIED di penerima_manfaat, target, kegiatan dan indikator.
Dokumentasi juga harus berizin YA. Ekspor memakai daftar kolom publik yang eksplisit.
Nama petugas, PIC, MoV, catatan internal, dan seluruh URL foto Drive tidak diekspor.
Teks judul, deskripsi dan caption VERIFIED/YA harus sudah ditinjau untuk publikasi.
Info hanya memuat periode_terbit, diperbarui, tahun dan nama_program.
Data publik disimpan sebagai enam CSV di data/ dan lima CSV inti dibaca otomatis oleh dashboard.
Dokumentasi.csv dibaca dashboard sebagai cerita dan caption terverifikasi; foto Drive tetap privat.
Tidak ada salinan mentah Sheet di repository.

Jika akses gagal atau schema berubah, proses berhenti dan data terakhir tetap dipakai.
Jika tidak ada capaian VERIFIED, dashboard menampilkan data kosong, bukan angka contoh.
Data yang sudah masuk riwayat GitHub tetap ada walaupun status di Sheet kemudian berubah.

## Hasil audit

- 13 tab; kegiatan 19 kolom, penerima_manfaat 16, dokumentasi 17.
- Input kegiatan dan penerima manfaat masih kosong saat audit; target dan indikator belum disetujui.
- Baris 1–4 berupa panduan, baris 5 header: tidak kompatibel dengan impor CSV langsung yang menganggap baris 1 header.
- Periode, minggu, kabupaten dan output sebelumnya diisi ulang manual; kini otomatis.
- Rekap dan pemeriksaan awal menggunakan 300 baris input: baris 6–305. Perlu memperluas formula dan rekap bersama jika kapasitas ditambah.
- Referensi menyebut perbedaan akhir program 2026 vs Oktober 2027; perlu keputusan MEAL sebelum rilis.

Referensi: [Google Sheets API](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet), [jadwal GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
