import { EmptyState, MetricCard, PageHeader } from '../../../components/ui'
import ChecklistTable from '../../../components/ChecklistTable'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'

export default function Vda65FindingsPage() {
  const { vda65Checklist } = useVda65AuditWorkspace()
  const findings = vda65Checklist.filter((item) => item.status === 'NOK')

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Defects and findings"
        subtitle="Review every non-conformity recorded in the checklist and prepare inputs for corrective action planning."
      />
      <div className="metrics-grid">
        <MetricCard label="Open findings" value={findings.length} tone={findings.length ? 'warning' : 'success'} />
      </div>
      {findings.length ? (
        <ChecklistTable items={findings} />
      ) : (
        <EmptyState title="No product findings" description="Every checklist item is currently marked OK." />
      )}
    </div>
  )
}
