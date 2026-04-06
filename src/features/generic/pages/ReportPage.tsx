import { useMemo, useState } from 'react'
import { ButtonLabel } from '../../../components/icons'
import { DetailList, EmptyState, MetricCard, PageHeader, Panel } from '../../../components/ui'
import {
  buildClauseTree,
  getClauseAncestorCodes,
  getClauseOptionsForStandard,
  getClauseRequirementText,
  getClauseTitle,
  kubalProcessAreaGroups,
  nonconformityTypeOptions,
  normalizeNonconformityStandard,
  supportedNonconformityStandards,
  supportsClauseCatalog,
} from '../data/nonconformityTemplate'
import { getAuditTypeLabel } from '../../../data/auditTypes'
import { useGenericAuditWorkspace } from '../../shared/context/useGenericAuditWorkspace'
import { formatDateTime } from '../../../utils/dateUtils'

function ClausePickerModal({
  standard,
  value,
  onSelect,
  onClose,
}: {
  standard: string
  value: string
  onSelect: (value: string) => void
  onClose: () => void
}) {
  const clauseTree = useMemo(() => buildClauseTree(standard), [standard])
  const [expandedCodes, setExpandedCodes] = useState<string[]>(() => {
    if (!value) {
      return []
    }

    return [...getClauseAncestorCodes(value), value]
  })

  const toggleCode = (code: string) => {
    setExpandedCodes((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]))
  }

  const renderNode = (node: ReturnType<typeof buildClauseTree>[number], depth = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedCodes.includes(node.code)
    const isSelected = value === node.code

    return (
      <div key={node.code} className="clause-tree-node" style={{ ['--clause-depth' as string]: String(depth) }}>
        <div className={`clause-tree-row ${isSelected ? 'clause-tree-row-active' : ''}`}>
          {hasChildren ? (
            <button
              type="button"
              className="clause-tree-toggle"
              onClick={() => toggleCode(node.code)}
              aria-label={isExpanded ? `Collapse ${node.code}` : `Expand ${node.code}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className="clause-tree-toggle clause-tree-toggle-placeholder" aria-hidden="true">
              ·
            </span>
          )}

          <button
            type="button"
            className="clause-tree-select"
            onClick={() => onSelect(node.code)}
          >
            <span className="clause-tree-select-main">
              <strong>{node.code}</strong>
              <span>{node.title}</span>
            </span>
            {hasChildren ? <small>{node.children.length} subclauses</small> : null}
          </button>
        </div>

        {hasChildren && isExpanded ? (
          <div className="clause-tree-children">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-shell clause-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${standard} clause selector`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Choose Clause / Requirement Reference</h2>
            <p>Select a main chapter or open it to choose a more specific subclause.</p>
          </div>
          <button type="button" className="button button-secondary button-small" onClick={onClose}>
            <ButtonLabel icon="close" label="Close" />
          </button>
        </div>
        <div className="modal-body clause-picker-body">
          <div className="clause-picker-summary">
            <span className="dashboard-widget-kicker">{standard}</span>
            <strong>{value ? `${value} ${getClauseTitle(standard, value)}` : 'No clause selected yet'}</strong>
            <p>Use `+` to open one level at a time. You can choose either a main chapter or a more specific subclause.</p>
          </div>

          <div className="clause-picker-list clause-tree-list">{clauseTree.map((node) => renderNode(node))}</div>
        </div>
      </div>
    </div>
  )
}

export default function GenericAuditReportPage() {
  const {
    audit,
    genericAuditInfo,
    reportItems,
    reportSummary,
    actionPlanItems,
    addReportItem,
    updateReportItem,
    saveReportItem,
    deleteReportItem,
    updateReportSummary,
  } = useGenericAuditWorkspace()

  const clauseOptions = getClauseOptionsForStandard(audit.standard)
  const normalizedStandard = normalizeNonconformityStandard(audit.standard)
  const majorCount = reportItems.filter((item) => item.nonconformityType === 'Major nonconformity').length
  const minorCount = reportItems.filter((item) => item.nonconformityType === 'Minor nonconformity').length
  const observationCount = reportItems.filter((item) => item.nonconformityType === 'Observation' || item.nonconformityType === 'Improvement suggestion').length
  const [activeClauseItemId, setActiveClauseItemId] = useState<string | null>(null)
  const activeClauseItem = reportItems.find((item) => item.id === activeClauseItemId) ?? null

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={getAuditTypeLabel(audit.auditType)}
        eyebrowTone={audit.auditType}
        title="Audit report"
        subtitle="Capture nonconformities, observations, clause references, and process-area traceability for the shared audit template."
        actions={
          <button type="button" className="button button-primary" onClick={addReportItem}>
            <ButtonLabel icon="add" label="Add NC" />
          </button>
        }
      />

      <div className="metrics-grid">
        <MetricCard label="Report items" value={reportItems.length} />
        <MetricCard label="Major NC" value={majorCount} tone={majorCount ? 'danger' : 'default'} />
        <MetricCard label="Minor NC" value={minorCount} tone={minorCount ? 'warning' : 'default'} />
        <MetricCard label="Observations / ideas" value={observationCount} tone={observationCount ? 'success' : 'default'} />
      </div>

      <div className="form-grid">
        <Panel title="Report header" description="Core identification details carried into the audit report.">
          <DetailList
            items={[
              { label: 'Audit title', value: audit.title || 'Untitled audit' },
              { label: 'Standard', value: audit.standard || 'Select a standard in Audit Info' },
              { label: 'Site', value: genericAuditInfo.site || 'Not set' },
              { label: 'Auditor', value: genericAuditInfo.auditor || 'Not set' },
              { label: 'Audit date', value: genericAuditInfo.date || 'Not set' },
              { label: 'Reference', value: genericAuditInfo.reference || 'Not set' },
              { label: 'Department', value: genericAuditInfo.department || 'Not set' },
            ]}
          />
        </Panel>

        <Panel
          title="Template scope"
          description="Clause references stay structured for ISO 9001, ISO 14001, and IATF 16949. Other standards can still use free-text references."
        >
          <div className="stack-list generic-report-note-list">
            <div>
              <strong>Clause catalog</strong>
              <p>
                {normalizedStandard
                  ? `${normalizedStandard} clause selector loaded with ${clauseOptions.length} references.`
                  : `No clause catalog matched. Use one of: ${supportedNonconformityStandards.join(', ')}.`}
              </p>
            </div>
            <div>
              <strong>Process map</strong>
              <p>All Kubal process areas from the shared process map are available in the report and action-plan dropdowns.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Audit summary" description="Narrative summary, overall conclusion, or introduction text for the report body.">
        <textarea
          rows={5}
          value={reportSummary}
          onChange={(event) => updateReportSummary(event.target.value)}
          placeholder="Summarize scope, audit approach, overall conclusion, and key themes."
        />
      </Panel>

      <Panel
        title="Nonconformity register"
        description="Use one compact card per item. Start with type, process area, and clause, then capture the requirement, evidence, and formal nonconformity statement."
      >
        {reportItems.length ? (
          <div className="generic-report-list generic-report-list-rebuilt">
            {reportItems.map((item, index) => (
              <article key={item.id} className="generic-report-card generic-report-card-rebuilt">
                <div className="generic-report-toolbar">
                  <div className="generic-report-toolbar-main">
                    <div className="generic-report-item-badges">
                      <span className="dashboard-widget-kicker">Item {index + 1}</span>
                      <span className={`generic-report-save-badge ${item.savedAt ? 'generic-report-save-badge-saved' : 'generic-report-save-badge-unsaved'}`}>
                        {item.savedAt ? `Saved ${formatDateTime(item.savedAt)}` : 'Unsaved changes'}
                      </span>
                    </div>
                    <input
                      className="generic-report-title-input"
                      value={item.title}
                      onChange={(event) => updateReportItem(item.id, { title: event.target.value })}
                      placeholder="Finding title"
                    />
                  </div>
                  <div className="generic-report-card-actions">
                    <button type="button" className={`button button-small ${item.savedAt ? 'button-secondary' : 'button-primary'}`} onClick={() => saveReportItem(item.id)}>
                      <ButtonLabel icon="save" label={item.savedAt ? 'Saved' : 'Save item'} />
                    </button>
                    <button type="button" className="button button-secondary button-small button-danger" onClick={() => deleteReportItem(item.id)}>
                      <ButtonLabel icon="delete" label="Delete item" />
                    </button>
                  </div>
                </div>

                <div className="generic-report-top-grid">
                  <label className="field">
                    <span>Type of NC</span>
                    <select value={item.nonconformityType} onChange={(event) => updateReportItem(item.id, { nonconformityType: event.target.value as typeof item.nonconformityType })}>
                      {nonconformityTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Process area</span>
                    <select value={item.processArea} onChange={(event) => updateReportItem(item.id, { processArea: event.target.value })}>
                      <option value="">Select process area</option>
                      {kubalProcessAreaGroups.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((option) => (
                            <option key={option.id} value={option.label}>{option.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>

                  <div className="field">
                    <span>Clause / requirement ref.</span>
                    {supportsClauseCatalog(audit.standard) ? (
                      <button
                        type="button"
                        className={`generic-report-picker-button ${item.clause ? 'generic-report-picker-button-filled' : ''}`}
                        onClick={() => setActiveClauseItemId(item.id)}
                      >
                        <span className="generic-report-picker-button-value">
                          {item.clause ? `${item.clause} ${getClauseTitle(audit.standard, item.clause)}` : 'Choose clause'}
                        </span>
                      </button>
                    ) : (
                      <input value={item.clause} onChange={(event) => updateReportItem(item.id, { clause: event.target.value })} placeholder="e.g. 8.5.1" />
                    )}
                  </div>
                </div>

                <div className="generic-report-body-grid">
                  <label className="field">
                    <span>Requirement</span>
                    <textarea
                      rows={4}
                      value={item.requirement}
                      onChange={(event) => updateReportItem(item.id, { requirement: event.target.value })}
                      placeholder="State the requirement, expectation, or clause intent."
                    />
                  </label>

                  <label className="field">
                    <span>Objective evidence</span>
                    <textarea
                      rows={4}
                      value={item.evidence}
                      onChange={(event) => updateReportItem(item.id, { evidence: event.target.value })}
                      placeholder="Capture the evidence, interview notes, records, or observations behind the NC."
                    />
                  </label>

                  <label className="field">
                    <span>Statement of nonconformity</span>
                    <textarea
                      rows={5}
                      value={item.statement}
                      onChange={(event) => updateReportItem(item.id, { statement: event.target.value })}
                      placeholder="Write the formal nonconformity / observation statement for the report."
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No report items yet"
            description="Add nonconformities, observations, or improvement suggestions to start the report register."
          />
        )}
      </Panel>

      <Panel title="Action plan extract" description="Linked action-plan items stay visible here while you write the report, but the action content itself is managed on the action plan page.">
        {actionPlanItems.length ? (
          <ul className="stack-list">
            {actionPlanItems.map((item) => (
              <li key={item.id}>
                <strong>{item.nonconformityType || 'Action'} · {item.processArea || item.section || 'No area set'}</strong>
                <p>{item.finding || 'No finding detail added yet.'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No actions linked yet"
            description="Each nonconformity appears automatically here and on the action plan page. You can also add manual actions there."
          />
        )}
      </Panel>

      {activeClauseItem && supportsClauseCatalog(audit.standard) ? (
        <ClausePickerModal
          standard={audit.standard}
          value={activeClauseItem.clause}
          onSelect={(value) => {
            updateReportItem(activeClauseItem.id, {
              clause: value,
              requirement: getClauseRequirementText(audit.standard, value),
            })
            setActiveClauseItemId(null)
          }}
          onClose={() => setActiveClauseItemId(null)}
        />
      ) : null}
    </div>
  )
}
