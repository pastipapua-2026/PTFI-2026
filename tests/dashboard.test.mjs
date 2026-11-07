import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const ctx = vm.createContext({crypto: globalThis.crypto, atob, TextEncoder, TextDecoder, Uint8Array, Date, Math, JSON, Number, String, Intl});
vm.runInContext(readFileSync(new URL('../assets/logic.js', import.meta.url), 'utf8'), ctx);
const WU = ctx.WU;
const A = (id, kab, mulai, status, o = {}) => ({id, kab, nama: 'Kegiatan ' + id, mulai, selesai: '', output: 'Output 1.2', lokasi: 'Atuka', status, hasil: '', foto: false, dh: false, ...o});

test('minggu Senin–Minggu sama dengan sheet Weekly Update (W45 = Minggu ke-1 November 2026)', () => {
  const w = WU.weekInfo('2026-11-02');
  assert.equal(w.label, 'Minggu ke-1 November 2026');
  assert.equal(w.range, '2–8 November 2026');
  assert.equal(w.w, 45);
  assert.equal(WU.weekInfo('2026-10-26').range, '26 Oktober – 1 November 2026');
  assert.equal(WU.monday('2026-11-08'), '2026-11-02');
});

test('aturan status sama dengan scripts/sync_weekly.py', () => {
  const cases = {'Selesai': 'selesai', 'Sedang Diimplementasikan': 'berjalan', 'Pending': 'tertunda', 'Belum selesai': 'rencana', 'Batal': 'batal',
    'Dihapus dari rencana': 'batal', 'Rencana': 'rencana', '': 'kosong', 'Lainnya': 'lain'};
  for (const [t, k] of Object.entries(cases)) assert.equal(WU.stKey(t), k, t);
});

test('agregasi: batal tidak dihitung aktif, lewat jadwal dan tindak lanjut tidak dobel', () => {
  const acts = [A('1', 'Mimika', '2026-11-03', 'Selesai', {foto: true, dh: true}), A('2', 'Mimika', '2026-11-04', 'Pending'),
    A('3', 'Mimika', '2026-11-05', 'Batal'), A('4', 'Mimika', '2026-11-09', 'Rencana'), A('5', 'Mimika', '2026-11-04', 'Selesai')];
  const g = WU.aggregate(WU.inWeek(acts, '2026-11-02'), '2026-11-07');
  assert.equal(g.total, 4); assert.equal(g.aktif, 3); assert.equal(g.selesai, 2);
  assert.equal(g.lewat, 1); assert.equal(g.tl, 1); assert.equal(g.selesaiLengkap, 1);
  assert.equal(WU.defaultWeek(acts, '2026-11-07'), '2026-11-02');
});

test('highlight otomatis: angka dari data, kabupaten tanpa kegiatan diberi keterangan', () => {
  const acts = [A('MIM-1', 'Mimika', '2026-11-03', 'Selesai', {foto: true, dh: true}), A('ASM-1', 'Asmat', '2026-11-04', 'Pending')];
  const byKab = {}; WU.KAB.forEach(k => { byKab[k] = WU.aggregate(acts.filter(a => a.kab === k), '2026-11-07'); });
  const c = {acts, byKab, agg: WU.sumAgg(WU.KAB.map(k => byKab[k])), today: '2026-11-07', btt: null, mttRows: [], nextByKab: {}};
  const p = WU.hlProgram(c).map(h => h.t).join(' | ');
  assert.match(p, /1 dari 2 kegiatan terjadwal minggu ini sudah selesai \(50%\)/);
  assert.match(p, /Perlu tindak lanjut: 1 kegiatan tertunda atau lewat jadwal \(Asmat 1\)/);
  assert.match(WU.hlKab(c, 'Nabire')[0].t, /Belum ada kegiatan terjadwal/);
  assert.match(WU.hlKab(c, 'Mimika')[0].t, /^1 kegiatan minggu ini: 1 selesai\.$/);
  assert.match(WU.hlKab(c, 'Asmat').map(h => h.t).join(' '), /Perlu tindak lanjut: Kegiatan ASM-1 \(lewat jadwal\)/);
});

test('narasi highlight memakai Hasil Kegiatan dan jumlah peserta terpilah, tanpa mengulang kalimat peserta', () => {
  const acts = [A('ASM-1', 'Asmat', '2026-11-02', 'Selesai', {lokasi: 'Warse', hasil: 'Edukasi dengan metode KAP. Peserta antusias.', peserta: {l: 41, p: 3, t: 44, src: 'kolom'}}),
    A('MIM-4', 'Mimika', '2026-11-06', 'Selesai', {lokasi: 'Omawita', hasil: 'Laki-laki: 3 orang, Perempuan: 14 orang. Materi gizi kehamilan.', peserta: {l: 3, p: 14, t: 17, src: 'teks'}}),
    A('NAB-1', 'Nabire', '2026-11-05', 'Rencana')];
  const byKab = {}; WU.KAB.forEach(k => { byKab[k] = WU.aggregate(acts.filter(a => a.kab === k), '2026-11-07'); });
  const agg = WU.sumAgg(WU.KAB.map(k => byKab[k]));
  assert.equal(agg.pesT, 61); assert.equal(agg.pesL, 44); assert.equal(agg.pesP, 17);
  const H = WU.hlProgram({acts, byKab, agg, today: '2026-11-07', btt: null, mttRows: [], nextByKab: {}});
  const txt = H.map(h => (h.b ? h.b + ' ' : '') + h.t);
  assert.ok(txt.some(t => /^Peserta minggu ini: 61 kehadiran \(laki-laki 44, perempuan 17\)/.test(t)));
  assert.equal(txt.find(t => t.startsWith('Asmat ·')), 'Asmat · Kegiatan ASM-1 (Warse, 2 Nov) 44 peserta (laki-laki 41, perempuan 3). Edukasi dengan metode KAP.');
  assert.equal(txt.find(t => t.startsWith('Mimika ·')), 'Mimika · Kegiatan MIM-4 (Omawita, 6 Nov) 17 peserta (laki-laki 3, perempuan 14). Materi gizi kehamilan.');
  assert.ok(!txt.some(t => /dokumentasi lengkap/i.test(t)));
});

test('folder dokumentasi per minggu; baris tanpa tanggal hanya untuk minggu terbaru', () => {
  const L = [{minggu: '2026-11-02', id: 'A', judul: 'Week 1 November'}, {minggu: '', id: 'B', judul: 'terbaru'}];
  assert.equal(WU.dokFor(L, '2026-11-02', '2026-11-09').id, 'A');
  assert.equal(WU.dokFor(L, '2026-11-09', '2026-11-09').id, 'B');
  assert.equal(WU.dokFor(L, '2026-10-26', '2026-11-09'), null);
});

test('MTT: status mengikuti aturan > 90%, baris rincian tidak diberi persen buatan', () => {
  const mtt = {tahun: 2026, indikator: [{kode: 'IOP 2.1.1', tipe: 'Indikator'}, {kode: 'IOP 1.4.1', tipe: 'Indikator'}, {kode: 'IOP 1.3.2 (D)', tipe: 'Denominator'}],
    ytd: {'11': [{kode: 'IOP 2.1.1', target: {v: 21}, capaian: {v: 433}, pct: {v: 20.62}}, {kode: 'IOP 1.4.1', target: {v: 6}, capaian: {v: 0}, pct: {v: 0}},
      {kode: 'IOP 1.3.2 (D)', target: {v: 2773}, capaian: {v: 2773}, pct: {v: null}}]}};
  assert.equal(WU.mttMonth(mtt, 12), 11);
  const r = WU.mttRows(mtt, 11);
  assert.deepEqual(r.map(x => x.st), ['ok', 'bad', 'rincian']);
  assert.equal(r[2].p, null);
});

test('data terenkripsi dari Python bisa dibuka dengan kode akses (tanpa beda huruf besar/kecil)', async () => {
  const env = JSON.parse(readFileSync(new URL('./fixtures/uji.enc.json', import.meta.url), 'utf8'));
  assert.deepEqual(JSON.parse(JSON.stringify(await WU.decrypt(env, ' uji2026 '))), {uji: 'Mimika', angka: 3909});
  await assert.rejects(WU.decrypt(env, 'SALAH'));
});

test('file data yang dipublikasikan tidak memuat teks biasa', () => {
  const raw = readFileSync(new URL('../data/weekly-update.enc.json', import.meta.url), 'utf8');
  const env = JSON.parse(raw);
  assert.deepEqual(Object.keys(env).sort(), ['c', 'i', 'it', 'kdf', 's', 'v']);
  for (const w of ['Mimika', 'Nabire', 'Posyandu', 'partisipan', 'Indikator', 'Kegiatan']) assert.ok(!raw.includes(w), w);
});
