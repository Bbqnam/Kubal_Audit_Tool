import type { ActionPlanItem } from '../../../types/audit'

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

export function getActionPlanValidationMessage(item: ActionPlanItem) {
  if (!item.owner.trim()) {
    return 'Assign an owner before saving this action.'
  }

  if (!item.dueDate || !isIsoDate(item.dueDate)) {
    return 'Add a valid due date before saving this action.'
  }

  if (!(item.action || item.correctiveAction || item.finding).trim()) {
    return 'Document the action or finding before saving this action.'
  }

  if (item.status === 'Closed' && !item.closureEvidence.trim() && !item.closureEvidenceFiles.length) {
    return 'Add closure evidence or a closure file before closing this action.'
  }

  return null
}

export function isActionPlanItemSavable(item: ActionPlanItem) {
  return getActionPlanValidationMessage(item) === null
}
