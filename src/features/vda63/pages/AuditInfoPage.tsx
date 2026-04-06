import { Link } from 'react-router-dom'
import ExportCenter from '../../../components/ExportCenter'
import { ButtonLabel } from '../../../components/icons'
import { getAuditSectionPath, vda63ChapterTitles } from '../../../data/navigation'
import { buildVda63Summary, chapterOrder, getVda63AnsweredCount, getVda63ChapterStatusLabel } from '../../../utils/auditUtils'
import { DetailList, Field, MetricCard, PageHeader, Panel, ProgressBar, StatusBadge } from '../../../components/ui'
import { useVda63AuditWorkspace } from '../../shared/context/useVda63AuditWorkspace'

export default function Vda63AuditInfoPage() {
  const { audit, chapterScope, updateAuditInfo, updateAuditTitle, updateChapterScope, vda63AuditInfo, vda63Questions } = useVda63AuditWorkspace()
  const summary = buildVda63Summary(vda63Questions, chapterScope)
  const scopedQuestionCount = vda63Questions.filter((question) => chapterScope.includes(question.chapter)).length
  const scopedStarQuestionCount = vda63Questions.filter((question) => chapterScope.includes(question.chapter) && question.isStarQuestion).length
  const answeredQuestions = getVda63AnsweredCount(vda63Questions, chapterScope)
  const progressPercent = scopedQuestionCount === 0 ? 0 : Math.round((answeredQuestions / scopedQuestionCount) * 100)
  const nextChapter = summary.chapters.find((chapter) => chapter.scope === 'inScope' && chapter.status !== 'completed' && chapter.status !== 'downgraded')?.chapter
  const nextStepLabel = nextChapter ? `Continue ${nextChapter}` : 'Review summary'
  const nextStepLink = nextChapter ? getAuditSectionPath(audit.id, 'vda63', nextChapter.toLowerCase()) : getAuditSectionPath(audit.id, 'vda63', 'summary')

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.3"
        eyebrowTone="vda63"
        title="Audit information"
        subtitle="Define the process-audit context, chapter scope, and next step from one control point."
      />

      <div className="metrics-grid">
        <MetricCard label="Questions in scope" value={scopedQuestionCount} />
        <MetricCard label="Star questions in scope" value={scopedStarQuestionCount} />
        <MetricCard label="Answered questions" value={`${answeredQuestions}/${scopedQuestionCount}`} tone="success" />
      </div>

      <Panel title="Audit control center" description="Monitor readiness, progress, and the next chapter from one place." actions={<StatusBadge value={vda63AuditInfo.auditStatus} />}>
        <div className="audit-control-grid">
          <div className="audit-control-primary">
            <div className="audit-control-header">
              <div>
                <span className="audit-control-label">Current progress</span>
                <h3>{nextStepLabel}</h3>
              </div>
              <Link to={nextStepLink} className="button button-primary button-emphasis">
                <ButtonLabel icon="next" label="Next step" />
              </Link>
            </div>
            <ProgressBar value={progressPercent} label={`${answeredQuestions} of ${scopedQuestionCount} in-scope questions documented`} />
            <div className="audit-control-status-row">
              <div className="audit-status-card">
                <span>Audit status</span>
                <strong>{vda63AuditInfo.auditStatus}</strong>
              </div>
              <div className="audit-status-card">
                <span>Suggested next action</span>
                <strong>{nextChapter ?? 'Summary'}</strong>
              </div>
            </div>
          </div>

          <div className="audit-control-nav">
            <div className="audit-control-nav-header">
              <span className="audit-control-label">Quick navigation</span>
              <p>Jump directly to any chapter review and see its current scope state.</p>
            </div>
            <div className="chapter-jump-grid">
              {summary.chapters.map((chapter) => (
                <Link
                  key={chapter.chapter}
                  to={getAuditSectionPath(audit.id, 'vda63', chapter.chapter.toLowerCase())}
                  className={`chapter-jump-link chapter-jump-link-${chapter.status}`}
                >
                  <span>{chapter.chapter}</span>
                  <strong>{vda63ChapterTitles[chapter.chapter]}</strong>
                  <small>{chapter.scope === 'outOfScope' ? 'Out of scope' : getVda63ChapterStatusLabel(chapter.status)}</small>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div className="form-grid">
        <Panel title="Audit details" description="Editable metadata stored locally in the workspace.">
          <div className="input-grid">
            <Field label="Audit title">
              <input value={audit.title} onChange={(event) => updateAuditTitle(event.target.value)} />
            </Field>
            <Field label="Audit status">
              <select value={vda63AuditInfo.auditStatus} onChange={(event) => updateAuditInfo('auditStatus', event.target.value)}>
                <option value="Not started">Not started</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
            </Field>
            <Field label="Site">
              <input value={vda63AuditInfo.site} onChange={(event) => updateAuditInfo('site', event.target.value)} />
            </Field>
            <Field label="Auditor">
              <input value={vda63AuditInfo.auditor} onChange={(event) => updateAuditInfo('auditor', event.target.value)} />
            </Field>
            <Field label="Audit date">
              <input type="date" value={vda63AuditInfo.date} onChange={(event) => updateAuditInfo('date', event.target.value)} />
            </Field>
            <Field label="Reference">
              <input value={vda63AuditInfo.reference} onChange={(event) => updateAuditInfo('reference', event.target.value)} />
            </Field>
            <Field label="Department">
              <input value={vda63AuditInfo.department} onChange={(event) => updateAuditInfo('department', event.target.value)} />
            </Field>
            <Field label="Customer">
              <input value={vda63AuditInfo.customer ?? ''} onChange={(event) => updateAuditInfo('customer', event.target.value)} />
            </Field>
            <Field label="Scope" full>
              <textarea rows={3} value={vda63AuditInfo.scope} onChange={(event) => updateAuditInfo('scope', event.target.value)} />
            </Field>
            <Field label="Notes" full>
              <textarea rows={4} value={vda63AuditInfo.notes} onChange={(event) => updateAuditInfo('notes', event.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Chapter scope" description="Only in-scope chapters affect the summary. Neutral chapters stay out of the result.">
          <div className="chapter-scope-grid">
            {chapterOrder.map((chapter) => {
              const chapterSummary = summary.chapters.find((item) => item.chapter === chapter)
              const isInScope = chapterScope.includes(chapter)

              return (
                <label key={chapter} className={`chapter-scope-card ${isInScope ? 'chapter-scope-card-active' : ''}`}>
                  <div className="chapter-scope-card-header">
                    <div>
                      <strong>{chapter}</strong>
                      <span>{vda63ChapterTitles[chapter]}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isInScope}
                      onChange={(event) => updateChapterScope(chapter, event.target.checked)}
                    />
                  </div>
                  <small>
                    {chapterSummary?.scope === 'outOfScope'
                      ? 'Out of scope'
                      : `${getVda63ChapterStatusLabel(chapterSummary?.status ?? 'notEvaluated')} • ${chapterSummary?.scoredQuestionCount ?? 0}/${chapterSummary?.questionCount ?? 0} scored`}
                  </small>
                </label>
              )
            })}
          </div>
        </Panel>

        <Panel title="Workflow" description="Shared audit concepts stay available throughout the module.">
          <DetailList
            items={[
              { label: 'Shared concept', value: 'Findings, comments, action plan, export center' },
              { label: 'Scoring model', value: '0 / 4 / 6 / 8 / 10 with chapter EG percentages, arithmetic A/B/C classification, and downgrade rules' },
              { label: 'Reporting path', value: 'Summary -> Action Plan -> Report Preview' },
            ]}
          />
          <div className="module-actions module-actions-spaced">
            <Link to={nextStepLink} className="button button-primary">
              <ButtonLabel icon="next" label={nextStepLabel} />
            </Link>
            <Link to={getAuditSectionPath(audit.id, 'vda63', 'summary')} className="button button-secondary">
              <ButtonLabel icon="summary" label="Summary" />
            </Link>
          </div>
        </Panel>
      </div>
      <ExportCenter auditLabel={audit.title} payload={audit} />
    </div>
  )
}
