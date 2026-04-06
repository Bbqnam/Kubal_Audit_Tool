import { Link } from 'react-router-dom'
import ChecklistTable from '../../../components/ChecklistTable'
import ExportCenter from '../../../components/ExportCenter'
import { getAuditSectionPath } from '../../../data/navigation'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'
import { calculateVda65Results } from '../../../utils/auditUtils'
import { MetricCard, PageHeader } from '../../../components/ui'

export default function Vda65ChecklistPage() {
  const { audit, updateVda65ChecklistItem, vda65Checklist } = useVda65AuditWorkspace()
  const results = calculateVda65Results(vda65Checklist)

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Checklist"
        subtitle="Track OK / NOK status for each requirement and capture the defect context directly in the table."
      />
      <div className="metrics-grid">
        <MetricCard label="Total checks" value={results.totalChecks} />
        <MetricCard label="OK" value={results.okCount} tone="success" />
        <MetricCard label="NOK" value={results.nokCount} tone={results.nokCount > 0 ? 'warning' : 'success'} />
      </div>
      <ChecklistTable items={vda65Checklist} onUpdate={updateVda65ChecklistItem} />
      <div className="module-actions">
        <Link to={getAuditSectionPath(audit.id, 'vda65', 'results')} className="button button-secondary">
          View results
        </Link>
      </div>
      <ExportCenter auditLabel={`${audit.title} Checklist`} payload={audit} />
    </div>
  )
}
