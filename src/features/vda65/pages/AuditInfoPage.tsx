import { Link } from 'react-router-dom'
import ActivityLog from '../../../components/ActivityLog'
import ExportCenter from '../../../components/ExportCenter'
import { ButtonLabel } from '../../../components/icons'
import MetadataSection from '../../../components/MetadataSection'
import { getAuditSectionPath } from '../../../data/navigation'
import { DetailList, Field, MetricCard, PageHeader, Panel } from '../../../components/ui'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'
import { getAuditInfoMetadataItems, getAuditInfoMetadataNote } from '../../../utils/traceability'

export default function Vda65AuditInfoPage() {
  const { audit, updateAuditInfo, updateAuditTitle, vda65AuditInfo, vda65Checklist } = useVda65AuditWorkspace()

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Audit information"
        subtitle="Set the product-audit context, then move into product details and checklist execution."
      />

      <div className="metrics-grid">
        <MetricCard label="Checks in scope" value={vda65Checklist.length} />
        <MetricCard label="Audit stream" value="Product audit" />
        <MetricCard label="Next step" value="Product info" tone="success" />
      </div>

      <div className="form-grid">
        <Panel title="Audit details" description="Core metadata for the current product audit record.">
          <div className="input-grid">
            <Field label="Audit title">
              <input value={audit.title} onChange={(event) => updateAuditTitle(event.target.value)} />
            </Field>
            <Field label="Site">
              <input value={vda65AuditInfo.site} onChange={(event) => updateAuditInfo('site', event.target.value)} />
            </Field>
            <Field label="Auditor">
              <input value={vda65AuditInfo.auditor} onChange={(event) => updateAuditInfo('auditor', event.target.value)} />
            </Field>
            <Field label="Audit date">
              <input type="date" value={vda65AuditInfo.date} onChange={(event) => updateAuditInfo('date', event.target.value)} />
            </Field>
            <Field label="Reference">
              <input value={vda65AuditInfo.reference} onChange={(event) => updateAuditInfo('reference', event.target.value)} />
            </Field>
            <Field label="Department">
              <input value={vda65AuditInfo.department} onChange={(event) => updateAuditInfo('department', event.target.value)} />
            </Field>
            <Field label="Customer">
              <input value={vda65AuditInfo.customer ?? ''} onChange={(event) => updateAuditInfo('customer', event.target.value)} />
            </Field>
            <Field label="Audit status">
              <select value={vda65AuditInfo.auditStatus} onChange={(event) => updateAuditInfo('auditStatus', event.target.value)}>
                <option value="Not started">Not started</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
            </Field>
            <Field label="Scope" full>
              <textarea rows={3} value={vda65AuditInfo.scope} onChange={(event) => updateAuditInfo('scope', event.target.value)} />
            </Field>
            <Field label="Notes" full>
              <textarea rows={4} value={vda65AuditInfo.notes} onChange={(event) => updateAuditInfo('notes', event.target.value)} />
            </Field>
          </div>
        </Panel>
        <Panel title="Next steps" description="Checklist, findings, actions, and reporting stay aligned with the wider audit system.">
          <DetailList
            items={[
              { label: 'Flow', value: 'Audit Info -> Product Info -> Checklist -> Results -> Findings -> Report' },
              { label: 'Checklist status', value: 'Each workbook requirement is recorded as Pending, OK, or NOK' },
              { label: 'Result logic', value: 'Each NOK contributes A/B/C defect points (100 / 50 / 10) to the VDA 6.5 score band' },
            ]}
          />
          <div className="module-actions module-actions-spaced">
            <Link to={getAuditSectionPath(audit.id, 'vda65', 'product')} className="button button-primary">
              <ButtonLabel icon="next" label="Product info" />
            </Link>
            <Link to={getAuditSectionPath(audit.id, 'vda65', 'checklist')} className="button button-secondary">
              <ButtonLabel icon="checklist" label="Go to checklist" />
            </Link>
          </div>
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
