# PTFI-2026 donor dashboard — update package

**Repository:** https://github.com/pastipapua-2026/PTFI-2026  
**Branch:** `main`  
**Release:** Filter freeze + multi-select + bilingual/theme/print enhancements · 9 October 2026

## Upload to the existing repository

Unzip the package and upload **these files to the same paths** in the repository. Overwrite `index.html`; add four new files in `assets/`.

```text
index.html                       # overwrite old index.html
assets/donor-upgrade.js         # add
assets/donor-upgrade.css        # add
assets/donor-filters.js         # add
assets/donor-filters.css        # add
```

Retain the existing `assets/dashboard.js`, `assets/dashboard.css`, images, `data-templates/`, `scripts/`, `tests/`, and deployment workflow unchanged. There is no need to overwrite those files.

In GitHub, open the repository and use **Add file → Upload files**, place the files in the paths shown above, commit to `main`, then check the GitHub Pages deployment and refresh the site with cache bypass. `index.html` includes the four new assets after the original CSS and JavaScript dependencies.

## Features

- **Persistent sticky filter toolbar**: stays visible while moving between slides. The original filter row inside each slide is replaced by one unified toolbar.
- **Multi-select**: regency, category, sex, week, and village. Use the checkboxes and click **Done / Selesai** to close. `All options / Semua pilihan` removes the restriction.
- **Period up to / Periode s.d.**: intentionally *single-select* because it defines the cumulative year-to-date reporting cutoff. A multi-month selection would change the denominator and reporting semantics.
- **Village selector**: visible only for slides **04, 05, 06, 07**. Selections persist when you visit other slides and return. Village options follow the chosen regencies.
- **Activities & Geographic Coverage**: minimalist SVG icon added to the KPI card on slide 02.
- **Bahasa Indonesia / English**: translates dashboard interface, instructions, activity and documentation copy. The selection is remembered in local storage, along with the selected visual theme.
- **Light / Dark**: available in header and sign-in view; print always uses a light background for readability.
- **Print**: print current slide or all eight slides to PDF. Each printed page includes a summary of active filters.

## Data caveats important for donor reporting

The existing `penerima_manfaat` source includes `kampung`. The current `target` data are **regency-level**; the dashboard must not treat a regency target as the target of an individual village. A notice explains this when village filtering is active.

The current `kegiatan` source does not provide village values in the parser. This patch supports an **optional `kampung` column** in its CSV/Excel sheet. Add it when validated village-level activity records are available:

```csv
periode,kabupaten,kampung,output,jenis_kegiatan,jumlah_kegiatan,minggu
2026-09,Mimika,Tipuka,1.1,Aksi agen perubahan,1,2
```

**Illustrative example only — do not use in a donor report without validation.** If a selected village has no activity data attributed to it, slide 07 explicitly displays **N/A / village-level data unavailable**, not a potentially misleading zero. Category/sex dimensions remain unavailable for the activity sessions data unless the data model is extended to collect those dimensions.

The original repository’s example beneficiary counts, illustrative photos, and location descriptions remain **sample data** and are not automatically verified by this patch. Confirm them against the MTT and approved reporting data before donor publication. The browser-only access code is **not secure server authentication**; do not expose beneficiary-level personal data in a public repository or published CSV links.

## Acceptance checklist

1. Login and switch ID ↔ EN; verify slide 01, 02, 04, 05, 06, 07, 08, 09, including both tabs on Documentation.
2. Set Light / Dark, change slides, reload, and verify preferences persist.
3. Scroll and confirm the global filters remain sticky below the top header.
4. Select two regencies and two categories; verify totals reflect the selected groups and the selections persist when changing slides.
5. Open slide 04/05/06/07 and select two villages. Confirm only selected-village beneficiary data are included and the other four slides do not use the village filter.
6. On slide 07 select a village without validated village-level activity records; verify an informative N/A notice appears.
7. Print current slide and all eight slides using browser Print → Save as PDF. Confirm landscape layout, visible filter context, and no navigation overlays.

## Technical notes

The patch is additive and does not rewrite original repository business logic. It wraps `F()`, `build()`, `render()` and `updateHash()` to extend filtering while retaining original data structure and plotting. Some advanced visualizations in the original app may use internal unfiltered arrays; validate all output totals on each slide before official donor use. No browser production test was conducted against the deployed GitHub Pages site.
