/**
 * PASTI-Papua / PTFI dashboard — presentation refinement V3.
 * Works AFTER dashboard.js, donor-upgrade.js, donor-filters.js and donor-activity.js.
 * No changes to beneficiary, target, or activity records and computations.
 */
(() => {
  'use strict';
  const t = (id, en) => (typeof LG !== 'undefined' && LG === 'en') ? en : id;

  function refineOverview(page) {
    const grid = page.querySelector(':scope > .pc.g2');
    if (!grid) return;
    // The user requested removal of two presentation panels, NOT the KPI metrics.
    grid.querySelector(':scope > .gauge')?.remove();
    grid.querySelector(':scope > .insg')?.remove();
    grid.classList.add('ptfi-overview-clean');
    grid.querySelector(':scope > .trend')?.classList.add('ptfi-overview-trend-wide');
    grid.querySelector(':scope > .kabs')?.classList.add('ptfi-overview-regencies');
  }

  function refineTargetGroups(page) {
    const grid = page.querySelector(':scope > .pc');
    if (!grid) return;
    // The last card in the existing slide is the optional priority-interventions
    // narrative panel. Match the heading as well as location to avoid deleting data.
    const cards = [...grid.children].filter(element => element.classList.contains('v'));
    const priority = cards.find(card => /Sasaran Kunci Intervensi Stunting|Priority Groups for Stunting Prevention/i.test(card.querySelector('h3')?.textContent || ''));
    if (priority) priority.remove();
    if (priority || cards.length === 3) grid.classList.add('ptfi-target-groups-clean');
  }

  function refineMonthlyTable(page) {
    const grid = page.querySelector(':scope > .pc.g8');
    if (!grid) return;
    const cards = [...grid.children].filter(el => el.classList.contains('v'));
    // Original slide has a chart card followed by a monthly data table.
    // Retain the ORIGINAL aggregate table and its filter-driven calculations.
    if (cards.length === 2 && cards[1].querySelector('table')) cards[0].remove();
    const tableCard = [...grid.children].find(el => el.classList.contains('v') && el.querySelector('table'));
    if (!tableCard) return;
    grid.classList.add('ptfi-monthly-full-table');
    tableCard.classList.add('ptfi-monthly-wide-card');
    const title = tableCard.querySelector('h3');
    if (title) title.textContent = t('Penerima manfaat baru per bulan', 'New beneficiaries by month');
    const caption = tableCard.querySelector(':scope > div:first-child > span');
    if (caption) caption.textContent = t('Data bulanan · baru & kumulatif', 'Monthly data · new & cumulative');
    const table = tableCard.querySelector('table');
    if (table) {
      table.classList.add('ptfi-monthly-expanded-table');
      // Improves screen-reader table context; not a new dataset.
      table.setAttribute('aria-label', t('Penerima manfaat baru dan kumulatif per bulan berdasarkan kelompok', 'Monthly new and cumulative beneficiaries by category'));
    }
  }

  function refineVisibleSlides() {
    document.querySelectorAll('#stage > .pw > .page').forEach(page => {
      const n = Number(page.dataset.page);
      if (n === 1) refineOverview(page);        // Slide 02: Ringkasan
      if (n === 4) refineTargetGroups(page);    // Slide 05: Kelompok sasaran
      if (n === 7) refineMonthlyTable(page);    // Slide 08: Tren bulanan
    });
  }

  const previousRender = window.render;
  if (typeof previousRender === 'function') {
    window.render = function ptfiV3RefinedRender(...args) {
      const result = previousRender.apply(this, args);
      refineVisibleSlides();
      return result;
    };
  }
})();
