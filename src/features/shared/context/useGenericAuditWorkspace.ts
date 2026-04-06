import type { ActionPlanItem, AuditInfo } from '../../../types/audit'
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

export function useGenericAuditWorkspace() {
  const workspace = useAuditWorkspace()

  if (workspace.audit.auditType === 'vda63' || workspace.audit.auditType === 'vda65') {
    throw new Error('Generic audit workspace hook used inside a VDA-specific route')
  }

  const audit = workspace.audit

  return {
    ...workspace,
    genericAuditInfo: audit.data.auditInfo,
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
            auditInfo: {
              ...current.data.auditInfo,
              [field]: value,
            },
          },
        }
      })
    },
    addActionPlanItem: () => {
      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: [
          ...current.actions,
          {
            id: createId(),
            auditType: current.auditType,
            section: '',
            finding: '',
            action: '',
            owner: '',
            dueDate: '',
            status: 'Open',
            comment: '',
          },
        ],
      }))
    },
    updateActionPlanItem: (
      id: string,
      patch: Partial<Pick<ActionPlanItem, 'section' | 'finding' | 'action' | 'owner' | 'dueDate' | 'status' | 'comment'>>,
    ) => {
      workspace.updateAuditRecord(audit.id, (current) => ({
        ...current,
        actions: updateListItem<ActionPlanItem>(current.actions, id, patch as Partial<ActionPlanItem>),
      }))
    },
  }
}
