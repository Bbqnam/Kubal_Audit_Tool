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
import { ButtonLabel } from '../components/icons'

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
        subtitle="Shared audit register with cleaner access to templates, saved records, exports, and follow-up work."
      />

      <div className="metrics-grid">
        <MetricCard label="Total audits" value={audits.length} />
        <MetricCard label="Drafts" value={draftCount} tone="warning" />
        <MetricCard label="Completed" value={completedCount} tone="success" />
      </div>

      <Panel title="Create new audit" description="Start from one template, then switch the record into the right audit workflow.">
        <div className="audit-create-grid">
          <button type="button" className="audit-create-card audit-create-card-template" onClick={handleCreateAudit}>
            <div className="audit-create-card-header">
              <AuditTypeBadge label="Shared template" />
              <span className="audit-create-standard">Choose the audit type inside the record</span>
            </div>
            <strong>
              <ButtonLabel icon="add" label="Open shared audit template" />
            </strong>
            <p>Use one consistent starting point, then move the record into the matching questionnaire or checklist flow.</p>
          </button>
        </div>
      </Panel>

      <Panel title="Saved audits" description="Each record keeps its latest data, summary, and corrective-action set together.">
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
                      <button
                        type="button"
                        className="button button-secondary button-small button-icon-only"
                        onClick={() => handleOpenAudit(audit)}
                        aria-label={`Open ${audit.title}`}
                        title="Open audit"
                      >
                        <ButtonLabel icon="open" label={`Open ${audit.title}`} hideLabel />
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-small button-icon-only"
                        onClick={() => handleDuplicateAudit(audit.id)}
                        aria-label={`Duplicate ${audit.title}`}
                        title="Duplicate audit"
                      >
                        <ButtonLabel icon="duplicate" label={`Duplicate ${audit.title}`} hideLabel />
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-small button-icon-only"
                        onClick={() => handleExportAudit(audit, 'pdf')}
                        aria-label={`Export ${audit.title}`}
                        title="Export audit"
                      >
                        <ButtonLabel icon="export" label={`Export ${audit.title}`} hideLabel />
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-small button-danger button-icon-only"
                        onClick={() => handleDeleteAudit(audit.id, audit.title)}
                        aria-label={`Delete ${audit.title}`}
                        title="Delete audit"
                      >
                        <ButtonLabel icon="delete" label={`Delete ${audit.title}`} hideLabel />
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
