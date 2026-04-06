import ExportCenter from '../../../components/ExportCenter'
import { MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
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
        subtitle="Summarized product-audit performance, defect distribution, and the resulting audit decision."
      />
      <div className="metrics-grid">
        <MetricCard label="Total checks" value={results.totalChecks} />
        <MetricCard label="Pending" value={results.pendingCount} />
        <MetricCard label="NOK count" value={results.nokCount} tone={results.nokCount > 0 ? 'warning' : 'success'} />
        <MetricCard label="Result summary" value={results.resultSummary} tone={results.resultSummary === 'Fail' ? 'danger' : results.resultSummary === 'Conditional' ? 'warning' : 'success'} />
      </div>
      <div className="grid grid-panels">
        <Panel title="Result summary">
          <p>Total checks: {results.totalChecks}</p>
          <p>NOK count: {results.nokCount}</p>
          <div className="summary-tags">
            <StatusBadge value={results.resultSummary} />
          </div>
        </Panel>
        <Panel title="Defect overview">
          <ul className="report-summary-list">
            {Object.entries(results.defectOverview).map(([type, count]) => (
              <li key={type}>
                <span>{type}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Severity overview">
          <ul className="report-summary-list">
            {Object.entries(results.severityOverview).map(([severity, count]) => (
              <li key={severity}>
                <span>{severity}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <ExportCenter auditLabel={`${audit.title} Results`} payload={audit} />
    </div>
  )
}
