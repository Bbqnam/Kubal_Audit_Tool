import ActionPlanTable from '../../../components/ActionPlanTable'
import { MetricCard, PageHeader } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import {
  getClauseOptionsForStandard,
  kubalProcessAreaGroups,
  nonconformityTypeOptions,
} from '../data/nonconformityTemplate'
import { useGenericAuditWorkspace } from '../../shared/context/useGenericAuditWorkspace'
import { formatDate } from '../../../utils/dateUtils'

export default function GenericActionPlanPage() {
  const { audit, actionPlanItems, addActionPlanItem, updateActionPlanItem, saveActionPlanItem } = useGenericAuditWorkspace()
  const items = actionPlanItems
  const clauseOptions = getClauseOptionsForStandard(audit.standard)

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={audit.standard || 'Audit'}
        eyebrowTone={audit.auditType}
        title="Action plan"
        actions={
          <button type="button" className="button button-primary" onClick={addActionPlanItem}>
            <ButtonLabel icon="add" label="Add action" />
          </button>
        }
      />
      <div className="metrics-grid">
        <MetricCard label="Audit date" value={audit.auditDate ? formatDate(audit.auditDate) : 'Not set'} />
        <MetricCard label="Open items" value={items.filter((item) => item.status === 'Open').length} tone="warning" />
        <MetricCard label="In progress" value={items.filter((item) => item.status === 'In progress').length} />
        <MetricCard label="Closed" value={items.filter((item) => item.status === 'Closed').length} tone="success" />
      </div>
      <ActionPlanTable
        items={items}
        onUpdate={updateActionPlanItem}
        onSave={saveActionPlanItem}
        auditLabel={audit.standard || 'Audit'}
        auditDate={audit.auditDate}
        clauseOptions={clauseOptions}
        processAreaGroups={kubalProcessAreaGroups}
        nonconformityTypeOptions={nonconformityTypeOptions}
      />
    </div>
  )
}
