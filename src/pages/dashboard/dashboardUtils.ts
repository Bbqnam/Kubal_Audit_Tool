import { getAuditRecordHomePath, getPlanningCalendarPath } from '../../data/navigation'
import { getDerivedPlanStatus } from '../../features/planning/services/planningUtils'
import type { ActionPlanStatus, AuditRecord } from '../../types/audit'
import type { AuditPlanRecord } from '../../types/planning'
import { formatDate } from '../../utils/dateUtils'

export type DashboardPlanStatus = 'Completed' | 'Planned' | 'Upcoming' | 'In progress' | 'Overdue'

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

export function getDashboardPlanStatus(record: AuditPlanRecord, referenceDate = new Date()): DashboardPlanStatus {
  const derivedStatus = getDerivedPlanStatus(record, referenceDate)

  if (derivedStatus === 'Completed' || derivedStatus === 'In progress' || derivedStatus === 'Overdue') {
    return derivedStatus
  }

  return getDaysUntil(record.plannedStart, referenceDate) <= 30 ? 'Upcoming' : 'Planned'
}

export function normalizeProgressPercent(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(value)))
}

export function getActionPlanPath(record: AuditRecord) {
  return `/audits/${record.id}/${record.auditType}/action-plan`
}

export function getPlanningLink(record: AuditPlanRecord, audits: AuditRecord[]) {
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

export function getMonthDensityLevel(count: number, maxCount: number) {
  if (count === 0) {
    return 'zero'
  }

  const ratio = count / Math.max(1, maxCount)
  if (ratio >= 0.8) return '4'
  if (ratio >= 0.55) return '3'
  if (ratio >= 0.3) return '2'
  return '1'
}

export function isPastPlanningMonth(year: number, month: number, referenceDate = new Date()) {
  const referenceYear = referenceDate.getFullYear()
  const referenceMonth = referenceDate.getMonth() + 1
  if (year < referenceYear) return true
  if (year > referenceYear) return false
  return month < referenceMonth
}

export function formatTimeOnly(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getActionPreviewPriority(status: ActionPlanStatus) {
  switch (status) {
    case 'In progress':
      return 0
    case 'Open':
      return 1
    default:
      return 2
  }
}

export function getPortfolioHoverDate(record: AuditPlanRecord, referenceDate = new Date()) {
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
