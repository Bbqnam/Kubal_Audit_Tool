import type {
  AuditPlanChangeHistoryEntry,
  AuditPlanCompletionResult,
  AuditPlanRecord,
  AuditPlanStatus,
  PlanningHistoryAction,
} from '../../../types/planning'

type PlanRecordInput = Omit<
  AuditPlanRecord,
  'id' | 'year' | 'month' | 'createdAt' | 'updatedAt' | 'changeHistory' | 'actualCompletionDate' | 'completionResult' | 'completionSummary'
> & {
  actualCompletionDate?: string | null
  completionResult?: AuditPlanCompletionResult
  completionSummary?: string
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createPlanningTimestamp() {
  return new Date().toISOString()
}

export function buildPlanHistoryEntry(action: PlanningHistoryAction, summary: string, timestamp = createPlanningTimestamp()): AuditPlanChangeHistoryEntry {
  return {
    id: createId('plan-history'),
    timestamp,
    action,
    summary,
  }
}

function ensureDateOrder(plannedStart: string, plannedEnd: string) {
  if (!plannedStart || !plannedEnd || plannedEnd >= plannedStart) {
    return { plannedStart, plannedEnd }
  }

  return { plannedStart, plannedEnd: plannedStart }
}

function deriveYearMonth(plannedStart: string) {
  const safeDate = plannedStart || new Date().toISOString().slice(0, 10)

  return {
    year: Number(safeDate.slice(0, 4)),
    month: Number(safeDate.slice(5, 7)),
  }
}

export function normalizePlanningRecordShape(record: AuditPlanRecord): AuditPlanRecord {
  const now = record.updatedAt ?? createPlanningTimestamp()
  const plannedStart = record.plannedStart || now.slice(0, 10)
  const plannedEnd = record.plannedEnd || plannedStart
  const orderedDates = ensureDateOrder(plannedStart, plannedEnd)
  const derived = deriveYearMonth(orderedDates.plannedStart)

  return {
    ...record,
    plannedStart: orderedDates.plannedStart,
    plannedEnd: orderedDates.plannedEnd,
    year: derived.year,
    month: derived.month,
    actualCompletionDate: record.actualCompletionDate ?? null,
    completionResult: record.completionResult ?? '',
    completionSummary: record.completionSummary ?? '',
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? now,
    changeHistory:
      Array.isArray(record.changeHistory) && record.changeHistory.length
        ? record.changeHistory
        : [buildPlanHistoryEntry(record.source === 'seeded-excel' ? 'Imported' : 'Created', 'Planning record added to workspace.', record.createdAt ?? now)],
  }
}

export function createPlanRecord(input: PlanRecordInput): AuditPlanRecord {
  const timestamp = createPlanningTimestamp()
  const orderedDates = ensureDateOrder(input.plannedStart, input.plannedEnd)
  const derived = deriveYearMonth(orderedDates.plannedStart)

  return normalizePlanningRecordShape({
    ...input,
    id: createId('plan'),
    plannedStart: orderedDates.plannedStart,
    plannedEnd: orderedDates.plannedEnd,
    year: derived.year,
    month: derived.month,
    actualCompletionDate: input.actualCompletionDate ?? null,
    completionResult: input.completionResult ?? '',
    completionSummary: input.completionSummary ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
    changeHistory: [buildPlanHistoryEntry('Created', 'Planned audit created.', timestamp)],
  })
}

export function duplicatePlanRecord(source: AuditPlanRecord) {
  const timestamp = createPlanningTimestamp()

  return normalizePlanningRecordShape({
    ...source,
    id: createId('plan'),
    status: source.status === 'Cancelled' ? 'Planned' : source.status,
    linkedAuditId: null,
    actualCompletionDate: null,
    completionResult: '',
    completionSummary: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    changeHistory: [
      ...source.changeHistory,
      buildPlanHistoryEntry('Duplicated', `Planning record duplicated from ${source.title}.`, timestamp),
    ],
  })
}

export function updatePlanWithHistory(
  record: AuditPlanRecord,
  updates: Partial<AuditPlanRecord>,
  action: PlanningHistoryAction,
  summary: string,
) {
  const timestamp = createPlanningTimestamp()
  const merged = normalizePlanningRecordShape({
    ...record,
    ...updates,
    updatedAt: timestamp,
    changeHistory: [...record.changeHistory, buildPlanHistoryEntry(action, summary, timestamp)],
  })

  if (merged.status !== 'Completed') {
    return {
      ...merged,
      actualCompletionDate: updates.actualCompletionDate ?? null,
      completionResult: updates.completionResult ?? '',
      completionSummary: updates.completionSummary ?? '',
    }
  }

  return merged
}

export function getPlanStatusAfterCompletion(currentStatus: AuditPlanStatus) {
  return currentStatus === 'Cancelled' ? 'Cancelled' : 'Completed'
}
