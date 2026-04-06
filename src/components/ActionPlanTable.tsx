import { useState } from 'react'
import type { ActionPlanItem, ActionPlanUpdatePatch } from '../types/audit'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import { ButtonLabel } from './icons'
import { AuditTypeBadge, StatusBadge } from './ui'
import type { KubalProcessAreaGroup } from '../features/generic/data/nonconformityTemplate'

function renderText(value: string, fallback = 'None yet') {
  return value.trim() ? value : <span className="table-subtle-cell">{fallback}</span>
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

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]))
  }

  return (
    <div className="action-plan-workspace">
      {items.map((item, index) => {
        const isExpanded = expandedIds.includes(item.id)
        const isLinkedToReport = Boolean(item.reportItemId)

        return (
          <article key={item.id} className={`action-plan-card${!onUpdate && item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Closed' ? ' table-row-attention' : ''}`}>
            <div className="action-plan-card-header">
              <div className="action-plan-card-header-main">
                <div className="action-plan-card-badges">
                  <AuditTypeBadge auditType={item.auditType} label={auditLabel} size="small" />
                  <span className="dashboard-widget-kicker">Action {index + 1}</span>
                  {isLinkedToReport ? <span className="dashboard-widget-kicker">Linked NC</span> : null}
                </div>
                <div className="action-plan-card-title-row">
                  <strong>{item.section || item.processArea || 'Action item'}</strong>
                  {onSave ? (
                    <button
                      type="button"
                      className={`button button-small ${item.savedAt ? 'button-secondary' : 'button-primary'}`}
                      onClick={() => onSave(item.id)}
                      title={item.savedAt ? `Saved ${formatDateTime(item.savedAt)}` : 'Save action'}
                    >
                      <ButtonLabel icon="save" label={item.savedAt ? 'Saved' : 'Save'} />
                    </button>
                  ) : null}
                </div>
                <p className="action-plan-card-finding">{item.finding || 'No finding documented yet.'}</p>
                <div className="action-plan-card-meta-strip">
                  <span><strong>Owner</strong> {item.owner || 'Not assigned'}</span>
                  <span><strong>Due</strong> {item.dueDate ? formatDate(item.dueDate) : 'No date'}</span>
                  {auditDate ? <span><strong>Audit date</strong> {formatDate(auditDate)}</span> : null}
                  {showNcMetadata ? <span><strong>Type</strong> {item.nonconformityType || 'Not set'}</span> : null}
                  {showNcMetadata ? <span><strong>Process</strong> {[item.processArea, item.clause].filter(Boolean).join(' / ') || 'Not set'}</span> : null}
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
              <div className="action-plan-summary-item">
                <span className="action-plan-summary-label">Action</span>
                <p>{item.action || item.correctiveAction || 'No action summary yet.'}</p>
              </div>
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

                  <label className="field">
                    <span>Finding</span>
                    {onUpdate && !isLinkedToReport ? (
                      <textarea value={item.finding} onChange={(event) => onUpdate(item.id, { finding: event.target.value })} rows={3} placeholder="Finding statement." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.finding)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Containment actions</span>
                    {onUpdate ? (
                      <textarea value={item.containmentAction} onChange={(event) => onUpdate(item.id, { containmentAction: event.target.value })} rows={3} placeholder="Containment action." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.containmentAction)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Root cause analysis</span>
                    {onUpdate ? (
                      <textarea value={item.rootCauseAnalysis} onChange={(event) => onUpdate(item.id, { rootCauseAnalysis: event.target.value })} rows={3} placeholder="Root cause." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.rootCauseAnalysis)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Corrective action</span>
                    {onUpdate ? (
                      <textarea value={item.correctiveAction} onChange={(event) => onUpdate(item.id, { correctiveAction: event.target.value })} rows={3} placeholder="Permanent corrective action." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.correctiveAction)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Preventive action</span>
                    {onUpdate ? (
                      <textarea value={item.preventiveAction} onChange={(event) => onUpdate(item.id, { preventiveAction: event.target.value })} rows={3} placeholder="Prevent recurrence elsewhere." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.preventiveAction)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Effectiveness check</span>
                    {onUpdate ? (
                      <textarea value={item.verificationOfEffectiveness} onChange={(event) => onUpdate(item.id, { verificationOfEffectiveness: event.target.value })} rows={3} placeholder="How will effectiveness be verified?" />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.verificationOfEffectiveness)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Closure evidence</span>
                    {onUpdate ? (
                      <textarea value={item.closureEvidence} onChange={(event) => onUpdate(item.id, { closureEvidence: event.target.value })} rows={3} placeholder="Evidence for closure." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.closureEvidence)}</div>
                    )}
                  </label>

                  <label className="field">
                    <span>Notes</span>
                    {onUpdate ? (
                      <textarea value={item.comment} onChange={(event) => onUpdate(item.id, { comment: event.target.value })} rows={3} placeholder="Notes or follow-up." />
                    ) : (
                      <div className="action-plan-readonly">{renderText(item.comment)}</div>
                    )}
                  </label>
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
