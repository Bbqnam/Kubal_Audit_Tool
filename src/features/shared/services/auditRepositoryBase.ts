import { APP_STORAGE_KEY, LEGACY_APP_STORAGE_KEY } from '../../../data/branding'
import type { AuditRecord } from '../../../types/audit'
import type { AuditPlanRecord, YearlyPlanningChecklistItem } from '../../../types/planning'
import { createSeedPlanningChecklist, createSeedPlanningRecords } from '../../planning/data/planningSeed'
import { normalizePlanningRecordShape } from '../../planning/services/planningFactory'
import { mergePlanningYears } from '../../planning/services/planningUtils'
import { createAuditReferenceId } from '../../../utils/traceability'
import { assignReadableAuditRouteIds, createSeedAuditRecords, normalizeAuditRecordShape, synchronizeAuditRecord } from './auditFactory'

export interface AuditRepository {
  loadWorkspace: () => WorkspaceSnapshot
  saveWorkspace: (snapshot: WorkspaceSnapshot) => void
}

export type WorkspaceSnapshot = {
  audits: AuditRecord[]
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
  const planningRecords = createSeedPlanningRecords()

  return {
    audits: createSeedAuditRecords(),
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
    planningRecords,
    planningYears: mergePlanningYears(planningRecords, rawWorkspace.planningYears),
  }
}
