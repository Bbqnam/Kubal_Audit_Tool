import ActionPlanTable from '../../../components/ActionPlanTable'
import { MetricCard, PageHeader } from '../../../components/ui'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'

export default function Vda65ActionPlanPage() {
  const { actionPlanItems, updateActionPlanItem } = useVda65AuditWorkspace()
  const items = actionPlanItems

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Action plan"
        subtitle="Corrective-action tracking for product audit defects, containment steps, owners, and closure notes."
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
