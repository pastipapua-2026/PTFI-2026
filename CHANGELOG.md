# Perubahan

## 2.0.0 · 7 November 2026 · Weekly Update PTFI

- Dashboard 8 slide (data contoh, belum tersambung) diganti menjadi laporan mingguan **"PASTI-Papua · Weekly Update PTFI"**: Sampul, Ringkasan, Kegiatan, Partisipan, Capaian indikator, dan Penutup.
- Tersambung ke tiga Google Sheets: Weekly_Update_PASTI-Papua, BTT_Rekap_PASTI_Papua (tab Dashboard), dan MTT_PASTI_Papua_Y26 (tab MTT_Y26_Long). Sinkron berjalan lewat GitHub Actions kira-kira tiap 30 menit.
- Highlight otomatis untuk seluruh wilayah program dan per kabupaten.
- Data yang dipublikasikan dienkripsi dengan kode akses. Hash kode akses di JavaScript dihapus.
- Kolom PIC, tujuan, kendala, link Drive, dan data per orang BTT tidak dipublikasikan.
- Desain mengikuti PASTI-Papua Dashboard Design System: tema terang dan gelap, mode presentasi, cetak, dan tampilan mobile 390px.
- Snapshot awal diambil dari tab Dashboard ketiga sheet (Weekly per 6 Nov 2026, BTT cakupan Tahun 2026, MTT s.d. November). Semua total sudah dicocokkan dengan baris Total di sheet.
- Uji: 11 uji Python (pembacaan sheet, filter privasi, enkripsi) dan 7 uji Node (minggu, status, agregasi, highlight, dekripsi).

## 1.x · Oktober 2026

Dashboard donor 8 slide berbasis CSV (lihat riwayat commit).
