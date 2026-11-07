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
const ST = { sec: 'cover', week: null, kab: 'Semua', bttM: 'u', dokV: 'grid', bf: { per: '', wil: 'Semua', jk: 'Semua', usia: 'Semua' }, anim: null, mob: innerWidth < 720 };
const SECTIONS = [{ id: 'cover', t: 'Sampul' }, { id: 'ringkasan', t: 'Ringkasan' }, { id: 'kegiatan', t: 'Kegiatan' }, { id: 'dokumentasi', t: 'Dokumentasi' }, { id: 'partisipan', t: 'Partisipan' }, { id: 'indikator', t: 'Capaian indikator' }, { id: 'penutup', t: 'Penutup' }];
/* logo Wahana Visi Indonesia: berkas assets/logo-wvi.png; bila belum ada, tampil nama organisasi */
let LOGO_OK = null; /* dicek sekali saat halaman dibuka */
const ORG = cls => `<span class="org ${cls || ''}${LOGO_OK ? '' : ' nologo'}">${LOGO_OK ? '<img src="./assets/logo-wvi.png" alt="Wahana Visi Indonesia">' : ''}<span class="org-txt">Wahana Visi Indonesia</span></span>`;
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
const hlList = H => `<ul class="hl">${H.map(h => `<li class="${h.k}">${h.b ? `<b>${esc(h.b)}</b> ` : ''}${esc(h.t)}</li>`).join('')}</ul>`;
const kpi = (lab, val, c, lead = false, extra = '') => `<div class="panel kpi${lead ? ' lead' : ''}"><div class="lab">${lab}</div><div class="val num">${val}</div>${extra}<div class="ctx">${c}</div></div>`;
function sexBlock(l, p, x) {
  const t = (l || 0) + (p || 0); if (!t) return '<div class="nodata">Pemilahan jenis kelamin belum ada</div>';
  return `<div class="sexbar"><span class="m" style="width:${l / t * 100}%"></span><span class="f" style="width:${p / t * 100}%"></span></div>
    <div class="split"><span><span class="sw" style="background:var(--male)"></span>L <b>${fN(l)}</b></span><span><span class="sw" style="background:var(--female)"></span>P <b>${fN(p)}</b></span>${x ? `<span>Belum diketahui <b>${fN(x)}</b></span>` : ''}</div>`;
}
function pesKpi(g, live) {
  if (!live) return kpi('Peserta hadir', '–', 'tampil setelah sinkron aktif');
  return kpi('Peserta hadir', fN(g.pesT), `kehadiran di ${fN(g.pesN)} kegiatan${g.pesTanpaJK ? ` · ${fN(g.pesTanpaJK)} belum dipilah` : ''}`, false, g.pesT ? sexBlock(g.pesL, g.pesP) : '');
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
  if (c.live && D.mode === 'snapshot') return `<div class="notice"><b>Data awal per ${esc(dShort((SNAP() || {}).dibaca || ''))} 2026.</b> Kegiatan dibaca dari file Weekly Update yang diunggah. Setelah sinkron Google Sheets aktif, laporan diperbarui otomatis kira-kira tiap 30 menit.</div>`;
  if (c.live) return '';
  const s = SNAP();
  return `<div class="notice"><b>Snapshot ${esc(dShort(s && s.dibaca))} 2026.</b> Angka kegiatan diambil dari ${esc(s ? s.sumber : 'tab Dashboard')}. Daftar kegiatan, hasil kegiatan, dan jumlah peserta per kegiatan tampil otomatis setelah sinkron Google Sheets aktif.</div>`;
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
  return `<div class="cover"><div class="cv-top"><div class="k">Weekly Update · PT Freeport Indonesia</div>${ORG('cv-org')}</div>
    <div><h2>PASTI&#8209;Papua</h2><p class="acr">Partnership to Accelerate Stunting Reduction in Indonesia – Papua</p></div>
    <div class="per"><div><div class="lab">Minggu laporan</div><div class="m">${esc(W.label)}</div><div class="cv-r">${esc(W.range)} · W${W.w}</div></div><div class="loc">Mimika, Nabire, dan Asmat</div></div></div>`;
}
function renderPenutup() {
  const W = weekInfo(ST.week);
  return `<div class="cover closing"><div class="cv-top"><div class="k">Penutup</div>${ORG('cv-org')}</div>
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
    ${pesKpi(a, c.live)}
    ${kpi('Partisipan unik (BTT)', fN(k.u), esc((D.btt.cakupan || '').split('·')[0].trim()), false, sexBlock(k.l, k.p))}</div>`;
  const secs = hlProgram(Object.assign({ nNarr: 4 }, c));
  const prog = `<div class="panel"><div class="panel-h"><h3>Highlight minggu ini</h3><span class="meta">ringkasan dari semua kegiatan dan hasilnya</span></div><div class="panel-b hl-secs">
    ${secs.map(x => `<div class="hl-sec">${x.judul ? `<h4>${esc(x.judul)}</h4>` : ''}${hlList(x.items)}</div>`).join('')}</div></div>`;
  const tbl = c.live ? hasilTable(c.acts.filter(a => ['selesai', 'berjalan'].includes(stKey(a.status))), { ringkas: true }) : '';
  const kabs = `<div class="row r-3">${KAB.map(x => {
    const g = c.byKab[x];
    return `<div class="panel kab-card"><div class="panel-h"><h3>${x}</h3><span class="meta">${KAMPUNG[x]} kampung dampingan</span></div><div class="panel-b">
      <div class="kab-mini"><div class="k"><span>Selesai</span><b>${fN(g.selesai)} <small>/ ${fN(g.aktif)}</small></b></div><div class="annbar"><span style="width:${Math.min(100, (g.pct || 0) * 100)}%"></span></div></div>
      ${hlList(hlKab(c, x))}</div></div>`;
  }).join('')}</div>`;
  const rules = ['Kegiatan masuk ke minggu laporan berdasarkan Tanggal Mulai di Weekly Update (minggu Senin–Minggu).',
    '"Selesai" dihitung dari kegiatan aktif (tanpa status Batal). "Lewat jadwal" = tanggal sudah lewat tetapi status belum Selesai.',
    'Per jenis kegiatan: kegiatan dikelompokkan dari nama kegiatan (Posyandu, PMT dan pemulihan gizi, Pelatihan, Edukasi, Koordinasi dan advokasi, Pendampingan kader, Manajemen dan MEAL).',
    'Hasil yang menonjol: dari setiap kegiatan Selesai atau Berjalan dipilih satu poin Hasil Kegiatan yang memuat komitmen, kesepakatan, rujukan, kenaikan/penurunan, kesiapan, atau perubahan. Poin yang hanya berisi angka kehadiran tidak dipilih.',
    'Jumlah peserta disaring dari narasi Hasil Kegiatan: angka berlabel laki-laki/pria/L dan perempuan/wanita/P (ibu hamil dan ibu nifas dihitung perempuan), total dari "Total/Jumlah … N" atau "N peserta", atau jumlah baduta/balita/bayi. Bila kolom Peserta Laki-laki/Perempuan/Total diisi, kolom yang dipakai. Total yang tidak sama dengan laki-laki + perempuan diberi tanda cek.',
    'Jumlah peserta adalah kehadiran: satu orang bisa hadir di beberapa kegiatan.',
    'Partisipan unik mengikuti cakupan filter di tab Dashboard BTT Rekap. Indikator MTT tercapai bila capaian lebih dari 90% target (aturan Summary_26).'];
  return head + `<div class="stack-y">${weekBar(false)}${snapNotice(c)}${kp}${prog}${tbl}${kabs}</div>` + note('Cara highlight disusun', rules.map(esc));
}

function pesCell(pe) {
  if (!pe || !pe.t) return '<span class="dash">belum diisi</span>';
  const jk = [pe.l != null ? `L ${fN(pe.l)}` : '', pe.p != null ? `P ${fN(pe.p)}` : ''].filter(Boolean).join(' · ');
  return `<div class="pes"><b class="pes-t">${fN(pe.t)}</b>${jk ? `<div class="act-l">${jk}</div>` : '<div class="act-l">belum dipilah</div>'}${pe.src === 'teks' ? '<span class="src-t" title="Dibaca dari teks Hasil Kegiatan; isi kolom peserta untuk angka resmi">dari teks</span>' : ''}</div>`;
}
/* tabel hasil kegiatan: Total, laki-laki, perempuan hasil penyaringan narasi + poin hasil */
function hasilTable(L, o = {}) {
  if (!L.length) return '';
  const n = v => v == null ? '<span class="dash">–</span>' : fN(v);
  const body = KAB.filter(k => L.some(x => x.kab === k)).map(k => {
    const X = L.filter(x => x.kab === k).sort((p, q) => p.mulai.localeCompare(q.mulai) || p.id.localeCompare(q.id)), g = aggregate(X, TODAY);
    return `<tr class="grp-h"><td class="lead" colspan="${o.ringkas ? 5 : 7}">Kab. ${k}<span>${fN(X.length)} kegiatan${g.pesT ? ` · ${fN(g.pesT)} peserta (L ${fN(g.pesL)} · P ${fN(g.pesP)})` : ''}</span></td></tr>` +
      X.map((x, i) => { const pe = x.peserta || {}, pts = o.ringkas ? WU.mainPoints(x.hasil, 3) : WU.hasilPoints(x.hasil);
        const cek = pe.cek ? `<span class="src-t" title="${esc(pe.cek)}">cek angka</span>` : '';
        return `<tr>${o.ringkas ? '' : `<td class="no hide-sm">${i + 1}</td>`}<td class="lead"><span class="code">${esc(x.id)}</span> ${esc(x.nama)}
          <div class="act-l">${[x.lokasi, dShort(x.mulai) + (x.selesai && x.selesai !== x.mulai ? ' – ' + dShort(x.selesai) : ''), o.ringkas ? '' : x.output].filter(Boolean).map(esc).join(' · ')}${x.tgl_asli ? ` <span class="src-t" title="Di sheet tertulis ${esc(x.tgl_asli)}; disesuaikan dengan kolom Bulan">tanggal disesuaikan</span>` : ''}</div>
          ${x.nama_rencana && !o.ringkas ? `<div class="act-l">Rencana: ${esc(x.nama_rencana)}</div>` : ''}</td>
          <td class="r pes-n" data-l="Total peserta"><b>${n(pe.t)}</b>${cek}</td><td class="r pes-n" data-l="Laki-laki">${n(pe.l)}</td><td class="r pes-n" data-l="Perempuan">${n(pe.p)}</td>
          <td data-l="Hasil kegiatan">${pts.length ? `<ul class="hasil-ul${o.ringkas ? '' : ' clamp'}">${pts.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : x.hasil ? '<span class="dash">Hasil hanya mencatat jumlah kehadiran (lihat kolom peserta)</span>' : '<span class="dash">belum diisi</span>'}</td>
          ${o.ringkas ? '' : `<td data-l="Status">${stBadge(x)}</td>`}</tr>`; }).join('');
  }).join('');
  const head = o.ringkas ? '<tr><th>Kegiatan</th><th class="r">Total</th><th class="r">L</th><th class="r">P</th><th>Hasil utama</th></tr>'
    : '<tr><th class="hide-sm">No</th><th>Nama kegiatan</th><th class="r">Total</th><th class="r">L</th><th class="r">P</th><th>Hasil kegiatan</th><th>Status</th></tr>';
  const cols = o.ringkas ? '<col style="width:30%"><col style="width:64px"><col style="width:52px"><col style="width:52px"><col>'
    : '<col style="width:34px"><col style="width:25%"><col style="width:64px"><col style="width:52px"><col style="width:52px"><col><col style="width:124px">';
  return `<div class="panel"><div class="panel-h"><h3>${o.ringkas ? 'Hasil kegiatan minggu ini' : 'Daftar kegiatan dan hasil'}</h3><span class="meta">jumlah peserta disaring dari narasi Hasil Kegiatan${o.ringkas ? ' · kegiatan selesai dan berjalan' : ' · klik hasil untuk membaca lengkap'}</span></div>
    <div class="panel-b tw"><table class="stack act-t hasil-t${o.ringkas ? ' ringkas' : ''}"><colgroup>${cols}</colgroup><thead>${head}</thead><tbody>${body}</tbody></table></div></div>`;
}
function renderKegiatan() {
  const c = ctx(), a = c.agg;
  const head = `<div class="ph"><div><h2>Kegiatan minggu ini</h2><div class="sub">${esc(c.W.label)} · ${esc(c.W.range)}</div></div>${srcTag('Sumber: Weekly Update · tab Mimika, Nabire, Asmat')}</div>`;
  const kp = `<div class="kpis k4">${kpi('Kegiatan terjadwal', fN(a.total), 'berdasarkan Tanggal Mulai', true)}
    ${kpi('Selesai', fN(a.selesai), `<b>${fP(a.pct)}</b> dari kegiatan aktif · ${fN(a.berjalan)} berjalan`)}
    ${pesKpi(a, c.live)}
    ${kpi('Perlu tindak lanjut', fN(a.tl), `${fN(a.tertunda)} tertunda · ${fN(a.lewat)} lewat jadwal`)}</div>`;
  const rows = KAB.map(x => { const g = c.byKab[x]; return `<tr><td class="lead"><b>${x}</b></td><td class="r" data-l="Kegiatan">${fN(g.total)}</td><td class="r" data-l="Selesai">${fN(g.selesai)}</td><td class="r" data-l="Berjalan">${fN(g.berjalan)}</td><td class="r" data-l="Tertunda">${fN(g.tertunda)}</td><td class="r" data-l="Lewat jadwal">${fN(g.lewat)}</td><td class="r" data-l="% selesai">${pbar(g.pct)}</td></tr>`; }).join('');
  const prog = `<div class="panel"><div class="panel-h"><h3>Progres per kabupaten</h3><span class="meta">${esc(c.W.range)}</span></div><div class="panel-b tw">
    <table class="stack prog-t"><thead><tr><th>Kabupaten</th><th class="r">Kegiatan</th><th class="r">Selesai</th><th class="r">Berjalan</th><th class="r">Tertunda</th><th class="r">Lewat jadwal</th><th class="r">% selesai</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td class="lead">Total</td><td class="r" data-l="Kegiatan">${fN(a.total)}</td><td class="r" data-l="Selesai">${fN(a.selesai)}</td><td class="r" data-l="Berjalan">${fN(a.berjalan)}</td><td class="r" data-l="Tertunda">${fN(a.tertunda)}</td><td class="r" data-l="Lewat jadwal">${fN(a.lewat)}</td><td class="r" data-l="% selesai">${pbar(a.pct)}</td></tr></tfoot></table></div></div>`;
  const mxP = Math.max(1, ...KAB.map(x => c.byKab[x].pesT));
  const pes = `<div class="panel"><div class="panel-h"><h3>Peserta hadir per kabupaten</h3><span class="meta">jumlah kehadiran · laki-laki dan perempuan</span></div><div class="panel-b">
    ${c.live ? `<div class="grps">${KAB.map(x => { const g = c.byKab[x]; return `<div class="grp kb"><span>${x}<small>${fN(g.pesN)} kegiatan mencatat peserta</small></span><div><div class="t"><span style="width:${g.pesT / mxP * 100}%"></span></div>${g.pesL || g.pesP ? `<div class="sexbar mini"><span class="m" style="width:${g.pesL / (g.pesL + g.pesP) * 100}%"></span><span class="f" style="width:${g.pesP / (g.pesL + g.pesP) * 100}%"></span></div>` : ''}</div><div class="v"><b>${fN(g.pesT)}</b> · L ${fN(g.pesL)} · P ${fN(g.pesP)}</div></div>`; }).join('')}</div>`
      : '<div class="empty"><b>Jumlah peserta tampil setelah sinkron aktif.</b>Diambil dari kolom peserta atau teks Hasil Kegiatan di Weekly Update.</div>'}</div></div>`;
  let list;
  if (c.live) {
    const L = c.acts.filter(x => ST.kab === 'Semua' || x.kab === ST.kab);
    list = L.length ? hasilTable(L) : `<div class="panel"><div class="panel-h"><h3>Daftar kegiatan dan hasil</h3></div><div class="panel-b"><div class="empty"><b>Tidak ada kegiatan untuk pilihan ini.</b>Pilih minggu atau kabupaten lain.</div></div></div>`;
  } else {
    const P = (c.perhatian || []).filter(x => ST.kab === 'Semua' || x.kab === ST.kab);
    list = `<div class="panel"><div class="panel-h"><h3>Daftar kegiatan dan hasil</h3><span class="meta">menunggu sinkron</span></div><div class="panel-b">
      <div class="empty"><b>Daftar kegiatan per baris belum tersinkron.</b>Setelah secret Google Sheets diisi di GitHub, nama kegiatan, tanggal, jumlah peserta (laki-laki dan perempuan), hasil kegiatan, dan status dari tab Mimika, Nabire, dan Asmat tampil di sini.</div>
      ${P.length ? `<div class="tw"><table class="stack"><thead><tr><th>Kegiatan perlu tindak lanjut (snapshot)</th><th>Jadwal</th><th>Status</th></tr></thead><tbody>${P.map(x => `<tr><td class="lead"><span class="code">${esc(x.id)}</span> ${esc(x.nama)}</td><td data-l="Jadwal">${dShort(x.jadwal)}</td><td data-l="Status"><span class="badge b-bad">${esc(x.status)}</span> <span class="badge b-bad">${esc(x.alasan)}</span></td></tr>`).join('')}</tbody></table></div>` : ''}</div></div>`;
  }
  const nx = c.next.filter(x => ST.kab === 'Semua' || x.kab === ST.kab).sort((p, q) => p.tanggal.localeCompare(q.tanggal));
  const nW = weekInfo(addDays(c.W.mon, 7));
  const agenda = `<div class="panel"><div class="panel-h"><h3>Agenda minggu berikutnya</h3><span class="meta">${esc(nW.range)}</span></div><div class="panel-b tw">
    ${nx.length ? `<table class="stack"><thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Kabupaten</th><th>Output</th></tr></thead><tbody>${nx.map(x => `<tr><td class="lead">${esc(x.nama)}${x.lokasi ? `<div class="act-l">${esc(x.lokasi)}</div>` : ''}</td><td data-l="Tanggal">${dShort(x.tanggal)}</td><td data-l="Kabupaten">${x.kab}</td><td data-l="Output">${esc(x.output || '–')}</td></tr>`).join('')}</tbody></table>`
      : '<div class="empty"><b>Belum ada kegiatan terjadwal.</b>Kegiatan baru ditambahkan di Rencana Kerja Bulanan dan otomatis muncul di Weekly Update.</div>'}</div></div>`;
  const notes = [...(D.weekly.catatan || []).map(esc)];
  if (!c.live && SNAP() && SNAP().agenda_catatan) notes.push(esc(SNAP().agenda_catatan));
  notes.push('Kolom PIC, kendala/tindak lanjut, dan link Drive per kegiatan dari Weekly Update tidak dipublikasikan di laporan ini.');
  return head + `<div class="stack-y">${weekBar(true)}${snapNotice(c)}${kp}<div class="row r-57">${prog}${pes}</div>${list}${agenda}</div>` + note('Catatan data kegiatan', notes);
}

function renderDokumentasi() {
  const W = weekInfo(ST.week), list = (D.weekly && D.weekly.dokumentasi) || [], d = WU.dokFor(list, W.mon, weekList()[0]);
  const head = `<div class="ph"><div><h2>Dokumentasi kegiatan</h2><div class="sub">${esc(W.label)} · ${esc(W.range)}</div></div>${srcTag('Sumber: Google Drive · folder dokumentasi mingguan')}</div>`;
  let body;
  if (!d) body = `<div class="panel"><div class="panel-b"><div class="empty"><b>Belum ada folder dokumentasi untuk minggu ini.</b>Tambahkan satu baris di tab <code>Dokumentasi</code> pada sheet Weekly Update: tanggal Senin minggu itu, link folder Google Drive, dan keterangan.</div></div></div>`;
  else {
    const open = `https://drive.google.com/drive/folders/${encodeURIComponent(d.id)}`;
    const seg = `<div class="seg" role="group" aria-label="Tampilan folder">${[['grid', 'Galeri'], ['list', 'Daftar']].map(([v, l]) => `<button data-dok="${v}" aria-pressed="${ST.dokV === v}">${l}</button>`).join('')}</div>`;
    /* iframe hanya dibuat saat bagian ini dibuka, supaya tidak dimuat ulang ketika bagian lain berubah */
    const frame = ST.sec === 'dokumentasi'
      ? `<div class="drive-frame" tabindex="0" aria-label="Isi folder dokumentasi, bisa digeser"><iframe src="https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(d.id)}#${ST.dokV}" title="Folder dokumentasi ${esc(d.judul || W.label)}" loading="lazy" referrerpolicy="no-referrer"></iframe></div>`
      : '<div class="drive-frame idle"></div>';
    body = `<div class="panel"><div class="panel-h"><h3>${esc(d.judul || 'Folder dokumentasi ' + W.label)}</h3><div class="dok-act">${seg}<a class="ibtn" href="${open}" target="_blank" rel="noopener noreferrer">Buka di Google Drive ↗</a></div></div>
      <div class="panel-b">${frame}<p class="dok-help">Geser di dalam kotak untuk melihat semua file. Klik foto atau dokumen untuk membukanya di Google Drive. Bila kotak menampilkan halaman masuk Google, folder belum dibagikan untuk pembaca laporan.</p><p class="dok-print">Folder dokumentasi: ${esc(open)}</p></div></div>`;
  }
  const notes = ['Isi folder dibaca langsung dari Google Drive saat halaman dibuka, jadi foto baru di folder langsung terlihat.',
    'Agar tampil untuk PTFI, folder perlu dibagikan "Siapa saja yang memiliki link · Viewer". Folder yang hanya bisa dibuka akun WVI akan menampilkan halaman masuk Google.',
    'Pastikan foto di folder sudah sesuai persetujuan dokumentasi dan kebijakan perlindungan anak sebelum folder dibagikan.',
    'Link folder disimpan di data terenkripsi, tidak tertulis di repository publik.'];
  return head + `<div class="stack-y">${weekBar(false)}${body}</div>` + note('Catatan dokumentasi', notes.map(esc));
}

function bttFilterBar(B, v) {
  const P = WU.bttPeriods(B), f = ST.bf;
  const grp = (t, rows) => rows.length ? `<optgroup label="${t}">${rows.map(([k, l]) => `<option value="${k}" ${f.per === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</optgroup>` : '';
  const sel = `<select class="sel" id="bfPer" aria-label="Periode">${grp('Ringkasan', P.filter(([k]) => k === 'all' || k === 'dash'))}${grp('Tahun', P.filter(([k]) => /^y/.test(k)))}${grp('Tahun fiskal WVI', P.filter(([k]) => /^fy/.test(k)))}${grp('Bulan', P.filter(([k]) => /^m/.test(k)).slice().reverse())}</select>`;
  const chips = (key, opts, on) => `<div class="chips" role="group">${opts.map(o => `<button class="chip" data-bf="${key}" data-val="${o}" aria-pressed="${f[key] === o}" ${on ? '' : 'disabled'}>${o === 'L' ? 'Laki-laki' : o === 'P' ? 'Perempuan' : o}</button>`).join('')}</div>`;
  const usia = `<select class="sel" id="bfUsia" aria-label="Kelompok usia" ${v.usiaOk ? '' : 'disabled'}><option value="Semua">Semua usia</option>${((B.kubus && B.kubus.usia) || []).map(g => `<option value="${esc(g)}" ${f.usia === g ? 'selected' : ''}>${esc(USIA_L[g] || g)}</option>`).join('')}</select>`;
  const aktif = [f.wil !== 'Semua' && f.wil, f.jk !== 'Semua' && (f.jk === 'L' ? 'Laki-laki' : 'Perempuan'), f.usia !== 'Semua' && (USIA_L[f.usia] || f.usia)].filter(Boolean);
  return `<div class="panel bfbar"><div class="bf-grid">
    <div class="bf-f"><span class="fb-lab">Periode</span>${sel}</div>
    <div class="bf-f"><span class="fb-lab">Wilayah</span>${chips('wil', ['Semua', ...KAB, ...(B.kubus ? ['Lainnya'] : [])], true)}</div>
    <div class="bf-f"><span class="fb-lab">Jenis kelamin</span>${chips('jk', ['Semua', 'L', 'P'], v.jkOk)}</div>
    <div class="bf-f"><span class="fb-lab">Kelompok usia</span>${usia}</div>
    ${aktif.length ? `<button class="ibtn bf-reset" data-bfreset="1">Reset filter</button>` : ''}</div>
    ${!B.kubus ? '<div class="bf-note">Filter jenis kelamin dan kelompok usia aktif setelah tab Database BTT Rekap tersinkron. Sementara ini periode memakai cakupan tab Dashboard dan tren bulanan per file BTT.</div>' : ''}</div>`;
}
const USIA_L = { '0-5.99 mo': 'Bayi 0–5 bulan', '6-23.99 mo': 'Baduta 6–23 bulan', '24-59.99 mo': 'Balita 24–59 bulan', '5-11.99 yo': 'Anak 5–11 tahun', '12-17.99 yo': 'Remaja 12–17 tahun', 'Dewasa': 'Dewasa ≥18 tahun', 'Belum diketahui': 'Usia belum diketahui' };
function renderPartisipan() {
  const B = D.btt, P = WU.bttPeriods(B);
  if (!ST.bf.per || !P.some(([k]) => k === ST.bf.per)) { const y = P.find(([k]) => k === 'y' + TODAY.slice(0, 4)); ST.bf.per = (y || P[0] || ['dash'])[0]; }
  const v = WU.bttView(B, ST.bf), perL = (P.find(([k]) => k === ST.bf.per) || [, ''])[1];
  const scope = [perL, ST.bf.wil !== 'Semua' ? ST.bf.wil : 'semua wilayah', ST.bf.jk !== 'Semua' ? (ST.bf.jk === 'L' ? 'laki-laki' : 'perempuan') : '', ST.bf.usia !== 'Semua' ? (USIA_L[ST.bf.usia] || ST.bf.usia) : ''].filter(Boolean).join(' · ');
  const head = `<div class="ph"><div><h2>Partisipan (BTT)</h2><div class="sub">${esc(scope)}</div></div>${srcTag(B.kubus ? 'Sumber: BTT Rekap · tab Database (agregat)' : 'Sumber: BTT Rekap · tab Dashboard')}</div>`;
  const na = x => x == null ? '–' : fN(x);
  const kp = `<div class="kpis k4">${kpi('Partisipan unik', na(v.u), 'orang · tiap orang dihitung satu kali dalam periode', true, v.l != null && ST.bf.jk === 'Semua' ? sexBlock(v.l, v.p, v.x) : '')}
    ${kpi('Pelaksanaan kegiatan', na(v.pel), v.pel == null ? 'per wilayah belum tersedia untuk bulan ini' : (ST.bf.jk !== 'Semua' || ST.bf.usia !== 'Semua') ? 'tidak terpengaruh filter jenis kelamin/usia' : 'kegiatan dengan minimal satu tanda hadir')}
    ${kpi('Total kehadiran', na(v.hd), 'tanda hadir · satu orang bisa hadir berkali-kali')}
    ${kpi('Rata-rata keikutsertaan', v.u && v.hd != null ? fN(v.hd / v.u, 1) : '–', 'kegiatan per orang')}</div>`;
  const mxU = Math.max(1, ...v.perWil.map(([, o]) => o.u));
  const perKab = `<div class="panel"><div class="panel-h"><h3>Per wilayah</h3><span class="meta">${v.mode === 'kubus' ? 'kabupaten partisipan' : 'file BTT'} · ${esc(perL)}</span></div><div class="panel-b"><div class="grps">
    ${v.perWil.map(([w, o]) => `<div class="grp kb ${ST.bf.wil !== 'Semua' && ST.bf.wil !== w ? 'dim' : ''}"><span>${w}${o.hd ? `<small>${fN(o.hd)} kehadiran</small>` : ''}</span><div><div class="t"><span style="width:${o.u / mxU * 100}%"></span></div>${o.l + o.p ? `<div class="sexbar mini"><span class="m" style="width:${o.l / (o.l + o.p) * 100}%"></span><span class="f" style="width:${o.p / (o.l + o.p) * 100}%"></span></div>` : ''}</div><div class="v"><b>${fN(o.u)}</b> unik${o.l + o.p ? ` · L ${fN(o.l)} · P ${fN(o.p)}` : ''}</div></div>`).join('')}
    </div></div></div>`;
  const mxA = Math.max(1, ...v.usia.map(([, o]) => o.u));
  const usia = `<div class="panel"><div class="panel-h"><h3>Kelompok usia</h3><span class="meta">partisipan unik · ${esc(ST.bf.wil !== 'Semua' ? ST.bf.wil : 'semua wilayah')}</span></div><div class="panel-b">${v.usia.length ? `<div class="grps">
    ${v.usia.map(([g, o]) => `<div class="grp sm ${ST.bf.usia !== 'Semua' && ST.bf.usia !== g ? 'dim' : ''}"><span title="${esc(g)}">${esc(USIA_L[g] || g)}</span><div class="t"><span style="width:${o.u / mxA * 100}%"></span></div><div class="v"><b>${fN(o.u)}</b> ${fP(v.u ? o.u / v.u : null)}</div></div>`).join('')}</div>`
    : '<div class="empty"><b>Rincian usia untuk pilihan ini belum tersedia.</b>Aktif setelah tab Database BTT Rekap tersinkron.</div>'}</div></div>`;
  const nowMk = TODAY.slice(0, 7), T = v.trend.filter(r => r.m <= (nowMk > (WU.bttLastMonth(B.bulanan) || '') ? nowMk : WU.bttLastMonth(B.bulanan))).slice(ST.mob ? -8 : -14);
  const cats = T.map(r => { const [y, m] = r.m.split('-').map(Number); return `${BLN3[m - 1]} ${String(y).slice(2)}`; });
  const M = ST.bttM, hasVal = T.some(r => r[M] != null);
  const seg = `<div class="seg" role="group" aria-label="Ukuran">${[['u', 'Partisipan unik'], ['pel', 'Pelaksanaan'], ['hd', 'Kehadiran']].map(([k, l]) => `<button data-btt="${k}" aria-pressed="${M === k}">${l}</button>`).join('')}</div>`;
  const tren = `<div class="panel"><div class="panel-h"><h3>Tren bulanan</h3>${seg}</div><div class="panel-b">
    ${T.length && hasVal ? `<div class="chart-wrap">${barChart(cats, [{ n: M, c: 'var(--or)', v: T.map(r => r[M] || 0) }], { zeroLabel: true, aria: 'Tren bulanan BTT' })}</div>` : '<div class="empty"><b>Belum ada data untuk ukuran ini.</b>Pelaksanaan dan kehadiran per wilayah aktif setelah tab Database tersinkron.</div>'}
    <div class="legend"><span>Mengikuti filter wilayah${v.jkOk ? ', jenis kelamin, dan usia' : ''}. Partisipan unik per bulan tidak dijumlahkan antarbulan.</span></div></div></div>`;
  const oc = v.outcome ? `<div class="panel"><div class="panel-h"><h3>Pelaksanaan menurut Outcome</h3><span class="meta">${esc(perL)}${ST.bf.wil !== 'Semua' ? ' · file BTT ' + ST.bf.wil : ''}</span></div><div class="panel-b"><div class="grps">
    ${['Outcome 1', 'Outcome 2', 'Outcome 3', 'Belum dipilih'].map((l, i) => { const val = v.outcome[i] || 0, mx = Math.max(1, ...v.outcome); return `<div class="grp sm"><span>${l}</span><div class="t"><span style="width:${val / mx * 100}%"></span></div><div class="v"><b>${fN(val)}</b> pelaksanaan</div></div>`; }).join('')}</div></div></div>` : '';
  const rc = v.recap.length ? `<div class="panel"><div class="panel-h"><h3>Tanda hadir format BTT Recap</h3><span class="meta">Male/Female ≥18 tahun · Boys/Girls &lt;18 tahun</span></div><div class="panel-b tw"><table class="stack">
    <thead><tr><th>File BTT</th><th class="r">Male</th><th class="r">Female</th><th class="r">Boys</th><th class="r">Girls</th><th class="r">Tak terklasifikasi</th><th class="r">Total</th></tr></thead>
    <tbody>${v.recap.map(r => `<tr><td class="lead">${r[0]}</td><td class="r" data-l="Male">${fN(r[7])}</td><td class="r" data-l="Female">${fN(r[8])}</td><td class="r" data-l="Boys">${fN(r[9])}</td><td class="r" data-l="Girls">${fN(r[10])}</td><td class="r" data-l="Tak terklasifikasi">${fN(r[11])}</td><td class="r" data-l="Total"><b>${fN(r[2])}</b></td></tr>`).join('')}</tbody></table></div></div>` : '';
  return head + `<div class="stack-y">${bttFilterBar(B, v)}${kp}<div class="row r-11">${perKab}${usia}</div>${tren}${oc || rc ? `<div class="row r-11">${oc || ''}${rc || ''}</div>` : ''}</div>` + note('Catatan data BTT', bttNotes(B));
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
  (B.catatan || []).forEach(x => f.push(x));
  const ck = B.kubus && B.kubus.cek;
  if (ck) f.push(ck.cocok ? `Cek silang: partisipan unik ${ck.periode} hasil hitung (${fN(ck.u_hitung)}) sama dengan kartu Dashboard BTT Rekap.` : `Cek silang: partisipan unik ${ck.periode} hasil hitung (${fN(ck.u_hitung)}) berbeda dengan kartu Dashboard BTT Rekap (${fN(ck.u_dashboard)}). Periksa definisi Dup/Ident atau filter di sheet.`);
  f.push(B.kubus ? 'Filter dihitung dari tab Database BTT Rekap saat sinkron: hanya jumlah per periode, wilayah, jenis kelamin, dan kelompok usia yang dipublikasikan. ID partisipan tidak disimpan.' : 'Laporan ini hanya membaca angka agregat dari tab Dashboard BTT Rekap. Data per orang di tab Database tidak dibaca.');
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
const RND = { cover: renderCover, ringkasan: renderRingkasan, kegiatan: renderKegiatan, dokumentasi: renderDokumentasi, partisipan: renderPartisipan, indikator: renderIndikator, penutup: renderPenutup };
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
  const im = new Image(); im.onload = () => { LOGO_OK = true; render(); }; im.onerror = () => { LOGO_OK = false; }; im.src = './assets/logo-wvi.png';
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
  document.addEventListener('change', e => {
    if (e.target.id === 'bfPer') { ST.bf.per = e.target.value; render(); }
    if (e.target.id === 'bfUsia') { ST.bf.usia = e.target.value; render(); }
  });
  document.querySelectorAll('[data-theme-set]').forEach(b => b.onclick = () => setTheme(b.dataset.themeSet));
  $('#prev').onclick = () => step(-1); $('#next').onclick = () => step(1); $('#fsPrev').onclick = () => step(-1); $('#fsNext').onclick = () => step(1);
  $('#present').onclick = startPresent; $('#fsExit').onclick = stopPresent; $('#print').onclick = () => print();
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('present')) { document.body.classList.remove('present'); render(); } });
  document.addEventListener('click', e => {
    if (!D) return;
    const t = e.target.closest('[data-sec],[data-wk],[data-kab],[data-btt],[data-dok],[data-bf],[data-bfreset],.ind-n,.hasil-ul.clamp'); if (!t) return;
    if (t.dataset.bf) { ST.bf[t.dataset.bf] = t.dataset.val; render(); return; }
    if (t.dataset.bfreset) { ST.bf = { per: ST.bf.per, wil: 'Semua', jk: 'Semua', usia: 'Semua' }; render(); return; }
    if (t.classList.contains('hasil-ul')) { t.classList.toggle('open'); return; }
    if (t.dataset.sec) setSec(t.dataset.sec);
    else if (t.dataset.wk !== undefined) setWeek(t.dataset.wk);
    else if (t.dataset.kab) { ST.kab = t.dataset.kab; render(); }
    else if (t.dataset.btt) { ST.bttM = t.dataset.btt; render(); }
    else if (t.dataset.dok) { ST.dokV = t.dataset.dok; render(); }
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
