import { useState, type ChangeEvent } from 'react'
import type { ActionPlanEvidenceFile, ActionPlanItem, ActionPlanUpdatePatch } from '../types/audit'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { ButtonLabel } from './icons'
import { AuditTypeBadge, StatusBadge } from './ui'
import type { KubalProcessAreaGroup } from '../features/generic/data/nonconformityTemplate'
import { isActionItemDelayed } from '../features/shared/services/auditWorkflow'

const MAX_EVIDENCE_FILE_SIZE = 600 * 1024

function createEvidenceFileId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `evidence-${Math.random().toString(36).slice(2, 10)}`
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error(`Could not read ${file.name}.`))
    }

    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${size} B`
}

function renderText(value: string, fallback = 'None yet') {
  return value.trim() ? value : <span className="table-subtle-cell">{fallback}</span>
}

function getActionValidationMessage(item: ActionPlanItem) {
  if (!item.owner.trim()) {
    return 'Assign an owner before saving this action.'
  }

  if (!item.dueDate) {
    return 'Add a due date before saving this action.'
  }

  if (!(item.action || item.correctiveAction || item.finding).trim()) {
    return 'Document the action or finding before saving this action.'
  }

  if (item.status === 'Closed' && !item.closureEvidence.trim() && !item.closureEvidenceFiles.length) {
    return 'Add closure evidence or a closure file before closing this action.'
  }

  return null
}

function getEvidenceSummary(item: ActionPlanItem) {
  const text = item.closureEvidence.trim()
  const fileNames = item.closureEvidenceFiles.map((file) => file.name).join(', ')

  if (text && fileNames) {
    return `${text} Files: ${fileNames}`
  }

  if (text) {
    return text
  }

  if (fileNames) {
    return `Files: ${fileNames}`
  }

  return 'No closure evidence yet.'
}

function renderEvidenceFiles(
  files: ActionPlanEvidenceFile[],
  onRemove?: (fileId: string) => void,
) {
  if (!files.length) {
    return <p className="action-plan-file-empty">No files uploaded.</p>
  }

  return (
    <div className="action-plan-file-list">
      {files.map((file) => (
        <div key={file.id} className="action-plan-file-chip">
          <a href={file.dataUrl} download={file.name}>
            {file.name}
          </a>
          <span>{formatFileSize(file.size)}</span>
          {onRemove ? (
            <button type="button" className="button button-secondary button-small" onClick={() => onRemove(file.id)}>
              Remove
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default function ActionPlanTable({
  items,
  onUpdate,
  onSave,
  auditLabel,
  auditDate,
  clauseOptions = [],
  processAreaGroups = [],
  nonconformityTypeOptions = [],
}: {
  items: ActionPlanItem[]
  onUpdate?: (id: string, patch: ActionPlanUpdatePatch) => void
  onSave?: (id: string) => void
  auditLabel?: string
  auditDate?: string
  clauseOptions?: readonly string[]
  processAreaGroups?: KubalProcessAreaGroup[]
  nonconformityTypeOptions?: readonly string[]
}) {
  const showNcMetadata = processAreaGroups.length > 0 || clauseOptions.length > 0 || nonconformityTypeOptions.length > 0
  const [expandedIds, setExpandedIds] = useState<string[]>(() => items.slice(0, 1).map((item) => item.id))
  const [validationMessages, setValidationMessages] = useState<Record<string, string>>({})
  const [attachmentMessages, setAttachmentMessages] = useState<Record<string, string>>({})

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]))
  }

  const handleSave = (item: ActionPlanItem) => {
    const validationMessage = getActionValidationMessage(item)

    if (validationMessage) {
      setValidationMessages((current) => ({ ...current, [item.id]: validationMessage }))
      if (!expandedIds.includes(item.id)) {
        setExpandedIds((current) => [...current, item.id])
      }
      return
    }

    setValidationMessages((current) => {
      const nextMessages = { ...current }
      delete nextMessages[item.id]
      return nextMessages
    })
    onSave?.(item.id)
  }

  const handleEvidenceFilesChange = async (item: ActionPlanItem, event: ChangeEvent<HTMLInputElement>) => {
    if (!onUpdate) {
      return
    }

    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (!selectedFiles.length) {
      return
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_EVIDENCE_FILE_SIZE)

    if (oversizedFile) {
      setAttachmentMessages((current) => ({
        ...current,
        [item.id]: `${oversizedFile.name} is too large. Keep each closure evidence file under ${formatFileSize(MAX_EVIDENCE_FILE_SIZE)}.`,
      }))
      return
    }

    try {
      const uploadedFiles = await Promise.all(selectedFiles.map(async (file) => ({
        id: createEvidenceFileId(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl: await readFileAsDataUrl(file),
      })))

      onUpdate(item.id, {
        closureEvidenceFiles: [...item.closureEvidenceFiles, ...uploadedFiles],
      })
      setAttachmentMessages((current) => {
        const nextMessages = { ...current }
        delete nextMessages[item.id]
        return nextMessages
      })
    } catch (error) {
      setAttachmentMessages((current) => ({
        ...current,
        [item.id]: error instanceof Error ? error.message : 'Closure evidence files could not be added.',
      }))
    }
  }

  const removeEvidenceFile = (item: ActionPlanItem, fileId: string) => {
    onUpdate?.(item.id, {
      closureEvidenceFiles: item.closureEvidenceFiles.filter((file) => file.id !== fileId),
    })
  }

  return (
    <div className="action-plan-workspace">
      {items.map((item, index) => {
        const isExpanded = expandedIds.includes(item.id)
        const isLinkedToReport = Boolean(item.reportItemId)
        const validationMessage = validationMessages[item.id]
        const attachmentMessage = attachmentMessages[item.id]
        const summaryItems = [
          { label: 'Action', value: item.action || item.correctiveAction || 'No action summary yet.' },
          { label: 'Containment', value: item.containmentAction || 'No containment action yet.' },
          { label: 'Root cause', value: item.rootCauseAnalysis || 'No root cause yet.' },
          { label: 'Closure evidence', value: getEvidenceSummary(item) },
        ]

        return (
          <article key={item.id} className={`action-plan-card${!onUpdate && isActionItemDelayed(item) ? ' table-row-attention' : ''}`}>
            <div className="action-plan-card-header">
              <div className="action-plan-card-header-main">
                <div className="action-plan-card-badges">
                  <AuditTypeBadge auditType={item.auditType} label={auditLabel} size="small" />
                  <span className="dashboard-widget-kicker">Action {index + 1}</span>
                  {isLinkedToReport ? <span className="dashboard-widget-kicker">Linked NC</span> : null}
                </div>
                <div className="action-plan-card-title-row">
                  <strong>{item.section || item.processArea || item.clause || 'Action item'}</strong>
                  {onSave ? (
                    <button
                      type="button"
                      className={`button button-small ${item.savedAt ? 'button-secondary' : 'button-primary'}`}
                      onClick={() => handleSave(item)}
                      title={item.savedAt ? `Saved ${formatDateTime(item.savedAt)}` : 'Save action'}
                    >
                      <ButtonLabel icon="save" label={item.savedAt ? 'Saved' : 'Save'} />
                    </button>
                  ) : null}
                </div>
                <p className="action-plan-card-finding">{item.finding || 'No finding documented yet.'}</p>
                {validationMessage ? <p className="export-feedback">{validationMessage}</p> : null}
                <div className="action-plan-card-meta-strip">
                  <span><strong>Owner</strong> {item.owner || 'Not assigned'}</span>
                  <span><strong>Due</strong> {item.dueDate ? formatDate(item.dueDate) : 'No date'}</span>
                  {auditDate ? <span><strong>Audit date</strong> {formatDate(auditDate)}</span> : null}
                  {showNcMetadata ? <span><strong>Type</strong> {item.nonconformityType || 'Not set'}</span> : null}
                  {showNcMetadata ? <span><strong>Reference</strong> {[item.processArea, item.clause].filter(Boolean).join(' / ') || 'Not set'}</span> : null}
                  <div className="action-plan-meta-actions">
                    {onUpdate ? (
                      <label className="action-plan-meta-select">
                        <strong>Status</strong>
                        <select value={item.status} onChange={(event) => onUpdate(item.id, { status: event.target.value as ActionPlanItem['status'] })}>
                          <option value="Open">Open</option>
                          <option value="In progress">In progress</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </label>
                    ) : (
                      <span className="action-plan-meta-status"><strong>Status</strong> <StatusBadge value={item.status} /></span>
                    )}
                    <button type="button" className="button button-secondary button-small" onClick={() => toggleExpanded(item.id)}>
                      {isExpanded ? 'Hide details' : 'Open details'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-plan-summary-row">
              {summaryItems.map((summaryItem) => (
                <div key={summaryItem.label} className="action-plan-summary-item">
                  <span className="action-plan-summary-label">{summaryItem.label}</span>
                  <p>{summaryItem.value}</p>
                </div>
              ))}
            </div>

            {isExpanded ? (
              <div className="action-plan-card-details">
                <div className="action-plan-detail-grid">
                  <label className="field">
                    <span>Owner</span>
                    {onUpdate ? <input value={item.owner} onChange={(event) => onUpdate(item.id, { owner: event.target.value })} /> : <div className="action-plan-readonly">{item.owner || 'Not assigned'}</div>}
                  </label>

                  <label className="field">
                    <span>Due date</span>
                    {onUpdate ? (
                      <input type="date" value={item.dueDate} onChange={(event) => onUpdate(item.id, { dueDate: event.target.value })} />
                    ) : (
                      <div className="action-plan-readonly">{item.dueDate ? formatDate(item.dueDate) : 'No date'}</div>
                    )}
                  </label>

                  {auditDate ? (
                    <label className="field">
                      <span>Audit date</span>
                      <div className="action-plan-readonly">{formatDate(auditDate)}</div>
                    </label>
                  ) : null}

                  {showNcMetadata ? (
                    <label className="field">
                      <span>Type of NC</span>
                      {onUpdate && !isLinkedToReport ? (
                        <select value={item.nonconformityType ?? ''} onChange={(event) => onUpdate(item.id, { nonconformityType: event.target.value as ActionPlanItem['nonconformityType'] })}>
                          <option value="">Select type</option>
                          {nonconformityTypeOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="action-plan-readonly">{item.nonconformityType || 'Not set'}</div>
                      )}
                    </label>
                  ) : null}

                  {showNcMetadata ? (
                    <label className="field">
                      <span>Process area</span>
                      {onUpdate && !isLinkedToReport ? (
                        <select value={item.processArea ?? ''} onChange={(event) => onUpdate(item.id, { processArea: event.target.value })}>
                          <option value="">Select process area</option>
                          {processAreaGroups.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.options.map((option) => (
                                <option key={option.id} value={option.label}>{option.label}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <div className="action-plan-readonly">{item.processArea || 'Not set'}</div>
                      )}
                    </label>
                  ) : null}

                  {showNcMetadata ? (
                    <label className="field">
                      <span>Clause / requirement</span>
                      {onUpdate && !isLinkedToReport ? (
                        clauseOptions.length ? (
                          <select value={item.clause ?? ''} onChange={(event) => onUpdate(item.id, { clause: event.target.value })}>
                            <option value="">Select clause</option>
                            {clauseOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input value={item.clause ?? ''} onChange={(event) => onUpdate(item.id, { clause: event.target.value })} placeholder="Clause or requirement" />
                        )
                      ) : (
                        <div className="action-plan-readonly">{item.clause || 'Not set'}</div>
                      )}
                    </label>
                  ) : null}

                  <label className="field field-full">
                    <span>Action summary</span>
                    {onUpdate ? (
                      <textarea value={item.action} onChange={(event) => onUpdate(item.id, { action: event.target.value })} rows={3} placeholder="Short summary of the action plan item." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.action)}</div>
                    )}
                  </label>

                  <label className="field field-full">
                    <span>Finding</span>
                    {onUpdate && !isLinkedToReport ? (
                      <textarea value={item.finding} onChange={(event) => onUpdate(item.id, { finding: event.target.value })} rows={3} placeholder="Finding statement." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.finding)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Containment action</span>
                    {onUpdate ? (
                      <textarea value={item.containmentAction} onChange={(event) => onUpdate(item.id, { containmentAction: event.target.value })} rows={4} placeholder="Immediate containment action." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.containmentAction)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Root cause analysis</span>
                    {onUpdate ? (
                      <textarea value={item.rootCauseAnalysis} onChange={(event) => onUpdate(item.id, { rootCauseAnalysis: event.target.value })} rows={4} placeholder="Root cause." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.rootCauseAnalysis)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Corrective action</span>
                    {onUpdate ? (
                      <textarea value={item.correctiveAction} onChange={(event) => onUpdate(item.id, { correctiveAction: event.target.value })} rows={4} placeholder="Permanent corrective action." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.correctiveAction)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Preventive action</span>
                    {onUpdate ? (
                      <textarea value={item.preventiveAction} onChange={(event) => onUpdate(item.id, { preventiveAction: event.target.value })} rows={4} placeholder="Prevent recurrence elsewhere." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.preventiveAction)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Effectiveness check</span>
                    {onUpdate ? (
                      <textarea value={item.verificationOfEffectiveness} onChange={(event) => onUpdate(item.id, { verificationOfEffectiveness: event.target.value })} rows={4} placeholder="How will effectiveness be verified?" />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.verificationOfEffectiveness)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Notes</span>
                    {onUpdate ? (
                      <textarea value={item.comment} onChange={(event) => onUpdate(item.id, { comment: event.target.value })} rows={4} placeholder="Notes or follow-up." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.comment)}</div>
                    )}
                  </label>

                  <div className="field field-full">
                    <span>Closure evidence</span>
                    {onUpdate ? (
                      <>
                        <textarea value={item.closureEvidence} onChange={(event) => onUpdate(item.id, { closureEvidence: event.target.value })} rows={4} placeholder="Text evidence for closure." />
                        <div className="action-plan-file-upload-row">
                          <label className="button button-secondary button-small action-plan-file-upload-button">
                            <input type="file" multiple onChange={(event) => void handleEvidenceFilesChange(item, event)} />
                            <ButtonLabel icon="open" label="Add files" />
                          </label>
                          <span className="action-plan-file-upload-note">Stored locally in the browser. Keep each file under {formatFileSize(MAX_EVIDENCE_FILE_SIZE)}.</span>
                        </div>
                        {attachmentMessage ? <p className="export-feedback">{attachmentMessage}</p> : null}
                        {renderEvidenceFiles(item.closureEvidenceFiles, (fileId) => removeEvidenceFile(item, fileId))}
                      </>
                    ) : (
                      <div className="action-plan-readonly action-plan-evidence-readonly">
                        <div>{renderText(item.closureEvidence)}</div>
                        {renderEvidenceFiles(item.closureEvidenceFiles)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
