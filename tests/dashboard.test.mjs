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
  const p = WU.hlProgram(c).flatMap(x => x.items).map(h => h.t).join(' | ');
  assert.match(p, /1 dari 2 kegiatan terjadwal minggu ini sudah selesai \(50%\)/);
  assert.match(p, /Perlu tindak lanjut: 1 kegiatan tertunda atau lewat jadwal \(Asmat 1\)/);
  assert.match(WU.hlKab(c, 'Nabire')[0].t, /Belum ada kegiatan terjadwal/);
  assert.match(WU.hlKab(c, 'Mimika')[0].t, /^1 kegiatan minggu ini: 1 selesai\.$/);
  assert.match(WU.hlKab(c, 'Asmat').map(h => h.t).join(' '), /Perlu tindak lanjut: Kegiatan ASM-1 \(lewat jadwal\)/);
});

test('highlight: ringkasan semua kegiatan, per jenis kegiatan, dan hasil menonjol dari narasi', () => {
  const acts = [A('ASM-2', 'Asmat', '2026-11-06', 'Selesai', {nama: 'Temu Siklus - Rembuk Posyandu Siklus Hidup', lokasi: 'Warse',
      hasil: '- Dari 4 Kampung, 3 kampung telah siap mengimplementasikan Posyandu Siklus Hidup\n- Puskesmas berkomitmen akan memulai Posyandu Siklus Hidup mulai bulan Januari 2027'}),
    A('MIM-4', 'Mimika', '2026-11-03', 'Selesai', {nama: 'Monitoring posyandu Atuka', lokasi: 'Atuka', hasil: 'Bayi laki-laki: 14\nTotal hadir: 81 orang\nadanya PMT penyuluhan berbahan pangan lokal',
      peserta: {l: 27, p: 54, t: 81, src: 'teks'}}),
    A('NAB-2', 'Nabire', '2026-11-06', 'Selesai', {nama: 'Monitoring posyandu oleo', hasil: '20 baduta yang hadir\n(Laki-laki : 10  Perempuan : 10)', peserta: {l: 10, p: 10, t: 20, src: 'teks', grp: {baduta: 20}}})];
  const byKab = {}; WU.KAB.forEach(k => { byKab[k] = WU.aggregate(acts.filter(a => a.kab === k), '2026-11-07'); });
  const S = WU.hlProgram({acts, byKab, agg: WU.sumAgg(WU.KAB.map(k => byKab[k])), today: '2026-11-07', btt: null, mttRows: [], nextByKab: {}});
  const flat = sec => S.find(x => x.judul === sec).items.map(h => (h.b ? h.b + ' ' : '') + h.t);
  assert.match(S[0].items[1].t, /101 kehadiran \(laki-laki 37, perempuan 64\)/);
  assert.ok(flat('Per jenis kegiatan').some(t => /^Posyandu: 2 kegiatan \(2 selesai\) di Mimika, Nabire · 101 peserta .*termasuk 20 baduta/.test(t)));
  assert.ok(flat('Per jenis kegiatan').some(t => /^Koordinasi dan advokasi: 1 kegiatan/.test(t)));
  assert.equal(flat('Hasil yang menonjol')[0], 'Asmat · Temu Siklus - Rembuk Posyandu Siklus Hidup: Puskesmas berkomitmen akan memulai Posyandu Siklus Hidup mulai bulan Januari 2027');
});

test('poin Hasil: baris yang hanya berisi angka kehadiran tidak diulang di Hasil utama', () => {
  const h = '1. Sasaran yang Hadir\nBayi laki-laki: 14\nIbu hamil: 7\nUsia dewasa: perempuan 2, laki-laki 1\nTotal hadir: 81 orang\n2. adanya AoC yang memberikan Penyuluhan terkait ISPA';
  assert.deepEqual(JSON.parse(JSON.stringify(WU.mainPoints(h))), ['adanya AoC yang memberikan Penyuluhan terkait ISPA']);
  assert.deepEqual(JSON.parse(JSON.stringify(WU.hasilPoints('8 orang baduta yang hadir\n(Laki-laki : 5 Perempuan : 3)'))), ['8 orang baduta yang hadir (Laki-laki : 5 Perempuan : 3)']);
  for (const x of ['29 peserta hadir (L:1, P:28)', 'Baduta :13 orang L:10 P:3 Balita : 6 L:3 P:3', 'Peserta untuk Pria : 58 orang Wanita: 22 orang;']) assert.ok(WU.isCountLine(x), x);
  for (const x of ['1 anak 1T BB (Berat badan) naik sesuai target mingguan', 'Output 1.1.1, 1.1.3, dan 1.2.1 sudah direkap']) assert.ok(!WU.isCountLine(x), x);
});

test('filter BTT: periode, wilayah, jenis kelamin, kelompok usia', () => {
  const B = {kubus: {usia: ['Dewasa', '12-17.99 yo'], periode: [['all', 'Semua periode'], ['y2026', 'Tahun 2026'], ['m2026-08', '2026-08'], ['m2026-10', '2026-10']],
    p: {y2026: [['Mimika', 'L', 'Dewasa', 2, 5], ['Mimika', 'P', 'Dewasa', 3, 4], ['Nabire', 'P', '12-17.99 yo', 4, 4]], 'm2026-08': [['Mimika', 'P', 'Dewasa', 1, 1]], 'm2026-10': [['Nabire', 'P', '12-17.99 yo', 2, 2]]},
    k: {y2026: [['Mimika', 2, 9, 1, 1, 0, 0, 1, 2, 0, 0, 0], ['Nabire', 1, 4, 0, 0, 1, 0, 0, 0, 1, 2, 0]], 'm2026-08': [['Mimika', 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0]]}}};
  const v = (f) => WU.bttView(B, Object.assign({per: 'y2026', wil: 'Semua', jk: 'Semua', usia: 'Semua'}, f));
  assert.deepEqual([v({}).u, v({}).l, v({}).p, v({}).pel], [9, 2, 7, 3]);
  assert.deepEqual([v({wil: 'Mimika'}).u, v({wil: 'Mimika'}).pel], [5, 2]);
  assert.equal(v({wil: 'Mimika', jk: 'P'}).u, 3);
  assert.equal(v({usia: '12-17.99 yo'}).u, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(v({}).trend.map(r => r.m))), ['2026-08', '2026-09', '2026-10']);
  assert.equal(v({per: 'm2026-08', wil: 'Mimika'}).u, 1);
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
