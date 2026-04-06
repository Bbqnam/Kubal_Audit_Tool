import ActionPlanTable from '../../../components/ActionPlanTable'
import { MetricCard, PageHeader } from '../../../components/ui'
import { getAuditTypeLabel } from '../../../data/auditTypes'
import { useGenericAuditWorkspace } from '../../shared/context/useGenericAuditWorkspace'

export default function GenericActionPlanPage() {
  const { audit, actionPlanItems, addActionPlanItem, updateActionPlanItem } = useGenericAuditWorkspace()
  const items = actionPlanItems

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={getAuditTypeLabel(audit.auditType)}
        eyebrowTone={audit.auditType}
        title="Action plan"
        subtitle="Track findings, containment, owners, due dates, and closure notes for this audit record."
        actions={
          <button type="button" className="button button-primary" onClick={addActionPlanItem}>
            Add action
          </button>
        }
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
