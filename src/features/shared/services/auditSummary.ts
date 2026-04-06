import type {
  AuditRecord,
  AuditSummaryPreview,
  AuditType,
  Vda65ChecklistItem,
} from '../../../types/audit'
import { getAuditTitleLabel } from '../../../data/auditTypes'
import { vda63QuestionBank } from '../../vda63/data/questionBank'
import { buildVda63AuditQuestions, buildVda63Summary, calculateVda65Results, getVda63AnsweredCount } from '../../../utils/auditUtils'

function buildVda63RecordPreview(record: Extract<AuditRecord, { auditType: 'vda63' }>): AuditSummaryPreview {
  const questions = buildVda63AuditQuestions(vda63QuestionBank, record.data.responses)
  const summary = buildVda63Summary(questions, record.data.chapterScope)
  const scopedQuestionCount = questions.filter((question) => record.data.chapterScope.includes(question.chapter)).length
  const answeredCount = getVda63AnsweredCount(questions, record.data.chapterScope)
  const progressPercent = scopedQuestionCount === 0 ? 0 : Math.round((answeredCount / scopedQuestionCount) * 100)

  if (progressPercent === 0) {
    return {
      progressPercent,
      resultPreview: 'Not started',
    }
  }

  return {
    progressPercent,
    scorePreview: summary.overallPercent === null ? undefined : `${summary.overallPercent}%`,
    resultPreview:
      summary.completedChapterCount < summary.inScopeChapterCount && summary.inProgressChapterCount + summary.notEvaluatedChapterCount > 0
        ? 'In progress'
        : summary.finalStatus,
  }
}

function buildVda65Preview(checklist: Vda65ChecklistItem[]): AuditSummaryPreview {
  const results = calculateVda65Results(checklist)
  const answeredCount = checklist.filter((item) => item.status !== 'Pending' || item.comment.trim() || item.defectType.trim()).length
  const progressPercent = checklist.length === 0 ? 0 : Math.round((answeredCount / checklist.length) * 100)

  if (progressPercent === 0) {
    return {
      progressPercent,
      resultPreview: 'Not started',
    }
  }

  return {
    progressPercent,
    scorePreview: `${results.okCount}/${results.totalChecks} OK`,
    resultPreview: results.resultSummary,
  }
}

function buildGenericPreview(record: Exclude<AuditRecord, { auditType: 'vda63' | 'vda65' }>): AuditSummaryPreview {
  const status = record.data.auditInfo.auditStatus

  return {
    progressPercent: status === 'Completed' ? 100 : status === 'In progress' ? 50 : 0,
    scorePreview: record.standard || undefined,
    resultPreview: status,
  }
}

export function summarizeAuditRecord(record: AuditRecord): AuditSummaryPreview {
  if (record.auditType === 'vda63') {
    return buildVda63RecordPreview(record)
  }

  if (record.auditType === 'vda65') {
    return buildVda65Preview(record.data.checklist)
  }

  return buildGenericPreview(record)
}

export function getAuditTypeLabel(auditType: AuditType) {
  return getAuditTitleLabel(auditType)
}
