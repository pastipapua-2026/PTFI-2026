import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("sync", Path(__file__).parents[1] / "scripts/sync_sheets.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class PublicationTests(unittest.TestCase):
    def raw(self):
        raw = {n: [fields + (["status_verifikasi"] if n != "info" else []) + (["izin_publikasi"] if n == "dokumentasi" else [])] for n, fields in sync.SCHEMA.items()}
        raw["info"] += [["periode_terbit", "2026-09"], ["tahun", 2026], ["secret", "internal"]]
        return raw

    def test_internal_fields_and_drafts_are_excluded(self):
        raw = self.raw()
        raw["target"][0] += ["mov_url", "pic", "catatan"]
        raw["target"] += [[2026, "Mimika", "Anak", "Balita", "P", 50, "VERIFIED", "private-link", "private-name", "private-note"],
                          [2026, "Mimika", "Anak", "Balita", "L", 99, "DRAFT"]]
        exports = sync.make_exports(raw)
        self.assertIn("50", exports["target.csv"])
        for secret in ["99", "private-link", "private-name", "private-note", "status_verifikasi"]:
            self.assertNotIn(secret, exports["target.csv"])
        self.assertNotIn("internal", exports["info.csv"])

    def test_documentation_requires_permission_and_omits_photo_url(self):
        row = dict.fromkeys(sync.SCHEMA["dokumentasi"], "")
        row.update(status_verifikasi="VERIFIED", izin_publikasi="TIDAK", foto_drive_url="private-photo", tanggal="2026-09-01", kabupaten="Mimika", kampung="Atuka", judul_id="Judul")
        self.assertIsNone(sync.safe_row("dokumentasi", row))
        row["izin_publikasi"] = "YA"
        self.assertEqual(sync.safe_row("dokumentasi", row)["foto_drive_url"], "")

    def test_empty_approved_data_keeps_headers(self):
        exports = sync.make_exports(self.raw())
        self.assertEqual(len(exports["penerima_manfaat.csv"].splitlines()), 1)

    def test_missing_status_fails_closed(self):
        raw = self.raw()
        raw["target"][0].remove("status_verifikasi")
        with self.assertRaises(ValueError):
            sync.make_exports(raw)

    def test_invalid_number_fails_without_leaking_value(self):
        row = dict.fromkeys(sync.SCHEMA["target"], "")
        row.update(status_verifikasi="VERIFIED", target="private-invalid")
        row.update(tahun=2026, kabupaten="Mimika", kategori="Anak", kelompok="Balita", jenis_kelamin="P")
        with self.assertRaisesRegex(ValueError, "^target: invalid numeric field$"):
            sync.safe_row("target", row)

    def test_sheet_date_serial_and_period(self):
        row = dict.fromkeys(sync.SCHEMA["kegiatan"], "")
        row.update(status_verifikasi="VERIFIED", tanggal=(sync.date(2026, 9, 12) - sync.date(1899, 12, 30)).days, periode="2026-09", minggu=2, kabupaten="Mimika", kampung="Atuka", output="1.1", jenis_kegiatan="Pelatihan KAP", jumlah_kegiatan=1)
        self.assertEqual(sync.safe_row("kegiatan", row)["tanggal"], "2026-09-12")
        row["periode"] = "2026-08"
        with self.assertRaises(ValueError):
            sync.safe_row("kegiatan", row)


if __name__ == "__main__":
    unittest.main()
