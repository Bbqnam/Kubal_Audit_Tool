import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ExportCenter from '../components/ExportCenter'
import HistoryModal from '../components/HistoryModal'
import { getAuditRecordHomePath } from '../data/navigation'
import { auditStatusFilterOptions } from '../config/domain/statuses'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import { isActionItemDelayed } from '../features/shared/services/auditWorkflow'
import { parseImportFile } from '../features/shared/services/fileTransfer'
import type { AuditLifecycleStatus, AuditRecord } from '../types/audit'
import { compareDateOnly, formatDate, formatDateTime } from '../utils/dateUtils'
import { exportAuditToExcel, exportAuditToPdf } from '../utils/exportUtils'
import { AuditTypeBadge, PageHeader, Panel } from '../components/ui'
import { ButtonLabel } from '../components/icons'

const auditLifecycleStatusOptions: AuditLifecycleStatus[] = ['Not started', 'In progress', 'Completed']
const auditsPerPage = 10

type AuditSortKey = 'auditId' | 'title' | 'type' | 'auditor' | 'auditDate' | 'status' | 'updatedAt' | 'preview'

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

export default function AuditsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { audits, auditLibraryHistory, createAudit, deleteAudit, importAudits, updateAuditRecord } = useAuditLibrary()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<AuditSortKey>('updatedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [historyOpen, setHistoryOpen] = useState(false)
  const statusFilter = searchParams.get('status') ?? 'all'
  const followUpFilter = searchParams.get('followUp') ?? 'all'
  const libraryHistoryItems = useMemo(
    () => [...auditLibraryHistory]
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        badge: entry.actionType,
        title: entry.subjectLabel || entry.description,
        description: entry.description,
        meta: entry.actor,
      })),
    [auditLibraryHistory],
  )

  const filteredAudits = useMemo(() => {
    const nextAudits = audits.filter((audit) => {
      if (statusFilter !== 'all' && audit.status !== statusFilter) {
        return false
      }

      if (followUpFilter === 'delayed') {
        return audit.actions.some((action) => isActionItemDelayed(action))
      }

      return true
    })

    return [...nextAudits].sort((left, right) => {
      const leftType = left.standard || 'Standard not set'
      const rightType = right.standard || 'Standard not set'
      const leftAuditor = left.auditor || 'Unassigned'
      const rightAuditor = right.auditor || 'Unassigned'
      const leftPreview = left.summary.resultPreview || left.summary.scorePreview || ''
      const rightPreview = right.summary.resultPreview || right.summary.scorePreview || ''

      const result = (() => {
        switch (sortKey) {
          case 'auditId':
            return compareText(left.auditId, right.auditId)
          case 'title':
            return compareText(left.title, right.title)
          case 'type':
            return compareText(leftType, rightType)
          case 'auditor':
            return compareText(leftAuditor, rightAuditor)
          case 'auditDate':
            return compareDateOnly(left.auditDate, right.auditDate)
          case 'status':
            return compareText(left.status, right.status)
          case 'updatedAt':
            return compareText(left.updatedAt, right.updatedAt)
          case 'preview':
            return compareText(leftPreview, rightPreview)
        }
      })()

      if (result !== 0) {
        return sortDirection === 'asc' ? result : -result
      }

      return compareText(left.auditId, right.auditId)
    })
  }, [audits, followUpFilter, sortDirection, sortKey, statusFilter])

  const draftCount = filteredAudits.filter((audit) => audit.status !== 'Completed').length
  const completedCount = filteredAudits.filter((audit) => audit.status === 'Completed').length
  const activeFilterLabel = followUpFilter === 'delayed'
    ? 'Delayed follow-up'
    : auditStatusFilterOptions.find((option) => option.value === statusFilter)?.label ?? 'All audits'
  const totalPages = Math.max(1, Math.ceil(filteredAudits.length / auditsPerPage))
  const paginatedAudits = filteredAudits.slice((currentPage - 1) * auditsPerPage, currentPage * auditsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, followUpFilter])

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  function handleCreateAudit() {
    const newAudit = createAudit('template')
    navigate(getAuditRecordHomePath(newAudit))
  }

  function handleOpenAudit(audit: AuditRecord) {
    navigate(getAuditRecordHomePath(audit))
  }

  function handleDeleteAudit(id: string, title: string) {
    const shouldDelete = window.confirm(`Delete "${title}" from the local audit library?`)

    if (shouldDelete) {
      deleteAudit(id)
    }
  }

  async function handleExportAudit(audit: AuditRecord, format: 'excel' | 'pdf') {
    try {
      const previewWindow = format === 'pdf' && typeof window !== 'undefined'
        ? window.open('', '_blank', 'width=1180,height=920')
        : null
      const result =
        format === 'excel'
          ? await exportAuditToExcel(audit.title, audit)
          : await exportAuditToPdf(audit.title, audit, previewWindow)

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

  function handleAuditStatusChange(id: string, nextStatus: AuditLifecycleStatus) {
    updateAuditRecord(id, (current) => {
      if (current.auditType === 'vda63') {
        return {
          ...current,
          data: {
            ...current.data,
            auditInfo: {
              ...current.data.auditInfo,
              auditStatus: nextStatus,
            },
          },
        }
      }

      if (current.auditType === 'vda65') {
        return {
          ...current,
          data: {
            ...current.data,
            auditInfo: {
              ...current.data.auditInfo,
              auditStatus: nextStatus,
            },
          },
        }
      }

      return {
        ...current,
        data: {
          ...current.data,
          auditInfo: {
            ...current.data.auditInfo,
            auditStatus: nextStatus,
          },
        },
      }
    })
  }

  function handleSort(nextKey: AuditSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection(nextKey === 'updatedAt' ? 'desc' : 'asc')
  }

  function getSortIndicator(key: AuditSortKey) {
    if (sortKey !== key) {
      return ' '
    }

    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="module-page audit-library-page">
      <PageHeader
        eyebrow="Audit history"
        title="Audit library"
        subtitle={`Shared audit register with cleaner access to templates, saved records, exports, and follow-up work. Current view: ${activeFilterLabel}.`}
      />

      <Panel
        title="Saved audits"
        description="Each record keeps its latest data, summary, and corrective-action set together."
        actions={
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xlsm,.json"
              onChange={(event) => void handleImportChange(event)}
              hidden
            />
            <button type="button" className="button button-secondary button-small" onClick={() => setHistoryOpen(true)}>
              <ButtonLabel icon="history" label="History" />
            </button>
            <button type="button" className="button button-secondary button-small" onClick={() => importInputRef.current?.click()}>
              <ButtonLabel icon="open" label="Import audit file" />
            </button>
            <button type="button" className="button button-primary button-small" onClick={handleCreateAudit}>
              <ButtonLabel icon="add" label="New audit" />
            </button>
          </>
        }
      >
        <div className="audit-library-toolbar">
          <div className="audit-library-summary-block" aria-label="Audit summary">
            <div className="audit-library-summary-item">
              <span>Total</span>
              <strong>{filteredAudits.length}</strong>
            </div>
            <div className="audit-library-summary-item">
              <span>Drafts</span>
              <strong>{draftCount}</strong>
            </div>
            <div className="audit-library-summary-item">
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>
          </div>
          <div className="audit-library-filter-strip">
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
          </div>
        </div>
        <div className="table-card audit-library-table">
          <table>
            <thead>
              <tr>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('auditId')}>Audit ID <span>{getSortIndicator('auditId')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('title')}>Title <span>{getSortIndicator('title')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('type')}>Type <span>{getSortIndicator('type')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('auditor')}>Auditor <span>{getSortIndicator('auditor')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('auditDate')}>Audit date <span>{getSortIndicator('auditDate')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('status')}>Status <span>{getSortIndicator('status')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('updatedAt')}>Last updated <span>{getSortIndicator('updatedAt')}</span></button></th>
                <th><button type="button" className="audit-library-header-button" onClick={() => handleSort('preview')}>Preview <span>{getSortIndicator('preview')}</span></button></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAudits.map((audit) => (
                <tr key={audit.id}>
                  <td className="audit-library-id-cell">
                    <strong>{audit.auditId}</strong>
                  </td>
                  <td>
                    <div className="planning-table-title audit-library-primary">
                      <button type="button" className="dashboard-table-link audit-library-link" onClick={() => handleOpenAudit(audit)}>
                        {audit.title}
                      </button>
                    </div>
                  </td>
                  <td>
                    <AuditTypeBadge
                      label={audit.standard || 'Standard not set'}
                      toneSource={audit.standard || audit.auditType}
                      size="small"
                    />
                  </td>
                  <td>{audit.auditor || 'Unassigned'}</td>
                  <td>{formatDate(audit.auditDate)}</td>
                  <td>
                    <select
                      className={`audit-library-status-select status-${audit.status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      value={audit.status}
                      onChange={(event) => handleAuditStatusChange(audit.id, event.target.value as AuditLifecycleStatus)}
                      aria-label={`Change status for ${audit.title}`}
                    >
                      {auditLifecycleStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
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
                        onClick={() => handleExportAudit(audit, 'pdf')}
                        aria-label={`Export ${audit.title}`}
                        title="Export audit"
                      >
                        <ButtonLabel icon="export" label={`Export ${audit.title}`} hideLabel />
                      </button>
                      <button
                        type="button"
                        className="button button-danger button-small button-icon-only"
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
        {filteredAudits.length > auditsPerPage ? (
          <div className="audit-library-pagination" aria-label="Audit library pagination">
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              <ButtonLabel icon="back" label="Previous" />
            </button>
            <div className="audit-library-pagination-pages">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1
                return (
                  <button
                    key={page}
                    type="button"
                    className={`audit-library-page-chip${page === currentPage ? ' is-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              <ButtonLabel icon="next" label="Next" />
            </button>
          </div>
        ) : null}
        {importMessage ? <p className="export-feedback">{importMessage}</p> : null}
        {exportMessage ? <p className="export-feedback">{exportMessage}</p> : null}
      </Panel>

      <ExportCenter
        auditLabel="Audit Library"
        payload={filteredAudits}
        description="Library exports are also available at the collection level for future audit-portfolio reporting."
      />

      {historyOpen ? (
        <HistoryModal
          title="Library history"
          description="Top-level created, edited, duplicated, imported, and deleted audit records across the audit library."
          items={libraryHistoryItems}
          emptyTitle="No audit library activity recorded yet."
          emptyDescription="Top-level audit library changes will appear here automatically."
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
    </div>
  )
}
