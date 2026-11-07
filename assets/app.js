/* =====================================================================
   PASTI-Papua · Weekly Update PTFI — tampilan
   Data: data/weekly-update.enc.json (terenkripsi; dibuat otomatis oleh scripts/sync_weekly.py)
   Desain: PASTI-Papua Dashboard Design System (assets/dashboard.css)
   ===================================================================== */
'use strict';
const { KAB, BLN, BLN3, iso, addDays, monday, weekInfo, stKey, ST_LABEL, isLate, weeksOf, defaultWeek, inWeek, aggregate, aggFromSnapshot, sumAgg,
  bttLastMonth, bttWindow, mttMonth, mttRows, MTT_ST, hlProgram, hlKab, fN, fP, monthLabel } = WU;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KAMPUNG = { Mimika: 11, Nabire: 7, Asmat: 4 };
const KAB_C = { Mimika: 'var(--or)', Nabire: 'var(--or2)', Asmat: 'var(--ink)' };
const srcTag = t => `<span class="src"><i></i>${esc(t)}</span>`;
const dShort = s => { if (!s) return '–'; const d = WU.parse(s); return `${d.getDate()} ${BLN3[d.getMonth()]}`; };
const TODAY = iso(new Date());

let D = null;
const ST = { sec: 'cover', week: null, kab: 'Semua', bttM: 'u', anim: null, mob: innerWidth < 720 };
const SECTIONS = [{ id: 'cover', t: 'Sampul' }, { id: 'ringkasan', t: 'Ringkasan' }, { id: 'kegiatan', t: 'Kegiatan' }, { id: 'partisipan', t: 'Partisipan' }, { id: 'indikator', t: 'Capaian indikator' }, { id: 'penutup', t: 'Penutup' }];
const NUM = id => (id === 'cover' || id === 'penutup') ? 0 : SECTIONS.findIndex(s => s.id === id);

/* ---------------- akses ---------------- */
let wrong = 0, lockUntil = 0;
async function unlock(e) {
  e.preventDefault();
  const err = $('#gErr'), btn = $('#gBtn'), inp = $('#gCode');
  if (Date.now() < lockUntil) return;
  btn.disabled = true; err.textContent = 'Membuka…';
  let env;
  try { const r = await fetch('data/weekly-update.enc.json', { cache: 'no-store' }); if (!r.ok) throw new Error(); env = await r.json(); }
  catch { err.textContent = 'Data belum bisa dimuat. Buka lewat GitHub Pages atau server lokal (npm run dev), bukan dari file langsung.'; btn.disabled = false; return; }
  try { D = await WU.decrypt(env, inp.value); }
  catch {
    btn.disabled = false; wrong++;
    if (wrong >= 3) { wrong = 0; lockUntil = Date.now() + 30000; lockTick(); } else err.textContent = `Kode akses salah (sisa ${3 - wrong} percobaan).`;
    return;
  }
  inp.value = ''; $('#gate').remove(); document.body.classList.remove('locked');
  document.querySelectorAll('[inert]').forEach(el => el.removeAttribute('inert'));
  start();
}
function lockTick() {
  const rem = Math.ceil((lockUntil - Date.now()) / 1000), btn = $('#gBtn'), err = $('#gErr');
  if (!btn) return;
  if (rem > 0) { btn.disabled = true; err.textContent = `Terlalu banyak percobaan. Coba lagi dalam ${rem} detik.`; setTimeout(lockTick, 1000); }
  else { btn.disabled = false; err.textContent = ''; }
}

/* ---------------- data turunan ---------------- */
const ACTS = () => (D.weekly && D.weekly.kegiatan) || [];
const SNAP = () => D.weekly && D.weekly.snapshot;
function weekList() {
  const w = new Set(weeksOf(ACTS())); const s = SNAP(); if (s && s.minggu) w.add(s.minggu);
  return [...w].sort().reverse();
}
function ctx() {
  const W = weekInfo(ST.week), acts = ACTS(), snap = SNAP(), live = acts.length > 0;
  const wActs = live ? inWeek(acts, W.mon) : null;
  const useSnap = !live && snap && snap.minggu === W.mon;
  const byKab = {};
  KAB.forEach(k => { byKab[k] = live ? aggregate(wActs.filter(a => a.kab === k), TODAY) : useSnap ? aggFromSnapshot(snap.per_kab[k] || {}) : aggFromSnapshot({}); });
  const agg = sumAgg(KAB.map(k => byKab[k]));
  const prev = live ? aggregate(inWeek(acts, addDays(W.mon, -7)), TODAY) : null;
  const nextMon = addDays(W.mon, 7), nextEnd = addDays(W.mon, 13);
  const next = live ? inWeek(acts, nextMon).map(a => ({ tanggal: a.mulai, kab: a.kab, nama: a.nama, lokasi: a.lokasi, output: a.output }))
    : useSnap ? (snap.agenda || []).filter(a => a.tanggal >= nextMon && a.tanggal <= nextEnd) : [];
  const nextByKab = {}; next.forEach(a => { nextByKab[a.kab] = (nextByKab[a.kab] || 0) + 1; });
  const mtt = D.mtt, mWanted = W.y > mtt.tahun ? 12 : W.y < mtt.tahun ? 1 : W.m, mMonth = mttMonth(mtt, mWanted);
  const rows = mMonth ? mttRows(mtt, mMonth) : [];
  return { W, live, useSnap, acts: wActs, byKab, agg, prev, next, nextByKab, btt: D.btt, mttRows: rows, mttMonth: mMonth, mttYear: mtt.tahun, today: TODAY,
    perhatian: useSnap ? (snap.perhatian || []) : null };
}

/* ---------------- komponen ---------------- */
const hlList = H => `<ul class="hl">${H.map(h => `<li class="${h.k}">${esc(h.t)}</li>`).join('')}</ul>`;
const kpi = (lab, val, c, lead = false, extra = '') => `<div class="panel kpi${lead ? ' lead' : ''}"><div class="lab">${lab}</div><div class="val num">${val}</div>${extra}<div class="ctx">${c}</div></div>`;
function sexBlock(l, p, x) {
  const t = (l || 0) + (p || 0); if (!t) return '<div class="nodata">Pemilahan jenis kelamin belum ada</div>';
  return `<div class="sexbar"><span class="m" style="width:${l / t * 100}%"></span><span class="f" style="width:${p / t * 100}%"></span></div>
    <div class="split"><span><span class="sw" style="background:var(--male)"></span>L <b>${fN(l)}</b></span><span><span class="sw" style="background:var(--female)"></span>P <b>${fN(p)}</b></span>${x ? `<span>Belum diketahui <b>${fN(x)}</b></span>` : ''}</div>`;
}
const pbar = p => `<div class="pbar"><div class="t"><span style="width:${Math.min(100, (p || 0) * 100)}%"></span></div><b>${fP(p)}</b></div>`;
function stBadge(a) {
  const k = stKey(a.status), cls = { selesai: 'b-ok', berjalan: 'b-warn', tertunda: 'b-bad' }[k] || 'b-mute';
  return `<span class="badge ${cls}">${esc(k === 'lain' ? a.status : ST_LABEL[k])}</span>${isLate(a, TODAY) ? ' <span class="badge b-bad">Lewat jadwal</span>' : ''}`;
}
const note = (title, items) => items.length ? `<details class="note"><summary>${title}</summary><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul></details>` : '';
function weekBar(withKab) {
  const ws = weekList(), i = ws.indexOf(ST.week), W = weekInfo(ST.week);
  const chips = withKab ? `<div class="chips" role="group" aria-label="Kabupaten">${['Semua', ...KAB].map(k => `<button class="chip" data-kab="${k}" aria-pressed="${ST.kab === k}">${k}</button>`).join('')}</div>` : '';
  return `<div class="panel fbar"><div class="fb-l"><span class="fb-lab">Minggu laporan</span>
    <div class="wk-nav"><button class="arr sm" data-wk="${ws[i + 1] || ''}" ${ws[i + 1] ? '' : 'disabled'} aria-label="Minggu sebelumnya">‹</button>
    <div class="wk-l"><b>${esc(W.label)}</b><span>${esc(W.range)} · W${W.w}</span></div>
    <button class="arr sm" data-wk="${ws[i - 1] || ''}" ${i > 0 ? '' : 'disabled'} aria-label="Minggu berikutnya">›</button></div></div>${chips}</div>`;
}
function snapNotice(c) {
  if (c.live) return '';
  const s = SNAP();
  return `<div class="notice"><b>Snapshot ${esc(dShort(s && s.dibaca))} 2026.</b> Angka kegiatan diambil dari ${esc(s ? s.sumber : 'tab Dashboard')}. Daftar kegiatan per baris dan highlight lengkap tampil otomatis setelah sinkron Google Sheets aktif.</div>`;
}

/* ---------------- grafik SVG ---------------- */
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => f <= x) || 10) * e; }
function barChart(cats, series, o = {}) {
  const W = ST.mob ? 360 : 1100, H = ST.mob ? 230 : 280, pl = ST.mob ? 34 : 46, pr = 10, pt = 22, pb = 30;
  const tot = cats.map((_, i) => series.reduce((s, x) => s + (x.v[i] || 0), 0)), mx = niceMax(Math.max(1, ...tot) * 1.1);
  const gw = (W - pl - pr) / cats.length, bw = Math.min(ST.mob ? 16 : 34, gw * .62), y = v => pt + (H - pt - pb) * (1 - v / mx);
  const every = Math.ceil(cats.length / (ST.mob ? 6 : 13));
  const grid = [0, .5, 1].map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(mx * t)}" y2="${y(mx * t)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(mx * t)}" text-anchor="end" dominant-baseline="central" font-size="11" fill="var(--faint)">${fN(mx * t)}</text>`).join('');
  const bars = cats.map((c, i) => {
    const x0 = pl + gw * i + (gw - bw) / 2; let acc = 0;
    const seg = series.map(s => { const v = s.v[i] || 0; if (!v) return ''; const y1 = y(acc + v), h = y(acc) - y1; acc += v; return `<rect x="${x0}" y="${y1}" width="${bw}" height="${Math.max(0, h)}" fill="${s.c}"><title>${esc(c)} · ${esc(s.n)}: ${fN(v)}</title></rect>`; }).join('');
    const lab = tot[i] && (!ST.mob || i % 2 === cats.length % 2 || i === cats.length - 1) ? `<text x="${x0 + bw / 2}" y="${y(tot[i]) - 6}" text-anchor="middle" font-size="${ST.mob ? 9.5 : 11}" font-weight="700" fill="var(--ink)">${fN(tot[i])}</text>` : '';
    const zero = !tot[i] && o.zeroLabel ? `<text x="${x0 + bw / 2}" y="${y(0) - 6}" text-anchor="middle" font-size="10" fill="var(--faint)">0</text>` : '';
    return seg + lab + zero + (i % every === 0 || i === cats.length - 1 ? `<text x="${x0 + bw / 2}" y="${H - 9}" text-anchor="middle" font-size="${ST.mob ? 9.5 : 11}" fill="var(--mut)">${esc(c)}</text>` : '');
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${grid}${bars}</svg>`;
}
function lineChart(cats, lines, o = {}) {
  const W = ST.mob ? 360 : 1100, H = ST.mob ? 230 : 260, pl = ST.mob ? 30 : 40, pr = ST.mob ? 16 : 24, pt = 24, pb = 30;
  const mx = o.max || niceMax(Math.max(1, ...lines.flatMap(l => l.v.filter(v => v != null))) * 1.15);
  const x = i => pl + (W - pl - pr) * (cats.length < 2 ? .5 : i / (cats.length - 1)), y = v => pt + (H - pt - pb) * (1 - v / mx);
  const grid = [0, .5, 1].map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(mx * t)}" y2="${y(mx * t)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(mx * t)}" text-anchor="end" dominant-baseline="central" font-size="11" fill="var(--faint)">${fN(mx * t)}</text>`).join('');
  const L = lines.map(l => {
    const pts = l.v.map((v, i) => v == null ? null : [x(i), y(v), v]).filter(Boolean);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const last = pts[pts.length - 1];
    return `<path d="${d}" fill="none" stroke="${l.c}" stroke-width="${l.dash ? 2 : 2.5}" ${l.dash ? 'stroke-dasharray="4 4"' : ''} stroke-linejoin="round"/>` +
      pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${l.dash ? 'var(--card)' : l.c}" stroke="${l.dash ? l.c : 'var(--card)'}" stroke-width="2"><title>${esc(l.n)}: ${fN(p[2])}</title></circle>`).join('') +
      (last ? `<text x="${last[0]}" y="${last[1] - 10}" text-anchor="end" font-size="11" font-weight="700" fill="${l.c}">${esc(l.n)} ${fN(last[2])}</text>` : '');
  }).join('');
  const xl = cats.map((c, i) => `<text x="${x(i)}" y="${H - 9}" text-anchor="middle" font-size="${ST.mob ? 9.5 : 11}" fill="${o.hi === i ? 'var(--or)' : 'var(--mut)'}" font-weight="${o.hi === i ? 800 : 400}">${esc(c)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${grid}${xl}${L}</svg>`;
}

/* ---------------- halaman ---------------- */
function renderCover() {
  const W = weekInfo(ST.week);
  return `<div class="cover"><div><div class="k">Weekly Update · PT Freeport Indonesia</div></div>
    <div><h2>PASTI&#8209;Papua</h2><p class="acr">Partnership to Accelerate Stunting Reduction in Indonesia – Papua</p></div>
    <div class="per"><div><div class="lab">Minggu laporan</div><div class="m">${esc(W.label)}</div><div class="cv-r">${esc(W.range)} · W${W.w}</div></div><div class="loc">Mimika, Nabire, dan Asmat</div></div></div>`;
}
function renderPenutup() {
  const W = weekInfo(ST.week);
  return `<div class="cover closing"><div><div class="k">Penutup</div></div>
    <div><h2>Terima kasih</h2><p class="acr">Sesi tanya jawab</p></div>
    <div class="per"><div><div class="lab">PASTI-Papua · Weekly Update</div><div class="m sm">${esc(W.label)}</div></div><div class="loc">Mimika, Nabire, dan Asmat</div></div></div>`;
}

function renderRingkasan() {
  const c = ctx(), a = c.agg, k = D.btt.kpi;
  const R = c.mttRows.filter(r => !r.det && r.st !== 'na'), ok = R.filter(r => r.st === 'ok');
  const head = `<div class="ph"><div><h2>Ringkasan minggu ini</h2><div class="sub">${esc(c.W.label)} · ${esc(c.W.range)}</div></div>${srcTag('Sumber: Weekly Update · BTT Rekap · MTT Y26')}</div>`;
  const kp = `<div class="kpis k4">
    ${kpi('Kegiatan minggu ini', fN(a.total), KAB.map(x => `${x} <b>${fN(c.byKab[x].total)}</b>`).join(' · '), true)}
    ${kpi('Kegiatan selesai', `${fN(a.selesai)} <small>/ ${fN(a.aktif)}</small>`, `<b>${fP(a.pct)}</b> dari kegiatan aktif${a.tl ? ` · <b>${fN(a.tl)}</b> perlu tindak lanjut` : ''}`)}
    ${kpi('Partisipan unik (BTT)', fN(k.u), esc((D.btt.cakupan || '').split('·')[0].trim()), false, sexBlock(k.l, k.p))}
    ${kpi('Indikator MTT tercapai', `${fN(ok.length)} <small>/ ${fN(R.length)}</small>`, `s.d. ${BLN[c.mttMonth - 1]} ${c.mttYear} · capaian &gt; 90% target`)}</div>`;
  const prog = `<div class="panel"><div class="panel-h"><h3>Highlight seluruh wilayah program</h3><span class="meta">disusun otomatis dari data minggu ini</span></div><div class="panel-b">${hlList(hlProgram(c))}</div></div>`;
  const kabs = `<div class="row r-3">${KAB.map(x => {
    const g = c.byKab[x];
    return `<div class="panel kab-card"><div class="panel-h"><h3>${x}</h3><span class="meta">${KAMPUNG[x]} kampung dampingan</span></div><div class="panel-b">
      <div class="kab-mini"><div class="k"><span>Selesai</span><b>${fN(g.selesai)} <small>/ ${fN(g.aktif)}</small></b></div><div class="annbar"><span style="width:${Math.min(100, (g.pct || 0) * 100)}%"></span></div></div>
      ${hlList(hlKab(c, x))}</div></div>`;
  }).join('')}</div>`;
  const rules = ['Kegiatan masuk ke minggu laporan berdasarkan Tanggal Mulai di Weekly Update (minggu Senin–Minggu).',
    '"Selesai" dihitung dari kegiatan aktif (tanpa status Batal). "Lewat jadwal" = tanggal sudah lewat tetapi status belum Selesai.',
    'Dokumentasi lengkap = link foto dan link daftar hadir sama-sama terisi.',
    'Partisipan unik mengikuti cakupan filter di tab Dashboard BTT Rekap. Indikator MTT tercapai bila capaian lebih dari 90% target (aturan Summary_26).'];
  return head + `<div class="stack-y">${weekBar(false)}${snapNotice(c)}${kp}${prog}${kabs}</div>` + note('Cara highlight disusun', rules.map(esc));
}

function renderKegiatan() {
  const c = ctx(), a = c.agg;
  const head = `<div class="ph"><div><h2>Kegiatan minggu ini</h2><div class="sub">${esc(c.W.label)} · ${esc(c.W.range)}</div></div>${srcTag('Sumber: Weekly Update · tab Mimika, Nabire, Asmat')}</div>`;
  const kp = `<div class="kpis k4">${kpi('Kegiatan terjadwal', fN(a.total), 'berdasarkan Tanggal Mulai', true)}
    ${kpi('Selesai', fN(a.selesai), `<b>${fP(a.pct)}</b> dari kegiatan aktif`)}
    ${kpi('Masih berjalan', fN(a.berjalan), `${fN(a.rencana)} masih rencana · ${fN(a.kosong)} belum diupdate`)}
    ${kpi('Perlu tindak lanjut', fN(a.tl), `${fN(a.tertunda)} tertunda · ${fN(a.lewat)} lewat jadwal`)}</div>`;
  const rows = KAB.map(x => { const g = c.byKab[x]; return `<tr><td class="lead"><b>${x}</b></td><td class="r" data-l="Kegiatan">${fN(g.total)}</td><td class="r" data-l="Selesai">${fN(g.selesai)}</td><td class="r" data-l="Berjalan">${fN(g.berjalan)}</td><td class="r" data-l="Tertunda">${fN(g.tertunda)}</td><td class="r" data-l="Lewat jadwal">${fN(g.lewat)}</td><td class="r" data-l="% selesai">${pbar(g.pct)}</td></tr>`; }).join('');
  const prog = `<div class="panel"><div class="panel-h"><h3>Progres per kabupaten</h3><span class="meta">${esc(c.W.range)}</span></div><div class="panel-b tw">
    <table class="stack prog-t"><thead><tr><th>Kabupaten</th><th class="r">Kegiatan</th><th class="r">Selesai</th><th class="r">Berjalan</th><th class="r">Tertunda</th><th class="r">Lewat jadwal</th><th class="r">% selesai</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td class="lead">Total</td><td class="r" data-l="Kegiatan">${fN(a.total)}</td><td class="r" data-l="Selesai">${fN(a.selesai)}</td><td class="r" data-l="Berjalan">${fN(a.berjalan)}</td><td class="r" data-l="Tertunda">${fN(a.tertunda)}</td><td class="r" data-l="Lewat jadwal">${fN(a.lewat)}</td><td class="r" data-l="% selesai">${pbar(a.pct)}</td></tr></tfoot></table></div></div>`;
  const dok = `<div class="panel"><div class="panel-h"><h3>Kelengkapan dokumentasi</h3><span class="meta">kegiatan selesai dengan foto dan daftar hadir</span></div><div class="panel-b"><div class="grps">
    ${KAB.map(x => { const g = c.byKab[x], p = g.selesai ? g.selesaiLengkap / g.selesai : null; return `<div class="grp"><span>${x}</span><div class="t"><span style="width:${(p || 0) * 100}%"></span></div><div class="v">${g.selesai ? `<b>${fN(g.selesaiLengkap)}</b> / ${fN(g.selesai)} selesai` : 'belum ada yang selesai'}</div></div>`; }).join('')}
    </div></div></div>`;
  let list;
  if (c.live) {
    const L = c.acts.filter(x => ST.kab === 'Semua' || x.kab === ST.kab).sort((p, q) => KAB.indexOf(p.kab) - KAB.indexOf(q.kab) || p.mulai.localeCompare(q.mulai) || p.id.localeCompare(q.id));
    const body = L.map(x => `<tr><td class="lead"><span class="code">${esc(x.id)}</span> ${esc(x.nama)}${x.lokasi ? `<div class="act-l">${esc(x.lokasi)}</div>` : ''}</td>
      <td data-l="Tanggal">${dShort(x.mulai)}${x.selesai && x.selesai !== x.mulai ? ` – ${dShort(x.selesai)}` : ''}</td><td data-l="Kabupaten">${x.kab}</td><td data-l="Output">${esc(x.output || '–')}</td>
      <td data-l="Status">${stBadge(x)}</td><td data-l="Hasil kegiatan">${x.hasil ? `<div class="ind-n hs" title="Klik untuk membaca lengkap">${esc(x.hasil)}</div>` : '<span class="dash">–</span>'}</td>
      <td data-l="Dokumentasi"><span class="doc ${x.foto ? 'y' : ''}">Foto</span> <span class="doc ${x.dh ? 'y' : ''}">Daftar hadir</span></td></tr>`).join('');
    list = `<div class="panel"><div class="panel-h"><h3>Daftar kegiatan</h3><span class="meta">${fN(L.length)} kegiatan${ST.kab !== 'Semua' ? ' · ' + ST.kab : ''}</span></div><div class="panel-b tw">
      ${L.length ? `<table class="stack act-t"><colgroup><col><col style="width:96px"><col style="width:84px"><col style="width:96px"><col style="width:130px"><col style="width:30%"><col style="width:112px"></colgroup>
      <thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Kabupaten</th><th>Output</th><th>Status</th><th>Hasil kegiatan</th><th>Dokumentasi</th></tr></thead><tbody>${body}</tbody></table>`
      : '<div class="empty"><b>Tidak ada kegiatan untuk pilihan ini.</b>Pilih minggu atau kabupaten lain.</div>'}</div></div>`;
  } else {
    const P = (c.perhatian || []).filter(x => ST.kab === 'Semua' || x.kab === ST.kab);
    list = `<div class="panel"><div class="panel-h"><h3>Daftar kegiatan</h3><span class="meta">menunggu sinkron</span></div><div class="panel-b">
      <div class="empty"><b>Daftar kegiatan per baris belum tersinkron.</b>Setelah secret Google Sheets diisi di GitHub, nama kegiatan, lokasi, status, hasil, dan kelengkapan dokumentasi dari tab Mimika, Nabire, dan Asmat tampil di sini.</div>
      ${P.length ? `<div class="tw"><table class="stack"><thead><tr><th>Kegiatan perlu tindak lanjut (snapshot)</th><th>Jadwal</th><th>Status</th></tr></thead><tbody>${P.map(x => `<tr><td class="lead"><span class="code">${esc(x.id)}</span> ${esc(x.nama)}</td><td data-l="Jadwal">${dShort(x.jadwal)}</td><td data-l="Status"><span class="badge b-bad">${esc(x.status)}</span> <span class="badge b-bad">${esc(x.alasan)}</span></td></tr>`).join('')}</tbody></table></div>` : ''}</div></div>`;
  }
  const nx = c.next.filter(x => ST.kab === 'Semua' || x.kab === ST.kab).sort((p, q) => p.tanggal.localeCompare(q.tanggal));
  const nW = weekInfo(addDays(c.W.mon, 7));
  const agenda = `<div class="panel"><div class="panel-h"><h3>Agenda minggu berikutnya</h3><span class="meta">${esc(nW.range)}</span></div><div class="panel-b tw">
    ${nx.length ? `<table class="stack"><thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Kabupaten</th><th>Output</th></tr></thead><tbody>${nx.map(x => `<tr><td class="lead">${esc(x.nama)}${x.lokasi ? `<div class="act-l">${esc(x.lokasi)}</div>` : ''}</td><td data-l="Tanggal">${dShort(x.tanggal)}</td><td data-l="Kabupaten">${x.kab}</td><td data-l="Output">${esc(x.output || '–')}</td></tr>`).join('')}</tbody></table>`
      : '<div class="empty"><b>Belum ada kegiatan terjadwal.</b>Kegiatan baru ditambahkan di Rencana Kerja Bulanan dan otomatis muncul di Weekly Update.</div>'}</div></div>`;
  const notes = [...(D.weekly.catatan || []).map(esc)];
  if (!c.live && SNAP() && SNAP().agenda_catatan) notes.push(esc(SNAP().agenda_catatan));
  notes.push('Kolom PIC, kendala/tindak lanjut, dan link Drive dari Weekly Update tidak dipublikasikan di laporan ini.');
  return head + `<div class="stack-y">${weekBar(true)}${snapNotice(c)}${kp}<div class="row r-57">${prog}${dok}</div>${list}${agenda}</div>` + note('Catatan data kegiatan', notes);
}

function renderPartisipan() {
  const B = D.btt, k = B.kpi, pf = B.per_file;
  const head = `<div class="ph"><div><h2>Partisipan (BTT)</h2><div class="sub">Cakupan: ${esc(B.cakupan || '–')}</div></div>${srcTag('Sumber: BTT Rekap · tab Dashboard')}</div>`;
  const kp = `<div class="kpis k4">${kpi('Partisipan unik', fN(k.u), 'orang · tiap orang dihitung satu kali', true, sexBlock(k.l, k.p, k.u - k.l - k.p))}
    ${kpi('Pelaksanaan kegiatan', fN(k.pel), 'kegiatan dengan minimal satu tanda hadir')}
    ${kpi('Total kehadiran', fN(k.hd), 'tanda hadir · satu orang bisa hadir berkali-kali')}
    ${kpi('Rata-rata keikutsertaan', fN(k.avg, 1), 'kegiatan per orang')}</div>`;
  const mxU = Math.max(1, ...KAB.map(x => pf[x].u));
  const perKab = `<div class="panel"><div class="panel-h"><h3>Per kabupaten</h3><span class="meta">file BTT asal data</span></div><div class="panel-b"><div class="grps">
    ${KAB.map(x => { const f = pf[x]; return `<div class="grp kb"><span>${x}<small>${fN(f.pel)} pelaksanaan · ${fN(f.hd)} kehadiran</small></span><div class="t"><span style="width:${f.u / mxU * 100}%"></span></div><div class="v"><b>${fN(f.u)}</b> unik${f.u ? ` · P ${fP(f.p / f.u)}` : ''}</div></div>`; }).join('')}
    </div></div></div>`;
  const mxA = Math.max(1, ...B.usia.map(r => r.t));
  const usia = `<div class="panel"><div class="panel-h"><h3>Kelompok usia</h3><span class="meta">partisipan unik</span></div><div class="panel-b"><div class="grps">
    ${B.usia.map(r => `<div class="grp sm"><span title="${esc(r.g)}">${esc(r.ket || r.g)}</span><div class="t"><span style="width:${r.t / mxA * 100}%"></span></div><div class="v"><b>${fN(r.t)}</b> ${fP(k.u ? r.t / k.u : null)}</div></div>`).join('')}
    </div></div></div>`;
  const nowMk = TODAY.slice(0, 7), Wd = bttWindow(B.bulanan, nowMk, ST.mob ? 8 : 14);
  const cats = Wd.map(r => { const [y, m] = r.m.split('-').map(Number); return `${BLN3[m - 1]} ${String(y).slice(2)}`; });
  const M = ST.bttM;
  const series = M === 'u' ? KAB.map(x => ({ n: x, c: KAB_C[x], v: Wd.map(r => r[x]) })) : [{ n: M === 'pel' ? 'Pelaksanaan' : 'Kehadiran', c: 'var(--or)', v: Wd.map(r => r[M]) }];
  const seg = `<div class="seg" role="group" aria-label="Ukuran">${[['u', 'Partisipan unik'], ['pel', 'Pelaksanaan'], ['hd', 'Kehadiran']].map(([v, l]) => `<button data-btt="${v}" aria-pressed="${M === v}">${l}</button>`).join('')}</div>`;
  const tren = `<div class="panel"><div class="panel-h"><h3>Tren bulanan</h3>${seg}</div><div class="panel-b">
    ${Wd.length ? `<div class="chart-wrap">${barChart(cats, series, { zeroLabel: true, aria: 'Tren bulanan BTT' })}</div>` : '<div class="empty"><b>Belum ada data bulanan.</b></div>'}
    ${M === 'u' ? `<div class="legend">${KAB.map(x => `<span><span class="sw" style="background:${KAB_C[x]}"></span>${x}</span>`).join('')}<span>Partisipan unik per bulan tidak dijumlahkan antarbulan (orang yang sama bisa hadir di beberapa bulan).</span></div>` : ''}</div></div>`;
  const oc = `<div class="panel"><div class="panel-h"><h3>Kegiatan menurut Outcome</h3><span class="meta">jumlah pelaksanaan</span></div><div class="panel-b tw"><table class="stack">
    <thead><tr><th>Outcome</th>${KAB.map(x => `<th class="r">${x}</th>`).join('')}<th class="r">Total</th><th class="r">Kehadiran</th></tr></thead>
    <tbody>${B.outcome.filter(r => r.pel || !/belum/i.test(r.o)).map(r => `<tr><td class="lead">${esc(r.o)}</td>${KAB.map(x => `<td class="r" data-l="${x}">${fN(r[x])}</td>`).join('')}<td class="r" data-l="Total"><b>${fN(r.pel)}</b></td><td class="r" data-l="Kehadiran">${fN(r.hd)}</td></tr>`).join('')}</tbody></table></div></div>`;
  const rc = B.recap || {};
  const recap = `<div class="panel"><div class="panel-h"><h3>Tanda hadir format BTT Recap</h3><span class="meta">Male/Female ≥18 tahun · Boys/Girls &lt;18 tahun</span></div><div class="panel-b tw"><table class="stack">
    <thead><tr><th>File BTT</th><th class="r">Male</th><th class="r">Female</th><th class="r">Boys</th><th class="r">Girls</th><th class="r">Tak terklasifikasi</th><th class="r">Total</th></tr></thead>
    <tbody>${KAB.filter(x => rc[x]).map(x => { const r = rc[x]; return `<tr><td class="lead">${x}</td><td class="r" data-l="Male">${fN(r.male)}</td><td class="r" data-l="Female">${fN(r.female)}</td><td class="r" data-l="Boys">${fN(r.boys)}</td><td class="r" data-l="Girls">${fN(r.girls)}</td><td class="r" data-l="Tak terklasifikasi">${fN(r.tk)}</td><td class="r" data-l="Total"><b>${fN(r.t)}</b></td></tr>`; }).join('')}</tbody></table></div></div>`;
  return head + `<div class="stack-y">${kp}<div class="row r-11">${perKab}${usia}</div>${tren}<div class="row r-11">${oc}${recap}</div></div>` + note('Catatan data BTT', bttNotes(B));
}
function bttNotes(B) {
  const f = [], k = B.kpi, pf = B.per_file, mov = B.mov || {};
  KAB.forEach(x => { const p = pf[x]; if (p && !p.u && p.hd) f.push(`${x}: partisipan unik tercatat 0 padahal ada ${fN(p.pel)} pelaksanaan dan ${fN(p.hd)} kehadiran pada cakupan ini. Periksa kolom Kabupaten dan tanggal partisipan di file BTT ${x}.`); });
  KAB.forEach(x => { const p = pf[x]; if (p && p.lain) f.push(`${x}: ${fN(p.lain)} partisipan di file BTT ${x} tercatat dengan kabupaten lain.`); });
  KAB.forEach(x => { const m = mov[x], p = pf[x]; if (m && !m.keg && p && p.pel) f.push(`${x}: "Kegiatan FY26" di bagian E tercatat 0 padahal ada ${fN(p.pel)} pelaksanaan. Kemungkinan nama sheet di file ${x} berbeda dengan yang dirujuk rumus Rekap.`); });
  const aid = KAB.reduce((s, x) => s + ((mov[x] || {}).aid || 0), 0), keg = KAB.reduce((s, x) => s + ((mov[x] || {}).keg || 0), 0);
  if (aid) f.push(`Activity ID belum diisi di ${fN(aid)} dari ${fN(keg)} kegiatan FY26.`);
  const x = k.u - k.l - k.p; if (x > 0) f.push(`Jenis kelamin belum diketahui untuk ${fN(x)} partisipan unik.`);
  const ua = B.usia.find(r => /belum/i.test(r.g)); if (ua && ua.t) f.push(`Usia kosong atau tidak baku untuk ${fN(ua.t)} partisipan unik (${fP(ua.t / k.u)}).`);
  const last = bttLastMonth(B.bulanan); if (last && last < TODAY.slice(0, 7)) f.push(`Data bulanan BTT terakhir terisi untuk ${monthLabel(last)}; bulan sesudahnya masih 0. Angka akan bertambah setelah tim menginput BTT bulan berjalan.`);
  if (B.cakupan && !/semua bulan/i.test(B.cakupan)) f.push(`Filter bulan di tab Dashboard BTT Rekap sedang aktif (${esc(B.cakupan)}).`);
  f.push('Laporan ini hanya membaca angka agregat dari tab Dashboard BTT Rekap. Data per orang di tab Database tidak dibaca.');
  return f.map(esc);
}

function fmtVal(r, v) {
  if (v == null || !isFinite(v)) return '–';
  return /percent/i.test(r.fmt || '') ? (v * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : fN(v, 1);
}
function renderIndikator() {
  const c = ctx(), m = c.mttMonth, rows = c.mttRows, R = rows.filter(r => !r.det && r.st !== 'na'), ok = R.filter(r => r.st === 'ok');
  const head = `<div class="ph"><div><h2>Capaian indikator output (MTT)</h2><div class="sub">Year-to-date s.d. ${BLN[m - 1]} ${c.mttYear}</div></div>${srcTag('Sumber: MTT_PASTI_Papua_Y26')}</div>`;
  const kp = `<div class="kpis">${kpi('Indikator tercapai', fP(R.length ? ok.length / R.length : null), 'capaian &gt; 90% target YTD', true)}
    ${kpi('Indikator ditargetkan', fN(R.length), `s.d. ${BLN[m - 1]} ${c.mttYear}`)}
    ${kpi('Tercapai', `${fN(ok.length)} <small>/ ${fN(R.length)}</small>`, `<b>${fN(R.length - ok.length)}</b> belum mencapai target`)}</div>`;
  const body = rows.map(r => {
    const [bc, bt] = MTT_ST[r.st];
    if (r.det) return `<tr class="det"><td class="lead"><span class="code">${esc(r.kode)}</span><div class="ind-n">${esc(r.nama)}</div></td><td class="r" data-l="Target">${fmtVal(r, r.target.v)}</td><td class="r" data-l="Capaian">${fmtVal(r, r.capaian.v)}</td><td class="r" data-l="% capaian">${r.p != null ? fP(r.p) : '–'}</td><td class="hide-sm"></td><td data-l="Status"><span class="badge ${bc}">${bt}</span></td></tr>`;
    return `<tr><td class="lead"><span class="code">${esc(r.kode)}</span><div class="ind-n" title="Klik untuk membaca lengkap">${esc(r.nama)}</div><div class="act-l">${esc(r.kalkulasi || '')} · ${esc(r.unit || '')}</div></td>
      <td class="r num" data-l="Target">${fmtVal(r, r.target.v)}</td><td class="r num" data-l="Capaian"><b>${fmtVal(r, r.capaian.v)}</b></td><td class="r num" data-l="% capaian">${fP(r.p)}</td>
      <td data-l="Progres"><div class="an-mini"><div class="annbar"><span style="width:${Math.min(100, (r.p || 0) * 100)}%"></span></div></div></td><td data-l="Status"><span class="badge ${bc}">${bt}</span></td></tr>`;
  }).join('');
  const tbl = `<div class="panel"><div class="panel-h"><h3>Indikator output</h3><span class="meta">target dan capaian YTD dari MTT</span></div><div class="panel-b tw">
    <table class="ind-t stack mtt-ind"><colgroup><col class="c-ind"><col class="c-n"><col class="c-n"><col class="c-n"><col class="c-an"><col class="c-st"></colgroup>
    <thead><tr><th>Indikator</th><th class="r">Target s.d. ${BLN3[m - 1]}</th><th class="r">Capaian s.d. ${BLN3[m - 1]}</th><th class="r">% capaian</th><th>Progres</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  const rk = D.mtt.rekap || [];
  const chart = `<div class="panel"><div class="panel-h"><h3>Indikator ditargetkan dan tercapai per bulan</h3><span class="meta">garis putus-putus = ditargetkan · garis oranye = tercapai</span></div><div class="panel-b"><div class="chart-wrap">
    ${lineChart(rk.map(r => BLN3[r.bulan - 1]), [{ n: 'Ditargetkan', c: 'var(--ink)', v: rk.map(r => r.target), dash: true }, { n: 'Tercapai', c: 'var(--or)', v: rk.map(r => r.tercapai) }], { hi: rk.findIndex(r => r.bulan === m), aria: 'Jumlah indikator ditargetkan dan tercapai per bulan' })}</div></div></div>`;
  return head + `<div class="stack-y">${kp}${tbl}${chart}</div>` + note('Catatan data MTT', mttNotes(rows));
}
function mttNotes(rows) {
  const f = [];
  rows.filter(r => !r.det && r.p != null && r.p > 3).forEach(r => f.push(`${r.kode}: capaian ${fmtVal(r, r.capaian.v)} dari target ${fmtVal(r, r.target.v)} (${fP(r.p)}). Target perlu dicek ulang terhadap Setting Target.`));
  rows.filter(r => !/percent/i.test(r.fmt || '') && r.target.v != null && !Number.isInteger(r.target.v)).forEach(r => f.push(`${r.kode}: target YTD berupa pecahan (${fmtVal(r, r.target.v)}).`));
  f.push(`Rekap per bulan: ${esc(D.mtt.rekap_sumber || '')}. Kalkulasi YTD mengikuti MTT: Highest = nilai bulanan tertinggi, Cumulative = jumlah bulanan.`);
  f.push('MTT tidak memuat capaian per kabupaten, sehingga capaian indikator ditampilkan untuk tingkat proyek.');
  return f.map(esc);
}

/* ---------------- kerangka: navigasi, tema, presentasi ---------------- */
const RND = { cover: renderCover, ringkasan: renderRingkasan, kegiatan: renderKegiatan, partisipan: renderPartisipan, indikator: renderIndikator, penutup: renderPenutup };
function render() {
  $('#tabs').innerHTML = SECTIONS.map(s => { const n = NUM(s.id); return `<button class="tab" role="tab" data-sec="${s.id}" aria-selected="${ST.sec === s.id}">${n ? `<span class="n">${n}</span>` : ''}${s.t}</button>`; }).join('');
  $('#main').innerHTML = SECTIONS.map(s => {
    let h = RND[s.id](); const k = NUM(s.id);
    if (k > 0) h = h.replace(/^<div class="ph"><div>([\s\S]*?<\/div>)<\/div>/, (m, inner) => `<div class="ph pg-head"><div class="pg-l"><span class="pg-num">${String(k).padStart(2, '0')}</span><div>${inner}</div></div>`);
    const anim = ST.sec === s.id && ST.anim ? ' anim-' + ST.anim : '';
    return `<section class="page ${ST.sec === s.id ? 'on' : ''}${anim}" id="p-${s.id}">${h}</section>`;
  }).join('');
  ST.anim = null;
  const i = SECTIONS.findIndex(s => s.id === ST.sec);
  $('#prev').disabled = i === 0; $('#next').disabled = i === SECTIONS.length - 1;
  $('#prev').textContent = i > 0 ? '‹ ' + SECTIONS[i - 1].t : ''; $('#next').textContent = i < SECTIONS.length - 1 ? SECTIONS[i + 1].t + ' ›' : '';
  const n = NUM(SECTIONS[i].id); $('#fsLab').textContent = `${n ? n + '. ' : ''}${SECTIONS[i].t}  (${i + 1}/${SECTIONS.length})`;
  $('#per').value = ST.week;
}
function setSec(id) { const f = SECTIONS.findIndex(s => s.id === ST.sec), t = SECTIONS.findIndex(s => s.id === id); if (f === t) return; ST.anim = t > f ? 'next' : 'prev'; ST.sec = id; render(); scrollTo({ top: 0 }); }
function step(d) { const i = SECTIONS.findIndex(s => s.id === ST.sec) + d; if (i >= 0 && i < SECTIONS.length) setSec(SECTIONS[i].id); }
function setWeek(w) { if (!w) return; ST.week = w; render(); }
function setTheme(t) { document.documentElement.dataset.theme = t; document.querySelectorAll('[data-theme-set]').forEach(b => { b.classList.toggle('on', b.dataset.themeSet === t); b.setAttribute('aria-pressed', b.dataset.themeSet === t); }); }
function startPresent() { ST.sec = 'cover'; document.body.classList.add('present'); render(); const el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); }
function stopPresent() { document.body.classList.remove('present'); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); render(); }

function start() {
  const ws = weekList(), s = SNAP();
  ST.week = ACTS().length ? defaultWeek(ACTS(), TODAY) : (s && s.minggu) || monday(TODAY);
  $('#per').innerHTML = ws.map(w => { const W = weekInfo(w); return `<option value="${w}">${W.label} (${W.range})</option>`; }).join('');
  const dib = D.dibuat ? new Date(D.dibuat) : null;
  $('#asof').textContent = `${D.mode === 'snapshot' ? 'Snapshot' : 'Data'} per ${dib ? dib.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + dib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jayapura' }) + ' WIT' : '–'} · Mimika · Nabire · Asmat`;
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  setTheme(matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#gForm').addEventListener('submit', unlock);
  $('#gCode').focus();
  $('#per').onchange = e => setWeek(e.target.value);
  document.querySelectorAll('[data-theme-set]').forEach(b => b.onclick = () => setTheme(b.dataset.themeSet));
  $('#prev').onclick = () => step(-1); $('#next').onclick = () => step(1); $('#fsPrev').onclick = () => step(-1); $('#fsNext').onclick = () => step(1);
  $('#present').onclick = startPresent; $('#fsExit').onclick = stopPresent; $('#print').onclick = () => print();
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('present')) { document.body.classList.remove('present'); render(); } });
  document.addEventListener('click', e => {
    if (!D) return;
    const t = e.target.closest('[data-sec],[data-wk],[data-kab],[data-btt],.ind-n'); if (!t) return;
    if (t.dataset.sec) setSec(t.dataset.sec);
    else if (t.dataset.wk !== undefined) setWeek(t.dataset.wk);
    else if (t.dataset.kab) { ST.kab = t.dataset.kab; render(); }
    else if (t.dataset.btt) { ST.bttM = t.dataset.btt; render(); }
    else t.classList.toggle('open');
  });
  document.addEventListener('keydown', e => {
    if (!D || e.target.matches('select,input,textarea')) return;
    if (e.key === 'Escape' && document.body.classList.contains('present')) { stopPresent(); return; }
    if (['ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); step(1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
  });
  addEventListener('resize', () => { const m = innerWidth < 720; if (D && m !== ST.mob) { ST.mob = m; render(); } });
});
