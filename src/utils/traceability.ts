import type { ActionPlanItem, AuditHistoryActionType, AuditHistoryEntry, AuditRecord } from '../types/audit'
import type { AuditPlanRecord } from '../types/planning'
import { auditMetadataLabels, planningMetadataLabels } from '../config/domain/labels'
import { formatDateTime } from './dateUtils'

export const DEFAULT_AUDIT_ACTOR = 'Audit Coordinator'
export const DEFAULT_PLANNING_ACTOR = 'Planning Coordinator'

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function getReferenceYear(dateValue: string) {
  const year = Number(dateValue.slice(0, 4))
  return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear()
}

function parseAuditSequence(auditId: string) {
  const match = /^AUD-(\d{4})-(\d{3})$/.exec(auditId)

  if (!match) {
    return null
  }

  return {
    year: Number(match[1]),
    sequence: Number(match[2]),
  }
}

export function createAuditReferenceId(dateValue: string, existingIds: Iterable<string> = []) {
  const year = getReferenceYear(dateValue)
  let highestSequence = 0

  Array.from(existingIds).forEach((value) => {
    const parsedValue = parseAuditSequence(value)

    if (parsedValue?.year === year) {
      highestSequence = Math.max(highestSequence, parsedValue.sequence)
    }
  })

  return `AUD-${year}-${String(highestSequence + 1).padStart(3, '0')}`
}

export function createAuditHistoryEntry(
  actionType: AuditHistoryActionType,
  description: string,
  timestamp = new Date().toISOString(),
  actor = DEFAULT_AUDIT_ACTOR,
  metadata?: Pick<AuditHistoryEntry, 'subjectAuditId' | 'subjectLabel'>,
): AuditHistoryEntry {
  return {
    id: createId('audit-history'),
    timestamp,
    actionType,
    description,
    actor,
    ...metadata,
  }
}

export function getAuditOwnerLabel(record: AuditRecord) {
  return record.owner || record.auditor || record.data.auditInfo.auditor || 'Unassigned'
}

export function describeActionPlanItem(item: ActionPlanItem) {
  return item.action.trim() || item.finding.trim() || item.section.trim() || 'Corrective action'
}

export function getAuditMetadataItems(record: AuditRecord) {
  return [
    { label: auditMetadataLabels.auditId, value: record.auditId },
    { label: auditMetadataLabels.standard, value: record.standard || 'Not set' },
    { label: auditMetadataLabels.owner, value: getAuditOwnerLabel(record) },
    { label: auditMetadataLabels.reviewer, value: record.reviewer || 'Reviewer TBD' },
    { label: auditMetadataLabels.approver, value: record.approver || 'Approver TBD' },
    { label: auditMetadataLabels.status, value: record.status },
    { label: auditMetadataLabels.lastUpdated, value: formatDateTime(record.updatedAt) },
    { label: auditMetadataLabels.updatedBy, value: record.updatedBy || DEFAULT_AUDIT_ACTOR },
    { label: auditMetadataLabels.lastModifiedBy, value: record.lastModifiedBy || record.updatedBy || DEFAULT_AUDIT_ACTOR },
  ]
}

export function getAuditInfoMetadataItems(record: AuditRecord) {
  return [
    { label: auditMetadataLabels.auditId, value: record.auditId },
    { label: auditMetadataLabels.reviewer, value: record.reviewer || 'Reviewer TBD' },
    { label: auditMetadataLabels.updatedBy, value: record.updatedBy || DEFAULT_AUDIT_ACTOR },
  ]
}

export function getAuditInfoMetadataNote(record: AuditRecord) {
  const lastModifiedBy = record.lastModifiedBy || record.updatedBy || DEFAULT_AUDIT_ACTOR

  return `Last modified ${formatDateTime(record.updatedAt)} by ${lastModifiedBy}.`
}

export function getPlanningMetadataItems(record: AuditPlanRecord, status: string) {
  return [
    { label: planningMetadataLabels.auditId, value: record.auditId },
    { label: planningMetadataLabels.standard, value: record.standard || 'Not set' },
    { label: planningMetadataLabels.owner, value: record.owner || 'Unassigned' },
    { label: planningMetadataLabels.status, value: status },
    { label: planningMetadataLabels.lastUpdated, value: formatDateTime(record.updatedAt) },
    { label: planningMetadataLabels.updatedBy, value: record.updatedBy || DEFAULT_PLANNING_ACTOR },
  ]
}
