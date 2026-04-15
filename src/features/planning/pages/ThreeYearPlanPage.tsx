import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import { getPlanningCalendarPath } from '../../../data/navigation'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import PlanningPageHeader from '../components/PlanningPageHeader'
import {
  buildPlanningCalendarWeeks,
  getDerivedPlanStatus,
  getPlanColorClass,
  getPlanStatusDotClass,
  getPlanWindowLabel,
  groupPlansByMonth,
  planningMonthLabels,
  planningWeekdayLabels,
  summarizePlans,
} from '../services/planningUtils'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatusDot({ status }: { status: string }) {
  return <span className={`planning-status-dot threeyear-status-dot ${getPlanStatusDotClass(status)}`} />
}

export default function ThreeYearPlanPage() {
  const { planningRecords, planningYears, addPlanningYear, deletePlanningYear } = useAuditLibrary()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(
      planningYears
        .filter((year) => year !== currentYear)
        .map((year) => [year, true]),
    ),
  )
  const years = planningYears
  const summaryCardCount = Math.min(Math.max(years.length, 1), 10)
  const summaryCardWidth = `${Math.max(5.4, 8.8 - (summaryCardCount - 1) * 0.32).toFixed(2)}rem`
  const threeyearSummaryStyle = {
    '--threeyear-summary-columns': String(summaryCardCount),
    '--threeyear-summary-card-width': summaryCardWidth,
  } as CSSProperties
  const [expandedMonths, setExpandedMonths] = useState<Record<number, number>>({})

  function toggleExpandedMonth(year: number, month: number) {
    setExpandedMonths((current) => ({
      ...current,
      [year]: current[year] === month ? 0 : month,
    }))
  }

  function toggleYearCollapsed(year: number) {
    setCollapsedYears((current) => ({
      ...current,
      [year]: !current[year],
    }))
  }

  function handleAddYear() {
    const nextYear = (years[years.length - 1] ?? currentYear) + 1
    addPlanningYear(nextYear)
    setExpandedMonths((current) => ({
      ...current,
      [nextYear]: 1,
    }))
    setCollapsedYears((current) => ({
      ...current,
      [nextYear]: false,
    }))
  }

  function handleDeleteYear(year: number) {
    const yearRecords = planningRecords.filter((record) => record.year === year)

    if (yearRecords.length > 0) {
      window.alert(`"${year}" still has planned audits. Remove those records before deleting the year.`)
      return
    }

    const confirmed = window.confirm(`Delete year "${year}" from the 3-year plan?`)

    if (!confirmed) {
      return
    }

    deletePlanningYear(year)
    setExpandedMonths((current) => {
      const next = { ...current }
      delete next[year]
      return next
    })
    setCollapsedYears((current) => {
      const next = { ...current }
      delete next[year]
      return next
    })
  }

  return (
    <div className="module-page planning-page">
      <PlanningPageHeader
        title="3-year plan"
        subtitle="Scan yearly capacity first, then open the exact month that needs attention."
      />

      <div className="threeyear-summary-bar">
        <div className="metrics-grid planning-metrics-grid threeyear-summary-grid" style={threeyearSummaryStyle}>
          {years.map((year) => {
            const summary = summarizePlans(planningRecords.filter((record) => record.year === year))

            return (
              <MetricCard
                key={year}
                label={String(year)}
                value={`${summary.completed}/${summary.total} done`}
                tone={summary.overdue > 0 ? 'warning' : summary.completed === summary.total && summary.total > 0 ? 'success' : 'default'}
              />
            )
          })}
        </div>
        <button
          type="button"
          className="button button-secondary threeyear-add-year-button threeyear-icon-button"
          onClick={handleAddYear}
          aria-label="Add year"
          title="Add year"
        >
          <ButtonLabel icon="add" label="Add year" hideLabel />
        </button>
      </div>

      <div className="threeyear-grid">
        {years.map((year) => {
          const monthGroups = groupPlansByMonth(planningRecords, year)
          const summary = summarizePlans(planningRecords.filter((record) => record.year === year))
          const canDeleteYear = summary.total === 0
          const expandedMonth = expandedMonths[year] ?? 0
          const isCollapsed = collapsedYears[year] ?? false
          const expandedMonthRecords = expandedMonth ? monthGroups[expandedMonth - 1]?.records ?? [] : []
          const expandedWeeks = expandedMonth ? buildPlanningCalendarWeeks(expandedMonthRecords, year, expandedMonth) : []

          return (
            <div key={year} className={`threeyear-year-panel ${isCollapsed ? 'threeyear-year-panel-collapsed' : ''}`}>
              <div className="threeyear-year-header">
                <button
                  type="button"
                  className="threeyear-year-header-main"
                  onClick={() => toggleYearCollapsed(year)}
                  aria-expanded={!isCollapsed}
                >
                  <div>
                    <strong className="threeyear-year-label">{year}</strong>
                    <span className="threeyear-year-sub">
                      {summary.total} audits · {summary.completed} completed{summary.overdue > 0 ? ` · ${summary.overdue} delayed` : ''}
                    </span>
                  </div>
                  <div className="threeyear-status-pills">
                    {summary.completed > 0 ? <span className="threeyear-status-pill threeyear-pill-done">{summary.completed} done</span> : null}
                    {summary.inProgress > 0 ? <span className="threeyear-status-pill threeyear-pill-progress">{summary.inProgress} active</span> : null}
                    {summary.overdue > 0 ? <span className="threeyear-status-pill threeyear-pill-overdue">{summary.overdue} delayed</span> : null}
                  </div>
                </button>
                <div className="threeyear-year-header-actions">
                  <button
                    type="button"
                    className="button button-secondary button-small button-danger threeyear-delete-button threeyear-icon-button"
                    onClick={() => handleDeleteYear(year)}
                    disabled={!canDeleteYear}
                    aria-label={canDeleteYear ? `Delete ${year}` : 'Remove planned audits before deleting this year'}
                    title={canDeleteYear ? `Delete ${year}` : 'Remove planned audits before deleting this year'}
                  >
                    <ButtonLabel icon="delete" label={`Delete ${year}`} hideLabel />
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-small threeyear-collapse-button threeyear-icon-button"
                    onClick={() => toggleYearCollapsed(year)}
                    aria-label={isCollapsed ? `Expand ${year}` : `Collapse ${year}`}
                    title={isCollapsed ? `Expand ${year}` : `Collapse ${year}`}
                  >
                    <ButtonLabel icon={isCollapsed ? 'expand' : 'collapse'} label={`${isCollapsed ? 'Expand' : 'Collapse'} ${year}`} hideLabel />
                  </button>
                </div>
              </div>

              {!isCollapsed ? (
                <>
                  <div className="threeyear-month-grid">
                    {monthGroups.map((monthGroup, idx) => {
                      const monthNumber = idx + 1
                      const records = monthGroup.records
                      const hasRecords = records.length > 0
                      const statuses = records.map((record) => getDerivedPlanStatus(record))
                      const hasOverdue = statuses.includes('Overdue')
                      const hasCompleted = statuses.every((status) => status === 'Completed')
                      const isExpanded = expandedMonth === monthNumber
                      const isCurrentMonth = year === currentDate.getFullYear() && monthNumber === currentDate.getMonth() + 1

                      return (
                        <button
                          key={monthNumber}
                          type="button"
                          className={`threeyear-month-cell threeyear-month-button ${hasRecords ? 'threeyear-month-cell-active' : ''} ${hasOverdue ? 'threeyear-month-cell-overdue' : ''} ${hasCompleted && hasRecords ? 'threeyear-month-cell-done' : ''} ${isExpanded ? 'threeyear-month-cell-expanded' : ''} ${isCurrentMonth ? 'threeyear-month-cell-current' : ''}`}
                          onClick={() => toggleExpandedMonth(year, monthNumber)}
                          aria-expanded={isExpanded}
                        >
                          <span className="threeyear-month-label">{MONTH_SHORT[idx]}</span>
                          {hasRecords ? (
                            <div className="threeyear-month-events">
                              {records.slice(0, 3).map((record) => {
                                const status = getDerivedPlanStatus(record)

                                return (
                                  <div key={record.id} className={`threeyear-event-chip ${getPlanColorClass(record)}`} title={`${record.title} · ${status}`}>
                                    <StatusDot status={status} />
                                    <span className="threeyear-event-text">{record.title}</span>
                                  </div>
                                )
                              })}
                              {records.length > 3 ? <div className="threeyear-event-more">+{records.length - 3} more</div> : null}
                            </div>
                          ) : (
                            <div className="threeyear-month-empty" />
                          )}
                          {hasRecords ? <span className="threeyear-month-count">{records.length}</span> : null}
                        </button>
                      )
                    })}
                  </div>

                  {expandedMonth ? (
                    <div className="threeyear-expanded-panel">
                      <div className="threeyear-expanded-header">
                        <div>
                          <strong>{planningMonthLabels[expandedMonth - 1]} {year}</strong>
                          <span>
                            {expandedMonthRecords.length
                              ? `${expandedMonthRecords.length} audits scheduled`
                              : 'No audits scheduled for this month'}
                          </span>
                        </div>
                        <Link
                          to={getPlanningCalendarPath({ year, month: expandedMonth, recordId: expandedMonthRecords[0]?.id })}
                          className="button button-secondary button-small"
                        >
                          <ButtonLabel icon="calendar" label="Open full calendar" />
                        </Link>
                      </div>

                      <div className="threeyear-expanded-layout">
                        <div className="threeyear-mini-calendar">
                          <div className="threeyear-mini-calendar-head">
                            {planningWeekdayLabels.map((label, index) => (
                              <span
                                key={`${year}-${expandedMonth}-${label}`}
                                className={`threeyear-mini-calendar-head-cell ${index >= 5 ? 'threeyear-mini-calendar-head-cell-weekend' : ''}`}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                          <div className="threeyear-mini-calendar-body">
                            {expandedWeeks.map((week, weekIndex) => (
                              <div key={`${year}-${expandedMonth}-week-${weekIndex + 1}`} className="threeyear-mini-calendar-row">
                                {week.map((day) => (
                                  <div
                                    key={day.isoDate}
                                    className={`threeyear-mini-day ${day.isCurrentMonth ? '' : 'threeyear-mini-day-muted'} ${day.isWeekend ? 'threeyear-mini-day-weekend' : ''} ${day.holidayLabel ? 'threeyear-mini-day-holiday' : ''} ${day.isToday ? 'threeyear-mini-day-today' : ''} ${day.records.length ? 'threeyear-mini-day-has-events' : ''}`}
                                    title={day.records.length ? `${day.records.length} audit${day.records.length > 1 ? 's' : ''}` : day.isoDate}
                                  >
                                    <div className="threeyear-mini-day-title">
                                      <span className="threeyear-mini-day-number">{day.dateNumber}</span>
                                      {day.holidayLabel ? <em>{day.holidayLabel}</em> : null}
                                    </div>
                                    <div className="threeyear-mini-day-dots">
                                      {day.records.slice(0, 3).map((record) => {
                                        const status = getDerivedPlanStatus(record)

                                        return (
                                          <span
                                            key={`${day.isoDate}-${record.id}`}
                                            className={`threeyear-mini-day-dot ${getPlanStatusDotClass(status)}`}
                                            title={`${record.title} · ${status}`}
                                          />
                                        )
                                      })}
                                      {day.records.length > 3 ? <span className="threeyear-mini-day-more">+{day.records.length - 3}</span> : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="threeyear-expanded-list">
                          {expandedMonthRecords.length ? expandedMonthRecords.map((record) => {
                            const status = getDerivedPlanStatus(record)

                            return (
                              <Link
                                key={record.id}
                                to={getPlanningCalendarPath({ year, month: expandedMonth, recordId: record.id })}
                                className="threeyear-expanded-item"
                              >
                                <div className="threeyear-expanded-item-top">
                                  <span className={`threeyear-event-chip ${getPlanColorClass(record)}`}>
                                    <StatusDot status={status} />
                                    <span className="threeyear-event-text">{record.standard}</span>
                                  </span>
                                  <span className="threeyear-expanded-status">{status}</span>
                                </div>
                                <strong>{record.title}</strong>
                                <span>{record.owner} · {record.site}</span>
                                <span>{getPlanWindowLabel(record)}</span>
                              </Link>
                            )
                          }) : (
                            <div className="threeyear-expanded-empty">
                              <strong>No audits in this month</strong>
                              <span>Pick another month to review the planned audit dates.</span>
                              <Link
                                to={getPlanningCalendarPath({ year, month: expandedMonth })}
                                className="button button-secondary button-small"
                              >
                                <ButtonLabel icon="add" label="Plan first audit" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
