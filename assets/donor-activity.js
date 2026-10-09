/**
 * PTFI-2026 · Donor activity detail table (v2)
 * Loaded AFTER dashboard.js, donor-upgrade.js and donor-filters.js.
 * Does not fabricate participant totals or disaggregations.
 */
(() => {
  'use strict';

  // The source 'kegiatan' sheet previously contained only activity sessions.
  // Keep every absent participant value null (shown as an em dash), never 0.
  const DATA_ALIASES = {
    activityDate: ['tanggal', 'tanggal_kegiatan', 'activity_date', 'date'],
    village: ['kampung', 'desa', 'village'],
    total: ['total_peserta', 'jumlah_peserta', 'total_participants', 'participant_total'],
    boys: ['anak_laki_laki', 'anak_lk', 'boys', 'boys_count', 'male_children'],
    girls: ['anak_perempuan', 'anak_pr', 'girls', 'girls_count', 'female_children'],
    men: ['dewasa_laki_laki', 'dewasa_lk', 'men', 'adult_male', 'adult_males'],
    women: ['dewasa_perempuan', 'dewasa_pr', 'women', 'adult_female', 'adult_females']
  };
  const read = (row, aliases) => {
    for (const key of aliases) {
      if (Object.hasOwn(row, key) && String(row[key] ?? '').trim() !== '') return String(row[key]).trim();
    }
    return '';
  };
  const optionalNumber = (row, aliases) => {
    const raw = read(row, aliases);
    if (!raw) return null;
    const normalized = raw.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
    const value = Number(normalized);
    return Number.isFinite(value) && value >= 0 && Number.isInteger(value) ? value : null;
  };
  const txt = (id, en) => LG === 'en' ? en : id;
  const safe = val => String(val ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const displayNumber = n => n == null ? '—' : n.toLocaleString(LG === 'en' ? 'en-US' : 'id-ID');
  let tablePage = 0;
  let lastSignature = '';
  const PER_PAGE = 10;

  function normalizedDate(value) {
    if (!value) return null;
    // Exact ISO calendar dates only. Do not turn an approximate month into a fake day.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return d;
  }
  function formatDate(value) {
    const date = normalizedDate(value);
    if (!date) return '—';
    return new Intl.DateTimeFormat(LG === 'en' ? 'en-GB' : 'id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(date);
  }

  // Extend the existing build pipeline; it still controls target and beneficiary data.
  const previousBuild = window.build;
  if (typeof previousBuild === 'function') {
    window.build = function withActivityParticipantData(source) {
      const result = previousBuild.apply(this, arguments);
      if (!Array.isArray(result?.kg) || !Array.isArray(source?.kegiatan)) return result;
      const validRows = source.kegiatan
        .filter(r => NM(r.jumlah_kegiatan) > 0)
        .filter(r => period(r.periode) <= result.pub && period(r.periode).startsWith(result.year));
      result.kg.forEach((row, i) => {
        const raw = validRows[i];
        if (!raw) return;
        // Preserve precise source rows; do not join on activity type and lose dates.
        row.activityDate = read(raw, DATA_ALIASES.activityDate);
        row.kp = read(raw, DATA_ALIASES.village);
        row.boys = optionalNumber(raw, DATA_ALIASES.boys);
        row.girls = optionalNumber(raw, DATA_ALIASES.girls);
        row.men = optionalNumber(raw, DATA_ALIASES.men);
        row.women = optionalNumber(raw, DATA_ALIASES.women);
        const rawTotal = optionalNumber(raw, DATA_ALIASES.total);
        // Sum four figures only if ALL disaggregations are supplied.
        const breakdown = [row.boys, row.girls, row.men, row.women];
        row.participants = rawTotal !== null ? rawTotal
          : breakdown.every(n => n !== null) ? breakdown.reduce((a, b) => a + b, 0) : null;
        row.breakdownMismatch = rawTotal !== null && breakdown.every(n => n !== null)
          && rawTotal !== breakdown.reduce((a, b) => a + b, 0);
      });
      return result;
    };
  }

  function activeActivityRows() {
    if (typeof F !== 'function' || !DB) return [];
    // When printing all pages, the global PAGE might not be 5. Restrict
    // village filtering to slide 07 without modifying the user's selection.
    const previous = PAGE;
    try {
      PAGE = 5; // index 5 = slide number 07
      return F().kg;
    } finally {
      PAGE = previous;
    }
  }
  function selectedVillages() {
    return (new URLSearchParams(location.hash.slice(1)).get('mv') || '').split('|').filter(Boolean);
  }
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  function renderActivityTable() {
    const container = document.querySelector('.page[data-page="6"] > .pc');
    if (!container || !DB) return;
    const rows = activeActivityRows();
    const villageSelection = selectedVillages();
    const availableVillageRecords = Array.isArray(DB.kg) && DB.kg.some(row =>
      row.kp && (!villageSelection.length || villageSelection.includes(row.kp)));
    const noVillageAttribution = villageSelection.length && !availableVillageRecords;
    const presentTotal = rows.filter(r => r.participants !== null && r.participants !== undefined);
    const allFour = rows.filter(r => [r.boys,r.girls,r.men,r.women].every(n => n !== null && n !== undefined));
    const missingParticipants = rows.some(r => r.participants == null || [r.boys,r.girls,r.men,r.women].some(n => n == null));
    const mismatch = rows.some(r => r.breakdownMismatch);
    const signature = [location.hash, rows.length, DB.pub, DB.year, DB.kg.length].join('::');
    if (lastSignature !== signature) { tablePage = 0; lastSignature = signature; }
    const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    tablePage = Math.max(0, Math.min(tablePage, pageCount - 1));
    const start = tablePage * PER_PAGE;
    const visible = rows.slice(start, start + PER_PAGE);

    const completeTotal = presentTotal.length === rows.length && rows.length > 0;
    const totalText = completeTotal ? displayNumber(sum(rows.map(r => r.participants))) : '—';
    const totalNote = completeTotal
      ? txt('Total dari seluruh baris yang terfilter', 'Total across all filtered rows')
      : txt('Belum tersedia untuk seluruh kegiatan', 'Not available for all activities');
    const villageAlert = noVillageAttribution
      ? `<p class="ptfi-activity-warning" role="status">${txt('Data kegiatan tingkat kampung tidak tersedia. Lengkapi kolom kampung pada sumber kegiatan; nilai yang tidak tersedia tidak dianggap nol.', 'Village-level activity records are unavailable. Add the village column to the activity source; missing values are not treated as zero.')}</p>`
      : '';
    const dataWarning = missingParticipants && rows.length
      ? `<p class="ptfi-activity-warning">${txt('Catatan: sumber kegiatan belum mencakup seluruh data peserta. Tanda — berarti belum tersedia, bukan nol.', 'Note: the activity source does not include complete participation figures. A dash (—) means unavailable, not zero.')}</p>` : '';
    const mismatchWarning = mismatch
      ? `<p class="ptfi-activity-warning ptfi-activity-error">${txt('Perlu validasi: beberapa nilai total peserta berbeda dari jumlah empat kategori usia/jenis kelamin.', 'Validation required: some participant totals differ from the sum of the four age/sex categories.')}</p>` : '';
    const body = visible.length ? visible.map((r, ix) => {
      const locationLabel = r.kp ? `${r.kp}, ${r.k}` : r.k;
      const activityName = typeof jN === 'function' ? jN(r.j) : r.j;
      return `<tr>
        <td class="ptfi-activity-n"><span>${start + ix + 1}</span></td>
        <td class="ptfi-activity-name" title="${safe(activityName)}">${safe(activityName || '—')}</td>
        <td class="ptfi-activity-date">${formatDate(r.activityDate)}</td>
        <td class="ptfi-activity-location" title="${safe(locationLabel)}">${safe(locationLabel || '—')}</td>
        <td class="ptfi-activity-number ptfi-activity-total">${displayNumber(r.participants)}</td>
        <td class="ptfi-activity-number">${displayNumber(r.boys)}</td>
        <td class="ptfi-activity-number">${displayNumber(r.girls)}</td>
        <td class="ptfi-activity-number">${displayNumber(r.men)}</td>
        <td class="ptfi-activity-number">${displayNumber(r.women)}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="9" class="ptfi-activity-empty">${noVillageAttribution
      ? txt('Tidak ada data kegiatan terverifikasi per kampung untuk pilihan ini.', 'No verified village-level activity data for this selection.')
      : txt('Tidak ada catatan kegiatan untuk filter yang dipilih.', 'No activity records for the selected filters.')}</td></tr>`;

    container.className = 'pc ptfi-activity-layout';
    container.removeAttribute('style');
    container.innerHTML = `
      <div class="ptfi-activity-summary">
        <div><small>${txt('Catatan kegiatan', 'Activity records')}</small><strong>${displayNumber(rows.length)}</strong></div>
        <div><small>${txt('Total peserta tercatat', 'Recorded participants')}</small><strong>${totalText}</strong><span>${totalNote}</span></div>
        <div><small>${txt('Baris dengan segregasi lengkap', 'Rows with complete disaggregation')}</small><strong>${displayNumber(allFour.length)} / ${displayNumber(rows.length)}</strong></div>
      </div>
      <section class="v ptfi-activity-table-card" aria-label="${txt('Tabel rincian kegiatan', 'Activity details table')}">
        <div class="ptfi-activity-head">
          <div><h2>${txt('Rincian Kegiatan', 'Activity Details')}</h2>
            <p>${txt('Tanggal, lokasi, dan peserta terpilah berdasarkan usia serta jenis kelamin', 'Dates, locations, and participants disaggregated by age and sex')}</p></div>
          <div class="ptfi-activity-caption">${txt('Menampilkan', 'Showing')} ${rows.length ? start + 1 : 0}–${Math.min(rows.length, start + PER_PAGE)} ${txt('dari', 'of')} ${displayNumber(rows.length)} ${txt('catatan', 'records')}</div>
        </div>
        ${villageAlert}${dataWarning}${mismatchWarning}
        <div class="ptfi-activity-scroll" tabindex="0" role="region" aria-label="${txt('Tabel kegiatan yang dapat digeser', 'Scrollable activity table')}">
          <table class="ptfi-activity-table">
            <thead><tr>
              <th rowspan="2" scope="col" class="ptfi-activity-n">No.</th>
              <th rowspan="2" scope="col">${txt('Kegiatan', 'Activity')}</th>
              <th rowspan="2" scope="col">${txt('Tanggal', 'Date')}</th>
              <th rowspan="2" scope="col">${txt('Lokasi', 'Location')}</th>
              <th rowspan="2" scope="col">${txt('Total Peserta', 'Total Participants')}</th>
              <th colspan="2" scope="colgroup" class="ptfi-activity-group">${txt('Anak (<18 tahun)', 'Children (under 18)')}</th>
              <th colspan="2" scope="colgroup" class="ptfi-activity-group">${txt('Dewasa (18+ tahun)', 'Adults (18+)')}</th>
            </tr><tr>
              <th scope="col">${txt('Laki-laki', 'Boys')}</th><th scope="col">${txt('Perempuan', 'Girls')}</th>
              <th scope="col">${txt('Laki-laki', 'Men')}</th><th scope="col">${txt('Perempuan', 'Women')}</th>
            </tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <div class="ptfi-activity-pagination">
          <span>${txt('Sumber: lembar kegiatan. Data peserta tanpa rincian tidak diestimasi.', 'Source: activity sheet. Missing participant details are not estimated.')}</span>
          <div class="ptfi-activity-page-actions">
            <button type="button" data-ptfi-activity-page="prev" ${tablePage === 0 ? 'disabled' : ''}>‹ ${txt('Sebelumnya', 'Previous')}</button>
            <span>${tablePage + 1} / ${pageCount}</span>
            <button type="button" data-ptfi-activity-page="next" ${tablePage >= pageCount - 1 ? 'disabled' : ''}>${txt('Berikutnya', 'Next')} ›</button>
          </div>
        </div>
      </section>`;
  }

  // Keep checkbox menus inside the available viewport, including narrow
  // screens and menus opened near the bottom edge of a sticky filter bar.
  document.addEventListener('toggle', event => {
    const details = event.target;
    if (!details.matches?.('#ptfiGlobalFilters .ptfi-filter-dropdown') || !details.open) return;
    requestAnimationFrame(() => {
      if (!details.isConnected || !details.open) return;
      const panel = details.querySelector('.ptfi-filter-options');
      if (!panel) return;
      panel.style.transform = '';
      const anchor = details.getBoundingClientRect();
      const bottom = (window.visualViewport?.height || window.innerHeight) - anchor.bottom - 12;
      const top = anchor.top - 12;
      const placeAbove = bottom < 175 && top > bottom;
      details.classList.toggle('ptfi-dropdown-up', placeAbove);
      panel.style.maxHeight = Math.max(90, Math.min(268, (placeAbove ? top : bottom) - 12)) + 'px';
      const box = panel.getBoundingClientRect();
      const rightOverflow = Math.max(0, box.right - (window.innerWidth - 12));
      const leftOverflow = Math.max(0, 12 - box.left);
      if (rightOverflow) panel.style.transform = `translateX(-${Math.ceil(rightOverflow)}px)`;
      else if (leftOverflow) panel.style.transform = `translateX(${Math.ceil(leftOverflow)}px)`;
    });
  }, true);

  // Render afterwards so all legacy charts, filters and print hooks remain intact.
  const priorRender = window.render;
  if (typeof priorRender === 'function') {
    window.render = function withWideActivityTable(...args) {
      const result = priorRender.apply(this, args);
      renderActivityTable();
      return result;
    };
  }
  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-ptfi-activity-page]');
    if (!btn || btn.disabled) return;
    const action = btn.dataset.ptfiActivityPage;
    tablePage += action === 'next' ? 1 : -1;
    window.render();
  });
})();
