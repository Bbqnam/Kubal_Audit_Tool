import { useEffect, useMemo, useRef, useState } from 'react'
import type { AuditHistoryEntry, AuditRecord } from '../../../types/audit'
import type { WorkspaceUser } from '../../../types/access'
import type { AuditPlanRecord, PlanningActivityLogEntry, PlanningActorSnapshot } from '../../../types/planning'
import { AuditWorkspaceContext } from './AuditWorkspaceValue'
import type { AuditWorkspaceContextValue } from './AuditWorkspaceValue'
import { changeAuditRecordType, createAuditRecord, createAuditRouteId, duplicateAuditRecord, synchronizeAuditRecord } from '../services/auditFactory'
import { mergeImportedAudits, mergeImportedPlanningRecords } from '../services/fileTransfer'
import { createLocalStorageAuditRepository } from '../services/auditRepository'
import { getPlanExecutionAuditType, mergePlanningYears } from '../../planning/services/planningUtils'
import {
  createPlanningActivityEntry,
  createPlanRecord as createPlanningRecord,
  duplicatePlanRecord as duplicatePlanningRecord,
  normalizePlanningRecordShape,
  resolvePlanningActor,
  updatePlanWithHistory,
} from '../../planning/services/planningFactory'
import { createAuditHistoryEntry, DEFAULT_AUDIT_ACTOR } from '../../../utils/traceability'
import { normalizeAuditParticipants, normalizeWorkspaceUser, sanitizeUserName } from '../../../utils/userDirectory'

function collectReservedAuditIds(audits: AuditRecord[], planningRecords: AuditPlanRecord[]) {
  return [
    ...planningRecords.map((record) => record.auditId),
    ...audits.map((audit) => audit.auditId),
  ]
}

function getPreferredPlanningUser(users: WorkspaceUser[], preferredId: string | null) {
  return users.find((user) => user.id === preferredId)
    ?? users.find((user) => user.permission === 'Admin')
    ?? users.find((user) => user.permission === 'Edit')
    ?? users[0]
    ?? null
}

function getPlanningActor(user: WorkspaceUser | null | undefined): PlanningActorSnapshot {
  return resolvePlanningActor(user ? { name: user.name, position: user.position } : undefined)
}

function prependPlanningActivityLog(log: PlanningActivityLogEntry[], entry: PlanningActivityLogEntry) {
  return [entry, ...log].sort((left, right) => right.timestamp.localeCompare(left.timestamp))
}

function appendAuditHistory(record: AuditRecord, actionType: Parameters<typeof createAuditHistoryEntry>[0], description: string) {
  return {
    ...record,
    updatedBy: DEFAULT_AUDIT_ACTOR,
    lastModifiedBy: DEFAULT_AUDIT_ACTOR,
    history: [...record.history, createAuditHistoryEntry(actionType, description)],
  }
}

function getAuditLibraryLabel(record: AuditRecord) {
  return `${record.auditId} · ${record.title}`
}

function createAuditLibraryHistoryEntry(
  actionType: Parameters<typeof createAuditHistoryEntry>[0],
  description: string,
  record?: AuditRecord,
) {
  return createAuditHistoryEntry(
    actionType,
    description,
    undefined,
    undefined,
    record
      ? {
          subjectAuditId: record.auditId,
          subjectLabel: getAuditLibraryLabel(record),
        }
      : undefined,
  )
}

function appendLibraryHistory(
  history: AuditHistoryEntry[],
  actionType: Parameters<typeof createAuditHistoryEntry>[0],
  description: string,
  record?: AuditRecord,
) {
  const nextEntry = createAuditLibraryHistoryEntry(actionType, description, record)

  if (nextEntry.actionType !== 'updated' || !nextEntry.subjectAuditId) {
    return [...history, nextEntry]
  }

  const existingIndex = history.findLastIndex((entry) =>
    entry.subjectAuditId === nextEntry.subjectAuditId
    && (entry.actionType === 'updated' || entry.actionType === 'status change'),
  )

  if (existingIndex === -1) {
    return [...history, nextEntry]
  }

  return history.map((entry, index) => (index === existingIndex ? nextEntry : entry))
}

function serializeComparable(value: unknown) {
  return JSON.stringify(value)
}

function stripRuntimeAuditFields(record: AuditRecord) {
  const { updatedAt, updatedBy, lastModifiedBy, summary, history, ...stableRecord } = record
  void updatedAt
  void updatedBy
  void lastModifiedBy
  void summary
  void history
  return stableRecord
}

function hasAuditLibraryEdit(previous: AuditRecord, next: AuditRecord) {
  return serializeComparable(stripRuntimeAuditFields(previous)) !== serializeComparable(stripRuntimeAuditFields(next))
}

export function AuditWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const repository = useMemo(() => createLocalStorageAuditRepository(), [])
  const isFirstRender = useRef(true)
  const initialWorkspace = useMemo(() => repository.loadWorkspace(), [repository])
  const [audits, setAudits] = useState<AuditRecord[]>(initialWorkspace.audits)
  const [auditLibraryHistory, setAuditLibraryHistory] = useState<AuditHistoryEntry[]>(initialWorkspace.auditLibraryHistory)
  const [users, setUsers] = useState<WorkspaceUser[]>(initialWorkspace.users)
  const [planningRecords, setPlanningRecords] = useState<AuditPlanRecord[]>(initialWorkspace.planningRecords)
  const [planningActivityLog, setPlanningActivityLog] = useState<PlanningActivityLogEntry[]>(initialWorkspace.planningActivityLog)
  const [activePlanningUserId, setActivePlanningUserId] = useState<string | null>(initialWorkspace.activePlanningUserId)
  const [storedPlanningYears, setStoredPlanningYears] = useState<number[]>(initialWorkspace.planningYears)
  const [planningChecklist, setPlanningChecklist] = useState(initialWorkspace.planningChecklist)
  const [saveState, setSaveState] = useState<AuditWorkspaceContextValue['saveState']>('Saved')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => audits[0]?.updatedAt ?? null)
  const planningYears = useMemo(
    () => mergePlanningYears(planningRecords, storedPlanningYears),
    [planningRecords, storedPlanningYears],
  )
  const activePlanningUser = useMemo(
    () => getPreferredPlanningUser(users, activePlanningUserId),
    [activePlanningUserId, users],
  )
  const planningActor = useMemo(
    () => getPlanningActor(activePlanningUser),
    [activePlanningUser],
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timeoutId = window.setTimeout(() => {
      repository.saveWorkspace({
        audits,
        auditLibraryHistory,
        users,
        planningRecords,
        planningActivityLog,
        activePlanningUserId: activePlanningUser?.id ?? null,
        planningYears,
        planningChecklist,
      })
      setSaveState('Saved')
      setLastSavedAt(new Date().toISOString())
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [activePlanningUser, auditLibraryHistory, audits, planningActivityLog, planningChecklist, planningRecords, planningYears, repository, users])

  function renameAuditUserReferences(record: AuditRecord, previousName: string, nextName: string) {
    const sharedFields = {
      auditor: record.auditor === previousName ? nextName : record.auditor,
      owner: record.owner === previousName ? nextName : record.owner,
      actions: record.actions,
      updatedBy: DEFAULT_AUDIT_ACTOR,
      lastModifiedBy: DEFAULT_AUDIT_ACTOR,
    }

    if (record.auditType === 'vda63') {
      return synchronizeAuditRecord({
        ...record,
        ...sharedFields,
        auditTeam: normalizeAuditParticipants(
          record.auditTeam.map((participant) => ({
            ...participant,
            userName: participant.userName === previousName ? nextName : participant.userName,
          })),
        ),
        data: {
          ...record.data,
          auditInfo: {
            ...record.data.auditInfo,
            auditor: record.data.auditInfo.auditor === previousName ? nextName : record.data.auditInfo.auditor,
          },
        },
      })
    }

    if (record.auditType === 'vda65') {
      return synchronizeAuditRecord({
        ...record,
        ...sharedFields,
        auditTeam: normalizeAuditParticipants(
          record.auditTeam.map((participant) => ({
            ...participant,
            userName: participant.userName === previousName ? nextName : participant.userName,
          })),
        ),
        data: {
          ...record.data,
          auditInfo: {
            ...record.data.auditInfo,
            auditor: record.data.auditInfo.auditor === previousName ? nextName : record.data.auditInfo.auditor,
          },
        },
      })
    }

    return synchronizeAuditRecord({
      ...record,
      ...sharedFields,
      auditTeam: normalizeAuditParticipants(
        record.auditTeam.map((participant) => ({
          ...participant,
          userName: participant.userName === previousName ? nextName : participant.userName,
        })),
      ),
      data: {
        ...record.data,
        auditInfo: {
          ...record.data.auditInfo,
          auditor: record.data.auditInfo.auditor === previousName ? nextName : record.data.auditInfo.auditor,
        },
      },
    })
  }

  const value = useMemo<AuditWorkspaceContextValue>(
    () => ({
      audits,
      auditLibraryHistory,
      users,
      planningRecords,
      planningActivityLog,
      planningYears,
      planningChecklist,
      activePlanningUser,
      saveState,
      lastSavedAt,
      createAudit: (auditType) => {
        const newRecord = createAuditRecord(
          auditType,
          audits.map((audit) => audit.id),
          collectReservedAuditIds(audits, planningRecords),
        )
        setSaveState('Saving')
        setAudits((current) => [newRecord, ...current])
        setAuditLibraryHistory((current) => appendLibraryHistory(current, 'created', `Created audit ${getAuditLibraryLabel(newRecord)}.`, newRecord))
        return newRecord
      },
      createPlanRecord: (record) => {
        const newPlanRecord = createPlanningRecord(record, collectReservedAuditIds(audits, planningRecords), planningActor)
        setSaveState('Saving')
        setPlanningRecords((current) => [newPlanRecord, ...current])
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Created',
          summary: `Added ${newPlanRecord.title} to the audit plan.`,
          entityType: 'Plan record',
          actor: planningActor,
          recordId: newPlanRecord.id,
          recordTitle: newPlanRecord.title,
          year: newPlanRecord.year,
        })))
        return newPlanRecord
      },
      createAuditFromPlan: (planId) => {
        const plan = planningRecords.find((record) => record.id === planId)
        const executionAuditType = plan ? getPlanExecutionAuditType(plan) : null

        if (!plan || !executionAuditType) {
          return null
        }

        const baseRecord = createAuditRecord(
          executionAuditType,
          audits.map((audit) => audit.id),
          collectReservedAuditIds(audits, planningRecords),
          plan.auditId,
        )
        const reference = `${plan.standard}-${plan.year}-${String(plan.month).padStart(2, '0')}`
        const scope = `${plan.standard} / ${plan.processArea}`
        const hydratedRecord = synchronizeAuditRecord(
          baseRecord.auditType === 'vda63'
            ? {
                ...baseRecord,
                auditId: plan.auditId,
                planRecordId: plan.id,
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
                history: [createAuditHistoryEntry('created', `Audit created from planning record ${plan.title}.`)],
              }
            : baseRecord.auditType === 'vda65'
              ? {
                ...baseRecord,
                auditId: plan.auditId,
                planRecordId: plan.id,
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
                history: [createAuditHistoryEntry('created', `Audit created from planning record ${plan.title}.`)],
              }
              : {
                  ...baseRecord,
                  auditId: plan.auditId,
                  planRecordId: plan.id,
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
                  history: [createAuditHistoryEntry('created', `Audit created from planning record ${plan.title}.`)],
                },
        )

        setSaveState('Saving')
        setAudits((current) => [hydratedRecord, ...current])
        setAuditLibraryHistory((current) => appendLibraryHistory(
          current,
          'created',
          `Created audit ${getAuditLibraryLabel(hydratedRecord)} from planning record ${plan.title}.`,
          hydratedRecord,
        ))
        const linkedAuditSummary = `Linked execution record ${hydratedRecord.title}.`
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
                  linkedAuditSummary,
                  planningActor,
                )
              : record,
          ),
        )
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Linked audit',
          summary: `${plan.title} linked to audit ${hydratedRecord.auditId}.`,
          entityType: 'Plan record',
          actor: planningActor,
          recordId: plan.id,
          recordTitle: plan.title,
          year: plan.year,
        })))

        return hydratedRecord
      },
      duplicatePlanRecord: (id) => {
        const sourceRecord = planningRecords.find((record) => record.id === id)

        if (!sourceRecord) {
          return null
        }

        const newPlanRecord = duplicatePlanningRecord(sourceRecord, collectReservedAuditIds(audits, planningRecords), planningActor)
        setSaveState('Saving')
        setPlanningRecords((current) => [newPlanRecord, ...current])
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Duplicated',
          summary: `Duplicated ${sourceRecord.title} into a new planning record.`,
          entityType: 'Plan record',
          actor: planningActor,
          recordId: newPlanRecord.id,
          recordTitle: newPlanRecord.title,
          year: newPlanRecord.year,
        })))
        return newPlanRecord
      },
      duplicateAudit: (id) => {
        const sourceRecord = audits.find((audit) => audit.id === id)

        if (!sourceRecord) {
          return null
        }

        const newRecord = duplicateAuditRecord(
          sourceRecord,
          audits.map((audit) => audit.id),
          collectReservedAuditIds(audits, planningRecords),
        )
        setSaveState('Saving')
        setAudits((current) => [newRecord, ...current])
        setAuditLibraryHistory((current) => appendLibraryHistory(
          current,
          'duplicated',
          `Duplicated audit ${sourceRecord.auditId} into ${getAuditLibraryLabel(newRecord)}.`,
          newRecord,
        ))
        return newRecord
      },
      changeAuditType: (id, auditType) => {
        const sourceRecord = audits.find((audit) => audit.id === id)

        if (!sourceRecord) {
          return null
        }

        const changedRecord = appendAuditHistory(
          changeAuditRecordType(sourceRecord, auditType),
          'updated',
          `Audit workflow changed from ${sourceRecord.auditType} to ${auditType}.`,
        )
        const existingIds = audits.filter((audit) => audit.id !== id).map((audit) => audit.id)
        const nextId = createAuditRouteId(
          changedRecord.auditType,
          changedRecord.auditDate,
          existingIds,
        )
        const updatedRecord = nextId === changedRecord.id
          ? changedRecord
          : {
              ...changedRecord,
              id: nextId,
              legacyIds: [...new Set([...(changedRecord.legacyIds ?? []), id])],
        }
        setSaveState('Saving')
        setAudits((current) => current.map((audit) => (audit.id === id ? updatedRecord : audit)))
        setAuditLibraryHistory((current) => appendLibraryHistory(
          current,
          'updated',
          `Edited ${getAuditLibraryLabel(updatedRecord)}.`,
          updatedRecord,
        ))
        if (updatedRecord.id !== id) {
          setPlanningRecords((current) =>
            current.map((record) => (
              record.linkedAuditId === id
                ? {
                    ...record,
                    linkedAuditId: updatedRecord.id,
                  }
                : record
            )),
          )
        }
        return updatedRecord
      },
      deleteAudit: (id) => {
        const sourceRecord = audits.find((audit) => audit.id === id)
        setSaveState('Saving')
        setAudits((current) => current.filter((audit) => audit.id !== id))
        if (sourceRecord) {
          setAuditLibraryHistory((current) => appendLibraryHistory(
            current,
            'deleted',
            `Deleted audit ${getAuditLibraryLabel(sourceRecord)} from the audit library.`,
            sourceRecord,
          ))
        }
        setPlanningRecords((current) =>
          current.map((record) =>
            record.linkedAuditId === id
              ? updatePlanWithHistory(
                  record,
                  {
                    linkedAuditId: null,
                    status: record.status === 'Completed' ? record.status : 'Planned',
                  },
                  'Linked audit',
                  'Linked audit removed from workspace.',
                  planningActor,
                )
              : record,
          ),
        )
      },
      deletePlanRecord: (id) => {
        const sourceRecord = planningRecords.find((record) => record.id === id)
        setSaveState('Saving')
        setPlanningRecords((current) => current.filter((record) => record.id !== id))
        if (sourceRecord) {
          setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
            action: 'Deleted',
            summary: `Deleted ${sourceRecord.title} from the audit plan.`,
            entityType: 'Plan record',
            actor: planningActor,
            recordId: sourceRecord.id,
            recordTitle: sourceRecord.title,
            year: sourceRecord.year,
          })))
        }
      },
      getAuditById: (id) => audits.find((audit) => audit.id === id || audit.legacyIds?.includes(id)),
      getPlanById: (id) => planningRecords.find((record) => record.id === id),
      updateAuditRecord: (id, updater) => {
        const sourceRecord = audits.find((record) => record.id === id)

        if (!sourceRecord) {
          return
        }

        const nextRecord = synchronizeAuditRecord({
          ...updater(sourceRecord),
          updatedBy: DEFAULT_AUDIT_ACTOR,
          lastModifiedBy: DEFAULT_AUDIT_ACTOR,
        })
        if (!hasAuditLibraryEdit(sourceRecord, nextRecord)) {
          return
        }

        const nextAuditRecord = sourceRecord.status !== nextRecord.status
          ? appendAuditHistory(
              nextRecord,
              'status change',
              `Audit status changed from ${sourceRecord.status} to ${nextRecord.status}.`,
            )
          : nextRecord

        setSaveState('Saving')
        setAudits((current) => current.map((record) => (record.id === id ? nextAuditRecord : record)))
        setAuditLibraryHistory((current) => appendLibraryHistory(
          current,
          'updated',
          `Edited ${getAuditLibraryLabel(nextAuditRecord)}.`,
          nextAuditRecord,
        ))
      },
      updatePlanRecord: (id, updater) => {
        const sourceRecord = planningRecords.find((record) => record.id === id)

        if (!sourceRecord) {
          return
        }

        const nextRecord = normalizePlanningRecordShape(updater(sourceRecord))
        const previousHistory = sourceRecord.changeHistory[sourceRecord.changeHistory.length - 1]
        const nextHistory = nextRecord.changeHistory[nextRecord.changeHistory.length - 1]

        setSaveState('Saving')
        setPlanningRecords((current) => current.map((record) => (record.id === id ? nextRecord : record)))

        const hasNewMajorHistory = Boolean(
          nextHistory
          && nextHistory.action !== 'Edited'
          && (
            sourceRecord.changeHistory.length !== nextRecord.changeHistory.length
            || !previousHistory
            || previousHistory.id !== nextHistory.id
          ),
        )

        if (hasNewMajorHistory) {
          setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
            action: nextHistory.action,
            summary: nextHistory.summary,
            entityType: 'Plan record',
            actor: {
              name: nextHistory.actorName,
              position: nextHistory.actorPosition,
            },
            timestamp: nextHistory.timestamp,
            recordId: nextRecord.id,
            recordTitle: nextRecord.title,
            year: nextRecord.year,
          })))
        }
      },
      importAudits: (records) => {
        const mergeResult = mergeImportedAudits(audits, records)
        setSaveState('Saving')
        setAudits(mergeResult.records)
        setAuditLibraryHistory((current) => appendLibraryHistory(
          current,
          'imported',
          `Imported audit library file: ${mergeResult.imported} new, ${mergeResult.updated} updated, ${mergeResult.skipped} skipped.`,
        ))
        return mergeResult
      },
      importPlanningRecords: (records) => {
        const mergeResult = mergeImportedPlanningRecords(planningRecords, records, audits)
        setSaveState('Saving')
        setPlanningRecords(mergeResult.records)
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Imported',
          summary: `Imported planning file: ${mergeResult.imported} new, ${mergeResult.updated} updated, ${mergeResult.skipped} skipped.`,
          entityType: 'Plan record',
          actor: planningActor,
        })))
        return mergeResult
      },
      createUser: () => {
        const placeholderBase = 'New user'
        const usedNames = new Set(users.map((user) => user.name))
        let nextName = placeholderBase
        let suffix = 2

        while (usedNames.has(nextName)) {
          nextName = `${placeholderBase} ${suffix}`
          suffix += 1
        }

        const newUser = normalizeWorkspaceUser({
          name: nextName,
          position: '',
          permission: 'Edit',
        })

        setSaveState('Saving')
        setUsers((current) => [...current, newUser].sort((left, right) => left.name.localeCompare(right.name)))
        return newUser
      },
      updateUser: (id, updater) => {
        const existingUser = users.find((user) => user.id === id)

        if (!existingUser) {
          return
        }

        const nextUser = normalizeWorkspaceUser({
          ...updater(existingUser),
          id,
        })
        const previousName = existingUser.name
        const nextName = sanitizeUserName(nextUser.name)
        const duplicateExists = users.some((user) => user.id !== id && user.name === nextName)

        if (!nextName || duplicateExists) {
          return
        }

        setSaveState('Saving')
        setUsers((current) =>
          current
            .map((user) => (user.id === id ? { ...nextUser, name: nextName } : user))
            .sort((left, right) => left.name.localeCompare(right.name)),
        )

        if (previousName !== nextName) {
          setAudits((current) => current.map((record) => renameAuditUserReferences(record, previousName, nextName)))
        }
      },
      deleteUser: (id) => {
        setSaveState('Saving')
        setUsers((current) => current.filter((user) => user.id !== id))
      },
      setActivePlanningUser: (id) => {
        if (!users.some((user) => user.id === id)) {
          return
        }

        setSaveState('Saving')
        setActivePlanningUserId(id)
      },
      addPlanningYear: (year) => {
        if (!Number.isInteger(year) || year <= 0) {
          return
        }

        if (planningYears.includes(year)) {
          return
        }

        setSaveState('Saving')
        setStoredPlanningYears((current) => (current.includes(year) ? current : [...current, year]))
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Year added',
          summary: `Added ${year} to the 3-year planning horizon.`,
          entityType: 'Planning year',
          actor: planningActor,
          year,
        })))
      },
      deletePlanningYear: (year) => {
        if (!Number.isInteger(year) || year <= 0) {
          return
        }

        if (planningRecords.some((record) => record.year === year)) {
          return
        }

        if (!planningYears.includes(year)) {
          return
        }

        setSaveState('Saving')
        setStoredPlanningYears((current) => current.filter((entry) => entry !== year))
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Year removed',
          summary: `Removed ${year} from the 3-year planning horizon.`,
          entityType: 'Planning year',
          actor: planningActor,
          year,
        })))
      },
      updatePlanningChecklistYear: (id, year, status) => {
        const checklistItem = planningChecklist.find((item) => item.id === id)
        const previousStatus = checklistItem?.years[year]?.status ?? 'Pending'

        if (!checklistItem || previousStatus === status) {
          return
        }

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
        setPlanningActivityLog((current) => prependPlanningActivityLog(current, createPlanningActivityEntry({
          action: 'Checklist updated',
          summary: `${checklistItem.title} marked ${status === 'Updated' ? 'updated' : 'pending'} for ${year}.`,
          entityType: 'Checklist item',
          actor: planningActor,
          year,
          checklistItemId: checklistItem.id,
          checklistTitle: checklistItem.title,
        })))
      },
    }),
    [activePlanningUser, auditLibraryHistory, audits, lastSavedAt, planningActivityLog, planningChecklist, planningRecords, planningYears, saveState, users, planningActor],
  )

  return <AuditWorkspaceContext.Provider value={value}>{children}</AuditWorkspaceContext.Provider>
}
