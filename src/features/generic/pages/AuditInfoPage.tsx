import { useNavigate } from 'react-router-dom'
import ExportCenter from '../../../components/ExportCenter'
import { DetailList, Field, MetricCard, PageHeader, Panel } from '../../../components/ui'
import { auditTemplateSelectionTypes, getAuditTitleLabel, getAuditTypeFamilyLabel, getAuditTypeLabel, getAuditWorkspaceKind } from '../../../data/auditTypes'
import { getAuditRecordHomePath } from '../../../data/navigation'
import { useGenericAuditWorkspace } from '../../shared/context/useGenericAuditWorkspace'
import type { AuditType } from '../../../types/audit'

export default function GenericAuditInfoPage() {
  const navigate = useNavigate()
  const { audit, genericAuditInfo, updateAuditInfo, updateAuditStandard, updateAuditTitle, actionPlanItems, changeAuditType } = useGenericAuditWorkspace()
  const auditTypeLabel = getAuditTypeLabel(audit.auditType)
  const workflowLabel = getAuditWorkspaceKind(audit.auditType) === 'generic' ? 'Shared template' : 'Dedicated template'

  function handleChangeTemplate(nextAuditType: string) {
    const updatedAudit = changeAuditType(audit.id, nextAuditType as AuditType)

    if (updatedAudit) {
      navigate(getAuditRecordHomePath(updatedAudit))
    }
  }

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={auditTypeLabel}
        eyebrowTone={audit.auditType}
        title="Audit information"
        subtitle="Start from one shared audit template. Selecting a specialised template switches this record into the matching questionnaire or checklist workflow."
      />

      <div className="metrics-grid">
        <MetricCard label="Template" value={auditTypeLabel} />
        <MetricCard label="Status" value={genericAuditInfo.auditStatus} tone={genericAuditInfo.auditStatus === 'Completed' ? 'success' : genericAuditInfo.auditStatus === 'In progress' ? 'warning' : 'default'} />
        <MetricCard label="Action items" value={actionPlanItems.length} tone={actionPlanItems.length ? 'warning' : 'default'} />
      </div>

      <div className="form-grid">
        <Panel title="Template selection" description="Choose the audit type first. Specialised templates open their own dedicated question or checklist workflows.">
          <div className="input-grid">
            <Field label="Audit template">
              <select value={audit.auditType} onChange={(event) => handleChangeTemplate(event.target.value)}>
                {auditTemplateSelectionTypes.map((auditType) => (
                  <option key={auditType} value={auditType}>
                    {getAuditTitleLabel(auditType)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Workflow mode">
              <input value={workflowLabel} readOnly />
            </Field>
          </div>
        </Panel>

        <Panel title="Audit details" description="These core fields stay consistent across the shared template before you move into any specialised audit content.">
          <div className="input-grid">
            <Field label="Audit title">
              <input value={audit.title} onChange={(event) => updateAuditTitle(event.target.value)} />
            </Field>
            <Field label="Standard">
              <input value={audit.standard} onChange={(event) => updateAuditStandard(event.target.value)} placeholder="ISO 9001, EcoVadis, local programme..." />
            </Field>
            <Field label="Audit status">
              <select value={genericAuditInfo.auditStatus} onChange={(event) => updateAuditInfo('auditStatus', event.target.value)}>
                <option value="Not started">Not started</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
            </Field>
            <Field label="Reference">
              <input value={genericAuditInfo.reference} onChange={(event) => updateAuditInfo('reference', event.target.value)} />
            </Field>
            <Field label="Site">
              <input value={genericAuditInfo.site} onChange={(event) => updateAuditInfo('site', event.target.value)} />
            </Field>
            <Field label="Auditor">
              <input value={genericAuditInfo.auditor} onChange={(event) => updateAuditInfo('auditor', event.target.value)} />
            </Field>
            <Field label="Audit date">
              <input type="date" value={genericAuditInfo.date} onChange={(event) => updateAuditInfo('date', event.target.value)} />
            </Field>
            <Field label="Department">
              <input value={genericAuditInfo.department} onChange={(event) => updateAuditInfo('department', event.target.value)} />
            </Field>
            <Field label="Customer">
              <input value={genericAuditInfo.customer ?? ''} onChange={(event) => updateAuditInfo('customer', event.target.value)} />
            </Field>
            <Field label="Scope" full>
              <textarea rows={3} value={genericAuditInfo.scope} onChange={(event) => updateAuditInfo('scope', event.target.value)} />
            </Field>
            <Field label="Notes" full>
              <textarea rows={4} value={genericAuditInfo.notes} onChange={(event) => updateAuditInfo('notes', event.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Workflow" description="The shared template becomes the working audit container until a specific standard or specialised format is selected.">
          <DetailList
            items={[
              { label: 'Selected template', value: auditTypeLabel },
              { label: 'Audit family', value: getAuditTypeFamilyLabel(audit.auditType) },
              { label: 'Standard', value: audit.standard || 'Add the applicable standard or programme above' },
              { label: 'Next step', value: audit.auditType === 'template' ? 'Choose an audit template above to continue with the right workflow' : 'Complete audit details, then continue in the selected workflow' },
            ]}
          />
        </Panel>
      </div>

      <ExportCenter auditLabel={audit.title} payload={audit} />
    </div>
  )
}
