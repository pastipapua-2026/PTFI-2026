"""Read a private Google Sheet and publish only approved, allowlisted fields."""
import csv
import io
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

SHEET_ID = "15XkCUaZngioZcL_RsgI6_V_Oj_6f7gII8nzqMDWvz2k"
SCHEMA = {
    "penerima_manfaat": "periode tanggal minggu kabupaten kampung kategori kelompok kelompok_umur jenis_kelamin capaian".split(),
    "target": "tahun kabupaten kategori kelompok jenis_kelamin target".split(),
    "kegiatan": "periode tanggal minggu kabupaten output jenis_kegiatan jumlah_kegiatan kampung total_peserta anak_laki_laki anak_perempuan dewasa_laki_laki dewasa_perempuan".split(),
    "indikator": "level kode indikator indicator_en satuan target capaian tahun".split(),
    "info": ["kunci", "nilai"],
    "dokumentasi": "tanggal kabupaten kampung judul_id title_en deskripsi_id description_en foto_drive_url caption_id caption_en".split(),
}
INFO_KEYS = {"periode_terbit", "diperbarui", "tahun", "nama_program"}
NUMBERS = {"capaian", "target", "jumlah_kegiatan", "total_peserta", "anak_laki_laki", "anak_perempuan", "dewasa_laki_laki", "dewasa_perempuan"}


def text(value):
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def records(name, values):
    if not values:
        raise ValueError(f"{name}: header missing")
    headers = [text(v) for v in values[0]]
    required = set(SCHEMA[name])
    if name != "info":
        required.add("status_verifikasi")
    if name == "dokumentasi":
        required.add("izin_publikasi")
    if not required.issubset(headers) or len(set(headers)) != len(headers):
        raise ValueError(f"{name}: unexpected header")
    return [dict(zip(headers, row)) for row in values[1:]]


def safe_row(name, row):
    if name == "info":
        if text(row.get("kunci", "")) not in INFO_KEYS:
            return None
    elif text(row.get("status_verifikasi", "")) != "VERIFIED":
        return None
    if name == "dokumentasi" and text(row.get("izin_publikasi", "")) != "YA":
        return None
    result = {key: text(row.get(key, "")) for key in SCHEMA[name]}
    mandatory = {
        "target": ["tahun", "kabupaten", "kategori", "kelompok", "jenis_kelamin", "target"],
        "penerima_manfaat": SCHEMA["penerima_manfaat"],
        "kegiatan": ["periode", "tanggal", "minggu", "kabupaten", "kampung", "output", "jenis_kegiatan", "jumlah_kegiatan"],
        "indikator": ["level", "kode", "indikator", "satuan", "tahun", "target", "capaian"],
        "dokumentasi": ["tanggal", "kabupaten", "kampung", "judul_id"],
    }
    if any(not result[k] for k in mandatory.get(name, [])):
        raise ValueError(f"{name}: incomplete approved row")
    for key, value in result.items():
        if value.startswith("#") and value.endswith(("!", "?")):
            raise ValueError(f"{name}: formula error")
        if key in NUMBERS and value:
            try:
                number = float(value)
                if not (0 <= number < float("inf")):
                    raise ValueError()
            except ValueError:
                raise ValueError(f"{name}: invalid numeric field") from None
        if key == "tanggal" and value:
            raw = row[key]
            if isinstance(raw, (int, float)):
                result[key] = (date(1899, 12, 30) + timedelta(days=raw)).isoformat()
            else:
                try:
                    result[key] = date.fromisoformat(value).isoformat()
                except ValueError:
                    raise ValueError(f"{name}: invalid date") from None
    if name in {"penerima_manfaat", "kegiatan"}:
        if not result["tanggal"] or not result["kabupaten"] or not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", result["periode"]):
            raise ValueError(f"{name}: incomplete approved row")
        if result["periode"] != result["tanggal"][:7]:
            raise ValueError(f"{name}: period does not match date")
    if name == "dokumentasi":
        # Photo URLs are intentionally omitted: internal Drive resources stay private.
        result["foto_drive_url"] = ""
    return result


def make_exports(raw):
    exports = {}
    for name in SCHEMA:
        rows = [result for row in records(name, raw[name]) if (result := safe_row(name, row)) is not None]
        if name == "info":
            metadata = {r["kunci"]: r["nilai"] for r in rows}
            if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", metadata.get("periode_terbit", "")) or not re.fullmatch(r"\d{4}", metadata.get("tahun", "")):
                raise ValueError("info: invalid release period or year")
        output = io.StringIO(newline="")
        writer = csv.DictWriter(output, fieldnames=SCHEMA[name], lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
        exports[name + ".csv"] = output.getvalue()
    return exports


def fetch_values():
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2.service_account import Credentials
    secret = os.environ.get("GOOGLE_SHEETS_SERVICE_ACCOUNT", "")
    if not secret:
        raise ValueError("GOOGLE_SHEETS_SERVICE_ACCOUNT secret has not been configured")
    credentials = Credentials.from_service_account_info(json.loads(secret), scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"])
    with AuthorizedSession(credentials) as session:
        ranges = [f"'{name}'!A5:S" for name in SCHEMA]
        response = session.get(f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values:batchGet", params=[("ranges", r) for r in ranges] + [("valueRenderOption", "UNFORMATTED_VALUE")], timeout=60)
        if response.status_code != 200:
            raise ValueError(f"Google Sheets request failed (HTTP {response.status_code}); check read access")
        values = response.json()["valueRanges"]
        if len(values) != len(SCHEMA):
            raise ValueError("Google Sheets returned incomplete ranges")
        return {name: value.get("values", []) for name, value in zip(SCHEMA, values)}


def main():
    exports = make_exports(fetch_values())  # Validate every tab before writing any file.
    directory = Path(__file__).resolve().parents[1] / "data"
    directory.mkdir(exist_ok=True)
    changed = 0
    for name, content in exports.items():
        path = directory / name
        if not path.exists() or path.read_text(encoding="utf-8") != content:
            path.write_text(content, encoding="utf-8")
            changed += 1
    print(f"Sync complete: {changed} public files changed.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Do not emit raw API bodies, credentials or private source values.
        print(f"Sync failed: {error if type(error) is ValueError else type(error).__name__}", file=sys.stderr)
        sys.exit(1)
