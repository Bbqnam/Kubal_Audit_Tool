import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MetricCard, Panel, StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import { getPlanningCalendarPath } from '../../../data/navigation'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import PlanningActivityFeed from '../components/PlanningActivityFeed'
import PlanningPageHeader from '../components/PlanningPageHeader'
import { formatDate } from '../../../utils/dateUtils'
import { getDerivedPlanStatus, getStandardColorClass, summarizePlans, planningMonthLabels } from '../services/planningUtils'

type AggregateRow = {
  label: string
  total: number
  completed: number
  open: number
  overdue: number
}

function buildAggregateRows<T extends string>(
  items: ReturnType<typeof useAuditLibrary>['planningRecords'],
  keySelector: (item: ReturnType<typeof useAuditLibrary>['planningRecords'][number]) => T,
) {
  const groups = new Map<string, AggregateRow>()

  items.forEach((item) => {
    const label = keySelector(item)
    const status = getDerivedPlanStatus(item)
    const existing = groups.get(label) ?? { label, total: 0, completed: 0, open: 0, overdue: 0 }
    existing.total += 1
    existing.completed += status === 'Completed' ? 1 : 0
    existing.overdue += status === 'Overdue' ? 1 : 0
    existing.open += status === 'Completed' ? 0 : 1
    groups.set(label, existing)
  })

  return [...groups.values()].sort((left, right) => right.total - left.total || left.label.localeCompare(right.label))
}

function CompletionBar({ completed, open, overdue, total }: { completed: number; open: number; overdue: number; total: number }) {
  const openNonOverdue = Math.max(0, open - overdue)

  return (
    <div className="report-completion-bar" aria-label="Completion">
      <div style={{ width: `${total ? (completed / total) * 100 : 0}%`, background: '#22c55e', height: '100%', borderRadius: 'inherit' }} />
      <div style={{ width: `${total ? (openNonOverdue / total) * 100 : 0}%`, background: '#60a5fa', height: '100%' }} />
      <div style={{ width: `${total ? (overdue / total) * 100 : 0}%`, background: '#ef4444', height: '100%' }} />
    </div>
  )
}

function parseSearchMonth(value: string | null): number | 'all' {
  if (value === null || value === 'all') {
    return 'all'
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return 'all'
  }

  return Math.min(12, Math.max(1, Math.trunc(parsedValue)))
}

export default function PlanningReportsPage() {
  const { planningRecords, planningActivityLog } = useAuditLibrary()
  const currentDate = new Date()
  const today = currentDate.toISOString().slice(0, 10)
  const horizonDate = new Date(currentDate)
  horizonDate.setDate(horizonDate.getDate() + 45)
  const next45DayIso = horizonDate.toISOString().slice(0, 10)

  const currentYear = currentDate.getFullYear()
  const [searchParams, setSearchParams] = useSearchParams()
  const availableYears = useMemo(
    () => [...new Set(planningRecords.map((r) => r.year))].sort((left, right) => left - right),
    [planningRecords],
  )
  const fallbackYear = availableYears.includes(currentYear) ? currentYear : availableYears[availableYears.length - 1] ?? currentYear
  const requestedYear = Number(searchParams.get('year'))
  const selectedYear = availableYears.includes(requestedYear) ? requestedYear : fallbackYear
  const selectedMonth = parseSearchMonth(searchParams.get('month'))

  const filteredByYear = planningRecords.filter((record) => record.year === selectedYear)
  const filteredRecords = selectedMonth === 'all'
    ? filteredByYear
    : filteredByYear.filter((record) => record.month === selectedMonth)

  const summary = summarizePlans(filteredRecords)
  const delayedRecords = filteredRecords
    .filter((record) => getDerivedPlanStatus(record) === 'Overdue')
    .sort((left, right) => left.plannedEnd.localeCompare(right.plannedEnd))
  const nextUpRecords = filteredRecords
    .filter((record) => {
      const status = getDerivedPlanStatus(record)
      return status !== 'Completed' && status !== 'Cancelled' && record.plannedStart >= today && record.plannedStart <= next45DayIso
    })
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))
  const byStandard = buildAggregateRows(filteredRecords, (record) => record.standard).slice(0, 8)
  const byDepartment = buildAggregateRows(
    filteredRecords,
    (record) => `${record.department || 'Unassigned'} / ${record.processArea || 'General'}`,
  ).slice(0, 6)
  const completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0
  const filteredRecordIds = new Set(filteredRecords.map((record) => record.id))
  const visibleActivityEntries = planningActivityLog
    .filter((entry) => {
      if (selectedMonth === 'all') {
        return entry.year === selectedYear
      }

      return filteredRecordIds.has(entry.recordId ?? '')
    })
    .slice(0, 8)

  const monthLoadRows = planningMonthLabels.map((label, index) => {
    const month = index + 1
    const monthRecords = filteredByYear.filter((record) => record.month === month)
    const monthSummary = summarizePlans(monthRecords)

    return {
      label,
      month,
      total: monthSummary.total,
      completed: monthSummary.completed,
      overdue: monthSummary.overdue,
      focusCount: monthRecords.filter((record) => {
        const status = getDerivedPlanStatus(record)
        return status !== 'Completed' && status !== 'Cancelled'
      }).length,
    }
  })
  const maxMonthLoad = Math.max(...monthLoadRows.map((row) => row.total), 1)

  function updateFilters(nextYear: number, nextMonth: number | 'all') {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('year', String(nextYear))
    nextParams.set('month', String(nextMonth))
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="module-page planning-page">
      <PlanningPageHeader
        title="Reports"
        subtitle="A cleaner planning report focused on workload, risk, ownership, and the major decisions taken."
      />

      <div className="calendar-pill-nav report-slicer-row">
        <div className="calendar-pill-row report-slicer-group">
          <span className="calendar-pill-label">Year</span>
          <div className="calendar-pill-group">
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`calendar-pill ${year === selectedYear ? 'calendar-pill-active' : ''}`}
                onClick={() => updateFilters(year, selectedMonth)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-pill-row report-slicer-group">
          <span className="calendar-pill-label">Month</span>
          <div className="calendar-pill-group calendar-pill-group-months">
            <button
              type="button"
              className={`calendar-pill ${selectedMonth === 'all' ? 'calendar-pill-active' : ''}`}
              onClick={() => updateFilters(selectedYear, 'all')}
            >
              All
            </button>
            {planningMonthLabels.map((label, idx) => (
              <button
                key={label}
                type="button"
                className={`calendar-pill ${selectedMonth === idx + 1 ? 'calendar-pill-active' : ''}`}
                onClick={() => updateFilters(selectedYear, idx + 1)}
              >
                {label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="metrics-grid planning-metrics-grid">
        <MetricCard label="Planned in scope" value={summary.total} />
        <MetricCard label="Completion rate" value={`${completionRate}%`} tone={completionRate === 100 && summary.total ? 'success' : 'default'} />
        <MetricCard label="Delayed" value={summary.overdue} tone={summary.overdue ? 'danger' : 'success'} />
        <MetricCard label="Next 45 days" value={nextUpRecords.length} tone={nextUpRecords.length ? 'warning' : 'default'} />
      </div>

      <Panel
        title="Delivery pulse"
        description="See how the year is loaded and what needs action first."
        actions={(
          <Link
            to={getPlanningCalendarPath({ year: selectedYear, month: selectedMonth === 'all' ? currentDate.getMonth() + 1 : selectedMonth })}
            className="button button-secondary button-small"
          >
            <ButtonLabel icon="calendar" label="Open calendar" />
          </Link>
        )}
      >
        <div className="report-pulse-layout">
          <div className="report-month-load">
            {monthLoadRows.map((row) => (
              <div key={row.month} className={`report-month-load-row ${selectedMonth === row.month ? 'report-month-load-row-active' : ''}`}>
                <div className="report-month-load-meta">
                  <strong>{row.label}</strong>
                  <span>{row.total ? `${row.total} planned · ${row.completed} done` : 'No audits planned'}</span>
                </div>
                <div className="report-month-load-bar">
                  <div
                    className="report-month-load-fill"
                    style={{ width: `${row.total ? (row.total / maxMonthLoad) * 100 : 0}%` }}
                  />
                </div>
                <div className="report-month-load-values">
                  <span>{row.focusCount} open</span>
                  {row.overdue ? <span className="report-month-load-alert">{row.overdue} delayed</span> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="report-attention-grid">
            <section className="report-attention-card">
              <div className="report-distribution-section-head">
                <h3>Delayed items</h3>
                <span>{delayedRecords.length}</span>
              </div>
              <ul className="report-summary-list report-summary-list-compact planning-list">
                {delayedRecords.length ? delayedRecords.slice(0, 5).map((record) => (
                  <li key={record.id}>
                    <div>
                      <strong>{record.title}</strong>
                      <p>{record.department || record.processArea || 'Unassigned'} · due {formatDate(record.plannedEnd)}</p>
                    </div>
                    <StatusBadge value="Overdue" />
                  </li>
                )) : (
                  <li>
                    <div>
                      <strong>No delayed items</strong>
                      <p>The selected reporting scope is currently on track.</p>
                    </div>
                    <StatusBadge value="Completed" />
                  </li>
                )}
              </ul>
            </section>

            <section className="report-attention-card">
              <div className="report-distribution-section-head">
                <h3>Coming up next</h3>
                <span>{nextUpRecords.length}</span>
              </div>
              <ul className="report-summary-list report-summary-list-compact planning-list">
                {nextUpRecords.length ? nextUpRecords.slice(0, 5).map((record) => (
                  <li key={record.id}>
                    <div>
                      <strong>{record.title}</strong>
                      <p>{record.owner || 'Owner TBD'} · starts {formatDate(record.plannedStart)}</p>
                    </div>
                    <StatusBadge value={getDerivedPlanStatus(record)} />
                  </li>
                )) : (
                  <li>
                    <div>
                      <strong>No near-term load</strong>
                      <p>No open audits are due to start within the next 45 days in this scope.</p>
                    </div>
                    <StatusBadge value="Planned" />
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </Panel>

      <Panel
        title="Coverage and ownership"
        description="Keep the report to the programme split and the teams carrying the load."
      >
        <div className="report-distribution-layout">
          <section className="report-distribution-section">
            <div className="report-distribution-section-head">
              <h3>By audit standard</h3>
              <span>{byStandard.length} visible</span>
            </div>
            <div className="report-standard-grid report-standard-grid-single">
              {byStandard.map((row) => (
                <div key={row.label} className="report-standard-row report-standard-row-compact">
                  <div className="report-standard-header">
                    <span className={`planning-distribution-standard ${getStandardColorClass(row.label)}`}>{row.label}</span>
                    <div className="report-standard-chips">
                      <span className="planning-distribution-chip planning-distribution-chip-success">{row.completed} done</span>
                      <span className="planning-distribution-chip planning-distribution-chip-open">{Math.max(0, row.open - row.overdue)} open</span>
                      {row.overdue > 0 ? <span className="planning-distribution-chip planning-distribution-chip-danger">{row.overdue} delayed</span> : null}
                    </div>
                  </div>
                  <CompletionBar {...row} />
                </div>
              ))}
            </div>
          </section>

          <section className="report-distribution-section report-distribution-section-side">
            <div className="report-distribution-section-head">
              <h3>Top departments / areas</h3>
              <span>{byDepartment.length} visible</span>
            </div>
            <div className="report-department-list">
              {byDepartment.map((row) => (
                <div key={row.label} className="planning-distribution-row report-department-row">
                  <div className="planning-distribution-heading">
                    <div className="planning-distribution-title">
                      <strong>{row.label}</strong>
                      <span>{row.total} audits in selected scope</span>
                    </div>
                    <div className="planning-distribution-metrics">
                      <span className="planning-distribution-chip planning-distribution-chip-success">{row.completed} done</span>
                      <span className="planning-distribution-chip">{Math.max(0, row.open - row.overdue)} open</span>
                      {row.overdue > 0 ? <span className="planning-distribution-chip planning-distribution-chip-danger">{row.overdue} delayed</span> : null}
                    </div>
                  </div>
                  <CompletionBar {...row} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </Panel>

      <Panel
        title="Recent planning activity"
        description="Major planning changes only: completion, deletion, rescheduling, linking, yearly checklist updates, and year-horizon changes."
      >
        <PlanningActivityFeed entries={visibleActivityEntries} />
      </Panel>
    </div>
  )
}
