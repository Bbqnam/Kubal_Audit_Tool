import ExportCenter from '../../../components/ExportCenter'
import { DetailList, PageHeader, Panel, StatusBadge, StatusLegend } from '../../../components/ui'
import { useVda63AuditWorkspace } from '../../shared/context/useVda63AuditWorkspace'
import { getVda63ChapterStatusLabel, buildVda63Summary } from '../../../utils/auditUtils'

function getChapterRowClass(status: ReturnType<typeof buildVda63Summary>['chapters'][number]['status']) {
  return `report-summary-item report-summary-item-${status}`
}

export default function Vda63ReportPreviewPage() {
  const { audit, actionPlanItems, chapterScope, vda63AuditInfo, vda63Participants, vda63Questions } = useVda63AuditWorkspace()
  const summary = buildVda63Summary(vda63Questions, chapterScope)
  const keyFindings = vda63Questions.filter(
    (question) =>
      chapterScope.includes(question.chapter) &&
      ((question.score !== null && question.score <= 6) || (question.isStarQuestion && question.score === 0)),
  )
  const relevantActions = actionPlanItems
  const downgradeChapters = summary.chapters.filter((chapter) => chapter.downgradeTriggered).map((chapter) => chapter.chapter)
  const conclusionText = summary.downgradeTriggered
    ? 'The process audit triggered one or more VDA 6.3 downgrade rules. The final A/B/C classification therefore reflects both achievement level and downgrade constraints.'
    : summary.overallPercent === null
      ? 'The process audit has not yet produced a completed chapter result and remains neutral.'
      : `The audited process achieved an arithmetic achievement level of ${summary.overallPercent}% and is assessed as ${summary.finalStatus}.`
  const scopedChapters = summary.chapters.filter((chapter) => chapter.scope === 'inScope').map((chapter) => chapter.chapter)
  const auditCarriedOutText = scopedChapters.length
    ? `The audit scope currently covers chapters ${scopedChapters.join(', ')}. Only completed in-scope chapters contribute to the formal A/B/C classification.`
    : 'No VDA 6.3 chapter is currently marked as in scope.'

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.3"
        eyebrowTone="vda63"
        title="Report preview"
        subtitle="Formal report structure prepared for future PDF output, using a cleaner internal presentation than the legacy spreadsheet format."
      />

      <section className="report-preview-layout">
        <Panel title="Audit header information" description="Core report header and audit identification details.">
          <DetailList
            items={[
              { label: 'Audit title', value: audit.title },
              { label: 'Site', value: vda63AuditInfo.site },
              { label: 'Auditor', value: vda63AuditInfo.auditor },
              { label: 'Audit date', value: vda63AuditInfo.date },
              { label: 'Reference', value: vda63AuditInfo.reference },
              { label: 'Department', value: vda63AuditInfo.department },
              { label: 'Scope', value: vda63AuditInfo.scope },
            ]}
          />
        </Panel>

        <Panel title="Audit result" description="Formal audit outcome with chapter-level supporting evidence.">
          <StatusLegend
            items={[
              { label: 'Completed', tone: 'neutral' },
              { label: 'In progress', tone: 'progress' },
              { label: 'Not evaluated', tone: 'attention' },
              { label: 'Out of scope', tone: 'muted' },
              { label: 'Downgraded by rule', tone: 'danger' },
            ]}
          />
          <div className="report-callout">
            <span>Final classification</span>
            <StatusBadge value={summary.finalStatus} />
          </div>
          <ul className="report-summary-list">
            {summary.chapters.map((row) => (
              <li key={row.chapter} className={getChapterRowClass(row.status)}>
                <span>{row.chapter}</span>
                <span>{row.percent === null ? getVda63ChapterStatusLabel(row.status) : `${row.percent}%`}</span>
                <StatusBadge value={getVda63ChapterStatusLabel(row.status)} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Summary of the audit carried out" description="Narrative summary suitable for a formal report body.">
          <p className="panel-copy">{auditCarriedOutText}</p>
          <p className="panel-copy">
            The audit focused on process capability, evidence of implementation, supplier oversight, production execution, and the effectiveness of customer-facing feedback loops.
          </p>
        </Panel>

        <Panel title="Significant findings" description="Most relevant findings to carry into the final audit report.">
          <ul className="stack-list">
            {keyFindings.length ? (
              keyFindings.map((question) => (
                <li key={question.id}>
                  <strong>{question.number} - {question.chapter}</strong>
                  <p>{question.finding || 'No narrative captured yet.'}</p>
                </li>
              ))
            ) : (
              <li>
                <strong>No significant findings</strong>
                <p>No low-score or star-question findings are currently recorded.</p>
              </li>
            )}
          </ul>
        </Panel>

        <div className="grid grid-panels">
          <Panel title="Conclusion" description="Overall conclusion of the VDA 6.3 audit.">
            <p className="panel-copy">{conclusionText}</p>
          </Panel>
          <Panel title="Further action" description="Follow-up actions and downgrade observations.">
            <p className="panel-copy">
              {downgradeChapters.length
                ? `Downgrade handling applies to ${downgradeChapters.join(', ')}. Corrective action closure is required before the audit can be reclassified upward.`
                : summary.inProgressChapterCount > 0
                  ? `${summary.inProgressChapterCount} chapter(s) are still in progress and remain outside the formal final result.`
                  : 'No downgrade rule is currently active. Continue with the planned corrective actions and monitoring cadence.'}
            </p>
          </Panel>
        </div>

        <div className="grid grid-panels">
          <Panel title="Participants" description="Key participants involved in the audit and review process.">
            <ul className="stack-list">
              {vda63Participants.map((participant) => (
                <li key={participant}>
                  <strong>{participant}</strong>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Action plan summary" description="Condensed list of corrective actions linked to the audit result.">
            <ul className="stack-list">
              {relevantActions.map((item) => (
                <li key={item.id}>
                  <strong>{item.section} - {item.owner}</strong>
                  <p>{item.action}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      <ExportCenter
        auditLabel={`${audit.title} Report Preview`}
        payload={audit}
      />
    </div>
  )
}
