import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuditTypeBadge, PageHeader, StatusBadge } from '../components/ui'
import { getAuditRecordHomePath } from '../data/navigation'
import { getAuditTypeLabel } from '../features/shared/services/auditSummary'
import { getAuditTypeFamilyLabel, getAuditWorkspaceKind } from '../data/auditTypes'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import {
  getDerivedPlanStatus,
  getOverduePlanningRecords,
  getPlanWindowLabel,
  getPlanningYears,
  getPlansForYear,
  getUpcomingPlanningRecords,
  groupPlansByMonth,
  summarizePlans,
} from '../features/planning/services/planningUtils'
import type { AuditRecord, AuditType } from '../types/audit'
import type { AuditPlanRecord } from '../types/planning'
import { formatDate, formatDateTime } from '../utils/dateUtils'

type DashboardPlanStatus = 'Completed' | 'Planned' | 'Upcoming' | 'In progress' | 'Overdue'
type DashboardTone = 'green' | 'blue' | 'yellow' | 'orange' | 'red' | 'grey'
type ChartSegment = { label: string; value: number; color: string }

function startOfDay(date: Date) {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function getDaysUntil(dateString: string, referenceDate = new Date()) {
  const reference = startOfDay(referenceDate)
  const target = startOfDay(new Date(dateString))
  return Math.round((target.getTime() - reference.getTime()) / 86_400_000)
}

function getDashboardPlanStatus(record: AuditPlanRecord, referenceDate = new Date()): DashboardPlanStatus {
  const derivedStatus = getDerivedPlanStatus(record, referenceDate)

  if (derivedStatus === 'Completed' || derivedStatus === 'In progress' || derivedStatus === 'Overdue') {
    return derivedStatus
  }

  return getDaysUntil(record.plannedStart, referenceDate) <= 30 ? 'Upcoming' : 'Planned'
}

function getAuditDashboardStatus(record: AuditRecord) {
  if (record.status === 'Completed') {
    return 'Completed'
  }

  return record.summary.progressPercent === 0 ? 'Not evaluated' : 'In progress'
}

function getActionPlanPath(record: AuditRecord) {
  return `/audits/${record.id}/${record.auditType}/action-plan`
}

function getPlanningLink(record: AuditPlanRecord, audits: AuditRecord[]) {
  if (record.linkedAuditId) {
    const linkedAudit = audits.find((audit) => audit.id === record.linkedAuditId)

    if (linkedAudit) {
      return getAuditRecordHomePath(linkedAudit)
    }
  }

  return '/planning/calendar'
}

function getStandardTone(standard: string) {
  switch (standard) {
    case 'VDA 6.3':
      return 'vda63'
    case 'VDA 6.5':
      return 'vda65'
    case 'ISO 9001':
    case 'ISO 14001':
      return 'iso'
    case 'ASI':
      return 'asi'
    case 'EcoVadis':
      return 'ecovadis'
    case 'IATF 16949':
      return 'iatf'
    default:
      return 'neutral'
  }
}

function getMonthDensityLevel(count: number, maxCount: number) {
  if (count === 0) {
    return 'zero'
  }

  const ratio = count / Math.max(1, maxCount)

  if (ratio >= 0.8) {
    return '4'
  }

  if (ratio >= 0.55) {
    return '3'
  }

  if (ratio >= 0.3) {
    return '2'
  }

  return '1'
}

function buildDonutStyle(segments: ChartSegment[]): CSSProperties {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  if (total === 0) {
    return {
      background: 'conic-gradient(rgba(91, 109, 128, 0.16) 0deg 360deg)',
    }
  }

  let currentAngle = 0
  const gradient = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = currentAngle
      const sweep = (segment.value / total) * 360
      currentAngle += sweep
      return `${segment.color} ${start}deg ${currentAngle}deg`
    })
    .join(', ')

  return {
    background: `conic-gradient(${gradient})`,
  }
}

function DashboardMetric({
  label,
  value,
  tone,
  helper,
}: {
  label: string
  value: string | number
  tone: DashboardTone
  helper: string
}) {
  return (
    <div className={`dashboard-kpi dashboard-kpi-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { audits, planningRecords, createAudit } = useAuditLibrary()
  const planningYears = getPlanningYears(planningRecords)
  const fallbackYear = new Date().getFullYear()
  const currentYear = planningYears.length === 0
    ? fallbackYear
    : planningYears.includes(fallbackYear)
      ? fallbackYear
      : planningYears[planningYears.length - 1]
  const currentYearPlans = getPlansForYear(planningRecords, currentYear)
  const currentYearSummary = summarizePlans(currentYearPlans)
  const completionRate = currentYearSummary.total === 0 ? 0 : Math.round((currentYearSummary.completed / currentYearSummary.total) * 100)
  const recentAudits = [...audits].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 4)
  const activeAudits = audits.filter((audit) => audit.status !== 'Completed')
  const notEvaluatedAudits = audits.filter((audit) => audit.summary.progressPercent === 0)
  const next30Plans = getUpcomingPlanningRecords(planningRecords, 30)
  const upcomingPlans = getUpcomingPlanningRecords(planningRecords, 90).slice(0, 7)
  const overduePlans = getOverduePlanningRecords(planningRecords).slice(0, 5)
  const monthGroups = groupPlansByMonth(planningRecords, currentYear)
  const maxMonthLoad = Math.max(1, ...monthGroups.map((month) => month.records.length))
  const plannedCount = currentYearPlans.filter((record) => getDashboardPlanStatus(record) === 'Planned').length
  const upcomingCount = currentYearPlans.filter((record) => getDashboardPlanStatus(record) === 'Upcoming').length
  const overdueCount = currentYearPlans.filter((record) => getDashboardPlanStatus(record) === 'Overdue').length

  const openActionRecords = audits
    .flatMap((audit) =>
      audit.actions
        .filter((action) => action.status !== 'Closed')
        .map((action) => ({
          audit,
          action,
          overdue: !!action.dueDate && getDaysUntil(action.dueDate) < 0,
        })),
    )
    .sort((left, right) => {
      if (left.overdue !== right.overdue) {
        return left.overdue ? -1 : 1
      }

      if (left.action.dueDate && right.action.dueDate) {
        return left.action.dueDate.localeCompare(right.action.dueDate)
      }

      return left.audit.updatedAt.localeCompare(right.audit.updatedAt)
    })

  const overdueActionCount = openActionRecords.filter((item) => item.overdue).length
  const standardsBreakdown = Object.entries(
    currentYearPlans.reduce<Record<string, number>>((summary, record) => {
      summary[record.standard] = (summary[record.standard] ?? 0) + 1
      return summary
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)

  const standardBreakdownDetails = standardsBreakdown.map(([standard, count]) => {
    const records = currentYearPlans.filter((record) => record.standard === standard)

    return {
      standard,
      count,
      records,
      preview: records.slice(0, 4),
      remaining: Math.max(0, records.length - 4),
    }
  })

  const splitBreakdown = Object.entries(
    currentYearPlans.reduce<Record<string, number>>((summary, record) => {
      summary[record.internalExternal] = (summary[record.internalExternal] ?? 0) + 1
      return summary
    }, {}),
  ).sort((left, right) => right[1] - left[1])

  const splitBreakdownDetails = splitBreakdown.map(([label, count]) => {
    const records = currentYearPlans.filter((record) => record.internalExternal === label)

    return {
      label,
      count,
      records,
      preview: records.slice(0, 4),
      remaining: Math.max(0, records.length - 4),
    }
  })

  const statusSegments: ChartSegment[] = [
    { label: 'Completed', value: currentYearSummary.completed, color: '#35a56d' },
    { label: 'In progress', value: currentYearSummary.inProgress, color: '#e58d2f' },
    { label: 'Upcoming', value: upcomingCount, color: '#d2a72a' },
    { label: 'Planned', value: plannedCount, color: '#3e78d5' },
    { label: 'Overdue', value: overdueCount, color: '#d34d43' },
  ]

  const deliverySegments: ChartSegment[] = [
    { label: 'Internal', value: splitBreakdown.filter(([label]) => label === 'Internal').reduce((sum, [, value]) => sum + value, 0), color: '#2d8a68' },
    { label: 'External', value: splitBreakdown.filter(([label]) => label.includes('External') || label.includes('third-party')).reduce((sum, [, value]) => sum + value, 0), color: '#3e78d5' },
    { label: 'Supplier / follow-up', value: splitBreakdown.filter(([label]) => label.includes('Supplier') || label.includes('Follow-up') || label.includes('Special')).reduce((sum, [, value]) => sum + value, 0), color: '#c27e2f' },
  ]

  function handleCreateAudit(auditType: AuditType) {
    const newAudit = createAudit(auditType)
    navigate(getAuditRecordHomePath(newAudit))
  }

  const featuredStandards = standardsBreakdown.slice(0, 4)

  return (
    <div className="dashboard-page dashboard-control-center">
      <PageHeader
        eyebrow="Audit management platform"
        title="Audit command center"
        subtitle="See overdue work, near-term load, yearly coverage, and execution momentum at a glance."
        actions={
          <div className="section-header-actions">
            <Link to="/planning" className="button button-secondary">Planning</Link>
            <Link to="/audits" className="button button-primary">Audit library</Link>
          </div>
        }
      />

      <section className="dashboard-pulse">
        <div className="dashboard-pulse-main">
          <div className="dashboard-pulse-head">
            <div>
              <span className="dashboard-pulse-label">Programme pulse</span>
              <h2>{currentYear} audit overview</h2>
            </div>
            <div className="dashboard-pulse-badges">
              {featuredStandards.map(([standard]) => (
                <span key={standard} className={`dashboard-standard-chip dashboard-standard-${getStandardTone(standard)}`}>
                  {standard}
                </span>
              ))}
            </div>
          </div>

          <div className="dashboard-pulse-summary">
            <div>
              <strong>{currentYearSummary.total}</strong>
              <span>planned audits</span>
            </div>
            <div>
              <strong>{completionRate}%</strong>
              <span>completed on plan</span>
            </div>
            <div>
              <strong>{next30Plans.length}</strong>
              <span>starting in 30 days</span>
            </div>
            <div>
              <strong>{overdueCount}</strong>
              <span>overdue windows</span>
            </div>
          </div>

          <div className="dashboard-segment-bar" aria-label="Year programme status">
            {statusSegments.map((segment) => {
              const total = statusSegments.reduce((sum, item) => sum + item.value, 0) || 1
              return (
                <span
                  key={segment.label}
                  className={`dashboard-segment dashboard-segment-${segment.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  style={{ width: `${(segment.value / total) * 100}%` }}
                  title={`${segment.label}: ${segment.value}`}
                />
              )
            })}
          </div>

          <div className="dashboard-kpi-grid">
            <DashboardMetric label="Completed" value={currentYearSummary.completed} tone="green" helper="Green delivery" />
            <DashboardMetric label="Planned" value={plannedCount} tone="blue" helper="Later in programme" />
            <DashboardMetric label="Upcoming" value={upcomingCount} tone="yellow" helper="Next 30 days" />
            <DashboardMetric label="In progress" value={currentYearSummary.inProgress + activeAudits.length} tone="orange" helper="Planning plus execution" />
            <DashboardMetric label="Overdue" value={overdueCount + overdueActionCount} tone="red" helper="Plans or actions behind" />
            <DashboardMetric label="Not evaluated" value={notEvaluatedAudits.length} tone="grey" helper="Execution not started" />
          </div>
        </div>

        <div className="dashboard-pulse-side">
          <Link to="/planning/calendar" className="dashboard-alert-card dashboard-alert-danger">
            <span className="dashboard-alert-kicker">Needs attention</span>
            <strong>{overduePlans.length || overdueActionCount ? `${overduePlans.length + overdueActionCount} overdue items` : 'No overdue items'}</strong>
            <p>
              {overduePlans.length || overdueActionCount
                ? 'Jump into the planning calendar and action follow-up before the schedule drifts further.'
                : 'Planning and actions are currently on time.'}
            </p>
          </Link>

          <div className="dashboard-quick-panel">
            <span className="dashboard-alert-kicker">Quick launch</span>
            <div className="dashboard-quick-actions">
              <button type="button" className="button button-primary" onClick={() => handleCreateAudit('template')}>
                New audit
              </button>
              <Link to="/audits" className="button button-secondary">Open library</Link>
              <Link to="/planning" className="button button-secondary">Planning board</Link>
              <Link to="/planning/reports" className="button button-secondary">Reports</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-main-grid">
        <section className="dashboard-widget dashboard-widget-calendar">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Year heatmap</span>
              <h2>{currentYear} audit density</h2>
            </div>
            <Link to="/planning/calendar" className="button button-secondary button-small">Open calendar</Link>
          </div>
          <div className="dashboard-month-grid">
            {monthGroups.map((month) => {
              const monthStandards = [...new Set(month.records.map((record) => record.standard))].slice(0, 2)
              return (
                <Link
                  key={month.month}
                  to="/planning/calendar"
                  className={`dashboard-month-card dashboard-month-density-${getMonthDensityLevel(month.records.length, maxMonthLoad)}`}
                >
                  <div className="dashboard-month-head">
                    <strong>{month.label}</strong>
                    <span>{month.records.length}</span>
                  </div>
                  <div className="dashboard-month-status">
                    <span>{month.records.filter((record) => getDashboardPlanStatus(record) === 'Overdue').length} overdue</span>
                    <span>{month.records.filter((record) => getDashboardPlanStatus(record) === 'Upcoming').length} upcoming</span>
                  </div>
                  <div className="dashboard-month-standards">
                    {monthStandards.length ? monthStandards.map((standard) => (
                      <span key={standard} className={`dashboard-standard-chip dashboard-standard-${getStandardTone(standard)}`}>
                        {standard}
                      </span>
                    )) : <span className="dashboard-empty-note">No audits</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="dashboard-widget dashboard-widget-timeline">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Next 90 days</span>
              <h2>Upcoming timeline</h2>
            </div>
            <Link to="/planning" className="button button-secondary button-small">Planning board</Link>
          </div>
          <div className="dashboard-timeline-list">
            {upcomingPlans.map((record) => (
              <Link key={record.id} to={getPlanningLink(record, audits)} className="dashboard-timeline-item">
                <div className={`dashboard-timeline-marker status-${getDashboardPlanStatus(record).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} />
                <div className="dashboard-timeline-copy">
                  <div className="dashboard-timeline-title">
                    <strong>{record.title}</strong>
                    <StatusBadge value={getDashboardPlanStatus(record)} />
                  </div>
                  <p>{record.owner} · {record.site}</p>
                  <div className="dashboard-timeline-meta">
                    <span>{formatDate(record.plannedStart)}</span>
                    <span>{getPlanWindowLabel(record)}</span>
                    <span className={`dashboard-standard-chip dashboard-standard-${getStandardTone(record.standard)}`}>{record.standard}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="dashboard-widget dashboard-widget-danger">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Escalate now</span>
              <h2>Overdue spotlight</h2>
            </div>
            <Link to="/planning/calendar" className="button button-secondary button-small">Resolve overdue</Link>
          </div>
          <div className="dashboard-alert-list">
            {overduePlans.length ? overduePlans.map((record) => (
              <Link key={record.id} to={getPlanningLink(record, audits)} className="dashboard-alert-item">
                <div>
                  <strong>{record.title}</strong>
                  <p>{record.owner} · planned end {formatDate(record.plannedEnd)}</p>
                </div>
                <div className="dashboard-alert-meta">
                  <StatusBadge value="Overdue" />
                  <span>{record.site}</span>
                </div>
              </Link>
            )) : (
              <div className="dashboard-alert-empty">
                <strong>Nothing overdue</strong>
                <p>The active planning horizon is currently under control.</p>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-widget dashboard-widget-chart">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Portfolio mix</span>
              <h2>Standards and delivery split</h2>
            </div>
            <Link to="/planning/reports" className="button button-secondary button-small">Open reports</Link>
          </div>

          <div className="dashboard-chart-grid">
            <div className="dashboard-donut-card">
              <div className="dashboard-donut" style={buildDonutStyle(statusSegments)}>
                <div className="dashboard-donut-center">
                  <strong>{currentYearSummary.total}</strong>
                  <span>planned</span>
                </div>
              </div>
              <div className="dashboard-chart-legend">
                {statusSegments.map((segment) => (
                  <div key={segment.label} className="dashboard-legend-row">
                    <span className="dashboard-legend-dot" style={{ background: segment.color }} />
                    <span>{segment.label}</span>
                    <strong>{segment.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-bar-list">
              <div className="dashboard-bar-group">
                <span className="dashboard-bar-title">Audits by standard</span>
                {standardBreakdownDetails.map(({ standard, count, preview, remaining }) => {
                  const maxValue = Math.max(1, standardBreakdownDetails[0]?.count ?? 1)
                  return (
                    <div key={standard} className="dashboard-bar-row dashboard-bar-row-detail">
                      <div className="dashboard-bar-labels">
                        <span className={`dashboard-standard-chip dashboard-standard-${getStandardTone(standard)}`}>{standard}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="dashboard-bar-track">
                        <span className={`dashboard-bar-fill dashboard-standard-fill-${getStandardTone(standard)}`} style={{ width: `${(count / maxValue) * 100}%` }} />
                      </div>
                      <div className="dashboard-bar-hover-card">
                        <span className="dashboard-bar-hover-title">{standard} audits</span>
                        <div className="dashboard-bar-hover-list">
                          {preview.map((record) => (
                            <div key={record.id} className="dashboard-bar-hover-item">
                              <strong>{record.auditType}</strong>
                              <span>{record.title}</span>
                            </div>
                          ))}
                          {remaining > 0 ? <span className="dashboard-bar-hover-more">+{remaining} more planned audits</span> : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dashboard-bar-group">
                <span className="dashboard-bar-title">Internal vs external</span>
                {splitBreakdownDetails.map(({ label, count, preview, remaining }) => {
                  const maxValue = Math.max(1, splitBreakdownDetails[0]?.count ?? 1)
                  return (
                    <div key={label} className="dashboard-bar-row dashboard-bar-row-detail">
                      <div className="dashboard-bar-labels">
                        <span>{label}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="dashboard-bar-track">
                        <span className="dashboard-bar-fill dashboard-bar-fill-slate" style={{ width: `${(count / maxValue) * 100}%` }} />
                      </div>
                      <div className="dashboard-bar-hover-card">
                        <span className="dashboard-bar-hover-title">{label} audits</span>
                        <div className="dashboard-bar-hover-list">
                          {preview.map((record) => (
                            <div key={record.id} className="dashboard-bar-hover-item">
                              <strong>{record.standard}</strong>
                              <span>{record.auditType} · {record.title}</span>
                            </div>
                          ))}
                          {remaining > 0 ? <span className="dashboard-bar-hover-more">+{remaining} more planned audits</span> : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dashboard-bar-group">
                <span className="dashboard-bar-title">Programme delivery</span>
                <div className="dashboard-stacked-track">
                  {deliverySegments.map((segment) => {
                    const total = deliverySegments.reduce((sum, item) => sum + item.value, 0) || 1
                    return (
                      <span
                        key={segment.label}
                        className="dashboard-stacked-segment"
                        style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
                        title={`${segment.label}: ${segment.value}`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="dashboard-widget dashboard-widget-actions">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Action follow-up</span>
              <h2>Open actions</h2>
            </div>
            <span className="dashboard-widget-stat">{openActionRecords.length} open</span>
          </div>
          <div className="dashboard-action-list">
            {openActionRecords.slice(0, 6).map(({ audit, action, overdue }) => (
              <Link key={action.id} to={getActionPlanPath(audit)} className={`dashboard-action-card ${overdue ? 'dashboard-action-overdue' : ''}`}>
                <div className="dashboard-action-topline">
                  <StatusBadge value={overdue ? 'Overdue' : action.status} />
                  <span>{audit.title}</span>
                </div>
                <strong>{action.finding}</strong>
                <p>{action.section} · {action.owner || 'Owner TBD'}</p>
                <div className="dashboard-action-meta">
                  <span>{action.dueDate ? `Due ${formatDate(action.dueDate)}` : 'No due date'}</span>
                  <span>{audit.standard || getAuditTypeLabel(audit.auditType)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-widget dashboard-widget-recent">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Execution</span>
              <h2>Recent audits</h2>
            </div>
            <Link to="/audits" className="button button-secondary button-small">Open library</Link>
          </div>
          <div className="dashboard-recent-grid">
            {recentAudits.map((audit) => (
              <Link key={audit.id} to={getAuditRecordHomePath(audit)} className="dashboard-audit-card">
                <div className="dashboard-audit-topline">
                  {getAuditWorkspaceKind(audit.auditType) === 'generic' ? (
                    <AuditTypeBadge auditType={audit.auditType} size="small" />
                  ) : (
                    <span className={`dashboard-standard-chip dashboard-standard-${audit.auditType}`}>{audit.standard || getAuditTypeLabel(audit.auditType)}</span>
                  )}
                  <StatusBadge value={getAuditDashboardStatus(audit)} />
                </div>
                <strong>{audit.title}</strong>
                <p>{audit.standard || getAuditTypeLabel(audit.auditType)}</p>
                <div className="dashboard-audit-meta">
                  <span>{getAuditTypeFamilyLabel(audit.auditType)}</span>
                  <span>{audit.site || 'Site TBD'}</span>
                  <span>{formatDateTime(audit.updatedAt)}</span>
                </div>
                <div className="dashboard-audit-progress">
                  <div className="dashboard-audit-progress-track">
                    <span style={{ width: `${audit.summary.progressPercent}%` }} />
                  </div>
                  <strong>{audit.summary.progressPercent}%</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
