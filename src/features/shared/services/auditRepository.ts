import type { AuditRecord } from '../../../types/audit'
import { APP_STORAGE_KEY, LEGACY_APP_STORAGE_KEY } from '../../../data/branding'
import { createSeedAuditRecords, normalizeAuditRecordShape, synchronizeAuditRecord } from './auditFactory'
import type { AuditPlanRecord, YearlyPlanningChecklistItem } from '../../../types/planning'
import { createSeedPlanningChecklist, createSeedPlanningRecords } from '../../planning/data/planningSeed'
import { normalizePlanningRecordShape } from '../../planning/services/planningFactory'

export type AuditRepository = {
  loadWorkspace: () => WorkspaceSnapshot
  saveWorkspace: (snapshot: WorkspaceSnapshot) => void
}

export type WorkspaceSnapshot = {
  audits: AuditRecord[]
  planningRecords: AuditPlanRecord[]
  planningChecklist: YearlyPlanningChecklistItem[]
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createSeedWorkspace(): WorkspaceSnapshot {
  return {
    audits: createSeedAuditRecords(),
    planningRecords: createSeedPlanningRecords(),
    planningChecklist: createSeedPlanningChecklist(),
  }
}

export function createLocalStorageAuditRepository(): AuditRepository {
  return {
    loadWorkspace: () => {
      if (!hasStorage()) {
        return createSeedWorkspace()
      }

      const rawValue = window.localStorage.getItem(APP_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_APP_STORAGE_KEY)

      if (!rawValue) {
        const seededWorkspace = createSeedWorkspace()
        window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(seededWorkspace))
        return seededWorkspace
      }

      try {
        const parsed = JSON.parse(rawValue) as WorkspaceSnapshot | AuditRecord[]
        const seedWorkspace = createSeedWorkspace()
        const workspace = Array.isArray(parsed)
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
              planningChecklist: Array.isArray(parsed.planningChecklist) ? parsed.planningChecklist : seedWorkspace.planningChecklist,
            }

        window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(workspace))
        if (window.localStorage.getItem(LEGACY_APP_STORAGE_KEY)) {
          window.localStorage.removeItem(LEGACY_APP_STORAGE_KEY)
        }
        return workspace
      } catch {
        const seededWorkspace = createSeedWorkspace()
        window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(seededWorkspace))
        return seededWorkspace
      }
    },
    saveWorkspace: (snapshot) => {
      if (!hasStorage()) {
        return
      }

      window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(snapshot))
    },
  }
}
