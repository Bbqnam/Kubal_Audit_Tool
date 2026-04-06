import ExportCenter from '../../../components/ExportCenter'
import { DetailList, MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'
import { calculateVda65Results } from '../../../utils/auditUtils'

export default function Vda65ResultsPage() {
  const { audit, vda65Checklist } = useVda65AuditWorkspace()
  const results = calculateVda65Results(vda65Checklist)

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Results"
        subtitle="Workbook-aligned product-audit scoring based on defect classes A/B/C and the resulting VDA 6.5 decision."
      />
      <div className="metrics-grid">
        <MetricCard label="Total checks" value={results.totalChecks} />
        <MetricCard label="Reviewed" value={results.reviewedCount} />
        <MetricCard label="Defect points" value={results.totalScore} tone={results.totalScore >= 150 ? 'danger' : results.totalScore > 50 ? 'warning' : 'success'} />
        <MetricCard label="Decision" value={results.auditDecision} tone={results.auditDecision === 'Audit Failed' ? 'danger' : results.auditDecision === 'OK' ? 'success' : 'warning'} />
      </div>
      <div className="grid grid-panels">
        <Panel title="Result summary" description="Overall product-audit decision, workbook score band, and completion context.">
          <div className="summary-evaluation">
            <StatusBadge value={results.auditDecision} />
            <p>{results.pendingCount > 0 ? `${results.pendingCount} checks are still pending review.` : 'All checklist items have been reviewed.'}</p>
          </div>
          <DetailList
            items={[
              { label: 'Reviewed checks', value: `${results.reviewedCount}/${results.totalChecks}` },
              { label: 'Detected defects', value: results.totalDefects },
              { label: 'Defect points', value: results.totalScore },
              { label: 'Score band', value: results.resultBand ?? 'n/a' },
              { label: 'Decision', value: results.auditDecision },
            ]}
          />
        </Panel>
        <Panel title="Class overview" description="Detected defects summarized by workbook defect class and point value.">
          <ul className="report-summary-list">
            {Object.entries(results.defectClassOverview).map(([defectClass, count]) => (
              <li key={defectClass}>
                <span>Class {defectClass}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Score thresholds" description="Workbook thresholds imported from the public VDA 6.5 sample.">
          <ul className="report-summary-list">
            <li><span>0 - 50</span><strong>Very Good (OK)</strong></li>
            <li><span>51 - 100</span><strong>Good (OK)</strong></li>
            <li><span>101 - 149</span><strong>Satisfactory (OK)</strong></li>
            <li><span>150+</span><strong>Not OK (Audit Failed)</strong></li>
          </ul>
        </Panel>
      </div>
      <ExportCenter auditLabel={`${audit.title} Results`} payload={audit} />
    </div>
  )
}
