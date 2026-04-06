import { useEffect, useMemo, useRef, useState } from 'react'
import type { AuditRecord } from '../../../types/audit'
import type { AuditPlanRecord } from '../../../types/planning'
import { AuditWorkspaceContext } from './AuditWorkspaceValue'
import type { AuditWorkspaceContextValue } from './AuditWorkspaceValue'
import { changeAuditRecordType, createAuditRecord, duplicateAuditRecord, synchronizeAuditRecord } from '../services/auditFactory'
import { createLocalStorageAuditRepository } from '../services/auditRepository'
import { getPlanExecutionAuditType, mergePlanningYears } from '../../planning/services/planningUtils'
import {
  createPlanRecord as createPlanningRecord,
  duplicatePlanRecord as duplicatePlanningRecord,
  normalizePlanningRecordShape,
  updatePlanWithHistory,
} from '../../planning/services/planningFactory'

export function AuditWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const repository = useMemo(() => createLocalStorageAuditRepository(), [])
  const isFirstRender = useRef(true)
  const initialWorkspace = useMemo(() => repository.loadWorkspace(), [repository])
  const [audits, setAudits] = useState<AuditRecord[]>(initialWorkspace.audits)
  const [planningRecords, setPlanningRecords] = useState<AuditPlanRecord[]>(initialWorkspace.planningRecords)
  const [storedPlanningYears, setStoredPlanningYears] = useState<number[]>(initialWorkspace.planningYears)
  const [planningChecklist, setPlanningChecklist] = useState(initialWorkspace.planningChecklist)
  const [saveState, setSaveState] = useState<AuditWorkspaceContextValue['saveState']>('Saved')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => audits[0]?.updatedAt ?? null)
  const planningYears = useMemo(
    () => mergePlanningYears(planningRecords, storedPlanningYears),
    [planningRecords, storedPlanningYears],
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timeoutId = window.setTimeout(() => {
      repository.saveWorkspace({ audits, planningRecords, planningYears, planningChecklist })
      setSaveState('Saved')
      setLastSavedAt(new Date().toISOString())
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [audits, planningChecklist, planningRecords, planningYears, repository])

  const value = useMemo<AuditWorkspaceContextValue>(
    () => ({
      audits,
      planningRecords,
      planningYears,
      planningChecklist,
      saveState,
      lastSavedAt,
      createAudit: (auditType) => {
        const newRecord = createAuditRecord(auditType)
        setSaveState('Saving')
        setAudits((current) => [newRecord, ...current])
        return newRecord
      },
      createPlanRecord: (record) => {
        const newPlanRecord = createPlanningRecord(record)
        setSaveState('Saving')
        setPlanningRecords((current) => [newPlanRecord, ...current])
        return newPlanRecord
      },
      createAuditFromPlan: (planId) => {
        const plan = planningRecords.find((record) => record.id === planId)
        const executionAuditType = plan ? getPlanExecutionAuditType(plan) : null

        if (!plan || !executionAuditType) {
          return null
        }

        const baseRecord = createAuditRecord(executionAuditType)
        const reference = `${plan.standard}-${plan.year}-${String(plan.month).padStart(2, '0')}`
        const scope = `${plan.standard} / ${plan.processArea}`
        const hydratedRecord = synchronizeAuditRecord(
          baseRecord.auditType === 'vda63'
            ? {
                ...baseRecord,
                standard: plan.standard,
                title: plan.title,
                site: plan.site,
                auditor: plan.owner,
                auditDate: plan.plannedStart,
                data: {
                  ...baseRecord.data,
                  auditInfo: {
                    ...baseRecord.data.auditInfo,
                    site: plan.site,
                    auditor: plan.owner,
                    date: plan.plannedStart,
                    department: plan.department,
                    reference,
                    scope,
                    notes: plan.notes,
                    auditStatus: 'Not started',
                  },
                },
              }
            : baseRecord.auditType === 'vda65'
              ? {
                ...baseRecord,
                standard: plan.standard,
                title: plan.title,
                site: plan.site,
                auditor: plan.owner,
                auditDate: plan.plannedStart,
                data: {
                  ...baseRecord.data,
                  auditInfo: {
                    ...baseRecord.data.auditInfo,
                    site: plan.site,
                    auditor: plan.owner,
                    date: plan.plannedStart,
                    department: plan.department,
                    reference,
                    scope,
                    notes: plan.notes,
                    auditStatus: 'Not started',
                  },
                },
              }
              : {
                  ...baseRecord,
                  standard: plan.standard,
                  title: plan.title,
                  site: plan.site,
                  auditor: plan.owner,
                  auditDate: plan.plannedStart,
                  data: {
                    auditInfo: {
                      ...baseRecord.data.auditInfo,
                      site: plan.site,
                      auditor: plan.owner,
                      date: plan.plannedStart,
                      department: plan.department,
                      reference,
                      scope,
                      notes: plan.notes,
                      auditStatus: 'Not started',
                    },
                  },
                },
        )

        setSaveState('Saving')
        setAudits((current) => [hydratedRecord, ...current])
        setPlanningRecords((current) =>
          current.map((record) =>
            record.id === planId
              ? updatePlanWithHistory(
                  record,
                  {
                    linkedAuditId: hydratedRecord.id,
                    status: record.status === 'Completed' ? record.status : 'In progress',
                  },
                  'Linked audit',
                  `Linked execution record ${hydratedRecord.title}.`,
                )
              : record,
          ),
        )

        return hydratedRecord
      },
      duplicatePlanRecord: (id) => {
        const sourceRecord = planningRecords.find((record) => record.id === id)

        if (!sourceRecord) {
          return null
        }

        const newPlanRecord = duplicatePlanningRecord(sourceRecord)
        setSaveState('Saving')
        setPlanningRecords((current) => [newPlanRecord, ...current])
        return newPlanRecord
      },
      duplicateAudit: (id) => {
        const sourceRecord = audits.find((audit) => audit.id === id)

        if (!sourceRecord) {
          return null
        }

        const newRecord = duplicateAuditRecord(sourceRecord)
        setSaveState('Saving')
        setAudits((current) => [newRecord, ...current])
        return newRecord
      },
      changeAuditType: (id, auditType) => {
        const sourceRecord = audits.find((audit) => audit.id === id)

        if (!sourceRecord) {
          return null
        }

        const updatedRecord = changeAuditRecordType(sourceRecord, auditType)
        setSaveState('Saving')
        setAudits((current) => current.map((audit) => (audit.id === id ? updatedRecord : audit)))
        return updatedRecord
      },
      deleteAudit: (id) => {
        setSaveState('Saving')
        setAudits((current) => current.filter((audit) => audit.id !== id))
      },
      deletePlanRecord: (id) => {
        setSaveState('Saving')
        setPlanningRecords((current) => current.filter((record) => record.id !== id))
      },
      getAuditById: (id) => audits.find((audit) => audit.id === id),
      getPlanById: (id) => planningRecords.find((record) => record.id === id),
      updateAuditRecord: (id, updater) => {
        setSaveState('Saving')
        setAudits((current) =>
          current.map((record) => {
            if (record.id !== id) {
              return record
            }

            return synchronizeAuditRecord(updater(record))
          }),
        )
      },
      updatePlanRecord: (id, updater) => {
        setSaveState('Saving')
        setPlanningRecords((current) =>
          current.map((record) => {
            if (record.id !== id) {
              return record
            }

            return normalizePlanningRecordShape(updater(record))
          }),
        )
      },
      addPlanningYear: (year) => {
        if (!Number.isInteger(year) || year <= 0) {
          return
        }

        setSaveState('Saving')
        setStoredPlanningYears((current) => (current.includes(year) ? current : [...current, year]))
      },
      deletePlanningYear: (year) => {
        if (!Number.isInteger(year) || year <= 0) {
          return
        }

        if (planningRecords.some((record) => record.year === year)) {
          return
        }

        setSaveState('Saving')
        setStoredPlanningYears((current) => current.filter((entry) => entry !== year))
      },
      updatePlanningChecklistYear: (id, year, status) => {
        setSaveState('Saving')
        setPlanningChecklist((current) =>
          current.map((item) => {
            if (item.id !== id) {
              return item
            }

            return {
              ...item,
              years: {
                ...item.years,
                [year]: {
                  date: status === 'Updated' ? new Date().toISOString().slice(0, 10) : null,
                  status,
                },
              },
            }
          }),
        )
      },
    }),
    [audits, lastSavedAt, planningChecklist, planningRecords, planningYears, saveState],
  )

  return <AuditWorkspaceContext.Provider value={value}>{children}</AuditWorkspaceContext.Provider>
}
