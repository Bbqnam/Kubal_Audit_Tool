import type {
  AuditType,
  Vda63AuditQuestion,
  Vda63ChapterKey,
  Vda63ChapterResult,
  Vda63ChapterSummary,
  Vda63ElementSummary,
  Vda63QuestionBankItem,
  Vda63QuestionResponse,
  Vda63SummaryResult,
  Vda65ChecklistItem,
  Vda65Results,
  Vda65Severity,
} from '../types/audit'
import { getAuditTypeFamilyLabel, getAuditTypeLabel } from '../data/auditTypes'

export const chapterOrder: Vda63ChapterKey[] = ['P2', 'P3', 'P4', 'P5', 'P6', 'P7']

export const scoreOptions = [0, 4, 6, 8, 10] as const

export const severityOrder: Vda65Severity[] = ['Critical', 'High', 'Medium', 'Low']

export function formatAuditType(auditType: AuditType) {
  if (auditType === 'template') {
    return getAuditTypeLabel(auditType)
  }

  return getAuditTypeFamilyLabel(auditType)
}

function calculatePercent(total: number, max: number) {
  return max === 0 ? 0 : Math.round((total / max) * 100)
}

function getAnsweredQuestionCount(questions: Vda63AuditQuestion[]) {
  return questions.filter((question) => question.score !== null || question.comment.trim() || question.finding.trim()).length
}

export function isVda63ChapterInScope(chapterScope: Vda63ChapterKey[], chapter: Vda63ChapterKey) {
  return chapterScope.includes(chapter)
}

function resolveVda63Result(percent: number | null, downgradeTriggered: boolean): Vda63ChapterResult {
  if (percent === null) {
    return 'neutral'
  }

  if (downgradeTriggered) {
    return 'downgraded'
  }

  if (percent >= 90) {
    return 'normal'
  }

  if (percent >= 80) {
    return 'followUp'
  }

  return 'escalation'
}

export function getVda63ChapterStatusLabel(status: Vda63ChapterSummary['status']) {
  switch (status) {
    case 'outOfScope':
      return 'Out of scope'
    case 'notEvaluated':
      return 'Not evaluated'
    case 'inProgress':
      return 'In progress'
    case 'completed':
      return 'Completed'
    case 'downgraded':
      return 'Downgraded'
  }
}

export function getVda63ChapterResultLabel(result: Vda63ChapterResult) {
  switch (result) {
    case 'normal':
      return 'Normal result'
    case 'followUp':
      return 'Follow-up'
    case 'escalation':
      return 'Escalation'
    case 'downgraded':
      return 'Downgraded'
    case 'neutral':
      return 'n.e.'
  }
}

export function buildVda63AuditQuestions(
  bank: Vda63QuestionBankItem[],
  responses: Vda63QuestionResponse[],
): Vda63AuditQuestion[] {
  const responseLookup = new Map(responses.map((response) => [response.id, response]))

  return bank.map((question) => {
    const response = responseLookup.get(question.id)

    return {
      ...question,
      score: response?.score ?? null,
      comment: response?.comment ?? '',
      finding: response?.finding ?? '',
    }
  })
}

export function calculateVda63ChapterSummary(
  questions: Vda63AuditQuestion[],
  chapter: Vda63ChapterKey,
  chapterScope: Vda63ChapterKey[] = chapterOrder,
): Vda63ChapterSummary {
  const chapterQuestions = questions.filter((question) => question.chapter === chapter)
  const scope = isVda63ChapterInScope(chapterScope, chapter) ? 'inScope' : 'outOfScope'
  const scoredQuestionCount = chapterQuestions.filter((question) => question.score !== null).length
  const answeredQuestionCount = getAnsweredQuestionCount(chapterQuestions)
  const totalScore = chapterQuestions.reduce((sum, question) => sum + (question.score ?? 0), 0)
  const maxScore = chapterQuestions.length * 10
  const completionPercent = calculatePercent(scoredQuestionCount, chapterQuestions.length)
  const percent = scope === 'outOfScope' || scoredQuestionCount === 0 ? null : calculatePercent(totalScore, scoredQuestionCount * 10)
  const downgradeTriggered =
    scope === 'inScope' &&
    scoredQuestionCount === chapterQuestions.length &&
    chapterQuestions.some((question) => question.isStarQuestion && question.score === 0)
  const starQuestionCount = chapterQuestions.filter((question) => question.isStarQuestion).length
  const result = scope === 'outOfScope' ? 'neutral' : resolveVda63Result(percent, downgradeTriggered)
  const status =
    scope === 'outOfScope'
      ? 'outOfScope'
      : answeredQuestionCount === 0
        ? 'notEvaluated'
        : scoredQuestionCount < chapterQuestions.length
          ? 'inProgress'
          : downgradeTriggered
            ? 'downgraded'
            : 'completed'

  return {
    chapter,
    scope,
    totalScore,
    maxScore,
    percent,
    questionCount: chapterQuestions.length,
    scoredQuestionCount,
    answeredQuestionCount,
    completionPercent,
    status,
    result,
    downgradeTriggered,
    starQuestionCount,
  }
}

export function buildVda63Summary(
  questions: Vda63AuditQuestion[],
  chapterScope: Vda63ChapterKey[] = chapterOrder,
): Vda63SummaryResult {
  const chapters = chapterOrder.map((chapter) => calculateVda63ChapterSummary(questions, chapter, chapterScope))
  const inScopeChapters = chapters.filter((chapter) => chapter.scope === 'inScope')
  const auditedChapters = chapters.filter((chapter) => chapter.status === 'completed' || chapter.status === 'downgraded')
  const completedChapterCount = auditedChapters.length
  const inProgressChapterCount = chapters.filter((chapter) => chapter.status === 'inProgress').length
  const notEvaluatedChapterCount = chapters.filter((chapter) => chapter.status === 'notEvaluated').length
  const totalScore = auditedChapters.reduce((sum, chapter) => sum + chapter.totalScore, 0)
  const maxScore = auditedChapters.reduce((sum, chapter) => sum + chapter.maxScore, 0)
  const overallPercent = auditedChapters.length === 0 ? null : calculatePercent(totalScore, maxScore)
  const downgradeTriggered = auditedChapters.some((chapter) => chapter.downgradeTriggered)

  let finalStatus: Vda63SummaryResult['finalStatus']

  if (auditedChapters.length === 0 && inProgressChapterCount > 0) {
    finalStatus = 'In progress'
  } else if (auditedChapters.length === 0) {
    finalStatus = 'Not evaluated'
  } else if (downgradeTriggered) {
    finalStatus = 'Downgraded'
  } else if ((overallPercent ?? 0) >= 90) {
    finalStatus = 'Approved'
  } else if ((overallPercent ?? 0) >= 80) {
    finalStatus = 'Approved with follow-up'
  } else if ((overallPercent ?? 0) >= 70) {
    finalStatus = 'Conditional approval'
  } else {
    finalStatus = 'Escalation required'
  }

  return {
    chapters,
    overallPercent,
    totalScore,
    maxScore,
    inScopeChapterCount: inScopeChapters.length,
    auditedChapterCount: auditedChapters.length,
    completedChapterCount,
    inProgressChapterCount,
    notEvaluatedChapterCount,
    downgradeTriggered,
    finalStatus,
  }
}

export function buildVda63ElementSummary(
  questions: Vda63AuditQuestion[],
  chapter: Vda63ChapterKey,
): Vda63ElementSummary[] {
  const chapterQuestions = questions.filter((question) => question.chapter === chapter)
  const groups = Array.from(
    new Set(
      chapterQuestions
        .map((question) => question.subgroup ?? question.group)
        .filter((group): group is NonNullable<Vda63AuditQuestion['group']> => group !== undefined),
    ),
  )

  return groups.map((label) => {
    const groupedQuestions = chapterQuestions.filter((question) => (question.subgroup ?? question.group) === label)
    const scoredQuestionCount = groupedQuestions.filter((question) => question.score !== null).length
    const totalScore = groupedQuestions.reduce((sum, question) => sum + (question.score ?? 0), 0)
    const maxScore = groupedQuestions.length * 10

    return {
      label,
      totalScore,
      maxScore,
      percent: scoredQuestionCount === 0 ? null : calculatePercent(totalScore, scoredQuestionCount * 10),
      questionCount: groupedQuestions.length,
      scoredQuestionCount,
    }
  })
}

export function getVda63AnsweredCount(
  questions: Vda63AuditQuestion[],
  chapterScope: Vda63ChapterKey[] = chapterOrder,
) {
  return questions.filter(
    (question) =>
      isVda63ChapterInScope(chapterScope, question.chapter) &&
      (question.score !== null || question.comment.trim() || question.finding.trim()),
  ).length
}

export function calculateVda65Results(items: Vda65ChecklistItem[]): Vda65Results {
  const totalChecks = items.length
  const nokItems = items.filter((item) => item.status === 'NOK')
  const nokCount = nokItems.length
  const okCount = items.filter((item) => item.status === 'OK').length
  const pendingCount = items.filter((item) => item.status === 'Pending').length

  const defectOverview = nokItems.reduce<Record<string, number>>((overview, item) => {
    overview[item.defectType] = (overview[item.defectType] ?? 0) + 1
    return overview
  }, {})

  const severityOverview = items.reduce<Record<Vda65Severity, number>>(
    (overview, item) => {
      overview[item.severity] += item.status === 'NOK' ? 1 : 0
      return overview
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 },
  )

  let resultSummary: Vda65Results['resultSummary']

  if (nokCount === 0 && pendingCount === 0) {
    resultSummary = 'Pass'
  } else if (severityOverview.Critical > 0 || nokCount > Math.ceil(totalChecks * 0.25)) {
    resultSummary = 'Fail'
  } else {
    resultSummary = 'Conditional'
  }

  return {
    totalChecks,
    nokCount,
    okCount,
    pendingCount,
    defectOverview,
    severityOverview,
    resultSummary,
  }
}
