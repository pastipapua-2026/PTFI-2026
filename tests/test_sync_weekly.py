"""Uji sinkron Weekly Update dengan sheet tiruan (struktur sama dengan sheet asli, angka fiktif kecil)."""
import importlib.util
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location("sync", Path(__file__).parents[1] / "scripts" / "sync_weekly.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class FakeResponse:
    def __init__(self, values, status=200):
        self.status_code, self._v = status, values

    def json(self):
        return {"values": self._v}


class FakeSession:
    """Meniru Google Sheets API: grid berisi (nilai mentah, teks tampil)."""

    def __init__(self, tabs):
        self.tabs = tabs

    def get(self, url, params=None, timeout=None):
        tab = sync.urllib.parse.unquote(url.rsplit("/", 1)[1])
        if tab not in self.tabs:
            return FakeResponse([], 400)
        grid = self.tabs[tab]
        raw = params["valueRenderOption"] == "UNFORMATTED_VALUE"
        return FakeResponse([[(c[0] if raw else c[1]) if isinstance(c, tuple) else c for c in row] for row in grid])


def serial(y, m, d):
    return (sync.date(y, m, d) - sync.date(1899, 12, 30)).days


def D(y, m, d):
    return (serial(y, m, d), f"{d:02d}/{m:02d}/{y}")


WH = ["ID", "Nama Kegiatan", "Bulan", "Tanggal\nMulai", "Tanggal\nSelesai", "Tujuan Kegiatan", "PIC", "Kontribusi\nOutput",
      "Kabupaten", "Lokasi\n(Desa/Kelurahan)", "Dukungan", "Status", "Hasil Kegiatan", "Kendala / Tindak Lanjut",
      "Link Dokumentasi", "Link Daftar Hadir\nKegiatan", "Tgl\nUpdate", "Kelengkapan\nDokumen"]


def weekly_tab(kab, rows):
    head = [["Weekly Update · " + kab], ["PASTI-Papua"], [""], ["Dari Rencana Kerja", "", "", "", "", "", "", "", "", "", "", "Diisi tim"], WH]
    return head + rows


def act(i, kab, nama, day, status, hasil="", foto="", dh="", lokasi="Atuka", kab_col=None):
    return [f"{kab[:3].upper()}-{i:03d}", nama, "November 2026", D(2026, 11, day), D(2026, 11, day), "tujuan rahasia",
            "Nama PIC Rahasia", "Output 1.2", kab_col or kab, lokasi, "Gov", status, hasil, "kendala internal rahasia", foto, dh,
            D(2026, 11, 6) if status else "", "Lengkap" if foto and dh else "Belum ada"]


WEEKLY = {
    "Mimika": weekly_tab("Mimika", [
        ["Contoh", "Sesi contoh", "", D(2026, 11, 3)],
        act(1, "Mimika", "Monitoring Posyandu Atuka", 3, "Selesai", "18 ibu hadir. Detail: https://drive.google.com/x", "https://drive/f", "https://drive/d"),
        act(2, "Mimika", "Kelas Ibu Hamil Fanamo", 4, "Sedang Diimplementasikan", lokasi="Fanamo"),
        act(3, "Mimika", "Monitoring Posyandu Mawar", 5, "Pending"),
        ["MIM-004", "Kelas tanpa tanggal", "", "", "", "", "", "Output 1.3", "Mimika", "", "", "Rencana"],
    ]),
    "Nabire": weekly_tab("Nabire", [act(1, "Nabire", "Monitoring Posyandu Sekartani", 5, "Rencana", lokasi="Wadio")]),
    "Asmat": weekly_tab("Asmat", [act(1, "Asmat", "Edukasi Stunting AoC", 2, "Selesai", "Edukasi berjalan baik", "f", "d", "Warse"),
                                  act(2, "Asmat", "Pendampingan Kader", 6, "Selesai", lokasi="Birak", kab_col="Mimika")]),
}

E = ""
BTT_ROWS = [
    [E, "Rekap BTT PASTI-Papua"], [E, "Gabungan"], [E], [E, "FILTER", "Tahun"], [E, "Cakupan aktif: Tahun 2026 (Jan–Des 2026) · semua bulan · Wilayah: semua kabupaten"], [E],
    [E, "PARTISIPAN UNIK", "Laki-laki", "Perempuan", "Pelaksanaan kegiatan", "Total kehadiran", "Rata-rata keikutsertaan"],
    [E, 3909, 1402, 2461, 219, 8255, (2.111, "2.1")], [E, "orang"], [E],
    [E, "A. Per file BTT kabupaten"], [E, "Mengikuti semua filter."],
    [E, "File BTT", "Status", "Partisipan unik", "Laki-laki", "Perempuan", "JK belum diketahui", "Pelaksanaan", "Total kehadiran", "Partisipan berkabupaten lain*", "%"],
    [E, "Nabire", "✓ tersambung", 1631, 702, 924, 5, 42, 2125, 196, (0.417, "41.7%")],
    [E, "Mimika", "✓ tersambung", 2278, 700, 1537, 41, 99, 4162, 16, (0.583, "58.3%")],
    [E, "Asmat", "✓ tersambung", 0, 0, 0, 0, 78, 1968, 0, (0, "0.0%")],
    [E, "Total", "", 3909, 1402, 2461, 46, 219, 8255, 212, (1, "100.0%")], [E], [E],
    [E, "B. Kelompok usia × jenis kelamin"], [E, "Mengikuti semua filter."],
    [E, "Kelompok usia", "Keterangan", "Laki-laki", "Perempuan", "JK belum diketahui", "Total", "%"],
    [E, "0-5.99 mo", "Bayi 0–5 bulan", 25, 39, 0, 64], [E, "Dewasa", "Dewasa ≥18 tahun", 1377, 2422, 46, 3845],
    [E, "Total", "", 1402, 2461, 46, 3909], [E, "✓ Konsisten"], [E],
    [E, "C. Kegiatan menurut Outcome"], [E, "Mengikuti semua filter."],
    [E, "Outcome", "Nabire", "Mimika", "Asmat", "Total pelaksanaan", "Total kehadiran", "Rata-rata hadir per pelaksanaan"],
    [E, "Outcome 1", 22, 53, 49, 124, 4683, 37.8], [E, "Outcome 2", 20, 46, 29, 95, 3572, 37.6], [E, "Outcome belum dipilih", 0, 0, 0, 0, 0, 0],
    [E, "Total", 42, 99, 78, 219, 8255, 37.7], [E],
    [E, "D. Peserta menurut format BTT Recap (Male/Female/Boys/Girls)"], [E, "Keterangan"],
    [E, "File BTT", "Kolom kegiatan dalam periode", "Male", "Female", "Boys", "Girls", "Tak terklasifikasi", "Total tanda hadir"],
    [E, "Nabire", 42, 331, 822, 372, 377, 223, 2125], [E, "Mimika", 99, 762, 2755, 238, 356, 51, 4162], [E, "Asmat", 78, 854, 864, 117, 130, 3, 1968],
    [E, "Total", 219, 1947, 4441, 727, 863, 277, 8255], [E],
    [E, "E. Status kegiatan BTT FY26 (MOV & kelengkapan)"], [E, "Keterangan"],
    [E, "File BTT", "Kegiatan FY26", "MOV Complete", "MOV Partial", "MOV Missing", "MOV N/A", "Cocok dgn daftar hadir", "Activity ID belum diisi", "Output Code belum diisi"],
    [E, "Nabire", 0, 0, 0, 0, 0, 0, 0, 0], [E, "Mimika", 113, 94, 4, 11, 4, 42, 113, 113], [E, "Asmat", 104, 51, 1, 52, 0, 52, 104, 104],
    [E, "Total", 217, 145, 5, 63, 4, 94, 217, 217], [E],
    [E, "F. Tren bulanan — partisipan unik per bulan"], [E],
    [E, "Bulan", "Nabire", "Mimika", "Asmat", "Total unik", "Pelaksanaan", "Total kehadiran"],
    [E, "Agustus 2026", 576, 500, 0, 1076, 43, 1650], [E, "September 2026", 0, 394, 0, 394, 14, 616], [E, "Oktober 2026", 0, 0, 0, 0, 0, 0],
]

ML = ["periode_tipe", "bulan_no", "periode", "kode", "tipe_baris", "indicator", "implemented", "kalkulasi", "value_format", "unit",
      "target", "capaian_male", "capaian_female", "capaian_total", "persen_capaian"]


def mrow(month, kode, tipe, target, total, pct, fmt="number"):
    name = {"IOP 1.2.1": "Number of children under five (0-59 months) reached", "IOP 2.1.1": "Number of individuals receiving training",
            "IOP 1.3.2": "Percentage of target participants", "IOP 1.3.2 (N)": "↳ #penerima manfaat"}[kode]
    return ["YTD", month, ["Oktober", "November"][month - 10], kode, tipe, name, "Yes", "Highest", fmt, "People", target, 1, 2, total, pct]


MTT = [ML,
       ["Bulanan", 11, "November", "IOP 1.2.1", "Indikator", "x", "Yes", "Highest", "number", "People", 200, 1, 1, 50, 0.25],
       mrow(11, "IOP 1.2.1", "Indikator", 2587, 1574, (0.608, "61%")), mrow(11, "IOP 2.1.1", "Indikator", 21, 433, (20.62, "2062%")),
       mrow(11, "IOP 1.3.2", "Indikator", (0.596, "59.6%"), (0.239, "23.9%"), (0.4, "40%"), "percent"),
       mrow(11, "IOP 1.3.2 (N)", "Numerator", 1654, 664, (0.4, "40%")),
       mrow(10, "IOP 1.2.1", "Indikator", 2300, 1574, (0.684, "68%")), mrow(10, "IOP 2.1.1", "Indikator", 19, 18, (0.947, "95%"))]


def sources():
    s = FakeSession({**WEEKLY, "Dashboard": BTT_ROWS, "MTT_Y26_Long": MTT})
    return {k: sync.ApiSource("x", n, s) for k, n in (("weekly", "Weekly Update"), ("btt", "BTT Rekap"), ("mtt", "MTT"))}


class WeeklyTests(unittest.TestCase):
    def test_private_fields_are_not_published(self):
        payload = sync.build_payload(sources())
        blob = json.dumps(payload, ensure_ascii=False)
        for secret in ["Nama PIC Rahasia", "kendala internal rahasia", "tujuan rahasia", "https://", "drive/f"]:
            self.assertNotIn(secret, blob)

    def test_activities_parsed_by_header_name(self):
        w = sync.load_weekly(sources()["weekly"])
        ids = [a["id"] for a in w["kegiatan"]]
        self.assertEqual(ids, ["MIM-001", "MIM-002", "MIM-003", "NAB-001", "ASM-001", "ASM-002"])
        a = w["kegiatan"][0]
        self.assertEqual((a["mulai"], a["kab"], a["status"], a["foto"], a["dh"]), ("2026-11-03", "Mimika", "Selesai", True, True))
        self.assertEqual(a["hasil"], "18 ibu hadir.")
        self.assertTrue(any("1 kegiatan belum memiliki Tanggal Mulai" in c for c in w["catatan"]))
        self.assertTrue(any("Kabupaten yang berbeda" in c for c in w["catatan"]))

    def test_status_rules(self):
        cases = {"Selesai": "selesai", "Sedang Diimplementasikan": "berjalan", "Pending": "tertunda", "Belum selesai": "rencana",
                 "Batal": "batal", "Dihapus dari rencana": "batal", "Rencana": "rencana", "": "kosong", "Lainnya": "lain"}
        for text, key in cases.items():
            self.assertEqual(sync.status_key(text), key, text)

    def test_missing_column_fails_closed(self):
        bad = {**WEEKLY, "Nabire": weekly_tab("Nabire", [])}
        bad["Nabire"][4] = [h for h in WH if "Status" not in h]
        src = sync.ApiSource("x", "Weekly Update", FakeSession(bad))
        with self.assertRaisesRegex(sync.SyncError, "Nabire: kolom 'status'"):
            sync.load_weekly(src)


class PesertaDokTests(unittest.TestCase):
    def test_participants_from_text_only_when_unambiguous(self):
        self.assertEqual(sync.peserta_teks("Laki-laki: 4 orang, Perempuan: 2 orang Total: 6 orang")[0], {"l": 4, "p": 2, "t": 6, "src": "teks"})
        self.assertEqual(sync.peserta_teks("Keseluruhan: 9 Kader Laki-Laki: 2 Perempuan: 7")[0]["t"], 9)
        self.assertEqual(sync.peserta_teks("Bapak Laki-Laki: 30. AoC Laki-Laki: 11 Perempuan: 3"), (None, "ganda"))
        self.assertEqual(sync.peserta_teks("Laki-laki 4, Perempuan 2, Total 9"), (None, "beda"))
        self.assertEqual(sync.peserta_teks("75% peserta paham materi"), (None, None))

    def test_participant_columns_take_priority(self):
        wh = WH + ["Peserta Laki-laki", "Peserta Perempuan", "Total Peserta"]
        row = act(1, "Mimika", "Kelas Ibu Hamil", 3, "Selesai", "Laki-laki: 1 Perempuan: 1") + [3, 12, ""]
        tab = weekly_tab("Mimika", [row]); tab[4] = wh
        src = sync.ApiSource("x", "Weekly Update", FakeSession({**WEEKLY, "Mimika": tab}))
        a = sync.load_weekly(src)["kegiatan"][0]
        self.assertEqual(a["peserta"], {"l": 3, "p": 12, "t": 15, "src": "kolom"})

    def test_documentation_tab(self):
        dok = [["Minggu (Senin)", "Link folder", "Keterangan"],
               [D(2026, 11, 4), "https://drive.google.com/drive/u/0/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "Week 1 November"],
               ["", "folder tanpa link", ""]]
        src = sync.ApiSource("x", "Weekly Update", FakeSession({**WEEKLY, "Dokumentasi": dok}))
        w = sync.load_weekly(src)
        self.assertEqual(w["dokumentasi"], [{"minggu": "2026-11-02", "id": "1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "judul": "Week 1 November"}])
        self.assertTrue(any("tab Dokumentasi" in c.lower() or "Dokumentasi belum" in c for c in sync.load_weekly(sources()["weekly"])["catatan"]))


class BttMttTests(unittest.TestCase):
    def test_btt_dashboard_blocks(self):
        b = sync.load_btt(sources()["btt"])
        self.assertEqual(b["kpi"]["u"], 3909)
        self.assertEqual(b["kpi"]["avg"], 2.111)
        self.assertEqual(b["per_file"]["Mimika"]["u"], 2278)
        self.assertEqual(b["per_file"]["Asmat"]["hd"], 1968)
        self.assertEqual([x["g"] for x in b["usia"]], ["0-5.99 mo", "Dewasa"])
        self.assertEqual([x["o"] for x in b["outcome"]], ["Outcome 1", "Outcome 2", "Outcome belum dipilih"])
        self.assertEqual(b["recap"]["Asmat"]["female"], 864)
        self.assertEqual(b["mov"]["Asmat"]["miss"], 52)
        self.assertEqual([x["m"] for x in b["bulanan"]], ["2026-08", "2026-09", "2026-10"])
        self.assertTrue(b["cakupan"].startswith("Tahun 2026"))

    def test_btt_structure_change_fails(self):
        rows = [r for r in BTT_ROWS if not (len(r) > 1 and str(r[1]).startswith("F."))]
        src = sync.ApiSource("x", "BTT Rekap", FakeSession({"Dashboard": rows}))
        with self.assertRaisesRegex(sync.SyncError, "bagian F"):
            sync.load_btt(src)

    def test_mtt_ytd_and_recap(self):
        m = sync.load_mtt(sources()["mtt"])
        nov = {x["kode"]: x for x in m["ytd"]["11"]}
        self.assertEqual(nov["IOP 1.2.1"]["capaian"]["v"], 1574)
        self.assertEqual(nov["IOP 1.3.2"]["target"]["f"], "59.6%")
        self.assertEqual(m["rekap"][10], {"bulan": 11, "target": 3, "tercapai": 1})
        self.assertEqual(m["rekap"][9], {"bulan": 10, "target": 2, "tercapai": 1})
        self.assertNotIn("Bulanan", json.dumps(m))


class GvizAndCryptoTests(unittest.TestCase):
    def test_gviz_response_and_login_page(self):
        body = ('/*O_o*/\ngoogle.visualization.Query.setResponse({"status":"ok","table":{"cols":[{"label":"Kode"},{"label":"Target"}],'
                '"rows":[{"c":[{"v":"IOP 1.2.1"},{"v":2587.0,"f":"2,587"}]},{"c":[null,{"v":"Date(2026,10,5)","f":"05/11/2026"}]}]}});')
        with mock.patch.object(sync.urllib.request, "urlopen", return_value=io.BytesIO(body.encode())):
            labels, rows = sync.GvizSource("ID-RAHASIA", "MTT")._get("Summary_26", "A1:B3", 1)
        self.assertEqual(labels, ["Kode", "Target"])
        self.assertEqual(sync.num(rows[0][1]), 2587)
        self.assertEqual(sync.to_date(rows[1][1]).isoformat(), "2026-11-05")
        with mock.patch.object(sync.urllib.request, "urlopen", return_value=io.BytesIO(b"<html>Sign in</html>")):
            with self.assertRaises(sync.SyncError) as ctx:
                sync.GvizSource("ID-RAHASIA", "BTT Rekap")._get("Dashboard")
        self.assertNotIn("ID-RAHASIA", str(ctx.exception))

    def test_numbers_and_dates(self):
        self.assertEqual(sync.num({"f": "3,909"}), 3909)
        self.assertAlmostEqual(sync.num({"f": "59.6%"}), 0.596)
        self.assertEqual(sync.num({"f": "–"}), None)
        self.assertEqual(sync.to_date({"f": "Senin, 5 Oktober 2026"}).isoformat(), "2026-10-05")
        self.assertEqual(sync.to_month({"f": "Agustus 2024"}), "2024-08")

    def test_encrypt_roundtrip(self):
        env = sync.encrypt({"a": "Mimika"}, " uji2026 ")
        self.assertNotIn("Mimika", json.dumps(env))
        self.assertEqual(sync.decrypt(env, "UJI2026"), {"a": "Mimika"})
        with self.assertRaises(Exception):
            sync.decrypt(env, "SALAH")

    def test_missing_secrets_skip_without_error(self):
        with tempfile.NamedTemporaryFile("r+") as out, mock.patch.dict(os.environ, {"GITHUB_OUTPUT": out.name}, clear=True):
            self.assertEqual(sync.main([]), 0)
            self.assertIn("changed=false", Path(out.name).read_text())


if __name__ == "__main__":
    unittest.main()
