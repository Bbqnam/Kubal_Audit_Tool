import { useParams, Link } from 'react-router-dom'
import ExportCenter from '../../../components/ExportCenter'
import { ButtonLabel } from '../../../components/icons'
import { getAuditSectionPath, vda63ChapterTitles } from '../../../data/navigation'
import {
  chapterOrder,
  calculateVda63ChapterSummary,
  getVda63ChapterResultLabel,
  getVda63ChapterStatusLabel,
  scoreOptions,
} from '../../../utils/auditUtils'
import type { Vda63ChapterKey } from '../../../types/audit'
import { MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { useVda63AuditWorkspace } from '../../shared/context/useVda63AuditWorkspace'
import ChapterAuditSheet from '../components/ChapterAuditSheet'

function isChapterKey(value: string): value is Vda63ChapterKey {
  return chapterOrder.includes(value as Vda63ChapterKey)
}

function getChapterTone(chapterSummary: ReturnType<typeof calculateVda63ChapterSummary>) {
  if (chapterSummary.status === 'outOfScope' || chapterSummary.status === 'notEvaluated' || chapterSummary.status === 'inProgress') {
    return 'default' as const
  }

  if (chapterSummary.result === 'normal') {
    return 'success' as const
  }

  if (chapterSummary.result === 'followUp') {
    return 'warning' as const
  }

  return 'danger' as const
}

export default function Vda63ChapterPage() {
  const params = useParams<{ chapter: string }>()
  const chapterValue = params.chapter?.toUpperCase() ?? 'P2'
  const { audit, chapterScope, updateChapterScope, updateVda63Question, vda63Questions } = useVda63AuditWorkspace()

  if (!isChapterKey(chapterValue)) {
    return (
      <div className="notfound-page">
        <h1>Unknown chapter</h1>
        <p>The requested VDA 6.3 chapter is not configured in this workspace.</p>
        <Link to={getAuditSectionPath(audit.id, 'vda63')} className="button button-primary">
          <ButtonLabel icon="back" label="Back to audit info" />
        </Link>
      </div>
    )
  }

  const chapter = chapterValue
  const questions = vda63Questions.filter((question) => question.chapter === chapter)
  const chapterSummary = calculateVda63ChapterSummary(vda63Questions, chapter, chapterScope)
  const currentIndex = chapterOrder.indexOf(chapter)
  const previousChapter = currentIndex > 0 ? chapterOrder[currentIndex - 1] : undefined
  const nextChapter = currentIndex < chapterOrder.length - 1 ? chapterOrder[currentIndex + 1] : undefined
  const chapterPercentLabel = chapterSummary.percent === null ? getVda63ChapterStatusLabel(chapterSummary.status) : `${chapterSummary.percent}%`
  const chapterTone = getChapterTone(chapterSummary)
  const scoreValue =
    chapterSummary.percent === null
      ? chapterSummary.scope === 'outOfScope'
        ? 'n.e.'
        : 'Pending'
      : `${chapterSummary.totalScore} / ${chapterSummary.scoredQuestionCount * 10}`

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.3 chapter review"
        eyebrowTone="vda63"
        title={`${chapter} - ${vda63ChapterTitles[chapter]}`}
        subtitle="Compact digital audit sheet with aligned scoring, practical evidence capture, and clearer subgroup scanning."
      />

      <div className="metrics-grid">
        <MetricCard label="Chapter scope" value={chapterSummary.scope === 'inScope' ? 'In scope' : 'Out of scope'} />
        <MetricCard label="Chapter score" value={scoreValue} tone={chapterTone} />
        <MetricCard label="Current result" value={chapterPercentLabel} tone={chapterTone} />
      </div>

      <Panel
        title="Audit sheet guidance"
        description="The question content is fixed from the master VDA 6.3 bank. Auditors only enter scores, comments, and findings."
        actions={<StatusBadge value={getVda63ChapterStatusLabel(chapterSummary.status)} />}
      >
        <div className="audit-guidance-grid">
          <p className="panel-copy">
            {chapterSummary.scope === 'outOfScope'
              ? 'This chapter is currently out of scope. It stays neutral in the summary until you include it.'
              : chapterSummary.downgradeTriggered
                ? 'A star question scored 0 in this chapter, so downgrade logic is active and the summary will flag it explicitly.'
                : chapterSummary.status === 'inProgress'
                  ? 'This chapter is in progress. Partial scoring is shown separately from completed chapter results.'
                  : chapterSummary.status === 'notEvaluated'
                    ? 'This in-scope chapter has not been evaluated yet and remains neutral in the summary.'
                    : `This chapter is evaluated and currently classified as ${getVda63ChapterResultLabel(chapterSummary.result).toLowerCase()}.`}
          </p>
          <p className="panel-copy">
            Use the comment field for audit evidence and the finding field for concise evaluation statements suitable for the report and action plan.
          </p>
        </div>
        <div className="module-actions module-actions-spaced">
          <button
            type="button"
            className={chapterSummary.scope === 'inScope' ? 'button button-secondary' : 'button button-primary'}
            onClick={() => updateChapterScope(chapter, chapterSummary.scope !== 'inScope')}
          >
            <ButtonLabel icon={chapterSummary.scope === 'inScope' ? 'close' : 'add'} label={chapterSummary.scope === 'inScope' ? 'Mark out of scope' : 'Add to scope'} />
          </button>
        </div>
      </Panel>

      <ChapterAuditSheet
        chapter={chapter}
        chapterTitle={vda63ChapterTitles[chapter]}
        questions={questions}
        chapterSummary={chapterSummary}
        scoreOptions={scoreOptions}
        onUpdate={updateVda63Question}
      />

      <div className="module-actions">
        {previousChapter ? (
          <Link to={getAuditSectionPath(audit.id, 'vda63', previousChapter.toLowerCase())} className="button button-secondary">
            <ButtonLabel icon="back" label="Previous chapter" />
          </Link>
        ) : null}
        {nextChapter ? (
          <Link to={getAuditSectionPath(audit.id, 'vda63', nextChapter.toLowerCase())} className="button button-primary">
            <ButtonLabel icon="next" label="Next chapter" />
          </Link>
        ) : (
          <Link to={getAuditSectionPath(audit.id, 'vda63', 'summary')} className="button button-primary">
            <ButtonLabel icon="summary" label="Go to summary" />
          </Link>
        )}
      </div>

      <ExportCenter auditLabel={`${audit.title} - ${chapter}`} payload={audit} />
    </div>
  )
}
