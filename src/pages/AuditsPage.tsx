import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExportCenter from '../components/ExportCenter'
import { getAuditRecordHomePath } from '../data/navigation'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import type { AuditRecord } from '../types/audit'
import { formatAuditType } from '../utils/auditUtils'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { exportAuditToExcel, exportAuditToPdf } from '../utils/exportUtils'
import { AuditTypeBadge, MetricCard, PageHeader, Panel, StatusBadge } from '../components/ui'

export default function AuditsPage() {
  const navigate = useNavigate()
  const { audits, createAudit, deleteAudit, duplicateAudit } = useAuditLibrary()
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  const draftCount = audits.filter((audit) => audit.status !== 'Completed').length
  const completedCount = audits.filter((audit) => audit.status === 'Completed').length

  function handleCreateAudit() {
    const newAudit = createAudit('template')
    navigate(getAuditRecordHomePath(newAudit))
  }

  function handleOpenAudit(audit: AuditRecord) {
    navigate(getAuditRecordHomePath(audit))
  }

  function handleDuplicateAudit(id: string) {
    const duplicatedRecord = duplicateAudit(id)

    if (duplicatedRecord) {
      navigate(getAuditRecordHomePath(duplicatedRecord))
    }
  }

  function handleDeleteAudit(id: string, title: string) {
    const shouldDelete = window.confirm(`Delete "${title}" from the local audit library?`)

    if (shouldDelete) {
      deleteAudit(id)
    }
  }

  async function handleExportAudit(audit: AuditRecord, format: 'excel' | 'pdf') {
    const result =
      format === 'excel'
        ? await exportAuditToExcel(audit.title, audit)
        : await exportAuditToPdf(audit.title, audit)

    setExportMessage(`${result.filename} prepared. ${result.message}`)
  }

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="Audit history"
        title="Audit library"
        subtitle="Start from one shared audit template, then choose the applicable audit type, standard, or specialised workflow inside the record."
      />

      <div className="metrics-grid">
        <MetricCard label="Total audits" value={audits.length} />
        <MetricCard label="Drafts" value={draftCount} tone="warning" />
        <MetricCard label="Completed" value={completedCount} tone="success" />
      </div>

      <Panel title="Create new audit" description="Open one shared audit template, then switch it into the right audit structure from inside the record.">
        <div className="audit-create-grid">
          <button type="button" className="audit-create-card audit-create-card-template" onClick={handleCreateAudit}>
            <div className="audit-create-card-header">
              <AuditTypeBadge label="Shared template" />
              <span className="audit-create-standard">Choose the audit type inside the record</span>
            </div>
            <strong>Open shared audit template</strong>
            <p>Use one consistent starting point for every new audit. When a specialised template is selected, the app switches to the matching questionnaire or checklist workflow automatically.</p>
          </button>
        </div>
      </Panel>

      <Panel title="Saved audits" description="Each record stores its latest audit data, result preview, and corrective-action set.">
        <div className="table-card audit-library-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Site</th>
                <th>Auditor</th>
                <th>Audit date</th>
                <th>Status</th>
                <th>Last updated</th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <strong>{audit.title}</strong>
                  </td>
                  <td>
                    <div className="audit-type-stack">
                      <AuditTypeBadge auditType={audit.auditType} label={formatAuditType(audit.auditType)} size="small" />
                      <span className="audit-type-subtext">{audit.standard || 'Standard not set'}</span>
                    </div>
                  </td>
                  <td>{audit.site || 'Unassigned'}</td>
                  <td>{audit.auditor || 'Unassigned'}</td>
                  <td>{formatDate(audit.auditDate)}</td>
                  <td><StatusBadge value={audit.status} /></td>
                  <td>{formatDateTime(audit.updatedAt)}</td>
                  <td>
                    <div className="audit-preview-cell">
                      <span>{audit.summary.scorePreview ?? 'No score yet'}</span>
                      <strong>{audit.summary.resultPreview ?? `${audit.summary.progressPercent}% complete`}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="button button-secondary button-small" onClick={() => handleOpenAudit(audit)}>
                        Open
                      </button>
                      <button type="button" className="button button-secondary button-small" onClick={() => handleDuplicateAudit(audit.id)}>
                        Duplicate
                      </button>
                      <button type="button" className="button button-secondary button-small" onClick={() => handleExportAudit(audit, 'pdf')}>
                        Export
                      </button>
                      <button type="button" className="button button-secondary button-small button-danger" onClick={() => handleDeleteAudit(audit.id, audit.title)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {exportMessage ? <p className="export-feedback">{exportMessage}</p> : null}
      </Panel>

      <ExportCenter
        auditLabel="Audit Library"
        payload={audits}
        description="Library exports are also available at the collection level for future audit-portfolio reporting."
      />
    </div>
  )
}
