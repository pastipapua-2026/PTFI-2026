/**
 * PASTI-Papua PTFI · Donor presentation upgrade
 * Works with the existing assets/dashboard.js (v6); no framework, no API key.
 * All programme data and source CSV headers remain unchanged.
 */
(() => {
  'use strict';
  const STORE_LANGUAGE = 'ptfi-2026-language';
  const STORE_THEME = 'ptfi-2026-theme';
  const STATE = new WeakMap();
  const get = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };
  const query = new URLSearchParams(location.search);
  const requestedLang = query.get('lang') || get(STORE_LANGUAGE);
  const requestedTheme = query.get('theme') || get(STORE_THEME);
  if (requestedLang === 'en' || requestedLang === 'id') LG = requestedLang;
  if (requestedTheme === 'dark' || requestedTheme === 'light') THEME = requestedTheme;

  /** Translation of hardcoded UI copy not covered by dashboard.js's I[LG]. */
  const EXACT = {
    'DASHBOARD PTFI': 'PTFI DASHBOARD',
    'Masukkan kode akses untuk membuka data capaian program bagi PT Freeport Indonesia.': 'Enter your access code to view programme results for PT Freeport Indonesia.',
    'Masuk / Enter': 'Sign in',
    'Akses terbatas untuk tim donor PTFI & pelaksana WVI': 'Restricted access for the PTFI donor team and WVI implementing team',
    'KODE AKSES / ACCESS CODE': 'ACCESS CODE',
    'PROGRAM DONOR PTFI': 'PTFI-FUNDED PROGRAMME',
    'Periode: Sep 2024 – Okt 2027': 'Period: Sep 2024 – Oct 2027',
    'Sep 2024 – Okt 2027': 'Sep 2024 – Oct 2027',
    'Tujuan Program / Goal Statement': 'Programme Goal',
    'Pilar 1: Gizi Komunitas': 'Pillar 1: Community Nutrition',
    'Pilar 2: Layanan Primer': 'Pillar 2: Primary Health Care',
    'Pilar 3: Tata Kelola Multipihak': 'Pillar 3: Multi-Stakeholder Governance',
    'Peningkatan praktik kesehatan & gizi berbasis keluarga dan agen perubahan lokal.': 'Improving family-based health and nutrition practices through local agents of change.',
    'Penguatan kapasitas kader posyandu & nakes serta tata laksana rujukan terpadu.': 'Strengthening Posyandu cadres, health workers, and integrated referral management.',
    'Kolaborasi multipihak & konvergensi program RAN PASTI pencegahan stunting daerah.': 'Strengthening multi-stakeholder collaboration and local convergence of RAN PASTI stunting prevention efforts.',
    '3 Kabupaten Intervensi & 22 Kampung Dampingan': '3 Intervention Regencies & 22 Supported Villages',
    'Target Tahunan: 6.420 Jiwa': 'Annual Target: 6,420 People',
    'Mimika (11 Kampung)': 'Mimika (11 Villages)',
    'Nabire (7 Kampung)': 'Nabire (7 Villages)',
    'Asmat (4 Kampung)': 'Asmat (4 Villages)',
    'Didanai oleh': 'Funded by',
    'Dilaksanakan oleh': 'Implemented by',
    'Buka Dashboard / Enter Dashboard': 'Open Dashboard',
    'Halaman / Pages': 'Pages',
    'Cover Proyek': 'Project Cover',
    'DATA CONTOH / SAMPLE DATA': 'SAMPLE DATA · NOT VERIFIED',
    'Peta Desain': 'Illustrative Map',
    'Satelit 2D': '2D Satellite',
    'Interaksi Peta:': 'Map Interaction:',
    'Peta Wilayah Intervensi PASTI-Papua': 'PASTI-Papua Intervention Area Map',
    'Mimika · Nabire (Papua Tengah) & Asmat (Papua Selatan) — 22 Kampung Dampingan': 'Mimika · Nabire (Central Papua) & Asmat (South Papua) — 22 Supported Villages',
    'Seluruh Papua (3 Kab)': 'All Areas (3 Regencies)',
    '22 Kampung Dampingan': '22 Supported Villages',
    'Filter Mingguan:': 'Weekly Filter:',
    '(Sedang Berjalan)': '(In Progress)',
    'Tampilkan Semua Minggu': 'Show All Weeks',
    'Total Balita (0–59 bln)': 'Total Under-Five Children (0–59 months)',
    'Emas 1.000 HPK (0–23 bln)': 'First 1,000 Days (0–23 months)',
    'Remaja (10–18 thn)': 'Adolescents (10–18 years)',
    'WUS & Ibu (19–49 thn)': 'Women of Reproductive Age & Mothers (19–49 years)',
    'Rasio Gender (P : L)': 'Sex Ratio (F : M)',
    'Distribusi umur & jenis kelamin': 'Age and Sex Distribution',
    '0–23 bln = Jendela 1.000 HPK': '0–23 months = First 1,000 Days Window',
    'Kelompok Umur': 'Age Group',
    'Sebaran Demografi per Kampung / Desa': 'Demographic Distribution by Village',
    'Kampung': 'Village',
    'Kabupaten': 'Regency',
    'Balita': 'Under-Five Children',
    'Remaja': 'Adolescents',
    'Dewasa': 'Adults',
    'Matriks Capaian per Kelompok Sasaran': 'Achievement Matrix by Target Group',
    'Target Tahunan vs Capaian': 'Annual Target vs Achievement',
    'Kategori': 'Category',
    'Kelompok Sasaran': 'Target Group',
    'Komposisi 4 Pilar Kategori Intervensi': 'Composition of Four Intervention Categories',
    'Target 6.420 Jiwa': 'Target: 6,420 People',
    'Kader, Nakes, Tokoh Agama/Adat & Agen Perubahan': 'Cadres, Health Workers, Faith/Traditional Leaders & Agents of Change',
    '⭐ Sasaran Kunci Intervensi Stunting & 1.000 HPK': '⭐ Priority Groups for Stunting Prevention & First 1,000 Days',
    'Fokus Program': 'Programme Focus',
    'Ibu Hamil & ANC Teratur': 'Pregnant Women & Routine ANC',
    'Edukasi tanda bahaya & kepatuhan konsumsi 90 TTD': 'Awareness of danger signs & adherence to 90 iron–folic acid tablets',
    'Ibu Menyusui & PMBA': 'Lactating Mothers & IYCF',
    'Praktik ASI Eksklusif 6 bulan & MP-ASI padat gizi': 'Exclusive breastfeeding for six months & nutrient-dense complementary feeding',
    'Remaja Putri Bebas Anemia': 'Anaemia Prevention for Adolescent Girls',
    'Pencegahan anemia calon pengantin masa depan': 'Preventing anaemia among future brides and mothers',
    'Pengasuhan Ayah / Bapak': 'Engaging Fathers in Caregiving',
    'Dukungan gizi keluarga & sanitasi higienis': 'Supporting family nutrition and safe hygiene',
    'Progres Target Tahunan 3 Kabupaten': 'Annual Target Progress Across Three Regencies',
    'Tipologi Wilayah 22 Kampung Dampingan:': 'Geographic Typology of 22 Supported Villages:',
    'Pesisir:': 'Coastal:',
    '12 Kampung': '12 Villages',
    'Perkotaan:': 'Urban:',
    '6 Kampung': '6 Villages',
    'Delta / Rawa:': 'Delta / Wetlands:',
    '4 Kampung': '4 Villages',
    'Peringkat Berdasarkan Capaian': 'Ranking by Achievement',
    'Tipologi Wilayah': 'Geographic Typology',
    'Total Sesi Kegiatan Terlaksana': 'Total Activity Sessions Delivered',
    'Frekuensi Pelaksanaan': 'Implementation Frequency',
    '(2 Bulan Sekali)': '(Every Two Months)',
    'Cakupan Output Intervensi': 'Intervention Output Coverage',
    '6 Output (1.1 s.d. 3.1)': '6 Outputs (1.1 to 3.1)',
    'Sebaran 3 Kabupaten': 'Distribution Across Three Regencies',
    'Pilar Output Program': 'Programme Outputs',
    'Bulan × Kabupaten': 'Month × Regency',
    'Rincian Activity & Kontribusi ke Indikator Output': 'Activity Details & Contributions to Output Indicators',
    '10 Jenis Kegiatan Terverifikasi': '10 Activity Types Listed',
    'Kode': 'Code',
    'Nama Kegiatan (Activity)': 'Activity Name',
    'Frekuensi': 'Frequency',
    'Sesi': 'Sessions',
    'Kontribusi Indikator Capaian Output': 'Contribution to Output Indicators',
    'Penerima Manfaat Baru Bulan Terakhir:': 'New Beneficiaries in Latest Month:',
    'Rata-rata Penambahan / Bulan:': 'Average Monthly Increase:',
    'Sisa Target Tahunan 2026:': 'Remaining 2026 Annual Target:',
    'Data Agregat Bulanan': 'Monthly Aggregated Data',
    '% Target': '% of Target',
    'Bulan:': 'Month:',
    'Semua Bulan (Sep - Nov 2026)': 'All Months (Sep–Nov 2026)',
    'Oktober 2026 (Bulan Berjalan)': 'October 2026 (Current Month)',
    'November 2026 (Rencana Kegiatan)': 'November 2026 (Planned Activities)',
    'Wilayah:': 'Area:',
    'Semua Wilayah': 'All Areas',
    'Lokasi:': 'Location:',
    ', Kabupaten': ', Regency',
    '· Tag:': '· Tag:',
    'Deskripsi & Tujuan Kegiatan:': 'Activity Description & Objectives:',
    'Peserta & Pemangku Kepentingan:': 'Participants & Stakeholders:',
    'Mitra Pelaksana:': 'Implementing Partner:',
    'Wahana Visi Indonesia didanai oleh PT Freeport Indonesia': 'Wahana Visi Indonesia, funded by PT Freeport Indonesia',
    'Pilih Foto Kegiatan:': 'Select Activity Image:',
    'Galeri Dokumentasi Foto Kegiatan Lapangan': 'Field Activity Photo Gallery',
    'Panduan Teknis & Integrasi Google API': 'Technical Guide & Google API Integration',
    'Panduan Integrasi Google Sheets API / CSV': 'Google Sheets API / CSV Integration Guide',
    'Hubungkan lima sumber CSV untuk memuat data saat dashboard dibuka. Muat ulang halaman untuk mengambil pembaruan terbaru.': 'Connect five CSV data sources to load data when the dashboard opens. Refresh the page to retrieve the latest updates.',
    'Langkah 1:': 'Step 1:',
    'Siapkan spreadsheet mengikuti 5 sheet template:': 'Prepare a spreadsheet with these five template worksheets:',
    'Langkah 2:': 'Step 2:',
    'Di Google Sheets, klik': 'In Google Sheets, select',
    '. Pilih masing-masing sheet dan format': '. Publish each worksheet in',
    'Langkah 3:': 'Step 3:',
    'Masukkan link CSV di menu': 'Enter the CSV links in',
    'Sumber Data': 'Data Sources',
    ', atau bagikan dashboard dengan parameter URL otomatis:': ', or share the dashboard using URL parameters:',
    'Buka Pengaturan Sumber Data': 'Open Data Source Settings',
    'Salin Link Berbagi Saat Ini': 'Copy Current Sharing Link',
    'Persiapan Integrasi Google Maps Platform API': 'Google Maps Platform API Integration Preparation',
    'Panduan teknis penyambungan Google Maps JavaScript API untuk pemetaan wilayah:': 'Technical steps for connecting the Google Maps JavaScript API for geographic mapping:',
    'Buat project di': 'Create a project at',
    ', aktifkan': ', and enable',
    '2. Pengamanan Kunci:': '2. API Key Security:',
    'Kunci API wajib dibatasi dengan': 'Restrict your API key using',
    'ke domain portal Anda agar aman dari kuota liar.': 'to your authorised portal domain to prevent unauthorised usage.',
    '3. Koordinat Acuan Resmi (Lat / Lon):': '3. Reference Coordinates (Lat / Lon):',
    'Kamus Data & Aturan Perhitungan (Data Dictionary)': 'Data Dictionary & Calculation Rules',
    'Kolom Wajib': 'Required Columns',
    'Aturan Bisnis': 'Business Rules',
    'capaian = nilai baru unik bulanan. Kumulatif dijumlahkan antar bulan.': 'capaian = unique new count for each month. Cumulative totals are summed across months.',
    'target = target TAHUNAN. Jangan menjumlahkan target antar bulan. Total: 6.420 jiwa.': 'target = ANNUAL target. Do not sum targets across months. Total: 6,420 people.',
    'Jumlah sesi kegiatan menurut output (1.1 - 3.1) dan 10 jenis kegiatan intervensi.': 'Number of activity sessions by output (1.1–3.1) and ten intervention activity types.',
    '11 indikator donor. Tercapai (≥100%), Sesuai jalur (60–99%), Perlu perhatian (<60%).': '11 donor indicators. Achieved (≥100%), on track (60–99%), needs attention (<60%).',
    '11 indikator donor. Tercapai (≥100%), Sesuai jalur (60–99%), Perlu perhatian (&lt;60%).': '11 donor indicators. Achieved (≥100%), on track (60–99%), needs attention (<60%).',
    'Metadata sistem:': 'System metadata:',
    'Keamanan & SOP Pembaruan Bulanan': 'Security & Monthly Update SOP',
    'Dashboard ini terdiri dari': 'This dashboard consists of',
    'HTML, CSS, dan JavaScript statis': 'static HTML, CSS, and JavaScript',
    ', tanpa server backend:': ', without a backend server:',
    'Cukup unggah': 'Upload',
    'beserta file pendukung repositori ke GitHub Pages, SharePoint, Netlify, atau portal intranet PTFI.': 'together with supporting repository files to GitHub Pages, SharePoint, Netlify, or the PTFI intranet portal.',
    'Kode Akses:': 'Access Code:',
    'Pembatas tampilan berbasis browser dengan': 'Client-side access gate using',
    ', bukan autentikasi server. Kode:': ', not server-side authentication. Code:',
    '. Setelah 3 kali salah, terkunci 30 detik.': '. Three failed attempts trigger a 30-second lock.',
    'SOP Pembaruan:': 'Update SOP:',
    'Data dihimpun tim lapangan setiap akhir bulan dan dirilis resmi tanggal 1 setiap bulan.': 'Field teams compile data at the end of each month for official release on the first day of the following month.',
    'Menghubungkan...': 'Connecting...',
    'Link dashboard disalin': 'Dashboard link copied',
    'penerima_manfaat kosong': 'The beneficiary dataset is empty',
    'Sheet penerima_manfaat tidak ditemukan': 'The beneficiary worksheet was not found',
    'Indikator Output': 'Output Indicator',
    'jiwa': 'people',
    'sesi': 'sessions',
    'kegiatan': 'activities',
    'perempuan': 'female',
    'laki-laki': 'male',
    'balita/anak': 'young children',
    'jiwa terjangkau': 'people reached',
    'jiwa terjangkau pada minggu ini': 'people reached this week',
    'Anak': 'Children',
    'Perempuan': 'Female',
    'Laki-laki': 'Male',
    'Target Tahunan': 'Annual Target',
    'Bulan Berjalan': 'Current Month',
    'Semua': 'All',
    'Semua Kampung': 'All Villages'
  };

  const ACTIVITY_EN = {
    'Aksi agen perubahan': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-1.1.1 (Micronutrient and IYCF counselling by agents of change)',
      desc: 'Home-based family nutrition education and counselling delivered by community agents of change.'
    },
    'Pelatihan KAP': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-1.1.2 (Interpersonal communication training for cadres)',
      desc: 'Strengthening interpersonal communication methods to improve caregiving practices for families with children under five.'
    },
    'Pos Gizi / PMT lokal': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-1.2.1 (Nutrition rehabilitation through Pos Gizi)',
      desc: 'A 10–12-day Pos Gizi cycle using locally available nutrient-dense foods, including fish, eggs, vegetables, and sago.'
    },
    'Kelas berseri remaja': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-1.3.1 (IFA adherence and nutrition education for adolescent girls)',
      desc: 'Education on reproductive health, balanced diets, and adherence to iron–folic acid supplementation.'
    },
    'Kelas berseri bapak': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-1.3.2 (Engaging fathers in childcare)',
      desc: 'Engaging fathers in supporting exclusive breastfeeding, maternal nutrition, and household sanitation.'
    },
    'Kelas ibu hamil': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-1.3.3 (ANC adherence and first 1,000 days knowledge)',
      desc: 'Nutrition education during pregnancy, recognition of danger signs, and preparation for safe delivery.'
    },
    'Pendampingan rujukan TPK': {
      periodicity: 'Monthly / case-based',
      indicatorContrib: 'IOP-1.4.1 (Integrated referral mechanism for at-risk children)',
      desc: 'Family Assistance Team support for referring children with severe acute malnutrition to Puskesmas or hospitals.'
    },
    'Pelatihan kader': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-2.1.1 (Standard anthropometric measurement skills for cadres)',
      desc: 'Technical training on measuring under-five height and length, and recording results in digital growth monitoring cards.'
    },
    'Pelatihan nakes': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-2.1.2 (Standardised nutrition management for healthcare workers)',
      desc: 'Strengthening the capacity of doctors, nurses, and Puskesmas nutritionists in stunting management.'
    },
    'Pertemuan lintas sektor': {
      periodicity: 'Every two months',
      indicatorContrib: 'IOP-3.1.1 (Convergence of RAN PASTI and local TPPS)',
      desc: 'Multi-sector stunting coordination involving government agencies, development partners, and PTFI.'
    }
  };

  /** Content below corresponds to FIELD_DOCS example items in the existing dashboard. */
  const DOCUMENTATION_EN = {
    'doc-1': {
      dateStr: '14 October 2026', output: '1.2 Community Nutrition',
      title: 'Pos Gizi Sessions & Local Food Cooking Demonstration in Tipuka Village',
      desc: 'Day five of the Pos Gizi cycle at Tipuka Village Hall, Mimika. Eighteen mothers of undernourished children practised preparing nutrient-dense meals using fresh sea fish, eggs, moringa leaves, and local sago. The example narrative reports an average 250-gram weight gain among participating children after intensive follow-up.',
      participants: '18 mothers and children, 4 Pos Gizi cadres, 2 WVI MEAL staff', tag: 'Local Supplementary Feeding & Pos Gizi'
    },
    'doc-2': {
      dateStr: '19 October 2026', output: '2.1 Primary Health Care',
      title: 'Standardised Digital Anthropometric Measurement Training for Nabire Posyandu Cadres',
      desc: 'Technical training in the use of digital infantometers and Ministry of Health-standardised weighing scales for Siriwini Posyandu cadres and representatives from supported villages in Nabire. Puskesmas nutrition personnel provided mentoring to reduce measurement errors.',
      participants: '24 Posyandu cadres, 3 Puskesmas nutrition personnel', tag: 'Cadre Capacity Building'
    },
    'doc-3': {
      dateStr: '24 October 2026', output: '1.2 Community Nutrition',
      title: 'First 1,000 Days Nutrition Packages & Hygiene Education in Agats / Sesakam',
      desc: 'An integrated health team travelled by longboat to Sesakam Village in the tidal wetlands of Agats. The team distributed micronutrient food packages to 22 families with pregnant women and children aged 0–23 months and demonstrated handwashing with soap and safe drinking water preparation.',
      participants: '22 first 1,000 days households, village traditional leaders, 2 village midwives', tag: 'First 1,000 Days Nutrition'
    },
    'doc-4': {
      dateStr: '8 October 2026', output: '1.3 SBC Education',
      title: 'Adolescent Girls’ Anaemia Prevention Class Series in Coastal Makimi',
      desc: 'A series of preconception nutrition classes for adolescents at Makimi Junior High School. Topics included the risks of anaemia, weekly adherence to iron–folic acid supplements, and balanced diets to help prevent intergenerational stunting.',
      participants: '38 adolescent girls, 2 school health programme teachers, 1 WVI facilitator', tag: 'Adolescent Classes'
    },
    'doc-5': {
      dateStr: '16 October 2026', output: '1.3 SBC Education',
      title: 'Father Engagement & Child Nutrition Parenting Sessions in Koperapoka',
      desc: 'A facilitated group discussion and interactive class with fathers and heads of households in Koperapoka, Timika. Participants discussed fathers’ support for exclusive breastfeeding, prioritising nutritious food in household spending, and sharing childcare responsibilities.',
      participants: '26 heads of households/fathers, 1 faith leader, 2 WVI gender facilitators', tag: 'Father Engagement'
    },
    'doc-6': {
      dateStr: '27 October 2026', output: '1.4 Case Referrals',
      title: 'TPK-Supported Referral of Children at Risk of Stunting in Warse, Atsj',
      desc: 'Family Assistance Team members and field facilitators conducted outreach in Warse Village, Atsj District. Three undernourished children with co-existing acute respiratory infections were supported in referrals by water ambulance to Atsj Puskesmas for integrated nutrition treatment.',
      participants: '3 children and parents, 3 TPK cadres, 1 Puskesmas medical worker', tag: 'TPK Referral'
    },
    'doc-7': {
      dateStr: '4 October 2026', output: '3.1 Governance',
      title: 'Stunting Consultation & RAN PASTI Convergence Review with Bappeda and TPPS',
      desc: 'A multi-stakeholder district coordination meeting attended by local government representatives, village heads, Mimika TPPS, and PTFI donor representatives. The discussion addressed proposed 2027 village budget commitments for supplementary feeding and Posyandu cadre incentives.',
      participants: '35 participants (Bappeda, Health Office, village agency, TPPS, village heads, PTFI)', tag: 'Stunting Consultation'
    },
    'doc-8': {
      dateStr: '28 September 2026', output: '1.1 Agents of Change',
      title: 'Infant and Young Child Feeding Education in Coastal Atuka',
      desc: 'Agents of change in Atuka conducted home visits demonstrating the preparation of mashed fish and pumpkin porridge for infants aged 6–8 months. Mothers received guidance on age-appropriate complementary food textures.',
      participants: '15 mothers of under-five children, 3 local agents of change', tag: 'IYCF Education'
    },
    'doc-9': {
      dateStr: '18 September 2026', output: '1.1 Agents of Change',
      title: 'Interpersonal Communication Training for Agents of Change in Nabire',
      desc: 'Role-play and persuasive communication exercises for twenty selected agents of change from Bumi Wonorejo, Wadio, and Bumi Raya. Training addressed approaches to local food taboos and misconceptions affecting pregnant women and young children in Papua.',
      participants: '20 agents of change, 2 WVI facilitators', tag: 'Interpersonal Communication Training'
    },
    'doc-10': {
      dateStr: '22 September 2026', output: '2.1 Primary Health Care',
      title: 'Integrated Antenatal Care & Anaemia Screening in Akamar',
      desc: 'An outreach service by Puskesmas doctors and the PASTI-Papua team in Akat District. Fourteen pregnant women received portable ultrasound examinations, haemoglobin tests, and pregnancy nutrition counselling.',
      participants: '14 pregnant women, 1 doctor, 2 village midwives', tag: 'Integrated ANC'
    },
    'doc-11': {
      dateStr: '12 November 2026 (Planned)', output: '1.2 Community Nutrition',
      title: 'Follow-Up Pos Gizi Cycle & Final Growth Monitoring in Nayaro',
      desc: 'A planned review of children completing a 12-day Pos Gizi cycle in Nayaro Village along the MP 38 corridor, including distribution of home-garden vegetable seeds to strengthen long-term household food security.',
      participants: 'Estimated 20 families with young children, 4 Posyandu cadres', tag: 'Upcoming Activity'
    },
    'doc-12': {
      dateStr: '20 November 2026 (Planned)', output: '2.1 Primary Health Care',
      title: 'Refresher Training on 25 Core Posyandu Cadre Skills in Kali Harapan',
      desc: 'Planned refresher training for Nabire Posyandu cadres in early detection of nutrition problems and cohort record-keeping using the revised maternal and child health handbook.',
      participants: 'Estimated 30 Posyandu cadres and village women’s group members', tag: 'Upcoming Activity'
    }
  };

  const VILLAGE_EN = {
    'Pesisir Mimika Tengah': 'Central Mimika Coast', 'Muara Tipoeka / Pesisir': 'Tipoeka Estuary / Coast',
    'Pesisir Mimika Timur Jauh': 'Far East Mimika Coast', 'Pesisir Mimika Barat': 'West Mimika Coast',
    'Perkotaan Timika': 'Urban Timika', 'Perkotaan Timika Baru': 'New Timika Urban Area',
    'Koridor MP 38 / Foothills': 'MP 38 Corridor / Foothills',
    'Pesisir Timur Jauh': 'Far East Coast', 'Pesisir Timur': 'East Coast',
    'Muara Minajerwi / MP 21': 'Minajerwi Estuary / MP 21',
    'Pusat distrik bersejarah pesisir barat': 'Historic district centre on the west coast',
    'Kawasan pemukiman inti perkotaan Timika': 'Central urban residential area of Timika',
    'Kawasan pemukiman lingkar barat daya Timika': 'Residential area southwest of Timika',
    'Dekat koridor operasional PTFI dataran rendah': 'Near the PTFI lowland operations corridor',
    'Pesisir pantai selatan, akses perahu longboat muara laut': 'Southern coast, accessible by longboat via the estuary',
    'Kawasan muara sungai pesisir timur Mimika': 'Estuary area on Mimika’s eastern coast',
    'Pesisir muara timur batas distrik': 'Eastern estuary coast near the district boundary',
    'Pesisir muara sungai Kamora barat': 'Western Kamora River estuary coast',
    'Pesisir muara perbatasan timur jauh': 'Far eastern coastal estuary',
    'Kawasan muara sungai pesisir timur': 'Eastern coastal river estuary'
  };

  function preserveAndTranslate(obj, fields, translated, locale) {
    if (!obj || !translated) return;
    const originals = obj.__ptfiOriginalFields || Object.defineProperty(obj, '__ptfiOriginalFields', {
      value: Object.fromEntries(fields.map(k => [k, obj[k]])), configurable: true
    }).__ptfiOriginalFields;
    for (const field of fields) {
      if (Object.hasOwn(translated, field)) obj[field] = locale === 'en' ? translated[field] : originals[field];
    }
  }

  function translateData(locale) {
    // All source values remain in the original language for filters and calculations.
    if (typeof FIELD_DOCS !== 'undefined') FIELD_DOCS.forEach(doc => {
      preserveAndTranslate(doc, ['dateStr', 'output', 'title', 'desc', 'participants', 'tag'], DOCUMENTATION_EN[doc.id], locale);
    });
    if (typeof ACTIVITY_INFO !== 'undefined') Object.entries(ACTIVITY_INFO).forEach(([key, obj]) => {
      preserveAndTranslate(obj, ['periodicity', 'indicatorContrib', 'desc'], ACTIVITY_EN[key], locale);
    });
    if (typeof VILLAGES !== 'undefined') VILLAGES.forEach(v => {
      const original = v.__ptfiOriginalFields || Object.defineProperty(v, '__ptfiOriginalFields', {
        value: { zone: v.zone, desc: v.desc }, configurable: true
      }).__ptfiOriginalFields;
      v.zone = locale === 'en' ? (VILLAGE_EN[original.zone] || original.zone) : original.zone;
      v.desc = locale === 'en' ? (VILLAGE_EN[original.desc] || original.desc) : original.desc;
    });
  }

  const ORDERED = Object.keys(EXACT).sort((a, b) => b.length - a.length);
  const START_WORD = /[\p{L}\p{N}_]/u;
  function translatedText(input, locale) {
    if (locale === 'id' || !input.trim()) return input;
    const whitespaceStart = (input.match(/^\s*/) || [''])[0];
    const whitespaceEnd = (input.match(/\s*$/) || [''])[0];
    const core = input.trim();
    if (Object.hasOwn(EXACT, core)) return whitespaceStart + EXACT[core] + whitespaceEnd;
    // Template literals often split UI labels across text nodes or variable bindings.
    let result = core;
    for (const from of ORDERED) {
      if (!result.includes(from)) continue;
      // Short identifiers must not be changed inside technical column names or code.
      if (from.length < 7 && (from === 'jiwa' || from === 'sesi' || from === 'kegiatan' || from === 'Semua')) {
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${from}(?=$|[^\\p{L}\\p{N}_])`, 'gu');
        result = result.replace(pattern, (_match, prefix) => prefix + EXACT[from]);
      } else if (from.length >= 7) {
        result = result.split(from).join(EXACT[from]);
      }
    }
    // Catch changing totals and year-specific dashboard helper labels.
    if (result === core) {
      result = result.replace(/^(\d[\d.,]*)\s+jiwa\b/u, '$1 people')
        .replace(/^Dokumen #(\d+) dari (\d+)$/u, 'Document #$1 of $2')
        .replace(/\bTarget Tahunan:\s*/gu, 'Annual Target: ')
        .replace(/^Pelaksanaan:\s*/u, 'Implementation: ');
    }
    return whitespaceStart + result + whitespaceEnd;
  }

  function translateProperty(node, name, locale) {
    if (!node?.hasAttribute?.(name)) return;
    let state = STATE.get(node) || {};
    state.attrs ||= {};
    const current = node.getAttribute(name);
    const old = state.attrs[name];
    if (!old || current !== old.last) state.attrs[name] = { source: current, last: current };
    const attr = state.attrs[name];
    const next = translatedText(attr.source, locale);
    if (current !== next) node.setAttribute(name, next);
    attr.last = next;
    STATE.set(node, state);
  }

  function applyTranslations(root = document.body) {
    const locale = typeof LG === 'string' ? LG : 'id';
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return (!parent || parent.closest('script,style,code,pre,noscript')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const changed = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const current = node.nodeValue;
      if (!current?.trim()) continue;
      let state = STATE.get(node);
      if (!state || state.last !== current) state = { source: current, last: current };
      const replacement = translatedText(state.source, locale);
      if (current !== replacement) changed.push([node, replacement]);
      state.last = replacement;
      STATE.set(node, state);
    }
    changed.forEach(([node, replacement]) => { node.nodeValue = replacement; });
    const elements = [root, ...root.querySelectorAll('[title],[aria-label],[placeholder]')];
    elements.forEach(el => ['title', 'aria-label', 'placeholder'].forEach(k => translateProperty(el, k, locale)));
    document.documentElement.lang = locale;
    document.title = locale === 'en' ? 'PASTI-Papua | PTFI Donor Results Dashboard' : 'PASTI-Papua | Dashboard Capaian PTFI';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = locale === 'en'
      ? 'Results reporting dashboard for PT Freeport Indonesia and Wahana Visi Indonesia: Mimika, Nabire and Asmat.'
      : 'Dashboard pelaporan capaian PASTI-Papua untuk PT Freeport Indonesia dan Wahana Visi Indonesia di Mimika, Nabire, dan Asmat.';
  }

  function syncTheme() {
    document.body.classList.toggle('dark', THEME === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = THEME === 'dark' ? '#0B0C17' : '#F3F2F0';
  }

  function syncControls() {
    const container = document.getElementById('ptfiAuthSettings');
    if (container) {
      container.querySelectorAll('[data-locale]').forEach(b => {
        const chosen = b.dataset.locale === LG;
        b.setAttribute('aria-pressed', String(chosen)); b.classList.toggle('on', chosen);
      });
      container.querySelectorAll('[data-theme]').forEach(b => {
        const chosen = b.dataset.theme === THEME;
        b.setAttribute('aria-pressed', String(chosen)); b.classList.toggle('on', chosen);
        b.title = b.dataset.theme === 'dark' ? (LG === 'en' ? 'Dark mode' : 'Mode gelap') : (LG === 'en' ? 'Light mode' : 'Mode terang');
      });
    }
    const tools = document.getElementById('tools');
    if (tools?.children?.length && !document.getElementById('ptfiPrintCurrent')) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'ib ptfi-print-current'; button.id = 'ptfiPrintCurrent';
      button.innerHTML = '<span aria-hidden="true">▤</span>';
      button.addEventListener('click', () => startPrint('current'));
      const printAll = tools.querySelector('button[onclick="doPrint()"]');
      tools.insertBefore(button, printAll || null);
    }
    const printCurrent = document.getElementById('ptfiPrintCurrent');
    const printAll = tools?.querySelector('button[onclick="doPrint()"]');
    if (printCurrent) {
      const label = LG === 'en' ? 'Print this page' : 'Cetak halaman ini';
      printCurrent.title = label; printCurrent.setAttribute('aria-label', label);
    }
    if (printAll) {
      const label = LG === 'en' ? 'Print all 8 pages / Save as PDF' : 'Cetak semua 8 halaman / Simpan PDF';
      printAll.title = label; printAll.setAttribute('aria-label', label);
    }
  }

  function updateUrl() {
    try {
      const current = new URL(location.href);
      current.searchParams.set('lang', LG);
      current.searchParams.set('theme', THEME);
      history.replaceState(history.state, '', current.toString());
    } catch { /* file:// preview / restricted embed */ }
  }

  function setLanguage(locale) {
    LG = locale === 'en' ? 'en' : 'id';
    save(STORE_LANGUAGE, LG);
    updateUrl();
    if (typeof DB !== 'undefined' && DB) window.render();
    else { applyTranslations(); syncControls(); }
  }

  function setVisualTheme(theme) {
    THEME = theme === 'dark' ? 'dark' : 'light';
    save(STORE_THEME, THEME);
    syncTheme(); updateUrl();
    if (typeof DB !== 'undefined' && DB) window.render();
    else { applyTranslations(); syncControls(); }
  }

  window.ptfiSetLanguage = setLanguage;
  window.ptfiSetTheme = setVisualTheme;

  function addAuthControls() {
    const box = document.querySelector('.authBox');
    const title = document.getElementById('authTitle');
    if (!box || !title || document.getElementById('ptfiAuthSettings')) return;
    const ctrl = document.createElement('div');
    ctrl.id = 'ptfiAuthSettings'; ctrl.className = 'ptfi-auth-controls';
    ctrl.innerHTML = `<div class="ptfi-control-group" role="group" aria-label="Language / Bahasa">
      <button type="button" data-locale="id" onclick="ptfiSetLanguage('id')" title="Bahasa Indonesia">ID</button>
      <button type="button" data-locale="en" onclick="ptfiSetLanguage('en')" title="English">EN</button>
      </div><div class="ptfi-control-group" role="group" aria-label="Light / Dark">
      <button type="button" data-theme="light" onclick="ptfiSetTheme('light')" aria-label="Light mode">☀</button>
      <button type="button" data-theme="dark" onclick="ptfiSetTheme('dark')" aria-label="Dark mode">☾</button>
      </div>`;
    box.insertBefore(ctrl, title);
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function') {
    window.render = function donorEnhancedRender(...args) {
      translateData(LG);
      const result = originalRender.apply(this, args);
      save(STORE_LANGUAGE, LG); save(STORE_THEME, THEME);
      syncTheme(); syncControls(); applyTranslations();
      return result;
    };
  }
  const originalOpenP = window.openP;
  if (typeof originalOpenP === 'function') {
    window.openP = function enhancedOpenP(...args) {
      const result = originalOpenP.apply(this, args);
      applyTranslations(document.getElementById('pn'));
      return result;
    };
  }

  // The existing dashboard prints all slides. This adds a current-slide option.
  let printMode = null;
  let printRestored = true;
  let lastTheme;
  let lastView;
  let beforePrintHandler;
  let afterPrintHandler;
  function restorePrint() {
    if (printRestored) return;
    printRestored = true;
    document.body.classList.remove('ptfi-print-preparing');
    document.documentElement.classList.remove('ptfi-print-mode');
    window._printing = false;
    THEME = lastTheme;
    VIEW = lastView;
    printMode = null;
    if (typeof window.render === 'function' && typeof DB !== 'undefined' && DB) window.render();
  }
  async function startPrint(mode) {
    if (printMode) return;
    printMode = mode === 'current' ? 'current' : 'all';
    printRestored = false;
    lastTheme = THEME;
    lastView = VIEW;
    // Use white backgrounds in PDFs, regardless of the viewing theme.
    THEME = 'light';
    VIEW = 'desktop';
    document.body.classList.add('ptfi-print-preparing');
    document.documentElement.classList.add('ptfi-print-mode');
    window._printing = printMode === 'all';
    window.render();
    try {
      if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1600))]);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.print();
    } catch (e) {
      console.error('PTFI print failed:', e);
      restorePrint();
    }
  }
  beforePrintHandler = () => document.documentElement.classList.add('ptfi-print-mode');
  afterPrintHandler = () => restorePrint();
  window.addEventListener('beforeprint', beforePrintHandler);
  window.addEventListener('afterprint', afterPrintHandler);
  window.doPrint = () => startPrint('all');
  window.ptfiPrintCurrent = () => startPrint('current');

  // Update static cover/login and any later content injected by dashboard.js.
  addAuthControls();
  syncTheme(); syncControls(); applyTranslations();
  const observer = new MutationObserver(records => {
    if (records.every(r => r.type === 'characterData')) return;
    clearTimeout(observer._timer);
    observer._timer = setTimeout(() => {
      applyTranslations(); syncControls();
    }, 40);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
