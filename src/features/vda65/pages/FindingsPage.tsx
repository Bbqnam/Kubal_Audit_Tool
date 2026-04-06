import { EmptyState, MetricCard, PageHeader } from '../../../components/ui'
import ChecklistTable from '../../../components/ChecklistTable'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'

export default function Vda65FindingsPage() {
  const { vda65Checklist } = useVda65AuditWorkspace()
  const findings = vda65Checklist.filter((item) => item.status === 'NOK')
  const defectPoints = findings.reduce((sum, item) => {
    if (item.defectClass === 'A') {
      return sum + Math.max(1, item.defectCount) * 100
    }

    if (item.defectClass === 'B') {
      return sum + Math.max(1, item.defectCount) * 50
    }

    return sum + Math.max(1, item.defectCount) * 10
  }, 0)

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Defects and findings"
        subtitle="Review every NOK checklist item, including its workbook defect class and the points it contributes to the audit result."
      />
      <div className="metrics-grid">
        <MetricCard label="Open findings" value={findings.length} tone={findings.length ? 'warning' : 'success'} />
        <MetricCard label="Defect points" value={defectPoints} tone={defectPoints >= 150 ? 'danger' : defectPoints > 50 ? 'warning' : 'success'} />
      </div>
      {findings.length ? (
        <ChecklistTable items={findings} />
      ) : (
        <EmptyState title="No product findings" description="Every checklist item is currently marked OK." />
      )}
    </div>
  )
}
