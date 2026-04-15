import type {
  AuditPlanChangeHistoryEntry,
  AuditPlanCompletionResult,
  AuditPlanRecord,
  AuditPlanStatus,
  PlanningHistoryAction,
} from '../../../types/planning'
import { createAuditReferenceId, DEFAULT_PLANNING_ACTOR } from '../../../utils/traceability'

type PlanRecordInput = Omit<
  AuditPlanRecord,
  'id' | 'auditId' | 'year' | 'month' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'changeHistory' | 'actualCompletionDate' | 'completionDateChangeReason' | 'completionResult' | 'completionSummary'
> & {
  actualCompletionDate?: string | null
  completionDateChangeReason?: string
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
    auditId: record.auditId ?? createAuditReferenceId(plannedStart),
    plannedStart: orderedDates.plannedStart,
    plannedEnd: orderedDates.plannedEnd,
    year: derived.year,
    month: derived.month,
    actualCompletionDate: record.actualCompletionDate ?? null,
    completionDateChangeReason: record.completionDateChangeReason ?? '',
    completionResult: record.completionResult ?? '',
    completionSummary: record.completionSummary ?? '',
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? now,
    updatedBy: record.updatedBy ?? DEFAULT_PLANNING_ACTOR,
    changeHistory:
      Array.isArray(record.changeHistory) && record.changeHistory.length
        ? record.changeHistory
        : [buildPlanHistoryEntry(record.source === 'seeded-excel' ? 'Imported' : 'Created', 'Planning record added to workspace.', record.createdAt ?? now)],
  }
}

export function createPlanRecord(input: PlanRecordInput, existingAuditIds: Iterable<string> = []): AuditPlanRecord {
  const timestamp = createPlanningTimestamp()
  const orderedDates = ensureDateOrder(input.plannedStart, input.plannedEnd)
  const derived = deriveYearMonth(orderedDates.plannedStart)

  return normalizePlanningRecordShape({
    ...input,
    id: createId('plan'),
    auditId: createAuditReferenceId(orderedDates.plannedStart, existingAuditIds),
    plannedStart: orderedDates.plannedStart,
    plannedEnd: orderedDates.plannedEnd,
    year: derived.year,
    month: derived.month,
    actualCompletionDate: input.actualCompletionDate ?? null,
    completionDateChangeReason: input.completionDateChangeReason ?? '',
    completionResult: input.completionResult ?? '',
    completionSummary: input.completionSummary ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy: DEFAULT_PLANNING_ACTOR,
    changeHistory: [buildPlanHistoryEntry('Created', 'Planned audit created.', timestamp)],
  })
}

export function duplicatePlanRecord(source: AuditPlanRecord, existingAuditIds: Iterable<string> = []) {
  const timestamp = createPlanningTimestamp()

  return normalizePlanningRecordShape({
    ...source,
    id: createId('plan'),
    auditId: createAuditReferenceId(source.plannedStart || timestamp.slice(0, 10), existingAuditIds),
    status: source.status === 'Cancelled' ? 'Planned' : source.status,
    linkedAuditId: null,
    actualCompletionDate: null,
    completionDateChangeReason: '',
    completionResult: '',
    completionSummary: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy: DEFAULT_PLANNING_ACTOR,
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
    updatedBy: updates.updatedBy ?? DEFAULT_PLANNING_ACTOR,
    changeHistory: [...record.changeHistory, buildPlanHistoryEntry(action, summary, timestamp)],
  })

  if (merged.status !== 'Completed') {
    return {
      ...merged,
      actualCompletionDate: updates.actualCompletionDate ?? null,
      completionDateChangeReason: updates.completionDateChangeReason ?? '',
      completionResult: updates.completionResult ?? '',
      completionSummary: updates.completionSummary ?? '',
    }
  }

  return merged
}

export function getPlanStatusAfterCompletion(currentStatus: AuditPlanStatus) {
  return currentStatus === 'Cancelled' ? 'Cancelled' : 'Completed'
}
