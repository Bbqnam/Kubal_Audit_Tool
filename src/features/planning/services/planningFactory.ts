import type {
  AuditPlanChangeHistoryEntry,
  AuditPlanCompletionResult,
  AuditPlanRecord,
  AuditPlanStatus,
  PlanningActivityEntityType,
  PlanningActivityLogEntry,
  PlanningActorSnapshot,
  PlanningHistoryAction,
} from '../../../types/planning'
import { createAuditReferenceId, DEFAULT_PLANNING_ACTOR } from '../../../utils/traceability'

const DEFAULT_PLANNING_POSITION = 'System'

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

export function resolvePlanningActor(actor?: Partial<PlanningActorSnapshot> | null): PlanningActorSnapshot {
  return {
    name: actor?.name?.trim() || DEFAULT_PLANNING_ACTOR,
    position: actor?.position?.trim() || DEFAULT_PLANNING_POSITION,
  }
}

export function buildPlanHistoryEntry(
  action: PlanningHistoryAction,
  summary: string,
  timestamp = createPlanningTimestamp(),
  actor?: Partial<PlanningActorSnapshot> | null,
): AuditPlanChangeHistoryEntry {
  const resolvedActor = resolvePlanningActor(actor)

  return {
    id: createId('plan-history'),
    timestamp,
    action,
    summary,
    actorName: resolvedActor.name,
    actorPosition: resolvedActor.position,
  }
}

export function normalizePlanningHistoryEntry(entry: AuditPlanChangeHistoryEntry, fallbackAction: PlanningHistoryAction, fallbackSummary: string) {
  const resolvedActor = resolvePlanningActor({
    name: entry.actorName,
    position: entry.actorPosition,
  })

  return {
    id: entry.id ?? createId('plan-history'),
    timestamp: entry.timestamp ?? createPlanningTimestamp(),
    action: entry.action ?? fallbackAction,
    summary: entry.summary ?? fallbackSummary,
    actorName: resolvedActor.name,
    actorPosition: resolvedActor.position,
  } satisfies AuditPlanChangeHistoryEntry
}

export function createPlanningActivityEntry({
  action,
  summary,
  entityType,
  actor,
  timestamp = createPlanningTimestamp(),
  recordId,
  recordTitle,
  year,
  checklistItemId,
  checklistTitle,
}: {
  action: PlanningHistoryAction
  summary: string
  entityType: PlanningActivityEntityType
  actor?: Partial<PlanningActorSnapshot> | null
  timestamp?: string
  recordId?: string | null
  recordTitle?: string | null
  year?: number | null
  checklistItemId?: string | null
  checklistTitle?: string | null
}): PlanningActivityLogEntry {
  const resolvedActor = resolvePlanningActor(actor)

  return {
    id: createId('planning-activity'),
    timestamp,
    action,
    summary,
    actorName: resolvedActor.name,
    actorPosition: resolvedActor.position,
    entityType,
    recordId: recordId ?? null,
    recordTitle: recordTitle ?? null,
    year: year ?? null,
    checklistItemId: checklistItemId ?? null,
    checklistTitle: checklistTitle ?? null,
  }
}

export function normalizePlanningActivityEntry(entry: PlanningActivityLogEntry): PlanningActivityLogEntry {
  const resolvedActor = resolvePlanningActor({
    name: entry.actorName,
    position: entry.actorPosition,
  })

  return {
    id: entry.id ?? createId('planning-activity'),
    timestamp: entry.timestamp ?? createPlanningTimestamp(),
    action: entry.action ?? 'Edited',
    summary: entry.summary ?? 'Planning activity recorded.',
    actorName: resolvedActor.name,
    actorPosition: resolvedActor.position,
    entityType: entry.entityType ?? 'Plan record',
    recordId: entry.recordId ?? null,
    recordTitle: entry.recordTitle ?? null,
    year: entry.year ?? null,
    checklistItemId: entry.checklistItemId ?? null,
    checklistTitle: entry.checklistTitle ?? null,
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
        ? record.changeHistory.map((entry) =>
            normalizePlanningHistoryEntry(
              entry,
              record.source === 'seeded-excel' ? 'Imported' : 'Created',
              'Planning record added to workspace.',
            ))
        : [buildPlanHistoryEntry(record.source === 'seeded-excel' ? 'Imported' : 'Created', 'Planning record added to workspace.', record.createdAt ?? now)],
  }
}

export function createPlanRecord(
  input: PlanRecordInput,
  existingAuditIds: Iterable<string> = [],
  actor?: Partial<PlanningActorSnapshot> | null,
): AuditPlanRecord {
  const timestamp = createPlanningTimestamp()
  const orderedDates = ensureDateOrder(input.plannedStart, input.plannedEnd)
  const derived = deriveYearMonth(orderedDates.plannedStart)
  const resolvedActor = resolvePlanningActor(actor)

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
    updatedBy: resolvedActor.name,
    changeHistory: [buildPlanHistoryEntry('Created', 'Planned audit created.', timestamp, resolvedActor)],
  })
}

export function duplicatePlanRecord(
  source: AuditPlanRecord,
  existingAuditIds: Iterable<string> = [],
  actor?: Partial<PlanningActorSnapshot> | null,
) {
  const timestamp = createPlanningTimestamp()
  const resolvedActor = resolvePlanningActor(actor)

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
    updatedBy: resolvedActor.name,
    changeHistory: [buildPlanHistoryEntry('Duplicated', `Planning record duplicated from ${source.title}.`, timestamp, resolvedActor)],
  })
}

export function updatePlanWithHistory(
  record: AuditPlanRecord,
  updates: Partial<AuditPlanRecord>,
  action: PlanningHistoryAction,
  summary: string,
  actor?: Partial<PlanningActorSnapshot> | null,
) {
  const timestamp = createPlanningTimestamp()
  const resolvedActor = resolvePlanningActor(actor)
  const merged = normalizePlanningRecordShape({
    ...record,
    ...updates,
    updatedAt: timestamp,
    updatedBy: updates.updatedBy ?? resolvedActor.name,
    changeHistory: [...record.changeHistory, buildPlanHistoryEntry(action, summary, timestamp, resolvedActor)],
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
