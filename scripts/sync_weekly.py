"""Sinkron data Weekly Update PTFI dari tiga Google Sheets.

Sumber (ID file disimpan sebagai GitHub Secrets, tidak pernah ditulis di repository):
  SHEET_WEEKLY_ID  Weekly_Update_PASTI-Papua · tab Mimika, Nabire, Asmat (satu baris = satu kegiatan)
  SHEET_BTT_ID     BTT_Rekap_PASTI_Papua · tab Dashboard (hanya angka agregat; tab Database tidak dibaca)
  SHEET_MTT_ID     MTT_PASTI_Papua_Y26 · tab MTT_Y26_Long (satu baris = satu indikator × satu periode)

Hasil: data/weekly-update.enc.json, terenkripsi AES-256-GCM dengan kunci dari DASHBOARD_ACCESS_CODE
(PBKDF2-SHA256). Dashboard mendekripsi di browser setelah kode akses dimasukkan.

Yang tidak pernah dipublikasikan: nama PIC, kendala/tindak lanjut, link Drive, data per orang dari BTT.

Cara membaca sheet:
  - Bila secret GOOGLE_SHEETS_SERVICE_ACCOUNT ada: Google Sheets API (file boleh dibatasi ke akun tim,
    cukup dibagikan ke email service account sebagai Viewer).
  - Bila tidak ada: endpoint gviz Google (file harus "Siapa saja yang memiliki link · Viewer").
"""
import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "weekly-update.enc.json"
KAB = ("Mimika", "Nabire", "Asmat")
WIT = timezone(timedelta(hours=9))
ITER = 250_000
TAB_BTT = os.environ.get("BTT_TAB", "Dashboard")
TAB_MTT = os.environ.get("MTT_TAB", "MTT_Y26_Long")
HASIL_MAX = 700


class SyncError(Exception):
    """Kesalahan yang aman ditampilkan di log (tanpa ID file atau isi sheet)."""


# ---------------------------------------------------------------- sel → teks / angka / tanggal
MONTHS = {
    "jan": 1, "januari": 1, "january": 1, "feb": 2, "februari": 2, "february": 2, "mar": 3, "maret": 3, "march": 3,
    "apr": 4, "april": 4, "mei": 5, "may": 5, "jun": 6, "juni": 6, "june": 6, "jul": 7, "juli": 7, "july": 7,
    "agu": 8, "agt": 8, "agustus": 8, "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
    "okt": 10, "oktober": 10, "oct": 10, "october": 10, "nov": 11, "nopember": 11, "november": 11,
    "des": 12, "desember": 12, "dec": 12, "december": 12,
}
GVIZ_DATE = re.compile(r"^Date\((\d+),(\d+),(\d+)")


def txt(cell):
    if not cell:
        return ""
    value = cell.get("f")
    if value is None:
        value = cell.get("v")
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return re.sub(r"\s+", " ", str(value)).strip()


def num(cell):
    if not cell:
        return None
    value = cell.get("v")
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = txt(cell)
    if not s or s in {"–", "-", "—"}:
        return None
    pct = s.endswith("%")
    s = re.sub(r"[^\d,.\-]", "", s)
    if not s or s in {"-", ".", ","}:
        return None
    if re.fullmatch(r"-?\d{1,3}(,\d{3})+(\.\d+)?", s):
        s = s.replace(",", "")
    elif re.fullmatch(r"-?\d{1,3}(\.\d{3})+(,\d+)?", s):
        s = s.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d+,\d+", s):
        s = s.replace(",", ".")
    try:
        n = float(s)
    except ValueError:
        return None
    return n / 100 if pct else n


def to_date(cell):
    if not cell:
        return None
    value = cell.get("v")
    if isinstance(value, str):
        m = GVIZ_DATE.match(value)
        if m:
            return date(int(m[1]), int(m[2]) + 1, int(m[3]))
    s = txt(cell)
    m = re.search(r"\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b", s)
    if m:  # format sheet PASTI-Papua: dd/mm/yyyy
        try:
            return date(int(m[3]), int(m[2]), int(m[1]))
        except ValueError:
            return None
    m = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", s)
    if m:
        return date(int(m[1]), int(m[2]), int(m[3]))
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b", s)
    if m and m[2].lower() in MONTHS:
        try:
            return date(int(m[3]), MONTHS[m[2].lower()], int(m[1]))
        except ValueError:
            return None
    return None


def to_month(cell):
    d = to_date(cell)
    if d:
        return f"{d.year}-{d.month:02d}"
    m = re.search(r"([A-Za-z]+)\s+(\d{4})", txt(cell))
    if m and m[1].lower() in MONTHS:
        return f"{m[2]}-{MONTHS[m[1].lower()]:02d}"
    return None


def norm_label(label):
    return re.sub(r"\s+", " ", str(label or "")).strip().lower().rstrip("*").strip()


def col_name(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def col_index(name):
    n = 0
    for ch in name:
        n = n * 26 + ord(ch) - 64
    return n - 1


# ---------------------------------------------------------------- sumber data
class GvizSource:
    """Membaca lewat endpoint Google Visualization (tanpa login, file harus berbagi link)."""

    def __init__(self, sheet_id, name):
        self.sid, self.name = sheet_id, name

    def _get(self, tab, rng=None, headers=0):
        q = {"tqx": "out:json", "sheet": tab, "headers": str(headers)}
        if rng:
            q["range"] = rng
        url = f"https://docs.google.com/spreadsheets/d/{self.sid}/gviz/tq?" + urllib.parse.urlencode(q)
        body = None
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (PASTI-Papua weekly sync)"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    body = r.read().decode("utf-8", "replace")
                break
            except (urllib.error.URLError, TimeoutError):
                if attempt == 2:
                    raise SyncError(f"{self.name} · {tab}: tidak bisa terhubung ke Google Sheets") from None
                time.sleep(3 * (attempt + 1))
        i = body.find("setResponse(")
        if i < 0:
            raise SyncError(f"{self.name} · {tab}: sheet tidak bisa dibaca tanpa login. Bagikan file sebagai "
                            "'Siapa saja yang memiliki link · Viewer', atau pakai service account.")
        data = json.loads(body[i + 12: body.rfind(")")])
        if data.get("status") == "error":
            err = (data.get("errors") or [{}])[0]
            msg = re.sub(r"<[^>]+>", "", str(err.get("detailed_message") or err.get("message") or "gagal membaca"))
            raise SyncError(f"{self.name} · {tab}: {msg[:160]}")
        table = data.get("table") or {}
        cols = table.get("cols") or []
        rows = []
        for r in table.get("rows") or []:
            cells = list(r.get("c") or [])
            cells += [None] * (len(cols) - len(cells))
            rows.append([c if c and (c.get("v") is not None or c.get("f") is not None) else None for c in cells])
        return [c.get("label", "") for c in cols], rows

    def column_cells(self, tab, c0, c1):
        return self._get(tab, f"{c0}1:{c1}", 0)[1]

    def block(self, tab, c0, r0, c1, r1):
        return self._get(tab, f"{c0}{r0}:{c1}{r1}", 1)

    def table(self, tab, header_row):
        return self._get(tab, None, header_row)


class ApiSource:
    """Membaca lewat Google Sheets API dengan service account (file boleh dibatasi)."""

    def __init__(self, sheet_id, name, session):
        self.sid, self.name, self.session, self.cache = sheet_id, name, session, {}

    def grid(self, tab):
        if tab in self.cache:
            return self.cache[tab]
        base = f"https://sheets.googleapis.com/v4/spreadsheets/{self.sid}/values/{urllib.parse.quote(tab)}"
        raw, fmt = [], []
        for opt, out in (("UNFORMATTED_VALUE", raw), ("FORMATTED_VALUE", fmt)):
            res = self.session.get(base, params={"valueRenderOption": opt, "dateTimeRenderOption": "SERIAL_NUMBER"}, timeout=60)
            if res.status_code != 200:
                raise SyncError(f"{self.name} · {tab}: Google Sheets API HTTP {res.status_code} (cek akses service account)")
            out.extend(res.json().get("values", []))
        rows = []
        for i, frow in enumerate(fmt):
            rrow = raw[i] if i < len(raw) else []
            row = []
            for j, f in enumerate(frow):
                v = rrow[j] if j < len(rrow) else f
                if f in ("", None) and v in ("", None):
                    row.append(None)
                    continue
                if isinstance(v, (int, float)) and not isinstance(v, bool) and to_date({"f": f}):
                    d = date(1899, 12, 30) + timedelta(days=int(v))
                    v = f"Date({d.year},{d.month - 1},{d.day})"
                row.append({"v": v, "f": f})
            rows.append(row)
        self.cache[tab] = rows
        return rows

    def _slice(self, row, c0, c1):
        row = row or []
        return [(row[j] if j < len(row) else None) for j in range(col_index(c0), col_index(c1) + 1)]

    def column_cells(self, tab, c0, c1):
        return [self._slice(r, c0, c1) for r in self.grid(tab)]

    def block(self, tab, c0, r0, c1, r1):
        g = self.grid(tab)
        rows = [self._slice(g[i] if i < len(g) else [], c0, c1) for i in range(r0 - 1, r1)]
        return [txt(c) for c in rows[0]], rows[1:]

    def table(self, tab, header_row):
        g = self.grid(tab)
        width = max((len(r) for r in g), default=0)
        pad = lambda r: list(r) + [None] * (width - len(r))
        head = [" ".join(txt(r[j]) if j < len(r) else "" for r in g[:header_row]).strip() for j in range(width)]
        return head, [pad(r) for r in g[header_row:]]


# ---------------------------------------------------------------- Weekly Update
WEEKLY_FIELDS = [
    ("id", r"(^|\s)(id|no\.?|kode)$"),
    ("nama", r"nama kegiatan$"),
    ("mulai", r"(tanggal|tgl)\.? ?mulai$"),
    ("selesai", r"((tanggal|tgl)\.? ?selesai|jadwal selesai)$"),
    ("output", r"(kontribusi output|(^|\s)output)$"),
    ("kabupaten", r"(^|\s)kabupaten$"),
    ("lokasi", r"lokasi( \(.*\))?$"),
    ("status", r"(^|\s)status$"),
    ("hasil", r"hasil( kegiatan)?$"),
    ("foto", r"^(?!.*kelengkapan).*(dokumentasi|foto)( \(.*\))?$"),
    ("dh", r"daftar hadir( kegiatan)?$"),
    ("upd", r"(tgl|tanggal)\.? ?update$"),
]
STATUS_RULES = [  # urutan penting; sama dengan assets/logic.js
    ("batal", r"batal|cancel|dihapus"),
    ("tertunda", r"pending|tunda|terkendala|kendala|mundur|delay|hambat"),
    ("rencana", r"belum"),
    ("selesai", r"selesai|done|complete|terlaksana|tuntas"),
    ("berjalan", r"sedang|berjalan|implement|proses|progress|ongoing"),
    ("rencana", r"rencana|plan|jadwal"),
]


def status_key(text):
    s = (text or "").strip().lower()
    if not s:
        return "kosong"
    for key, pattern in STATUS_RULES:
        if re.search(pattern, s):
            return key
    return "lain"


def map_fields(labels, fields, where):
    lab = [norm_label(x) for x in labels]
    out = {}
    for key, pattern in fields:
        for i, x in enumerate(lab):
            if x and re.search(pattern, x) and i not in out.values():
                out[key] = i
                break
    return out


def clean_text(s, limit=None):
    s = re.sub(r"https?://\S+", "", s or "")
    s = re.sub(r"[ \t]+", " ", s).strip(" -–·")
    s = re.sub(r"\s*\b(detail|link|lihat|foto|dokumentasi)\s*:?\s*$", "", s, flags=re.I).rstrip(" :-–·")
    if limit and len(s) > limit:
        s = s[: limit - 1].rsplit(" ", 1)[0] + "…"
    return s


def find_header_row(src, tab):
    cells = src.column_cells(tab, "A", "C")[:15]
    for i, row in enumerate(cells):
        if any(re.search(r"nama kegiatan", txt(c), re.I) for c in row):
            return i + 1
    raise SyncError(f"Weekly Update · tab {tab}: kolom 'Nama Kegiatan' tidak ditemukan di 15 baris pertama")


def parse_weekly_tab(tab, labels, rows):
    m = map_fields(labels, WEEKLY_FIELDS, tab)
    for need in ("nama", "mulai", "status"):  # kolom wajib
        if need not in m:
            raise SyncError(f"Weekly Update · tab {tab}: kolom '{need}' tidak ditemukan (struktur sheet berubah?)")
    get = lambda r, k: r[m[k]] if k in m and m[k] < len(r) else None
    acts, notes = [], {"tanpa_tanggal": 0, "kab_beda": 0, "status_lain": set(), "id_ganda": set()}
    seen = set()
    for r in rows:
        nama = txt(get(r, "nama"))
        rid = txt(get(r, "id"))
        if not nama or rid.lower() == "contoh" or re.fullmatch(r"\(.*\)", nama):
            continue
        mulai, selesai, upd = to_date(get(r, "mulai")), to_date(get(r, "selesai")), to_date(get(r, "upd"))
        status = txt(get(r, "status"))
        kab_col = txt(get(r, "kabupaten"))
        if not mulai:
            notes["tanpa_tanggal"] += 1
        if kab_col and kab_col.lower() != tab.lower():
            notes["kab_beda"] += 1
        if status and status_key(status) == "lain":
            notes["status_lain"].add(status[:40])
        if rid:
            if rid in seen:
                notes["id_ganda"].add(rid)
            seen.add(rid)
        acts.append({
            "id": rid, "kab": tab, "nama": clean_text(nama, 220),
            "mulai": mulai.isoformat() if mulai else "", "selesai": selesai.isoformat() if selesai else "",
            "output": clean_text(txt(get(r, "output")), 60), "lokasi": clean_text(txt(get(r, "lokasi")), 120),
            "status": status[:60], "hasil": clean_text(txt(get(r, "hasil")), HASIL_MAX),
            "foto": bool(txt(get(r, "foto"))), "dh": bool(txt(get(r, "dh"))), "upd": upd.isoformat() if upd else "",
        })
    return acts, notes


def load_weekly(src):
    acts, catatan = [], []
    for tab in KAB:
        hrow = find_header_row(src, tab)
        labels, rows = src.table(tab, hrow)
        a, n = parse_weekly_tab(tab, labels, rows)
        acts += [x for x in a if x["mulai"]]
        if n["tanpa_tanggal"]:
            catatan.append(f"{tab}: {n['tanpa_tanggal']} kegiatan belum memiliki Tanggal Mulai, sehingga tidak masuk minggu mana pun.")
        if n["kab_beda"]:
            catatan.append(f"{tab}: {n['kab_beda']} kegiatan memiliki kolom Kabupaten yang berbeda dengan nama tab; dashboard memakai nama tab.")
        if n["status_lain"]:
            catatan.append(f"{tab}: status tidak baku ({', '.join(sorted(n['status_lain']))}); ditampilkan apa adanya.")
        if n["id_ganda"]:
            catatan.append(f"{tab}: ID ganda {', '.join(sorted(n['id_ganda']))}.")
    if not acts:
        raise SyncError("Weekly Update: tidak ada kegiatan terbaca dari tab Mimika, Nabire, dan Asmat")
    return {"kegiatan": acts, "catatan": catatan, "snapshot": None}


# ---------------------------------------------------------------- BTT Rekap · Dashboard
def _find(texts, pattern, start=0):
    for i in range(start, len(texts)):
        if re.search(pattern, texts[i], re.I):
            return i
    return None


def _until_total(texts, h):
    end = h + 1
    while end < len(texts) and texts[end] and not re.fullmatch(r"total", texts[end], re.I):
        end += 1
    if end < len(texts) and re.fullmatch(r"total", texts[end], re.I):
        return end
    return end - 1


def _until_blank(texts, h):
    end = h + 1
    while end < len(texts) and texts[end]:
        end += 1
    return end - 1


def _rowdict(labels, row, fields):
    m = map_fields(labels, fields, "")
    return {k: (row[i] if i < len(row) else None) for k, i in m.items()}, m


def load_btt(src, tab=TAB_BTT):
    col = src.column_cells(tab, "B", "B")
    texts = [txt(r[0]) if r else "" for r in col]
    sec = {}
    for i, t in enumerate(texts):
        mm = re.match(r"^([A-F])\.\s", t)
        if mm and mm[1] not in sec:
            sec[mm[1]] = i
    scope_i = _find(texts, r"^cakupan aktif")
    scope = re.sub(r"(?i)^cakupan aktif\s*:\s*", "", texts[scope_i]) if scope_i is not None else ""
    k = _find(texts, r"^partisipan unik$")
    missing = [s for s in "ABCDEF" if s not in sec]
    if k is None or missing:
        raise SyncError(f"BTT Rekap · {tab}: struktur berubah (kartu Partisipan unik / bagian {', '.join(missing)} tidak ditemukan)")
    B = lambda h, e: src.block(tab, "B", h + 1, "M", e + 1)

    labels, rows = B(k, k + 1)
    kv, km = _rowdict(labels, rows[0] if rows else [], [
        ("u", r"^partisipan unik$"), ("l", r"laki"), ("p", r"perempuan"), ("pel", r"pelaksanaan"),
        ("hd", r"kehadiran"), ("avg", r"rata")])
    kpi = {key: num(c) for key, c in kv.items()}
    if kpi.get("u") is None:
        raise SyncError(f"BTT Rekap · {tab}: angka Partisipan unik tidak terbaca")

    def section(letter, header, ender, fields, keyfield):
        h = _find(texts, header, sec[letter])
        if h is None:
            raise SyncError(f"BTT Rekap · {tab}: header bagian {letter} tidak ditemukan")
        labels, rows = B(h, ender(texts, h))
        m = map_fields(labels, fields, "")
        if keyfield not in m:
            raise SyncError(f"BTT Rekap · {tab}: kolom bagian {letter} berubah")
        return m, rows

    m, rows = section("A", r"^file btt$", _until_total, [
        ("f", r"^file btt$"), ("st", r"^status$"), ("u", r"partisipan unik"), ("l", r"laki"), ("p", r"perempuan"),
        ("x", r"belum diketahui"), ("pel", r"^pelaksanaan"), ("hd", r"kehadiran"), ("lain", r"kabupaten lain")], "f")
    per_file = {}
    for r in rows:
        name = txt(r[m["f"]])
        if name in KAB:
            per_file[name] = {key: num(r[i]) or 0 for key, i in m.items() if key not in ("f", "st")}
            per_file[name]["status"] = txt(r[m["st"]]) if "st" in m else ""
    if set(per_file) != set(KAB):
        raise SyncError(f"BTT Rekap · {tab}: tabel per file BTT tidak lengkap")

    m, rows = section("B", r"^kelompok usia$", _until_total, [
        ("g", r"^kelompok usia$"), ("ket", r"keterangan"), ("l", r"laki"), ("p", r"perempuan"),
        ("x", r"belum diketahui"), ("t", r"^total$")], "g")
    usia = [{"g": txt(r[m["g"]]), "ket": txt(r[m["ket"]]) if "ket" in m else "",
             **{key: num(r[m[key]]) or 0 for key in ("l", "p", "x", "t") if key in m}}
            for r in rows if txt(r[m["g"]]) and not re.fullmatch(r"total", txt(r[m["g"]]), re.I)]

    m, rows = section("C", r"^outcome$", _until_total, [
        ("o", r"^outcome$"), ("Nabire", r"^nabire$"), ("Mimika", r"^mimika$"), ("Asmat", r"^asmat$"),
        ("pel", r"total pelaksanaan"), ("hd", r"total kehadiran")], "o")
    outcome = [{"o": txt(r[m["o"]]), **{key: num(r[i]) or 0 for key, i in m.items() if key != "o"}}
               for r in rows if re.match(r"outcome", txt(r[m["o"]]), re.I)]

    m, rows = section("D", r"^file btt$", _until_total, [
        ("f", r"^file btt$"), ("kol", r"kolom kegiatan"), ("male", r"^male$"), ("female", r"^female$"),
        ("boys", r"^boys$"), ("girls", r"^girls$"), ("tk", r"tak terklasifikasi"), ("t", r"total tanda hadir")], "f")
    recap = {txt(r[m["f"]]): {key: num(r[i]) or 0 for key, i in m.items() if key != "f"}
             for r in rows if txt(r[m["f"]]) in KAB}

    m, rows = section("E", r"^file btt$", _until_total, [
        ("f", r"^file btt$"), ("keg", r"kegiatan fy"), ("comp", r"complete"), ("part", r"partial"),
        ("miss", r"missing"), ("na", r"n/a"), ("cocok", r"cocok"), ("aid", r"activity id"), ("oc", r"output code")], "f")
    mov = {txt(r[m["f"]]): {key: num(r[i]) or 0 for key, i in m.items() if key != "f"}
           for r in rows if txt(r[m["f"]]) in KAB}

    m, rows = section("F", r"^bulan$", _until_blank, [
        ("b", r"^bulan$"), ("Nabire", r"^nabire$"), ("Mimika", r"^mimika$"), ("Asmat", r"^asmat$"),
        ("t", r"total unik"), ("pel", r"pelaksanaan"), ("hd", r"kehadiran")], "b")
    bulanan = []
    for r in rows:
        mk = to_month(r[m["b"]])
        if mk:
            bulanan.append({"m": mk, **{key: num(r[i]) or 0 for key, i in m.items() if key != "b"}})
    return {"cakupan": scope, "kpi": kpi, "per_file": per_file, "usia": usia, "outcome": outcome,
            "recap": recap, "mov": mov, "bulanan": bulanan}


# ---------------------------------------------------------------- MTT · long data
MTT_FIELDS = [
    ("periode_tipe", r"^periode_tipe$"), ("bulan_no", r"^bulan_no$"), ("periode", r"^periode$"), ("kode", r"^kode$"),
    ("tipe", r"^tipe_baris$"), ("indicator", r"^indicator$"), ("impl", r"^implemented$"), ("kalkulasi", r"^kalkulasi$"),
    ("fmt", r"^value_format$"), ("unit", r"^unit$"), ("target", r"^target$"), ("male", r"^capaian_male$"),
    ("female", r"^capaian_female$"), ("total", r"^capaian_total$"), ("pct", r"^persen_capaian$"),
]
BLN_ID = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"]


def load_mtt(src, tab=TAB_MTT):
    labels, rows = src.table(tab, 1)
    m = map_fields(labels, MTT_FIELDS, tab)
    need = [k for k in ("periode_tipe", "periode", "kode", "target", "total") if k not in m]
    if need:
        raise SyncError(f"MTT · {tab}: kolom {', '.join(need)} tidak ditemukan (struktur sheet berubah?)")
    g = lambda r, k: r[m[k]] if k in m and m[k] < len(r) else None
    ytd, info = {}, {}
    for r in rows:
        kode = txt(g(r, "kode"))
        if not kode or not re.search(r"ytd|year", txt(g(r, "periode_tipe")), re.I):
            continue
        bn = num(g(r, "bulan_no"))
        per = txt(g(r, "periode")).lower()
        month = int(bn) if bn else (BLN_ID.index(per) + 1 if per in BLN_ID else None)
        if not month:
            continue
        tipe = txt(g(r, "tipe")) or "Indikator"
        if kode not in info:
            info[kode] = {"kode": kode, "tipe": tipe, "nama": txt(g(r, "indicator")), "impl": txt(g(r, "impl")),
                          "kalkulasi": txt(g(r, "kalkulasi")), "fmt": txt(g(r, "fmt")), "unit": txt(g(r, "unit"))}
        cell = lambda k: {"v": num(g(r, k)), "f": txt(g(r, k))}
        ytd.setdefault(str(month), []).append({"kode": kode, "target": cell("target"), "capaian": cell("total"),
                                               "male": num(g(r, "male")), "female": num(g(r, "female")), "pct": cell("pct")})
    if not ytd:
        raise SyncError(f"MTT · {tab}: tidak ada baris YTD yang terbaca")
    rekap = []
    for month in range(1, 13):
        rows_m = [x for x in ytd.get(str(month), []) if info[x["kode"]]["tipe"].lower().startswith("indik")
                  and info[x["kode"]]["impl"].lower() in ("yes", "ya", "")]
        tg = [x for x in rows_m if (x["target"]["v"] or 0) > 0]
        ok = [x for x in tg if (x["pct"]["v"] if x["pct"]["v"] is not None else (x["capaian"]["v"] or 0) / x["target"]["v"]) > 0.9]
        rekap.append({"bulan": month, "target": len(tg), "tercapai": len(ok)})
    return {"tahun": int(os.environ.get("MTT_TAHUN", "2026")), "indikator": list(info.values()), "ytd": ytd,
            "rekap": rekap, "rekap_sumber": "dihitung dari MTT_Y26_Long (aturan Summary_26: tercapai bila capaian > 90% target)"}


# ---------------------------------------------------------------- enkripsi
def _kdf(code, salt):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(code.strip().upper().encode())


def encrypt(obj, code):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    salt, iv = os.urandom(16), os.urandom(12)
    plain = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    b64 = lambda b: base64.b64encode(b).decode()
    return {"v": 1, "kdf": "PBKDF2-SHA256", "it": ITER, "s": b64(salt), "i": b64(iv),
            "c": b64(AESGCM(_kdf(code, salt)).encrypt(iv, plain, None))}


def decrypt(env, code):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    d = lambda k: base64.b64decode(env[k])
    return json.loads(AESGCM(_kdf(code, d("s"))).decrypt(d("i"), d("c"), None))


def comparable(payload):
    p = json.loads(json.dumps(payload))
    p.pop("dibuat", None)
    return p


# ---------------------------------------------------------------- utama
def make_source(sheet_id, name, session):
    return ApiSource(sheet_id, name, session) if session else GvizSource(sheet_id, name)


def build_payload(sources):
    weekly = load_weekly(sources["weekly"])
    btt = load_btt(sources["btt"])
    mtt = load_mtt(sources["mtt"])
    return {"versi": 1, "mode": "sinkron", "zona": "WIT (UTC+9)", "weekly": weekly, "btt": btt, "mtt": mtt}


def main(argv):
    env = os.environ
    names = {"weekly": "SHEET_WEEKLY_ID", "btt": "SHEET_BTT_ID", "mtt": "SHEET_MTT_ID"}
    missing = [v for v in [*names.values(), "DASHBOARD_ACCESS_CODE"] if not env.get(v, "").strip()]
    gh_out = env.get("GITHUB_OUTPUT")

    def output(changed):
        if gh_out:
            with open(gh_out, "a", encoding="utf-8") as f:
                f.write(f"changed={'true' if changed else 'false'}\n")

    if missing:
        print(f"::warning::Sinkron dilewati: secret {', '.join(missing)} belum diisi. Dashboard memakai data terakhir.")
        output(False)
        return 0
    session = None
    if env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT", "").strip():
        from google.auth.transport.requests import AuthorizedSession
        from google.oauth2.service_account import Credentials
        creds = Credentials.from_service_account_info(json.loads(env["GOOGLE_SHEETS_SERVICE_ACCOUNT"]),
                                                      scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"])
        session = AuthorizedSession(creds)
    labels = {"weekly": "Weekly Update", "btt": "BTT Rekap", "mtt": "MTT"}
    sources = {k: make_source(env[v].strip(), labels[k], session) for k, v in names.items()}
    payload = build_payload(sources)
    code = env["DASHBOARD_ACCESS_CODE"]
    if OUT.exists():
        try:
            if comparable(decrypt(json.loads(OUT.read_text(encoding="utf-8")), code)) == comparable(payload):
                print("Tidak ada perubahan data.")
                output(False)
                return 0
        except Exception:
            pass  # kode akses berganti atau file lama rusak: tulis ulang
    payload["dibuat"] = datetime.now(WIT).isoformat(timespec="minutes")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(encrypt(payload, code)) + "\n", encoding="utf-8")
    w = payload["weekly"]["kegiatan"]
    print(f"Data diperbarui: {len(w)} kegiatan, {int(payload['btt']['kpi']['u'])} partisipan unik BTT, "
          f"{len(payload['mtt']['indikator'])} baris indikator MTT.")
    output(True)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except SyncError as e:
        print(f"::error::Sinkron gagal: {e}. Data terakhir tetap dipakai.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:  # jangan cetak isi sheet atau ID file
        print(f"::error::Sinkron gagal ({type(e).__name__}). Data terakhir tetap dipakai.", file=sys.stderr)
        sys.exit(1)
