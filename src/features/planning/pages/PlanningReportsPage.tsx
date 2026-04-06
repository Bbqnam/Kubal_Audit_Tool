import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { getPlanningCalendarPath } from '../../../data/navigation'
import { formatDate } from '../../../utils/dateUtils'
import { getDerivedPlanStatus, getOverduePlanningRecords, getStandardColorClass, getUpcomingPlanningRecords, summarizePlans, planningMonthLabels } from '../services/planningUtils'

type AggregateRow = {
  label: string
  total: number
  completed: number
  open: number
  overdue: number
}

function buildAggregateRows<T extends string>(items: ReturnType<typeof useAuditLibrary>['planningRecords'], keySelector: (item: ReturnType<typeof useAuditLibrary>['planningRecords'][number]) => T) {
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

export default function PlanningReportsPage() {
  const { planningRecords } = useAuditLibrary()
  const currentYear = new Date().getFullYear()
  const [searchParams, setSearchParams] = useSearchParams()
  const availableYears = [...new Set(planningRecords.map((r) => r.year))].sort((left, right) => left - right)
  const fallbackYear = availableYears.includes(currentYear) ? currentYear : availableYears[availableYears.length - 1] ?? currentYear
  const initialYear = availableYears.includes(Number(searchParams.get('year'))) ? Number(searchParams.get('year')) : fallbackYear
  const initialMonthParam = searchParams.get('month')
  const initialMonth = initialMonthParam === 'all' || initialMonthParam === null
    ? 'all'
    : Math.min(12, Math.max(1, Number(initialMonthParam)))
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(initialMonth)
  const searchParamString = searchParams.toString()

  const filteredByYear = planningRecords.filter((r) => r.year === selectedYear)
  const filteredRecords = selectedMonth === 'all'
    ? filteredByYear
    : filteredByYear.filter((r) => r.month === selectedMonth)

  const currentYearSummary = summarizePlans(filteredRecords)
  const upcoming30 = getUpcomingPlanningRecords(planningRecords, 30)
  const upcoming60 = getUpcomingPlanningRecords(planningRecords, 60)
  const upcoming90 = getUpcomingPlanningRecords(planningRecords, 90)
  const overduePlans = getOverduePlanningRecords(planningRecords)
  const byStandard = buildAggregateRows(filteredRecords, (record) => record.standard)
  const byClassification = buildAggregateRows(filteredRecords, (record) => record.internalExternal)
  const byDepartment = buildAggregateRows(filteredRecords, (record) => `${record.department} / ${record.processArea}`)

  const completionRate = currentYearSummary.total > 0
    ? Math.round((currentYearSummary.completed / currentYearSummary.total) * 100)
    : 0

  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  useEffect(() => {
    setSelectedYear((current) => (current === initialYear ? current : initialYear))
  }, [initialYear])

  useEffect(() => {
    setSelectedMonth((current) => (current === initialMonth ? current : initialMonth))
  }, [initialMonth])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('year', String(selectedYear))
    nextParams.set('month', String(selectedMonth))

    if (nextParams.toString() !== searchParamString) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParamString, searchParams, selectedMonth, selectedYear, setSearchParams])

  return (
    <div className="module-page planning-page">
      <PageHeader
        eyebrow="Audit planning"
      />

      {/* Slicer row */}
      <div className="calendar-pill-nav report-slicer-row">
        <div className="calendar-pill-row report-slicer-group">
          <span className="calendar-pill-label">Year</span>
          <div className="calendar-pill-group">
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`calendar-pill ${year === selectedYear ? 'calendar-pill-active' : ''}`}
                onClick={() => {
                  setSelectedYear(year)
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.set('year', String(year))
                  nextParams.set('month', String(selectedMonth))
                  setSearchParams(nextParams, { replace: true })
                }}
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
              onClick={() => {
                setSelectedMonth('all')
                const nextParams = new URLSearchParams(searchParams)
                nextParams.set('year', String(selectedYear))
                nextParams.set('month', 'all')
                setSearchParams(nextParams, { replace: true })
              }}
            >
              All
            </button>
            {MONTH_SHORT.map((label, idx) => (
              <button
                key={label}
                type="button"
                className={`calendar-pill ${selectedMonth === idx + 1 ? 'calendar-pill-active' : ''}`}
                onClick={() => {
                  setSelectedMonth(idx + 1)
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.set('year', String(selectedYear))
                  nextParams.set('month', String(idx + 1))
                  setSearchParams(nextParams, { replace: true })
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="metrics-grid planning-metrics-grid">
        <MetricCard label={`${selectedYear}${selectedMonth !== 'all' ? ` · ${planningMonthLabels[(selectedMonth as number) - 1]}` : ''} planned`} value={currentYearSummary.total} />
        <MetricCard label="Completed" value={`${currentYearSummary.completed} (${completionRate}%)`} tone="success" />
        <MetricCard label="Open / in progress" value={currentYearSummary.planned + currentYearSummary.inProgress} tone="warning" />
        <MetricCard label="Overdue" value={overduePlans.length} tone={overduePlans.length > 0 ? 'danger' : 'success'} />
      </div>

      <Panel
        title="Look-ahead and overdue risk"
        description="Upcoming demand and immediate schedule issues in one compact view."
        actions={
          <Link to={getPlanningCalendarPath({ year: selectedYear, month: selectedMonth === 'all' ? 1 : selectedMonth })} className="button button-secondary button-small">
            <ButtonLabel icon="calendar" label="Open calendar" />
          </Link>
        }
        className="report-risk-panel"
      >
        <div className="report-risk-layout">
          <div className="report-horizon-strip">
            <div className="report-horizon-card report-horizon-card-compact">
              <span className="report-horizon-num">{upcoming30.length}</span>
              <span className="report-horizon-label">30 days</span>
            </div>
            <div className="report-horizon-card report-horizon-card-compact">
              <span className="report-horizon-num">{upcoming60.length}</span>
              <span className="report-horizon-label">60 days</span>
            </div>
            <div className="report-horizon-card report-horizon-card-compact">
              <span className="report-horizon-num">{upcoming90.length}</span>
              <span className="report-horizon-label">90 days</span>
            </div>
          </div>

          <div className="report-overdue-block">
            <div className="report-overdue-summary">
              <strong>{overduePlans.length ? `${overduePlans.length} overdue item${overduePlans.length > 1 ? 's' : ''}` : 'No overdue items'}</strong>
              <span>{overduePlans.length ? 'Focus here first to keep the plan from drifting further.' : 'The current planning window is on track.'}</span>
            </div>

            <ul className="report-summary-list report-summary-list-compact planning-list">
              {overduePlans.length ? overduePlans.slice(0, 4).map((record) => (
                <li key={record.id}>
                  <div>
                    <strong>{record.title}</strong>
                    <p>{record.department} · ended {formatDate(record.plannedEnd)}</p>
                  </div>
                  <div className="planning-report-row-actions">
                    <StatusBadge value="Overdue" />
                    <Link to={getPlanningCalendarPath({ year: record.year, month: record.month, recordId: record.id })} className="button button-secondary button-small">
                      <ButtonLabel icon="open" label="Open" />
                    </Link>
                  </div>
                </li>
              )) : (
                <li>
                  <div>
                    <strong>No overdue items</strong>
                    <p>The plan is currently on track.</p>
                  </div>
                  <StatusBadge value="Completed" />
                </li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel
        title="Distribution snapshot"
        description="Standards, programme split, and department load in one tighter view."
        className="report-distribution-panel"
      >
        <div className="report-distribution-layout">
          <div className="report-distribution-main">
            <section className="report-distribution-section">
              <div className="report-distribution-section-head">
                <h3>By audit standard</h3>
                <span>{byStandard.length} standards</span>
              </div>
              <div className="report-standard-grid">
                {byStandard.map((row) => (
                  <div key={row.label} className="report-standard-row report-standard-row-compact">
                    <div className="report-standard-header">
                      <span className={`planning-distribution-standard ${getStandardColorClass(row.label)}`}>{row.label}</span>
                      <div className="report-standard-chips">
                        <span className="planning-distribution-chip planning-distribution-chip-success">{row.completed}</span>
                        <span className="planning-distribution-chip planning-distribution-chip-open">{row.open - row.overdue}</span>
                        {row.overdue > 0 ? <span className="planning-distribution-chip planning-distribution-chip-danger">{row.overdue}</span> : null}
                        <strong>{row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0}%</strong>
                      </div>
                    </div>
                    <CompletionBar {...row} />
                  </div>
                ))}
              </div>
            </section>

            <section className="report-distribution-section">
              <div className="report-distribution-section-head">
                <h3>By classification</h3>
                <span>{byClassification.length} groups</span>
              </div>
              <div className="report-standard-grid report-standard-grid-classification">
                {byClassification.map((row) => (
                  <div key={row.label} className="report-standard-row report-standard-row-compact">
                    <div className="report-standard-header">
                      <span>{row.label}</span>
                      <div className="report-standard-chips">
                        <span className="planning-distribution-chip">{row.total} total</span>
                        {row.overdue > 0 ? <span className="planning-distribution-chip planning-distribution-chip-danger">{row.overdue} overdue</span> : null}
                        <strong>{row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0}%</strong>
                      </div>
                    </div>
                    <CompletionBar {...row} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="report-distribution-section report-distribution-section-side">
            <div className="report-distribution-section-head">
              <h3>By department</h3>
              <span>{byDepartment.length} rows</span>
            </div>
            <div className="report-department-list">
              {byDepartment.map((row) => (
                <div key={row.label} className="planning-distribution-row report-department-row">
                  <div className="planning-distribution-heading">
                    <div className="planning-distribution-title">
                      <strong>{row.label}</strong>
                      <span>{row.total} total in selected period</span>
                    </div>
                    <div className="planning-distribution-metrics">
                      <span className="planning-distribution-chip">{row.total} total</span>
                      <span className="planning-distribution-chip planning-distribution-chip-success">{row.completed} done</span>
                      {row.overdue > 0 ? <span className="planning-distribution-chip planning-distribution-chip-danger">{row.overdue} overdue</span> : null}
                    </div>
                  </div>
                  <CompletionBar {...row} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </Panel>
    </div>
  )
}
