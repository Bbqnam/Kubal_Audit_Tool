import { useNavigate } from 'react-router-dom'
import ActivityLog from '../../../components/ActivityLog'
import AuditTeamEditor from '../../../components/AuditTeamEditor'
import { ButtonLabel } from '../../../components/icons'
import ExportCenter from '../../../components/ExportCenter'
import MetadataSection from '../../../components/MetadataSection'
import { DetailList, Field, MetricCard, PageHeader, Panel } from '../../../components/ui'
import { getAuditTitleLabel, getAuditTypeFamilyLabel, getAuditTypeLabel, getAuditWorkspaceKind } from '../../../data/auditTypes'
import { getAuditRecordHomePath, getAuditSectionPath, getPlanningCalendarPath } from '../../../data/navigation'
import { useGenericAuditWorkspace } from '../../shared/context/useGenericAuditWorkspace'
import { sharedAuditTemplateOptions } from '../data/nonconformityTemplate'
import { getAuditInfoMetadataItems, getAuditInfoMetadataNote } from '../../../utils/traceability'

export default function GenericAuditInfoPage() {
  const navigate = useNavigate()
  const {
    audit,
    auditTeam,
    genericAuditInfo,
    updateAuditInfo,
    updateAuditTeam,
    updateAuditStandard,
    updateAuditTitle,
    updateAuditRecord,
    changeAuditType,
    getPlanById,
    users,
    actionPlanItems,
  } = useGenericAuditWorkspace()
  const auditTypeLabel = getAuditTypeLabel(audit.auditType)
  const selectedTemplateOption = sharedAuditTemplateOptions.find((option) => option.standard === audit.standard)
  const workflowLabel = selectedTemplateOption?.workflowLabel ?? (getAuditWorkspaceKind(audit.auditType) === 'generic' ? 'Shared report template' : 'Dedicated template')
  const linkedPlanRecord = audit.planRecordId ? getPlanById(audit.planRecordId) ?? null : null

  function handleChangeTemplate(nextStandard: string) {
    if (!nextStandard) {
      updateAuditStandard('')
      return
    }

    const templateOption = sharedAuditTemplateOptions.find((option) => option.standard === nextStandard)

    updateAuditStandard(nextStandard)

    if (!audit.title.trim() || audit.title === getAuditTitleLabel(audit.auditType) || audit.title === 'Audit Report' || sharedAuditTemplateOptions.some((option) => option.suggestedTitle === audit.title)) {
      updateAuditTitle(templateOption?.suggestedTitle ?? 'Audit Report')
    }
  }

  function handleContinueTemplate() {
    const templateOption = selectedTemplateOption

    if (!templateOption) {
      navigate(getAuditSectionPath(audit.id, audit.auditType, 'report'))
      return
    }

    let nextRecord = audit

    if (templateOption.auditType !== audit.auditType) {
      const changedRecord = changeAuditType(audit.id, templateOption.auditType)

      if (changedRecord) {
        nextRecord = changedRecord
      }
    }

    updateAuditRecord(nextRecord.id, (current) => ({
      ...current,
      standard: templateOption.standard,
    }))

    if (nextRecord.auditType === 'vda63' || nextRecord.auditType === 'vda65') {
      navigate(getAuditRecordHomePath(nextRecord))
      return
    }

    navigate(getAuditSectionPath(nextRecord.id, nextRecord.auditType, 'report'))
  }

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={auditTypeLabel}
        eyebrowTone={audit.auditType}
        title="Audit information"
        subtitle="Core audit setup for the shared template before you switch into a specialised workflow."
      />

      <div className="metrics-grid">
        <MetricCard label="Template" value={selectedTemplateOption?.label ?? auditTypeLabel} />
        <MetricCard label="Workflow" value={workflowLabel} />
        <MetricCard label="Action items" value={actionPlanItems.length} tone={actionPlanItems.length ? 'warning' : 'default'} />
      </div>

      <div className="form-grid">
        <Panel
          title="Audit setup"
          description="Choose the template, set the core audit details, and continue into the matching workflow from one place."
          className="panel-span-full"
          actions={
            <div className="panel-inline-controls">
              <label className="panel-inline-field">
                <span>Audit status</span>
                <select value={genericAuditInfo.auditStatus} onChange={(event) => updateAuditInfo('auditStatus', event.target.value)}>
                  <option value="Not started">Not started</option>
                  <option value="In progress">In progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <button type="button" className="button button-primary" onClick={handleContinueTemplate} disabled={!audit.standard.trim()}>
                <ButtonLabel icon="next" label={selectedTemplateOption?.auditType === 'vda63' || selectedTemplateOption?.auditType === 'vda65' ? 'Open template' : 'Next: audit report'} />
              </button>
            </div>
          }
        >
          <div className="input-grid">
            <Field label="Audit template">
              <select value={audit.standard} onChange={(event) => handleChangeTemplate(event.target.value)}>
                <option value="">Select audit template</option>
                {sharedAuditTemplateOptions.map((option) => (
                  <option key={option.id} value={option.standard}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Audit title">
              <input value={audit.title} onChange={(event) => updateAuditTitle(event.target.value)} />
            </Field>
            <Field label="Site">
              <input value={genericAuditInfo.site} onChange={(event) => updateAuditInfo('site', event.target.value)} />
            </Field>
            <Field label="Audit date">
              <input type="date" value={genericAuditInfo.date} onChange={(event) => updateAuditInfo('date', event.target.value)} />
            </Field>
            <Field label="Scope">
              <textarea rows={3} value={genericAuditInfo.scope} onChange={(event) => updateAuditInfo('scope', event.target.value)} />
            </Field>
            <Field label="Notes">
              <textarea rows={3} value={genericAuditInfo.notes} onChange={(event) => updateAuditInfo('notes', event.target.value)} />
            </Field>
            <Field label="Audit team" full>
              <AuditTeamEditor
                users={users}
                leadAuditor={genericAuditInfo.auditor}
                auditTeam={auditTeam}
                onLeadAuditorChange={(value) => updateAuditInfo('auditor', value)}
                onAuditTeamChange={updateAuditTeam}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Workflow"
          description="The selected template can stay traceable to a planned audit when it was created from the calendar."
          actions={
            linkedPlanRecord ? (
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => navigate(getPlanningCalendarPath({ month: linkedPlanRecord.month, recordId: linkedPlanRecord.id }))}
              >
                <ButtonLabel icon="calendar" label="Open calendar entry" />
              </button>
            ) : null
          }
        >
          <DetailList
            items={[
              { label: 'Selected template', value: auditTypeLabel },
              { label: 'Template standard', value: selectedTemplateOption?.label ?? audit.standard ?? 'Choose a template above' },
              { label: 'Audit family', value: getAuditTypeFamilyLabel(audit.auditType) },
              { label: 'Standard', value: audit.standard || 'Add the applicable standard or programme above' },
              { label: 'Planning link', value: linkedPlanRecord ? `${linkedPlanRecord.title} · ${linkedPlanRecord.plannedStart}` : 'Not linked to a planning record yet' },
              { label: 'Next step', value: selectedTemplateOption?.auditType === 'vda63' || selectedTemplateOption?.auditType === 'vda65' ? 'Use Open template to move into the dedicated VDA workflow.' : 'Use the Next button above to continue into Audit Report and Action Plan.' },
            ]}
          />
        </Panel>

        <Panel title="Metadata" description="Controlled identifiers and update ownership for this audit record.">
          <MetadataSection items={getAuditInfoMetadataItems(audit)} note={getAuditInfoMetadataNote(audit)} />
        </Panel>

        <Panel title="Activity log" description="Newest audit events first.">
          <ActivityLog history={audit.history} />
        </Panel>
      </div>

      <ExportCenter auditLabel={audit.title} payload={audit} />
    </div>
  )
}
