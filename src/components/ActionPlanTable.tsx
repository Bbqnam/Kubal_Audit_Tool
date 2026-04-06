import type { ActionPlanItem } from '../types/audit'
import { formatAuditType } from '../utils/auditUtils'
import { formatDate } from '../utils/dateUtils'
import { AuditTypeBadge, StatusBadge } from './ui'
import type { KubalProcessAreaGroup } from '../features/generic/data/nonconformityTemplate'

export default function ActionPlanTable({
  items,
  onUpdate,
  clauseOptions = [],
  processAreaGroups = [],
  nonconformityTypeOptions = [],
}: {
  items: ActionPlanItem[]
  onUpdate?: (
    id: string,
    patch: Partial<Pick<ActionPlanItem, 'processArea' | 'clause' | 'nonconformityType' | 'section' | 'finding' | 'action' | 'owner' | 'dueDate' | 'status' | 'comment'>>,
  ) => void
  clauseOptions?: readonly string[]
  processAreaGroups?: KubalProcessAreaGroup[]
  nonconformityTypeOptions?: readonly string[]
}) {
  const showNcMetadata = processAreaGroups.length > 0 || clauseOptions.length > 0 || nonconformityTypeOptions.length > 0

  return (
    <div className="table-card data-table-card action-plan-table">
      <table>
        <thead>
          <tr>
            <th>Audit</th>
            {showNcMetadata ? <th>Type</th> : null}
            {showNcMetadata ? <th>Process area</th> : null}
            {showNcMetadata ? <th>Clause</th> : null}
            <th>Section</th>
            <th>Finding</th>
            <th>Action</th>
            <th>Owner</th>
            <th>Due</th>
            <th>Status</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={!onUpdate && item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'Closed' ? 'table-row-attention' : ''}>
              <td>
                <div className="table-primary-cell">
                  <AuditTypeBadge auditType={item.auditType} label={formatAuditType(item.auditType)} size="small" />
                </div>
              </td>
              {showNcMetadata ? (
                <td>
                  {onUpdate ? (
                    <select value={item.nonconformityType ?? ''} onChange={(event) => onUpdate(item.id, { nonconformityType: event.target.value as ActionPlanItem['nonconformityType'] })}>
                      <option value="">Select type</option>
                      {nonconformityTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    item.nonconformityType || <span className="table-subtle-cell">Not set</span>
                  )}
                </td>
              ) : null}
              {showNcMetadata ? (
                <td>
                  {onUpdate ? (
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
                    item.processArea || <span className="table-subtle-cell">Not set</span>
                  )}
                </td>
              ) : null}
              {showNcMetadata ? (
                <td>
                  {onUpdate ? (
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
                    item.clause || <span className="table-subtle-cell">Not set</span>
                  )}
                </td>
              ) : null}
              <td>
                {onUpdate ? <input value={item.section} onChange={(event) => onUpdate(item.id, { section: event.target.value })} /> : item.section}
              </td>
              <td>
                {onUpdate ? <textarea value={item.finding} onChange={(event) => onUpdate(item.id, { finding: event.target.value })} rows={3} /> : item.finding}
              </td>
              <td>
                {onUpdate ? (
                  <textarea value={item.action} onChange={(event) => onUpdate(item.id, { action: event.target.value })} rows={3} />
                ) : (
                  item.action
                )}
              </td>
              <td>
                {onUpdate ? <input value={item.owner} onChange={(event) => onUpdate(item.id, { owner: event.target.value })} /> : item.owner}
              </td>
              <td>
                {onUpdate ? (
                  <input type="date" value={item.dueDate} onChange={(event) => onUpdate(item.id, { dueDate: event.target.value })} />
                ) : (
                  <span className="table-subtle-cell">{item.dueDate ? formatDate(item.dueDate) : 'No date'}</span>
                )}
              </td>
              <td>
                {onUpdate ? (
                  <select value={item.status} onChange={(event) => onUpdate(item.id, { status: event.target.value as ActionPlanItem['status'] })}>
                    <option value="Open">Open</option>
                    <option value="In progress">In progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <StatusBadge value={item.status} />
                )}
              </td>
              <td>
                {onUpdate ? (
                  <textarea value={item.comment} onChange={(event) => onUpdate(item.id, { comment: event.target.value })} rows={3} />
                ) : (
                  item.comment
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
