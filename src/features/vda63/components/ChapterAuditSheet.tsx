import { Fragment, useEffect, useRef } from 'react'
import type { Vda63AuditQuestion, Vda63ChapterKey, Vda63ChapterSummary } from '../../../types/audit'

function AutoGrowTextarea({
  value,
  disabled,
  placeholder,
  onChange,
}: {
  value: string
  disabled?: boolean
  placeholder: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    ref.current.style.height = '0px'
    ref.current.style.height = `${Math.max(38, ref.current.scrollHeight)}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      className="audit-sheet-textarea"
      rows={1}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

type QuestionGroup = {
  key: string
  number: string
  text: string
  sectionLabel?: string
  hasStarQuestion: boolean
  items: Vda63AuditQuestion[]
}

function buildQuestionGroups(chapter: Vda63ChapterKey, questions: Vda63AuditQuestion[]): QuestionGroup[] {
  const groups: QuestionGroup[] = []
  const groupLookup = new Map<string, QuestionGroup>()

  questions.forEach((question) => {
    const existingGroup = groupLookup.get(question.number)

    if (existingGroup) {
      existingGroup.items.push(question)
      existingGroup.hasStarQuestion = existingGroup.hasStarQuestion || question.isStarQuestion
      return
    }

    const nextGroup: QuestionGroup = {
      key: question.number,
      number: question.number,
      text: question.text,
      sectionLabel: chapter === 'P6' ? question.subgroup ?? question.group : undefined,
      hasStarQuestion: question.isStarQuestion,
      items: [question],
    }

    groupLookup.set(question.number, nextGroup)
    groups.push(nextGroup)
  })

  return groups
}

export default function ChapterAuditSheet({
  chapter,
  chapterTitle,
  questions,
  chapterSummary,
  onUpdate,
  scoreOptions,
}: {
  chapter: Vda63ChapterKey
  chapterTitle: string
  questions: Vda63AuditQuestion[]
  chapterSummary: Vda63ChapterSummary
  scoreOptions: readonly number[]
  onUpdate: (id: string, patch: Partial<Pick<Vda63AuditQuestion, 'score' | 'comment' | 'finding'>>) => void
}) {
  const questionGroups = buildQuestionGroups(chapter, questions)
  const isEditable = chapterSummary.scope === 'inScope'

  return (
    <div className="audit-sheet-card">
      <div className="audit-sheet-heading">
        <div>
          <span>Assessment questions</span>
          <strong>{chapter} - {chapterTitle}</strong>
        </div>
        <p>
          {isEditable
            ? 'Compact audit-sheet layout with grouped questions, short score entry, and evidence fields that expand only when needed.'
            : 'This chapter is outside the active audit scope and remains neutral in the summary until re-enabled.'}
        </p>
      </div>
      <div className="table-card audit-sheet-table">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>*</th>
              <th>Question / requirement</th>
              <th>Score</th>
              <th>Comment / evidence</th>
              <th>Finding / conclusion</th>
            </tr>
          </thead>
          <tbody>
            {questionGroups.map((group, index) => {
              const previousSectionLabel = index > 0 ? questionGroups[index - 1]?.sectionLabel : undefined
              const shouldRenderSection = Boolean(group.sectionLabel && group.sectionLabel !== previousSectionLabel)

              return (
                <Fragment key={group.key}>
                  {shouldRenderSection ? (
                    <tr className="audit-sheet-section-row">
                      <td colSpan={6}>
                        <span>{group.sectionLabel}</span>
                      </td>
                    </tr>
                  ) : null}

                  {group.items.length > 1 ? (
                    <tr className="audit-sheet-question-header-row">
                      <td className="audit-sheet-number">
                        <strong>{group.number}</strong>
                      </td>
                      <td className="audit-sheet-star">{group.hasStarQuestion ? '★' : ''}</td>
                      <td className="audit-sheet-question" colSpan={4}>{group.text}</td>
                    </tr>
                  ) : null}

                  {group.items.map((question) => (
                    <tr
                      key={question.id}
                      className={group.items.length > 1 ? 'audit-sheet-detail-row' : 'audit-sheet-entry-row'}
                    >
                      {group.items.length > 1 ? (
                        <td className="audit-sheet-entry-label" colSpan={3}>
                          <span>{question.productProcessType ?? 'Assessment line'}</span>
                        </td>
                      ) : (
                        <>
                          <td className="audit-sheet-number">
                            <strong>{question.number}</strong>
                            {question.productProcessType ? <small>{question.productProcessType}</small> : null}
                          </td>
                          <td className="audit-sheet-star">{question.isStarQuestion ? '★' : ''}</td>
                          <td className="audit-sheet-question">{question.text}</td>
                        </>
                      )}
                      <td className="audit-sheet-score">
                        <select
                          className="audit-sheet-score-select"
                          value={question.score ?? ''}
                          disabled={!isEditable}
                          onChange={(event) =>
                            onUpdate(question.id, {
                              score: event.target.value === '' ? null : (Number(event.target.value) as Vda63AuditQuestion['score']),
                            })
                          }
                        >
                          <option value="">n.e.</option>
                          {scoreOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <AutoGrowTextarea
                          value={question.comment}
                          disabled={!isEditable}
                          placeholder="Evidence, reference, sample..."
                          onChange={(value) => onUpdate(question.id, { comment: value })}
                        />
                      </td>
                      <td>
                        <AutoGrowTextarea
                          value={question.finding}
                          disabled={!isEditable}
                          placeholder="Concise audit conclusion..."
                          onChange={(value) => onUpdate(question.id, { finding: value })}
                        />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
