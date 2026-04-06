import ActionPlanTable from '../../../components/ActionPlanTable'
import { MetricCard, PageHeader } from '../../../components/ui'
import { useVda63AuditWorkspace } from '../../shared/context/useVda63AuditWorkspace'

export default function Vda63ActionPlanPage() {
  const { actionPlanItems, updateActionPlanItem } = useVda63AuditWorkspace()
  const items = actionPlanItems

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.3"
        eyebrowTone="vda63"
        title="Action plan"
        subtitle="Shared corrective-action workspace for process audit findings, owners, due dates, and completion notes."
      />
      <div className="metrics-grid">
        <MetricCard label="Open items" value={items.filter((item) => item.status === 'Open').length} tone="warning" />
        <MetricCard label="In progress" value={items.filter((item) => item.status === 'In progress').length} />
        <MetricCard label="Closed" value={items.filter((item) => item.status === 'Closed').length} tone="success" />
      </div>
      <ActionPlanTable items={items} onUpdate={updateActionPlanItem} />
    </div>
  )
}
