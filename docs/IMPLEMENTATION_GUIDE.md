# Kubal Audit Tool — UX Refactor Implementation Guide

## Files Delivered

```
src/
  components/
    Topbar.tsx                         ← Compact, no page header block
    Sidebar.tsx                        ← Slightly larger icons (1.35rem)
  pages/
    Dashboard.tsx                      ← Portfolio with slicers + improved hover
  features/planning/pages/
    YearCalendarPage.tsx               ← Year/month pill selectors
    ThreeYearPlanPage.tsx              ← Visual calendar-style 3-year view
    PlanningReportsPage.tsx            ← Visual summaries, month/year slicers
    PlanningChecklistPage.tsx          ← Card-based rows, less table-heavy
  App-additions.css                    ← All new CSS to APPEND to App.css
```

---

## Change Summary

### 1. Top page header block removed
**File:** `src/components/Topbar.tsx`

- Removed the eyebrow badge ("KUBAL AUDIT PLATFORM"), large page title `<h2>`, and breadcrumb list
- Topbar now only renders when there's an active audit (save indicator) or a back button is needed
- Returns `null` on the dashboard root — no wasted space
- The `topbar-compact` CSS class keeps it slim (0.5rem padding vs 0.95rem before)

### 2. Year Calendar redesigned — pill selectors
**File:** `src/features/planning/pages/YearCalendarPage.tsx`

- Removed the "Calendar filters" Panel with year/month dropdowns
- Replaced with a `.calendar-pill-nav` component: two rows of clickable pill buttons
  - Row 1: Year pills (one per planning year)
  - Row 2: Month pills (Jan–Dec, 12 buttons)
  - Active pill = gold gradient, has-data pill = subtle dot indicator
- Month pills show a dot when that month has records in the selected year
- Calendar grid directly syncs to selected year + month
- Added a meta line showing "Month Year · N audits in view"

### 3. Three-Year Plan — visual zoomed-out calendar
**File:** `src/features/planning/pages/ThreeYearPlanPage.tsx`

- Completely rebuilt as a visual roadmap instead of a text-heavy matrix
- Each year = one card with:
  - Header: year label + status pills (done / active / overdue counts)
  - 12-month mini-calendar grid: each month cell shows audit event chips with color coding and status dots
  - Standard coverage rows: name + progress bar + done/total count
- Month cells are color-coded: green if all done, red if overdue, blue if active, grey if empty
- Audit type chips in each cell are color-matched to the planning standard palette
- Visually relates to the year calendar — same color language, just compressed

### 4. Reports page redesigned
**File:** `src/features/planning/pages/PlanningReportsPage.tsx`

- Added year + month slicer row at the top (same pill style as calendar)
- KPIs now respond to slicer selection
- "By audit standard" section: replaced distribution rows with cleaner `report-standard-row` cards with visual completion bars
- Added horizon cards (30/60/90 days) as big-number cards instead of a summary grid
- Overdue list capped at 6 items, simpler row layout
- Department table kept but slimmed (3 columns instead of 5)
- All charts respond to selected year/month

### 5. Yearly Checklist optimized — card rows
**File:** `src/features/planning/pages/PlanningChecklistPage.tsx`

- Removed the full-width table entirely
- Items grouped by their `group` field into separate Panels
- Each item = a `.checklist-card` with:
  - Left: title + detail text
  - Right: year cells side by side (one per planning year), each showing status chip, date, and action button
- Status chips use `✓ Updated` / `○ Pending` with green/grey coloring
- Less spreadsheet feel, more card dashboard feel
- Actions are clearly visible inline

### 6. Portfolio hover improved + month/year slicers
**File:** `src/pages/Dashboard.tsx`

- Added `portfolioYear` and `portfolioMonth` state variables
- Portfolio chart widget now has a slicer row: year pills + month pills (All + Jan–Dec)
- All bar charts and donut respond to slicer selection (filter planningRecords by year + month)
- Hover cards on each standard bar now group audit types **by status**: shows Completed/In progress/Planned/Overdue sections with audit type name + title per record
- Previously hovered audits just showed raw audit type info — now it answers "which audit types are in this category/status?"

### 7. Sidebar icons slightly larger
**File:** `src/components/Sidebar.tsx` + `App-additions.css`

- SVG strokeWidth bumped from 1.6 to 1.7 on all three nav icons
- CSS override: `.sidebar-link-icon` width/height increased to 1.35rem (from 1.1rem)

### 8. General cleanup (CSS)
**File:** `App-additions.css`

- No redundant space in compact topbar
- Calendar pill nav: clean hierarchy without heavy controls
- All new components use the existing CSS variable palette (`--accent`, `--muted`, `--text`, `--shadow`)
- Colorful internal-tool style preserved throughout

---

## How to integrate

1. **Replace files** as listed above (drop-in replacements)
2. **Append `App-additions.css`** to the end of `src/App.css`
3. No changes needed to routing, context, data, or types — all logic is preserved
4. The `planningMonthLabels` export from `planningUtils.ts` is used in the new pages — confirm it's already exported (it is, from the existing code)

---

## Assumptions made

- `groupPlansByMonth` returns all 12 months even if empty (confirmed from source)
- `getPlanColorClass` returns the correct planning-standard CSS class for color-coding event chips
- The existing `planningMonthLabels` array starts at index 0 = January
- No backend or API changes required — everything is local state / localStorage

---

## What was NOT changed

- App routing (`App.tsx`) — unchanged
- Data layer, context, types — unchanged
- VDA 6.3 / VDA 6.5 audit pages — unchanged
- Audit Library page — unchanged
- `PlanningOverviewPage` (Planner) — unchanged
- Export utilities — unchanged
