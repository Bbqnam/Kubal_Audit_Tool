import { APP_STORAGE_KEY, LEGACY_APP_STORAGE_KEY } from '../../../data/branding'
import type { WorkspaceUser } from '../../../types/access'
import type { AuditHistoryEntry, AuditRecord } from '../../../types/audit'
import type { AuditPlanRecord, YearlyPlanningChecklistItem } from '../../../types/planning'
import { createSeedPlanningChecklist, createSeedPlanningRecords } from '../../planning/data/planningSeed'
import { normalizePlanningRecordShape } from '../../planning/services/planningFactory'
import { mergePlanningYears } from '../../planning/services/planningUtils'
import { createAuditReferenceId } from '../../../utils/traceability'
import { assignReadableAuditRouteIds, createSeedAuditRecords, normalizeAuditRecordShape, synchronizeAuditRecord } from './auditFactory'
import { mergeWorkspaceUsers } from '../../../utils/userDirectory'

export interface AuditRepository {
  loadWorkspace: () => WorkspaceSnapshot
  saveWorkspace: (snapshot: WorkspaceSnapshot) => void
}

export type WorkspaceSnapshot = {
  audits: AuditRecord[]
  auditLibraryHistory: AuditHistoryEntry[]
  users: WorkspaceUser[]
  planningRecords: AuditPlanRecord[]
  planningYears: number[]
  planningChecklist: YearlyPlanningChecklistItem[]
}

export function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function cloneWorkspaceSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as WorkspaceSnapshot
}

export function createSeedWorkspace(): WorkspaceSnapshot {
  const audits = createSeedAuditRecords()
  const planningRecords = createSeedPlanningRecords()

  return {
    audits,
    auditLibraryHistory: [],
    users: mergeWorkspaceUsers([]),
    planningRecords,
    planningYears: mergePlanningYears(planningRecords),
    planningChecklist: createSeedPlanningChecklist(),
  }
}

export function getPrimaryWorkspaceStorageValue() {
  if (!hasStorage()) {
    return null
  }

  return window.localStorage.getItem(APP_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_APP_STORAGE_KEY)
}

export function persistWorkspaceToStorage(snapshot: WorkspaceSnapshot) {
  if (!hasStorage()) {
    return
  }

  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(snapshot))
}

export function finalizePrimaryStorageMigration() {
  if (!hasStorage()) {
    return
  }

  if (window.localStorage.getItem(LEGACY_APP_STORAGE_KEY)) {
    window.localStorage.removeItem(LEGACY_APP_STORAGE_KEY)
  }
}

function ensureTraceabilityIds(audits: AuditRecord[], planningRecords: AuditPlanRecord[]) {
  const usedAuditIds = new Set<string>()

  const normalizedPlanningRecords = planningRecords.map((record) => {
    const plannedAuditId = record.auditId && !usedAuditIds.has(record.auditId)
      ? record.auditId
      : createAuditReferenceId(record.plannedStart, usedAuditIds)
    usedAuditIds.add(plannedAuditId)

    return {
      ...record,
      auditId: plannedAuditId,
    }
  })

  const planAuditIdMap = new Map(normalizedPlanningRecords.map((record) => [record.id, record.auditId]))
  const normalizedAudits = audits.map((record) => {
    const linkedAuditId = record.planRecordId ? planAuditIdMap.get(record.planRecordId) : null
    const resolvedAuditId = linkedAuditId
      ?? (record.auditId && !usedAuditIds.has(record.auditId) ? record.auditId : createAuditReferenceId(record.auditDate, usedAuditIds))
    usedAuditIds.add(resolvedAuditId)

    return {
      ...record,
      auditId: resolvedAuditId,
    }
  })

  return {
    audits: normalizedAudits,
    planningRecords: normalizedPlanningRecords,
  }
}

function inferHistorySubjectAuditId(entry: AuditHistoryEntry) {
  if (entry.subjectAuditId) {
    return entry.subjectAuditId
  }

  const matches = entry.description.match(/AUD-\d{4}-\d{3}/g)

  if (!matches?.length) {
    return undefined
  }

  return entry.actionType === 'duplicated' && matches.length > 1 ? matches[matches.length - 1] : matches[0]
}

function inferHistorySubjectLabel(entry: AuditHistoryEntry, subjectAuditId?: string) {
  if (entry.subjectLabel) {
    return entry.subjectLabel
  }

  const labelMatch = entry.description.match(/(AUD-\d{4}-\d{3}\s·\s.+?)(?=\.|:| from planning record| from the audit library|$)/)

  return labelMatch?.[1]?.trim() ?? subjectAuditId
}

function normalizeAuditLibraryHistory(history: AuditHistoryEntry[]) {
  return history.reduce<AuditHistoryEntry[]>((current, entry) => {
    const subjectAuditId = inferHistorySubjectAuditId(entry)
    const subjectLabel = inferHistorySubjectLabel(entry, subjectAuditId)
    const normalizedEntry: AuditHistoryEntry = {
      ...entry,
      actionType: entry.actionType === 'status change' ? 'updated' : entry.actionType,
      description: (entry.actionType === 'updated' || entry.actionType === 'status change')
        ? `Edited ${subjectLabel ?? subjectAuditId ?? 'audit record'}.`
        : entry.description,
      subjectAuditId,
      subjectLabel,
    }

    if (normalizedEntry.actionType !== 'updated' || !normalizedEntry.subjectAuditId) {
      return [...current, normalizedEntry]
    }

    const existingIndex = current.findLastIndex((candidate) =>
      candidate.actionType === 'updated' && candidate.subjectAuditId === normalizedEntry.subjectAuditId,
    )

    if (existingIndex === -1) {
      return [...current, normalizedEntry]
    }

    return current.map((candidate, index) => (index === existingIndex ? normalizedEntry : candidate))
  }, [])
}

export function hydrateWorkspaceSnapshot(parsed: WorkspaceSnapshot | AuditRecord[]): WorkspaceSnapshot {
  const seedWorkspace = createSeedWorkspace()
  const rawWorkspace = Array.isArray(parsed)
    ? {
              ...seedWorkspace,
              audits: parsed.map((record) => synchronizeAuditRecord(normalizeAuditRecordShape(record), record.updatedAt)),
            }
    : {
        audits: Array.isArray(parsed.audits)
          ? parsed.audits.map((record) => synchronizeAuditRecord(normalizeAuditRecordShape(record), record.updatedAt))
          : seedWorkspace.audits,
        auditLibraryHistory: Array.isArray((parsed as WorkspaceSnapshot).auditLibraryHistory)
          ? normalizeAuditLibraryHistory((parsed as WorkspaceSnapshot).auditLibraryHistory)
          : seedWorkspace.auditLibraryHistory,
        users: Array.isArray((parsed as WorkspaceSnapshot).users) ? (parsed as WorkspaceSnapshot).users : seedWorkspace.users,
        planningRecords: Array.isArray(parsed.planningRecords)
          ? parsed.planningRecords.map((record) => normalizePlanningRecordShape(record))
          : seedWorkspace.planningRecords,
        planningYears: mergePlanningYears(
          Array.isArray(parsed.planningRecords)
            ? parsed.planningRecords.map((record) => normalizePlanningRecordShape(record))
            : seedWorkspace.planningRecords,
          Array.isArray(parsed.planningYears) ? parsed.planningYears : seedWorkspace.planningYears,
        ),
        planningChecklist: Array.isArray(parsed.planningChecklist) ? parsed.planningChecklist : seedWorkspace.planningChecklist,
      }

  const traceableWorkspace = ensureTraceabilityIds(rawWorkspace.audits, rawWorkspace.planningRecords)
  const { audits, idMap } = assignReadableAuditRouteIds(traceableWorkspace.audits)
  const planningRecords = traceableWorkspace.planningRecords.map((record) => {
    if (!record.linkedAuditId) {
      return record
    }

    return {
      ...record,
      linkedAuditId: idMap.get(record.linkedAuditId) ?? record.linkedAuditId,
    }
  })

  return {
    ...rawWorkspace,
    audits,
    users: mergeWorkspaceUsers(rawWorkspace.users ?? seedWorkspace.users),
    planningRecords,
    planningYears: mergePlanningYears(planningRecords, rawWorkspace.planningYears),
  }
}
