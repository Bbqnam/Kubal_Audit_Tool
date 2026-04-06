import type { ActionPlanItem } from '../types/audit'
import { formatAuditType } from '../utils/auditUtils'
import { AuditTypeBadge, StatusBadge } from './ui'

export default function ActionPlanTable({
  items,
  onUpdate,
}: {
  items: ActionPlanItem[]
  onUpdate?: (
    id: string,
    patch: Partial<Pick<ActionPlanItem, 'section' | 'finding' | 'action' | 'owner' | 'dueDate' | 'status' | 'comment'>>,
  ) => void
}) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Audit</th>
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
            <tr key={item.id}>
              <td><AuditTypeBadge auditType={item.auditType} label={formatAuditType(item.auditType)} size="small" /></td>
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
                  item.dueDate
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
