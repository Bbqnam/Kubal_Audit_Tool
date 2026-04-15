import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ExportCenter from '../components/ExportCenter'
import MetadataSection from '../components/MetadataSection'
import { getAuditRecordHomePath } from '../data/navigation'
import { auditStatusFilterOptions } from '../config/domain/statuses'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import { isActionItemDelayed } from '../features/shared/services/auditWorkflow'
import { parseImportFile } from '../features/shared/services/fileTransfer'
import type { AuditRecord } from '../types/audit'
import { formatAuditType } from '../utils/auditUtils'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { exportAuditToExcel, exportAuditToPdf } from '../utils/exportUtils'
import { getAuditMetadataItems } from '../utils/traceability'
import { AuditTypeBadge, MetricCard, PageHeader, Panel, StatusBadge } from '../components/ui'
import { ButtonLabel } from '../components/icons'

export default function AuditsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { audits, createAudit, deleteAudit, duplicateAudit, importAudits } = useAuditLibrary()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const statusFilter = searchParams.get('status') ?? 'all'
  const followUpFilter = searchParams.get('followUp') ?? 'all'

  const filteredAudits = audits.filter((audit) => {
    if (statusFilter !== 'all' && audit.status !== statusFilter) {
      return false
    }

    if (followUpFilter === 'delayed') {
      return audit.actions.some((action) => isActionItemDelayed(action))
    }

    return true
  })

  const draftCount = filteredAudits.filter((audit) => audit.status !== 'Completed').length
  const completedCount = filteredAudits.filter((audit) => audit.status === 'Completed').length
  const activeFilterLabel = followUpFilter === 'delayed'
    ? 'Delayed follow-up'
    : auditStatusFilterOptions.find((option) => option.value === statusFilter)?.label ?? 'All audits'

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
    try {
      const result =
        format === 'excel'
          ? await exportAuditToExcel(audit.title, audit)
          : await exportAuditToPdf(audit.title, audit)

      setExportMessage(`${result.filename} prepared. ${result.message}`)
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'Audit export failed. Please try again.')
    }
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const parsed = await parseImportFile(file)

      if (parsed.entityType === 'planning-library') {
        throw new Error('This file contains planning records. Import it from Audit Planning instead.')
      }

      const mergeResult = importAudits(parsed.audits)
      setImportMessage(`Imported ${mergeResult.imported}, updated ${mergeResult.updated}, skipped ${mergeResult.skipped} audit record(s) from ${file.name}.`)
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Audit import failed. Please try again.')
    }
  }

  function handleFilterChange(nextStatus: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (nextStatus === 'all') {
      nextParams.delete('status')
      nextParams.delete('followUp')
    } else if (nextStatus === 'delayed') {
      nextParams.delete('status')
      nextParams.set('followUp', 'delayed')
    } else {
      nextParams.set('status', nextStatus)
      nextParams.delete('followUp')
    }
    setSearchParams(nextParams, { replace: true })
  }

  function clearFilters() {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="Audit history"
        title="Audit library"
        subtitle={`Shared audit register with cleaner access to templates, saved records, exports, and follow-up work. Current view: ${activeFilterLabel}.`}
      />

      <div className="metrics-grid">
        <MetricCard label="Total audits" value={filteredAudits.length} />
        <MetricCard label="Drafts" value={draftCount} tone="warning" />
        <MetricCard label="Completed" value={completedCount} tone="success" />
      </div>

      <Panel
        title="Audit filters"
        description="These route-based filters are used by dashboard drilldowns and can be shared directly."
        actions={
          statusFilter !== 'all' || followUpFilter !== 'all' ? (
            <button type="button" className="button button-secondary button-small" onClick={clearFilters}>
              <ButtonLabel icon="close" label="Clear filters" />
            </button>
          ) : null
        }
      >
        <div className="calendar-pill-group">
          {auditStatusFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`calendar-pill ${(statusFilter === option.value && followUpFilter === 'all') || (option.value === 'delayed' && followUpFilter === 'delayed') ? 'calendar-pill-active' : ''}`}
              onClick={() => handleFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Create new audit"
        description="Start from one template, then switch the record into the right audit workflow."
        actions={
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xlsm,.json"
              onChange={(event) => void handleImportChange(event)}
              hidden
            />
            <button type="button" className="button button-secondary" onClick={() => importInputRef.current?.click()}>
              <ButtonLabel icon="open" label="Import audit file" />
            </button>
          </>
        }
      >
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
        {importMessage ? <p className="export-feedback">{importMessage}</p> : null}
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
              {filteredAudits.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <div className="planning-table-title">
                      <strong>{audit.title}</strong>
                      <span>{audit.summary.resultPreview ?? `${audit.summary.progressPercent}% complete`}</span>
                    </div>
                    <MetadataSection items={getAuditMetadataItems(audit)} compact />
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
        payload={filteredAudits}
        description="Library exports are also available at the collection level for future audit-portfolio reporting."
      />
    </div>
  )
}
