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
        rng = None
        if "!" in tab:
            tab, rng = tab.split("!")
        if tab not in self.tabs:
            return FakeResponse([], 400)
        grid = self.tabs[tab]
        if rng:
            m = sync.re.fullmatch(r"([A-Z]+)(\d+):([A-Z]+)(\d+)", rng)
            c0, r0, c1, r1 = sync.col_index(m[1]), int(m[2]), sync.col_index(m[3]), int(m[4])
            grid = [list(row[c0:c1 + 1]) for row in grid[r0 - 1:r1]]
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


def t_bulan():
    return D(2026, 11, 1)


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
    def test_participant_screening_real_formats(self):
        """Format yang dipakai tim di Weekly Update PASTI-Papua (Nov 2026); nama orang dihapus."""
        cases = [
            ("- 29 peserta hadir (L:1, P:28)\n- Seorang PJ Gizi (Laki-laki, 35 tahun) memperoleh pengetahuan baru", (29, 1, 28, None)),
            ("1. Baduta :13 orang L:10 P:3 Balita : 6 L:3 P:3 \n2. jadwal kunjungan rumah pada 06 November 2026", (19, 13, 6, None)),
            ("1. Sasaran yang Hadir\nBayi laki-laki: 14\nBayi perempuan: 22\nBalita laki-laki: 12\nBalita perempuan: 16\nIbu hamil: 7\n"
             "Ibu nifas: 5\nUsia dewasa: perempuan 2, laki-laki 1\nLansia (≥60 tahun): perempuan 2\nTotal hadir: 81 orang", (81, 27, 54, None)),
            ("4. Sasaran yang Hadir\nBayi laki-laki: 6\nBayi perempuan: 7\nBalita laki-laki: 6\nBalita perempuan: 9\nIbu hamil: 8\n"
             "Lansia laki-laki: 1\nLansia perempuan: 8\nTotal sasaran hadir: 45 orang", (45, 13, 32, None)),
            ("2. Pelatihan di hadiri 29 orang pesertaa;\n4. dari 9 Puskesmas di timika 6 diantaranya dampingan", (29, None, None, None)),
            ("1. Peserta untuk Pria : 58 orang Wanita: 22 orang;\n2. Atuka, Awap, Keakwa", (80, 58, 22, None)),
            ("20 baduta yang hadir\n(Laki-laki : 10  Perempuan : 10)\n11 Balita yang hadir\n(Laki-laki : 3  Perempuan : 10)", (31, 13, 20, "beda")),
            ("8 orang baduta yang hadir\n(Laki-laki : 5    Perempuan : 3)\n2 orang balita yang hadir\n(Laki-laki : 1    Perempuan 1) ", (10, 6, 4, None)),
            ("- Baduta yang hadir ada 8 anak (P: 6; L: 2) \n- Balita yang hadir ada 7 anak (P: 2; L: 5)\n- 1 anak 1T BB naik\n- 2 anak wasting BB naik", (15, 7, 8, None)),
        ]
        for text, (t, l, p, why) in cases:
            pe, w = sync.peserta_teks(text)
            self.assertEqual((pe["t"], pe["l"], pe["p"], w), (t, l, p, why), text[:40])
        for text in ["- Dari 4 Kampung, 3 kampung telah siap", "Output 1.1.1, 1.1.3, dan 1.2.1 sudah direkap", "Dalam proses", "75% peserta paham materi"]:
            self.assertEqual(sync.peserta_teks(text), (None, None), text)

    def test_shifted_columns_swapped_dates_and_changed_name(self):
        head = WH[:]
        head.insert(11, "Nama Kegiatan Jika Ada Perubahan (ditulis Manual)")
        tab = [["Weekly Update · Asmat"], [""], [""], [""], head,
               ["ASM-001", "PMT Pemulihan Sesakam", t_bulan(), D(2026, 11, 2), D(2026, 11, 27), "Abel", "", "Asmat", "Sesakam", "", "", "PMT Pemulihan Hari 5-10",
                "Sedang Diimplementasikan", "- Baduta yang hadir ada 8 anak (P: 6; L: 2)", "", "", "", "", ""],
               ["ASM-002", "Monitoring posyandu oleo", t_bulan(), (sync.date(2026, 6, 11) - sync.date(1899, 12, 30)).days and D(2026, 6, 11), D(2026, 6, 11),
                "tujuan", "Eliano", "Output 1.2", "Asmat", "Sriwini", "", "", "Selesai", "20 baduta yang hadir", "", "", "", "", ""]]
        src = sync.ApiSource("x", "Weekly Update", FakeSession({**WEEKLY, "Asmat": tab}))
        w = sync.load_weekly(src)
        a = [x for x in w["kegiatan"] if x["kab"] == "Asmat"]
        self.assertEqual((a[0]["nama"], a[0]["nama_rencana"], a[0]["lokasi"], a[0]["output"]), ("PMT Pemulihan Hari 5-10", "PMT Pemulihan Sesakam", "Sesakam", ""))
        self.assertEqual((a[1]["mulai"], a[1]["tgl_asli"], a[1]["lokasi"], a[1]["output"]), ("2026-11-06", "11/06/2026", "Sriwini", "Output 1.2"))
        self.assertTrue(any("bergeser satu kolom di 1 baris" in c for c in w["catatan"]))
        self.assertTrue(any("tertukar hari dan bulannya" in c for c in w["catatan"]))

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


def database_grid():
    """Tab Database tiruan dengan tata letak template BTT_Rekap (judul baris 14, zona per kabupaten)."""
    months = []
    y, m = 2024, 8
    while (y, m) <= (2027, 12):
        months.append(f"{['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m - 1]} {y}")
        m += 1
        if m == 13:
            y, m = y + 1, 1
    head = ["Kabupaten (file)", "ID Partisipan", "Ident", "Dup", "Valid", "Kab", "Distrik", "Kampung", "JK", "Kelompok usia", "Total hadir"] + months
    head += ["Hadir dalam filter", "Wilayah cocok", "Dihitung (filter)", "Dihitung (semua periode)", "Kab ≠ file", "", "Kabupaten (file)"]
    okn = ['Idx','Kode','Kol','KodeAct','Ind','ActIn','ActID','Nama','Out','Tgl1','Tgl2','Lok','PIC','ID','Ket','Th','Bl','Hadir','Invalid','FirstInv','Valid','Nab','Mim','Asm','BD','Unl','Lain',
           'Wil','HadirWil','BlnF','InF','Aktif','Key','UniqF','UniqAll','SameKey','Status','Elig','Sort','Rank','Masalah','Saran','Tingkat','Flag','ARank',
           'RegPos','RegTot','Selisih','Maybe','Cek','Link','CRank','M18','F18','Boy','Girl','Unk','RegStat','MOV','Remarks','Arsip','Sheet']
    head += okn
    grid = [[] for _ in range(7520)]
    grid[13] = head
    mi = {mm: 11 + i for i, mm in enumerate(months)}
    def person(row, ident, dup, kab, jk, usia, hadir):
        r = ["Z", "ID", ident, dup, 1, kab, "", "", jk, usia, sum(hadir.values())] + [0] * len(months)
        for k, v in hadir.items():
            r[mi[k]] = v
        grid[row - 1] = r + [""] * (len(head) - len(r))
    person(15, 1, "", "Nabire", "L", "Dewasa", {"Sep 2026": 2, "Okt 2026": 1})
    person(16, 1, "", "Nabire", "Perempuan", "12-17.99 yo", {"Sep 2026": 1})
    person(17, 1, 1, "Nabire", "P", "Dewasa", {"Sep 2026": 5})           # duplikat: tidak dihitung
    person(7515, 1, "", "", "P", "Dewasa", {"Agu 2024": 1})              # kabupaten kosong → Lainnya
    person(7516, 0, "", "Mimika", "L", "Dewasa", {"Agu 2024": 9})        # tanpa identitas: tidak dihitung
    kb = head.index("Idx")
    def act(row, nama, tgl, out, hadir, m18=0, f18=0, boy=0):
        r = grid[row - 1] or [""] * len(head)
        r = r + [""] * (len(head) - len(r))
        for k, v in {"Nama": nama, "Out": out, "Tgl1": tgl, "Hadir": hadir, "Aktif": 1, "M18": m18, "F18": f18, "Boy": boy, "Girl": 0, "Unk": 0}.items():
            r[kb + okn.index(k)] = v
        grid[row - 1] = r
    act(18, "Posyandu", D(2026, 9, 5), "Outcome 1", 3, 1, 1, 1)
    act(19, "Posyandu", D(2026, 9, 5), "Outcome 1", 1)                  # nama+tanggal sama: satu pelaksanaan
    act(1015, "Kelas remaja", D(2024, 8, 10), "Outcome 2", 1)
    return grid


class BttMttTests(unittest.TestCase):
    def test_btt_filter_cube(self):
        src = sync.ApiSource("x", "BTT Rekap", FakeSession({"Database": database_grid()}))
        kb = sync.load_btt_kubus(src)
        self.assertEqual(kb["p"]["y2026"], [["Nabire", "L", "Dewasa", 1, 3], ["Nabire", "P", "12-17.99 yo", 1, 1]])
        self.assertEqual(kb["p"]["m2026-10"], [["Nabire", "L", "Dewasa", 1, 1]])
        self.assertEqual(sum(r[3] for r in kb["p"]["all"]), 3)
        self.assertIn(["Lainnya", "P", "Dewasa", 1, 1], kb["p"]["all"])
        self.assertEqual(kb["k"]["y2026"], [["Nabire", 1, 4, 1, 0, 0, 0, 1, 1, 1, 0, 0]])
        self.assertEqual(kb["k"]["y2024"], [["Mimika", 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0]])
        self.assertIn(["fy2027", "FY2027 (Okt 2026–Sep 2027)"], kb["periode"])
        self.assertNotIn("ID", json.dumps(kb))

    def test_btt_cube_failure_keeps_dashboard_data(self):
        b = sync.load_btt(sources()["btt"])           # tidak ada tab Database
        self.assertIsNone(b["kubus"])
        self.assertTrue(b["catatan"] and "Filter bulan/wilayah" in b["catatan"][0])

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
