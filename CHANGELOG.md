# Perbaikan UI/UX · 9 Oktober 2026

- Grid Ringkasan diperbaiki: empat KPI sejajar; card cakupan wilayah dan kelompok usia berada dalam baris yang jelas; grafik dan sorotan memiliki area tersendiri.
- Menghapus skala paksa 1280×720 pada layar. Halaman mengikuti lebar viewport dan panjang konten.
- Filter dipindah ke baris terpisah, dengan ukuran kontrol dan jarak konsisten.
- Label proporsi, capaian target, periode, dan data contoh diperjelas.
- Tampilan card, border, tipografi, tabel, dan progress bar distandardisasi pada semua halaman.
- Kelompok usia menampilkan label penuh dan pemisahan P/L tanpa angka saling bertumpuk.
- Ukuran grafik diperjelas; panel komposisi jenis kelamin dan tabel demografi ditata ulang.
- Tata letak ponsel menggunakan grid responsif dan tabel dapat digeser dengan petunjuk.
- Ringkasan dibuka langsung setelah memasukkan PTFI2026. Cover tetap dapat dibuka dari sidebar.
- Filter minggu dibatasi pada bulan yang dipilih; hash halaman tidak valid ditangani.
- Link sumber CSV dimuat kembali saat dashboard dibuka.
- Source dipisahkan menjadi HTML/CSS/JavaScript dan scaffold React kosong dihapus dari paket akhir.
- Ditambahkan skrip preview/build, pemeriksaan data, contoh CSV, dan workflow GitHub Pages.

Nilai data contoh utama dari proyek asal dipertahankan: 4.367 terjangkau, target 6.420, dan 263 kegiatan.

## Revisi ikon dan navigasi

- Semua emoji dekoratif diganti atau dihapus. Ikon navigasi, cover, toolbar, dan tombol memakai SVG garis yang konsisten dengan stroke 1,8 serta warna hitam/putih.
- Slide 03 Capaian indikator dihapus sepenuhnya dari renderer dan navigasi. Delapan slide tersisa mempertahankan nomor asli; link ke slide 03 diarahkan ke Ringkasan.
- Slide 09 diganti nama menjadi Dokumentasi.
- Baseline judul dan angka KPI diperjelas; judul serta area grafik Ringkasan dibuat konsisten.
