# Kubal Audit Platform

Kubal Audit Platform is a browser-based audit workspace for planning, running, and tracking audits across multiple standards and workflows.

It combines:
- Portfolio planning and calendar scheduling
- Specialized execution flows (`VDA 6.3`, `VDA 6.5`)
- Generic audit workflows (system/process/product/supplier/etc.)
- Corrective action management
- Local import/export for backup, sharing, and migration

The app is built with React + TypeScript + Vite and stores workspace state in browser local storage.

---

## What this project does

The platform supports end-to-end audit operations:

- **Dashboard**
  - Shows program-level KPIs (planned/upcoming/in-progress/completed/delayed)
  - Surfaces overdue actions and upcoming audits
  - Links directly to planning and audit details

- **Planning**
  - Calendar-based and 3-year planning views
  - Planning statuses (`Planned`, `In progress`, `Completed`, `Overdue`, `Cancelled`)
  - Completion tracking, history, and activity log
  - Create execution audit records from planning items

- **Audit Library**
  - Central list of all audits
  - Create, duplicate, update status, delete
  - Track audit-level history and summary previews

- **Audit Execution Workflows**
  - **VDA 6.3**: chapter-scoped scoring, summary matrix, report
  - **VDA 6.5**: checklist review, findings/results, product info, report
  - **Generic audits**: flexible audit info/report/action plan workflow

- **Action Plan**
  - Structured corrective/preventive actions
  - Owners, due dates, statuses, closure evidence
  - Delayed action detection and follow-up tracking

- **Import / Export**
  - Excel and JSON import support
  - Excel/PDF export support for audits and planning
  - Hidden transfer sheet in exports enables round-trip re-import

---

## Tech stack

- `React 19`
- `TypeScript`
- `Vite`
- `react-router-dom`
- `xlsx` (Excel import/export)
- `ESLint`

---

## Getting started

### Prerequisites

- Node.js 20+ recommended
- npm 10+

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview production build

```bash
npm run preview
```

---

## How to use the app

### 1) Start from Dashboard

- Review current planning status mix
- Inspect delayed actions
- Jump to planning calendar or audit library

### 2) Manage planning

- Go to **Planning** pages (`Calendar`, `Three-year`, `Reports`, `Checklist`)
- Create or edit planning records
- Mark records complete and capture completion result
- Optionally create linked execution audits

### 3) Execute audits

- Open an audit record from **Audit Library**
- Use workflow pages based on audit type:
  - `VDA 6.3`: chapter assessments + summary
  - `VDA 6.5`: product info + checklist + findings
  - Generic: audit info + report + action plan

### 4) Track actions

- Add/update action plan items in audit pages
- Use due dates and status to monitor delayed work
- Review delayed items on dashboard and library filters

### 5) Export and import

- Export individual audits, audit library slices, or planning sets
- Re-import files into the proper module:
  - audit files -> **Audit Library**
  - planning files -> **Planning**

---

## Data storage and consistency

- Workspace data is persisted in browser local storage.
- Repository and normalization services enforce data shape consistency when loading/saving/importing.
- Imported records are normalized before merge.
- Merge behavior:
  - **imported** = new records
  - **updated** = existing records replaced by imported values
  - **skipped** = imported record identical to current data

### Important

- Data is local to the browser profile and machine.
- Use export regularly for backups.
- Clearing browser storage removes local workspace data unless backed up.

---

## Import / export format notes

- Import supports `.json`, `.xlsx`, `.xlsm`.
- Excel exports include a hidden `Import Data` sheet containing serialized transfer payload.
- Schema version is validated during import.
- Corrupt or incompatible payloads return explicit error messages.
- Planning and audit imports are type-checked and routed to the correct module.

---

## Project structure (high-level)

- `src/pages/` - top-level pages (`Dashboard`, `Audits`, admin)
- `src/features/planning/` - planning pages, components, services
- `src/features/vda63/` - VDA 6.3 workflow
- `src/features/vda65/` - VDA 6.5 workflow
- `src/features/generic/` - generic audit workflow
- `src/features/shared/context/` - workspace state provider/hooks
- `src/features/shared/services/` - core audit/planning/import/export logic
- `src/utils/export/` - Excel/PDF export utilities
- `src/types/` - shared TypeScript models

---

## Key routes

- `/` - Dashboard
- `/audits` - Audit Library
- `/planning/calendar` - Planning calendar
- `/planning/three-year` - Three-year planning
- `/planning/reports` - Planning reports
- `/planning/checklist` - Planning checklist

Audit-specific routes are generated by audit type and record id, for example:
- `/audits/:auditId/vda63/...`
- `/audits/:auditId/vda65/...`
- `/audits/:auditId/:auditType/...` (generic)

---

## Branding / metadata

- Logo: `public/logo.png`
- App title: `Kubal Audit Platform`

---

## Troubleshooting

- **Import failed**
  - Confirm file type and module destination (audit vs planning)
  - Re-export from the app if source file was manually edited
  - Check for schema/version mismatch in error message

- **Data missing after refresh**
  - Verify local storage was not cleared
  - Restore from exported backup

- **Build errors**
  - Run `npm run lint` and `npm run build`
  - Resolve TypeScript diagnostics before release builds

---

## Contributing

Recommended workflow:
- Keep logic changes in shared services/context where possible
- Preserve data normalization and import/export compatibility
- Avoid mutating state directly; use predictable immutable updates
- Validate with lint/build before opening PRs

---

## License

No license file is currently defined in this repository.
