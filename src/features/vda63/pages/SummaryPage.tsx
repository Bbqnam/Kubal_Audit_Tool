import { Link } from 'react-router-dom'
import ExportCenter from '../../../components/ExportCenter'
import { ButtonLabel } from '../../../components/icons'
import { getAuditSectionPath } from '../../../data/navigation'
import { MetricCard, PageHeader, Panel, StatusBadge, StatusLegend } from '../../../components/ui'
import { useVda63AuditWorkspace } from '../../shared/context/useVda63AuditWorkspace'
import {
  buildVda63ElementSummary,
  buildVda63Summary,
  getVda63ChapterResultLabel,
  getVda63ChapterStatusLabel,
} from '../../../utils/auditUtils'
import SummaryMatrix from '../components/SummaryMatrix'

function getSummaryTone(summary: ReturnType<typeof buildVda63Summary>) {
  if (summary.finalStatus === 'Downgraded' || summary.finalStatus === 'Escalation required') {
    return 'danger' as const
  }

  if (summary.finalStatus === 'Approved') {
    return 'success' as const
  }

  if (summary.finalStatus === 'Not evaluated' || summary.finalStatus === 'In progress') {
    return 'default' as const
  }

  return 'warning' as const
}

function getChapterRowClass(status: ReturnType<typeof buildVda63Summary>['chapters'][number]['status']) {
  return `report-summary-item report-summary-item-${status}`
}

export default function Vda63SummaryPage() {
  const { audit, chapterScope, vda63Questions } = useVda63AuditWorkspace()
  const summary = buildVda63Summary(vda63Questions, chapterScope)
  const p6Elements = chapterScope.includes('P6') ? buildVda63ElementSummary(vda63Questions, 'P6') : []
  const overallPercentLabel = summary.overallPercent === null ? 'n.e.' : `${summary.overallPercent}%`
  const finalResultTone = getSummaryTone(summary)

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.3"
        eyebrowTone="vda63"
        title="Summary"
        subtitle="Scope-aware evaluation view that separates neutral chapters from completed results and downgrade cases."
        actions={
          <Link to={getAuditSectionPath(audit.id, 'vda63', 'action-plan')} className="button button-primary">
            <ButtonLabel icon="checklist" label="Open action plan" />
          </Link>
        }
      />

      <div className="metrics-grid">
        <MetricCard label="Audited score" value={overallPercentLabel} tone={finalResultTone} />
        <MetricCard label="Final result" value={summary.finalStatus} tone={finalResultTone} />
        <MetricCard label="Completed chapters" value={`${summary.completedChapterCount}/${summary.inScopeChapterCount}`} tone={summary.inProgressChapterCount > 0 ? 'warning' : 'success'} />
      </div>

      <Panel title="Final evaluation" description="Only fully evaluated chapters that are in scope affect the final result.">
        <StatusLegend
          items={[
            { label: 'Completed', tone: 'neutral' },
            { label: 'In progress', tone: 'progress' },
            { label: 'Not evaluated', tone: 'attention' },
            { label: 'Out of scope', tone: 'muted' },
            { label: 'Downgraded', tone: 'danger' },
          ]}
        />
        <div className="summary-evaluation">
          <StatusBadge value={summary.finalStatus} />
          <p>
            {summary.overallPercent === null
              ? 'No in-scope chapter has been fully scored yet, so the summary remains neutral.'
              : `Total audited score ${summary.totalScore} out of ${summary.maxScore}.`}
            {' '}
            {summary.downgradeTriggered
              ? 'At least one completed chapter triggered a star-question downgrade.'
              : summary.inProgressChapterCount > 0
                ? `${summary.inProgressChapterCount} chapter(s) are still in progress and excluded from the final result.`
                : 'No downgrade is active.'}
          </p>
        </div>
      </Panel>

      <SummaryMatrix chapters={summary.chapters} p6Elements={p6Elements} />

      <div className="grid grid-panels">
        <Panel title="Chapter states" description="Neutral, in-progress, completed, and downgraded chapters are shown separately.">
          <ul className="report-summary-list">
            {summary.chapters.map((chapter) => (
              <li key={chapter.chapter} className={getChapterRowClass(chapter.status)}>
                <span>{chapter.chapter}</span>
                <strong>
                  {chapter.percent === null
                    ? getVda63ChapterStatusLabel(chapter.status)
                    : `${getVda63ChapterResultLabel(chapter.result)} • ${chapter.percent}%`}
                </strong>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Audit classification" description="Final classification is calculated only from chapters that were actually audited in scope.">
          <ul className="stack-list">
            <li>
              <strong>Final classification</strong>
              <p>{summary.finalStatus}</p>
            </li>
            <li>
              <strong>In-scope chapters</strong>
              <p>{summary.inScopeChapterCount}</p>
            </li>
            <li>
              <strong>Audited chapters</strong>
              <p>{summary.auditedChapterCount}</p>
            </li>
            <li>
              <strong>Neutral chapters</strong>
              <p>{summary.notEvaluatedChapterCount}</p>
            </li>
          </ul>
        </Panel>
      </div>

      <ExportCenter auditLabel={`${audit.title} Summary`} payload={audit} />
    </div>
  )
}
