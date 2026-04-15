import type { AuditType } from '../../../types/audit'
import type { AuditPlanRecord } from '../../../types/planning'
import { getExecutionAuditTypeForPlan } from '../../../data/auditTypes'
import { isPastDate } from '../../../utils/dateUtils'

export const planningMonthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const planningWeekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const processScopedStandards = new Set(['ISO 9001', 'ISO 14001', 'IATF 16949'])

export const defaultPlanningDepartments = [
  'Quality',
  'Operations',
  'Environment',
  'Supply Chain',
  'Moldshop',
  'Sustainability Office',
  'EHS',
  'Finance',
  'Commercial',
] as const

export function mergePlanningYears(records: AuditPlanRecord[], additionalYears: number[] = []) {
  return [
    ...new Set([
      ...records.map((record) => record.year),
      ...additionalYears.filter((year) => Number.isInteger(year) && year > 0),
    ]),
  ].sort((left, right) => left - right)
}

export function getPlanningYears(records: AuditPlanRecord[]) {
  return mergePlanningYears(records)
}

export function getPlanningDepartmentOptions(records: AuditPlanRecord[]) {
  return [...new Set([...defaultPlanningDepartments, ...records.map((record) => record.department).filter(Boolean)])].sort()
}

export function getPlanVisualMeta(record: AuditPlanRecord) {
  const combined = `${record.title} ${record.standard} ${record.auditType} ${record.department} ${record.processArea}`.toLowerCase()

  if (combined.includes('co2')) {
    return {
      key: 'co2-emissions',
      label: 'CO2 Emissions',
      className: 'planning-standard-co2',
    }
  }

  if (record.standard === 'EcoVadis') {
    return {
      key: 'ecovadis-assessment',
      label: 'EcoVadis Assessment',
      className: 'planning-standard-ecovadis',
    }
  }

  if (record.standard === 'ASI') {
    return {
      key: 'asi',
      label: 'ASI',
      className: 'planning-standard-asi',
    }
  }

  if (record.standard === 'ISO 9001') {
    return {
      key: 'iso-9001',
      label: 'ISO 9001',
      className: 'planning-standard-iso',
    }
  }

  if (record.standard === 'ISO 14001') {
    return {
      key: 'iso-14001',
      label: 'ISO 14001',
      className: 'planning-standard-iso',
    }
  }

  if (record.standard === 'IATF 16949') {
    return {
      key: 'iatf-16949',
      label: 'IATF 16949',
      className: 'planning-standard-iso',
    }
  }

  if (record.standard === 'VDA 6.3') {
    return combined.includes('moldshop')
      ? {
          key: 'vda-6-3-moldshop',
          label: 'VDA 6.3 (Moldshop)',
          className: 'planning-standard-vda63',
        }
      : {
          key: 'vda-6-3-process',
          label: 'VDA 6.3 Process',
          className: 'planning-standard-vda63',
        }
  }

  if (record.standard === 'VDA 6.5') {
    return {
      key: 'vda-6-5-product',
      label: 'VDA 6.5 Product',
      className: 'planning-standard-vda65',
    }
  }

  if (record.standard === 'Supplier audits' || combined.includes('supplier')) {
    return {
      key: 'supplier',
      label: 'Supplier',
      className: 'planning-standard-supplier',
    }
  }

  return {
    key: record.standard.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: record.standard || record.title,
    className: 'planning-standard-default',
  }
}

export function getPlanningLegendEntries(records: AuditPlanRecord[]) {
  return records.reduce<Array<{ key: string; label: string; className: string }>>((entries, record) => {
    const meta = getPlanVisualMeta(record)

    if (entries.some((entry) => entry.key === meta.key)) {
      return entries
    }

    entries.push(meta)
    return entries
  }, [])
}

export function comparePlanRecords(left: AuditPlanRecord, right: AuditPlanRecord) {
  return left.plannedStart.localeCompare(right.plannedStart) || left.title.localeCompare(right.title)
}

export function getDerivedPlanStatus(record: AuditPlanRecord, referenceDate = new Date()) {
  if (record.status === 'Completed' || record.status === 'Cancelled') {
    return record.status
  }

  if (record.status === 'Overdue' || isPastDate(record.plannedEnd, referenceDate)) {
    return 'Overdue'
  }

  return record.status
}

export function getPlanMonthLabel(month: number) {
  return planningMonthLabels[month - 1] ?? ''
}

export function getPlanWindowLabel(record: AuditPlanRecord) {
  const start = new Date(record.plannedStart)
  const end = new Date(record.plannedEnd)
  const sameMonth = start.getUTCMonth() === end.getUTCMonth()

  if (sameMonth) {
    return `${getPlanMonthLabel(record.month)} ${start.getUTCDate()}-${end.getUTCDate()}`
  }

  return `${getPlanMonthLabel(start.getUTCMonth() + 1)}-${getPlanMonthLabel(end.getUTCMonth() + 1)}`
}

export function getMonthDateRange(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  return {
    firstDay,
    lastDay,
  }
}

function getMondayIndex(day: number) {
  return (day + 6) % 7
}

function toIsoDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10)
}

function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day))
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function getEasterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return createUtcDate(year, month - 1, day)
}

function getWeekdayOccurrenceDate(year: number, monthIndex: number, startDay: number, endDay: number, weekday: number) {
  for (let day = startDay; day <= endDay; day += 1) {
    const date = createUtcDate(year, monthIndex, day)

    if (date.getUTCDay() === weekday) {
      return date
    }
  }

  return null
}

export function getSwedishHolidayMap(year: number) {
  const easterSunday = getEasterSunday(year)
  const holidays = new Map<string, string>()

  const entries: Array<[Date | null, string]> = [
    [createUtcDate(year, 0, 1), "New Year's Day"],
    [createUtcDate(year, 0, 6), 'Epiphany'],
    [addUtcDays(easterSunday, -2), 'Good Friday'],
    [easterSunday, 'Easter Sunday'],
    [addUtcDays(easterSunday, 1), 'Easter Monday'],
    [createUtcDate(year, 4, 1), 'May Day'],
    [addUtcDays(easterSunday, 39), 'Ascension Day'],
    [addUtcDays(easterSunday, 49), 'Whit Sunday'],
    [createUtcDate(year, 5, 6), 'National Day'],
    [getWeekdayOccurrenceDate(year, 5, 20, 26, 6), "Midsummer Day"],
    [getWeekdayOccurrenceDate(year, 9, 31, 31, 6) ?? getWeekdayOccurrenceDate(year, 10, 1, 6, 6), "All Saints' Day"],
    [createUtcDate(year, 11, 25), 'Christmas Day'],
    [createUtcDate(year, 11, 26), 'Boxing Day'],
  ]

  entries.forEach(([date, label]) => {
    if (date) {
      holidays.set(toIsoDate(date), label)
    }
  })

  return holidays
}

export function shiftIsoDate(value: string, days: number) {
  const nextDate = new Date(`${value}T00:00:00`)
  nextDate.setDate(nextDate.getDate() + days)
  return toIsoDate(nextDate)
}

export function buildPlanningCalendarWeeks(records: AuditPlanRecord[], year: number, month: number) {
  const { firstDay, lastDay } = getMonthDateRange(year, month)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - getMondayIndex(firstDay.getDay()))
  const gridEnd = new Date(lastDay)
  gridEnd.setDate(lastDay.getDate() + (6 - getMondayIndex(lastDay.getDay())))
  const holidayMap = new Map([
    ...getSwedishHolidayMap(gridStart.getFullYear()),
    ...getSwedishHolidayMap(gridEnd.getFullYear()),
  ])
  const todayIso = toIsoDate(new Date())
  const days: Array<{
    isoDate: string
    dateNumber: number
    isCurrentMonth: boolean
    isToday: boolean
    isWeekend: boolean
    holidayLabel: string | null
    records: AuditPlanRecord[]
  }> = []

  for (const cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
    const isoDate = toIsoDate(cursor)
    const weekday = cursor.getDay()
    const dayRecords = records
      .filter((record) => record.plannedStart <= isoDate && record.plannedEnd >= isoDate)
      .sort(comparePlanRecords)

    days.push({
      isoDate,
      dateNumber: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === month - 1,
      isToday: isoDate === todayIso,
      isWeekend: weekday === 0 || weekday === 6,
      holidayLabel: holidayMap.get(isoDate) ?? null,
      records: dayRecords,
    })
  }

  return Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))
}

export function getStandardColorClass(standard: string) {
  if (standard === 'VDA 6.3') {
    return 'planning-standard-vda63'
  }

  if (standard === 'VDA 6.5') {
    return 'planning-standard-vda65'
  }

  if (standard === 'EcoVadis') {
    return 'planning-standard-ecovadis'
  }

  if (standard === 'ASI') {
    return 'planning-standard-asi'
  }

  if (['ISO 9001', 'ISO 14001', 'IATF 16949'].includes(standard)) {
    return 'planning-standard-iso'
  }

  return 'planning-standard-default'
}

export function getPlanColorClass(record: AuditPlanRecord) {
  return getPlanVisualMeta(record).className
}

export function getStatusAccentClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === 'completed') {
    return 'planning-status-accent-completed'
  }

  if (normalized === 'in progress') {
    return 'planning-status-accent-in-progress'
  }

  if (normalized === 'overdue' || normalized === 'cancelled') {
    return 'planning-status-accent-overdue'
  }

  return 'planning-status-accent-planned'
}

export function getPlanStatusDotClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === 'completed') {
    return 'planning-status-dot-completed'
  }

  if (normalized === 'overdue' || normalized === 'cancelled' || normalized === 'delayed') {
    return 'planning-status-dot-overdue'
  }

  if (normalized === 'in progress') {
    return 'planning-status-dot-in-progress'
  }

  return 'planning-status-dot-planned'
}

export function getUpcomingPlanningRecords(records: AuditPlanRecord[], days = 90, referenceDate = new Date()) {
  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  const limit = new Date(start)
  limit.setDate(limit.getDate() + days)

  return records
    .filter((record) => {
      const status = getDerivedPlanStatus(record, referenceDate)
      const plannedStart = new Date(record.plannedStart)

      return status !== 'Completed' && status !== 'Cancelled' && plannedStart >= start && plannedStart <= limit
    })
    .sort(comparePlanRecords)
}

export function getOverduePlanningRecords(records: AuditPlanRecord[], referenceDate = new Date()) {
  return records.filter((record) => getDerivedPlanStatus(record, referenceDate) === 'Overdue').sort(comparePlanRecords)
}

export function getPlanExecutionAuditType(record: AuditPlanRecord): AuditType | null {
  return getExecutionAuditTypeForPlan(record)
}

export function getPlansForYear(records: AuditPlanRecord[], year: number) {
  return records.filter((record) => record.year === year).sort(comparePlanRecords)
}

export function groupPlansByMonth(records: AuditPlanRecord[], year: number) {
  return planningMonthLabels.map((_, index) => ({
    month: index + 1,
    label: planningMonthLabels[index],
    records: getPlansForYear(records, year).filter((record) => record.month === index + 1),
  }))
}

export function groupPlansByStandard(records: AuditPlanRecord[]) {
  return [...records]
    .sort(comparePlanRecords)
    .reduce<Array<{ label: string; records: AuditPlanRecord[] }>>((groups, record) => {
      const existing = groups.find((group) => group.label === record.standard)

      if (existing) {
        existing.records.push(record)
        return groups
      }

      groups.push({ label: record.standard, records: [record] })
      return groups
    }, [])
}

export function countPlansBy<T extends string>(records: AuditPlanRecord[], getKey: (record: AuditPlanRecord) => T) {
  return records.reduce<Record<T, number>>((result, record) => {
    const key = getKey(record)

    if (key in result) {
      result[key] += 1
      return result
    }

    result[key] = 1
    return result
  }, {} as Record<T, number>)
}

export function summarizePlans(records: AuditPlanRecord[], referenceDate = new Date()) {
  return records.reduce(
    (summary, record) => {
      const status = getDerivedPlanStatus(record, referenceDate)
      summary.total += 1

      if (status === 'Completed') {
        summary.completed += 1
      } else if (status === 'Cancelled') {
        summary.cancelled += 1
      } else if (status === 'In progress') {
        summary.inProgress += 1
      } else if (status === 'Overdue') {
        summary.overdue += 1
      } else {
        summary.planned += 1
      }

      return summary
    },
    {
      total: 0,
      planned: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0,
    },
  )
}
