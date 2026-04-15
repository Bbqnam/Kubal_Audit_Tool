import type { ActionPlanItem, ActionPlanUpdatePatch, AuditInfo, GenericAuditReportItem } from '../../../types/audit'
import { useAuditWorkspace } from './useAuditWorkspace'
import { createAuditHistoryEntry, describeActionPlanItem } from '../../../utils/traceability'

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `action-${Math.random().toString(36).slice(2, 10)}`
}

function updateListItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function createBlankReportItem(): GenericAuditReportItem {
  return {
    id: createId(),
    nonconformityType: 'Minor nonconformity',
    processArea: '',
    clause: '',
    title: '',
    requirement: '',
    evidence: '',
    statement: '',
    recommendation: '',
    savedAt: null,
  }
}

function createBlankActionItem(auditType: ActionPlanItem['auditType']): ActionPlanItem {
  return {
    id: createId(),
    auditType,
    reportItemId: null,
    savedAt: null,
    processArea: '',
    clause: '',
    nonconformityType: 'Minor nonconformity',
    section: '',
    finding: '',
    action: '',
    containmentAction: '',
    rootCauseAnalysis: '',
    correctiveAction: '',
    preventiveAction: '',
    verificationOfEffectiveness: '',
    closureEvidence: '',
    owner: '',
    dueDate: '',
    status: 'Open',
    comment: '',
  }
}

export function useGenericAuditWorkspace() {
  const workspace = useAuditWorkspace()

  if (workspace.audit.auditType === 'vda63' || workspace.audit.auditType === 'vda65') {
    throw new Error('Generic audit workspace hook used inside a VDA-specific route')
  }

  const audit = workspace.audit

  return {
    ...workspace,
    genericAuditInfo: audit.data.auditInfo,
    reportItems: audit.data.reportItems,
    reportSummary: audit.data.reportSummary,
    actionPlanItems: audit.actions,
    updateAuditTitle: (title: string) => {
      workspace.updateAuditRecord(audit.id, (current) => ({ ...current, title }))
    },
    updateAuditStandard: (standard: string) => {
      workspace.updateAuditRecord(audit.id, (current) => ({ ...current, standard }))
    },
    updateAuditInfo: (field: keyof AuditInfo, value: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            auditInfo: {
              ...current.data.auditInfo,
              [field]: value,
            },
          },
        }
      })
    },
    updateReportSummary: (reportSummary: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            reportSummary,
          },
        }
      })
    },
    addReportItem: () => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            reportItems: [...current.data.reportItems, createBlankReportItem()],
          },
        }
      })
    },
    updateReportItem: (id: string, patch: Partial<GenericAuditReportItem>) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        const nextPatch = { ...patch }
        const hasContentChange = Object.keys(nextPatch).some((key) => key !== 'savedAt')

        if (hasContentChange) {
          nextPatch.savedAt = null
        }

        return {
          ...current,
          data: {
            ...current.data,
            reportItems: updateListItem(current.data.reportItems, id, nextPatch),
          },
        }
      })
    },
    saveReportItem: (id: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            reportItems: updateListItem(current.data.reportItems, id, { savedAt: new Date().toISOString() }),
          },
        }
      })
    },
    deleteReportItem: (id: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            reportItems: current.data.reportItems.filter((item) => item.id !== id),
          },
        }
      })
    },
    addActionPlanItem: () => {
      const newAction = createBlankActionItem(audit.auditType)
      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: [
          ...current.actions,
          newAction,
        ],
        history: [
          ...current.history,
          createAuditHistoryEntry('action added', `Action added: ${describeActionPlanItem(newAction)}.`),
        ],
      }))
    },
    updateActionPlanItem: (
      id: string,
      patch: ActionPlanUpdatePatch,
    ) => {
      const nextPatch = { ...patch, savedAt: null }

      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: updateListItem<ActionPlanItem>(current.actions, id, nextPatch as Partial<ActionPlanItem>),
      }))
    },
    saveActionPlanItem: (id: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        const action = current.actions.find((item) => item.id === id)

        return {
          ...current,
          actions: updateListItem<ActionPlanItem>(current.actions, id, { savedAt: new Date().toISOString() }),
          history: action
            ? [
                ...current.history,
                createAuditHistoryEntry('action updated', `Action updated: ${describeActionPlanItem(action)}.`),
              ]
            : current.history,
        }
      })
    },
  }
}
