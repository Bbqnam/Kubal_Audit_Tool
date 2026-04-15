import { vda63QuestionBank } from '../../vda63/data/questionBank'
import type { ActionPlanItem, AuditLifecycleStatus, AuditRecord } from '../../../types/audit'
import { buildVda63AuditQuestions, buildVda63Summary, calculateVda65Results, getVda63AnsweredCount } from '../../../utils/auditUtils'
import { isPastDate } from '../../../utils/dateUtils'

export type ActionFollowUpSummary = {
  delayed: number
  inProgress: number
  open: number
  totalOpen: number
}

function hasMeaningfulText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function getCommonAuditActivity(record: AuditRecord) {
  const auditInfo = record.data.auditInfo

  return [
    auditInfo.site,
    auditInfo.auditor,
    auditInfo.customer,
    auditInfo.scope,
    auditInfo.notes,
  ].some(hasMeaningfulText)
}

function getVda63AuditActivity(record: Extract<AuditRecord, { auditType: 'vda63' }>) {
  const questions = buildVda63AuditQuestions(vda63QuestionBank, record.data.responses)
  return getVda63AnsweredCount(questions, record.data.chapterScope) > 0
}

function getVda65AuditActivity(record: Extract<AuditRecord, { auditType: 'vda65' }>) {
  return calculateVda65Results(record.data.checklist).reviewedCount > 0
}

function getGenericAuditActivity(record: Exclude<AuditRecord, { auditType: 'vda63' | 'vda65' }>) {
  return record.data.reportItems.length > 0 || hasMeaningfulText(record.data.reportSummary)
}

function hasAuditActivity(record: AuditRecord) {
  const hasWorkflowActivity =
    record.auditType === 'vda63'
      ? getVda63AuditActivity(record)
      : record.auditType === 'vda65'
        ? getVda65AuditActivity(record)
        : getGenericAuditActivity(record)

  return hasWorkflowActivity || getCommonAuditActivity(record) || record.actions.length > 0
}

export function getAuditCompletionIssues(record: AuditRecord) {
  const issues: string[] = []
  const auditInfo = record.data.auditInfo

  if (!hasMeaningfulText(record.title)) {
    issues.push('Audit title is required.')
  }

  if (!hasMeaningfulText(auditInfo.auditor)) {
    issues.push('Auditor is required.')
  }

  if (!hasMeaningfulText(auditInfo.date)) {
    issues.push('Audit date is required.')
  }

  if (!hasMeaningfulText(auditInfo.scope)) {
    issues.push('Audit scope is required.')
  }

  if (record.auditType === 'vda63') {
    const questions = buildVda63AuditQuestions(vda63QuestionBank, record.data.responses)
    const summary = buildVda63Summary(questions, record.data.chapterScope)

    if (summary.inScopeChapterCount === 0) {
      issues.push('At least one VDA 6.3 chapter must be in scope.')
    }

    if (summary.completedChapterCount !== summary.inScopeChapterCount) {
      issues.push('All in-scope VDA 6.3 chapters must be fully scored before completion.')
    }
  } else if (record.auditType === 'vda65') {
    const results = calculateVda65Results(record.data.checklist)

    if (!hasMeaningfulText(record.data.productInfo.productName)) {
      issues.push('Product name is required for VDA 6.5 audits.')
    }

    if (results.reviewedCount === 0) {
      issues.push('At least one VDA 6.5 checklist item must be reviewed.')
    }

    if (results.pendingCount > 0) {
      issues.push('All VDA 6.5 checklist items must be reviewed before completion.')
    }
  } else if (!record.data.reportItems.length && !hasMeaningfulText(record.data.reportSummary)) {
    issues.push('Add at least one report item or an audit summary before completion.')
  }

  return issues
}

export function resolveAuditLifecycleStatus(record: AuditRecord): AuditLifecycleStatus {
  const requestedStatus = record.data.auditInfo.auditStatus
  const completedIssues = requestedStatus === 'Completed' ? getAuditCompletionIssues(record) : []
  const active = hasAuditActivity(record)

  if (requestedStatus === 'Completed') {
    if (completedIssues.length === 0) {
      return 'Completed'
    }

    return active ? 'In progress' : 'Not started'
  }

  if (requestedStatus === 'In progress') {
    return active ? 'In progress' : 'Not started'
  }

  return active ? 'In progress' : 'Not started'
}

export function isActionItemDelayed(item: Pick<ActionPlanItem, 'dueDate' | 'status'>, referenceDate = new Date()) {
  return item.status !== 'Closed' && isPastDate(item.dueDate, referenceDate)
}

export function summarizeOpenActionItems(actions: ActionPlanItem[], referenceDate = new Date()): ActionFollowUpSummary {
  return actions.reduce<ActionFollowUpSummary>((summary, item) => {
    if (item.status === 'Closed') {
      return summary
    }

    summary.totalOpen += 1

    if (isActionItemDelayed(item, referenceDate)) {
      summary.delayed += 1
      return summary
    }

    if (item.status === 'In progress') {
      summary.inProgress += 1
      return summary
    }

    summary.open += 1
    return summary
  }, {
    delayed: 0,
    inProgress: 0,
    open: 0,
    totalOpen: 0,
  })
}
