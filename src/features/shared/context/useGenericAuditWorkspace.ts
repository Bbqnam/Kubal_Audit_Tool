import type { ActionPlanItem, AuditInfo, GenericAuditReportItem } from '../../../types/audit'
import { useAuditWorkspace } from './useAuditWorkspace'

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
  }
}

function createBlankActionItem(auditType: ActionPlanItem['auditType']): ActionPlanItem {
  return {
    id: createId(),
    auditType,
    processArea: '',
    clause: '',
    nonconformityType: 'Minor nonconformity',
    section: '',
    finding: '',
    action: '',
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

        return {
          ...current,
          data: {
            ...current.data,
            reportItems: updateListItem(current.data.reportItems, id, patch),
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
    addActionFromReportItem: (id: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType === 'vda63' || current.auditType === 'vda65') {
          return current
        }

        const source = current.data.reportItems.find((item) => item.id === id)

        if (!source) {
          return current
        }

        return {
          ...current,
          actions: [
            ...current.actions,
            {
              ...createBlankActionItem(current.auditType),
              processArea: source.processArea,
              clause: source.clause,
              nonconformityType: source.nonconformityType,
              section: source.processArea,
              finding: source.title || source.statement,
              action: source.recommendation,
            },
          ],
        }
      })
    },
    addActionPlanItem: () => {
      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: [
          ...current.actions,
          createBlankActionItem(current.auditType),
        ],
      }))
    },
    updateActionPlanItem: (
      id: string,
      patch: Partial<Pick<ActionPlanItem, 'processArea' | 'clause' | 'nonconformityType' | 'section' | 'finding' | 'action' | 'owner' | 'dueDate' | 'status' | 'comment'>>,
    ) => {
      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: updateListItem<ActionPlanItem>(current.actions, id, patch as Partial<ActionPlanItem>),
      }))
    },
  }
}
