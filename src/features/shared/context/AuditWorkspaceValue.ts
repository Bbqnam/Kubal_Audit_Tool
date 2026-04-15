import { createContext } from 'react'
import type {
  AuditRecord,
  AuditType,
  SaveState,
} from '../../../types/audit'
import type { AuditPlanRecord, PlanningChecklistYearStatus, YearlyPlanningChecklistItem } from '../../../types/planning'
import type { MergeResult } from '../services/fileTransfer'

export type AuditWorkspaceContextValue = {
  audits: AuditRecord[]
  planningRecords: AuditPlanRecord[]
  planningYears: number[]
  planningChecklist: YearlyPlanningChecklistItem[]
  saveState: SaveState
  lastSavedAt: string | null
  createAudit: (auditType: AuditType) => AuditRecord
  createAuditFromPlan: (planId: string) => AuditRecord | null
  createPlanRecord: (record: Omit<AuditPlanRecord, 'id' | 'auditId' | 'year' | 'month' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'changeHistory' | 'actualCompletionDate' | 'completionDateChangeReason' | 'completionResult' | 'completionSummary'> & {
    actualCompletionDate?: string | null
    completionDateChangeReason?: string
    completionResult?: AuditPlanRecord['completionResult']
    completionSummary?: string
  }) => AuditPlanRecord
  duplicatePlanRecord: (id: string) => AuditPlanRecord | null
  duplicateAudit: (id: string) => AuditRecord | null
  changeAuditType: (id: string, auditType: AuditType) => AuditRecord | null
  deleteAudit: (id: string) => void
  deletePlanRecord: (id: string) => void
  getAuditById: (id: string) => AuditRecord | undefined
  getPlanById: (id: string) => AuditPlanRecord | undefined
  updateAuditRecord: (id: string, updater: (record: AuditRecord) => AuditRecord) => void
  updatePlanRecord: (id: string, updater: (record: AuditPlanRecord) => AuditPlanRecord) => void
  importAudits: (records: AuditRecord[]) => MergeResult<AuditRecord>
  importPlanningRecords: (records: AuditPlanRecord[]) => MergeResult<AuditPlanRecord>
  addPlanningYear: (year: number) => void
  deletePlanningYear: (year: number) => void
  updatePlanningChecklistYear: (id: string, year: number, status: PlanningChecklistYearStatus) => void
}

export const AuditWorkspaceContext = createContext<AuditWorkspaceContextValue | null>(null)
