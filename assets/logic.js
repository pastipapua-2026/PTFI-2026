/* =====================================================================
   PASTI-Papua · Weekly Update PTFI — logika data (tanpa DOM)
   Minggu laporan Senin–Minggu (sama dengan sheet Weekly Update: "Minggu ini: 2/11 – 8/11").
   Kegiatan masuk minggu berdasarkan Tanggal Mulai.
   Highlight disusun otomatis dari angka; tidak ada teks yang ditulis manual.
   ===================================================================== */
(function (g) {
  'use strict';
  const KAB = ['Mimika', 'Nabire', 'Asmat'];
  const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const monday = s => { const d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); };
  const fN = (v, dig = 0) => v == null || !isFinite(v) ? '–' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: dig });
  const fP = v => v == null || !isFinite(v) ? '–' : Math.round(v * 100) + '%';
  const monthLabel = mk => { const [y, m] = mk.split('-').map(Number); return `${BLN[m - 1]} ${y}`; };

  function isoWeek(s) {
    const d = parse(s); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const w1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
  }
  function fmtRange(a, b) {
    const A = parse(a), B = parse(b);
    if (A.getFullYear() !== B.getFullYear()) return `${A.getDate()} ${BLN[A.getMonth()]} ${A.getFullYear()} – ${B.getDate()} ${BLN[B.getMonth()]} ${B.getFullYear()}`;
    if (A.getMonth() !== B.getMonth()) return `${A.getDate()} ${BLN[A.getMonth()]} – ${B.getDate()} ${BLN[B.getMonth()]} ${B.getFullYear()}`;
    return `${A.getDate()}–${B.getDate()} ${BLN[B.getMonth()]} ${B.getFullYear()}`;
  }
  /* Minggu ke-n mengikuti bulan hari Senin-nya: 2–8 Nov 2026 = Minggu ke-1 November 2026 (W45) */
  function weekInfo(mon) {
    const d = parse(mon), end = addDays(mon, 6);
    return { mon, end, n: Math.ceil(d.getDate() / 7), m: d.getMonth() + 1, y: d.getFullYear(), w: isoWeek(mon),
      label: `Minggu ke-${Math.ceil(d.getDate() / 7)} ${BLN[d.getMonth()]} ${d.getFullYear()}`, range: fmtRange(mon, end) };
  }

  /* status Weekly Update → kunci tetap. Urutan aturan sama dengan scripts/sync_weekly.py */
  const RULES = [['batal', /batal|cancel|dihapus/], ['tertunda', /pending|tunda|terkendala|kendala|mundur|delay|hambat/], ['rencana', /belum/],
    ['selesai', /selesai|done|complete|terlaksana|tuntas/], ['berjalan', /sedang|berjalan|implement|proses|progress|ongoing/], ['rencana', /rencana|plan|jadwal/]];
  function stKey(s) { const l = String(s || '').trim().toLowerCase(); if (!l) return 'kosong'; for (const [k, re] of RULES) if (re.test(l)) return k; return 'lain'; }
  const ST_LABEL = { selesai: 'Selesai', berjalan: 'Berjalan', tertunda: 'Tertunda', rencana: 'Rencana', kosong: 'Belum diupdate', batal: 'Batal', lain: 'Lainnya' };
  const endOf = a => a.selesai && a.selesai >= a.mulai ? a.selesai : a.mulai;
  /* lewat jadwal = tanggal (selesai, atau mulai bila kosong) sudah lewat, status belum Selesai/Batal */
  const isLate = (a, today) => !!a.mulai && endOf(a) < today && !['selesai', 'batal'].includes(stKey(a.status));

  const weeksOf = acts => [...new Set(acts.filter(a => a.mulai).map(a => monday(a.mulai)))].sort();
  function defaultWeek(acts, today) {
    const ws = weeksOf(acts), cur = monday(today);
    if (ws.includes(cur)) return cur;
    const past = ws.filter(w => w <= cur);
    return past.length ? past[past.length - 1] : (ws[0] || cur);
  }
  const inWeek = (acts, mon) => { const end = addDays(mon, 6); return acts.filter(a => a.mulai >= mon && a.mulai <= end); };

  function aggregate(acts, today) {
    const o = { total: acts.length, selesai: 0, berjalan: 0, tertunda: 0, rencana: 0, kosong: 0, batal: 0, lain: 0, lewat: 0, tl: 0, foto: 0, dh: 0, lengkap: 0, selesaiBelumLengkap: 0,
      pesL: 0, pesP: 0, pesT: 0, pesN: 0, pesTanpaJK: 0 };
    acts.forEach(a => {
      const pe = a.peserta;
      if (pe && pe.t) { o.pesN++; o.pesT += pe.t; o.pesL += pe.l || 0; o.pesP += pe.p || 0; if (pe.l == null && pe.p == null) o.pesTanpaJK += pe.t; }
      const k = stKey(a.status); o[k]++;
      if (isLate(a, today)) o.lewat++;
      if (k === 'tertunda' || isLate(a, today)) o.tl++;
      if (a.foto) o.foto++; if (a.dh) o.dh++;
      if (a.foto && a.dh) o.lengkap++; else if (k === 'selesai') o.selesaiBelumLengkap++;
    });
    o.aktif = o.total - o.batal;
    o.pct = o.aktif ? o.selesai / o.aktif : null;
    o.selesaiLengkap = acts.filter(a => stKey(a.status) === 'selesai' && a.foto && a.dh).length;
    return o;
  }
  /* snapshot (sebelum sinkron pertama): angka per kabupaten dari tab Dashboard Weekly Update */
  function aggFromSnapshot(s) {
    const o = Object.assign({ total: 0, selesai: 0, berjalan: 0, tertunda: 0, rencana: 0, kosong: 0, batal: 0, lain: 0, lewat: 0, foto: 0, dh: 0, lengkap: 0, selesaiBelumLengkap: 0 }, s);
    o.aktif = o.total - o.batal; o.pct = o.aktif ? o.selesai / o.aktif : null;
    if (s.tl == null) o.tl = Math.max(o.tertunda, o.lewat);
    if (o.selesaiLengkap == null) o.selesaiLengkap = Math.max(0, o.selesai - o.selesaiBelumLengkap);
    return o;
  }
  function sumAgg(list) {
    const o = {}; list.forEach(a => Object.keys(a).forEach(k => { if (typeof a[k] === 'number') o[k] = (o[k] || 0) + a[k]; }));
    o.pct = o.aktif ? o.selesai / o.aktif : null; return o;
  }
  function topCount(values) {
    const c = {}; values.filter(Boolean).forEach(v => { c[v] = (c[v] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }
  /* jumlah peserta satu kegiatan: "30 peserta (laki-laki 27, perempuan 3)" */
  function pesText(pe) {
    if (!pe || !pe.t) return '';
    const jk = [pe.l != null ? `laki-laki ${fN(pe.l)}` : '', pe.p != null ? `perempuan ${fN(pe.p)}` : ''].filter(Boolean).join(', ');
    return `${fN(pe.t)} peserta${jk ? ` (${jk})` : ''}`;
  }
  /* kalimat pertama Hasil Kegiatan, dipotong rapi */
  function firstSentence(s, max = 220) {
    const t = String(s || '').replace(/\s+/g, ' ').trim(); if (!t) return '';
    const m = t.match(/^.{20,}?[.!?](\s|$)/); let o = m ? m[0].trim() : t;
    if (o.length > max) o = o.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
    return o;
  }
  const dShortId = s => { const d = parse(s); return `${d.getDate()} ${BLN3[d.getMonth()]}`; };
  /* kegiatan yang dijadikan narasi: selesai dan punya hasil/peserta; urut jumlah peserta lalu tanggal */
  const narrSort = acts => acts.filter(a => stKey(a.status) === 'selesai' && (a.hasil || (a.peserta && a.peserta.t)))
    .sort((x, y) => ((y.peserta && y.peserta.t) || 0) - ((x.peserta && x.peserta.t) || 0) || x.mulai.localeCompare(y.mulai));
  function narr(a, withKab) {
    const head = `${withKab ? a.kab + ' · ' : ''}${a.nama}`;
    const meta = [a.lokasi && !a.nama.toLowerCase().includes(a.lokasi.toLowerCase()) ? a.lokasi : '', dShortId(a.mulai)].filter(Boolean).join(', ');
    /* kalimat jumlah peserta di Hasil tidak diulang di narasi (sudah tampil sebagai angka) */
    const hasil = String(a.hasil || '').replace(/\b(?:peserta\s+)?(?:laki[\s-]*laki|perempuan|total|keseluruhan|jumlah peserta)\b\s*[:=]?\s*\d{1,4}\s*(?:orang)?\s*[,.;]?/gi, ' ').replace(/^[\s,.;:–-]+/, '');
    const pt = pesText(a.peserta), hs = firstSentence(hasil);
    return { k: 'ok', b: `${head} (${meta})`, t: [pt ? pt.charAt(0).toUpperCase() + pt.slice(1) + '.' : '', hs].filter(Boolean).join(' ') || 'Selesai.' };
  }
  function pesSummary(g) {
    if (!g.pesN) return null;
    const jk = g.pesL || g.pesP ? ` (laki-laki ${fN(g.pesL)}, perempuan ${fN(g.pesP)}${g.pesTanpaJK ? `, ${fN(g.pesTanpaJK)} belum dipilah` : ''})` : '';
    return `${fN(g.pesT)} kehadiran${jk} dari ${fN(g.pesN)} kegiatan yang mencatat jumlah peserta.`;
  }
  const listText = (arr, n = 3) => arr.length <= n ? arr.join(', ') : `${arr.slice(0, n).join(', ')}, dan ${arr.length - n} lainnya`;
  const nm = a => a.lokasi && !a.nama.toLowerCase().includes(a.lokasi.toLowerCase()) ? `${a.nama} (${a.lokasi})` : a.nama;

  /* ---------------- BTT ---------------- */
  const bttLastMonth = rows => { const r = (rows || []).filter(x => x.pel > 0 || x.hd > 0); return r.length ? r[r.length - 1].m : null; };
  function bttWindow(rows, nowMk, n = 12) {
    const last = bttLastMonth(rows); if (!last) return [];
    const stop = nowMk > last ? nowMk : last;
    const all = rows.filter(r => r.m <= stop);
    const i = all.findIndex(r => r.m === last);
    return all.slice(Math.max(0, i - n + 1 + (stop > last ? all.filter(r => r.m > last).length : 0)));
  }

  /* ---------------- MTT ---------------- */
  function mttMonth(mtt, wanted) {
    const have = Object.keys(mtt.ytd || {}).map(Number).sort((a, b) => a - b);
    if (!have.length) return null;
    const le = have.filter(m => m <= wanted);
    return le.length ? le[le.length - 1] : have[0];
  }
  function mttRows(mtt, month) {
    const info = Object.fromEntries((mtt.indikator || []).map(i => [i.kode, i]));
    return (mtt.ytd[String(month)] || []).map(r => {
      const i = info[r.kode] || { kode: r.kode, tipe: 'Indikator', nama: '' };
      const det = !/^indik/i.test(i.tipe || 'Indikator');
      const t = r.target.v || 0, a = r.capaian.v || 0, p = r.pct.v != null ? r.pct.v : (!det && t ? a / t : null);
      const st = det ? 'rincian' : !t ? 'na' : p > 0.9 ? 'ok' : a > 0 ? 'warn' : 'bad';
      return Object.assign({}, i, r, { p, st, det });
    });
  }
  const MTT_ST = { ok: ['b-ok', 'Tercapai'], warn: ['b-warn', 'Belum tercapai'], bad: ['b-bad', 'Belum ada capaian'], na: ['b-mute', 'Tidak ditargetkan'], rincian: ['b-mute', 'Rincian'] };

  /* ---------------- highlight otomatis ---------------- */
  function hlProgram(c) {
    const H = [], t = c.agg, kabs = KAB.filter(k => c.byKab[k] && c.byKab[k].total);
    if (!t.total) H.push({ k: 'info', t: 'Belum ada kegiatan dengan Tanggal Mulai di minggu ini pada Weekly Update.' });
    else {
      H.push({ k: 'ok', t: `${fN(t.selesai)} dari ${fN(t.aktif)} kegiatan terjadwal minggu ini sudah selesai (${fP(t.pct)}), di ${kabs.length} kabupaten: ${kabs.map(k => `${k} ${c.byKab[k].total}`).join(', ')}.` + (t.berjalan ? ` ${fN(t.berjalan)} kegiatan masih berjalan.` : '') });
      const ps = pesSummary(t);
      if (ps) H.push({ k: 'info', b: 'Peserta minggu ini:', t: ps + ' Satu orang bisa hadir di lebih dari satu kegiatan.' });
      if (c.acts) narrSort(c.acts).slice(0, c.nNarr || 4).forEach(a => H.push(narr(a, true)));
      if (t.tl) H.push({ k: 'warn', t: `Perlu tindak lanjut: ${fN(t.tl)} kegiatan tertunda atau lewat jadwal (${KAB.filter(k => c.byKab[k] && c.byKab[k].tl).map(k => `${k} ${c.byKab[k].tl}`).join(', ')}).` });
    }
    if (c.btt && c.btt.kpi) {
      const k = c.btt.kpi, last = bttLastMonth(c.btt.bulanan);
      H.push({ k: 'info', t: `BTT mencatat ${fN(k.u)} partisipan unik (cakupan ${(c.btt.cakupan || '').split('·')[0].replace(/\s*\(.*\)\s*$/, '').trim() || 'rekap'}), ${fP(k.u ? k.p / k.u : null)} perempuan, dari ${fN(k.pel)} pelaksanaan kegiatan dan ${fN(k.hd)} kehadiran.` + (last ? ` Data bulanan BTT terakhir terisi untuk ${monthLabel(last)}.` : '') });
    }
    if (c.mttRows && c.mttRows.length) {
      const R = c.mttRows.filter(r => !r.det && r.st !== 'na'), ok = R.filter(r => r.st === 'ok'), below = R.filter(r => r.st !== 'ok').sort((a, b) => (a.p || 0) - (b.p || 0));
      H.push({ k: ok.length === R.length ? 'ok' : 'warn', t: `MTT s.d. ${BLN[c.mttMonth - 1]} ${c.mttYear}: ${ok.length} dari ${R.length} indikator output tercapai (capaian > 90% target).` + (below.length ? ` Capaian terendah: ${below[0].kode} (${fP(below[0].p)}).` : '') });
    }
    return H;
  }

  function hlKab(c, kab) {
    const H = [], a = c.byKab[kab];
    if (!a || !a.total) H.push({ k: 'info', t: 'Belum ada kegiatan terjadwal minggu ini.' });
    else {
      const parts = [`${fN(a.selesai)} selesai`];
      if (a.berjalan) parts.push(`${fN(a.berjalan)} berjalan`);
      if (a.tertunda) parts.push(`${fN(a.tertunda)} tertunda`);
      if (a.rencana) parts.push(`${fN(a.rencana)} masih rencana`);
      if (a.kosong) parts.push(`${fN(a.kosong)} belum diupdate`);
      H.push({ k: a.selesai ? 'ok' : 'info', t: `${fN(a.total)} kegiatan minggu ini: ${parts.join(', ')}.` });
      const ps = pesSummary(a); if (ps) H.push({ k: 'info', t: ps });
      const acts = c.acts ? c.acts.filter(x => x.kab === kab) : null;
      if (acts) {
        narrSort(acts).slice(0, 2).forEach(x => H.push(narr(x, false)));
        const fu = acts.filter(x => stKey(x.status) === 'tertunda' || isLate(x, c.today));
        if (fu.length) H.push({ k: 'warn', t: `Perlu tindak lanjut: ${listText(fu.map(x => `${x.nama} (${isLate(x, c.today) ? 'lewat jadwal' : ST_LABEL[stKey(x.status)].toLowerCase()})`), 2)}.` });
      } else if (a.tl) H.push({ k: 'warn', t: `${fN(a.tl)} kegiatan tertunda atau lewat jadwal` + (c.perhatian && c.perhatian.length ? `: ${listText(c.perhatian.filter(x => x.kab === kab).map(x => `${x.nama} (${x.alasan.toLowerCase()})`), 2)}.` : '.') });
    }
    const f = c.btt && c.btt.per_file && c.btt.per_file[kab];
    if (f) {
      if (!f.u && f.hd) H.push({ k: 'warn', t: `BTT ${kab}: ${fN(f.pel)} pelaksanaan dan ${fN(f.hd)} kehadiran tercatat, tetapi partisipan unik belum terhitung di rekap BTT.` });
      else H.push({ k: 'info', t: `BTT ${kab}: ${fN(f.u)} partisipan unik, ${fN(f.pel)} pelaksanaan kegiatan, ${fN(f.hd)} kehadiran.` });
    }
    if (c.nextByKab && c.nextByKab[kab]) H.push({ k: 'info', t: `Minggu berikutnya: ${fN(c.nextByKab[kab])} kegiatan terjadwal.` });
    return H;
  }

  async function decrypt(env, code) {
    const b = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0)), C = g.crypto.subtle;
    const base = await C.importKey('raw', new TextEncoder().encode(String(code).trim().toUpperCase()), 'PBKDF2', false, ['deriveKey']);
    const key = await C.deriveKey({ name: 'PBKDF2', salt: b(env.s), iterations: env.it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return JSON.parse(new TextDecoder().decode(await C.decrypt({ name: 'AES-GCM', iv: b(env.i) }, key, b(env.c))));
  }

  /* folder dokumentasi minggu terpilih: baris dengan tanggal di minggu itu; baris tanpa tanggal dipakai untuk minggu terbaru */
  function dokFor(list, mon, latestMon) {
    const L = list || [];
    return L.find(d => d.minggu === mon) || (mon === latestMon ? L.find(d => !d.minggu) : null) || null;
  }

  g.WU = { decrypt, pesText, firstSentence, narrSort, dokFor, KAB, BLN, BLN3, pad, iso, parse, addDays, monday, isoWeek, fmtRange, weekInfo, stKey, ST_LABEL, isLate, endOf, weeksOf, defaultWeek, inWeek,
    aggregate, aggFromSnapshot, sumAgg, topCount, listText, bttLastMonth, bttWindow, mttMonth, mttRows, MTT_ST, hlProgram, hlKab, fN, fP, monthLabel };
})(typeof globalThis !== 'undefined' ? globalThis : this);
