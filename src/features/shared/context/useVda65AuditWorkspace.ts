import type {
  ActionPlanItem,
  AuditInfo,
  ProductInfo,
  Vda65ChecklistItem,
  Vda65ChecklistStatus,
} from '../../../types/audit'
import { useAuditWorkspace } from './useAuditWorkspace'

function updateListItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function useVda65AuditWorkspace() {
  const workspace = useAuditWorkspace()

  if (workspace.audit.auditType !== 'vda65') {
    throw new Error('VDA 6.5 workspace hook used outside a VDA 6.5 audit route')
  }

  const audit = workspace.audit

  return {
    ...workspace,
    vda65AuditInfo: audit.data.auditInfo,
    vda65ProductInfo: audit.data.productInfo,
    vda65Checklist: audit.data.checklist,
    actionPlanItems: audit.actions,
    updateAuditTitle: (title: string) => {
      workspace.updateAuditRecord(audit.id, (current) => ({ ...current, title }))
    },
    updateAuditInfo: (field: keyof AuditInfo, value: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda65') {
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
    updateProductInfo: (field: keyof ProductInfo, value: string) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda65') {
          return current
        }

        return {
          ...current,
          data: {
            ...current.data,
            productInfo: {
              ...current.data.productInfo,
              [field]: value,
            },
          },
        }
      })
    },
    updateVda65ChecklistItem: (
      id: string,
      patch: Partial<Pick<Vda65ChecklistItem, 'status' | 'defectCount' | 'comment'>>,
    ) => {
      workspace.updateAuditRecord(audit.id, (current) => {
        if (current.auditType !== 'vda65') {
          return current
        }

        const nextPatch: Partial<Vda65ChecklistItem> = {}

        if (patch.status !== undefined) {
          nextPatch.status = patch.status as Vda65ChecklistStatus
        }

        if (patch.defectCount !== undefined) {
          nextPatch.defectCount = Math.max(0, Math.floor(patch.defectCount))
        }

        if (patch.comment !== undefined) {
          nextPatch.comment = patch.comment
        }

        if (nextPatch.status === 'OK' || nextPatch.status === 'Pending') {
          nextPatch.defectCount = 0
        }

        return {
          ...current,
          data: {
            ...current.data,
            checklist: updateListItem(current.data.checklist, id, nextPatch),
          },
        }
      })
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
