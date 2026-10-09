const SLIDE_NUMBERS = [1, 2, 4, 5, 6, 7, 8, 9];
const ICON_PATHS = {"map": "<path d=\"m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z\"/><path d=\"M9 3v15M15 6v15\"/>", "overview": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/>", "users": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.65\"/>", "layers": "<path d=\"m12 3 9 5-9 5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5\"/>", "village": "<path d=\"m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7\"/>", "clipboard": "<rect x=\"5\" y=\"5\" width=\"14\" height=\"16\" rx=\"2\"/><rect x=\"9\" y=\"3\" width=\"6\" height=\"4\" rx=\"1\"/><path d=\"M9 12h6M9 16h6\"/>", "chart": "<path d=\"M3 3v18h18M7 14l4-4 4 2 6-7\"/>", "camera": "<path d=\"M14 4h-4L8 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4Z\"/><circle cx=\"12\" cy=\"13\" r=\"4\"/>", "book": "<path d=\"M12 5v16M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z\"/>", "menu": "<path d=\"M4 6h16M4 12h16M4 18h16\"/>", "left": "<path d=\"m14 6-6 6 6 6\"/>", "right": "<path d=\"m10 6 6 6-6 6\"/>", "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5\"/>", "moon": "<path d=\"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z\"/>", "desktop": "<rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M8 21h8M12 17v4\"/>", "mobile": "<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"/><path d=\"M11 18h2\"/>", "print": "<path d=\"M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"/><path d=\"M6 14h12v7H6Z\"/>", "settings": "<path d=\"m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 2 2h3l1-3 3-1 2-3-2-2 1-3-2-3-3 1-2-2Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>", "close": "<path d=\"m6 6 12 12M18 6 6 18\"/>", "link": "<path d=\"m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0\"/>"};
function icon(name) { return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name] || ICON_PATHS.book}</svg>`; }
/**
 * ACCESS_HASH: SHA-256 hash of uppercase trimmed access code.
 * Default access code: PTFI2026
 * To change, hash your new code with Web Crypto:
 * crypto.subtle.digest("SHA-256", new TextEncoder().encode(YOUR_CODE.trim().toUpperCase()))
 */
const ACCESS_HASH = "2549cee44c0dea25e325852bc3cac86b3ca6ad9344d0ea4b4513d1b970c43bef";
let wrongAttempts = 0, lockUntil = 0;

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim().toUpperCase()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleAuth(e) {
  e.preventDefault();
  const now = Date.now();
  if (now < lockUntil) return;
  const input = document.getElementById("authInput");
  const err = document.getElementById("authErr");
  const val = input.value;
  const hash = await sha256(val);
  if (hash === ACCESS_HASH) {
    document.getElementById("authGate").style.display = "none";
    document.querySelectorAll('[inert]').forEach(el => el.removeAttribute('inert'));
    initDashboard();
  } else {
    wrongAttempts++;
    if (wrongAttempts >= 3) {
      lockUntil = Date.now() + 30000;
      wrongAttempts = 0;
      err.textContent = LG === 'en' ? "Locked for 30 seconds due to repeated failed attempts." : "Terkunci selama 30 detik karena 3 kali percobaan salah.";
      updateLockUI();
    } else {
      err.textContent = LG === 'en' ? `Invalid access code (${3 - wrongAttempts} attempts left).` : `Kode akses salah (sisa ${3 - wrongAttempts} percobaan).`;
    }
  }
}

function updateLockUI() {
  const rem = Math.ceil((lockUntil - Date.now()) / 1000);
  const btn = document.getElementById("authBtn");
  const inp = document.getElementById("authInput");
  const err = document.getElementById("authErr");
  if (rem > 0) {
    btn.disabled = true;
    inp.disabled = true;
    err.textContent = LG === 'en' ? `Locked. Try again in ${rem}s.` : `Terkunci. Coba lagi dalam ${rem} detik.`;
    setTimeout(updateLockUI, 1000);
  } else {
    btn.disabled = false;
    inp.disabled = false;
    err.textContent = "";
  }
}

const CONFIG = { penerima_manfaat: 'data/penerima_manfaat.csv', target: 'data/target.csv', kegiatan: 'data/kegiatan.csv', indikator: 'data/indikator.csv', info: 'data/info.csv' };
const I = {
  id: {
    sub: 'Dashboard capaian untuk PT Freeport Indonesia', kab: 'Kabupaten', cat: 'Kategori', sex: 'Jenis kelamin', per: 'Periode s.d.', all: 'Semua', reset: 'Reset', P: 'Perempuan', L: 'Laki-laki', target: 'Target', reach: 'Terjangkau', ofT: 'dari target', act: 'Kegiatan', src: 'Sumber', sample: 'Data contoh', sheet: 'Spreadsheet', until: 'Data s.d.', page: 'Halaman', demo: 'DATA CONTOH / SAMPLE DATA',
    p: ['Peta dan profil proyek', 'Ringkasan', 'Usia dan jenis kelamin', 'Kelompok sasaran', 'Wilayah dan kampung', 'Kegiatan', 'Tren bulanan', 'Dokumentasi'],
    ps: ['Jangkauan anak dan masyarakat di tiga kabupaten', 'Hal utama untuk donor', 'Komposisi penerima manfaat', 'Anak, remaja, dewasa, dan pemangku kepentingan', 'Perbandingan kabupaten dan kampung dampingan', 'Kegiatan menurut output, jenis, dan wilayah', 'Penerima manfaat baru dan kumulatif per bulan', 'Panduan teknis, persiapan integrasi Google API, kamus data, dan SOP sistem'],
    goal: 'Berkontribusi pada percepatan penurunan stunting dan peningkatan status gizi di provinsi prioritas pemerintah di Tanah Papua (Papua Tengah dan Papua Selatan).',
    facts: [['Periode', 'Sep 2024 – Okt 2027'], ['Mitra pendanaan', 'PT Freeport Indonesia'], ['Pelaksana', 'Wahana Visi Indonesia'], ['Mitra pemerintah', 'Kemenkes, BKKBN, Bappeda, Dinkes, TPPS'], ['Wilayah', 'Mimika, Nabire (Papua Tengah), Asmat (Papua Selatan)'], ['Kampung dampingan', '22 kampung dan kelurahan']],
    obj: ['Objective 1: Praktik gizi komunitas', 'Objective 2: Layanan kesehatan primer', 'Objective 3: Tata kelola multipihak'],
    child: 'Anak', comm: 'Masyarakat', kampung: 'Kampung', total: 'Total', ach: 'Capaian', pct: '%', status: ['Tercapai', 'Sesuai jalur', 'Perlu perhatian'], notS: 'Tidak terpengaruh slicer',
    cats: { Anak: 'Anak', Remaja: 'Remaja', Dewasa: 'Dewasa', Stakeholder: 'Pemangku kepentingan' }, ins: 'Sorotan capaian', gauge: 'Capaian terhadap target tahunan', trend: 'Tren kumulatif bulanan', byKab: 'Per kabupaten', age: 'Piramida usia × jenis kelamin', sexc: 'Komposisi jenis kelamin', ageT: 'Tabel kelompok umur', grp: 'Kelompok sasaran', catc: 'Per kategori', stake: 'Pemangku kepentingan', kabc: 'Target dan capaian per kabupaten', kpt: 'Kampung dampingan', byOut: 'Per output', byJ: 'Per jenis kegiatan', heat: 'Bulan × kabupaten', newm: 'Penerima manfaat baru per bulan', cumt: 'Tabel bulanan', month: 'Bulan', newT: 'Baru', cum: 'Kumulatif', indT: 'Indikator kinerja', lvl: 'Level',
    map3: 'Peta 3D Interaktif', mapS: 'Peta skematik', mapNote: 'Tinggi kolom = jumlah terjangkau', ins1: (k, p) => `${k} memiliki capaian tertinggi: ${p}% dari target tahunan.`, ins2: (c, p) => `Kategori dengan capaian terendah: ${c} (${p}%).`, ins3: (p) => `Perempuan mencakup ${p}% dari seluruh penerima manfaat terjangkau.`, ins4: (n, m) => `${n} kegiatan terlaksana pada ${m}.`,
    print: 'Cetak PDF', light: 'Terang', dark: 'Gelap', desk: 'Desktop', mob: 'Mobile', srcT: 'Sumber data', connect: 'Hubungkan', upload: 'Atau unggah file Excel / CSV', copy: 'Salin link dashboard', backS: 'Kembali ke data contoh', prev: 'Sebelumnya', next: 'Berikutnya', out: 'Output', filterActive: 'Filter aktif:'
  },
  en: {
    sub: 'Results dashboard for PT Freeport Indonesia', kab: 'Regency', cat: 'Category', sex: 'Sex', per: 'Period up to', all: 'All', reset: 'Reset', P: 'Female', L: 'Male', target: 'Target', reach: 'Reached', ofT: 'of target', act: 'Activities', src: 'Source', sample: 'Sample data', sheet: 'Spreadsheet', until: 'Data up to', page: 'Page', demo: 'DATA CONTOH / SAMPLE DATA',
    p: ['Map and project profile', 'Overview', 'Age and sex', 'Target groups', 'Regencies and villages', 'Activities', 'Monthly trend', 'Documentation'],
    ps: ['Reach of children and community in three regencies', 'Key information for the donor', 'Composition of beneficiaries', 'Children, adolescents, adults and stakeholders', 'Regency and assisted village comparison', 'Activities by output, type and location', 'New and cumulative beneficiaries per month', 'Technical guide, Google API integration, and data dictionary'],
    goal: 'Contribute to the acceleration of stunting reduction and improvement of nutrition status in government priority provinces in Papua (Central Papua and South Papua).',
    facts: [['Period', 'Sep 2024 – Oct 2027'], ['Funding partner', 'PT Freeport Indonesia'], ['Implementer', 'Wahana Visi Indonesia'], ['Government partners', 'MoH, BKKBN, BAPPEDA, Health Office, TPPS'], ['Location', 'Mimika, Nabire (Central Papua), Asmat (South Papua)'], ['Assisted villages', '22 villages']],
    obj: ['Objective 1: Community nutrition practices', 'Objective 2: Primary health care', 'Objective 3: Multi-stakeholder governance'],
    child: 'Children', comm: 'Community', kampung: 'Village', total: 'Total', ach: 'Achieved', pct: '%', status: ['Achieved', 'On track', 'Needs attention'], notS: 'Not affected by slicers',
    cats: { Anak: 'Children', Remaja: 'Adolescents', Dewasa: 'Adults', Stakeholder: 'Stakeholders' }, ins: 'Executive highlights', gauge: 'Achievement against annual target', trend: 'Monthly cumulative trend', byKab: 'By regency', age: 'Age × sex pyramid', sexc: 'Sex composition', ageT: 'Age group table', grp: 'Target groups', catc: 'By category', stake: 'Stakeholders', kabc: 'Target and achievement by regency', kpt: 'Assisted villages', byOut: 'By output', byJ: 'By activity type', heat: 'Month × regency', newm: 'New beneficiaries per month', cumt: 'Monthly table', month: 'Month', newT: 'New', cum: 'Cumulative', indT: 'Key performance indicators', lvl: 'Level',
    map3: 'Interactive 3D Map', mapS: 'Schematic map', mapNote: 'Column height = reach count', ins1: (k, p) => `${k} has the highest achievement: ${p}% of annual target.`, ins2: (c, p) => `Lowest-achieving category: ${c} (${p}%).`, ins3: (p) => `Women and girls make up ${p}% of beneficiaries reached.`, ins4: (n, m) => `${n} activities carried out in ${m}.`,
    print: 'Print PDF', light: 'Light', dark: 'Dark', desk: 'Desktop', mob: 'Mobile', srcT: 'Data source', connect: 'Connect', upload: 'Or upload an Excel / CSV file', copy: 'Copy dashboard link', backS: 'Back to sample data', prev: 'Previous', next: 'Next', out: 'Output', filterActive: 'Active filters:'
  }
};

const GRPEN = { 'Balita': 'Children under five', 'Remaja': 'Adolescents', 'Ibu hamil': 'Pregnant women', 'Ibu menyusui': 'Lactating mothers', 'Pengasuh/ayah': 'Caregivers/fathers', 'Kader posyandu': 'Posyandu cadres', 'Tenaga kesehatan': 'Health workers', 'Tokoh agama/adat': 'Faith/traditional leaders', 'Agen perubahan': 'Agents of change', 'Pemerintah kampung/OPD': 'Village gov./agencies' };
const JEN = { 'Aksi agen perubahan': 'Agent of change actions', 'Pelatihan KAP': 'KAP training', 'Pos Gizi / PMT lokal': 'Nutrition post / local PMT', 'Kelas berseri remaja': 'Adolescent class series', 'Kelas berseri bapak': 'Fathers class series', 'Kelas ibu hamil': 'Pregnant women class', 'Pendampingan rujukan TPK': 'TPK referral support', 'Pelatihan kader': 'Cadre training', 'Pelatihan nakes': 'Health worker training', 'Pertemuan lintas sektor': 'Cross-sector meeting' };
const OUTN = { id: { '1.1': '1.1 Agen perubahan', '1.2': '1.2 Layanan gizi komunitas', '1.3': '1.3 Edukasi SBC', '1.4': '1.4 Rujukan', '2.1': '2.1 Layanan kesehatan primer', '3.1': '3.1 Kolaborasi multipihak' }, en: { '1.1': '1.1 Agents of change', '1.2': '1.2 Community nutrition', '1.3': '1.3 SBC education', '1.4': '1.4 Referral', '2.1': '2.1 Primary health care', '3.1': '3.1 Multi-stakeholder' } };
const MON = { id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
const AGES = ['0–23 bulan', '24–59 bulan', '10–14 tahun', '15–18 tahun', '19–24 tahun', '25–49 tahun', '50+ tahun'];
const CATS = ['Anak', 'Remaja', 'Dewasa', 'Stakeholder'];
const GEO = { Mimika: [136.88, -4.55], Nabire: [135.50, -3.37], Asmat: [138.13, -5.54] };

const ACTIVITY_INFO = {
  'Aksi agen perubahan': { code: 'ACT-1.1.1', out: '1.1', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-1.1.1 (Penyuluhan gizi mikro & PMBA oleh agen perubahan)', desc: 'Penyuluhan keluarga dan konseling gizi dari pintu ke pintu oleh kader agen perubahan.' },
  'Pelatihan KAP': { code: 'ACT-1.1.2', out: '1.1', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-1.1.2 (Pelatihan komunikasi antar pribadi kader)', desc: 'Penguatan metode Komunikasi Antar Pribadi untuk mengubah pola asuh keluarga balita.' },
  'Pos Gizi / PMT lokal': { code: 'ACT-1.2.1', out: '1.2', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-1.2.1 (Pemulihan balita kurang gizi via Pos Gizi)', desc: 'Siklus 10-12 hari Pos Gizi menggunakan pangan lokal padat gizi (ikan, telur, sayur, sagu).' },
  'Kelas berseri remaja': { code: 'ACT-1.3.1', out: '1.3', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-1.3.1 (Konsumsi TTD & edukasi gizi remaja putri)', desc: 'Edukasi kesehatan reproduksi, gizi seimbang, dan kepatuhan konsumsi tablet tambah darah.' },
  'Kelas berseri bapak': { code: 'ACT-1.3.2', out: '1.3', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-1.3.2 (Pelibatan ayah dalam pengasuhan balita)', desc: 'Pelibatan kepala keluarga dalam mendukung ASI eksklusif, gizi ibu hamil, dan sanitasi rumah.' },
  'Kelas ibu hamil': { code: 'ACT-1.3.3', out: '1.3', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-1.3.3 (Kepatuhan ANC & pemahaman 1.000 HPK)', desc: 'Edukasi gizi masa kehamilan, tanda bahaya, dan persiapan persalinan sehat.' },
  'Pendampingan rujukan TPK': { code: 'ACT-1.4.1', out: '1.4', periodicity: 'Bulanan / Kasuistik', indicatorContrib: 'IOP-1.4.1 (Mekanisme rujukan terpadu balita berisiko)', desc: 'Pendampingan Tim Pendamping Keluarga untuk rujukan kasus balita gizi buruk ke Puskesmas/RS.' },
  'Pelatihan kader': { code: 'ACT-2.1.1', out: '2.1', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-2.1.1 (Kompetensi dasar antropometri standar kader)', desc: 'Pelatihan teknis pengukuran tinggi/panjang badan balita dan pengisian KMS digital.' },
  'Pelatihan nakes': { code: 'ACT-2.1.2', out: '2.1', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-2.1.2 (Standardisasi tata laksana gizi nakes faskes)', desc: 'Peningkatan kapasitas dokter, perawat, dan nutrisionis puskesmas dalam tata laksana stunting.' },
  'Pertemuan lintas sektor': { code: 'ACT-3.1.1', out: '3.1', periodicity: 'Bi-monthly (2-Bulanan)', indicatorContrib: 'IOP-3.1.1 (Konvergensi RAN PASTI & TPPS daerah)', desc: 'Rembuk stunting dan koordinasi lintas OPD (Bappeda, Dinkes, PMD, TP-PKK) serta tim PTFI.' }
};

const FIELD_DOCS = [
  {
    id: 'doc-1', date: '2026-10-14', dateStr: '14 Oktober 2026', month: '2026-10', kab: 'Mimika', kampung: 'Tipuka',
    output: '1.2 Layanan Gizi Komunitas', actCode: 'ACT-1.2.1',
    title: 'Penyelenggaraan Pos Gizi & Demo Masak Pangan Lokal di Kampung Tipuka',
    desc: 'Pelaksanaan hari ke-5 siklus Pos Gizi di Balai Kampung Tipuka, Mimika. Sebanyak 18 ibu balita kurang gizi mempraktikkan pengolahan menu padat gizi berbahan ikan laut segar, telur, sayur kelor, dan sagu lokal. Terjadi kenaikan berat badan rata-rata 250 gram pada balita dampingan setelah pemantauan intensif.',
    participants: '18 Ibu & Balita, 4 Kader Pos Gizi, 2 Tim MEAL WVI', tag: 'PMT Lokal & Pos Gizi', color: '#FF5515'
  },
  {
    id: 'doc-2', date: '2026-10-19', dateStr: '19 Oktober 2026', month: '2026-10', kab: 'Nabire', kampung: 'Siriwini',
    output: '2.1 Layanan Primer', actCode: 'ACT-2.1.1',
    title: 'Pelatihan Standardisasi Pengukuran Antropometri Digital Kader Posyandu Nabire',
    desc: 'Pelatihan teknis penggunaan infantometer digital dan timbangan berat badan terstandar Kemenkes bagi kader Posyandu Siriwini dan perwakilan kampung dampingan di Nabire. Pelatihan didampingi tenaga gizi Puskesmas untuk memastikan tidak ada kesalahan pembacaan stunting (zero human error).',
    participants: '24 Kader Posyandu, 3 Tenaga Pelaksana Gizi Puskesmas', tag: 'Kapasitas Kader', color: '#0284C7'
  },
  {
    id: 'doc-3', date: '2026-10-24', dateStr: '24 Oktober 2026', month: '2026-10', kab: 'Asmat', kampung: 'Sesakam',
    output: '1.2 Layanan Gizi Komunitas', actCode: 'ACT-1.2.1',
    title: 'Distribusi Paket Gizi 1.000 HPK & Edukasi Higiene Sanitasi di Agats / Sesakam',
    desc: 'Kunjungan tim kesehatan terpadu menggunakan perahu motor (longboat) ke Kampung Sesakam di atas rawa pasang surut Agats. Tim mendistribusikan paket bahan gizi mikro untuk 22 keluarga dengan ibu hamil dan balita 0–23 bulan serta mengedukasi cuci tangan pakai sabun (CTPS) dan perebusan air minum.',
    participants: '22 Keluarga 1.000 HPK, Tokoh Adat Kampung, 2 Bidan Desa', tag: 'Gizi 1.000 HPK', color: '#E67E22'
  },
  {
    id: 'doc-4', date: '2026-10-08', dateStr: '08 Oktober 2026', month: '2026-10', kab: 'Nabire', kampung: 'Makimi',
    output: '1.3 Edukasi SBC', actCode: 'ACT-1.3.1',
    title: 'Kelas Berseri Edukasi Remaja Putri Pencegahan Anemia di Pesisir Makimi',
    desc: 'Sesi kelas remaja berseri modul gizi prakonsepsi di SMP Negeri Makimi. Edukasi membahas bahaya anemia, pentingnya kepatuhan minum Tablet Tambah Darah (TTD) mingguan, serta gizi seimbang untuk memutus rantai stunting antar generasi sejak usia remaja.',
    participants: '38 Siswi Remaja Putri, 2 Guru Pembina UKS, 1 Fasilitator WVI', tag: 'Kelas Remaja', color: '#0284C7'
  },
  {
    id: 'doc-5', date: '2026-10-16', dateStr: '16 Oktober 2026', month: '2026-10', kab: 'Mimika', kampung: 'Koperapoka',
    output: '1.3 Edukasi SBC', actCode: 'ACT-1.3.2',
    title: 'Kelas Berseri Pengasuhan Ayah / Bapak Peduli Gizi Anak di Koperapoka',
    desc: 'Diskusi kelompok terarah dan kelas interaktif yang dihadiri para ayah dan kepala keluarga di Kampung Koperapoka, Timika. Para ayah mendiskusikan peran suami dalam mendukung ASI eksklusif, pengalokasian belanja keluarga untuk makanan bergizi dibanding rokok, dan pembagian peran pengasuhan balita.',
    participants: '26 Kepala Keluarga / Ayah, 1 Tokoh Agama, 2 Fasilitator Gender WVI', tag: 'Pengasuhan Ayah', color: '#FF5515'
  },
  {
    id: 'doc-6', date: '2026-10-27', dateStr: '27 Oktober 2026', month: '2026-10', kab: 'Asmat', kampung: 'Warse',
    output: '1.4 Rujukan Kasus', actCode: 'ACT-1.4.1',
    title: 'Pendampingan Rujukan Balita Berisiko Stunting bersama TPK di Warse, Atsj',
    desc: 'Aksi penjangkauan oleh Tim Pendamping Keluarga (TPK) bersama fasilitator lapangan ke Kampung Warse, Distrik Atsj. Tim mendampingi 3 balita gizi kurang dengan penyakit penyerta (ISPA) untuk dirujuk dengan speedboat ambulans air ke Puskesmas Atsj guna mendapatkan perawatan terapi gizi terpadu.',
    participants: '3 Balita & Orang Tua, 3 Kader TPK, 1 Tenaga Medis Puskesmas', tag: 'Rujukan TPK', color: '#E67E22'
  },
  {
    id: 'doc-7', date: '2026-10-04', dateStr: '04 Oktober 2026', month: '2026-10', kab: 'Mimika', kampung: 'Nawaripi',
    output: '3.1 Tata Kelola', actCode: 'ACT-3.1.1',
    title: 'Rembuk Stunting & Evaluasi Konvergensi RAN PASTI Bersama Bappeda & TPPS',
    desc: 'Pertemuan koordinasi multipihak di tingkat distrik yang dihadiri perwakilan pemerintah distrik, kepala kampung, TPPS Mimika, dan tim donor PTFI. Pertemuan membahas komitmen alokasi dana kampung tahun 2027 untuk penyediaan makanan tambahan balita dan insentif kader posyandu.',
    participants: '35 Peserta (Bappeda, Dinkes, PMD, TPPS, Kepala Kampung, PTFI)', tag: 'Rembuk Stunting', color: '#FF5515'
  },
  {
    id: 'doc-8', date: '2026-09-28', dateStr: '28 September 2026', month: '2026-09', kab: 'Mimika', kampung: 'Atuka',
    output: '1.1 Agen Perubahan', actCode: 'ACT-1.1.1',
    title: 'Edukasi Praktik Pemberian Makan Bayi dan Anak (PMBA) di Pesisir Atuka',
    desc: 'Kunjungan rumah oleh Agen Perubahan Kampung Atuka untuk mempraktikkan pengolahan bubur lumat berbahan ikan tamban dan sayur labu kuning lokal bagi bayi usia 6–8 bulan. Ibu-ibu diajarkan tekstur makanan pendamping ASI (MP-ASI) yang tepat sesuai usia.',
    participants: '15 Ibu Balita, 3 Agen Perubahan Lokal', tag: 'Penyuluhan PMBA', color: '#FF5515'
  },
  {
    id: 'doc-9', date: '2026-09-18', dateStr: '18 September 2026', month: '2026-09', kab: 'Nabire', kampung: 'Bumi Wonorejo',
    output: '1.1 Agen Perubahan', actCode: 'ACT-1.1.2',
    title: 'Pelatihan Komunikasi Antar Pribadi (KAP) Agen Perubahan di Lembah Nabire',
    desc: 'Simulasi dan roleplay komunikasi persuasif bagi 20 agen perubahan terpilih dari Bumi Wonorejo, Wadio, dan Bumi Raya. Materi fokus pada cara mengatasi mitos/pantangan makanan lokal pada ibu hamil dan balita di Tanah Papua.',
    participants: '20 Agen Perubahan, 2 Fasilitator WVI', tag: 'Pelatihan KAP', color: '#0284C7'
  },
  {
    id: 'doc-10', date: '2026-09-22', dateStr: '22 September 2026', month: '2026-09', kab: 'Asmat', kampung: 'Akamar',
    output: '2.1 Layanan Primer', actCode: 'ACT-2.1.2',
    title: 'Pemeriksaan Antenatal Care (ANC) Terpadu & Skrining Anemia di Akamar',
    desc: 'Pelayanan kesehatan keliling dokter puskesmas bersama tim PASTI-Papua di pedalaman Distrik Akat. Sebanyak 14 ibu hamil menjalani USG portabel, cek hemoglobin darah, dan menerima konseling gizi kehamilan.',
    participants: '14 Ibu Hamil, 1 Dokter, 2 Bidan Desa', tag: 'ANC Terpadu', color: '#E67E22'
  },
  {
    id: 'doc-11', date: '2026-11-12', dateStr: '12 November 2026 (Rencana)', month: '2026-11', kab: 'Mimika', kampung: 'Nayaro',
    output: '1.2 Layanan Gizi Komunitas', actCode: 'ACT-1.2.1',
    title: 'Siklus Pos Gizi Lanjutan & Pengukuran Akhir Balita Stunting di Nayaro',
    desc: 'Rencana kegiatan evaluasi kelulusan balita dari siklus Pos Gizi 12 hari di Kampung Nayaro koridor MP 38. Dilengkapi sesi pemberian bibit tanaman sayur pekarangan untuk ketahanan pangan keluarga jangka panjang.',
    participants: 'Estimasi 20 Keluarga Balita, 4 Kader Posyandu', tag: 'Rencana Mendatang', color: '#FF5515'
  },
  {
    id: 'doc-12', date: '2026-11-20', dateStr: '20 November 2026 (Rencana)', month: '2026-11', kab: 'Nabire', kampung: 'Kali Harapan',
    output: '2.1 Layanan Primer', actCode: 'ACT-2.1.1',
    title: 'Refresher Pelatihan 25 Keterampilan Dasar Kader Posyandu di Kali Harapan',
    desc: 'Agenda penguatan kapasitas berkala kader posyandu Nabire dalam deteksi dini masalah gizi dan pencatatan kohort balita berbasis buku KIA revisi terbaru.',
    participants: 'Estimasi 30 Kader Posyandu & Pengurus PKK Kampung', tag: 'Rencana Mendatang', color: '#0284C7'
  }
];

let DOC_INDEX = 0;
let DOC_MONTH = 'Semua';
let DOC_KAB = 'Semua';
let DOC_TAB = 'gallery'; // 'gallery' | 'technical'

function getFilteredDocs() {
  return FIELD_DOCS.filter(d => {
    if (DOC_MONTH !== 'Semua' && d.month !== DOC_MONTH) return false;
    if (DOC_KAB !== 'Semua' && d.kab !== DOC_KAB) return false;
    return true;
  });
}

function slideDoc(delta) {
  const list = getFilteredDocs();
  if (!list.length) return;
  DOC_INDEX = (DOC_INDEX + delta + list.length) % list.length;
  render();
}

function setDocIndex(i) {
  DOC_INDEX = i;
  render();
}

function filterDocMonth(m) {
  DOC_MONTH = m;
  DOC_INDEX = 0;
  render();
}

function filterDocKab(k) {
  DOC_KAB = k;
  DOC_INDEX = 0;
  render();
}

function setDocTab(t) {
  DOC_TAB = t;
  render();
}

function renderDocCardImage(doc) {
  const isDark = THEME === 'dark';
  const c = doc.color || '#FF5515';
  return `
    <svg viewBox="0 0 600 360" class="ch" style="width:100%;height:100%;border-radius:8px;background:linear-gradient(135deg,${isDark ? '#181E29' : '#F8FAFC'} 0%,${isDark ? '#0F172A' : '#E2E8F0'} 100%)">
      <defs>
        <linearGradient id="docGrad${doc.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${c}" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <!-- Background pattern -->
      <rect width="600" height="360" fill="url(#docGrad${doc.id})" opacity="0.12"/>
      <circle cx="500" cy="80" r="140" fill="${c}" opacity="0.1"/>
      <circle cx="80" cy="300" r="110" fill="${c}" opacity="0.1"/>
      
      <!-- Field badge -->
      <g transform="translate(30, 40)">
        <rect width="180" height="32" rx="6" fill="${c}"/>
        <text x="14" y="21" font-size="12" font-weight="800" fill="#FFF"> DOKUMENTASI LAPANGAN</text>
      </g>
      
      <!-- Graphic thematic icon for the activity -->
      <g transform="translate(300, 160)">
        <circle cx="0" cy="0" r="54" fill="${c}" opacity="0.2"/>
        <circle cx="0" cy="0" r="42" fill="#111"/>
        <g transform="translate(-18,-18) scale(1.5)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS.camera}</g>
      </g>

      <!-- Overlay Caption text -->
      <rect x="20" y="250" width="560" height="90" rx="8" fill="${isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)'}" stroke="var(--line)"/>
      <text x="36" y="278" font-size="13" font-weight="800" fill="${c}">${doc.kampung}, ${doc.kab}</text>
      <text x="36" y="298" font-size="11.5" font-weight="700" fill="var(--ink)">${doc.title}</text>
      <text x="36" y="320" font-size="10.5" fill="var(--mut)">Pelaksanaan: ${doc.dateStr} · Program PASTI-Papua PTFI & WVI</text>
    </svg>
  `;
}

const CC = { Anak: '#FF5515', Remaja: '#FF8A5C', Dewasa: 'var(--k2)', Stakeholder: 'var(--k)' };

let LG = 'id', DB = null, SRC = 'sample', PAGE = 1, S = { kab: 'Semua', cat: 'Semua', sex: 'Semua', per: '', week: 'Semua' }, THEME = 'light', VIEW = 'auto';
const L = () => I[LG];
const num = n => Math.round(n).toLocaleString(LG === 'en' ? 'en-US' : 'id-ID');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mlab = (m, full) => { if (!m) return ''; const [y, mm] = m.split('-'); return MON[LG][+mm - 1] + (full ? ' ' + y : '') };
const catN = c => L().cats[c] || c;
const grpN = g => LG === 'en' ? (GRPEN[g] || g) : g;
const ageN = a => LG === 'en' ? a.replace('bulan', 'months').replace('tahun', 'years') : a;
const jN = j => LG === 'en' ? (JEN[j] || j) : j;
function toast(t) { const e = document.getElementById('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2500) }


/* Week Filter Helpers based on running dates */
function getWeekOptionsForMonth(yearMonth) {
  const ym = yearMonth || (DB && DB.pub ? DB.pub : '2026-09');
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isRunningMonth = ym === currentYm;
  const currentDay = now.getDate();
  const runningWeek = isRunningMonth ? (currentDay <= 7 ? 1 : currentDay <= 14 ? 2 : currentDay <= 21 ? 3 : currentDay <= 28 ? 4 : 5) : null;

  const weeks = [
    { w: '1', days: '1–7', labelId: `Minggu 1 (Tgl 1–7)${runningWeek === 1 ? ' · Berjalan' : ''}`, labelEn: `Week 1 (Days 1–7)${runningWeek === 1 ? ' · Current' : ''}` },
    { w: '2', days: '8–14', labelId: `Minggu 2 (Tgl 8–14)${runningWeek === 2 ? ' · Berjalan' : ''}`, labelEn: `Week 2 (Days 8–14)${runningWeek === 2 ? ' · Current' : ''}` },
    { w: '3', days: '15–21', labelId: `Minggu 3 (Tgl 15–21)${runningWeek === 3 ? ' · Berjalan' : ''}`, labelEn: `Week 3 (Days 15–21)${runningWeek === 3 ? ' · Current' : ''}` },
    { w: '4', days: '22–28', labelId: `Minggu 4 (Tgl 22–28)${runningWeek === 4 ? ' · Berjalan' : ''}`, labelEn: `Week 4 (Days 22–28)${runningWeek === 4 ? ' · Current' : ''}` },
  ];
  if (daysInMonth > 28) {
    weeks.push({
      w: '5',
      days: `29–${daysInMonth}`,
      labelId: `Minggu 5 (Tgl 29–${daysInMonth})${runningWeek === 5 ? ' · Berjalan' : ''}`,
      labelEn: `Week 5 (Days 29–${daysInMonth})${runningWeek === 5 ? ' · Current' : ''}`
    });
  }
  return { daysInMonth, runningWeek, weeks, isRunningMonth, activeYm: ym };
}

function validateWeekFilter() {
  const { weeks } = getWeekOptionsForMonth(S.per);
  if (S.week !== 'Semua' && !weeks.some(w => w.w === S.week)) {
    S.week = 'Semua';
  }
}

/* Seeded Generator matching exactly 4,367 reached and 6,420 target */
function generateSampleData() {
  let seed = 202609;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const KABS = {
    Mimika: ["Atuka", "Ayuka", "Fanamo", "Keakwa", "Kokonao", "Koperapoka", "Nawaripi", "Nayaro", "Ohotya", "Omawita", "Tipuka"],
    Nabire: ["Makimi", "Air Mandidi", "Bumi Wonorejo", "Siriwini", "Wadio", "Kali Harapan", "Bumi Raya"],
    Asmat: ["Akamar", "Birak", "Sesakam", "Warse"]
  };
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
  const specs = [
    ["Anak", "Balita", "0–23 bulan", "P", 8, 5, 3], ["Anak", "Balita", "24–59 bulan", "P", 7, 5, 3],
    ["Anak", "Balita", "0–23 bulan", "L", 8, 5, 3], ["Anak", "Balita", "24–59 bulan", "L", 7, 4, 3],
    ["Remaja", "Remaja", "10–14 tahun", "P", 10, 6, 4], ["Remaja", "Remaja", "15–18 tahun", "P", 10, 6, 4],
    ["Remaja", "Remaja", "10–14 tahun", "L", 9, 6, 4], ["Remaja", "Remaja", "15–18 tahun", "L", 9, 5, 4],
    ["Dewasa", "Ibu hamil", "19–24 tahun", "P", 4, 3, 2], ["Dewasa", "Ibu hamil", "25–49 tahun", "P", 6, 4, 2],
    ["Dewasa", "Ibu menyusui", "19–24 tahun", "P", 4, 3, 2], ["Dewasa", "Ibu menyusui", "25–49 tahun", "P", 7, 5, 3],
    ["Dewasa", "Pengasuh/ayah", "25–49 tahun", "P", 4, 2, 2], ["Dewasa", "Pengasuh/ayah", "50+ tahun", "P", 2, 1, 1],
    ["Dewasa", "Pengasuh/ayah", "25–49 tahun", "L", 7, 4, 3], ["Dewasa", "Pengasuh/ayah", "50+ tahun", "L", 3, 2, 1],
    ["Stakeholder", "Kader posyandu", "25–49 tahun", "P", 3, 2, 1], ["Stakeholder", "Kader posyandu", "50+ tahun", "P", 1, 1, 1],
    ["Stakeholder", "Kader posyandu", "25–49 tahun", "L", 1, 1, 1], ["Stakeholder", "Tenaga kesehatan", "25–49 tahun", "P", 2, 1, 1],
    ["Stakeholder", "Tenaga kesehatan", "25–49 tahun", "L", 1, 1, 1], ["Stakeholder", "Tokoh agama/adat", "25–49 tahun", "L", 1, 1, 1],
    ["Stakeholder", "Tokoh agama/adat", "50+ tahun", "L", 2, 1, 1], ["Stakeholder", "Agen perubahan", "15–18 tahun", "P", 1, 1, 1],
    ["Stakeholder", "Agen perubahan", "19–24 tahun", "P", 2, 1, 1], ["Stakeholder", "Agen perubahan", "25–49 tahun", "P", 1, 1, 1],
    ["Stakeholder", "Agen perubahan", "15–18 tahun", "L", 1, 1, 1], ["Stakeholder", "Agen perubahan", "19–24 tahun", "L", 2, 1, 1],
    ["Stakeholder", "Agen perubahan", "25–49 tahun", "L", 2, 1, 1], ["Stakeholder", "Pemerintah kampung/OPD", "25–49 tahun", "P", 1, 1, 1],
    ["Stakeholder", "Pemerintah kampung/OPD", "25–49 tahun", "L", 2, 1, 1], ["Stakeholder", "Pemerintah kampung/OPD", "50+ tahun", "L", 1, 1, 1]
  ];
  const pm = [];
  for (const m of months) {
    for (const [kab, kps] of Object.entries(KABS)) {
      const bIdx = kab === "Mimika" ? 4 : kab === "Nabire" ? 5 : 6;
      for (const sp of specs) {
        if (rnd() > 0.42) {
          const village = kps[Math.floor(rnd() * kps.length)];
          const val = Math.max(1, Math.round(sp[bIdx] * (0.6 + rnd() * 0.9)));
          const [yr, mo] = m.split("-").map(Number);
          const daysInMonth = new Date(yr, mo, 0).getDate();
          const day = Math.min(daysInMonth, Math.max(1, Math.floor(rnd() * daysInMonth) + 1));
          const weekNum = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : day <= 28 ? 4 : 5;
          pm.push({ periode: m, tanggal: `${m}-${String(day).padStart(2, "0")}`, minggu: weekNum, kabupaten: kab, kampung: village, kategori: sp[0], kelompok: sp[1], kelompok_umur: sp[2], jenis_kelamin: sp[3], capaian: val });
        }
      }
    }
  }
  let tot = pm.reduce((s, r) => s + r.capaian, 0);
  let diff = 4367 - tot;
  let idx = 0;
  while (diff !== 0 && idx < pm.length) {
    if (diff > 0) { pm[idx].capaian += 1; diff--; }
    else if (diff < 0 && pm[idx].capaian > 1) { pm[idx].capaian -= 1; diff++; }
    idx = (idx + 7) % pm.length;
  }
  const tgSpec = [
    ["Anak", "Balita", "P", 900], ["Anak", "Balita", "L", 900],
    ["Remaja", "Remaja", "P", 1248], ["Remaja", "Remaja", "L", 1152],
    ["Dewasa", "Ibu hamil", "P", 420], ["Dewasa", "Ibu menyusui", "P", 520],
    ["Dewasa", "Pengasuh/ayah", "P", 210], ["Dewasa", "Pengasuh/ayah", "L", 390],
    ["Stakeholder", "Kader posyandu", "P", 204], ["Stakeholder", "Kader posyandu", "L", 36],
    ["Stakeholder", "Tenaga kesehatan", "P", 82], ["Stakeholder", "Tenaga kesehatan", "L", 28],
    ["Stakeholder", "Tokoh agama/adat", "P", 18], ["Stakeholder", "Tokoh agama/adat", "L", 72],
    ["Stakeholder", "Agen perubahan", "P", 80], ["Stakeholder", "Agen perubahan", "L", 80],
    ["Stakeholder", "Pemerintah kampung/OPD", "P", 24], ["Stakeholder", "Pemerintah kampung/OPD", "L", 56]
  ];
  const target = [];
  for (const item of tgSpec) {
    target.push({ tahun: "2026", kabupaten: "Mimika", kategori: item[0], kelompok: item[1], jenis_kelamin: item[2], target: Math.round(item[3] * 0.5) });
    target.push({ tahun: "2026", kabupaten: "Nabire", kategori: item[0], kelompok: item[1], jenis_kelamin: item[2], target: Math.round(item[3] * 0.3) });
    target.push({ tahun: "2026", kabupaten: "Asmat", kategori: item[0], kelompok: item[1], jenis_kelamin: item[2], target: Math.round(item[3] * 0.2) });
  }
  const actTypes = [
    ["1.1", "Aksi agen perubahan"], ["1.1", "Pelatihan KAP"], ["1.2", "Pos Gizi / PMT lokal"],
    ["1.3", "Kelas berseri remaja"], ["1.3", "Kelas berseri bapak"], ["1.3", "Kelas ibu hamil"],
    ["1.4", "Pendampingan rujukan TPK"], ["2.1", "Pelatihan kader"], ["2.1", "Pelatihan nakes"], ["3.1", "Pertemuan lintas sektor"]
  ];
  const kegiatan = [];
  for (const m of months) {
    for (const kab of ["Mimika", "Nabire", "Asmat"]) {
      for (const at of actTypes) {
        if (rnd() > 0.48) {
          const [yrK, moK] = m.split("-").map(Number);
          const daysInMonthK = new Date(yrK, moK, 0).getDate();
          const dayK = Math.min(daysInMonthK, Math.max(1, Math.floor(rnd() * daysInMonthK) + 1));
          const weekNumK = dayK <= 7 ? 1 : dayK <= 14 ? 2 : dayK <= 21 ? 3 : dayK <= 28 ? 4 : 5;
          kegiatan.push({ periode: m, tanggal: `${m}-${String(dayK).padStart(2, "0")}`, minggu: weekNumK, kabupaten: kab, output: at[0], jenis_kegiatan: at[1], jumlah_kegiatan: Math.floor(rnd() * 3) + 1 });
        }
      }
    }
  }
  const indikator = [
    { level: "Goal", kode: "IG-1", indikator: "Cakupan keluarga berisiko stunting yang mendapat pendampingan", indicator_en: "Coverage of families at risk of stunting assisted", satuan: "%", target: 50, capaian: 41 },
    { level: "Goal", kode: "IG-2", indikator: "Ibu hamil yang mengonsumsi minimal 90 TTD", indicator_en: "Pregnant women consuming at least 90 IFA tablets", satuan: "%", target: 48, capaian: 39 },
    { level: "Output", kode: "IOP-1.1.1", indikator: "Agen perubahan lokal yang berpartisipasi bermakna", indicator_en: "Local AoC meaningfully participating", satuan: "orang", target: 160, capaian: 92 },
    { level: "Output", kode: "IOP-1.1.2", indikator: "Orang dilatih untuk kesetaraan gender (GNDR-8)", indicator_en: "Persons trained to advance gender equality (GNDR-8)", satuan: "orang", target: 310, capaian: 204 },
    { level: "Output", kode: "IOP-1.1.3", indikator: "Orang terjangkau karena perbaikan kebijakan", indicator_en: "People reached due to policy improvement", satuan: "orang", target: 8000, capaian: 3150 },
    { level: "Output", kode: "IOP-1.2.1", indikator: "Balita menerima intervensi gizi spesifik (HL.9-1)", indicator_en: "Children under five reached with nutrition interventions", satuan: "anak", target: 2800, capaian: 1246 },
    { level: "Output", kode: "IOP-1.3.1", indikator: "Remaja dijangkau (Youth-7)", indicator_en: "Youths reached (Youth-7)", satuan: "orang", target: 5500, capaian: 2410 },
    { level: "Output", kode: "IOP-1.3.2", indikator: "Peserta dengan pemahaman baik tentang stunting", indicator_en: "Participants with good stunting understanding", satuan: "%", target: 65, capaian: 48 },
    { level: "Output", kode: "IOP-1.4.1", indikator: "Kampung dengan mekanisme rujukan", indicator_en: "Villages with referral mechanisms", satuan: "kampung", target: 7, capaian: 4 },
    { level: "Output", kode: "IOP-2.1.1", indikator: "Individu menerima pelatihan gizi profesional (HL.9-4)", indicator_en: "Individuals receiving nutrition training (HL.9-4)", satuan: "orang", target: 250, capaian: 231 },
    { level: "Output", kode: "IOP-3.1.1", indikator: "Pertemuan stunting didanai dana lokal", indicator_en: "Stunting meetings funded by local funding", satuan: "pertemuan", target: 22, capaian: 11 }
  ];
  const info = [
    { kunci: "periode_terbit", nilai: "2026-09" },
    { kunci: "diperbarui", nilai: "2026-10-01" },
    { kunci: "tahun", nilai: "2026" }
  ];
  return { penerima_manfaat: pm, target, kegiatan, indikator, info };
}

/* Parser & Data Processing */
function csv(text) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c == '"') { if (text[i + 1] == '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c == '"') q = true;
    else if (c == ',' || c == ';') { r.push(f); f = '' }
    else if (c == '\n') { r.push(f); rows.push(r); r = []; f = '' }
    else if (c != '\r') f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r) }
  return rows.filter(x => x.some(v => String(v).trim() !== ''));
}
const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, '_');
const toObjs = rows => {
  if (!rows.length) return [];
  const h = rows[0].map(norm);
  return rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, String(r[i] ?? '').trim()])));
};
const NM = v => {
  const s = String(v).trim();
  if (/^-?\d+$/.test(s)) return +s;
  const x = parseFloat(s.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  return isNaN(x) ? 0 : x;
};
function period(v) {
  v = String(v).trim();
  if (/^\d{4}-\d{1,2}$/.test(v)) { const [y, m] = v.split('-'); return y + '-' + m.padStart(2, '0') }
  const d = new Date(v);
  if (!isNaN(d) && v.length > 6) return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  if (/^\d+(\.\d+)?$/.test(v)) {
    const dd = new Date(Date.UTC(1899, 11, 30) + (+v) * 864e5);
    return dd.getUTCFullYear() + '-' + String(dd.getUTCMonth() + 1).padStart(2, '0');
  }
  return v;
}
const sx = v => String(v || '').toUpperCase().startsWith('P') || /^(F|W)/i.test(v) ? 'P' : 'L';

function build(o) {
  const getWeekFromRecord = (r, idx) => {
    if (r.minggu && +r.minggu >= 1 && +r.minggu <= 5) return +r.minggu;
    if (r.tanggal) {
      const d = new Date(r.tanggal);
      if (!isNaN(d)) {
        const dt = d.getDate();
        return dt <= 7 ? 1 : dt <= 14 ? 2 : dt <= 21 ? 3 : dt <= 28 ? 4 : 5;
      }
    }
    return (idx % 4) + 1;
  };
  const pm = o.penerima_manfaat.map((r, i) => ({ p: period(r.periode), w: getWeekFromRecord(r, i), k: r.kabupaten, kp: r.kampung || '', c: r.kategori, g: r.kelompok, a: r.kelompok_umur, s: sx(r.jenis_kelamin), v: NM(r.capaian) })).filter(r => r.v > 0);
  const tg = o.target.map(r => ({ y: String(r.tahun).trim(), k: r.kabupaten, c: r.kategori, g: r.kelompok, s: sx(r.jenis_kelamin), v: NM(r.target) })).filter(r => r.v > 0);
  const kg = o.kegiatan.map((r, i) => ({ p: period(r.periode), w: getWeekFromRecord(r, i), k: r.kabupaten, o: String(r.output).trim(), j: r.jenis_kegiatan, v: NM(r.jumlah_kegiatan) })).filter(r => r.v > 0);
  const ind = (o.indikator || []).map(r => ({ lv: r.level, c: r.kode, n: r.indikator, ne: r.indicator_en || r.indikator, u: r.satuan, t: NM(r.target), a: NM(r.capaian) })).filter(r => r.c);
  const info = Object.fromEntries((o.info || []).map(r => [norm(r.kunci || ''), r.nilai || '']));
  const months = [...new Set([...pm.map(r => r.p), ...kg.map(r => r.p)])].sort();
  const pub = info.periode_terbit ? period(info.periode_terbit) : months[months.length - 1];
  const year = info.tahun || (pub || '').slice(0, 4);
  return {
    pm: pm.filter(r => r.p <= pub && r.p.startsWith(year)),
    tg: tg.filter(r => r.y === year),
    kg: kg.filter(r => r.p <= pub && r.p.startsWith(year)),
    ind, info, pub, year, docs: o.dokumentasi || [],
    months: months.filter(m => m <= pub && m.startsWith(year))
  };
}

/* Filtering */
const sum = (a, f) => a.reduce((s, r) => s + (!f || f(r) ? r.v : 0), 0);
function F(o = {}) {
  let pm = DB.pm, tg = DB.tg, kg = DB.kg;
  if (S.per) { pm = pm.filter(r => r.p <= S.per); kg = kg.filter(r => r.p <= S.per); }
  if (!o.noWeek && S.week && S.week !== 'Semua') {
    pm = pm.filter(r => r.p === (S.per || DB.pub) && String(r.w) === String(S.week));
    kg = kg.filter(r => r.p === (S.per || DB.pub) && String(r.w) === String(S.week));
  }
  if (!o.noKab && S.kab !== 'Semua') { pm = pm.filter(r => r.k === S.kab); tg = tg.filter(r => r.k === S.kab); kg = kg.filter(r => r.k === S.kab); }
  if (!o.noCat && S.cat !== 'Semua') { pm = pm.filter(r => r.c === S.cat); tg = tg.filter(r => r.c === S.cat); }
  if (!o.noSex && S.sex !== 'Semua') { pm = pm.filter(r => r.s === S.sex); tg = tg.filter(r => r.s === S.sex); }
  return { pm, tg, kg };
}
const KABS = () => [...new Set(DB.tg.map(r => r.k).concat(DB.pm.map(r => r.k)))].filter(Boolean);

function updateHash() {
  const parts = [`p=${SLIDE_NUMBERS[PAGE] - 1}`];
  if (S.kab !== 'Semua') parts.push(`kab=${encodeURIComponent(S.kab)}`);
  if (S.cat !== 'Semua') parts.push(`cat=${encodeURIComponent(S.cat)}`);
  if (S.sex !== 'Semua') parts.push(`sex=${encodeURIComponent(S.sex)}`);
  if (S.per) parts.push(`per=${encodeURIComponent(S.per)}`);
  if (S.week && S.week !== 'Semua') parts.push(`week=${encodeURIComponent(S.week)}`);
  location.hash = parts.join('&');
}

function readHash() {
  if (!location.hash) return;
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has('p') && Number.isInteger(Number(h.get('p')))) { const found = SLIDE_NUMBERS.indexOf(Number(h.get('p')) + 1); PAGE = found >= 0 ? found : 1; }
  if (h.has('kab')) S.kab = h.get('kab');
  if (h.has('cat')) S.cat = h.get('cat');
  if (h.has('sex')) S.sex = h.get('sex');
  if (h.has('per')) S.per = h.get('per');
  if (h.has('week')) S.week = h.get('week');
}

function slicers() {
  const l = L(), o = (v, t) => `<option value="${esc(v)}">${esc(t)}</option>`;
  const sel = (k, opts, extraChange = '') => `<select onchange="S.${k}=this.value;${extraChange}updateHash();render()" aria-label="${k}">${opts}</select>`.replace(`value="${esc(S[k])}"`, `value="${esc(S[k])}" selected`);
  const { weeks } = getWeekOptionsForMonth(S.per);
  const weekOpts = o('Semua', LG === 'en' ? 'All weeks (cumulative)' : 'Semua minggu (kumulatif)') +
    weeks.map(w => o(w.w, LG === 'en' ? w.labelEn : w.labelId)).join('');

  return `<div class="sl">
    <label>${l.kab}${sel('kab', o('Semua', l.all) + KABS().map(k => o(k, k)).join(''))}</label>
    <label>${l.cat}${sel('cat', o('Semua', l.all) + CATS.map(c => o(c, catN(c))).join(''))}</label>
    <label>${l.sex}${sel('sex', o('Semua', l.all) + o('P', l.P) + o('L', l.L))}</label>
    <label>${l.per}${sel('per', o('', mlab(DB.pub, true)) + DB.months.slice(0, -1).reverse().map(m => o(m, mlab(m, true))).join(''), 'validateWeekFilter();')}</label>
    <label>${LG === 'en' ? 'Week' : 'Minggu'}${sel('week', weekOpts)}</label>
    <button class="rs" onclick="S={kab:'Semua',cat:'Semua',sex:'Semua',per:'',week:'Semua'};updateHash();render()">${l.reset}</button>
  </div>`;
}

function renderChips() {
  const l = L(), list = [];
  if (S.kab !== 'Semua') list.push({ l: `${l.kab}: ${S.kab}`, fn: "S.kab='Semua'" });
  if (S.cat !== 'Semua') list.push({ l: `${l.cat}: ${catN(S.cat)}`, fn: "S.cat='Semua'" });
  if (S.sex !== 'Semua') list.push({ l: `${l.sex}: ${S.sex === 'P' ? l.P : l.L}`, fn: "S.sex='Semua'" });
  if (S.per) list.push({ l: `${l.per}: ${mlab(S.per, true)}`, fn: "S.per=''" });
  if (S.week && S.week !== 'Semua') {
    const { weeks } = getWeekOptionsForMonth(S.per);
    const matchW = weeks.find(w => w.w === S.week);
    const wLabel = matchW ? (LG === 'en' ? matchW.labelEn : matchW.labelId) : `Minggu ${S.week}`;
    list.push({ l: `${LG === 'en' ? 'Week' : 'Minggu'}: ${wLabel}`, fn: "S.week='Semua'" });
  }
  if (!list.length) return '';
  return `<div class="chips"><span>${l.filterActive}</span>${list.map(c => `<span class="chip">${esc(c.l)}<button onclick="${c.fn};updateHash();render()"></button></span>`).join('')}</div>`;
}

/* Visuals & SVG Charts */
function donut(parts, label, sub) {
  const tot = parts.reduce((a, p) => a + p.v, 0) || 1; let a0 = -Math.PI / 2; const r = 68, c = 90;
  const seg = parts.map(p => {
    const a1 = a0 + p.v / tot * Math.PI * 2; const lg = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${lg} 1 ${c + r * Math.cos(a1 - 1e-4)},${c + r * Math.sin(a1 - 1e-4)}`;
    a0 = a1; return `<path d="${d}" stroke="${p.c}" stroke-width="22" fill="none" stroke-linecap="round"/>`;
  }).join('');
  return `<svg viewBox="0 0 180 180" class="ch" role="img" aria-label="${esc(label)}">
    <circle cx="${c}" cy="${c}" r="${r}" stroke="var(--soft)" stroke-width="22" fill="none"/>
    ${seg}
    <text x="90" y="${sub ? 86 : 94}" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)" class="tabular">${label}</text>
    ${sub ? `<text x="90" y="106" text-anchor="middle" font-size="11" fill="var(--mut)">${esc(sub)}</text>` : ''}
  </svg>`;
}

function gauge(p) {
  const a = Math.min(p, 100) / 100 * Math.PI; const r = 80, cx = 100, cy = 100;
  const x = cx - r * Math.cos(a), y = cy - r * Math.sin(a);
  return `<svg viewBox="0 0 200 120" class="ch" role="img" aria-label="${p}%">
    <path d="M20,100 A80,80 0 0 1 180,100" stroke="var(--soft)" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M20,100 A80,80 0 0 1 ${x},${y}" stroke="#FF5515" stroke-width="18" fill="none" stroke-linecap="round"/>
    <text x="100" y="96" text-anchor="middle" font-size="32" font-weight="800" fill="var(--ink)" class="tabular">${p}%</text>
  </svg>`;
}

function trend(series, T, months, stack) {
  if (!months.length) return '';
  const W = isMob() ? 400 : 640, H = 280, pl = 48, pr = 70, pt = 16, pb = 26, n = months.length;
  const tot = months.map((_, i) => series.reduce((s, x) => s + x.vals[i], 0));
  let c = 0; const cum = tot.map(v => c += v);
  const mx = Math.max(T || 0, cum[n - 1] || 0, 1);
  const bw = (W - pl - pr) / n; const x = i => pl + bw * i + bw / 2;
  const y = v => pt + (H - pt - pb) * (1 - v / mx);
  const yb = v => (H - pt - pb) * v / mx;
  let g = '';
  for (let k = 0; k <= 4; k++) {
    const v = mx * k / 4;
    g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/>
    <text x="${pl - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="central" font-size="12" fill="var(--mut)" class="tabular">${num(v)}</text>`;
  }
  const bars = months.map((m, i) => {
    let base = 0;
    return series.map(sr => {
      const h = yb(sr.vals[i]);
      const r = `<rect x="${x(i) - bw * .28}" y="${H - pb - base - h}" width="${bw * .56}" height="${h}" fill="${sr.c}" opacity="${stack ? 1 : .35}" rx="2">
        <title>${esc(sr.n)} ${mlab(m)}: ${num(sr.vals[i])}</title>
      </rect>`;
      base += h; return r;
    }).join('');
  }).join('');
  const line = cum.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const tl = T ? `<line x1="${pl}" x2="${W - pr}" y1="${y(T)}" y2="${y(T)}" stroke="var(--ink)" stroke-dasharray="4 3"/>
    <text x="${W - pr + 4}" y="${y(T)}" dominant-baseline="central" font-size="10" font-weight="700" fill="var(--ink)">${L().target}</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" class="ch" preserveAspectRatio="xMidYMid meet" role="img" aria-label="trend">
    ${g}${bars}${tl}
    <polyline points="${line}" fill="none" stroke="#FF5515" stroke-width="2.5"/>
    ${cum.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#FF5515"/>`).join('')}
    <text x="${x(n - 1) + 6}" y="${y(cum[n - 1])}" dominant-baseline="central" font-size="13" font-weight="800" fill="var(--ink)" class="tabular">${num(cum[n - 1])}</text>
    ${months.map((m, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--mut)">${mlab(m)}</text>`).join('')}
  </svg>`;
}

const hb = (label, val, max, color, extra, tgt) => `
<div class="hb">
  <span>${label}</span>
  <div class="tr"><i style="width:${max ? Math.min(100, val / max * 100) : 0}%;background:${color}"></i>${tgt != null ? `<u style="left:${Math.min(100, tgt / max * 100)}%"></u>` : ''}</div>
  <b class="tabular">${extra ?? num(val)}</b>
</div>`;
const months = () => DB.months.filter(m => !S.per || m <= S.per);

/* Pages 1 through 8 */
const REGION_INFO = {
  Mimika: {
    prov: 'Papua Tengah',
    center: 'Timika [136.88° BT, -4.55° LS]',
    desc: 'Dataran rendah & pesisir pantai selatan Papua, kawasan operasional dan kemitraan PTFI.',
    villages: ['Atuka', 'Ayuka', 'Fanamo', 'Keakwa', 'Kokonao', 'Koperapoka', 'Nawaripi', 'Nayaro', 'Ohotya', 'Omawita', 'Tipuka']
  },
  Nabire: {
    prov: 'Papua Tengah',
    center: 'Nabire [135.50° BT, -3.37° LS]',
    desc: 'Pesisir Teluk Cenderawasih bagian utara, pintu gerbang logistik & pemerintahan Papua Tengah.',
    villages: ['Makimi', 'Air Mandidi', 'Bumi Wonorejo', 'Siriwini', 'Wadio', 'Kali Harapan', 'Bumi Raya']
  },
  Asmat: {
    prov: 'Papua Selatan',
    center: 'Agats [138.13° BT, -5.54° LS]',
    desc: 'Kawasan delta pasang surut sungai & rawa berlumpur, kota di atas papan kayu dan transportasi perahu.',
    villages: ['Akamar', 'Birak', 'Sesakam', 'Warse']
  }
};


const PG = [
  () => { /* 1: Map */
    const l = L(); const { pm, tg } = F({ noKab: true });
    const kd = KABS().map(k => {
      const a = sum(pm, r => r.k === k && r.c === 'Anak');
      const m = sum(pm, r => r.k === k && r.c !== 'Anak');
      const t = sum(tg, r => r.k === k);
      return { k, a, m, t, p: pct(a + m, t) };
    });
    const curReg = REGION_INFO[S.kab] || null;
    const activeVill = ACTIVE_VILLAGE ? VILLAGES.find(v => v.name === ACTIVE_VILLAGE) : null;
    let villStats = null;
    if (activeVill) {
      const vPm = DB.pm.filter(r => r.kp === activeVill.name);
      villStats = {
        tot: sum(vPm),
        anak: sum(vPm, r => r.c === 'Anak'),
        remaja: sum(vPm, r => r.c === 'Remaja'),
        dewasa: sum(vPm, r => r.c === 'Dewasa'),
        stake: sum(vPm, r => r.c === 'Stakeholder'),
        p: sum(vPm, r => r.s === 'P'),
        l: sum(vPm, r => r.s === 'L')
      };
    }

    return `<div class="pc g1">
      <div class="v" style="overflow:auto">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:10px;padding:2px 6px;background:var(--or4);color:var(--or);border-radius:4px;font-weight:800">PROGRAM PTFI</span>
          <span style="font-size:10px;color:var(--mut)">Sep 2024 – Okt 2027</span>
        </div>
        <h3 style="margin:2px 0 4px">PASTI-Papua</h3>
        <p style="margin:0 0 6px;font-size:11.5px">${l.goal}</p>
        <dl class="facts">${l.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('')}</dl>
        <div class="ochip">${l.obj.map(o => `<span>${o}</span>`).join('')}</div>
        
        <h3 style="margin-top:12px">${l.reach} <small>${l.child} · ${l.comm}</small></h3>
        ${kd.map(d => `<div class="kr ${S.kab === d.k ? 'on' : ''}" onclick="selectTerritory('${d.k}')">
          <span class="nm">${d.k}</span>
          <span class="c1">${num(d.a)} ${l.child.toLowerCase()}</span>
          <span>${num(d.m)} ${l.comm.toLowerCase()}</span>
          <span class="pc2 tabular">${d.p}%</span>
        </div>`).join('')}

        ${activeVill && villStats ? `
          <div class="map-card-reg" style="border-left:3.5px solid var(--or);background:var(--or4)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <b style="font-size:12px;color:var(--or)"> Kampung ${activeVill.name}</b>
              <button onclick="ACTIVE_VILLAGE=null;render();placeMap()" style="border:0;background:transparent;font-weight:800;cursor:pointer;color:var(--mut)"></button>
            </div>
            <div style="font-size:10.5px;color:var(--ink);margin:2px 0">${activeVill.k} · ${activeVill.zone}</div>
            <div style="font-size:10px;color:var(--mut);line-height:1.3">${activeVill.desc}</div>
            <div style="margin-top:6px;display:grid;grid-template-columns:repeat(2,1fr);gap:4px;font-size:10.5px">
              <div style="background:var(--card);padding:4px 6px;border-radius:4px"><b>${num(villStats.tot)}</b> <span style="color:var(--mut)">jiwa terjangkau</span></div>
              <div style="background:var(--card);padding:4px 6px;border-radius:4px"><b>${num(villStats.anak)}</b> <span style="color:var(--or)">balita/anak</span></div>
              <div style="background:var(--card);padding:4px 6px;border-radius:4px"><b>${num(villStats.p)}</b> <span style="color:var(--mut)">perempuan</span></div>
              <div style="background:var(--card);padding:4px 6px;border-radius:4px"><b>${num(villStats.l)}</b> <span style="color:var(--mut)">laki-laki</span></div>
            </div>
          </div>
        ` : curReg ? `
          <div class="map-card-reg">
            <div style="display:flex;justify-content:space-between;font-weight:800;color:var(--or)">
              <span> ${S.kab} (${curReg.prov})</span>
              <span class="tabular">${curReg.villages.length} ${l.kampung}</span>
            </div>
            <div style="font-size:10px;color:var(--mut);margin-top:2px">${curReg.center}</div>
            <div style="font-size:10.5px;color:var(--ink);margin:4px 0">${curReg.desc}</div>
            <div class="vill-tags">${curReg.villages.map(v => `<span class="vill-tag" style="cursor:pointer" onclick="showVillageDetail('${v}')">${v}</span>`).join('')}</div>
          </div>
        ` : `
          <div style="margin-top:10px;padding:9px 11px;border-radius:8px;background:var(--soft);border:1px solid var(--line);font-size:10.5px;color:var(--mut);line-height:1.4">
             <b>Interaksi Peta:</b> Klik salah satu kabupaten atau pin kampung pada peta di sebelah kanan untuk melihat sebaran 22 kampung dampingan secara detail.
          </div>
        `}
      </div>

      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
          <div>
            <h3 style="margin:0"><span id="mapTitle"> Peta Wilayah Intervensi PASTI-Papua</span></h3>
            <small style="color:var(--mut);font-size:10.5px">Mimika · Nabire (Papua Tengah) & Asmat (Papua Selatan) — 22 Kampung Dampingan</small>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <div class="terr-bar" style="margin-bottom:0">
              <button class="terr-btn ${S.kab === 'Semua' ? 'on' : ''}" onclick="selectTerritory('Semua')"> Seluruh Papua (3 Kab)</button>
              <button class="terr-btn ${S.kab === 'Mimika' ? 'on' : ''}" onclick="selectTerritory('Mimika')"> Mimika (11)</button>
              <button class="terr-btn ${S.kab === 'Nabire' ? 'on' : ''}" onclick="selectTerritory('Nabire')"> Nabire (7)</button>
              <button class="terr-btn ${S.kab === 'Asmat' ? 'on' : ''}" onclick="selectTerritory('Asmat')"> Asmat (4)</button>
            </div>
            <div class="tg">
              <button class="map-mode-btn ${MAPMODE !== 'gis' ? 'on' : ''}" onclick="setMapMode('design')" title="Peta Desain Geografis Tanah Papua (Presisi & Resolusi Tinggi)"> Peta Desain</button>
              <button class="map-mode-btn ${MAPMODE === 'gis' ? 'on' : ''}" onclick="setMapMode('gis')" title="Peta Satelit 2D WebGL (Top-Down Orthogonal)"> Satelit 2D</button>
            </div>
          </div>
        </div>

        <div class="vb map">
          <div id="mapSlot" style="position:absolute;inset:0"></div>
          <div class="mctl">
            <button onclick="mapZoom(0.2)" title="Perbesar / Zoom In" aria-label="Zoom in">＋</button>
            <button onclick="mapZoom(-0.2)" title="Perkecil / Zoom Out" aria-label="Zoom out">－</button>
            <button onclick="mapReset()" title="Reset Tampilan Peta" aria-label="Reset">↺</button>
          </div>
          <div class="mleg" style="display:flex;align-items:center;gap:10px;font-size:10.5px;padding:5px 9px">
            <div><i style="background:#FF5515;width:8px;height:8px;border-radius:50%"></i>${l.child} (0–59 bln)</div>
            <div><i style="background:var(--ink);width:8px;height:8px;border-radius:50%"></i>${l.comm}</div>
            <div style="border-left:1px solid var(--line);padding-left:8px;color:var(--mut)">22 Kampung Dampingan</div>
          </div>
        </div>
      </div>
    </div>`;
  },
  () => { /* 2: Overview */
    const l = L(); const { pm, tg, kg } = F();
    if (SRC === 'sheet' && !DB.pm.length && !DB.tg.length && !DB.kg.length) {
      return `<div class="pc"><div class="v"><h2>${LG === 'en' ? 'No approved results yet' : 'Belum ada capaian terverifikasi'}</h2><p>${LG === 'en' ? 'Enter data in the Google Sheet and ask MEAL to verify it. Approved results will appear after synchronization.' : 'Isi data di Google Sheet dan minta MEAL memverifikasi. Capaian akan tampil setelah sinkronisasi berikutnya.'}</p></div></div>`;
    }
    const T = sum(tg), C = sum(pm);
    const A = sum(pm, r => r.c === 'Anak'), At = sum(tg, r => r.c === 'Anak');

    // Sex Breakdown
    const P = sum(pm, r => r.s === 'P');
    const L_val = sum(pm, r => r.s === 'L');
    const Pt = sum(tg, r => r.s === 'P');
    const Lt = sum(tg, r => r.s === 'L');

    // Sub-demographics for Female (P)
    const A_P = sum(pm, r => r.s === 'P' && r.c === 'Anak');
    const R_P = sum(pm, r => r.s === 'P' && r.c === 'Remaja');
    const D_P = sum(pm, r => r.s === 'P' && (r.c === 'Dewasa' || r.c === 'Stakeholder'));

    // Sub-demographics for Male (L)
    const A_L = sum(pm, r => r.s === 'L' && r.c === 'Anak');
    const R_L = sum(pm, r => r.s === 'L' && r.c === 'Remaja');
    const D_L = sum(pm, r => r.s === 'L' && (r.c === 'Dewasa' || r.c === 'Stakeholder'));

    const K = sum(kg);
    const kp = new Set(pm.map(r => r.kp).filter(Boolean)).size;
    const ms = months();
    const ser = [{ n: l.total, c: '#FF8A5C', vals: ms.map(m => sum(pm, r => r.p === m)) }];
    const kd = KABS().filter(k => S.kab === 'Semua' || k === S.kab).map(k => ({ k, c: sum(pm, r => r.k === k), t: sum(tg, r => r.k === k) }));
    const cs = CATS.map(c => ({ c, p: pct(sum(pm, r => r.c === c), sum(tg, r => r.c === c)), t: sum(tg, r => r.c === c) })).filter(x => x.t);
    const lo = cs.sort((a, b) => a.p - b.p)[0];
    const hi = [...kd].sort((a, b) => pct(b.c, b.t) - pct(a.c, a.t))[0];
    const last = ms[ms.length - 1];

    // Weekly Information based on current active month
    const activeYm = S.per || (DB && DB.pub ? DB.pub : '2026-09');
    const { weeks, runningWeek, isRunningMonth, daysInMonth } = getWeekOptionsForMonth(activeYm);
    const activeWeekObj = S.week && S.week !== 'Semua' ? weeks.find(w => w.w === S.week) : null;

    // Age Category Metadata and Calculations
    const ageMetaMap = {
      '0–23 bulan': { badge: 'Baduta (1.000 HPK)', tag: 'Intervensi Prioritas Stunting', color: '#FF5515', bg: 'rgba(255,85,21,0.1)' },
      '24–59 bulan': { badge: 'Balita (2–4 thn)', tag: 'Pemantauan Posyandu', color: '#FA541C', bg: 'rgba(250,84,28,0.1)' },
      '10–14 tahun': { badge: 'Remaja Awal', tag: 'Pencegahan Anemia', color: '#FA8C16', bg: 'rgba(250,140,22,0.1)' },
      '15–18 tahun': { badge: 'Remaja Akhir', tag: 'SBC & Remaja Putri', color: '#13C2C2', bg: 'rgba(19,194,194,0.1)' },
      '19–24 tahun': { badge: 'Dewasa Muda', tag: 'Calon Pengantin (Catin)', color: '#1890FF', bg: 'rgba(24,144,255,0.1)' },
      '25–49 tahun': { badge: 'Dewasa Produktif', tag: 'Bumil, Busui & Ayah', color: '#722ED1', bg: 'rgba(114,46,209,0.1)' },
      '50+ tahun': { badge: 'Lansia / Tokoh', tag: 'Tokoh Adat & Agama', color: '#595959', bg: 'rgba(89,89,89,0.1)' }
    };

    const ageCards = AGES.map(age => {
      const val = sum(pm, r => r.a === age);
      const pVal = sum(pm, r => r.a === age && r.s === 'P');
      const lVal = sum(pm, r => r.a === age && r.s === 'L');
      const pShare = pct(pVal, val);
      const lShare = 100 - pShare;
      const totalShare = pct(val, C);
      const meta = ageMetaMap[age] || { badge: age, tag: '', color: 'var(--mut)', bg: 'var(--soft)' };
      return { age, val, pVal, lVal, pShare, lShare, totalShare, meta };
    });

    const badutaReach = sum(pm, r => r.a === '0–23 bulan');
    const balitaReach = sum(pm, r => r.a === '24–59 bulan');
    const allBalitaReach = badutaReach + balitaReach;
    const remajaReach = sum(pm, r => r.a === '10–14 tahun' || r.a === '15–18 tahun');
    const dewasaReach = sum(pm, r => r.a === '19–24 tahun' || r.a === '25–49 tahun');
    const lansiaReach = sum(pm, r => r.a === '50+ tahun');

    return `<div class="pc g2">
      ${S.week && S.week !== 'Semua' ? `
        <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;padding:7px 14px;background:rgba(255,85,21,0.07);border:1px solid rgba(255,85,21,0.3);border-radius:8px;font-size:12px;margin-bottom:2px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="background:#FF5515;color:#fff;padding:2px 8px;border-radius:4px;font-weight:800;font-size:10.5px">MINGGU ${esc(S.week)}</span>
            <b>Filter Mingguan:</b>
            <span>Periode ${mlab(activeYm, true)} · Tanggal ${activeWeekObj ? activeWeekObj.days : ''} ${activeWeekObj && activeWeekObj.labelId.includes('Berjalan') ? '<span style="color:#FF5515;font-weight:700">(Sedang Berjalan)</span>' : ''}</span>
            <span style="color:var(--mut)">— <b>${num(C)}</b> jiwa terjangkau pada minggu ini</span>
          </div>
          <button class="terr-btn on" onclick="S.week='Semua';updateHash();render()" style="margin:0;padding:2px 8px;font-size:11px">Tampilkan Semua Minggu </button>
        </div>` : ''}

      <!-- KPI 1: Total Reach -->
      <div class="v kpi kpi-total dk">
        <div class="l">${l.reach} (Total)</div>
        <div class="n">${num(C)} <small>/ ${num(T)}</small></div>
        <div class="pb"><i style="width:${Math.min(100, pct(C, T))}%"></i></div>
        <div class="s">${T > 0 ? `${pct(C, T)}% ${l.ofT} ${T - C > 0 ? `· ${num(T - C)} target tersisa` : '· Target terpenuhi'}` : (LG === 'en' ? 'No approved target is available' : 'Belum ada target terverifikasi')}</div>
      </div>

      <!-- KPI 2: Anak Balita (0–59 bulan) -->
      <div class="v kpi kpi-child">
        <div class="l" style="display:flex;justify-content:space-between;align-items:center">
          <span>${l.child} (0–59 bln)</span>
          <span style="font-size:10px;font-weight:800;color:#FF5515">${pct(A, C)}% ${LG === 'en' ? 'of total' : 'dari total'}</span>
        </div>
        <div class="n" style="color:#FF5515">${num(A)} <small>/ ${num(At)}</small></div>
        <div class="pb"><i style="width:${Math.min(100, pct(A, At))}%;background:#FF5515"></i></div>
        <div class="s">${pct(A, At)}% ${l.ofT} · Baduta 1.000 HPK: <b>${num(badutaReach)}</b></div>
      </div>

      <!-- KPI 3: Card Sex Perempuan -->
      <div class="v kpi kpi-p" style="border-top:3px solid #FF5515">
        <div class="l" style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--ink);font-weight:700">${LG === 'en' ? 'Female' : 'Perempuan'}</span>
          <span style="background:rgba(255,85,21,0.12);color:#FF5515;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:800">${pct(P, C)}% ${LG === 'en' ? 'of total' : 'dari total'}</span>
        </div>
        <div class="n" style="color:#FF5515">${num(P)} <small style="font-size:12px;color:var(--mut)">/ ${num(Pt)}</small></div>
        <div class="pb"><i style="width:${Math.min(100, pct(P, Pt))}%;background:#FF5515"></i></div>
        <div class="s" style="font-size:10px;line-height:1.35">
          <b>${pct(P, Pt)}% target perempuan tercapai</b><br>
          <span style="color:var(--mut)">Balita: ${num(A_P)} · Remaja: ${num(R_P)} · Dewasa: ${num(D_P)}</span>
        </div>
      </div>

      <!-- KPI 4: Card Sex Laki-laki -->
      <div class="v kpi kpi-l" style="border-top:3px solid #2F80ED">
        <div class="l" style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--ink);font-weight:700">${LG === 'en' ? 'Male' : 'Laki-laki'}</span>
          <span style="background:rgba(47,128,237,0.12);color:#2F80ED;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:800">${pct(L_val, C)}% ${LG === 'en' ? 'of total' : 'dari total'}</span>
        </div>
        <div class="n" style="color:#2F80ED">${num(L_val)} <small style="font-size:12px;color:var(--mut)">/ ${num(Lt)}</small></div>
        <div class="pb"><i style="width:${Math.min(100, pct(L_val, Lt))}%;background:#2F80ED"></i></div>
        <div class="s" style="font-size:10px;line-height:1.35">
          <b>${pct(L_val, Lt)}% target laki-laki tercapai</b><br>
          <span style="color:var(--mut)">Balita: ${num(A_L)} · Remaja: ${num(R_L)} · Dewasa: ${num(D_L)}</span>
        </div>
      </div>

      <!-- KPI 5: Kegiatan & Wilayah -->
      <div class="v kpi kpi-act">
        <div class="l">${l.act} & Cakupan Wilayah</div>
        <div class="n">${num(K)} <small>kegiatan</small></div>
        <div class="coverage-stats"><div><strong>${kp}</strong><span>${LG === 'en' ? 'villages reached' : 'kampung terjangkau'}</span></div><div><strong>${new Set(pm.map(r => r.k)).size}</strong><span>${LG === 'en' ? 'regencies' : 'kabupaten'}</span></div></div><p class="card-help">${[...new Set(pm.map(r => r.k))].join(' · ') || (LG === 'en' ? 'No reach in this selection' : 'Belum ada capaian pada pilihan ini')}</p><button class="detail-link" onclick="go(5)">${LG === 'en' ? 'View activity details' : 'Lihat rincian kegiatan'} →</button>
      </div>

      <div class="v age-reach">
        <div class="section-heading"><h3>${LG === 'en' ? 'Beneficiaries by age' : 'Penerima manfaat menurut usia'}</h3><span>${num(C)} ${LG === 'en' ? 'people reached' : 'jiwa terjangkau'}</span></div>
        <div class="age-grid">${ageCards.map(d => `
          <div class="age-tile">
            <div class="age-title">${esc(ageN(d.age))}</div>
            <div class="age-value tabular">${num(d.val)}</div>
            <div class="age-share">${d.totalShare}% ${LG === 'en' ? 'of total' : 'dari total'}</div>
            <div class="age-bar" aria-label="${l.P}: ${num(d.pVal)}, ${l.L}: ${num(d.lVal)}"><i style="width:${d.pShare}%;background:var(--or)"></i><i style="width:${d.lShare}%;background:#2F80ED"></i></div>
            <div class="age-split tabular"><span title="${l.P}">P ${num(d.pVal)}</span><span title="${l.L}">L ${num(d.lVal)}</span></div>
          </div>`).join('')}</div>
        <div class="age-note"><b>${LG === 'en' ? 'Early childhood priority' : 'Prioritas anak usia dini'}</b><span>${LG === 'en' ? 'Children 0–23 months' : 'Baduta 0–23 bulan'}: <strong>${num(badutaReach)}</strong> · ${LG === 'en' ? 'Children under five' : 'Total balita 0–59 bulan'}: <strong>${num(allBalitaReach)}</strong></span></div>
        <div class="lg"><span><i style="background:var(--or)"></i>P = ${l.P}</span><span><i style="background:#2F80ED"></i>L = ${l.L}</span><span>${LG === 'en' ? 'Percentages show share of total reach.' : 'Persentase menunjukkan proporsi dari total terjangkau.'}</span></div>
      </div>

      <!-- Gauge, Trend, Kabs -->
      <div class="v gauge"><h3>${l.gauge}</h3><div class="vb chbox">${gauge(pct(C, T))}</div></div>
      <div class="v trend"><h3>${l.trend}</h3><div class="vb chbox">${trend(ser, T, ms, true)}</div><div class="lg"><span><i style="background:var(--or)"></i>${l.cum}</span><span><i style="background:var(--or2)"></i>${LG === 'en' ? 'New each month' : 'Baru per bulan'}</span><span>${LG === 'en' ? 'Dashed line: annual target' : 'Garis putus-putus: target tahunan'}</span></div></div>
      <div class="v kabs"><h3>${l.byKab}</h3><p class="card-help">${LG === 'en' ? 'Reach / annual target' : 'Terjangkau / target tahunan'}</p>${kd.map(d => `<div class="regency-row"><div><b>${d.k}</b><strong>${pct(d.c, d.t)}%</strong></div><div class="pb"><i style="width:${Math.min(100,pct(d.c,d.t))}%"></i></div><small>${num(d.c)} / ${num(d.t)} ${LG === 'en' ? 'people' : 'jiwa'}</small></div>`).join('')}</div>

      <!-- Highlights -->
      <div class="v insg"><h3>${l.ins}</h3><div class="insights-grid">${[hi && hi.t ? l.ins1(hi.k, pct(hi.c, hi.t)) : '', lo ? l.ins2(catN(lo.c), lo.p) : '', l.ins3(pct(P, C)), last ? l.ins4(num(sum(kg, r => r.p === last)), mlab(last, true)) : ''].filter(Boolean).map((x, i) => `<div class="ins"><b>${i + 1}</b><span>${x}</span></div>`).join('')}</div></div>
    </div>`;
  },
  () => { /* 4: Age & Sex */
    const l = L(); const { pm } = F(); const ag = AGES.filter(a => pm.some(r => r.a === a));
    const mx = Math.max(1, ...ag.flatMap(a => [sum(pm, r => r.a === a && r.s === 'P'), sum(pm, r => r.a === a && r.s === 'L')]));
    const P = sum(pm, r => r.s === 'P'), C = sum(pm);
    const balitaTot = sum(pm, r => r.a === '0–23 bulan' || r.a === '24–59 bulan');
    const hpkTot = sum(pm, r => r.a === '0–23 bulan');
    const remajaTot = sum(pm, r => r.a === '10–14 tahun' || r.a === '15–18 tahun');
    const wusTot = sum(pm, r => (r.a === '19–24 tahun' || r.a === '25–49 tahun') && r.s === 'P');

    // Village breakdown
    const vList = [...new Set(pm.map(r => r.kp).filter(Boolean))].map(kp => {
      const rs = pm.filter(r => r.kp === kp);
      return {
        kp,
        k: rs[0]?.k || '',
        tot: sum(rs),
        balita: sum(rs, r => r.a === '0–23 bulan' || r.a === '24–59 bulan'),
        remaja: sum(rs, r => r.a === '10–14 tahun' || r.a === '15–18 tahun'),
        dewasa: sum(rs, r => r.a === '19–24 tahun' || r.a === '25–49 tahun'),
        lansia: sum(rs, r => r.a === '50+ tahun'),
        p: sum(rs, r => r.s === 'P'),
        l: sum(rs, r => r.s === 'L')
      };
    }).sort((a, b) => b.tot - a.tot);

    return `<div class="pc" style="grid-template-columns:1.25fr 1fr;grid-template-rows:auto 1fr;gap:10px">
      <!-- Top Demographic KPI Strip -->
      <div style="grid-column:1/3;display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
        <div class="v" style="padding:8px 10px;background:linear-gradient(135deg,var(--card) 0%,var(--soft) 100%)">
          <div style="font-size:10.5px;color:var(--mut);font-weight:700">Total Balita (0–59 bln)</div>
          <div style="font-size:20px;font-weight:800;color:#FF5515;margin-top:2px">${num(balitaTot)} <small style="font-size:11px;color:var(--mut)">(${pct(balitaTot, C)}%)</small></div>
        </div>
        <div class="v" style="padding:8px 10px;background:linear-gradient(135deg,var(--card) 0%,var(--soft) 100%)">
          <div style="font-size:10.5px;color:var(--mut);font-weight:700"> Emas 1.000 HPK (0–23 bln)</div>
          <div style="font-size:20px;font-weight:800;color:#FF8A5C;margin-top:2px">${num(hpkTot)} <small style="font-size:11px;color:var(--mut)">(${pct(hpkTot, C)}%)</small></div>
        </div>
        <div class="v" style="padding:8px 10px;background:linear-gradient(135deg,var(--card) 0%,var(--soft) 100%)">
          <div style="font-size:10.5px;color:var(--mut);font-weight:700"> Remaja (10–18 thn)</div>
          <div style="font-size:20px;font-weight:800;color:var(--ink);margin-top:2px">${num(remajaTot)} <small style="font-size:11px;color:var(--mut)">(${pct(remajaTot, C)}%)</small></div>
        </div>
        <div class="v" style="padding:8px 10px;background:linear-gradient(135deg,var(--card) 0%,var(--soft) 100%)">
          <div style="font-size:10.5px;color:var(--mut);font-weight:700">WUS & Ibu (19–49 thn)</div>
          <div style="font-size:20px;font-weight:800;color:var(--ink);margin-top:2px">${num(wusTot)} <small style="font-size:11px;color:var(--mut)">(${pct(wusTot, C)}%)</small></div>
        </div>
        <div class="v" style="padding:8px 10px;background:linear-gradient(135deg,var(--card) 0%,var(--soft) 100%)">
          <div style="font-size:10.5px;color:var(--mut);font-weight:700"> Rasio Gender (P : L)</div>
          <div style="font-size:20px;font-weight:800;color:var(--or);margin-top:2px">${pct(P, C)}% : ${100 - pct(P, C)}%</div>
        </div>
      </div>

      <!-- Pyramid 3D Chart -->
      <div class="v pyr">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0">${l.age} <small>Distribusi umur & jenis kelamin</small></h3>
          <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:var(--or4);color:var(--or);font-weight:800"> 0–23 bln = Jendela 1.000 HPK</span>
        </div>
        <div class="pyrc">
          <div class="hd"><span>${l.P} (Perempuan)</span><span>Kelompok Umur</span><span>${l.L} (Laki-laki)</span></div>
          ${ag.map(a => {
            const p = sum(pm, r => r.a === a && r.s === 'P'), m = sum(pm, r => r.a === a && r.s === 'L');
            const isHpk = a === '0–23 bulan';
            return `<div class="row" style="${isHpk ? 'background:rgba(255,85,21,0.06);border-radius:6px;padding:2px 0' : ''}">
              <div class="l"><b>${num(p)}</b><i style="width:${p / mx * 100}%;background:${isHpk ? '#FF5515' : '#FF8A5C'}"></i></div>
              <div class="m" style="${isHpk ? 'color:#FF5515;font-weight:800' : ''}">${ageN(a)}${isHpk ? ' ' : ''}</div>
              <div class="r"><i style="width:${m / mx * 100}%;background:var(--ink)"></i><b>${num(m)}</b></div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Right Column: Sex Donut & Village Demographics Table -->
      <div class="demographic-secondary">
        <div class="v demographic-donut">
          <h3>${l.sexc}</h3>
          <div class="vb chbox">${donut([{ v: P, c: '#FF5515' }, { v: C - P, c: 'var(--k)' }], pct(P, C) + '%', l.P)}</div>
          <div class="lg" style="justify-content:center"><span><i style="background:#FF5515"></i>${l.P}: ${num(P)} (${pct(P, C)}%)</span><span><i style="background:var(--k)"></i>${l.L}: ${num(C - P)} (${100 - pct(P, C)}%)</span></div>
        </div>
        
        <div class="v demographic-table">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <h3 style="margin:0"> Sebaran Demografi per Kampung / Desa</h3>
            <span style="font-size:10px;color:var(--mut)">${vList.length} Kampung</span>
          </div>
          <div class="tsc"><table>
            <thead><tr><th>Kampung</th><th>Kabupaten</th><th class="r">Balita</th><th class="r">Remaja</th><th class="r">Dewasa</th><th class="r">P</th><th class="r">L</th><th class="r">Total</th></tr></thead>
            <tbody>
              ${vList.map(v => `<tr>
                <td><b>${esc(v.kp)}</b></td>
                <td><span style="font-size:10px;color:var(--mut)">${esc(v.k)}</span></td>
                <td class="r" style="color:#FF5515;font-weight:700">${num(v.balita)}</td>
                <td class="r">${num(v.remaja)}</td>
                <td class="r">${num(v.dewasa)}</td>
                <td class="r">${num(v.p)}</td>
                <td class="r">${num(v.l)}</td>
                <td class="r"><b>${num(v.tot)}</b></td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>`;
  },
  () => { /* 5: Groups */
    const l = L(); const { pm, tg } = F();
    const gs = [...new Set(tg.map(r => r.g).concat(pm.map(r => r.g)))].filter(Boolean);
    const rows = CATS.flatMap(c => gs.filter(g => tg.concat(pm).some(r => r.g === g && r.c === c)).map(g => ({
      c, g, t: sum(tg, r => r.g === g), v: sum(pm, r => r.g === g), p: sum(pm, r => r.g === g && r.s === 'P')
    })));
    const st = rows.filter(r => r.c === 'Stakeholder');
    const smx = Math.max(1, ...st.map(r => Math.max(r.v, r.t)));

    // Category summary
    const catData = CATS.map(c => {
      const v = sum(pm, r => r.c === c);
      const t = sum(tg, r => r.c === c);
      return { c, v, t, p: pct(v, t) };
    });

    return `<div class="pc" style="grid-template-columns:1.2fr 1fr;grid-template-rows:1fr 1fr;gap:10px">
      <!-- Quadrant 1: Integrated Target Group Matrix Table -->
      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0"> ${l.grp} <small>Matriks Capaian per Kelompok Sasaran</small></h3>
          <span style="font-size:10px;color:var(--mut)">Target Tahunan vs Capaian</span>
        </div>
        <div class="tsc"><table>
          <thead><tr><th>Kategori</th><th>Kelompok Sasaran</th><th class="r">${l.target}</th><th class="r">${l.ach}</th><th class="r">%</th><th class="r">P</th><th class="r">L</th></tr></thead>
          <tbody>${rows.map(r => `<tr>
            <td><span style="font-size:10px;padding:1px 5px;border-radius:3px;background:${r.c === 'Anak' ? 'var(--or4)' : 'var(--soft)'};color:${r.c === 'Anak' ? 'var(--or)' : 'var(--ink)'};font-weight:700">${catN(r.c)}</span></td>
            <td><b>${esc(grpN(r.g))}</b></td>
            <td class="r">${num(r.t)}</td>
            <td class="r"><b>${num(r.v)}</b></td>
            <td class="r" style="color:${pct(r.v, r.t) >= 100 ? 'var(--k)' : '#FF5515'};font-weight:800">${pct(r.v, r.t)}%</td>
            <td class="r">${num(r.p)}</td>
            <td class="r">${num(r.v - r.p)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>

      <!-- Quadrant 2: 4 Categories 3D Comparison -->
      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0"> Komposisi 4 Pilar Kategori Intervensi</h3>
          <span style="font-size:10px;color:var(--or);font-weight:700">Target 6.420 Jiwa</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${catData.map(cd => `
            <div style="padding:7px 10px;border-radius:8px;background:var(--soft);border:1px solid var(--line)">
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px">
                <b>${catN(cd.c)}</b>
                <span class="tabular"><b style="color:#FF5515">${num(cd.v)}</b> / ${num(cd.t)} (<b style="color:${cd.p >= 100 ? 'var(--k)' : '#FF5515'}">${cd.p}%</b>)</span>
              </div>
              <div style="height:10px;background:var(--line);border-radius:5px;overflow:hidden;margin-top:5px;position:relative">
                <div style="width:${Math.min(100, cd.p)}%;height:100%;border-radius:5px;background:${CC[cd.c]};background-image:linear-gradient(180deg,rgba(255,255,255,0.3) 0%,rgba(0,0,0,0.15) 100%)"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Quadrant 3: Stakeholders & Local Agents of Change -->
      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0"> ${l.stake} <small>Kader, Nakes, Tokoh Agama/Adat & Agen Perubahan</small></h3>
          <span style="font-size:10.5px;color:var(--mut)">Total: ${num(sum(pm, r => r.c === 'Stakeholder'))} Orang</span>
        </div>
        <div class="tsc">
          ${st.map(r => hb(esc(grpN(r.g)), r.v, smx, 'var(--k)', `${num(r.v)} / ${num(r.t)} (${pct(r.v, r.t)}%)`, r.t)).join('')}
          <div style="margin-top:8px;padding:6px 8px;border-radius:6px;background:var(--soft);font-size:10.5px;color:var(--mut)">
             Stakeholder kunci bertindak sebagai garda terdepan advokasi perubahan perilaku gizi di tingkat posyandu dan kampung.
          </div>
        </div>
      </div>

      <!-- Quadrant 4: Key Stunting Acceleration Interventions -->
      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0">⭐ Sasaran Kunci Intervensi Stunting & 1.000 HPK</h3>
          <span style="font-size:10.5px;color:var(--or);font-weight:800">Fokus Program</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:11px">
          <div style="padding:8px;background:var(--soft);border-radius:8px;border-left:3px solid #FF5515">
            <b style="color:var(--ink)">Ibu Hamil & ANC Teratur</b>
            <div style="font-size:16px;font-weight:800;color:#FF5515;margin:3px 0">${num(sum(pm, r => r.g === 'Ibu hamil'))} <small style="font-size:10px;color:var(--mut)">/ 420</small></div>
            <div style="font-size:9.5px;color:var(--mut)">Edukasi tanda bahaya & kepatuhan konsumsi 90 TTD</div>
          </div>
          <div style="padding:8px;background:var(--soft);border-radius:8px;border-left:3px solid #FF8A5C">
            <b style="color:var(--ink)">Ibu Menyusui & PMBA</b>
            <div style="font-size:16px;font-weight:800;color:#FF8A5C;margin:3px 0">${num(sum(pm, r => r.g === 'Ibu menyusui'))} <small style="font-size:10px;color:var(--mut)">/ 420</small></div>
            <div style="font-size:9.5px;color:var(--mut)">Praktik ASI Eksklusif 6 bulan & MP-ASI padat gizi</div>
          </div>
          <div style="padding:8px;background:var(--soft);border-radius:8px;border-left:3px solid var(--k)">
            <b style="color:var(--ink)">Remaja Putri Bebas Anemia</b>
            <div style="font-size:16px;font-weight:800;color:var(--ink);margin:3px 0">${num(sum(pm, r => r.c === 'Remaja' && r.s === 'P'))} <small style="font-size:10px;color:var(--mut)">/ 1.248</small></div>
            <div style="font-size:9.5px;color:var(--mut)">Pencegahan anemia calon pengantin masa depan</div>
          </div>
          <div style="padding:8px;background:var(--soft);border-radius:8px;border-left:3px solid var(--k)">
            <b style="color:var(--ink)">Pengasuhan Ayah / Bapak</b>
            <div style="font-size:16px;font-weight:800;color:var(--ink);margin:3px 0">${num(sum(pm, r => r.g === 'Pengasuh/ayah' && r.s === 'L'))} <small style="font-size:10px;color:var(--mut)">/ 420</small></div>
            <div style="font-size:9.5px;color:var(--mut)">Dukungan gizi keluarga & sanitasi higienis</div>
          </div>
        </div>
      </div>
    </div>`;
  },
  () => { /* 6: Regions & Villages */
    const l = L(); const { pm, tg, kg } = F({ noKab: true });
    const kd = KABS().map(k => ({ k, c: sum(pm, r => r.k === k), t: sum(tg, r => r.k === k), a: sum(kg, r => r.k === k) }));
    const mx = Math.max(1, ...kd.map(d => Math.max(d.c, d.t)));
    const pk = S.kab === 'Semua' ? pm : pm.filter(r => r.k === S.kab);
    const kps = [...new Set(pk.map(r => r.kp).filter(Boolean))].map(kp => {
      const rs = pk.filter(r => r.kp === kp);
      const vMeta = VILLAGES.find(x => x.name === kp);
      return {
        kp,
        k: rs[0]?.k || '',
        zone: vMeta?.zone || 'Pesisir / Pedalaman',
        v: sum(rs),
        a: sum(rs, r => r.c === 'Anak'),
        p: sum(rs, r => r.s === 'P'),
        l: sum(rs, r => r.s === 'L')
      };
    }).sort((a, b) => b.v - a.v);

    return `<div class="pc g6">
      <div class="v">
        <h3>${l.kabc} <small>Progres Target Tahunan 3 Kabupaten</small></h3>
        ${kd.map(d => `<div style="padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer;${S.kab === d.k ? 'background:var(--or4);border-radius:6px;padding:8px' : ''}" onclick="selectTerritory('${d.k}')">
          <div style="display:flex;justify-content:space-between;font-weight:800">
            <span> ${d.k}</span>
            <span class="tabular" style="color:#FF5515">${pct(d.c, d.t)}%</span>
          </div>
          ${hb(l.ach, d.c, mx, '#FF5515')}${hb(l.target, d.t, mx, 'var(--k3)')}
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mut);margin-top:2px">
            <span>${num(d.a)} ${l.act.toLowerCase()} terlaksana</span>
            <span>Target: ${num(d.t)} jiwa</span>
          </div>
        </div>`).join('')}

        <div style="margin-top:12px;padding:10px;border-radius:8px;background:var(--soft);border:1px solid var(--line)">
          <b style="font-size:11px">Tipologi Wilayah 22 Kampung Dampingan:</b>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px;font-size:10px">
            <div style="background:var(--card);padding:5px 6px;border-radius:4px;border:1px solid var(--line)"><b>Pesisir:</b> 12 Kampung</div>
            <div style="background:var(--card);padding:5px 6px;border-radius:4px;border:1px solid var(--line)"><b>Perkotaan:</b> 6 Kampung</div>
            <div style="background:var(--card);padding:5px 6px;border-radius:4px;border:1px solid var(--line)"><b>Delta / Rawa:</b> 4 Kampung</div>
          </div>
        </div>
      </div>

      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0">${l.kpt} <small>${S.kab === 'Semua' ? l.all : S.kab} · ${kps.length} ${l.kampung.toLowerCase()}</small></h3>
          <span style="font-size:10px;color:var(--mut)">Peringkat Berdasarkan Capaian</span>
        </div>
        <div class="tsc"><table>
          <thead><tr><th>No</th><th>${l.kampung}</th><th>${l.kab}</th><th>Tipologi Wilayah</th><th class="r">${l.reach}</th><th class="r">${l.child}</th><th class="r">${l.P}</th><th class="r">${l.L}</th></tr></thead>
          <tbody>${kps.map((r, idx) => `<tr>
            <td><span style="font-size:10px;color:var(--mut)">${idx + 1}</span></td>
            <td><b>${esc(r.kp)}</b></td>
            <td>${esc(r.k)}</td>
            <td><span style="font-size:10px;color:var(--mut)">${esc(r.zone)}</span></td>
            <td class="r"><b style="color:#FF5515">${num(r.v)}</b></td>
            <td class="r">${num(r.a)}</td>
            <td class="r">${num(r.p)}</td>
            <td class="r">${num(r.l)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>
    </div>`;
  },
  () => { /* 7: Activities */
    const l = L(); const { kg } = F();
    const outs = [...new Set(kg.map(r => r.o))].sort();
    const om = Math.max(1, ...outs.map(o => sum(kg, r => r.o === o)));
    const js = [...new Set(kg.map(r => r.j))].map(j => {
      const count = sum(kg, r => r.j === j);
      const meta = ACTIVITY_INFO[j] || { code: 'ACT-X', out: '1.x', periodicity: 'Bi-monthly', indicatorContrib: 'Indikator Output', desc: '' };
      return { j, count, meta };
    }).sort((a, b) => b.count - a.count);

    const ms = months(), ks = KABS().filter(k => S.kab === 'Semua' || k === S.kab);
    const hm = Math.max(1, ...ms.flatMap(m => ks.map(k => sum(kg, r => r.p === m && r.k === k))));

    return `<div class="pc" style="grid-template-columns:1fr 1.6fr;grid-template-rows:auto 1fr;gap:10px">
      <!-- Top Activity KPI Strip -->
      <div style="grid-column:1/3;display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div class="v" style="padding:8px 10px;background:linear-gradient(135deg,#111222 0%,#1c1d33 100%);color:#fff">
          <div style="font-size:10.5px;color:var(--k3)">Total Sesi Kegiatan Terlaksana</div>
          <div style="font-size:22px;font-weight:800;color:#FF5515;margin-top:2px">${num(sum(kg))} <small style="font-size:11px;color:var(--k3)">sesi</small></div>
        </div>
        <div class="v" style="padding:8px 10px">
          <div style="font-size:10.5px;color:var(--mut)">Frekuensi Pelaksanaan</div>
          <div style="font-size:16px;font-weight:800;color:var(--ink);margin-top:2px">Bi-monthly <small style="font-size:10.5px;color:var(--mut)">(2 Bulan Sekali)</small></div>
        </div>
        <div class="v" style="padding:8px 10px">
          <div style="font-size:10.5px;color:var(--mut)">Cakupan Output Intervensi</div>
          <div style="font-size:16px;font-weight:800;color:var(--or);margin-top:2px">6 Output (1.1 s.d. 3.1)</div>
        </div>
        <div class="v" style="padding:8px 10px">
          <div style="font-size:10.5px;color:var(--mut)">Sebaran 3 Kabupaten</div>
          <div style="font-size:12px;font-weight:700;color:var(--ink);margin-top:4px">
            ${ks.map(k => `<span>${k}: <b>${num(sum(kg, r => r.k === k))}</b></span>`).join(' · ')}
          </div>
        </div>
      </div>

      <!-- Left Column: Outputs Breakdown -->
      <div style="display:flex;flex-direction:column;gap:10px;min-height:0">
        <div class="v" style="flex:1">
          <h3>${l.byOut} <small>Pilar Output Program</small></h3>
          <div class="tsc">
            ${outs.map(o => hb(esc(OUTN[LG][o] || o), sum(kg, r => r.o === o), om, 'var(--k)')).join('')}
          </div>
        </div>
        <div class="v">
          <h3>${l.heat} <small>Bulan × Kabupaten</small></h3>
          <div class="tsc"><table class="heat">
            <thead><tr><th>${l.kab}</th>${ms.map(m => `<th class="r">${mlab(m)}</th>`).join('')}</tr></thead>
            <tbody>${ks.map(k => `<tr><td><b>${k}</b></td>${ms.map(m => { const v = sum(kg, r => r.p === m && r.k === k); return `<td class="h" style="background:rgba(255,85,21,${(v / hm * .8).toFixed(2)})">${v || ''}</td>`; }).join('')}</tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <!-- Right Column: Detailed Activity Table with Bi-monthly & Output Indicator Contribution -->
      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0"> Rincian Activity & Kontribusi ke Indikator Output</h3>
          
          <div style="display:flex;gap:6px;align-items:center">
            
            <span style="font-size:10.5px;color:var(--or);font-weight:700">10 Jenis Kegiatan Terverifikasi</span>
          </div>

        </div>
        <div class="tsc"><table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Kegiatan (Activity)</th>
              <th>Output</th>
              <th>Frekuensi</th>
              <th class="r">Sesi</th>
              <th>Kontribusi Indikator Capaian Output</th>
            </tr>
          </thead>
          <tbody>
            ${js.map(item => `<tr>
              <td><span style="font-family:monospace;font-size:10px;padding:2px 5px;background:var(--soft);border:1px solid var(--line);border-radius:4px;font-weight:700">${item.meta.code}</span></td>
              <td><b>${esc(jN(item.j))}</b><div style="font-size:9.5px;color:var(--mut);margin-top:1px">${esc(item.meta.desc)}</div></td>
              <td><span style="font-size:10px;padding:1px 5px;border-radius:3px;background:var(--or4);color:var(--or);font-weight:700">${item.meta.out}</span></td>
              <td><span style="font-size:10px;color:var(--mut)">${item.meta.periodicity}</span></td>
              <td class="r"><b style="color:#FF5515">${num(item.count)}</b></td>
              <td><span style="font-size:10px;color:var(--ink)">${esc(item.meta.indicatorContrib)}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>`;
  },
  () => { /* 8: Monthly Trend */
    const l = L(); const { pm, tg } = F(); const ms = months();
    const cs = CATS.filter(c => S.cat === 'Semua' || c === S.cat);
    const ser = cs.map(c => ({ n: catN(c), c: CC[c], vals: ms.map(m => sum(pm, r => r.p === m && r.c === c)) }));
    let cum = 0;
    const targetAnnual = sum(tg);
    const lastMonthReach = ms.length ? ser.reduce((s, x) => s + x.vals[ms.length - 1], 0) : 0;

    return `<div class="pc g8">
      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0">${l.newm} <small>${l.cum} — Target Tahunan: ${num(targetAnnual)} Jiwa</small></h3>
          <span style="font-size:10.5px;color:var(--or);font-weight:800">Bulan Berjalan: ${mlab(ms[ms.length - 1], true)}</span>
        </div>
        <div class="vb chbox">${trend(ser, targetAnnual, ms, true)}</div>
        <div class="lg" style="margin-top:8px">
          ${ser.map(s => `<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}
          <span><i style="background:#FF5515;height:3px"></i>${l.cum} (Kumulatif)</span>
          <span style="margin-left:auto;color:var(--mut)">Garis putus-putus = Target Tahunan (${num(targetAnnual)})</span>
        </div>
        
        <!-- Run-rate analysis card -->
        <div style="margin-top:10px;padding:9px 12px;border-radius:8px;background:var(--soft);border:1px solid var(--line);display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px">
          <div>
            <span style="color:var(--mut)">Penerima Manfaat Baru Bulan Terakhir:</span>
            <div style="font-size:15px;font-weight:800;color:#FF5515;margin-top:2px">${num(lastMonthReach)} jiwa</div>
          </div>
          <div>
            <span style="color:var(--mut)">Rata-rata Penambahan / Bulan:</span>
            <div style="font-size:15px;font-weight:800;color:var(--ink);margin-top:2px">${num(ms.length ? sum(pm) / ms.length : 0)} jiwa</div>
          </div>
          <div>
            <span style="color:var(--mut)">Sisa Target Tahunan 2026:</span>
            <div style="font-size:15px;font-weight:800;color:var(--or);margin-top:2px">${num(Math.max(0, targetAnnual - sum(pm)))} jiwa</div>
          </div>
        </div>
      </div>

      <div class="v">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h3 style="margin:0">${l.cumt}</h3>
          <span style="font-size:10px;color:var(--mut)">Data Agregat Bulanan</span>
        </div>
        <div class="tsc"><table>
          <thead><tr><th>${l.month}</th>${cs.map(c => `<th class="r">${catN(c)}</th>`).join('')}<th class="r">${l.newT}</th><th class="r">${l.cum}</th><th class="r">% Target</th></tr></thead>
          <tbody>${ms.map((m, i) => {
            const t = ser.reduce((s, x) => s + x.vals[i], 0);
            cum += t;
            return `<tr>
              <td><b>${mlab(m, true)}</b></td>
              ${ser.map(s => `<td class="r">${num(s.vals[i])}</td>`).join('')}
              <td class="r"><b style="color:#FF5515">${num(t)}</b></td>
              <td class="r"><b>${num(cum)}</b></td>
              <td class="r" style="color:${pct(cum, targetAnnual) >= 100 ? 'var(--k)' : 'var(--or)'};font-weight:800">${pct(cum, targetAnnual)}%</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </div>
    </div>`;
  },
  () => { /* 9: Documentation & API */
    const l = L();
    if (SRC === 'sheet') {
      const approvedDocs = (DB.docs || []).filter(d => (!S.kab || S.kab === 'Semua' || d.kabupaten === S.kab) && (!S.per || d.tanggal.slice(0, 7) <= S.per));
      return `<div class="pc" style="overflow:auto"><h2>${LG === 'en' ? 'Approved documentation' : 'Dokumentasi terverifikasi'}</h2>
        ${approvedDocs.length ? approvedDocs.map(d => `<article class="v"><h3>${esc(LG === 'en' ? d.title_en || d.judul_id : d.judul_id)}</h3>
          <p>${esc(d.tanggal)} · ${esc(d.kampung)}, ${esc(d.kabupaten)}</p>
          <p>${esc(LG === 'en' ? d.description_en || d.deskripsi_id : d.deskripsi_id)}</p>
          <p>${esc(LG === 'en' ? d.caption_en || d.caption_id : d.caption_id)}</p></article>`).join('') : `<p>${LG === 'en' ? 'No approved documentation is available.' : 'Belum ada dokumentasi terverifikasi.'}</p>`}
        <p>${LG === 'en' ? 'Internal photos and evidence remain private.' : 'Foto dan bukti internal tersimpan privat.'}</p></div>`;
    }
    const docs = getFilteredDocs();
    const curDoc = docs[DOC_INDEX] || docs[0] || FIELD_DOCS[0];

    return `<div class="pc" style="grid-template-rows:auto 1fr;gap:10px;overflow:hidden">
      <!-- Sub-Tab Header Switcher -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;flex-wrap:wrap;gap:8px">
        <div class="tg" style="margin:0">
          <button class="${DOC_TAB === 'gallery' ? 'on' : ''}" onclick="setDocTab('gallery')">${icon('camera')} Galeri Dokumentasi Foto Kegiatan Lapangan</button>
          <button class="${DOC_TAB === 'technical' ? 'on' : ''}" onclick="setDocTab('technical')">${icon('book')} Panduan Teknis & Integrasi Google API</button>
        </div>
        
        ${DOC_TAB === 'gallery' ? `
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <!-- Filter Month -->
            <label style="font-size:11px;font-weight:700;color:var(--mut);display:flex;align-items:center;gap:4px">
              Bulan:
              <select onchange="filterDocMonth(this.value)" style="border:1px solid var(--line);border-radius:6px;padding:3px 8px;background:var(--card);font-size:11px">
                <option value="Semua" ${DOC_MONTH === 'Semua' ? 'selected' : ''}>Semua Bulan (Sep - Nov 2026)</option>
                <option value="2026-09" ${DOC_MONTH === '2026-09' ? 'selected' : ''}>September 2026</option>
                <option value="2026-10" ${DOC_MONTH === '2026-10' ? 'selected' : ''}>Oktober 2026 (Bulan Berjalan)</option>
                <option value="2026-11" ${DOC_MONTH === '2026-11' ? 'selected' : ''}>November 2026 (Rencana Kegiatan)</option>
              </select>
            </label>

            <!-- Filter Regency -->
            <label style="font-size:11px;font-weight:700;color:var(--mut);display:flex;align-items:center;gap:4px">
              Wilayah:
              <select onchange="filterDocKab(this.value)" style="border:1px solid var(--line);border-radius:6px;padding:3px 8px;background:var(--card);font-size:11px">
                <option value="Semua" ${DOC_KAB === 'Semua' ? 'selected' : ''}>Semua Wilayah</option>
                <option value="Mimika" ${DOC_KAB === 'Mimika' ? 'selected' : ''}>Mimika</option>
                <option value="Nabire" ${DOC_KAB === 'Nabire' ? 'selected' : ''}>Nabire</option>
                <option value="Asmat" ${DOC_KAB === 'Asmat' ? 'selected' : ''}>Asmat</option>
              </select>
            </label>
          </div>
        ` : ''}
      </div>

      <!-- MAIN CONTENT: EITHER PHOTO CAROUSEL OR TECHNICAL INTEGRATION GUIDE -->
      ${DOC_TAB === 'gallery' ? `
        <div class="doc-slider-wrap">
          <!-- Main Slide Card with Carousel Geser Kiri / Kanan -->
          <div class="doc-slide-main">
            <!-- Left: Visual Photo Card with Badges -->
            <div class="doc-img-box">
              <span class="doc-img-badge"> ${curDoc.kampung}, ${curDoc.kab}</span>
              <span class="doc-img-date"> ${curDoc.dateStr}</span>
              ${renderDocCardImage(curDoc)}
            </div>

            <!-- Right: Activity Detail & In-Depth Story -->
            <div style="display:flex;flex-direction:column;justify-content:space-between;gap:8px">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:10px;padding:2px 7px;border-radius:4px;background:var(--or4);color:var(--or);font-weight:800">${curDoc.output} · ${curDoc.actCode}</span>
                  <span style="font-size:10.5px;color:var(--mut);font-weight:700">Dokumen #${DOC_INDEX + 1} dari ${docs.length}</span>
                </div>
                
                <h2 style="margin:4px 0 6px;font-size:16px;line-height:1.3;font-weight:800;color:var(--ink)">${curDoc.title}</h2>
                <div style="font-size:11.5px;color:var(--mut);font-weight:600;margin-bottom:8px">
                   Lokasi: <b>${curDoc.kampung}</b>, Kabupaten <b>${curDoc.kab}</b> · Tag: <span style="color:var(--or)">${curDoc.tag}</span>
                </div>

                <!-- Explanation Description -->
                <div style="background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.5;color:var(--ink)">
                  <b style="color:var(--or);display:block;margin-bottom:2px">Deskripsi & Tujuan Kegiatan:</b>
                  ${curDoc.desc}
                </div>

                <div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--card);border:1px solid var(--line);font-size:11px">
                  <div style="color:var(--mut)"><b>Peserta & Pemangku Kepentingan:</b> ${curDoc.participants}</div>
                  <div style="color:var(--mut);margin-top:2px"><b>Mitra Pelaksana:</b> Wahana Visi Indonesia didanai oleh PT Freeport Indonesia</div>
                </div>
              </div>

              <!-- Slide Navigation Buttons (Geser Kiri & Kanan) -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--line)">
                <button class="slide-nav-btn" onclick="slideDoc(-1)" title="Geser ke Slide Sebelumnya" aria-label="Slide sebelumnya">‹</button>
                <div style="display:flex;align-items:center;gap:6px">
                  ${docs.map((d, idx) => `
                    <span style="display:inline-block;width:${idx === DOC_INDEX ? '18px' : '6px'};height:6px;border-radius:3px;background:${idx === DOC_INDEX ? 'var(--or)' : 'var(--line)'};cursor:pointer;transition:all .2s" onclick="setDocIndex(${idx})"></span>
                  `).join('')}
                </div>
                <button class="slide-nav-btn" onclick="slideDoc(1)" title="Geser ke Slide Berikutnya" aria-label="Slide berikutnya">›</button>
              </div>
            </div>
          </div>

          <!-- Thumbnail Strip below main slide -->
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10.5px;font-weight:700;color:var(--mut);white-space:nowrap">Pilih Foto Kegiatan:</span>
            <div class="doc-thumbs">
              ${docs.map((d, idx) => `
                <div class="doc-thumb ${idx === DOC_INDEX ? 'on' : ''}" onclick="setDocIndex(${idx})" title="${d.title} (${d.dateStr})">
                  <div style="font-size:8.5px;padding:2px 4px;background:${d.color};color:#fff;font-weight:800;white-space:nowrap;overflow:hidden">${d.kab}</div>
                  <div style="padding:2px 4px;font-size:8px;color:var(--ink);line-height:1.1;overflow:hidden;height:24px">${d.kampung}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : `
        <!-- TECHNICAL INTEGRATION GUIDE VIEW -->
        <div class="technical-grid" style="display:grid;grid-template-columns:1.05fr 1fr;gap:12px">
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="v">
              <h3> Panduan Integrasi Google Sheets API / CSV</h3>
              <p style="margin:0 0 6px;font-size:11px;color:var(--mut)">Hubungkan lima sumber CSV untuk memuat data saat dashboard dibuka. Muat ulang halaman untuk mengambil pembaruan terbaru.</p>
              <div style="display:flex;flex-direction:column;gap:5px;font-size:11px">
                <div style="padding:6px 8px;background:var(--soft);border-radius:6px;border-left:3px solid var(--or)">
                  <b>Langkah 1:</b> Siapkan spreadsheet mengikuti 5 sheet template: <code>penerima_manfaat</code>, <code>target</code>, <code>kegiatan</code>, <code>indikator</code>, <code>info</code>.
                </div>
                <div style="padding:6px 8px;background:var(--soft);border-radius:6px;border-left:3px solid var(--or)">
                  <b>Langkah 2:</b> Di Google Sheets, klik <b>File > Share > Publish to web</b>. Pilih masing-masing sheet dan format <b>Comma-separated values (.csv)</b>.
                </div>
                <div style="padding:6px 8px;background:var(--soft);border-radius:6px;border-left:3px solid var(--or)">
                  <b>Langkah 3:</b> Masukkan link CSV di menu <b> Sumber Data</b>, atau bagikan dashboard dengan parameter URL otomatis:
                  <div style="margin-top:3px;padding:4px 6px;background:var(--card);border:1px solid var(--line);border-radius:4px;font-family:monospace;font-size:9.5px;word-break:break-all">
                    ?pm=[LINK_PM]&tg=[LINK_TG]&kg=[LINK_KG]&id=[LINK_ID]&in=[LINK_IN]
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-top:8px">
                <button class="terr-btn on" onclick="openP()">${icon('settings')} Buka Pengaturan Sumber Data</button>
                <button class="terr-btn" onclick="copyLink()">${icon('link')} Salin Link Berbagi Saat Ini</button>
              </div>
            </div>

            <div class="v">
              <h3> Persiapan Integrasi Google Maps Platform API</h3>
              <p style="margin:0 0 6px;font-size:11px;color:var(--mut)">Panduan teknis penyambungan Google Maps JavaScript API untuk pemetaan wilayah:</p>
              <div style="font-size:10.5px;display:flex;flex-direction:column;gap:5px">
                <div style="padding:5px 8px;background:var(--soft);border-radius:6px">
                  <b>1. Google Cloud Console:</b> Buat project di <code>console.cloud.google.com</code>, aktifkan <b>Maps JavaScript API</b>.
                </div>
                <div style="padding:5px 8px;background:var(--soft);border-radius:6px">
                  <b>2. Pengamanan Kunci:</b> Kunci API wajib dibatasi dengan <i>HTTP Referrers (Website restrictions)</i> ke domain portal Anda agar aman dari kuota liar.
                </div>
                <div style="padding:5px 8px;background:var(--soft);border-radius:6px">
                  <b>3. Koordinat Acuan Resmi (Lat / Lon):</b>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:3px">
                    <div style="background:var(--card);padding:3px 5px;border-radius:4px;border:1px solid var(--line)"><b>Mimika:</b> -4.5467, 136.8837</div>
                    <div style="background:var(--card);padding:3px 5px;border-radius:4px;border:1px solid var(--line)"><b>Nabire:</b> -3.3667, 135.5000</div>
                    <div style="background:var(--card);padding:3px 5px;border-radius:4px;border:1px solid var(--line)"><b>Asmat:</b> -5.5414, 138.1389</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="v">
              <h3> Kamus Data & Aturan Perhitungan (Data Dictionary)</h3>
              <div class="tsc" style="max-height:220px">
                <table style="font-size:10px">
                  <thead><tr><th>Sheet</th><th>Kolom Wajib</th><th>Aturan Bisnis</th></tr></thead>
                  <tbody>
                    <tr><td><b>penerima_manfaat</b></td><td>periode, kabupaten, kampung, kategori, kelompok, kelompok_umur, jenis_kelamin, capaian</td><td>capaian = nilai baru unik bulanan. Kumulatif dijumlahkan antar bulan.</td></tr>
                    <tr><td><b>target</b></td><td>tahun, kabupaten, kategori, kelompok, jenis_kelamin, target</td><td>target = target TAHUNAN. Jangan menjumlahkan target antar bulan. Total: 6.420 jiwa.</td></tr>
                    <tr><td><b>kegiatan</b></td><td>periode, kabupaten, output, jenis_kegiatan, jumlah_kegiatan</td><td>Jumlah sesi kegiatan menurut output (1.1 - 3.1) dan 10 jenis kegiatan intervensi.</td></tr>
                    <tr><td><b>indikator</b></td><td>level, kode, indikator, indicator_en, satuan, target, capaian</td><td>11 indikator donor. Tercapai (≥100%), Sesuai jalur (60–99%), Perlu perhatian (&lt;60%).</td></tr>
                    <tr><td><b>info</b></td><td>kunci, nilai</td><td>Metadata sistem: <code>periode_terbit</code>, <code>diperbarui</code>, <code>tahun</code>.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="v">
              <h3> Keamanan & SOP Pembaruan Bulanan</h3>
              <div style="font-size:10.5px;line-height:1.4;color:var(--mut)">
                <p style="margin:0 0 5px">Dashboard ini terdiri dari <b>HTML, CSS, dan JavaScript statis</b>, tanpa server backend:</p>
                <ul style="margin:0 0 6px;padding-left:14px">
                  <li><b>Deployment:</b> Cukup unggah <code>index.html</code> beserta file pendukung repositori ke GitHub Pages, SharePoint, Netlify, atau portal intranet PTFI.</li>
                  <li><b>Kode Akses:</b> Pembatas tampilan berbasis browser dengan <code>SHA-256</code>, bukan autentikasi server. Kode: <code>PTFI2026</code>. Setelah 3 kali salah, terkunci 30 detik.</li>
                  <li><b>SOP Pembaruan:</b> Data dihimpun tim lapangan setiap akhir bulan dan dirilis resmi tanggal 1 setiap bulan.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `}
    </div>`;
  }
];

const PAGE_ICONS = ['map', 'overview', 'users', 'layers', 'village', 'clipboard', 'chart', 'camera'];
let SB_COLLAPSED = false;

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  if (isMob()) {
    sb.classList.toggle('mob-open');
    document.getElementById('ovl').classList.toggle('on', sb.classList.contains('mob-open'));
  } else {
    SB_COLLAPSED = !SB_COLLAPSED;
    sb.classList.toggle('collapsed', SB_COLLAPSED);
    const btn = document.querySelector('.sb-header .sb-toggle');
    if (btn) btn.innerHTML = icon(SB_COLLAPSED ? 'right' : 'left');
    fit();
  }
}

function openCover() {
  const m = document.getElementById('coverModal');
  const txt = document.getElementById('coverGoalText');
  if (txt) txt.textContent = L().goal;
  if (m) m.classList.add('on');
}

function closeCover() {
  const m = document.getElementById('coverModal');
  if (m) m.classList.remove('on');
}

function selectTerritory(k) {
  S.kab = k;
  ACTIVE_VILLAGE = null;
  updateHash();
  render();
  placeMap();
}

function isMob() { return VIEW === 'mobile' || (VIEW === 'auto' && innerWidth < 820); }

function render() {
  const l = L();
  document.documentElement.lang = LG;
  document.body.classList.toggle('dark', THEME === 'dark');
  document.body.classList.toggle('mob', isMob());
  document.getElementById('sub').textContent = l.sub;
  document.getElementById('tools').innerHTML = `
    <div class="tg" role="group" aria-label="Language">
      <button class="${LG === 'id' ? 'on' : ''}" onclick="LG='id';render()">ID</button>
      <button class="${LG === 'en' ? 'on' : ''}" onclick="LG='en';render()">EN</button>
    </div>
    <div class="tg" role="group" aria-label="Theme">
      <button class="${THEME === 'light' ? 'on' : ''}" onclick="setTheme('light')" title="${l.light}" aria-label="${l.light}">${icon('sun')}</button>
      <button class="${THEME === 'dark' ? 'on' : ''}" onclick="setTheme('dark')" title="${l.dark}" aria-label="${l.dark}">${icon('moon')}</button>
    </div>
    <div class="tg" role="group" aria-label="View">
      <button class="${!isMob() ? 'on' : ''}" onclick="VIEW='desktop';render()" title="${l.desk}" aria-label="${l.desk}">${icon('desktop')}</button>
      <button class="${isMob() ? 'on' : ''}" onclick="VIEW='mobile';render()" title="${l.mob}" aria-label="${l.mob}">${icon('mobile')}</button>
    </div>
    <button class="ib" onclick="doPrint()" title="${l.print}" aria-label="${l.print}">${icon('print')}</button>
    <button class="ib" onclick="openP()" title="${l.srcT}" aria-label="${l.srcT}">${icon('settings')}</button>
  `;

  const sbTitle = document.getElementById('sbTitle');
  if (sbTitle) sbTitle.textContent = LG === 'en' ? 'Pages' : 'Halaman';
  const sbNav = document.getElementById('sbNav');
  if (sbNav) {
    sbNav.innerHTML = l.p.map((t, i) => `
      <button class="${i === PAGE ? 'on' : ''}" aria-current="${i === PAGE ? 'page' : 'false'}" onclick="go(${i})" title="${String(SLIDE_NUMBERS[i]).padStart(2, '0')}. ${t}">
        <span class="sb-icon">${icon(PAGE_ICONS[i])}</span>
        <span class="sb-num">${String(SLIDE_NUMBERS[i]).padStart(2, '0')}</span>
        <span class="sb-text">${t}</span>
      </button>
    `).join('');
  }

  const pages = window._printing ? l.p.map((_, i) => i) : [PAGE];
  document.getElementById('stage').innerHTML = pages.map(i => `
    <div class="pw" data-i="${i}">
      <section class="page" data-page="${SLIDE_NUMBERS[i] - 1}" aria-label="${esc(l.p[i])}">
        <div class="ph">
          <span class="pn">${String(SLIDE_NUMBERS[i]).padStart(2, '0')}</span>
          <div><h1>${l.p[i]}</h1><small>${l.ps[i]}</small></div>
          </div>
        ${slicers()}
        ${renderChips()}
        <div class="data-context"><span>${LG === 'en' ? 'Reporting period' : 'Periode laporan'}: <b>${mlab(S.per || DB.pub, true)}</b> · ${S.week !== 'Semua' ? (LG === 'en' ? 'Selected week' : 'Minggu terpilih') : (LG === 'en' ? 'Year-to-date reach' : 'Capaian kumulatif tahun berjalan')}</span>${SRC === 'sample' ? `<span class="demo">${l.demo}</span>` : ''}</div>
        ${PG[i]()}
        <div class="pf">
          <span>${l.src}: ${SRC === 'sample' ? l.sample : l.sheet}</span>
          <span>${l.until} ${mlab(S.per || DB.pub, true)}</span>
          <span class="sp"></span>
          <span>PASTI-Papua · WVI & PTFI</span>
          <span>${LG === 'en' ? 'Slide' : 'Slide'} ${String(SLIDE_NUMBERS[i]).padStart(2,'0')} · ${i + 1}/${l.p.length}</span>
        </div>
      </section>
    </div>
  `).join('') + (window._printing ? '' : `
    <div class="nav2">
      <button onclick="go(${Math.max(0, PAGE - 1)})" ${PAGE === 0 ? 'disabled' : ''}>${icon('left')} ${l.prev}</button>
      <span>${PAGE + 1} / ${l.p.length}</span>
      <button onclick="go(${Math.min(l.p.length - 1, PAGE + 1)})" ${PAGE === l.p.length - 1 ? 'disabled' : ''}>${l.next} ${icon('right')}</button>
    </div>
  `);
  fit();
  if (pages.includes(0)) placeMap();
}

function fit() {
  document.querySelectorAll('.pw').forEach(pw => {
    pw.style.width = ''; pw.style.height = '';
    pw.querySelector('.page').style.transform = '';
  });
  if (MAP && MAP.resize) setTimeout(() => MAP.resize(), 50);
}

function go(i) {
  PAGE = Math.max(0, Math.min(PG.length - 1, i));
  updateHash();
  render();
  if (isMob()) {
    document.getElementById('sidebar')?.classList.remove('mob-open');
    document.getElementById('ovl')?.classList.remove('on');
  }
  scrollTo(0, 0);
}
function setTheme(t) { THEME = t; render(); placeMap(); }
function doPrint() { window._printing = true; render(); setTimeout(() => { window.print(); setTimeout(() => { window._printing = false; render(); }, 400); }, 600); }

addEventListener('resize', () => {
  clearTimeout(window._rt);
  window._rt = setTimeout(() => {
    const m = isMob();
    if (m !== document.body.classList.contains('mob')) render(); else fit();
  }, 120);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeP();
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight') go(Math.min(PG.length - 1, PAGE + 1));
  if (e.key === 'ArrowLeft') go(Math.max(0, PAGE - 1));
});

/* PASTI-Papua Geographic Vector Cartography Engine */
const VILLAGES = [
  // Mimika (11)
  { k: 'Mimika', name: 'Atuka', zone: 'Pesisir Mimika Tengah', lon: 136.68, lat: -4.73, desc: 'Pesisir pantai selatan, akses perahu longboat muara laut' },
  { k: 'Mimika', name: 'Ayuka', zone: 'Muara Tipoeka / Pesisir', lon: 136.89, lat: -4.71, desc: 'Kawasan muara sungai pesisir timur Mimika' },
  { k: 'Mimika', name: 'Fanamo', zone: 'Pesisir Mimika Timur Jauh', lon: 137.10, lat: -4.78, desc: 'Pesisir muara timur batas distrik' },
  { k: 'Mimika', name: 'Keakwa', zone: 'Pesisir Mimika Barat', lon: 136.56, lat: -4.70, desc: 'Pesisir muara sungai Kamora barat' },
  { k: 'Mimika', name: 'Kokonao', zone: 'Pesisir Mimika Barat', lon: 136.44, lat: -4.67, desc: 'Pusat distrik bersejarah pesisir barat' },
  { k: 'Mimika', name: 'Koperapoka', zone: 'Perkotaan Timika', lon: 136.88, lat: -4.54, desc: 'Kawasan pemukiman inti perkotaan Timika' },
  { k: 'Mimika', name: 'Nawaripi', zone: 'Perkotaan Timika Baru', lon: 136.85, lat: -4.57, desc: 'Kawasan pemukiman lingkar barat daya Timika' },
  { k: 'Mimika', name: 'Nayaro', zone: 'Koridor MP 38 / Foothills', lon: 136.95, lat: -4.48, desc: 'Dekat koridor operasional PTFI dataran rendah' },
  { k: 'Mimika', name: 'Ohotya', zone: 'Pesisir Timur Jauh', lon: 137.26, lat: -4.83, desc: 'Pesisir muara perbatasan timur jauh' },
  { k: 'Mimika', name: 'Omawita', zone: 'Pesisir Timur', lon: 137.18, lat: -4.81, desc: 'Kawasan muara sungai pesisir timur' },
  { k: 'Mimika', name: 'Tipuka', zone: 'Muara Minajerwi / MP 21', lon: 136.94, lat: -4.68, desc: 'Pesisir muara sungai dekat pelabuhan kargo' },

  // Nabire (7)
  { k: 'Nabire', name: 'Makimi', zone: 'Pesisir Timur Teluk', lon: 135.66, lat: -3.32, desc: 'Pesisir timur Teluk Cenderawasih' },
  { k: 'Nabire', name: 'Air Mandidi', zone: 'Pesisir Barat Teluk', lon: 135.38, lat: -3.33, desc: 'Pesisir teluk bagian barat' },
  { k: 'Nabire', name: 'Bumi Wonorejo', zone: 'Dataran Pertanian Nabire', lon: 135.48, lat: -3.45, desc: 'Sentra agrikultur dan pertanian pangan' },
  { k: 'Nabire', name: 'Siriwini', zone: 'Perkotaan Nabire', lon: 135.52, lat: -3.36, desc: 'Pusat kota dan pemukiman utama Nabire' },
  { k: 'Nabire', name: 'Wadio', zone: 'Lembah Nabire Barat', lon: 135.43, lat: -3.42, desc: 'Dataran lembah Nabire barat' },
  { k: 'Nabire', name: 'Kali Harapan', zone: 'Perkotaan Nabire', lon: 135.49, lat: -3.38, desc: 'Kawasan pemukiman perkotaan' },
  { k: 'Nabire', name: 'Bumi Raya', zone: 'Dataran Pertanian', lon: 135.55, lat: -3.47, desc: 'Kawasan pemukiman pertanian terpadu' },

  // Asmat (4)
  { k: 'Asmat', name: 'Akamar', zone: 'Distrik Akat / Pedalaman', lon: 138.25, lat: -5.40, desc: 'Bantaran sungai pedalaman distrik Akat' },
  { k: 'Asmat', name: 'Birak', zone: 'Distrik Betsbamu', lon: 138.05, lat: -5.68, desc: 'Kawasan delta muara sungai selatan' },
  { k: 'Asmat', name: 'Sesakam', zone: 'Pesisir Agats / Rawa Pasang Surut', lon: 138.12, lat: -5.53, desc: 'Kawasan pasang surut Agats di atas papan kayu' },
  { k: 'Asmat', name: 'Warse', zone: 'Distrik Atsj / Sungai Betsj', lon: 138.35, lat: -5.75, desc: 'Bantaran sungai besar distrik Atsj' }
];

let MAPMODE = 'design';
let MAP_SCALE = 1.0;
let ACTIVE_VILLAGE = null;
let MAP = null;

function mapData() {
  const { pm, tg } = F({ noKab: true });
  return KABS().filter(k => GEO[k]).map(k => ({
    k,
    a: sum(pm, r => r.k === k && r.c === 'Anak'),
    m: sum(pm, r => r.k === k && r.c !== 'Anak'),
    t: sum(tg, r => r.k === k)
  }));
}

function setMapMode(m) {
  MAPMODE = m;
  if (m === 'gis') {
    placeMapGIS();
  } else {
    destroyMapGL();
    placeMap();
  }
  document.querySelectorAll('.map-mode-btn').forEach(b => {
    const isGis = b.textContent.includes('Satelit');
    b.classList.toggle('on', (m === 'gis' && isGis) || (m !== 'gis' && !isGis));
  });
}

function mapZoom(delta) {
  MAP_SCALE = Math.max(0.7, Math.min(2.5, MAP_SCALE + delta));
  placeMap();
}

function mapReset() {
  MAP_SCALE = 1.0;
  ACTIVE_VILLAGE = null;
  S.kab = 'Semua';
  updateHash();
  render();
  placeMap();
}

function showVillageDetail(name) {
  ACTIVE_VILLAGE = name;
  const v = VILLAGES.find(x => x.name === name);
  if (v && S.kab !== v.k) {
    S.kab = v.k;
    updateHash();
  }
  render();
  placeMap();
}

function placeMap() {
  const slot = document.getElementById('mapSlot');
  if (!slot) return;
  if (MAPMODE === 'gis') {
    placeMapGIS();
    return;
  }
  slot.innerHTML = renderDesignMap();
}

function renderDesignMap() {
  const l = L();
  const md = mapData();
  const isDark = THEME === 'dark';
  const strokeColor = isDark ? '#4B5563' : '#CBD5E1';
  const islandFill = isDark ? '#1E293B' : '#FFFFFF';
  const waterFill = isDark ? '#0B1120' : '#F0F9FF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const mutText = isDark ? '#94A3B8' : '#64748B';

  if (S.kab !== 'Semua') {
    return renderFocusedRegencyMap(S.kab);
  }

  // --- MACRO VIEW: ENTIRE TANAH PAPUA ---
  const W = 800, H = 520;
  function proj(lon, lat) {
    const cx = 390, cy = 250;
    const x = 20 + (lon - 130.0) / 11.2 * 760;
    const y = 20 + (lat - (-0.5)) / (-9.3 - (-0.5)) * 470;
    const zx = cx + (x - cx) * MAP_SCALE;
    const zy = cy + (y - cy) * MAP_SCALE;
    return [Math.round(zx * 10) / 10, Math.round(zy * 10) / 10];
  }

  // Realistic boundary path of Tanah Papua
  const papuaCoords = [
    [130.8, -1.1], [131.2, -0.85], [132.0, -0.65], [132.8, -0.45], [133.5, -0.80], [134.1, -0.85],
    [134.3, -1.4], [134.4, -1.9], [134.2, -2.4], [134.5, -2.85], [135.0, -3.20],
    [135.35, -3.33], [135.50, -3.37], [135.70, -3.30],
    [136.0, -2.8], [136.6, -2.2], [137.2, -1.8], [138.0, -1.75], [138.8, -1.85], [139.5, -2.15],
    [140.5, -2.5], [140.8, -2.58], [141.0, -2.62],
    [141.0, -5.5], [141.0, -6.8], [141.0, -9.1],
    [140.4, -8.6], [139.6, -8.2], [138.9, -8.3], [138.5, -7.4],
    [138.35, -5.8], [138.13, -5.54], [137.9, -5.2],
    [137.3, -4.85], [136.88, -4.55], [136.44, -4.67], [135.8, -4.4],
    [135.0, -4.1], [134.3, -3.8], [133.6, -3.7],
    [132.9, -3.75], [132.2, -3.0], [131.8, -2.1], [132.4, -2.3],
    [133.2, -2.2], [133.6, -2.4], [133.1, -1.9], [132.0, -1.6], [131.1, -1.4]
  ];
  const papuaPath = papuaCoords.map(c => proj(c[0], c[1]).join(',')).join(' ');

  // Nabire region polygon
  const nabirePoly = [
    [135.0, -3.15], [135.4, -3.25], [135.75, -3.25], [135.9, -3.55], [135.5, -3.65], [135.15, -3.55]
  ].map(c => proj(c[0], c[1]).join(',')).join(' ');

  // Mimika region polygon
  const mimikaPoly = [
    [136.25, -4.45], [137.35, -4.45], [137.45, -4.88], [137.15, -4.85], [136.65, -4.75], [136.25, -4.70]
  ].map(c => proj(c[0], c[1]).join(',')).join(' ');

  // Asmat region polygon
  const asmatPoly = [
    [137.85, -5.25], [138.5, -5.25], [138.55, -5.85], [138.25, -5.85], [137.95, -5.65]
  ].map(c => proj(c[0], c[1]).join(',')).join(' ');

  // Central Cordillera (Pegunungan Sudirman / Jayawijaya ridge)
  const mountainPts = [
    [135.6, -3.9], [136.4, -4.1], [136.9, -4.2], [137.5, -4.2], [138.3, -4.3], [139.2, -4.4], [140.2, -4.5]
  ].map(c => proj(c[0], c[1]).join(',')).join(' ');

  // Connecting corridor dashed lines between Nabire -> Mimika -> Asmat
  const pNab = proj(135.50, -3.37);
  const pMim = proj(136.88, -4.55);
  const pAsm = proj(138.13, -5.54);

  // Regency summary stats
  const mNab = md.find(x => x.k === 'Nabire') || { a: 0, m: 0, t: 1 };
  const mMim = md.find(x => x.k === 'Mimika') || { a: 0, m: 0, t: 1 };
  const mAsm = md.find(x => x.k === 'Asmat') || { a: 0, m: 0, t: 1 };

  // Render village pins
  const pinsHtml = VILLAGES.map(v => {
    const [x, y] = proj(v.lon, v.lat);
    const isAct = ACTIVE_VILLAGE === v.name;
    const pinColor = v.k === 'Mimika' ? '#FF5515' : v.k === 'Nabire' ? '#0284C7' : '#E67E22';
    return `
      <g class="v-pin" onclick="showVillageDetail('${v.name}')" style="cursor:pointer">
        <circle cx="${x}" cy="${y}" r="${isAct ? 9 : 5.5}" fill="${pinColor}" stroke="#FFFFFF" stroke-width="${isAct ? 2.5 : 1.5}" opacity="0.95" />
        ${isAct ? `<circle cx="${x}" cy="${y}" r="14" fill="${pinColor}" opacity="0.25"><animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite"/></circle>` : ''}
        <title>${v.name} (${v.k}): ${v.zone}</title>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" class="ch" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Peta Desain Papua" style="background:${waterFill}">
      <defs>
        <filter id="mapShadow" x="-5%" y="-5%" width="115%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12"/>
        </filter>
        <linearGradient id="mimikaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FF5515" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#FF5515" stop-opacity="0.10"/>
        </linearGradient>
        <linearGradient id="nabireGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0284C7" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0284C7" stop-opacity="0.08"/>
        </linearGradient>
        <linearGradient id="asmatGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E67E22" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#E67E22" stop-opacity="0.10"/>
        </linearGradient>
      </defs>

      <!-- Water labels -->
      <text x="310" y="70" font-size="11" font-weight="700" fill="${mutText}" opacity="0.75" letter-spacing="1"> TELUK CENDERAWASIH (SAMUDERA PASIFIK)</text>
      <text x="370" y="475" font-size="11" font-weight="700" fill="${mutText}" opacity="0.75" letter-spacing="1"> LAUT ARAFURA (PESISIR SELATAN)</text>
      <text x="70" y="240" font-size="10" font-weight="700" fill="${mutText}" opacity="0.6" letter-spacing="0.5">Laut Seram / Teluk Berau</text>

      <!-- Papua Island Landmass -->
      <polygon points="${papuaPath}" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.8" filter="url(#mapShadow)" />

      <!-- Islands in Teluk Cenderawasih (Biak, Supiori, Yapen) -->
      <ellipse cx="${proj(136.0, -1.0)[0]}" cy="${proj(136.0, -1.0)[1]}" rx="24" ry="12" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.2"/>
      <text x="${proj(136.0, -1.0)[0]}" y="${proj(136.0, -1.0)[1] + 3}" text-anchor="middle" font-size="8.5" fill="${mutText}" font-weight="600">P. Biak</text>
      <ellipse cx="${proj(136.4, -1.75)[0]}" cy="${proj(136.4, -1.75)[1]}" rx="32" ry="9" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.2"/>
      <text x="${proj(136.4, -1.75)[0]}" y="${proj(136.4, -1.75)[1] + 3}" text-anchor="middle" font-size="8.5" fill="${mutText}" font-weight="600">P. Yapen</text>

      <!-- Mountain Range: Pegunungan Sudirman / Jayawijaya -->
      <polyline points="${mountainPts}" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-dasharray="2 3" opacity="0.8"/>
      <text x="${proj(137.0, -4.1)[0]}" y="${proj(137.0, -4.1)[1] - 8}" text-anchor="middle" font-size="9" font-weight="700" fill="${mutText}">▲ Pegunungan Sudirman (Puncak Jaya 4.884 m)</text>

      <!-- Provincial boundary line (Papua Tengah & Papua Selatan) -->
      <path d="M ${proj(137.6, -3.8)[0]} ${proj(137.6, -3.8)[1]} L ${proj(137.6, -5.0)[0]} ${proj(137.6, -5.0)[1]} L ${proj(138.5, -5.0)[0]} ${proj(138.5, -5.0)[1]} L ${proj(141.0, -5.8)[0]} ${proj(141.0, -5.8)[1]}" fill="none" stroke="${isDark ? '#6B7280' : '#94A3B8'}" stroke-width="1.2" stroke-dasharray="4 3"/>
      <text x="${proj(136.2, -3.6)[0]}" y="${proj(136.2, -3.6)[1]}" font-size="10" font-weight="800" fill="${textColor}" opacity="0.85">PROV. PAPUA TENGAH</text>
      <text x="${proj(139.2, -6.4)[0]}" y="${proj(139.2, -6.4)[1]}" font-size="10" font-weight="800" fill="${mutText}" opacity="0.85">PROV. PAPUA SELATAN</text>

      <!-- REGION POLYGON 1: NABIRE -->
      <polygon points="${nabirePoly}" fill="url(#nabireGrad)" stroke="#0284C7" stroke-width="2" style="cursor:pointer" onclick="selectTerritory('Nabire')"/>

      <!-- REGION POLYGON 2: MIMIKA -->
      <polygon points="${mimikaPoly}" fill="url(#mimikaGrad)" stroke="#FF5515" stroke-width="2.2" style="cursor:pointer" onclick="selectTerritory('Mimika')"/>

      <!-- REGION POLYGON 3: ASMAT -->
      <polygon points="${asmatPoly}" fill="url(#asmatGrad)" stroke="#E67E22" stroke-width="2" style="cursor:pointer" onclick="selectTerritory('Asmat')"/>

      <!-- Program Corridor Link: Nabire - Mimika - Asmat -->
      <line x1="${pNab[0]}" y1="${pNab[1]}" x2="${pMim[0]}" y2="${pMim[1]}" stroke="#FF5515" stroke-width="1.8" stroke-dasharray="5 4" opacity="0.75"/>
      <line x1="${pMim[0]}" y1="${pMim[1]}" x2="${pAsm[0]}" y2="${pAsm[1]}" stroke="#FF5515" stroke-width="1.8" stroke-dasharray="5 4" opacity="0.75"/>

      <!-- Village Pins -->
      ${pinsHtml}

      <!-- REGENCY STATS BADGE: NABIRE -->
      <g transform="translate(${pNab[0] + 10},${pNab[1] - 42})" style="cursor:pointer" onclick="selectTerritory('Nabire')">
        <rect x="0" y="0" width="148" height="42" rx="7" fill="${islandFill}" stroke="#0284C7" stroke-width="1.5" filter="url(#mapShadow)"/>
        <text x="8" y="16" font-size="11" font-weight="800" fill="#0284C7"> NABIRE (7 Kampung)</text>
        <text x="8" y="32" font-size="10" font-weight="700" fill="${textColor}">${num(mNab.a + mNab.m)} jiwa <tspan fill="#0284C7">(${pct(mNab.a + mNab.m, mNab.t)}%)</tspan></text>
      </g>

      <!-- REGENCY STATS BADGE: MIMIKA -->
      <g transform="translate(${pMim[0] - 80},${pMim[1] + 16})" style="cursor:pointer" onclick="selectTerritory('Mimika')">
        <rect x="0" y="0" width="162" height="42" rx="7" fill="${islandFill}" stroke="#FF5515" stroke-width="1.8" filter="url(#mapShadow)"/>
        <text x="8" y="16" font-size="11" font-weight="800" fill="#FF5515"> MIMIKA (11 Kampung)</text>
        <text x="8" y="32" font-size="10" font-weight="700" fill="${textColor}">${num(mMim.a + mMim.m)} jiwa <tspan fill="#FF5515">(${pct(mMim.a + mMim.m, mMim.t)}%)</tspan></text>
      </g>

      <!-- REGENCY STATS BADGE: ASMAT -->
      <g transform="translate(${pAsm[0] + 12},${pAsm[1] - 30})" style="cursor:pointer" onclick="selectTerritory('Asmat')">
        <rect x="0" y="0" width="144" height="42" rx="7" fill="${islandFill}" stroke="#E67E22" stroke-width="1.5" filter="url(#mapShadow)"/>
        <text x="8" y="16" font-size="11" font-weight="800" fill="#E67E22"> ASMAT (4 Kampung)</text>
        <text x="8" y="32" font-size="10" font-weight="700" fill="${textColor}">${num(mAsm.a + mAsm.m)} jiwa <tspan fill="#E67E22">(${pct(mAsm.a + mAsm.m, mAsm.t)}%)</tspan></text>
      </g>

      <!-- Compass & Scale -->
      <g transform="translate(42, 60)">
        <circle cx="0" cy="0" r="14" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.2"/>
        <line x1="0" y1="-10" x2="0" y2="10" stroke="#FF5515" stroke-width="2"/>
        <line x1="-10" y1="0" x2="10" y2="0" stroke="${strokeColor}" stroke-width="1.2"/>
        <polygon points="0,-12 -3,-5 3,-5" fill="#FF5515"/>
        <text x="0" y="-14" text-anchor="middle" font-size="8.5" font-weight="800" fill="#FF5515">U</text>
      </g>

      <g transform="translate(35, 485)">
        <line x1="0" y1="0" x2="80" y2="0" stroke="${textColor}" stroke-width="2.5"/>
        <line x1="0" y1="-3" x2="0" y2="3" stroke="${textColor}" stroke-width="1.5"/>
        <line x1="40" y1="-3" x2="40" y2="3" stroke="${textColor}" stroke-width="1.5"/>
        <line x1="80" y1="-3" x2="80" y2="3" stroke="${textColor}" stroke-width="1.5"/>
        <text x="0" y="12" font-size="8.5" fill="${mutText}">0</text>
        <text x="40" y="12" font-size="8.5" fill="${mutText}">100 km</text>
        <text x="80" y="12" font-size="8.5" fill="${mutText}">200 km</text>
      </g>

      <!-- Footer Info -->
      <text x="780" y="505" text-anchor="end" font-size="10" font-weight="700" fill="#FF5515">● Peta Desain Resmi PASTI-Papua (PTFI & WVI)</text>
    </svg>
  `;
}

function renderFocusedRegencyMap(kab) {
  const isDark = THEME === 'dark';
  const strokeColor = isDark ? '#4B5563' : '#CBD5E1';
  const islandFill = isDark ? '#1E293B' : '#FFFFFF';
  const waterFill = isDark ? '#0B1120' : '#F0F9FF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const mutText = isDark ? '#94A3B8' : '#64748B';
  const W = 800, H = 520;

  const kVillages = VILLAGES.filter(v => v.k === kab);
  const regColor = kab === 'Mimika' ? '#FF5515' : kab === 'Nabire' ? '#0284C7' : '#E67E22';

  if (kab === 'Mimika') {
    // Focused Mimika local coordinates
    // Lon: 136.2 to 137.4, Lat: -4.35 to -4.95
    function pM(lon, lat) {
      const x = 50 + (lon - 136.3) / 1.1 * 700;
      const y = 60 + (lat - (-4.4)) / (-4.92 - (-4.4)) * 400;
      return [Math.round(x), Math.round(y)];
    }

    const vPins = kVillages.map(v => {
      const [x, y] = pM(v.lon, v.lat);
      const isAct = ACTIVE_VILLAGE === v.name;
      const vPm = DB.pm.filter(r => r.kp === v.name);
      const reach = sum(vPm);
      return `
        <g class="v-pin" onclick="showVillageDetail('${v.name}')" style="cursor:pointer">
          <circle cx="${x}" cy="${y}" r="${isAct ? 9 : 6}" fill="#FF5515" stroke="#FFF" stroke-width="2"/>
          ${isAct ? `<circle cx="${x}" cy="${y}" r="15" fill="#FF5515" opacity="0.25"/>` : ''}
          <rect x="${x - 48}" y="${y - 28}" width="96" height="20" rx="4" fill="${islandFill}" stroke="#FF5515" stroke-width="1" filter="url(#mapShadow)"/>
          <text x="${x}" y="${y - 14}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${textColor}">${v.name} (${reach})</text>
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" class="ch" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Detail Mimika" style="background:${waterFill}">
        <defs>
          <filter id="mapShadow"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.15"/></filter>
        </defs>

        <!-- Coastline of Mimika -->
        <path d="M 30,360 C 140,370 280,380 430,395 C 570,410 700,420 780,430 L 780,40 L 30,40 Z" fill="${islandFill}" stroke="${strokeColor}" stroke-width="2"/>
        
        <!-- Mountains in the North -->
        <path d="M 40,70 L 140,55 L 240,75 L 340,50 L 440,65 L 560,50 L 680,60 L 770,55" fill="none" stroke="${strokeColor}" stroke-width="3" stroke-dasharray="3 3"/>
        <text x="440" y="42" text-anchor="middle" font-size="11" font-weight="800" fill="#FF5515">▲ Pegunungan Sudirman & Puncak Jaya (Carstensz Pyramid 4.884 m)</text>
        <text x="440" y="470" text-anchor="middle" font-size="12" font-weight="700" fill="${mutText}"> LAUT ARAFURA (PESISIR SELATAN MIMIKA)</text>

        <!-- Rivers in Mimika -->
        <path d="M 220,100 Q 200,240 180,370" fill="none" stroke="#60A5FA" stroke-width="3" opacity="0.6"/>
        <text x="160" y="270" font-size="9" fill="${mutText}">S. Kamora</text>
        <path d="M 430,120 Q 420,260 410,390" fill="none" stroke="#60A5FA" stroke-width="3" opacity="0.6"/>
        <text x="425" y="280" font-size="9" fill="${mutText}">S. Minajerwi</text>
        <path d="M 520,120 Q 530,260 540,405" fill="none" stroke="#60A5FA" stroke-width="3" opacity="0.6"/>
        <text x="545" y="290" font-size="9" fill="${mutText}">S. Tipoeka</text>

        <!-- Timika Urban Area Center Star -->
        <g transform="translate(415, 175)">
          <circle cx="0" cy="0" r="18" fill="rgba(255,85,21,0.15)"/>
          <circle cx="0" cy="0" r="7" fill="#FF5515"/>
          <text x="0" y="22" text-anchor="middle" font-size="10.5" font-weight="800" fill="#FF5515"> Timika (Pusat Kota)</text>
        </g>

        <!-- 11 Village Pins -->
        ${vPins}

        <!-- Focus Header Badge -->
        <g transform="translate(20, 20)">
          <rect x="0" y="0" width="280" height="34" rx="7" fill="${islandFill}" stroke="#FF5515" stroke-width="1.5" filter="url(#mapShadow)"/>
          <text x="10" y="21" font-size="11.5" font-weight="800" fill="#FF5515"> PETA DETAIL KABUPATEN MIMIKA (11 KAMPUNG)</text>
        </g>
        <g transform="translate(620, 20)" style="cursor:pointer" onclick="selectTerritory('Semua')">
          <rect x="0" y="0" width="160" height="34" rx="7" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.2" filter="url(#mapShadow)"/>
          <text x="80" y="21" text-anchor="middle" font-size="11" font-weight="700" fill="${textColor}">‹ Seluruh Papua</text>
        </g>
      </svg>
    `;
  }

  if (kab === 'Nabire') {
    // Focused Nabire local coordinates
    function pN(lon, lat) {
      const x = 60 + (lon - 135.3) / 0.45 * 680;
      const y = 80 + (lat - (-3.25)) / (-3.55 - (-3.25)) * 380;
      return [Math.round(x), Math.round(y)];
    }

    const vPins = kVillages.map(v => {
      const [x, y] = pN(v.lon, v.lat);
      const isAct = ACTIVE_VILLAGE === v.name;
      const vPm = DB.pm.filter(r => r.kp === v.name);
      const reach = sum(vPm);
      return `
        <g class="v-pin" onclick="showVillageDetail('${v.name}')" style="cursor:pointer">
          <circle cx="${x}" cy="${y}" r="${isAct ? 9 : 6}" fill="#0284C7" stroke="#FFF" stroke-width="2"/>
          ${isAct ? `<circle cx="${x}" cy="${y}" r="15" fill="#0284C7" opacity="0.25"/>` : ''}
          <rect x="${x - 48}" y="${y - 28}" width="96" height="20" rx="4" fill="${islandFill}" stroke="#0284C7" stroke-width="1" filter="url(#mapShadow)"/>
          <text x="${x}" y="${y - 14}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${textColor}">${v.name} (${reach})</text>
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" class="ch" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Detail Nabire" style="background:${waterFill}">
        <defs><filter id="mapShadow"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.15"/></filter></defs>
        
        <!-- Teluk Cenderawasih at North -->
        <path d="M 30,170 C 180,180 340,210 460,200 C 580,180 690,160 770,140 L 770,500 L 30,500 Z" fill="${islandFill}" stroke="${strokeColor}" stroke-width="2"/>
        <text x="400" y="80" text-anchor="middle" font-size="12" font-weight="800" fill="#0284C7"> TELUK CENDERAWASIH (PESISIR PANTAI UTARA NABIRE)</text>
        
        <!-- Nabire Kota Center Star -->
        <g transform="translate(400, 230)">
          <circle cx="0" cy="0" r="18" fill="rgba(2,132,199,0.15)"/>
          <circle cx="0" cy="0" r="7" fill="#0284C7"/>
          <text x="0" y="22" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0284C7"> Nabire Kota (Pusat Pemerintahan)</text>
        </g>

        <!-- 7 Village Pins -->
        ${vPins}

        <g transform="translate(20, 20)">
          <rect x="0" y="0" width="280" height="34" rx="7" fill="${islandFill}" stroke="#0284C7" stroke-width="1.5" filter="url(#mapShadow)"/>
          <text x="10" y="21" font-size="11.5" font-weight="800" fill="#0284C7"> PETA DETAIL KABUPATEN NABIRE (7 KAMPUNG)</text>
        </g>
        <g transform="translate(620, 20)" style="cursor:pointer" onclick="selectTerritory('Semua')">
          <rect x="0" y="0" width="160" height="34" rx="7" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.2" filter="url(#mapShadow)"/>
          <text x="80" y="21" text-anchor="middle" font-size="11" font-weight="700" fill="${textColor}">‹ Seluruh Papua</text>
        </g>
      </svg>
    `;
  }

  // Focused Asmat local coordinates
  function pA(lon, lat) {
    const x = 80 + (lon - 137.95) / 0.5 * 640;
    const y = 80 + (lat - (-5.3)) / (-5.82 - (-5.3)) * 380;
    return [Math.round(x), Math.round(y)];
  }

  const vPins = kVillages.map(v => {
    const [x, y] = pA(v.lon, v.lat);
    const isAct = ACTIVE_VILLAGE === v.name;
    const vPm = DB.pm.filter(r => r.kp === v.name);
    const reach = sum(vPm);
    return `
      <g class="v-pin" onclick="showVillageDetail('${v.name}')" style="cursor:pointer">
        <circle cx="${x}" cy="${y}" r="${isAct ? 9 : 6}" fill="#E67E22" stroke="#FFF" stroke-width="2"/>
        ${isAct ? `<circle cx="${x}" cy="${y}" r="15" fill="#E67E22" opacity="0.25"/>` : ''}
        <rect x="${x - 48}" y="${y - 28}" width="96" height="20" rx="4" fill="${islandFill}" stroke="#E67E22" stroke-width="1" filter="url(#mapShadow)"/>
        <text x="${x}" y="${y - 14}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${textColor}">${v.name} (${reach})</text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" class="ch" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Detail Asmat" style="background:${waterFill}">
      <defs><filter id="mapShadow"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.15"/></filter></defs>
      
      <!-- Asmat Delta Landmass -->
      <path d="M 40,40 L 760,40 L 760,380 C 620,400 480,410 320,420 C 180,410 90,400 40,380 Z" fill="${islandFill}" stroke="${strokeColor}" stroke-width="2"/>
      
      <!-- River Network of Asmat (Sirets & Betsj) -->
      <path d="M 480,60 Q 420,220 340,420" fill="none" stroke="#60A5FA" stroke-width="6" opacity="0.6"/>
      <text x="440" y="160" font-size="10" font-weight="700" fill="${mutText}">Sungai Sirets</text>
      <path d="M 620,60 Q 580,240 520,420" fill="none" stroke="#60A5FA" stroke-width="5" opacity="0.6"/>
      <text x="590" y="210" font-size="10" font-weight="700" fill="${mutText}">Sungai Betsj (Atsj)</text>
      
      <text x="400" y="475" text-anchor="middle" font-size="12" font-weight="700" fill="${mutText}"> LAUT ARAFURA (DELTA PESISIR SELATAN ASMAT)</text>
      
      <!-- Agats Center Star -->
      <g transform="translate(320, 240)">
        <circle cx="0" cy="0" r="18" fill="rgba(230,126,34,0.15)"/>
        <circle cx="0" cy="0" r="7" fill="#E67E22"/>
        <text x="0" y="22" text-anchor="middle" font-size="10.5" font-weight="800" fill="#E67E22"> Agats (Kota di Atas Papan Kayu)</text>
      </g>

      <!-- 4 Village Pins -->
      ${vPins}

      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="280" height="34" rx="7" fill="${islandFill}" stroke="#E67E22" stroke-width="1.5" filter="url(#mapShadow)"/>
        <text x="10" y="21" font-size="11.5" font-weight="800" fill="#E67E22"> PETA DETAIL KABUPATEN ASMAT (4 KAMPUNG)</text>
      </g>
      <g transform="translate(620, 20)" style="cursor:pointer" onclick="selectTerritory('Semua')">
        <rect x="0" y="0" width="160" height="34" rx="7" fill="${islandFill}" stroke="${strokeColor}" stroke-width="1.2" filter="url(#mapShadow)"/>
        <text x="80" y="21" text-anchor="middle" font-size="11" font-weight="700" fill="${textColor}">‹ Seluruh Papua</text>
      </g>
    </svg>
  `;
}

function placeMapGIS() {
  const slot = document.getElementById('mapSlot');
  if (!slot) return;
  slot.innerHTML = '<div id="mapHost" style="position:absolute;inset:0"></div>';
  if (!window.maplibregl) {
    setMapMode('design');
    return;
  }
  try {
    const tileUrl = THEME === 'dark' 
      ? 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    
    MAP = new maplibregl.Map({
      container: 'mapHost',
      style: {
        version: 8,
        sources: { base: { type: 'raster', tiles: [tileUrl], tileSize: 256, attribution: '© Esri, OpenStreetMap' } },
        layers: [{ id: 'base', type: 'raster', source: 'base' }]
      },
      center: S.kab === 'Mimika' ? [136.88, -4.55] : S.kab === 'Nabire' ? [135.50, -3.37] : S.kab === 'Asmat' ? [138.13, -5.54] : [136.85, -4.55],
      zoom: S.kab === 'Semua' ? 6.2 : 7.4,
      pitch: 0,
      bearing: 0,
      interactive: true
    });

    MAP.on('load', () => {
      VILLAGES.forEach(v => {
        const el = document.createElement('div');
        el.className = 'mk';
        el.innerHTML = '<b>' + v.name + '</b><br><span style="font-size:9.5px;color:var(--mut)">' + v.k + '</span>';
        el.onclick = () => showVillageDetail(v.name);
        new maplibregl.Marker({ element: el }).setLngLat([v.lon, v.lat]).addTo(MAP);
      });
    });
  } catch(e) {
    setMapMode('design');
  }
}

function destroyMapGL() {
  if (MAP) {
    try { MAP.remove(); } catch(e){}
    MAP = null;
  }
}

/* Settings Drawer & Google Sheets / Excel Loading */
const QK = { pm: 'penerima_manfaat', tg: 'target', kg: 'kegiatan', id: 'indikator', in: 'info' };
function openP() {
  const l = L(), q = new URLSearchParams(location.search), v = k => esc(q.get(k) || CONFIG[QK[k]] || '');
  document.getElementById('pn').innerHTML = `
    <div class="pnh"><b>${l.srcT}</b><button onclick="closeP()" aria-label="Tutup"></button></div>
    <div class="pnb">
      ${['pm', 'tg', 'kg', 'id', 'in'].map((k, i) => `<label for="u${i}">CSV: ${QK[k]}</label><input type="url" id="u${i}" value="${v(k)}" placeholder="https://docs.google.com/.../pub?output=csv">`).join('')}
      <button class="btn bk" onclick="useUrls()">${l.connect}</button>
      <div class="msg" id="msg"></div>
      <label>${l.upload}</label>
      <input type="file" accept=".xlsx,.xls,.csv" onchange="useFile(this.files[0])">
      <button class="btn bl" onclick="copyLink()">${icon('link')} ${l.copy}</button>
      <button class="btn bl" onclick="DB=build(generateSampleData());SRC='sample';closeP();render()">${l.backS}</button>
    </div>
  `;
  document.getElementById('pn').classList.add('on'); document.getElementById('ovl').classList.add('on');
}
function closeP() { document.getElementById('pn').classList.remove('on'); document.getElementById('ovl').classList.remove('on'); }

async function useUrls() {
  const ks = ['pm', 'tg', 'kg', 'id', 'in'], u = {};
  ks.forEach((k, i) => u[QK[k]] = document.getElementById('u' + i).value.trim());
  const m = document.getElementById('msg'); m.textContent = 'Menghubungkan...';
  try {
    const get = async x => { if (!x) return []; const r = await fetch(x, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return toObjs(csv(await r.text())); };
    const [a, b, c, d, e] = await Promise.all([get(u.penerima_manfaat), get(u.target), get(u.kegiatan), get(u.indikator), get(u.info)]);
    if (!a.length) throw new Error('penerima_manfaat kosong');
    DB = build({ penerima_manfaat: a, target: b, kegiatan: c, indikator: d, info: e });
    SRC = 'sheet';
    const q = new URLSearchParams(); ks.forEach(k => u[QK[k]] && q.set(k, u[QK[k]]));
    history.replaceState(null, '', '?' + q + location.hash);
    closeP(); render();
  } catch (e) { m.textContent = e.message; }
}

async function useFile(f) {
  if (!f) return; const m = document.getElementById('msg');
  try {
    let o;
    if (/\.csv$/i.test(f.name)) {
      o = { penerima_manfaat: toObjs(csv(await f.text())), target: [], kegiatan: [], indikator: [], info: [] };
    } else {
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const sh = n => { const k = Object.keys(wb.Sheets).find(x => norm(x) === n); return k ? toObjs(XLSX.utils.sheet_to_json(wb.Sheets[k], { header: 1, raw: false, defval: '' })) : []; };
      o = { penerima_manfaat: sh('penerima_manfaat'), target: sh('target'), kegiatan: sh('kegiatan'), indikator: sh('indikator'), info: sh('info') };
    }
    if (!o.penerima_manfaat.length) throw new Error('Sheet penerima_manfaat tidak ditemukan');
    DB = build(o); SRC = 'sheet'; closeP(); render();
  } catch (e) { m.textContent = e.message; }
}

function copyLink() {
  const t = location.href;
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Link dashboard disalin '));
  else prompt('Link dashboard:', t);
}

async function initDashboard() {
  readHash();
  const q = new URLSearchParams(location.search);
  if (q.get('lang') === 'en') LG = 'en';
  if (q.get('theme') === 'dark') THEME = 'dark';
  DB = build(generateSampleData());
  SRC = 'sample';
  render();
  const keys = Object.keys(QK);
  if (keys.some(k => q.get(k) || CONFIG[QK[k]])) {
    try {
      const values = await Promise.all(keys.map(async k => {
        const source = q.get(k) || CONFIG[QK[k]];
        if (!source) return [];
        const response = await fetch(source, {cache:'no-store'});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return toObjs(csv(await response.text()));
      }));
      const input = Object.fromEntries(keys.map((k,i) => [QK[k], values[i]]));
      if (!keys.some(k => q.get(k))) {
        const docsResponse = await fetch('data/dokumentasi.csv', {cache:'no-store'});
        if (!docsResponse.ok) throw new Error('HTTP ' + docsResponse.status);
        input.dokumentasi = toObjs(csv(await docsResponse.text()));
      }
      DB = build(input); SRC = 'sheet'; render();
    } catch (error) {
      toast((LG === 'en' ? 'Data connection failed; showing sample data: ' : 'Koneksi data gagal; menampilkan data contoh: ') + error.message);
    }
  }
}
