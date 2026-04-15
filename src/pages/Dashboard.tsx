import { Link, useNavigate } from 'react-router-dom'
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { AuditTypeBadge, PageHeader, StatusBadge } from '../components/ui'
import { ButtonLabel } from '../components/icons'
import { dashboardStatusColors } from '../config/domain/colors'
import { getStandardToneKey } from '../config/domain/standards'
import { getAuditRecordHomePath, getPlanningCalendarPath } from '../data/navigation'
import { getAuditTypeLabel } from '../features/shared/services/auditSummary'
import { isActionItemDelayed, summarizeOpenActionItems } from '../features/shared/services/auditWorkflow'
import { getAuditWorkspaceKind } from '../data/auditTypes'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import {
  getDerivedPlanStatus,
  getPlanWindowLabel,
  getPlanningYears,
  getPlansForYear,
  getUpcomingPlanningRecords,
  groupPlansByMonth,
  planningMonthLabels,
  summarizePlans,
} from '../features/planning/services/planningUtils'
import type { ActionPlanStatus, AuditRecord, AuditType } from '../types/audit'
import type { AuditPlanRecord } from '../types/planning'
import { formatDate } from '../utils/dateUtils'
import { getStatusDisplayLabel } from '../utils/statusDisplay'

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
  return record.status
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

  return getPlanningCalendarPath({
    year: record.year,
    month: record.month,
  })
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

function isPastPlanningMonth(year: number, month: number, referenceDate = new Date()) {
  const referenceYear = referenceDate.getFullYear()
  const referenceMonth = referenceDate.getMonth() + 1

  if (year < referenceYear) {
    return true
  }

  if (year > referenceYear) {
    return false
  }

  return month < referenceMonth
}

function formatTimeOnly(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getActionPreviewPriority(status: ActionPlanStatus) {
  switch (status) {
    case 'In progress':
      return 0
    case 'Open':
      return 1
    default:
      return 2
  }
}

function getPortfolioHoverDate(record: AuditPlanRecord, referenceDate = new Date()) {
  const status = getDashboardPlanStatus(record, referenceDate)

  if (status === 'Completed') {
    return {
      dateTime: record.actualCompletionDate ?? record.plannedEnd,
      label: 'Completed',
      value: formatDate(record.actualCompletionDate ?? record.plannedEnd),
    }
  }

  if (status === 'Overdue') {
    return {
      dateTime: record.plannedEnd,
      label: 'Delayed',
      value: formatDate(record.plannedEnd),
    }
  }

  return {
    dateTime: record.plannedStart,
    label: status === 'In progress' ? 'Started' : 'Starts',
    value: formatDate(record.plannedStart),
  }
}

function DashboardMetaPill({
  label,
  detail,
  tone = 'sand',
}: {
  label?: string
  detail: string
  tone?: 'sand' | 'slate' | 'red'
}) {
  return (
    <span className={`dashboard-meta-pill dashboard-meta-pill-${tone}`}>
      {label ? <small>{label}</small> : null}
      <strong>{detail}</strong>
    </span>
  )
}

function DashboardMetric({
  label,
  value,
  tone,
  helper,
  active = false,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
  onClick,
}: {
  label: string
  value: string | number
  tone: DashboardTone
  helper: string
  active?: boolean
  onHoverStart?: (event: ReactMouseEvent<HTMLButtonElement> | ReactFocusEvent<HTMLButtonElement>) => void
  onHoverMove?: (event: ReactMouseEvent<HTMLButtonElement>) => void
  onHoverEnd?: () => void
  onClick?: () => void
}) {
  const className = `dashboard-kpi dashboard-kpi-${tone} ${active ? 'dashboard-kpi-active' : ''}`.trim()

  if (onHoverStart || onHoverMove || onHoverEnd || onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        onMouseEnter={(event) => onHoverStart?.(event)}
        onMouseMove={(event) => onHoverMove?.(event)}
        onMouseLeave={() => onHoverEnd?.()}
        onFocus={(event) => onHoverStart?.(event)}
        onBlur={() => onHoverEnd?.()}
      >
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </button>
    )
  }

  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  )
}

function DashboardHelpButton({ text }: { text: string }) {
  return (
    <span className="dashboard-help-button" title={text} aria-label={text} tabIndex={0}>
      ?
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { audits, planningRecords, createAudit } = useAuditLibrary()
  const calendarPanelRef = useRef<HTMLElement | null>(null)
  const planningYears = getPlanningYears(planningRecords)
  const currentDate = new Date()
  const fallbackYear = new Date().getFullYear()
  const currentYear = planningYears.length === 0
    ? fallbackYear
    : planningYears.includes(fallbackYear)
      ? fallbackYear
      : planningYears[planningYears.length - 1]
  
  const [portfolioMonth, setPortfolioMonth] = useState<number | 'all'>('all')
  const [portfolioHoverStatus, setPortfolioHoverStatus] = useState<string | null>(null)
  const [portfolioHoverCardPosition, setPortfolioHoverCardPosition] = useState<{ left: number; top: number } | null>(null)
  const [mainGridPanelHeight, setMainGridPanelHeight] = useState<number | null>(null)
  
  const portfolioYearPlans = getPlansForYear(planningRecords, currentYear)
  const portfolioFilteredPlans = portfolioMonth === 'all'
    ? portfolioYearPlans
    : portfolioYearPlans.filter(plan => plan.month === portfolioMonth)
  const portfolioSummary = summarizePlans(portfolioFilteredPlans)
  const portfolioCompletionRate = portfolioSummary.total === 0 ? 0 : Math.round((portfolioSummary.completed / portfolioSummary.total) * 100)
  const recentAudits = [...audits].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 4)
  const portfolioPlannedCount = portfolioFilteredPlans.filter((record) => getDashboardPlanStatus(record) === 'Planned').length
  const portfolioUpcomingCount = portfolioFilteredPlans.filter((record) => getDashboardPlanStatus(record) === 'Upcoming').length
  const portfolioOverdueCount = portfolioFilteredPlans.filter((record) => getDashboardPlanStatus(record) === 'Overdue').length
  const upcomingPlans = getUpcomingPlanningRecords(planningRecords, 90).slice(0, 7)
  const monthGroups = groupPlansByMonth(planningRecords, currentYear)
  const maxMonthLoad = Math.max(1, ...monthGroups.map((month) => month.records.length))
  const monthGridSignature = monthGroups.map((month) => `${month.month}:${month.records.length}`).join('|')

  const openActionRecords = audits
    .flatMap((audit) =>
      audit.actions
        .filter((action) => action.status !== 'Closed')
        .map((action) => ({
          audit,
          action,
          overdue: isActionItemDelayed(action, currentDate),
        })),
    )
    .sort((left, right) => {
      if (left.overdue !== right.overdue) {
        return left.overdue ? -1 : 1
      }

      const statusPriority = getActionPreviewPriority(left.action.status) - getActionPreviewPriority(right.action.status)

      if (statusPriority !== 0) {
        return statusPriority
      }

      if (left.action.dueDate && right.action.dueDate) {
        return left.action.dueDate.localeCompare(right.action.dueDate)
      }

      if (left.action.dueDate || right.action.dueDate) {
        return left.action.dueDate ? -1 : 1
      }

      return right.audit.updatedAt.localeCompare(left.audit.updatedAt)
    })
  const actionFollowUp = summarizeOpenActionItems(
    audits.flatMap((audit) => audit.actions),
    currentDate,
  )
  const overdueActionCount = actionFollowUp.delayed
  const inProgressActionCount = actionFollowUp.inProgress
  const openActionCount = actionFollowUp.open
  const actionSummary = `${overdueActionCount} delayed · ${inProgressActionCount} in progress · ${openActionCount} open`

  const portfolioStandardsBreakdown = Object.entries(
    portfolioFilteredPlans.reduce<Record<string, number>>((summary, record) => {
      summary[record.standard] = (summary[record.standard] ?? 0) + 1
      return summary
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)

  const portfolioStandardBreakdownDetails = portfolioStandardsBreakdown.map(([standard, count]) => {
    const records = portfolioFilteredPlans.filter((record) => record.standard === standard)

    return {
      standard,
      count,
      records,
    }
  })

  const portfolioStatusSegments: ChartSegment[] = [
    { label: 'Completed', value: portfolioSummary.completed, color: dashboardStatusColors.Completed },
    { label: 'In progress', value: portfolioSummary.inProgress, color: dashboardStatusColors['In progress'] },
    { label: 'Upcoming', value: portfolioUpcomingCount, color: dashboardStatusColors.Upcoming },
    { label: 'Planned', value: portfolioPlannedCount, color: dashboardStatusColors.Planned },
    { label: 'Overdue', value: portfolioOverdueCount, color: dashboardStatusColors.Overdue },
  ]

  function handleCreateAudit(auditType: AuditType) {
    const newAudit = createAudit(auditType)
    navigate(getAuditRecordHomePath(newAudit))
  }

  function openAuditDrilldown(status?: string, followUp?: string) {
    const params = new URLSearchParams()

    if (status) {
      params.set('status', status)
    }

    if (followUp) {
      params.set('followUp', followUp)
    }

    navigate(`/audits${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function openPlanningDrilldown(status?: string) {
    const params = new URLSearchParams({
      year: String(currentYear),
      month: String(currentDate.getMonth() + 1),
    })

    if (status) {
      params.set('status', status)
    }

    navigate(`/planning/calendar?${params.toString()}`)
  }

  const pulseFeaturedStandards = portfolioStandardBreakdownDetails.slice(0, 4)
  const currentCalendarPath = getPlanningCalendarPath({
    year: currentYear,
    month: currentDate.getMonth() + 1,
  })
  const hoveredStatusRecords = portfolioHoverStatus
    ? portfolioFilteredPlans.filter((record) => getDashboardPlanStatus(record) === portfolioHoverStatus)
    : []
  const hoveredStatusRecordPreview = [...hoveredStatusRecords]
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart) || left.title.localeCompare(right.title))
    .slice(0, 6)
  const portfolioPeriodLabel = portfolioMonth === 'all'
    ? `${currentYear}`
    : `${planningMonthLabels[portfolioMonth - 1]} ${currentYear}`
  const portfolioOverviewLabel = `${currentYear} Audit Review`
  const activeStatusCount = portfolioHoverStatus
    ? portfolioStatusSegments.find((segment) => segment.label === portfolioHoverStatus)?.value ?? 0
    : 0

  function getPortfolioHoverCardPosition(clientX: number, clientY: number) {
    if (typeof window === 'undefined') {
      return { left: clientX, top: clientY }
    }

    const cardWidth = 340
    const cardHeight = 280
    const pointerOffset = 18
    const viewportPadding = 16
    let left = clientX + pointerOffset
    let top = clientY + pointerOffset

    if (left + cardWidth > window.innerWidth - viewportPadding) {
      left = Math.max(viewportPadding, clientX - cardWidth - pointerOffset)
    }

    if (top + cardHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, window.innerHeight - cardHeight - viewportPadding)
    }

    return { left, top }
  }

  function showPortfolioHoverAtPointer(status: string, clientX: number, clientY: number) {
    setPortfolioHoverStatus(status)
    setPortfolioHoverCardPosition(getPortfolioHoverCardPosition(clientX, clientY))
  }

  function showPortfolioHoverAtElement(status: string, element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    showPortfolioHoverAtPointer(status, rect.right, rect.top + rect.height / 2)
  }

  function clearPortfolioHover() {
    setPortfolioHoverStatus(null)
    setPortfolioHoverCardPosition(null)
  }

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const calendarPanel = calendarPanelRef.current
    if (!calendarPanel) {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 1180px)')

    const syncPanelHeight = () => {
      if (mediaQuery.matches) {
        setMainGridPanelHeight(null)
        return
      }

      setMainGridPanelHeight(Math.ceil(calendarPanel.getBoundingClientRect().height))
    }

    syncPanelHeight()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncPanelHeight)

      return () => {
        window.removeEventListener('resize', syncPanelHeight)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      syncPanelHeight()
    })

    resizeObserver.observe(calendarPanel)
    window.addEventListener('resize', syncPanelHeight)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncPanelHeight)

      return () => {
        resizeObserver.disconnect()
        window.removeEventListener('resize', syncPanelHeight)
        mediaQuery.removeEventListener('change', syncPanelHeight)
      }
    }

    mediaQuery.addListener(syncPanelHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', syncPanelHeight)
      mediaQuery.removeListener(syncPanelHeight)
    }
  }, [monthGridSignature])

  const timelinePanelStyle = mainGridPanelHeight
    ? ({ '--dashboard-main-panel-height': `${mainGridPanelHeight}px` } as CSSProperties)
    : undefined

  return (
    <div className="dashboard-page dashboard-control-center">
      <PageHeader
        eyebrow="Dashboard"
        title="Audit Dashboard"
        actions={
          <div className="section-header-actions">
            <DashboardHelpButton text="Balanced view of planning pressure, delayed risk, and live execution across the audit programme." />
            <div className="dashboard-header-launch">
              <button type="button" className="button button-primary" onClick={() => handleCreateAudit('template')}>
                <ButtonLabel icon="add" label="New Audit" />
              </button>
              <Link to="/audits" className="button button-secondary">
                <ButtonLabel icon="library" label="Audit Library" />
              </Link>
              <Link to={currentCalendarPath} className="button button-secondary">
                <ButtonLabel icon="calendar" label="Audit Planning" />
              </Link>
            </div>
          </div>
        }
      />

      <div className="dashboard-top-row">
        <section className="dashboard-pulse">
          <div className="dashboard-pulse-main">
            <div className="dashboard-pulse-head">
              <div className="dashboard-pulse-heading">
                <span className="dashboard-pulse-label">{portfolioOverviewLabel}</span>
                <div className="dashboard-pulse-heading-row">
                  <div className="dashboard-pulse-inline-badges" aria-label="Most common standards in this view">
                    {pulseFeaturedStandards.map(({ standard, count }) => (
                      <span key={standard} className={`dashboard-standard-chip dashboard-standard-chip-inline dashboard-standard-${getStandardToneKey(standard)}`}>
                        <span>{standard}</span>
                        <strong>{count}</strong>
                      </span>
                    ))}
                    {!pulseFeaturedStandards.length ? <span className="dashboard-empty-note">No audits in this slice.</span> : null}
                  </div>
                </div>
              </div>
              <div className="dashboard-pulse-toolbar">
                <div className="dashboard-pulse-filters">
                  <div className="portfolio-slicer-group dashboard-pulse-month-group">
                    <span className="portfolio-slicer-label">Month</span>
                    <div className="portfolio-slicer-pills">
                      <button
                        type="button"
                        className={`portfolio-slicer-pill ${portfolioMonth === 'all' ? 'portfolio-slicer-pill-active' : ''}`}
                        onClick={() => {
                          setPortfolioMonth('all')
                          setPortfolioHoverStatus(null)
                        }}
                      >
                        All
                      </button>
                      {planningMonthLabels.map((month, idx) => (
                      <button
                        key={month}
                        type="button"
                        className={`portfolio-slicer-pill ${portfolioMonth === idx + 1 ? 'portfolio-slicer-pill-active' : ''}`}
                          onClick={() => {
                            setPortfolioMonth(idx + 1)
                            setPortfolioHoverStatus(null)
                          }}
                        >
                          {month.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="dashboard-pulse-summary">
            <div className="dashboard-pulse-summary-card dashboard-pulse-summary-total">
              <strong>{portfolioSummary.total}</strong>
              <span>audits in scope</span>
            </div>
            <div className="dashboard-pulse-summary-card dashboard-pulse-summary-rate">
              <strong>{portfolioCompletionRate}%</strong>
              <span>completion rate</span>
            </div>
          </div>

            <div className="dashboard-pulse-status-zone">
              <div className="dashboard-segment-bar" aria-label={`${portfolioPeriodLabel} programme status`}>
                {portfolioStatusSegments.filter((segment) => segment.value > 0).map((segment) => {
                  const total = portfolioStatusSegments.reduce((sum, item) => sum + item.value, 0) || 1
                  return (
                    <button
                      key={segment.label}
                      type="button"
                      className={`dashboard-segment dashboard-segment-${segment.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      style={{ width: `${(segment.value / total) * 100}%` }}
                      title={`${getStatusDisplayLabel(segment.label)}: ${segment.value}`}
                      aria-label={`${getStatusDisplayLabel(segment.label)}: ${segment.value}`}
                      onMouseEnter={(event) => showPortfolioHoverAtPointer(segment.label, event.clientX, event.clientY)}
                      onMouseMove={(event) => showPortfolioHoverAtPointer(segment.label, event.clientX, event.clientY)}
                      onMouseLeave={() => clearPortfolioHover()}
                      onFocus={(event) => showPortfolioHoverAtElement(segment.label, event.currentTarget)}
                      onBlur={() => clearPortfolioHover()}
                    />
                  )
                })}
              </div>

              <div className="dashboard-kpi-grid">
              <DashboardMetric
                label="Completed"
                value={portfolioSummary.completed}
                tone="green"
                helper="Closed"
                onClick={() => openAuditDrilldown('Completed')}
                active={portfolioHoverStatus === 'Completed'}
                onHoverStart={(event) => {
                  if ('clientX' in event) {
                    showPortfolioHoverAtPointer('Completed', event.clientX, event.clientY)
                  } else {
                    showPortfolioHoverAtElement('Completed', event.currentTarget)
                  }
                }}
                onHoverMove={(event) => showPortfolioHoverAtPointer('Completed', event.clientX, event.clientY)}
                onHoverEnd={() => clearPortfolioHover()}
              />
              <DashboardMetric
                label="Planned"
                value={portfolioPlannedCount}
                tone="blue"
                helper="Later in year"
                onClick={() => openPlanningDrilldown('Planned')}
                active={portfolioHoverStatus === 'Planned'}
                onHoverStart={(event) => {
                  if ('clientX' in event) {
                    showPortfolioHoverAtPointer('Planned', event.clientX, event.clientY)
                  } else {
                    showPortfolioHoverAtElement('Planned', event.currentTarget)
                  }
                }}
                onHoverMove={(event) => showPortfolioHoverAtPointer('Planned', event.clientX, event.clientY)}
                onHoverEnd={() => clearPortfolioHover()}
              />
              <DashboardMetric
                label="Upcoming"
                value={portfolioUpcomingCount}
                tone="yellow"
                helper="Next 30 days"
                onClick={() => openPlanningDrilldown('Upcoming')}
                active={portfolioHoverStatus === 'Upcoming'}
                onHoverStart={(event) => {
                  if ('clientX' in event) {
                    showPortfolioHoverAtPointer('Upcoming', event.clientX, event.clientY)
                  } else {
                    showPortfolioHoverAtElement('Upcoming', event.currentTarget)
                  }
                }}
                onHoverMove={(event) => showPortfolioHoverAtPointer('Upcoming', event.clientX, event.clientY)}
                onHoverEnd={() => clearPortfolioHover()}
              />
              <DashboardMetric
                label="In progress"
                value={portfolioSummary.inProgress}
                tone="orange"
                helper="Underway"
                onClick={() => openAuditDrilldown('In progress')}
                active={portfolioHoverStatus === 'In progress'}
                onHoverStart={(event) => {
                  if ('clientX' in event) {
                    showPortfolioHoverAtPointer('In progress', event.clientX, event.clientY)
                  } else {
                    showPortfolioHoverAtElement('In progress', event.currentTarget)
                  }
                }}
                onHoverMove={(event) => showPortfolioHoverAtPointer('In progress', event.clientX, event.clientY)}
                onHoverEnd={() => clearPortfolioHover()}
              />
              <DashboardMetric
                label="Delayed"
                value={portfolioOverdueCount}
                tone="red"
                helper="Needs action"
                onClick={() => openAuditDrilldown(undefined, 'delayed')}
                active={portfolioHoverStatus === 'Overdue'}
                onHoverStart={(event) => {
                  if ('clientX' in event) {
                    showPortfolioHoverAtPointer('Overdue', event.clientX, event.clientY)
                  } else {
                    showPortfolioHoverAtElement('Overdue', event.currentTarget)
                  }
                }}
                onHoverMove={(event) => showPortfolioHoverAtPointer('Overdue', event.clientX, event.clientY)}
                onHoverEnd={() => clearPortfolioHover()}
              />
            </div>
            </div>
          </div>
        </section>

        <section className="dashboard-widget dashboard-widget-danger dashboard-priority-widget">
          <div className="dashboard-widget-header">
            <div className="dashboard-priority-heading">
              <span className="dashboard-widget-kicker">Action follow-up</span>
            </div>
            <div className="dashboard-priority-meta">
              <span className="dashboard-priority-summary-inline">{actionSummary}</span>
              <Link to="/audits" className="button button-secondary button-small">
                <ButtonLabel icon="open" label="Open actions" />
              </Link>
            </div>
          </div>
          <div className="dashboard-priority-scroll">
            <div className="dashboard-action-list dashboard-action-list-compact">
              {openActionRecords.length ? openActionRecords.map(({ audit, action, overdue }) => (
                <Link key={action.id} to={getActionPlanPath(audit)} className={`dashboard-action-card dashboard-action-card-compact ${overdue ? 'dashboard-action-overdue' : ''}`}>
                  <div className="dashboard-action-topline">
                    <StatusBadge value={overdue ? 'Overdue' : action.status} />
                    {action.dueDate ? <DashboardMetaPill detail={formatDate(action.dueDate)} tone={overdue ? 'red' : 'sand'} /> : <DashboardMetaPill detail="No due date" tone="slate" />}
                  </div>
                  <strong className="dashboard-action-finding">{action.finding}</strong>
                  <div className="dashboard-action-meta dashboard-action-meta-compact">
                    <p>{action.section} · {action.owner || 'Owner TBD'}</p>
                    <span className={`dashboard-standard-chip dashboard-standard-${getStandardToneKey(audit.standard || getAuditTypeLabel(audit.auditType))}`}>
                      {audit.standard || getAuditTypeLabel(audit.auditType)}
                    </span>
                  </div>
                </Link>
              )) : (
                <div className="dashboard-action-empty">
                  <strong>No open actions</strong>
                  <p>All follow-up items are currently closed.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {portfolioHoverStatus && hoveredStatusRecords.length && portfolioHoverCardPosition ? (
        <div
          className="portfolio-hover-card portfolio-hover-card-floating portfolio-hover-card-active"
          aria-live="polite"
          style={{ left: `${portfolioHoverCardPosition.left}px`, top: `${portfolioHoverCardPosition.top}px` }}
        >
          <div className="portfolio-hover-header">
            <span className="portfolio-hover-title">{getStatusDisplayLabel(portfolioHoverStatus)}</span>
            <strong>{activeStatusCount}</strong>
          </div>
          <div className="portfolio-hover-list">
            {hoveredStatusRecordPreview.map((record) => {
              const dateMeta = getPortfolioHoverDate(record, currentDate)

              return (
                <div key={record.id} className="portfolio-hover-item">
                  <strong>{record.standard}</strong>
                  <span>{record.title}</span>
                  <time className="portfolio-hover-date" dateTime={dateMeta.dateTime}>
                    {dateMeta.label} · {dateMeta.value}
                  </time>
                </div>
              )
            })}
            {hoveredStatusRecords.length > hoveredStatusRecordPreview.length ? (
              <span className="portfolio-hover-more">+{hoveredStatusRecords.length - hoveredStatusRecordPreview.length} more in this view</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="dashboard-main-grid">
        <section ref={calendarPanelRef} className="dashboard-widget dashboard-widget-calendar" aria-label="Audit density">
          <div className="dashboard-widget-header">
            <div className="dashboard-widget-heading">
              <span className="dashboard-widget-kicker">Audit Calendar</span>
            </div>
            <Link to={currentCalendarPath} className="button button-secondary button-small">
              <ButtonLabel icon="calendar" label="Open calendar" />
            </Link>
          </div>
          <div className="dashboard-month-grid">
            {monthGroups.map((month) => {
              const monthStandards = [...new Set(month.records.map((record) => record.standard))].slice(0, 2)
              const delayedRecords = month.records.filter((record) => getDashboardPlanStatus(record) === 'Overdue')
              const delayedCount = delayedRecords.length
              const showDelayedCount = isPastPlanningMonth(currentYear, month.month, currentDate)
              const isCurrentMonth = currentYear === currentDate.getFullYear() && month.month === currentDate.getMonth() + 1

              return (
                <Link
                  key={month.month}
                  to={getPlanningCalendarPath({ year: currentYear, month: month.month })}
                  className={`dashboard-month-card dashboard-month-density-${getMonthDensityLevel(month.records.length, maxMonthLoad)} ${isCurrentMonth ? 'dashboard-month-card-current' : ''}`.trim()}
                >
                  <div className="dashboard-month-head">
                    <div className="dashboard-month-heading">
                      <strong>{month.label}</strong>
                      {showDelayedCount && delayedCount ? (
                        <span className="dashboard-month-delay-hover" tabIndex={0} aria-label={`${delayedCount} delayed audits`}>
                          <span className="dashboard-month-delay-bubble" aria-hidden="true">
                            {delayedCount}
                          </span>
                          <span className="dashboard-month-delay-hover-card" aria-hidden="true">
                            <span className="dashboard-month-delay-hover-title">Delayed audits</span>
                            <span className="dashboard-month-delay-hover-list">
                              {delayedRecords.slice(0, 4).map((record) => (
                                <span key={record.id} className="dashboard-month-delay-hover-item">
                                  <strong>{record.standard}</strong>
                                  <span>{record.title}</span>
                                  <time dateTime={record.plannedEnd}>Delayed since {formatDate(record.plannedEnd)}</time>
                                </span>
                              ))}
                              {delayedRecords.length > 4 ? (
                                <span className="dashboard-month-delay-hover-more">+{delayedRecords.length - 4} more delayed</span>
                              ) : null}
                            </span>
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <span className="dashboard-month-count">{month.records.length}</span>
                  </div>
                  <div className="dashboard-month-standards">
                    {monthStandards.length ? monthStandards.map((standard) => (
                      <span key={standard} className={`dashboard-standard-chip dashboard-standard-${getStandardToneKey(standard)}`}>
                        {standard}
                      </span>
                    )) : <span className="dashboard-empty-note">No audits</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="dashboard-widget dashboard-widget-timeline" aria-label="Upcoming timeline" style={timelinePanelStyle}>
          <div className="dashboard-widget-header">
            <div className="dashboard-widget-heading">
              <span className="dashboard-widget-kicker">Upcoming Audits</span>
            </div>
            <Link to="/planning" className="button button-secondary button-small">
              <ButtonLabel icon="open" label="Planning board" />
            </Link>
          </div>
          <div className="dashboard-timeline-list">
            {upcomingPlans.map((record) => {
              const planStatus = getDashboardPlanStatus(record)
              const planStatusKey = planStatus.toLowerCase().replace(/[^a-z0-9]+/g, '-')

              return (
                <Link
                  key={record.id}
                  to={getPlanningLink(record, audits)}
                  className={`dashboard-timeline-item dashboard-timeline-item-${planStatusKey}`}
                >
                  <div className={`dashboard-timeline-marker status-${planStatusKey}`} />
                  <div className="dashboard-timeline-copy">
                    <div className="dashboard-timeline-title">
                      <strong>{record.title}</strong>
                    </div>
                    <p>{record.owner} · {record.site}</p>
                    <div className="dashboard-timeline-meta">
                      <time className={`dashboard-timeline-date dashboard-timeline-date-${planStatusKey}`} dateTime={record.plannedStart}>
                        {formatDate(record.plannedStart)}
                      </time>
                      <span>{getPlanWindowLabel(record)}</span>
                      <span className={`dashboard-standard-chip dashboard-standard-${getStandardToneKey(record.standard)}`}>{record.standard}</span>
                    </div>
                    <div className="dashboard-timeline-trace">
                      <span>{record.auditId}</span>
                      <span>{record.updatedBy}</span>
                      <span>{formatDate(record.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="dashboard-widget dashboard-widget-recent">
          <div className="dashboard-widget-header">
            <div>
              <span className="dashboard-widget-kicker">Execution</span>
              <h2>Recent audits</h2>
            </div>
            <Link to="/audits" className="button button-secondary button-small">
              <ButtonLabel icon="library" label="Open library" />
            </Link>
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
                <div className="dashboard-audit-meta">
                  <span>{audit.owner || 'Owner TBD'}</span>
                  <span>{audit.site || 'Site TBD'}</span>
                  <DashboardMetaPill detail={`${formatDate(audit.updatedAt)} at ${formatTimeOnly(audit.updatedAt)}`} tone="slate" />
                </div>
                <div className="dashboard-audit-trace">
                  <span>{audit.auditId}</span>
                  <span>{audit.updatedBy}</span>
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
