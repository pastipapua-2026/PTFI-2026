/**
 * PASTI-Papua / PTFI donor dashboard: persistent multi-select filters (v1).
 * Additive to dashboard.js and donor-upgrade.js. Does not overwrite source data.
 * Existing 'Period up to' retains one chronological cutoff to preserve YTD logic.
 * All other dimension selectors support multi-selection.
 */
(() => {
  'use strict';
  const VILLAGE_PAGE_INDEX = new Set([2, 3, 4, 5]); // Displayed slide numbers 04, 05, 06, 07.
  const fields = ['kab', 'cat', 'sex', 'week', 'village'];
  const selected = { kab: [], cat: [], sex: [], week: [], village: [] };
  const originalF = window.F;
  const originalBuild = window.build;
  const originalRender = window.render;
  const originalHash = window.updateHash;
  const originalTerritory = window.selectTerritory;
  let initialized = false;
  let keepOpen = '';
  let activeRenderPage = null;
  // Print-all builds eight slides in one render. Apply village scoping per slide,
  // not according to the currently selected navigation page.
  if (typeof PG !== 'undefined' && Array.isArray(PG)) {
    PG.forEach((fn, pageIndex) => {
      PG[pageIndex] = function scopedPageRender(...args) {
        const prior = activeRenderPage;
        activeRenderPage = pageIndex;
        try { return fn.apply(this, args); } finally { activeRenderPage = prior; }
      };
    });
  }
  const tr = (id, en) => LG === 'en' ? en : id;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const singleFields = { kab: 'kab', cat: 'cat', sex: 'sex', week: 'week' };
  const isVillagePage = () => VILLAGE_PAGE_INDEX.has(activeRenderPage ?? PAGE);
  const csvList = value => value ? value.split('|').map(v => v.trim()).filter(Boolean) : [];
  function fromHash() {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const map = { kab: 'mk', cat: 'mc', sex: 'ms', week: 'mw', village: 'mv' };
    fields.forEach(key => {
      selected[key] = h.has(map[key]) ? csvList(h.get(map[key]))
        : (key !== 'village' && S[key] && S[key] !== 'Semua' ? [S[key]] : []);
    });
    initialized = true;
    syncLegacyState();
  }
  function syncLegacyState() {
    ['kab', 'cat', 'sex', 'week'].forEach(k => {
      S[k] = selected[k].length === 1 ? selected[k][0] : 'Semua';
    });
  }
  function persistFilterHash() {
    if (!initialized) return;
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const map = { kab: 'mk', cat: 'mc', sex: 'ms', week: 'mw', village: 'mv' };
    fields.forEach(key => {
      h.delete(map[key]);
      if (selected[key].length) h.set(map[key], selected[key].join('|'));
    });
    history.replaceState(history.state, '', location.pathname + location.search + '#' + h.toString());
  }
  window.updateHash = function extendedFilterHash(...args) {
    const result = originalHash.apply(this, args);
    persistFilterHash();
    return result;
  };
  // The old filter row and chips were inside each 1280px slide.
  // One compact global toolbar now controls every slide.
  window.slicers = () => '';
  window.renderChips = () => '';

  // Future-proof activity records for an optional 'kampung' field in the kegiatan CSV.
  // Matching the ORIGINAL record order avoids assigning a village from a different row.
  window.build = function buildWithVillage(source) {
    const result = originalBuild.apply(this, arguments);
    if (!result || !source || !Array.isArray(source.kegiatan)) return result;
    const matchingRows = source.kegiatan
      .filter(r => NM(r.jumlah_kegiatan) > 0)
      .filter(r => period(r.periode) <= result.pub && period(r.periode).startsWith(result.year));
    result.kg.forEach((record, index) => {
      record.kp = String(matchingRows[index]?.kampung || '').trim();
    });
    return result;
  };

  // F() is used by all slides and metrics, so filtering here keeps the dashboard
  // consistent while retaining its existing period, target and aggregation code.
  window.F = function multiSelectFilteredRows(options = {}) {
    if (!initialized) return originalF.apply(this, arguments);
    const out = originalF.apply(this, arguments);
    const has = (arr, value) => !arr.length || arr.includes(value);
    const pm = out.pm.filter(r =>
      (options.noKab || has(selected.kab, r.k)) &&
      (options.noCat || has(selected.cat, r.c)) &&
      (options.noSex || has(selected.sex, r.s)) &&
      (options.noWeek || !selected.week.length ||
        (r.p === (S.per || DB.pub) && selected.week.includes(String(r.w)))) &&
      (!isVillagePage() || has(selected.village, r.kp))
    );
    // Annual targets are only available by regency/category/sex in the current schema,
    // never assign a regency's target as a village-specific target.
    const tg = out.tg.filter(r =>
      (options.noKab || has(selected.kab, r.k)) &&
      (options.noCat || has(selected.cat, r.c)) &&
      (options.noSex || has(selected.sex, r.s))
    );
    const kg = out.kg.filter(r =>
      (options.noKab || has(selected.kab, r.k)) &&
      (options.noWeek || !selected.week.length ||
        (r.p === (S.per || DB.pub) && selected.week.includes(String(r.w)))) &&
      (!isVillagePage() || has(selected.village, r.kp))
    );
    return { pm, tg, kg };
  };

  const allVillageRows = () => (DB?.pm || []).filter(r => !selected.kab.length || selected.kab.includes(r.k));
  function optionsOf(key) {
    if (!DB) return [];
    if (key === 'kab') return KABS().map(v => [v, v]);
    if (key === 'cat') return CATS.map(v => [v, catN(v)]);
    if (key === 'sex') return [['P', tr('Perempuan', 'Female')], ['L', tr('Laki-laki', 'Male')]];
    if (key === 'week') return getWeekOptionsForMonth(S.per || DB.pub).weeks.map(v => [v.w, LG === 'en' ? v.labelEn : v.labelId]);
    if (key === 'village') {
      return [...new Set(allVillageRows().map(r => r.kp).filter(Boolean))]
        .sort((a,b) => a.localeCompare(b,'id')).map(v => [v,v]);
    }
    return [];
  }
  const captions = () => ({
    kab: tr('Kabupaten', 'Regencies'),
    cat: tr('Kategori', 'Categories'),
    sex: tr('Jenis kelamin', 'Sex'),
    week: tr('Minggu', 'Weeks'),
    village: tr('Kampung', 'Villages')
  });
  function summaryFor(key) {
    const count = selected[key].length;
    if (!count) return tr('Semua', 'All');
    const opts = optionsOf(key);
    const labels = selected[key].map(val => opts.find(([id]) => id === val)?.[1] || val);
    if (count === 1) return labels[0];
    return `${count} ${tr('terpilih', 'selected')}`;
  }
  function buildDropdown(key) {
    const label = captions()[key];
    const options = optionsOf(key);
    const allActive = !selected[key].length;
    return `<div class="ptfi-filter-item">
      <span class="ptfi-filter-title">${label}</span>
      <details class="ptfi-filter-dropdown" data-field="${key}" ${keepOpen === key ? 'open' : ''}>
        <summary aria-label="${label}: ${escapeHTML(summaryFor(key))}"><span class="ptfi-filter-summary">${escapeHTML(summaryFor(key))}</span><span class="ptfi-chevron" aria-hidden="true"></span></summary>
        <div class="ptfi-filter-options" role="group" aria-label="${label}">
          <label class="ptfi-option ptfi-option-all"><input type="checkbox" data-field="${key}" value="*" ${allActive ? 'checked' : ''}><span>${tr('Semua pilihan', 'All options')}</span></label>
          ${options.map(([id, name]) => `<label class="ptfi-option"><input type="checkbox" data-field="${key}" value="${escapeHTML(id)}" ${selected[key].includes(id) ? 'checked' : ''}><span>${escapeHTML(name)}</span></label>`).join('')}
          <div class="ptfi-dropdown-foot"><button type="button" data-close-filter="${key}">${tr('Selesai', 'Done')}</button></div>
        </div>
      </details>
    </div>`;
  }
  function buildPeriod() {
    return `<label class="ptfi-filter-item ptfi-period-item"><span class="ptfi-filter-title">${tr('Periode s.d.', 'Period up to')}</span>
      <select data-filter-period aria-label="${tr('Periode laporan', 'Reporting period')}">
        <option value="" ${!S.per ? 'selected':''}>${mlab(DB.pub,true)}</option>
        ${DB.months.filter(m => m !== DB.pub).slice().reverse().map(m => `<option value="${escapeHTML(m)}" ${S.per === m?'selected':''}>${mlab(m,true)}</option>`).join('')}
      </select></label>`;
  }
  function noteForVillageSelection() {
    if (!selected.village.length || !isVillagePage()) return '';
    const sourceActivityRows = (DB.kg || []).filter(r => r.kp && selected.village.includes(r.kp) && (!selected.kab.length || selected.kab.includes(r.k)));
    const warning = PAGE === 5 && !sourceActivityRows.length
      ? tr('Data kegiatan per kampung belum tersedia pada sumber data. Tidak ada angka kegiatan yang diatribusikan ke kampung pilihan.', 'Village-level activity data are unavailable in the current source. No activity count is attributed to the selected villages.')
      : tr('Capaian peserta mengikuti kampung pilihan. Target tahunan masih tersedia pada tingkat kabupaten, bukan target khusus kampung.', 'Beneficiary reach follows the selected villages. Annual targets remain at regency level, not village-specific targets.');
    return `<div class="ptfi-village-note" role="status"><strong>${tr('Catatan data', 'Data note')}:</strong> ${warning}</div>`;
  }
  function paintGlobalFilters() {
    if (!DB || !initialized || !document.querySelector('.app-shell:not([inert])')) return;
    const viewport = document.querySelector('.main-viewport');
    const stage = document.getElementById('stage');
    if (!viewport || !stage) return;
    let root = document.getElementById('ptfiGlobalFilters');
    if (!root) {
      root = document.createElement('section');
      root.id = 'ptfiGlobalFilters';
      root.className = 'ptfi-global-filters';
      viewport.insertBefore(root, stage);
      root.addEventListener('change', e => {
        const field = e.target?.dataset?.field;
        if (fields.includes(field)) {
          const value = e.target.value;
          const values = selected[field];
          if (value === '*') selected[field] = [];
          else if (e.target.checked && !values.includes(value)) values.push(value);
          else if (!e.target.checked) selected[field] = values.filter(v => v !== value);
          if (field === 'kab') {
            const allowed = new Set(optionsOf('village').map(([v]) => v));
            selected.village = selected.village.filter(v => allowed.has(v));
          }
          syncLegacyState();
          keepOpen = field;
          updateHash(); render();
        } else if (e.target.matches('[data-filter-period]')) {
          S.per = e.target.value;
          const availableWeeks = new Set(optionsOf('week').map(([v]) => v));
          selected.week = selected.week.filter(v => availableWeeks.has(v));
          syncLegacyState();
          keepOpen = '';
          updateHash(); render();
        }
      });
      root.addEventListener('click', e => {
        if (e.target.closest('[data-clear-filters]')) {
          fields.forEach(k => selected[k] = []);
          S.per = ''; syncLegacyState(); keepOpen = '';
          updateHash(); render();
        }
        const close = e.target.closest('[data-close-filter]');
        if (close) { close.closest('details')?.removeAttribute('open'); keepOpen=''; }
      });
      root.addEventListener('toggle', e => {
        if (e.target.matches('details[open]')) {
          root.querySelectorAll('details[open]').forEach(other => { if (other !== e.target) other.open = false; });
        }
      }, true);
    }
    const period = buildPeriod();
    root.innerHTML = `<div class="ptfi-filter-grid">
      ${buildDropdown('kab')}${buildDropdown('cat')}${buildDropdown('sex')}
      ${period}${buildDropdown('week')}
      ${isVillagePage() ? buildDropdown('village') : ''}
      <button type="button" class="ptfi-filter-reset" data-clear-filters>${tr('Reset', 'Reset')}</button>
    </div>${noteForVillageSelection()}`;
    const headHeight = document.querySelector('.bar')?.getBoundingClientRect().height || 49;
    document.documentElement.style.setProperty('--ptfi-header-height', Math.ceil(headHeight)+'px');
  }
  // Activity source currently contains no village field. Never report a zero
  // for an unknown village-level numerator to a donor: explicitly show N/A.
  function markMissingVillageActivityData() {
    if ((!window._printing && PAGE !== 5) || !selected.village.length || !DB) return;
    const hasActivityRows = DB.kg.some(r => r.kp && selected.village.includes(r.kp) && (!selected.kab.length || selected.kab.includes(r.k)));
    if (hasActivityRows) return;
    const node = document.querySelector('.page[data-page="6"] .pc');
    if (!node) return;
    node.className = 'pc ptfi-unavailable-activities';
    node.innerHTML = `<div class="ptfi-no-village-data"><div class="ptfi-na-icon" aria-hidden="true">—</div>
      <h2>${tr('Data kegiatan tingkat kampung belum tersedia', 'Village-level activity data not available')}</h2>
      <p>${tr('Sumber kegiatan saat ini hanya memuat kabupaten. Tambahkan kolom kampung pada CSV/sheet kegiatan untuk mengaktifkan perhitungan dan tabel kegiatan per kampung. Angka nol tidak ditampilkan karena bukan berarti tidak ada kegiatan.', 'The current activity source is only available by regency. Add a kampung column to the kegiatan CSV/worksheet to enable village-level activity totals and tables. Zero is deliberately not shown because missing data do not mean no activities.')}</p>
      <div>${tr('Kampung pilihan', 'Selected villages')}: <strong>${escapeHTML(selected.village.join(' · '))}</strong></div>
    </div>`;
  }
  function printFilterContext() {
    if (!DB || !initialized) return;
    document.querySelectorAll('#stage .page').forEach(slide => {
      const visibleSlideNumber = Number(slide.querySelector('.pn')?.textContent || '0');
      const hasVillageFilter = [4, 5, 6, 7].includes(visibleSlideNumber);
      const labels = [
        [tr('Kabupaten', 'Regencies'), selected.kab],
        [tr('Kategori', 'Categories'), selected.cat.map(catN)],
        [tr('Jenis kelamin', 'Sex'), selected.sex.map(s => s === 'P' ? tr('Perempuan', 'Female') : tr('Laki-laki', 'Male'))],
        [tr('Minggu', 'Weeks'), selected.week],
        ...(hasVillageFilter ? [[tr('Kampung', 'Villages'), selected.village]] : []),
      ];
      const segments = labels.map(([name, values]) => `${name}: ${values.length ? values.join(', ') : tr('Semua', 'All')}`);
      segments.splice(3,0,`${tr('Periode s.d.', 'Period up to')}: ${mlab(S.per || DB.pub,true)}`);
      let context = slide.querySelector('.ptfi-print-filters');
      if (!context) {
        context = document.createElement('div');
        context.className = 'ptfi-print-filters';
        slide.querySelector('.ph')?.insertAdjacentElement('afterend', context);
      }
      context.textContent = segments.join('  ·  ');
    });
  }
  function injectCoverageIcon() {
    const card = document.querySelector('.page[data-page="1"] .kpi-act .l');
    if (!card) return;
    card.innerHTML = `<svg class="ptfi-coverage-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="8" height="7" rx="1.5"/><path d="M6 7.5h2M4 14.5v5.5m4-8v8m4-4v4"/><path d="M16 4.5a3.5 3.5 0 0 1 7 0c0 2.5-3.5 6.5-3.5 6.5S16 7 16 4.5Z" transform="translate(-.5 1)"/><circle cx="19" cy="5.5" r="1" transform="translate(-.5 1)"/>
    </svg><span>${tr('Kegiatan & Cakupan Wilayah', 'Activities & Geographic Coverage')}</span>`;
  }
  window.render = function renderWithPersistentFilters(...args) {
    if (!initialized && DB) fromHash();
    const result = originalRender.apply(this, args);
    if (!initialized && DB) fromHash();
    paintGlobalFilters();
    markMissingVillageActivityData();
    injectCoverageIcon();
    printFilterContext();
    return result;
  };
  window.selectTerritory = function selectWithMultiState(k) {
    if (!initialized && DB) fromHash();
    selected.kab = k === 'Semua' ? [] : [k];
    if (selected.village.length) {
      const valid = new Set(optionsOf('village').map(([v]) => v));
      selected.village = selected.village.filter(v => valid.has(v));
    }
    syncLegacyState();
    return originalTerritory.call(this, k);
  };
  window.addEventListener('resize', () => {
    const el = document.getElementById('ptfiGlobalFilters');
    if (el) document.documentElement.style.setProperty('--ptfi-header-height', Math.ceil(document.querySelector('.bar')?.getBoundingClientRect().height || 49)+'px');
  });
})();
